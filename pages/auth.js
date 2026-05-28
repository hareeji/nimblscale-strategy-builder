import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'

export default function AuthPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [user, setUser]         = useState(null)
  const [message, setMessage]   = useState('')
  const [isError, setIsError]   = useState(false)
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(r => {
      if (r.data?.session?.user) setUser(r.data.session.user)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => listener?.subscription?.unsubscribe()
  }, [])

  async function handleSignIn(e) {
    e.preventDefault(); setMessage(''); setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setMessage(error.message); setIsError(true) }
    else { setMessage('Signed in successfully.'); setIsError(false); router.push(router.query.next || '/strategy') }
    setLoading(false)
  }

  async function handleSignUp(e) {
    e.preventDefault(); setMessage(''); setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) { setMessage(error.message); setIsError(true) }
    else { setMessage('Account created — check your email to confirm.'); setIsError(false) }
    setLoading(false)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <div style={{ maxWidth: 400 }}>
      <div className="panel">
        <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ns-near-black)', marginBottom: 20 }}>
          {user ? 'Your account' : 'Sign in to NimblScale'}
        </h2>

        {user ? (
          <div>
            <p style={{ marginBottom: 16, color: 'var(--ns-charcoal)' }}>Signed in as <strong>{user.email}</strong></p>
            <button className="btn-outline" onClick={handleSignOut}>Sign out</button>
          </div>
        ) : (
          <form style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ns-charcoal)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ns-charcoal)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button className="btn-primary" onClick={handleSignIn} disabled={loading} style={{ flex: 1 }}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
              <button className="btn-outline" onClick={handleSignUp} disabled={loading} style={{ flex: 1 }}>
                {loading ? '…' : 'Sign up'}
              </button>
            </div>
          </form>
        )}

        {message && <p className={isError ? 'msg-error' : 'msg-success'} style={{ marginTop: 14 }}>{message}</p>}
      </div>
    </div>
  )
}

AuthPage.pageTitle = 'Sign In'
