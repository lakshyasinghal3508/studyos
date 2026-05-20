import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url, key)

const AUTH_KEY = 'studyos_auth'

// ── Register ──────────────────────────────────────────────────
export async function registerUser(data: {
  name: string; email: string; mobile: string
  dob: string; passwordHash: string; device: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Check duplicate email
    const { data: existingEmail } = await supabase
      .from('users').select('email').eq('email', data.email.toLowerCase()).maybeSingle()
    if (existingEmail) return { success: false, error: 'Email already registered. Please sign in.' }

    // Check duplicate mobile
    const { data: existingMobile } = await supabase
      .from('users').select('mobile').eq('mobile', data.mobile).maybeSingle()
    if (existingMobile) return { success: false, error: 'Mobile already registered. Please sign in.' }

    // Insert
    const { error } = await supabase.from('users').insert({
      name: data.name,
      email: data.email.toLowerCase(),
      mobile: data.mobile,
      dob: data.dob,
      password_hash: data.passwordHash,
      device: data.device,
      registered_at: new Date().toISOString(),
      last_login: new Date().toISOString(),
      login_count: 1,
    })
    if (error) throw error

    // Cache locally
    localStorage.setItem(AUTH_KEY, JSON.stringify({
      name: data.name, email: data.email.toLowerCase(),
      mobile: data.mobile, dob: data.dob, passwordHash: data.passwordHash,
    }))

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message || 'Registration failed' }
  }
}

// ── Login ─────────────────────────────────────────────────────
export async function loginUser(email: string, passwordHash: string): Promise<{
  success: boolean; user?: any; error?: string
}> {
  try {
    // Check local cache first
    const cached = localStorage.getItem(AUTH_KEY)
    if (cached) {
      const auth = JSON.parse(cached)
      if (auth.email === email.toLowerCase() && auth.passwordHash === passwordHash) {
        return { success: true, user: auth }
      }
    }

    // Check Supabase
    const { data: user, error } = await supabase
      .from('users').select('*').eq('email', email.toLowerCase()).maybeSingle()

    if (error || !user) return { success: false, error: 'Account not found. Please register first.' }
    if (user.password_hash !== passwordHash) return { success: false, error: 'Wrong password. Try again.' }

    // Update last login
    await supabase.from('users')
      .update({ last_login: new Date().toISOString(), login_count: (user.login_count || 0) + 1 })
      .eq('email', email.toLowerCase())

    // Save to cache
    localStorage.setItem(AUTH_KEY, JSON.stringify({
      name: user.name, email: user.email,
      mobile: user.mobile, dob: user.dob, passwordHash: user.password_hash,
    }))

    return { success: true, user }
  } catch (err: any) {
    return { success: false, error: err.message || 'Login failed' }
  }
}

// ── Verify identity for forgot password ───────────────────────
export async function verifyIdentity(email: string, dob: string): Promise<{
  success: boolean; error?: string
}> {
  try {
    const { data: user } = await supabase
      .from('users').select('dob').eq('email', email.toLowerCase()).maybeSingle()
    if (!user) return { success: false, error: 'Email not found.' }
    if (user.dob !== dob) return { success: false, error: 'Date of birth does not match.' }
    return { success: true }
  } catch {
    return { success: false, error: 'Verification failed. Try again.' }
  }
}

// ── Reset password ────────────────────────────────────────────
export async function resetPassword(email: string, newHash: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('users')
      .update({ password_hash: newHash })
      .eq('email', email.toLowerCase())
    if (error) throw error

    // Update cache
    const cached = localStorage.getItem(AUTH_KEY)
    if (cached) {
      const auth = JSON.parse(cached)
      localStorage.setItem(AUTH_KEY, JSON.stringify({ ...auth, passwordHash: newHash }))
    }
    return true
  } catch { return false }
}
