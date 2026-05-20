import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url, key)

export async function trackRegister(data: {
  name: string
  email: string
  mobile?: string
  device?: string
}) {
  try {
    await supabase.from('users').insert({
      name: data.name,
      email: data.email,
      mobile: data.mobile || null,
      device: data.device || 'Unknown',
      registered_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      login_count: 1,
    })
  } catch {
    // Silent fail
  }
}

export async function trackLogin(email: string) {
  try {
    // Update last login time
    await supabase
      .from('users')
      .update({
        last_login: new Date().toISOString(),
        login_count: supabase.rpc('increment', { row_email: email }),
      })
      .eq('email', email)
  } catch {
    // Silent fail
  }
}