'use client';

import { useState, useEffect } from 'react';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CubeIcon, PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/auth-store';
import { formatKRW } from '@/lib/utils/format';
import { getSupplierProducts } from '@/lib/services/supplier-service';

function SupplierNav() {
  return (
    <nav className="border-b border-gray-100 bg-white">
      <div className="mx-auto max-w-[var(--content-max-width)] px-4">
        <div className="flex items-center gap-1">
          <a href="/supplier" className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900">
            대시보드
          </a>
          <a href="/supplier/products" className="border-b-2 border-primary px-4 py-3 text-sm font-medium text-primary">
            상품관리
          </a>
          <a href="/supplier/orders" className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900">
            주문현황
          </a>
          <a href="/supplier/settlements" className="border-b-2 border-transparent px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900">
            정산내역
          </a>
        </div>
      </div>
    </nav>
  );
}

export default function SupplierProductsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore();
  const supplierId = user?.supplierIds?.[0];

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== 'supplier')) {
      window.location.href = '/supplier';
    }
  }, [authLoading, isAuthenticated, user]);

  useEffect(() => {
    if (!supplierId) return;

    async function fetchProducts() {
      setLoading(true);
      try {
        const data = await getSupplierProducts(supplierId!, { status: statusFilter || undefined });
        setProducts(data);
      } catch (error) {
        console.error('상품 목록 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [supplierId, statusFilter]);

  if (authLoading || loading) {
    return <FullPageLoader message="로딩 중..." />;
  }

  if (!isAuthenticated || user?.role !== 'supplier') {
    return null;
  }

  // Filter products by search query
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Paginate
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <>
      <Header />
      <SupplierNav />
      <main className="mx-auto min-h-screen max-w-[var(--content-max-width)] px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">상품 관리</h1>
              <p className="mt-1 text-sm text-gray-500">총 {filteredProducts.length}개 상품</p>
            </div>
            <Button onClick={() => alert('상품 등록은 플랫폼 관리자를 통해 진행됩니다. 관리자에게 문의해주세요.')} size="md">
              <PlusIcon className="h-4 w-4" />
              상품 등록 문의
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStatusFilter('')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    statusFilter === ''
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  전체
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    statusFilter === 'active'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  판매중
                </button>
                <button
                  onClick={() => setStatusFilter('inactive')}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    statusFilter === 'inactive'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  판매중지
                </button>
              </div>
              <div className="relative w-full sm:w-64">
                <Input
                  placeholder="상품명 검색"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <MagnifyingGlassIcon className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
          </Card>

          {/* Products Table */}
          {paginatedProducts.length === 0 ? (
            <EmptyState
              icon={<CubeIcon className="h-12 w-12" />}
              title="상품이 없습니다"
              description="새 상품을 등록해보세요."
            />
          ) : (
            <>
              <Card padding="none">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">상품명</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">카테고리</th>
                        <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">가격</th>
                        <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">재고</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-500">상태</th>
                        <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">판매수</th>
                        <th className="px-5 py-3 text-right text-xs font-medium text-gray-500">관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedProducts.map((product) => (
                        <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              {product.images?.[0] && (
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="h-10 w-10 rounded-lg object-cover"
                                />
                              )}
                              <span className="text-sm font-medium text-gray-900">{product.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600">{product.categorySlug}</td>
                          <td className="px-5 py-3 text-sm text-right text-gray-900">
                            {formatKRW(product.price)}
                          </td>
                          <td className="px-5 py-3 text-sm text-right text-gray-900">{product.stock}</td>
                          <td className="px-5 py-3">
                            <Badge variant={product.status === 'active' ? 'success' : 'secondary'}>
                              {product.status === 'active' ? '판매중' : '판매중지'}
                            </Badge>
                          </td>
                          <td className="px-5 py-3 text-sm text-right text-gray-600">
                            {product.salesCount || 0}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Button size="sm" variant="outline" onClick={() => alert('상품 수정은 플랫폼 관리자를 통해 진행됩니다.')}>
                              수정
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
