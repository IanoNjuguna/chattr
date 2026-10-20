import { useState } from 'react'
import { useAccount, useSwitchChain } from 'wagmi'
import { toast } from 'sonner'
import { RoomHeader }   from './components/RoomHeader'
import { MemberStrip }  from './components/MemberStrip'
import { Feed }         from './components/Feed'
import { Composer }     from './components/Composer'
import { useRoom, useFeeBps } from './hooks/useRoom'
import { useActivity }  from './hooks/useActivity'
import { useRequest, useHasVoted } from './hooks/useRequest'
import { useApproveRequest } from './hooks/useWrite'
import { TARGET_CHAIN_ID, IS_DEPLOYED } from './lib/constants'
import { SAMPLE_ROOM, SAMPLE_ACTIVITY } from './lib/sampleData'

// Demo: always show room 0 until we have a create-room flow
const DEMO_ROOM_ID = 0n

export default function App() {
  const { address, isConnected, chainId } = useAccount()
  const { switchChain } = useSwitchChain()

  const isPreview   = !isConnected || !IS_DEPLOYED
  const roomId      = DEMO_ROOM_ID

  // ── chain check ────────────────────────────────────────────────────────────
  const wrongChain = isConnected && chainId !== TARGET_CHAIN_ID

  // ── contract reads ─────────────────────────────────────────────────────────
  const { room, refetch: refetchRoom }     = useRoom(roomId)
  const feeBps                             = useFeeBps()
  const { items: liveItems, loading }      = useActivity(roomId)

  // Find the latest pending request for the member strip
  const [pendingReqId] = useState<bigint | null>(null)  // will be updated below via activity
  const pendingActivity = liveItems.find(i => i.kind === 'request' && i.requestId !== undefined)
  const openReqId: bigint | null = pendingActivity?.requestId ?? pendingReqId

  const { req: openRequest }               = useRequest(openReqId)
  const hasVoted                           = useHasVoted(roomId, address, openReqId)
  const { approveRequest, isPending: approvingReq } = useApproveRequest()

  // ── handlers ───────────────────────────────────────────────────────────────
  const handleApprove = () => {
    if (!openReqId) return
    approveRequest(roomId, openReqId)
  }

  const handleDone = () => {
    refetchRoom()
    toast.success('Transaction confirmed')
  }

  // ── render ─────────────────────────────────────────────────────────────────
  const displayRoom     = isPreview ? SAMPLE_ROOM : room
  const displayActivity = isPreview ? SAMPLE_ACTIVITY : liveItems

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>
      {/* background blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div style={{ position: 'absolute', top: '5%',  left: '3%',  width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(76,106,166,0.18) 0%, transparent 70%)', filter: 'blur(70px)' }} />
        <div style={{ position: 'absolute', bottom: '8%', right: '5%', width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(92,60,160,0.14) 0%, transparent 70%)', filter: 'blur(65px)' }} />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl min-h-dvh flex flex-col">
        <RoomHeader room={displayRoom} feeBps={feeBps} isPreview={isPreview} />

        {/* wrong chain banner */}
        {wrongChain && (
          <div className="mx-4 mt-3 rounded-lg px-4 py-3 flex items-center justify-between gap-3" style={{ background: 'rgba(232,109,122,0.15)', border: '1px solid rgba(232,109,122,0.3)' }}>
            <span className="text-sm" style={{ color: 'var(--danger)' }}>Switch to Arc Testnet</span>
            <button
              onClick={() => switchChain({ chainId: TARGET_CHAIN_ID })}
              className="rounded px-3 py-1 text-xs font-semibold"
              style={{ background: 'var(--danger)', color: '#fff' }}
            >
              Switch
            </button>
          </div>
        )}

        {/* not deployed banner */}
        {!IS_DEPLOYED && isConnected && (
          <div className="mx-4 mt-3 rounded-lg px-4 py-3" style={{ background: 'rgba(172,198,233,0.08)', border: '1px solid var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              Contract not deployed yet. Deploy ChattrRooms.sol then set CHATTR_ADDRESS in <code className="mono">src/lib/constants.ts</code>.
            </p>
          </div>
        )}

        <MemberStrip
          room={displayRoom}
          openRequest={openRequest ?? null}
          openReqId={openReqId}
          connectedAddr={address}
          hasVoted={hasVoted}
          onApprove={handleApprove}
          isApproving={approvingReq}
        />

        <div className="flex-1 overflow-y-auto">
          <Feed items={displayActivity} loading={loading} isPreview={isPreview} />
        </div>

        {isConnected && !wrongChain && (
          <Composer
            room={displayRoom}
            roomId={roomId}
            connectedAddr={address}
            onDone={handleDone}
          />
        )}

        {!isConnected && (
          <div className="px-4 py-4" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs text-center" style={{ color: 'var(--subtle)' }}>
              Connect a wallet to top up, request, or approve
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
