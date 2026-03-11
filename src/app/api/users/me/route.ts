import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { verifyAuth } from '@/app/api/_helpers/auth';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = "force-static";

/**
 * GET /api/users/me
 * 현재 인증된 사용자의 프로필 정보를 조회합니다.
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

    const userDoc = await adminDb.collection('users').doc(user.uid).get();

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const userData = userDoc.data()!;

    // 민감한 정보 제외하고 반환
    return NextResponse.json({
      id: userDoc.id,
      email: userData.email,
      name: userData.name,
      phone: userData.phone,
      role: userData.role,
      ownedMallIds: userData.ownedMallIds || [],
      profileImageUrl: userData.profileImageUrl || null,
      gender: userData.gender || null,
      birthDate: userData.birthDate || null,
      isVerified: userData.isVerified || false,
      defaultAddress: userData.defaultAddress || null,
      addresses: userData.addresses || [],
      marketingConsent: userData.marketingConsent || false,
      lastLoginAt: userData.lastLoginAt,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    });
  } catch (error) {
    console.error('사용자 프로필 조회 실패:', error);
    return NextResponse.json(
      { error: '사용자 정보를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/me
 * 현재 인증된 사용자의 프로필 정보를 업데이트합니다.
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // 사용자가 수정 가능한 필드만 허용
    const allowedFields = [
      'name',
      'phone',
      'profileImageUrl',
      'gender',
      'birthDate',
      'defaultAddress',
      'addresses',
      'marketingConsent',
    ];

    const updateData: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // 업데이트할 데이터가 updatedAt만 있으면 변경 사항 없음
    if (Object.keys(updateData).length <= 1) {
      return NextResponse.json(
        { error: '업데이트할 정보가 없습니다.' },
        { status: 400 }
      );
    }

    const userRef = adminDb.collection('users').doc(user.uid);
    await userRef.update(updateData);

    // 업데이트된 사용자 정보 재조회
    const updatedDoc = await userRef.get();
    const updatedData = updatedDoc.data()!;

    return NextResponse.json({
      id: updatedDoc.id,
      email: updatedData.email,
      name: updatedData.name,
      phone: updatedData.phone,
      role: updatedData.role,
      ownedMallIds: updatedData.ownedMallIds || [],
      profileImageUrl: updatedData.profileImageUrl || null,
      gender: updatedData.gender || null,
      birthDate: updatedData.birthDate || null,
      isVerified: updatedData.isVerified || false,
      defaultAddress: updatedData.defaultAddress || null,
      addresses: updatedData.addresses || [],
      marketingConsent: updatedData.marketingConsent || false,
      lastLoginAt: updatedData.lastLoginAt,
      createdAt: updatedData.createdAt,
      updatedAt: updatedData.updatedAt,
    });
  } catch (error) {
    console.error('사용자 프로필 업데이트 실패:', error);
    return NextResponse.json(
      { error: '사용자 정보를 업데이트하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
