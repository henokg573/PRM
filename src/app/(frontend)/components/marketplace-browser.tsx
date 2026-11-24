'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { placeOrder } from '../actions/orders'
import { money } from './dashboard-shell'

export type MarketProduct = {
  id: string
  name: string
  brand: string
  description: string
  unit: string
  wholesalePrice: number
  minimumOrderQuantity: number
  stock: number
  leadTimeDays: number
  deliveryRegions: string[]
  producerName: string
  producerRegion: string
  categoryName: string
}

export function MarketplaceBrowser({
  products,
  canOrder,
  notice,
}: {
  products: MarketProduct[]
  canOrder: boolean
  notice?: string
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [address, setAddress] = useState('')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(products.map((product) => product.categoryName)))],
    [products],
  )

  const filtered = products.filter((product) => {
    const matchesCategory = category === 'all' || product.categoryName === category
    const normalized = query.trim().toLowerCase()
    const matchesQuery =
      !normalized ||
      [product.name, product.brand, product.producerName].some((value) =>
        value.toLowerCase().includes(normalized),
      )
    return matchesCategory && matchesQuery
  })

  const cartItems = Object.entries(cart)
    .map(([id, quantity]) => ({ product: products.find((p) => p.id === id)!, quantity }))
    .filter((item) => item.product && quantityValid(item))
  const cartTotal = cartItems.reduce((sum, item) => sum + item.quantity * item.product.wholesalePrice, 0)

  const setQuantity = (id: string, value: number) => {
    setCart((previous) => {
      const next = { ...previous }
      if (value <= 0) delete next[id]
      else next[id] = value
      return next
    })
  }

  const submit = () => {
    if (!checkoutOpen) {
      setCheckoutOpen(true)
      return
    }
    startTransition(async () => {
      const result = await placeOrder(
        cartItems.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
        address,
        date,
        notes,
      )
      if (result.ok) {
        setCart({})
        setAddress('')
        setDate('')
        setNotes('')
        setCheckoutOpen(false)
        setFeedback({ ok: true, text: result.message ?? 'Order submitted.' })
        router.refresh()
      } else {
        setFeedback({ ok: false, text: result.error ?? 'Order failed.' })
      }
    })
  }

  return (
    <div>
      {notice && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
          {notice}
        </p>
      )}
      {feedback && (
        <p
          className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${feedback.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'
            }`}
        >
          {feedback.text}
        </p>
      )}

      <div className="mb-5 flex flex-wrap gap-3">
        <input
          className="min-w-56 flex-1 rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
          placeholder="Search products, brands, producers…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
        >
          {categories.map((value) => (
            <option key={value} value={value}>
              {value === 'all' ? 'All categories' : value}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((product) => (
          <article key={product.id} className="flex flex-col rounded-xl border border-zinc-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {product.categoryName}
              </span>
              <span className="text-xs text-zinc-400">{product.stock} in stock</span>
            </div>
            <h3 className="text-sm font-bold text-zinc-900">{product.name}</h3>
            <p className="text-xs text-zinc-500">
              {product.brand} · {product.producerName}
            </p>
            <p className="mt-2 line-clamp-2 text-xs text-zinc-500">{product.description}</p>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-lg font-bold text-zinc-900">{money(product.wholesalePrice)}</span>
              <span className="text-xs text-zinc-400">/ {product.unit}</span>
            </div>
            <p className="text-[11px] text-zinc-400">
              MOQ {product.minimumOrderQuantity} · lead time {product.leadTimeDays}d · {product.producerRegion}
            </p>
            {canOrder ? (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="number"
                  min={product.minimumOrderQuantity}
                  max={product.stock}
                  value={cart[product.id] ?? ''}
                  placeholder={String(product.minimumOrderQuantity)}
                  onChange={(event) => setQuantity(product.id, Number(event.target.value))}
                  className="w-20 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
                  aria-label={`Quantity for ${product.name}`}
                />
                <button
                  className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800"
                  onClick={() => setQuantity(product.id, product.minimumOrderQuantity)}
                  type="button"
                >
                  Add {product.minimumOrderQuantity}+
                </button>
              </div>
            ) : (
              <Link
                className="mt-3 text-xs font-semibold text-blue-700 hover:underline"
                href="/login"
              >
                Sign in to order →
              </Link>
            )}
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="text-sm font-semibold text-zinc-700">No products match your search</p>
          <p className="mt-1 text-xs text-zinc-500">Try a different keyword or category.</p>
        </div>
      )}

      {canOrder && cartItems.length > 0 && (
        <div className="sticky bottom-4 mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-lg">
          {!checkoutOpen ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Cart · {cartItems.length} product{cartItems.length === 1 ? '' : 's'}
                </p>
                <p className="text-lg font-bold text-zinc-900">{money(cartTotal)}</p>
              </div>
              <button
                className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                onClick={submit}
                type="button"
              >
                Review order →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="max-h-40 space-y-1 overflow-y-auto text-sm">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-zinc-600">
                    <span>
                      {item.product.name} × {item.quantity}
                    </span>
                    <span>{money(item.quantity * item.product.wholesalePrice)}</span>
                  </div>
                ))}
                <div className="flex justify-between border-t border-zinc-200 pt-1 font-bold text-zinc-900">
                  <span>Total</span>
                  <span>{money(cartTotal)}</span>
                </div>
              </div>
              <input
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                placeholder="Delivery address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  aria-label="Requested delivery date"
                />
                <input
                  className="flex-[2] rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                  placeholder="Notes (optional)"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-600"
                  onClick={() => setCheckoutOpen(false)}
                  type="button"
                >
                  Back
                </button>
                <button
                  className="flex-1 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                  onClick={submit}
                  disabled={pending}
                  type="button"
                >
                  {pending ? 'Submitting…' : `Place order · ${money(cartTotal)}`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function quantityValid(item: { product: MarketProduct; quantity: number }) {
  return item.quantity >= item.product.minimumOrderQuantity && item.quantity <= item.product.stock
}
