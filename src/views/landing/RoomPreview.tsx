import { useMemo, useState } from 'react'
import { FeedRow } from '../room/FeedRow'
import { DemoActions } from './DemoActions'
import { fmtUsdcFine } from '../../lib/money'
import { Avatar } from '../../components/Avatar'
import type { ActivityItem, RoomData } from '../../lib/types'

const MEMBERS = [
  '0x8A2f4C3d91B7e05F6aC81d9E4b23F7AcD6105e38',
  '0x3D9c1B7e05F6aC81d9E4b23F7AcD6105e38a4B2f',
  '0xC4E7b19A2F0d6385Bca94e7D05e38a4B2f6C417',
] as const

const ROOM: RoomData = {
  name: 'Hackathon team',
  captain: MEMBERS[0],
  members: [...MEMBERS],
  threshold: 2,
  balance: 262_000_000n,
  shareMembers: [],
  shareBps: [],
}

const PAYEE = '0x6B1Df8a04C29e7B3d510aF62C8e194b07D3F5a86'
const PAYEE_2 = '0x91Fc3b0D7a4E25c8B6d01fA947E3c5b2D80a4F16'

function itemsFor(step: 0 | 1 | 2): ActivityItem[] {
  const live: ActivityItem = step === 2
    ? { id: 'p2', kind: 'executed', txHash: '0x2', timestamp: 0, requestId: 1n, to: PAYEE_2,
        memo: 'API credits', amount: 18_000_000n, fee: 90_000n, attested: true, delivered: true }
    : { id: 'p2', kind: 'request', txHash: '0x2', timestamp: 0, requestId: 1n, to: PAYEE_2,
        memo: 'API credits', amount: 18_000_000n }

  return [
    { id: 'p1', kind: 'executed', txHash: '0x1', timestamp: 0, requestId: 0n, to: PAYEE,
      memo: 'Designer', amount: 120_000_000n, fee: 600_000n, attested: true, delivered: true },
    live,
    { id: 'p3', kind: 'approval', txHash: '0x3', timestamp: 0, requestId: 1n, voter: MEMBERS[1], approvals: 1n },
    { id: 'p4', kind: 'deposit', txHash: '0x4', timestamp: 0, sender: MEMBERS[0], amount: 400_000_000n },
  ]
}

/**
 * A working sample of the product: rows respond, approve fills the threshold,
 * pay turns the row into a receipt. The user learns the loop by touching it.
 */
export function RoomPreview() {
  const [step, setStep] = useState<0 | 1 | 2>(0)
  const [selected, setSelected] = useState<string>('p2')
  const items = useMemo(() => itemsFor(step), [step])

  const liveStatus = step === 2
    ? { text: 'delivered', color: 'var(--success)' }
    : step === 1
      ? { text: 'ready', color: 'var(--success)' }
      : { text: '1 of 2', color: 'var(--waiting)' }

  return (
    <div className="flex flex-col justify-center h-full lg:-mt-2">
      <div className="w-full rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg)', border: '1px solid var(--border-strong)' }}>
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
          {items.map(item => (
            <FeedRow
              key={item.id}
              item={item}
              selected={selected === item.id}
              onSelect={() => setSelected(item.id)}
              statusOverride={
                item.id === 'p2' ? liveStatus
                : item.id === 'p3' ? { text: 'approved', color: 'var(--success)' }
                : undefined
              }
            />
          ))}
        </div>

        <DemoActions
          step={step}
          amount={fmtUsdcFine(18_000_000n)}
          onApprove={() => { setStep(1); setSelected('p2') }}
          onPay={() => { setStep(2); setSelected('p2') }}
          onReplay={() => setStep(0)}
        />
      </div>

      <p className="mt-3 px-1 text-[10.5px] mono" style={{ color: 'var(--subtle)' }}>
        Fig. 1 — A sample room. Press the pending payment, then approve it.
      </p>
    </div>
  )
}
