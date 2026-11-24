import { getSession, type Session } from '@/lib/session'
import { redirect } from 'next/navigation'

/** Guard for role-gated pages. Redirects when unauthorised. */
export async function requireRole(role: 'producer' | 'retailer'): Promise<Session> {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.user.role !== role) redirect('/')
  return session
}

export async function requireSession(): Promise<Session> {
  const session = await getSession()
  if (!session) redirect('/login')
  return session
}
