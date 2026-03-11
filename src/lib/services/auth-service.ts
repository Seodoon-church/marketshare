// ============================================
// MarketShare - Auth Service
// ============================================

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithCustomToken,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  UserCredential,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { auth, db } from '@/lib/firebase/config';
import type { User } from '@/types';

// ---------- Helper ----------

function toFirestoreTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

function fromFirestoreDoc(docSnap: ReturnType<typeof doc> extends infer D ? any : never): User | null {
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    ...data,
    id: docSnap.id,
    birthDate: data.birthDate?.toDate() ?? null,
    lastLoginAt: data.lastLoginAt?.toDate() ?? new Date(),
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
  } as User;
}

// ---------- Sign Up ----------

export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
  phone: string
): Promise<User> {
  try {
    const credential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { uid } = credential.user;

    const userData: Omit<User, 'id'> = {
      email,
      name,
      phone,
      role: 'customer',
      ownedMallIds: [],
      profileImageUrl: null,
      gender: null,
      birthDate: null,
      isVerified: false,
      verificationMethod: null,
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
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, 'users', uid), {
      ...userData,
      lastLoginAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { id: uid, ...userData };
  } catch (error: any) {
    switch (error.code) {
      case 'auth/email-already-in-use':
        throw new Error('이미 사용 중인 이메일입니다.');
      case 'auth/weak-password':
        throw new Error('비밀번호는 6자 이상이어야 합니다.');
      case 'auth/invalid-email':
        throw new Error('유효하지 않은 이메일 형식입니다.');
      default:
        throw new Error('회원가입 중 오류가 발생했습니다. 다시 시도해 주세요.');
    }
  }
}

// ---------- Sign In ----------

export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);

    // Update last login timestamp (merge로 문서가 없어도 안전)
    await setDoc(doc(db, 'users', credential.user.uid), {
      lastLoginAt: serverTimestamp(),
    }, { merge: true });

    return credential;
  } catch (error: any) {
    switch (error.code) {
      case 'auth/user-not-found':
        throw new Error('등록되지 않은 이메일입니다.');
      case 'auth/wrong-password':
        throw new Error('비밀번호가 올바르지 않습니다.');
      case 'auth/too-many-requests':
        throw new Error('로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.');
      case 'auth/user-disabled':
        throw new Error('비활성화된 계정입니다. 관리자에게 문의해 주세요.');
      default:
        throw new Error('로그인 중 오류가 발생했습니다. 다시 시도해 주세요.');
    }
  }
}

// ---------- Google Sign In ----------

