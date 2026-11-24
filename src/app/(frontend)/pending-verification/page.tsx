import Link from 'next/link'

export const metadata = { title: 'Verification pending — NexusOne B2B' }

export default function PendingVerificationPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full bg-amber-100 text-xl">
          ⏳
        </div>
        <h1 className="text-lg font-bold text-zinc-900">Application submitted</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Thank you for registering your business. A platform administrator will review your
          business information and verification documents. You will be able to sign in once your
          account is approved.
        </p>
        <Link
          className="mt-6 inline-block rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
          href="/login"
        >
          Return to sign in
        </Link>
      </div>
    </main>
  )
}
