// ============================================
// MarketShare - Board Service
// ============================================

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  increment,
  serverTimestamp,
  DocumentSnapshot,
  QueryConstraint,
  Timestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Board, BoardPost, BoardType } from '@/types';

// ---- Comment 타입 ----

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  parentId?: string;
  createdAt: Date;
}

// ---------- Helper ----------

function boardPostFromDoc(docSnap: DocumentSnapshot): BoardPost {
  const data = docSnap.data()!;
  return {
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
    updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
  } as BoardPost;
}

function commentFromDoc(docSnap: DocumentSnapshot): Comment {
  const data = docSnap.data()!;
  return {
    ...data,
    id: docSnap.id,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
  } as Comment;
}

// ---------- Boards CRUD ----------

export async function getBoards(mallId: string): Promise<Board[]> {
  const q = query(
    collection(db, 'malls', mallId, 'boards'),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => {
    const data = d.data();
    return {
      ...data,
      id: d.id,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
    } as Board;
  });
}

export async function createBoard(mallId: string, data: Omit<Board, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'malls', mallId, 'boards'), {
    ...data,
    postCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateBoard(mallId: string, boardId: string, data: Partial<Board>): Promise<void> {
  await updateDoc(doc(db, 'malls', mallId, 'boards', boardId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBoard(mallId: string, boardId: string): Promise<void> {
  await deleteDoc(doc(db, 'malls', mallId, 'boards', boardId));
}

// ---------- Posts ----------

/**
 * 게시글 목록 조회
 */
export async function getPosts(
  mallId: string,
  boardId: string,
  filters: {
    type?: BoardType;
    page?: number;
    limit?: number;
  } = {}
): Promise<{ posts: BoardPost[]; total: number }> {
  try {
    const { type, page = 1, limit = 20 } = filters;
    const constraints: QueryConstraint[] = [];

    if (boardId) {
      constraints.push(where('boardId', '==', boardId));
    }

    if (type) {
      constraints.push(where('type', '==', type));
    }

    // 삭제된 글 제외
    constraints.push(where('status', '!=', 'deleted'));
    constraints.push(orderBy('isPinned', 'desc'));
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(firestoreLimit(limit));

    const postsRef = collection(db, 'malls', mallId, 'boardPosts');
    const q = query(postsRef, ...constraints);
    const snapshot = await getDocs(q);

    const posts = snapshot.docs.map(boardPostFromDoc);

    return { posts, total: snapshot.size };
  } catch (error: any) {
    throw new Error('게시글 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

/**
 * 게시글 상세 조회
 */
export async function getPostById(
  mallId: string,
  postId: string
): Promise<BoardPost | null> {
  try {
    const postRef = doc(db, 'malls', mallId, 'boardPosts', postId);
    const postSnap = await getDoc(postRef);

    if (!postSnap.exists()) return null;

    return boardPostFromDoc(postSnap);
  } catch (error: any) {
    throw new Error('게시글을 불러오는 중 오류가 발생했습니다.');
  }
}

/**
 * 게시글 생성
 */
export async function createPost(
  mallId: string,
  data: Omit<BoardPost, 'id' | 'viewCount' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const postsRef = collection(db, 'malls', mallId, 'boardPosts');
    const docRef = await addDoc(postsRef, {
      ...data,
      viewCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error: any) {
    throw new Error('게시글 등록 중 오류가 발생했습니다.');
  }
}

/**
 * 게시글 수정
 */
export async function updatePost(
  mallId: string,
  postId: string,
  data: Partial<Omit<BoardPost, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const postRef = doc(db, 'malls', mallId, 'boardPosts', postId);
    await updateDoc(postRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error('게시글 수정 중 오류가 발생했습니다.');
  }
}

/**
 * 게시글 삭제 (soft delete)
 */
export async function deletePost(
  mallId: string,
  postId: string
): Promise<void> {
  try {
    const postRef = doc(db, 'malls', mallId, 'boardPosts', postId);
    await updateDoc(postRef, {
      status: 'deleted',
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    throw new Error('게시글 삭제 중 오류가 발생했습니다.');
  }
}

/**
 * 조회수 증가
 */
export async function incrementViewCount(
  mallId: string,
  postId: string
): Promise<void> {
  try {
    const postRef = doc(db, 'malls', mallId, 'boardPosts', postId);
    await updateDoc(postRef, {
      viewCount: increment(1),
    });
  } catch (error: any) {
    // 조회수 증가 실패는 무시
    console.error('조회수 증가 실패:', error);
  }
}

// ---------- Comments ----------

/**
 * 댓글 목록 조회
 */
export async function getComments(
  mallId: string,
  postId: string
): Promise<Comment[]> {
  try {
    const commentsRef = collection(
      db,
      'malls',
      mallId,
      'boardPosts',
      postId,
      'comments'
    );
    const q = query(commentsRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(commentFromDoc);
  } catch (error: any) {
    throw new Error('댓글을 불러오는 중 오류가 발생했습니다.');
  }
}

/**
 * 댓글 작성
 */
export async function createComment(
  mallId: string,
  postId: string,
  data: Omit<Comment, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const commentsRef = collection(
      db,
      'malls',
      mallId,
      'boardPosts',
      postId,
      'comments'
    );
    const docRef = await addDoc(commentsRef, {
      ...data,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error: any) {
    throw new Error('댓글 등록 중 오류가 발생했습니다.');
  }
}

/**
 * 댓글 삭제
 */
export async function deleteComment(
  mallId: string,
  postId: string,
  commentId: string
): Promise<void> {
  try {
    const commentRef = doc(
      db,
      'malls',
      mallId,
      'boardPosts',
      postId,
      'comments',
      commentId
    );
    await deleteDoc(commentRef);
  } catch (error: any) {
    throw new Error('댓글 삭제 중 오류가 발생했습니다.');
  }
}

// ---------- Reviews ----------

/**
 * 상품 리뷰 작성
 * boardPosts에 type='review'로 생성하고 product에 연결
 */
export async function createReview(
  mallId: string,
  productId: string,
  data: {
    title: string;
    content: string;
    authorId: string;
    authorName: string;
    rating: number;
    attachments?: { url: string; name: string; size: number }[];
  }
): Promise<string> {
  try {
    const postsRef = collection(db, 'malls', mallId, 'boardPosts');
    const docRef = await addDoc(postsRef, {
      boardId: 'reviews',
      title: data.title,
      content: data.content,
      authorId: data.authorId,
      authorName: data.authorName,
      attachments: data.attachments ?? [],
      viewCount: 0,
      isPinned: false,
      isSecret: false,
      productId,
      rating: data.rating,
      status: 'published',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 상품의 리뷰 카운트 및 평균 평점 업데이트 (트랜잭션으로 race condition 방지)
    try {
      const productRef = doc(db, 'malls', mallId, 'products', productId);

      await runTransaction(db, async (transaction) => {
        const productSnap = await transaction.get(productRef);

        if (productSnap.exists()) {
          const productData = productSnap.data();
          const currentCount = productData.reviewCount ?? 0;
          const currentAvg = productData.averageRating ?? 0;
          const newCount = currentCount + 1;
          const newAvg = ((currentAvg * currentCount) + data.rating) / newCount;

          transaction.update(productRef, {
            reviewCount: newCount,
            averageRating: Math.round(newAvg * 10) / 10,
          });
        }
      });
    } catch {
      // 상품 업데이트 실패는 리뷰 생성을 막지 않음
      console.error('상품 리뷰 통계 업데이트 실패');
    }

    return docRef.id;
  } catch (error: any) {
    throw new Error('리뷰 등록 중 오류가 발생했습니다.');
  }
}

/**
 * 상품 리뷰 목록 조회
 */
export async function getProductReviews(
  mallId: string,
  productId: string,
  limit?: number
): Promise<BoardPost[]> {
  try {
    const postsRef = collection(db, 'malls', mallId, 'boardPosts');
    const constraints: QueryConstraint[] = [
      where('productId', '==', productId),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc'),
    ];

    if (limit) {
      constraints.push(firestoreLimit(limit));
    }

    const q = query(postsRef, ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(boardPostFromDoc);
  } catch (error: any) {
    throw new Error('리뷰를 불러오는 중 오류가 발생했습니다.');
  }
}

/**
 * 상품 문의 목록 조회
 * boardPosts에서 boardId='qna'이고 productId가 일치하는 문서를 조회
 */
export async function getProductInquiries(
  mallId: string,
  productId: string,
  limit?: number
): Promise<BoardPost[]> {
  try {
    const postsRef = collection(db, 'malls', mallId, 'boardPosts');
    const constraints: QueryConstraint[] = [
      where('boardId', '==', 'qna'),
      where('productId', '==', productId),
      where('status', '!=', 'deleted'),
      orderBy('createdAt', 'desc'),
    ];

    if (limit) {
      constraints.push(firestoreLimit(limit));
    }

    const q = query(postsRef, ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(boardPostFromDoc);
  } catch (error: any) {
    throw new Error('상품 문의를 불러오는 중 오류가 발생했습니다.');
  }
}
