import handler from '../../../pages/api/strategies/[id]'
import { supabaseAdmin } from '../../../lib/supabaseServer'

jest.mock('../../../lib/supabaseServer', () => ({
  supabaseAdmin: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  },
}))

function chain(result = { data: null, error: null }) {
  const q = { then: (fn) => fn(result) }
  ;['select', 'eq', 'order', 'limit', 'update', 'delete'].forEach(m => { q[m] = jest.fn(() => q) })
  return q
}

function res() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() }
}

const authOk = { data: { user: { id: 'u1' } }, error: null }

beforeEach(() => jest.clearAllMocks())

test('401 when no token', async () => {
  const r = res()
  await handler({ method: 'GET', headers: {}, query: { id: 's1' } }, r)
  expect(r.status).toHaveBeenCalledWith(401)
})

test('GET returns strategy', async () => {
  const strategy = { id: 's1', name: 'Test', inputs: {} }
  supabaseAdmin.auth.getUser.mockResolvedValue(authOk)
  supabaseAdmin.from.mockReturnValue(chain({ data: [strategy], error: null }))
  const r = res()
  await handler({ method: 'GET', headers: { authorization: 'Bearer x' }, query: { id: 's1' } }, r)
  expect(r.status).toHaveBeenCalledWith(200)
  expect(r.json).toHaveBeenCalledWith({ strategy })
})

test('PATCH updates strategy', async () => {
  const updated = { id: 's1', name: 'New', inputs: {} }
  supabaseAdmin.auth.getUser.mockResolvedValue(authOk)
  supabaseAdmin.from.mockReturnValue(chain({ data: [updated], error: null }))
  const r = res()
  await handler(
    { method: 'PATCH', headers: { authorization: 'Bearer x' }, query: { id: 's1' }, body: { name: 'New' } },
    r
  )
  expect(r.status).toHaveBeenCalledWith(200)
  expect(r.json).toHaveBeenCalledWith({ strategy: updated })
})

test('PATCH 400 when nothing to update', async () => {
  supabaseAdmin.auth.getUser.mockResolvedValue(authOk)
  const r = res()
  await handler(
    { method: 'PATCH', headers: { authorization: 'Bearer x' }, query: { id: 's1' }, body: {} },
    r
  )
  expect(r.status).toHaveBeenCalledWith(400)
})

test('DELETE removes strategy', async () => {
  supabaseAdmin.auth.getUser.mockResolvedValue(authOk)
  supabaseAdmin.from.mockReturnValue(chain({ data: null, error: null }))
  const r = res()
  await handler({ method: 'DELETE', headers: { authorization: 'Bearer x' }, query: { id: 's1' } }, r)
  expect(r.status).toHaveBeenCalledWith(200)
  expect(r.json).toHaveBeenCalledWith({ deleted: true })
})

test('405 for unsupported method', async () => {
  supabaseAdmin.auth.getUser.mockResolvedValue(authOk)
  const r = res()
  await handler({ method: 'PUT', headers: { authorization: 'Bearer x' }, query: { id: 's1' } }, r)
  expect(r.status).toHaveBeenCalledWith(405)
})
