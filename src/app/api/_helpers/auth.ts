import { NextRequest } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

export interface AuthUser {
  uid: string;
  role: string;
  email: string;
  ownedMallIds: string[];
  supplierIds: string[];
}

/**
 * Authorization 헤더에서 Bearer 토큰을 추출하고 Firebase Admin SDK로 검증합니다.
 * 검증 성공 시 사용자 정보를 반환하고, 실패 시 null을 반환합니다.
 */
export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
  try {
    // Authorization 헤더에서 Bearer 토큰 추출
    const authHeader = request.headers.get('Authorization');
    let token: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }

    // 헤더에 토큰이 없으면 쿠키에서 확인
    if (!token) {
      token = request.cookies.get('auth-token')?.value ?? null;
    }

    if (!token) {
      return null;
    }

    // Firebase Admin SDK로 토큰 검증
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Firestore에서 사용자 역할 정보 조회
    const userDoc = await adminDb.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return null;
    }

    const userData = userDoc.data()!;

    return {
      uid,
      role: userData.role || 'customer',
      email: decodedToken.email || userData.email || '',
      ownedMallIds: userData.ownedMallIds || [],
      supplierIds: userData.supplierIds || [],
    };
  } catch (error) {
    console.error('인증 토큰 검증 실패:', error);
    return null;
  }
}
