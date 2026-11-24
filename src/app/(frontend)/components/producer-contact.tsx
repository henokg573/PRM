'use client'

import { useState, useTransition } from 'react'
import { startConversation } from '../actions/orders'

export function ProducerContact({ producerID, producerName }: { producerID: string; producerName: string }) {
  const [open, setOpen] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  if (!open) {
    return (
      <button
        className="mt-3 rounded-lg border border-blue-700 px-3.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
        onClick={() => setOpen(true)}
        type="button"
      >
        Message {producerName}
      </button>
    )
  }

  return (
    <div className="mt-3 space-y-2">
      <input
        className="w-full rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm"
        placeholder="Subject (e.g. wholesale pricing inquiry)"
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
      />
      <textarea
        className="w-full rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm"
        rows={3}
        placeholder="Introduce your shop and what you'd like to source…"
        value={body}
        onChange={(event) => setBody(event.target.value)}
      />
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          className="rounded-lg bg-blue-700 px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          disabled={pending || !subject.trim() || !body.trim()}
          onClick={() =>
            startTransition(async () => {
              setError(null)
              try {
                await startConversation(producerID, subject, body)
              } catch {
                // startConversation redirects on success; failures fall through
              }
            })
          }
          type="button"
        >
          {pending ? 'Sending…' : 'Send message'}
        </button>
        <button className="text-xs font-semibold text-zinc-500" onClick={() => setOpen(false)} type="button">
          Cancel
        </button>
      </div>
    </div>
  )
}
