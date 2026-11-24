import { requireRole } from '../../actions/guard'
import { getSupabase, type Product } from '@/lib/supabase'
import { DashboardShell, PageHeader, StatusPill, money } from '@/components/dashboard-shell'
import { logout } from '../../actions/auth'
import { ProductForm, ProductToggle } from '@/components/product-form'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'My products — NexusOne B2B' }

export default async function ProducerProductsPage() {
  const session = await requireRole('producer')
  const orgID = session.organization?.id ?? ''
  const supabase = getSupabase()

  const [{ data: products }, { data: categories }, { count: unread }] = await Promise.all([
    supabase
      .from('products')
      .select('*, category:categories(name)')
      .eq('producer_id', orgID)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('categories').select('id, name').eq('active', true).limit(100),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('read', false)
      .eq('organization_id', orgID),
  ])

  const rows = (products ?? []) as unknown as (Product & { category: { name: string } | null })[]

  return (
    <DashboardShell
      brand="Producer"
      roleLabel="Producer"
      userName={session.user.name}
      unread={unread ?? 0}
      logout={logout}
      nav={[
        { href: '/producer', label: 'Overview' },
        { href: '/producer/products', label: 'My products' },
        { href: '/producer/orders', label: 'Orders' },
        { href: '/messages', label: 'Messages' },
        { href: '/notifications', label: 'Notifications' },
      ]}
    >
      <PageHeader title="My products" subtitle="Create listings, manage stock, and track approvals." />

      <div className="mb-6">
        <ProductForm categories={categories ?? []} />
      </div>

      <div className="space-y-3">
        {rows.map((product) => (
          <article
            key={product.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4"
          >
            <div>
              <h2 className="text-sm font-bold text-zinc-900">{product.name}</h2>
              <p className="text-xs text-zinc-500">
                {product.brand} · SKU {product.sku} · {product.category?.name ?? '—'}
              </p>
            </div>
            <StatusPill status={product.approval_status} />
            <span className="text-xs text-zinc-500">
              {product.stock} {product.unit} · MOQ {product.minimum_order_quantity}
            </span>
            <span className="ml-auto font-bold text-zinc-900">{money(Number(product.wholesale_price))}</span>
            <ProductToggle productID={product.id} active={product.active} />
          </article>
        ))}
        {rows.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
            <p className="text-sm font-semibold text-zinc-700">No products yet</p>
            <p className="mt-1 text-xs text-zinc-500">Create your first listing above.</p>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
