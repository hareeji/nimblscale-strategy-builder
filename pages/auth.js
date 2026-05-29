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
  const [loading, setLoading]     = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [isRecovery, setIsRecovery]   = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(r => {
      if (r.data?.session?.user) setUser(r.data.session.user)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') { setIsRecovery(true); return }
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

  async function handleSetNewPassword(e) {
    e.preventDefault(); setLoading(true); setMessage('')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { setMessage(error.message); setIsError(true) }
    else { setMessage('Password updated — you can now sign in.'); setIsError(false); setIsRecovery(false) }
    setLoading(false)
  }

  async function handleForgotPassword(e) {
    e.preventDefault()
    if (!email) { setMessage('Enter your email above first.'); setIsError(true); return }
    setLoading(true); setMessage('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`
    })
    if (error) { setMessage(error.message); setIsError(true) }
    else { setMessage('Password reset email sent — check your inbox.'); setIsError(false); setResetSent(true) }
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

        {isRecovery ? (
          <form style={{ display: 'grid', gap: 12 }} onSubmit={handleSetNewPassword}>
            <p style={{ color: 'var(--ns-charcoal)', fontSize: 14 }}>Enter a new password for your account.</p>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ns-charcoal)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>New Password</label>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" autoFocus />
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Set new password'}
            </button>
          </form>
        ) : user ? (
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
            {!resetSent && (
              <button onClick={handleForgotPassword} disabled={loading} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--ns-blue)', fontSize: 13, cursor: 'pointer', textAlign: 'left' }}>
                Forgot password?
              </button>
            )}
          </form>
        )}

        {message && <p className={isError ? 'msg-error' : 'msg-success'} style={{ marginTop: 14 }}>{message}</p>}
      </div>
    </div>
  )
}

AuthPage.pageTitle = 'Sign In'
