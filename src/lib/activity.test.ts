import { describe, expect, test } from 'bun:test'
import { encodeEventTopics, encodeAbiParameters, parseAbiItem, type Hex } from 'viem'
import { mapExplorerLogs, toActivityItem, type ExplorerLogRow } from './activity'

/** Builds the exact shape the explorer returns, from a real event. */
function row(
  event: ReturnType<typeof parseAbiItem>,
  topics: unknown[],
  params: readonly { type: string; name: string }[],
  values: readonly unknown[],
  block = 68_300_000,
): ExplorerLogRow {
  return {
    topics: encodeEventTopics({ abi: [event], eventName: (event as { name: string }).name, args: topics } as never) as unknown as string[],
    data: encodeAbiParameters(params as never, values as never),
    transaction_hash: '0xaa11bb22cc33dd44ee55ff66aa77bb88cc99dd00ee11ff22aa33bb44cc55dd66',
    block_number: block,
    block_timestamp: '2026-10-21T15:41:11.000000Z',
    index: 3,
  }
}

const deposited = parseAbiItem('event Deposited(uint256 indexed roomId, address indexed sender, uint256 amount)')
const requested = parseAbiItem('event Requested(uint256 indexed roomId, uint256 indexed requestId, address indexed to, uint256 amount, string memo, uint64 unlockAt)')
const approved = parseAbiItem('event Approved(uint256 indexed roomId, uint256 indexed requestId, address indexed voter, uint256 approvalCount)')
const roomCreated = parseAbiItem('event RoomCreated(uint256 indexed roomId, address indexed captain, string name)')

const sender = '0x48cb25f9d82aF721e71437feAfb295da627BA475' as const

describe('activity mapping', () => {
  test('a deposit becomes an item with its amount and sender', () => {
    const r = row(deposited, [5n, sender], [{ type: 'uint256', name: 'amount' }], [5_000_000n])
    const item = toActivityItem(5n, r)
    expect(item?.kind).toBe('deposit')
    expect(item?.amount).toBe(5_000_000n)
    expect(item?.sender).toBe(sender)
    expect(item?.id.startsWith('deposit-')).toBe(true)
  })

  test('a request keeps its memo, payee and id', () => {
    const r = row(
      requested,
      [5n, 0n, sender],
      [{ type: 'uint256', name: 'amount' }, { type: 'string', name: 'memo' }, { type: 'uint64', name: 'unlockAt' }],
      [1_000_000n, 'Invoice #001', 0n],
    )
    const item = toActivityItem(5n, r)
    expect(item?.kind).toBe('request')
    expect(item?.requestId).toBe(0n)
    expect(item?.memo).toBe('Invoice #001')
    expect(item?.to).toBe(sender)
  })

  test('an approval counts the votes it carried', () => {
    const r = row(approved, [5n, 0n, sender], [{ type: 'uint256', name: 'approvalCount' }], [2n])
    const item = toActivityItem(5n, r)
    expect(item?.kind).toBe('approval')
    expect(item?.approvals).toBe(2n)
  })

  test('another room never leaks into this feed', () => {
    const r = row(deposited, [7n, sender], [{ type: 'uint256', name: 'amount' }], [5_000_000n])
    expect(toActivityItem(5n, r)).toBeNull()
  })

  test('an event that is not part of the feed is dropped, not thrown', () => {
    const r = row(roomCreated, [5n, sender], [{ type: 'string', name: 'name' }], ['CR7'])
    expect(toActivityItem(5n, r)).toBeNull()
  })

  test('an undecodable log does not break the whole feed', () => {
    const broken: ExplorerLogRow = { ...row(deposited, [5n, sender], [{ type: 'uint256', name: 'amount' }], [1n]), data: '0xdead' as Hex }
    const list = mapExplorerLogs(5n, [broken, row(deposited, [5n, sender], [{ type: 'uint256', name: 'amount' }], [2_000_000n])])
    expect(list).toHaveLength(1)
    expect(list[0]?.amount).toBe(2_000_000n)
  })
})
