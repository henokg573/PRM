import 'server-only'
import bcrypt from 'bcryptjs'
import { getSupabase } from '@/lib/supabase'
import { createSession, destroySession } from '@/lib/session'
import { redirect } from 'next/navigation'

export type AuthResult = { ok: boolean; error?: string }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function login(formData: FormData): Promise<AuthResult> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  if (!EMAIL_RE.test(email) || !password) {
    return { ok: false, error: 'Enter a valid email and password.' }
  }

  const supabase = getSupabase()
  const { data: user } = await supabase
    .from('app_users')
    .select('id, password_hash, status')
    .eq('email', email)
    .maybeSingle()

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return { ok: false, error: 'Invalid email or password.' }
  }
  if (user.status === 'suspended' || user.status === 'terminated') {
    return { ok: false, error: 'This account has been suspended. Contact platform support.' }
  }

  await createSession(user.id)
  await supabase.from('app_users').update({ last_active_at: new Date().toISOString() }).eq('id', user.id)
  return { ok: true }
}

export type RegisterInput = {
  name: string
  email: string
  password: string
  role: 'producer' | 'retailer'
  organizationName: string
  legalName: string
  registrationNumber: string
  phone: string
  region: string
  address: string
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  const organizationName = input.organizationName.trim()
  const legalName = input.legalName.trim()
  const registrationNumber = input.registrationNumber.trim()
  const phone = input.phone.trim()
  const region = input.region.trim()
  const address = input.address.trim()

  if (name.length < 2) return { ok: false, error: 'Enter your full name.' }
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Enter a valid email address.' }
  if (input.password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' }
  if (input.role !== 'producer' && input.role !== 'retailer') {
    return { ok: false, error: 'Select a valid account type.' }
  }
  if (!organizationName || !legalName || !registrationNumber || !phone || !region || !address) {
    return { ok: false, error: 'All business fields are required.' }
  }

  const supabase = getSupabase()

  const { data: existing } = await supabase
    .from('app_users')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  if (existing) return { ok: false, error: 'An account with this email already exists.' }

  const { data: duplicateReg } = await supabase
    .from('organizations')
    .select('id')
    .eq('registration_number', registrationNumber)
    .maybeSingle()
  if (duplicateReg) {
    return { ok: false, error: 'This business registration number is already registered.' }
  }

  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .insert({
      name: organizationName,
      legal_name: legalName,
      type: input.role,
      registration_number: registrationNumber,
      phone,
      email,
      region,
      address,
      verification_status: 'pending',
    })
    .select('id')
    .single()
  if (orgError || !organization) return { ok: false, error: orgError?.message ?? 'Registration failed.' }

  const passwordHash = await bcrypt.hash(input.password, 12)
  const { data: user, error: userError } = await supabase
    .from('app_users')
    .insert({
      name,
      email,
      password_hash: passwordHash,
      role: input.role,
      status: 'pending',
      organization_id: organization.id,
    })
    .select('id')
    .single()
  if (userError || !user) return { ok: false, error: userError?.message ?? 'Registration failed.' }

  await supabase.from('notifications').insert({
    title: 'Account submitted for verification',
    body: 'Your registration was received. An administrator will review your business information before your account is activated.',
    kind: 'verification',
    user_id: user.id,
    organization_id: organization.id,
  })

  return { ok: true }
}

export async function logout() {
  await destroySession()
  redirect('/login')
}
