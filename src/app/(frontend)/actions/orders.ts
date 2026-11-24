NEXT_PUBLIC_SUPABASE_URL'use server'

import { getSupabase, type Order } from '@/lib/supabase'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type ActionResult = { ok: boolean; error?: string; message?: string }

type CartItem = { productId: string; quantity: number }

function orgID(session: Awaited<ReturnType<typeof getSession>>) {
  return session?.organization?.id ?? null
}

export async function placeOrder(
  items: CartItem[],
  deliveryAddress: string,
  requestedDeliveryDate: string,
  notes: string,
): Promise<ActionResult> {
  const session = await getSession()
  if (!session || session.user.role !== 'retailer') {
    return { ok: false, error: 'You must be signed in as a shop owner.' }
  }
  const buyerID = orgID(session)
  if (!buyerID) return { ok: false, error: 'Your account is not linked to a business.' }
  if (session.organization?.verification_status !== 'verified') {
    return {
      ok: false,
      error: 'Your business verification is still pending. Orders unlock once you are verified.',
    }
  }

  const cleaned = items.filter((item) => Number.isFinite(item.quantity) && item.quantity > 0)
  if (cleaned.length === 0) return { ok: false, error: 'Your cart is empty.' }
  if (!deliveryAddress.trim()) return { ok: false, error: 'A delivery address is required.' }

  const supabase = getSupabase()
  const productIDs = cleaned.map((item) => item.productId)
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, unit, minimum_order_quantity, stock, wholesale_price, producer_id, approval_status, active')
    .in('id', productIDs)
  if (error) return { ok: false, error: error.message }

  // Group items by producer — one order per producer.
  const byProducer = new Map<string, { productID: string; quantity: number; price: number }[]>()
  for (const item of cleaned) {
    const product = products.find((doc) => doc.id === item.productId)
    if (!product) return { ok: false, error: 'A product in your cart is no longer available.' }
    if (product.approval_status !== 'approved' || !product.active) {
      return { ok: false, error: `${product.name} is not currently available.` }
    }
    if (item.quantity < product.minimum_order_quantity) {
      return {
        ok: false,
        error: `${product.name} has a minimum order of ${product.minimum_order_quantity} ${product.unit}.`,
      }
    }
    if (item.quantity > product.stock) {
      return { ok: false, error: `Insufficient stock for ${product.name}.` }
    }
    const list = byProducer.get(product.producer_id) ?? []
    list.push({ productID: product.id, quantity: item.quantity, price: Number(product.wholesale_price) })
    byProducer.set(product.producer_id, list)
  }

  for (const [producerID, producerItems] of byProducer) {
    const total = producerItems.reduce((sum, item) => sum + item.quantity * item.price, 0)
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        buyer_id: buyerID,
        producer_id: producerID,
        status: 'pending',
        total,
        delivery_address: deliveryAddress.trim(),
        requested_delivery_date: requestedDeliveryDate || null,
        notes: notes.trim() || null,
      })
      .select('id')
      .single()
    if (orderError || !order) return { ok: false, error: orderError?.message ?? 'Order failed.' }

    const { error: itemsError } = await supabase.from('order_items').insert(
      producerItems.map((item) => ({
        order_id: order.id,
        product_id: item.productID,
        quantity: item.quantity,
        unit_price: item.price,
      })),
    )
    if (itemsError) return { ok: false, error: itemsError.message }

    await supabase.from('order_status_events').insert({
      order_id: order.id,
      status: 'pending',
      note: 'Order submitted',
      changed_by: session.user.id,
    })
  }

  revalidatePath('/retailer')
  revalidatePath('/retailer/orders')
  revalidatePath('/producer')
  revalidatePath('/producer/orders')
  return { ok: true, message: 'Your order has been submitted to the producer.' }
}

