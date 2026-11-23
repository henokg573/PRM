import type { CollectionConfig } from 'payload'
import { isPlatformAdmin, ownOrganization, signedInAppUser } from '@/access/app-access'

export const Organizations: CollectionConfig = {
  slug: 'organizations',
  admin: {
    group: 'Partners',
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'verificationStatus', 'region', 'createdAt'],
  },
  access: {
    create: signedInAppUser,
    read: ownOrganization,
    update: ownOrganization,
    delete: ({ req }) => isPlatformAdmin(req),
  },
  fields: [
    { name: 'name', type: 'text', required: true, index: true },
    { name: 'legalName', type: 'text', required: true },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Producer / manufacturer', value: 'producer' },
        { label: 'Retail shop', value: 'retailer' },
      ],
      index: true,
    },
    {
      name: 'verificationStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: ['pending', 'in-review', 'verified', 'rejected', 'suspended'],
      index: true,
      access: { update: ({ req }) => isPlatformAdmin(req) },
      admin: { position: 'sidebar' },
    },
    { name: 'registrationNumber', type: 'text', required: true, unique: true },
    { name: 'taxNumber', type: 'text' },
    { name: 'phone', type: 'text', required: true },
    { name: 'email', type: 'email', required: true },
    { name: 'region', type: 'text', required: true, index: true },
    { name: 'address', type: 'textarea', required: true },
    {
      name: 'accountManager',
      type: 'relationship',
      relationTo: 'admins',
      access: { update: ({ req }) => isPlatformAdmin(req) },
      admin: { position: 'sidebar' },
    },
  ],
  timestamps: true,
  versions: { maxPerDoc: 30 },
}
