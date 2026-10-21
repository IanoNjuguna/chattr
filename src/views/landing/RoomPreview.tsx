import { FeedRow } from '../room/FeedRow'
import { fmtUsdcFine } from '../../lib/money'
import { Avatar } from '../../components/Avatar'
import type { ActivityItem, RoomData } from '../../lib/types'

const ROOM: RoomData = {
  name: 'Hackathon team',
  captain: '0x8A2f4C3d91B7e05F6aC81d9E4b23F7AcD6105e38',
  members: [
    '0x8A2f4C3d91B7e05F6aC81d9E4b23F7AcD6105e38',
    '0x3D9c1B7e05F6aC81d9E4b23F7AcD6105e38a4B2f',
    '0xC4E7b19A2F0d6385Bca94e7D21F0538aB9e6C417',
  ],
  threshold: 2,
  balance: 262_000_000n,
  shareMembers: [],
  shareBps: [],
}

const ITEMS: ActivityItem[] = [
  {
    id: 'p1', kind: 'executed', txHash: '0x1', timestamp: 0, requestId: 0n,
    to: '0x6B1Df8a04C29e7B3d510aF62C8e194b07D3F5a86', memo: 'Designer',
    amount: 120_000_000n, fee: 600_000n, attested: true, delivered: true,
    attestNote: 'Files received',
  },
  {
    id: 'p2', kind: 'request', txHash: '0x2', timestamp: 0, requestId: 1n,
    to: '0x91Fc3b0D7a4E25c8B6d01fA947E3c5b2D80a4F16', memo: 'API credits',
    amount: 18_000_000n,
  },
  {
    id: 'p3', kind: 'approval', txHash: '0x3', timestamp: 0, requestId: 1n,
    voter: '0x3D9c1B7e05F6aC81d9E4b23F7AcD6105e38a4B2f', approvals: 1n,
  },
  {
    id: 'p4', kind: 'deposit', txHash: '0x4', timestamp: 0,
    sender: '0x8A2f4C3d91B7e05F6aC81d9E4b23F7AcD6105e38', amount: 400_000_000n,
  },
]

/**
 * The real room, rendered with the real components. Not a mock: if the row
 * changes, this changes with it.
 */
export function RoomPreview() {
  return (
    <div className="flex flex-col justify-center h-full">
      <div
        className="w-full rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)' }}
      >
        <div className="px-7 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium" style={{ color: 'var(--ink)' }}>{ROOM.name}</span>
            <div className="flex -space-x-1.5">
              {ROOM.members.map(a => <Avatar key={a} address={a} size={18} />)}
            </div>
          </div>
          <div className="amount text-[30px] leading-none mt-2" style={{ color: 'var(--ink)' }}>
            {fmtUsdcFine(ROOM.balance)}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)' }}>
          {ITEMS.map(item => (
            <FeedRow key={item.id} item={item} selected={false} onSelect={() => {}} />
          ))}
        </div>
      </div>
    </div>
  )
}
