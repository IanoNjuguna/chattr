import { useEffect, useState } from 'react'
import { useAccount, usePublicClient, useSwitchChain } from 'wagmi'
import { decodeEventLog, isAddress } from 'viem'
import { toast } from 'sonner'
import { useCreateRoom } from '../../hooks/useWrite'
import { CHATTR_ABI } from '../../lib/abi'
import { useRoomCount } from '../../hooks/useRoom'
import { CHATTR_ADDRESS, explorerTx, TARGET_CHAIN_ID, TARGET_CHAIN_NAME } from '../../lib/constants'
import { go, roomPath } from '../../lib/routing'
import { ConnectPrompt, RoomList } from './RoomList'

const FIELD = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  color: 'var(--ink)',
} as const

const label = (s: string) => (
  <label className="block mt-4 text-[10.5px] uppercase tracking-[0.12em]" style={{ color: 'var(--subtle)' }}>{s}</label>
)

/**
 * One screen. Two people is the minimum, a third is optional, and the button
 * always says why it will not fire.
 */
/** Set when Create is pressed, cleared when the room is seen on chain. */
const PENDING_KEY = 'chattr:pendingCreate'

export function CreateRoomForm() {
  const { address } = useAccount()
  const { createRoom, isPending, error, receipt, hash, isSuccess } = useCreateRoom()
  const roomCount = useRoomCount()
  /** Survives a reload: a slow transaction should not need the tab to stay open. */
  const [resumed, setResumed] = useState(false)
  useEffect(() => {
    if (resumed || roomCount === 0n) return
    let saved: string | null = null
    try { saved = localStorage.getItem(PENDING_KEY) } catch {}
    if (saved === null) { setResumed(true); return }
    const base = BigInt(saved)
    if (roomCount > base) {
      try { localStorage.removeItem(PENDING_KEY) } catch {}
      setCreatedId(base)
    }
    setResumed(true)
  }, [roomCount, resumed])
  const client = usePublicClient({ chainId: TARGET_CHAIN_ID })
  const { chain: walletChain } = useAccount()
  const { switchChain } = useSwitchChain()
  /** The receipt hook follows the wallet's chain, the contract lives on testnet. */
  const wrongChain = !!walletChain && walletChain.id !== TARGET_CHAIN_ID

  const [name, setName] = useState('')
  const [second, setSecond] = useState('')
  const [third, setThird] = useState('')
  const [threshold, setThreshold] = useState(2)
  const [createdId, setCreatedId] = useState<bigint | null>(null)
  /** The count when Create was pressed. A rise means our room is the one at that index. */
  const [baseCount, setBaseCount] = useState<bigint | null>(null)

  const others = [second.trim(), third.trim()].filter(s => s.length > 0)
  const members: `0x${string}`[] = address ? [address, ...others as `0x${string}`[]] : []
  const validAddrs = others.every(a => isAddress(a))
  const distinct = new Set(members.map(m => m.toLowerCase())).size === members.length
  const enoughPeople = members.length >= 2
  const effectiveThreshold = Math.min(threshold, Math.max(members.length, 2))

  const reason =
    !address ? 'Connect a wallet first'
    : wrongChain ? `Switch to ${TARGET_CHAIN_NAME} in your wallet`
    : name.trim().length === 0 ? 'Give the room a name'
    : others.length === 0 ? 'Add one more person'
    : !validAddrs ? 'That address is not valid'
    : !distinct ? 'Use three different addresses'
    : null

  /**
   * Read the new room id out of the RoomCreated event. A roomCount snapshot is
   * stale by up to the poll interval, which sent five creations back to room 0.
   */
  useEffect(() => {
    if (!receipt) return
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({ abi: CHATTR_ABI, data: log.data, topics: log.topics })
        if (decoded.eventName === 'RoomCreated') {
          setCreatedId((decoded.args as { roomId: bigint }).roomId)
          return
        }
      } catch {
        // a log from another contract, or a different event
      }
    }
  }, [receipt])

  useEffect(() => {
    if (createdId !== null) toast.success(`Room #${createdId} created`)
  }, [createdId])

  useEffect(() => {
    if (error) setBaseCount(null)
  }, [error])

  /**
   * The authoritative check. Poll `roomCount` straight from the chain while a
   * creation is in flight, and the room is confirmed the moment the count rises.
   * This is what makes the screen work even when the wallet never reports back.
   */
  useEffect(() => {
    if (baseCount === null || createdId !== null || !client) return
    let stop = false
    const id = setInterval(async () => {
      try {
        const count = await client.readContract({
          address: CHATTR_ADDRESS, abi: CHATTR_ABI, functionName: 'roomCount',
        }) as bigint
        if (!stop && count > baseCount) {
          try { localStorage.removeItem(PENDING_KEY) } catch {}
          setCreatedId(baseCount)
          clearInterval(id)
        }
      } catch {
        // keep polling; a transient RPC error is not a failed creation
      }
    }, 2000)
    return () => { stop = true; clearInterval(id); setBaseCount(null) }
  }, [baseCount, createdId, client])

  /** Fallback: a confirmed tx with no decoded event still means the newest room is ours. */
  useEffect(() => {
    if (!isSuccess || createdId !== null || roomCount === 0n) return
    setCreatedId(roomCount - 1n)
  }, [isSuccess, createdId, roomCount])

  useEffect(() => {
    if (error) toast.error(error.message?.slice(0, 90) ?? 'Transaction failed')
  }, [error])

  const checkNow = async () => {
    if (baseCount === null || !client) return
    try {
      const count = (await client.readContract({
        address: CHATTR_ADDRESS, abi: CHATTR_ABI, functionName: 'roomCount',
      })) as bigint
      if (count > baseCount) {
        try { localStorage.removeItem(PENDING_KEY) } catch {}
        setCreatedId(baseCount)
      } else {
        toast('Still pending on chain. Rooms appear once it confirms.')
      }
    } catch {
      toast.error('Could not reach Arc')
    }
  }

  const submit = () => {
    if (reason || !address) return
    try { localStorage.setItem(PENDING_KEY, roomCount.toString()) } catch {}
    setBaseCount(roomCount)
    createRoom(name.trim(), members, effectiveThreshold)
  }

  if (createdId !== null) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-sm text-center">
          <div className="text-[10.5px] uppercase tracking-[0.12em]" style={{ color: 'var(--success)' }}>Created</div>
          <h1 className="display text-[26px] mt-2" style={{ color: 'var(--ink)' }}>Room #{createdId.toString()}</h1>
          <p className="mt-2 text-[12px]" style={{ color: 'var(--muted)' }}>
            {name.trim()} is live. Nothing moves until {effectiveThreshold} of {members.length} approve.
          </p>
          <button onClick={() => go(roomPath(createdId))}
            className="mt-6 w-full rounded-full py-3 text-sm font-semibold"
            style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
            Open room #{createdId.toString()}
          </button>
          <button onClick={() => setCreatedId(null)}
            className="mt-3 text-[11.5px]" style={{ color: 'var(--subtle)' }}>
            Create another
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-6 py-10" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
      {wrongChain && (
        <button onClick={() => switchChain({ chainId: TARGET_CHAIN_ID })}
          className="mb-6 w-full rounded-xl px-4 py-3 text-left text-[11.5px] flex items-center justify-between"
          style={{ background: 'var(--waiting-soft, rgba(245,166,35,0.10))', color: 'var(--waiting)' }}>
          <span>Your wallet is on {walletChain?.name ?? 'another network'}. This room list is on {TARGET_CHAIN_NAME}.</span>
          <span className="font-semibold">Switch</span>
        </button>
      )}
        <button onClick={() => go('/')} className="text-[11px]" style={{ color: 'var(--subtle)' }}>← back</button>
        <h1 className="display text-[26px] mt-4" style={{ color: 'var(--ink)' }}>New room</h1>

        {label('Name')}
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Hackathon team"
          className="mt-1.5 w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={FIELD} />

        {label('You')}
        <input value={address ?? 'not connected'} readOnly
          className="mt-1.5 w-full rounded-lg px-3 py-2.5 text-[11px] mono outline-none"
          style={{ ...FIELD, color: 'var(--muted)' }} />

        {label('Second person')}
        <input value={second} onChange={e => setSecond(e.target.value)} placeholder="0x…"
          className="mt-1.5 w-full rounded-lg px-3 py-2.5 text-[11px] mono outline-none" style={FIELD} />

        {label('Third person (optional)')}
        <input value={third} onChange={e => setThird(e.target.value)} placeholder="0x…"
          className="mt-1.5 w-full rounded-lg px-3 py-2.5 text-[11px] mono outline-none" style={FIELD} />

        {label('Approvals to spend')}
        <div className="mt-1.5 flex gap-2">
          {[1, 2, 3].filter(n => n <= Math.max(members.length, 2)).map(n => (
            <button key={n} onClick={() => setThreshold(n)}
              className="flex-1 rounded-lg py-2 text-[12px] font-semibold"
              style={{
                background: effectiveThreshold === n ? 'var(--ink)' : 'var(--surface)',
                color: effectiveThreshold === n ? 'var(--bg)' : 'var(--ink-2)',
                border: '1px solid var(--border)',
              }}>
              {n} of {Math.max(members.length, 2)}
            </button>
          ))}
        </div>

        <button onClick={submit} disabled={!!reason || isPending || baseCount !== null}
          className="mt-6 w-full rounded-full py-3 text-sm font-semibold"
          style={{
            background: reason ? 'var(--surface-strong)' : 'var(--ink)',
            color: reason ? 'var(--subtle)' : 'var(--bg)',
            cursor: reason || baseCount !== null ? 'not-allowed' : 'pointer',
          }}>
          {isPending ? 'Confirm in your wallet…' : baseCount !== null ? 'Waiting for the chain…' : 'Create room'}
        </button>

        {baseCount !== null && (
          <button onClick={checkNow} className="mt-2 block w-full text-center text-[10.5px] underline"
            style={{ color: 'var(--subtle)' }}>
            check again
          </button>
        )}

        {hash && (
          <a href={explorerTx(hash)} target="_blank" rel="noopener noreferrer"
            className="mt-2 block text-center mono text-[10.5px]" style={{ color: 'var(--accent)' }}>
            view transaction
          </a>
        )}

        <p className="mt-2 text-center text-[11px]" style={{ color: reason ? 'var(--waiting)' : 'var(--subtle)' }}>
          {!address ? <ConnectPrompt /> : (reason ?? 'Nothing leaves without the approvals you set.')}
        </p>

        <RoomList />
      </div>
    </main>
  )
}
