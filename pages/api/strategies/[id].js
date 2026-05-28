import { supabaseAdmin } from '../../../lib/supabaseServer'

export default async function handler(req, res) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ error: 'Missing access token' })
  }

  const strategyId = req.query.id
  if (!strategyId) {
    return res.status(400).json({ error: 'Strategy ID is required' })
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

    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('strategies')
        .select('id,name,inputs,created_at,updated_at')
        .eq('id', strategyId)
        .eq('user_id', user.id)
        .limit(1)

      if (error) {
        return res.status(500).json({ error: error.message })
      }

      return res.status(200).json({ strategy: data?.[0] ?? null })
    }

      if (req.method === 'PATCH') {
        const { inputs, name } = req.body || {}
        if (!inputs && !name) {
          return res.status(400).json({ error: 'Nothing to update' })
        }

        const updatePayload = {}
        if (inputs) updatePayload.inputs = inputs
        if (name) updatePayload.name = name

        const { data, error } = await supabaseAdmin
          .from('strategies')
          .update(updatePayload)
          .eq('id', strategyId)
          .eq('user_id', user.id)
          .select()

        if (error) return res.status(500).json({ error: error.message })
        return res.status(200).json({ strategy: data?.[0] ?? null })
      }

    if (req.method === 'DELETE') {
      const { error } = await supabaseAdmin
        .from('strategies')
        .delete()
        .eq('id', strategyId)
        .eq('user_id', user.id)

      if (error) return res.status(500).json({ error: error.message })
      return res.status(200).json({ deleted: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
}
