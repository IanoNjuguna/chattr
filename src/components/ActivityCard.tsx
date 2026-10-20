/** One activity feed card. Under 80 lines. */
import { ExternalLink, CheckCircle, Clock, ArrowDownCircle, AlertCircle } from 'lucide-react'
import { Avatar } from './Avatar'
import { fmtUsdc } from '../lib/money'
import { explorerTx } from '../lib/constants'
import type { ActivityItem } from '../lib/types'

function short(a: string) { return `${a.slice(0, 6)}…${a.slice(-4)}` }

function timeAgo(ms: number): string {
  const d = Date.now() - ms
  if (d < 60_000)    return 'just now'
  if (d < 3_600_000) return `${Math.floor(d / 60_000)}m ago`
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`
  return `${Math.floor(d / 86_400_000)}d ago`
}

interface Props { item: ActivityItem }

export function ActivityCard({ item }: Props) {
  const surface: React.CSSProperties = {
    background:   'var(--surface)',
    border:       '1px solid var(--border)',
    borderRadius:  12,
    padding:      '12px 14px',
  }

  const isFake = item.txHash.startsWith('0xdeadbeef')

  const explorerLink = !isFake && item.txHash
    ? <a href={explorerTx(item.txHash)} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs tabular-nums"
        style={{ color: 'var(--accent)' }}>
        {item.txHash.slice(0, 10)}… <ExternalLink size={11} />
      </a>
    : <span className="text-xs" style={{ color: 'var(--subtle)' }}>sample</span>

  if (item.kind === 'deposit') return (
    <div style={surface} className="flex items-start gap-3">
      <ArrowDownCircle size={18} style={{ color: 'var(--success)', marginTop: 2, flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            Deposited <span className="tabular-nums">${fmtUsdc(item.amount!)}</span>
          </span>
          <span className="text-xs" style={{ color: 'var(--subtle)' }}>{timeAgo(item.timestamp)}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {item.sender && <Avatar address={item.sender} size={16} />}
          <span className="mono text-xs" style={{ color: 'var(--muted)' }}>{item.sender ? short(item.sender) : ''}</span>
          {explorerLink}
        </div>
      </div>
    </div>
  )

  if (item.kind === 'request') return (
    <div style={surface} className="flex items-start gap-3">
      <Clock size={18} style={{ color: 'var(--muted)', marginTop: 2, flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            Requested <span className="tabular-nums">${fmtUsdc(item.amount!)}</span>
          </span>
          <span className="text-xs" style={{ color: 'var(--subtle)' }}>{timeAgo(item.timestamp)}</span>
        </div>
        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{item.memo}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="mono text-xs" style={{ color: 'var(--subtle)' }}>to {item.to ? short(item.to) : ''}</span>
          {explorerLink}
        </div>
      </div>
    </div>
  )

  if (item.kind === 'approval') return (
    <div style={surface} className="flex items-start gap-3">
      <CheckCircle size={18} style={{ color: 'var(--accent)', marginTop: 2, flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            Approval {String(item.approvals)}
          </span>
          <span className="text-xs" style={{ color: 'var(--subtle)' }}>{timeAgo(item.timestamp)}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {item.voter && <Avatar address={item.voter} size={16} />}
          <span className="mono text-xs" style={{ color: 'var(--muted)' }}>{item.voter ? short(item.voter) : ''}</span>
          {explorerLink}
        </div>
      </div>
    </div>
  )

  if (item.kind === 'executed') return (
    <div style={{ ...surface, borderColor: item.attested ? 'rgba(125,216,160,0.3)' : 'var(--border)' }} className="flex items-start gap-3">
      <CheckCircle size={18} style={{ color: 'var(--success)', marginTop: 2, flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            Paid <span className="tabular-nums">${fmtUsdc(item.amount!)}</span>
          </span>
          <span className="text-xs" style={{ color: 'var(--subtle)' }}>{timeAgo(item.timestamp)}</span>
        </div>
        <div className="text-xs mt-0.5 space-y-0.5">
          <div style={{ color: 'var(--muted)' }}>
            to <span className="mono">{item.to ? short(item.to) : ''}</span>
            {item.fee !== undefined && item.fee > 0n && (
              <span style={{ color: 'var(--subtle)' }}> · fee ${fmtUsdc(item.fee)}</span>
            )}
          </div>
          {item.memo && <div className="truncate" style={{ color: 'var(--subtle)' }}>{item.memo}</div>}
          <div className="flex items-center gap-2">{explorerLink}</div>
          {item.attested && (
            <div className="flex items-center gap-1 mt-1 rounded px-2 py-1"
              style={{ background: item.delivered ? 'rgba(125,216,160,0.1)' : 'rgba(232,109,122,0.1)' }}>
              {item.delivered
                ? <CheckCircle size={12} style={{ color: 'var(--success)' }} />
                : <AlertCircle size={12} style={{ color: 'var(--danger)' }} />}
              <span className="text-xs" style={{ color: item.delivered ? 'var(--success)' : 'var(--danger)' }}>
                {item.delivered ? 'Delivered' : 'Not delivered'}
                {item.attestNote ? ` — ${item.attestNote}` : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (item.kind === 'shares') return (
    <div style={surface} className="flex items-start gap-3">
      <CheckCircle size={18} style={{ color: 'var(--success)', marginTop: 2, flexShrink: 0 }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
            Split payout <span className="tabular-nums">${fmtUsdc(item.amount!)}</span>
          </span>
          <span className="text-xs" style={{ color: 'var(--subtle)' }}>{timeAgo(item.timestamp)}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {item.fee !== undefined && item.fee > 0n && (
            <span className="text-xs" style={{ color: 'var(--subtle)' }}>fee ${fmtUsdc(item.fee)}</span>
          )}
          {explorerLink}
        </div>
      </div>
    </div>
  )

  return null
}
