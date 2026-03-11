'use client';

import { useState, useEffect } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { formatKRW } from '@/lib/utils/format';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  getProducts,
  importProductFromPlatform,
} from '@/lib/services/product-service';
import { PRICING_PLANS } from '@/lib/data/pricing';
import type { Product } from '@/types';
import {
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  CheckIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

export default function MallAdminProductImport() {
  const { user, isLoading: authLoading, isMallOwner } = useAuth();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const mallId = user?.ownedMallIds?.[0];

  // Determine current plan commission
  const currentPlan = PRICING_PLANS.find((p) => p.id === 'free'); // Default, would come from mall data
  const commissionRate = currentPlan?.salesCommission ?? 5;

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isMallOwner) {
      window.location.href = '/auth/login';
    }
  }, [authLoading, isMallOwner]);

  // Load global products
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const result = await getProducts({ status: 'active', limit: 100 });
        setProducts(result.products);
      } catch (error) {
        console.error('상품 목록 로딩 실패:', error);
        toast({ type: 'error', message: '상품 목록을 불러오지 못했습니다.' });
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [toast]);

  const filtered = products.filter((p) => {
    if (!search) return true;
    return p.name.toLowerCase().includes(search.toLowerCase());
  });

  const toggleSelect = (id: string) => {
    if (importedIds.has(id)) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleImport = async () => {
    if (!mallId || selectedIds.length === 0) return;

    setImporting(true);
    try {
      let successCount = 0;
      for (const id of selectedIds) {
        const product = products.find((p) => p.id === id);
        if (!product) continue;

        await importProductFromPlatform(mallId, product);
        successCount++;
        setImportedIds((prev) => new Set([...prev, id]));
      }

      toast({
        type: 'success',
        message: `${successCount}개 상품을 가져왔습니다.`,
      });
      setSelectedIds([]);
    } catch (error: any) {
      toast({
        type: 'error',
        message: error.message || '상품 가져오기 중 오류가 발생했습니다.',
      });
    } finally {
      setImporting(false);
    }
  };

  // Auth loading
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-3 text-sm text-gray-500">불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!isMallOwner || !mallId) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Title */}
      <div>
        <div className="flex items-center gap-1.5 text-sm text-gray-400 mb-2">
          <a
            href="/mall-admin/products"
            className="hover:text-primary transition-colors"
          >
            상품 관리
          </a>
          <ChevronRightIcon className="h-3.5 w-3.5" />
          <span className="text-gray-600">상품 가져오기</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">상품 가져오기</h1>
      </div>

      {/* Commission Info */}
      <Card className="bg-blue-50/50 border-blue-100">
        <div className="flex items-start gap-3">
          <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              현재 요금제 수수료: {commissionRate}%
            </p>
            <p className="mt-1 text-xs text-blue-700">
              플랫폼 카탈로그에서 상품을 가져오면 내 쇼핑몰에서 바로 판매할 수
              있습니다. 판매 시 {commissionRate}%의 수수료가 적용됩니다.
            </p>
          </div>
        </div>
      </Card>

      {/* Search */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:w-64">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="상품명 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {selectedIds.length > 0 && (
            <Button onClick={handleImport} isLoading={importing}>
              <ArrowDownTrayIcon className="h-4 w-4" />
              {selectedIds.length}개 상품 가져오기
            </Button>
          )}
        </div>
      </Card>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} padding="none">
              <div className="aspect-square animate-pulse bg-gray-100 rounded-t-2xl" />
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-gray-100" />
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <div className="py-16 text-center text-sm text-gray-400">
            가져올 수 있는 상품이 없습니다.
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => {
            const isSelected = selectedIds.includes(product.id);
            const isImported = importedIds.has(product.id);

            return (
              <div
                key={product.id}
                onClick={() => toggleSelect(product.id)}
                className={`group relative cursor-pointer rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:shadow-md ${
                  isImported
                    ? 'border-emerald-300 bg-emerald-50/30 cursor-default'
                    : isSelected
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                {/* Checkbox / Imported indicator */}
                <div className="absolute left-2 top-2 z-10">
                  {isImported ? (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white">
                      <CheckIcon className="h-3.5 w-3.5" />
                    </div>
                  ) : (
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-md border-2 transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <CheckIcon className="h-3.5 w-3.5" />}
                    </div>
                  )}
                </div>

                {/* Imported badge */}
                {isImported && (
                  <div className="absolute right-2 top-2 z-10">
                    <Badge variant="success">가져옴</Badge>
                  </div>
                )}

                {/* Image */}
                <div className="aspect-square overflow-hidden rounded-t-2xl bg-gray-100">
                  {product.thumbnailUrl ? (
                    <img
                      src={product.thumbnailUrl}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <CubeIconPlaceholder />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">
                    {product.name}
                  </p>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">
                      {formatKRW(product.price)}
                    </span>
                    {product.categoryName && (
                      <span className="text-xs text-gray-400">
                        {product.categoryName}
                      </span>
                    )}
                  </div>
                  {product.salePrice && product.salePrice < product.price && (
                    <p className="mt-0.5 text-xs text-gray-400 line-through">
                      {formatKRW(product.price)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CubeIconPlaceholder() {
  return (
    <svg
      className="h-10 w-10 text-gray-200"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
      />
    </svg>
  );
}
