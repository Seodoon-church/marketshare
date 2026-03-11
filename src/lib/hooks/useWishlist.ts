import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface WishlistItem {
  id: string;
  productId: string;
  addedAt: Date;
}

interface UseWishlistReturn {
  items: WishlistItem[];
  isLoading: boolean;
  addToWishlist: (productId: string) => Promise<void>;
  removeFromWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
}

/**
 * Manages the user's wishlist using the Firestore subcollection
 * `users/{userId}/wishlist`. Subscribes to real-time updates.
 *
 * @param userId - The user ID whose wishlist to manage
 */
export function useWishlist(userId: string | null | undefined): UseWishlistReturn {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const productIdSetRef = useRef<Set<string>>(new Set());

  // Subscribe to wishlist in real-time
  useEffect(() => {
    if (!userId) {
      setItems([]);
      setIsLoading(false);
      productIdSetRef.current = new Set();
      return;
    }

    setIsLoading(true);
    const wishlistRef = collection(db, 'users', userId, 'wishlist');

    const unsubscribe = onSnapshot(
      wishlistRef,
      (snapshot) => {
        const wishlistItems: WishlistItem[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            productId: data.productId,
            addedAt: data.addedAt?.toDate?.() ?? new Date(),
          };
        });

        setItems(wishlistItems);
        productIdSetRef.current = new Set(
          wishlistItems.map((item) => item.productId)
        );
        setIsLoading(false);
      },
      (err) => {
        console.error('위시리스트 로딩 실패:', err);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const addToWishlist = useCallback(
    async (productId: string) => {
      if (!userId) {
        throw new Error('로그인이 필요합니다.');
      }

      // Prevent duplicates
      if (productIdSetRef.current.has(productId)) return;

      const wishlistRef = collection(db, 'users', userId, 'wishlist');
      await addDoc(wishlistRef, {
        productId,
        addedAt: serverTimestamp(),
      });
    },
    [userId]
  );

  const removeFromWishlist = useCallback(
    async (productId: string) => {
      if (!userId) {
        throw new Error('로그인이 필요합니다.');
      }

      const wishlistRef = collection(db, 'users', userId, 'wishlist');
      const q = query(wishlistRef, where('productId', '==', productId));
      const snapshot = await getDocs(q);

      const deletePromises = snapshot.docs.map((docSnap) =>
        deleteDoc(doc(db, 'users', userId, 'wishlist', docSnap.id))
      );
      await Promise.all(deletePromises);
    },
    [userId]
  );

  const isInWishlist = useCallback(
    (productId: string): boolean => {
      return productIdSetRef.current.has(productId);
    },
    // We add items as a dependency so callers get updated results
    // when the wishlist changes, even though we use the ref internally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items]
  );

  return { items, isLoading, addToWishlist, removeFromWishlist, isInWishlist };
}
