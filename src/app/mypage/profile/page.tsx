'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/hooks/useAuth';
import { useToast } from '@/components/ui/Toast';
import { updateProfile } from '@/lib/services/auth-service';
import { uploadUserAvatar } from '@/lib/services/upload-service';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { FullPageLoader } from '@/components/ui/LoadingSpinner';
import {
  CameraIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export default function ProfileEditPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('other');
  const [birthday, setBirthday] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Pre-fill form when user loads
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setGender(user.gender as 'male' | 'female' | 'other' || 'other');
      setBirthday(user.birthDate ? new Date(user.birthDate).toISOString().slice(0, 10) : '');
      setMarketingConsent(user.marketingConsent ?? false);
      setAvatarUrl(user.profileImageUrl || null);
    }
  }, [user]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingAvatar(true);
    try {
      const url = await uploadUserAvatar(user.id, file);
      setAvatarUrl(url);
      await updateProfile(user.id, { profileImageUrl: url });
      toast({ type: 'success', message: '프로필 이미지가 변경되었습니다.' });
    } catch (error: any) {
      toast({ type: 'error', message: error.message || '이미지 업로드에 실패했습니다.' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword && newPassword !== confirmPassword) {
      toast({ type: 'error', message: '비밀번호가 일치하지 않습니다.' });
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(user.id, {
        name,
        phone,
        gender,
        birthDate: birthday ? new Date(birthday) : null,
        marketingConsent,
      });

      // Password change
      if (newPassword && currentPassword) {
        try {
          const credential = EmailAuthProvider.credential(user.email, currentPassword);
          await reauthenticateWithCredential(auth.currentUser!, credential);
          await updatePassword(auth.currentUser!, newPassword);
          toast({ type: 'success', message: '비밀번호가 변경되었습니다.' });
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } catch (pwError: any) {
          if (pwError.code === 'auth/wrong-password') {
            toast({ type: 'error', message: '현재 비밀번호가 올바르지 않습니다.' });
          } else {
            toast({ type: 'error', message: '비밀번호 변경에 실패했습니다.' });
          }
          return;
        }
      }

      toast({ type: 'success', message: '프로필이 저장되었습니다.' });
    } catch {
      toast({ type: 'error', message: '프로필 저장에 실패했습니다.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading) {
    return <FullPageLoader message="프로필 로딩 중..." />;
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">회원정보 수정</h1>
        <p className="mt-1 text-sm text-gray-500">개인정보를 확인하고 수정하세요.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Image Upload */}
        <Card>
          <CardTitle>프로필 이미지</CardTitle>
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <div className="mt-4 flex items-center gap-6">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="프로필" className="h-24 w-24 rounded-full object-cover" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
                  <span className="text-3xl font-bold text-primary">
                    {(user?.name || '?').charAt(0)}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-md transition-colors hover:bg-primary-dark"
              >
                <CameraIcon className="h-4 w-4" />
              </button>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">프로필 사진 변경</p>
              <p className="mt-0.5 text-xs text-gray-500">
                JPG, PNG 파일 (최대 5MB)
              </p>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => avatarInputRef.current?.click()} isLoading={isUploadingAvatar}>
                이미지 업로드
              </Button>
            </div>
          </div>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardTitle>기본 정보</CardTitle>
          <div className="mt-4 space-y-4">
            <Input
              label="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
            />
            <Input
              label="이메일"
              value={user?.email || ''}
              disabled
              hint="이메일은 변경할 수 없습니다."
            />
            <Input
              label="연락처"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
            />

            {/* Gender Radio */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                성별
              </label>
              <div className="flex gap-4">
                {[
                  { value: 'male' as const, label: '남성' },
                  { value: 'female' as const, label: '여성' },
                  { value: 'other' as const, label: '선택안함' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                      gender === option.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={option.value}
                      checked={gender === option.value}
                      onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other')}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Birthday */}
            <Input
              label="생년월일"
              type="date"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
            />
          </div>
        </Card>

        {/* Password Change */}
        <Card>
          <CardTitle>비밀번호 변경</CardTitle>
          <p className="mt-1 text-xs text-gray-500">비밀번호를 변경하려면 아래 항목을 입력하세요.</p>
          <div className="mt-4 space-y-4">
            <Input
              label="현재 비밀번호"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="현재 비밀번호를 입력하세요"
            />
            <Input
              label="새 비밀번호"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="새 비밀번호를 입력하세요"
              hint="영문, 숫자, 특수문자 포함 8자 이상"
            />
            <Input
              label="비밀번호 확인"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="새 비밀번호를 다시 입력하세요"
              error={
                confirmPassword && newPassword !== confirmPassword
                  ? '비밀번호가 일치하지 않습니다.'
                  : undefined
              }
            />
          </div>
        </Card>

        {/* Marketing Consent */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>마케팅 수신 동의</CardTitle>
              <p className="mt-1 text-xs text-gray-500">
                이벤트, 할인 혜택 등 마케팅 정보를 받아보실 수 있습니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMarketingConsent(!marketingConsent)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                marketingConsent ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${
                  marketingConsent ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button type="submit" size="lg" className="min-w-[160px]" disabled={isSaving}>
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </form>

      {/* Account Withdrawal */}
      <div className="border-t border-gray-100 pt-6">
        <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50/50 p-5">
          <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-900">회원탈퇴</p>
            <p className="mt-0.5 text-xs text-red-700/70">
              탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.
            </p>
            <a
              href="/mypage/profile/withdraw"
              className="mt-2 inline-block text-xs font-medium text-red-600 underline underline-offset-2 transition-colors hover:text-red-800"
            >
              회원탈퇴 신청
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
