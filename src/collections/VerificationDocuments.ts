import type { CollectionConfig } from 'payload'
import { isPlatformAdmin, organizationOwned } from '@/access/app-access'

export const VerificationDocuments: CollectionConfig = {
  slug: 'verification-documents',
  admin: {
    group: 'Partners',
    useAsTitle: 'title',
    defaultColumns: ['title', 'organization', 'documentType', 'status', 'createdAt'],
  },
  access: {
    create: organizationOwned(),
    read: organizationOwned(),
    update: organizationOwned(),
    delete: ({ req }) => isPlatformAdmin(req),
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'organization',
      type: 'relationship',
      relationTo: 'organizations',
      required: true,
      index: true,
    },
    {
      name: 'documentType',
      type: 'select',
      required: true,
      options: ['business-license', 'tax-certificate', 'quality-certificate', 'identity', 'other'],
    },
    { name: 'file', type: 'upload', relationTo: 'media', required: true },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'pending',
      required: true,
      options: ['pending', 'approved', 'rejected', 'expired'],
      access: { update: ({ req }) => isPlatformAdmin(req) },
      admin: { position: 'sidebar' },
    },
    {
      name: 'reviewNotes',
      type: 'textarea',
      access: {
        read: ({ req }) => isPlatformAdmin(req),
        update: ({ req }) => isPlatformAdmin(req),
      },
    },
    { name: 'expiresAt', type: 'date' },
  ],
  timestamps: true,
  versions: { maxPerDoc: 20 },
}
