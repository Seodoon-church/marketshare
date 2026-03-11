'use client';

import { useEffect } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[MarketShare Global Error]', error);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{ fontFamily: "'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}
        className="antialiased"
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '1rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '4rem',
              height: '4rem',
              borderRadius: '9999px',
              backgroundColor: '#FEE2E2',
            }}
          >
            <ExclamationTriangleIcon
              style={{ width: '2rem', height: '2rem', color: '#EF4444' }}
            />
          </div>

          <h1
            style={{
              marginTop: '1.5rem',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#111827',
            }}
          >
            심각한 오류가 발생했습니다
          </h1>

          <p
            style={{
              marginTop: '1rem',
              maxWidth: '28rem',
              color: '#6B7280',
              lineHeight: 1.6,
            }}
          >
            {error.message || '페이지를 불러오는 중 예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'}
          </p>

          {error.digest && (
            <p
              style={{
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                color: '#9CA3AF',
              }}
            >
              오류 코드: {error.digest}
            </p>
          )}

          <div
            style={{
              marginTop: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              alignItems: 'center',
            }}
          >
            <button
              onClick={reset}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0.5rem',
                backgroundColor: '#3B82F6',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              다시 시도
            </button>

            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '0.5rem',
                border: '1px solid #D1D5DB',
                backgroundColor: '#FFFFFF',
                padding: '0.75rem 1.5rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              메인으로 돌아가기
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
