'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'

export function NotificationsReadButton({ onMark }: { onMark: () => Promise<unknown> }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  return (
    <button
      className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100 disabled:opacity-60"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await onMark()
          router.refresh()
        })
      }
      type="button"
    >
      Mark all read
    </button>
  )
}
