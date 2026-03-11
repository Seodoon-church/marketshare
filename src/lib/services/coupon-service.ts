// ============================================
// MarketShare - Coupon Service
// ============================================

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
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
  increment,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type {
  Coupon,
  CouponType,
  CouponScope,
  CouponUsage,
  UserCoupon,
} from '@/types';

// ---------- Helper ----------

function couponFromDoc(docSnap: DocumentSnapshot): Coupon {
  const data = docSnap.data()!;
  return {
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    startDate: data.startDate?.toDate() ?? new Date(),
    endDate: data.endDate?.toDate() ?? new Date(),
  } as Coupon;
}

function couponUsageFromDoc(docSnap: DocumentSnapshot): CouponUsage {
  const data = docSnap.data()!;
  return {
    ...data,
    id: docSnap.id,
    usedAt: data.usedAt?.toDate() ?? new Date(),
  } as CouponUsage;
}

// ---------- Generate Coupon Code ----------

export function generateCouponCode(prefix?: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part1 = Array.from({ length: 4 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');
  const part2 = Array.from({ length: 4 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('');

  const basePrefix = prefix || 'MS';
  return `${basePrefix}-${part1}-${part2}`;
}

// ---------- Create Coupon ----------

export async function createCoupon(
  data: Omit<Coupon, 'id' | 'usageCount' | 'createdAt'>
): Promise<string> {
  try {
    const couponData = {
      ...data,
      code: data.code || generateCouponCode(),
      usageCount: 0,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'coupons'), couponData);
    return docRef.id;
  } catch (error: any) {
    throw new Error('쿠폰 생성 중 오류가 발생했습니다.');
  }
}

// ---------- Update Coupon ----------

export async function updateCoupon(
  couponId: string,
  data: Partial<Coupon>
): Promise<void> {
  try {
    const updateData: Record<string, any> = { ...data };

    // Remove immutable fields
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.usageCount;

    await updateDoc(doc(db, 'coupons', couponId), updateData);
  } catch (error: any) {
    throw new Error('쿠폰 수정 중 오류가 발생했습니다.');
  }
}

// ---------- Delete Coupon ----------

export async function deleteCoupon(couponId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'coupons', couponId));
  } catch (error: any) {
    throw new Error('쿠폰 삭제 중 오류가 발생했습니다.');
  }
}

// ---------- Get Coupons ----------

