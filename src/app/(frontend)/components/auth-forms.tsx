'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login, register, type AuthResult } from '../actions/auth'

const fieldStyles =
  'w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15'
const labelStyles = 'mb-1.5 block text-xs font-semibold tracking-wide text-zinc-600'

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault()
        setBusy(true)
        setError(null)
        const result: AuthResult = await login(new FormData(event.currentTarget))
        setBusy(false)
        if (result.ok) {
          router.refresh()
          router.push('/')
        } else {
          setError(result.error ?? 'Sign in failed.')
        }
      }}
    >
      {error && (
        <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</p>
      )}
      <div>
        <label className={labelStyles} htmlFor="email">
          Work email
        </label>
        <input className={fieldStyles} id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <label className={labelStyles} htmlFor="password">
          Password
        </label>
        <input
          className={fieldStyles}
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </div>
      <button
        className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
        disabled={busy}
        type="submit"
      >
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

export function RegisterForm() {
  const router = useRouter()
  const [role, setRole] = useState<'producer' | 'retailer'>('retailer')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault()
        const form = event.currentTarget
        const data = new FormData(form)
        setBusy(true)
        setError(null)
        const result = await register({
          name: String(data.get('name') ?? ''),
          email: String(data.get('email') ?? ''),
          password: String(data.get('password') ?? ''),
          role,
          organizationName: String(data.get('organizationName') ?? ''),
          legalName: String(data.get('legalName') ?? ''),
          registrationNumber: String(data.get('registrationNumber') ?? ''),
          phone: String(data.get('phone') ?? ''),
          region: String(data.get('region') ?? ''),
          address: String(data.get('address') ?? ''),
        })
        setBusy(false)
        if (result.ok) {
          router.push('/pending-verification')
        } else {
          setError(result.error ?? 'Registration failed.')
        }
      }}
    >
      {error && (
        <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {(
          [
            { value: 'retailer', label: 'Shop owner', hint: 'I buy wholesale' },
            { value: 'producer', label: 'Producer', hint: 'I manufacture goods' },
          ] as const
        ).map((option) => (
          <button
            type="button"
            key={option.value}
            onClick={() => setRole(option.value)}
            className={`rounded-lg border px-3.5 py-3 text-left transition ${role === option.value
                ? 'border-blue-700 bg-blue-50 ring-2 ring-blue-600/15'
                : 'border-zinc-300 hover:border-zinc-400'
              }`}
          >
            <span className="block text-sm font-semibold text-zinc-900">{option.label}</span>
            <span className="block text-xs text-zinc-500">{option.hint}</span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelStyles} htmlFor="name">
            Your full name
          </label>
          <input className={fieldStyles} id="name" name="name" required />
        </div>
        <div>
          <label className={labelStyles} htmlFor="reg-email">
            Work email
          </label>
          <input className={fieldStyles} id="reg-email" name="email" type="email" required />
        </div>
        <div className="sm:col-span-2">
          <label className={labelStyles} htmlFor="reg-password">
            Password (min. 8 characters)
          </label>
          <input className={fieldStyles} id="reg-password" name="password" type="password" minLength={8} required />
        </div>
        <div className="sm:col-span-2">
          <p className="mb-2 border-t border-zinc-200 pt-4 text-xs font-bold uppercase tracking-wider text-zinc-500">
            Business details
          </p>
        </div>
        <div>
          <label className={labelStyles} htmlFor="organizationName">
            Business name
          </label>
          <input className={fieldStyles} id="organizationName" name="organizationName" required />
        </div>
        <div>
          <label className={labelStyles} htmlFor="legalName">
            Legal name
          </label>
          <input className={fieldStyles} id="legalName" name="legalName" required />
        </div>
        <div>
          <label className={labelStyles} htmlFor="registrationNumber">
            Registration number
          </label>
          <input className={fieldStyles} id="registrationNumber" name="registrationNumber" required />
        </div>
        <div>
          <label className={labelStyles} htmlFor="phone">
            Phone
          </label>
          <input className={fieldStyles} id="phone" name="phone" required />
        </div>
        <div>
          <label className={labelStyles} htmlFor="region">
            Region / city
          </label>
          <input className={fieldStyles} id="region" name="region" required />
        </div>
        <div>
          <label className={labelStyles} htmlFor="address">
            Address
          </label>
          <input className={fieldStyles} id="address" name="address" required />
        </div>
      </div>

      <button
        className="w-full rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
        disabled={busy}
        type="submit"
      >
        {busy ? 'Submitting…' : 'Create account'}
      </button>
      <p className="text-center text-xs text-zinc-500">
        Your business will be reviewed by platform administrators before activation.
      </p>
    </form>
  )
}
