// ============================================
// 주문 생성 트리거 - 글로벌 주문 참조 및 사용자 주문 생성
// ============================================

import { onDocumentCreated } from "firebase-functions/v2/firestore";
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
 * - orders_global/{orderId}에 주요 주문 정보 참조 문서 생성
 * - users/{userId}/orders/{orderId}에 경량 참조 문서 생성
 * - 알림 발송 (현재 로그 출력)
 */
export const onOrderCreate = onDocumentCreated(
  "malls/{mallId}/orders/{orderId}",
  async (event) => {
    const mallId = event.params.mallId;
    const orderId = event.params.orderId;

    try {
      const orderData = event.data?.data();

      if (!orderData) {
        logger.error(`[주문 생성 오류] 주문 데이터가 없습니다: ${orderId}`);
        return;
      }

      const userId = orderData.userId as string;
      const batch = db.batch();

      // 1. orders_global/{orderId}에 참조 문서 생성
      const globalOrderRef = db.doc(`orders_global/${orderId}`);
      batch.set(globalOrderRef, {
        orderId: orderId,
        orderNumber: orderData.orderNumber || "",
        mallId: mallId,
        mallName: orderData.mallName || "",
        userId: userId,
        userName: orderData.userName || "",
        userEmail: orderData.userEmail || "",
        totalAmount: orderData.totalAmount || 0,
        status: orderData.status || "pending",
        paymentMethod: orderData.paymentMethod || "",
        itemCount: orderData.items?.length || 0,
        createdAt: orderData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        // 원본 주문 참조 경로
        originalPath: `malls/${mallId}/orders/${orderId}`,
      });

      // 2. users/{userId}/orders/{orderId}에 경량 참조 문서 생성
      if (userId) {
        const userOrderRef = db.doc(`users/${userId}/orders/${orderId}`);
        batch.set(userOrderRef, {
          orderId: orderId,
          orderNumber: orderData.orderNumber || "",
          mallId: mallId,
          mallName: orderData.mallName || "",
          totalAmount: orderData.totalAmount || 0,
          status: orderData.status || "pending",
          itemCount: orderData.items?.length || 0,
          firstItemName: orderData.items?.[0]?.name || "",
          firstItemImageUrl: orderData.items?.[0]?.imageUrl || "",
          createdAt: orderData.createdAt || admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          // 원본 주문 참조 경로
          originalPath: `malls/${mallId}/orders/${orderId}`,
        });
      }

      await batch.commit();
      logger.info(
        `[주문 생성 완료] orderId: ${orderId}, mallId: ${mallId}, userId: ${userId}`
      );

      // 3. 알림 발송 (placeholder)
      const userEmail = orderData.userEmail as string;
      const userName = orderData.userName as string;
      const orderNumber = orderData.orderNumber as string;
      const totalAmount = orderData.totalAmount as number;

      if (userEmail) {
        await sendEmailNotification(
          userEmail,
          `[마켓쉐어] 주문이 완료되었습니다 (${orderNumber})`,
          `${userName}님, 주문이 성공적으로 접수되었습니다.\n` +
            `주문번호: ${orderNumber}\n` +
            `결제금액: ${totalAmount?.toLocaleString()}원\n` +
            `감사합니다.`
        );
      }

      // 몰 오너에게도 알림
      const mallDoc = await db.doc(`malls/${mallId}`).get();
      const mallData = mallDoc.data();
      if (mallData?.ownerId) {
        const ownerDoc = await db.doc(`users/${mallData.ownerId}`).get();
        const ownerData = ownerDoc.data();
        if (ownerData?.phone) {
          await sendSMSNotification(
            ownerData.phone,
            `[마켓쉐어] 새로운 주문이 접수되었습니다. 주문번호: ${orderNumber}, 금액: ${totalAmount?.toLocaleString()}원`
          );
        }
      }

      logger.info(
        `[주문 알림 발송 완료] orderId: ${orderId}, orderNumber: ${orderNumber}`
      );
    } catch (error) {
      logger.error(
        `[주문 생성 처리 오류] mallId: ${mallId}, orderId: ${orderId}`,
        error
      );
      throw error;
    }
  }
);
