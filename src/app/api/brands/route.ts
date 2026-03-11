import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = "force-static";

/**
 * GET /api/brands
 * 브랜드 목록을 조회합니다.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') !== 'false';
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);

    let query: FirebaseFirestore.Query = adminDb.collection('brands');

    // 활성화된 브랜드만 조회 (기본)
    if (activeOnly) {
      query = query.where('isActive', '==', true);
    }

    // 이름순 정렬
    query = query.orderBy('name', 'asc').limit(limit);

    const snapshot = await query.get();

    const brands = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ brands });
  } catch (error) {
    console.error('브랜드 목록 조회 실패:', error);
    return NextResponse.json(
      { error: '브랜드 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
