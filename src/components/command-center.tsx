'use client'

import { useMemo, useState } from 'react'

type Metric = {
  label: string
  value: string
  change: string
  tone: 'blue' | 'green' | 'amber' | 'violet'
  icon: IconName
}

type OrderRow = {
  id: string
  orderNumber: string
  buyer: string
  producer: string
  status: string
  total: number
  createdAt: string
}

export type DashboardData = {
  authenticated: boolean
  metrics: {
    producers: number
    retailers: number
    verifiedPartners: number
    pendingVerifications: number
    products: number
    activeProducts: number
    orders: number
    pendingOrders: number
    completedOrders: number
    transactionValue: number
    openDisputes: number
  }
  orders: OrderRow[]
}

type IconName =
  | 'overview'
  | 'partners'
  | 'products'
  | 'orders'
  | 'logistics'
  | 'finance'
  | 'messages'
  | 'reports'
  | 'shield'
  | 'settings'
  | 'search'
  | 'bell'
  | 'chevron'
  | 'download'
  | 'arrow'
  | 'store'
  | 'factory'
  | 'package'
  | 'clock'
  | 'check'
  | 'value'
  | 'alert'
  | 'menu'
  | 'close'

const paths: Record<IconName, string> = {
  overview: 'M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z',
  partners:
    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm13 10v-2a4 4 0 0 0-3-3.87m-3-12a4 4 0 0 1 0 7.75',
  products: 'm12 2 9 5-9 5-9-5 9-5Zm9 5v10l-9 5-9-5V7m9 5v10',
  orders: 'M6 2h9l4 4v16H6V2Zm8 0v5h5M9 13h7M9 17h7M9 9h2',
  logistics:
    'M3 6h11v11H3V6Zm11 4h4l3 3v4h-7v-7ZM7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  finance: 'M12 1v22m5-18H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  messages: 'M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z',
  reports: 'M4 19V9m5 10V5m5 14v-7m5 7V3',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Zm-3-10 2 2 4-5',
  settings:
    'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.4-3.5a7.3 7.3 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a8 8 0 0 0-1.8-1L14.8 3h-4l-.4 2.6a8 8 0 0 0-1.8 1l-2.4-1-2 3.4 2 1.5a7.3 7.3 0 0 0 0 2L4.2 14l2 3.4 2.4-1a8 8 0 0 0 1.8 1l.4 2.6h4l.4-2.6a8 8 0 0 0 1.8-1l2.4 1 2-3.4-2-1.5a7.3 7.3 0 0 0 .1-1Z',
  search: 'm21 21-4.35-4.35m2.35-5.15a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Zm-8 13h4',
  chevron: 'm9 18 6-6-6-6',
  download: 'M12 3v12m0 0 5-5m-5 5-5-5M5 21h14',
  arrow: 'm9 18 6-6-6-6',
  store: 'M3 9h18l-2-6H5L3 9Zm2 0v12h14V9M9 21v-7h6v7',
  factory: 'M3 21V9l6 4V9l6 4V3h6v18H3Zm4-4h2m4 0h2m4 0h2',
  package: 'm12 2 9 5-9 5-9-5 9-5Zm9 5v10l-9 5-9-5V7m9 5v10',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-15v5l3 2',
  check: 'M20 6 9 17l-5-5',
  value: 'M12 1v22m5-18H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
  alert:
    'M10.3 3.5 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0ZM12 9v4m0 4h.01',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6 6 18',
}

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const lineIcons = !['overview'].includes(name)
  return (
    <svg
      aria-hidden="true"
      className="ui-icon"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      fill={lineIcons ? 'none' : 'currentColor'}
      stroke={lineIcons ? 'currentColor' : 'none'}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    >
      <path d={paths[name]} />
    </svg>
  )
}

const navSections: {
  label: string
  items: { label: string; icon: IconName; count?: string }[]
}[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', icon: 'overview' as const },
      { label: 'Partners', icon: 'partners' as const, count: '24' },
      { label: 'Products', icon: 'products' as const },
      { label: 'Orders', icon: 'orders' as const, count: '18' },
      { label: 'Logistics', icon: 'logistics' as const },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Finance', icon: 'finance' as const },
      { label: 'Communications', icon: 'messages' as const },
      { label: 'Reports', icon: 'reports' as const },
      { label: 'Governance', icon: 'shield' as const },
    ],
  },
]

const chartValues = [34, 46, 39, 58, 48, 67, 62, 76, 69, 84, 74, 92]
const chartLabels = [
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
  'Jan',
  'Feb',
  'Mar',
  'Apr',
]

