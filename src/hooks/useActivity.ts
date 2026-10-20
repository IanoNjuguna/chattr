import { useState, useEffect } from 'react'
import { createPublicClient, http, parseAbiItem } from 'viem'
import { arcTestnet } from 'wagmi/chains'
import { CHATTR_ADDRESS, IS_DEPLOYED } from '../lib/constants'
import type { ActivityItem } from '../lib/types'

const RPC_URL = 'https://rpc.testnet.arc.io'

function client() {
  return createPublicClient({ chain: arcTestnet, transport: http(RPC_URL) })
}

const LOOKBACK = 10_000n  // blocks

async function fetchTimestamp(blockNumber: bigint): Promise<number> {
  try {
    const block = await client().getBlock({ blockNumber })
    return Number(block.timestamp) * 1000
  } catch {
    return Date.now()
  }
}

export function useActivity(roomId: bigint) {
  const [items, setItems]     = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!IS_DEPLOYED) { setItems([]); return }

    let cancelled = false

    const load = async () => {
      setLoading(true)
      try {
        const head = await client().getBlockNumber()
        const from = head > LOOKBACK ? head - LOOKBACK : 0n

        const [deposits, requests, approvals, executions, sharesPaid] = await Promise.all([
          client().getLogs({
            address: CHATTR_ADDRESS,
            event: parseAbiItem('event Deposited(uint256 indexed roomId, address indexed sender, uint256 amount)'),
            args: { roomId },
            fromBlock: from, toBlock: head,
          }),
          client().getLogs({
            address: CHATTR_ADDRESS,
            event: parseAbiItem('event Requested(uint256 indexed roomId, uint256 indexed requestId, address indexed to, uint256 amount, string memo, uint64 unlockAt)'),
            args: { roomId },
            fromBlock: from, toBlock: head,
          }),
          client().getLogs({
            address: CHATTR_ADDRESS,
            event: parseAbiItem('event Approved(uint256 indexed roomId, uint256 indexed requestId, address indexed voter, uint256 approvalCount)'),
            args: { roomId },
            fromBlock: from, toBlock: head,
          }),
          client().getLogs({
            address: CHATTR_ADDRESS,
            event: parseAbiItem('event Executed(uint256 indexed roomId, uint256 indexed requestId, address indexed to, uint256 amount, uint256 fee)'),
            args: { roomId },
            fromBlock: from, toBlock: head,
          }),
          client().getLogs({
            address: CHATTR_ADDRESS,
            event: parseAbiItem('event SharesPaid(uint256 indexed roomId, uint256 totalAmount, uint256 fee)'),
            args: { roomId },
            fromBlock: from, toBlock: head,
          }),
        ])

        if (cancelled) return

        const all: ActivityItem[] = []

        for (const log of deposits) {
          const ts = await fetchTimestamp(log.blockNumber!)
          all.push({
            id:        `dep-${log.transactionHash}-${log.logIndex}`,
            kind:      'deposit',
            txHash:    log.transactionHash ?? '',
            timestamp: ts,
            sender:    log.args.sender,
            amount:    log.args.amount,
          })
        }

        for (const log of requests) {
          const ts = await fetchTimestamp(log.blockNumber!)
          all.push({
            id:        `req-${log.transactionHash}-${log.logIndex}`,
            kind:      'request',
            txHash:    log.transactionHash ?? '',
            timestamp: ts,
            requestId: log.args.requestId,
            to:        log.args.to,
            amount:    log.args.amount,
            memo:      log.args.memo,
          })
        }

        for (const log of approvals) {
          const ts = await fetchTimestamp(log.blockNumber!)
          all.push({
            id:        `apr-${log.transactionHash}-${log.logIndex}`,
            kind:      'approval',
            txHash:    log.transactionHash ?? '',
            timestamp: ts,
            requestId: log.args.requestId,
            voter:     log.args.voter,
            approvals: log.args.approvalCount,
          })
        }

        for (const log of executions) {
          const ts = await fetchTimestamp(log.blockNumber!)
          all.push({
            id:        `exe-${log.transactionHash}-${log.logIndex}`,
            kind:      'executed',
            txHash:    log.transactionHash ?? '',
            timestamp: ts,
            requestId: log.args.requestId,
            to:        log.args.to,
            amount:    log.args.amount,
            fee:       log.args.fee,
          })
        }

        for (const log of sharesPaid) {
          const ts = await fetchTimestamp(log.blockNumber!)
          all.push({
            id:        `shr-${log.transactionHash}-${log.logIndex}`,
            kind:      'shares',
            txHash:    log.transactionHash ?? '',
            timestamp: ts,
            amount:    log.args.totalAmount,
            fee:       log.args.fee,
          })
        }

        // reverse-chronological
        all.sort((a, b) => b.timestamp - a.timestamp)

        if (!cancelled) setItems(all)
      } catch (e) {
        console.error('useActivity fetch failed', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, 12_000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [roomId])

  return { items, loading }
}
