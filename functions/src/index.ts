// ============================================
// MarketShare Cloud Functions - 메인 엔트리 포인트
// ============================================

import * as admin from "firebase-admin";

// Firebase Admin SDK 초기화
admin.initializeApp();

// ---- Product Functions ----
export { onProductWrite } from "./products/onProductWrite";

// ---- Order Functions ----
export { onOrderCreate } from "./orders/onOrderCreate";
export { onOrderStatusChange } from "./orders/onOrderStatusChange";

// ---- User Functions ----
export { onUserCreate } from "./users/onUserCreate";

// ---- Mall Functions ----
export { onMallCreate } from "./malls/onMallCreate";

// ---- Scheduled Functions ----
export { dailySettlement } from "./scheduled/dailySettlement";
export { updateStats } from "./scheduled/updateStats";
export { expirePoints } from "./scheduled/expirePoints";
export { evaluateGrades } from "./scheduled/evaluateGrades";
export { expireCoupons } from "./scheduled/expireCoupons";

// ---- Settlement Triggers ----
export { onSettlementComplete } from "./scheduled/onSettlementComplete";

// ---- Auth Functions ----
export { kakaoLogin, naverLogin } from "./auth/socialLogin";

// ---- Payment Functions ----
export { processCheckout } from "./payments/processCheckout";
export { expireUnpaidOrders } from "./payments/expireUnpaidOrders";
export { verifyPayment } from "./payments/verifyPayment";
export { paymentWebhook } from "./payments/paymentWebhook";

// ---- Chat Functions ----
export { chatbot } from "./chat/chatbot";

// ---- Notification Helpers (내부 사용) ----
// notifications/sendNotification.ts 는 다른 함수에서 import하여 사용
