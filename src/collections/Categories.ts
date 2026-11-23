import type { CollectionConfig } from 'payload'
import { staffOnly } from '@/access/app-access'

export const Categories: CollectionConfig = {
  slug: 'product-categories',
  admin: { group: 'Catalog', useAsTitle: 'name', defaultColumns: ['name', 'active', 'updatedAt'] },
  access: {
    create: staffOnly,
    read: () => true,
    update: staffOnly,
    delete: staffOnly,
  },
  fields: [
    { name: 'name', type: 'text', required: true, unique: true },
    { name: 'slug', type: 'slug', useAsSlug: 'name' },
    { name: 'description', type: 'textarea' },
    { name: 'active', type: 'checkbox', defaultValue: true, index: true },
  ],
  timestamps: true,
}
