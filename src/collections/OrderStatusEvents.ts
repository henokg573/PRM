import type { CollectionConfig } from 'payload'
import { orderParticipantViaOrder, staffOnly } from '@/access/app-access'

export const OrderStatusEvents: CollectionConfig = {
  slug: 'order-status-events',
  admin: {
    group: 'Operations',
    useAsTitle: 'status',
    defaultColumns: ['order', 'status', 'changedBy', 'createdAt'],
  },
  access: {
    create: staffOnly,
    read: orderParticipantViaOrder,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'order', type: 'relationship', relationTo: 'orders', required: true, index: true },
    { name: 'status', type: 'text', required: true, index: true },
    { name: 'note', type: 'textarea' },
    { name: 'changedBy', type: 'relationship', relationTo: 'app-users' },
  ],
  timestamps: true,
}
