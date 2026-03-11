// ============================================
// 일일 정산 스케줄 함수 - 매일 02:00 KST 실행
// ============================================

import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

const db = admin.firestore();

/**
 * 스케줄 함수: 매일 02:00 KST (17:00 UTC 전일)
 *
 * - 전일 배송완료(delivered) 주문 기준으로 몰별 매출 계산
 * - settlements/ 컬렉션에 정산 레코드 생성
 *
 * 정산 계산 로직:
 * 1. 전일 00:00 ~ 23:59:59 사이에 delivered 상태가 된 주문 조회
 * 2. 몰별로 그룹화하여 매출, 수수료, 정산금액 계산
 * 3. 각 몰의 수수료율(commissionRate)에 따라 수수료 차감
 * 4. 레퍼럴 수수료가 있는 경우 추가 차감
 * 5. PG 수수료 계산 (결제수단별 상이)
 * 6. 최종 정산금액 = 총매출 - 플랫폼수수료 - 레퍼럴수수료 - PG수수료
 */

// PG 수수료율 (결제수단별, %)
const PG_FEE_RATES: Record<string, number> = {
  card: 3.3,
  kakaopay: 3.3,
  naverpay: 3.3,
  bank_transfer: 1.5,
  virtual_account: 1.5,
  phone: 5.0,
};
const DEFAULT_PG_FEE_RATE = 3.3;
export const dailySettlement = onSchedule(
  {
    schedule: "0 17 * * *", // UTC 17:00 = KST 02:00
    timeZone: "Asia/Seoul",
    retryCount: 3,
  },
  async () => {
    try {
      logger.info("[일일 정산] 정산 프로세스 시작");

      // 정산 대상 기간: 전일 00:00:00 ~ 23:59:59 (KST)
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      const startOfDay = new Date(yesterday);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(yesterday);
      endOfDay.setHours(23, 59, 59, 999);

      logger.info(
        `[일일 정산] 대상 기간: ${startOfDay.toISOString()} ~ ${endOfDay.toISOString()}`
      );

      // 1. 모든 활성 몰 조회
      const mallsSnapshot = await db
        .collection("malls")
        .where("status", "==", "active")
        .get();

      if (mallsSnapshot.empty) {
        logger.info("[일일 정산] 활성 몰이 없습니다.");
        return;
      }

      let totalSettlementCount = 0;

      // 2. 몰별로 정산 처리
      for (const mallDoc of mallsSnapshot.docs) {
        const mallData = mallDoc.data();
        const mallId = mallDoc.id;
        const mallName = mallData.name as string;
        const commissionRate = (mallData.commissionRate as number) || 0;
        const referralCommissionRate =
          (mallData.referralCommissionRate as number) || 0;

        // 중복 정산 방지: 이미 해당 일자의 정산이 존재하면 스킵
        const settlementId = `${mallId}_${yesterday.toISOString().split("T")[0]}`;
        const settlementRef = db.doc(`settlements/${settlementId}`);
        const existingSettlement = await settlementRef.get();
        if (existingSettlement.exists) {
          logger.warn(`Settlement ${settlementId} already exists, skipping mall ${mallId}`);
          continue;
        }

        // 해당 몰의 전일 delivered 주문 조회
        const ordersSnapshot = await db
          .collection(`malls/${mallId}/orders`)
          .where("status", "==", "delivered")
          .where("deliveredAt", ">=", admin.firestore.Timestamp.fromDate(startOfDay))
          .where("deliveredAt", "<=", admin.firestore.Timestamp.fromDate(endOfDay))
          .get();

        // 환불된 주문 제외 (compound query 인덱스 충돌 방지를 위해 fetch 후 필터링)
        const validOrders = ordersSnapshot.docs.filter((doc) => {
          const data = doc.data();
          return data.status !== "refunded" && data.isRefunded !== true;
        });

        if (validOrders.length === 0) {
          logger.info(
            `[일일 정산] ${mallName}(${mallId}): 정산 대상 주문 없음`
          );
          continue;
        }

        // 3. 정산 금액 계산
        let totalSales = 0;
        let totalCommission = 0;
        let totalReferralCommission = 0;
        let totalPgFees = 0;
        const orderIds: string[] = [];
        const orderCommissionUpdates: Array<{
          ref: admin.firestore.DocumentReference;
          commission: number;
          referralCommission: number;
          pgFee: number;
        }> = [];

        for (const orderDoc of validOrders) {
          const orderData = orderDoc.data();
          const orderAmount = (orderData.totalAmount as number) || 0;

          totalSales += orderAmount;
          orderIds.push(orderDoc.id);

          // 수수료 계산
          // 실제 구현에서는 주문별로 이미 계산된 commission 값을 사용
          const orderCommission =
            orderData.commission ||
            Math.round(orderAmount * (commissionRate / 100));
          const orderReferralCommission =
            orderData.referralCommission ||
            Math.round(orderAmount * (referralCommissionRate / 100));

          // PG 수수료 계산 (결제수단별)
          const paymentMethod = (orderData.paymentMethod as string) || "";
          const pgFeeRate = PG_FEE_RATES[paymentMethod] ?? DEFAULT_PG_FEE_RATE;
          const orderPgFee = Math.round(orderAmount * (pgFeeRate / 100));

          totalCommission += orderCommission;
          totalReferralCommission += orderReferralCommission;
          totalPgFees += orderPgFee;

          // 주문에 수수료가 기록되지 않은 경우, 나중에 일괄 업데이트할 목록에 추가
          if (orderData.commission === undefined) {
            orderCommissionUpdates.push({
              ref: orderDoc.ref,
              commission: orderCommission,
              referralCommission: orderReferralCommission,
              pgFee: orderPgFee,
            });
          }
        }

        const totalSettlement =
          totalSales - totalCommission - totalReferralCommission - totalPgFees;

        // 4. 정산 레코드 생성
        await settlementRef.set({
          id: settlementId,
          mallId: mallId,
          mallName: mallName,
          period: {
            startDate: admin.firestore.Timestamp.fromDate(startOfDay),
            endDate: admin.firestore.Timestamp.fromDate(endOfDay),
          },
          totalSales: totalSales,
          totalCommission: totalCommission,
          totalReferralCommission: totalReferralCommission,
          totalPgFees: totalPgFees,
          totalSettlement: totalSettlement,
          orderCount: validOrders.length,
          orderIds: orderIds,
          status: "pending",
          bankInfo: mallData.bankInfo || null,
          processedAt: null,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 5. 주문에 정산 처리됨 표시 + 미기록 수수료 저장
        const batch = db.batch();
        for (const orderDoc of validOrders) {
          batch.update(orderDoc.ref, {
            isSettled: true,
            settlementId: settlementId,
          });
        }
        // 수수료가 기록되지 않았던 주문에 수수료 값을 불변 기록
        for (const update of orderCommissionUpdates) {
          batch.update(update.ref, {
            commission: update.commission,
            referralCommission: update.referralCommission,
            pgFee: update.pgFee,
          });
        }
        await batch.commit();

        totalSettlementCount++;

        logger.info(
          `[일일 정산] ${mallName}(${mallId}): ` +
            `매출 ${totalSales.toLocaleString()}원, ` +
            `수수료 ${totalCommission.toLocaleString()}원, ` +
            `레퍼럴수수료 ${totalReferralCommission.toLocaleString()}원, ` +
            `PG수수료 ${totalPgFees.toLocaleString()}원, ` +
            `정산액 ${totalSettlement.toLocaleString()}원, ` +
            `주문 ${validOrders.length}건`
        );
      }

      logger.info(
        `[일일 정산 완료] 총 ${totalSettlementCount}개 몰 정산 처리됨`
      );
    } catch (error) {
      logger.error("[일일 정산 오류]", error);
      throw error;
    }
  }
);
