import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cached: SupabaseClient | null = null

/**
 * Server-side Supabase client using the service-role key.
 * Only use in server components, server actions, and route handlers.
 */
export function getSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error(
      'Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local',
    )
  }

  if (!cached) {
    cached = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return cached
}

// ============ Row types (mirror supabase/schema.sql) ============

export type Organization = {
  id: string
  name: string
  legal_name: string
  type: 'producer' | 'retailer'
  verification_status: 'pending' | 'in-review' | 'verified' | 'rejected' | 'suspended'
  registration_number: string
  tax_number: string | null
  phone: string
  email: string
  region: string
  address: string
  created_at: string
  updated_at: string
}

export type AppUser = {
  id: string
  name: string
  email: string
  password_hash: string
  role: 'producer' | 'retailer' | 'platform-admin'
  status: 'pending' | 'active' | 'suspended' | 'terminated'
  organization_id: string | null
  created_at: string
  last_active_at: string | null
}

export type Product = {
  id: string
  name: string
  sku: string
  producer_id: string
  category_id: string | null
  brand: string
  description: string
  unit: string
  wholesale_price: number
  minimum_order_quantity: number
  stock: number
  lead_time_days: number
  delivery_regions: string[]
  approval_status: 'pending' | 'approved' | 'rejected' | 'suspended' | 'archived'
  active: boolean
  created_at: string
  updated_at: string
}

export type Order = {
  id: string
  order_number: string
  buyer_id: string
  producer_id: string
  status:
  | 'pending'
  | 'quotation'
  | 'confirmed'
  | 'preparing'
  | 'dispatched'
  | 'in-transit'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'rejected'
  | 'disputed'
  total: number
  delivery_address: string
  requested_delivery_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  quantity: number
  unit_price: number
}

export type Conversation = {
  id: string
  subject: string
  producer_id: string
  retailer_id: string
  created_at: string
  updated_at: string
}

export type Message = {
  id: string
  conversation_id: string
  sender_id: string
  body: string
  created_at: string
}

export type Review = {
  id: string
  title: string
  producer_id: string
  retailer_id: string
  rating: number
  comment: string | null
  published: boolean
  created_at: string
}

export type Dispute = {
  id: string
  subject: string
  order_id: string
  opened_by: string
  status: 'open' | 'investigating' | 'awaiting-response' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  description: string
  resolution: string | null
  resolved_at: string | null
  created_at: string
}

export type Notification = {
  id: string
  title: string
  body: string
  kind: 'system' | 'order' | 'verification' | 'announcement' | 'dispute'
  user_id: string | null
  organization_id: string | null
  read: boolean
  created_at: string
}
