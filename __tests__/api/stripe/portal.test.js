import handler from '../../../pages/api/stripe/create-portal-session'
import { supabaseAdmin } from '../../../lib/supabaseServer'

jest.mock('../../../lib/supabaseServer', () => ({
  supabaseAdmin: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  },
}))

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    billingPortal: {
      sessions: {
        create: jest.fn().mockResolvedValue({ url: 'https://billing.stripe.com/session/test' }),
      },
    },
  }))
})

function chain(result = { data: null, error: null }) {
  const q = { then: (fn) => fn(result) }
  ;['select', 'eq', 'order', 'limit'].forEach(m => { q[m] = jest.fn(() => q) })
  return q
}

function res() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() }
}

beforeEach(() => jest.clearAllMocks())

test('405 for non-POST', async () => {
  const r = res()
  await handler({ method: 'GET', headers: {} }, r)
  expect(r.status).toHaveBeenCalledWith(405)
})

test('401 when no token', async () => {
  const r = res()
  await handler({ method: 'POST', headers: {} }, r)
  expect(r.status).toHaveBeenCalledWith(401)
})

test('401 when auth fails', async () => {
  supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'bad token' } })
  const r = res()
  await handler({ method: 'POST', headers: { authorization: 'Bearer x' } }, r)
  expect(r.status).toHaveBeenCalledWith(401)
})

test('404 when no subscription found', async () => {
  supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
  supabaseAdmin.from.mockReturnValue(chain({ data: [], error: null }))
  const r = res()
  await handler({ method: 'POST', headers: { authorization: 'Bearer x' } }, r)
  expect(r.status).toHaveBeenCalledWith(404)
})

test('200 with portal URL on success', async () => {
  supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
  supabaseAdmin.from.mockReturnValue(chain({ data: [{ stripe_customer_id: 'cus_test' }], error: null }))
  const r = res()
  await handler({ method: 'POST', headers: { authorization: 'Bearer x' } }, r)
  expect(r.status).toHaveBeenCalledWith(200)
  expect(r.json).toHaveBeenCalledWith({ url: 'https://billing.stripe.com/session/test' })
})
