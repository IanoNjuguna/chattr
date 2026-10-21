import { ConnectKitButton } from 'connectkit'
import { BrandMark, Wordmark } from '../../components/BrandMark'
import { fmtUsdcFine } from '../../lib/money'
import { roomLink } from '../../lib/routing'
import type { RoomData } from '../../lib/types'
import { toast } from 'sonner'

interface Props {
  room: RoomData | undefined
  roomId: bigint
  isPreview: boolean
}

/** Left rail: who you are in, the pot, and the one action that grows the room. */
export function Rail({ room, roomId, isPreview }: Props) {
  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(roomLink(roomId))
      toast.success('Invite link copied')
    } catch {
      toast.error('Copy failed, select the address bar instead')
    }
  }

  return (
    <aside
      className="hidden lg:flex flex-col justify-between py-5 px-4"
      style={{ background: 'var(--bg)', borderRight: '1px solid var(--border)' }}
    >
      <div>
        <div className="flex items-center gap-2" style={{ color: 'var(--ink)' }}>
          <BrandMark size={20} withDot={false} />
          <Wordmark className="text-[14px]" />
        </div>

        <button
          onClick={() => window.location.reload()}
          className="mt-6 w-full text-left rounded-xl px-3 py-3"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="text-[12px] font-medium truncate" style={{ color: 'var(--ink)' }}>
            {room?.name ?? 'Room'}
          </div>
          <div className="amount text-[15px] mt-1" style={{ color: 'var(--ink-2)' }}>
            {room ? fmtUsdcFine(room.balance) : '0.00'}
          </div>
          <div className="text-[10px] mt-1" style={{ color: 'var(--subtle)' }}>
            {room ? `${room.threshold} of ${room.members.length}` : '—'} · USDC
          </div>
        </button>

        <nav className="mt-6 space-y-1">
          <span className="block rounded-lg px-3 py-2 text-[12px] font-medium"
            style={{ background: 'var(--surface-strong)', color: 'var(--ink)' }}>
            Room
          </span>
          <span className="block rounded-lg px-3 py-2 text-[12px]" style={{ color: 'var(--subtle)' }}>
            {room ? `${room.members.length} members` : 'Members'}
          </span>
          <button onClick={copyInvite} className="block w-full text-left rounded-lg px-3 py-2 text-[12px]"
            style={{ color: 'var(--ink-2)' }}>
            Copy invite link
          </button>
        </nav>
      </div>

      <div className="space-y-3">
        <p className="text-[10px] leading-relaxed" style={{ color: 'var(--subtle)' }}>
          0.5% on payouts, taken by the contract. USDC pays the gas.
        </p>
        {isPreview && (
          <ConnectKitButton.Custom>
            {({ show }) => (
              <button onClick={show} className="w-full rounded-full py-2 text-[12px] font-semibold"
                style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
                Connect wallet
              </button>
            )}
          </ConnectKitButton.Custom>
        )}
      </div>
    </aside>
  )
}
