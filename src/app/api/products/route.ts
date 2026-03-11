import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = "force-static";

/**
 * GET /api/products
 * products_aggregate 컬렉션에서 상품 목록을 조회합니다.
 * 쿼리 파라미터: categoryId, mallId, status, sortBy, limit, cursor
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const mallId = searchParams.get('mallId');
    const status = searchParams.get('status') || 'active';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const cursor = searchParams.get('cursor');

    let query: FirebaseFirestore.Query = adminDb.collection('products_aggregate');

    // 필터 적용
    if (status) {
      query = query.where('status', '==', status);
    }

    if (categoryId) {
      query = query.where('categoryId', '==', categoryId);
    }

    if (mallId) {
      query = query.where('mallId', '==', mallId);
    }

    // 정렬 적용
    const validSortFields = ['createdAt', 'price', 'salesCount', 'viewCount', 'averageRating', 'name'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortBy === 'price' || sortBy === 'name' ? 'asc' : 'desc';
    query = query.orderBy(sortField, sortDirection);

    // 커서 기반 페이지네이션
    if (cursor) {
      const cursorDoc = await adminDb.collection('products_aggregate').doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    // limit + 1로 조회하여 다음 페이지 존재 여부 확인
    query = query.limit(limit + 1);

    const snapshot = await query.get();
    const docs = snapshot.docs;
    const hasMore = docs.length > limit;
    const productDocs = hasMore ? docs.slice(0, limit) : docs;

    const products = productDocs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const nextCursor = hasMore ? productDocs[productDocs.length - 1].id : null;

    return NextResponse.json({
      products,
      nextCursor,
    });
  } catch (error) {
    console.error('상품 목록 조회 실패:', error);
    return NextResponse.json(
      { error: '상품 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
