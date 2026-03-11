// ============================================
// 주문 상태 변경 트리거 - 상태 동기화 및 후처리
// ============================================

import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import {
  sendEmailNotification,
  sendSMSNotification,
} from "../notifications/sendNotification";

const db = admin.firestore();

/**
 * Firestore 트리거: malls/{mallId}/orders/{orderId}
 *
 * - 상태 변경 감지
 * - orders_global 및 users/{userId}/orders 업데이트
 * - 배송완료(delivered): 상품 salesCount 업데이트
 * - 취소/환불(cancelled/refunded): 환불 프로세스 트리거 (placeholder)
 */
export const onOrderStatusChange = onDocumentUpdated(
  "malls/{mallId}/orders/{orderId}",
  async (event) => {
    const mallId = event.params.mallId;
    const orderId = event.params.orderId;

    try {
      const beforeData = event.data?.before?.data();
      const afterData = event.data?.after?.data();

      if (!beforeData || !afterData) {
        logger.error(
          `[주문 상태 변경 오류] 데이터가 없습니다: ${orderId}`
        );
        return;
      }

      const oldStatus = beforeData.status as string;
      const newStatus = afterData.status as string;

      // 상태가 변경되지 않은 경우 무시
      if (oldStatus === newStatus) {
        return;
      }

      logger.info(
        `[주문 상태 변경] orderId: ${orderId}, ${oldStatus} -> ${newStatus}`
      );

      const userId = afterData.userId as string;
      const batch = db.batch();

      // 1. orders_global 업데이트
      const globalOrderRef = db.doc(`orders_global/${orderId}`);
      const globalUpdateData: Record<string, unknown> = {
        status: newStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      // 상태별 타임스탬프 추가
      if (newStatus === "paid") {
        globalUpdateData.paidAt =
          afterData.paidAt || admin.firestore.FieldValue.serverTimestamp();
      } else if (newStatus === "shipped") {
        globalUpdateData.shippedAt =
          afterData.shippedAt || admin.firestore.FieldValue.serverTimestamp();
        globalUpdateData.trackingNumber = afterData.trackingNumber || null;
        globalUpdateData.trackingCompany = afterData.trackingCompany || null;
      } else if (newStatus === "delivered") {
        globalUpdateData.deliveredAt =
          afterData.deliveredAt || admin.firestore.FieldValue.serverTimestamp();
      } else if (newStatus === "cancelled") {
        globalUpdateData.cancelReason = afterData.cancelReason || null;
      } else if (newStatus === "refunded") {
        globalUpdateData.refundAmount = afterData.refundAmount || null;
      }

      batch.update(globalOrderRef, globalUpdateData);

      // 2. users/{userId}/orders 업데이트
      if (userId) {
        const userOrderRef = db.doc(`users/${userId}/orders/${orderId}`);
        batch.update(userOrderRef, {
          status: newStatus,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();

      // 3. 배송완료(delivered): 상품 salesCount + 포인트 자동 적립
      if (newStatus === "delivered") {
        await handleDelivered(mallId, afterData);
        await handlePointEarning(mallId, orderId, afterData);
      }

      // 4. 취소(cancelled): 환불 프로세스 + 포인트/쿠폰 복구
      if (newStatus === "cancelled") {
        await handleCancelled(mallId, orderId, afterData);
        await handleRestorePointsAndCoupons(mallId, orderId, afterData);
      }

      // 5. 환불(refunded): 환불 완료 처리
      if (newStatus === "refunded") {
        await handleRefunded(mallId, orderId, afterData);
      }

      // 6. 사용자에게 상태 변경 알림
      await sendStatusChangeNotification(afterData, oldStatus, newStatus);

      logger.info(
        `[주문 상태 변경 처리 완료] orderId: ${orderId}, status: ${newStatus}`
      );
    } catch (error) {
      logger.error(
        `[주문 상태 변경 처리 오류] mallId: ${mallId}, orderId: ${orderId}`,
        error
      );
      throw error;
    }
  }
);

/**
 * 배송완료 처리: 상품 salesCount 업데이트
 */
async function handleDelivered(
  mallId: string,
  orderData: admin.firestore.DocumentData
): Promise<void> {
  const items = orderData.items as Array<{
    productId: string;
    quantity: number;
  }>;

  if (!items || items.length === 0) {
    return;
  }

  const batch = db.batch();

  for (const item of items) {
    if (!item.productId) continue;

    const productRef = db.doc(
      `malls/${mallId}/products/${item.productId}`
    );
    batch.update(productRef, {
      salesCount: admin.firestore.FieldValue.increment(item.quantity),
    });

    // products_aggregate도 업데이트
    const aggregateRef = db.doc(
      `products_aggregate/${item.productId}`
    );
    batch.update(aggregateRef, {
      salesCount: admin.firestore.FieldValue.increment(item.quantity),
    });
  }

  await batch.commit();
  logger.info(
    `[배송완료 처리] mallId: ${mallId}, 상품 ${items.length}개 salesCount 업데이트 완료`
  );
}

/**
 * 주문 취소 처리 (placeholder)
 */
async function handleCancelled(
  mallId: string,
  orderId: string,
  orderData: admin.firestore.DocumentData
): Promise<void> {
  // TODO: 실제 PG사 결제 취소 API 연동
  // TODO: 재고 복구 처리
  // TODO: 쿠폰/포인트 복구 처리

  logger.info(
    `[주문 취소 처리] mallId: ${mallId}, orderId: ${orderId}, ` +
      `cancelReason: ${orderData.cancelReason || "사유 없음"}`
  );

  logger.info(
    "[주문 취소] PG 결제 취소, 재고 복구, 쿠폰/포인트 복구 등의 처리가 필요합니다."
  );
}

/**
 * 환불 처리 (placeholder)
 */
async function handleRefunded(
  mallId: string,
  orderId: string,
  orderData: admin.firestore.DocumentData
): Promise<void> {
  // TODO: 실제 PG사 환불 API 연동
  // TODO: 정산 데이터에서 환불 금액 차감
  // TODO: 환불 완료 기록 생성

  const refundAmount = orderData.refundAmount || orderData.totalAmount;

  logger.info(
    `[환불 처리] mallId: ${mallId}, orderId: ${orderId}, ` +
      `refundAmount: ${refundAmount}원`
  );

  logger.info(
    "[환불 처리] PG 환불 API 연동, 정산 차감, 환불 기록 생성 등의 처리가 필요합니다."
  );
}

/**
 * 배송완료 시 포인트 자동 적립
 */
async function handlePointEarning(
  mallId: string,
  orderId: string,
  orderData: admin.firestore.DocumentData
): Promise<void> {
  try {
    // 몰의 포인트 설정 조회
    const mallDoc = await db.doc(`malls/${mallId}`).get();
    const mallData = mallDoc.data();
    const pointSettings = mallData?.pointSettings;

    if (!pointSettings || !pointSettings.enabled) {
      return; // 포인트 비활성
    }

    const userId = orderData.userId as string;
    const orderAmount = (orderData.totalAmount as number) || 0;

    // 최소 주문금액 체크
    if (orderAmount < (pointSettings.minOrderAmount || 0)) {
      return;
    }

    const earningRate = pointSettings.earningRate || 1;
    let pointsToEarn = Math.floor(orderAmount * earningRate / 100);

    if (pointsToEarn <= 0) return;

    // 최대 적립 제한
    if (pointSettings.maxEarningPerOrder && pointsToEarn > pointSettings.maxEarningPerOrder) {
      pointsToEarn = pointSettings.maxEarningPerOrder;
    }

    // 만료일 계산
    let expiresAt: admin.firestore.Timestamp | null = null;
    if (pointSettings.expirationDays && pointSettings.expirationDays > 0) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + pointSettings.expirationDays);
      expiresAt = admin.firestore.Timestamp.fromDate(expiry);
    }

    // 트랜잭션으로 포인트 적립
    await db.runTransaction(async (transaction) => {
      const userRef = db.doc(`users/${userId}`);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) return;

      const userData = userDoc.data()!;
      const currentMallBalance = (userData.pointsByMall || {})[mallId] || 0;
      const newMallBalance = currentMallBalance + pointsToEarn;

      // 사용자 잔액 업데이트
      transaction.update(userRef, {
        pointBalance: admin.firestore.FieldValue.increment(pointsToEarn),
        [`pointsByMall.${mallId}`]: admin.firestore.FieldValue.increment(pointsToEarn),
      });

      // 포인트 원장 기록
      const ledgerRef = db.collection("points_ledger").doc();
      transaction.set(ledgerRef, {
        userId,
        mallId,
        orderId,
        type: "earned",
        amount: pointsToEarn,
        balance: newMallBalance,
        description: `주문 완료 적립 (${earningRate}%)`,
        expiresAt,
        createdBy: "system",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 주문에 적립 포인트 기록
      const orderRef = db.doc(`malls/${mallId}/orders/${orderId}`);
      transaction.update(orderRef, { pointsEarned: pointsToEarn });
    });

    logger.info(
      `[포인트 자동 적립] userId: ${userId}, mallId: ${mallId}, ` +
        `orderId: ${orderId}, points: ${pointsToEarn}P`
    );
  } catch (error) {
    logger.error(
      `[포인트 적립 오류] mallId: ${mallId}, orderId: ${orderId}`,
      error
    );
    // 포인트 적립 실패는 주문 처리를 막지 않음
  }
}

/**
 * 주문 취소 시 포인트/쿠폰 복구
 */
async function handleRestorePointsAndCoupons(
  mallId: string,
  orderId: string,
  orderData: admin.firestore.DocumentData
): Promise<void> {
  const userId = orderData.userId as string;

  // 1. 사용된 포인트 복구
  const pointsUsed = (orderData.pointsUsed as number) || 0;
  if (pointsUsed > 0 && userId) {
    try {
      await db.runTransaction(async (transaction) => {
        const userRef = db.doc(`users/${userId}`);

        // 잔액 복구
        transaction.update(userRef, {
          pointBalance: admin.firestore.FieldValue.increment(pointsUsed),
          [`pointsByMall.${mallId}`]: admin.firestore.FieldValue.increment(pointsUsed),
        });

        // 복구 원장 기록
        const ledgerRef = db.collection("points_ledger").doc();
        transaction.set(ledgerRef, {
          userId,
          mallId,
          orderId,
          type: "admin_granted",
          amount: pointsUsed,
          balance: 0, // 실시간 잔액은 트랜잭션 내에서 계산 어려움
          description: `주문 취소 포인트 복구 (주문번호: ${orderData.orderNumber || orderId})`,
          expiresAt: null,
          createdBy: "system",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      logger.info(
        `[포인트 복구] userId: ${userId}, orderId: ${orderId}, points: ${pointsUsed}P`
      );
    } catch (error) {
      logger.error(`[포인트 복구 오류] orderId: ${orderId}`, error);
    }
  }

  // 2. 사용된 쿠폰 복구
  const couponCode = orderData.couponCode as string | null;
  if (couponCode && userId) {
    try {
      // 쿠폰 사용 기록 조회
      const usageQuery = await db
        .collection("coupon_usage")
        .where("orderId", "==", orderId)
        .where("userId", "==", userId)
        .limit(1)
        .get();

      if (!usageQuery.empty) {
        const usageDoc = usageQuery.docs[0];
        const usageData = usageDoc.data();
        const couponId = usageData.couponId as string;

        const batch = db.batch();

        // 사용 기록 삭제
        batch.delete(usageDoc.ref);

        // 쿠폰 사용 횟수 차감
        const couponRef = db.doc(`coupons/${couponId}`);
        batch.update(couponRef, {
          usageCount: admin.firestore.FieldValue.increment(-1),
        });

        // 사용자 쿠폰 상태 복구
        const userCouponRef = db.doc(`users/${userId}/coupons/${couponId}`);
        batch.update(userCouponRef, {
          usedAt: null,
          usedOrderId: null,
        });

        await batch.commit();

        logger.info(
          `[쿠폰 복구] userId: ${userId}, orderId: ${orderId}, couponCode: ${couponCode}`
        );
      }
    } catch (error) {
      logger.error(`[쿠폰 복구 오류] orderId: ${orderId}`, error);
    }
  }

  // 3. 적립된 포인트 회수 (이미 적립됐다면)
  const pointsEarned = (orderData.pointsEarned as number) || 0;
  if (pointsEarned > 0 && userId) {
    try {
      await db.runTransaction(async (transaction) => {
        const userRef = db.doc(`users/${userId}`);

        transaction.update(userRef, {
          pointBalance: admin.firestore.FieldValue.increment(-pointsEarned),
          [`pointsByMall.${mallId}`]: admin.firestore.FieldValue.increment(-pointsEarned),
        });

        const ledgerRef = db.collection("points_ledger").doc();
        transaction.set(ledgerRef, {
          userId,
          mallId,
          orderId,
          type: "admin_deducted",
          amount: -pointsEarned,
          balance: 0,
          description: `주문 취소 적립 포인트 회수`,
          expiresAt: null,
          createdBy: "system",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      logger.info(
        `[적립 포인트 회수] userId: ${userId}, orderId: ${orderId}, points: -${pointsEarned}P`
      );
    } catch (error) {
      logger.error(`[적립 포인트 회수 오류] orderId: ${orderId}`, error);
    }
  }
}

/**
 * 주문 상태 변경 알림 발송
 */
async function sendStatusChangeNotification(
  orderData: admin.firestore.DocumentData,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  const statusMessages: Record<string, string> = {
    paid: "결제가 완료되었습니다.",
    preparing: "상품을 준비중입니다.",
    shipped: `상품이 발송되었습니다.${orderData.trackingNumber ? ` (운송장번호: ${orderData.trackingNumber})` : ""}`,
    delivered: "상품이 배송완료되었습니다. 이용해 주셔서 감사합니다.",
    cancelled: "주문이 취소되었습니다.",
    refunded: `환불이 완료되었습니다. (환불금액: ${(orderData.refundAmount || 0).toLocaleString()}원)`,
  };

  const message = statusMessages[newStatus];
  if (!message) return;

  const userEmail = orderData.userEmail as string;
  const orderNumber = orderData.orderNumber as string;

  if (userEmail) {
    await sendEmailNotification(
      userEmail,
      `[마켓쉐어] 주문 상태 변경 안내 (${orderNumber})`,
      `주문번호 ${orderNumber}의 상태가 변경되었습니다.\n` +
        `${oldStatus} -> ${newStatus}\n\n` +
        message
    );
  }

  // SMS 알림
  const userPhone = orderData.shippingAddress?.phone as string;
  if (userPhone) {
    await sendSMSNotification(
      userPhone,
      `[마켓쉐어] 주문번호 ${orderNumber}: ${message}`
    );
  }
}
