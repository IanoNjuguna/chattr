/** Reverse-chronological activity feed. Under 80 lines. */
import { MessageSquare } from 'lucide-react'
import { ActivityCard } from './ActivityCard'
import type { ActivityItem } from '../lib/types'

interface Props {
  items:     ActivityItem[]
  loading:   boolean
  isPreview: boolean
}

export function Feed({ items, loading, isPreview }: Props) {
  if (loading && items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3" style={{ color: 'var(--subtle)' }}>
        <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
        <span className="text-sm">Loading activity…</span>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 px-4">
        <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <MessageSquare size={28} style={{ color: 'var(--subtle)' }} />
        </div>
        <div className="text-center">
          <p className="font-medium text-sm" style={{ color: 'var(--ink-2)' }}>No activity yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--subtle)' }}>
            {isPreview ? 'Connect a wallet to get started' : 'Top up the room to begin'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2 px-4 py-4">
      {isPreview && (
        <p className="text-xs text-center pb-2" style={{ color: 'var(--subtle)' }}>
          Sample activity — connect a wallet to use a real room
        </p>
      )}
      {items.map(item => (
        <ActivityCard key={item.id} item={item} />
      ))}
    </div>
  )
}
