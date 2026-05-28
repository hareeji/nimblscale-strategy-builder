import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabaseClient'
import { exportStrategy } from '../lib/exportStrategy'

const steps = [
  { id: 1, title: 'Business Context',    key: 'businessContext',      placeholder: 'Describe the client, market, and goals.' },
  { id: 2, title: 'Competitive Advantage', key: 'competitiveAdvantage', placeholder: 'What differentiates the business from competitors?' },
  { id: 3, title: 'Target Audience',     key: 'targetAudience',       placeholder: 'Who are the ideal customers and segments?' },
  { id: 4, title: 'Strategic Initiatives', key: 'initiatives',         placeholder: 'List the key growth initiatives or campaigns.' },
  { id: 5, title: 'Metrics & Outcomes',  key: 'metrics',              placeholder: 'Define success metrics and timeline.' }
]

export default function Strategy() {
  const [loading, setLoading]           = useState(true)
  const [user, setUser]                 = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [currentStep, setCurrentStep]   = useState(1)
  const [values, setValues]             = useState({ businessContext: '', competitiveAdvantage: '', targetAudience: '', initiatives: '', metrics: '' })
  const [draftName, setDraftName]       = useState('')
  const [strategyId, setStrategyId]     = useState(null)
  const [aiOutput, setAiOutput]         = useState('')
  const [aiParsed, setAiParsed]         = useState(null)
  const [saving, setSaving]             = useState(false)
  const [generating, setGenerating]     = useState(false)
  const [message, setMessage]           = useState('')
  const [error, setError]               = useState(null)

  const currentStepConfig = useMemo(() => steps.find(s => s.id === currentStep), [currentStep])

  useEffect(() => {
    let mounted = true
    async function fetchStatus() {
      const { data } = await supabase.auth.getSession()
      const token = data?.session?.access_token
      if (!token) { if (mounted) { setLoading(false); setUser(null) } return }
      const res = await fetch('/api/subscriptions/status', { headers: { Authorization: `Bearer ${token}` } })
      const payload = await res.json()
      if (res.ok && mounted) { setUser(payload.user); setSubscription(payload.subscription) }
      else if (mounted) setError(payload.error || 'Unable to load subscription status')
      if (mounted) setLoading(false)
    }
    fetchStatus()
    return () => { mounted = false }
  }, [])

  const isActive = subscription?.status === 'active'

  async function handleSaveStep() {
    setSaving(true); setMessage('')
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    if (!token) { setError('Sign in required to save.'); setSaving(false); return }
    const res = await fetch('/api/strategies/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: draftName.trim() || `Strategy draft ${new Date().toLocaleDateString()}`, inputs: values })
    })
    const payload = await res.json()
    if (res.ok) { setMessage('Draft saved.'); setStrategyId(payload.strategy?.id ?? null) }
    else setError(payload.error || 'Unable to save strategy')
    setSaving(false)
  }

  async function generateAI() {
    setMessage(''); setAiOutput(''); setAiParsed(null); setGenerating(true)
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token
    if (!token) { setError('Sign in required to generate AI summary.'); setGenerating(false); return }
    try {
      const res = await fetch('/api/anthropic/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: 'Draft generation', inputs: values })
      })
      const payload = await res.json()
      if (res.ok) { setAiOutput(payload.completion || ''); setAiParsed(payload.parsed ?? null) }
      else setError(payload.error || 'AI generation failed')
    } catch (e) { setError(String(e)) }
    finally { setGenerating(false) }
  }

  function populateFromAI() {
    if (!aiParsed) return
    const mapping = {}
    ;['businessContext','competitiveAdvantage','targetAudience','initiatives','metrics'].forEach(k => {
      if (aiParsed[k]) mapping[k] = aiParsed[k]
    })
    if (!Object.keys(mapping).length) { setMessage('No mappable fields in AI output.'); return }
    setValues(prev => ({ ...prev, ...mapping }))
    setMessage('Fields populated from AI summary.')
  }

  async function saveAiSummaryToDraft() {
    if (!aiOutput) return
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    if (!token) return setError('Sign in required')
    const inputs = { ...values, ai_summary: aiOutput }
    const name = draftName.trim() || `Strategy draft ${new Date().toLocaleDateString()}`
    if (!strategyId) {
      const res = await fetch('/api/strategies/save', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, inputs })
      })
      const payload = await res.json()
      if (res.ok) { setStrategyId(payload.strategy?.id ?? null); setMessage('AI summary saved to new draft.') }
      else setError(payload.error || 'Unable to save AI summary')
      return
    }
    const res = await fetch(`/api/strategies/${strategyId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ inputs })
    })
    const payload = await res.json()
    if (res.ok) setMessage('AI summary saved to draft.')
    else setError(payload.error || 'Unable to update draft')
  }

  if (loading) return <div style={{ padding: 20, color: 'var(--ns-charcoal)' }}>Loading…</div>

  if (!user) return (
    <div className="panel" style={{ maxWidth: 480 }}>
      <h2 style={{ marginBottom: 10 }}>Sign in required</h2>
      <p style={{ color: 'var(--ns-charcoal)', marginBottom: 16 }}>You must sign in to access the strategy workflow.</p>
      <Link href="/auth"><button className="btn-primary">Sign in</button></Link>
    </div>
  )

  if (!isActive) return (
    <div className="panel" style={{ maxWidth: 480 }}>
      <h2 style={{ marginBottom: 10 }}>Subscription required</h2>
      <p style={{ color: 'var(--ns-charcoal)', marginBottom: 8 }}>
        <strong>{user.email}</strong> does not have an active subscription.
      </p>
      {subscription && (
        <p style={{ fontSize: 13, color: 'var(--ns-charcoal)', marginBottom: 16 }}>
          Current status: <strong>{subscription.status}</strong>
        </p>
      )}
      <Link href="/pricing"><button className="btn-primary">Subscribe now</button></Link>
    </div>
  )

  return (
    <div style={{ maxWidth: 860 }}>
      <div style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--ns-charcoal)' }}>Signed in as <strong>{user.email}</strong></p>
        <Link href="/drafts" style={{ fontSize: 12, color: 'var(--ns-blue)', textDecoration: 'none', fontWeight: 600 }}>View saved drafts</Link>
      </div>

      <div className="panel">
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ns-charcoal)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Draft name</label>
          <input
            type="text"
            value={draftName}
            onChange={e => setDraftName(e.target.value)}
            placeholder="e.g. Q3 Growth Strategy"
          />
        </div>

        <div className="step-tabs" style={{ marginBottom: 20 }}>
          {steps.map(step => (
            <button
              key={step.id}
              className={`step-tab${step.id === currentStep ? ' active' : ''}`}
              onClick={() => setCurrentStep(step.id)}
            >
              {step.id}. {step.title}
            </button>
          ))}
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ns-dark)', marginBottom: 8 }}>
            {currentStepConfig.title}
          </label>
          <textarea
            rows={7}
            value={values[currentStepConfig.key]}
            placeholder={currentStepConfig.placeholder}
            onChange={e => setValues(prev => ({ ...prev, [currentStepConfig.key]: e.target.value }))}
          />
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn-outline" onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))} disabled={currentStep === 1}>Previous</button>
          <button className="btn-outline" onClick={() => setCurrentStep(prev => Math.min(steps.length, prev + 1))} disabled={currentStep === steps.length}>Next</button>
          <button className="btn-primary" onClick={handleSaveStep} disabled={saving}>{saving ? 'Saving…' : 'Save draft'}</button>
          <button className="btn-ai" onClick={generateAI} disabled={generating}>{generating ? 'Generating…' : 'Generate AI summary'}</button>
          <button className="btn-outline" onClick={() => exportStrategy({ name: draftName, values, aiOutput })}>Export</button>
        </div>

        {message && <p className="msg-success">{message}</p>}
        {error   && <p className="msg-error">{error}</p>}
      </div>

      {aiOutput && (
        <div className="ai-output-panel">
          <h4>AI Output</h4>
          <pre>{aiOutput}</pre>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            {aiParsed && <button className="btn-outline" onClick={populateFromAI}>Populate fields from AI</button>}
            <button className="btn-outline" onClick={saveAiSummaryToDraft}>Save AI summary to draft</button>
          </div>
        </div>
      )}
    </div>
  )
}

Strategy.pageTitle = 'Strategy Builder'
