import { requireRole } from '../../actions/guard'
import { getSupabase, type Organization } from '@/lib/supabase'
import { DashboardShell, PageHeader } from '@/components/dashboard-shell'
import { logout } from '../../actions/auth'
import { ProducerContact } from '@/components/producer-contact'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Producers — NexusOne B2B' }

export default async function ProducersDirectoryPage() {
  const session = await requireRole('retailer')
  const orgID = session.organization?.id ?? ''
  const supabase = getSupabase()

  const [{ data: producers }, { count: unread }] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name, legal_name, region, verification_status')
      .eq('type', 'producer')
      .eq('verification_status', 'verified')
      .limit(100),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('read', false)
      .eq('organization_id', orgID),
  ])

  const rows = (producers ?? []) as Pick<Organization, 'id' | 'name' | 'legal_name' | 'region'>[]

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
        title="Verified producers"
        subtitle="Connect directly with manufacturers and start a conversation."
      />
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((producer) => (
          <article key={producer.id} className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-blue-700 text-sm font-bold text-white">
                {producer.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-900">{producer.name}</h2>
                <p className="text-xs text-zinc-500">{producer.region}</p>
              </div>
              <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                Verified
              </span>
            </div>
            <p className="mt-3 text-xs text-zinc-500">{producer.legal_name}</p>
            <ProducerContact producerID={producer.id} producerName={producer.name} />
          </article>
        ))}
        {rows.length === 0 && (
          <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500 md:col-span-2">
            No verified producers are onboarded yet. Check back soon.
          </p>
        )}
      </div>
    </DashboardShell>
  )
}
