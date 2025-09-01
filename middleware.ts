import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from './lib/auth'

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  // Protected routes that require authentication
  const isProtectedRoute = nextUrl.pathname.startsWith('/dashboard')
  
  // Auth routes that should redirect if user is already logged in
  const isAuthRoute = ['/auth/login', '/auth/register'].includes(nextUrl.pathname)

  // Redirect to login if accessing protected route without authentication
  if (isProtectedRoute && !isLoggedIn) {
    const redirectUrl = new URL('/auth/login', nextUrl.origin)
    redirectUrl.searchParams.set('redirectTo', nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect to dashboard if accessing auth routes while authenticated
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}