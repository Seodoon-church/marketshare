// ============================================
// 사용자 생성 트리거 - Firestore 사용자 문서 초기화
// ============================================

import { auth } from "firebase-functions/v1";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

const db = admin.firestore();

/**
 * Auth 트리거: 새 사용자가 생성될 때
 *
 * - Firestore users/{uid} 문서에 기본 프로필 생성
 * - 기본 역할: 'customer'
 * - 기본 프로필 필드 설정
 */
export const onUserCreate = auth.user().onCreate(async (user) => {
  const uid = user.uid;

  try {
    logger.info(`[사용자 생성] uid: ${uid}, email: ${user.email || "없음"}`);

    // 소셜 로그인 정보 추출
    let socialProvider: string | null = null;
    let socialProviderId: string | null = null;

    if (user.providerData && user.providerData.length > 0) {
      const provider = user.providerData[0];
      socialProvider = provider.providerId || null;
      socialProviderId = provider.uid || null;
    }

    // Firestore 사용자 문서 생성
    const userDoc = {
      id: uid,
      email: user.email || "",
      name: user.displayName || "",
      phone: user.phoneNumber || "",
      role: "customer" as const,
      ownedMallIds: [],
      profileImageUrl: user.photoURL || null,
      gender: null,
      birthDate: null,
      isVerified: user.emailVerified || false,
      verificationMethod: null,
      socialProvider: socialProvider,
      socialProviderId: socialProviderId,
      defaultAddress: null,
      addresses: [],
      marketingConsent: false,
      privacyConsent: false,
      referredBy: null,
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.doc(`users/${uid}`).set(userDoc);

    logger.info(
      `[사용자 문서 생성 완료] uid: ${uid}, email: ${user.email || "없음"}, role: customer`
    );
  } catch (error) {
    logger.error(`[사용자 생성 처리 오류] uid: ${uid}`, error);
    throw error;
  }
});
