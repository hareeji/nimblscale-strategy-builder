import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const navLinks = [
  { href: '/strategy', label: 'Strategy Builder', icon: '⚡' },
  { href: '/drafts',   label: 'Saved Drafts',     icon: '📄' },
  { href: '/pricing',  label: 'Pricing',           icon: '💳' },
  { href: '/account',  label: 'Account',           icon: '👤' },
]

export default function Layout({ children, title }) {
  const router = useRouter()
  const [userEmail, setUserEmail] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data?.session?.user?.email ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-product">NimblScale</div>
          <div className="sidebar-tagline">Strategy Builder · NimblShift</div>
        </div>
        <nav className="sidebar-nav">
          {navLinks.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={router.pathname === href || router.pathname.startsWith(href + '/') ? 'active' : ''}
            >
              <span>{icon}</span>
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          NimblShift Consulting Inc.
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <span className="topbar-title">{title || 'NimblScale'}</span>
          {userEmail ? (
            <span className="topbar-user">{userEmail}</span>
          ) : (
            <Link href="/auth" style={{ fontSize: 12, color: 'var(--ns-blue)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
          )}
        </header>
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  )
}
