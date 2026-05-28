import handler from '../../../pages/api/strategies/list'
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

test('405 for non-GET', async () => {
  const r = res()
  await handler({ method: 'POST', headers: {}, body: {} }, r)
  expect(r.status).toHaveBeenCalledWith(405)
})

test('401 when no token', async () => {
  const r = res()
  await handler({ method: 'GET', headers: {} }, r)
  expect(r.status).toHaveBeenCalledWith(401)
})

test('200 with strategies array', async () => {
  const strategies = [{ id: 's1', name: 'Test', created_at: '2026-01-01' }]
  supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
  supabaseAdmin.from.mockReturnValue(chain({ data: strategies, error: null }))
  const r = res()
  await handler({ method: 'GET', headers: { authorization: 'Bearer x' } }, r)
  expect(r.status).toHaveBeenCalledWith(200)
  expect(r.json).toHaveBeenCalledWith({ strategies })
})

test('500 on DB error', async () => {
  supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
  supabaseAdmin.from.mockReturnValue(chain({ data: null, error: { message: 'db error' } }))
  const r = res()
  await handler({ method: 'GET', headers: { authorization: 'Bearer x' } }, r)
  expect(r.status).toHaveBeenCalledWith(500)
})
