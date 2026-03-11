'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, collection, addDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { DEFAULT_CATEGORIES } from '@/lib/data/categories';
import type { CategoryNode } from '@/lib/data/categories';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/store/auth-store';
import { createMall } from '@/lib/services/mall-service';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  BuildingStorefrontIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export default function CreateMallPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, setUser } = useAuthStore();

  const [mallName, setMallName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auth 로딩 중
  if (authLoading) {
    return (
      <>
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
        <Footer />
      </>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <>
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">로그인이 필요합니다.</p>
            <a href="/auth/login" className="mt-4 inline-block text-primary hover:underline">
              로그인하기
            </a>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // 플랫폼 관리자는 여러 몰을 관리할 수 있으므로 리다이렉트하지 않음
  // 몰 오너만 이미 몰이 있으면 관리자로 이동
  if (user.role === 'mall_owner' && user.ownedMallIds && user.ownedMallIds.length > 0) {
    window.location.href = '/mall-admin';
    return null;
  }

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[가-힣]/g, (ch) => {
        // 간단한 한글→영문 변환 대신 제거
        return '';
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `mall-${Date.now()}`;
  };

  const handleNameChange = (value: string) => {
    setMallName(value);
    if (!slug || slug === generateSlug(mallName)) {
      setSlug(value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/[가-힣]/g, '').replace(/^-|-$/g, '') || `my-mall-${Date.now().toString(36)}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!mallName.trim()) {
      setError('몰 이름을 입력해주세요.');
      return;
    }
    if (!slug.trim() || slug.length < 2) {
      setError('몰 주소(slug)를 2자 이상 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const mallId = await createMall({
        name: mallName.trim(),
        slug: slug.trim().toLowerCase(),
        ownerId: user.id,
        ownerName: user.name || user.email,
        themeId: 'default',
        themeConfig: {},
        status: 'active',
        level: 1,
        plan: 'free',
        domain: null,
        subdomain: `${slug.trim().toLowerCase()}`,
        businessInfo: {
          businessName: mallName.trim(),
          businessNumber: '',
          representative: user.name || '',
          address: '',
          phone: user.phone || '',
          email: user.email,
        },
        bankInfo: null,
        commissionRate: 5,
        referralCommissionRate: 0,
        salesCommissionRate: 5,
        pgPaymentAuth: 'platform',
        pgConfig: null,
        description: description.trim() || `${mallName} 쇼핑몰입니다.`,
        logoUrl: null,
        faviconUrl: null,
        seoTitle: mallName.trim(),
        seoDescription: description.trim() || `${mallName} - MarketShare 분양몰`,
        seoKeywords: [],
        isClosedMall: false,
        requireMemberApproval: false,
        hidePriceForNonMembers: false,
        pointSettings: null,
        productCount: 0,
        orderCount: 0,
        totalRevenue: 0,
        parentMallId: null,
        childMallIds: [],
        franchiseStartDate: new Date(),
        franchiseEndDate: null,
      });

      // 기본 상품 카테고리 자동 생성 (대/중/소 3단계)
      const catCol = collection(db, 'malls', mallId, 'categories');
      const batch = writeBatch(db);
      let order = 0;

      const addCategoryTree = (nodes: CategoryNode[], parentId: string | null, depth: number, path: string[]) => {
        for (const node of nodes) {
          const ref = doc(catCol);
          const catPath = parentId ? [...path, ref.id] : [ref.id];
          batch.set(ref, {
            name: node.name,
            slug: node.slug,
            parentId,
            depth,
            path: catPath,
            order: order++,
            imageUrl: null,
            iconUrl: null,
            productCount: 0,
            isActive: true,
            createdAt: serverTimestamp(),
          });
          if (node.children) {
            addCategoryTree(node.children, ref.id, depth + 1, catPath);
          }
        }
      };

      addCategoryTree(DEFAULT_CATEGORIES, null, 0, []);
      await batch.commit();

      // 사용자 role 업데이트 (platform_admin은 역할 유지)
      const newRole = user.role === 'platform_admin' ? 'platform_admin' : 'mall_owner';
      await setDoc(doc(db, 'users', user.id), {
        role: newRole,
        ownedMallIds: [...(user.ownedMallIds || []), mallId],
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Zustand 상태 업데이트
      setUser({
        ...user,
        role: newRole,
        ownedMallIds: [...(user.ownedMallIds || []), mallId],
      });

      router.push('/mall-admin');
    } catch (err: any) {
      setError(err.message || '몰 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-gray-50/30 py-12">
        <div className="mx-auto max-w-lg px-4">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <BuildingStorefrontIcon className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">분양몰 개설</h1>
            <p className="mt-2 text-gray-500">
              몇 가지 정보만 입력하면 바로 쇼핑몰이 개설됩니다.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="쇼핑몰 이름"
                placeholder="예: 마이 스타일몰"
                value={mallName}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />

              <div>
                <Input
                  label="몰 주소 (영문, 숫자, 하이픈)"
                  placeholder="my-style-mall"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  required
                />
                <p className="mt-1 text-xs text-gray-400">
                  marketshare.com/m/{slug || 'my-mall'} 으로 접근 가능
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  몰 소개 (선택)
                </label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  rows={3}
                  placeholder="어떤 상품을 판매하는 쇼핑몰인지 간단히 소개해주세요."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
                무료로 개설하기
              </Button>
            </form>
          </div>

          <div className="mt-8 space-y-3">
            {['개설 즉시 메인 마켓 상품 노출', '기본 테마 자동 적용', 'Free 플랜 (월 0원, 수수료 5%)'].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-gray-500">
                <CheckCircleIcon className="h-4 w-4 text-emerald-500" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
