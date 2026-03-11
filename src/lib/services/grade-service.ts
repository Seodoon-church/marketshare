// ============================================
// MarketShare - Grade Service
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
  Timestamp,
  DocumentSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { MemberGrade, GradeBenefits, OrderStatus } from '@/types';

// ---------- Helper ----------

function gradeFromDoc(docSnap: DocumentSnapshot): MemberGrade {
  const data = docSnap.data()!;
  return {
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt?.toDate() ?? new Date(),
  } as MemberGrade;
}

// ---------- Get Mall Grades ----------

export async function getMallGrades(mallId: string): Promise<MemberGrade[]> {
  try {
    const q = query(
      collection(db, 'malls', mallId, 'member_grades'),
      orderBy('level', 'asc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(gradeFromDoc);
  } catch (error: any) {
    throw new Error('회원등급 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Get Grade By ID ----------

export async function getGradeById(
  mallId: string,
  gradeId: string
): Promise<MemberGrade | null> {
  try {
    const docSnap = await getDoc(
      doc(db, 'malls', mallId, 'member_grades', gradeId)
    );
    if (!docSnap.exists()) return null;
    return gradeFromDoc(docSnap);
  } catch (error: any) {
    throw new Error('회원등급 정보를 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Create Grade ----------

export async function createGrade(
  mallId: string,
  data: Omit<MemberGrade, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const gradeData = {
      ...data,
      mallId,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, 'malls', mallId, 'member_grades'),
      gradeData
    );

    return docRef.id;
  } catch (error: any) {
    throw new Error('회원등급 생성 중 오류가 발생했습니다.');
  }
}

// ---------- Update Grade ----------

export async function updateGrade(
  mallId: string,
  gradeId: string,
  data: Partial<MemberGrade>
): Promise<void> {
  try {
    const updateData: Record<string, any> = { ...data };

    // Remove immutable fields
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.mallId;

    await updateDoc(
      doc(db, 'malls', mallId, 'member_grades', gradeId),
      updateData
    );
  } catch (error: any) {
    throw new Error('회원등급 수정 중 오류가 발생했습니다.');
  }
}

// ---------- Delete Grade ----------

export async function deleteGrade(
  mallId: string,
  gradeId: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, 'malls', mallId, 'member_grades', gradeId));
  } catch (error: any) {
    throw new Error('회원등급 삭제 중 오류가 발생했습니다.');
  }
}

// ---------- Get User Grade ----------

export async function getUserGrade(
  userId: string,
  mallId: string
): Promise<MemberGrade | null> {
  try {
    // Get user's grade ID for this mall
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) return null;

    const userData = userSnap.data();
    const gradeByMall: Record<string, string> = userData.gradeByMall ?? {};
    const gradeId = gradeByMall[mallId];

    if (!gradeId) return null;

    // Fetch the actual grade
    return await getGradeById(mallId, gradeId);
  } catch (error: any) {
    throw new Error('사용자 회원등급을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Evaluate User Grade ----------

export async function evaluateUserGrade(
  userId: string,
  mallId: string
): Promise<MemberGrade | null> {
  try {
    // Get user data
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) {
      throw new Error('사용자를 찾을 수 없습니다.');
    }

    // Get all grades for the mall
    const grades = await getMallGrades(mallId);
    if (grades.length === 0) return null;

    // Get evaluation period from the first grade (all grades should have same period)
    const evaluationDays = grades[0].evaluationPeriodDays || 90;

    // Calculate total purchase amount
    const totalAmount = await getUserPurchaseAmount(
      userId,
      mallId,
      evaluationDays
    );

    // Find highest grade where minPurchaseAmount <= totalAmount
    // Grades are already sorted by level asc, so iterate from highest to lowest
    let newGrade: MemberGrade | null = null;
    for (let i = grades.length - 1; i >= 0; i--) {
      if (totalAmount >= grades[i].minPurchaseAmount) {
        newGrade = grades[i];
        break;
      }
    }

    // Default to lowest grade if no match
    if (!newGrade) {
      newGrade = grades[0];
    }

    // Update user's gradeByMall
    const userData = userSnap.data();
    const gradeByMall: Record<string, string> = userData.gradeByMall ?? {};
    gradeByMall[mallId] = newGrade.id;

    await updateDoc(doc(db, 'users', userId), {
      gradeByMall,
      updatedAt: serverTimestamp(),
    });

    return newGrade;
  } catch (error: any) {
    if (error.message === '사용자를 찾을 수 없습니다.') {
      throw error;
    }
    throw new Error('회원등급 평가 중 오류가 발생했습니다.');
  }
}

// ---------- Get User Purchase Amount ----------

export async function getUserPurchaseAmount(
  userId: string,
  mallId: string,
  days: number
): Promise<number> {
  try {
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

    // Query orders_global for completed orders
    const completedStatuses: OrderStatus[] = [
      'paid',
      'preparing',
      'shipped',
      'delivered',
    ];

    const q = query(
      collection(db, 'orders_global'),
      where('userId', '==', userId),
      where('mallId', '==', mallId),
      where('status', 'in', completedStatuses),
      where('createdAt', '>=', cutoffTimestamp)
    );

    const snapshot = await getDocs(q);

    // Sum totalAmount
    let totalAmount = 0;
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      totalAmount += data.totalAmount ?? 0;
    });

    return totalAmount;
  } catch (error: any) {
    throw new Error('구매금액 집계 중 오류가 발생했습니다.');
  }
}

// ---------- Get Default Grades ----------

export function getDefaultGrades(): Omit<MemberGrade, 'id' | 'mallId' | 'createdAt'>[] {
  return [
    {
      name: '일반',
      level: 1,
      minPurchaseAmount: 0,
      evaluationPeriodDays: 90,
      benefits: {
        extraPointRate: 0,
        extraDiscountRate: 0,
        freeShippingThreshold: 50000,
      },
      color: '#9CA3AF',
      order: 1,
      isActive: true,
    },
    {
      name: '실버',
      level: 2,
      minPurchaseAmount: 100000,
      evaluationPeriodDays: 90,
      benefits: {
        extraPointRate: 0.5,
        extraDiscountRate: 1,
        freeShippingThreshold: 45000,
      },
      color: '#94A3B8',
      order: 2,
      isActive: true,
    },
    {
      name: '골드',
      level: 3,
      minPurchaseAmount: 300000,
      evaluationPeriodDays: 90,
      benefits: {
        extraPointRate: 1,
        extraDiscountRate: 2,
        freeShippingThreshold: 40000,
      },
      color: '#F59E0B',
      order: 3,
      isActive: true,
    },
    {
      name: 'VIP',
      level: 4,
      minPurchaseAmount: 500000,
      evaluationPeriodDays: 90,
      benefits: {
        extraPointRate: 2,
        extraDiscountRate: 3,
        freeShippingThreshold: 30000,
      },
      color: '#8B5CF6',
      order: 4,
      isActive: true,
    },
    {
      name: 'VVIP',
      level: 5,
      minPurchaseAmount: 1000000,
      evaluationPeriodDays: 90,
      benefits: {
        extraPointRate: 3,
        extraDiscountRate: 5,
        freeShippingThreshold: 0,
      },
      color: '#EF4444',
      order: 5,
      isActive: true,
    },
  ];
}

// ---------- Initialize Default Grades ----------

export async function initializeDefaultGrades(mallId: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    const defaultGrades = getDefaultGrades();

    for (const gradeData of defaultGrades) {
      const gradeRef = doc(collection(db, 'malls', mallId, 'member_grades'));
      batch.set(gradeRef, {
        ...gradeData,
        mallId,
        createdAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error: any) {
    throw new Error('기본 회원등급 초기화 중 오류가 발생했습니다.');
  }
}
