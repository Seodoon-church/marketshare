// ============================================
// MarketShare - Payment Module Exports
// ============================================

// PortOne SDK wrapper
export {
  initPortOne,
  requestPayment,
  mapPGProvider,
  mapPaymentMethod,
} from './portone';

export type {
  PaymentRequest,
  PaymentResponse,
  PortOneVerifyResponse,
} from './portone';

// Payment business logic
export {
  processPayment,
  verifyPayment,
  cancelPayment,
  getPaymentInfo,
  generateMerchantUid,
} from './payment-service';
