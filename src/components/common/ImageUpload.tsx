'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils/cn';
import {
  PhotoIcon,
  XMarkIcon,
  ArrowUpTrayIcon,
} from '@heroicons/react/24/outline';

interface UploadedImage {
  id: string;
  url: string;
  name: string;
}

interface ImageUploadProps {
  onUpload: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
  currentImages?: UploadedImage[];
  onRemoveImage?: (imageId: string) => void;
  className?: string;
}

const ACCEPTED_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export function ImageUpload({
  onUpload,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024,
  currentImages = [],
  onRemoveImage,
  className,
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<
    { file: File; previewUrl: string }[]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      if (rejectedFiles.length > 0) {
        const firstError = rejectedFiles[0].errors[0];
        if (firstError.code === 'file-too-large') {
          setError(`파일 크기는 ${formatFileSize(maxSize)} 이하여야 합니다.`);
        } else if (firstError.code === 'file-invalid-type') {
          setError('JPG, PNG, WebP, GIF 파일만 업로드 가능합니다.');
        } else if (firstError.code === 'too-many-files') {
          setError(`최대 ${maxFiles}개까지 업로드 가능합니다.`);
        }
        return;
      }

      const totalCount = currentImages.length + previews.length + acceptedFiles.length;
      if (totalCount > maxFiles) {
        setError(`최대 ${maxFiles}개까지 업로드 가능합니다.`);
        return;
      }

      const newPreviews = acceptedFiles.map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
      }));

      setPreviews((prev) => [...prev, ...newPreviews]);
      onUpload(acceptedFiles);
    },
    [currentImages.length, previews.length, maxFiles, maxSize, onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: maxFiles - currentImages.length - previews.length,
    maxSize,
    multiple: true,
  });

  const handleRemovePreview = (index: number) => {
    setPreviews((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      return updated;
    });
  };

  const remainingSlots =
    maxFiles - currentImages.length - previews.length;

  return (
    <div className={cn('w-full', className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 transition-colors duration-200',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-gray-50',
          remainingSlots <= 0 && 'pointer-events-none opacity-50'
        )}
      >
        <input {...getInputProps()} />

        <div
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-xl',
            isDragActive ? 'bg-primary/10' : 'bg-gray-100'
          )}
        >
          {isDragActive ? (
            <ArrowUpTrayIcon className="h-7 w-7 text-primary" />
          ) : (
            <PhotoIcon className="h-7 w-7 text-gray-400" />
          )}
        </div>

        <p className="mt-4 text-sm font-medium text-gray-700">
          {isDragActive
            ? '여기에 놓아주세요'
            : '이미지를 드래그하거나 클릭하여 업로드'}
        </p>
        <p className="mt-1.5 text-xs text-gray-400">
          JPG, PNG, WebP, GIF / 최대 {formatFileSize(maxSize)} / {maxFiles}
          개까지
        </p>
      </div>

      {/* Error */}
      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}

      {/* Previews */}
      {(currentImages.length > 0 || previews.length > 0) && (
        <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          {/* Existing images */}
          {currentImages.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200"
            >
              <img
                src={image.url}
                alt={image.name}
                className="h-full w-full object-cover"
              />
              {onRemoveImage && (
                <button
                  type="button"
                  onClick={() => onRemoveImage(image.id)}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}

          {/* New previews */}
          {previews.map((preview, index) => (
            <div
              key={preview.previewUrl}
              className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200"
            >
              <img
                src={preview.previewUrl}
                alt={preview.file.name}
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleRemovePreview(index)}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/40 to-transparent px-2 py-1.5">
                <p className="truncate text-[10px] text-white">
                  {preview.file.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
