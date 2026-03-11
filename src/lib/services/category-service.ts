// ============================================
// MarketShare - Category Service
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
  orderBy,
  Timestamp,
  DocumentSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Category } from '@/types';

// ---------- Helper ----------

function categoryFromDoc(docSnap: DocumentSnapshot): Category {
  const data = docSnap.data()!;
  return {
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt?.toDate() ?? new Date(),
  } as Category;
}

// ---------- Get Global Categories ----------

export async function getGlobalCategories(): Promise<Category[]> {
  try {
    const q = query(
      collection(db, 'categories_global'),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(categoryFromDoc);
  } catch (error: any) {
    throw new Error('카테고리 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Get Mall Categories ----------

export async function getMallCategories(mallId: string): Promise<Category[]> {
  try {
    const q = query(
      collection(db, 'malls', mallId, 'categories'),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(categoryFromDoc);
  } catch (error: any) {
    throw new Error('몰 카테고리 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Create Category ----------

export async function createCategory(
  data: Omit<Category, 'id' | 'createdAt'>,
  mallId?: string
): Promise<string> {
  try {
    const categoryData = {
      ...data,
      productCount: 0,
      createdAt: serverTimestamp(),
    };

    const targetCollection = mallId
      ? collection(db, 'malls', mallId, 'categories')
      : collection(db, 'categories_global');

    const docRef = await addDoc(targetCollection, categoryData);
    return docRef.id;
  } catch (error: any) {
    throw new Error('카테고리 생성 중 오류가 발생했습니다.');
  }
}

// ---------- Update Category ----------

export async function updateCategory(
  categoryId: string,
  data: Partial<Category>,
  mallId?: string
): Promise<void> {
  try {
    const updateData: Record<string, any> = { ...data };

    // Remove immutable fields
    delete updateData.id;
    delete updateData.createdAt;

    const targetDoc = mallId
      ? doc(db, 'malls', mallId, 'categories', categoryId)
      : doc(db, 'categories_global', categoryId);

    await updateDoc(targetDoc, updateData);
  } catch (error: any) {
    throw new Error('카테고리 수정 중 오류가 발생했습니다.');
  }
}

// ---------- Delete Category ----------

export async function deleteCategory(
  categoryId: string,
  mallId?: string
): Promise<void> {
  try {
    const targetDoc = mallId
      ? doc(db, 'malls', mallId, 'categories', categoryId)
      : doc(db, 'categories_global', categoryId);

    // Verify category exists
    const docSnap = await getDoc(targetDoc);
    if (!docSnap.exists()) {
      throw new Error('카테고리를 찾을 수 없습니다.');
    }

    // Check if category has products
    const category = categoryFromDoc(docSnap);
    if (category.productCount > 0) {
      throw new Error('상품이 등록된 카테고리는 삭제할 수 없습니다. 먼저 상품을 이동해 주세요.');
    }

    await deleteDoc(targetDoc);
  } catch (error: any) {
    if (
      error.message === '카테고리를 찾을 수 없습니다.' ||
      error.message.includes('상품이 등록된 카테고리')
    ) {
      throw error;
    }
    throw new Error('카테고리 삭제 중 오류가 발생했습니다.');
  }
}

// ---------- Reorder Categories ----------

export async function reorderCategories(
  mallId: string,
  orderedIds: string[]
): Promise<void> {
  try {
    const batch = writeBatch(db);

    orderedIds.forEach((categoryId, index) => {
      const categoryRef = doc(db, 'malls', mallId, 'categories', categoryId);
      batch.update(categoryRef, { order: index });
    });

    await batch.commit();
  } catch (error: any) {
    throw new Error('카테고리 순서 변경 중 오류가 발생했습니다.');
  }
}
