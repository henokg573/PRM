import type { CollectionConfig } from 'payload'
import { isPlatformAdmin, orderParticipantViaOrder, organizationID } from '@/access/app-access'

export const Disputes: CollectionConfig = {
  slug: 'disputes',
  admin: {
    group: 'Operations',
    useAsTitle: 'subject',
    defaultColumns: ['subject', 'order', 'status', 'priority', 'createdAt'],
  },
  access: {
    create: ({ req }) => Boolean(organizationID(req)),
    read: orderParticipantViaOrder,
    update: ({ req }) => isPlatformAdmin(req),
    delete: ({ req }) => isPlatformAdmin(req),
  },
  fields: [
    { name: 'subject', type: 'text', required: true },
    { name: 'order', type: 'relationship', relationTo: 'orders', required: true, index: true },
    { name: 'openedBy', type: 'relationship', relationTo: 'app-users', required: true },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'open',
      options: ['open', 'investigating', 'awaiting-response', 'resolved', 'closed'],
      index: true,
    },
    {
      name: 'priority',
      type: 'select',
      required: true,
      defaultValue: 'medium',
      options: ['low', 'medium', 'high', 'critical'],
    },
    { name: 'description', type: 'textarea', required: true },
    { name: 'resolution', type: 'textarea' },
    { name: 'resolvedAt', type: 'date' },
  ],
  timestamps: true,
  versions: { maxPerDoc: 50 },
}
