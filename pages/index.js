import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'

export default function Home() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        const { session_id, ...rest } = router.query
        const next = Object.keys(rest).length
          ? `${router.pathname}?${new URLSearchParams(rest)}`
          : '/strategy'
        router.replace(next)
      } else {
        setChecked(true)
      }
    })
  }, [])

  const subscribed = router.query.subscribed === '1'

  if (!checked) return null

  return (
    <div>
      {subscribed && (
        <p className="msg-success" style={{ maxWidth: 560, marginBottom: 16 }}>
          Subscription activated — welcome to NimblScale Pro!
        </p>
      )}
      <div className="panel" style={{ maxWidth: 560 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ns-near-black)', marginBottom: 10 }}>
          Welcome to NimblScale
        </h1>
        <p style={{ color: 'var(--ns-charcoal)', marginBottom: 20 }}>
          AI-powered strategy builder for consulting engagements. Sign in to get started.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/auth"><button className="btn-primary">Sign in / Sign up</button></Link>
          <Link href="/pricing"><button className="btn-outline">View Pricing</button></Link>
        </div>
      </div>
    </div>
  )
}

Home.pageTitle = 'NimblScale — Strategy Builder'
