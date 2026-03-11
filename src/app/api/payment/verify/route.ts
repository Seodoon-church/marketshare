// ============================================
// MarketShare - Payment Verification API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-static";
// NOTE: 이 라우트는 output:'export' 모드에서 실제 동작하지 않음.
// 실제 결제 검증은 verifyPayment Cloud Function을 통해 처리됨.

/**
 * Obtains an access token from the PortOne REST API.
 * This token is required for all subsequent API calls.
 */
async function getPortOneAccessToken(): Promise<string> {
  const response = await fetch('https://api.iamport.kr/users/getToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imp_key: process.env.PORTONE_API_KEY,
      imp_secret: process.env.PORTONE_API_SECRET,
    }),
  });

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`PortOne 인증 실패: ${data.message}`);
  }

  return data.response.access_token;
}

/**
 * POST /api/payment/verify
 *
 * Server-side payment verification endpoint.
 * Receives the imp_uid, merchant_uid, and expected amount from the client,
 * then contacts PortOne REST API to verify the actual payment details match.
 *
 * Request body:
 * - imp_uid: string - PortOne unique payment ID
 * - merchant_uid: string - Merchant's unique order ID
 * - amount: number - Expected payment amount
 *
 * This prevents client-side amount manipulation attacks.
 */
export async function POST(request: NextRequest) {
  try {
    const { imp_uid, merchant_uid, amount } = await request.json();

    // Validate required fields
    if (!imp_uid || !merchant_uid || amount === undefined) {
      return NextResponse.json(
        { success: false, message: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // Step 1: Get access token
    const accessToken = await getPortOneAccessToken();

    // Step 2: Get payment details from PortOne
    const paymentResponse = await fetch(
      `https://api.iamport.kr/payments/${encodeURIComponent(imp_uid)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const paymentData = await paymentResponse.json();

    if (paymentData.code !== 0) {
      return NextResponse.json(
        { success: false, message: `결제 정보 조회 실패: ${paymentData.message}` },
        { status: 400 }
      );
    }

    const payment = paymentData.response;

    // Step 3: Verify the amount matches
    if (payment.amount !== amount) {
      return NextResponse.json(
        {
          success: false,
          message: `결제 금액 불일치: 예상 ${amount}원, 실제 ${payment.amount}원`,
        },
        { status: 400 }
      );
    }

    // Step 4: Check payment status
    if (payment.status !== 'paid') {
      return NextResponse.json(
        {
          success: false,
          message: `결제가 완료되지 않았습니다. 상태: ${payment.status}`,
        },
        { status: 400 }
      );
    }

    // Step 5: Verification successful
    return NextResponse.json({
      success: true,
      message: '결제 검증이 완료되었습니다.',
      data: {
        imp_uid: payment.imp_uid,
        merchant_uid: payment.merchant_uid,
        amount: payment.amount,
        status: payment.status,
        pay_method: payment.pay_method,
        pg_provider: payment.pg_provider,
        paid_at: payment.paid_at,
        cancel_amount: payment.cancel_amount,
      },
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '결제 검증 중 서버 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
