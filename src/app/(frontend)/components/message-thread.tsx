'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { sendMessage } from '../actions/orders'

export type ThreadMessage = {
  id: string
  senderName: string
  senderID: string
  body: string
  createdAt: string
}

export function MessageThread({
  conversationID,
  currentUserName,
  initialMessages,
}: {
  conversationID: string
  currentUserName: string
  initialMessages: ThreadMessage[]
}) {
  const router = useRouter()
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const send = () => {
    const body = draft
    if (!body.trim()) return
    setDraft('')
    startTransition(async () => {
      const result = await sendMessage(conversationID, body)
      if (result.ok) {
        setMessages((previous) => [
          ...previous,
          {
            id: `local-${Date.now()}`,
            senderName: currentUserName,
            senderID: 'me',
            body,
            createdAt: new Date().toISOString(),
          },
        ])
        router.refresh()
      } else {
        setError(result.error ?? 'Message failed.')
      }
    })
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      <div className="max-h-[28rem] space-y-3 overflow-y-auto p-5">
        {messages.map((message) => {
          const mine = message.senderName === currentUserName
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-md rounded-2xl px-4 py-2.5 text-sm ${mine ? 'bg-blue-700 text-white' : 'bg-zinc-100 text-zinc-800'
                  }`}
              >
                {!mine && (
                  <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    {message.senderName}
                  </p>
                )}
                <p className="whitespace-pre-wrap">{message.body}</p>
                <p className={`mt-1 text-[10px] ${mine ? 'text-blue-200' : 'text-zinc-400'}`}>
                  {new Date(message.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )
        })}
        {messages.length === 0 && (
          <p className="py-6 text-center text-sm text-zinc-400">No messages yet — say hello.</p>
        )}
      </div>
      {error && <p className="px-5 pb-2 text-xs font-medium text-red-600">{error}</p>}
      <div className="flex gap-2 border-t border-zinc-200 p-3">
        <input
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-blue-600"
          placeholder="Type a message…"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              send()
            }
          }}
        />
        <button
          className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          onClick={send}
          disabled={pending || !draft.trim()}
          type="button"
        >
          Send
        </button>
      </div>
    </div>
  )
}
