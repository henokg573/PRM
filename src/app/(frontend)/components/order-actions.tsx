'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateOrderStatus, openDispute } from '../actions/orders'

export function OrderActions({
  orderID,
  status,
  role,
}: {
  orderID: string
  status: string
  role: 'producer' | 'retailer'
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')

  const actions: { label: string; value: string; tone: string }[] =
    role === 'producer'
      ? [
        ...(status === 'pending'
          ? [
            { label: 'Accept', value: 'confirmed', tone: 'bg-blue-700 text-white' },
            { label: 'Reject', value: 'rejected', tone: 'bg-red-600 text-white' },
          ]
          : []),
        ...(status === 'confirmed'
          ? [{ label: 'Start preparing', value: 'preparing', tone: 'bg-blue-700 text-white' }]
          : []),
        ...(status === 'preparing'
          ? [{ label: 'Dispatch', value: 'dispatched', tone: 'bg-blue-700 text-white' }]
          : []),
        ...(status === 'dispatched'
          ? [{ label: 'In transit', value: 'in-transit', tone: 'bg-blue-700 text-white' }]
          : []),
        ...(status === 'in-transit'
          ? [{ label: 'Mark delivered', value: 'delivered', tone: 'bg-emerald-600 text-white' }]
          : []),
      ]
      : [
        ...(status === 'delivered'
          ? [{ label: 'Confirm receipt', value: 'completed', tone: 'bg-emerald-600 text-white' }]
          : []),
        ...(['pending', 'quotation', 'confirmed'].includes(status)
          ? [{ label: 'Cancel', value: 'cancelled', tone: 'bg-zinc-700 text-white' }]
          : []),
      ]

  const run = (value: string) => {
    setError(null)
    startTransition(async () => {
      const result = await updateOrderStatus(orderID, value, '')
      if (result.ok) router.refresh()
      else setError(result.error ?? 'Update failed.')
    })
  }

  const submitDispute = () => {
    startTransition(async () => {
      const result = await openDispute(orderID, subject, description)
      if (result.ok) {
        setDisputeOpen(false)
        setSubject('')
        setDescription('')
        router.refresh()
      } else {
        setError(result.error ?? 'Failed.')
      }
    })
  }

  if (actions.length === 0 && !disputeOpen) {
    return (
      <button
        className="text-xs font-semibold text-red-600 hover:underline"
        onClick={() => setDisputeOpen(true)}
        type="button"
      >
        Report problem
      </button>
    )
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.value}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-60 ${action.tone}`}
            disabled={pending}
            onClick={() => run(action.value)}
            type="button"
          >
            {action.label}
          </button>
        ))}
        {role === 'retailer' && ['pending', 'quotation', 'confirmed'].includes(status) && (
          <button
            className="text-xs font-semibold text-red-600 hover:underline"
            onClick={() => setDisputeOpen(true)}
            type="button"
          >
            Report problem
          </button>
        )}
      </div>
      {disputeOpen && (
        <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
          <input
            className="w-full rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm"
            placeholder="Problem summary"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          />
          <textarea
            className="w-full rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm"
            placeholder="Describe the issue…"
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <div className="flex gap-2">
            <button
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
              onClick={submitDispute}
              disabled={pending || !subject.trim() || !description.trim()}
              type="button"
            >
              Submit dispute
            </button>
            <button
              className="text-xs font-semibold text-zinc-500"
              onClick={() => setDisputeOpen(false)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
