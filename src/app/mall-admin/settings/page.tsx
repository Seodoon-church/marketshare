'use client';

import { useState, useEffect } from 'react';

import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  SwatchIcon,
  CreditCardIcon,
  InformationCircleIcon,
  TruckIcon,
  UserIcon,
  BanknotesIcon,
  BuildingStorefrontIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/lib/hooks/useAuth';
import { getMallById, updateMall } from '@/lib/services/mall-service';
import { uploadMallLogo } from '@/lib/services/upload-service';
import { PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { Mall, MallPGConfig, PGProvider } from '@/types';

/** 파란 안내 박스 컴포넌트 */
function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/50 p-3.5">
      <InformationCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
      <p className="text-xs leading-relaxed text-blue-700">{children}</p>
    </div>
  );
}

/** 섹션 내 라디오 그룹 */
function RadioGroup({
  name,
  value,
  onChange,
  options,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-4">
      {options.map((opt) => (
        <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="h-4 w-4 text-primary focus:ring-primary"
          />
          <span className="text-sm text-gray-700">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

/** 주소 그룹 (우편번호 + 주소 + 상세주소 + 전화번호1/2) */
function AddressGroup({
  label,
  zipcode,
  address,
  addressDetail,
  phone,
  phone2,
  onZipcodeChange,
  onAddressChange,
  onAddressDetailChange,
  onPhoneChange,
  onPhone2Change,
  showPhones = true,
}: {
  label: string;
  zipcode: string;
  address: string;
  addressDetail: string;
  phone?: string;
  phone2?: string;
  onZipcodeChange: (v: string) => void;
  onAddressChange: (v: string) => void;
  onAddressDetailChange: (v: string) => void;
  onPhoneChange?: (v: string) => void;
  onPhone2Change?: (v: string) => void;
  showPhones?: boolean;
}) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          value={zipcode}
          onChange={(e) => onZipcodeChange(e.target.value)}
          className="flex h-10 w-32 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="우편번호"
        />
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={() => alert('주소 검색 API(다음 우편번호) 연동 예정입니다.')}
        >
          주소 검색
        </Button>
      </div>
      <input
        value={address}
        onChange={(e) => onAddressChange(e.target.value)}
        className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50"
        placeholder="주소"
        readOnly
      />
      <input
        value={addressDetail}
        onChange={(e) => onAddressDetailChange(e.target.value)}
        className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        placeholder="상세주소를 입력해주세요"
      />
      {showPhones && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="전화번호 1"
            value={phone || ''}
            onChange={(e) => onPhoneChange?.(e.target.value)}
            placeholder="02-0000-0000"
          />
          <Input
            label="전화번호 2"
            value={phone2 || ''}
            onChange={(e) => onPhone2Change?.(e.target.value)}
            placeholder="010-0000-0000"
          />
        </div>
      )}
    </div>
  );
}

// ================================================
// 메인 컴포넌트
// ================================================

export default function MallAdminSettings() {
  const { user, isLoading: authLoading, isMallOwner } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ──── 기본 정보 ────
  const [mallName, setMallName] = useState('');
  const [domain, setDomain] = useState('');
  const [industry, setIndustry] = useState('기타');
  const [intro, setIntro] = useState('');

  // ──── 로고/파비콘 ────
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);

  // ──── 판매자 정보 ────
  const [sellerType, setSellerType] = useState<'domestic' | 'overseas'>('domestic');
  const [bizName, setBizName] = useState('');
  const [bizNumber, setBizNumber] = useState('');
  const [bizZipcode, setBizZipcode] = useState('');
  const [bizAddress, setBizAddress] = useState('');
  const [bizAddressDetail, setBizAddressDetail] = useState('');
  const [bizCategory, setBizCategory] = useState<'personal' | 'corporate'>('personal');
  const [bizSector, setBizSector] = useState('');
  const [bizItem, setBizItem] = useState('');
  const [onlineBusinessNumber, setOnlineBusinessNumber] = useState('');
  const [ceoName, setCeoName] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [bizEmail, setBizEmail] = useState('');

  // ──── 담당자 정보 ────
  const [managerName, setManagerName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');
  const [managerPhone, setManagerPhone] = useState('');

  // ──── 정산 계좌 ────
  const [settlementMethod, setSettlementMethod] = useState<'bank_transfer' | 'npay_biz'>('bank_transfer');
  const [bank, setBank] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  // ──── 배송 정보 (출고지) ────
  const [warehouseZipcode, setWarehouseZipcode] = useState('');
  const [warehouseAddress, setWarehouseAddress] = useState('');
  const [warehouseAddressDetail, setWarehouseAddressDetail] = useState('');
  const [warehousePhone, setWarehousePhone] = useState('');
  const [warehousePhone2, setWarehousePhone2] = useState('');

  // ──── 배송 정보 (반품/교환지) ────
  const [returnZipcode, setReturnZipcode] = useState('');
  const [returnAddress, setReturnAddress] = useState('');
  const [returnAddressDetail, setReturnAddressDetail] = useState('');
  const [returnPhone, setReturnPhone] = useState('');
  const [returnPhone2, setReturnPhone2] = useState('');

  // ──── 테마 ────
  const [primaryColor, setPrimaryColor] = useState('#6366f1');

  // ──── SEO ────
  const [siteTitle, setSiteTitle] = useState('');
  const [siteDesc, setSiteDesc] = useState('');
  const [siteKeywords, setSiteKeywords] = useState('');

  // ──── 몰 운영 방식 ────
  const [isClosedMall, setIsClosedMall] = useState(false);
  const [requireMemberApproval, setRequireMemberApproval] = useState(false);
  const [hidePriceForNonMembers, setHidePriceForNonMembers] = useState(false);

  // ──── 분양 설정 (가맹점 전용) ────
  const [parentMallId, setParentMallId] = useState<string | null>(null);
  const [showHeadquartersProducts, setShowHeadquartersProducts] = useState(true);
  const [showNetworkProducts, setShowNetworkProducts] = useState(true);
  const [shareOwnProducts, setShareOwnProducts] = useState(true);

  // ──── 몰 요금제 ────
  const [mallPlan, setMallPlan] = useState<string>('free');

  // ──── PG 설정 ────
  const [pgPaymentAuth, setPgPaymentAuth] = useState<'platform' | 'individual' | 'selective'>('platform');
  const [pgConfigs, setPgConfigs] = useState<Record<PGProvider, { enabled: boolean; mid: string; apiKey: string; apiSecret: string; impCode: string; testMode: boolean; pgId: string }>>({
    inicis: { enabled: false, mid: '', apiKey: '', apiSecret: '', impCode: '', testMode: true, pgId: 'html5_inicis' },
    kakaopay: { enabled: false, mid: '', apiKey: '', apiSecret: '', impCode: '', testMode: true, pgId: 'kakaopay' },
    naverpay: { enabled: false, mid: '', apiKey: '', apiSecret: '', impCode: '', testMode: true, pgId: 'naverpay' },
    kcp: { enabled: false, mid: '', apiKey: '', apiSecret: '', impCode: '', testMode: true, pgId: 'kcp' },
    lg: { enabled: false, mid: '', apiKey: '', apiSecret: '', impCode: '', testMode: true, pgId: 'tosspayments' },
  });
  const [defaultPGProvider, setDefaultPGProvider] = useState<string>('');

  const PG_PROVIDERS: { key: PGProvider; label: string; pgId: string }[] = [
    { key: 'inicis', label: 'KG이니시스', pgId: 'html5_inicis' },
    { key: 'kakaopay', label: '카카오페이', pgId: 'kakaopay' },
    { key: 'naverpay', label: '네이버페이', pgId: 'naverpay' },
    { key: 'kcp', label: 'NHN KCP', pgId: 'kcp' },
    { key: 'lg', label: '토스페이먼츠', pgId: 'tosspayments' },
  ];

  const enabledProviders = PG_PROVIDERS.filter((p) => pgConfigs[p.key].enabled);

  const mallId = user?.ownedMallIds?.[0];

  // Auth guard
  useEffect(() => {
    if (!authLoading && !isMallOwner) {
      window.location.href = '/auth/login';
    }
  }, [authLoading, isMallOwner]);

  // Load mall data
  useEffect(() => {
    if (!mallId) return;

    async function loadMall() {
      try {
        setLoading(true);
        const mall = await getMallById(mallId!);
        if (!mall) {
          alert('몰 정보를 찾을 수 없습니다.');
          return;
        }

        // 요금제
        setMallPlan(mall.plan || 'free');

        // 몰 운영 방식
        setIsClosedMall(mall.isClosedMall || false);
        setRequireMemberApproval(mall.requireMemberApproval || false);
        setHidePriceForNonMembers(mall.hidePriceForNonMembers || false);

        // 기본 정보
        setMallName(mall.name);
        setDomain(mall.subdomain);
        setIntro(mall.description);
        setLogoUrl(mall.logoUrl || null);
        setFaviconUrl(mall.faviconUrl || null);

        // 판매자 정보
        if (mall.businessInfo) {
          const bi = mall.businessInfo;
          setSellerType(bi.sellerType || 'domestic');
          setBizName(bi.businessName);
          setBizNumber(bi.businessNumber);
          setBizZipcode(bi.zipcode || '');
          setBizAddress(bi.address);
          setBizAddressDetail(bi.addressDetail || '');
          setBizCategory(bi.businessCategory || 'personal');
          setBizSector(bi.businessSector || '');
          setBizItem(bi.businessItem || '');
          setOnlineBusinessNumber(bi.onlineBusinessNumber || '');
          setCeoName(bi.representative);
          setBizPhone(bi.phone);
          setBizEmail(bi.email);

          // 담당자 정보
          setManagerName(bi.managerName || '');
          setManagerEmail(bi.managerEmail || '');
          setManagerPhone(bi.managerPhone || '');

          // 배송 정보 (출고지)
          setWarehouseZipcode(bi.warehouseZipcode || '');
          setWarehouseAddress(bi.warehouseAddress || '');
          setWarehouseAddressDetail(bi.warehouseAddressDetail || '');
          setWarehousePhone(bi.warehousePhone || '');
          setWarehousePhone2(bi.warehousePhone2 || '');

          // 배송 정보 (반품/교환지)
          setReturnZipcode(bi.returnZipcode || '');
          setReturnAddress(bi.returnAddress || '');
          setReturnAddressDetail(bi.returnAddressDetail || '');
          setReturnPhone(bi.returnPhone || '');
          setReturnPhone2(bi.returnPhone2 || '');
        }

        // 정산 계좌
        if (mall.bankInfo) {
          setSettlementMethod(mall.bankInfo.settlementMethod || 'bank_transfer');
          setBank(mall.bankInfo.bank);
          setAccountNumber(mall.bankInfo.accountNumber);
          setAccountHolder(mall.bankInfo.holder);
        }

        // 테마
        if (mall.themeConfig?.primaryColor) {
          setPrimaryColor(mall.themeConfig.primaryColor);
        }

        // SEO
        setSiteTitle(mall.seoTitle || '');
        setSiteDesc(mall.seoDescription || '');
        setSiteKeywords((mall.seoKeywords || []).join(', '));

        // 분양 설정 (가맹점 전용)
        setParentMallId(mall.parentMallId || null);
        if (mall.franchiseSettings) {
          setShowHeadquartersProducts(mall.franchiseSettings.showHeadquartersProducts ?? true);
          setShowNetworkProducts(mall.franchiseSettings.showNetworkProducts ?? true);
          setShareOwnProducts(mall.franchiseSettings.shareOwnProducts ?? true);
        }

        // PG 설정
        if (mall.pgPaymentAuth) {
          setPgPaymentAuth(mall.pgPaymentAuth);
        }
        if (mall.pgConfig) {
          const loadedConfigs = { ...pgConfigs };
          for (const providerKey of Object.keys(mall.pgConfig.configs || {}) as PGProvider[]) {
            const cfg = mall.pgConfig.configs[providerKey];
            if (cfg) {
              loadedConfigs[providerKey] = { ...cfg };
            }
          }
          setPgConfigs(loadedConfigs);
          setDefaultPGProvider(mall.pgConfig.defaultProvider || '');
        }
      } catch (error) {
        alert('몰 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    loadMall();
  }, [mallId]);

  /** 출고지와 동일하게 반품/교환지 주소 복사 */
  const copyWarehouseToReturn = () => {
    setReturnZipcode(warehouseZipcode);
    setReturnAddress(warehouseAddress);
    setReturnAddressDetail(warehouseAddressDetail);
    setReturnPhone(warehousePhone);
    setReturnPhone2(warehousePhone2);
  };

  const handleSave = async () => {
    if (!mallId) return;

    setSaving(true);
    try {
      // PG config 빌드
      const selectedProviders = PG_PROVIDERS
        .filter((p) => pgConfigs[p.key].enabled)
        .map((p) => p.key);
      const pgConfigData: MallPGConfig = {
        pgPaymentAuth,
        selectedProviders,
        configs: Object.fromEntries(
          selectedProviders.map((key) => [key, pgConfigs[key]])
        ) as Partial<Record<PGProvider, typeof pgConfigs[PGProvider]>>,
        defaultProvider: (defaultPGProvider as PGProvider) || null,
      };

      const updatedData: Partial<Mall> = {
        name: mallName,
        subdomain: domain,
        description: intro,
        logoUrl,
        faviconUrl,
        businessInfo: {
          businessName: bizName,
          businessNumber: bizNumber,
          representative: ceoName,
          address: bizAddress,
          addressDetail: bizAddressDetail,
          zipcode: bizZipcode,
          phone: bizPhone,
          email: bizEmail,
          sellerType,
          businessCategory: bizCategory,
          businessSector: bizSector,
          businessItem: bizItem,
          onlineBusinessNumber,
          managerName,
          managerPhone,
          managerEmail,
          warehouseZipcode,
          warehouseAddress,
          warehouseAddressDetail,
          warehousePhone,
          warehousePhone2,
          returnZipcode,
          returnAddress,
          returnAddressDetail,
          returnPhone,
          returnPhone2,
        },
        bankInfo: {
          bank,
          accountNumber,
          holder: accountHolder,
          settlementMethod,
        },
        pgPaymentAuth,
        pgConfig: pgConfigData,
        themeConfig: {
          primaryColor,
        },
        seoTitle: siteTitle,
        seoDescription: siteDesc,
        seoKeywords: siteKeywords
          .split(',')
          .map((k) => k.trim())
          .filter((k) => k.length > 0),
        isClosedMall,
        requireMemberApproval,
        hidePriceForNonMembers,
        ...(parentMallId ? {
          franchiseSettings: {
            showHeadquartersProducts,
            showNetworkProducts,
            shareOwnProducts,
            hiddenProductIds: [],
            customCommissionRate: null,
          },
        } : {}),
      };

      await updateMall(mallId, updatedData);
      alert('설정이 저장되었습니다.');
    } catch (error: any) {
      alert(error.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // Auth loading or data loading
  if (authLoading || loading) {
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
      {/* Header */}
      <h1 className="text-2xl font-bold text-gray-900">몰 설정</h1>

      {/* ============================================ */}
      {/* 1. 기본 정보 */}
      {/* ============================================ */}
      <Card>
        <CardTitle>기본 정보</CardTitle>
        <div className="mt-4 space-y-4">
          <Input
            label="몰 이름"
            value={mallName}
            onChange={(e) => setMallName(e.target.value)}
            placeholder="몰 이름을 입력해주세요"
          />
          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              도메인
            </label>
            <div className="flex items-center gap-0">
              <input
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="flex h-10 w-48 rounded-l-lg border border-r-0 border-gray-300 bg-white px-3 py-2 text-sm transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="도메인"
              />
              <span className="flex h-10 items-center rounded-r-lg border border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
                .marketshare.co.kr
              </span>
            </div>
          </div>
          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              업종
            </label>
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="패션/의류">패션/의류</option>
              <option value="전자기기">전자기기</option>
              <option value="식품">식품</option>
              <option value="뷰티/화장품">뷰티/화장품</option>
              <option value="가구/인테리어">가구/인테리어</option>
              <option value="스포츠/레저">스포츠/레저</option>
              <option value="기타">기타</option>
            </select>
          </div>
          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              소개글
            </label>
            <textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              placeholder="몰에 대한 소개글을 입력해주세요"
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
            />
          </div>
        </div>
      </Card>

      {/* ============================================ */}
      {/* 1-1. 로고 / 파비콘 */}
      {/* ============================================ */}
      <Card>
        <CardTitle>
          <span className="flex items-center gap-2">
            <PhotoIcon className="h-5 w-5 text-violet-500" />
            로고 / 파비콘
          </span>
        </CardTitle>
        <p className="mt-1 text-sm text-gray-500">쇼핑몰 상단에 표시되는 로고와 브라우저 탭 아이콘(파비콘)을 설정합니다.</p>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* 로고 업로드 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              몰 로고
            </label>
            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6">
              {logoUrl ? (
                <div className="relative">
                  <img
                    src={logoUrl}
                    alt="몰 로고"
                    className="h-20 max-w-[200px] object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setLogoUrl(null)}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gray-200">
                  <PhotoIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <label className={`cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 ${uploadingLogo ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploadingLogo ? '업로드 중...' : logoUrl ? '로고 변경' : '로고 업로드'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !mallId) return;
                    setUploadingLogo(true);
                    try {
                      const url = await uploadMallLogo(mallId, file);
                      setLogoUrl(url);
                    } catch (err: any) {
                      alert(err.message || '로고 업로드 실패');
                    } finally {
                      setUploadingLogo(false);
                      e.target.value = '';
                    }
                  }}
                />
              </label>
              <p className="text-xs text-gray-400">권장: 가로 200px 이상, PNG/JPG/WebP, 최대 5MB</p>
            </div>
          </div>

          {/* 파비콘 업로드 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              파비콘
            </label>
            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6">
              {faviconUrl ? (
                <div className="relative">
                  <img
                    src={faviconUrl}
                    alt="파비콘"
                    className="h-16 w-16 rounded-lg object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setFaviconUrl(null)}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gray-200">
                  <PhotoIcon className="h-6 w-6 text-gray-400" />
                </div>
              )}
              <label className={`cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 ${uploadingFavicon ? 'opacity-50 pointer-events-none' : ''}`}>
                {uploadingFavicon ? '업로드 중...' : faviconUrl ? '파비콘 변경' : '파비콘 업로드'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !mallId) return;
                    setUploadingFavicon(true);
                    try {
                      const url = await uploadMallLogo(mallId, file);
                      setFaviconUrl(url);
                    } catch (err: any) {
                      alert(err.message || '파비콘 업로드 실패');
                    } finally {
                      setUploadingFavicon(false);
                      e.target.value = '';
                    }
                  }}
                />
              </label>
              <p className="text-xs text-gray-400">권장: 32×32 또는 180×180px, PNG, 최대 5MB</p>
            </div>
          </div>
        </div>
      </Card>

      {/* ============================================ */}
      {/* 1-2. 몰 운영 방식 (오픈몰/폐쇄몰) */}
      {/* ============================================ */}
      <Card>
        <CardTitle>
          <span className="flex items-center gap-2">
            <ShieldCheckIcon className="h-5 w-5 text-indigo-500" />
            몰 운영 방식
          </span>
        </CardTitle>
        <p className="mt-1 text-sm text-gray-500">오픈몰 또는 회원제(폐쇄몰) 방식을 설정합니다.</p>

        <div className="mt-6 space-y-5">
          {/* 오픈몰 / 폐쇄몰 토글 */}
          <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">폐쇄몰 (회원제)</p>
              <p className="mt-0.5 text-xs text-gray-500">
                활성화하면 회원만 상품을 열람할 수 있습니다. 비회원에게는 로그인/가입 안내가 표시됩니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsClosedMall(!isClosedMall)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isClosedMall ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                  isClosedMall ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* 가입 승인제 */}
          {isClosedMall && (
            <div className="ml-4 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">가입 승인제</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    활성화하면 회원 가입 시 관리자 승인 후 이용 가능합니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setRequireMemberApproval(!requireMemberApproval)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    requireMemberApproval ? 'bg-primary' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      requireMemberApproval ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">비회원 가격 숨김</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    활성화하면 로그인하지 않은 방문자에게 상품 가격이 표시되지 않습니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHidePriceForNonMembers(!hidePriceForNonMembers)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    hidePriceForNonMembers ? 'bg-primary' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                      hidePriceForNonMembers ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <InfoBox>
                폐쇄몰은 B2B, 회원제 쇼핑몰, 임직원몰 등에 적합합니다.
                가입 승인제를 사용하면 회원 관리 페이지에서 가입 요청을 승인/거부할 수 있습니다.
              </InfoBox>
            </div>
          )}

          {!isClosedMall && (
            <InfoBox>
              오픈몰: 모든 방문자가 상품을 열람하고 구매할 수 있습니다.
              대부분의 B2C 쇼핑몰에 적합한 방식입니다.
            </InfoBox>
          )}
        </div>
      </Card>

      {/* ============================================ */}
      {/* 2. 판매자 정보 */}
      {/* ============================================ */}
      <Card>
        <CardTitle>
          <div className="flex items-center gap-2">
            <BuildingStorefrontIcon className="h-5 w-5 text-primary" />
            판매자 정보
          </div>
        </CardTitle>
        <div className="mt-4 space-y-5">
          <InfoBox>
            사업자등록증에 기재된 정보와 동일하게 입력해 주세요.
            사업자등록번호가 변경된 경우 사업자등록증 사본을 함께 제출해야 합니다.
          </InfoBox>

          {/* 판매자 유형 */}
          <div className="w-full">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              판매자 유형 <span className="text-red-500">*</span>
            </label>
            <RadioGroup
              name="sellerType"
              value={sellerType}
              onChange={(v) => setSellerType(v as 'domestic' | 'overseas')}
              options={[
                { value: 'domestic', label: '국내 사업자' },
                { value: 'overseas', label: '해외 사업자' },
              ]}
            />
          </div>

          {/* 상호 */}
          <Input
            label="상호"
            value={bizName}
            onChange={(e) => setBizName(e.target.value)}
            placeholder="사업자등록증 상의 상호명"
          />

          {/* 사업자등록번호 */}
          <Input
            label="사업자등록번호"
            value={bizNumber}
            onChange={(e) => setBizNumber(e.target.value)}
            placeholder="000-00-00000"
            hint="'-' 포함하여 입력해주세요"
          />

          {/* 사업장소재지 */}
          <AddressGroup
            label="사업장소재지"
            zipcode={bizZipcode}
            address={bizAddress}
            addressDetail={bizAddressDetail}
            onZipcodeChange={setBizZipcode}
            onAddressChange={setBizAddress}
            onAddressDetailChange={setBizAddressDetail}
            showPhones={false}
          />

          {/* 사업자 구분 */}
          <div className="w-full">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              사업자 구분 <span className="text-red-500">*</span>
            </label>
            <RadioGroup
              name="bizCategory"
              value={bizCategory}
              onChange={(v) => setBizCategory(v as 'personal' | 'corporate')}
              options={[
                { value: 'personal', label: '개인사업자' },
                { value: 'corporate', label: '법인사업자' },
              ]}
            />
          </div>

          {/* 업태 / 업종 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="업태"
              value={bizSector}
              onChange={(e) => setBizSector(e.target.value)}
              placeholder="예: 도매 및 소매업"
            />
            <Input
              label="업종"
              value={bizItem}
              onChange={(e) => setBizItem(e.target.value)}
              placeholder="예: 전자상거래"
            />
          </div>

          {/* 통신판매업신고번호 */}
          <Input
            label="통신판매업신고번호"
            value={onlineBusinessNumber}
            onChange={(e) => setOnlineBusinessNumber(e.target.value)}
            placeholder="제0000-서울강남-0000호"
            hint="전자상거래법에 따라 통신판매업 신고가 필요합니다. 미신고 시 과태료가 부과될 수 있습니다."
          />

          {/* 대표자 이름 */}
          <Input
            label="대표자 이름"
            value={ceoName}
            onChange={(e) => setCeoName(e.target.value)}
            placeholder="대표자 성명"
          />

          {/* 대표 전화번호 / 이메일 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="대표 전화번호"
              value={bizPhone}
              onChange={(e) => setBizPhone(e.target.value)}
              placeholder="02-0000-0000"
            />
            <Input
              label="대표 이메일"
              type="email"
              value={bizEmail}
              onChange={(e) => setBizEmail(e.target.value)}
              placeholder="contact@example.com"
            />
          </div>
        </div>
      </Card>

      {/* ============================================ */}
      {/* 3. 담당자 정보 */}
      {/* ============================================ */}
      <Card>
        <CardTitle>
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-primary" />
            담당자 정보
          </div>
        </CardTitle>
        <div className="mt-4 space-y-5">
          <InfoBox>
            주문, 정산, CS 관련 연락을 받을 실무 담당자 정보를 입력해 주세요.
            대표자와 동일하면 대표자 정보와 같이 입력하시면 됩니다.
          </InfoBox>

          <Input
            label="이름"
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
            placeholder="담당자 이름"
          />
          <Input
            label="이메일 주소"
            type="email"
            value={managerEmail}
            onChange={(e) => setManagerEmail(e.target.value)}
            placeholder="manager@example.com"
            hint="주문/정산 관련 알림이 이 이메일로 발송됩니다."
          />
          <Input
            label="휴대폰번호"
            value={managerPhone}
            onChange={(e) => setManagerPhone(e.target.value)}
            placeholder="010-0000-0000"
            hint="긴급 연락이 필요한 경우 이 번호로 연락합니다."
          />
        </div>
      </Card>

      {/* ============================================ */}
      {/* 4. 정산정보 */}
      {/* ============================================ */}
      <Card>
        <CardTitle>
          <div className="flex items-center gap-2">
            <BanknotesIcon className="h-5 w-5 text-primary" />
            정산정보
          </div>
        </CardTitle>
        <div className="mt-4 space-y-5">
          <InfoBox>
            판매 대금 정산을 받을 계좌 정보를 입력해 주세요.
            사업자 명의와 예금주가 동일해야 정산이 정상 처리됩니다.
          </InfoBox>

          {/* 정산대금수령방법 */}
          <div className="w-full">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              정산대금 수령방법 <span className="text-red-500">*</span>
            </label>
            <RadioGroup
              name="settlementMethod"
              value={settlementMethod}
              onChange={(v) => setSettlementMethod(v as 'bank_transfer' | 'npay_biz')}
              options={[
                { value: 'bank_transfer', label: '정산대금 입금계좌' },
                { value: 'npay_biz', label: '네이버페이 비즈월렛' },
              ]}
            />
          </div>

          {/* 은행 선택 */}
          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              은행 <span className="text-red-500">*</span>
            </label>
            <select
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">은행 선택</option>
              <option value="shinhan">신한은행</option>
              <option value="kb">KB국민은행</option>
              <option value="woori">우리은행</option>
              <option value="hana">하나은행</option>
              <option value="nh">NH농협은행</option>
              <option value="ibk">IBK기업은행</option>
              <option value="kakao">카카오뱅크</option>
              <option value="toss">토스뱅크</option>
              <option value="sc">SC제일은행</option>
              <option value="citi">씨티은행</option>
              <option value="daegu">대구은행</option>
              <option value="busan">부산은행</option>
              <option value="kwangju">광주은행</option>
              <option value="jeju">제주은행</option>
              <option value="jeonbuk">전북은행</option>
              <option value="kyongnam">경남은행</option>
              <option value="kdb">KDB산업은행</option>
              <option value="suhyup">수협은행</option>
              <option value="shinhyup">신협</option>
              <option value="saemaul">새마을금고</option>
              <option value="post">우체국</option>
            </select>
          </div>

          {/* 계좌번호 / 예금주 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="계좌번호"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="'-' 없이 계좌번호 입력"
            />
            <Input
              label="예금주"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              placeholder="예금주명"
              hint="사업자등록증 상의 상호 또는 대표자명"
            />
          </div>
        </div>
      </Card>

      {/* ============================================ */}
      {/* 5. 배송정보 */}
      {/* ============================================ */}
      <Card>
        <CardTitle>
          <div className="flex items-center gap-2">
            <TruckIcon className="h-5 w-5 text-primary" />
            배송정보
          </div>
        </CardTitle>
        <div className="mt-4 space-y-6">
          <InfoBox>
            출고지 주소는 택배 수거 시 사용되며, 반품/교환지 주소는 고객 반품 시 안내됩니다.
            정확한 주소를 입력해 주세요.
          </InfoBox>

          {/* 출고지 주소 */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/30 p-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-800">출고지 주소</h4>
            <AddressGroup
              label=""
              zipcode={warehouseZipcode}
              address={warehouseAddress}
              addressDetail={warehouseAddressDetail}
              phone={warehousePhone}
              phone2={warehousePhone2}
              onZipcodeChange={setWarehouseZipcode}
              onAddressChange={setWarehouseAddress}
              onAddressDetailChange={setWarehouseAddressDetail}
              onPhoneChange={setWarehousePhone}
              onPhone2Change={setWarehousePhone2}
            />
          </div>

          {/* 반품/교환지 주소 */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-800">반품/교환지 주소</h4>
              <button
                type="button"
                onClick={copyWarehouseToReturn}
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                출고지와 동일
              </button>
            </div>
            <AddressGroup
              label=""
              zipcode={returnZipcode}
              address={returnAddress}
              addressDetail={returnAddressDetail}
              phone={returnPhone}
              phone2={returnPhone2}
              onZipcodeChange={setReturnZipcode}
              onAddressChange={setReturnAddress}
              onAddressDetailChange={setReturnAddressDetail}
              onPhoneChange={setReturnPhone}
              onPhone2Change={setReturnPhone2}
            />
          </div>
        </div>
      </Card>

      {/* ============================================ */}
      {/* 6. 결제(PG) 설정 (기존 로직 100% 보존) */}
      {/* ============================================ */}
      <Card>
        <CardTitle>
          <div className="flex items-center gap-2">
            <CreditCardIcon className="h-5 w-5 text-primary" />
            결제(PG) 설정
          </div>
        </CardTitle>
        <div className="mt-4 space-y-6">
          {/* 현재 요금제 표시 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">현재 요금제:</span>
            <span className="rounded-full bg-gray-100 px-3 py-0.5 text-sm font-medium text-gray-700 capitalize">{mallPlan}</span>
          </div>

          {/* 무료/스타터는 플랫폼 PG만 사용 */}
          {['free', 'starter'].includes(mallPlan) ? (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <p className="text-sm font-medium text-blue-800">플랫폼 PG 사용 중</p>
              <p className="mt-1 text-xs text-blue-600">
                {mallPlan === 'free' ? 'Free' : 'Starter'} 요금제에서는 MarketShare 통합 결제 시스템이 자동 적용됩니다.
                자체 PG를 사용하려면 Business 요금제 이상으로 업그레이드해 주세요.
              </p>
              <a href="/pricing" className="mt-2 inline-block text-xs font-medium text-primary hover:underline">
                요금제 비교하기 →
              </a>
            </div>
          ) : (
          <>
          {/* PG 인증 방식 선택 */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              결제 처리 방식
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-4 cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="pgPaymentAuth"
                  value="platform"
                  checked={pgPaymentAuth === 'platform'}
                  onChange={() => setPgPaymentAuth('platform')}
                  className="mt-0.5 h-4 w-4 text-primary focus:ring-primary"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">플랫폼 PG 사용 (기본)</p>
                  <p className="text-xs text-gray-500 mt-0.5">MarketShare에서 제공하는 통합 결제 시스템을 사용합니다. 별도 PG 계약이 필요 없습니다.</p>
                </div>
              </label>
              <label className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
                ['business', 'enterprise'].includes(mallPlan)
                  ? 'border-gray-200 cursor-pointer hover:bg-gray-50'
                  : 'border-gray-100 bg-gray-50/50 cursor-not-allowed opacity-60'
              }`}>
                <input
                  type="radio"
                  name="pgPaymentAuth"
                  value="individual"
                  checked={pgPaymentAuth === 'individual'}
                  onChange={() => setPgPaymentAuth('individual')}
                  disabled={!['business', 'enterprise'].includes(mallPlan)}
                  className="mt-0.5 h-4 w-4 text-primary focus:ring-primary disabled:opacity-50"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">자체 PG 사용</p>
                    {!['business', 'enterprise'].includes(mallPlan) && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Business 이상</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">직접 계약한 PG사의 결제 시스템을 사용합니다. Business 요금제 이상에서 사용 가능합니다.</p>
                </div>
              </label>
              <label className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
                mallPlan === 'enterprise'
                  ? 'border-gray-200 cursor-pointer hover:bg-gray-50'
                  : 'border-gray-100 bg-gray-50/50 cursor-not-allowed opacity-60'
              }`}>
                <input
                  type="radio"
                  name="pgPaymentAuth"
                  value="selective"
                  checked={pgPaymentAuth === 'selective'}
                  onChange={() => setPgPaymentAuth('selective')}
                  disabled={mallPlan !== 'enterprise'}
                  className="mt-0.5 h-4 w-4 text-primary focus:ring-primary disabled:opacity-50"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">선택적 사용</p>
                    {mallPlan !== 'enterprise' && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-700">Enterprise</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">결제 건별로 플랫폼 PG 또는 자체 PG를 선택할 수 있습니다. Enterprise 요금제에서 사용 가능합니다.</p>
                </div>
              </label>
            </div>
          </div>

          {/* 플랫폼 PG 안내 */}
          {pgPaymentAuth === 'platform' && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <p className="text-sm text-blue-700">
                플랫폼에서 제공하는 결제 시스템을 사용합니다. 별도 설정이 필요 없습니다.
              </p>
            </div>
          )}

          {/* PG사별 설정 (individual/selective일 때만) */}
          {(pgPaymentAuth === 'individual' || pgPaymentAuth === 'selective') && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                PG사 설정
              </label>
              {PG_PROVIDERS.map((provider) => {
                const config = pgConfigs[provider.key];
                return (
                  <div
                    key={provider.key}
                    className="rounded-xl border border-gray-200 overflow-hidden"
                  >
                    {/* Provider header with toggle */}
                    <div className="flex items-center justify-between p-4 bg-gray-50/50">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-900">
                          {provider.label}
                        </span>
                        <span className="text-xs text-gray-400">
                          ({provider.pgId})
                        </span>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={config.enabled}
                        onClick={() =>
                          setPgConfigs((prev) => ({
                            ...prev,
                            [provider.key]: {
                              ...prev[provider.key],
                              enabled: !prev[provider.key].enabled,
                            },
                          }))
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                          config.enabled ? 'bg-primary' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ease-in-out ${
                            config.enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Provider config fields */}
                    {config.enabled && (
                      <div className="p-4 space-y-4 border-t border-gray-200">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Input
                            label="MID (가맹점 코드)"
                            value={config.mid}
                            onChange={(e) =>
                              setPgConfigs((prev) => ({
                                ...prev,
                                [provider.key]: {
                                  ...prev[provider.key],
                                  mid: e.target.value,
                                },
                              }))
                            }
                            placeholder="가맹점 코드를 입력해주세요"
                          />
                          <Input
                            label="IMP Code (아임포트 코드)"
                            value={config.impCode}
                            onChange={(e) =>
                              setPgConfigs((prev) => ({
                                ...prev,
                                [provider.key]: {
                                  ...prev[provider.key],
                                  impCode: e.target.value,
                                },
                              }))
                            }
                            placeholder="imp00000000"
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Input
                            label="API Key"
                            type="password"
                            value={config.apiKey}
                            onChange={(e) =>
                              setPgConfigs((prev) => ({
                                ...prev,
                                [provider.key]: {
                                  ...prev[provider.key],
                                  apiKey: e.target.value,
                                },
                              }))
                            }
                            placeholder="API Key를 입력해주세요"
                          />
                          <Input
                            label="API Secret"
                            type="password"
                            value={config.apiSecret}
                            onChange={(e) =>
                              setPgConfigs((prev) => ({
                                ...prev,
                                [provider.key]: {
                                  ...prev[provider.key],
                                  apiSecret: e.target.value,
                                },
                              }))
                            }
                            placeholder="API Secret을 입력해주세요"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`testmode-${provider.key}`}
                            checked={config.testMode}
                            onChange={(e) =>
                              setPgConfigs((prev) => ({
                                ...prev,
                                [provider.key]: {
                                  ...prev[provider.key],
                                  testMode: e.target.checked,
                                },
                              }))
                            }
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <label
                            htmlFor={`testmode-${provider.key}`}
                            className="text-sm text-gray-700"
                          >
                            테스트 모드
                          </label>
                          <span className="text-xs text-gray-400">
                            (실 결제 전 테스트 환경에서 동작합니다)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 기본 PG사 선택 */}
              <div className="w-full">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  기본 PG사
                </label>
                <select
                  value={defaultPGProvider}
                  onChange={(e) => setDefaultPGProvider(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">기본 PG사를 선택해주세요</option>
                  {enabledProviders.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
                {enabledProviders.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    PG사를 하나 이상 활성화해주세요.
                  </p>
                )}
              </div>
            </div>
          )}
          </>
          )}
        </div>
      </Card>

      {/* ============================================ */}
      {/* 7. 테마 설정 */}
      {/* ============================================ */}
      <Card>
        <CardTitle>테마 설정</CardTitle>
        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg">
                <SwatchIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  기본 테마 (Modern)
                </p>
                <p className="text-xs text-gray-500">
                  현재 적용 중인 테마입니다
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" href="/mall-admin/settings">
              테마 변경
            </Button>
          </div>
          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              기본 색상
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded-lg border border-gray-300 p-1"
              />
              <Input
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="max-w-[140px]"
                placeholder="#000000"
              />
              <span className="text-xs text-gray-400">
                브랜드 메인 색상으로 사용됩니다
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* ============================================ */}
      {/* 8. SEO 설정 */}
      {/* ============================================ */}
      <Card>
        <CardTitle>SEO 설정</CardTitle>
        <div className="mt-4 space-y-4">
          <Input
            label="사이트 타이틀"
            value={siteTitle}
            onChange={(e) => setSiteTitle(e.target.value)}
            placeholder="검색 결과에 표시될 사이트 제목"
          />
          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              설명
            </label>
            <textarea
              value={siteDesc}
              onChange={(e) => setSiteDesc(e.target.value)}
              placeholder="검색 결과에 표시될 사이트 설명"
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
            />
          </div>
          <Input
            label="키워드"
            value={siteKeywords}
            onChange={(e) => setSiteKeywords(e.target.value)}
            placeholder="쉼표로 구분하여 입력"
            hint="쉼표(,)로 구분하여 입력해주세요"
          />
        </div>
      </Card>

      {/* ============================================ */}
      {/* 9. 분양 설정 (가맹점 전용) */}
      {/* ============================================ */}
      {parentMallId && (
        <Card>
          <CardTitle>
            <span className="flex items-center gap-2">
              <BuildingStorefrontIcon className="h-5 w-5 text-emerald-500" />
              분양 설정
            </span>
          </CardTitle>
          <p className="mt-1 text-sm text-gray-500">
            본사 및 네트워크 상품의 표시 설정을 관리합니다.
          </p>

          <div className="mt-6 space-y-4">
            {/* 본사 상품 전체 표시 */}
            <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">본사 상품 전체 표시</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  본사에서 공유한 상품을 내 몰에 표시합니다. 끄면 본사 상품이 일괄 숨김 처리됩니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowHeadquartersProducts(!showHeadquartersProducts)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showHeadquartersProducts ? 'bg-primary' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    showHeadquartersProducts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 네트워크 상품 표시 */}
            <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">네트워크 상품 표시 (다른 가맹점)</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  같은 네트워크 내 다른 가맹점이 공유한 상품을 내 몰에 표시합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowNetworkProducts(!showNetworkProducts)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showNetworkProducts ? 'bg-primary' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    showNetworkProducts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 내 상품 네트워크 공유 */}
            <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">내 상품 네트워크 공유 (협동판매)</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  내 몰의 상품을 본사 및 다른 가맹점 몰에서도 판매할 수 있도록 공유합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShareOwnProducts(!shareOwnProducts)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  shareOwnProducts ? 'bg-primary' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                    shareOwnProducts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <InfoBox>
              분양 설정은 본사 네트워크와의 상품 연동을 제어합니다.
              개별 상품의 표시/숨김은 본사 상품 관리 페이지에서 설정할 수 있습니다.
            </InfoBox>
          </div>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end pb-6">
        <Button size="lg" onClick={handleSave} disabled={saving}>
          {saving ? '저장 중...' : '설정 저장'}
        </Button>
      </div>
    </div>
  );
}
