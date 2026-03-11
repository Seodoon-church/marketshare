import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export const dynamic = "force-static";

/**
 * GET /api/search
 * 상품을 검색합니다. products_aggregate 컬렉션에서 이름 기반 접두사 검색을 수행합니다.
 * 쿼리 파라미터: q (검색어), categoryId, priceMin, priceMax, sortBy, limit
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim();
    const categoryId = searchParams.get('categoryId');
    const priceMin = searchParams.get('priceMin')
      ? parseFloat(searchParams.get('priceMin')!)
      : null;
    const priceMax = searchParams.get('priceMax')
      ? parseFloat(searchParams.get('priceMax')!)
      : null;
    const sortBy = searchParams.get('sortBy') || 'relevance';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    if (!q) {
      return NextResponse.json(
        { error: '검색어를 입력해주세요.' },
        { status: 400 }
      );
    }

    // Firestore 접두사 검색: name >= q AND name <= q + '\uf8ff'
    let query: FirebaseFirestore.Query = adminDb
      .collection('products_aggregate')
      .where('status', '==', 'active')
      .where('name', '>=', q)
      .where('name', '<=', q + '\uf8ff');

    // 접두사 검색 시 name으로 이미 정렬되므로 추가 정렬 제한이 있음
    // Firestore 복합 인덱스 제약으로 인해 접두사 검색과 다른 필드 정렬을 동시에 할 수 없음
    query = query.limit(limit * 3); // 필터링 후 결과가 줄어들 수 있으므로 여유분 조회

    const snapshot = await query.get();

    let results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<Record<string, unknown>>;

    // 카테고리 필터 (클라이언트 사이드 필터링)
    if (categoryId) {
      results = results.filter(
        (product) => product.categoryId === categoryId
      );
    }

    // 가격 범위 필터 (클라이언트 사이드 필터링)
    if (priceMin !== null) {
      results = results.filter((product) => {
        const price = (product.salePrice as number) || (product.price as number);
        return price >= priceMin;
      });
    }

    if (priceMax !== null) {
      results = results.filter((product) => {
        const price = (product.salePrice as number) || (product.price as number);
        return price <= priceMax;
      });
    }

    // 정렬 적용
    if (sortBy === 'price_asc') {
      results.sort((a, b) => {
        const priceA = (a.salePrice as number) || (a.price as number);
        const priceB = (b.salePrice as number) || (b.price as number);
        return priceA - priceB;
      });
    } else if (sortBy === 'price_desc') {
      results.sort((a, b) => {
        const priceA = (a.salePrice as number) || (a.price as number);
        const priceB = (b.salePrice as number) || (b.price as number);
        return priceB - priceA;
      });
    } else if (sortBy === 'sales') {
      results.sort(
        (a, b) => ((b.salesCount as number) || 0) - ((a.salesCount as number) || 0)
      );
    } else if (sortBy === 'rating') {
      results.sort(
        (a, b) =>
          ((b.averageRating as number) || 0) - ((a.averageRating as number) || 0)
      );
    } else if (sortBy === 'newest') {
      results.sort((a, b) => {
        const dateA = a.createdAt as { _seconds?: number } | undefined;
        const dateB = b.createdAt as { _seconds?: number } | undefined;
        return (dateB?._seconds || 0) - (dateA?._seconds || 0);
      });
    }
    // 'relevance'일 경우 Firestore 기본 정렬 유지

    const totalCount = results.length;

    // limit 적용
    results = results.slice(0, limit);

    return NextResponse.json({
      results,
      totalCount,
    });
  } catch (error) {
    console.error('상품 검색 실패:', error);
    return NextResponse.json(
      { error: '상품을 검색하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
