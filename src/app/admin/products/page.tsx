'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { formatKRW, formatDate } from '@/lib/utils/format';
import {
  MagnifyingGlassIcon,
  CubeIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { getProducts } from '@/lib/services/product-service';
import { useAuth } from '@/lib/hooks/useAuth';
import type { Product, ProductStatus } from '@/types';

const statusTabs = [
  { key: 'all', label: '전체' },
  { key: 'active', label: '판매중' },
  { key: 'soldout', label: '품절' },
  { key: 'hidden', label: '숨김' },
  { key: 'draft', label: '임시저장' },
] as const;

type StatusFilter = (typeof statusTabs)[number]['key'];

const statusBadgeMap: Record<ProductStatus, { label: string; variant: 'success' | 'danger' | 'secondary' | 'warning' }> = {
  active: { label: '판매중', variant: 'success' },
  soldout: { label: '품절', variant: 'danger' },
  hidden: { label: '숨김', variant: 'secondary' },
  draft: { label: '임시저장', variant: 'warning' },
};

export default function AdminProductsPage() {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const [category, setCategory] = useState('전체');
  const [mall, setMall] = useState('전체');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      window.location.href = '/';
    }
  }, [authLoading, isAdmin]);

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    async function fetchProducts() {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getProducts({ limit: 100 });
        setProducts(result.products);
      } catch (err: any) {
        setError(err.message || '상품 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchProducts();
  }, [authLoading, isAdmin]);

  // Derive categories and mallNames from fetched product data
  const categories = [
    '전체',
    ...Array.from(new Set(products.map((p) => p.categoryId).filter(Boolean))),
  ];
  const mallNames = [
    '전체',
    ...Array.from(new Set(products.map((p) => p.mallName).filter(Boolean))),
  ];

  const filteredProducts = products.filter((product) => {
    const matchesStatus = activeTab === 'all' || product.status === activeTab;
    const matchesCategory = category === '전체' || product.categoryId === category;
    const matchesMall = mall === '전체' || product.mallName === mall;
    const matchesSearch =
      search === '' ||
      product.name.includes(search) ||
      product.mallName.includes(search);
    return matchesStatus && matchesCategory && matchesMall && matchesSearch;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.length === 0) {
      alert('상품을 선택해주세요.');
      return;
    }
    if (confirm('선택한 상품을 삭제하시겠습니까?')) {
      alert('일괄 삭제 기능은 준비 중입니다.');
    }
  };

  const handleBatchStatusChange = () => {
    if (selectedIds.length === 0) {
      alert('상품을 선택해주세요.');
      return;
    }
    alert('일괄 상태변경 기능은 준비 중입니다.');
  };

  if (authLoading || !isAdmin) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
          <CubeIcon className="h-5 w-5 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">전체 상품 관리</h1>
      </div>

      {/* Filter Row */}
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          {/* Status Tabs */}
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === '전체' ? '카테고리 전체' : c}
              </option>
            ))}
          </select>

          {/* Mall Dropdown */}
          <select
            value={mall}
            onChange={(e) => setMall(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {mallNames.map((m) => (
              <option key={m} value={m}>
                {m === '전체' ? '몰 전체' : m}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="상품명 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <span className="text-sm font-medium text-primary">
            {selectedIds.length}개 선택됨
          </span>
          <Button variant="danger" size="sm" onClick={handleBatchDelete}>
            <TrashIcon className="h-3.5 w-3.5" />
            선택삭제
          </Button>
          <Button variant="outline" size="sm" onClick={handleBatchStatusChange}>
            <ArrowPathIcon className="h-3.5 w-3.5" />
            상태변경
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card>
          <div className="py-12 text-center text-sm text-red-500">{error}</div>
        </Card>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[768px]">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-5 py-3">
                    <input
                      type="checkbox"
                      checked={
                        filteredProducts.length > 0 &&
                        selectedIds.length === filteredProducts.length
                      }
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/50"
                    />
                  </th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">상품명</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">몰명</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">카테고리</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 text-right">가격</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 text-right">재고</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 text-right">판매수</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">상태</th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500">등록일</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const badge = statusBadgeMap[product.status];
                  return (
                    <tr
                      key={product.id}
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(product.id)}
                          onChange={() => toggleSelect(product.id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/50"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-medium text-gray-900">{product.name}</span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600">{product.mallName}</td>
                      <td className="px-5 py-3">
                        <Badge variant="secondary">{product.categoryId}</Badge>
                      </td>
                      <td className="px-5 py-3 text-sm font-semibold text-gray-900 text-right">
                        {formatKRW(product.price)}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-900 text-right">
                        <span className={product.stock === 0 ? 'text-red-500 font-medium' : ''}>
                          {product.stock.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-900 text-right font-medium">
                        {product.salesCount.toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-500">
                        {formatDate(product.createdAt)}
                      </td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-sm text-gray-400">
                      {products.length === 0 ? '등록된 상품이 없습니다.' : '검색 결과가 없습니다.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
