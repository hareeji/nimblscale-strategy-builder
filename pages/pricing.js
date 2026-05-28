import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'

export default function Pricing() {
  const [loading, setLoading]           = useState(false)
  const [user, setUser]                 = useState(null)
  const [sessionLoading, setSessionLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user ?? null)
      setSessionLoading(false)
    })
  }, [])

  async function handleSubscribe() {
    if (!user) return
    setLoading(true)
    const res = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
        customerEmail: user.email,
        userId: user.id
      })
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      alert(data.error || 'Unable to create checkout session')
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ns-near-black)', marginBottom: 20 }}>Pricing</h2>
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ns-near-black)', marginBottom: 4 }}>Pro Plan</h3>
            <p style={{ fontSize: 13, color: 'var(--ns-charcoal)' }}>Full access to the NimblScale strategy builder</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--ns-blue)' }}>$29</span>
            <span style={{ fontSize: 13, color: 'var(--ns-charcoal)' }}> / month</span>
          </div>
        </div>

        <ul style={{ listStyle: 'none', display: 'grid', gap: 8, marginBottom: 20 }}>
          {['Unlimited strategy drafts', 'AI-powered strategy generation', 'Save & edit drafts', 'Export strategies'].map(f => (
            <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--ns-dark)' }}>
              <span style={{ color: 'var(--ns-green)', fontWeight: 700 }}>✓</span> {f}
            </li>
          ))}
        </ul>

        {sessionLoading ? (
          <p style={{ fontSize: 13, color: 'var(--ns-charcoal)' }}>Checking sign-in status…</p>
        ) : user ? (
          <div>
            <p style={{ fontSize: 13, color: 'var(--ns-charcoal)', marginBottom: 12 }}>
              Subscribing as <strong>{user.email}</strong>
            </p>
            <button className="btn-primary" onClick={handleSubscribe} disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Redirecting to checkout…' : 'Subscribe now'}
            </button>
          </div>
        ) : (
          <div>
            <div className="note-box" style={{ marginBottom: 12 }}>
              You must sign in before subscribing.
            </div>
            <Link href="/auth"><button className="btn-primary" style={{ width: '100%' }}>Sign in to subscribe</button></Link>
          </div>
        )}
      </div>
    </div>
  )
}

Pricing.pageTitle = 'Pricing'
