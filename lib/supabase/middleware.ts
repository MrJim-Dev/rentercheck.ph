import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes logic
  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/signup')
  
  // Public pages - accessible without login
  const isPublicPage = request.nextUrl.pathname === '/' ||
                       request.nextUrl.pathname.startsWith('/search') ||
                       request.nextUrl.pathname.startsWith('/renter') ||
                       request.nextUrl.pathname.startsWith('/legal')
  
  // Pages that handle their own auth (redirect to login if not authenticated)
  const isSelfAuthPage = request.nextUrl.pathname.startsWith('/report') ||
                         request.nextUrl.pathname.startsWith('/my-reports') ||
                         request.nextUrl.pathname.startsWith('/admin')
  
  if (!user && !isAuthPage && !isPublicPage && !isSelfAuthPage) {
    // If not logged in and trying to access protected route, redirect to home
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    // If logged in and trying to access auth pages, redirect to home
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
