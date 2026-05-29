import Stripe from 'stripe'
import { supabaseAdmin } from '../../../lib/supabaseServer'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' })

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Missing access token' })

  try {
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token)
    if (userError) return res.status(401).json({ error: userError.message })

    const { data: subs } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userData.user.id)
      .order('updated_at', { ascending: false })
      .limit(1)

    const stripeCustomerId = subs?.[0]?.stripe_customer_id
    if (!stripeCustomerId) return res.status(404).json({ error: 'No subscription found' })

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/account`
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
