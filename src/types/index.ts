// ============================================
// MarketShare - Core Type Definitions
// ============================================

import { Timestamp } from 'firebase/firestore';

// ---- Common ----
export type UserRole = 'customer' | 'mall_owner' | 'platform_admin' | 'supplier';
export type MallStatus = 'active' | 'suspended' | 'pending' | 'expired';
export type ProductStatus = 'active' | 'draft' | 'soldout' | 'hidden';
export type OrderStatus = 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentMethod = 'card' | 'kakaopay' | 'naverpay' | 'bank_transfer' | 'virtual_account' | 'phone';
export type PGProvider = 'inicis' | 'kakaopay' | 'naverpay' | 'kcp' | 'lg';
export type BoardType = 'notice' | 'faq' | 'qna' | 'review' | 'free';
export type FranchiseApplicationStatus = 'pending' | 'reviewing' | 'approved' | 'rejected';
export type SettlementStatus = 'pending' | 'processing' | 'completed';
export type PGPaymentAuth = 'platform' | 'individual' | 'selective';
export type MallLevel = 1 | 2 | 3 | 4 | 5;

// ---- PG 설정 ----
export interface PGProviderConfig {
  enabled: boolean;
  mid: string;           // 상점 MID / 가맹점 코드
  apiKey: string;
  apiSecret: string;
  impCode: string;       // PortOne IMP 코드 (가맹점 식별코드)
  testMode: boolean;
  pgId: string;          // PortOne PG사 식별자 (예: 'html5_inicis', 'kakaopay')
}

export interface MallPGConfig {
  pgPaymentAuth: PGPaymentAuth;
  selectedProviders: PGProvider[];
  configs: Partial<Record<PGProvider, PGProviderConfig>>;
  defaultProvider: PGProvider | null;
}

// ---- User ----
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  ownedMallIds: string[];
  profileImageUrl: string | null;
  gender: string | null;
  birthDate: Date | null;
  isVerified: boolean;
  verificationMethod: string | null;
  socialProvider: string | null;
  socialProviderId: string | null;
  defaultAddress: Address | null;
  addresses: Address[];
  marketingConsent: boolean;
  privacyConsent: boolean;
  referredBy: string | null;
  pointBalance: number;
  pointsByMall: Record<string, number>;
  gradeByMall: Record<string, string>;
  supplierIds: string[];
  lastLoginAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  name: string;
  phone: string;
  zipcode: string;
  address: string;
  addressDetail: string;
  isDefault?: boolean;
}

// ---- Mall ----
export interface Mall {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  ownerName: string;
  themeId: string;
  themeConfig: Record<string, string>;
  status: MallStatus;
  level: MallLevel;
  plan: string;
  domain: string | null;
  subdomain: string;
  businessInfo: BusinessInfo;
  bankInfo: BankInfo | null;
  commissionRate: number;
  referralCommissionRate: number;
  salesCommissionRate: number;
  pgPaymentAuth: PGPaymentAuth;
  pgConfig: MallPGConfig | null;
  description: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  isClosedMall: boolean;
  requireMemberApproval: boolean;
  hidePriceForNonMembers: boolean;
  pointSettings: PointSettings | null;
  productCount: number;
  orderCount: number;
  totalRevenue: number;
  parentMallId: string | null;
  childMallIds: string[];
  createdAt: Date;
  updatedAt: Date;
  franchiseStartDate: Date;
  franchiseEndDate: Date | null;
  // === 분양 설정 ===
  franchiseSettings?: FranchiseSettings | null;
  // === MCN 모드 ===
  isMCN?: boolean;
}

export interface BusinessInfo {
  businessName: string;
  businessNumber: string;
  representative: string;
  address: string;
  addressDetail?: string;
  zipcode?: string;
  phone: string;
  email: string;
  // 네이버 스마트스토어 수준 필드
  sellerType?: 'domestic' | 'overseas';         // 판매자 유형
  businessCategory?: 'personal' | 'corporate';  // 사업자 구분 (개인/법인)
  businessSector?: string;                       // 업태
  businessItem?: string;                         // 업종
  onlineBusinessNumber?: string;                 // 통신판매업신고번호
  // 담당자 정보
  managerName?: string;
  managerPhone?: string;
  managerEmail?: string;
  // 배송 정보
  warehouseZipcode?: string;
  warehouseAddress?: string;
  warehouseAddressDetail?: string;
  warehousePhone?: string;
  warehousePhone2?: string;
  returnZipcode?: string;
  returnAddress?: string;
  returnAddressDetail?: string;
  returnPhone?: string;
  returnPhone2?: string;
}

