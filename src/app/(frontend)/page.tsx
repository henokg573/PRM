import { headers } from 'next/headers'
import { getPayloadClient } from '@/lib/payload'
import { CommandCenter, type DashboardData } from '@/components/command-center'

const emptyData: DashboardData = {
  authenticated: false,
  metrics: {
    producers: 0,
    retailers: 0,
    verifiedPartners: 0,
    pendingVerifications: 0,
    products: 0,
    activeProducts: 0,
    orders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    transactionValue: 0,
    openDisputes: 0,
  },
  orders: [],
}

const relationName = (value: unknown) => {
  if (value && typeof value === 'object' && 'name' in value && typeof value.name === 'string') {
    return value.name
  }
  return 'Organization'
}

export default async function HomePage() {
  const payload = await getPayloadClient()
  const requestHeaders = await headers()
  const { user } = await payload.auth({ headers: requestHeaders })

  if (!user || user.collection !== 'admins') {
    return <CommandCenter data={emptyData} />
  }

  const [
    producers,
    retailers,
    verifiedPartners,
    pendingVerifications,
    products,
    activeProducts,
    orders,
    pendingOrders,
    completedOrders,
    openDisputes,
    orderValues,
    recentOrders,
  ] = await Promise.all([
    payload.count({
      collection: 'organizations',
      where: { type: { equals: 'producer' } },
      overrideAccess: false,
      user,
    }),
    payload.count({
      collection: 'organizations',
      where: { type: { equals: 'retailer' } },
      overrideAccess: false,
      user,
    }),
    payload.count({
      collection: 'organizations',
      where: { verificationStatus: { equals: 'verified' } },
      overrideAccess: false,
      user,
    }),
    payload.count({
      collection: 'organizations',
      where: { verificationStatus: { in: ['pending', 'in-review'] } },
      overrideAccess: false,
      user,
    }),
    payload.count({ collection: 'products', overrideAccess: false, user }),
    payload.count({
      collection: 'products',
      where: { and: [{ approvalStatus: { equals: 'approved' } }, { active: { equals: true } }] },
      overrideAccess: false,
      user,
    }),
    payload.count({ collection: 'orders', overrideAccess: false, user }),
    payload.count({
      collection: 'orders',
      where: {
        status: {
          in: ['pending', 'quotation', 'confirmed', 'preparing', 'dispatched', 'in-transit'],
        },
      },
      overrideAccess: false,
      user,
    }),
    payload.count({
      collection: 'orders',
      where: { status: { in: ['delivered', 'completed'] } },
      overrideAccess: false,
      user,
    }),
    payload.count({
      collection: 'disputes',
      where: { status: { in: ['open', 'investigating', 'awaiting-response'] } },
      overrideAccess: false,
      user,
    }),
    payload.find({
      collection: 'orders',
      limit: 500,
      depth: 0,
      select: { total: true },
      overrideAccess: false,
      user,
    }),
    payload.find({
      collection: 'orders',
      limit: 8,
      depth: 1,
      sort: '-createdAt',
      overrideAccess: false,
      user,
    }),
  ])

  const data: DashboardData = {
    authenticated: true,
    metrics: {
      producers: producers.totalDocs,
      retailers: retailers.totalDocs,
      verifiedPartners: verifiedPartners.totalDocs,
      pendingVerifications: pendingVerifications.totalDocs,
      products: products.totalDocs,
      activeProducts: activeProducts.totalDocs,
      orders: orders.totalDocs,
      pendingOrders: pendingOrders.totalDocs,
      completedOrders: completedOrders.totalDocs,
      transactionValue: orderValues.docs.reduce((total, order) => total + (order.total ?? 0), 0),
      openDisputes: openDisputes.totalDocs,
    },
    orders: recentOrders.docs.map((order) => ({
      id: String(order.id),
      orderNumber: order.orderNumber,
      buyer: relationName(order.buyerOrganization),
      producer: relationName(order.producerOrganization),
      status: order.status,
      total: order.total,
      createdAt: order.createdAt,
    })),
  }

  return <CommandCenter data={data} />
}
