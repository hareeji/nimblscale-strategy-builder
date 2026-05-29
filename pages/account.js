import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'

const statusColor = {
  active:    { background: '#E8F5E9', color: '#2E7D32' },
  trialing:  { background: '#E8F5E9', color: '#2E7D32' },
  canceled:  { background: '#FEF0F0', color: '#C0392B' },
  past_due:  { background: '#FFF0E0', color: '#8B4A00' },
}

export default function Account() {
  const [loading, setLoading]         = useState(true)
  const [user, setUser]               = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data } = await supabase.auth.getSession()
      const token = data?.session?.access_token
      if (!token) { if (mounted) setLoading(false); return }
      const res = await fetch('/api/subscriptions/status', { headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        const payload = await res.json()
        if (mounted) { setUser(payload.user); setSubscription(payload.subscription) }
      }
      if (mounted) setLoading(false)
    })()
    return () => { mounted = false }
  }, [])

  async function handleManageSubscription() {
    setPortalLoading(true)
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    if (!token) { setPortalLoading(false); return }
    const res = await fetch('/api/stripe/create-portal-session', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    })
    const payload = await res.json()
    if (payload.url) window.location.href = payload.url
    setPortalLoading(false)
  }

  if (loading) return <div style={{ color: 'var(--ns-charcoal)' }}>Loading…</div>

  if (!user) return (
    <div className="panel" style={{ maxWidth: 420 }}>
      <p style={{ marginBottom: 12, color: 'var(--ns-charcoal)' }}>You are not signed in.</p>
      <Link href="/auth"><button className="btn-primary">Sign in</button></Link>
    </div>
  )

  const badge = statusColor[subscription?.status] || { background: 'var(--ns-light-grey)', color: 'var(--ns-charcoal)' }

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="panel" style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ns-near-black)', marginBottom: 14 }}>Account details</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ns-charcoal)', width: 100, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</span>
            <span style={{ fontSize: 13, color: 'var(--ns-dark)' }}>{user.email}</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ns-near-black)', marginBottom: 14 }}>Subscription</h3>
        {subscription ? (
          <div style={{ display: 'grid', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ns-charcoal)', width: 100, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Status</span>
              <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 4, ...badge }}>
                {subscription.status}
              </span>
            </div>
            {subscription.price_id && (
              <div style={{ display: 'flex', gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ns-charcoal)', width: 100, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Price</span>
                <span style={{ fontSize: 13, color: 'var(--ns-dark)', fontFamily: 'monospace' }}>{subscription.price_id}</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ns-charcoal)', width: 100, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Updated</span>
              <span style={{ fontSize: 13, color: 'var(--ns-dark)' }}>{new Date(subscription.updated_at).toLocaleString()}</span>
            </div>
            <div style={{ marginTop: 6 }}>
              <button className="btn-outline" onClick={handleManageSubscription} disabled={portalLoading}>
                {portalLoading ? 'Redirecting…' : 'Manage subscription'}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ color: 'var(--ns-charcoal)', marginBottom: 14 }}>No active subscription found.</p>
            <Link href="/pricing"><button className="btn-primary">View pricing</button></Link>
          </div>
        )}
      </div>
    </div>
  )
}

Account.pageTitle = 'Account'
