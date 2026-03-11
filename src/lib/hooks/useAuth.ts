import { useCallback } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  signInWithEmail,
  signUpWithEmail,
  signOut as signOutService,
  signInWithGoogle as googleSignIn,
  signInWithKakao as kakaoSignIn,
  signInWithNaver as naverSignIn,
  getUserProfile,
} from '@/lib/services/auth-service';

export function useAuth() {
  const { user, isLoading, isAuthenticated, setUser, setLoading, logout } =
    useAuthStore();

  const isAdmin = user?.role === 'platform_admin';
  // platform_admin은 모든 몰 관리 기능에도 접근 가능
  const isMallOwner = user?.role === 'mall_owner' || user?.role === 'platform_admin';

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const credential = await signInWithEmail(email, password);
        const profile = await getUserProfile(credential.user.uid);
        if (profile) setUser(profile);
        return profile;
      } catch (error) {
        setLoading(false);
        throw error;
      }
    },
    [setUser, setLoading]
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string, phone: string) => {
      setLoading(true);
      try {
        const profile = await signUpWithEmail(email, password, name, phone);
        setUser(profile);
        return profile;
      } catch (error) {
        setLoading(false);
        throw error;
      }
    },
    [setUser, setLoading]
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await signOutService();
      logout();
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, [setLoading, logout]);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      const credential = await googleSignIn();
      const profile = await getUserProfile(credential.user.uid);
      if (profile) setUser(profile);
      return profile;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, [setUser, setLoading]);

  const signInWithKakao = useCallback(async () => {
    setLoading(true);
    try {
      const credential = await kakaoSignIn();
      const profile = await getUserProfile(credential.user.uid);
      if (profile) setUser(profile);
      return profile;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, [setUser, setLoading]);

  const signInWithNaver = useCallback(async () => {
    setLoading(true);
    try {
      const credential = await naverSignIn();
      const profile = await getUserProfile(credential.user.uid);
      if (profile) setUser(profile);
      return profile;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, [setUser, setLoading]);

  return {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    isMallOwner,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInWithKakao,
    signInWithNaver,
  };
}
