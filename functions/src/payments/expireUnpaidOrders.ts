// ============================================
// 미결제 주문 만료 처리 - 15분마다 실행
// ============================================

import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

const db = admin.firestore();

/**
 * 스케줄 함수: 15분마다 실행
 *
 * - status='awaiting_payment'인 주문 중 30분 이상 경과된 주문을 찾아 취소
 * - 재고 복구 처리
 * - 사용된 포인트/쿠폰 복구
 * - orders_global 및 users/{userId}/orders 상태 동기화
 */
export const expireUnpaidOrders = onSchedule(
  {
    schedule: "every 15 minutes",
    timeZone: "Asia/Seoul",
    retryCount: 2,
  },
  async () => {
    try {
      logger.info("[미결제 주문 만료] 처리 시작");

      // 30분 전 시간 계산
      const cutoffTime = new Date();
      cutoffTime.setMinutes(cutoffTime.getMinutes() - 30);
      const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffTime);

      // awaiting_payment 상태이면서 30분 이상 경과된 주문 조회 (글로벌 컬렉션)
      const expiredOrdersSnapshot = await db
        .collection("orders_global")
        .where("status", "==", "awaiting_payment")
        .where("createdAt", "<=", cutoffTimestamp)
        .get();

      if (expiredOrdersSnapshot.empty) {
        logger.info("[미결제 주문 만료] 만료 대상 주문 없음");
        return;
      }

      logger.info(
        `[미결제 주문 만료] 만료 대상 주문 ${expiredOrdersSnapshot.size}건 발견`
      );

      let successCount = 0;
      let errorCount = 0;

      for (const globalOrderDoc of expiredOrdersSnapshot.docs) {
        const globalData = globalOrderDoc.data();
        const orderId = globalOrderDoc.id;
        const mallId = globalData.mallId as string;
        const userId = globalData.userId as string;

        try {
          await expireSingleOrder(orderId, mallId, userId);
          successCount++;
        } catch (error) {
          errorCount++;
          logger.error(
            `[미결제 주문 만료 오류] orderId: ${orderId}`,
            error
          );
        }
      }

      logger.info(
        `[미결제 주문 만료 완료] 성공: ${successCount}건, 실패: ${errorCount}건`
      );
    } catch (error) {
      logger.error("[미결제 주문 만료 처리 오류]", error);
      throw error;
    }
  }
);

/**
 * 개별 주문 만료 처리
 *
 * 트랜잭션을 사용하여 재고 복구, 포인트/쿠폰 복구, 상태 업데이트를 원자적으로 처리
 */
async function expireSingleOrder(
  orderId: string,
  mallId: string,
  userId: string
): Promise<void> {
  await db.runTransaction(async (transaction) => {
    // 원본 주문 문서 조회
    const mallOrderRef = db.doc(`malls/${mallId}/orders/${orderId}`);
    const mallOrderDoc = await transaction.get(mallOrderRef);

    if (!mallOrderDoc.exists) {
      logger.warn(
        `[미결제 주문 만료] 원본 주문 문서 없음: malls/${mallId}/orders/${orderId}`
      );
      return;
    }

    const orderData = mallOrderDoc.data()!;

    // 이미 다른 상태로 변경된 경우 무시
    if (orderData.status !== "awaiting_payment") {
      logger.info(
        `[미결제 주문 만료] 이미 상태 변경됨: orderId=${orderId}, status=${orderData.status}`
      );
      return;
    }

    const serverTimestamp = admin.firestore.FieldValue.serverTimestamp();

    // ---- 1. 재고 복구 ----
    const items = (orderData.items || []) as Array<{
      productId: string;
      quantity: number;
      options: Record<string, string>;
    }>;

    for (const item of items) {
      const productRef = db.doc(`malls/${mallId}/products/${item.productId}`);
      const productDoc = await transaction.get(productRef);

      if (!productDoc.exists) {
        logger.warn(
          `[미결제 주문 만료] 상품 문서 없음: ${item.productId}, 재고 복구 건너뜀`
        );
        continue;
      }

      if (item.options && Object.keys(item.options).length > 0) {
        // variant 재고 복구
        const productData = productDoc.data()!;
        const variants = (productData.variants || []) as Array<{
          sku: string;
          options: Record<string, string>;
          price: number;
          stock: number;
        }>;

        const updatedVariants = variants.map((v) => {
          const isMatch = Object.entries(item.options).every(
            ([key, val]) => v.options[key] === val
          );
          if (isMatch) {
            return { ...v, stock: v.stock + item.quantity };
          }
          return v;
        });

        transaction.update(productRef, { variants: updatedVariants });
      } else {
        // 일반 재고 복구
        transaction.update(productRef, {
          stock: admin.firestore.FieldValue.increment(item.quantity),
        });
      }
    }

    // ---- 2. 포인트 복구 ----
    const pointsUsed = (orderData.pointsUsed as number) || 0;
    if (pointsUsed > 0 && userId) {
      const userRef = db.doc(`users/${userId}`);

      transaction.update(userRef, {
        pointBalance: admin.firestore.FieldValue.increment(pointsUsed),
        [`pointsByMall.${mallId}`]:
          admin.firestore.FieldValue.increment(pointsUsed),
      });

      // 포인트 복구 원장 기록
      const ledgerRef = db.collection("points_ledger").doc();
      transaction.set(ledgerRef, {
        userId,
        mallId,
        orderId,
        type: "admin_granted",
        amount: pointsUsed,
        balance: 0,
        description: `미결제 주문 만료 포인트 복구 (주문번호: ${orderData.orderNumber || orderId})`,
        expiresAt: null,
        createdBy: "system",
        createdAt: serverTimestamp,
      });
    }

    // ---- 3. 쿠폰 복구 ----
    const couponCode = orderData.couponCode as string | null;
    if (couponCode) {
      // 쿠폰 사용 기록 조회 (트랜잭션 밖에서 조회 후 처리)
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

        // 쿠폰 사용 기록 삭제
        transaction.delete(usageDoc.ref);

        // 쿠폰 사용 횟수 차감
        const couponRef = db.doc(`coupons/${couponId}`);
        transaction.update(couponRef, {
          usageCount: admin.firestore.FieldValue.increment(-1),
        });

        // 사용자 쿠폰 상태 복구
        const userCouponRef = db.doc(`users/${userId}/coupons/${couponId}`);
        transaction.update(userCouponRef, {
          usedAt: null,
          usedOrderId: null,
        });
      }
    }

    // ---- 4. 주문 상태 업데이트 ----
    // malls/{mallId}/orders/{orderId}
    transaction.update(mallOrderRef, {
      status: "cancelled",
      cancelReason: "결제 시간 초과 (30분)",
      updatedAt: serverTimestamp,
    });

    // orders_global/{orderId}
    const globalOrderRef = db.doc(`orders_global/${orderId}`);
    transaction.update(globalOrderRef, {
      status: "cancelled",
      updatedAt: serverTimestamp,
    });

    // users/{userId}/orders/{orderId}
    if (userId) {
      const userOrderRef = db.doc(`users/${userId}/orders/${orderId}`);
      transaction.update(userOrderRef, {
        status: "cancelled",
        updatedAt: serverTimestamp,
      });
    }
  });

  logger.info(
    `[미결제 주문 만료] 주문 만료 처리 완료: orderId=${orderId}, mallId=${mallId}`
  );
}
