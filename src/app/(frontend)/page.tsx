import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const session = await getSession()
  if (!session) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
        <p className="text-3xl font-black tracking-tight text-zinc-900">
          NEXUS<span className="text-blue-700">ONE</span>
        </p>
        <p className="mt-2 max-w-md text-center text-sm text-zinc-500">
          The B2B marketplace connecting verified producers with shop owners. Sign in or register
          your business to get started.
        </p>
        <div className="mt-6 flex gap-3">
          <a
            className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
            href="/login"
          >
            Sign in
          </a>
          <a
            className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
            href="/register"
          >
            Register
          </a>
        </div>
      </main>
    )
  }

  if (session.user.role === 'producer') redirect('/producer')
  if (session.user.role === 'retailer') redirect('/retailer')
  redirect('/admin')
}
