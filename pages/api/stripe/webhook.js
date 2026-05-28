import Stripe from 'stripe'
import { buffer } from 'micro'
import { supabaseAdmin } from '../../../lib/supabaseServer'

export const config = { api: { bodyParser: false } }

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2022-11-15' })

async function resolveUserId(customerEmail, stripeCustomerId, metadataUserId) {
  if (metadataUserId) return metadataUserId

  if (stripeCustomerId) {
    const { data: subs, error: subErr } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', stripeCustomerId)
      .limit(1)
    if (!subErr && subs?.length) return subs[0].user_id
  }

  if (customerEmail) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()
    if (!error && data?.users) {
      const match = data.users.find(u => u.email === customerEmail)
      if (match) return match.id
    }
  }

  return null
}

async function syncSubscriptionRecord({
  stripeSubscriptionId,
  stripeCustomerId,
  userId,
  status,
  priceId,
  metadata = {}
}) {
  const payload = {
    user_id: userId,
    stripe_subscription_id: stripeSubscriptionId,
    stripe_customer_id: stripeCustomerId,
    status,
    price_id: priceId,
    metadata,
    updated_at: new Date().toISOString()
  }

  const { error: upsertErr } = await supabaseAdmin.from('subscriptions').upsert(payload, {
    onConflict: 'stripe_subscription_id'
  })

  if (upsertErr) {
    console.error('Subscription upsert error', upsertErr)
  }

  if (userId) {
    const { error: userErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      data: {
        subscription_status: status,
        subscription_price_id: priceId || null
      }
    })
    if (userErr) console.error('User metadata update error', userErr)
  }
}

async function resolveCustomerSubscription(event) {
  if (event.data.object.subscription) {
    return stripe.subscriptions.retrieve(event.data.object.subscription)
  }
  if (event.data.object.id) {
    return event.data.object
  }
  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const sig = req.headers['stripe-signature']
  const buf = await buffer(req)
  let event

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`)
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const stripeSubscriptionId = session.subscription
        const stripeCustomerId = session.customer
        const customerEmail = session.customer_email
        const priceId = session.display_items?.[0]?.price?.id || session.metadata?.price_id || null
        const userId = await resolveUserId(customerEmail, stripeCustomerId, session.metadata?.supabase_user_id)

        await syncSubscriptionRecord({
          stripeSubscriptionId,
          stripeCustomerId,
          userId,
          status: 'active',
          priceId,
          metadata: session.metadata || {}
        })
        break
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'invoice.payment_failed':
      case 'invoice.payment_succeeded': {
        const subscription = await resolveCustomerSubscription(event)
        if (!subscription) break

        const stripeSubscriptionId = subscription.id
        const stripeCustomerId = subscription.customer
        const status = subscription.status || (event.type === 'customer.subscription.deleted' ? 'canceled' : 'unknown')
        const priceId = subscription.items?.data?.[0]?.price?.id || null
        const userId = await resolveUserId(null, stripeCustomerId)

        await syncSubscriptionRecord({
          stripeSubscriptionId,
          stripeCustomerId,
          userId,
          status,
          priceId,
          metadata: subscription.metadata || {}
        })
        break
      }
      default:
        console.log(`Unhandled webhook event type: ${event.type}`)
    }
  } catch (e) {
    console.error('Webhook handling error', e)
    return res.status(500).send('Webhook handler error')
  }

  res.json({ received: true })
}
