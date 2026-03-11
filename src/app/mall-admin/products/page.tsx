'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { formatKRW, formatDate } from '@/lib/utils/format';
import { useAuth } from '@/lib/hooks/useAuth';
import {
  getMallProducts,
  updateProduct,
  deleteProduct,
} from '@/lib/services/product-service';
import type { Product, ProductStatus } from '@/types';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

const PAGE_SIZE = 20;

const statusTabs: { key: ProductStatus | 'all'; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'active', label: '판매중' },
  { key: 'soldout', label: '품절' },
  { key: 'hidden', label: '숨김' },
  { key: 'draft', label: '임시저장' },
];

const statusConfig: Record<
  ProductStatus,
  { label: string; variant: 'success' | 'danger' | 'secondary' | 'warning' }
> = {
  active: { label: '판매중', variant: 'success' },
  soldout: { label: '품절', variant: 'danger' },
  hidden: { label: '숨김', variant: 'secondary' },
  draft: { label: '임시저장', variant: 'warning' },
};

const statusOptions: { key: ProductStatus; label: string }[] = [
  { key: 'active', label: '판매중' },
  { key: 'soldout', label: '품절' },
  { key: 'hidden', label: '숨김' },
  { key: 'draft', label: '임시저장' },
];

export default function MallAdminProducts() {
  const { user, isLoading: authLoading, isMallOwner } = useAuth();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ProductStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Delete single
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Bulk delete
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);

  // Bulk status change
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [bulkNewStatus, setBulkNewStatus] = useState<ProductStatus>('active');
  const [bulkStatusLoading, setBulkStatusLoading] = useState(false);

  const mallId = user?.ownedMallIds?.[0];

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isMallOwner) {
      window.location.href = '/auth/login';
    }
  }, [authLoading, isMallOwner]);

  // Load products from Firestore
  const loadProducts = useCallback(async () => {
    if (!mallId) return;

    setLoading(true);
    try {
      const statusFilter =
        activeTab !== 'all' ? (activeTab as ProductStatus) : undefined;
      const result = await getMallProducts(mallId, {
        status: statusFilter,
        limit: PAGE_SIZE,
      });
      setProducts(result.products);
      setTotalProducts(result.products.length + (result.hasMore ? 1 : 0));
    } catch (error) {
      console.error('상품 목록 로딩 실패:', error);
      toast({ type: 'error', message: '상품 목록을 불러오지 못했습니다.' });
    } finally {
      setLoading(false);
    }
  }, [mallId, activeTab, toast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Reset page and selection when tab changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [activeTab]);

  // Client-side search filter
  const filtered = products.filter((p) => {
    const matchSearch =
      !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  // Pagination (client-side within loaded products)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedProducts = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedIds.length === paginatedProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedProducts.map((p) => p.id));
    }
  };

  // --- Row action handlers ---

  const handleView = (productId: string) => {
    window.location.href = `/mall-admin/products/edit?id=${productId}`;
  };

  const handleEdit = (productId: string) => {
    window.location.href = `/mall-admin/products/edit?id=${productId}`;
  };

  const handleDeleteSingle = async () => {
    if (!mallId || !deleteTargetId) return;

    setDeleteLoading(true);
    try {
      await deleteProduct(mallId, deleteTargetId);
      toast({ type: 'success', message: '상품이 삭제되었습니다.' });
      setDeleteTargetId(null);
      loadProducts();
    } catch (error: any) {
      toast({
        type: 'error',
        message: error.message || '상품 삭제 중 오류가 발생했습니다.',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- Bulk action handlers ---

  const handleBulkDelete = async () => {
    if (!mallId || selectedIds.length === 0) return;

    setBulkDeleteLoading(true);
    try {
      for (const id of selectedIds) {
        await deleteProduct(mallId, id);
      }
      toast({
        type: 'success',
        message: `${selectedIds.length}개 상품이 삭제되었습니다.`,
      });
      setSelectedIds([]);
      setShowBulkDeleteConfirm(false);
      loadProducts();
    } catch (error: any) {
      toast({
        type: 'error',
        message: error.message || '상품 삭제 중 오류가 발생했습니다.',
      });
    } finally {
      setBulkDeleteLoading(false);
    }
  };

  const handleBulkStatusChange = async () => {
    if (!mallId || selectedIds.length === 0) return;

    setBulkStatusLoading(true);
    try {
      for (const id of selectedIds) {
        await updateProduct(mallId, id, { status: bulkNewStatus });
      }
      toast({
        type: 'success',
        message: `${selectedIds.length}개 상품의 상태가 변경되었습니다.`,
      });
      setSelectedIds([]);
      setShowStatusModal(false);
      loadProducts();
    } catch (error: any) {
      toast({
        type: 'error',
        message: error.message || '상태 변경 중 오류가 발생했습니다.',
      });
    } finally {
      setBulkStatusLoading(false);
    }
  };

  // Auth loading or redirect state
  if (authLoading || !isMallOwner) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <Card>
          <div className="h-10 w-full animate-pulse rounded bg-gray-100" />
        </Card>
        <Card padding="none">
          <div className="space-y-4 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-100" />
                <div className="h-4 flex-1 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">상품 관리</h1>
        <Button href="/mall-admin/products/create">
          <PlusIcon className="h-4 w-4" />
          상품 등록
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'bg-primary text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="상품명 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary">
              {selectedIds.length}개 상품 선택됨
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStatusModal(true)}
              >
                상태 변경
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowBulkDeleteConfirm(true)}
              >
                <TrashIcon className="h-3.5 w-3.5" />
                삭제
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Table */}
      <Card padding="none">
        {loading ? (
          <div className="space-y-4 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 w-4 animate-pulse rounded bg-gray-100" />
                <div className="h-10 w-10 animate-pulse rounded-lg bg-gray-100" />
                <div className="h-4 flex-1 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                <div className="h-4 w-12 animate-pulse rounded bg-gray-100" />
                <div className="h-5 w-14 animate-pulse rounded-full bg-gray-100" />
                <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={
                          paginatedProducts.length > 0 &&
                          selectedIds.length === paginatedProducts.length
                        }
                        onChange={toggleAll}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                      상품명
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                      카테고리
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                      판매가
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                      재고
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">
                      판매수
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">
                      상태
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">
                      등록일
                    </th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedProducts.map((product) => {
                    const sc = statusConfig[product.status];
                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(product.id)}
                            onChange={() => toggleSelect(product.id)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {product.thumbnailUrl ? (
                              <img
                                src={product.thumbnailUrl}
                                alt={product.name}
                                className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                <CubeIconPlaceholder />
                              </div>
                            )}
                            <span className="font-medium text-gray-900">
                              {product.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {product.categoryName}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatKRW(product.price)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={
                              product.stock <= 5
                                ? 'font-medium text-red-600'
                                : 'text-gray-600'
                            }
                          >
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600">
                          {product.salesCount}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={sc.variant}>{sc.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {formatDate(product.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleView(product.id)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                              title="보기"
                            >
                              <EyeIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(product.id)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                              title="수정"
                            >
                              <PencilSquareIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTargetId(product.id)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                              title="삭제"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {paginatedProducts.length === 0 && (
              <div className="py-16 text-center text-sm text-gray-400">
                검색 결과가 없습니다.
              </div>
            )}
          </>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              setCurrentPage(page);
              setSelectedIds([]);
            }}
          />
        </div>
      )}

      {/* Single Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={deleteTargetId !== null}
        onConfirm={handleDeleteSingle}
        onCancel={() => setDeleteTargetId(null)}
        title="상품 삭제"
        message="이 상품을 삭제하시겠습니까? 삭제된 상품은 복구할 수 없습니다."
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
        isLoading={deleteLoading}
      />

      {/* Bulk Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={showBulkDeleteConfirm}
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
        title="상품 일괄 삭제"
        message={`선택한 ${selectedIds.length}개 상품을 삭제하시겠습니까? 삭제된 상품은 복구할 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
        isLoading={bulkDeleteLoading}
      />

      {/* Bulk Status Change Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="상태 일괄 변경"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            선택한 {selectedIds.length}개 상품의 상태를 변경합니다.
          </p>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              변경할 상태
            </label>
            <select
              value={bulkNewStatus}
              onChange={(e) =>
                setBulkNewStatus(e.target.value as ProductStatus)
              }
              className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {statusOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setShowStatusModal(false)}
              disabled={bulkStatusLoading}
            >
              취소
            </Button>
            <Button
              fullWidth
              onClick={handleBulkStatusChange}
              isLoading={bulkStatusLoading}
            >
              변경
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function CubeIconPlaceholder() {
  return (
    <svg
      className="h-5 w-5 text-gray-300"
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
