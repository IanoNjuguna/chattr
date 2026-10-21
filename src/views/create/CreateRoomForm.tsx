import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { decodeEventLog, isAddress } from 'viem'
import { toast } from 'sonner'
import { useCreateRoom } from '../../hooks/useWrite'
import { CHATTR_ABI } from '../../lib/abi'
import { useRoomCount } from '../../hooks/useRoom'
import { explorerTx } from '../../lib/constants'
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
export function CreateRoomForm() {
  const { address } = useAccount()
  const { createRoom, isPending, error, receipt, hash, isSuccess } = useCreateRoom()
  const roomCount = useRoomCount()

  const [name, setName] = useState('')
  const [second, setSecond] = useState('')
  const [third, setThird] = useState('')
  const [threshold, setThreshold] = useState(2)
  const [createdId, setCreatedId] = useState<bigint | null>(null)

  const others = [second.trim(), third.trim()].filter(s => s.length > 0)
  const members: `0x${string}`[] = address ? [address, ...others as `0x${string}`[]] : []
  const validAddrs = others.every(a => isAddress(a))
  const distinct = new Set(members.map(m => m.toLowerCase())).size === members.length
  const enoughPeople = members.length >= 2
  const effectiveThreshold = Math.min(threshold, Math.max(members.length, 2))

  const reason =
    !address ? 'Connect a wallet first'
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

  /** Fallback: a confirmed tx with no decoded event still means the newest room is ours. */
  useEffect(() => {
    if (!isSuccess || createdId !== null || roomCount === 0n) return
    setCreatedId(roomCount - 1n)
  }, [isSuccess, createdId, roomCount])

  useEffect(() => {
    if (error) toast.error(error.message?.slice(0, 90) ?? 'Transaction failed')
  }, [error])

  const submit = () => {
    if (reason || !address) return
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

        <button onClick={submit} disabled={!!reason || isPending}
          className="mt-6 w-full rounded-full py-3 text-sm font-semibold"
          style={{
            background: reason ? 'var(--surface-strong)' : 'var(--ink)',
            color: reason ? 'var(--subtle)' : 'var(--bg)',
            cursor: reason ? 'not-allowed' : 'pointer',
          }}>
          {isPending ? 'Confirm in your wallet…' : 'Create room'}
        </button>

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
