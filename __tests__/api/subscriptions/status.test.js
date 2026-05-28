import handler from '../../../pages/api/subscriptions/status'
import { supabaseAdmin } from '../../../lib/supabaseServer'

jest.mock('../../../lib/supabaseServer', () => ({
  supabaseAdmin: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  },
}))

function chain(result = { data: null, error: null }) {
  const q = { then: (fn) => fn(result) }
  ;['select', 'eq', 'order', 'limit'].forEach(m => { q[m] = jest.fn(() => q) })
  return q
}

function res() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() }
}

beforeEach(() => jest.clearAllMocks())

test('401 when no token', async () => {
  const r = res()
  await handler({ headers: {} }, r)
  expect(r.status).toHaveBeenCalledWith(401)
})

test('401 when auth fails', async () => {
  supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'bad token' } })
  const r = res()
  await handler({ headers: { authorization: 'Bearer x' } }, r)
  expect(r.status).toHaveBeenCalledWith(401)
})

test('200 with user and active subscription', async () => {
  const user = { id: 'u1', email: 'test@example.com' }
  const subscription = { id: 'sub1', status: 'active' }
  supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user }, error: null })
  supabaseAdmin.from.mockReturnValue(chain({ data: [subscription], error: null }))
  const r = res()
  await handler({ headers: { authorization: 'Bearer x' } }, r)
  expect(r.status).toHaveBeenCalledWith(200)
  expect(r.json).toHaveBeenCalledWith({ user, subscription })
})

test('200 with null subscription when none exists', async () => {
  const user = { id: 'u1', email: 'test@example.com' }
  supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user }, error: null })
  supabaseAdmin.from.mockReturnValue(chain({ data: [], error: null }))
  const r = res()
  await handler({ headers: { authorization: 'Bearer x' } }, r)
  expect(r.status).toHaveBeenCalledWith(200)
  expect(r.json).toHaveBeenCalledWith({ user, subscription: null })
})
