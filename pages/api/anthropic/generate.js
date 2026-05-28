import Ajv from 'ajv'
import { supabaseAdmin } from '../../../lib/supabaseServer'

const ajv = new Ajv({ allErrors: true })

const schema = {
  type: 'object',
  properties: {
    businessContext: { type: 'string' },
    competitiveAdvantage: { type: 'string' },
    targetAudience: { type: 'string' },
    initiatives: { type: 'string' },
    metrics: { type: 'string' },
    summary: { type: 'string' },
    recommendations: { type: 'array', items: { type: 'string' } },
    kpi: { type: 'string' }
  },
  required: ['summary', 'recommendations', 'kpi'],
  additionalProperties: false
}

const validate = ajv.compile(schema)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Missing access token' })

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError) return res.status(401).json({ error: userError.message })

  const { data: subs } = await supabaseAdmin
    .from('subscriptions')
    .select('status')
    .eq('user_id', userData.user.id)
    .order('updated_at', { ascending: false })
    .limit(1)

  if (subs?.[0]?.status !== 'active') {
    return res.status(403).json({ error: 'Active subscription required' })
  }

  const { name, inputs } = req.body || {}
  if (!inputs || typeof inputs !== 'object') {
    return res.status(400).json({ error: 'Inputs are required' })
  }

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY
  const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001'
  if (!anthropicApiKey) {
    return res.status(500).json({ error: 'Missing Anthropic API key' })
  }

  const systemPrompt = [
    `You are an AI strategy assistant for NimblShift Consulting's NimblScale platform.`,
    `Generate a concise, practical business strategy summary and recommended next steps based on the user's inputs.`,
    `Respond with a short executive summary, three strategic recommendations, and one key KPI to monitor.`,

    `FEW-SHOT EXAMPLES (use these as formatting examples):`,

    `Example 1 - SaaS:\nBusiness Context: A SaaS company for small retailers with inventory management.\nCompetitive Advantage: Simple UX and lower price point.\nTarget Audience: Small retail owners with 1-5 locations.\nStrategic Initiatives: Partner integrations, content marketing, free trials.\nMetrics & Outcomes: Increase MRR by 20% in 12 months.\n\nJSON:\n{"businessContext":"A SaaS product helping small retailers manage inventory with simple UX","competitiveAdvantage":"Lower price and simpler UX than competitors","targetAudience":"Small retail owners with 1-5 locations","initiatives":"Integrations, content marketing, free trials","metrics":"Increase MRR by 20% in 12 months","summary":"Focus on distribution and retention via integrations and trials","recommendations":["Build partner integrations with POS systems","Offer 30-day free trials with onboarding","Create content targeting small retailers"],"kpi":"MRR growth rate"}`,

    `Example 2 - Local Retail:\nBusiness Context: A family-owned coffee shop expanding to catering.\nCompetitive Advantage: Specialty blends and strong local brand.\nTarget Audience: Office managers and local event planners.\nStrategic Initiatives: Catering packages, local SEO, partnerships with offices.\nMetrics & Outcomes: Add 2 catering contracts per month.\n\nJSON:\n{"businessContext":"Family-owned coffee shop expanding into catering","competitiveAdvantage":"Unique specialty blends and loyal local customers","targetAudience":"Office managers and local event planners","initiatives":"Catering packages, local SEO, office partnerships","metrics":"Secure 2 catering contracts per month","summary":"Leverage local reputation to sell catering to offices","recommendations":["Create catering menu and pricing","Target offices with sample drop-offs","Optimize local SEO and Google Business profile"],"kpi":"Number of catering contracts"}`,

    `Example 3 - B2B Services:\nBusiness Context: A B2B consulting firm focused on operational efficiency for mid-market firms.\nCompetitive Advantage: Deep domain expertise and proprietary frameworks.\nTarget Audience: Operations leaders at mid-market companies.\nStrategic Initiatives: Workshops, case studies, targeted outreach.\nMetrics & Outcomes: Close 5 new clients in 6 months.\n\nJSON:\n{"businessContext":"B2B consulting firm offering operational efficiency services","competitiveAdvantage":"Proprietary frameworks and deep domain expertise","targetAudience":"Operations leaders at mid-market companies","initiatives":"Workshops, case studies, targeted outreach","metrics":"Close 5 new clients in 6 months","summary":"Demonstrate ROI via workshops and case studies to acquire clients","recommendations":["Run free workshops for target firms","Publish case studies with quantified results","Use targeted outbound outreach to operations leaders"],"kpi":"New clients closed"}`,

    `INSTRUCTIONS: Output EXACTLY one JSON object following the example schema above and nothing else. Do not include any explanatory text, markdown, or backticks. Use plain strings; ensure the JSON parses correctly.`,
  ].join('\n\n')

  const userContent = [
    `Name: ${name || 'Untitled strategy'}`,
    `Business Context: ${inputs.businessContext || 'N/A'}`,
    `Competitive Advantage: ${inputs.competitiveAdvantage || 'N/A'}`,
    `Target Audience: ${inputs.targetAudience || 'N/A'}`,
    `Strategic Initiatives: ${inputs.initiatives || 'N/A'}`,
    `Metrics & Outcomes: ${inputs.metrics || 'N/A'}`,
  ].join('\n')

  async function callAnthropic(messages) {
    return fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({ model, max_tokens: 800, system: systemPrompt, messages })
    })
  }

  const extractJson = (s) => {
    try {
      const first = s.indexOf('{')
      const last = s.lastIndexOf('}')
      if (first !== -1 && last !== -1 && last > first) {
        return JSON.parse(s.slice(first, last + 1))
      }
    } catch (e) {
      return null
    }
    return null
  }

  try {
    const messages = [{ role: 'user', content: userContent }]
    let response = await callAnthropic(messages)

    if (!response.ok) {
      const bodyText = await response.text()
      return res.status(response.status).json({ error: `Anthropic error: ${bodyText}` })
    }

    const result = await response.json()
    let text = result.content?.[0]?.text || ''

    let parsed = extractJson(text)
    let valid = parsed && validate(parsed)

    if (!valid) {
      const retryMessages = [
        { role: 'user', content: userContent },
        { role: 'assistant', content: text },
        { role: 'user', content: `The previous output did not parse as valid JSON matching the schema. Respond ONLY with a single valid JSON object that conforms to the schema: ${JSON.stringify(schema)}.` }
      ]
      response = await callAnthropic(retryMessages)
      if (response.ok) {
        const retryResult = await response.json()
        const retryText = retryResult.content?.[0]?.text || ''
        const retryParsed = extractJson(retryText)
        if (retryParsed && validate(retryParsed)) {
          parsed = retryParsed
          text = retryText
          valid = true
        }
      }
    }

    const ajvErrors = valid ? null : validate.errors || null

    supabaseAdmin.from('ai_logs').insert({
      user_id: userData.user.id,
      strategy_name: name || null,
      inputs,
      completion: text,
      parsed: parsed || null,
      valid: Boolean(valid),
      parse_error: valid ? null : JSON.stringify(ajvErrors)
    }).then(({ error }) => { if (error) console.error('ai_logs insert error', error) })

    return res.status(200).json({ completion: text, parsed, valid: Boolean(valid), ajvErrors })
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
}
