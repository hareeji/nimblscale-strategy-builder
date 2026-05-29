import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function createNoopAdmin() {
  const err = { message: 'Missing Supabase server env vars' }
  const terminal = async () => ({ data: null, error: err })
  const noopQuery = {}
  ;['select', 'eq', 'order', 'limit', 'insert', 'update', 'delete', 'upsert'].forEach(m => {
    noopQuery[m] = () => noopQuery
  })
  noopQuery.then = (fn) => fn({ data: null, error: err })
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: err }),
      admin: {
        listUsers: terminal,
        updateUserById: terminal,
      }
    },
    from: () => ({ ...noopQuery })
  }
}

export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false } })
  : createNoopAdmin()
