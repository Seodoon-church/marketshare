'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils/cn';
import { EyeIcon, EyeSlashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, '이름을 입력해주세요.')
      .min(2, '이름은 최소 2자 이상이어야 합니다.'),
    email: z
      .string()
      .min(1, '이메일을 입력해주세요.')
      .email('올바른 이메일 형식이 아닙니다.'),
    password: z
      .string()
      .min(1, '비밀번호를 입력해주세요.')
      .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
      .regex(/[A-Za-z]/, '비밀번호에 영문자를 포함해주세요.')
      .regex(/[0-9]/, '비밀번호에 숫자를 포함해주세요.')
      .regex(/[^A-Za-z0-9]/, '비밀번호에 특수문자를 포함해주세요.'),
    passwordConfirm: z.string().min(1, '비밀번호 확인을 입력해주세요.'),
    phone: z
      .string()
      .min(1, '휴대폰 번호를 입력해주세요.')
      .regex(
        /^01[016789]\d{7,8}$/,
        '올바른 휴대폰 번호 형식이 아닙니다. (예: 01012345678)'
      ),
    agreeTerms: z.literal(true, {
      error: '이용약관에 동의해주세요.',
    }),
    agreePrivacy: z.literal(true, {
      error: '개인정보 처리방침에 동의해주세요.',
    }),
    agreeMarketing: z.boolean().optional(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['passwordConfirm'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSubmit: (data: RegisterFormValues) => Promise<void> | void;
  isLoading?: boolean;
  error?: string;
  className?: string;
}

function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Za-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: '약함', color: 'bg-red-500' };
  if (score <= 3) return { score, label: '보통', color: 'bg-yellow-500' };
  if (score <= 4) return { score, label: '강함', color: 'bg-blue-500' };
  return { score, label: '매우 강함', color: 'bg-emerald-500' };
}

export function RegisterForm({
  onSubmit,
  isLoading = false,
  error,
  className,
}: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      passwordConfirm: '',
      phone: '',
      agreeTerms: false as unknown as true,
      agreePrivacy: false as unknown as true,
      agreeMarketing: false,
    },
  });

  const password = watch('password');
  const agreeTerms = watch('agreeTerms');
  const agreePrivacy = watch('agreePrivacy');
  const agreeMarketing = watch('agreeMarketing');
  const passwordStrength = getPasswordStrength(password || '');

  const allRequired = agreeTerms && agreePrivacy;
  const allChecked = allRequired && agreeMarketing;

  const handleToggleAll = () => {
    const next = !allChecked;
    setValue('agreeTerms', next as unknown as true, { shouldValidate: true });
    setValue('agreePrivacy', next as unknown as true, { shouldValidate: true });
    setValue('agreeMarketing', next);
  };

  return (
    <div className={cn('w-full', className)}>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Name */}
        <Input
          label="이름"
          placeholder="홍길동"
          error={errors.name?.message}
          {...register('name')}
        />

        {/* Email */}
        <Input
          label="이메일"
          type="email"
          placeholder="name@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        {/* Password */}
        <div>
          <div className="relative">
            <Input
              label="비밀번호"
              type={showPassword ? 'text' : 'password'}
              placeholder="영문, 숫자, 특수문자 포함 8자 이상"
              error={errors.password?.message}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {password && (
            <div className="mt-2">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      i < passwordStrength.score
                        ? passwordStrength.color
                        : 'bg-gray-200'
                    )}
                  />
                ))}
              </div>
              <p
                className={cn(
                  'mt-1 text-xs',
                  passwordStrength.score <= 2
                    ? 'text-red-500'
                    : passwordStrength.score <= 3
                      ? 'text-yellow-600'
                      : passwordStrength.score <= 4
                        ? 'text-blue-600'
                        : 'text-emerald-600'
                )}
              >
                비밀번호 강도: {passwordStrength.label}
              </p>
            </div>
          )}
        </div>

        {/* Password Confirm */}
        <div className="relative">
          <Input
            label="비밀번호 확인"
            type={showPasswordConfirm ? 'text' : 'password'}
            placeholder="비밀번호를 다시 입력하세요"
            error={errors.passwordConfirm?.message}
            {...register('passwordConfirm')}
          />
          <button
            type="button"
            onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
            className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
          >
            {showPasswordConfirm ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Phone */}
        <Input
          label="휴대폰 번호"
          type="tel"
          placeholder="01012345678"
          error={errors.phone?.message}
          {...register('phone')}
        />

        {/* Agreements */}
        <div className="rounded-xl border border-gray-200 p-4">
          {/* Toggle All */}
          <label className="flex cursor-pointer items-center gap-3 pb-3 border-b border-gray-100">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={handleToggleAll}
              className="hidden"
            />
            {allChecked ? (
              <CheckCircleSolidIcon className="h-6 w-6 flex-shrink-0 text-primary" />
            ) : (
              <CheckCircleIcon className="h-6 w-6 flex-shrink-0 text-gray-300" />
            )}
            <span className="text-sm font-semibold text-gray-900">
              전체 동의
            </span>
          </label>

          <div className="mt-3 space-y-2.5">
            {/* Terms */}
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                className="hidden"
                {...register('agreeTerms')}
              />
              {agreeTerms ? (
                <CheckCircleSolidIcon className="h-5 w-5 flex-shrink-0 text-primary" />
              ) : (
                <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-gray-300" />
              )}
              <span className="text-sm text-gray-700">
                <span className="text-red-500">[필수]</span> 이용약관 동의
              </span>
            </label>

            {/* Privacy */}
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                className="hidden"
                {...register('agreePrivacy')}
              />
              {agreePrivacy ? (
                <CheckCircleSolidIcon className="h-5 w-5 flex-shrink-0 text-primary" />
              ) : (
                <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-gray-300" />
              )}
              <span className="text-sm text-gray-700">
                <span className="text-red-500">[필수]</span> 개인정보 처리방침
                동의
              </span>
            </label>

            {/* Marketing */}
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                className="hidden"
                {...register('agreeMarketing')}
              />
              {agreeMarketing ? (
                <CheckCircleSolidIcon className="h-5 w-5 flex-shrink-0 text-primary" />
              ) : (
                <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-gray-300" />
              )}
              <span className="text-sm text-gray-700">
                <span className="text-gray-400">[선택]</span> 마케팅 정보 수신
                동의
              </span>
            </label>
          </div>

          {/* Agreement Errors */}
          {(errors.agreeTerms || errors.agreePrivacy) && (
            <p className="mt-2 text-xs text-red-500">
              {errors.agreeTerms?.message || errors.agreePrivacy?.message}
            </p>
          )}
        </div>

        <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
          회원가입
        </Button>
      </form>
    </div>
  );
}
