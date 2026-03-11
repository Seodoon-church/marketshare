'use client';

import { useEffect } from 'react';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[MarketShare Error]', error);
  }, [error]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
      </div>

      <h1 className="mt-6 text-2xl font-bold text-gray-900 sm:text-3xl">
        오류가 발생했습니다
      </h1>

      <p className="mt-4 max-w-md text-gray-500">
        {error.message || '예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'}
      </p>

      {error.digest && (
        <p className="mt-2 text-xs text-gray-400">
          오류 코드: {error.digest}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          다시 시도
        </button>

        <a
          href="/"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
        >
          메인으로 돌아가기
        </a>
      </div>
    </div>
  );
}
