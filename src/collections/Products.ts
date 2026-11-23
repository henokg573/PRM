import type { CollectionConfig, Where } from 'payload'
import {
  getIdentity,
  isPlatformAdmin,
  organizationID,
  organizationOwned,
} from '@/access/app-access'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    group: 'Catalog',
    useAsTitle: 'name',
    defaultColumns: ['name', 'sku', 'producer', 'approvalStatus', 'stock', 'wholesalePrice'],
  },
  access: {
    create: ({ req }) => Boolean(organizationID(req)),
    read: ({ req }) => {
      if (isPlatformAdmin(req)) return true
      const organization = organizationID(req)
      const published: Where = {
        and: [{ approvalStatus: { equals: 'approved' } }, { active: { equals: true } }],
      }
      if (getIdentity(req)?.role === 'producer' && organization) {
        return { or: [{ producer: { equals: organization } }, published] } as Where
      }
      return published
    },
    update: organizationOwned('producer'),
    delete: ({ req }) => isPlatformAdmin(req),
  },
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (operation !== 'create' || isPlatformAdmin(req)) return data
        const producer = organizationID(req)
        if (!producer) throw new Error('A producer organization is required.')
        const organization = await req.payload.findByID({
          collection: 'organizations',
          id: producer,
          depth: 0,
          overrideAccess: true,
          req,
        })
        if (organization.type !== 'producer' || organization.verificationStatus !== 'verified') {
          throw new Error('Only verified producer organizations can publish products.')
        }
        return { ...data, producer, approvalStatus: 'pending' }
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true, index: true },
    { name: 'sku', type: 'text', required: true, unique: true, index: true },
    {
      name: 'producer',
      type: 'relationship',
      relationTo: 'organizations',
      required: true,
      index: true,
      access: {
        create: ({ req }) => isPlatformAdmin(req),
        update: ({ req }) => isPlatformAdmin(req),
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'product-categories',
      required: true,
      index: true,
    },
    { name: 'brand', type: 'text', required: true, index: true },
    { name: 'description', type: 'textarea', required: true },
    { name: 'images', type: 'upload', relationTo: 'media', hasMany: true },
    {
      name: 'unit',
      type: 'select',
      required: true,
      options: ['case', 'carton', 'pallet', 'bag', 'piece', 'kilogram', 'litre'],
    },
    { name: 'wholesalePrice', type: 'number', required: true, min: 0 },
    { name: 'minimumOrderQuantity', type: 'number', required: true, min: 1, defaultValue: 1 },
    { name: 'stock', type: 'number', required: true, min: 0, defaultValue: 0 },
    { name: 'productionCapacity', type: 'number', min: 0 },
    { name: 'leadTimeDays', type: 'number', required: true, min: 0 },
    { name: 'deliveryRegions', type: 'text', hasMany: true },
    {
      name: 'approvalStatus',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: ['pending', 'approved', 'rejected', 'suspended', 'archived'],
      index: true,
      access: { update: ({ req }) => isPlatformAdmin(req) },
      admin: { position: 'sidebar' },
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: { position: 'sidebar' },
    },
  ],
  timestamps: true,
  versions: { maxPerDoc: 50 },
}
