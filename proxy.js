import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function proxy(request) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request: { headers: request.headers } })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        }
      }
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth'
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  const pathname = request.nextUrl.pathname
  if (pathname.startsWith('/strategy') || pathname.startsWith('/drafts')) {
    try {
      const statusRes = await fetch(`${request.nextUrl.origin}/api/subscriptions/status`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
        method: 'GET'
      })
      const body = await statusRes.json()
      if (!statusRes.ok || !body.subscription || body.subscription.status !== 'active') {
        const url = request.nextUrl.clone()
        url.pathname = '/pricing'
        return NextResponse.redirect(url)
      }
    } catch {
      const url = request.nextUrl.clone()
      url.pathname = '/pricing'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ['/strategy', '/strategy/:path*', '/drafts', '/drafts/:path*', '/account']
}
