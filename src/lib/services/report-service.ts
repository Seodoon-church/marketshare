// ============================================
// MarketShare - Report Service
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
import type {
  TaxInvoice,
  TaxInvoiceStatus,
  SettlementReport,
  SettlementReportData,
  Settlement,
  BusinessInfo,
} from '@/types';

// ---------- Helper ----------

function taxInvoiceFromDoc(docSnap: DocumentSnapshot): TaxInvoice {
  const data = docSnap.data()!;
  return {
    ...data,
    id: docSnap.id,
    period: {
      startDate: data.period?.startDate?.toDate() ?? new Date(),
      endDate: data.period?.endDate?.toDate() ?? new Date(),
    },
    issueDate: data.issueDate?.toDate() ?? null,
    createdAt: data.createdAt?.toDate() ?? new Date(),
  } as TaxInvoice;
}

function settlementReportFromDoc(docSnap: DocumentSnapshot): SettlementReport {
  const data = docSnap.data()!;
  const reportData = data.reportData || {};

  return {
    ...data,
    id: docSnap.id,
    period: {
      startDate: data.period?.startDate?.toDate() ?? new Date(),
      endDate: data.period?.endDate?.toDate() ?? new Date(),
    },
    reportData: {
      ...reportData,
      orderBreakdown: (reportData.orderBreakdown || []).map((item: any) => ({
        ...item,
        date: item.date?.toDate?.() ?? item.date ?? new Date(),
      })),
    },
    generatedAt: data.generatedAt?.toDate() ?? new Date(),
    createdAt: data.createdAt?.toDate() ?? new Date(),
  } as SettlementReport;
}

// ---------- Get Tax Invoices ----------

export async function getTaxInvoices(filters: {
  mallId?: string;
  status?: TaxInvoiceStatus;
  limit?: number;
}): Promise<TaxInvoice[]> {
  try {
    const constraints: QueryConstraint[] = [];

    if (filters.mallId) {
      constraints.push(where('mallId', '==', filters.mallId));
    }

    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const pageSize = filters.limit ?? 20;
    constraints.push(firestoreLimit(pageSize));

    const q = query(collection(db, 'tax_invoices'), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(taxInvoiceFromDoc);
  } catch (error: any) {
    throw new Error('세금계산서 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Get Tax Invoice By ID ----------

export async function getTaxInvoiceById(
  invoiceId: string
): Promise<TaxInvoice | null> {
  try {
    const docSnap = await getDoc(doc(db, 'tax_invoices', invoiceId));
    if (!docSnap.exists()) return null;
    return taxInvoiceFromDoc(docSnap);
  } catch (error: any) {
    throw new Error('세금계산서 정보를 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Create Tax Invoice ----------

export async function createTaxInvoice(
  data: Omit<TaxInvoice, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'tax_invoices'), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error: any) {
    throw new Error('세금계산서 생성 중 오류가 발생했습니다.');
  }
}

// ---------- Update Tax Invoice Status ----------

export async function updateTaxInvoiceStatus(
  invoiceId: string,
  status: TaxInvoiceStatus,
  externalId?: string
): Promise<void> {
  try {
    const updateData: Record<string, any> = {
      status,
    };

    if (externalId) {
      updateData.externalId = externalId;
    }

    if (status === 'issued') {
      updateData.issueDate = serverTimestamp();
    }

    await updateDoc(doc(db, 'tax_invoices', invoiceId), updateData);
  } catch (error: any) {
    throw new Error('세금계산서 상태 업데이트 중 오류가 발생했습니다.');
  }
}

// ---------- Get Settlement Reports ----------

export async function getSettlementReports(filters: {
  mallId?: string;
  limit?: number;
}): Promise<SettlementReport[]> {
  try {
    const constraints: QueryConstraint[] = [];

    if (filters.mallId) {
      constraints.push(where('mallId', '==', filters.mallId));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const pageSize = filters.limit ?? 20;
    constraints.push(firestoreLimit(pageSize));

    const q = query(collection(db, 'settlement_reports'), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(settlementReportFromDoc);
  } catch (error: any) {
    throw new Error('정산 보고서 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Get Settlement Report By ID ----------

export async function getSettlementReportById(
  reportId: string
): Promise<SettlementReport | null> {
  try {
    const docSnap = await getDoc(doc(db, 'settlement_reports', reportId));
    if (!docSnap.exists()) return null;
    return settlementReportFromDoc(docSnap);
  } catch (error: any) {
    throw new Error('정산 보고서 정보를 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Create Settlement Report ----------

export async function createSettlementReport(
  data: Omit<SettlementReport, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'settlement_reports'), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error: any) {
    throw new Error('정산 보고서 생성 중 오류가 발생했습니다.');
  }
}

// ---------- Generate Settlement Report Data ----------

export function generateSettlementReportData(
  settlement: Settlement,
  orders: any[]
): SettlementReportData {
  const totalSales = settlement.totalSales;
  const platformCommission = settlement.totalCommission;
  const pgFees = Math.round(totalSales * 0.033); // PG 수수료 3.3%
  const referralCommission = settlement.totalReferralCommission;
  const netAmount = totalSales - platformCommission - pgFees - referralCommission;

  const orderBreakdown = orders.map((order) => ({
    orderId: order.id,
    orderNumber: order.orderNumber,
    productName: order.items?.[0]?.name || '상품명 없음',
    amount: order.totalAmount || 0,
    commission: order.commission || 0,
    date: order.createdAt instanceof Date ? order.createdAt : new Date(),
  }));

  return {
    totalSales,
    totalOrders: settlement.orderCount,
    platformCommission,
    pgFees,
    referralCommission,
    netAmount,
    orderBreakdown,
  };
}

// ---------- Calculate Tax Amounts ----------

export function calculateTaxAmounts(supplyAmount: number): {
  supplyAmount: number;
  taxAmount: number;
  totalAmount: number;
} {
  const taxAmount = Math.round(supplyAmount * 0.1); // 부가세 10%
  const totalAmount = supplyAmount + taxAmount;

  return {
    supplyAmount,
    taxAmount,
    totalAmount,
  };
}
