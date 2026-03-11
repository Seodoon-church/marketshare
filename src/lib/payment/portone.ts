// ============================================
// MarketShare - PortOne (아임포트) SDK Wrapper
// ============================================

import type { PaymentMethod, PGProvider } from '@/types';

// ---- Global Window Type Extension ----
declare global {
  interface Window {
    IMP: any;
  }
}

// ---- Payment Types ----
export interface PaymentRequest {
  pg: string;
  pay_method: string;
  merchant_uid: string;
  name: string;
  amount: number;
  buyer_email: string;
  buyer_name: string;
  buyer_tel: string;
  buyer_addr: string;
  buyer_postcode: string;
  m_redirect_url?: string;
}

export interface PaymentResponse {
  success: boolean;
  imp_uid?: string;
  merchant_uid?: string;
  error_msg?: string;
  paid_amount?: number;
  status?: string;
}

export interface PortOneVerifyResponse {
  code: number;
  message: string;
  response: {
    imp_uid: string;
    merchant_uid: string;
    amount: number;
    status: string;
    pay_method: string;
    pg_provider: string;
    paid_at: number;
    cancel_amount: number;
  };
}

// ---- PG Provider Mapping ----
const PG_MAP: Record<PGProvider, string> = {
  inicis: 'html5_inicis',
  kakaopay: 'kakaopay',
  naverpay: 'naverpay',
  kcp: 'kcp',
  lg: 'tosspayments',
};

// ---- Payment Method Mapping ----
const PAY_METHOD_MAP: Record<PaymentMethod, string> = {
  card: 'card',
  bank_transfer: 'trans',
  virtual_account: 'vbank',
  phone: 'phone',
  kakaopay: 'kakaopay',
  naverpay: 'naverpay',
};

/**
 * Maps PGProvider enum to PortOne PG identifier string.
 */
export function mapPGProvider(pg: PGProvider): string {
  return PG_MAP[pg];
}

/**
 * Maps PaymentMethod enum to PortOne pay_method string.
 */
export function mapPaymentMethod(method: PaymentMethod): string {
  return PAY_METHOD_MAP[method];
}

/**
 * Dynamically loads the PortOne (iamport) SDK script and initializes it
 * with the store's IMP code from environment variables.
 *
 * This should be called once before any payment requests, typically
 * in the checkout page's useEffect or on application mount.
 *
 * @returns Promise that resolves when the SDK is loaded and initialized
 */
export function initPortOne(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (typeof window !== 'undefined' && window.IMP) {
      const impCode = process.env.NEXT_PUBLIC_PORTONE_IMP_CODE;
      if (impCode) {
        window.IMP.init(impCode);
      }
      resolve();
      return;
    }

    if (typeof document === 'undefined') {
      reject(new Error('PortOne SDK can only be loaded in browser environment'));
      return;
    }

    // Check if script tag already exists
    const existingScript = document.querySelector(
      'script[src="https://cdn.iamport.kr/v1/iamport.js"]'
    );
    if (existingScript) {
      // Script tag exists but IMP not ready yet - wait for it
      existingScript.addEventListener('load', () => {
        const impCode = process.env.NEXT_PUBLIC_PORTONE_IMP_CODE;
        if (impCode && window.IMP) {
          window.IMP.init(impCode);
        }
        resolve();
      });
      existingScript.addEventListener('error', () => {
        reject(new Error('Failed to load PortOne SDK'));
      });
      return;
    }

    // Create and append script element
    const script = document.createElement('script');
    script.src = 'https://cdn.iamport.kr/v1/iamport.js';
    script.async = true;

    script.onload = () => {
      const impCode = process.env.NEXT_PUBLIC_PORTONE_IMP_CODE;
      if (!impCode) {
        reject(new Error('NEXT_PUBLIC_PORTONE_IMP_CODE environment variable is not set'));
        return;
      }
      if (!window.IMP) {
        reject(new Error('PortOne SDK loaded but IMP object not found'));
        return;
      }
      window.IMP.init(impCode);
      resolve();
    };

    script.onerror = () => {
      reject(new Error('Failed to load PortOne SDK from CDN'));
    };

    document.head.appendChild(script);
  });
}

/**
 * Requests a payment via PortOne IMP.request_pay.
 *
 * The PortOne SDK must be initialized via initPortOne() before calling this.
 *
 * @param params - Payment request parameters
 * @returns Promise resolving with the payment response
 */
export function requestPayment(params: PaymentRequest): Promise<PaymentResponse> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.IMP) {
      reject(new Error('PortOne SDK is not initialized. Call initPortOne() first.'));
      return;
    }

    window.IMP.request_pay(params, (response: PaymentResponse) => {
      resolve(response);
    });
  });
}
