import { useEffect, useState } from 'react'
import { decodeAbiParameters, keccak256, toHex } from 'viem'
import { CHATTR_ADDRESS, EXPLORER_API, IS_DEPLOYED } from '../lib/constants'

export interface RoomSummary {
  id: bigint
  name: string
}

const ROOM_CREATED_TOPIC = keccak256(toHex('RoomCreated(uint256,address,string,address[],uint8)'))

/**
 * Every room ever created. There is no on-chain registry of ids, so the events
 * are the list.
 *
 * Read through the explorer's log endpoint rather than getContractEvents: this
 * RPC rejects a fromBlock 0 to latest range, which silently returned nothing
 * and left the room list invisible.
 */
export function useRooms() {
  const [rooms, setRooms] = useState<RoomSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!IS_DEPLOYED) { setLoading(false); return }
    let active = true

    fetch(`${EXPLORER_API}/addresses/${CHATTR_ADDRESS}/logs`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((body: { items?: { topics?: string[]; data?: string }[] }) => {
        if (!active) return
        const found: RoomSummary[] = []
        for (const log of body.items ?? []) {
          const topics = log.topics ?? []
          if ((topics[0] ?? '').toLowerCase() !== ROOM_CREATED_TOPIC.toLowerCase()) continue
          try {
            const [name] = decodeAbiParameters(
              [{ type: 'string' }, { type: 'address[]' }, { type: 'uint8' }],
              (log.data ?? '0x') as `0x${string}`,
            )
            found.push({ id: BigInt(topics[1]), name: String(name) })
          } catch {
            // a log we cannot decode is not worth failing the list over
          }
        }
        setRooms(found.reverse())
      })
      .catch(() => { if (active) setRooms([]) })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [])

  return { rooms, loading }
}
