// ============================================
// MarketShare - Brand Service
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
  Timestamp,
  DocumentSnapshot,
  serverTimestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Brand } from '@/types';

// ---------- Helper ----------

function brandFromDoc(docSnap: DocumentSnapshot): Brand {
  const data = docSnap.data()!;
  return {
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt?.toDate() ?? new Date(),
  } as Brand;
}

// ---------- Filters ----------

export interface BrandFilters {
  isActive?: boolean;
  sortBy?: 'name' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
  limit?: number;
}

// ---------- Get Brands ----------

export async function getBrands(filters: BrandFilters = {}): Promise<Brand[]> {
  try {
    const constraints: QueryConstraint[] = [];

    if (filters.isActive !== undefined) {
      constraints.push(where('isActive', '==', filters.isActive));
    }

    const sortField = filters.sortBy ?? 'name';
    const sortDir = filters.sortDirection ?? 'asc';
    constraints.push(orderBy(sortField, sortDir));

    if (filters.limit) {
      constraints.push(firestoreLimit(filters.limit));
    }

    const q = query(collection(db, 'brands'), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(brandFromDoc);
  } catch (error: any) {
    throw new Error('브랜드 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Get Brand By ID ----------

export async function getBrandById(brandId: string): Promise<Brand | null> {
  try {
    const docSnap = await getDoc(doc(db, 'brands', brandId));
    if (!docSnap.exists()) return null;
    return brandFromDoc(docSnap);
  } catch (error: any) {
    throw new Error('브랜드 정보를 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Create Brand ----------

export async function createBrand(
  data: Omit<Brand, 'id' | 'createdAt'>
): Promise<string> {
  try {
    // Check slug uniqueness
    const existingQuery = query(
      collection(db, 'brands'),
      where('slug', '==', data.slug),
      firestoreLimit(1)
    );
    const existingSnap = await getDocs(existingQuery);

    if (!existingSnap.empty) {
      throw new Error('이미 사용 중인 브랜드 슬러그입니다.');
    }

    const brandData = {
      ...data,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'brands'), brandData);
    return docRef.id;
  } catch (error: any) {
    if (error.message === '이미 사용 중인 브랜드 슬러그입니다.') {
      throw error;
    }
    throw new Error('브랜드 등록 중 오류가 발생했습니다.');
  }
}

// ---------- Update Brand ----------

export async function updateBrand(
  brandId: string,
  data: Partial<Brand>
): Promise<void> {
  try {
    const updateData: Record<string, any> = { ...data };

    // Remove immutable fields
    delete updateData.id;
    delete updateData.createdAt;

    // If slug is being changed, verify uniqueness
    if (updateData.slug) {
      const existingQuery = query(
        collection(db, 'brands'),
        where('slug', '==', updateData.slug),
        firestoreLimit(1)
      );
      const existingSnap = await getDocs(existingQuery);

      if (!existingSnap.empty && existingSnap.docs[0].id !== brandId) {
        throw new Error('이미 사용 중인 브랜드 슬러그입니다.');
      }
    }

    await updateDoc(doc(db, 'brands', brandId), updateData);
  } catch (error: any) {
    if (error.message === '이미 사용 중인 브랜드 슬러그입니다.') {
      throw error;
    }
    throw new Error('브랜드 수정 중 오류가 발생했습니다.');
  }
}

// ---------- Delete Brand ----------

export async function deleteBrand(brandId: string): Promise<void> {
  try {
    const docSnap = await getDoc(doc(db, 'brands', brandId));
    if (!docSnap.exists()) {
      throw new Error('브랜드를 찾을 수 없습니다.');
    }

    await deleteDoc(doc(db, 'brands', brandId));
  } catch (error: any) {
    if (error.message === '브랜드를 찾을 수 없습니다.') {
      throw error;
    }
    throw new Error('브랜드 삭제 중 오류가 발생했습니다.');
  }
}