export async function signInWithGoogle(): Promise<UserCredential> {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');

    const credential = await signInWithPopup(auth, provider);
    const { uid, email, displayName, photoURL } = credential.user;

    // Check if user document already exists
    const userDoc = await getDoc(doc(db, 'users', uid));

    if (!userDoc.exists()) {
      // Create new user document for first-time Google sign-in
      const userData: Omit<User, 'id'> = {
        email: email ?? '',
        name: displayName ?? '',
        phone: '',
        role: 'customer',
        ownedMallIds: [],
        profileImageUrl: photoURL ?? null,
        gender: null,
        birthDate: null,
        isVerified: true,
        verificationMethod: 'google',
        socialProvider: 'google',
        socialProviderId: uid,
        defaultAddress: null,
        addresses: [],
        marketingConsent: false,
        privacyConsent: true,
        referredBy: null,
        pointBalance: 0,
        pointsByMall: {},
        gradeByMall: {},
        supplierIds: [],
        lastLoginAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(doc(db, 'users', uid), {
        ...userData,
        lastLoginAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(doc(db, 'users', uid), {
        lastLoginAt: serverTimestamp(),
      }, { merge: true });
    }

    return credential;
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('로그인이 취소되었습니다.');
    }
    if (error.code === 'auth/account-exists-with-different-credential') {
      throw new Error('이미 다른 방법으로 가입된 이메일입니다.');
    }
    throw new Error('Google 로그인 중 오류가 발생했습니다.');
  }
}

// ---------- Kakao Sign In ----------

export async function signInWithKakao(): Promise<UserCredential> {
  try {
    const functions = getFunctions(undefined, 'asia-northeast3');
    const createKakaoToken = httpsCallable<{ code: string }, { customToken: string }>(
      functions,
      'createKakaoCustomToken'
    );

    // Redirect to Kakao OAuth and get auth code
    // The actual Kakao OAuth flow is handled on the client side
    // This function is called after receiving the auth code from Kakao redirect
    const kakaoAuthCode = await getKakaoAuthCode();

    const result = await createKakaoToken({ code: kakaoAuthCode });
    const credential = await signInWithCustomToken(auth, result.data.customToken);

    // Update last login (merge로 안전하게)
    await setDoc(doc(db, 'users', credential.user.uid), {
      lastLoginAt: serverTimestamp(),
    }, { merge: true });

    return credential;
  } catch (error: any) {
    throw new Error('카카오 로그인 중 오류가 발생했습니다. 다시 시도해 주세요.');
  }
}

// Placeholder: Kakao OAuth authorization code retrieval
async function getKakaoAuthCode(): Promise<string> {
  // This should be implemented with Kakao SDK or redirect flow
  // The auth code is typically obtained via URL redirect callback
  throw new Error('카카오 인증 코드를 가져올 수 없습니다. 카카오 SDK를 초기화해 주세요.');
}

// ---------- Naver Sign In ----------

export async function signInWithNaver(): Promise<UserCredential> {
  try {
    const functions = getFunctions(undefined, 'asia-northeast3');
    const createNaverToken = httpsCallable<{ code: string; state: string }, { customToken: string }>(
      functions,
      'createNaverCustomToken'
    );

    // The actual Naver OAuth flow is handled on the client side
    const { code, state } = await getNaverAuthCode();

    const result = await createNaverToken({ code, state });
    const credential = await signInWithCustomToken(auth, result.data.customToken);

    // Update last login (merge로 안전하게)
    await setDoc(doc(db, 'users', credential.user.uid), {
      lastLoginAt: serverTimestamp(),
    }, { merge: true });

    return credential;
  } catch (error: any) {
    throw new Error('네이버 로그인 중 오류가 발생했습니다. 다시 시도해 주세요.');
  }
}

// Placeholder: Naver OAuth authorization code retrieval
async function getNaverAuthCode(): Promise<{ code: string; state: string }> {
  // This should be implemented with Naver Login SDK or redirect flow
  throw new Error('네이버 인증 코드를 가져올 수 없습니다. 네이버 로그인 SDK를 초기화해 주세요.');
}

// ---------- Sign Out ----------

export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    throw new Error('로그아웃 중 오류가 발생했습니다.');
  }
}

// ---------- Reset Password ----------

export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    switch (error.code) {
      case 'auth/user-not-found':
        throw new Error('등록되지 않은 이메일입니다.');
      case 'auth/invalid-email':
        throw new Error('유효하지 않은 이메일 형식입니다.');
      default:
        throw new Error('비밀번호 재설정 이메일 전송 중 오류가 발생했습니다.');
    }
  }
}

// ---------- Update Profile ----------

export async function updateProfile(
  userId: string,
  data: Partial<User>
): Promise<void> {
  try {
    const updateData: Record<string, any> = { ...data, updatedAt: serverTimestamp() };

    // Remove id from update data to avoid overwriting the document id
    delete updateData.id;
    delete updateData.createdAt;

    // Convert Date fields to Firestore Timestamps
    if (updateData.birthDate instanceof Date) {
      updateData.birthDate = toFirestoreTimestamp(updateData.birthDate);
    }
    if (updateData.lastLoginAt instanceof Date) {
      updateData.lastLoginAt = toFirestoreTimestamp(updateData.lastLoginAt);
    }

    await setDoc(doc(db, 'users', userId), updateData, { merge: true });
  } catch (error: any) {
    throw new Error('프로필 업데이트 중 오류가 발생했습니다.');
  }
}

// ---------- Get User Profile ----------

export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    return fromFirestoreDoc(userDoc);
  } catch (error: any) {
    throw new Error('사용자 정보를 불러오는 중 오류가 발생했습니다.');
  }
}
