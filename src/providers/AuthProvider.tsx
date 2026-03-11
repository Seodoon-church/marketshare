'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/auth-store';
import type { User } from '@/types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setLoading } = useAuthStore();
  const hasReceivedUser = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        hasReceivedUser.current = true;

        // Firestore 프로필 로드 (최대 2회 재시도)
        let retries = 0;
        const maxRetries = 2;

        while (retries <= maxRetries) {
          try {
            let userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (!userDoc.exists() && retries === 0) {
              await new Promise((r) => setTimeout(r, 1500));
              userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            }

            if (userDoc.exists()) {
              const userData = userDoc.data() as Omit<User, 'id'>;
              const name = userData.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '';
              setUser({ id: firebaseUser.uid, ...userData, name });
            } else {
              const newUserData: Omit<User, 'id'> = {
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
                phone: '',
                role: 'customer',
                ownedMallIds: [],
                profileImageUrl: firebaseUser.photoURL || null,
                gender: null,
                birthDate: null,
                isVerified: false,
                verificationMethod: null,
                socialProvider: null,
                socialProviderId: null,
                defaultAddress: null,
                addresses: [],
                marketingConsent: false,
                privacyConsent: false,
                referredBy: null,
                pointBalance: 0,
                pointsByMall: {},
                gradeByMall: {},
                supplierIds: [],
                lastLoginAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              await setDoc(doc(db, 'users', firebaseUser.uid), {
                ...newUserData,
                lastLoginAt: serverTimestamp(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              });

              setUser({ id: firebaseUser.uid, ...newUserData });
            }
            break;
          } catch {
            retries++;
            if (retries > maxRetries) {
              setUser({
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
                phone: '',
                role: 'customer',
                ownedMallIds: [],
                profileImageUrl: firebaseUser.photoURL || null,
                gender: null,
                birthDate: null,
                isVerified: false,
                verificationMethod: null,
                socialProvider: null,
                socialProviderId: null,
                defaultAddress: null,
                addresses: [],
                marketingConsent: false,
                privacyConsent: false,
                referredBy: null,
                pointBalance: 0,
                pointsByMall: {},
                gradeByMall: {},
                supplierIds: [],
                lastLoginAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
              });
            } else {
              await new Promise((r) => setTimeout(r, 1000));
            }
          }
        }
      } else {
        // onAuthStateChanged가 캐시 토큰 확인 전에 null을 먼저 보낼 수 있음
        // 첫 호출이 null이면 짧은 대기 후 auth.currentUser 확인
        if (!hasReceivedUser.current) {
          // 첫 번째 대기 (200ms) - 캐시된 토큰 확인 시간
          await new Promise((r) => setTimeout(r, 200));
          if (auth.currentUser) {
            return;
          }
          // 두 번째 대기 (300ms 추가) - 네트워크 지연 고려
          await new Promise((r) => setTimeout(r, 300));
          if (auth.currentUser) {
            return;
          }
        }
        hasReceivedUser.current = false;
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return <>{children}</>;
}
