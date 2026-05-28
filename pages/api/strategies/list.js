import { supabaseAdmin } from '../../../lib/supabaseServer'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ error: 'Missing access token' })
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

    const { data, error } = await supabaseAdmin
      .from('strategies')
      .select('id,name,created_at,updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    return res.status(200).json({ strategies: data })
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
}
