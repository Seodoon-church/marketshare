// ============================================
// MarketShare - Custom React Hooks
// ============================================

// Auth
export { useAuth } from './useAuth';

// Data fetching - Products
export { useProducts, useProduct } from './useProducts';

// Data fetching - Orders
export { useUserOrders, useMallOrders, useOrder } from './useOrders';

// Data fetching - Malls
export { useMall, useMallBySlug, useMalls, useMallStats } from './useMall';

// Data fetching - Categories
export { useGlobalCategories, useMallCategories } from './useCategories';

// Search
export { useSearch } from './useSearch';

// Wishlist
export { useWishlist } from './useWishlist';

// Utilities
export { useInfiniteScroll } from './useInfiniteScroll';
export { useDebounce } from './useDebounce';
