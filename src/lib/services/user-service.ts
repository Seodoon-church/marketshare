// ============================================
// MarketShare - User Service
// ============================================

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  DocumentSnapshot,
  serverTimestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { User, UserRole } from '@/types';

// ---------- Helper ----------

function userFromDoc(docSnap: DocumentSnapshot): User {
  const data = docSnap.data()!;
  return {
    ...data,
    id: docSnap.id,
    birthDate: data.birthDate?.toDate() ?? null,
    lastLoginAt: data.lastLoginAt?.toDate() ?? new Date(),
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
  } as User;
}

// ---------- Filters ----------

export interface UserFilters {
  role?: UserRole;
  search?: string;
  limit?: number;
  startAfterDoc?: DocumentSnapshot;
}

export interface UserListResult {
  users: User[];
  lastDoc: DocumentSnapshot | null;
  hasMore: boolean;
}

// ---------- Get Users ----------

export async function getUsers(
  filters: UserFilters = {}
): Promise<UserListResult> {
  try {
    const constraints: QueryConstraint[] = [];

    if (filters.role) {
      constraints.push(where('role', '==', filters.role));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const pageSize = filters.limit ?? 20;
    constraints.push(firestoreLimit(pageSize + 1));

    if (filters.startAfterDoc) {
      constraints.push(startAfter(filters.startAfterDoc));
    }

    const q = query(collection(db, 'users'), ...constraints);
    const snapshot = await getDocs(q);

    const docs = snapshot.docs;
    const hasMore = docs.length > pageSize;
    const resultDocs = hasMore ? docs.slice(0, pageSize) : docs;

    let users = resultDocs.map(userFromDoc);

    // Client-side search filtering (Firestore doesn't support full-text search)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(searchLower) ||
          u.email.toLowerCase().includes(searchLower) ||
          u.phone.includes(searchLower)
      );
    }

    return {
      users,
      lastDoc: resultDocs.length > 0 ? resultDocs[resultDocs.length - 1] : null,
      hasMore,
    };
  } catch (error: any) {
    throw new Error('사용자 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Get User By ID ----------

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const docSnap = await getDoc(doc(db, 'users', userId));
    if (!docSnap.exists()) return null;
    return userFromDoc(docSnap);
  } catch (error: any) {
    throw new Error('사용자 정보를 불러오는 중 오류가 발생했습니다.');
  }
}

// ---------- Update User Role ----------

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), {
      role,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error('사용자 역할 변경 중 오류가 발생했습니다.');
  }
}

// ---------- Create User (Admin) ----------
// Creates a Firebase Auth user + Firestore profile using secondary app instance
// so the admin's session is not disrupted.

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: UserRole;
}

export async function createUserByAdmin(data: CreateUserData): Promise<string> {
  const { initializeApp, deleteApp } = await import('firebase/app');
  const { getAuth, createUserWithEmailAndPassword } = await import('firebase/auth');

  // Use a secondary Firebase app so we don't sign out the current admin
  const tempApp = initializeApp(
    {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    },
    'admin-create-user-' + Date.now()
  );

  try {
    const tempAuth = getAuth(tempApp);
    const cred = await createUserWithEmailAndPassword(tempAuth, data.email, data.password);
    const uid = cred.user.uid;

    // Sign out immediately from the temp app
    await tempAuth.signOut();

    // Create user document in Firestore
    await setDoc(doc(db, 'users', uid), {
      email: data.email,
      name: data.name,
      phone: data.phone,
      role: data.role,
      ownedMallIds: [],
      profileImageUrl: null,
      gender: null,
      birthDate: null,
      isVerified: true,
      verificationMethod: 'admin',
      socialProvider: null,
      socialProviderId: null,
      defaultAddress: null,
      addresses: [],
      marketingConsent: false,
      privacyConsent: true,
      referredBy: null,
      pointBalance: 0,
      pointsByMall: {},
      gradeByMall: {},
      supplierIds: [],
      lastLoginAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return uid;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('이미 가입된 이메일 주소입니다.');
    }
    if (error.code === 'auth/weak-password') {
      throw new Error('비밀번호는 6자 이상이어야 합니다.');
    }
    if (error.code === 'auth/invalid-email') {
      throw new Error('올바른 이메일 주소를 입력해주세요.');
    }
    throw new Error(error.message || '회원 등록 중 오류가 발생했습니다.');
  } finally {
    await deleteApp(tempApp);
  }
}

// ---------- Update User ----------

export async function updateUser(
  userId: string,
  data: Partial<Pick<User, 'name' | 'phone' | 'role' | 'isVerified'>>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error('사용자 정보 수정 중 오류가 발생했습니다.');
  }
}

// ---------- Update User Grade (Admin) ----------

export async function updateUserGrade(
  userId: string,
  mallId: string,
  gradeId: string
): Promise<void> {
  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) throw new Error('사용자를 찾을 수 없습니다.');

    const gradeByMall: Record<string, string> = userSnap.data().gradeByMall ?? {};
    gradeByMall[mallId] = gradeId;

    await updateDoc(doc(db, 'users', userId), {
      gradeByMall,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    if (error.message === '사용자를 찾을 수 없습니다.') throw error;
    throw new Error('회원등급 변경 중 오류가 발생했습니다.');
  }
}
