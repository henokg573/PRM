import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { LoginForm } from '../components/auth-forms'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Sign in — NexusOne B2B' }

export default async function LoginPage() {
  const session = await getSession()
  if (session) redirect('/')

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-xl font-black tracking-tight text-zinc-900">
            NEXUS<span className="text-blue-700">ONE</span>
          </p>
          <p className="mt-1 text-sm text-zinc-500">B2B wholesale marketplace</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-lg font-bold text-zinc-900">Sign in</h1>
          <p className="mb-6 mt-1 text-sm text-zinc-500">
            Access your producer, retailer, or administrator workspace.
          </p>
          <LoginForm />
        </div>
        <p className="mt-5 text-center text-sm text-zinc-500">
          New to NexusOne?{' '}
          <Link className="font-semibold text-blue-700 hover:underline" href="/register">
            Register your business
          </Link>
        </p>
      </div>
    </main>
  )
}