export interface BankInfo {
  bank: string;
  accountNumber: string;
  holder: string;
  settlementMethod?: 'bank_transfer' | 'npay_biz';  // 정산대금수령방법
}

// ---- Product ----
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  salePrice: number | null;
  costPrice: number;
  currency: string;
  categoryId: string;
  categoryName: string;
  categoryPath: string[];
  brandId: string | null;
  brandName: string | null;
  mallId: string;
  mallName: string;
  mallSlug: string;
  supplierId: string | null;
  supplierName: string | null;
  images: ProductImage[];
  thumbnailUrl: string;
  options: ProductOption[];
  variants: ProductVariant[];
  stock: number;
  sku: string;
  weight: number;
  status: ProductStatus;
  isFeatured: boolean;
  isNew: boolean;
  isFromPlatform: boolean;
  tags: string[];
  viewCount: number;
  salesCount: number;
  reviewCount: number;
  averageRating: number;
  shippingInfo: ShippingInfo;
  levelPrices: LevelPrice[];
  seoTitle: string;
  seoDescription: string;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  // === 분양몰 협동판매 ===
  sourceType?: 'own' | 'headquarters' | 'franchisee' | 'supplier';
  sourceMallId?: string | null;
  sourceProductId?: string | null;
  isSharedToNetwork?: boolean;
  networkVisibility?: 'all' | 'headquarters_only' | 'none';
  // === MCN 라이브 방송 ===
  broadcastEnabled?: boolean;           // "방송가능" 플래그 (본사가 설정)
  broadcastCommissionRate?: number;     // 셀럽 판매수수료율 % (본사→셀럽 지급)
  broadcastSpecialPrice?: number | null; // 방송 전용 특가
}

export interface ProductImage {
  url: string;
  alt: string;
  order: number;
  isMain: boolean;
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface ProductVariant {
  sku: string;
  options: Record<string, string>;
  price: number;
  stock: number;
  imageUrl?: string;
}

export interface ShippingInfo {
  fee: number;
  freeShippingThreshold: number;
  method: string;
  estimatedDays: number;
}

export interface LevelPrice {
  level: MallLevel;
  price: number;
  discountRate: number;
}

// ---- Order ----
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  mallId: string;
  mallName: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  totalAmount: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentInfo: PaymentInfo | null;
  shippingAddress: Address;
  trackingNumber: string | null;
  trackingCompany: string | null;
  memo: string;
  adminMemo: string;
  commission: number;
  referralCommission: number;
  settlementAmount: number;
  isSettled: boolean;
  pointsEarned: number;
  pointsUsed: number;
  couponCode: string | null;
  couponDiscount: number;
  trackingCarrier: string | null;
  trackingUrl: string | null;
  cancelReason: string | null;
  refundAmount: number | null;
  createdAt: Date;
  updatedAt: Date;
  paidAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  options: Record<string, string>;
  imageUrl: string;
  supplierId: string | null;
  sourceType?: 'own' | 'headquarters' | 'franchisee' | 'supplier';
  sourceMallId?: string | null;
}

export interface PaymentInfo {
  pgProvider: PGProvider;
  pgTid: string;
  impUid: string;
  merchantUid: string;
  paidAt: Date;
  receiptUrl: string;
}

// ---- Cart ----
export interface CartItem {
  productId: string;
  mallId: string;
  mallName: string;
  name: string;
  price: number;
  salePrice: number | null;
  quantity: number;
  options: Record<string, string>;
  imageUrl: string;
  stock: number;
}

// ---- Category ----
export interface Category {
  id: string;
  name: string;
  nameEn?: string;
  slug: string;
  parentId: string | null;
  depth: number;
  path: string[];
  order: number;
  imageUrl: string | null;
  iconUrl: string | null;
  productCount: number;
  isActive: boolean;
  applicableThemes?: string[];
  createdAt: Date;
}

