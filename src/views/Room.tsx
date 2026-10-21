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
import { ConnectKitButton } from 'connectkit'
import { go } from '../lib/routing'

type Tab = 'topup' | 'request'

/** Three regions: rail, feed, panel. The feed is rows, not cards. */
export function Room({ roomId }: { roomId: bigint }) {
  const { address, isConnected } = useAccount()
  const { room, isLoading, refetch: refetchRoom } = useRoom(roomId)
  const feeBps = useFeeBps()
  const { items: liveItems, loading: activityLoading, failed: activityFailed } = useActivity(roomId)

  const [selectedId, setSelectedId] = useState<bigint | null>(null)
  const [tab, setTab] = useState<Tab>('topup')

  const displayRoom = room
  const items = liveItems

  const executedIds = useMemo(
    () => new Set(items.filter(i => i.kind === 'executed' && i.requestId !== undefined).map(i => String(i.requestId))),
    [items],
  )
  const pending = useMemo(
    () => items.filter(i => i.kind === 'request' && i.requestId !== undefined && !executedIds.has(String(i.requestId))),
    [items, executedIds],
  )

  const selectedRequestId = selectedId ?? pending[0]?.requestId ?? null
  const { req: selectedRequest } = useRequest(selectedRequestId)
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

  /** A real room id must never render sample money, and an id that does not
   *  exist must say so instead of looking like an empty room. */
  if (!isConnected) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <div className="text-center max-w-xs">
          <h1 className="display text-[24px]" style={{ color: 'var(--ink)' }}>Room #{roomId.toString()}</h1>
          <p className="mt-2 text-[12.5px]" style={{ color: 'var(--muted)' }}>Connect a wallet to see who is in it and what it holds.</p>
          <div className="mt-6 flex justify-center"><ConnectKitButton /></div>
        </div>
      </main>
    )
  }

  if (!room) {
    return (
      <main className="min-h-dvh flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <div className="text-center max-w-xs">
          <h1 className="display text-[24px]" style={{ color: 'var(--ink)' }}>
            {isLoading ? 'Loading room…' : `Room #${roomId.toString()} does not exist`}
          </h1>
          <p className="mt-2 text-[12.5px]" style={{ color: 'var(--muted)' }}>
            {isLoading ? 'Reading it from Arc.' : 'Rooms are numbered from zero. Pick one you made, or start another.'}
          </p>
          {!isLoading && (
            <button onClick={() => go('/new')} className="mt-6 rounded-full px-5 py-2.5 text-sm font-semibold"
              style={{ background: 'var(--ink)', color: 'var(--bg)' }}>
              New room
            </button>
          )}
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-dvh lg:grid" style={{ gridTemplateColumns: '220px minmax(0,1fr) 380px', background: 'var(--bg)' }}>
      <Rail room={displayRoom} roomId={roomId} isPreview={false} />

      <section className="flex flex-col min-w-0" style={{ borderRight: '1px solid var(--border)' }}>
        <RoomTop
          room={displayRoom}
          feeBps={feeBps}
          isPreview={false}
          awaitingYou={pending.length}
          onTopUp={() => setTab('topup')}
          onRequest={() => setTab('request')}
        />

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 && (
            <div className="px-7 py-16 text-center">
              <p className="text-[13px]" style={{ color: 'var(--ink-2)' }}>
                {activityLoading ? 'Reading the room…' : activityFailed ? 'Could not reach Arc just now.' : 'Nothing has moved yet.'}
              </p>
              <p className="text-[11.5px] mt-1" style={{ color: 'var(--subtle)' }}>
                {activityFailed
                  ? 'The room still exists. Reload to try again.'
                  : 'Top up the room, then request a payment.'}
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
        {selectedRequest ? (
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
