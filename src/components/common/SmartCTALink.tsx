'use client';

import { useAuthStore } from '@/store/auth-store';
import type { ReactNode } from 'react';

interface SmartCTALinkProps {
  className?: string;
  children: ReactNode;
}

export function SmartCTALink({ className, children }: SmartCTALinkProps) {
  const { user, isAuthenticated } = useAuthStore();

  const getHref = () => {
    if (!isAuthenticated) return '/auth/register';
    if (user?.ownedMallIds && user.ownedMallIds.length > 0) return '/mall-admin';
    return '/create-mall';
  };

  const handleClick = () => {
    window.location.href = getHref();
  };

  return (
    <button type="button" onClick={handleClick} className={className}>
      {children}
    </button>
  );
}
