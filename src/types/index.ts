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
  description: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  isClosedMall: boolean;
  requireMemberApproval: boolean;
  hidePriceForNonMembers: boolean;
  productCount: number;
  orderCount: number;
  totalRevenue: number;
  parentMallId: string | null;
  childMallIds: string[];
  createdAt: Date;
  updatedAt: Date;
  franchiseStartDate: Date;
  franchiseEndDate: Date | null;
}

export interface BusinessInfo {
  businessName: string;
  businessNumber: string;
  representative: string;
  address: string;
  phone: string;
  email: string;
  onlineBusinessNumber?: string;
}

export interface BankInfo {
  bank: string;
  accountNumber: string;
  holder: string;
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
  createdAt: Date;
  updatedAt: Date;
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
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}
