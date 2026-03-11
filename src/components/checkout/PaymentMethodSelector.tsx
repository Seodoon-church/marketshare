'use client';

import { cn } from '@/lib/utils/cn';
import type { PaymentMethod } from '@/types';
import {
  CreditCardIcon,
  DevicePhoneMobileIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

interface PaymentOption {
  id: PaymentMethod;
  label: string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  {
    id: 'card',
    label: '신용카드',
    icon: <CreditCardIcon className="h-6 w-6" />,
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    id: 'kakaopay',
    label: '카카오페이',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M12 3C6.48 3 2 6.36 2 10.44c0 2.62 1.75 4.93 4.38 6.24l-1.12 4.14c-.1.35.31.64.62.44l4.94-3.26c.38.04.77.06 1.18.06 5.52 0 10-3.36 10-7.5S17.52 3 12 3z" />
      </svg>
    ),
    bgColor: 'bg-[#FEE500]/20',
    iconColor: 'text-[#191919]',
  },
  {
    id: 'naverpay',
    label: '네이버페이',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path
          d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z"
          transform="scale(0.6) translate(8,4)"
        />
      </svg>
    ),
    bgColor: 'bg-[#03C75A]/10',
    iconColor: 'text-[#03C75A]',
  },
  {
    id: 'bank_transfer',
    label: '계좌이체',
    icon: <BanknotesIcon className="h-6 w-6" />,
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'phone',
    label: '휴대폰',
    icon: <DevicePhoneMobileIcon className="h-6 w-6" />,
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
];

interface PaymentMethodSelectorProps {
  selected: PaymentMethod | null;
  onSelect: (method: PaymentMethod) => void;
  className?: string;
}

export function PaymentMethodSelector({
  selected,
  onSelect,
  className,
}: PaymentMethodSelectorProps) {
  return (
    <div className={cn('w-full', className)}>
      <h3 className="text-lg font-semibold text-gray-900">결제 수단</h3>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {PAYMENT_OPTIONS.map((option) => {
          const isSelected = selected === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className={cn(
                'flex flex-col items-center gap-3 rounded-xl border-2 px-4 py-5 transition-all duration-200',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
              )}
            >
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-xl',
                  option.bgColor,
                  option.iconColor
                )}
              >
                {option.icon}
              </div>
              <span
                className={cn(
                  'text-sm font-medium',
                  isSelected ? 'text-primary' : 'text-gray-700'
                )}
              >
                {option.label}
              </span>
              {isSelected && (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <svg
                    className="h-3 w-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
