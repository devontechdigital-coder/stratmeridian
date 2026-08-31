import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

function canAccessAdminArea(token) {
  return token?.role === 'admin' || token?.role === 'sub-admin';
}

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/register');

    if (isAuthPage) {
      if (isAuth) {
        return NextResponse.redirect(new URL('/', req.url));
      }
      return null;
    }

    if (req.nextUrl.pathname.startsWith('/admin')) {
      if (!canAccessAdminArea(token)) {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const pathname = req.nextUrl.pathname;
        const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');

        if (isAuthPage) {
          return true;
        }

        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ['/admin/:path*', '/profile/:path*', '/login', '/register']
};
