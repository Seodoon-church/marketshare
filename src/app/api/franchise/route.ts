import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAuth } from '@/app/api/_helpers/auth';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = "force-static";

/**
 * GET /api/franchise
 * 프랜차이즈 신청 목록을 조회합니다. 관리자만 접근 가능합니다.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    if (user.role !== 'platform_admin') {
      return NextResponse.json(
        { error: '관리자만 접근할 수 있습니다.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const cursor = searchParams.get('cursor');

    let query: FirebaseFirestore.Query = adminDb.collection('franchise_applications');

    // 상태 필터
    if (status) {
      query = query.where('status', '==', status);
    }

    // 최신 순 정렬
    query = query.orderBy('createdAt', 'desc');

    // 커서 기반 페이지네이션
    if (cursor) {
      const cursorDoc = await adminDb
        .collection('franchise_applications')
        .doc(cursor)
        .get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    query = query.limit(limit + 1);

    const snapshot = await query.get();
    const docs = snapshot.docs;
    const hasMore = docs.length > limit;
    const applicationDocs = hasMore ? docs.slice(0, limit) : docs;

    const applications = applicationDocs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const nextCursor = hasMore
      ? applicationDocs[applicationDocs.length - 1].id
      : null;

    return NextResponse.json({
      applications,
      nextCursor,
    });
  } catch (error) {
    console.error('프랜차이즈 신청 목록 조회 실패:', error);
    return NextResponse.json(
      { error: '프랜차이즈 신청 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/franchise
 * 프랜차이즈 신청을 제출합니다. 인증된 사용자만 가능합니다.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // 필수 필드 검증
    const {
      applicantName,
      applicantPhone,
      businessName,
      businessNumber,
      desiredTheme,
      desiredMallName,
      desiredSubdomain,
      industry,
    } = body;

    if (!applicantName || !applicantPhone || !businessName || !desiredMallName) {
      return NextResponse.json(
        {
          error:
            '신청자 이름, 연락처, 사업자명, 희망 몰 이름은 필수 항목입니다.',
        },
        { status: 400 }
      );
    }

    // 서브도메인 중복 확인
    if (desiredSubdomain) {
      const existingMall = await adminDb
        .collection('malls')
        .where('subdomain', '==', desiredSubdomain)
        .limit(1)
        .get();

      if (!existingMall.empty) {
        return NextResponse.json(
          { error: '이미 사용 중인 서브도메인입니다.' },
          { status: 400 }
        );
      }

      // 기존 신청 중인 서브도메인도 확인
      const existingApplication = await adminDb
        .collection('franchise_applications')
        .where('desiredSubdomain', '==', desiredSubdomain)
        .where('status', 'in', ['pending', 'reviewing'])
        .limit(1)
        .get();

      if (!existingApplication.empty) {
        return NextResponse.json(
          { error: '이미 신청 중인 서브도메인입니다.' },
          { status: 400 }
        );
      }
    }

    const applicationData = {
      applicantName,
      applicantEmail: user.email,
      applicantPhone,
      businessName,
      businessNumber: businessNumber || '',
      desiredTheme: desiredTheme || '',
      desiredMallName,
      desiredSubdomain: desiredSubdomain || '',
      industry: industry || '',
      message: body.message || '',
      status: 'pending',
      adminNotes: '',
      reviewedBy: null,
      mallId: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const docRef = await adminDb
      .collection('franchise_applications')
      .add(applicationData);

    return NextResponse.json(
      {
        id: docRef.id,
        ...applicationData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('프랜차이즈 신청 실패:', error);
    return NextResponse.json(
      { error: '프랜차이즈 신청을 처리하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