// ---- Brand ----
export interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string;
  isActive: boolean;
  createdAt: Date;
}

// ---- Banner ----
export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  mobileImageUrl: string;
  linkUrl: string;
  position: 'main_top' | 'main_middle' | 'sidebar' | 'popup';
  order: number;
  isActive: boolean;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
}

// ---- Theme ----
export interface ThemeDefinition {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  previewImageUrl?: string;
  cssVariables: Record<string, string>;
  layoutConfig: ThemeLayoutConfig;
  features: string[];
  isActive: boolean;
  order: number;
}

export interface ThemeLayoutConfig {
  headerType: 'type-a' | 'type-b' | 'type-c';
  footerType: 'standard' | 'minimal' | 'expanded';
  productCardStyle: 'grid' | 'list' | 'magazine';
  bannerStyle: 'slider' | 'hero' | 'grid';
  categoryNavStyle: 'sidebar' | 'topbar' | 'mega-menu';
  showBrandFilter: boolean;
  showPriceFilter: boolean;
  showSizeFilter: boolean;
  showColorFilter: boolean;
  productsPerRow: { desktop: number; tablet: number; mobile: number };
  productsPerPage: number;
}

// ---- Board ----
export interface Board {
  id: string;
  name: string;
  slug: string;
  type: BoardType;
  isActive: boolean;
  allowComments: boolean;
  requireLogin: boolean;
  postsPerPage: number;
  createdAt: Date;
}

export interface BoardPost {
  id: string;
  boardId: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  attachments: { url: string; name: string; size: number }[];
  viewCount: number;
  isPinned: boolean;
  isSecret: boolean;
  productId: string | null;
  rating: number | null;
  status: 'published' | 'hidden' | 'deleted';
  createdAt: Date;
  updatedAt: Date;
}

