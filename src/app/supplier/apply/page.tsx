'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BuildingStorefrontIcon } from '@heroicons/react/24/outline';
import { applyAsSupplier } from '@/lib/services/supplier-service';

export default function SupplierApplyPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
    businessName: '',
    businessNumber: '',
    productCategories: [] as string[],
    sampleProducts: '',
    additionalMessage: '',
  });

  const categories = ['식품', '패션', '뷰티', '생활', '전자', '건강', '기타'];

  const toggleCategory = (cat: string) => {
    if (formData.productCategories.includes(cat)) {
      setFormData({
        ...formData,
        productCategories: formData.productCategories.filter((c) => c !== cat),
      });
    } else {
      setFormData({
        ...formData,
        productCategories: [...formData.productCategories, cat],
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.applicantName.trim()) {
      alert('대표자명을 입력하세요.');
      return;
    }
    if (!formData.applicantEmail.trim()) {
      alert('이메일을 입력하세요.');
      return;
    }
    if (!formData.applicantPhone.trim()) {
      alert('연락처를 입력하세요.');
      return;
    }
    if (!formData.businessName.trim()) {
      alert('사업자명을 입력하세요.');
      return;
    }
    if (!formData.businessNumber.trim()) {
      alert('사업자번호를 입력하세요.');
      return;
    }
    if (formData.productCategories.length === 0) {
      alert('취급 상품 카테고리를 하나 이상 선택하세요.');
      return;
    }

    setSubmitting(true);
    try {
      await applyAsSupplier({
        applicantName: formData.applicantName,
        applicantEmail: formData.applicantEmail,
        applicantPhone: formData.applicantPhone,
        businessName: formData.businessName,
        businessNumber: formData.businessNumber,
        productCategories: formData.productCategories,
        sampleProducts: formData.sampleProducts,
        message: formData.additionalMessage,
      });

      alert('입점 신청이 완료되었습니다.\n심사 후 연락드리겠습니다.');
      router.push('/');
    } catch (error: any) {
      alert(error.message || '입점 신청 실패');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header />
      <main className="mx-auto min-h-screen max-w-2xl px-4 py-12">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <BuildingStorefrontIcon className="h-8 w-8 text-primary" />
            </div>
            <h1 className="mt-4 text-3xl font-bold text-gray-900">공급사 입점 신청</h1>
            <p className="mt-2 text-sm text-gray-500">
              MarketShare에 공급사로 입점하여 더 많은 고객을 만나보세요.
            </p>
          </div>

          {/* Form */}
          <Card>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 신청자 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">신청자 정보</h3>
                <div className="mt-4 space-y-4">
                  <Input
                    label="대표자명"
                    placeholder="홍길동"
                    value={formData.applicantName}
                    onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                    required
                  />
                  <Input
                    label="이메일"
                    type="email"
                    placeholder="example@example.com"
                    value={formData.applicantEmail}
                    onChange={(e) => setFormData({ ...formData, applicantEmail: e.target.value })}
                    required
                  />
                  <Input
                    label="연락처"
                    type="tel"
                    placeholder="010-1234-5678"
                    value={formData.applicantPhone}
                    onChange={(e) => setFormData({ ...formData, applicantPhone: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* 사업자 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">사업자 정보</h3>
                <div className="mt-4 space-y-4">
                  <Input
                    label="사업자명"
                    placeholder="(주)마켓쉐어"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    required
                  />
                  <Input
                    label="사업자번호"
                    placeholder="123-45-67890"
                    value={formData.businessNumber}
                    onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* 상품 정보 */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">상품 정보</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      취급 상품 카테고리
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                            formData.productCategories.includes(cat)
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      샘플 상품 설명
                    </label>
                    <textarea
                      placeholder="대표 상품 및 특징을 간단히 설명해주세요."
                      value={formData.sampleProducts}
                      onChange={(e) => setFormData({ ...formData, sampleProducts: e.target.value })}
                      rows={4}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      기타 메시지
                    </label>
                    <textarea
                      placeholder="추가로 전달하실 내용이 있다면 작성해주세요."
                      value={formData.additionalMessage}
                      onChange={(e) =>
                        setFormData({ ...formData, additionalMessage: e.target.value })
                      }
                      rows={4}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  fullWidth
                  onClick={() => router.back()}
                >
                  취소
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  disabled={submitting}
                  isLoading={submitting}
                >
                  입점 신청
                </Button>
              </div>
            </form>
          </Card>

          {/* Info */}
          <Card className="bg-blue-50 border-blue-100">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-blue-900">안내사항</h4>
                <ul className="mt-2 space-y-1 text-xs text-blue-700">
                  <li>• 신청서 검토는 영업일 기준 2-3일 소요됩니다.</li>
                  <li>• 심사 결과는 이메일로 안내드립니다.</li>
                  <li>• 승인 후 수수료율과 입점몰 배정이 결정됩니다.</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
