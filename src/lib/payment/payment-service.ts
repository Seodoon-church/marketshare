// ============================================
// MarketShare - Payment Business Logic Service
// ============================================

import type { Order, PaymentMethod, PGProvider } from '@/types';
import {
  initPortOne,
  requestPayment,
  mapPGProvider,
  mapPaymentMethod,
} from './portone';
import type { PaymentResponse } from './portone';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/config';

// ---- Service Types ----
interface VerifyPaymentResult {
  success: boolean;
  message: string;
}

interface CancelPaymentResult {
  success: boolean;
  message: string;
}

interface PaymentInfoResult {
  success: boolean;
  data?: {
    imp_uid: string;
    merchant_uid: string;
    amount: number;
    status: string;
    pay_method: string;
    pg_provider: string;
    paid_at: number;
    cancel_amount: number;
  };
  message?: string;
}

/**
 * Generates a unique merchant UID in the format MS-YYYYMMDD-XXXXX.
 *
 * The prefix "MS" stands for MarketShare. The date portion uses the
 * current date in YYYYMMDD format. The suffix is a 5-character random
 * alphanumeric string to ensure uniqueness.
 *
 * @returns A unique merchant UID string
 */
export function generateMerchantUid(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomStr = '';
  for (let i = 0; i < 5; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return `MS-${dateStr}-${randomStr}`;
}

/**
 * Orchestrates the full payment flow for an order.
 *
 * This function:
 * 1. Initializes the PortOne SDK (if not already done)
 * 2. Generates a unique merchant UID
 * 3. Maps PG provider and payment method to PortOne values
 * 4. Sends the payment request via PortOne
 * 5. Verifies the payment on the server side if successful
 *
 * @param order - The order to process payment for
 * @param paymentMethod - The selected payment method
 * @param pgProvider - The selected PG provider
 * @returns Promise resolving with the payment response and verification result
 */
export async function processPayment(
  order: Order,
  paymentMethod: PaymentMethod,
  pgProvider: PGProvider
): Promise<{ payment: PaymentResponse; verified: boolean }> {
  // Step 1: Initialize PortOne SDK
  await initPortOne();

  // Step 2: Generate merchant UID
  const merchantUid = generateMerchantUid();

  // Step 3: Map PG and payment method
  const pg = mapPGProvider(pgProvider);
  const payMethod = mapPaymentMethod(paymentMethod);

  // Step 4: Build payment request
  const orderName =
    order.items.length > 1
      ? `${order.items[0].name} 외 ${order.items.length - 1}건`
      : order.items[0].name;

  const paymentResponse = await requestPayment({
    pg,
    pay_method: payMethod,
    merchant_uid: merchantUid,
    name: orderName,
    amount: order.totalAmount,
    buyer_email: order.userEmail,
    buyer_name: order.userName,
    buyer_tel: order.shippingAddress.phone,
    buyer_addr: `${order.shippingAddress.address} ${order.shippingAddress.addressDetail}`,
    buyer_postcode: order.shippingAddress.zipcode,
    m_redirect_url: typeof window !== 'undefined'
      ? `${window.location.origin}/orders/complete`
      : undefined,
  });

  // Step 5: Verify on server if payment succeeded
  if (paymentResponse.success && paymentResponse.imp_uid) {
    const verification = await verifyPayment(
      paymentResponse.imp_uid,
      merchantUid,
      order.totalAmount
    );
    return { payment: paymentResponse, verified: verification.success };
  }

  return { payment: paymentResponse, verified: false };
}

/**
 * 서버에서 생성한 merchantUid와 totalAmount를 사용하여 결제를 진행합니다.
 * processCheckout Cloud Function에서 반환된 값을 사용합니다.
 */
export async function processPaymentWithServerData(params: {
  merchantUid: string;
  totalAmount: number;
  orderName: string;
  buyerEmail: string;
  buyerName: string;
  buyerTel: string;
  buyerAddr: string;
  buyerPostcode: string;
  paymentMethod: PaymentMethod;
  pgProvider: PGProvider;
}): Promise<{ payment: PaymentResponse; verified: boolean }> {
  await initPortOne();

  const pg = mapPGProvider(params.pgProvider);
  const payMethod = mapPaymentMethod(params.paymentMethod);

  const paymentResponse = await requestPayment({
    pg,
    pay_method: payMethod,
    merchant_uid: params.merchantUid,
    name: params.orderName,
    amount: params.totalAmount,
    buyer_email: params.buyerEmail,
    buyer_name: params.buyerName,
    buyer_tel: params.buyerTel,
    buyer_addr: params.buyerAddr,
    buyer_postcode: params.buyerPostcode,
    m_redirect_url: typeof window !== 'undefined'
      ? `${window.location.origin}/orders/complete`
      : undefined,
  });

  if (paymentResponse.success && paymentResponse.imp_uid) {
    const verification = await verifyPayment(
      paymentResponse.imp_uid,
      params.merchantUid,
      params.totalAmount
    );
    return { payment: paymentResponse, verified: verification.success };
  }

  return { payment: paymentResponse, verified: false };
}

/**
 * Verifies a payment by calling the Cloud Function verification endpoint.
 *
 * The server will contact PortOne's REST API to confirm that the payment
 * amount matches the expected amount, preventing client-side tampering.
 *
 * @param impUid - The PortOne unique payment ID
 * @param merchantUid - The merchant's unique order ID
 * @param amount - The expected payment amount
 * @returns Promise resolving with verification result
 */
export async function verifyPayment(
  impUid: string,
  merchantUid: string,
  amount: number
): Promise<VerifyPaymentResult> {
  try {
    const verifyPaymentFn = httpsCallable<
      { imp_uid: string; merchant_uid: string; amount: number },
      { success: boolean; message: string }
    >(functions, 'verifyPayment');

    const result = await verifyPaymentFn({
      imp_uid: impUid,
      merchant_uid: merchantUid,
      amount,
    });

    return {
      success: result.data.success,
      message: result.data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '결제 검증 중 오류가 발생했습니다.',
    };
  }
}

/**
 * Cancels a payment (full or partial) by calling the backend cancellation API.
 *
 * @param impUid - The PortOne unique payment ID
 * @param reason - The reason for cancellation
 * @param amount - Optional amount for partial cancellation. If omitted, full cancellation is performed.
 * @returns Promise resolving with cancellation result
 */
export async function cancelPayment(
  impUid: string,
  reason: string,
  amount?: number
): Promise<CancelPaymentResult> {
  try {
    const response = await fetch('/api/payment/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imp_uid: impUid,
        reason,
        amount,
      }),
    });

    const data = await response.json();
    return {
      success: data.success,
      message: data.message,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '결제 취소 중 오류가 발생했습니다.',
    };
  }
}

/**
 * Fetches payment details from the backend.
 *
 * @param impUid - The PortOne unique payment ID
 * @returns Promise resolving with payment information
 */
export async function getPaymentInfo(impUid: string): Promise<PaymentInfoResult> {
  try {
    const response = await fetch(`/api/payment/verify?imp_uid=${encodeURIComponent(impUid)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();
    if (data.success) {
      return {
        success: true,
        data: data.data,
      };
    }
    return {
      success: false,
      message: data.message || '결제 정보를 가져올 수 없습니다.',
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '결제 정보 조회 중 오류가 발생했습니다.',
    };
  }
}
