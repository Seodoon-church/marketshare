// ============================================
// 포인트 만료 스케줄 함수 - 매일 03:00 KST 실행
// ============================================

import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

const db = admin.firestore();

/**
 * 스케줄 함수: 매일 03:00 KST (18:00 UTC 전일)
 *
 * - 만료 기한이 지난 적립 포인트 조회
 * - 만료된 포인트에 대해 차감 레저 엔트리 생성
 * - 사용자의 포인트 잔액(pointBalance) 및 몰별 포인트(pointsByMall) 업데이트
 *
 * 처리 로직:
 * 1. points_ledger에서 type == 'earned', expiresAt <= 현재시각, expiresAt != null 인 항목 조회
 * 2. 각 만료 포인트에 대해 'expired' 타입 레저 엔트리를 음수 금액으로 생성
 * 3. 해당 사용자의 pointBalance와 pointsByMall.{mallId}를 차감
 * 4. 원본 레저 엔트리에 isExpired = true 표시
 */
export const expirePoints = onSchedule(
  {
    schedule: "0 18 * * *", // UTC 18:00 = KST 03:00
    timeZone: "Asia/Seoul",
    retryCount: 3,
  },
  async () => {
    try {
      logger.info("[포인트 만료] 포인트 만료 프로세스 시작");

      const now = admin.firestore.Timestamp.now();

      // 1. 만료 대상 포인트 조회: 적립(earned) 타입이며 만료일이 지난 항목
      const expiredPointsSnapshot = await db
        .collection("points_ledger")
        .where("type", "==", "earned")
        .where("expiresAt", "<=", now)
        .where("isExpired", "==", false)
        .get();

      if (expiredPointsSnapshot.empty) {
        logger.info("[포인트 만료] 만료 대상 포인트가 없습니다.");
        return;
      }

      logger.info(
        `[포인트 만료] 만료 대상 포인트 ${expiredPointsSnapshot.size}건 발견`
      );

      let totalExpiredCount = 0;
      let totalExpiredAmount = 0;

      // Firestore 배치 쓰기는 최대 500건이므로 분할 처리
      const batchSize = 500;
      let batch = db.batch();
      let batchCount = 0;

      // 2. 각 만료 포인트에 대해 처리
      for (const pointDoc of expiredPointsSnapshot.docs) {
        const pointData = pointDoc.data();
        const amount = (pointData.amount as number) || 0;
        const userId = pointData.userId as string;
        const mallId = pointData.mallId as string;

        if (amount <= 0) {
          continue;
        }

        // 2-1. 만료 레저 엔트리 생성 (음수 금액)
        const expiredEntryRef = db.collection("points_ledger").doc();
        batch.set(expiredEntryRef, {
          id: expiredEntryRef.id,
          userId: userId,
          mallId: mallId,
          type: "expired",
          amount: -amount,
          description: "포인트 유효기간 만료",
          relatedLedgerId: pointDoc.id,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 2-2. 원본 레저 엔트리에 만료 표시
        batch.update(pointDoc.ref, {
          isExpired: true,
          expiredAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // 2-3. 사용자 포인트 잔액 차감
        const userRef = db.doc(`users/${userId}`);
        batch.update(userRef, {
          pointBalance: admin.firestore.FieldValue.increment(-amount),
          [`pointsByMall.${mallId}`]: admin.firestore.FieldValue.increment(-amount),
        });

        totalExpiredCount++;
        totalExpiredAmount += amount;
        batchCount += 3; // set + update + update = 3개 연산

        // 배치 500건 제한 도달 시 커밋 후 새 배치 생성
        if (batchCount >= batchSize - 3) {
          await batch.commit();
          batch = db.batch();
          batchCount = 0;
          logger.info(
            `[포인트 만료] 배치 커밋 완료 (누적 ${totalExpiredCount}건)`
          );
        }
      }

      // 남은 배치 커밋
      if (batchCount > 0) {
        await batch.commit();
      }

      logger.info(
        `[포인트 만료 완료] 총 ${totalExpiredCount}건, ` +
          `${totalExpiredAmount.toLocaleString()}포인트 만료 처리됨`
      );
    } catch (error) {
      logger.error("[포인트 만료 오류]", error);
      throw error;
    }
  }
);
