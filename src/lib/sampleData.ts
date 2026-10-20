/**
 * Static sample data used when no wallet is connected (designed preview).
 * Never used on-chain; contains no real addresses.
 */
import type { RoomData, ActivityItem } from './types'

export const SAMPLE_ROOM: RoomData = {
  name:         'Alpha team',
  captain:      '0xA100000000000000000000000000000000000001',
  members:      [
    '0xA100000000000000000000000000000000000001',
    '0xB200000000000000000000000000000000000002',
    '0xC300000000000000000000000000000000000003',
  ],
  threshold:    2,
  balance:      8_500_000n,  // 8.50 USDC
  shareMembers: [],
  shareBps:     [],
}

export const SAMPLE_ACTIVITY: ActivityItem[] = [
  {
    id:        'sample-4',
    kind:      'executed',
    txHash:    '0xdeadbeef00000000000000000000000000000000000000000000000000000001',
    timestamp: Date.now() - 300_000,
    requestId: 0n,
    to:        '0xD400000000000000000000000000000000000004',
    memo:      'Invoice #001 — design work',
    amount:    995_000n,
    fee:       5_000n,
    attested:  true,
    delivered: true,
    attestNote: 'Designs received, approved by team',
  },
  {
    id:        'sample-3',
    kind:      'approval',
    txHash:    '0xdeadbeef00000000000000000000000000000000000000000000000000000002',
    timestamp: Date.now() - 600_000,
    requestId: 0n,
    voter:     '0xB200000000000000000000000000000000000002',
    approvals: 2n,
  },
  {
    id:        'sample-2',
    kind:      'request',
    txHash:    '0xdeadbeef00000000000000000000000000000000000000000000000000000003',
    timestamp: Date.now() - 900_000,
    requestId: 0n,
    to:        '0xD400000000000000000000000000000000000004',
    memo:      'Invoice #001 — design work',
    amount:    1_000_000n,
  },
  {
    id:        'sample-1',
    kind:      'deposit',
    txHash:    '0xdeadbeef00000000000000000000000000000000000000000000000000000004',
    timestamp: Date.now() - 1_800_000,
    sender:    '0xA100000000000000000000000000000000000001',
    amount:    10_000_000n,
  },
]
