import { useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { toast } from 'sonner'
import { Rail } from './room/Rail'
import { RoomTop } from './room/RoomTop'
import { FeedRow } from './room/FeedRow'
import { RequestPanel } from './room/RequestPanel'
import { Composer } from '../components/Composer'
import { useRoom, useFeeBps } from '../hooks/useRoom'
import { useActivity } from '../hooks/useActivity'
import { useRequest, useHasVoted } from '../hooks/useRequest'
import { useApproveRequest, useExecute, useAttest } from '../hooks/useWrite'
import { IS_DEPLOYED } from '../lib/constants'
import { SAMPLE_ROOM, SAMPLE_ACTIVITY } from '../lib/sampleData'

type Tab = 'topup' | 'request'

/** Three regions: rail, feed, panel. The feed is rows, not cards. */
export function Room({ roomId }: { roomId: bigint }) {
  const { address, isConnected } = useAccount()
  const isPreview = !isConnected || !IS_DEPLOYED

  const { room, refetch: refetchRoom } = useRoom(roomId)
  const feeBps = useFeeBps()
  const { items: liveItems } = useActivity(roomId)

  const [selectedId, setSelectedId] = useState<bigint | null>(null)
  const [tab, setTab] = useState<Tab>('topup')

  const displayRoom = isPreview ? SAMPLE_ROOM : room
  const items = isPreview ? SAMPLE_ACTIVITY : liveItems

  const executedIds = useMemo(
    () => new Set(items.filter(i => i.kind === 'executed' && i.requestId !== undefined).map(i => String(i.requestId))),
    [items],
  )
  const pending = useMemo(
    () => items.filter(i => i.kind === 'request' && i.requestId !== undefined && !executedIds.has(String(i.requestId))),
    [items, executedIds],
  )

  const selectedRequestId = selectedId ?? pending[0]?.requestId ?? null
  const { req: selectedRequest } = useRequest(isPreview ? null : selectedRequestId)
  const hasVoted = useHasVoted(roomId, address, selectedRequestId)

  const approveApi = useApproveRequest()
  const executeApi = useExecute()
  const attestApi = useAttest()
  const busy = approveApi.isPending || executeApi.isPending || attestApi.isPending

  const isMember = !!room && !!address && room.members.some(m => m.toLowerCase() === address.toLowerCase())
  const selectedRow = items.find(i => i.requestId === selectedRequestId)

  const approve = () => {
    if (selectedRequestId === null) return
    approveApi.approveRequest(roomId, selectedRequestId)
  }
  const execute = () => {
    if (selectedRequestId === null) return
    executeApi.execute(roomId, selectedRequestId)
  }
  const attest = (delivered: boolean) => {
    if (selectedRequestId === null) return
    attestApi.attest(roomId, selectedRequestId, delivered, delivered ? 'Delivered' : 'Not delivered')
    toast.success(delivered ? 'Marked delivered' : 'Marked not delivered')
  }
  const done = () => refetchRoom()

  return (
    <div className="min-h-dvh lg:grid" style={{ gridTemplateColumns: '220px minmax(0,1fr) 380px', background: 'var(--bg)' }}>
      <Rail room={displayRoom} roomId={roomId} isPreview={isPreview} />

      <section className="flex flex-col min-w-0" style={{ borderRight: '1px solid var(--border)' }}>
        <RoomTop
          room={displayRoom}
          feeBps={feeBps}
          isPreview={isPreview}
          awaitingYou={isPreview ? 1 : pending.length}
          onTopUp={() => setTab('topup')}
          onRequest={() => setTab('request')}
        />

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 && (
            <div className="px-7 py-16 text-center">
              <p className="text-[13px]" style={{ color: 'var(--ink-2)' }}>Nothing has moved yet.</p>
              <p className="text-[11.5px] mt-1" style={{ color: 'var(--subtle)' }}>
                Top up the room, then request a payment.
              </p>
            </div>
          )}
          {items.map(item => (
            <FeedRow
              key={item.id}
              item={item}
              selected={item.requestId === selectedRequestId && item.kind === 'request'}
              onSelect={() => item.requestId !== undefined && setSelectedId(item.requestId)}
            />
          ))}
        </div>
      </section>

      <aside className="hidden lg:block min-w-0 overflow-y-auto" style={{ borderLeft: '1px solid var(--border)' }}>
        {!isPreview && selectedRequest ? (
          <RequestPanel
            request={selectedRequest}
            room={room}
            txHash={selectedRow?.txHash ?? ''}
            hasVoted={hasVoted}
            canAct={isMember}
            busy={busy}
            onApprove={approve}
            onExecute={execute}
            onAttest={attest}
          />
        ) : isConnected ? (
          <Composer key={tab} room={displayRoom} roomId={roomId} connectedAddr={address} onDone={done} defaultTab={tab} />
        ) : (
          <div className="px-6 py-8">
            <p className="text-[12px]" style={{ color: 'var(--muted)' }}>
              Connect a wallet to top up, request or approve.
            </p>
          </div>
        )}
      </aside>
    </div>
  )
}
