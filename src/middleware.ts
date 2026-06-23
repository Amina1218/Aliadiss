import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PUBLIC_PATHS = ['/', '/login', '/register', '/terms', '/privacy']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Legacy route redirects
  if (pathname.startsWith('/auth/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (pathname.startsWith('/auth/register')) {
    return NextResponse.redirect(new URL('/register', request.url))
  }
  if (pathname.startsWith('/customer')) {
    return NextResponse.redirect(new URL('/shop', request.url))
  }
  if (pathname.startsWith('/market')) {
    return NextResponse.redirect(new URL('/shop/products', request.url))
  }

  const token = request.cookies.get('aliadiss_token')?.value

  if (
    PUBLIC_PATHS.some(p => pathname === p) ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/payments/webhook') ||
    pathname.startsWith('/uploads')
  ) {
    return NextResponse.next()
  }

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const payload = await verifyToken(token)
  if (!payload) {
    const res = NextResponse.redirect(new URL('/login', request.url))
    res.cookies.delete('aliadiss_token')
    return res
  }

  if (pathname.startsWith('/admin') && payload.role !== 'SUPER_ADMIN') {
    const fallback = payload.role === 'STORE_OWNER' ? '/seller/dashboard' : '/shop'
    return NextResponse.redirect(new URL(fallback, request.url))
  }

  if (pathname.startsWith('/seller') && payload.role !== 'STORE_OWNER') {
    const fallback = payload.role === 'SUPER_ADMIN' ? '/admin/dashboard' : '/shop'
    return NextResponse.redirect(new URL(fallback, request.url))
  }

  if (pathname.startsWith('/shop') && payload.role === 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|uploads|.*\\.png$|.*\\.jpg$|.*\\.webp$).*)'],
}
