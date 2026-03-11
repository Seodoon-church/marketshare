// ============================================
// MarketShare - Product Service
// ============================================

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  Timestamp,
  DocumentSnapshot,
  increment,
  serverTimestamp,
  QueryConstraint,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Product, ProductStatus, Mall } from '@/types';
import { getSharedProductsWithData } from '@/lib/services/shared-product-service';

// ---------- Helper ----------

function productFromDoc(docSnap: DocumentSnapshot): Product {
  const data = docSnap.data()!;
  return {
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
    publishedAt: data.publishedAt?.toDate() ?? null,
  } as Product;
}

// ---------- Filters ----------

export interface ProductFilters {
  categoryId?: string;
  mallId?: string;
  status?: ProductStatus;
  sortBy?: 'createdAt' | 'price' | 'salesCount' | 'name';
  sortDirection?: 'asc' | 'desc';
  limit?: number;
  startAfterDoc?: DocumentSnapshot;
}

export interface ProductListResult {
  products: Product[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}

// ---------- Get Products (Aggregate) ----------

export async function getProducts(
  filters: ProductFilters = {}
): Promise<ProductListResult> {
  try {
    const constraints: QueryConstraint[] = [];

    if (filters.categoryId) {
      constraints.push(where('categoryId', '==', filters.categoryId));
    }
    if (filters.mallId) {
      constraints.push(where('mallId', '==', filters.mallId));
    }
    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }

    const sortField = filters.sortBy ?? 'createdAt';
    const sortDir = filters.sortDirection ?? 'desc';
    constraints.push(orderBy(sortField, sortDir));

    const pageSize = filters.limit ?? 20;
    constraints.push(firestoreLimit(pageSize + 1));

    if (filters.startAfterDoc) {
      constraints.push(startAfter(filters.startAfterDoc));
    }

    const q = query(collection(db, 'products_aggregate'), ...constraints);
    const snapshot = await getDocs(q);

    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const resultDocs = hasMore ? docs.slice(0, pageSize) : docs;

    return {
      products: resultDocs.map(productFromDoc),
      lastDoc: resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null,
      hasMore,
    };
  } catch (error: any) {
    throw new Error('상품 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Get Product By ID ----------

export async function getProductById(productId: string): Promise<Product | null> {
  try {
    const docSnap = await getDoc(doc(db, 'products_aggregate', productId));
    if (!docSnap.exists()) return null;
    return productFromDoc(docSnap);
  } catch (error: any) {
    throw new Error('상품 정보를 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Get Mall Products ----------

export async function getMallProducts(
  mallId: string,
  filters: Omit<ProductFilters, 'mallId'> = {}
): Promise<ProductListResult> {
  try {
    const constraints: QueryConstraint[] = [];

    if (filters.categoryId) {
      constraints.push(where('categoryId', '==', filters.categoryId));
    }
    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }

    const sortField = filters.sortBy ?? 'createdAt';
    const sortDir = filters.sortDirection ?? 'desc';
    constraints.push(orderBy(sortField, sortDir));

    const pageSize = filters.limit ?? 20;
    constraints.push(firestoreLimit(pageSize + 1));

    if (filters.startAfterDoc) {
      constraints.push(startAfter(filters.startAfterDoc));
    }

    const q = query(
      collection(db, 'malls', mallId, 'products'),
      ...constraints
    );
    const snapshot = await getDocs(q);

    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const resultDocs = hasMore ? docs.slice(0, pageSize) : docs;

    return {
      products: resultDocs.map(productFromDoc),
      lastDoc: resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null,
      hasMore,
    };
  } catch (error: any) {
    throw new Error('몰 상품 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Create Product ----------

export async function createProduct(
  mallId: string,
  data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const productData = {
      ...data,
      mallId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      publishedAt: data.status === 'active' ? serverTimestamp() : null,
      viewCount: 0,
      salesCount: 0,
      reviewCount: 0,
      averageRating: 0,
    };

    // Write to mall sub-collection
    const docRef = await addDoc(
      collection(db, 'malls', mallId, 'products'),
      productData
    );

    // Also write to aggregate collection for global queries
    const aggregateData = {
      ...productData,
      mallId,
    };
    await addDoc(collection(db, 'products_aggregate'), {
      ...aggregateData,
      originalId: docRef.id,
    });

    return docRef.id;
  } catch (error: any) {
    throw new Error('상품 등록 중 오류가 발생했습니다.');
  }
}

// ---------- Update Product ----------

export async function updateProduct(
  mallId: string,
  productId: string,
  data: Partial<Product>
): Promise<void> {
  try {
    const updateData: Record<string, any> = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    // Remove immutable fields
    delete updateData.id;
    delete updateData.createdAt;

    // Update mall sub-collection
    await updateDoc(
      doc(db, 'malls', mallId, 'products', productId),
      updateData
    );

    // Update aggregate collection
    const aggQuery = query(
      collection(db, 'products_aggregate'),
      where('originalId', '==', productId),
      where('mallId', '==', mallId),
      firestoreLimit(1)
    );
    const aggSnapshot = await getDocs(aggQuery);

    if (!aggSnapshot.empty) {
      await updateDoc(aggSnapshot.docs[0].ref, updateData);
    }
  } catch (error: any) {
    throw new Error('상품 수정 중 오류가 발생했습니다.');
  }
}

// ---------- Delete Product ----------

export async function deleteProduct(
  mallId: string,
  productId: string
): Promise<void> {
  try {
    // Delete from mall sub-collection
    await deleteDoc(doc(db, 'malls', mallId, 'products', productId));

    // Delete from aggregate collection
    const aggQuery = query(
      collection(db, 'products_aggregate'),
      where('originalId', '==', productId),
      where('mallId', '==', mallId),
      firestoreLimit(1)
    );
    const aggSnapshot = await getDocs(aggQuery);

    if (!aggSnapshot.empty) {
      await deleteDoc(aggSnapshot.docs[0].ref);
    }
  } catch (error: any) {
    throw new Error('상품 삭제 중 오류가 발생했습니다.');
  }
}

// ---------- Get Mall Product By ID ----------

export async function getMallProductById(
  mallId: string,
  productId: string
): Promise<Product | null> {
  try {
    const docSnap = await getDoc(doc(db, 'malls', mallId, 'products', productId));
    if (!docSnap.exists()) return null;
    return productFromDoc(docSnap);
  } catch (error: any) {
    throw new Error('상품 정보를 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Import Product From Platform ----------

export async function importProductFromPlatform(
  mallId: string,
  sourceProduct: Product
): Promise<string> {
  try {
    const productData: Record<string, any> = {
      ...sourceProduct,
      mallId,
      isFromPlatform: true,
      salesCount: 0,
      viewCount: 0,
      reviewCount: 0,
      averageRating: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    delete productData.id;

    const docRef = await addDoc(
      collection(db, 'malls', mallId, 'products'),
      productData
    );
    return docRef.id;
  } catch (error: any) {
    throw new Error('상품 가져오기 중 오류가 발생했습니다.');
  }
}

// ---------- Search Products ----------

export async function searchProducts(
  queryText: string,
  filters: ProductFilters = {}
): Promise<ProductListResult> {
  try {
    const constraints: QueryConstraint[] = [];

    // Firestore does not support full-text search natively.
    // Use a >= / < range query on the 'name' field for prefix matching.
    const searchEnd = queryText + '\uf8ff';
    constraints.push(where('name', '>=', queryText));
    constraints.push(where('name', '<=', searchEnd));

    if (filters.categoryId) {
      constraints.push(where('categoryId', '==', filters.categoryId));
    }
    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }

    const pageSize = filters.limit ?? 20;
    constraints.push(firestoreLimit(pageSize + 1));

    if (filters.startAfterDoc) {
      constraints.push(startAfter(filters.startAfterDoc));
    }

    const q = query(collection(db, 'products_aggregate'), ...constraints);
    const snapshot = await getDocs(q);

    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const resultDocs = hasMore ? docs.slice(0, pageSize) : docs;

    return {
      products: resultDocs.map(productFromDoc),
      lastDoc: resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null,
      hasMore,
    };
  } catch (error: any) {
    throw new Error('상품 검색 중 오류가 발생했습니다.');
  }
}

// ---------- Get Related Products ----------

export async function getRelatedProducts(
  categoryId: string,
  excludeId: string,
  maxResults: number = 8
): Promise<Product[]> {
  try {
    // Fetch one extra to account for the excluded product
    const q = query(
      collection(db, 'products_aggregate'),
      where('categoryId', '==', categoryId),
      where('status', '==', 'active'),
      orderBy('salesCount', 'desc'),
      firestoreLimit(maxResults + 1)
    );
    const snapshot = await getDocs(q);

    return snapshot.docs
      .map(productFromDoc)
      .filter((p) => p.id !== excludeId)
      .slice(0, maxResults);
  } catch (error: any) {
    throw new Error('관련 상품을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Increment Sales Count ----------

export async function incrementSalesCount(
  mallId: string,
  productId: string,
  count: number
): Promise<void> {
  try {
    // Update mall sub-collection (increment is already atomic)
    await updateDoc(doc(db, 'malls', mallId, 'products', productId), {
      salesCount: increment(count),
      updatedAt: serverTimestamp(),
    });

    // Update aggregate collection with transaction to prevent race conditions
    const aggQuery = query(
      collection(db, 'products_aggregate'),
      where('originalId', '==', productId),
      where('mallId', '==', mallId),
      firestoreLimit(1)
    );
    const aggSnapshot = await getDocs(aggQuery);

    if (!aggSnapshot.empty) {
      const aggRef = aggSnapshot.docs[0].ref;

      await runTransaction(db, async (transaction) => {
        const aggDoc = await transaction.get(aggRef);
        if (!aggDoc.exists()) return;

        const currentSalesCount = aggDoc.data().salesCount ?? 0;
        transaction.update(aggRef, {
          salesCount: currentSalesCount + count,
          updatedAt: serverTimestamp(),
        });
      });
    }
  } catch (error: any) {
    throw new Error('판매 수량 업데이트 중 오류가 발생했습니다.');
  }
}

// ---------- Get Mall Display Products (분양몰 통합 상품 조회) ----------
// Returns own products + shared products (from HQ and network) based on franchise settings

export async function getMallDisplayProducts(
  mall: Mall,
  filters: Omit<ProductFilters, 'mallId'> = {}
): Promise<Product[]> {
  try {
    // 1. Always load own products
    const ownResult = await getMallProducts(mall.id, { ...filters, status: 'active' });
    const allProducts: Product[] = [...ownResult.products];

    // 2. If this is a franchisee mall, load shared products
    if (mall.parentMallId && mall.franchiseSettings) {
      // Load HQ products
      if (mall.franchiseSettings.showHeadquartersProducts) {
        const hqShared = await getSharedProductsWithData(mall.id, 'headquarters');
        const hiddenIds = mall.franchiseSettings.hiddenProductIds ?? [];
        for (const sp of hqShared) {
          if (!sp.isHidden && sp.product && sp.product.status === 'active' && !hiddenIds.includes(sp.sourceProductId)) {
            allProducts.push({ ...sp.product, sourceType: 'headquarters', sourceMallId: sp.sourceMallId, sourceProductId: sp.sourceProductId });
          }
        }
      }

      // Load network products (from other franchisees)
      if (mall.franchiseSettings.showNetworkProducts) {
        const networkShared = await getSharedProductsWithData(mall.id, 'franchisee');
        for (const sp of networkShared) {
          if (!sp.isHidden && sp.product && sp.product.status === 'active') {
            allProducts.push({ ...sp.product, sourceType: 'franchisee', sourceMallId: sp.sourceMallId, sourceProductId: sp.sourceProductId });
          }
        }
      }
    }

    // 3. If this is a HQ mall, load franchisee products (cooperative selling)
    if (mall.childMallIds && mall.childMallIds.length > 0) {
      // Load products shared by franchisees to this HQ
      const franchiseeShared = await getSharedProductsWithData(mall.id, 'franchisee');
      for (const sp of franchiseeShared) {
        if (!sp.isHidden && sp.product && sp.product.status === 'active') {
          allProducts.push({ ...sp.product, sourceType: 'franchisee', sourceMallId: sp.sourceMallId, sourceProductId: sp.sourceProductId });
        }
      }
    }

    // Apply category filter if provided
    let filtered = allProducts;
    if (filters.categoryId) {
      filtered = filtered.filter(p => p.categoryId === filters.categoryId);
    }

    // Apply sorting
    const sortField = filters.sortBy ?? 'createdAt';
    const sortDir = filters.sortDirection ?? 'desc';
    filtered.sort((a, b) => {
      const aVal = a[sortField as keyof Product] as any;
      const bVal = b[sortField as keyof Product] as any;
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    // Apply limit
    const limit = filters.limit ?? 100;
    return filtered.slice(0, limit);
  } catch (error: any) {
    throw new Error('몰 상품 통합 조회 중 오류가 발생했습니다.');
  }
}
