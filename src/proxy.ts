import { NextResponse, NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname.startsWith('/trainings')) {
    const hasSession = Boolean(req.cookies.get('__Secure-next-auth.session-token')) ||
                       Boolean(req.cookies.get('next-auth.session-token'));

    if (!hasSession) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/signin';
      redirectUrl.searchParams.set('callbackUrl', pathname + (search || ''));
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/trainings'],
};
