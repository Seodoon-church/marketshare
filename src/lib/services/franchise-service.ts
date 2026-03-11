// ============================================
// MarketShare - Franchise Application Service
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
  DocumentSnapshot,
  serverTimestamp,
  QueryConstraint,
  arrayUnion,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { FranchiseApplication, FranchiseApplicationStatus, Mall } from '@/types';

// ---------- Helper ----------

function applicationFromDoc(docSnap: DocumentSnapshot): FranchiseApplication {
  const data = docSnap.data()!;
  return {
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
  } as FranchiseApplication;
}

// ---------- Filters ----------

export interface FranchiseFilters {
  status?: FranchiseApplicationStatus;
  search?: string;
  limit?: number;
  startAfterDoc?: DocumentSnapshot;
}

// ---------- Get Applications ----------

export async function getFranchiseApplications(
  filters: FranchiseFilters = {}
): Promise<FranchiseApplication[]> {
  try {
    const constraints: QueryConstraint[] = [];

    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    if (filters.limit) {
      constraints.push(firestoreLimit(filters.limit));
    }

    if (filters.startAfterDoc) {
      constraints.push(startAfter(filters.startAfterDoc));
    }

    const q = query(collection(db, 'franchise_applications'), ...constraints);
    const snapshot = await getDocs(q);

    let applications = snapshot.docs.map(applicationFromDoc);

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      applications = applications.filter(
        (a) =>
          a.applicantName.toLowerCase().includes(searchLower) ||
          a.desiredMallName.toLowerCase().includes(searchLower) ||
          a.applicantPhone.includes(searchLower)
      );
    }

    return applications;
  } catch (error: any) {
    throw new Error('분양 신청 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Get Application By ID ----------

export async function getFranchiseApplicationById(
  applicationId: string
): Promise<FranchiseApplication | null> {
  try {
    const docSnap = await getDoc(doc(db, 'franchise_applications', applicationId));
    if (!docSnap.exists()) return null;
    return applicationFromDoc(docSnap);
  } catch (error: any) {
    throw new Error('분양 신청 정보를 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Create Application ----------

export async function createFranchiseApplication(
  data: Omit<FranchiseApplication, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, 'franchise_applications'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error: any) {
    throw new Error('분양 신청 등록 중 오류가 발생했습니다.');
  }
}

// ---------- Update Application Status ----------

export async function updateApplicationStatus(
  applicationId: string,
  status: FranchiseApplicationStatus,
  adminNotes?: string
): Promise<void> {
  try {
    const updateData: Record<string, any> = {
      status,
      updatedAt: serverTimestamp(),
    };
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }
    await updateDoc(doc(db, 'franchise_applications', applicationId), updateData);
  } catch (error: any) {
    throw new Error('분양 신청 상태 변경 중 오류가 발생했습니다.');
  }
}

// ---------- Approve Application ----------

export async function approveFranchiseApplication(
  applicationId: string,
  mallId: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'franchise_applications', applicationId), {
      status: 'approved' as FranchiseApplicationStatus,
      mallId,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error('분양 신청 승인 중 오류가 발생했습니다.');
  }
}

// ---------- Reject Application ----------

export async function rejectFranchiseApplication(
  applicationId: string,
  reason: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'franchise_applications', applicationId), {
      status: 'rejected' as FranchiseApplicationStatus,
      adminNotes: reason,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error('분양 신청 반려 중 오류가 발생했습니다.');
  }
}

// ---------- Get Franchise Applications for a Specific Parent Mall ----------
// Used by 본사 mall-admin to see only their franchise applications

export async function getFranchiseApplicationsForMall(
  parentMallId: string,
  filters: FranchiseFilters = {}
): Promise<FranchiseApplication[]> {
  try {
    const constraints: QueryConstraint[] = [];
    constraints.push(where('parentMallId', '==', parentMallId));

    if (filters.status) {
      constraints.push(where('status', '==', filters.status));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    if (filters.limit) {
      constraints.push(firestoreLimit(filters.limit));
    }

    const q = query(collection(db, 'franchise_applications'), ...constraints);
    const snapshot = await getDocs(q);

    let applications = snapshot.docs.map(applicationFromDoc);

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      applications = applications.filter(
        (a) =>
          a.applicantName.toLowerCase().includes(searchLower) ||
          a.desiredMallName.toLowerCase().includes(searchLower) ||
          a.applicantPhone.includes(searchLower)
      );
    }

    return applications;
  } catch (error: any) {
    throw new Error('분양 신청 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Get Franchise Malls (Child Malls of a Parent) ----------
// Used by 본사 to see all their franchisee malls

export async function getFranchiseMalls(parentMallId: string): Promise<Mall[]> {
  try {
    const q = query(
      collection(db, 'malls'),
      where('parentMallId', '==', parentMallId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt?.toDate() ?? new Date(),
        updatedAt: data.updatedAt?.toDate() ?? new Date(),
        franchiseStartDate: data.franchiseStartDate?.toDate() ?? new Date(),
        franchiseEndDate: data.franchiseEndDate?.toDate() ?? null,
      } as Mall;
    });
  } catch (error: any) {
    throw new Error('가맹점 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Update Franchise Settings ----------
// Used by franchisee to update their franchise display settings

export async function updateFranchiseSettings(
  mallId: string,
  settings: {
    showHeadquartersProducts?: boolean;
    showNetworkProducts?: boolean;
    shareOwnProducts?: boolean;
  }
): Promise<void> {
  try {
    const mallRef = doc(db, 'malls', mallId);
    const mallSnap = await getDoc(mallRef);
    if (!mallSnap.exists()) throw new Error('몰을 찾을 수 없습니다.');

    const current = mallSnap.data().franchiseSettings ?? {
      showHeadquartersProducts: true,
      showNetworkProducts: true,
      shareOwnProducts: true,
      hiddenProductIds: [],
      customCommissionRate: null,
    };

    await updateDoc(mallRef, {
      franchiseSettings: { ...current, ...settings },
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    if (error.message === '몰을 찾을 수 없습니다.') throw error;
    throw new Error('분양 설정 변경 중 오류가 발생했습니다.');
  }
}

// ---------- Add Child Mall to Parent ----------
// Updates parent's childMallIds array

export async function addChildMallToParent(
  parentMallId: string,
  childMallId: string
): Promise<void> {
  try {
    await updateDoc(doc(db, 'malls', parentMallId), {
      childMallIds: arrayUnion(childMallId),
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error('가맹점 등록 중 오류가 발생했습니다.');
  }
}
