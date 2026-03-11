// ============================================
// MarketShare - Payment Cancellation API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = "force-static";

/**
 * Obtains an access token from the PortOne REST API.
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
 * POST /api/payment/cancel
 *
 * Server-side payment cancellation endpoint.
 * Supports both full and partial cancellation.
 *
 * Request body:
 * - imp_uid: string - PortOne unique payment ID
 * - reason: string - Reason for cancellation
 * - amount?: number - Amount to cancel (omit for full cancellation)
 */
export async function POST(request: NextRequest) {
  try {
    const { imp_uid, reason, amount } = await request.json();

    // Validate required fields
    if (!imp_uid || !reason) {
      return NextResponse.json(
        { success: false, message: '필수 파라미터가 누락되었습니다. (imp_uid, reason)' },
        { status: 400 }
      );
    }

    // Step 1: Get access token
    const accessToken = await getPortOneAccessToken();

    // Step 2: Build cancellation request body
    const cancelBody: Record<string, any> = {
      imp_uid,
      reason,
    };

    // Partial cancellation: include specific amount
    if (amount !== undefined && amount !== null) {
      cancelBody.amount = amount;
    }

    // Step 3: Request cancellation from PortOne
    const cancelResponse = await fetch('https://api.iamport.kr/payments/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(cancelBody),
    });

    const cancelData = await cancelResponse.json();

    if (cancelData.code !== 0) {
      return NextResponse.json(
        {
          success: false,
          message: `결제 취소 실패: ${cancelData.message}`,
        },
        { status: 400 }
      );
    }

    const cancelledPayment = cancelData.response;

    return NextResponse.json({
      success: true,
      message: amount
        ? `${amount}원 부분 취소가 완료되었습니다.`
        : '결제 전액 취소가 완료되었습니다.',
      data: {
        imp_uid: cancelledPayment.imp_uid,
        merchant_uid: cancelledPayment.merchant_uid,
        amount: cancelledPayment.amount,
        cancel_amount: cancelledPayment.cancel_amount,
        status: cancelledPayment.status,
      },
    });
  } catch (error) {
    console.error('Payment cancellation error:', error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : '결제 취소 중 서버 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
