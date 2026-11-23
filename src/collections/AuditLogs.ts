import type { CollectionConfig } from 'payload'
import { staffOnly } from '@/access/app-access'

export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  admin: {
    group: 'Governance',
    useAsTitle: 'action',
    defaultColumns: ['action', 'entityType', 'actorEmail', 'createdAt'],
  },
  access: {
    create: staffOnly,
    read: staffOnly,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'action', type: 'text', required: true, index: true },
    { name: 'entityType', type: 'text', required: true, index: true },
    { name: 'entityId', type: 'text', required: true, index: true },
    { name: 'actorEmail', type: 'email' },
    { name: 'summary', type: 'textarea', required: true },
    { name: 'ipAddress', type: 'text' },
    { name: 'metadata', type: 'json' },
  ],
  timestamps: true,
}
