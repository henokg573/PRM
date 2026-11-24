import { requireRole } from '../../actions/guard'
import { getSupabase, type Order, type Product, type Organization } from '@/lib/supabase'
import { DashboardShell, PageHeader, StatusPill, money } from '@/components/dashboard-shell'
import { OrderActions } from '@/components/order-actions'
import { logout } from '../../actions/auth'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'My orders — NexusOne B2B' }

export default async function RetailerOrdersPage() {
  const session = await requireRole('retailer')
  const orgID = session.organization?.id ?? ''
  const supabase = getSupabase()

  const [{ data: orders }, { count: unread }] = await Promise.all([
    supabase
      .from('orders')
      .select('*, producer:organizations!orders_producer_id_fkey(name), items:order_items(*, product:products(name))')
      .eq('buyer_id', orgID)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('read', false)
      .eq('organization_id', orgID),
  ])

  const rows = (orders ?? []) as unknown as (Order & {
    producer: Pick<Organization, 'name'>
    items: ({ product: Pick<Product, 'name'> } & { quantity: number; unit_price: number })[]
  })[]

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
      <PageHeader title="My orders" subtitle="Track every wholesale purchase from request to receipt." />

      <div className="space-y-4">
        {rows.map((order) => (
          <article key={order.id} className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-sm font-bold text-zinc-900">{order.order_number}</h2>
              <StatusPill status={order.status} />
              <span className="text-xs text-zinc-500">Producer: {order.producer?.name ?? '—'}</span>
              <span className="ml-auto text-lg font-bold text-zinc-900">{money(Number(order.total))}</span>
            </div>
            <ul className="mt-3 space-y-1 text-sm text-zinc-600">
              {order.items.map((item) => (
                <li key={item.id}>
                  {item.product?.name ?? 'Product'} × {item.quantity} @ {money(Number(item.unit_price))}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-zinc-400">Deliver to: {order.delivery_address}</p>
            <div className="mt-4 border-t border-zinc-100 pt-3">
              <OrderActions orderID={order.id} status={order.status} role="retailer" />
            </div>
          </article>
        ))}
        {rows.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
            <p className="text-sm font-semibold text-zinc-700">No orders yet</p>
            <p className="mt-1 text-xs text-zinc-500">
              Products you order from the marketplace will appear here.
            </p>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
