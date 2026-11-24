'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export type NavItem = { href: string; label: string; badge?: number }

export function DashboardShell({
  brand,
  roleLabel,
  userName,
  nav,
  unread = 0,
  logout,
  children,
}: {
  brand: string
  roleLabel: string
  userName: string
  nav: NavItem[]
  unread?: number
  logout: () => Promise<void>
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const initials = userName
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <button
            className="rounded-md border border-zinc-300 p-1.5 md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle navigation"
          >
            ☰
          </button>
          <Link href="/" className="text-lg font-black tracking-tight text-zinc-900">
            NEXUS<span className="text-blue-700">ONE</span>
            <span className="ml-2 hidden rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500 sm:inline">
              {brand}
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <Link
              href="/notifications"
              className="relative rounded-md p-2 text-zinc-500 hover:bg-zinc-100"
              aria-label="Notifications"
            >
              🔔
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Link>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-zinc-900">{userName}</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-400">{roleLabel}</p>
            </div>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-blue-700 text-xs font-bold text-white">
              {initials}
            </div>
            <form action={logout}>
              <button
                className="rounded-md border border-zinc-300 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-100"
                type="submit"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <aside className={`${open ? 'block' : 'hidden'} w-52 shrink-0 md:block`}>
          <nav className="sticky top-20 space-y-1">
            {nav.map((item) => {
              const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${active
                      ? 'bg-blue-50 text-blue-800'
                      : 'text-zinc-600 hover:bg-white hover:text-zinc-900'
                    }`}
                >
                  {item.label}
                  {item.badge ? (
                    <span className="rounded-full bg-blue-700 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              )
            })}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-zinc-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-zinc-400">{hint}</p>}
    </div>
  )
}

const statusTones: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  quotation: 'bg-sky-100 text-sky-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-indigo-100 text-indigo-800',
  dispatched: 'bg-violet-100 text-violet-800',
  'in-transit': 'bg-purple-100 text-purple-800',
  delivered: 'bg-teal-100 text-teal-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-zinc-200 text-zinc-600',
  rejected: 'bg-red-100 text-red-700',
  disputed: 'bg-rose-100 text-rose-700',
}

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusTones[status] ?? 'bg-zinc-100 text-zinc-700'
        }`}
    >
      {status.replace('-', ' ')}
    </span>
  )
}

export function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}
