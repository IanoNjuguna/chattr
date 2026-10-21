import { useState } from 'react'
import { useAccount } from 'wagmi'
import { isAddress } from 'viem'
import { useCreateRoom } from '../../hooks/useWrite'
import { useRoomCount } from '../../hooks/useRoom'
import { go, roomPath } from '../../lib/routing'

const FIELD = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  color: 'var(--ink)',
} as const

/** One screen, three inputs, then it hands over to the room. */
export function CreateRoomForm() {
  const { address } = useAccount()
  const roomCount = useRoomCount()
  const { createRoom, isPending, isSuccess } = useCreateRoom()

  const [name, setName] = useState('')
  const [second, setSecond] = useState('')
  const [third, setThird] = useState('')
  const [threshold, setThreshold] = useState(2)
  const [pendingId, setPendingId] = useState<bigint | null>(null)

  if (isSuccess && pendingId !== null) go(roomPath(pendingId))

  const members = [address ?? '', second.trim(), third.trim()] as `0x${string}`[]
  const addrsOk = members.every(a => isAddress(a))
  const distinct = new Set(members.map(a => a.toLowerCase())).size === 3
  const valid = name.trim().length > 0 && addrsOk && distinct && !!address

  const submit = () => {
    if (!valid || !address) return
    setPendingId(roomCount)   // the new room id is the count before creation
    createRoom(name.trim(), members, threshold)
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        <h1 className="display text-[28px]" style={{ color: 'var(--ink)' }}>Create a room</h1>
        <p className="mt-2 text-[13px]" style={{ color: 'var(--muted)' }}>
          You will be the captain. Two approvals are needed to spend.
        </p>

        <label className="block mt-7 text-[11px] uppercase tracking-[0.12em]" style={{ color: 'var(--subtle)' }}>Room name</label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Hackathon team"
          className="mt-1.5 w-full rounded-lg px-3 py-2.5 text-sm outline-none" style={FIELD} />

        <label className="block mt-4 text-[11px] uppercase tracking-[0.12em]" style={{ color: 'var(--subtle)' }}>Your address</label>
        <input value={address ?? ''} readOnly className="mt-1.5 w-full rounded-lg px-3 py-2.5 text-sm mono" style={{ ...FIELD, color: 'var(--muted)' }} />

        <label className="block mt-4 text-[11px] uppercase tracking-[0.12em]" style={{ color: 'var(--subtle)' }}>Member two</label>
        <input value={second} onChange={e => setSecond(e.target.value)} placeholder="0x…"
          className="mt-1.5 w-full rounded-lg px-3 py-2.5 text-sm mono outline-none" style={FIELD} />

        <label className="block mt-4 text-[11px] uppercase tracking-[0.12em]" style={{ color: 'var(--subtle)' }}>Member three</label>
        <input value={third} onChange={e => setThird(e.target.value)} placeholder="0x…"
          className="mt-1.5 w-full rounded-lg px-3 py-2.5 text-sm mono outline-none" style={FIELD} />

        <label className="block mt-4 text-[11px] uppercase tracking-[0.12em]" style={{ color: 'var(--subtle)' }}>Approvals needed</label>
        <div className="mt-1.5 flex gap-2">
          {[1, 2, 3].map(n => (
            <button key={n} onClick={() => setThreshold(n)}
              className="flex-1 rounded-lg py-2 text-sm font-semibold"
              style={{
                background: threshold === n ? 'var(--ink)' : 'var(--surface)',
                color: threshold === n ? 'var(--bg)' : 'var(--ink-2)',
                border: '1px solid var(--border)',
              }}>
              {n} of 3
            </button>
          ))}
        </div>

        <button onClick={submit} disabled={!valid || isPending}
          className="mt-7 w-full rounded-full py-3 text-sm font-semibold disabled:opacity-40"
          style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
          {isPending ? 'Confirm in your wallet…' : 'Create room'}
        </button>

        <button onClick={() => go('/')} className="mt-4 w-full text-[12px]" style={{ color: 'var(--subtle)' }}>
          Back
        </button>
      </div>
    </main>
  )
}
