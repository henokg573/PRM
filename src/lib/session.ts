import { cookies } from 'next/headers'
import { getSupabase, type AppUser, type Organization } from '@/lib/supabase'
import { createHash, randomBytes } from 'crypto'

const SESSION_COOKIE = 'prm-session'
const SESSION_DAYS = 7

/** Hash session tokens before storing them in the database. */
function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export type Session = {
  user: Pick<AppUser, 'id' | 'name' | 'email' | 'role' | 'status'>
  organization: Organization | null
}

/** Create a session row and set the cookie. Returns the raw token for the cookie. */
export async function createSession(userID: string) {
  const raw = randomBytes(32).toString('hex')
  const supabase = getSupabase()
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  const { error } = await supabase
    .from('sessions')
    .insert({ token: hashToken(raw), user_id: userID, expires_at: expires.toISOString() })
  if (error) throw new Error(error.message)

  const store = await cookies()
  store.set(SESSION_COOKIE, raw, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires,
  })
}

export async function destroySession() {
  const store = await cookies()
  const raw = store.get(SESSION_COOKIE)?.value
  if (raw) {
    await getSupabase().from('sessions').delete().eq('token', hashToken(raw))
  }
  store.delete(SESSION_COOKIE)
}

/** Resolve the signed-in user + organization from the session cookie, or null. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies()
  const raw = store.get(SESSION_COOKIE)?.value
  if (!raw) return null

  const supabase = getSupabase()
  const { data: sessionRow } = await supabase
    .from('sessions')
    .select('user_id, expires_at')
    .eq('token', hashToken(raw))
    .maybeSingle()

  if (!sessionRow || new Date(sessionRow.expires_at) < new Date()) {
    return null
  }

  const { data: user } = await supabase
    .from('app_users')
    .select('id, name, email, role, status, organization_id')
    .eq('id', sessionRow.user_id)
    .maybeSingle()

  if (!user) return null

  let organization: Organization | null = null
  if (user.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', user.organization_id)
      .maybeSingle()
    organization = org ?? null
  }

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
    organization,
  }
}
