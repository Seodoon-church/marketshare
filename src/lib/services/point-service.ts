// ============================================
// MarketShare - Point Service
// ============================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter as firestoreStartAfter,
  Timestamp,
  DocumentSnapshot,
  serverTimestamp,
  QueryConstraint,
  runTransaction,
  increment,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { PointTransaction, PointTransactionType, PointSettings } from '@/types';

// ---------- Helper ----------

function convertPointDoc(docSnap: DocumentSnapshot): PointTransaction {
  const data = docSnap.data()!;
  return {
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    expiresAt: data.expiresAt?.toDate() ?? null,
  } as PointTransaction;
}

// ---------- Default Settings ----------

const DEFAULT_POINT_SETTINGS: PointSettings = {
  enabled: false,
  earningRate: 1,
  minOrderAmount: 10000,
  maxEarningPerOrder: null,
  expirationDays: 365,
  allowPartialUse: true,
  minUsageAmount: 100,
};

// ---------- Get User Point Balance ----------

export async function getUserPointBalance(
  userId: string,
  mallId?: string
): Promise<number> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return 0;
    }

    const userData = userDoc.data();
    if (!mallId) {
      return userData.pointBalance ?? 0;
    }

    const pointsByMall = userData.pointsByMall ?? {};
    return pointsByMall[mallId] ?? 0;
  } catch (error: any) {
    throw new Error('포인트 잔액을 조회하는 중 오류가 발생했습니다.');
  }
}

// ---------- Get User Point History ----------

export interface PointHistoryFilters {
  mallId?: string;
  type?: PointTransactionType;
  limit?: number;
  startAfter?: DocumentSnapshot;
}

export interface PointHistoryResult {
  transactions: PointTransaction[];
  hasMore: boolean;
}

export async function getUserPointHistory(
  userId: string,
  filters: PointHistoryFilters = {}
): Promise<PointHistoryResult> {
  try {
    const constraints: QueryConstraint[] = [where('userId', '==', userId)];

    if (filters.mallId) {
      constraints.push(where('mallId', '==', filters.mallId));
    }

    if (filters.type) {
      constraints.push(where('type', '==', filters.type));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const pageSize = filters.limit ?? 20;
    constraints.push(firestoreLimit(pageSize + 1));

    if (filters.startAfter) {
      constraints.push(firestoreStartAfter(filters.startAfter));
    }

    const q = query(collection(db, 'points_ledger'), ...constraints);
    const snapshot = await getDocs(q);

    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const resultDocs = hasMore ? docs.slice(0, pageSize) : docs;

    return {
      transactions: resultDocs.map(convertPointDoc),
      hasMore,
    };
  } catch (error: any) {
    throw new Error('포인트 내역을 조회하는 중 오류가 발생했습니다.');
  }
}

// ---------- Earn Points ----------

export async function earnPoints(
  userId: string,
  mallId: string,
  orderId: string,
  orderAmount: number,
  earningRate: number
): Promise<PointTransaction | null> {
  try {
    const pointsToEarn = Math.floor(orderAmount * earningRate / 100);

    if (pointsToEarn === 0) {
      return null;
    }

    const settings = await getMallPointSettings(mallId);
    let finalPoints = pointsToEarn;

    // Apply max earning limit if set
    if (settings.maxEarningPerOrder !== null && pointsToEarn > settings.maxEarningPerOrder) {
      finalPoints = settings.maxEarningPerOrder;
    }

    // Calculate expiration date
    let expiresAt: Date | null = null;
    if (settings.expirationDays > 0) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + settings.expirationDays);
      expiresAt = expiry;
    }

    const transactionData = {
      userId,
      mallId,
      orderId,
      type: 'earned' as PointTransactionType,
      amount: finalPoints,
      balance: 0, // Will be updated in transaction
      description: `주문 완료 적립 (${earningRate}%)`,
      expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
      createdBy: 'system',
      createdAt: serverTimestamp(),
    };

    // Use transaction to ensure consistency
    const result = await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      const userData = userDoc.data();
      const currentBalance = userData.pointBalance ?? 0;
      const currentMallBalance = (userData.pointsByMall ?? {})[mallId] ?? 0;

      const newBalance = currentBalance + finalPoints;
      const newMallBalance = currentMallBalance + finalPoints;

      // Update user balance
      transaction.update(userRef, {
        pointBalance: increment(finalPoints),
        [`pointsByMall.${mallId}`]: increment(finalPoints),
      });

      // Create ledger entry with final balance
      const ledgerRef = doc(collection(db, 'points_ledger'));
      transaction.set(ledgerRef, {
        ...transactionData,
        balance: newMallBalance,
      });

      return {
        id: ledgerRef.id,
        ...transactionData,
        balance: newMallBalance,
        createdAt: new Date(),
        expiresAt,
      } as PointTransaction;
    });

    return result;
  } catch (error: any) {
    if (error.message === '사용자를 찾을 수 없습니다.') {
      throw error;
    }
    throw new Error('포인트 적립 중 오류가 발생했습니다.');
  }
}

