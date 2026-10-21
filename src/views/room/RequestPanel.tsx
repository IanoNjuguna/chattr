import { fmtUsdcFine } from '../../lib/money'
import { explorerTx } from '../../lib/constants'
import { Avatar } from '../../components/Avatar'
import type { RequestData, RoomData } from '../../lib/types'

interface Props {
  request: RequestData
  room: RoomData | undefined
  txHash: string
  hasVoted: boolean
  canAct: boolean
  busy: boolean
  onApprove: () => void
  onExecute: () => void
  onAttest: (delivered: boolean) => void
}

const btn = (primary: boolean) => ({
  flex: 1,
  padding: '9px 0',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
  background: primary ? 'var(--ink)' : 'transparent',
  color: primary ? 'var(--bg)' : 'var(--ink-2)',
  border: primary ? 'none' : '1px solid var(--border-strong)',
}) as const

/** Right panel: everything needed to decide, and nothing else. */
export function RequestPanel({ request, room, txHash, hasVoted, canAct, busy, onApprove, onExecute, onAttest }: Props) {
  const executed = request.status === 1
  const approvals = Number(request.approvalCount)
  const needed = room?.threshold ?? 1
  const unlocked = request.unlockAt === 0n || BigInt(Math.floor(Date.now() / 1000)) >= request.unlockAt
  const isCaptain = !!room && room.captain.toLowerCase() === (room.members[0] ?? '').toLowerCase()

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 pt-6 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="text-[11px] uppercase tracking-[0.12em]" style={{ color: 'var(--subtle)' }}>
          {executed ? 'Receipt' : 'Request'}
        </div>
        <div className="amount text-[26px] mt-2" style={{ color: 'var(--ink)' }}>
          ${fmtUsdcFine(request.amount)}
        </div>
        <div className="text-[12px] mt-1" style={{ color: 'var(--muted)' }}>
          {request.memo || 'No memo'}
        </div>

        <div className="flex gap-2 mt-4">
          {!executed && (
            <>
              <button disabled={!canAct || hasVoted || busy} onClick={onApprove} style={btn(true)}>
                {hasVoted ? 'Approved' : 'Approve'}
              </button>
              <button disabled={!canAct || busy || approvals < needed || !unlocked} onClick={onExecute} style={btn(false)}>
                {approvals < needed ? `Needs ${needed - approvals} more` : unlocked ? 'Execute' : 'Locked'}
              </button>
            </>
          )}
          {executed && isCaptain && !request.attested && (
            <>
              <button disabled={!canAct || busy} onClick={() => onAttest(true)} style={btn(true)}>Mark delivered</button>
              <button disabled={!canAct || busy} onClick={() => onAttest(false)} style={btn(false)}>Not delivered</button>
            </>
          )}
        </div>
      </div>

      <div className="px-6 py-5 space-y-4 overflow-y-auto">
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.12em]" style={{ color: 'var(--subtle)' }}>Approvals</div>
          <div className="flex items-center gap-2 mt-2">
            {Array.from({ length: needed }).map((_, i) => (
              <span key={i} style={{ width: 8, height: 8, borderRadius: 99, background: i < approvals ? 'var(--success)' : 'var(--border-strong)' }} />
            ))}
            <span className="text-[11px] ml-1" style={{ color: 'var(--muted)' }}>
              {approvals} of {needed}{approvals < needed ? `, waiting on ${needed - approvals}` : ''}
            </span>
          </div>
          <div className="flex -space-x-1.5 mt-3">
            {(room?.members ?? []).map(a => <Avatar key={a} address={a} size={18} />)}
          </div>
        </div>

        <div>
          <div className="text-[10.5px] uppercase tracking-[0.12em]" style={{ color: 'var(--subtle)' }}>Payee</div>
          <div className="mono text-[11px] mt-1 break-all" style={{ color: 'var(--ink-2)' }}>{request.to}</div>
        </div>

        {request.unlockAt > 0n && (
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.12em]" style={{ color: 'var(--subtle)' }}>Unlocks</div>
            <div className="text-[11px] mt-1" style={{ color: unlocked ? 'var(--success)' : 'var(--waiting)' }}>
              {new Date(Number(request.unlockAt) * 1000).toLocaleString()}
            </div>
          </div>
        )}

        {executed && (
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.12em]" style={{ color: 'var(--subtle)' }}>Receipt</div>
            <a href={explorerTx(txHash)} target="_blank" rel="noopener noreferrer"
              className="mono text-[11px] mt-1 block truncate" style={{ color: 'var(--accent)' }}>
              {txHash.slice(0, 18)}…
            </a>
            {request.attested && (
              <div className="text-[11px] mt-1" style={{ color: request.delivered ? 'var(--success)' : 'var(--danger)' }}>
                {request.delivered ? 'Delivered' : 'Not delivered'}
                {request.attestNote ? ` · ${request.attestNote}` : ''}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
