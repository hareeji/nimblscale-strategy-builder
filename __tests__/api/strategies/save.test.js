import handler from '../../../pages/api/strategies/save'
import { supabaseAdmin } from '../../../lib/supabaseServer'

jest.mock('../../../lib/supabaseServer', () => ({
  supabaseAdmin: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  },
}))

function chain(result = { data: null, error: null }) {
  const q = { then: (fn) => fn(result) }
  ;['select', 'eq', 'order', 'limit', 'insert', 'update', 'delete'].forEach(m => {
    q[m] = jest.fn(() => q)
  })
  return q
}

function res() {
  const r = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() }
  return r
}

beforeEach(() => jest.clearAllMocks())

test('405 for non-POST', async () => {
  const r = res()
  await handler({ method: 'GET', headers: {}, body: {} }, r)
  expect(r.status).toHaveBeenCalledWith(405)
})

test('401 when no token', async () => {
  const r = res()
  await handler({ method: 'POST', headers: {}, body: {} }, r)
  expect(r.status).toHaveBeenCalledWith(401)
})

test('401 when auth fails', async () => {
  supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: 'bad token' } })
  const r = res()
  await handler({ method: 'POST', headers: { authorization: 'Bearer x' }, body: { name: 'N', inputs: {} } }, r)
  expect(r.status).toHaveBeenCalledWith(401)
})

test('400 when name missing', async () => {
  supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
  const r = res()
  await handler({ method: 'POST', headers: { authorization: 'Bearer x' }, body: { inputs: {} } }, r)
  expect(r.status).toHaveBeenCalledWith(400)
})

test('400 when inputs missing', async () => {
  supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
  const r = res()
  await handler({ method: 'POST', headers: { authorization: 'Bearer x' }, body: { name: 'N' } }, r)
  expect(r.status).toHaveBeenCalledWith(400)
})

test('200 with strategy on success', async () => {
  const strategy = { id: 's1', name: 'N', inputs: {} }
  supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
  supabaseAdmin.from.mockReturnValue(chain({ data: [strategy], error: null }))
  const r = res()
  await handler(
    { method: 'POST', headers: { authorization: 'Bearer x' }, body: { name: 'N', inputs: { businessContext: 'ctx' } } },
    r
  )
  expect(r.status).toHaveBeenCalledWith(200)
  expect(r.json).toHaveBeenCalledWith({ strategy })
})

test('500 on DB error', async () => {
  supabaseAdmin.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
  supabaseAdmin.from.mockReturnValue(chain({ data: null, error: { message: 'db error' } }))
  const r = res()
  await handler(
    { method: 'POST', headers: { authorization: 'Bearer x' }, body: { name: 'N', inputs: {} } },
    r
  )
  expect(r.status).toHaveBeenCalledWith(500)
})
