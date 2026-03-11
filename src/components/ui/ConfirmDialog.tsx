'use client';

import { Modal } from './Modal';
import { Button } from './Button';
import { ExclamationTriangleIcon, TrashIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

interface ConfirmDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
  isLoading?: boolean;
}

const variantConfig = {
  danger: {
    icon: TrashIcon,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    buttonVariant: 'danger' as const,
  },
  warning: {
    icon: ExclamationTriangleIcon,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    buttonVariant: 'default' as const,
  },
  default: {
    icon: InformationCircleIcon,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    buttonVariant: 'default' as const,
  },
};

export function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'default',
  isLoading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="sm" showClose={false}>
      <div className="text-center">
        <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${config.iconBg}`}>
          <Icon className={`h-6 w-6 ${config.iconColor}`} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-500">{message}</p>
      </div>
      <div className="mt-6 flex gap-3">
        <Button
          variant="outline"
          fullWidth
          onClick={onCancel}
          disabled={isLoading}
        >
          {cancelText}
        </Button>
        <Button
          variant={config.buttonVariant}
          fullWidth
          onClick={onConfirm}
          isLoading={isLoading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
}
