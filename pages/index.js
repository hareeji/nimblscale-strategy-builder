import Link from 'next/link'

export default function Home() {
  return (
    <div>
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