// ---------- Use Points ----------

export async function usePoints(
  userId: string,
  mallId: string,
  orderId: string,
  amount: number
): Promise<PointTransaction> {
  try {
    if (amount <= 0) {
      throw new Error('사용할 포인트는 0보다 커야 합니다.');
    }

    const settings = await getMallPointSettings(mallId);

    if (amount < settings.minUsageAmount) {
      throw new Error(`최소 ${settings.minUsageAmount.toLocaleString()}P 이상 사용 가능합니다.`);
    }

    const result = await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      const userData = userDoc.data();
      const currentMallBalance = (userData.pointsByMall ?? {})[mallId] ?? 0;

      if (currentMallBalance < amount) {
        throw new Error('포인트 잔액이 부족합니다.');
      }

      const newMallBalance = currentMallBalance - amount;

      // Update user balance
      transaction.update(userRef, {
        pointBalance: increment(-amount),
        [`pointsByMall.${mallId}`]: increment(-amount),
      });

      // Create ledger entry
      const ledgerRef = doc(collection(db, 'points_ledger'));
      const transactionData = {
        userId,
        mallId,
        orderId,
        type: 'used' as PointTransactionType,
        amount: -amount,
        balance: newMallBalance,
        description: '주문 시 포인트 사용',
        expiresAt: null,
        createdBy: userId,
        createdAt: serverTimestamp(),
      };

      transaction.set(ledgerRef, transactionData);

      return {
        id: ledgerRef.id,
        ...transactionData,
        createdAt: new Date(),
        expiresAt: null,
      } as PointTransaction;
    });

    return result;
  } catch (error: any) {
    if (
      error.message === '사용자를 찾을 수 없습니다.' ||
      error.message === '포인트 잔액이 부족합니다.' ||
      error.message === '사용할 포인트는 0보다 커야 합니다.' ||
      error.message.includes('최소')
    ) {
      throw error;
    }
    throw new Error('포인트 사용 중 오류가 발생했습니다.');
  }
}

// ---------- Admin Grant Points ----------

export async function adminGrantPoints(
  userId: string,
  mallId: string,
  amount: number,
  reason: string,
  adminId: string
): Promise<PointTransaction> {
  try {
    if (amount <= 0) {
      throw new Error('지급할 포인트는 0보다 커야 합니다.');
    }

    const settings = await getMallPointSettings(mallId);

    // Calculate expiration date
    let expiresAt: Date | null = null;
    if (settings.expirationDays > 0) {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + settings.expirationDays);
      expiresAt = expiry;
    }

    const result = await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      const userData = userDoc.data();
      const currentMallBalance = (userData.pointsByMall ?? {})[mallId] ?? 0;
      const newMallBalance = currentMallBalance + amount;

      // Update user balance
      transaction.update(userRef, {
        pointBalance: increment(amount),
        [`pointsByMall.${mallId}`]: increment(amount),
      });

      // Create ledger entry
      const ledgerRef = doc(collection(db, 'points_ledger'));
      const transactionData = {
        userId,
        mallId,
        orderId: null,
        type: 'admin_granted' as PointTransactionType,
        amount,
        balance: newMallBalance,
        description: reason,
        expiresAt: expiresAt ? Timestamp.fromDate(expiresAt) : null,
        createdBy: adminId,
        createdAt: serverTimestamp(),
      };

      transaction.set(ledgerRef, transactionData);

      return {
        id: ledgerRef.id,
        ...transactionData,
        createdAt: new Date(),
        expiresAt,
      } as PointTransaction;
    });

    return result;
  } catch (error: any) {
    if (
      error.message === '사용자를 찾을 수 없습니다.' ||
      error.message === '지급할 포인트는 0보다 커야 합니다.'
    ) {
      throw error;
    }
    throw new Error('포인트 지급 중 오류가 발생했습니다.');
  }
}

