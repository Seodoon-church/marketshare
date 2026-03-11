'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { StarRating } from '@/components/board/StarRating';
import {
  PhotoIcon,
  XMarkIcon,
  CloudArrowUpIcon,
} from '@heroicons/react/24/outline';

// ============================================
// ReviewForm - 리뷰 작성 폼 컴포넌트
// ============================================

interface ReviewFormData {
  rating: number;
  content: string;
  images: File[];
}

interface ReviewFormProps {
  productId: string;
  productName: string;
  onSubmit: (data: ReviewFormData) => void;
  onCancel: () => void;
}

export function ReviewForm({
  productId,
  productName,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [errors, setErrors] = useState<{
    rating?: string;
    content?: string;
    images?: string;
  }>({});

  const MAX_IMAGES = 5;

  // react-dropzone 설정
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const totalImages = images.length + acceptedFiles.length;

      if (totalImages > MAX_IMAGES) {
        setErrors((prev) => ({
          ...prev,
          images: `이미지는 최대 ${MAX_IMAGES}개까지 업로드할 수 있습니다.`,
        }));
        return;
      }

      setErrors((prev) => ({ ...prev, images: undefined }));

      const newImages = [...images, ...acceptedFiles];
      setImages(newImages);

      // 미리보기 URL 생성
      acceptedFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreviews((prev) => [...prev, e.target?.result as string]);
        };
        reader.readAsDataURL(file);
      });
    },
    [images]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    },
    maxFiles: MAX_IMAGES - images.length,
    disabled: images.length >= MAX_IMAGES,
  });

  // 이미지 제거
  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => ({ ...prev, images: undefined }));
  };

  // 유효성 검사
  const validate = (): boolean => {
    const newErrors: typeof errors = {};

    if (rating === 0) {
      newErrors.rating = '별점을 선택해 주세요.';
    }

    if (!content.trim()) {
      newErrors.content = '리뷰 내용을 입력해 주세요.';
    } else if (content.trim().length < 10) {
      newErrors.content = '리뷰는 최소 10자 이상 입력해 주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 폼 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      rating,
      content: content.trim(),
      images,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
    >
      {/* 상품 정보 */}
      <div className="rounded-xl bg-gray-50 px-4 py-3">
        <p className="text-xs text-gray-500">리뷰 작성 상품</p>
        <p className="mt-0.5 text-sm font-medium text-gray-900">{productName}</p>
      </div>

      {/* 별점 선택 */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          별점 <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center gap-3">
          <StarRating rating={rating} onChange={setRating} size="lg" />
          {rating > 0 && (
            <span className="text-sm text-gray-600">
              {rating === 5
                ? '매우 만족'
                : rating === 4
                  ? '만족'
                  : rating === 3
                    ? '보통'
                    : rating === 2
                      ? '불만족'
                      : '매우 불만족'}
            </span>
          )}
        </div>
        {errors.rating && (
          <p className="mt-1 text-xs text-red-500">{errors.rating}</p>
        )}
      </div>

      {/* 리뷰 내용 */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          리뷰 내용 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (errors.content) {
              setErrors((prev) => ({ ...prev, content: undefined }));
            }
          }}
          placeholder="상품에 대한 솔직한 리뷰를 작성해 주세요. (최소 10자)"
          rows={6}
          className={cn(
            'flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm',
            'placeholder:text-gray-400',
            'transition-colors duration-200',
            'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            'resize-y min-h-[120px]',
            errors.content && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
          )}
        />
        <div className="mt-1 flex justify-between">
          {errors.content ? (
            <p className="text-xs text-red-500">{errors.content}</p>
          ) : (
            <span />
          )}
          <span
            className={cn(
              'text-xs',
              content.length < 10 ? 'text-gray-400' : 'text-gray-500'
            )}
          >
            {content.length}자
          </span>
        </div>
      </div>

      {/* 이미지 업로드 (Drag & Drop) */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          사진 첨부 <span className="text-xs font-normal text-gray-400">(최대 {MAX_IMAGES}장)</span>
        </label>

        {/* 업로드된 이미지 미리보기 */}
        {imagePreviews.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-3">
            {imagePreviews.map((preview, index) => (
              <div key={index} className="group relative">
                <img
                  src={preview}
                  alt={`리뷰 이미지 ${index + 1}`}
                  className="h-24 w-24 rounded-xl border border-gray-200 object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className={cn(
                    'absolute -right-2 -top-2 rounded-full bg-red-500 p-0.5 text-white shadow-sm',
                    'opacity-0 transition-opacity group-hover:opacity-100',
                    'hover:bg-red-600'
                  )}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Drag & Drop 영역 */}
        {images.length < MAX_IMAGES && (
          <div
            {...getRootProps()}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8',
              'transition-colors duration-200',
              isDragActive
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-gray-300 text-gray-500 hover:border-primary hover:text-primary'
            )}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <>
                <CloudArrowUpIcon className="mb-2 h-8 w-8" />
                <p className="text-sm font-medium">이미지를 놓아주세요</p>
              </>
            ) : (
              <>
                <PhotoIcon className="mb-2 h-8 w-8" />
                <p className="text-sm font-medium">
                  이미지를 드래그하거나 클릭하여 업로드
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  JPG, PNG, GIF, WEBP (최대 {MAX_IMAGES - images.length}장 추가 가능)
                </p>
              </>
            )}
          </div>
        )}

        {errors.images && (
          <p className="mt-1 text-xs text-red-500">{errors.images}</p>
        )}
      </div>

      {/* 버튼 */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
        <Button type="submit">
          리뷰 등록
        </Button>
      </div>
    </form>
  );
}
