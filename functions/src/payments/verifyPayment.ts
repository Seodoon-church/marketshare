// ============================================
// 결제 검증 Cloud Function
// PortOne REST API를 통해 실제 결제 금액을 확인
// ============================================

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

async function getPortOneAccessToken(): Promise<string> {
  const apiKey = process.env.PORTONE_API_KEY;
  const apiSecret = process.env.PORTONE_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new HttpsError("failed-precondition", "PortOne API 키가 설정되지 않았습니다.");
  }

  const response = await fetch("https://api.iamport.kr/users/getToken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imp_key: apiKey, imp_secret: apiSecret }),
  });

  const data = await response.json();
  if (data.code !== 0) {
    throw new HttpsError("internal", `PortOne 인증 실패: ${data.message}`);
  }

  return data.response.access_token;
}

export const verifyPayment = onCall(
  { maxInstances: 20, timeoutSeconds: 15 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "로그인이 필요합니다.");
    }

    const { imp_uid, merchant_uid, amount } = request.data as {
      imp_uid: string;
      merchant_uid: string;
      amount: number;
    };

    if (!imp_uid || !merchant_uid || amount === undefined) {
      throw new HttpsError("invalid-argument", "필수 파라미터가 누락되었습니다.");
    }

    try {
      const accessToken = await getPortOneAccessToken();

      const paymentResponse = await fetch(
        `https://api.iamport.kr/payments/${encodeURIComponent(imp_uid)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const paymentData = await paymentResponse.json();

      if (paymentData.code !== 0) {
        return { success: false, message: `결제 정보 조회 실패: ${paymentData.message}` };
      }

      const payment = paymentData.response;

      if (payment.amount !== amount) {
        logger.error(`[결제검증] 금액 불일치: 예상 ${amount}, 실제 ${payment.amount}, merchant_uid: ${merchant_uid}`);
        return {
          success: false,
          message: `결제 금액 불일치: 예상 ${amount}원, 실제 ${payment.amount}원`,
        };
      }

      if (payment.status !== "paid") {
        return {
          success: false,
          message: `결제가 완료되지 않았습니다. 상태: ${payment.status}`,
        };
      }

      logger.info(`[결제검증] 성공 - merchant_uid: ${merchant_uid}, amount: ${amount}`);
      return { success: true, message: "결제 검증이 완료되었습니다." };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("[결제검증] 오류:", error);
      throw new HttpsError("internal", "결제 검증 중 서버 오류가 발생했습니다.");
    }
  }
);