function money(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 100000 ? 0 : 2,
  }).format(value)
}

function titleCase(value: string) {
  return value.replaceAll('-', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function CommandCenter({ data }: { data: DashboardData }) {
  const [activeNav, setActiveNav] = useState('Overview')
  const [range, setRange] = useState('Last 30 days')
  const [query, setQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const metrics: Metric[] = [
    {
      label: 'Verified partners',
      value: data.metrics.verifiedPartners.toLocaleString(),
      change: `${data.metrics.pendingVerifications} awaiting review`,
      tone: 'blue',
      icon: 'partners',
    },
    {
      label: 'Active products',
      value: data.metrics.activeProducts.toLocaleString(),
      change: `${data.metrics.products} total listings`,
      tone: 'violet',
      icon: 'package',
    },
    {
      label: 'Open orders',
      value: data.metrics.pendingOrders.toLocaleString(),
      change: `${data.metrics.orders} total orders`,
      tone: 'amber',
      icon: 'clock',
    },
    {
      label: 'Completed orders',
      value: data.metrics.completedOrders.toLocaleString(),
      change: 'Fulfilment lifecycle',
      tone: 'green',
      icon: 'check',
    },
    {
      label: 'Transaction value',
      value: money(data.metrics.transactionValue),
      change: range,
      tone: 'blue',
      icon: 'value',
    },
  ]

  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return data.orders
    return data.orders.filter((order) =>
      [order.orderNumber, order.buyer, order.producer, order.status].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    )
  }, [data.orders, query])

  const exportReport = () => {
    const rows = [
      ['Metric', 'Value'],
      ...metrics.map((metric) => [metric.label, metric.value]),
      ['Open disputes', String(data.metrics.openDisputes)],
    ]
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(','))
      .join('\n')
    const link = document.createElement('a')
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    link.download = `nexus-command-center-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <div className="command-shell">
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">
            <span>N</span>
          </span>
          <span className="brand-name">
            NEXUS<span>ONE</span>
          </span>
          <button
            className="icon-button sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <Icon name="close" />
          </button>
        </div>

        <nav className="primary-nav" aria-label="Primary navigation">
          {navSections.map((section) => (
            <div className="nav-section" key={section.label}>
              <p>{section.label}</p>
              {section.items.map((item) => (
                <button
                  className={activeNav === item.label ? 'nav-item active' : 'nav-item'}
                  key={item.label}
                  onClick={() => {
                    setActiveNav(item.label)
                    setSidebarOpen(false)
                  }}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                  {item.count && <small>{item.count}</small>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setActiveNav('Settings')}>
            <Icon name="settings" />
            <span>Settings</span>
          </button>
          <div className="system-card">
            <div className="system-card-head">
              <span className="live-dot" />
              <strong>All systems operational</strong>
            </div>
            <p>Last checked just now</p>
          </div>
          <div className="profile">
            <div className="avatar">AM</div>
            <div>
              <strong>Alex Morgan</strong>
              <span>Platform administrator</span>
            </div>
            <Icon name="chevron" size={15} />
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="dashboard">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation"
          >
            <Icon name="menu" />
          </button>
          <div className="search-box">
            <Icon name="search" size={17} />
            <input
              aria-label="Search orders and partners"
              placeholder="Search orders, partners, products..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <kbd>⌘ K</kbd>
          </div>
          <div className="topbar-actions">
            <a className="support-link" href="mailto:support@nexusone.example">
              Support
            </a>
            <button className="icon-button notification-button" aria-label="Notifications">
              <Icon name="bell" />
              {data.metrics.openDisputes > 0 && <span />}
            </button>
            <div className="topbar-avatar">AM</div>
          </div>
        </header>

        <div className="dashboard-content">
          {!data.authenticated && (
            <div className="access-banner">
              <span>
                <Icon name="shield" />
              </span>
              <div>
                <strong>Secure preview mode</strong>
                <p>
                  Operational values are concealed. Sign in through the control plane to access live
                  platform data.
                </p>
              </div>
              <a href="/admin">
                Administrator sign in <Icon name="arrow" size={14} />
              </a>
            </div>
          )}

          <section className="page-heading">
            <div>
              <p className="eyebrow">PLATFORM OPERATIONS</p>
              <h1>{activeNav === 'Overview' ? 'Command center' : activeNav}</h1>
              <p>Monitor partner activity, marketplace health, and fulfilment performance.</p>
            </div>
            <div className="heading-actions">
              <label className="select-control">
                <span className="sr-only">Reporting period</span>
                <select value={range} onChange={(event) => setRange(event.target.value)}>
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last quarter</option>
                  <option>Year to date</option>
                </select>
                <Icon name="chevron" size={14} />
              </label>
              <button className="primary-button" onClick={exportReport}>
                <Icon name="download" size={16} />
                Export report
              </button>
            </div>
          </section>

          <section className="metric-grid" aria-label="Platform metrics">
            {metrics.map((metric) => (
              <article className="metric-card" key={metric.label}>
                <div className={`metric-icon ${metric.tone}`}>
                  <Icon name={metric.icon} />
                </div>
                <div className="metric-copy">
                  <p>{metric.label}</p>
                  <strong>{metric.value}</strong>
                  <span>{metric.change}</span>
                </div>
                <button
                  className="metric-link"
                  aria-label={`Open ${metric.label}`}
                  onClick={() => setActiveNav(metric.label)}
                >
                  <Icon name="arrow" size={16} />
                </button>
              </article>
            ))}
          </section>

          <section className="dashboard-grid">
            <article className="panel performance-panel">
              <div className="panel-head">
                <div>
                  <h2>Marketplace performance</h2>
                  <p>Gross order value across the platform</p>
                </div>
                <div className="chart-legend">
                  <span /> Order value
                </div>
              </div>
              <div className="chart-summary">
                <strong>{money(data.metrics.transactionValue)}</strong>
                <span>Live confirmed value</span>
              </div>
              <div className="chart">
                <div className="chart-lines">
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <div className="bars">
                  {chartValues.map((value, index) => (
                    <div className="bar-column" key={chartLabels[index]}>
                      <div className="bar" style={{ height: `${value}%` }}>
                        <span>{value}</span>
                      </div>
                      <small>{chartLabels[index]}</small>
                    </div>
                  ))}
                </div>
              </div>
            </article>

            <article className="panel attention-panel">
              <div className="panel-head">
                <div>
                  <h2>Needs attention</h2>
                  <p>Items requiring an administrator</p>
                </div>
                <button onClick={() => setActiveNav('Governance')}>View all</button>
              </div>
              <div className="attention-list">
                <button onClick={() => setActiveNav('Partners')}>
                  <span className="attention-icon amber">
                    <Icon name="partners" />
                  </span>
                  <span>
                    <strong>Verification applications</strong>
                    <small>Review partner documentation</small>
                  </span>
                  <b>{data.metrics.pendingVerifications}</b>
                  <Icon name="arrow" size={15} />
                </button>
                <button onClick={() => setActiveNav('Orders')}>
                  <span className="attention-icon red">
                    <Icon name="alert" />
                  </span>
                  <span>
                    <strong>Open disputes</strong>
                    <small>Resolution response required</small>
                  </span>
                  <b>{data.metrics.openDisputes}</b>
                  <Icon name="arrow" size={15} />
                </button>
                <button onClick={() => setActiveNav('Products')}>
                  <span className="attention-icon blue">
                    <Icon name="products" />
                  </span>
                  <span>
                    <strong>Product reviews</strong>
                    <small>Pending publication approval</small>
                  </span>
                  <b>{Math.max(0, data.metrics.products - data.metrics.activeProducts)}</b>
                  <Icon name="arrow" size={15} />
                </button>
              </div>
            </article>
          </section>

          <section className="panel orders-panel">
            <div className="panel-head">
              <div>
                <h2>Recent orders</h2>
                <p>Latest procurement activity across all partners</p>
              </div>
              <button onClick={() => setActiveNav('Orders')}>
                View all orders <Icon name="arrow" size={14} />
              </button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Retailer</th>
                    <th>Producer</th>
                    <th>Status</th>
                    <th>Value</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <strong>{order.orderNumber}</strong>
                      </td>
                      <td>{order.buyer}</td>
                      <td>{order.producer}</td>
                      <td>
                        <span className={`status-pill status-${order.status}`}>
                          {titleCase(order.status)}
                        </span>
                      </td>
                      <td>
                        <strong>{money(order.total)}</strong>
                      </td>
                      <td>
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredOrders.length === 0 && (
                <div className="empty-state">
                  <span>
                    <Icon name="orders" size={22} />
                  </span>
                  <strong>{query ? 'No matching orders' : 'No procurement activity yet'}</strong>
                  <p>
                    {query
                      ? 'Try a broader search term.'
                      : 'Verified retailers’ orders will appear here as they are submitted.'}
                  </p>
                </div>
              )}
            </div>
          </section>

          <footer className="dashboard-footer">
            <span>NEXUSONE CONTROL PLANE</span>
            <p>Data refreshes on every secure request</p>
          </footer>
        </div>
      </main>
    </div>
  )
}
