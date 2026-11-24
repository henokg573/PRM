import { requireRole } from '../actions/guard'
import { getSupabase, type Order, type Organization } from '@/lib/supabase'
import { DashboardShell, PageHeader, StatCard, StatusPill, money } from '@/components/dashboard-shell'
import { logout } from '../actions/auth'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Retailer dashboard — NexusOne B2B' }

export default async function RetailerPage() {
  const session = await requireRole('retailer')
  const orgID = session.organization?.id ?? ''
  const supabase = getSupabase()

  const [{ data: recent }, { count: pending }, { count: inFulfilment }, { count: completed }, { data: totals }, { count: unread }] =
    await Promise.all([
      supabase
        .from('orders')
        .select('*, producer:organizations!orders_producer_id_fkey(name)')
        .eq('buyer_id', orgID)
        .order('created_at', { ascending: false })
        .limit(6),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('buyer_id', orgID)
        .in('status', ['pending', 'quotation', 'confirmed']),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('buyer_id', orgID)
        .in('status', ['preparing', 'dispatched', 'in-transit']),
      supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('buyer_id', orgID)
        .in('status', ['delivered', 'completed']),
      supabase.from('orders').select('total').eq('buyer_id', orgID),
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('read', false)
        .eq('organization_id', orgID),
    ])

  const totalValue = (totals ?? []).reduce((sum, order) => sum + Number(order.total), 0)
  const rows = (recent ?? []) as unknown as (Order & { producer: Pick<Organization, 'name'> })[]

  return (
    <DashboardShell
      brand="Retail"
      roleLabel="Shop owner"
      userName={session.user.name}
      unread={unread ?? 0}
      logout={logout}
      nav={[
        { href: '/retailer', label: 'Overview' },
        { href: '/marketplace', label: 'Marketplace' },
        { href: '/retailer/orders', label: 'My orders' },
        { href: '/retailer/producers', label: 'Producers' },
        { href: '/messages', label: 'Messages' },
        { href: '/notifications', label: 'Notifications' },
      ]}
    >
      <PageHeader
        title={session.organization?.name ?? 'My shop'}
        subtitle="Your procurement activity at a glance."
        action={
          <Link
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            href="/marketplace"
          >
            Browse marketplace →
          </Link>
        }
      />

      {session.organization?.verification_status !== 'verified' && (
        <p className="mb-5 rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Your business verification is <strong>{session.organization?.verification_status}</strong>.
          Ordering unlocks once an administrator verifies your business.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total purchase value" value={money(totalValue)} hint={`${totals?.length ?? 0} orders all-time`} />
        <StatCard label="Awaiting confirmation" value={String(pending ?? 0)} hint="Pending / quoted / confirmed" />
        <StatCard label="In fulfilment" value={String(inFulfilment ?? 0)} hint="Preparing → in transit" />
        <StatCard label="Completed purchases" value={String(completed ?? 0)} hint="Delivered & confirmed" />
      </div>

      <section className="mt-8 rounded-xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 className="text-sm font-bold text-zinc-900">Recent orders</h2>
          <Link className="text-xs font-semibold text-blue-700 hover:underline" href="/retailer/orders">
            View all
          </Link>
        </div>
        <div className="divide-y divide-zinc-100">
          {rows.map((order) => (
            <div key={order.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
              <span className="font-semibold text-zinc-900">{order.order_number}</span>
              <span className="text-zinc-500">{order.producer?.name ?? 'Producer'}</span>
              <StatusPill status={order.status} />
              <span className="ml-auto font-semibold text-zinc-900">{money(Number(order.total))}</span>
              <span className="text-xs text-zinc-400">
                {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
          ))}
          {rows.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-zinc-500">
              No orders yet. Explore the marketplace to place your first wholesale order.
            </p>
          )}
        </div>
      </section>
    </DashboardShell>
  )
}
