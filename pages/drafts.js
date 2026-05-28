import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'

export default function Drafts() {
  const [loading, setLoading]     = useState(true)
  const [strategies, setStrategies] = useState([])
  const [error, setError]         = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    let mounted = true
    async function fetchDrafts() {
      const { data } = await supabase.auth.getSession()
      const token = data?.session?.access_token
      if (!token) {
        if (mounted) { setError('Sign in to view saved drafts.'); setLoading(false) }
        return
      }
      const res = await fetch('/api/strategies/list', { headers: { Authorization: `Bearer ${token}` } })
      const payload = await res.json()
      if (res.ok) { if (mounted) setStrategies(payload.strategies ?? []) }
      else { if (mounted) setError(payload.error || 'Unable to load drafts') }
      if (mounted) setLoading(false)
    }
    fetchDrafts()
    return () => { mounted = false }
  }, [])

  async function handleDelete(id) {
    if (!confirm('Delete this draft? This cannot be undone.')) return
    setDeletingId(id)
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    if (!token) { setError('Sign in required.'); setDeletingId(null); return }
    const res = await fetch(`/api/strategies/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    if (res.ok) {
      setStrategies(prev => prev.filter(s => s.id !== id))
    } else {
      const payload = await res.json()
      setError(payload.error || 'Unable to delete draft')
    }
    setDeletingId(null)
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ns-near-black)' }}>Saved Drafts</h2>
        <Link href="/strategy"><button className="btn-primary">New strategy</button></Link>
      </div>

      {loading && <p style={{ color: 'var(--ns-charcoal)' }}>Loading drafts…</p>}
      {error   && <p className="msg-error">{error}</p>}

      {!loading && !error && (
        <div style={{ display: 'grid', gap: 12 }}>
          {strategies.length ? strategies.map(s => (
            <div key={s.id} className="draft-card">
              <div>
                <h3>{s.name}</h3>
                <p className="meta">Updated {new Date(s.updated_at).toLocaleString()}</p>
                <Link href={`/drafts/${s.id}`}>Open draft</Link>
              </div>
              <button
                className="btn-danger"
                onClick={() => handleDelete(s.id)}
                disabled={deletingId === s.id}
              >
                {deletingId === s.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          )) : (
            <div className="panel" style={{ textAlign: 'center', color: 'var(--ns-charcoal)' }}>
              <p style={{ marginBottom: 12 }}>No saved drafts yet.</p>
              <Link href="/strategy"><button className="btn-primary">Start a strategy</button></Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

Drafts.pageTitle = 'Saved Drafts'
