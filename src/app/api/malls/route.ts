import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = "force-static";

/**
 * GET /api/malls
 * 몰 목록을 조회합니다.
 * 쿼리 파라미터: status, category, limit
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    let query: FirebaseFirestore.Query = adminDb.collection('malls');

    // 상태 필터 (기본: active만 노출)
    if (status) {
      query = query.where('status', '==', status);
    } else {
      query = query.where('status', '==', 'active');
    }

    // 카테고리 필터 (industry 또는 themeId 기준)
    if (category) {
      query = query.where('themeId', '==', category);
    }

    // 정렬 및 제한
    query = query.orderBy('createdAt', 'desc').limit(limit);

    const snapshot = await query.get();

    const malls = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ malls });
  } catch (error) {
    console.error('몰 목록 조회 실패:', error);
    return NextResponse.json(
      { error: '몰 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
