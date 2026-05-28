import { supabaseAdmin } from '../../../lib/supabaseServer'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ error: 'Missing access token' })
  }

  const { name, inputs } = req.body || {}
  if (!name || !inputs || typeof inputs !== 'object') {
    return res.status(400).json({ error: 'name and inputs are required' })
  }

  try {
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError) {
      return res.status(401).json({ error: userError.message })
    }

    const user = userData.user
    if (!user) {
      return res.status(401).json({ error: 'User not authenticated' })
    }

    const { data, error } = await supabaseAdmin.from('strategies').insert([{ user_id: user.id, name, inputs }]).select()
    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ strategy: data?.[0] ?? null })
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
}
