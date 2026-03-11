// ============================================
// 회원등급 평가 스케줄 함수 - 매일 04:00 KST 실행
// ============================================

import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

const db = admin.firestore();

/**
 * 스케줄 함수: 매일 04:00 KST (19:00 UTC 전일)
 *
 * - 활성 몰별 회원등급 기준(member_grades)을 조회
 * - 각 사용자의 구매 실적을 기반으로 등급 재산정
 * - 등급이 변경된 경우 사용자 문서 업데이트
 *
 * 처리 로직:
 * 1. 활성 몰 목록 조회
 * 2. 각 몰의 member_grades 서브컬렉션 조회 (minPurchaseAmount 내림차순 정렬)
 * 3. 해당 몰에서 배송완료(delivered) 상태인 주문의 사용자별 구매액 합산
 * 4. 등급 기준(minPurchaseAmount)과 비교하여 해당 등급 판정
 * 5. 기존 등급과 다르면 gradeByMall.{mallId} 업데이트
 */
export const evaluateGrades = onSchedule(
  {
    schedule: "0 19 * * *", // UTC 19:00 = KST 04:00
    timeZone: "Asia/Seoul",
    retryCount: 3,
  },
  async () => {
    try {
      logger.info("[등급 평가] 회원등급 평가 프로세스 시작");

      // 1. 모든 활성 몰 조회
      const mallsSnapshot = await db
        .collection("malls")
        .where("status", "==", "active")
        .get();

      if (mallsSnapshot.empty) {
        logger.info("[등급 평가] 활성 몰이 없습니다.");
        return;
      }

      let totalGradeChanges = 0;

      // 2. 몰별로 등급 평가 처리
      for (const mallDoc of mallsSnapshot.docs) {
        const mallId = mallDoc.id;
        const mallData = mallDoc.data();
        const mallName = mallData.name as string;

        try {
          // 2-1. 해당 몰의 회원등급 기준 조회 (높은 등급부터 = 최소구매액 내림차순)
          const gradesSnapshot = await db
            .collection(`malls/${mallId}/member_grades`)
            .orderBy("minPurchaseAmount", "desc")
            .get();

          if (gradesSnapshot.empty) {
            logger.info(
              `[등급 평가] ${mallName}(${mallId}): 등급 기준이 설정되지 않음`
            );
            continue;
          }

          const grades = gradesSnapshot.docs.map((doc) => ({
            id: doc.id,
            name: doc.data().name as string,
            minPurchaseAmount: (doc.data().minPurchaseAmount as number) || 0,
            evaluationPeriodDays: (doc.data().evaluationPeriodDays as number) || 90,
          }));

          // 기본 등급 (가장 낮은 minPurchaseAmount를 가진 등급)
          const defaultGrade = grades[grades.length - 1];

          // 2-2. 해당 몰의 배송완료 주문 조회 (평가 기간 내)
          // 가장 긴 평가 기간 기준으로 조회 (모든 등급의 기간을 커버)
          const maxPeriodDays = Math.max(
            ...grades.map((g) => g.evaluationPeriodDays)
          );
          const periodStart = new Date();
          periodStart.setDate(periodStart.getDate() - maxPeriodDays);

          const ordersSnapshot = await db
            .collection(`malls/${mallId}/orders`)
            .where("status", "==", "delivered")
            .where(
              "deliveredAt",
              ">=",
              admin.firestore.Timestamp.fromDate(periodStart)
            )
            .get();

          // 2-3. 사용자별 구매액 합산 (등급별 평가 기간 고려)
          // 먼저 전체 주문 데이터를 수집
          const ordersByUser: Map<
            string,
            Array<{ totalAmount: number; deliveredAt: admin.firestore.Timestamp }>
          > = new Map();

          for (const orderDoc of ordersSnapshot.docs) {
            const orderData = orderDoc.data();
            const userId = orderData.userId as string;
            const totalAmount = (orderData.totalAmount as number) || 0;
            const deliveredAt = orderData.deliveredAt as admin.firestore.Timestamp;

            if (!userId || !deliveredAt) continue;

            if (!ordersByUser.has(userId)) {
              ordersByUser.set(userId, []);
            }
            ordersByUser.get(userId)!.push({ totalAmount, deliveredAt });
          }

          if (ordersByUser.size === 0) {
            logger.info(
              `[등급 평가] ${mallName}(${mallId}): 평가 기간 내 구매 이력 없음`
            );
            continue;
          }

          // 2-4. 사용자별 등급 판정 및 업데이트
          const batch = db.batch();
          let batchCount = 0;
          let mallGradeChanges = 0;

          for (const [userId, orders] of ordersByUser) {
            // 각 등급의 평가 기간에 맞는 구매액 계산 및 등급 판정
            let assignedGrade = defaultGrade;

            for (const grade of grades) {
              // 해당 등급의 평가 기간 기준일 계산
              const gradeStart = new Date();
              gradeStart.setDate(
                gradeStart.getDate() - grade.evaluationPeriodDays
              );
              const gradeStartTimestamp =
                admin.firestore.Timestamp.fromDate(gradeStart);

              // 평가 기간 내 구매액 합산
              const periodTotal = orders
                .filter((o) => o.deliveredAt >= gradeStartTimestamp)
                .reduce((sum, o) => sum + o.totalAmount, 0);

              // 최소 구매액 충족 시 해당 등급 부여 (높은 등급부터 확인하므로 첫 매칭이 최고등급)
              if (periodTotal >= grade.minPurchaseAmount) {
                assignedGrade = grade;
                break;
              }
            }

            // 기존 등급과 비교하여 변경된 경우에만 업데이트
            const userRef = db.doc(`users/${userId}`);
            const userDoc = await userRef.get();

            if (!userDoc.exists) continue;

            const userData = userDoc.data();
            const currentGradeId =
              userData?.gradeByMall?.[mallId] || defaultGrade.id;

            if (currentGradeId !== assignedGrade.id) {
              batch.update(userRef, {
                [`gradeByMall.${mallId}`]: assignedGrade.id,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              });
              batchCount++;
              mallGradeChanges++;

              logger.info(
                `[등급 평가] ${mallName}(${mallId}): 사용자 ${userId} ` +
                  `등급 변경 ${currentGradeId} → ${assignedGrade.id}(${assignedGrade.name})`
              );

              // 배치 500건 제한 도달 시 커밋 후 새 배치 시작
              if (batchCount >= 499) {
                await batch.commit();
                batchCount = 0;
                logger.info(
                  `[등급 평가] ${mallName}(${mallId}): 배치 커밋 완료`
                );
              }
            }
          }

          // 남은 배치 커밋
          if (batchCount > 0) {
            await batch.commit();
          }

          totalGradeChanges += mallGradeChanges;

          logger.info(
            `[등급 평가] ${mallName}(${mallId}): ` +
              `대상 사용자 ${ordersByUser.size}명, ` +
              `등급 변경 ${mallGradeChanges}건`
          );
        } catch (mallError) {
          logger.error(
            `[등급 평가 오류] 몰 ${mallId} 등급 평가 실패`,
            mallError
          );
          // 개별 몰 오류는 무시하고 계속 진행
        }
      }

      logger.info(
        `[등급 평가 완료] 총 ${totalGradeChanges}건 등급 변경 처리됨`
      );
    } catch (error) {
      logger.error("[등급 평가 오류]", error);
      throw error;
    }
  }
);
