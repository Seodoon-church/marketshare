'use client';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils/cn';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const shippingFormSchema = z.object({
  recipient: z.string().min(1, '수령인 이름을 입력해주세요.'),
  phone: z
    .string()
    .min(1, '연락처를 입력해주세요.')
    .regex(
      /^01[016789]\d{7,8}$/,
      '올바른 연락처 형식이 아닙니다. (예: 01012345678)'
    ),
  zipcode: z.string().min(1, '우편번호를 입력해주세요.'),
  address: z.string().min(1, '주소를 입력해주세요.'),
  addressDetail: z.string().min(1, '상세 주소를 입력해주세요.'),
  deliveryMemo: z.string().optional(),
});

export type ShippingFormValues = z.infer<typeof shippingFormSchema>;

const DELIVERY_MEMO_OPTIONS = [
  '직접 입력',
  '문 앞에 놓아주세요',
  '경비실에 맡겨주세요',
  '택배함에 넣어주세요',
  '배송 전 연락 부탁드립니다',
];

interface ShippingFormProps {
  onSubmit: (data: ShippingFormValues) => void;
  defaultValues?: Partial<ShippingFormValues>;
  onSearchAddress?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function ShippingForm({
  onSubmit,
  defaultValues,
  onSearchAddress,
  isLoading = false,
  className,
}: ShippingFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingFormSchema),
    defaultValues: {
      recipient: '',
      phone: '',
      zipcode: '',
      address: '',
      addressDetail: '',
      deliveryMemo: '',
      ...defaultValues,
    },
  });

  const handleMemoSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value !== '직접 입력') {
      setValue('deliveryMemo', value);
    } else {
      setValue('deliveryMemo', '');
    }
  };

  return (
    <div className={cn('w-full', className)}>
      <h3 className="text-lg font-semibold text-gray-900">배송지 정보</h3>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-4 space-y-4"
        id="shipping-form"
      >
        <Input
          label="수령인"
          placeholder="수령인 이름"
          error={errors.recipient?.message}
          {...register('recipient')}
        />

        <Input
          label="연락처"
          type="tel"
          placeholder="01012345678"
          error={errors.phone?.message}
          {...register('phone')}
        />

        {/* Zipcode + Search */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            우편번호
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="우편번호"
              error={errors.zipcode?.message}
              className="flex-1"
              readOnly
              {...register('zipcode')}
            />
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onSearchAddress}
              className="flex-shrink-0"
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
              주소검색
            </Button>
          </div>
        </div>

        <Input
          label="주소"
          placeholder="기본 주소"
          error={errors.address?.message}
          readOnly
          {...register('address')}
        />

        <Input
          label="상세 주소"
          placeholder="동/호수 등 상세 주소를 입력하세요"
          error={errors.addressDetail?.message}
          {...register('addressDetail')}
        />

        {/* Delivery Memo */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            배송 메모
          </label>
          <select
            onChange={handleMemoSelect}
            className="mb-2 flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 transition-colors duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {DELIVERY_MEMO_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <Input
            placeholder="배송 시 요청사항을 입력해주세요"
            {...register('deliveryMemo')}
          />
        </div>

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
