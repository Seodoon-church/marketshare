'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { createLiveSession } from '@/lib/services/live-service';
import { getMallById } from '@/lib/services/mall-service';
import { getMallProducts } from '@/lib/services/product-service';
import type { CreateLiveSessionInput, LiveStreamPlatform } from '@/types/live';
import type { Product } from '@/types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const platformOptions: { value: LiveStreamPlatform; label: string }[] = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'naver', label: 'Naver' },
  { value: 'other', label: '기타' },
];

export default function CreateLivePage() {
  const { user, isLoading: authLoading, isMallOwner } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [mallName, setMallName] = useState('');
  const [mallSlug, setMallSlug] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledAt: '',
    streamPlatform: 'youtube' as LiveStreamPlatform,
    streamUrl: '',
    selectedProductIds: [] as string[],
  });

  const mallId = user?.ownedMallIds?.[0];

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isMallOwner) {
      window.location.href = '/auth/login';
    }
  }, [authLoading, isMallOwner]);

  // Load mall info and products
  useEffect(() => {
    if (!mallId) return;

    const loadData = async () => {
      try {
        // Get mall info
        const mall = await getMallById(mallId);
        if (mall) {
          setMallName(mall.name);
          setMallSlug(mall.slug);
        }

        // Get products
        const result = await getMallProducts(mallId, { status: 'active', limit: 100 });
        setProducts(result.products);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast({ type: 'error', message: '데이터를 불러오지 못했습니다.' });
      } finally {
        setProductsLoading(false);
      }
    };

    loadData();
  }, [mallId, toast]);

  const toggleProduct = (productId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedProductIds: prev.selectedProductIds.includes(productId)
        ? prev.selectedProductIds.filter((id) => id !== productId)
        : [...prev.selectedProductIds, productId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mallId || !user) {
      toast({ type: 'error', message: '로그인이 필요합니다.' });
      return;
    }

    if (!formData.title.trim()) {
      toast({ type: 'error', message: '제목을 입력해주세요.' });
      return;
    }

    if (!formData.scheduledAt) {
      toast({ type: 'error', message: '예약 일시를 입력해주세요.' });
      return;
    }

    setLoading(true);

    try {
      const input: CreateLiveSessionInput = {
        mallId,
        mallName,
        mallSlug,
        hostId: user.id,
        hostName: user.name || user.email || 'Host',
        title: formData.title.trim(),
        description: formData.description.trim(),
        scheduledAt: new Date(formData.scheduledAt),
        streamPlatform: formData.streamPlatform,
        streamUrl: formData.streamUrl.trim(),
        productIds: formData.selectedProductIds,
      };

      const newSession = await createLiveSession(input);

      toast({ type: 'success', message: '라이브 세션이 생성되었습니다.' });
      window.location.href = `/mall-admin/live/${newSession.id}`;
    } catch (error: any) {
      console.error('Failed to create live session:', error);
      toast({
        type: 'error',
        message: error.message || '라이브 세션 생성 중 오류가 발생했습니다.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Auth loading state
  if (authLoading || !isMallOwner) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <Card>
          <div className="h-96 w-full animate-pulse rounded bg-gray-100" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            window.location.href = '/mall-admin/live';
          }}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">새 라이브 생성</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">기본 정보</h2>

            {/* Title */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                제목 <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="라이브 제목을 입력하세요"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="라이브 설명을 입력하세요"
                rows={3}
                className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Scheduled At */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                예약 일시 <span className="text-red-500">*</span>
              </label>
              <Input
                type="datetime-local"
                value={formData.scheduledAt}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, scheduledAt: e.target.value }))
                }
                required
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">스트리밍 설정</h2>

            {/* Platform */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                스트리밍 플랫폼 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.streamPlatform}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    streamPlatform: e.target.value as LiveStreamPlatform,
                  }))
                }
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {platformOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Stream URL */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                스트리밍 URL (선택)
              </label>
              <Input
                value={formData.streamUrl}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, streamUrl: e.target.value }))
                }
                placeholder="https://www.youtube.com/embed/..."
                type="url"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                나중에 라이브 시작 전에 입력할 수도 있습니다.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">상품 선택</h2>
              <span className="text-sm text-gray-500">
                {formData.selectedProductIds.length}개 선택됨
              </span>
            </div>

            {productsLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 w-full animate-pulse rounded bg-gray-100" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                판매 중인 상품이 없습니다.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {products.map((product) => (
                  <label
                    key={product.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedProductIds.includes(product.id)}
                      onChange={() => toggleProduct(product.id)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                    />
                    {product.thumbnailUrl ? (
                      <img
                        src={product.thumbnailUrl}
                        alt={product.name}
                        className="h-12 w-12 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-lg bg-gray-100 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {product.price.toLocaleString()}원
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={() => {
              window.location.href = '/mall-admin/live';
            }}
            disabled={loading}
          >
            취소
          </Button>
          <Button type="submit" fullWidth isLoading={loading}>
            생성하기
          </Button>
        </div>
      </form>
    </div>
  );
}
