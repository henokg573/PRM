import { redirect } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { getSession } from '@/lib/session'
import { DashboardShell, PageHeader } from '@/components/dashboard-shell'
import { logout } from '../actions/auth'
import Link from 'next/link'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Messages — NexusOne B2B' }

const navFor = (role: string) =>
  role === 'producer'
    ? [
      { href: '/producer', label: 'Overview' },
      { href: '/producer/products', label: 'My products' },
      { href: '/producer/orders', label: 'Orders' },
      { href: '/messages', label: 'Messages' },
      { href: '/notifications', label: 'Notifications' },
    ]
    : [
      { href: '/retailer', label: 'Overview' },
      { href: '/marketplace', label: 'Marketplace' },
      { href: '/retailer/orders', label: 'My orders' },
      { href: '/retailer/producers', label: 'Producers' },
      { href: '/messages', label: 'Messages' },
      { href: '/notifications', label: 'Notifications' },
    ]

export default async function MessagesPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const orgID = session.organization?.id ?? ''
  const supabase = getSupabase()

  const [conversationsResult, unreadResult] = await Promise.all([
    supabase
      .from('conversations')
      .select('*, producer:organizations!conversations_producer_id_fkey(name), retailer:organizations!conversations_retailer_id_fkey(name)')
      .or(`producer_id.eq.${orgID},retailer_id.eq.${orgID}`)
      .order('updated_at', { ascending: false })
      .limit(50),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('read', false)
      .eq('organization_id', orgID),
  ])

  const conversations = (conversationsResult.data ?? []) as unknown as {
    id: string
    subject: string
    producer_id: string
    retailer_id: string
    updated_at: string
    producer: { name: string } | null
    retailer: { name: string } | null
  }[]

  return (
    <DashboardShell
      brand={session.user.role === 'producer' ? 'Producer' : 'Retail'}
      roleLabel={session.user.role}
      userName={session.user.name}
      unread={unreadResult.count ?? 0}
      logout={logout}
      nav={navFor(session.user.role)}
    >
      <PageHeader title="Messages" subtitle="Direct communication between partners." />
      <div className="space-y-3">
        {conversations.map((conversation) => {
          const other =
            conversation.producer_id === orgID
              ? conversation.retailer?.name ?? 'Retailer'
              : conversation.producer?.name ?? 'Producer'
          return (
            <Link
              key={conversation.id}
              href={`/messages/${conversation.id}`}
              className="block rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-blue-400"
            >
              <div className="flex items-center gap-3">
                <strong className="text-sm text-zinc-900">{conversation.subject}</strong>
                <span className="ml-auto text-xs text-zinc-400">{other}</span>
              </div>
              <p className="text-xs text-zinc-500">
                Updated {new Date(conversation.updated_at).toLocaleDateString()}
              </p>
            </Link>
          )
        })}
        {conversations.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
            <p className="text-sm font-semibold text-zinc-700">No conversations yet</p>
            <p className="mt-1 text-xs text-zinc-500">
              {session.user.role === 'retailer'
                ? 'Message a producer from the Producers directory.'
                : 'Retailers will contact you here.'}
            </p>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
