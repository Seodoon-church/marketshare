// ============================================
// 쿠폰 만료 스케줄 함수 - 매일 01:00 KST 실행
// ============================================

import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

const db = admin.firestore();

/**
 * 스케줄 함수: 매일 01:00 KST (16:00 UTC 전일)
 *
 * - 종료일(endDate)이 지난 활성 쿠폰을 비활성화
 * - 배치 쓰기로 효율적으로 처리
 *
 * 처리 로직:
 * 1. coupons 컬렉션에서 isActive == true이고 endDate < 현재시각인 쿠폰 조회
 * 2. 각 만료 쿠폰의 isActive를 false로 업데이트
 * 3. 처리 건수 로깅
 */
export const expireCoupons = onSchedule(
  {
    schedule: "0 16 * * *", // UTC 16:00 = KST 01:00
    timeZone: "Asia/Seoul",
    retryCount: 3,
  },
  async () => {
    try {
      logger.info("[쿠폰 만료] 쿠폰 만료 프로세스 시작");

      const now = admin.firestore.Timestamp.now();

      // 1. 만료 대상 쿠폰 조회: 활성 상태이면서 종료일이 지난 쿠폰
      const expiredCouponsSnapshot = await db
        .collection("coupons")
        .where("isActive", "==", true)
        .where("endDate", "<", now)
        .get();

      if (expiredCouponsSnapshot.empty) {
        logger.info("[쿠폰 만료] 만료 대상 쿠폰이 없습니다.");
        return;
      }

      logger.info(
        `[쿠폰 만료] 만료 대상 쿠폰 ${expiredCouponsSnapshot.size}건 발견`
      );

      // 2. 배치 쓰기로 쿠폰 비활성화 처리
      const batchSize = 500;
      let batch = db.batch();
      let batchCount = 0;
      let totalExpiredCount = 0;

      for (const couponDoc of expiredCouponsSnapshot.docs) {
        batch.update(couponDoc.ref, {
          isActive: false,
          deactivatedReason: "유효기간 만료",
          deactivatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        batchCount++;
        totalExpiredCount++;

        // 배치 500건 제한 도달 시 커밋 후 새 배치 생성
        if (batchCount >= batchSize) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
          logger.info(
            `[쿠폰 만료] 배치 커밋 완료 (누적 ${totalExpiredCount}건)`
          );
        }
      }

      // 남은 배치 커밋
      if (batchCount > 0) {
        await batch.commit();
      }

      logger.info(
        `[쿠폰 만료 완료] 총 ${totalExpiredCount}건 쿠폰 만료 처리됨`
      );
    } catch (error) {
      logger.error("[쿠폰 만료 오류]", error);
      throw error;
    }
  }
);
