import { redirect } from 'next/navigation'
import { getSupabase, type Notification } from '@/lib/supabase'
import { getSession } from '@/lib/session'
import { DashboardShell, PageHeader } from '@/components/dashboard-shell'
import { logout } from '../actions/auth'
import { markNotificationsRead } from '../actions/orders'
import { NotificationsReadButton } from '@/components/notifications-read-button'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Notifications — NexusOne B2B' }

export default async function NotificationsPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  const orgID = session.organization?.id ?? ''
  const supabase = getSupabase()

  const [notificationsResult, unreadResult] = await Promise.all([
    supabase
      .from('notifications')
      .select('*')
      .or(`organization_id.eq.${orgID},user_id.eq.${session.user.id}`)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('read', false)
      .or(`organization_id.eq.${orgID},user_id.eq.${session.user.id}`),
  ])

  const notifications = (notificationsResult.data ?? []) as Notification[]

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
        title="Notifications"
        subtitle="Order updates, verification status, and platform announcements."
        action={<NotificationsReadButton onMark={markNotificationsRead} />}
      />
      <div className="space-y-2">
        {notifications.map((notification) => (
          <article
            key={notification.id}
            className={`rounded-xl border p-4 ${
              notification.read ? 'border-zinc-200 bg-white' : 'border-blue-200 bg-blue-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-900">{notification.title}</h2>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {notification.kind}
              </span>
              {!notification.read && <span className="ml-auto h-2 w-2 rounded-full bg-blue-600" />}
            </div>
            <p className="mt-1 text-sm text-zinc-600">{notification.body}</p>
            <p className="mt-1 text-xs text-zinc-400">
              {new Date(notification.created_at).toLocaleString()}
            </p>
          </article>
        ))}
        {notifications.length === 0 && (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
            <p className="text-sm font-semibold text-zinc-700">Nothing here yet</p>
            <p className="mt-1 text-xs text-zinc-500">Order and verification updates will appear here.</p>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
