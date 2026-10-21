import { fmtUsdcFine } from '../../lib/money'
import type { RoomData } from '../../lib/types'

interface Props {
  room: RoomData | undefined
  feeBps: number
  isPreview: boolean
  awaitingYou: number
  onTopUp: () => void
  onRequest: () => void
}

/** Centre header: the number people came for, its terms, and two actions. */
export function RoomTop({ room, feeBps, isPreview, awaitingYou, onTopUp, onRequest }: Props) {
  return (
    <header className="px-7 pt-6 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-[13px] font-medium truncate" style={{ color: 'var(--ink)' }}>
              {room?.name ?? 'Room'}
            </h1>
            {isPreview && (
              <span className="text-[10px] uppercase tracking-[0.12em] rounded px-1.5 py-0.5"
                style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                preview
              </span>
            )}
          </div>

          <div className="amount text-[34px] leading-none mt-2" style={{ color: 'var(--ink)' }}>
            {fmtUsdcFine(room?.balance ?? 0n)}
          </div>

          <div className="mt-2 text-[11px]" style={{ color: 'var(--subtle)' }}>
            {room ? `${room.threshold} of ${room.members.length}` : '—'} approvals ·{' '}
            {(feeBps / 100).toFixed(1)}% fee · USDC on Arc
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onTopUp} className="rounded-full px-4 py-2 text-[12px] font-semibold"
            style={{ border: '1px solid var(--border-strong)', color: 'var(--ink)' }}>
            Top up
          </button>
          <button onClick={onRequest} className="rounded-full px-4 py-2 text-[12px] font-semibold"
            style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
            Request
          </button>
        </div>
      </div>

      {awaitingYou > 0 && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-medium"
          style={{ background: 'rgba(255,194,75,0.12)', color: 'var(--waiting)' }}>
          <span aria-hidden>●</span>
          {awaitingYou} waiting on your approval
        </div>
      )}
    </header>
  )
}