export async function updateOrderStatus(orderID: string, status: string, note: string): Promise<ActionResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'Not authorised.' }

  const allowed = ['confirmed', 'rejected', 'preparing', 'dispatched', 'in-transit', 'delivered', 'completed', 'cancelled']
  if (!allowed.includes(status)) return { ok: false, error: 'Invalid status.' }

  const supabase = getSupabase()
  const currentOrg = orgID(session)
  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, buyer_id, producer_id, status')
    .eq('id', orderID)
    .maybeSingle()
  if (!order) return { ok: false, error: 'Order not found.' }

  const isProducer = order.producer_id === currentOrg
  const isBuyer = order.buyer_id === currentOrg
  if (!isProducer && !isBuyer) return { ok: false, error: 'Not authorised.' }

  const producerStatuses = ['confirmed', 'rejected', 'preparing', 'dispatched', 'in-transit', 'delivered']
  const buyerStatuses = ['completed', 'cancelled']
  if (isProducer && !producerStatuses.includes(status)) {
    return { ok: false, error: 'Producers cannot set this status.' }
  }
  if (isBuyer && !buyerStatuses.includes(status)) {
    return { ok: false, error: 'Retailers can confirm receipt or cancel pending orders.' }
  }
  if (status === 'completed' && !['delivered'].includes(order.status)) {
    return { ok: false, error: 'Orders can only be completed after delivery.' }
  }
  if (status === 'cancelled' && !['pending', 'quotation', 'confirmed'].includes(order.status)) {
    return { ok: false, error: 'This order can no longer be cancelled.' }
  }

  const { error: updateError } = await supabase.from('orders').update({ status }).eq('id', orderID)
  if (updateError) return { ok: false, error: updateError.message }

  await supabase.from('order_status_events').insert({
    order_id: orderID,
    status,
    note: note.trim() || `Status changed to ${status}`,
    changed_by: session.user.id,
  })

  await supabase.from('notifications').insert({
    title: `Order ${order.order_number} — ${status.replace('-', ' ')}`,
    body: note.trim() || `The order status was updated to ${status}.`,
    kind: 'order',
    organization_id: isProducer ? order.buyer_id : order.producer_id,
  })

  revalidatePath('/producer')
  revalidatePath('/producer/orders')
  revalidatePath('/retailer')
  revalidatePath('/retailer/orders')
  return { ok: true, message: `Order marked as ${status.replace('-', ' ')}.` }
}

export async function sendMessage(conversationID: string, body: string): Promise<ActionResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'Not authorised.' }
  if (!body.trim()) return { ok: false, error: 'Message cannot be empty.' }

  const supabase = getSupabase()
  const currentOrg = orgID(session)
  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, producer_id, retailer_id')
    .eq('id', conversationID)
    .maybeSingle()
  if (!conversation) return { ok: false, error: 'Conversation not found.' }
  if (conversation.producer_id !== currentOrg && conversation.retailer_id !== currentOrg) {
    return { ok: false, error: 'Not authorised.' }
  }

  const { error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationID, sender_id: session.user.id, body: body.trim() })
  if (error) return { ok: false, error: error.message }
  await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationID)

  revalidatePath(`/messages/${conversationID}`)
  return { ok: true }
}

export async function startConversation(
  producerID: string,
  subject: string,
  body: string,
): Promise<ActionResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'Not authorised.' }
  const currentOrg = orgID(session)
  if (!currentOrg) return { ok: false, error: 'Your account is not linked to a business.' }
  if (session.user.role !== 'retailer') {
    return { ok: false, error: 'Only retailers can start conversations here.' }
  }
  if (!subject.trim() || !body.trim()) return { ok: false, error: 'Subject and message are required.' }

  const supabase = getSupabase()
  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({ subject: subject.trim(), producer_id: producerID, retailer_id: currentOrg })
    .select('id')
    .single()
  if (error || !conversation) return { ok: false, error: error?.message ?? 'Failed.' }

  await supabase
    .from('messages')
    .insert({ conversation_id: conversation.id, sender_id: session.user.id, body: body.trim() })

  revalidatePath('/messages')
  redirect(`/messages/${conversation.id}`)
}

export async function openDispute(orderID: string, subject: string, description: string): Promise<ActionResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'Not authorised.' }
  const currentOrg = orgID(session)
  if (!subject.trim() || !description.trim()) {
    return { ok: false, error: 'Subject and description are required.' }
  }

  const supabase = getSupabase()
  const { data: order } = await supabase
    .from('orders')
    .select('id, buyer_id, producer_id')
    .eq('id', orderID)
    .maybeSingle()
  if (!order) return { ok: false, error: 'Order not found.' }
  if (order.buyer_id !== currentOrg && order.producer_id !== currentOrg) {
    return { ok: false, error: 'Not authorised.' }
  }

  const { error } = await supabase.from('disputes').insert({
    subject: subject.trim(),
    order_id: orderID,
    opened_by: session.user.id,
    description: description.trim(),
    status: 'open',
    priority: 'medium',
  })
  if (error) return { ok: false, error: error.message }

  revalidatePath('/retailer')
  revalidatePath('/producer')
  return { ok: true, message: 'Dispute submitted. An administrator will follow up.' }
}