export async function getCoupons(filters: {
  mallId?: string | null;
  isActive?: boolean;
  type?: CouponType;
  limit?: number;
}): Promise<Coupon[]> {
  try {
    const constraints: QueryConstraint[] = [];

    if (filters.mallId !== undefined) {
      constraints.push(where('mallId', '==', filters.mallId));
    }
    if (filters.isActive !== undefined) {
      constraints.push(where('isActive', '==', filters.isActive));
    }
    if (filters.type) {
      constraints.push(where('type', '==', filters.type));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const maxLimit = filters.limit ?? 100;
    constraints.push(firestoreLimit(maxLimit));

    const q = query(collection(db, 'coupons'), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(couponFromDoc);
  } catch (error: any) {
    throw new Error('쿠폰 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Get Coupon By Code ----------

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  try {
    const q = query(
      collection(db, 'coupons'),
      where('code', '==', code),
      firestoreLimit(1)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;
    return couponFromDoc(snapshot.docs[0]);
  } catch (error: any) {
    throw new Error('쿠폰 조회 중 오류가 발생했습니다.');
  }
}

// ---------- Download Coupon ----------

export async function downloadCoupon(
  userId: string,
  couponId: string
): Promise<void> {
  try {
    const userCouponRef = doc(db, 'users', userId, 'coupons', couponId);
    const userCouponSnap = await getDoc(userCouponRef);

    if (userCouponSnap.exists()) {
      throw new Error('이미 다운로드한 쿠폰입니다.');
    }

    const userCouponData = {
      couponId,
      downloadedAt: serverTimestamp(),
      usedAt: null,
      usedOrderId: null,
    };

    await setDoc(userCouponRef, userCouponData);
  } catch (error: any) {
    if (error.message === '이미 다운로드한 쿠폰입니다.') {
      throw error;
    }
    throw new Error('쿠폰 다운로드 중 오류가 발생했습니다.');
  }
}

// ---------- Get User Coupons ----------

export async function getUserCoupons(
  userId: string,
  mallId?: string
): Promise<UserCoupon[]> {
  try {
    const userCouponsRef = collection(db, 'users', userId, 'coupons');
    const snapshot = await getDocs(userCouponsRef);

    const now = new Date();
    const userCoupons: UserCoupon[] = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      // Skip if already used
      if (data.usedAt) continue;

      // Get coupon details
      const couponSnap = await getDoc(doc(db, 'coupons', data.couponId));
      if (!couponSnap.exists()) continue;

      const coupon = couponFromDoc(couponSnap);

      // Skip if expired
      if (coupon.endDate < now) continue;

      // Skip if not active
      if (!coupon.isActive) continue;

      // Filter by mallId if provided
      if (mallId !== undefined && coupon.mallId !== mallId && coupon.mallId !== null) {
        continue;
      }

      userCoupons.push({
        couponId: data.couponId,
        coupon,
        downloadedAt: data.downloadedAt?.toDate() ?? new Date(),
        usedAt: data.usedAt?.toDate() ?? null,
        usedOrderId: data.usedOrderId ?? null,
      });
    }

    return userCoupons;
  } catch (error: any) {
    throw new Error('내 쿠폰 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Validate Coupon ----------

export async function validateCoupon(
  code: string,
  userId: string,
  mallId: string,
  cartAmount: number,
  cartItems?: Array<{ productId: string; categoryId: string }>
): Promise<{ valid: boolean; coupon?: Coupon; reason?: string }> {
  try {
    // 1. Get coupon by code
    const coupon = await getCouponByCode(code);
    if (!coupon) {
      return { valid: false, reason: '존재하지 않는 쿠폰 코드입니다.' };
    }

    // 2. Check if active
    if (!coupon.isActive) {
      return { valid: false, reason: '사용할 수 없는 쿠폰입니다.' };
    }

    // 3. Check date range
    const now = new Date();
    if (now < coupon.startDate) {
      return { valid: false, reason: '아직 사용 기간이 아닙니다.' };
    }
    if (now > coupon.endDate) {
      return { valid: false, reason: '사용 기간이 만료된 쿠폰입니다.' };
    }

    // 4. Check mall match
    if (coupon.mallId !== null && coupon.mallId !== mallId) {
      return { valid: false, reason: '이 쇼핑몰에서 사용할 수 없는 쿠폰입니다.' };
    }

    // 5. Check minimum purchase amount
    if (cartAmount < coupon.minPurchaseAmount) {
      return {
        valid: false,
        reason: `${coupon.minPurchaseAmount.toLocaleString()}원 이상 구매 시 사용 가능합니다.`,
      };
    }

    // 6. Check usage limit per user
    if (coupon.usageLimitPerUser !== null) {
      const usageQuery = query(
        collection(db, 'coupon_usage'),
        where('couponId', '==', coupon.id),
        where('userId', '==', userId)
      );
      const usageSnapshot = await getDocs(usageQuery);

      if (usageSnapshot.size >= coupon.usageLimitPerUser) {
        return { valid: false, reason: '쿠폰 사용 횟수를 초과했습니다.' };
      }
    }

    // 7. Check total usage limit
    if (coupon.totalUsageLimit !== null && coupon.usageCount >= coupon.totalUsageLimit) {
      return { valid: false, reason: '쿠폰 사용 가능 수량이 소진되었습니다.' };
    }

    // 8. Check scope
    if (coupon.scope === 'category' || coupon.scope === 'product') {
      if (!cartItems || cartItems.length === 0) {
        return { valid: false, reason: '적용 가능한 상품이 장바구니에 없습니다.' };
      }

      const hasMatchingItem = cartItems.some((item) => {
        if (coupon.scope === 'category') {
          return coupon.scopeTargetIds.includes(item.categoryId);
        } else if (coupon.scope === 'product') {
          return coupon.scopeTargetIds.includes(item.productId);
        }
        return false;
      });

      if (!hasMatchingItem) {
        return { valid: false, reason: '적용 가능한 상품이 장바구니에 없습니다.' };
      }
    }

    return { valid: true, coupon };
  } catch (error: any) {
    throw new Error('쿠폰 검증 중 오류가 발생했습니다.');
  }
}

// ---------- Apply Coupon ----------

export async function applyCoupon(
  couponCode: string,
  userId: string,
  orderId: string,
  mallId: string,
  discountAmount: number
): Promise<CouponUsage> {
  try {
    // Pre-find the coupon by code (query cannot run inside a transaction)
    const coupon = await getCouponByCode(couponCode);
    if (!coupon) {
      throw new Error('존재하지 않는 쿠폰입니다.');
    }

    const couponRef = doc(db, 'coupons', coupon.id);
    const usageRef = doc(collection(db, 'coupon_usage'));
    const userCouponRef = doc(db, 'users', userId, 'coupons', coupon.id);

    const usageData: Omit<CouponUsage, 'id'> = {
      couponId: coupon.id,
      couponCode,
      userId,
      orderId,
      mallId,
      discountAmount,
      usedAt: new Date(),
    };

    await runTransaction(db, async (transaction) => {
      // 1. Read coupon inside transaction to get latest state
      const couponSnap = await transaction.get(couponRef);
      if (!couponSnap.exists()) {
        throw new Error('존재하지 않는 쿠폰입니다.');
      }

      const couponData = couponSnap.data();

      // 2. Verify coupon is still valid
      if (!couponData.isActive) {
        throw new Error('사용할 수 없는 쿠폰입니다.');
      }

      const now = new Date();
      const endDate = couponData.endDate?.toDate?.() ?? new Date(0);
      if (now > endDate) {
        throw new Error('사용 기간이 만료된 쿠폰입니다.');
      }

      // 3. Check total usage limit hasn't been exceeded
      const currentUsageCount = couponData.usageCount ?? 0;
      if (
        couponData.totalUsageLimit !== null &&
        couponData.totalUsageLimit !== undefined &&
        currentUsageCount >= couponData.totalUsageLimit
      ) {
        throw new Error('쿠폰 사용 가능 수량이 소진되었습니다.');
      }

      // 4. Update coupon's usageCount
      transaction.update(couponRef, {
        usageCount: currentUsageCount + 1,
      });

      // 5. Create coupon_usage document
      transaction.set(usageRef, {
        ...usageData,
        usedAt: serverTimestamp(),
      });

      // 6. Mark user's coupon as used
      transaction.update(userCouponRef, {
        usedAt: serverTimestamp(),
        usedOrderId: orderId,
      });
    });

    return {
      ...usageData,
      id: usageRef.id,
    };
  } catch (error: any) {
    if (
      error.message === '존재하지 않는 쿠폰입니다.' ||
      error.message === '사용할 수 없는 쿠폰입니다.' ||
      error.message === '사용 기간이 만료된 쿠폰입니다.' ||
      error.message === '쿠폰 사용 가능 수량이 소진되었습니다.'
    ) {
      throw error;
    }
    throw new Error('쿠폰 적용 중 오류가 발생했습니다.');
  }
}

// ---------- Calculate Coupon Discount ----------

export function calculateCouponDiscount(
  coupon: Coupon,
  cartAmount: number
): number {
  switch (coupon.type) {
    case 'percentage': {
      const discountAmount = cartAmount * (coupon.discountValue / 100);
      const maxDiscount = coupon.maxDiscountAmount ?? Infinity;
      return Math.min(discountAmount, maxDiscount);
    }
    case 'fixed': {
      return Math.min(coupon.discountValue, cartAmount);
    }
    case 'free_shipping': {
      // Free shipping is handled separately in checkout
      return 0;
    }
    default:
      return 0;
  }
}
