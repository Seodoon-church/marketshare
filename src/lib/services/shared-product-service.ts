// ============================================
// MarketShare - Shared Product Service
// 프랜차이즈 네트워크 상품 공유 관리
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
  serverTimestamp,
  DocumentSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { SharedProduct, Product } from '@/types';

// ---------- Helper ----------

function sharedProductFromDoc(docSnap: DocumentSnapshot): SharedProduct {
  const data = docSnap.data()!;
  return {
    ...data,
    id: docSnap.id,
    addedAt: data.addedAt?.toDate() ?? new Date(),
  } as SharedProduct;
}

// ---------- Get Shared Products for a Mall ----------
// Returns the shared product references (not the actual product data)

export async function getSharedProducts(
  mallId: string,
  sourceType?: 'headquarters' | 'franchisee'
): Promise<SharedProduct[]> {
  try {
    const constraints = [];

    if (sourceType) {
      constraints.push(where('sourceType', '==', sourceType));
    }

    constraints.push(orderBy('addedAt', 'desc'));

    const q = query(
      collection(db, 'malls', mallId, 'shared_products'),
      ...constraints
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(sharedProductFromDoc);
  } catch (error: any) {
    throw new Error('공유 상품 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Get Shared Products with Full Product Data ----------
// Returns shared refs merged with actual product data from source malls

export async function getSharedProductsWithData(
  mallId: string,
  sourceType?: 'headquarters' | 'franchisee'
): Promise<(SharedProduct & { product: Product | null })[]> {
  try {
    const sharedProducts = await getSharedProducts(mallId, sourceType);

    const results = await Promise.all(
      sharedProducts.map(async (shared) => {
        try {
          const productSnap = await getDoc(
            doc(db, 'malls', shared.sourceMallId, 'products', shared.sourceProductId)
          );

          if (!productSnap.exists()) {
            return { ...shared, product: null };
          }

          const data = productSnap.data()!;
          const product: Product = {
            ...data,
            id: productSnap.id,
            createdAt: data.createdAt?.toDate() ?? new Date(),
            updatedAt: data.updatedAt?.toDate() ?? new Date(),
            publishedAt: data.publishedAt?.toDate() ?? null,
          } as Product;

          return { ...shared, product };
        } catch {
          // Source product may have been deleted or access denied
          return { ...shared, product: null };
        }
      })
    );

    return results;
  } catch (error: any) {
    throw new Error('공유 상품 상세 정보를 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Share Product to Target Mall ----------
// Called when HQ shares a product to a franchisee mall, or when franchisee product is shared to network

export async function shareProductToMall(
  targetMallId: string,
  sourceProductId: string,
  sourceMallId: string,
  sourceMallName: string,
  sourceType: 'headquarters' | 'franchisee'
): Promise<string> {
  try {
    // Check if already shared (avoid duplicates)
    const existingQuery = query(
      collection(db, 'malls', targetMallId, 'shared_products'),
      where('sourceProductId', '==', sourceProductId),
      where('sourceMallId', '==', sourceMallId)
    );
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      // Already shared - return existing document ID
      return existingSnapshot.docs[0].id;
    }

    // Create shared_products document in target mall
    const docRef = await addDoc(
      collection(db, 'malls', targetMallId, 'shared_products'),
      {
        sourceProductId,
        sourceMallId,
        sourceMallName,
        sourceType,
        isHidden: false,
        addedAt: serverTimestamp(),
      }
    );

    return docRef.id;
  } catch (error: any) {
    throw new Error('상품 공유 중 오류가 발생했습니다.');
  }
}

// ---------- Share All Products to New Franchisee ----------
// Called when a new franchisee mall is created - bulk share all HQ products

export async function syncSharedProductsForNewFranchisee(
  parentMallId: string,
  parentMallName: string,
  childMallId: string
): Promise<number> {
  try {
    // 1. Get all active products from parent mall
    const productsQuery = query(
      collection(db, 'malls', parentMallId, 'products'),
      where('status', '==', 'active')
    );
    const productsSnapshot = await getDocs(productsQuery);

    if (productsSnapshot.empty) return 0;

    const productDocs = productsSnapshot.docs;
    let totalShared = 0;

    // 2. Use writeBatch for efficiency (max 500 per batch)
    const BATCH_LIMIT = 500;

    for (let i = 0; i < productDocs.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const chunk = productDocs.slice(i, i + BATCH_LIMIT);

      for (const productDoc of chunk) {
        const newDocRef = doc(
          collection(db, 'malls', childMallId, 'shared_products')
        );
        batch.set(newDocRef, {
          sourceProductId: productDoc.id,
          sourceMallId: parentMallId,
          sourceMallName: parentMallName,
          sourceType: 'headquarters',
          isHidden: false,
          addedAt: serverTimestamp(),
        });
      }

      await batch.commit();
      totalShared += chunk.length;
    }

    return totalShared;
  } catch (error: any) {
    throw new Error('가맹점 상품 동기화 중 오류가 발생했습니다.');
  }
}

// ---------- Toggle Shared Product Visibility ----------
// Franchisee can hide/show HQ products

export async function toggleSharedProductVisibility(
  mallId: string,
  sharedProductId: string,
  isHidden: boolean
): Promise<void> {
  try {
    await updateDoc(
      doc(db, 'malls', mallId, 'shared_products', sharedProductId),
      { isHidden }
    );
  } catch (error: any) {
    throw new Error('공유 상품 표시 상태 변경 중 오류가 발생했습니다.');
  }
}

// ---------- Bulk Toggle Visibility ----------
// Hide or show all shared products from a specific source

export async function bulkToggleVisibility(
  mallId: string,
  sourceType: 'headquarters' | 'franchisee',
  isHidden: boolean
): Promise<void> {
  try {
    const q = query(
      collection(db, 'malls', mallId, 'shared_products'),
      where('sourceType', '==', sourceType)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return;

    const BATCH_LIMIT = 500;
    const docs = snapshot.docs;

    for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + BATCH_LIMIT);

      for (const docSnap of chunk) {
        batch.update(docSnap.ref, { isHidden });
      }

      await batch.commit();
    }
  } catch (error: any) {
    throw new Error('공유 상품 일괄 표시 상태 변경 중 오류가 발생했습니다.');
  }
}

// ---------- Remove Shared Product ----------

export async function removeSharedProduct(
  mallId: string,
  sharedProductId: string
): Promise<void> {
  try {
    await deleteDoc(
      doc(db, 'malls', mallId, 'shared_products', sharedProductId)
    );
  } catch (error: any) {
    throw new Error('공유 상품 제거 중 오류가 발생했습니다.');
  }
}

// ---------- Share Product to All Franchisees ----------
// When HQ adds a new product, share to all child malls

export async function shareProductToAllFranchisees(
  parentMallId: string,
  parentMallName: string,
  childMallIds: string[],
  sourceProductId: string
): Promise<void> {
  try {
    if (childMallIds.length === 0) return;

    const BATCH_LIMIT = 500;

    for (let i = 0; i < childMallIds.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      const chunk = childMallIds.slice(i, i + BATCH_LIMIT);

      for (const childMallId of chunk) {
        const newDocRef = doc(
          collection(db, 'malls', childMallId, 'shared_products')
        );
        batch.set(newDocRef, {
          sourceProductId,
          sourceMallId: parentMallId,
          sourceMallName: parentMallName,
          sourceType: 'headquarters',
          isHidden: false,
          addedAt: serverTimestamp(),
        });
      }

      await batch.commit();
    }
  } catch (error: any) {
    throw new Error('전체 가맹점 상품 공유 중 오류가 발생했습니다.');
  }
}

// ---------- Unshare Product from All Franchisees ----------
// When HQ removes a product from network sharing

export async function unshareProductFromAllFranchisees(
  childMallIds: string[],
  sourceProductId: string
): Promise<void> {
  try {
    if (childMallIds.length === 0) return;

    for (const childMallId of childMallIds) {
      // Find the shared_products reference in each child mall
      const q = query(
        collection(db, 'malls', childMallId, 'shared_products'),
        where('sourceProductId', '==', sourceProductId)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) continue;

      // Use batch to delete (there should typically be only one, but handle multiples)
      const BATCH_LIMIT = 500;
      const docs = snapshot.docs;

      for (let i = 0; i < docs.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + BATCH_LIMIT);

        for (const docSnap of chunk) {
          batch.delete(docSnap.ref);
        }

        await batch.commit();
      }
    }
  } catch (error: any) {
    throw new Error('전체 가맹점 상품 공유 해제 중 오류가 발생했습니다.');
  }
}
