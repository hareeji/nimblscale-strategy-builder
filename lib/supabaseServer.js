import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function createNoopAdmin() {
  const noopQuery = {
    select: async () => ({ data: null, error: { message: 'Missing Supabase server env vars' } }),
    eq: () => noopQuery,
    limit: () => noopQuery,
    order: () => noopQuery,
    upsert: async () => ({ data: null, error: { message: 'Missing Supabase server env vars' } })
  }
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: { message: 'Missing Supabase server env vars' } })
    },
    from: () => noopQuery
  }
}

export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false } })
  : createNoopAdmin()
