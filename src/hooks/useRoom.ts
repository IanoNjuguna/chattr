import { useReadContract } from 'wagmi'
import { CHATTR_ABI } from '../lib/abi'
import { CHATTR_ADDRESS, IS_DEPLOYED, TARGET_CHAIN_ID } from '../lib/constants'
import type { RoomData } from '../lib/types'

export function useRoom(roomId: bigint) {
  const { data, isLoading, refetch } = useReadContract({
    address:      CHATTR_ADDRESS,
    abi:          CHATTR_ABI,
    functionName: 'getRoom',
    args:         [roomId],
    chainId:      TARGET_CHAIN_ID,
    query:        { enabled: IS_DEPLOYED, refetchInterval: 8_000 },
  })

  const room: RoomData | undefined = data
    ? {
        name:         data.name,
        captain:      data.captain,
        members:      data.members,
        threshold:    data.threshold,
        balance:      data.balance,
        shareMembers: data.shareMembers,
        shareBps:     data.shareBps as readonly number[],
      }
    : undefined

  return { room, isLoading, refetch }
}

export function useRoomCount() {
  const { data } = useReadContract({
    address:      CHATTR_ADDRESS,
    abi:          CHATTR_ABI,
    functionName: 'roomCount',
    chainId:      TARGET_CHAIN_ID,
    query:        { enabled: IS_DEPLOYED, refetchInterval: 8_000 },
  })
  return data ?? 0n
}

export function useFeeBps() {
  const { data } = useReadContract({
    address:      CHATTR_ADDRESS,
    abi:          CHATTR_ABI,
    functionName: 'feeBps',
    chainId:      TARGET_CHAIN_ID,
    query:        { enabled: IS_DEPLOYED },
  })
  return data ?? 50
}
