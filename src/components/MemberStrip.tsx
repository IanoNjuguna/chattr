/** Member strip: avatars + approval state + Approve button. Under 80 lines. */
import { Avatar } from './Avatar'
import { fmtUsdc } from '../lib/money'
import type { RoomData, RequestData } from '../lib/types'

interface Props {
  room:         RoomData | undefined
  openRequest:  RequestData | null
  openReqId:    bigint | null
  connectedAddr: `0x${string}` | undefined
  hasVoted:     boolean
  onApprove:    () => void
  isApproving:  boolean
}

function short(a: string) { return `${a.slice(0, 6)}…${a.slice(-4)}` }

export function MemberStrip({ room, openRequest, openReqId, connectedAddr, hasVoted, onApprove, isApproving }: Props) {
  if (!room) return null
  const isMember    = connectedAddr ? room.members.some(m => m.toLowerCase() === connectedAddr.toLowerCase()) : false
  const canApprove  = isMember && !!openRequest && openRequest.status === 0 && !hasVoted
  const threshold   = room.threshold
  const approvals   = openRequest?.approvalCount ?? 0n

  return (
    <div className="px-4 py-3 flex items-center gap-3 flex-wrap" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex -space-x-2">
        {room.members.map(m => (
          <Avatar key={m} address={m} size={30} title={short(m)} />
        ))}
      </div>

      {openRequest && openReqId !== null && (
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
          <span className="tabular-nums">{String(approvals)}/{threshold} approvals</span>
          <span>·</span>
          <span className="truncate max-w-40">{openRequest.memo}</span>
          <span>·</span>
          <span className="tabular-nums">${fmtUsdc(openRequest.amount)}</span>
        </div>
      )}

      <div className="ml-auto">
        {canApprove && (
          <button
            onClick={onApprove}
            disabled={isApproving}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity"
            style={{ background: 'var(--accent)', color: '#0d1b2f', opacity: isApproving ? 0.6 : 1 }}
          >
            {isApproving ? 'Approving…' : 'Approve'}
          </button>
        )}
      </div>
    </div>
  )
}
