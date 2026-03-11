// ============================================
// MarketShare - Supplier Service
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
  startAfter,
  Timestamp,
  DocumentSnapshot,
  serverTimestamp,
  QueryConstraint,
  writeBatch,
  increment,
  getCountFromServer,
  sum,
  getAggregateFromServer,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type {
  Supplier,
  SupplierApprovalStatus,
  SupplierApplication,
  SupplierSettlement,
  BankInfo,
  SettlementStatus,
} from '@/types';

// ---------- Helper ----------

function supplierFromDoc(docSnap: DocumentSnapshot): Supplier {
  const data = docSnap.data()!;
  return {
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
  } as Supplier;
}

function applicationFromDoc(docSnap: DocumentSnapshot): SupplierApplication {
  const data = docSnap.data()!;
  return {
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
  } as SupplierApplication;
}

function settlementFromDoc(docSnap: DocumentSnapshot): SupplierSettlement {
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
  } as SupplierSettlement;
}

// ---------- Apply As Supplier ----------

export async function applyAsSupplier(
  data: Omit<
    SupplierApplication,
    | 'id'
    | 'status'
    | 'reviewedBy'
    | 'adminNotes'
    | 'supplierId'
    | 'createdAt'
    | 'updatedAt'
  >
): Promise<string> {
  try {
    const applicationData = {
      ...data,
      status: 'pending' as const,
      reviewedBy: null,
      adminNotes: '',
      supplierId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, 'supplier_applications'),
      applicationData
    );

    return docRef.id;
  } catch (error: any) {
    throw new Error('공급사 신청 중 오류가 발생했습니다.');
  }
}

// ---------- Get Supplier Applications ----------

export interface SupplierApplicationFilters {
  status?: string;
  limit?: number;
  startAfter?: DocumentSnapshot;
}

export interface SupplierApplicationListResult {
  applications: SupplierApplication[];
  hasMore: boolean;
}

