import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import { exportStrategy } from '../../lib/exportStrategy'
import { steps, emptyInputs } from '../../lib/steps'

export default function DraftDetail() {
  const router = useRouter()
  const { id } = router.query
  const [strategy, setStrategy]     = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [draftName, setDraftName]   = useState('')
  const [values, setValues]         = useState(emptyInputs)
  const [saving, setSaving]         = useState(false)
  const [message, setMessage]       = useState('')
  const [generating, setGenerating] = useState(false)
  const [aiOutput, setAiOutput]     = useState('')
  const [aiParsed, setAiParsed]     = useState(null)

  const currentStepConfig = useMemo(() => steps.find(s => s.id === currentStep), [currentStep])

  useEffect(() => {
    if (!id) return
    let mounted = true
    async function fetchStrategy() {
      const { data } = await supabase.auth.getSession()
      const token = data?.session?.access_token
      if (!token) { if (mounted) { setError('Sign in to view drafts.'); setLoading(false) } return }
      const res = await fetch(`/api/strategies/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      const payload = await res.json()
      if (res.ok && payload.strategy) {
        const s = payload.strategy
        if (mounted) {
          setStrategy(s)
          setDraftName(s.name || '')
          setValues({
            businessContext:      s.inputs?.businessContext      || '',
            competitiveAdvantage: s.inputs?.competitiveAdvantage || '',
            targetAudience:       s.inputs?.targetAudience       || '',
            initiatives:          s.inputs?.initiatives          || '',
            metrics:              s.inputs?.metrics              || ''
          })
          if (s.inputs?.ai_summary) setAiOutput(s.inputs.ai_summary)
        }
      } else if (mounted) setError(payload.error || 'Unable to load draft')
      if (mounted) setLoading(false)
    }
    fetchStrategy()
    return () => { mounted = false }
  }, [id])

  async function handleSave() {
    setSaving(true); setMessage('')
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token
    if (!token) { setError('Sign in required.'); setSaving(false); return }
    const res = await fetch(`/api/strategies/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: draftName.trim() || strategy.name, inputs: values })
    })
    const payload = await res.json()
    if (res.ok) setMessage('Draft saved.')
    else setError(payload.error || 'Unable to save draft')
    setSaving(false)
  }

  async function generateSummary() {
    setGenerating(true); setAiOutput('')
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token
    if (!token) { setError('Sign in required.'); setGenerating(false); return }
    try {
      const res = await fetch('/api/anthropic/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: draftName || strategy?.name, inputs: values })
      })
      const payload = await res.json()
      if (res.ok) { setAiOutput(payload.completion); setAiParsed(payload.parsed ?? null) }
      else setError(payload.error || 'Unable to generate summary')
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
    const { data: sessionData } = await supabase.auth.getSession()
    const token = sessionData?.session?.access_token
    if (!token) return setError('Sign in required')
    const inputs = { ...values, ai_summary: aiOutput }
    const res = await fetch(`/api/strategies/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ inputs })
    })
    const payload = await res.json()
    if (res.ok) setMessage('AI summary saved to draft.')
    else setError(payload.error || 'Unable to save AI summary')
  }

  if (loading) return <div style={{ color: 'var(--ns-charcoal)' }}>Loading draft…</div>
  if (error && !strategy) return <p className="msg-error">{error}</p>
  if (!strategy) return <p style={{ color: 'var(--ns-charcoal)' }}>Draft not found.</p>

  return (
    <div style={{ maxWidth: 860 }}>
      <p style={{ marginBottom: 16 }}>
        <Link href="/drafts" style={{ fontSize: 12, color: 'var(--ns-blue)', textDecoration: 'none', fontWeight: 600 }}>← Back to drafts</Link>
      </p>

      <div className="panel">
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--ns-charcoal)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Draft name</label>
          <input type="text" value={draftName} onChange={e => setDraftName(e.target.value)} />
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
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
          <button className="btn-ai" onClick={generateSummary} disabled={generating}>{generating ? 'Generating…' : 'Generate AI summary'}</button>
          <button className="btn-outline" onClick={() => exportStrategy({ name: draftName || strategy?.name, values, aiOutput })}>Export</button>
        </div>

        {message && <p className="msg-success">{message}</p>}
        {error   && <p className="msg-error">{error}</p>}
      </div>

      {aiOutput && (
        <div className="ai-output-panel">
          <h4>AI-generated summary</h4>
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

DraftDetail.pageTitle = 'Edit Draft'
