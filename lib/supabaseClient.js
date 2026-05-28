import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function createNoopAuth() {
  const noop = async () => ({ data: null, error: { message: 'Missing Supabase client env vars' } })
  return {
    getSession: async () => ({ data: { session: null } }),
    signUp: noop,
    signInWithPassword: noop,
    signOut: noop,
    onAuthStateChange: () => ({ data: null, error: null, subscription: { unsubscribe: () => {} } })
  }
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : { auth: createNoopAuth() }