export async function getSupplierApplications(
  filters: SupplierApplicationFilters = {}
): Promise<SupplierApplicationListResult> {
  try {
    const constraints: QueryConstraint[] = [];

    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const pageSize = filters.limit ?? 20;
    constraints.push(firestoreLimit(pageSize + 1));

    if (filters.startAfter) {
      constraints.push(startAfter(filters.startAfter));
    }

    const q = query(collection(db, 'supplier_applications'), ...constraints);
    const snapshot = await getDocs(q);

    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const resultDocs = hasMore ? docs.slice(0, pageSize) : docs;

    return {
      applications: resultDocs.map(applicationFromDoc),
      hasMore,
    };
  } catch (error: any) {
    throw new Error('공급사 신청 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Approve Supplier Application ----------

export async function approveSupplierApplication(
  applicationId: string,
  adminId: string,
  commissionRate: number,
  assignedMallIds: string[]
): Promise<string> {
  try {
    const batch = writeBatch(db);

    // 1. Get application data
    const appRef = doc(db, 'supplier_applications', applicationId);
    const appSnap = await getDoc(appRef);

    if (!appSnap.exists()) {
      throw new Error('신청 정보를 찾을 수 없습니다.');
    }

    const appData = appSnap.data() as SupplierApplication;

    // 2. Create Supplier document
    const supplierId = doc(collection(db, 'suppliers')).id;
    const supplierRef = doc(db, 'suppliers', supplierId);

    const supplierData = {
      name: appData.businessName,
      contactName: appData.applicantName,
      email: appData.applicantEmail,
      phone: appData.applicantPhone,
      businessNumber: appData.businessNumber,
      address: '',
      bankInfo: {
        bank: '',
        accountNumber: '',
        holder: appData.applicantName,
      } as BankInfo,
      commissionRate,
      isActive: true,
      approvalStatus: 'approved' as SupplierApprovalStatus,
      approvedBy: adminId,
      userId: appData.applicantEmail, // Assuming email is used as userId reference
      assignedMallIds,
      productCount: 0,
      totalSales: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    batch.set(supplierRef, supplierData);

    // 3. Update application status
    batch.update(appRef, {
      status: 'approved',
      reviewedBy: adminId,
      supplierId,
      updatedAt: serverTimestamp(),
    });

    // 4. Update user role to supplier and add supplierId
    // Find user by email
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', appData.applicantEmail),
      firestoreLimit(1)
    );
    const userSnapshot = await getDocs(usersQuery);

    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0];
      const userData = userDoc.data();
      const currentSupplierIds = userData.supplierIds ?? [];

      batch.update(userDoc.ref, {
        role: 'supplier',
        supplierIds: [...currentSupplierIds, supplierId],
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();

    return supplierId;
  } catch (error: any) {
    if (error.message === '신청 정보를 찾을 수 없습니다.') {
      throw error;
    }
    throw new Error('공급사 승인 중 오류가 발생했습니다.');
  }
}

// ---------- Reject Supplier Application ----------

export async function rejectSupplierApplication(
  applicationId: string,
  adminId: string,
  reason: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'supplier_applications', applicationId), {
      status: 'rejected',
      reviewedBy: adminId,
      adminNotes: reason,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error('공급사 거절 중 오류가 발생했습니다.');
  }
}

// ---------- Get Suppliers ----------

export interface SupplierFilters {
  isActive?: boolean;
  approvalStatus?: SupplierApprovalStatus;
  search?: string;
  limit?: number;
}

export async function getSuppliers(
  filters: SupplierFilters = {}
): Promise<Supplier[]> {
  try {
    const constraints: QueryConstraint[] = [];

    if (filters.isActive !== undefined) {
      constraints.push(where('isActive', '==', filters.isActive));
    }

    if (filters.approvalStatus) {
      constraints.push(where('approvalStatus', '==', filters.approvalStatus));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    if (filters.limit) {
      constraints.push(firestoreLimit(filters.limit));
    }

    const q = query(collection(db, 'suppliers'), ...constraints);
    const snapshot = await getDocs(q);

    let suppliers = snapshot.docs.map(supplierFromDoc);

    // Client-side search filtering
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      suppliers = suppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(searchLower) ||
          s.contactName.toLowerCase().includes(searchLower) ||
          s.email.toLowerCase().includes(searchLower) ||
          s.phone.includes(searchLower)
      );
    }

    return suppliers;
  } catch (error: any) {
    throw new Error('공급사 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Get Supplier By ID ----------

export async function getSupplierById(
  supplierId: string
): Promise<Supplier | null> {
  try {
    const docSnap = await getDoc(doc(db, 'suppliers', supplierId));
    if (!docSnap.exists()) return null;
    return supplierFromDoc(docSnap);
  } catch (error: any) {
    throw new Error('공급사 정보를 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Update Supplier ----------

export async function updateSupplier(
  supplierId: string,
  data: Partial<Supplier>
): Promise<void> {
  try {
    const updateData: Record<string, any> = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    // Remove immutable fields
    delete updateData.id;
    delete updateData.createdAt;

    await updateDoc(doc(db, 'suppliers', supplierId), updateData);
  } catch (error: any) {
    throw new Error('공급사 정보 수정 중 오류가 발생했습니다.');
  }
}

// ---------- Suspend Supplier ----------

export async function suspendSupplier(
  supplierId: string,
  reason: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'suppliers', supplierId), {
      approvalStatus: 'suspended',
      isActive: false,
      adminNotes: reason,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error('공급사 정지 중 오류가 발생했습니다.');
  }
}

// ---------- Get Supplier Products ----------

export interface SupplierProductFilters {
  status?: string;
  limit?: number;
}

export async function getSupplierProducts(
  supplierId: string,
  filters: SupplierProductFilters = {}
): Promise<any[]> {
  try {
    const constraints: QueryConstraint[] = [
      where('supplierId', '==', supplierId),
    ];

    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    if (filters.limit) {
      constraints.push(firestoreLimit(filters.limit));
    }

    const q = query(collection(db, 'products_aggregate'), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt?.toDate() ?? new Date(),
        updatedAt: data.updatedAt?.toDate() ?? new Date(),
        publishedAt: data.publishedAt?.toDate() ?? null,
      };
    });
  } catch (error: any) {
    throw new Error('공급사 상품 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Get Supplier Orders ----------

export interface SupplierOrderFilters {
  status?: string;
  limit?: number;
}

export async function getSupplierOrders(
  supplierId: string,
  filters: SupplierOrderFilters = {}
): Promise<any[]> {
  try {
    // Get supplier info to find assigned malls
    const supplier = await getSupplierById(supplierId);
    if (!supplier) {
      throw new Error('공급사 정보를 찾을 수 없습니다.');
    }

    // Query orders from assigned malls and filter by supplierId in items
    const allOrders: any[] = [];

    // If no assigned malls, return empty
    if (supplier.assignedMallIds.length === 0) {
      return [];
    }

    // Query orders for each assigned mall
    for (const mallId of supplier.assignedMallIds) {
      const constraints: QueryConstraint[] = [];

      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }

      constraints.push(orderBy('createdAt', 'desc'));

      if (filters.limit) {
        constraints.push(firestoreLimit(filters.limit));
      }

      const q = query(
        collection(db, 'malls', mallId, 'orders'),
        ...constraints
      );
      const snapshot = await getDocs(q);

      const orders = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          ...data,
          id: docSnap.id,
          createdAt: data.createdAt?.toDate() ?? new Date(),
          updatedAt: data.updatedAt?.toDate() ?? new Date(),
          paidAt: data.paidAt?.toDate() ?? null,
          shippedAt: data.shippedAt?.toDate() ?? null,
          deliveredAt: data.deliveredAt?.toDate() ?? null,
        };
      });

      allOrders.push(...orders);
    }

    // Filter orders that contain items from this supplier
    const supplierOrders = allOrders.filter((order) => {
      return order.items?.some((item: any) => item.supplierId === supplierId);
    });

    // Sort by createdAt descending and apply limit
    supplierOrders.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );

    if (filters.limit) {
      return supplierOrders.slice(0, filters.limit);
    }

    return supplierOrders;
  } catch (error: any) {
    if (error.message === '공급사 정보를 찾을 수 없습니다.') {
      throw error;
    }
    throw new Error('공급사 주문 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Get Supplier Dashboard ----------

export interface SupplierDashboard {
  totalProducts: number;
  totalOrders: number;
  totalSales: number;
  pendingSettlement: number;
  recentOrders: any[];
}

export async function getSupplierDashboard(
  supplierId: string
): Promise<SupplierDashboard> {
  try {
    // Get total products
    const productsQuery = query(
      collection(db, 'products_aggregate'),
      where('supplierId', '==', supplierId)
    );
    const productCountSnap = await getCountFromServer(productsQuery);

    // Get recent orders
    const recentOrders = await getSupplierOrders(supplierId, { limit: 10 });

    // Calculate total sales from completed orders
    let totalSales = 0;
    let totalOrders = 0;

    for (const order of recentOrders) {
      if (
        ['paid', 'preparing', 'shipped', 'delivered'].includes(order.status)
      ) {
        // Calculate sales for this supplier's items only
        const supplierItems = order.items?.filter(
          (item: any) => item.supplierId === supplierId
        );
        const orderSupplierTotal = supplierItems?.reduce(
          (sum: number, item: any) => sum + item.price * item.quantity,
          0
        );
        totalSales += orderSupplierTotal || 0;
        totalOrders++;
      }
    }

    // Get pending settlement amount
    const settlementsQuery = query(
      collection(db, 'supplier_settlements'),
      where('supplierId', '==', supplierId),
      where('status', '==', 'pending')
    );
    const settlementsSnap = await getDocs(settlementsQuery);

    let pendingSettlement = 0;
    settlementsSnap.docs.forEach((doc) => {
      const data = doc.data();
      pendingSettlement += data.totalSettlement || 0;
    });

    return {
      totalProducts: productCountSnap.data().count,
      totalOrders,
      totalSales,
      pendingSettlement,
      recentOrders: recentOrders.slice(0, 5),
    };
  } catch (error: any) {
    throw new Error('대시보드 정보를 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Get Supplier Settlements ----------

export interface SupplierSettlementFilters {
  status?: SettlementStatus;
  limit?: number;
}

export async function getSupplierSettlements(
  supplierId: string,
  filters: SupplierSettlementFilters = {}
): Promise<SupplierSettlement[]> {
  try {
    const constraints: QueryConstraint[] = [
      where('supplierId', '==', supplierId),
    ];

    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    if (filters.limit) {
      constraints.push(firestoreLimit(filters.limit));
    }

    const q = query(collection(db, 'supplier_settlements'), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(settlementFromDoc);
  } catch (error: any) {
    throw new Error('정산 내역을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Create Supplier Settlement ----------

export async function createSupplierSettlement(
  data: Omit<SupplierSettlement, 'id' | 'createdAt'>
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

    const docRef = await addDoc(
      collection(db, 'supplier_settlements'),
      settlementData
    );

    return docRef.id;
  } catch (error: any) {
    throw new Error('정산 생성 중 오류가 발생했습니다.');
  }
}

// ---------- Assign Supplier To Mall ----------

export async function assignSupplierToMall(
  supplierId: string,
  mallId: string
): Promise<void> {
  try {
    const supplierRef = doc(db, 'suppliers', supplierId);
    const supplierSnap = await getDoc(supplierRef);

    if (!supplierSnap.exists()) {
      throw new Error('공급사 정보를 찾을 수 없습니다.');
    }

    const currentMallIds: string[] = supplierSnap.data().assignedMallIds ?? [];

    // Check if already assigned
    if (currentMallIds.includes(mallId)) {
      return; // Already assigned, no action needed
    }

    await updateDoc(supplierRef, {
      assignedMallIds: [...currentMallIds, mallId],
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    if (error.message === '공급사 정보를 찾을 수 없습니다.') {
      throw error;
    }
    throw new Error('공급사 몰 할당 중 오류가 발생했습니다.');
  }
}

// ---------- Remove Supplier From Mall ----------

export async function removeSupplierFromMall(
  supplierId: string,
  mallId: string
): Promise<void> {
  try {
    const supplierRef = doc(db, 'suppliers', supplierId);
    const supplierSnap = await getDoc(supplierRef);

    if (!supplierSnap.exists()) {
      throw new Error('공급사 정보를 찾을 수 없습니다.');
    }

    const currentMallIds: string[] = supplierSnap.data().assignedMallIds ?? [];

    // Filter out the mallId
    const newMallIds = currentMallIds.filter((id) => id !== mallId);

    await updateDoc(supplierRef, {
      assignedMallIds: newMallIds,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    if (error.message === '공급사 정보를 찾을 수 없습니다.') {
      throw error;
    }
    throw new Error('공급사 몰 할당 해제 중 오류가 발생했습니다.');
  }
}
