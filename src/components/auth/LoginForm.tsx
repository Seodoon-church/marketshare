'use client';

import { useState } from 'react';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils/cn';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요.')
    .email('올바른 이메일 형식이 아닙니다.'),
  password: z
    .string()
    .min(1, '비밀번호를 입력해주세요.')
    .min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSubmit: (data: LoginFormValues) => Promise<void> | void;
  isLoading?: boolean;
  error?: string;
  className?: string;
}

export function LoginForm({ onSubmit, isLoading = false, error, className }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <div className={cn('w-full', className)}>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="relative">
          <Input
            label="이메일"
            type="email"
            placeholder="name@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
        </div>

        <div className="relative">
          <Input
            label="비밀번호"
            type={showPassword ? 'text' : 'password'}
            placeholder="비밀번호를 입력하세요"
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

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-sm text-gray-600">로그인 유지</span>
          </label>
          <a
            href="/auth/find-password"
            className="text-sm text-gray-500 hover:text-primary"
          >
            비밀번호 찾기
          </a>
        </div>

        <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
          로그인
        </Button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-gray-400">간편 로그인</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Social Login */}
      <div className="space-y-2.5">
        <Button variant="kakao" fullWidth size="lg" type="button">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M12 3C6.48 3 2 6.36 2 10.44c0 2.62 1.75 4.93 4.38 6.24l-1.12 4.14c-.1.35.31.64.62.44l4.94-3.26c.38.04.77.06 1.18.06 5.52 0 10-3.36 10-7.5S17.52 3 12 3z" />
          </svg>
          카카오 로그인
        </Button>

        <Button variant="naver" fullWidth size="lg" type="button">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path
              d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"
              transform="scale(0.6) translate(8,4)"
            />
          </svg>
          네이버 로그인
        </Button>

        <Button variant="outline" fullWidth size="lg" type="button">
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google 로그인
        </Button>
      </div>

      {/* Register Link */}
      <p className="mt-6 text-center text-sm text-gray-500">
        계정이 없으신가요?{' '}
        <a
          href="/auth/register"
          className="font-medium text-primary hover:underline"
        >
          회원가입
        </a>
      </p>
    </div>
  );
}
