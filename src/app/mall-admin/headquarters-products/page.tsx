'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { formatKRW } from '@/lib/utils/format';
import { useAuth } from '@/lib/hooks/useAuth';
import { getMallById } from '@/lib/services/mall-service';
import {
  getSharedProductsWithData, toggleSharedProductVisibility, bulkToggleVisibility,
} from '@/lib/services/shared-product-service';
import type { Mall, SharedProduct, Product } from '@/types';
import {
  BuildingStorefrontIcon, EyeIcon, EyeSlashIcon, PhotoIcon, MagnifyingGlassIcon, FunnelIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';

type SharedProductWithData = SharedProduct & { product: Product | null };

function ProductThumb({ url, alt }: { url?: string; alt: string }) {
  return url ? (
    <img src={url} alt={alt} className="h-12 w-12 rounded-lg object-cover border border-gray-100" />
  ) : (
    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
      <PhotoIcon className="h-6 w-6 text-gray-400" />
    </div>
  );
}

export default function HeadquartersProductsPage() {
  const { user, isLoading: authLoading, isMallOwner } = useAuth();
  const { toast } = useToast();
  const [mall, setMall] = useState<Mall | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState(false);
  const [products, setProducts] = useState<SharedProductWithData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [broadcastFilter, setBroadcastFilter] = useState(false);
  const mallId = user?.ownedMallIds?.[0];

  useEffect(() => { if (!authLoading && !isMallOwner) window.location.href = '/'; }, [authLoading, isMallOwner]);

  useEffect(() => {
    if (!mallId) return;
    getMallById(mallId).then(setMall).catch(() => toast({ type: 'error', message: '몰 정보를 불러오는 중 오류가 발생했습니다.' }));
  }, [mallId, toast]);

  const fetchProducts = useCallback(async () => {
    if (!mallId) return;
    try { setLoading(true); setProducts(await getSharedProductsWithData(mallId, 'headquarters')); }
    catch (e: any) { toast({ type: 'error', message: e.message || '본사 상품을 불러오는 중 오류가 발생했습니다.' }); }
    finally { setLoading(false); }
  }, [mallId, toast]);

  useEffect(() => {
    if (!mallId || !mall?.parentMallId) return;
    fetchProducts();
  }, [mallId, mall, fetchProducts]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((s) => { if (s.product?.categoryName) set.add(s.product.categoryName); });
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => products.filter((s) => {
    const name = s.product?.name ?? '(삭제된 상품)';
    if (searchQuery && !name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter && s.product?.categoryName !== categoryFilter) return false;
    if (broadcastFilter && !s.product?.broadcastEnabled) return false;
    return true;
  }), [products, searchQuery, categoryFilter, broadcastFilter]);

  const broadcastEnabledCount = products.filter((s) => s.product?.broadcastEnabled).length;

  const visibleCount = products.filter((p) => !p.isHidden).length;
  const hiddenCount = products.filter((p) => p.isHidden).length;

  const handleToggleVisibility = async (shared: SharedProductWithData) => {
    if (!mallId) return;
    const newHidden = !shared.isHidden;
    try {
      setToggling(shared.id);
      await toggleSharedProductVisibility(mallId, shared.id, newHidden);
      setProducts((prev) => prev.map((p) => (p.id === shared.id ? { ...p, isHidden: newHidden } : p)));
      toast({ type: 'success', message: newHidden ? '상품이 숨겨졌습니다.' : '상품이 표시됩니다.' });
    } catch (e: any) { toast({ type: 'error', message: e.message || '표시 상태 변경 중 오류가 발생했습니다.' }); }
    finally { setToggling(null); }
  };

  const handleBulkToggle = async (isHidden: boolean) => {
    if (!mallId) return;
    try {
      setBulkAction(true);
      await bulkToggleVisibility(mallId, 'headquarters', isHidden);
      setProducts((prev) => prev.map((p) => ({ ...p, isHidden })));
      toast({ type: 'success', message: isHidden ? '모든 본사 상품이 숨겨졌습니다.' : '모든 본사 상품이 표시됩니다.' });
    } catch (e: any) { toast({ type: 'error', message: e.message || '일괄 처리 중 오류가 발생했습니다.' }); }
    finally { setBulkAction(false); }
  };

  if (authLoading || (loading && !mall)) return <div className="flex min-h-[400px] items-center justify-center"><LoadingSpinner size="lg" /></div>;

  if (mall && !mall.parentMallId) return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-3 text-sm text-gray-500">가맹점(분양몰)에서만 본사 상품을 관리할 수 있습니다.</p>
        <p className="mt-1 text-xs text-gray-400">이 기능은 본사 몰에 소속된 가맹점 전용입니다.</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">본사 상품 관리</h1>
        <p className="mt-1 text-sm text-gray-500">본사에서 공유된 상품의 표시/숨김을 관리합니다.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '표시 중', count: visibleCount, gradient: 'from-emerald-500 to-teal-500', Icon: EyeIcon },
          { label: '숨김', count: hiddenCount, gradient: 'from-gray-400 to-gray-500', Icon: EyeSlashIcon },
          { label: '전체', count: products.length, gradient: 'from-blue-500 to-cyan-500', Icon: BuildingStorefrontIcon },
        ].map(({ label, count, gradient, Icon }) => (
          <Card key={label}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-900">{count}개</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Bulk Actions + Search/Filter */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => handleBulkToggle(false)} disabled={bulkAction}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ${bulkAction ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <EyeIcon className="h-3.5 w-3.5" />전체 표시
            </button>
            <button onClick={() => handleBulkToggle(true)} disabled={bulkAction}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200 ${bulkAction ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <EyeSlashIcon className="h-3.5 w-3.5" />전체 숨기기
            </button>
            <button onClick={() => setBroadcastFilter((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${broadcastFilter ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-300' : 'bg-purple-50 text-purple-600 hover:bg-purple-100'}`}>
              <SignalIcon className="h-3.5 w-3.5" />방송가능 ({broadcastEnabledCount})
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="상품명 검색"
                className="h-9 w-48 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            {categories.length > 0 && (
              <div className="relative">
                <FunnelIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-9 appearance-none rounded-lg border border-gray-300 bg-white pl-9 pr-8 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">전체 카테고리</option>
                  {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Product List */}
      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center"><LoadingSpinner size="lg" /></div>
      ) : products.length === 0 ? (
        <Card>
          <div className="py-12 text-center">
            <BuildingStorefrontIcon className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">공유된 본사 상품이 없습니다.</p>
            <p className="mt-1 text-xs text-gray-400">본사에서 상품을 공유하면 여기에 표시됩니다.</p>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <div className="p-5 pb-0">
            <CardTitle>본사 상품 목록</CardTitle>
            <p className="mt-1 text-xs text-gray-500">
              토글로 개별 상품의 표시 여부를 제어합니다.
              {filtered.length !== products.length && <span className="ml-1 text-primary font-medium">(검색 결과: {filtered.length}개)</span>}
            </p>
          </div>
          <div className="mt-4 divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <MagnifyingGlassIcon className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm text-gray-400">검색 결과가 없습니다.</p>
              </div>
            ) : filtered.map((s) => {
              const p = s.product;
              const deleted = !p;
              const busy = toggling === s.id;
              return (
                <div key={s.id} className={`flex items-center justify-between px-5 py-4 transition-colors hover:bg-gray-50/50 ${deleted ? 'opacity-50' : ''}`}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <ProductThumb url={p?.thumbnailUrl} alt={p?.name ?? ''} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {p?.name || '(삭제된 상품)'}
                        {deleted && <span className="ml-1.5 text-xs text-red-400 font-normal">(삭제됨)</span>}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        {p && <span className="text-xs text-gray-500">{formatKRW(p.salePrice ?? p.price)}</span>}
                        {p?.categoryName && <Badge variant="default">{p.categoryName}</Badge>}
                        {p?.broadcastEnabled && (
                          <>
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                              판매수수료: {p.broadcastCommissionRate ?? 0}%
                            </span>
                            {p.broadcastSpecialPrice != null && p.broadcastSpecialPrice > 0 && (
                              <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-600">
                                방송특가: {formatKRW(p.broadcastSpecialPrice)}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-3">
                    <span className={`text-xs font-medium ${s.isHidden ? 'text-gray-400' : 'text-emerald-600'}`}>
                      {s.isHidden ? '숨김' : '표시중'}
                    </span>
                    <button onClick={() => handleToggleVisibility(s)} disabled={busy}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${s.isHidden ? 'bg-gray-300' : 'bg-emerald-500'} ${busy ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${s.isHidden ? 'translate-x-1' : 'translate-x-6'}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
