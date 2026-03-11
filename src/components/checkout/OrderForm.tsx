'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';

const orderFormSchema = z.object({
  name: z.string().min(1, '주문자 이름을 입력해주세요.'),
  email: z
    .string()
    .min(1, '이메일을 입력해주세요.')
    .email('올바른 이메일 형식이 아닙니다.'),
  phone: z
    .string()
    .min(1, '연락처를 입력해주세요.')
    .regex(
      /^01[016789]\d{7,8}$/,
      '올바른 연락처 형식이 아닙니다. (예: 01012345678)'
    ),
});

export type OrderFormValues = z.infer<typeof orderFormSchema>;

interface OrderFormProps {
  onSubmit: (data: OrderFormValues) => void;
  defaultValues?: Partial<OrderFormValues>;
  isLoading?: boolean;
  className?: string;
}

export function OrderForm({
  onSubmit,
  defaultValues,
  isLoading = false,
  className,
}: OrderFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      ...defaultValues,
    },
  });

  return (
    <div className={cn('w-full', className)}>
      <h3 className="text-lg font-semibold text-gray-900">주문자 정보</h3>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-4 space-y-4"
        id="order-form"
      >
        <Input
          label="이름"
          placeholder="주문자 이름"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="이메일"
          type="email"
          placeholder="name@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="연락처"
          type="tel"
          placeholder="01012345678"
          error={errors.phone?.message}
          {...register('phone')}
        />

        <Button
          type="submit"
          variant="default"
          fullWidth
          isLoading={isLoading}
        >
          저장
        </Button>
      </form>
    </div>
  );
}
