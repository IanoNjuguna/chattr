/** Room header: name, pot balance, threshold badge, fee note. Under 80 lines. */
import { ConnectKitButton } from 'connectkit'
import { fmtUsdc } from '../lib/money'
import type { RoomData } from '../lib/types'

interface Props {
  room:     RoomData | undefined
  feeBps:   number
  isPreview: boolean
}

export function RoomHeader({ room, feeBps, isPreview }: Props) {
  const name      = room?.name      ?? 'Alpha team'
  const balance   = room?.balance   ?? 0n
  const threshold = room?.threshold ?? 2
  const members   = room?.members   ?? []

  return (
    <header className="sticky top-0 z-20 backdrop-blur-sm" style={{ background: 'rgba(13,27,47,0.88)', borderBottom: '1px solid var(--border)' }}>
      <div className="mx-auto max-w-2xl px-4 py-3 flex items-center gap-3">
        {/* name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="display font-semibold text-base truncate" style={{ color: 'var(--ink)' }}>
              {name}
            </span>
            {isPreview && (
              <span className="rounded px-1.5 py-0.5 text-xs font-medium" style={{ background: 'rgba(172,198,233,0.15)', color: 'var(--accent)' }}>
                preview
              </span>
            )}
            <span className="rounded px-1.5 py-0.5 text-xs font-semibold tabular-nums" style={{ background: 'rgba(172,198,233,0.12)', color: 'var(--accent)' }}>
              {threshold} of {members.length}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="display font-bold tabular-nums" style={{ color: 'var(--ink)', fontSize: 22 }}>
              ${fmtUsdc(balance)}
            </span>
            <span className="text-xs" style={{ color: 'var(--subtle)' }}>
              USDC · {feeBps / 100}% fee
            </span>
          </div>
        </div>

        {/* wallet button */}
        <ConnectKitButton showBalance={false} />
      </div>
    </header>
  )
}
