// ============================================
// MarketShare - PortOne Webhook API Route
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';

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
 * POST /api/payment/webhook
 *
 * Webhook endpoint for PortOne server-to-server callbacks.
 * PortOne sends notifications here when payment status changes occur,
 * such as successful payments, cancellations, or virtual account deposits.
 *
 * Request body (from PortOne):
 * - imp_uid: string - PortOne unique payment ID
 * - merchant_uid: string - Merchant's unique order ID
 * - status: string - Payment status (paid, cancelled, failed, etc.)
 *
 * This endpoint:
 * 1. Receives the webhook notification
 * 2. Verifies the payment status with PortOne REST API
 * 3. Updates order status accordingly (placeholder for Firestore integration)
 * 4. Returns 200 OK to acknowledge receipt
 */
export async function POST(request: NextRequest) {
  try {
    const { imp_uid, merchant_uid, status } = await request.json();

    // Validate required fields
    if (!imp_uid || !merchant_uid) {
      return NextResponse.json(
        { success: false, message: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // Step 1: Get access token to verify payment with PortOne
    const accessToken = await getPortOneAccessToken();

    // Step 2: Fetch actual payment info from PortOne for verification
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
      console.error('Webhook: Failed to fetch payment info:', paymentData.message);
      return NextResponse.json(
        { success: false, message: '결제 정보 조회 실패' },
        { status: 400 }
      );
    }

    const payment = paymentData.response;

    // Step 3: Look up the order by merchantUid field (orders use Firestore-generated IDs)
    const adminDb = getAdminFirestore();
    const ordersQuery = adminDb.collection('orders_global')
      .where('merchantUid', '==', merchant_uid)
      .limit(1);
    const ordersSnap = await ordersQuery.get();

    if (ordersSnap.empty) {
      console.warn(`Webhook: No order found for merchant_uid: ${merchant_uid}`);
      return NextResponse.json({
        success: true,
        message: 'Order not found, webhook acknowledged',
        status: payment.status,
      });
    }

    const orderDoc = ordersSnap.docs[0];
    const orderData = orderDoc.data();
    const orderId = orderDoc.id;

    /**
     * Helper: update order in all 3 sub-collection locations
     */
    async function updateOrderEverywhere(data: Record<string, unknown>) {
      // 1. Global orders collection
      await orderDoc.ref.update(data);

      // 2. Mall sub-collection
      if (orderData.mallId) {
        const mallOrderQuery = adminDb
          .collection('malls').doc(orderData.mallId)
          .collection('orders')
          .where('merchantUid', '==', merchant_uid)
          .limit(1);
        const mallOrderSnap = await mallOrderQuery.get();
        if (!mallOrderSnap.empty) {
          await mallOrderSnap.docs[0].ref.update(data);
        }
      }

      // 3. User sub-collection
      if (orderData.userId) {
        const userOrderQuery = adminDb
          .collection('users').doc(orderData.userId)
          .collection('orders')
          .where('merchantUid', '==', merchant_uid)
          .limit(1);
        const userOrderSnap = await userOrderQuery.get();
        if (!userOrderSnap.empty) {
          await userOrderSnap.docs[0].ref.update(data);
        }
      }
    }

    // Step 4: Process based on verified payment status
    // Using the actual status from PortOne (not the webhook body) for security
    switch (payment.status) {
      case 'paid': {
        const updateData = {
          status: 'paid',
          paidAt: new Date(),
          updatedAt: new Date(),
          paymentInfo: {
            pgProvider: payment.pg_provider,
            pgTid: payment.pg_tid || '',
            impUid: imp_uid,
            merchantUid: merchant_uid,
            paidAt: new Date(payment.paid_at * 1000),
            receiptUrl: payment.receipt_url || '',
          },
        };
        await updateOrderEverywhere(updateData);

        // Process points deduction (server-side)
        if (orderData.pointsUsed && orderData.pointsUsed > 0 && orderData.userId) {
          try {
            const userRef = adminDb.collection('users').doc(orderData.userId);
            const userSnap = await userRef.get();
            if (userSnap.exists) {
              const userData = userSnap.data()!;
              const currentBalance = userData.pointBalance || 0;
              const newBalance = Math.max(0, currentBalance - orderData.pointsUsed);

              // Create points ledger entry
              await adminDb.collection('points_ledger').add({
                userId: orderData.userId,
                orderId,
                type: 'deduct',
                amount: -orderData.pointsUsed,
                balanceAfter: newBalance,
                description: `주문 ${merchant_uid} 포인트 사용`,
                createdAt: new Date(),
              });

              // Update user point balance
              await userRef.update({
                pointBalance: newBalance,
                updatedAt: new Date(),
              });
            }
          } catch (pointsError) {
            console.error('Webhook: Points deduction failed:', pointsError);
          }
        }

        // Process coupon application (server-side)
        if (orderData.couponCode && orderData.userId) {
          try {
            const couponQuery = adminDb.collection('coupons')
              .where('code', '==', orderData.couponCode)
              .limit(1);
            const couponSnap = await couponQuery.get();

            if (!couponSnap.empty) {
              const couponDoc = couponSnap.docs[0];
              const couponData = couponDoc.data();

              // Increment coupon usage count
              await couponDoc.ref.update({
                usageCount: (couponData.usageCount || 0) + 1,
                updatedAt: new Date(),
              });

              // Create coupon usage entry
              await adminDb.collection('coupon_usage').add({
                couponId: couponDoc.id,
                couponCode: orderData.couponCode,
                userId: orderData.userId,
                orderId,
                discountAmount: orderData.couponDiscount || 0,
                usedAt: new Date(),
              });
            }
          } catch (couponError) {
            console.error('Webhook: Coupon processing failed:', couponError);
          }
        }

        break;
      }

      case 'cancelled': {
        const updateData = {
          status: 'refunded',
          refundAmount: payment.cancel_amount,
          updatedAt: new Date(),
        };
        await updateOrderEverywhere(updateData);
        break;
      }

      case 'failed': {
        const updateData = {
          status: 'cancelled',
          cancelReason: 'Payment failed',
          updatedAt: new Date(),
        };
        await updateOrderEverywhere(updateData);
        break;
      }

      case 'ready': {
        // Virtual account issued (waiting for deposit)
        console.log(
          `Webhook: Virtual account ready - imp_uid: ${imp_uid}, merchant_uid: ${merchant_uid}`
        );
        break;
      }

      default: {
        console.log(
          `Webhook: Unknown status '${payment.status}' - imp_uid: ${imp_uid}, merchant_uid: ${merchant_uid}`
        );
        break;
      }
    }

    // Step 5: Return 200 OK to acknowledge the webhook
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      status: payment.status,
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 even on error to prevent PortOne from retrying excessively
    // Log the error for investigation
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Webhook 처리 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
