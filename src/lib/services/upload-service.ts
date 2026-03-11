// ============================================
// MarketShare - Upload Service
// ============================================

import {
  ref,
  uploadBytes,
  getDownloadURL as storageGetDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { storage } from '@/lib/firebase/config';

// ---------- File Validation ----------

export interface FileValidationOptions {
  maxSize: number; // in bytes
  allowedTypes: string[]; // MIME types, e.g. ['image/jpeg', 'image/png']
}

export function validateFile(
  file: File,
  maxSize: number,
  allowedTypes: string[]
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    const typeNames = allowedTypes
      .map((t) => t.split('/')[1]?.toUpperCase())
      .join(', ');
    return {
      valid: false,
      error: `허용되지 않는 파일 형식입니다. (허용: ${typeNames})`,
    };
  }

  if (file.size > maxSize) {
    const maxMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `파일 크기가 ${maxMB}MB를 초과합니다.`,
    };
  }

  return { valid: true };
}

// ---------- Helper ----------

function generateFileName(originalName: string): string {
  const ext = originalName.split('.').pop() ?? 'jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}_${random}.${ext}`;
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_PRODUCT_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_BANNER_SIZE = 15 * 1024 * 1024; // 15MB

// ---------- Upload Product Image ----------

export async function uploadProductImage(
  mallId: string,
  file: File
): Promise<string> {
  try {
    const validation = validateFile(file, MAX_PRODUCT_IMAGE_SIZE, IMAGE_TYPES);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const fileName = generateFileName(file.name);
    const storagePath = `products/${mallId}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        mallId,
        originalName: file.name,
      },
    });

    const downloadUrl = await storageGetDownloadURL(storageRef);
    return downloadUrl;
  } catch (error: any) {
    if (error.message?.includes('허용되지 않는') || error.message?.includes('파일 크기')) {
      throw error;
    }
    throw new Error('상품 이미지 업로드 중 오류가 발생했습니다.');
  }
}

// ---------- Upload Mall Logo ----------

export async function uploadMallLogo(
  mallId: string,
  file: File
): Promise<string> {
  try {
    const validation = validateFile(file, MAX_LOGO_SIZE, IMAGE_TYPES);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const fileName = generateFileName(file.name);
    const storagePath = `malls/${mallId}/logo/${fileName}`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        mallId,
        originalName: file.name,
      },
    });

    const downloadUrl = await storageGetDownloadURL(storageRef);
    return downloadUrl;
  } catch (error: any) {
    if (error.message?.includes('허용되지 않는') || error.message?.includes('파일 크기')) {
      throw error;
    }
    throw new Error('몰 로고 업로드 중 오류가 발생했습니다.');
  }
}

// ---------- Upload User Avatar ----------

export async function uploadUserAvatar(
  userId: string,
  file: File
): Promise<string> {
  try {
    const validation = validateFile(file, MAX_AVATAR_SIZE, IMAGE_TYPES);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const fileName = generateFileName(file.name);
    const storagePath = `users/${userId}/avatar/${fileName}`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        userId,
        originalName: file.name,
      },
    });

    const downloadUrl = await storageGetDownloadURL(storageRef);
    return downloadUrl;
  } catch (error: any) {
    if (error.message?.includes('허용되지 않는') || error.message?.includes('파일 크기')) {
      throw error;
    }
    throw new Error('프로필 이미지 업로드 중 오류가 발생했습니다.');
  }
}

// ---------- Upload Banner ----------

export async function uploadBanner(file: File): Promise<string> {
  try {
    const validation = validateFile(file, MAX_BANNER_SIZE, IMAGE_TYPES);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const fileName = generateFileName(file.name);
    const storagePath = `banners/${fileName}`;
    const storageRef = ref(storage, storagePath);

    await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
      },
    });

    const downloadUrl = await storageGetDownloadURL(storageRef);
    return downloadUrl;
  } catch (error: any) {
    if (error.message?.includes('허용되지 않는') || error.message?.includes('파일 크기')) {
      throw error;
    }
    throw new Error('배너 이미지 업로드 중 오류가 발생했습니다.');
  }
}

// ---------- Delete File ----------

export async function deleteFile(path: string): Promise<void> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error: any) {
    // If file doesn't exist, silently ignore
    if (error.code === 'storage/object-not-found') {
      return;
    }
    throw new Error('파일 삭제 중 오류가 발생했습니다.');
  }
}

// ---------- Get Download URL ----------

export async function getDownloadURL(path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    return await storageGetDownloadURL(storageRef);
  } catch (error: any) {
    if (error.code === 'storage/object-not-found') {
      throw new Error('파일을 찾을 수 없습니다.');
    }
    throw new Error('파일 URL을 가져오는 중 오류가 발생했습니다.');
  }
}
