// ============================================
// 소셜 로그인 HTTPS Callable 함수
// ============================================

import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

const db = admin.firestore();

// ---- 타입 정의 ----

interface KakaoLoginRequest {
  accessToken: string;
}

interface NaverLoginRequest {
  accessToken: string;
}

interface SocialLoginResponse {
  customToken: string;
  isNewUser: boolean;
  uid: string;
}

interface KakaoUserInfo {
  id: number;
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
    phone_number?: string;
    gender?: string;
    birthday?: string;
  };
}

interface NaverUserInfo {
  response: {
    id: string;
    email?: string;
    name?: string;
    profile_image?: string;
    mobile?: string;
    gender?: string;
    birthday?: string;
  };
}

// ---- 카카오 로그인 ----

/**
 * HTTPS Callable: 카카오 소셜 로그인
 *
 * 1. 카카오 access token을 받아 카카오 API로 사용자 정보 조회
 * 2. Firebase Custom Token 생성/반환
 * 3. 신규 사용자인 경우 Firestore에 사용자 문서 생성
 */
export const kakaoLogin = onCall<KakaoLoginRequest>(
  async (request): Promise<SocialLoginResponse> => {
    const { accessToken } = request.data;

    if (!accessToken) {
      throw new HttpsError(
        "invalid-argument",
        "카카오 액세스 토큰이 필요합니다."
      );
    }

    try {
      // 1. 카카오 API로 사용자 정보 조회
      const kakaoUser = await verifyKakaoToken(accessToken);

      if (!kakaoUser || !kakaoUser.id) {
        throw new HttpsError(
          "unauthenticated",
          "카카오 인증에 실패했습니다."
        );
      }

      const kakaoId = String(kakaoUser.id);
      const uid = `kakao:${kakaoId}`;
      const email =
        kakaoUser.kakao_account?.email || `${kakaoId}@kakao.marketshare.kr`;
      const displayName =
        kakaoUser.kakao_account?.profile?.nickname || "";
      const photoURL =
        kakaoUser.kakao_account?.profile?.profile_image_url || null;
      const phone = kakaoUser.kakao_account?.phone_number || "";

      // 2. Firebase 사용자 생성 또는 조회
      let isNewUser = false;

      try {
        await admin.auth().getUser(uid);
        logger.info(
          `[카카오 로그인] 기존 사용자: ${uid}, email: ${email}`
        );
      } catch {
        // 사용자가 없으면 생성
        await admin.auth().createUser({
          uid: uid,
          email: email,
          displayName: displayName,
          photoURL: photoURL,
        });
        isNewUser = true;
        logger.info(
          `[카카오 로그인] 신규 사용자 생성: ${uid}, email: ${email}`
        );
      }

      // 3. Firestore 사용자 문서 생성/업데이트
      const userRef = db.doc(`users/${uid}`);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        await userRef.set({
          id: uid,
          email: email,
          name: displayName,
          phone: phone,
          role: "customer",
          ownedMallIds: [],
          profileImageUrl: photoURL,
          gender: kakaoUser.kakao_account?.gender || null,
          birthDate: null,
          isVerified: true,
          verificationMethod: "kakao",
          socialProvider: "kakao",
          socialProviderId: kakaoId,
          defaultAddress: null,
          addresses: [],
          marketingConsent: false,
          privacyConsent: false,
          referredBy: null,
          lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        await userRef.update({
          lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // 4. Firebase Custom Token 생성
      const customToken = await admin.auth().createCustomToken(uid, {
        provider: "kakao",
        kakaoId: kakaoId,
      });

      logger.info(
        `[카카오 로그인 완료] uid: ${uid}, isNewUser: ${isNewUser}`
      );

      return {
        customToken,
        isNewUser,
        uid,
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      logger.error("[카카오 로그인 오류]", error);
      throw new HttpsError(
        "internal",
        "카카오 로그인 처리 중 오류가 발생했습니다."
      );
    }
  }
);

// ---- 네이버 로그인 ----

/**
 * HTTPS Callable: 네이버 소셜 로그인
 *
 * 1. 네이버 access token을 받아 네이버 API로 사용자 정보 조회
 * 2. Firebase Custom Token 생성/반환
 * 3. 신규 사용자인 경우 Firestore에 사용자 문서 생성
 */
export const naverLogin = onCall<NaverLoginRequest>(
  async (request): Promise<SocialLoginResponse> => {
    const { accessToken } = request.data;

    if (!accessToken) {
      throw new HttpsError(
        "invalid-argument",
        "네이버 액세스 토큰이 필요합니다."
      );
    }

    try {
      // 1. 네이버 API로 사용자 정보 조회
      const naverUser = await verifyNaverToken(accessToken);

      if (!naverUser || !naverUser.response?.id) {
        throw new HttpsError(
          "unauthenticated",
          "네이버 인증에 실패했습니다."
        );
      }

      const naverId = naverUser.response.id;
      const uid = `naver:${naverId}`;
      const email =
        naverUser.response.email ||
        `${naverId}@naver.marketshare.kr`;
      const displayName = naverUser.response.name || "";
      const photoURL = naverUser.response.profile_image || null;
      const phone = naverUser.response.mobile || "";

      // 2. Firebase 사용자 생성 또는 조회
      let isNewUser = false;

      try {
        await admin.auth().getUser(uid);
        logger.info(
          `[네이버 로그인] 기존 사용자: ${uid}, email: ${email}`
        );
      } catch {
        // 사용자가 없으면 생성
        await admin.auth().createUser({
          uid: uid,
          email: email,
          displayName: displayName,
          photoURL: photoURL,
        });
        isNewUser = true;
        logger.info(
          `[네이버 로그인] 신규 사용자 생성: ${uid}, email: ${email}`
        );
      }

      // 3. Firestore 사용자 문서 생성/업데이트
      const userRef = db.doc(`users/${uid}`);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        await userRef.set({
          id: uid,
          email: email,
          name: displayName,
          phone: phone,
          role: "customer",
          ownedMallIds: [],
          profileImageUrl: photoURL,
          gender: naverUser.response.gender || null,
          birthDate: null,
          isVerified: true,
          verificationMethod: "naver",
          socialProvider: "naver",
          socialProviderId: naverId,
          defaultAddress: null,
          addresses: [],
          marketingConsent: false,
          privacyConsent: false,
          referredBy: null,
          lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } else {
        await userRef.update({
          lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      // 4. Firebase Custom Token 생성
      const customToken = await admin.auth().createCustomToken(uid, {
        provider: "naver",
        naverId: naverId,
      });

      logger.info(
        `[네이버 로그인 완료] uid: ${uid}, isNewUser: ${isNewUser}`
      );

      return {
        customToken,
        isNewUser,
        uid,
      };
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      logger.error("[네이버 로그인 오류]", error);
      throw new HttpsError(
        "internal",
        "네이버 로그인 처리 중 오류가 발생했습니다."
      );
    }
  }
);

// ---- 유틸리티 함수 ----

/**
 * 카카오 액세스 토큰을 검증하고 사용자 정보를 반환
 */
async function verifyKakaoToken(
  accessToken: string
): Promise<KakaoUserInfo> {
  const response = await fetch("https://kapi.kakao.com/v2/user/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
  });

  if (!response.ok) {
    logger.error(
      `[카카오 토큰 검증 실패] status: ${response.status}`
    );
    throw new HttpsError(
      "unauthenticated",
      "카카오 토큰 검증에 실패했습니다."
    );
  }

  const data = (await response.json()) as KakaoUserInfo;
  return data;
}

/**
 * 네이버 액세스 토큰을 검증하고 사용자 정보를 반환
 */
async function verifyNaverToken(
  accessToken: string
): Promise<NaverUserInfo> {
  const response = await fetch("https://openapi.naver.com/v1/nid/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    logger.error(
      `[네이버 토큰 검증 실패] status: ${response.status}`
    );
    throw new HttpsError(
      "unauthenticated",
      "네이버 토큰 검증에 실패했습니다."
    );
  }

  const data = (await response.json()) as NaverUserInfo;
  return data;
}