// ---------- Admin Deduct Points ----------

export async function adminDeductPoints(
  userId: string,
  mallId: string,
  amount: number,
  reason: string,
  adminId: string
): Promise<PointTransaction> {
  try {
    if (amount <= 0) {
      throw new Error('차감할 포인트는 0보다 커야 합니다.');
    }

    const result = await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', userId);
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists()) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      const userData = userDoc.data();
      const currentMallBalance = (userData.pointsByMall ?? {})[mallId] ?? 0;

      if (currentMallBalance < amount) {
        throw new Error('포인트 잔액이 부족합니다.');
      }

      const newMallBalance = currentMallBalance - amount;

      // Update user balance
      transaction.update(userRef, {
        pointBalance: increment(-amount),
        [`pointsByMall.${mallId}`]: increment(-amount),
      });

      // Create ledger entry
      const ledgerRef = doc(collection(db, 'points_ledger'));
      const transactionData = {
        userId,
        mallId,
        orderId: null,
        type: 'admin_deducted' as PointTransactionType,
        amount: -amount,
        balance: newMallBalance,
        description: reason,
        expiresAt: null,
        createdBy: adminId,
        createdAt: serverTimestamp(),
      };

      transaction.set(ledgerRef, transactionData);

      return {
        id: ledgerRef.id,
        ...transactionData,
        createdAt: new Date(),
        expiresAt: null,
      } as PointTransaction;
    });

    return result;
  } catch (error: any) {
    if (
      error.message === '사용자를 찾을 수 없습니다.' ||
      error.message === '포인트 잔액이 부족합니다.' ||
      error.message === '차감할 포인트는 0보다 커야 합니다.'
    ) {
      throw error;
    }
    throw new Error('포인트 차감 중 오류가 발생했습니다.');
  }
}

// ---------- Get Mall Point Settings ----------

export async function getMallPointSettings(mallId: string): Promise<PointSettings> {
  try {
    const mallDoc = await getDoc(doc(db, 'malls', mallId));

    if (!mallDoc.exists()) {
      return DEFAULT_POINT_SETTINGS;
    }

    const mallData = mallDoc.data();
    const pointSettings = mallData.pointSettings;

    if (!pointSettings) {
      return DEFAULT_POINT_SETTINGS;
    }

    return {
      ...DEFAULT_POINT_SETTINGS,
      ...pointSettings,
    };
  } catch (error: any) {
    throw new Error('포인트 설정을 조회하는 중 오류가 발생했습니다.');
  }
}

// ---------- Update Mall Point Settings ----------

export async function updateMallPointSettings(
  mallId: string,
  settings: PointSettings
): Promise<void> {
  try {
    const mallRef = doc(db, 'malls', mallId);
    await setDoc(
      mallRef,
      {
        pointSettings: settings,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error: any) {
    throw new Error('포인트 설정 업데이트 중 오류가 발생했습니다.');
  }
}

// ---------- Get Expiring Soon Points ----------

export async function getExpiringSoonPoints(
  userId: string,
  mallId: string,
  days: number
): Promise<number> {
  try {
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + days);

    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      where('mallId', '==', mallId),
      where('type', '==', 'earned'),
      where('expiresAt', '<=', Timestamp.fromDate(expiryThreshold)),
      where('expiresAt', '>', Timestamp.fromDate(new Date())),
    ];

    const q = query(collection(db, 'points_ledger'), ...constraints);
    const snapshot = await getDocs(q);

    let totalExpiring = 0;
    snapshot.forEach((doc) => {
      const data = doc.data();
      totalExpiring += data.amount;
    });

    return totalExpiring;
  } catch (error: any) {
    throw new Error('만료 예정 포인트를 조회하는 중 오류가 발생했습니다.');
  }
}
