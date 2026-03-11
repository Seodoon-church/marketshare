'use client';

import { useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/lib/hooks/useAuth';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export default function AdminBoards() {
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = user?.role === 'platform_admin';

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      window.location.href = '/';
    }
  }, [authLoading, user, isAdmin]);

  if (authLoading || !isAdmin) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">게시판 관리</h1>
      <Card>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-700">준비중입니다</h2>
          <p className="mt-2 text-sm text-gray-500">이 기능은 곧 제공될 예정입니다.</p>
        </div>
      </Card>
    </div>
  );
}
