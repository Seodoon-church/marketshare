import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAuth } from '@/app/api/_helpers/auth';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = "force-static";

/**
 * GET /api/orders
 * 인증된 사용자의 역할에 따라 주문 목록을 조회합니다.
 * - admin: orders_global 전체 주문
 * - mall_owner: 소유한 몰의 주문
 * - customer: 본인의 주문 (users/{userId}/orders)
 * 쿼리 파라미터: status, limit, cursor
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const cursor = searchParams.get('cursor');

    let query: FirebaseFirestore.Query;

    if (user.role === 'platform_admin') {
      // 관리자: orders_global에서 전체 주문 조회
      query = adminDb.collection('orders_global');
    } else if (user.role === 'mall_owner') {
      // 몰 오너: 소유한 몰의 주문만 조회
      if (user.ownedMallIds.length === 0) {
        return NextResponse.json({ orders: [], nextCursor: null });
      }
      // Firestore 'in' 쿼리는 최대 30개까지 지원
      const mallIds = user.ownedMallIds.slice(0, 30);
      query = adminDb.collection('orders_global').where('mallId', 'in', mallIds);
    } else {
      // 일반 고객: 본인의 주문만 조회
      query = adminDb.collection('users').doc(user.uid).collection('orders');
    }

    // 상태 필터
    if (status) {
      query = query.where('status', '==', status);
    }

    // 최신 순 정렬
    query = query.orderBy('createdAt', 'desc');

    // 커서 기반 페이지네이션
    if (cursor) {
      const collectionPath =
        user.role === 'customer'
          ? `users/${user.uid}/orders`
          : 'orders_global';
      const cursorDoc = await adminDb.collection(collectionPath).doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    query = query.limit(limit + 1);

    const snapshot = await query.get();
    const docs = snapshot.docs;
    const hasMore = docs.length > limit;
    const orderDocs = hasMore ? docs.slice(0, limit) : docs;

    const orders = orderDocs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const nextCursor = hasMore ? orderDocs[orderDocs.length - 1].id : null;

    return NextResponse.json({
      orders,
      nextCursor,
    });
  } catch (error) {
    console.error('주문 목록 조회 실패:', error);
    return NextResponse.json(
      { error: '주문 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * 새로운 주문을 생성합니다.
 * malls/{mallId}/orders에 저장하며, Cloud Function이 orders_global로 동기화합니다.
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
    const { mallId, items, shippingAddress, paymentMethod } = body;

    if (!mallId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: '몰 ID와 주문 상품 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!shippingAddress) {
      return NextResponse.json(
        { error: '배송지 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    if (!paymentMethod) {
      return NextResponse.json(
        { error: '결제 수단이 필요합니다.' },
        { status: 400 }
      );
    }

    // 몰 정보 확인
    const mallDoc = await adminDb.collection('malls').doc(mallId).get();
    if (!mallDoc.exists) {
      return NextResponse.json(
        { error: '존재하지 않는 몰입니다.' },
        { status: 404 }
      );
    }
    const mallData = mallDoc.data()!;

    // 주문 금액 계산
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.price * item.quantity;
    }
    const shippingFee = body.shippingFee || 0;
    const discount = body.discount || 0;
    const totalAmount = subtotal + shippingFee - discount;

    // 수수료 계산
    const commissionRate = mallData.commissionRate || 0;
    const commission = Math.round(totalAmount * (commissionRate / 100));
    const referralCommissionRate = mallData.referralCommissionRate || 0;
    const referralCommission = Math.round(totalAmount * (referralCommissionRate / 100));
    const settlementAmount = totalAmount - commission - referralCommission;

    // 주문번호 생성
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderNumber = `ORD-${dateStr}-${randomStr}`;

    const orderData = {
      orderNumber,
      userId: user.uid,
      userEmail: user.email,
      userName: body.userName || '',
      mallId,
      mallName: mallData.name || '',
      items,
      subtotal,
      shippingFee,
      discount,
      totalAmount,
      status: 'pending',
      paymentMethod,
      paymentInfo: null,
      shippingAddress,
      trackingNumber: null,
      trackingCompany: null,
      memo: body.memo || '',
      adminMemo: '',
      commission,
      referralCommission,
      settlementAmount,
      isSettled: false,
      cancelReason: null,
      refundAmount: null,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      paidAt: null,
      shippedAt: null,
      deliveredAt: null,
    };

    // malls/{mallId}/orders에 주문 저장 (Cloud Function이 orders_global 및 users/{uid}/orders로 동기화)
    const orderRef = await adminDb
      .collection('malls')
      .doc(mallId)
      .collection('orders')
      .add(orderData);

    return NextResponse.json(
      {
        id: orderRef.id,
        ...orderData,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('주문 생성 실패:', error);
    return NextResponse.json(
      { error: '주문을 생성하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
