'use client';

import { cn } from '@/lib/utils/cn';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface Theme {
  id: string;
  name: string;
  description: string;
  previewImageUrl?: string;
  primaryColor?: string;
}

interface ThemeSelectorProps {
  themes: Theme[];
  selectedId: string | null;
  onSelect: (themeId: string) => void;
  className?: string;
}

export function ThemeSelector({
  themes,
  selectedId,
  onSelect,
  className,
}: ThemeSelectorProps) {
  return (
    <div className={cn('w-full', className)}>
      <h3 className="text-lg font-semibold text-gray-900">테마 선택</h3>
      <p className="mt-1 text-sm text-gray-500">
        쇼핑몰에 적용할 테마를 선택해주세요.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((theme) => {
          const isSelected = selectedId === theme.id;
          const previewColor = theme.primaryColor || '#3B82F6';

          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => onSelect(theme.id)}
              className={cn(
                'relative overflow-hidden rounded-2xl border-2 text-left transition-all duration-200',
                isSelected
                  ? 'border-primary shadow-md ring-2 ring-primary/20'
                  : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
              )}
            >
              {/* Theme Preview */}
              <div className="aspect-[16/10] w-full overflow-hidden bg-gray-100">
                {theme.previewImageUrl ? (
                  <img
                    src={theme.previewImageUrl}
                    alt={theme.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col">
                    {/* Simulated preview */}
                    <div
                      className="h-2"
                      style={{ backgroundColor: previewColor }}
                    />
                    <div className="flex flex-1 items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                      <div className="w-3/4 space-y-2">
                        <div
                          className="h-3 w-1/2 rounded"
                          style={{ backgroundColor: previewColor }}
                        />
                        <div className="h-2 w-full rounded bg-gray-200" />
                        <div className="h-2 w-3/4 rounded bg-gray-200" />
                        <div className="mt-2 grid grid-cols-3 gap-1">
                          <div className="aspect-square rounded bg-gray-200" />
                          <div className="aspect-square rounded bg-gray-200" />
                          <div className="aspect-square rounded bg-gray-200" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Info */}
              <div className="p-4">
                <h4 className="text-sm font-semibold text-gray-900">
                  {theme.name}
                </h4>
                <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                  {theme.description}
                </p>
              </div>

              {/* Selected Checkmark */}
              {isSelected && (
                <div className="absolute right-3 top-3">
                  <CheckCircleIcon className="h-7 w-7 text-primary drop-shadow-sm" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
