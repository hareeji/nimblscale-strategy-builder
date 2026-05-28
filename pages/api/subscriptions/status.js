import { supabaseAdmin } from '../../../lib/supabaseServer'

export default async function handler(req, res) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Missing access token' })

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token)
    if (error) return res.status(401).json({ error: error.message })
    const user = data.user

    const { data: subs, error: subsErr } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (subsErr) return res.status(500).json({ error: subsErr.message })

    return res.status(200).json({ user, subscription: subs?.[0] ?? null })
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
}
