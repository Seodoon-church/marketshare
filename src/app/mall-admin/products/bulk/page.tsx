'use client';

import { useState, useEffect } from 'react';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAuthStore } from '@/store/auth-store';
import {
  downloadProductTemplate,
  parseProductExcel,
  exportProducts,
} from '@/lib/services/excel-service';
import { createProduct, getMallProducts } from '@/lib/services/product-service';
import { formatKRW } from '@/lib/utils/format';

interface ParseResult {
  rows: any[];
  errors: Array<{ row: number; field: string; message: string }>;
}

export default function MallAdminProductsBulkPage() {
  const { user, isLoading: authLoading, isMallOwner } = useAuth();
  const mallId = user?.ownedMallIds?.[0];

  const [uploading, setUploading] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [registering, setRegistering] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [exporting, setExporting] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isMallOwner) {
      window.location.href = '/';
    }
  }, [authLoading, isMallOwner]);

  const handleDownloadTemplate = () => {
    try {
      downloadProductTemplate();
    } catch (error) {
      alert('템플릿 다운로드 실패');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setParseResult(null);

    try {
      const result = await parseProductExcel(file);
      setParseResult(result);
    } catch (error: any) {
      alert(error.message || '파일 파싱 실패');
    } finally {
      setUploading(false);
    }

    // Reset file input
    e.target.value = '';
  };

  const handleRegisterProducts = async () => {
    if (!mallId || !parseResult || parseResult.rows.length === 0) return;

    if (!confirm(`총 ${parseResult.rows.length}개 상품을 등록하시겠습니까?`)) return;

    setRegistering(true);
    setProgress({ current: 0, total: parseResult.rows.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < parseResult.rows.length; i++) {
      const row = parseResult.rows[i];
      setProgress({ current: i + 1, total: parseResult.rows.length });

      try {
        await createProduct(mallId, {
          name: row.name,
          slug: row.name.toLowerCase().replace(/\s+/g, '-'),
          description: row.description,
          shortDescription: '',
          price: row.price,
          salePrice: row.salePrice,
          costPrice: row.costPrice,
          currency: 'KRW',
          categoryId: row.categorySlug, // Using categorySlug as categoryId for now
          categoryName: row.categorySlug,
          categoryPath: [row.categorySlug],
          brandId: null,
          brandName: null,
          mallId: mallId,
          mallName: '',
          mallSlug: '',
          supplierId: null,
          supplierName: null,
          images: row.imageUrl ? [{ url: row.imageUrl, alt: row.name, order: 0, isMain: true }] : [],
          thumbnailUrl: row.imageUrl || '',
          stock: row.stock,
          sku: row.sku,
          weight: 0,
          options: [],
          variants: [],
          shippingInfo: {
            fee: row.shippingFee,
            freeShippingThreshold: row.freeShippingThreshold,
            method: 'standard',
            estimatedDays: 3,
          },
          tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
          status: 'active',
          isFeatured: false,
          isNew: false,
          isFromPlatform: false,
          levelPrices: [],
          seoTitle: row.name,
          seoDescription: row.description,
          viewCount: 0,
          salesCount: 0,
          reviewCount: 0,
          averageRating: 0,
          publishedAt: new Date(),
        });
        successCount++;
      } catch (error) {
        console.error(`Row ${i + 1} registration failed:`, error);
        failCount++;
      }

      // Small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setRegistering(false);
    setProgress({ current: 0, total: 0 });
    setParseResult(null);

    alert(`등록 완료\n성공: ${successCount}개\n실패: ${failCount}개`);
  };

  const handleExportProducts = async () => {
    if (!mallId) return;

    setExporting(true);
    try {
      const result = await getMallProducts(mallId, { limit: 1000 });

      const exportData = result.products.map((p) => ({
        name: p.name,
        categoryName: p.categoryName || '',
        price: p.price,
        salePrice: p.salePrice || null,
        stock: p.stock,
        sku: p.sku,
        status: p.status,
        salesCount: p.salesCount,
      }));

      exportProducts(exportData);
    } catch (error) {
      alert('상품 목록 다운로드 실패');
    } finally {
      setExporting(false);
    }
  };

  if (authLoading) {
    return <FullPageLoader message="로딩 중..." />;
  }

  if (!user || !isMallOwner) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">상품 대량 등록</h1>
        <p className="mt-1 text-sm text-gray-500">
          엑셀 파일을 업로드하여 여러 상품을 한 번에 등록할 수 있습니다.
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardTitle>상품 대량 등록</CardTitle>
        <div className="mt-4 space-y-4">
          {/* Step 1 */}
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              1
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">엑셀 템플릿 다운로드</h3>
              <p className="mt-1 text-xs text-gray-500">
                먼저 템플릿을 다운로드하여 상품 정보를 입력하세요.
              </p>
              <Button size="sm" variant="outline" onClick={handleDownloadTemplate} className="mt-2">
                <DocumentArrowDownIcon className="h-4 w-4" />
                템플릿 다운로드
              </Button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              2
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900">엑셀 파일 업로드</h3>
              <p className="mt-1 text-xs text-gray-500">
                작성한 엑셀 파일을 업로드하면 자동으로 검증합니다.
              </p>
              <div className="mt-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploading || registering}
                  />
                  <div className="inline-flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-primary hover:bg-primary/5">
                    <DocumentArrowUpIcon className="h-4 w-4" />
                    파일 선택
                  </div>
                </label>
                {uploading && (
                  <span className="ml-3 text-sm text-gray-500">파일 분석 중...</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Validation Results */}
        {parseResult && (
          <div className="mt-6 space-y-4">
            {/* Errors */}
            {parseResult.errors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-center gap-2">
                  <XCircleIcon className="h-5 w-5 text-red-500" />
                  <h4 className="font-semibold text-red-900">
                    검증 실패: {parseResult.errors.length}개 오류
                  </h4>
                </div>
                <div className="mt-3 max-h-40 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="border-b border-red-200">
                      <tr>
                        <th className="pb-2 text-left font-medium text-red-900">행</th>
                        <th className="pb-2 text-left font-medium text-red-900">필드</th>
                        <th className="pb-2 text-left font-medium text-red-900">오류 내용</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseResult.errors.map((err, idx) => (
                        <tr key={idx} className="border-b border-red-100">
                          <td className="py-2 text-red-700">{err.row}</td>
                          <td className="py-2 text-red-700">{err.field}</td>
                          <td className="py-2 text-red-700">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Success Preview */}
            {parseResult.errors.length === 0 && parseResult.rows.length > 0 && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
                    <h4 className="font-semibold text-emerald-900">
                      검증 성공: {parseResult.rows.length}개 상품
                    </h4>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleRegisterProducts}
                    disabled={registering}
                    isLoading={registering}
                  >
                    {registering
                      ? `등록 중 ${progress.current}/${progress.total}`
                      : `${parseResult.rows.length}개 상품 등록`}
                  </Button>
                </div>

                {/* Preview Table */}
                <div className="mt-3 overflow-x-auto">
                  <p className="mb-2 text-xs text-emerald-700">미리보기 (처음 5개)</p>
                  <table className="w-full text-xs">
                    <thead className="border-b border-emerald-200">
                      <tr>
                        <th className="pb-2 text-left font-medium text-emerald-900">상품명</th>
                        <th className="pb-2 text-left font-medium text-emerald-900">카테고리</th>
                        <th className="pb-2 text-right font-medium text-emerald-900">가격</th>
                        <th className="pb-2 text-right font-medium text-emerald-900">재고</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parseResult.rows.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="border-b border-emerald-100">
                          <td className="py-2 text-emerald-700">{row.name}</td>
                          <td className="py-2 text-emerald-700">{row.categorySlug}</td>
                          <td className="py-2 text-right text-emerald-700">
                            {formatKRW(row.price)}
                          </td>
                          <td className="py-2 text-right text-emerald-700">{row.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parseResult.rows.length > 5 && (
                    <p className="mt-2 text-xs text-emerald-600">
                      ... 외 {parseResult.rows.length - 5}개
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Export Section */}
      <Card>
        <CardTitle>상품 목록 다운로드</CardTitle>
        <p className="mt-2 text-sm text-gray-500">
          현재 등록된 상품 목록을 엑셀 파일로 다운로드할 수 있습니다.
        </p>
        <Button
          size="md"
          variant="outline"
          onClick={handleExportProducts}
          disabled={exporting}
          isLoading={exporting}
          className="mt-4"
        >
          <DocumentArrowDownIcon className="h-4 w-4" />
          현재 상품 목록 다운로드
        </Button>
      </Card>
    </div>
  );
}