// ---- Franchise Application ----
export interface FranchiseApplication {
  id: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  businessName: string;
  businessNumber: string;
  desiredTheme: string;
  desiredMallName: string;
  desiredSubdomain: string;
  industry: string;
  message: string;
  status: FranchiseApplicationStatus;
  adminNotes: string;
  reviewedBy: string | null;
  mallId: string | null;
  parentMallId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ---- Franchise Settings ----
export interface FranchiseSettings {
  showHeadquartersProducts: boolean;
  showNetworkProducts: boolean;
  shareOwnProducts: boolean;
  hiddenProductIds: string[];
  customCommissionRate: number | null;
}

// ---- Shared Product (네트워크 공유 상품 참조) ----
export interface SharedProduct {
  id: string;
  sourceProductId: string;
  sourceMallId: string;
  sourceMallName: string;
  sourceType: 'headquarters' | 'franchisee';
  isHidden: boolean;
  addedAt: Date;
}

// ---- Settlement ----
export interface Settlement {
  id: string;
  mallId: string;
  mallName: string;
  period: { startDate: Date; endDate: Date };
  totalSales: number;
  totalCommission: number;
  totalReferralCommission: number;
  totalSettlement: number;
  orderCount: number;
  orderIds: string[];
  status: SettlementStatus;
  bankInfo: BankInfo;
  processedAt: Date | null;
  taxInvoiceId: string | null;
  settlementReportId: string | null;
  createdAt: Date;
}

// ---- Supplier ----
export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  businessNumber: string;
  address: string;
  bankInfo: BankInfo;
  commissionRate: number;
  isActive: boolean;
  approvalStatus: SupplierApprovalStatus;
  approvedBy: string | null;
  userId: string;
  assignedMallIds: string[];
  productCount: number;
  totalSales: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============ 분양 요금제 ============

export type PlanId = 'free' | 'starter' | 'business' | 'enterprise';

export interface PricingPlan {
  id: PlanId;
  name: string;
  nameEn: string;
  monthlyPrice: number;        // 월 요금 (원)
  yearlyMonthlyPrice: number;  // 연결제 시 월 요금
  yearlyDiscount: number;      // 연결제 할인율 (%)
  salesCommission: number;     // 판매 수수료율 (%)
  maxProducts: number | null;  // null = 무제한
  storageGB: number;
  availableThemes: number | null; // null = 전체+커스텀
  customDomains: number | null;   // null = 무제한
  maxAdmins: number | null;       // null = 무제한
  features: PlanFeature[];
  mainMarketExposure: 'basic' | 'recommended' | 'premium' | 'top';
  pgPaymentAuth: PGPaymentAuth;
  allowSubFranchise: boolean;
  marketingTools: boolean;
  apiAccess: boolean;
  isPopular?: boolean;          // UI에서 "인기" 뱃지 표시
}

export interface PlanFeature {
  label: string;
  included: boolean;
}

export interface FranchiseCondition {
  planId: PlanId;
  requireBusinessLicense: boolean;
  requireIdentityVerification: boolean;
  requiredDocuments: string[];
  approvalType: 'instant' | 'review';  // instant = 즉시 개설, review = 심사 후
  approvalDays: number;                 // 심사 소요일
}

// ============ D-1: 포인트 시스템 ============

export type PointTransactionType = 'earned' | 'used' | 'expired' | 'admin_granted' | 'admin_deducted';

export interface PointTransaction {
  id: string;
  userId: string;
  mallId: string;
  orderId: string | null;
  type: PointTransactionType;
  amount: number;       // 양수=적립/지급, 음수=사용/차감
  balance: number;      // 트랜잭션 후 잔액
  description: string;
  expiresAt: Date | null;
  createdBy: string;    // userId or 'system'
  createdAt: Date;
}

export interface PointSettings {
  enabled: boolean;
  earningRate: number;           // % (예: 1 = 1%)
  minOrderAmount: number;        // 최소 주문금액
  maxEarningPerOrder: number | null; // 주문당 최대 적립 (null=무제한)
  expirationDays: number;        // 만료일수 (0=무제한)
  allowPartialUse: boolean;      // 부분사용 허용
  minUsageAmount: number;        // 최소 사용금액
}

// ============ D-2: 회원등급 시스템 ============

export interface MemberGrade {
  id: string;
  mallId: string;
  name: string;         // 일반, 실버, 골드, VIP, VVIP
  level: number;        // 1~5
  minPurchaseAmount: number;     // 승급 기준 구매금액
  evaluationPeriodDays: number;  // 평가 기간 (예: 90일)
  benefits: GradeBenefits;
  color: string;        // 배지 색상
  order: number;
  isActive: boolean;
  createdAt: Date;
}

export interface GradeBenefits {
  extraPointRate: number;         // 추가 포인트 적립률 (%)
  extraDiscountRate: number;      // 추가 할인율 (%)
  freeShippingThreshold: number;  // 무료배송 기준금액
}

// ============ D-3: 쿠폰 시스템 ============

export type CouponType = 'percentage' | 'fixed' | 'free_shipping';
export type CouponScope = 'all' | 'category' | 'product';

export interface Coupon {
  id: string;
  code: string;
  name: string;
  type: CouponType;
  discountValue: number;           // % 또는 원
  maxDiscountAmount: number | null; // 최대 할인액 (정률 쿠폰용)
  minPurchaseAmount: number;       // 최소 구매금액
  mallId: string | null;           // null = 플랫폼 쿠폰
  scope: CouponScope;
  scopeTargetIds: string[];        // 카테고리 또는 상품 ID
  usageLimitPerUser: number | null;
  totalUsageLimit: number | null;
  usageCount: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface CouponUsage {
  id: string;
  couponId: string;
  couponCode: string;
  userId: string;
  orderId: string;
  mallId: string;
  discountAmount: number;
  usedAt: Date;
}

export interface UserCoupon {
  couponId: string;
  coupon?: Coupon;
  downloadedAt: Date;
  usedAt: Date | null;
  usedOrderId: string | null;
}

// ============ D-4: 배송 관리 ============

export interface ShippingZone {
  id: string;
  mallId: string;
  name: string;          // 서울/경기, 지방, 제주/도서산간
  regions: string[];     // 우편번호 prefix 또는 지역명
  baseFee: number;
  freeShippingThreshold: number;
  order: number;
  isActive: boolean;
}

export interface ShippingCarrier {
  id: string;
  code: string;          // cj, hanjin, lotte, logen, post
  name: string;
  trackingUrl: string;   // {invoice} 플레이스홀더
  isActive: boolean;
  order: number;
}

export interface ShippingTemplate {
  id: string;
  mallId: string;
  name: string;
  zones: Record<string, { fee: number; freeThreshold: number }>;
  isDefault: boolean;
  createdAt: Date;
}

// ============ D-5: 엑셀 대량처리 ============

export type BulkOperationType = 'product_upload' | 'product_export' | 'order_export' | 'member_export' | 'tracking_upload';

export interface BulkOperation {
  id: string;
  type: BulkOperationType;
  userId: string;
  mallId: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalRows: number;
  processedRows: number;
  errorRows: number;
  errors: Array<{ row: number; field?: string; message: string }>;
  downloadUrl: string | null;
  createdAt: Date;
  completedAt: Date | null;
}

// ============ D-6: 공급사 포탈 (B2B) ============

export type SupplierApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface SupplierApplication {
  id: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  businessName: string;
  businessNumber: string;
  productCategories: string[];
  sampleProducts: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
  adminNotes: string;
  supplierId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierSettlement {
  id: string;
  supplierId: string;
  supplierName: string;
  period: { startDate: Date; endDate: Date };
  totalSales: number;
  totalCommission: number;
  totalSettlement: number;
  orderCount: number;
  orderIds: string[];
  status: SettlementStatus;
  bankInfo: BankInfo;
  processedAt: Date | null;
  createdAt: Date;
}

// ============ D-7: SMS/알림 시스템 ============

export type NotificationType = 'sms' | 'alimtalk' | 'email';
export type NotificationStatus = 'pending' | 'sent' | 'failed';
export type NotificationTemplateKey = 'order_confirm' | 'payment_complete' | 'shipping' | 'delivery' | 'cancellation' | 'point_earned' | 'grade_upgraded';

export interface NotificationSettings {
  mallId: string;
  smsEnabled: boolean;
  alimtalkEnabled: boolean;
  emailEnabled: boolean;
  templates: Record<NotificationTemplateKey, { sms: boolean; alimtalk: boolean; email: boolean }>;
  provider: 'nhncloud' | 'aligo' | 'coolsms';
  apiKey: string;
  apiSecret: string;
  senderNumber: string;
  updatedAt: Date;
}

export interface NotificationHistory {
  id: string;
  type: NotificationType;
  templateKey: NotificationTemplateKey;
  userId: string;
  recipient: string;
  mallId: string;
  orderId: string | null;
  status: NotificationStatus;
  message: string;
  errorMessage: string | null;
  sentAt: Date | null;
  createdAt: Date;
}

export interface NotificationTemplateData {
  id: string;
  key: NotificationTemplateKey;
  name: string;
  type: NotificationType;
  subject: string;
  content: string;          // {{변수}} 포함
  variables: string[];
  isActive: boolean;
  mallId: string | null;    // null = 플랫폼 기본
  createdAt: Date;
}

// ============ D-8: 세금계산서/정산서 ============

export type TaxInvoiceStatus = 'pending' | 'issued' | 'failed' | 'cancelled';

export interface TaxInvoice {
  id: string;
  settlementId: string;
  mallId: string;
  mallName: string;
  issuerInfo: BusinessInfo;      // 발행자 (플랫폼)
  recipientInfo: BusinessInfo;   // 수신자 (몰)
  period: { startDate: Date; endDate: Date };
  supplyAmount: number;          // 공급가액
  taxAmount: number;             // 세액
  totalAmount: number;           // 합계
  status: TaxInvoiceStatus;
  externalId: string | null;     // 팝빌/바로빌 외부 ID
  issueDate: Date | null;
  pdfUrl: string | null;
  createdAt: Date;
}

export interface SettlementReport {
  id: string;
  settlementId: string;
  mallId: string;
  mallName: string;
  period: { startDate: Date; endDate: Date };
  reportData: SettlementReportData;
  pdfUrl: string | null;
  generatedAt: Date;
  createdAt: Date;
}

export interface SettlementReportData {
  totalSales: number;
  totalOrders: number;
  platformCommission: number;
  pgFees: number;
  referralCommission: number;
  netAmount: number;
  orderBreakdown: Array<{
    orderId: string;
    orderNumber: string;
    productName: string;
    amount: number;
    commission: number;
    date: Date;
  }>;
}
