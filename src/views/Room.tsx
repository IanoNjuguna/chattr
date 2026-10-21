import { useEffect, useState } from 'react'
import { useAccount } from 'wagmi'
import { toast } from 'sonner'
import { RoomHeader } from '../components/RoomHeader'
import { MemberStrip } from '../components/MemberStrip'
import { Feed } from '../components/Feed'
import { Composer } from '../components/Composer'
import { useRoom, useFeeBps } from '../hooks/useRoom'
import { useActivity } from '../hooks/useActivity'
import { useRequest, useHasVoted } from '../hooks/useRequest'
import { useApproveRequest } from '../hooks/useWrite'
import { TARGET_CHAIN_ID, IS_DEPLOYED } from '../lib/constants'
import { SAMPLE_ROOM, SAMPLE_ACTIVITY } from '../lib/sampleData'
import { go } from '../lib/routing'

export function Room({ roomId }: { roomId: bigint }) {
  const { address, isConnected, chainId } = useAccount()

  const isPreview = !isConnected || !IS_DEPLOYED
  const wrongChain = isConnected && chainId !== TARGET_CHAIN_ID

  const { room, refetch: refetchRoom } = useRoom(roomId)
  const feeBps = useFeeBps()
  const { items: liveItems, loading } = useActivity(roomId)

  const pendingActivity = liveItems.find(i => i.kind === 'request' && i.requestId !== undefined)
  const openReqId: bigint | null = pendingActivity?.requestId ?? null

  const { req: openRequest } = useRequest(openReqId)
  const hasVoted = useHasVoted(roomId, address, openReqId)
  const { approveRequest, isPending: approvingReq } = useApproveRequest()

  const [notice, setNotice] = useState<string | null>(null)
  useEffect(() => {
    if (!isPreview && room && room.balance === 0n) setNotice('No money in the room yet. Add it below.')
    else setNotice(null)
  }, [isPreview, room])

  const handleApprove = () => { if (openReqId !== null) approveRequest(roomId, openReqId) }
  const handleDone = () => { refetchRoom(); toast.success('Confirmed') }

  const displayRoom = isPreview ? SAMPLE_ROOM : room
  const displayActivity = isPreview ? SAMPLE_ACTIVITY : liveItems

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg)' }}>
      <div className="mx-auto w-full max-w-2xl flex-1 flex flex-col">
        <button onClick={() => go('/')} className="text-left px-4 pt-3 text-[11px]" style={{ color: 'var(--subtle)' }}>
          ← chattr
        </button>

        <RoomHeader room={displayRoom} feeBps={feeBps} isPreview={isPreview} />

        {wrongChain && (
          <div className="mx-4 mt-3 rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(232,109,122,0.15)', color: 'var(--danger)', border: '1px solid rgba(232,109,122,0.3)' }}>
            Switch to Arc Testnet in your wallet.
          </div>
        )}

        {notice && (
          <div className="mx-4 mt-3 rounded-lg px-4 py-3 text-xs" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
            {notice}
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
          <Composer room={displayRoom} roomId={roomId} connectedAddr={address} onDone={handleDone} />
        )}
      </div>
    </div>
  )
}
