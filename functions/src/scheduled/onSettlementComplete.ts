// ============================================
// 정산 완료 트리거 - 정산 보고서 및 세금계산서 생성
// ============================================

import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

const db = admin.firestore();

/**
 * Firestore 트리거: settlements/{settlementId}
 *
 * - 정산 상태가 'completed'로 변경될 때 실행
 * - settlement_reports 문서 생성 (정산 보고서)
 * - tax_invoices 문서 생성 (세금계산서)
 */
export const onSettlementComplete = onDocumentUpdated(
  "settlements/{settlementId}",
  async (event) => {
    const settlementId = event.params.settlementId;

    try {
      const beforeData = event.data?.before?.data();
      const afterData = event.data?.after?.data();

      if (!beforeData || !afterData) {
        logger.error(
          `[정산 완료 트리거 오류] 데이터가 없습니다: ${settlementId}`
        );
        return;
      }

      // 상태가 completed로 변경된 경우에만 처리
      if (
        beforeData.status === "completed" ||
        afterData.status !== "completed"
      ) {
        return;
      }

      logger.info(
        `[정산 완료] settlementId: ${settlementId}, status: ${beforeData.status} -> completed`
      );

      const mallId = afterData.mallId as string;
      const mallName = afterData.mallName as string;
      const period = afterData.period as {
        startDate: admin.firestore.Timestamp;
        endDate: admin.firestore.Timestamp;
      };
      const totalSales = (afterData.totalSales as number) || 0;
      const orderCount = (afterData.orderCount as number) || 0;
      const platformCommission = (afterData.totalCommission as number) || 0;
      const pgFees = Math.round(totalSales * 0.033);
      const netAmount = totalSales - platformCommission - pgFees;
      const now = admin.firestore.FieldValue.serverTimestamp();

      // 1. 정산 보고서(settlement_reports) 문서 생성
      const reportRef = db.collection("settlement_reports").doc();
      await reportRef.set({
        settlementId: settlementId,
        mallId: mallId,
        period: period,
        reportData: {
          totalSales: totalSales,
          totalOrders: orderCount,
          platformCommission: platformCommission,
          pgFees: pgFees,
          netAmount: netAmount,
          orderBreakdown: [],
        },
        generatedAt: now,
      });

      logger.info(
        `[정산 보고서 생성] settlementId: ${settlementId}, reportId: ${reportRef.id}, ` +
          `매출 ${totalSales.toLocaleString()}원, 수수료 ${platformCommission.toLocaleString()}원, ` +
          `PG수수료 ${pgFees.toLocaleString()}원, 정산액 ${netAmount.toLocaleString()}원`
      );

      // 2. 세금계산서(tax_invoices) 문서 생성
      const taxAmount = Math.round(netAmount * 0.1);
      const totalAmount = netAmount + taxAmount;

      const invoiceRef = db.collection("tax_invoices").doc();
      await invoiceRef.set({
        settlementId: settlementId,
        mallId: mallId,
        mallName: mallName,
        period: period,
        amount: netAmount,
        taxAmount: taxAmount,
        totalAmount: totalAmount,
        status: "pending",
        externalId: null,
        issueDate: now,
        pdfUrl: null,
      });

      logger.info(
        `[세금계산서 생성] settlementId: ${settlementId}, invoiceId: ${invoiceRef.id}, ` +
          `공급가액 ${netAmount.toLocaleString()}원, 세액 ${taxAmount.toLocaleString()}원, ` +
          `합계 ${totalAmount.toLocaleString()}원`
      );

      logger.info(
        `[정산 완료 처리 완료] settlementId: ${settlementId}, ` +
          `보고서: ${reportRef.id}, 세금계산서: ${invoiceRef.id}`
      );
    } catch (error) {
      logger.error(
        `[정산 완료 트리거 오류] settlementId: ${settlementId}`,
        error
      );
      throw error;
    }
  }
);