export async function submitReview(
  producerID: string,
  title: string,
  rating: number,
  comment: string,
): Promise<ActionResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'Not authorised.' }
  const currentOrg = orgID(session)
  if (!currentOrg) return { ok: false, error: 'Not authorised.' }
  if (!title.trim()) return { ok: false, error: 'A review title is required.' }
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: 'Rating must be between 1 and 5.' }
  }

  const supabase = getSupabase()
  const { count, error } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('buyer_id', currentOrg)
    .eq('producer_id', producerID)
    .in('status', ['delivered', 'completed'])
  if (error) return { ok: false, error: error.message }
  if (!count) {
    return { ok: false, error: 'You can only review producers after a completed transaction.' }
  }

  const { error: insertError } = await supabase.from('reviews').insert({
    title: title.trim(),
    producer_id: producerID,
    retailer_id: currentOrg,
    rating: Math.round(rating),
    comment: comment.trim() || null,
    published: false,
  })
  if (insertError) return { ok: false, error: insertError.message }

  revalidatePath('/retailer/producers')
  return { ok: true, message: 'Review submitted for moderation.' }
}

export async function createProduct(formData: FormData): Promise<ActionResult> {
  const session = await getSession()
  if (!session || session.user.role !== 'producer') {
    return { ok: false, error: 'Only producers can publish products.' }
  }
  const producerID = orgID(session)
  if (!producerID) return { ok: false, error: 'Your account is not linked to a producer organization.' }
  if (session.organization?.verification_status !== 'verified') {
    return { ok: false, error: 'Only verified producer organizations can publish products.' }
  }

  const name = String(formData.get('name') ?? '').trim()
  const sku = String(formData.get('sku') ?? '').trim().toUpperCase()
  const brand = String(formData.get('brand') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const category = String(formData.get('category') ?? '')
  const unit = String(formData.get('unit') ?? 'case')
  const wholesalePrice = Number(formData.get('wholesalePrice'))
  const minimumOrderQuantity = Number(formData.get('minimumOrderQuantity'))
  const stock = Number(formData.get('stock'))
  const leadTimeDays = Number(formData.get('leadTimeDays'))
  const deliveryRegions = String(formData.get('deliveryRegions') ?? '')
    .split(',')
    .map((region) => region.trim())
    .filter(Boolean)

  if (!name || !sku || !brand || !description || !category) {
    return { ok: false, error: 'Name, SKU, brand, description, and category are required.' }
  }
  if (!Number.isFinite(wholesalePrice) || wholesalePrice < 0) return { ok: false, error: 'Enter a valid wholesale price.' }
  if (!Number.isFinite(minimumOrderQuantity) || minimumOrderQuantity < 1) {
    return { ok: false, error: 'Minimum order quantity must be at least 1.' }
  }
  if (!Number.isFinite(stock) || stock < 0) return { ok: false, error: 'Enter valid stock.' }
  if (!Number.isFinite(leadTimeDays) || leadTimeDays < 0) return { ok: false, error: 'Enter a valid lead time in days.' }

  const supabase = getSupabase()
  const { error } = await supabase.from('products').insert({
    name,
    sku,
    producer_id: producerID,
    category_id: category,
    brand,
    description,
    unit,
    wholesale_price: wholesalePrice,
    minimum_order_quantity: minimumOrderQuantity,
    stock,
    lead_time_days: leadTimeDays,
    delivery_regions: deliveryRegions,
    approval_status: 'pending',
    active: true,
  })
  if (error) return { ok: false, error: error.message }

  revalidatePath('/producer')
  revalidatePath('/producer/products')
  revalidatePath('/marketplace')
  return { ok: true, message: 'Product submitted for approval.' }
}

export async function toggleProductActive(productID: string, active: boolean): Promise<ActionResult> {
  const session = await getSession()
  if (!session || session.user.role !== 'producer') return { ok: false, error: 'Not authorised.' }
  const producerID = orgID(session)

  const supabase = getSupabase()
  const { error } = await supabase
    .from('products')
    .update({ active })
    .eq('id', productID)
    .eq('producer_id', producerID ?? '')
  if (error) return { ok: false, error: 'Could not update the product.' }

  revalidatePath('/producer/products')
  revalidatePath('/marketplace')
  return { ok: true, message: active ? 'Product listed.' : 'Product unlisted.' }
}

export async function markNotificationsRead(): Promise<ActionResult> {
  const session = await getSession()
  if (!session) return { ok: false, error: 'Not authorised.' }
  const currentOrg = orgID(session)

  const supabase = getSupabase()
  const query = supabase.from('notifications').update({ read: true }).eq('read', false)
  if (currentOrg) {
    await query.eq('organization_id', currentOrg)
  } else {
    await query.eq('user_id', session.user.id)
  }
  revalidatePath('/notifications')
  return { ok: true }
}

export type { Order }
