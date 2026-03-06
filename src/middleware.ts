import { NextRequest, NextResponse } from 'next/server';

const PLATFORM_DOMAIN = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'marketshare.co.kr';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;

  // Skip static files, API routes, admin routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/mall-admin') ||
    pathname.startsWith('/auth') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Extract subdomain
  const currentHost = hostname.replace(/:\d+$/, ''); // Remove port
  let subdomain: string | null = null;

  if (currentHost.endsWith(PLATFORM_DOMAIN)) {
    const sub = currentHost.replace(`.${PLATFORM_DOMAIN}`, '');
    if (sub !== currentHost && sub !== 'www' && sub !== '') {
      subdomain = sub;
    }
  }

  // Path-based fallback: /m/{mallSlug}/...
  if (!subdomain && pathname.startsWith('/m/')) {
    const pathParts = pathname.split('/');
    if (pathParts.length >= 3 && pathParts[2]) {
      subdomain = pathParts[2];
      const remainingPath = '/' + pathParts.slice(3).join('/');
      const url = request.nextUrl.clone();
      url.pathname = `/_mall/${subdomain}${remainingPath || '/'}`;
      const response = NextResponse.rewrite(url);
      response.headers.set('x-mall-slug', subdomain);
      return response;
    }
  }

  // Subdomain detected: serve mall
  if (subdomain) {
    const url = request.nextUrl.clone();
    url.pathname = `/_mall/${subdomain}${pathname}`;
    const response = NextResponse.rewrite(url);
    response.headers.set('x-mall-slug', subdomain);
    return response;
  }

  // Main platform (no subdomain)
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
