import { decodeEventLog, type Hex } from 'viem'
import { CHATTR_ABI } from './abi'
import type { ActivityItem } from './types'

/**
 * Events are read from the explorer, not from `eth_getLogs`.
 *
 * Measured on Arc testnet: a `getLogs` range above ~5,000 blocks is rejected
 * outright, so the 10,000-block window this hook used to ask for could never
 * succeed. The explorer returns every log for the contract in one call, with
 * block timestamps, and needs no wallet.
 */
export const FALLBACK_WINDOW = 5_000n

export interface ExplorerLogRow {
  topics: string[]
  data: string
  transaction_hash: string
  block_number: number
  block_timestamp: string
  index: number
}

const KIND_BY_EVENT: Record<string, ActivityItem['kind']> = {
  Deposited: 'deposit',
  Requested: 'request',
  Approved: 'approval',
  Executed: 'executed',
  SharesPaid: 'shares',
}

/** A log we cannot decode, or one that belongs to another room, is not an item. */
export function toActivityItem(roomId: bigint, row: ExplorerLogRow): ActivityItem | null {
  let decoded: ReturnType<typeof decodeEventLog>
  try {
    decoded = decodeEventLog({
      abi: CHATTR_ABI,
      topics: row.topics as [Hex, ...Hex[]],
      data: row.data as Hex,
    })
  } catch {
    return null
  }

  const kind = KIND_BY_EVENT[decoded.eventName]
  if (!kind) return null

  const args = decoded.args as Record<string, unknown>
  if (args.roomId !== roomId) return null

  const base = {
    id: `${kind}-${row.transaction_hash}-${row.index}`,
    txHash: row.transaction_hash as `0x${string}`,
    timestamp: Date.parse(row.block_timestamp),
  }

  switch (kind) {
    case 'deposit':
      return { ...base, kind, sender: args.sender as `0x${string}`, amount: args.amount as bigint }
    case 'request':
      return {
        ...base, kind,
        requestId: args.requestId as bigint,
        to: args.to as `0x${string}`,
        amount: args.amount as bigint,
        memo: args.memo as string,
      }
    case 'approval':
      return {
        ...base, kind,
        requestId: args.requestId as bigint,
        voter: args.voter as `0x${string}`,
        approvals: args.approvalCount as bigint,
      }
    case 'executed':
      return {
        ...base, kind,
        requestId: args.requestId as bigint,
        to: args.to as `0x${string}`,
        amount: args.amount as bigint,
        fee: args.fee as bigint,
      }
    case 'shares':
      return { ...base, kind, amount: args.totalAmount as bigint, fee: args.fee as bigint }
    default:
      return null
  }
}

/** Newest first, and stable when two events share a block. */
export function mapExplorerLogs(roomId: bigint, rows: ExplorerLogRow[]): ActivityItem[] {
  return rows
    .map(r => toActivityItem(roomId, r))
    .filter((i): i is ActivityItem => i !== null)
    .sort((a, b) => b.timestamp - a.timestamp)
}
