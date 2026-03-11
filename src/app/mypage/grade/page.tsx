'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { getUserGrade, getMallGrades, getUserPurchaseAmount } from '@/lib/services/grade-service';
import { formatKRW } from '@/lib/utils/format';
import type { MemberGrade } from '@/types';
import {
  TrophyIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

export default function GradePage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [currentGrade, setCurrentGrade] = useState<MemberGrade | null>(null);
  const [allGrades, setAllGrades] = useState<MemberGrade[]>([]);
  const [purchaseAmount, setPurchaseAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const mallId = user?.ownedMallIds?.[0];

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/mypage/grade');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch data
  useEffect(() => {
    if (!user?.id || !mallId) return;

    async function fetchData() {
      setIsLoading(true);
      try {
        const [grade, grades, amount] = await Promise.all([
          getUserGrade(user!.id, mallId!),
          getMallGrades(mallId!),
          getUserPurchaseAmount(user!.id, mallId!, 90),
        ]);

        setCurrentGrade(grade);
        setAllGrades(grades);
        setPurchaseAmount(amount);
      } catch (error: any) {
        toast({ type: 'error', message: error.message || '회원등급 정보를 불러올 수 없습니다.' });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [user?.id, mallId, toast]);

  // Show loading while auth is resolving
  if (authLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!currentGrade || allGrades.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">회원등급</h1>
          <p className="mt-1 text-sm text-gray-500">회원등급 혜택을 확인하세요.</p>
        </div>
        <Card>
          <EmptyState
            icon={<TrophyIcon className="h-12 w-12" />}
            title="등급 정보가 없습니다"
            description="해당 쇼핑몰의 회원등급 정보를 불러올 수 없습니다."
          />
        </Card>
      </div>
    );
  }

  // Find next grade
  const currentLevel = currentGrade.level;
  const nextGrade = allGrades.find((g) => g.level === currentLevel + 1);
  const amountToNextGrade = nextGrade ? nextGrade.minPurchaseAmount - purchaseAmount : 0;
  const progressPercent = nextGrade
    ? Math.min(100, (purchaseAmount / nextGrade.minPurchaseAmount) * 100)
    : 100;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">회원등급</h1>
        <p className="mt-1 text-sm text-gray-500">회원등급 혜택을 확인하세요.</p>
      </div>

      {/* Current Grade */}
      <Card className="bg-gradient-to-br from-gray-50 to-white">
        <div className="flex flex-col items-center text-center sm:flex-row sm:text-left gap-6">
          <div
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl shadow-lg"
            style={{ backgroundColor: currentGrade.color }}
          >
            <TrophyIcon className="h-12 w-12 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-center gap-2 sm:justify-start">
              <h2 className="text-2xl font-bold text-gray-900">현재 등급</h2>
              <Badge style={{ backgroundColor: currentGrade.color, color: '#fff' }}>
                {currentGrade.name}
              </Badge>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">추가 적립</p>
                <p className="mt-1 font-semibold text-gray-900">
                  +{currentGrade.benefits.extraPointRate}%
                </p>
              </div>
              <div>
                <p className="text-gray-500">추가 할인</p>
                <p className="mt-1 font-semibold text-gray-900">
                  +{currentGrade.benefits.extraDiscountRate}%
                </p>
              </div>
              <div>
                <p className="text-gray-500">무료배송</p>
                <p className="mt-1 font-semibold text-gray-900">
                  {currentGrade.benefits.freeShippingThreshold === 0
                    ? '무조건'
                    : formatKRW(currentGrade.benefits.freeShippingThreshold)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Progress to Next Grade */}
      {nextGrade && (
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <ArrowTrendingUpIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-gray-900">다음 등급까지</h3>
              <p className="mt-1 text-sm text-gray-600">
                <span style={{ color: nextGrade.color }} className="font-bold">
                  {nextGrade.name}
                </span>{' '}
                등급까지{' '}
                <span className="font-semibold text-primary">
                  {formatKRW(amountToNextGrade)}
                </span>{' '}
                더 구매하세요
              </p>
              {/* Progress Bar */}
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-gray-500">
                <span>현재: {formatKRW(purchaseAmount)}</span>
                <span>목표: {formatKRW(nextGrade.minPurchaseAmount)}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Purchase Amount Summary */}
      <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
            <ChartBarIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-blue-700 font-medium">최근 3개월 구매금액</p>
            <p className="mt-1 text-2xl font-bold text-blue-900">{formatKRW(purchaseAmount)}</p>
          </div>
        </div>
      </Card>

      {/* Benefits Comparison Table */}
      <Card padding="none">
        <div className="p-5">
          <CardTitle>등급별 혜택 비교</CardTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-y border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                  등급
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                  승급 기준
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                  추가 적립
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">
                  추가 할인
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                  무료배송 기준
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allGrades.map((grade) => {
                const isCurrent = grade.id === currentGrade.id;
                return (
                  <tr
                    key={grade.id}
                    className={isCurrent ? 'bg-primary/5' : 'hover:bg-gray-50/50'}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: grade.color }}
                        />
                        <span className="text-sm font-semibold text-gray-900">
                          {grade.name}
                        </span>
                        {isCurrent && (
                          <Badge variant="success" className="text-xs">
                            현재
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">
                      {formatKRW(grade.minPurchaseAmount)}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                      +{grade.benefits.extraPointRate}%
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-gray-900">
                      +{grade.benefits.extraDiscountRate}%
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">
                      {grade.benefits.freeShippingThreshold === 0
                        ? '무조건'
                        : formatKRW(grade.benefits.freeShippingThreshold)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3">
          <p className="text-xs text-gray-500">
            * 등급은 최근 {currentGrade.evaluationPeriodDays}일간의 구매금액을 기준으로 평가됩니다.
          </p>
        </div>
      </Card>
    </div>
  );
}
