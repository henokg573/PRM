import { requireRole } from '../actions/guard'
import { getSupabase, type Order, type Organization, type Product } from '@/lib/supabase'
import { DashboardShell, PageHeader, StatCard, StatusPill, money } from '@/components/dashboard-shell'
import { logout } from '../actions/auth'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Producer dashboard — NexusOne B2B' }

export default async function ProducerPage() {
  const session = await requireRole('producer')
  const orgID = session.organization?.id ?? ''
  const supabase = getSupabase()

  const [
    { count: totalProducts },
    { count: activeProducts },
    { count: totalOrders },
    { count: newOrders },
    { count: completedOrders },
    { data: totals },
    { count: unread },
    { data: lowStock },
    { data: recent },
  ] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }).eq('producer_id', orgID),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('producer_id', orgID)
      .eq('approval_status', 'approved')
      .eq('active', true),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('producer_id', orgID),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('producer_id', orgID)
      .in('status', ['pending', 'quotation']),
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('producer_id', orgID)
      .in('status', ['delivered', 'completed']),
    supabase.from('orders').select('total').eq('producer_id', orgID),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('read', false)
      .eq('organization_id', orgID),
    supabase
      .from('products')
      .select('id, name, stock, unit')
      .eq('producer_id', orgID)
      .lt('stock', 20)
      .limit(5),
    supabase
      .from('orders')
      .select('*, buyer:organizations!orders_buyer_id_fkey(name)')
      .eq('producer_id', orgID)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  const totalValue = (totals ?? []).reduce((sum, order) => sum + Number(order.total), 0)
  const rows = (recent ?? []) as unknown as (Order & { buyer: Pick<Organization, 'name'> })[]

  return (
    <DashboardShell
      brand="Producer"
      roleLabel="Producer"
      userName={session.user.name}
      unread={unread ?? 0}
      logout={logout}
      nav={[
        { href: '/producer', label: 'Overview' },
        { href: '/producer/products', label: 'My products', badge: totalProducts ?? 0 },
        { href: '/producer/orders', label: 'Orders', badge: totalOrders ?? 0 },
        { href: '/messages', label: 'Messages' },
        { href: '/notifications', label: 'Notifications' },
      ]}
    >
      <PageHeader
        title={session.organization?.name ?? 'Producer workspace'}
        subtitle="Manage your catalog and fulfil wholesale orders."
        action={
          <Link
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            href="/producer/products"
          >
            Manage products →
          </Link>
        }
      />

      {session.organization?.verification_status !== 'verified' && (
        <p className="mb-5 rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          Your business verification is <strong>{session.organization?.verification_status}</strong>.
          Products publish to the marketplace once administrators verify your business.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total sales value" value={money(totalValue)} hint={`${totalOrders ?? 0} orders all-time`} />
        <StatCard label="New orders to action" value={String(newOrders ?? 0)} hint="Pending acceptance" />
        <StatCard label="Active listings" value={String(activeProducts ?? 0)} hint={`${totalProducts ?? 0} products total`} />
        <StatCard label="Completed deliveries" value={String(completedOrders ?? 0)} hint="Delivered & confirmed" />
      </div>

      {(lowStock as Pick<Product, 'id' | 'name' | 'stock' | 'unit'>[] | null)?.length ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-900">Low stock alerts</p>
          <ul className="mt-2 space-y-1 text-sm text-amber-800">
            {(lowStock ?? []).map((product) => (
              <li key={product.id}>
                {product.name} — {product.stock} {product.unit} remaining
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <section className="mt-8 rounded-xl border border-zinc-200 bg-white">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 className="text-sm font-bold text-zinc-900">Recent orders</h2>
          <Link className="text-xs font-semibold text-blue-700 hover:underline" href="/producer/orders">
            View all
          </Link>
        </div>
        <div className="divide-y divide-zinc-100">
          {rows.map((order) => (
            <div key={order.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
              <span className="font-semibold text-zinc-900">{order.order_number}</span>
              <span className="text-zinc-500">{order.buyer?.name ?? 'Retailer'}</span>
              <StatusPill status={order.status} />
              <span className="ml-auto font-semibold text-zinc-900">{money(Number(order.total))}</span>
            </div>
          ))}
          {rows.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-zinc-500">
              No orders yet. Verified retailers will find your products in the marketplace.
            </p>
          )}
        </div>
      </section>
    </DashboardShell>
  )
}
