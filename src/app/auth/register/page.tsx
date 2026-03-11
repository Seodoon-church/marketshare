'use client';

import { useState } from 'react';

import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Logo } from '@/components/common/Logo';
import { EyeIcon, EyeSlashIcon, CheckIcon } from '@heroicons/react/24/outline';

export default function RegisterPage() {

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    passwordConfirm: '',
  });
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    marketing: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAgreement = (field: keyof typeof agreements) => {
    setAgreements((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const toggleAll = () => {
    const allChecked = agreements.terms && agreements.privacy && agreements.marketing;
    setAgreements({ terms: !allChecked, privacy: !allChecked, marketing: !allChecked });
  };

  const formatPhoneInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const passwordStrength = (pw: string) => {
    if (pw.length === 0) return { level: 0, text: '', color: '' };
    if (pw.length < 6) return { level: 1, text: '너무 짧음', color: 'bg-red-500' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: 1, text: '약함', color: 'bg-red-500' };
    if (score === 2) return { level: 2, text: '보통', color: 'bg-amber-500' };
    return { level: 3, text: '강함', color: 'bg-emerald-500' };
  };

  const strength = passwordStrength(form.password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!agreements.terms || !agreements.privacy) {
      setError('필수 약관에 동의해주세요.');
      return;
    }

    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (form.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(userCredential.user, { displayName: form.name });

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: form.email,
        name: form.name,
        phone: form.phone.replace(/\D/g, ''),
        role: 'customer',
        ownedMallIds: [],
        profileImageUrl: null,
        gender: null,
        birthDate: null,
        isVerified: false,
        verificationMethod: null,
        socialProvider: null,
        socialProviderId: null,
        defaultAddress: null,
        addresses: [],
        marketingConsent: agreements.marketing,
        privacyConsent: true,
        referredBy: null,
        lastLoginAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      window.location.href = '/';
    } catch (err: any) {
      const code = err?.code;
      if (code === 'auth/email-already-in-use') {
        setError('이미 사용 중인 이메일입니다.');
      } else if (code === 'auth/invalid-email') {
        setError('유효하지 않은 이메일 형식입니다.');
      } else if (code === 'auth/weak-password') {
        setError('비밀번호가 너무 약합니다. 6자 이상 입력해주세요.');
      } else {
        setError('회원가입 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left - Branding */}
      <div className="hidden w-1/2 bg-gradient-to-br from-gray-900 via-gray-800 to-primary-dark lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Logo size="md" variant="white" />

        <div>
          <h2 className="text-4xl font-bold leading-tight text-white">
            함께 성장하는
            <br />
            쇼핑몰 파트너
          </h2>
          <p className="mt-4 max-w-md text-lg text-gray-300">
            회원가입 후 나만의 분양몰을 개설하고, 상품을 등록하면 메인 마켓에 자동으로 노출됩니다.
          </p>
          <div className="mt-8 space-y-3">
            {['무료 분양몰 개설', '상품 자동 연동', '다양한 업종별 테마', '한국 PG사 결제 지원'].map((item) => (
              <div key={item} className="flex items-center gap-2 text-gray-300">
                <CheckIcon className="h-5 w-5 text-emerald-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} MarketShare
        </p>
      </div>

      {/* Right - Register Form */}
      <div className="flex w-full items-center justify-center overflow-y-auto px-6 py-8 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-8 lg:hidden">
            <Logo size="md" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900">회원가입</h1>
          <p className="mt-2 text-sm text-gray-500">
            이미 계정이 있으신가요?{' '}
            <a href="/auth/login" className="font-medium text-primary hover:underline">
              로그인
            </a>
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="mt-6 space-y-4">
            <Input
              label="이름"
              placeholder="홍길동"
              value={form.name}
              onChange={(e) => updateForm('name', e.target.value)}
              required
            />

            <Input
              label="이메일"
              type="email"
              placeholder="name@example.com"
              value={form.email}
              onChange={(e) => updateForm('email', e.target.value)}
              required
            />

            <Input
              label="휴대폰 번호"
              type="tel"
              placeholder="010-0000-0000"
              value={form.phone}
              onChange={(e) => updateForm('phone', formatPhoneInput(e.target.value))}
              maxLength={13}
              required
            />

            <div>
              <div className="relative">
                <Input
                  label="비밀번호"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="6자 이상, 영문/숫자/특수문자 조합"
                  value={form.password}
                  onChange={(e) => updateForm('password', e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
              {form.password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i <= strength.level ? strength.color : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">{strength.text}</span>
                </div>
              )}
            </div>

            <Input
              label="비밀번호 확인"
              type="password"
              placeholder="비밀번호를 다시 입력하세요"
              value={form.passwordConfirm}
              onChange={(e) => updateForm('passwordConfirm', e.target.value)}
              error={
                form.passwordConfirm && form.password !== form.passwordConfirm
                  ? '비밀번호가 일치하지 않습니다.'
                  : undefined
              }
              required
            />

            {/* Agreements */}
            <div className="rounded-xl border border-gray-200 p-4">
              <label className="flex cursor-pointer items-center gap-3 pb-3 border-b border-gray-100">
                <input
                  type="checkbox"
                  checked={agreements.terms && agreements.privacy && agreements.marketing}
                  onChange={toggleAll}
                  className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-semibold text-gray-900">전체 동의</span>
              </label>

              <div className="mt-3 space-y-2.5">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={agreements.terms}
                    onChange={() => toggleAgreement('terms')}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-600">
                    <span className="text-red-500">[필수]</span> 이용약관 동의
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={agreements.privacy}
                    onChange={() => toggleAgreement('privacy')}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-600">
                    <span className="text-red-500">[필수]</span> 개인정보 처리방침 동의
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={agreements.marketing}
                    onChange={() => toggleAgreement('marketing')}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-600">
                    <span className="text-gray-400">[선택]</span> 마케팅 정보 수신 동의
                  </span>
                </label>
              </div>
            </div>

            <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
              회원가입
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">간편 가입</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="space-y-2.5">
            <Button variant="kakao" fullWidth size="lg" type="button" onClick={() => { alert('소셜 로그인은 준비 중입니다. 이메일로 가입해주세요.'); }}>
              카카오로 시작하기
            </Button>
            <Button variant="naver" fullWidth size="lg" type="button" onClick={() => { alert('소셜 로그인은 준비 중입니다. 이메일로 가입해주세요.'); }}>
              네이버로 시작하기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
