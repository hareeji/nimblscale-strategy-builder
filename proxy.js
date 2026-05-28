import { NextResponse } from 'next/server'

// Protect subscription-gated pages: /strategy and /drafts
export async function proxy(req) {
  const { nextUrl } = req
  const pathname = nextUrl.pathname

  // Only guard specific routes
  if (!pathname.startsWith('/strategy') && !pathname.startsWith('/drafts')) {
    return NextResponse.next()
  }

  // Try to get a Bearer token from Authorization header
  const authHeader = req.headers.get('authorization') || ''
  let token = authHeader.replace('Bearer ', '') || null

  // Fallback to common Supabase cookie names
  if (!token) {
    const cookieNames = ['sb-access-token', 'supabase-auth-token', 'sb:token']
    for (const name of cookieNames) {
      const c = req.cookies.get && req.cookies.get(name)
      if (c && c.value) {
        token = c.value
        break
      }
    }
  }

  if (!token) {
    const url = nextUrl.clone()
    url.pathname = '/pricing'
    return NextResponse.redirect(url)
  }

  try {
    const statusRes = await fetch(`${nextUrl.origin}/api/subscriptions/status`, {
      headers: { Authorization: `Bearer ${token}` },
      method: 'GET'
    })

    if (!statusRes.ok) {
      const url = nextUrl.clone()
      url.pathname = '/pricing'
      return NextResponse.redirect(url)
    }

    const body = await statusRes.json()
    const sub = body.subscription
    if (!sub || sub.status !== 'active') {
      const url = nextUrl.clone()
      url.pathname = '/pricing'
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  } catch (e) {
    const url = nextUrl.clone()
    url.pathname = '/pricing'
    return NextResponse.redirect(url)
  }
}

export const config = {
  matcher: ['/strategy', '/strategy/:path*', '/drafts', '/drafts/:path*']
}
