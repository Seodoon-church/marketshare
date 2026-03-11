// ============================================
// 통계 업데이트 스케줄 함수 - 매시간 실행
// ============================================

import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

const db = admin.firestore();

/**
 * 스케줄 함수: 매시간 실행
 *
 * - 몰별 통계 업데이트 (productCount, orderCount, totalRevenue)
 * - 플랫폼 전체 통계 업데이트
 * - platform_config/stats에 저장
 */
export const updateStats = onSchedule(
  {
    schedule: "0 * * * *", // 매시간 정각
    timeZone: "Asia/Seoul",
    retryCount: 2,
  },
  async () => {
    try {
      logger.info("[통계 업데이트] 통계 업데이트 프로세스 시작");

      // 플랫폼 전체 통계 초기값
      let platformTotalMalls = 0;
      let platformActiveMalls = 0;
      let platformTotalProducts = 0;
      let platformTotalOrders = 0;
      let platformTotalRevenue = 0;
      let platformTotalUsers = 0;

      // 1. 전체 사용자 수 조회
      const usersSnapshot = await db.collection("users").count().get();
      platformTotalUsers = usersSnapshot.data().count;

      // 2. 모든 몰 조회
      const mallsSnapshot = await db.collection("malls").get();
      platformTotalMalls = mallsSnapshot.size;

      for (const mallDoc of mallsSnapshot.docs) {
        const mallId = mallDoc.id;
        const mallData = mallDoc.data();

        if (mallData.status === "active") {
          platformActiveMalls++;
        }

        try {
          // 몰별 상품 수 조회
          const productsCount = await db
            .collection(`malls/${mallId}/products`)
            .where("status", "==", "active")
            .count()
            .get();
          const productCount = productsCount.data().count;

          // 몰별 주문 수 및 매출 조회
          const ordersSnapshot = await db
            .collection(`malls/${mallId}/orders`)
            .get();
          const orderCount = ordersSnapshot.size;

          let mallRevenue = 0;
          for (const orderDoc of ordersSnapshot.docs) {
            const orderData = orderDoc.data();
            // delivered 또는 paid 상태인 주문만 매출로 계산
            if (
              orderData.status === "delivered" ||
              orderData.status === "paid" ||
              orderData.status === "shipped" ||
              orderData.status === "preparing"
            ) {
              mallRevenue += (orderData.totalAmount as number) || 0;
            }
          }

          // 몰 문서 업데이트
          await mallDoc.ref.update({
            productCount: productCount,
            orderCount: orderCount,
            totalRevenue: mallRevenue,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          // 플랫폼 통계 누적
          platformTotalProducts += productCount;
          platformTotalOrders += orderCount;
          platformTotalRevenue += mallRevenue;

          logger.info(
            `[통계 업데이트] ${mallData.name}(${mallId}): ` +
              `상품 ${productCount}개, 주문 ${orderCount}건, 매출 ${mallRevenue.toLocaleString()}원`
          );
        } catch (mallError) {
          logger.error(
            `[통계 업데이트 오류] 몰 ${mallId} 통계 처리 실패`,
            mallError
          );
          // 개별 몰 오류는 무시하고 계속 진행
        }
      }

      // 3. 플랫폼 전체 통계 저장
      await db.doc("platform_config/stats").set(
        {
          totalMalls: platformTotalMalls,
          activeMalls: platformActiveMalls,
          totalProducts: platformTotalProducts,
          totalOrders: platformTotalOrders,
          totalRevenue: platformTotalRevenue,
          totalUsers: platformTotalUsers,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      logger.info(
        `[통계 업데이트 완료] ` +
          `전체몰: ${platformTotalMalls}개, ` +
          `활성몰: ${platformActiveMalls}개, ` +
          `전체상품: ${platformTotalProducts}개, ` +
          `전체주문: ${platformTotalOrders}건, ` +
          `전체매출: ${platformTotalRevenue.toLocaleString()}원, ` +
          `전체사용자: ${platformTotalUsers}명`
      );
    } catch (error) {
      logger.error("[통계 업데이트 오류]", error);
      throw error;
    }
  }
);
