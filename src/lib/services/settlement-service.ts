// ============================================
// MarketShare - Settlement Service
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
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Settlement, SettlementStatus } from '@/types';

// ---------- Helper ----------

function settlementFromDoc(docSnap: DocumentSnapshot): Settlement {
  const data = docSnap.data()!;
  return {
    ...data,
    id: docSnap.id,
    period: {
      startDate: data.period?.startDate?.toDate() ?? new Date(),
      endDate: data.period?.endDate?.toDate() ?? new Date(),
    },
    processedAt: data.processedAt?.toDate() ?? null,
    createdAt: data.createdAt?.toDate() ?? new Date(),
  } as Settlement;
}

// ---------- Filters ----------

export interface SettlementFilters {
  mallId?: string;
  status?: SettlementStatus;
  period?: {
    startDate: Date;
    endDate: Date;
  };
  limit?: number;
}

// ---------- Get Settlements ----------

export async function getSettlements(
  filters: SettlementFilters = {}
): Promise<Settlement[]> {
  try {
    const constraints: QueryConstraint[] = [];

    if (filters.mallId) {
      constraints.push(where('mallId', '==', filters.mallId));
    }
    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }
    if (filters.period) {
      constraints.push(
        where('period.startDate', '>=', Timestamp.fromDate(filters.period.startDate))
      );
      constraints.push(
        where('period.endDate', '<=', Timestamp.fromDate(filters.period.endDate))
      );
    }

    constraints.push(orderBy('createdAt', 'desc'));

    if (filters.limit) {
      constraints.push(firestoreLimit(filters.limit));
    }

    const q = query(collection(db, 'settlements'), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(settlementFromDoc);
  } catch (error: any) {
    throw new Error('정산 내역을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Get Settlement By ID ----------

export async function getSettlementById(
  settlementId: string
): Promise<Settlement | null> {
  try {
    const docSnap = await getDoc(doc(db, 'settlements', settlementId));
    if (!docSnap.exists()) return null;
    return settlementFromDoc(docSnap);
  } catch (error: any) {
    throw new Error('정산 정보를 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Create Settlement ----------

export async function createSettlement(
  data: Omit<Settlement, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const settlementData = {
      ...data,
      period: {
        startDate: Timestamp.fromDate(
          data.period.startDate instanceof Date
            ? data.period.startDate
            : new Date(data.period.startDate)
        ),
        endDate: Timestamp.fromDate(
          data.period.endDate instanceof Date
            ? data.period.endDate
            : new Date(data.period.endDate)
        ),
      },
      processedAt: data.processedAt
        ? Timestamp.fromDate(
            data.processedAt instanceof Date
              ? data.processedAt
              : new Date(data.processedAt)
          )
        : null,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'settlements'), settlementData);
    return docRef.id;
  } catch (error: any) {
    throw new Error('정산 데이터 생성 중 오류가 발생했습니다.');
  }
}

// ---------- Update Settlement Status ----------

export async function updateSettlementStatus(
  settlementId: string,
  status: SettlementStatus
): Promise<void> {
  try {
    const updateData: Record<string, any> = {
      status,
    };

    if (status === 'completed') {
      updateData.processedAt = serverTimestamp();
    }

    await updateDoc(doc(db, 'settlements', settlementId), updateData);
  } catch (error: any) {
    throw new Error('정산 상태 변경 중 오류가 발생했습니다.');
  }
}

// ---------- Get Mall Settlement Summary ----------

export interface MallSettlementSummary {
  totalSettled: number;
  totalPending: number;
  totalProcessing: number;
  recentSettlements: Settlement[];
}

export async function getMallSettlementSummary(
  mallId: string
): Promise<MallSettlementSummary> {
  try {
    // Get all settlements for the mall
    const allQuery = query(
      collection(db, 'settlements'),
      where('mallId', '==', mallId),
      orderBy('createdAt', 'desc')
    );
    const allSnapshot = await getDocs(allQuery);
    const allSettlements = allSnapshot.docs.map(settlementFromDoc);

    let totalSettled = 0;
    let totalPending = 0;
    let totalProcessing = 0;

    for (const settlement of allSettlements) {
      switch (settlement.status) {
        case 'completed':
          totalSettled += settlement.totalSettlement;
          break;
        case 'pending':
          totalPending += settlement.totalSettlement;
          break;
        case 'processing':
          totalProcessing += settlement.totalSettlement;
          break;
      }
    }

    // Get recent 5 settlements
    const recentSettlements = allSettlements.slice(0, 5);

    return {
      totalSettled,
      totalPending,
      totalProcessing,
      recentSettlements,
    };
  } catch (error: any) {
    throw new Error('몰 정산 요약을 불러오는 중 오류가 발생했습니다.');
  }
}
