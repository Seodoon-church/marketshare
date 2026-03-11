'use client';

import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StarRating } from '@/components/board/StarRating';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { BoardPost, BoardType } from '@/types';
import { useState, useRef } from 'react';

// ============================================
// PostEditor - 게시글 작성/수정 컴포넌트
// ============================================

// ---- Validation Schema ----

const postSchema = z.object({
  title: z
    .string()
    .min(1, '제목을 입력해 주세요.')
    .max(100, '제목은 100자 이내로 입력해 주세요.'),
  content: z
    .string()
    .min(1, '내용을 입력해 주세요.')
    .max(10000, '내용은 10,000자 이내로 입력해 주세요.'),
  rating: z.number().min(1).max(5).optional(),
  isSecret: z.boolean().optional(),
});

type PostFormData = z.infer<typeof postSchema>;

// ---- Props ----

interface PostEditorProps {
  initialData?: Partial<BoardPost>;
  boardType: BoardType;
  onSubmit: (data: PostFormData & { images?: File[] }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PostEditor({
  initialData,
  boardType,
  onSubmit,
  onCancel,
  isLoading = false,
}: PostEditorProps) {
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>(
    initialData?.attachments
      ?.filter((att) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.name))
      .map((att) => att.url) ?? []
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      content: initialData?.content ?? '',
      rating: initialData?.rating ?? undefined,
      isSecret: initialData?.isSecret ?? false,
    },
  });

  // 이미지 업로드 핸들러
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const totalImages = uploadedImages.length + imagePreviewUrls.length + newFiles.length;

    if (totalImages > 10) {
      alert('이미지는 최대 10개까지 업로드할 수 있습니다.');
      return;
    }

    setUploadedImages((prev) => [...prev, ...newFiles]);

    // 미리보기 URL 생성
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviewUrls((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // input 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 이미지 제거 핸들러
  const handleRemoveImage = (index: number) => {
    setImagePreviewUrls((prev) => prev.filter((_, i) => i !== index));

    // initialData의 기존 이미지 수 계산
    const existingImageCount =
      initialData?.attachments?.filter((att) =>
        /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.name)
      ).length ?? 0;

    // 새로 업로드한 이미지 인덱스 계산
    if (index >= existingImageCount) {
      const uploadIndex = index - existingImageCount;
      setUploadedImages((prev) => prev.filter((_, i) => i !== uploadIndex));
    }
  };

  // 폼 제출
  const onFormSubmit = (data: PostFormData) => {
    onSubmit({
      ...data,
      images: uploadedImages,
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onFormSubmit)}
      className="space-y-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
    >
      {/* 제목 */}
      <Input
        label="제목"
        placeholder="제목을 입력해 주세요"
        error={errors.title?.message}
        {...register('title')}
      />

      {/* 리뷰 별점 (review 타입일 때) */}
      {boardType === 'review' && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            별점
          </label>
          <Controller
            name="rating"
            control={control}
            rules={{ required: '별점을 선택해 주세요.' }}
            render={({ field }) => (
              <StarRating
                rating={field.value ?? 0}
                onChange={(rating) => field.onChange(rating)}
                size="lg"
              />
            )}
          />
          {errors.rating && (
            <p className="mt-1 text-xs text-red-500">{errors.rating.message}</p>
          )}
        </div>
      )}

      {/* 내용 */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          내용
        </label>
        <textarea
          placeholder="내용을 입력해 주세요"
          rows={12}
          className={cn(
            'flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm',
            'placeholder:text-gray-400',
            'transition-colors duration-200',
            'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            'resize-y min-h-[200px]',
            errors.content && 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
          )}
          {...register('content')}
        />
        {errors.content && (
          <p className="mt-1 text-xs text-red-500">{errors.content.message}</p>
        )}
      </div>

      {/* 이미지 업로드 */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          이미지 첨부
        </label>

        {/* 이미지 미리보기 */}
        {imagePreviewUrls.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-3">
            {imagePreviewUrls.map((url, index) => (
              <div key={index} className="group relative">
                <img
                  src={url}
                  alt={`첨부 이미지 ${index + 1}`}
                  className="h-24 w-24 rounded-xl border border-gray-200 object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className={cn(
                    'absolute -right-2 -top-2 rounded-full bg-red-500 p-0.5 text-white',
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

        {/* 업로드 버튼 */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300',
            'px-4 py-8 text-sm text-gray-500 transition-colors',
            'hover:border-primary hover:text-primary'
          )}
        >
          <PhotoIcon className="h-6 w-6" />
          <span>클릭하여 이미지를 업로드하세요 (최대 10개)</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Q&A 비밀글 체크박스 */}
      {boardType === 'qna' && (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isSecret"
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/50"
            {...register('isSecret')}
          />
          <label htmlFor="isSecret" className="text-sm text-gray-700">
            비밀글로 등록
          </label>
        </div>
      )}

      {/* 버튼 */}
      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          취소
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? '수정하기' : '등록하기'}
        </Button>
      </div>
    </form>
  );
}
