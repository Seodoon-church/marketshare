import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { adminStorage } from '@/lib/firebase/admin';
import { verifyAuth } from '@/app/api/_helpers/auth';

export const dynamic = "force-static";

// 허용되는 이미지 MIME 타입
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

// 허용되는 확장자
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

// 최대 파일 크기: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// 업로드 타입별 Storage 경로
const UPLOAD_PATHS: Record<string, string> = {
  product: 'products',
  mall: 'malls',
  user: 'users',
  banner: 'banners',
  supplier: 'suppliers',
};

/**
 * POST /api/upload
 * Firebase Storage에 이미지 파일을 업로드합니다.
 * formData로 file과 type 필드를 받습니다.
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || 'product';

    // 업로드 타입별 권한 확인
    if (type === 'banner' && user.role !== 'platform_admin') {
      return NextResponse.json(
        { error: '배너 이미지는 플랫폼 관리자만 업로드할 수 있습니다.' },
        { status: 403 }
      );
    }

    if (type === 'mall' && user.ownedMallIds.length === 0 && user.role !== 'platform_admin') {
      return NextResponse.json(
        { error: '몰 이미지는 몰 소유자 또는 플랫폼 관리자만 업로드할 수 있습니다.' },
        { status: 403 }
      );
    }

    if (type === 'supplier' && user.supplierIds.length === 0) {
      return NextResponse.json(
        { error: '공급사 이미지는 공급사 회원만 업로드할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 파일 존재 확인
    if (!file) {
      return NextResponse.json(
        { error: '파일이 필요합니다.' },
        { status: 400 }
      );
    }

    // 파일 크기 확인
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '파일 크기는 5MB를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    // MIME 타입 확인
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            '허용되지 않는 파일 형식입니다. JPG, PNG, GIF, WebP만 지원됩니다.',
        },
        { status: 400 }
      );
    }

    // 파일 확장자 확인
    const fileName = file.name;
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        {
          error:
            '허용되지 않는 파일 확장자입니다. jpg, png, gif, webp만 지원됩니다.',
        },
        { status: 400 }
      );
    }

    // 업로드 경로 확인
    const uploadPath = UPLOAD_PATHS[type];
    if (!uploadPath) {
      return NextResponse.json(
        {
          error:
            '유효하지 않은 업로드 타입입니다. product, mall, user, banner 중 하나를 선택해주세요.',
        },
        { status: 400 }
      );
    }

    // 고유한 파일명 생성
    const uniqueId = randomUUID();
    const storagePath = `${uploadPath}/${user.uid}/${uniqueId}.${extension}`;

    // 파일을 Buffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Firebase Storage에 업로드
    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(storagePath);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          uploadedBy: user.uid,
          originalName: fileName,
        },
      },
    });

    // 파일을 공개 읽기 가능하게 설정
    await fileRef.makePublic();

    // 공개 URL 생성
    const url = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

    return NextResponse.json(
      {
        url,
        path: storagePath,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('파일 업로드 실패:', error);
    return NextResponse.json(
      { error: '파일을 업로드하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
