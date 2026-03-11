// ============================================
// MarketShare - Services Barrel Export
// ============================================

// Auth Service
export {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signInWithKakao,
  signInWithNaver,
  signOut,
  resetPassword,
  updateProfile,
  getUserProfile,
} from './auth-service';

// Product Service
export {
  getProducts,
  getProductById,
  getMallProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getRelatedProducts,
  incrementSalesCount,
} from './product-service';
export type { ProductFilters, ProductListResult } from './product-service';

// Order Service
export {
  createOrder,
  getOrderById,
  getUserOrders,
  getMallOrders,
  updateOrderStatus,
  cancelOrder,
  requestRefund,
} from './order-service';
export type { OrderFilters, OrderListResult } from './order-service';

// Mall Service
export {
  getMalls,
  getMallById,
  getMallBySlug,
  createMall,
  updateMall,
  updateMallStatus,
  getMallStats,
} from './mall-service';
export type { MallFilters, MallStats } from './mall-service';

// Category Service
export {
  getGlobalCategories,
  getMallCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from './category-service';

// Upload Service
export {
  validateFile,
  uploadProductImage,
  uploadMallLogo,
  uploadUserAvatar,
  uploadBanner,
  deleteFile,
  getDownloadURL,
} from './upload-service';
export type { FileValidationOptions } from './upload-service';

// Brand Service
export {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
} from './brand-service';
export type { BrandFilters } from './brand-service';

// Settlement Service
export {
  getSettlements,
  getSettlementById,
  createSettlement,
  updateSettlementStatus,
  getMallSettlementSummary,
} from './settlement-service';
export type { SettlementFilters, MallSettlementSummary } from './settlement-service';

// Board Service
export {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  incrementViewCount,
  getComments,
  createComment,
  deleteComment,
  createReview,
  getProductReviews,
} from './board-service';
export type { Comment } from './board-service';

// Grade Service
export {
  getMallGrades,
  getGradeById,
  createGrade,
  updateGrade,
  deleteGrade,
  getUserGrade,
  evaluateUserGrade,
  getUserPurchaseAmount,
  getDefaultGrades,
  initializeDefaultGrades,
} from './grade-service';

// Shipping Service
export {
  getShippingZones,
  createShippingZone,
  updateShippingZone,
  deleteShippingZone,
  getShippingCarriers,
  initializeDefaultZones,
  initializeDefaultCarriers,
  detectShippingZone,
  calculateShippingFee,
  getTrackingUrl,
  getShippingTemplates,
  createShippingTemplate,
} from './shipping-service';
