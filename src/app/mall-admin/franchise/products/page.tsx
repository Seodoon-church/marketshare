'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/Toast';
import { formatKRW } from '@/lib/utils/format';
import { useAuth } from '@/lib/hooks/useAuth';
import { getMallById } from '@/lib/services/mall-service';
import { getMallProducts, updateProduct } from '@/lib/services/product-service';
import {
  getSharedProductsWithData, shareProductToAllFranchisees,
  unshareProductFromAllFranchisees, toggleSharedProductVisibility,
} from '@/lib/services/shared-product-service';
import type { Mall, Product, SharedProduct } from '@/types';
import {
  ShareIcon, CubeIcon, BuildingStorefrontIcon,
  EyeIcon, EyeSlashIcon, PhotoIcon,
} from '@heroicons/react/24/outline';

type ActiveTab = 'my-products' | 'franchisee-products';

function ProductThumb({ url, alt }: { url?: string; alt: string }) {
  return url ? (
    <img src={url} alt={alt} className="h-12 w-12 rounded-lg object-cover border border-gray-100" />
  ) : (
    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
      <PhotoIcon className="h-6 w-6 text-gray-400" />
    </div>
  );
}

export default function MallAdminFranchiseProductsPage() {
  const { user, isLoading: authLoading, isMallOwner } = useAuth();
  const [mall, setMall] = useState<Mall | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('my-products');
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const { toast } = useToast();
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [franchiseeProducts, setFranchiseeProducts] = useState<(SharedProduct & { product: Product | null })[]>([]);
  const mallId = user?.ownedMallIds?.[0];

  useEffect(() => { if (!authLoading && !isMallOwner) window.location.href = '/'; }, [authLoading, isMallOwner]);

  useEffect(() => {
    if (!mallId) return;
    getMallById(mallId).then(setMall).catch(() => toast({ type: 'error', message: '몰 정보를 불러오는 중 오류가 발생했습니다.' }));
  }, [mallId, toast]);

  const fetchMyProducts = useCallback(async () => {
    if (!mallId) return;
    try { setLoading(true); const r = await getMallProducts(mallId, { status: 'active', limit: 200 }); setMyProducts(r.products); }
    catch (e: any) { toast({ type: 'error', message: e.message || '상품 목록을 불러오는 중 오류가 발생했습니다.' }); }
    finally { setLoading(false); }
  }, [mallId, toast]);

  const fetchFranchiseeProducts = useCallback(async () => {
    if (!mallId) return;
    try { setLoading(true); setFranchiseeProducts(await getSharedProductsWithData(mallId, 'franchisee')); }
    catch (e: any) { toast({ type: 'error', message: e.message || '가맹점 상품을 불러오는 중 오류가 발생했습니다.' }); }
    finally { setLoading(false); }
  }, [mallId, toast]);

  useEffect(() => {
    if (!mallId) return;
    activeTab === 'my-products' ? fetchMyProducts() : fetchFranchiseeProducts();
  }, [mallId, activeTab, fetchMyProducts, fetchFranchiseeProducts]);

  const handleToggleShare = async (product: Product) => {
    if (!mall || !mallId) return;
    const newShared = !product.isSharedToNetwork;
    try {
      setToggling(product.id);
      await updateProduct(mallId, product.id, { isSharedToNetwork: newShared });
      if (newShared) {
        await shareProductToAllFranchisees(mallId, mall.name, mall.childMallIds, product.id);
        toast({ type: 'success', message: `"${product.name}" 상품이 네트워크에 공유되었습니다.` });
      } else {
        await unshareProductFromAllFranchisees(mall.childMallIds, product.id);
        toast({ type: 'success', message: `"${product.name}" 상품의 네트워크 공유가 해제되었습니다.` });
      }
      setMyProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, isSharedToNetwork: newShared } : p)));
    } catch (e: any) { toast({ type: 'error', message: e.message || '공유 상태 변경 중 오류가 발생했습니다.' }); }
    finally { setToggling(null); }
  };

  const handleToggleVisibility = async (shared: SharedProduct & { product: Product | null }) => {
    if (!mallId) return;
    const newHidden = !shared.isHidden;
    try {
      setToggling(shared.id);
      await toggleSharedProductVisibility(mallId, shared.id, newHidden);
      setFranchiseeProducts((prev) => prev.map((p) => (p.id === shared.id ? { ...p, isHidden: newHidden } : p)));
      toast({ type: 'success', message: newHidden ? '상품이 숨겨졌습니다.' : '상품이 표시됩니다.' });
    } catch (e: any) { toast({ type: 'error', message: e.message || '표시 상태 변경 중 오류가 발생했습니다.' }); }
    finally { setToggling(null); }
  };

  const sharedCount = myProducts.filter((p) => p.isSharedToNetwork).length;

  if (authLoading || (loading && !mall)) return <div className="flex min-h-[400px] items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (mall?.parentMallId) return <div className="flex min-h-[400px] items-center justify-center"><p className="text-sm text-gray-500">본사(본부) 몰에서만 네트워크 상품을 관리할 수 있습니다.</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">네트워크 상품 관리</h1>
        <p className="mt-1 text-sm text-gray-500">본사 상품을 가맹점에 공유하거나 가맹점 상품을 관리합니다.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
              <ShareIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">공유 중인 내 상품</p>
              <p className="text-xl font-bold text-gray-900">{sharedCount}개</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
              <BuildingStorefrontIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">가맹점 상품</p>
              <p className="text-xl font-bold text-gray-900">{franchiseeProducts.length}개</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <div className="flex items-center gap-1">
          {([['my-products', '내 상품 공유 현황', CubeIcon], ['franchisee-products', '가맹점 상품', BuildingStorefrontIcon]] as const).map(([key, label, Icon]) => (
            <button key={key} onClick={() => setActiveTab(key as ActiveTab)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === key ? 'bg-primary text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </div>
      </Card>

      {/* Content */}
      {loading ? (
        <div className="flex min-h-[200px] items-center justify-center"><LoadingSpinner size="lg" /></div>
      ) : activeTab === 'my-products' ? (
        <Card padding="none">
          <div className="p-5 pb-0">
            <CardTitle>내 상품 공유 현황</CardTitle>
            <p className="mt-1 text-xs text-gray-500">토글을 켜면 모든 가맹점에 상품이 공유됩니다.</p>
          </div>
          <div className="mt-4 divide-y divide-gray-50">
            {myProducts.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <CubeIcon className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm text-gray-400">등록된 상품이 없습니다.</p>
                <a href="/mall-admin/products/create" className="mt-2 inline-block text-sm text-primary hover:underline">상품 등록하기</a>
              </div>
            ) : myProducts.map((product) => {
              const shared = product.isSharedToNetwork ?? false;
              const busy = toggling === product.id;
              return (
                <div key={product.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <ProductThumb url={product.thumbnailUrl} alt={product.name} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-xs text-gray-500">{formatKRW(product.salePrice ?? product.price)}</span>
                        {product.categoryName && <Badge variant="default">{product.categoryName}</Badge>}
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-3">
                    {shared && <span className="text-xs text-emerald-600 font-medium">공유중</span>}
                    <button onClick={() => handleToggleShare(product)} disabled={busy}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${shared ? 'bg-emerald-500' : 'bg-gray-300'} ${busy ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${shared ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <div className="p-5 pb-0">
            <CardTitle>가맹점 상품</CardTitle>
            <p className="mt-1 text-xs text-gray-500">가맹점에서 공유한 상품을 본사 몰에서 표시하거나 숨길 수 있습니다.</p>
          </div>
          <div className="mt-4 divide-y divide-gray-50">
            {franchiseeProducts.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <BuildingStorefrontIcon className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm text-gray-400">공유된 가맹점 상품이 없습니다.</p>
              </div>
            ) : franchiseeProducts.map((s) => {
              const p = s.product;
              const busy = toggling === s.id;
              return (
                <div key={s.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <ProductThumb url={p?.thumbnailUrl} alt={p?.name ?? ''} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p?.name || '(삭제된 상품)'}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        {p && <span className="text-xs text-gray-500">{formatKRW(p.salePrice ?? p.price)}</span>}
                        <Badge variant="info">{s.sourceMallName}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center gap-3">
                    <span className={`text-xs font-medium ${s.isHidden ? 'text-gray-400' : 'text-emerald-600'}`}>
                      {s.isHidden ? '숨김' : '표시중'}
                    </span>
                    <button onClick={() => handleToggleVisibility(s)} disabled={busy}
                      className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${s.isHidden ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'} ${busy ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      {s.isHidden ? <><EyeIcon className="h-3.5 w-3.5" />표시</> : <><EyeSlashIcon className="h-3.5 w-3.5" />숨기기</>}
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
