'use client';

import { useState, useEffect } from 'react';

import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { getPlatformSettings, updatePlatformSettings } from '@/lib/services/settings-service';
import {
  Cog6ToothIcon,
  BuildingOfficeIcon,
  ReceiptPercentIcon,
  TruckIcon,
  CreditCardIcon,
  GlobeAltIcon,
  TagIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';

interface PlanPricing {
  free: string;
  starter: string;
  business: string;
  enterprise: string;
}

interface PGConfigLocal {
  enabled: boolean;
  label: string;
  mid: string;
  apiKey: string;
  apiSecret: string;
  impCode: string;
  pgId: string;
  testMode: boolean;
}

interface ChatbotSettings {
  enabled: boolean;
  anthropicApiKey: string;
}

interface PlatformSettingsLocal {
  siteName: string;
  siteUrl: string;
  adminEmail: string;
  csPhone: string;
  defaultShippingFee: string;
  freeShippingThreshold: string;
  pgConfigs: Record<string, PGConfigLocal>;
  defaultPGProvider: string;
  testMode: boolean;
  metaTitle: string;
  metaDescription: string;
  ogImage: string;
  planPricing: PlanPricing;
  settlementCycle: string;
  minSettlementAmount: string;
  chatbot: ChatbotSettings;
}

export default function AdminSettingsPage() {
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const { toast } = useToast();

  const defaultPGConfigs: Record<string, PGConfigLocal> = {
    inicis: { enabled: false, label: 'KG이니시스', mid: '', apiKey: '', apiSecret: '', impCode: '', pgId: 'html5_inicis', testMode: true },
    kakaopay: { enabled: false, label: '카카오페이', mid: '', apiKey: '', apiSecret: '', impCode: '', pgId: 'kakaopay', testMode: true },
    naverpay: { enabled: false, label: '네이버페이', mid: '', apiKey: '', apiSecret: '', impCode: '', pgId: 'naverpay', testMode: true },
    kcp: { enabled: false, label: 'NHN KCP', mid: '', apiKey: '', apiSecret: '', impCode: '', pgId: 'kcp', testMode: true },
    lg: { enabled: false, label: '토스페이먼츠(LG)', mid: '', apiKey: '', apiSecret: '', impCode: '', pgId: 'tosspayments', testMode: true },
  };

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<PlatformSettingsLocal>({
    siteName: '마켓쉐어',
    siteUrl: 'https://marketshare.kr',
    adminEmail: 'admin@marketshare.kr',
    csPhone: '1588-1234',
    defaultShippingFee: '3000',
    freeShippingThreshold: '50000',
    pgConfigs: { ...defaultPGConfigs },
    defaultPGProvider: 'inicis',
    testMode: true,
    metaTitle: '마켓쉐어 - 나만의 쇼핑몰을 시작하세요',
    metaDescription:
      '마켓쉐어에서 간편하게 나만의 온라인 쇼핑몰을 개설하고 운영하세요. 분양형 쇼핑몰 플랫폼.',
    ogImage: '/images/og-default.png',
    planPricing: {
      free: '0',
      starter: '19900',
      business: '39900',
      enterprise: '99000',
    },
    settlementCycle: '월 2회',
    minSettlementAmount: '10000',
    chatbot: {
      enabled: true,
      anthropicApiKey: '',
    },
  });

  const [isSaving, setIsSaving] = useState(false);

  // Admin auth check
  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      window.location.href = '/';
    }
  }, [authLoading, user, isAdmin]);

  // Load settings from Firestore
  useEffect(() => {
    if (authLoading || !isAdmin) return;

    async function loadSettings() {
      setLoading(true);
      try {
        const result = await getPlatformSettings();
        if (result) {
          // PG configs from DB merged with defaults
          const savedPG = (result as any).pgConfigs || {};
          const mergedPGConfigs = { ...defaultPGConfigs };
          for (const key of Object.keys(mergedPGConfigs)) {
            if (savedPG[key]) {
              mergedPGConfigs[key] = { ...mergedPGConfigs[key], ...savedPG[key] };
            }
          }

          setSettings({
            siteName: result.siteName || '마켓쉐어',
            siteUrl: result.siteUrl || 'https://marketshare.kr',
            adminEmail: result.adminEmail || 'admin@marketshare.kr',
            csPhone: result.csPhone || '1588-1234',
            defaultShippingFee: String(result.defaultShippingFee ?? 3000),
            freeShippingThreshold: String(result.freeShippingThreshold ?? 50000),
            pgConfigs: mergedPGConfigs,
            defaultPGProvider: (result as any).defaultPGProvider || 'inicis',
            testMode: result.testMode ?? true,
            metaTitle: result.metaTitle || '마켓쉐어 - 나만의 쇼핑몰을 시작하세요',
            metaDescription:
              result.metaDescription ||
              '마켓쉐어에서 간편하게 나만의 온라인 쇼핑몰을 개설하고 운영하세요. 분양형 쇼핑몰 플랫폼.',
            ogImage: result.ogImage || '/images/og-default.png',
            planPricing: {
              free: String(result.planPricing?.free ?? 0),
              starter: String(result.planPricing?.starter ?? 19900),
              business: String(result.planPricing?.business ?? 39900),
              enterprise: String(result.planPricing?.enterprise ?? 99000),
            },
            settlementCycle: result.settlementCycle || '월 2회',
            minSettlementAmount: String(result.minSettlementAmount ?? 10000),
            chatbot: {
              enabled: (result as any).chatbot?.enabled ?? true,
              anthropicApiKey: (result as any).chatbot?.anthropicApiKey || '',
            },
          });
        }
      } catch (error) {
        console.error('Settings load error:', error);
        toast({ type: 'error', message: '설정을 불러오는 데 실패했습니다.' });
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [authLoading, isAdmin]);

  const updateField = (field: keyof PlatformSettingsLocal, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const updatePlanPrice = (plan: keyof PlanPricing, value: string) => {
    setSettings((prev) => ({
      ...prev,
      planPricing: {
        ...prev.planPricing,
        [plan]: value,
      },
    }));
  };

  const updatePGConfig = (provider: string, field: keyof PGConfigLocal, value: string | boolean) => {
    setSettings((prev) => ({
      ...prev,
      pgConfigs: {
        ...prev.pgConfigs,
        [provider]: {
          ...prev.pgConfigs[provider],
          [field]: value,
        },
      },
    }));
  };

  const toggleTestMode = () => {
    setSettings((prev) => ({ ...prev, testMode: !prev.testMode }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Convert PG configs for Firestore
      const pgConfigsForSave: Record<string, any> = {};
      for (const [key, cfg] of Object.entries(settings.pgConfigs)) {
        pgConfigsForSave[key] = {
          enabled: cfg.enabled,
          label: cfg.label,
          mid: cfg.mid,
          apiKey: cfg.apiKey,
          apiSecret: cfg.apiSecret,
          impCode: cfg.impCode,
          pgId: cfg.pgId,
          testMode: cfg.testMode,
        };
      }

      await updatePlatformSettings({
        siteName: settings.siteName,
        siteUrl: settings.siteUrl,
        adminEmail: settings.adminEmail,
        csPhone: settings.csPhone,
        defaultShippingFee: Number(settings.defaultShippingFee),
        freeShippingThreshold: Number(settings.freeShippingThreshold),
        pgConfigs: pgConfigsForSave,
        defaultPGProvider: settings.defaultPGProvider,
        testMode: settings.testMode,
        metaTitle: settings.metaTitle,
        metaDescription: settings.metaDescription,
        ogImage: settings.ogImage,
        settlementCycle: settings.settlementCycle,
        minSettlementAmount: Number(settings.minSettlementAmount),
      } as any);

      // 챗봇 설정은 별도 문서에 저장 (Cloud Function에서 읽음)
      const { doc, setDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      await setDoc(doc(db, 'settings', 'chatbot'), {
        enabled: settings.chatbot.enabled,
        anthropicApiKey: settings.chatbot.anthropicApiKey,
        updatedAt: new Date(),
      }, { merge: true });
      toast({ type: 'success', message: '설정이 저장되었습니다.' });
    } catch {
      toast({ type: 'error', message: '설정 저장에 실패했습니다.' });
    } finally {
      setIsSaving(false);
    }
  };

  const enabledPGProviders = Object.entries(settings.pgConfigs).filter(([, cfg]) => cfg.enabled);

  const commissionRates = [
    { plan: 'Free', rate: '5.0%', variant: 'secondary' as const },
    { plan: 'Starter', rate: '3.0%', variant: 'info' as const },
    { plan: 'Business', rate: '1.5%', variant: 'default' as const },
    { plan: 'Enterprise', rate: '0.5%', variant: 'warning' as const },
  ];

  const pgFees = [
    { method: '신용카드', rate: '2.5%', note: 'VAT 별도' },
    { method: '카카오페이', rate: '2.5%', note: '간편결제' },
    { method: '네이버페이', rate: '2.8%', note: '간편결제' },
    { method: '계좌이체', rate: '1.5%', note: '최저 200원' },
    { method: '가상계좌', rate: '건당 300원', note: '무통장입금' },
    { method: '휴대폰결제', rate: '3.5%', note: '소액결제' },
  ];

  if (authLoading || loading) {
    return <FullPageLoader message="설정 로딩 중..." />;
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">플랫폼 설정</h1>
          <p className="mt-1 text-sm text-gray-500">
            마켓쉐어 플랫폼의 기본 설정을 관리합니다.
          </p>
        </div>
        <Button onClick={handleSave} isLoading={isSaving}>
          <Cog6ToothIcon className="h-4 w-4" />
          저장
        </Button>
      </div>

      {/* 기본 정보 */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
            <BuildingOfficeIcon className="h-5 w-5 text-white" />
          </div>
          <CardTitle>기본 정보</CardTitle>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            label="사이트명"
            value={settings.siteName}
            onChange={(e) => updateField('siteName', e.target.value)}
            placeholder="사이트 이름을 입력하세요"
          />
          <Input
            label="사이트 URL"
            value={settings.siteUrl}
            onChange={(e) => updateField('siteUrl', e.target.value)}
            placeholder="https://example.com"
          />
          <Input
            label="관리자 이메일"
            type="email"
            value={settings.adminEmail}
            onChange={(e) => updateField('adminEmail', e.target.value)}
            placeholder="admin@example.com"
          />
          <Input
            label="고객센터 전화번호"
            value={settings.csPhone}
            onChange={(e) => updateField('csPhone', e.target.value)}
            placeholder="1588-0000"
          />
        </div>
      </Card>

      {/* 수수료 설정 */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
            <ReceiptPercentIcon className="h-5 w-5 text-white" />
          </div>
          <CardTitle>수수료 설정</CardTitle>
        </div>

        {/* 요금제별 판매 수수료 (read-only reference table) */}
        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium text-gray-700">
            요금제별 판매 수수료율
          </label>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">요금제</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 text-right">판매 수수료율</th>
                </tr>
              </thead>
              <tbody>
                {commissionRates.map((item) => (
                  <tr key={item.plan} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <Badge variant={item.variant}>{item.plan}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-gray-900">{item.rate}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            판매 수수료는 결제 완료된 주문의 상품 금액 기준 (배송비 제외)으로 산정됩니다.
          </p>
        </div>

        {/* PG 수수료 */}
        <div className="mb-6">
          <label className="mb-3 block text-sm font-medium text-gray-700">
            PG 결제 수수료
          </label>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-gray-500">결제 수단</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 text-right">수수료율</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 text-right">비고</th>
                </tr>
              </thead>
              <tbody>
                {pgFees.map((item) => (
                  <tr key={item.method} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-sm text-gray-700">{item.method}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-semibold text-gray-900">{item.rate}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-gray-400">{item.note}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 정산 설정 */}
        <div>
          <label className="mb-3 block text-sm font-medium text-gray-700">
            정산 설정
          </label>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">정산 주기</p>
              <p className="text-sm font-semibold text-gray-900">{settings.settlementCycle}</p>
              <p className="text-[10px] text-gray-400 mt-1">
                1일~15일분 - 25일 정산 / 16일~말일분 - 익월 10일 정산
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">최소 정산 금액</p>
              <p className="text-sm font-semibold text-gray-900">
                {Number(settings.minSettlementAmount).toLocaleString()}원
              </p>
              <p className="text-[10px] text-gray-400 mt-1">
                미달 시 다음 정산기로 이월
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 요금제 관리 */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 shadow-lg">
            <TagIcon className="h-5 w-5 text-white" />
          </div>
          <CardTitle>요금제 관리</CardTitle>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* Free */}
          <div className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="secondary">Free</Badge>
              <span className="text-xs text-gray-400">수수료 5.0%</span>
            </div>
            <Input
              label="월 요금 (원)"
              type="number"
              value={settings.planPricing.free}
              onChange={(e) => updatePlanPrice('free', e.target.value)}
              placeholder="0"
              hint="무료 플랜"
            />
            <div className="mt-3 space-y-1 text-xs text-gray-500">
              <p>상품 30개</p>
              <p>스토리지 500MB</p>
              <p>기본 테마 1종</p>
            </div>
          </div>

          {/* Starter */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="info">Starter</Badge>
              <span className="text-xs text-gray-400">수수료 3.0%</span>
            </div>
            <Input
              label="월 요금 (원)"
              type="number"
              value={settings.planPricing.starter}
              onChange={(e) => updatePlanPrice('starter', e.target.value)}
              placeholder="19900"
              hint="연결제 시 15,900원/월"
            />
            <div className="mt-3 space-y-1 text-xs text-gray-500">
              <p>상품 500개</p>
              <p>스토리지 5GB</p>
              <p>전체 5종 테마</p>
            </div>
          </div>

          {/* Business */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="default">Business</Badge>
              <span className="text-xs text-gray-400">수수료 1.5%</span>
            </div>
            <Input
              label="월 요금 (원)"
              type="number"
              value={settings.planPricing.business}
              onChange={(e) => updatePlanPrice('business', e.target.value)}
              placeholder="39900"
              hint="연결제 시 29,900원/월"
            />
            <div className="mt-3 space-y-1 text-xs text-gray-500">
              <p>상품 무제한</p>
              <p>스토리지 30GB</p>
              <p>테마 + CSS 커스텀</p>
            </div>
          </div>

          {/* Enterprise */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-4">
            <div className="flex items-center justify-between mb-4">
              <Badge variant="warning">Enterprise</Badge>
              <span className="text-xs text-gray-400">수수료 0.5%</span>
            </div>
            <Input
              label="월 요금 (원)"
              type="number"
              value={settings.planPricing.enterprise}
              onChange={(e) => updatePlanPrice('enterprise', e.target.value)}
              placeholder="99000"
              hint="연결제 시 79,000원/월"
            />
            <div className="mt-3 space-y-1 text-xs text-gray-500">
              <p>상품 무제한</p>
              <p>스토리지 100GB</p>
              <p>완전 커스텀 디자인</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 배송 설정 */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
            <TruckIcon className="h-5 w-5 text-white" />
          </div>
          <CardTitle>배송 설정</CardTitle>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            label="기본 배송비"
            type="number"
            value={settings.defaultShippingFee}
            onChange={(e) => updateField('defaultShippingFee', e.target.value)}
            placeholder="3000"
            hint="기본 배송비 (원)"
          />
          <Input
            label="무료배송 기준금액"
            type="number"
            value={settings.freeShippingThreshold}
            onChange={(e) => updateField('freeShippingThreshold', e.target.value)}
            placeholder="50000"
            hint="이 금액 이상 주문 시 무료배송"
          />
        </div>
      </Card>

      {/* 결제 설정 */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg">
            <CreditCardIcon className="h-5 w-5 text-white" />
          </div>
          <CardTitle>결제 설정 (PG사)</CardTitle>
        </div>

        {/* 글로벌 테스트모드 + 기본 PG 선택 */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">전체 테스트 모드</p>
              <p className="text-xs text-gray-500 mt-0.5">
                활성화 시 실제 결제가 이루어지지 않습니다.
              </p>
            </div>
            <button
              onClick={toggleTestMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.testMode ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                  settings.testMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="rounded-xl border border-gray-200 p-4">
            <label className="mb-2 block text-sm font-medium text-gray-900">기본 PG사</label>
            <select
              value={settings.defaultPGProvider}
              onChange={(e) => setSettings((prev) => ({ ...prev, defaultPGProvider: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {enabledPGProviders.length === 0 ? (
                <option value="">활성화된 PG사가 없습니다</option>
              ) : (
                enabledPGProviders.map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))
              )}
            </select>
            <p className="mt-1 text-xs text-gray-400">분양몰이 플랫폼 PG를 사용할 때 기본 적용됩니다.</p>
          </div>
        </div>

        {/* PG사별 상세 설정 */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            PG사별 설정
          </label>
          {Object.entries(settings.pgConfigs).map(([key, cfg]) => (
            <div
              key={key}
              className={`rounded-xl border p-4 transition-all ${
                cfg.enabled
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-gray-200 bg-gray-50/50'
              }`}
            >
              {/* PG 헤더: 활성화 토글 + 이름 + 테스트모드 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updatePGConfig(key, 'enabled', !cfg.enabled)}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      cfg.enabled ? 'bg-primary' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${
                        cfg.enabled ? 'translate-x-4.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <span className={`text-sm font-semibold ${cfg.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                    {cfg.label}
                  </span>
                  <span className="text-xs text-gray-400">({cfg.pgId})</span>
                </div>
                {cfg.enabled && (
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfg.testMode}
                      onChange={(e) => updatePGConfig(key, 'testMode', e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-amber-500 focus:ring-amber-400/50"
                    />
                    <span className={cfg.testMode ? 'text-amber-600 font-medium' : 'text-gray-500'}>테스트모드</span>
                  </label>
                )}
              </div>

              {/* PG 상세 입력 필드 (활성화 시만 표시) */}
              {cfg.enabled && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-3 pt-3 border-t border-gray-200/50">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">상점 MID</label>
                    <input
                      type="text"
                      value={cfg.mid}
                      onChange={(e) => updatePGConfig(key, 'mid', e.target.value)}
                      placeholder="INIpayTest"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">PortOne IMP 코드</label>
                    <input
                      type="text"
                      value={cfg.impCode}
                      onChange={(e) => updatePGConfig(key, 'impCode', e.target.value)}
                      placeholder="imp00000000"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">API Key</label>
                    <input
                      type="password"
                      value={cfg.apiKey}
                      onChange={(e) => updatePGConfig(key, 'apiKey', e.target.value)}
                      placeholder="API Key"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">API Secret</label>
                    <input
                      type="password"
                      value={cfg.apiSecret}
                      onChange={(e) => updatePGConfig(key, 'apiSecret', e.target.value)}
                      placeholder="API Secret"
                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400">
          PortOne(아임포트) 연동 기준입니다. 각 PG사의 상점 MID와 API 키는 해당 PG사 가맹 후 발급받을 수 있습니다.
        </p>
      </Card>

      {/* SEO 설정 */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-500 shadow-lg">
            <GlobeAltIcon className="h-5 w-5 text-white" />
          </div>
          <CardTitle>SEO 설정</CardTitle>
        </div>
        <div className="space-y-5">
          <Input
            label="메타 타이틀"
            value={settings.metaTitle}
            onChange={(e) => updateField('metaTitle', e.target.value)}
            placeholder="사이트 메타 타이틀"
            hint="검색 결과에 표시되는 타이틀입니다. 60자 이내를 권장합니다."
          />
          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              메타 설명
            </label>
            <textarea
              value={settings.metaDescription}
              onChange={(e) => updateField('metaDescription', e.target.value)}
              placeholder="사이트에 대한 설명을 입력하세요"
              rows={3}
              className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-1 text-xs text-gray-400">
              검색 결과에 표시되는 설명입니다. 160자 이내를 권장합니다.
            </p>
          </div>
          <Input
            label="OG 이미지"
            value={settings.ogImage}
            onChange={(e) => updateField('ogImage', e.target.value)}
            placeholder="/images/og-default.png"
            hint="소셜 미디어 공유 시 표시되는 이미지 경로입니다."
          />
        </div>
      </Card>

      {/* 챗봇 설정 */}
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg">
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-white" />
          </div>
          <CardTitle>AI 챗봇 설정</CardTitle>
        </div>

        <div className="space-y-5">
          {/* 활성화 토글 */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">챗봇 활성화</p>
              <p className="text-xs text-gray-500 mt-0.5">
                쇼핑몰 하단에 AI 고객 상담 챗봇을 표시합니다.
              </p>
            </div>
            <button
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  chatbot: { ...prev.chatbot, enabled: !prev.chatbot.enabled },
                }))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.chatbot.enabled ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                  settings.chatbot.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* API 키 입력 */}
          <div>
            <Input
              label="Anthropic API 키 (선택)"
              type="password"
              value={settings.chatbot.anthropicApiKey}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  chatbot: { ...prev.chatbot, anthropicApiKey: e.target.value },
                }))
              }
              placeholder="sk-ant-api03-..."
              hint="입력하면 AI 응답, 미입력 시 기본 FAQ 자동 응답으로 동작합니다."
            />
          </div>

          {/* 안내 */}
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-800 mb-2">챗봇 동작 방식</p>
            <ul className="space-y-1.5 text-xs text-blue-700">
              <li>
                <strong>API 키 미입력:</strong> 배송, 결제, 교환/반품 등 자주 묻는 질문에 자동 응답 (무료)
              </li>
              <li>
                <strong>API 키 입력:</strong> Claude AI가 자연어로 상세 상담 (API 호출 비용 발생)
              </li>
              <li>
                API 키는 <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="underline">console.anthropic.com</a>에서 발급받을 수 있습니다.
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Bottom Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={isSaving} size="lg">
          <Cog6ToothIcon className="h-5 w-5" />
          설정 저장
        </Button>
      </div>
    </div>
  );
}
