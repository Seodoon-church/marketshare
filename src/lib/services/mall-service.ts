// ============================================
// MarketShare - Mall Service
// ============================================

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  DocumentSnapshot,
  serverTimestamp,
  QueryConstraint,
  getCountFromServer,
  AggregateQuerySnapshot,
  sum,
  getAggregateFromServer,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Mall, MallStatus } from '@/types';

// ---------- Helper ----------

function mallFromDoc(docSnap: DocumentSnapshot): Mall {
  const data = docSnap.data()!;
  return {
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
    franchiseStartDate: data.franchiseStartDate?.toDate() ?? new Date(),
    franchiseEndDate: data.franchiseEndDate?.toDate() ?? null,
  } as Mall;
}

// ---------- Filters ----------

export interface MallFilters {
  status?: MallStatus;
  category?: string;
  sortBy?: 'createdAt' | 'name' | 'totalRevenue' | 'productCount';
  sortDirection?: 'asc' | 'desc';
  limit?: number;
}

// ---------- Get Malls ----------

export async function getMalls(filters: MallFilters = {}): Promise<Mall[]> {
  try {
    const constraints: QueryConstraint[] = [];

    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }

    const sortField = filters.sortBy ?? 'createdAt';
    const sortDir = filters.sortDirection ?? 'desc';
    constraints.push(orderBy(sortField, sortDir));

    if (filters.limit) {
      constraints.push(firestoreLimit(filters.limit));
    }

    const q = query(collection(db, 'malls'), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(mallFromDoc);
  } catch (error: any) {
    throw new Error('몰 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Get Mall By ID ----------

export async function getMallById(mallId: string): Promise<Mall | null> {
  try {
    const docSnap = await getDoc(doc(db, 'malls', mallId));
    if (!docSnap.exists()) return null;
    return mallFromDoc(docSnap);
  } catch (error: any) {
    throw new Error('몰 정보를 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Get Mall By Slug ----------

export async function getMallBySlug(slug: string): Promise<Mall | null> {
  try {
    const q = query(
      collection(db, 'malls'),
      where('slug', '==', slug),
      firestoreLimit(1)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;
    return mallFromDoc(snapshot.docs[0]);
  } catch (error: any) {
    throw new Error('몰 정보를 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Create Mall ----------

export async function createMall(
  data: Omit<Mall, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    // Check slug uniqueness
    const existingMall = await getMallBySlug(data.slug);
    if (existingMall) {
      throw new Error('이미 사용 중인 몰 주소(slug)입니다.');
    }

    const mallData = {
      ...data,
      productCount: 0,
      orderCount: 0,
      totalRevenue: 0,
      childMallIds: data.childMallIds ?? [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      franchiseStartDate: data.franchiseStartDate
        ? Timestamp.fromDate(
            data.franchiseStartDate instanceof Date
              ? data.franchiseStartDate
              : new Date(data.franchiseStartDate)
          )
        : serverTimestamp(),
      franchiseEndDate: data.franchiseEndDate
        ? Timestamp.fromDate(
            data.franchiseEndDate instanceof Date
              ? data.franchiseEndDate
              : new Date(data.franchiseEndDate)
          )
        : null,
    };

    const docRef = await addDoc(collection(db, 'malls'), mallData);

    // Update owner's ownedMallIds
    if (data.ownerId) {
      const userRef = doc(db, 'users', data.ownerId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const currentMallIds: string[] = userSnap.data().ownedMallIds ?? [];
        await updateDoc(userRef, {
          ownedMallIds: [...currentMallIds, docRef.id],
          updatedAt: serverTimestamp(),
        });
      }
    }

    return docRef.id;
  } catch (error: any) {
    if (error.message === '이미 사용 중인 몰 주소(slug)입니다.') {
      throw error;
    }
    throw new Error('몰 생성 중 오류가 발생했습니다.');
  }
}

// ---------- Update Mall ----------

export async function updateMall(
  mallId: string,
  data: Partial<Mall>
): Promise<void> {
  try {
    const updateData: Record<string, any> = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    // Remove immutable fields
    delete updateData.id;
    delete updateData.createdAt;

    // Convert Date fields to Timestamps
    if (updateData.franchiseStartDate instanceof Date) {
      updateData.franchiseStartDate = Timestamp.fromDate(updateData.franchiseStartDate);
    }
    if (updateData.franchiseEndDate instanceof Date) {
      updateData.franchiseEndDate = Timestamp.fromDate(updateData.franchiseEndDate);
    }

    // If slug is being changed, verify uniqueness
    if (updateData.slug) {
      const existingMall = await getMallBySlug(updateData.slug);
      if (existingMall && existingMall.id !== mallId) {
        throw new Error('이미 사용 중인 몰 주소(slug)입니다.');
      }
    }

    await updateDoc(doc(db, 'malls', mallId), updateData);
  } catch (error: any) {
    if (error.message === '이미 사용 중인 몰 주소(slug)입니다.') {
      throw error;
    }
    throw new Error('몰 정보 수정 중 오류가 발생했습니다.');
  }
}

// ---------- Update Mall Status ----------

export async function updateMallStatus(
  mallId: string,
  status: MallStatus
): Promise<void> {
  try {
    await updateDoc(doc(db, 'malls', mallId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error('몰 상태 변경 중 오류가 발생했습니다.');
  }
}

// ---------- Get Mall Banners ----------

export async function getMallBanners(mallId: string): Promise<import('@/types').Banner[]> {
  try {
    const now = new Date();
    const bannersRef = collection(db, 'malls', mallId, 'banners');
    const q = query(
      bannersRef,
      where('isActive', '==', true),
      orderBy('order', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs
      .map((docSnap) => {
        const data = docSnap.data();
        return {
          ...data,
          id: docSnap.id,
          startDate: data.startDate?.toDate?.() ?? new Date(),
          endDate: data.endDate?.toDate?.() ?? new Date(),
          createdAt: data.createdAt?.toDate?.() ?? new Date(),
        } as import('@/types').Banner;
      })
      .filter((banner) => banner.startDate <= now && banner.endDate >= now);
  } catch (error: any) {
    // 배너 로드 실패 시 빈 배열 반환 (fallback으로 데모 배너 사용 가능)
    console.error('배너를 불러오는 중 오류:', error);
    return [];
  }
}

// ---------- Create Mall Banner ----------

export async function createMallBanner(mallId: string, data: Omit<import('@/types').Banner, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'malls', mallId, 'banners'), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

// ---------- Update Mall Banner ----------

export async function updateMallBanner(mallId: string, bannerId: string, data: Partial<import('@/types').Banner>): Promise<void> {
  await updateDoc(doc(db, 'malls', mallId, 'banners', bannerId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ---------- Delete Mall Banner ----------

export async function deleteMallBanner(mallId: string, bannerId: string): Promise<void> {
  const { deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'malls', mallId, 'banners', bannerId));
}

// ---------- Get All Mall Banners (Admin) ----------

export async function getAllMallBanners(mallId: string): Promise<import('@/types').Banner[]> {
  try {
    const bannersRef = collection(db, 'malls', mallId, 'banners');
    const q = query(bannersRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        startDate: data.startDate?.toDate?.() ?? new Date(),
        endDate: data.endDate?.toDate?.() ?? new Date(),
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
      } as import('@/types').Banner;
    });
  } catch (error: any) {
    console.error('배너를 불러오는 중 오류:', error);
    return [];
  }
}

// ---------- Get Mall Stats ----------

export interface MallStats {
  productCount: number;
  orderCount: number;
  totalRevenue: number;
}

export async function getMallStats(mallId: string): Promise<MallStats> {
  const stats: MallStats = { productCount: 0, orderCount: 0, totalRevenue: 0 };

  try {
    // Get product count from sub-collection
    const productsQuery = query(collection(db, 'malls', mallId, 'products'));
    const productCountSnap = await getCountFromServer(productsQuery).catch(() => null);
    stats.productCount = productCountSnap?.data().count ?? 0;
  } catch { /* empty sub-collection */ }

  try {
    // Get order count from sub-collection
    const ordersQuery = query(collection(db, 'malls', mallId, 'orders'));
    const orderCountSnap = await getCountFromServer(ordersQuery).catch(() => null);
    stats.orderCount = orderCountSnap?.data().count ?? 0;
  } catch { /* empty sub-collection */ }

  try {
    // Calculate total revenue - use getDocs fallback instead of aggregation
    const completedOrdersQuery = query(
      collection(db, 'malls', mallId, 'orders'),
      where('status', 'in', ['paid', 'preparing', 'shipped', 'delivered'])
    );
    const orderSnap = await getDocs(completedOrdersQuery);
    let revenue = 0;
    orderSnap.docs.forEach((d) => {
      revenue += d.data().totalAmount || 0;
    });
    stats.totalRevenue = revenue;
  } catch { /* no orders yet */ }

  try {
    // Update cached stats on the mall document
    await updateDoc(doc(db, 'malls', mallId), {
      productCount: stats.productCount,
      orderCount: stats.orderCount,
      totalRevenue: stats.totalRevenue,
      updatedAt: serverTimestamp(),
    });
  } catch { /* update failed, non-critical */ }

  return stats;
}
