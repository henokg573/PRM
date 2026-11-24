'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createProduct, toggleProductActive } from '../../actions/orders'

const field =
  'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15'
const label = 'mb-1 block text-xs font-semibold text-zinc-600'

export function ProductForm({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (!open) {
    return (
      <button
        className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
        onClick={() => setOpen(true)}
        type="button"
      >
        + New product
      </button>
    )
  }

  return (
    <form
      className="w-full rounded-xl border border-zinc-200 bg-white p-5"
      onSubmit={(event) => {
        event.preventDefault()
        const data = new FormData(event.currentTarget)
        startTransition(async () => {
          const result = await createProduct(data)
          if (result.ok) {
            setOpen(false)
            setSuccess(result.message ?? 'Product submitted.')
            setError(null)
            router.refresh()
          } else {
            setError(result.error ?? 'Failed.')
          }
        })
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="p-name">Product name</label>
          <input className={field} id="p-name" name="name" required />
        </div>
        <div>
          <label className={label} htmlFor="p-sku">SKU</label>
          <input className={field} id="p-sku" name="sku" required />
        </div>
        <div>
          <label className={label} htmlFor="p-brand">Brand</label>
          <input className={field} id="p-brand" name="brand" required />
        </div>
        <div>
          <label className={label} htmlFor="p-category">Category</label>
          <select className={field} id="p-category" name="category" required>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={label} htmlFor="p-description">Description</label>
          <textarea className={field} id="p-description" name="description" rows={2} required />
        </div>
        <div>
          <label className={label} htmlFor="p-price">Wholesale price (USD / unit)</label>
          <input className={field} id="p-price" name="wholesalePrice" type="number" min="0" step="0.01" required />
        </div>
        <div>
          <label className={label} htmlFor="p-unit">Unit</label>
          <select className={field} id="p-unit" name="unit" defaultValue="case">
            {['case', 'carton', 'pallet', 'bag', 'piece', 'kilogram', 'litre'].map((unit) => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="p-moq">Minimum order quantity</label>
          <input className={field} id="p-moq" name="minimumOrderQuantity" type="number" min="1" defaultValue="1" required />
        </div>
        <div>
          <label className={label} htmlFor="p-stock">Stock</label>
          <input className={field} id="p-stock" name="stock" type="number" min="0" defaultValue="0" required />
        </div>
        <div>
          <label className={label} htmlFor="p-lead">Lead time (days)</label>
          <input className={field} id="p-lead" name="leadTimeDays" type="number" min="0" defaultValue="3" required />
        </div>
        <div>
          <label className={label} htmlFor="p-regions">Delivery regions (comma-separated)</label>
          <input className={field} id="p-regions" name="deliveryRegions" placeholder="Addis Ababa, Adama" />
        </div>
      </div>
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? 'Submitting…' : 'Submit for approval'}
        </button>
        <button className="text-sm font-semibold text-zinc-500" onClick={() => setOpen(false)} type="button">
          Cancel
        </button>
      </div>
    </form>
  )
}

export function ProductToggle({ productID, active }: { productID: string; active: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <button
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${active ? 'border border-zinc-300 text-zinc-600' : 'bg-blue-700 text-white'
        }`}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await toggleProductActive(productID, !active)
          router.refresh()
        })
      }
      type="button"
    >
      {active ? 'Unlist' : 'List'}
    </button>
  )
}
