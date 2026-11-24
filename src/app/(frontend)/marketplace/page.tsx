import { redirect } from 'next/navigation'
import { getSupabase, type Product, type Organization, type Category } from '@/lib/supabase'
import { getSession } from '@/lib/session'
import { DashboardShell, PageHeader } from '@/components/dashboard-shell'
import { MarketplaceBrowser, type MarketProduct } from '@/components/marketplace-browser'
import { logout } from '../actions/auth'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Marketplace — NexusOne B2B' }

export default async function MarketplacePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const supabase = getSupabase()
  const [{ data: products }, { data: orgs }, { data: categories }, { count: unread }] =
    await Promise.all([
      supabase
        .from('products')
        .select('*')
        .eq('approval_status', 'approved')
        .eq('active', true)
        .limit(200),
      supabase.from('organizations').select('id, name, region'),
      supabase.from('categories').select('id, name').eq('active', true),
      supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('read', false)
        .or(`organization_id.eq.${session.organization?.id ?? ''},user_id.eq.${session.user.id}`),
    ])

  const orgMap = new Map((orgs ?? []).map((org) => [org.id, org]))
  const catMap = new Map((categories ?? []).map((category) => [category.id, category.name]))

  const marketProducts: MarketProduct[] = ((products ?? []) as Product[]).map((product) => {
    const producer = orgMap.get(product.producer_id) as Pick<Organization, 'name' | 'region'> | undefined
    return {
      id: product.id,
      name: product.name,
      brand: product.brand,
      description: product.description,
      unit: product.unit,
      wholesalePrice: Number(product.wholesale_price),
      minimumOrderQuantity: product.minimum_order_quantity,
      stock: product.stock,
      leadTimeDays: product.lead_time_days,
      deliveryRegions: product.delivery_regions ?? [],
      producerName: producer?.name ?? 'Producer',
      producerRegion: producer?.region ?? '',
      categoryName: catMap.get(product.category_id ?? '') ?? 'General',
    }
  })

  const canOrder =
    session.user.role === 'retailer' &&
    session.organization?.verification_status === 'verified' &&
    session.user.status === 'active'

  const notice = !canOrder
    ? session.user.role === 'producer'
      ? 'You are signed in as a producer. Producers browse but cannot place wholesale orders.'
      : session.organization?.verification_status !== 'verified'
        ? 'Your business verification is pending. Orders unlock once administrators verify your business.'
        : 'Your account is awaiting activation by platform administrators.'
    : undefined

  return (
    <DashboardShell
      brand="Retail"
      roleLabel={session.user.role}
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
        title="Wholesale marketplace"
        subtitle="Browse verified producers and submit purchase orders at wholesale terms."
      />
      <MarketplaceBrowser products={marketProducts} canOrder={canOrder} notice={notice} />
    </DashboardShell>
  )
}
