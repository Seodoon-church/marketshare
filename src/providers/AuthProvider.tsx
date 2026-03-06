'use client';

import { useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/auth-store';
import type { User } from '@/types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'id'>;
            setUser({ id: firebaseUser.uid, ...userData });
          } else {
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || '',
              phone: '',
              role: 'customer',
              ownedMallIds: [],
              profileImageUrl: firebaseUser.photoURL,
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
              lastLoginAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  return <>{children}</>;
}
