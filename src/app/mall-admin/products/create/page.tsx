'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  ChevronRightIcon,
  PhotoIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/hooks/useAuth';
import { createProduct } from '@/lib/services/product-service';
import { getMallCategories } from '@/lib/services/category-service';
import { getBrands } from '@/lib/services/brand-service';
import { uploadProductImage } from '@/lib/services/upload-service';
import { useToast } from '@/components/ui/Toast';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import type { Category } from '@/types';

interface OptionGroup {
  id: string;
  name: string;
  values: string[];
}

export default function MallAdminProductCreate() {
  const router = useRouter();
  const { user, isLoading: authLoading, isMallOwner } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const [productName, setProductName] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stock, setStock] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [shippingFee, setShippingFee] = useState('3000');
  const [freeShippingMin, setFreeShippingMin] = useState('50000');
  const [estimatedDays, setEstimatedDays] = useState('2');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDesc, setSeoDesc] = useState('');
  const [options, setOptions] = useState<OptionGroup[]>([
    { id: 'opt1', name: '색상', values: ['화이트', '블랙', '그레이'] },
    { id: 'opt2', name: '사이즈', values: ['S', 'M', 'L', 'XL'] },
  ]);

  const mallId = user?.ownedMallIds?.[0];

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isMallOwner) {
      window.location.href = '/auth/login';
    }
  }, [authLoading, isMallOwner]);

  // Load categories
  useEffect(() => {
    if (!mallId) return;

    async function loadData() {
      try {
        setCategoriesLoading(true);
        const [cats, brandList] = await Promise.all([
          getMallCategories(mallId!),
          getBrands({ isActive: true }),
        ]);
        setCategories(cats);
        setBrands(brandList.map((b) => ({ id: b.id, name: b.name })));
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
      } finally {
        setCategoriesLoading(false);
      }
    }

    loadData();
  }, [mallId]);

  const addOption = () => {
    setOptions([
      ...options,
      { id: `opt${Date.now()}`, name: '', values: [] },
    ]);
  };

  const removeOption = (id: string) => {
    setOptions(options.filter((o) => o.id !== id));
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (imageFiles.length + files.length > 10) {
      toast({ type: 'warning', message: '이미지는 최대 10장까지 업로드 가능합니다.' });
      return;
    }

    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const buildProductData = (status: 'active' | 'draft') => {
    const selectedCategory = categories.find((c) => c.id === category);

    return {
      name: productName,
      slug: productName.toLowerCase().replace(/\s+/g, '-'),
      description,
      shortDescription: shortDesc,
      price: Number(price) || 0,
      salePrice: discountPrice ? Number(discountPrice) : null,
      costPrice: Number(costPrice) || 0,
      currency: 'KRW',
      categoryId: category,
      categoryName: selectedCategory?.name || '',
      categoryPath: selectedCategory?.path || [],
      brandId: brand || null,
      brandName: brand || null,
      mallId: mallId!,
      mallName: '',
      mallSlug: '',
      supplierId: null,
      supplierName: null,
      images: [] as { url: string; alt: string; order: number; isMain: boolean }[],
      thumbnailUrl: '',
      options: options
        .filter((o) => o.name)
        .map((o) => ({ name: o.name, values: o.values.filter((v) => v) })),
      variants: [],
      stock: Number(stock) || 0,
      sku: sku || '',
      weight: 0,
      status,
      isFeatured: false,
      isNew: true,
      isFromPlatform: false,
      tags: [],
      viewCount: 0,
      salesCount: 0,
      reviewCount: 0,
      averageRating: 0,
      shippingInfo: {
        fee: Number(shippingFee) || 0,
        freeShippingThreshold: Number(freeShippingMin) || 0,
        method: 'delivery',
        estimatedDays: Number(estimatedDays) || 2,
      },
      levelPrices: [],
      seoTitle: seoTitle || productName,
      seoDescription: seoDesc || shortDesc,
      publishedAt: status === 'active' ? new Date() : null,
    };
  };

  const handleSubmit = async (status: 'active' | 'draft') => {
    if (!mallId) return;

    if (!productName.trim()) {
      toast({ type: 'warning', message: '상품명을 입력해주세요.' });
      return;
    }
    if (!price) {
      toast({ type: 'warning', message: '판매가를 입력해주세요.' });
      return;
    }

    setSubmitting(true);
    try {
      // Upload images first
      let uploadedUrls: string[] = [];
      if (imageFiles.length > 0) {
        setUploadingImages(true);
        try {
          uploadedUrls = await Promise.all(
            imageFiles.map(file => uploadProductImage(mallId!, file))
          );
        } catch (uploadError: any) {
          toast({ type: 'error', message: uploadError.message || '이미지 업로드 중 오류가 발생했습니다.' });
          setSubmitting(false);
          setUploadingImages(false);
          return;
        }
        setUploadingImages(false);
      }

      const productData = buildProductData(status);
      // Add uploaded image URLs
      productData.images = uploadedUrls.map((url, i) => ({
        url,
        alt: productName,
        order: i,
        isMain: i === 0,
      }));
      productData.thumbnailUrl = uploadedUrls[0] || '';

      await createProduct(mallId, productData);
      toast({ type: 'success', message: status === 'active' ? '상품이 등록되었습니다.' : '임시저장되었습니다.' });
      router.push('/mall-admin/products');
    } catch (error: any) {
      toast({ type: 'error', message: error.message || '상품 등록 중 오류가 발생했습니다.' });
    } finally {
      setSubmitting(false);
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
          <span className="text-gray-600">상품 등록</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">상품 등록</h1>
      </div>

      {/* 기본 정보 */}
      <Card>
        <CardTitle>기본 정보</CardTitle>
        <div className="mt-4 space-y-4">
          <Input
            label="상품명"
            placeholder="상품명을 입력해주세요"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
          <Input
            label="짧은 설명"
            placeholder="상품의 핵심 특징을 간단히 설명해주세요"
            value={shortDesc}
            onChange={(e) => setShortDesc(e.target.value)}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                카테고리
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={categoriesLoading}
              >
                <option value="">
                  {categoriesLoading ? '카테고리 불러오는 중...' : '카테고리 선택'}
                </option>
                {categories
                  .filter((c) => c.isActive)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.depth > 0 ? '\u00A0'.repeat(cat.depth * 2) + '└ ' : ''}
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="w-full">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                브랜드
              </label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">브랜드 선택</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* 가격/재고 */}
      <Card>
        <CardTitle>가격 / 재고</CardTitle>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="판매가"
            type="number"
            placeholder="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            hint="원"
          />
          <Input
            label="할인가"
            type="number"
            placeholder="0"
            value={discountPrice}
            onChange={(e) => setDiscountPrice(e.target.value)}
            hint="원 (선택사항)"
          />
          <Input
            label="원가"
            type="number"
            placeholder="0"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            hint="원 (내부 관리용)"
          />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="재고수량"
            type="number"
            placeholder="0"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
          <Input
            label="SKU"
            placeholder="예: TS-W-001"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
          />
        </div>
      </Card>

      {/* 이미지 */}
      <Card>
        <CardTitle>이미지</CardTitle>
        <div className="mt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />

          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {imagePreviews.map((preview, idx) => (
                <div key={idx} className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200">
                  <img src={preview} alt={`상품 이미지 ${idx + 1}`} className="h-full w-full object-cover" />
                  {idx === 0 && (
                    <span className="absolute left-1 top-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">대표</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 px-6 py-8 transition-colors hover:border-primary/40 hover:bg-primary/5 cursor-pointer"
          >
            <div className="text-center">
              <PhotoIcon className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-2 text-sm font-medium text-gray-600">
                이미지를 클릭하여 업로드
              </p>
              <p className="mt-1 text-xs text-gray-400">
                PNG, JPG, WEBP (최대 10MB) · {imagePreviews.length}/10장
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 옵션 */}
      <Card>
        <div className="flex items-center justify-between">
          <CardTitle>옵션</CardTitle>
          <Button variant="outline" size="sm" onClick={addOption}>
            <PlusIcon className="h-4 w-4" />
            옵션 추가
          </Button>
        </div>
        <div className="mt-4 space-y-4">
          {options.map((option) => (
            <div
              key={option.id}
              className="rounded-xl border border-gray-100 bg-gray-50/50 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <Input
                  placeholder="옵션명 (예: 색상)"
                  value={option.name}
                  onChange={(e) =>
                    setOptions(
                      options.map((o) =>
                        o.id === option.id
                          ? { ...o, name: e.target.value }
                          : o
                      )
                    )
                  }
                  className="max-w-[200px]"
                />
                <button
                  onClick={() => removeOption(option.id)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {option.values.map((val, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm border border-gray-200"
                  >
                    {val}
                    <button
                      onClick={() =>
                        setOptions(
                          options.map((o) =>
                            o.id === option.id
                              ? {
                                  ...o,
                                  values: o.values.filter(
                                    (_, i) => i !== idx
                                  ),
                                }
                              : o
                          )
                        )
                      }
                      className="ml-0.5 text-gray-300 hover:text-gray-500"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
                <button
                  onClick={() =>
                    setOptions(
                      options.map((o) =>
                        o.id === option.id
                          ? { ...o, values: [...o.values, ''] }
                          : o
                      )
                    )
                  }
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-3 py-1 text-sm text-gray-400 hover:border-primary hover:text-primary transition-colors"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  값 추가
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* 상품 설명 */}
      <Card>
        <CardTitle>상품 설명</CardTitle>
        <div className="mt-4">
          <RichTextEditor
            content={description}
            onChange={setDescription}
            placeholder="상품에 대한 상세 설명을 작성해주세요..."
            minHeight="300px"
          />
        </div>
      </Card>

      {/* 배송 정보 */}
      <Card>
        <CardTitle>배송 정보</CardTitle>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="배송비"
            type="number"
            placeholder="0"
            value={shippingFee}
            onChange={(e) => setShippingFee(e.target.value)}
            hint="원"
          />
          <Input
            label="무료배송 기준금액"
            type="number"
            placeholder="0"
            value={freeShippingMin}
            onChange={(e) => setFreeShippingMin(e.target.value)}
            hint="원 이상 주문 시 무료배송"
          />
          <Input
            label="예상 배송일"
            type="number"
            placeholder="2"
            value={estimatedDays}
            onChange={(e) => setEstimatedDays(e.target.value)}
            hint="영업일 기준"
          />
        </div>
      </Card>

      {/* SEO */}
      <Card>
        <CardTitle>SEO 설정</CardTitle>
        <div className="mt-4 space-y-4">
          <Input
            label="검색 타이틀"
            placeholder="검색 엔진에 표시될 제목"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
          />
          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              검색 설명
            </label>
            <textarea
              value={seoDesc}
              onChange={(e) => setSeoDesc(e.target.value)}
              placeholder="검색 엔진에 표시될 설명을 입력해주세요"
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
            />
          </div>
        </div>
      </Card>

      {/* Bottom Actions */}
      <div className="flex items-center justify-end gap-3 pb-6">
        <Button
          variant="outline"
          size="lg"
          onClick={() => handleSubmit('draft')}
          disabled={submitting}
        >
          {submitting ? '저장 중...' : '임시저장'}
        </Button>
        <Button
          size="lg"
          onClick={() => handleSubmit('active')}
          disabled={submitting}
        >
          {submitting ? '등록 중...' : '상품 등록'}
        </Button>
      </div>
    </div>
  );
}
