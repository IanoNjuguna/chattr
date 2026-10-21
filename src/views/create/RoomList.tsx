import { ConnectKitButton } from 'connectkit'
import { go, roomPath } from '../../lib/routing'
import { useRooms } from '../../hooks/useRooms'

/**
 * The rooms that already exist. Without this there is no way back into a room
 * except remembering its number, which is not a thing people do.
 */
export function RoomList() {
  const { rooms, loading } = useRooms()

  if (loading) {
    return <p className="mt-6 text-[11px]" style={{ color: 'var(--subtle)' }}>Looking for rooms…</p>
  }
  if (rooms.length === 0) return null

  return (
    <div className="mt-8">
      <div className="text-[10.5px] uppercase tracking-[0.12em]" style={{ color: 'var(--subtle)' }}>
        Your rooms
      </div>
      <ul className="mt-2 space-y-1">
        {rooms.slice(0, 6).map(r => (
          <li key={r.id.toString()}>
            <button
              onClick={() => go(roomPath(r.id))}
              className="row-hover w-full flex items-center justify-between rounded-lg px-3 py-2 text-left"
            >
              <span className="text-[12.5px] truncate" style={{ color: 'var(--ink)' }}>{r.name}</span>
              <span className="mono text-[10.5px]" style={{ color: 'var(--subtle)' }}>#{r.id.toString()}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Shown where a wallet is needed, because the landing is not always the entry point. */
export function ConnectPrompt() {
  return (
    <ConnectKitButton.Custom>
      {({ show }) => (
        <button onClick={show} className="text-[11.5px] underline underline-offset-4" style={{ color: 'var(--waiting)' }}>
          Connect a wallet first
        </button>
      )}
    </ConnectKitButton.Custom>
  )
}
