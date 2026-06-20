import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/privacy') {
    return NextResponse.redirect(new URL('/legal/privacy', request.url), 308)
  }

  if (request.nextUrl.pathname === '/terms') {
    return NextResponse.redirect(new URL('/legal/terms', request.url), 308)
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - metadata/static files with file extensions
     */
    '/((?!_next/static|_next/image|.*\\..*).*)',
  ],
}
