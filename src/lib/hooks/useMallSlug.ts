'use client';

import { useState, useEffect, useMemo } from 'react';

/**
 * Extract the mall slug from the current URL pathname.
 * Works with Firebase Hosting rewrites where static params may be 'demo'
 * but the actual URL contains the real slug.
 *
 * Uses useState+useEffect to avoid hydration mismatch.
 * Initial render uses paramSlug, then updates to URL-based slug after mount.
 */
export function useMallSlug(paramSlug?: string): string {
  const [slug, setSlug] = useState(paramSlug || 'demo');

  useEffect(() => {
    const parts = window.location.pathname.split('/');
    const mallsIndex = parts.indexOf('malls');
    if (mallsIndex >= 0 && parts[mallsIndex + 1]) {
      const urlSlug = parts[mallsIndex + 1];
      if (urlSlug !== slug) {
        setSlug(urlSlug);
      }
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return slug;
}

/**
 * Extract a sub-param from the URL pathname by position after mall slug.
 * e.g. /malls/my-shop/products/abc123 → returns 'abc123'
 * e.g. /malls/my-shop/board/post1 → returns 'post1'
 */
export function useMallSubParam(paramValue?: string): string {
  const [param, setParam] = useState(paramValue || 'demo');

  useEffect(() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length >= 4) {
      const urlParam = parts[3];
      if (urlParam !== param) {
        setParam(urlParam);
      }
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return param;
}
