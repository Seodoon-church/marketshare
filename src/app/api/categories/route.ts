import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = "force-static";

/**
 * GET /api/categories
 * categories_global 컬렉션에서 전체 카테고리 목록을 조회합니다.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    let query: FirebaseFirestore.Query = adminDb.collection('categories_global');

    // 활성화된 카테고리만 조회 (기본)
    if (activeOnly) {
      query = query.where('isActive', '==', true);
    }

    // 특정 부모 카테고리의 하위 카테고리만 조회
    if (parentId) {
      query = query.where('parentId', '==', parentId);
    }

    // 순서대로 정렬
    query = query.orderBy('order', 'asc');

    const snapshot = await query.get();

    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('카테고리 목록 조회 실패:', error);
    return NextResponse.json(
      { error: '카테고리 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
