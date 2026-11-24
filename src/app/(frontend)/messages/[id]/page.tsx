import { redirect } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { getSession } from '@/lib/session'
import { DashboardShell, PageHeader } from '@/components/dashboard-shell'
import { logout } from '../../actions/auth'
import { MessageThread } from '@/components/message-thread'

export const dynamic = 'force-dynamic'

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) redirect('/login')
  const orgID = session.organization?.id ?? ''
  const supabase = getSupabase()

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, subject, producer_id, retailer_id, producer:organizations!conversations_producer_id_fkey(name), retailer:organizations!conversations_retailer_id_fkey(name)')
    .eq('id', id)
    .maybeSingle()
  if (!conversation) redirect('/messages')
  if (conversation.producer_id !== orgID && conversation.retailer_id !== orgID) {
    redirect('/messages')
  }

  const [messagesResult, unreadResult] = await Promise.all([
    supabase
      .from('messages')
      .select('*, sender:app_users(id, name)')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
      .limit(200),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('read', false)
      .eq('organization_id', orgID),
  ])

  const messages = (messagesResult.data ?? []) as unknown as {
    id: string
    body: string
    created_at: string
    sender: { id: string; name: string } | null
  }[]

  const typed = conversation as unknown as {
    producer_id: string
    producer: { name: string } | null
    retailer: { name: string } | null
  }

  const nav =
    session.user.role === 'producer'
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

  return (
    <DashboardShell
      brand={session.user.role === 'producer' ? 'Producer' : 'Retail'}
      roleLabel={session.user.role}
      userName={session.user.name}
      unread={unreadResult.count ?? 0}
      logout={logout}
      nav={nav}
    >
      <PageHeader
        title={(conversation as unknown as { subject: string }).subject}
        subtitle={
          typed.producer_id === orgID
            ? `Retailer: ${typed.retailer?.name ?? '—'}`
            : `Producer: ${typed.producer?.name ?? '—'}`
        }
      />
      <MessageThread
        conversationID={id}
        currentUserName={session.user.name}
        initialMessages={messages.map((message) => ({
          id: message.id,
          senderName: message.sender?.name ?? 'Unknown',
          senderID: message.sender?.id ?? '',
          body: message.body,
          createdAt: message.created_at,
        }))}
      />
    </DashboardShell>
  )
}
