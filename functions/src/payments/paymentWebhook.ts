// ============================================
// 결제 웹훅 Cloud Function (PortOne 서버→서버)
// 결제 상태 변경 시 주문 업데이트 + 포인트/쿠폰 처리
// ============================================

import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

const db = admin.firestore();

async function getPortOneAccessToken(): Promise<string> {
  const apiKey = process.env.PORTONE_API_KEY;
  const apiSecret = process.env.PORTONE_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("PortOne API 키가 설정되지 않았습니다.");
  }

  const response = await fetch("https://api.iamport.kr/users/getToken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imp_key: apiKey, imp_secret: apiSecret }),
  });

  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`PortOne 인증 실패: ${data.message}`);
  }

  return data.response.access_token;
}

/**
 * merchantUid로 주문을 조회합니다 (orders_global에서).
 */
async function findOrderByMerchantUid(merchantUid: string) {
  const snap = await db
    .collection("orders_global")
    .where("merchantUid", "==", merchantUid)
    .limit(1)
    .get();

  if (snap.empty) return null;
  return { ref: snap.docs[0].ref, data: snap.docs[0].data(), id: snap.docs[0].id };
}

/**
 * 주문 상태를 3개 위치에 업데이트합니다.
 */
async function updateOrderAllLocations(
  orderId: string,
  orderData: admin.firestore.DocumentData,
  updateData: Record<string, any>
) {
  const batch = db.batch();

  batch.update(db.collection("orders_global").doc(orderId), updateData);

  if (orderData.mallId) {
    batch.update(
      db.collection("malls").doc(orderData.mallId).collection("orders").doc(orderId),
      updateData
    );
  }

  if (orderData.userId) {
    batch.update(
      db.collection("users").doc(orderData.userId).collection("orders").doc(orderId),
      updateData
    );
  }

  await batch.commit();
}

/**
 * 결제 완료 시 포인트 차감 + 쿠폰 사용 처리 (서버사이드)
 */
async function processPostPayment(orderId: string, orderData: admin.firestore.DocumentData) {
  const batch = db.batch();

  // 포인트 차감
  if (orderData.pointsUsed > 0) {
    try {
      const ledgerRef = db.collection("points_ledger").doc();
      batch.set(ledgerRef, {
        userId: orderData.userId,
        mallId: orderData.mallId,
        orderId,
        type: "used",
        amount: -orderData.pointsUsed,
        balance: 0, // 실잔액은 user doc에서 관리
        description: `주문 ${orderData.orderNumber || orderId} 포인트 사용`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      const userRef = db.collection("users").doc(orderData.userId);
      batch.update(userRef, {
        pointBalance: admin.firestore.FieldValue.increment(-orderData.pointsUsed),
      });
    } catch (err) {
      logger.error(`[웹훅] 포인트 차감 실패 - orderId: ${orderId}`, err);
    }
  }

  // 쿠폰 사용 처리
  if (orderData.couponCode) {
    try {
      const couponSnap = await db
        .collection("coupons")
        .where("code", "==", orderData.couponCode)
        .limit(1)
        .get();

      if (!couponSnap.empty) {
        const couponDoc = couponSnap.docs[0];
        batch.update(couponDoc.ref, {
          usageCount: admin.firestore.FieldValue.increment(1),
        });

        const usageRef = db.collection("coupon_usage").doc();
        batch.set(usageRef, {
          couponId: couponDoc.id,
          userId: orderData.userId,
          orderId,
          mallId: orderData.mallId,
          discountAmount: orderData.couponDiscount || 0,
          usedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    } catch (err) {
      logger.error(`[웹훅] 쿠폰 처리 실패 - orderId: ${orderId}`, err);
    }
  }

  try {
    await batch.commit();
  } catch (err) {
    logger.error(`[웹훅] 결제 후 처리 batch 실패 - orderId: ${orderId}`, err);
  }
}

export const paymentWebhook = onRequest(
  { maxInstances: 20, timeoutSeconds: 30 },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ success: false, message: "Method not allowed" });
      return;
    }

    try {
      const { imp_uid, merchant_uid } = req.body;

      if (!imp_uid || !merchant_uid) {
        res.status(400).json({ success: false, message: "필수 파라미터 누락" });
        return;
      }

      // PortOne에서 실제 결제 정보 조회
      const accessToken = await getPortOneAccessToken();
      const paymentResponse = await fetch(
        `https://api.iamport.kr/payments/${encodeURIComponent(imp_uid)}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const paymentData = await paymentResponse.json();
      if (paymentData.code !== 0) {
        logger.error("[웹훅] 결제 정보 조회 실패:", paymentData.message);
        res.status(400).json({ success: false, message: "결제 정보 조회 실패" });
        return;
      }

      const payment = paymentData.response;

      // merchantUid로 주문 조회
      const order = await findOrderByMerchantUid(merchant_uid);
      if (!order) {
        logger.warn(`[웹훅] 주문 미발견 - merchant_uid: ${merchant_uid}`);
        res.status(200).json({ success: true, message: "Order not found, acknowledged" });
        return;
      }

      switch (payment.status) {
        case "paid": {
          // 금액 검증
          if (payment.amount !== order.data.totalAmount) {
            logger.error(
              `[웹훅] 금액 불일치 - 예상: ${order.data.totalAmount}, 실제: ${payment.amount}`
            );
            break;
          }

          const updateData = {
            status: "paid",
            paidAt: new Date(),
            updatedAt: new Date(),
            paymentInfo: {
              pgProvider: payment.pg_provider,
              pgTid: payment.pg_tid || "",
              impUid: imp_uid,
              merchantUid: merchant_uid,
              paidAt: new Date(payment.paid_at * 1000),
              receiptUrl: payment.receipt_url || "",
            },
          };

          await updateOrderAllLocations(order.id, order.data, updateData);
          await processPostPayment(order.id, order.data);

          logger.info(`[웹훅] 결제 완료 - orderId: ${order.id}, amount: ${payment.amount}`);
          break;
        }

        case "cancelled": {
          const updateData = {
            status: "refunded",
            refundAmount: payment.cancel_amount,
            updatedAt: new Date(),
          };
          await updateOrderAllLocations(order.id, order.data, updateData);
          logger.info(`[웹훅] 결제 취소 - orderId: ${order.id}`);
          break;
        }

        case "failed": {
          const updateData = {
            status: "cancelled",
            cancelReason: "Payment failed",
            updatedAt: new Date(),
          };
          await updateOrderAllLocations(order.id, order.data, updateData);
          logger.info(`[웹훅] 결제 실패 - orderId: ${order.id}`);
          break;
        }

        case "ready": {
          logger.info(
            `[웹훅] 가상계좌 발급 - merchant_uid: ${merchant_uid}, imp_uid: ${imp_uid}`
          );
          break;
        }

        default: {
          logger.warn(`[웹훅] 알 수 없는 상태: ${payment.status}`);
        }
      }

      res.status(200).json({ success: true, message: "Webhook processed", status: payment.status });
    } catch (error) {
      logger.error("[웹훅] 처리 오류:", error);
      res.status(200).json({ success: false, message: "Error, acknowledged" });
    }
  }
);
