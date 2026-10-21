import { fmtUsdcFine } from '../../lib/money'
import type { ActivityItem } from '../../lib/types'

interface Props {
  item: ActivityItem
  selected: boolean
  onSelect: () => void
  /** Landing demo only: lets the sample room show "ready" between pending and paid. */
  statusOverride?: { text: string; color: string }
}

const LABEL: Record<ActivityItem['kind'], string> = {
  deposit: 'Top up',
  request: 'Requested',
  approval: 'Approval',
  executed: 'Paid',
  shares: 'Split payout',
}

function short(a?: string): string {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : ''
}

function statusOf(item: ActivityItem): { text: string; color: string } {
  if (item.kind === 'request') return { text: 'pending', color: 'var(--waiting)' }
  if (item.kind === 'executed') {
    if (item.attested && item.delivered) return { text: 'delivered', color: 'var(--success)' }
    if (item.attested) return { text: 'not delivered', color: 'var(--danger)' }
    return { text: 'paid', color: 'var(--muted)' }
  }
  if (item.kind === 'deposit') return { text: 'in', color: 'var(--success)' }
  if (item.kind === 'approval') return { text: 'vote', color: 'var(--muted)' }
  return { text: 'out', color: 'var(--muted)' }
}

/** One 56px row. Amounts right-aligned in the mono face so decimals stack. */
export function FeedRow({ item, selected, onSelect, statusOverride }: Props) {
  const inbound = item.kind === 'deposit'
  const status = statusOverride ?? statusOf(item)
  const amount = item.amount ?? 0n
  const isPendingRequest = item.kind === 'request'

  return (
    <button
      onClick={onSelect}
      className="row-hover w-full text-left px-7 flex items-center gap-3"
      style={{
        height: 56,
        borderBottom: '1px solid var(--border)',
        background: selected ? 'var(--surface)' : 'transparent',
        borderLeft: isPendingRequest ? '2px solid var(--waiting)' : '2px solid transparent',
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="text-[12.5px] font-medium truncate" style={{ color: 'var(--ink)' }}>
          {LABEL[item.kind]}
          {item.memo ? <span style={{ color: 'var(--muted)' }}> · {item.memo}</span> : null}
        </div>
        <div className="text-[10.5px] mono truncate mt-0.5" style={{ color: 'var(--subtle)' }}>
          {short(item.to ?? item.sender ?? item.voter)}
        </div>
      </div>

      {/* an approval moves no money, so it gets no amount */}
      <div className="amount-cell text-[12.5px]" style={{ color: inbound ? 'var(--success)' : 'var(--ink)' }}>
        {item.kind === 'approval' ? '' : `${inbound ? '+' : '−'}$${fmtUsdcFine(amount)}`}
      </div>

      <div className="text-[10.5px] text-right shrink-0" style={{ width: 64, color: status.color }}>
        {status.text}
      </div>
    </button>
  )
}
