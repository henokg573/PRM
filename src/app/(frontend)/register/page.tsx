import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { RegisterForm } from '../components/auth-forms'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Register — NexusOne B2B' }

export default async function RegisterPage() {
  const session = await getSession()
  if (session) redirect('/')

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <p className="text-xl font-black tracking-tight text-zinc-900">
            NEXUS<span className="text-blue-700">ONE</span>
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Register your business to buy or sell at wholesale scale
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-lg font-bold text-zinc-900">Business registration</h1>
          <p className="mb-6 mt-1 text-sm text-zinc-500">
            All registrations are reviewed by platform administrators before activation.
          </p>
          <RegisterForm />
        </div>
        <p className="mt-5 text-center text-sm text-zinc-500">
          Already registered?{' '}
          <Link className="font-semibold text-blue-700 hover:underline" href="/login">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
