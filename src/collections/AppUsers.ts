import type { CollectionConfig } from 'payload'
import { isPlatformAdmin, ownProfile } from '@/access/app-access'

export const AppUsers: CollectionConfig = {
  slug: 'app-users',
  auth: true,
  admin: {
    group: 'Partners',
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role', 'status', 'organization'],
  },
  access: {
    create: () => true,
    read: ownProfile,
    update: ownProfile,
    delete: ({ req }) => isPlatformAdmin(req),
    admin: ({ req }) => isPlatformAdmin(req),
  },
  hooks: {
    beforeValidate: [
      ({ data, operation, req }) => {
        if (operation !== 'create' || isPlatformAdmin(req)) return data
        return {
          ...data,
          role: data?.role === 'producer' ? 'producer' : 'retailer',
          status: 'pending',
          organization: undefined,
        }
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      saveToJWT: true,
      defaultValue: 'retailer',
      options: [
        { label: 'Producer', value: 'producer' },
        { label: 'Retailer', value: 'retailer' },
        { label: 'Platform administrator', value: 'platform-admin' },
      ],
      access: { update: ({ req }) => isPlatformAdmin(req) },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      saveToJWT: true,
      defaultValue: 'pending',
      options: ['pending', 'active', 'suspended', 'terminated'],
      access: { update: ({ req }) => isPlatformAdmin(req) },
    },
    {
      name: 'organization',
      type: 'relationship',
      relationTo: 'organizations',
      saveToJWT: true,
      index: true,
      access: { update: ({ req }) => isPlatformAdmin(req) },
    },
    { name: 'jobTitle', type: 'text' },
    { name: 'lastActiveAt', type: 'date', admin: { position: 'sidebar' } },
  ],
  timestamps: true,
}
