import type { CollectionConfig } from 'payload'
import { isPlatformAdmin, orderParticipant, organizationID } from '@/access/app-access'

const finalStatuses = [
  'confirmed',
  'preparing',
  'dispatched',
  'in-transit',
  'delivered',
  'completed',
]

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    group: 'Operations',
    useAsTitle: 'orderNumber',
    defaultColumns: [
      'orderNumber',
      'buyerOrganization',
      'producerOrganization',
      'status',
      'total',
      'createdAt',
    ],
  },
  access: {
    create: ({ req }) => Boolean(organizationID(req)),
    read: orderParticipant,
    update: orderParticipant,
    delete: ({ req }) => isPlatformAdmin(req),
  },
  hooks: {
    beforeValidate: [
      async ({ data, originalDoc, operation, req }) => {
        const next = { ...data }
        if (operation === 'create') {
          const buyer = organizationID(req)
          if (!buyer) throw new Error('A buyer organization is required.')
          const organization = await req.payload.findByID({
            collection: 'organizations',
            id: buyer,
            depth: 0,
            overrideAccess: true,
            req,
          })
          if (organization.type !== 'retailer' || organization.verificationStatus !== 'verified') {
            throw new Error('Only verified retailers can place wholesale orders.')
          }
          next.buyerOrganization = buyer
          next.orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`
          next.status = 'pending'
        }

        const status = next.status ?? originalDoc?.status
        const items = next.items ?? originalDoc?.items ?? []
        if (finalStatuses.includes(status)) {
          for (const item of items) {
            const productID = typeof item.product === 'object' ? item.product.id : item.product
            const product = await req.payload.findByID({
              collection: 'products',
              id: productID,
              depth: 0,
              overrideAccess: true,
              req,
            })
            if (item.quantity < product.minimumOrderQuantity) {
              throw new Error(
                `${product.name} requires a minimum quantity of ${product.minimumOrderQuantity}.`,
              )
            }
            if (item.quantity > product.stock) {
              throw new Error(`Insufficient stock for ${product.name}.`)
            }
          }
        }
        next.total = items.reduce(
          (sum: number, item: { quantity: number; unitPrice: number }) =>
            sum + item.quantity * item.unitPrice,
          0,
        )
        return next
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, req, operation }) => {
        if (operation === 'create' || previousDoc?.status !== doc.status) {
          await req.payload.create({
            collection: 'order-status-events',
            overrideAccess: true,
            req,
            data: {
              order: doc.id,
              status: doc.status,
              note:
                operation === 'create'
                  ? 'Order submitted'
                  : `Status changed from ${previousDoc.status}`,
              changedBy: req.user?.collection === 'app-users' ? req.user.id : undefined,
            },
          })
        }
      },
    ],
  },
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      access: { create: () => false, update: () => false },
    },
    {
      name: 'buyerOrganization',
      type: 'relationship',
      relationTo: 'organizations',
      required: true,
      index: true,
      access: { create: () => false, update: ({ req }) => isPlatformAdmin(req) },
    },
    {
      name: 'producerOrganization',
      type: 'relationship',
      relationTo: 'organizations',
      required: true,
      index: true,
      access: { update: ({ req }) => isPlatformAdmin(req) },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        'pending',
        'quotation',
        'confirmed',
        'preparing',
        'dispatched',
        'in-transit',
        'delivered',
        'completed',
        'cancelled',
        'disputed',
      ],
      index: true,
      admin: { position: 'sidebar' },
      access: { create: () => false },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products', required: true },
        { name: 'quantity', type: 'number', required: true, min: 1 },
        { name: 'unitPrice', type: 'number', required: true, min: 0 },
      ],
    },
    {
      name: 'total',
      type: 'number',
      required: true,
      min: 0,
      access: { create: () => false, update: () => false },
    },
    { name: 'deliveryAddress', type: 'textarea', required: true },
    { name: 'requestedDeliveryDate', type: 'date' },
    { name: 'notes', type: 'textarea' },
  ],
  timestamps: true,
  versions: { maxPerDoc: 100 },
}
