import { useEffect, useState } from 'react'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { CHATTR_ADDRESS, EXPLORER_API, IS_DEPLOYED, RPC_URL } from '../lib/constants'
import { FALLBACK_WINDOW, mapExplorerLogs, toActivityItem, type ExplorerLogRow } from '../lib/activity'
import type { ActivityItem } from '../lib/types'

const POLL_MS = 15_000

/** One client for the whole app, not one per call. */
const client = createPublicClient({ transport: http(RPC_URL) })

const FALLBACK_EVENTS = [
  parseAbiItem('event Deposited(uint256 indexed roomId, address indexed sender, uint256 amount)'),
  parseAbiItem('event Requested(uint256 indexed roomId, uint256 indexed requestId, address indexed to, uint256 amount, string memo, uint64 unlockAt)'),
  parseAbiItem('event Approved(uint256 indexed roomId, uint256 indexed requestId, address indexed voter, uint256 approvalCount)'),
  parseAbiItem('event Executed(uint256 indexed roomId, uint256 indexed requestId, address indexed to, uint256 amount, uint256 fee)'),
  parseAbiItem('event SharesPaid(uint256 indexed roomId, uint256 totalAmount, uint256 fee)'),
]

async function fromExplorer(signal: AbortSignal): Promise<ExplorerLogRow[]> {
  const res = await fetch(`${EXPLORER_API}/addresses/${CHATTR_ADDRESS}/logs`, { signal })
  if (!res.ok) throw new Error(`explorer responded ${res.status}`)
  const body = (await res.json()) as { items?: ExplorerLogRow[] }
  return body.items ?? []
}

/**
 * Only used when the explorer is unreachable. The window is deliberately small:
 * this RPC rejects any range above roughly 5,000 blocks (measured), which is why
 * a wider scan cannot be the primary source.
 */
async function fromChain(roomId: bigint): Promise<ActivityItem[]> {
  const head = await client.getBlockNumber()
  const from = head > FALLBACK_WINDOW ? head - FALLBACK_WINDOW : 0n

  const pages = await Promise.all(
    FALLBACK_EVENTS.map(event =>
      client.getLogs({ address: CHATTR_ADDRESS, event, args: { roomId }, fromBlock: from, toBlock: head }),
    ),
  )

  const stamps = new Map<bigint, number>()
  const items: ActivityItem[] = []

  for (const log of pages.flat()) {
    const blockNumber = log.blockNumber ?? 0n
    if (!stamps.has(blockNumber)) {
      const block = await client.getBlock({ blockNumber }).catch(() => null)
      stamps.set(blockNumber, block ? Number(block.timestamp) * 1000 : Date.now())
    }
    const item = toActivityItem(roomId, {
      topics: log.topics as unknown as string[],
      data: log.data,
      transaction_hash: log.transactionHash ?? '',
      block_number: Number(blockNumber),
      block_timestamp: new Date(stamps.get(blockNumber)!).toISOString(),
      index: log.logIndex ?? 0,
    })
    if (item) items.push(item)
  }

  return items.sort((a, b) => b.timestamp - a.timestamp)
}

export function useActivity(roomId: bigint) {
  const [items, setItems] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!IS_DEPLOYED) { setItems([]); return }

    let cancelled = false
    const controller = new AbortController()
    setItems([])

    const load = async () => {
      setLoading(true)
      try {
        const rows = await fromExplorer(controller.signal)
        if (cancelled) return
        setItems(mapExplorerLogs(roomId, rows))
        setFailed(false)
      } catch (e) {
        if (cancelled || (e as Error).name === 'AbortError') return
        try {
          const fallback = await fromChain(roomId)
          if (cancelled) return
          setItems(fallback)
          setFailed(false)
        } catch {
          if (!cancelled) setFailed(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const timer = setInterval(load, POLL_MS)
    return () => { cancelled = true; controller.abort(); clearInterval(timer) }
  }, [roomId])

  return { items, loading, failed }
}
