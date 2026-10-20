import { useReadContract } from 'wagmi'
import { CHATTR_ABI } from '../lib/abi'
import { CHATTR_ADDRESS, IS_DEPLOYED, TARGET_CHAIN_ID } from '../lib/constants'
import type { RequestData } from '../lib/types'

export function useRequest(requestId: bigint | null) {
  const { data, isLoading, refetch } = useReadContract({
    address:      CHATTR_ADDRESS,
    abi:          CHATTR_ABI,
    functionName: 'getRequest',
    args:         [requestId ?? 0n],
    chainId:      TARGET_CHAIN_ID,
    query:        { enabled: IS_DEPLOYED && requestId !== null, refetchInterval: 5_000 },
  })

  const req: RequestData | undefined = data
    ? {
        roomId:        data.roomId,
        to:            data.to,
        amount:        data.amount,
        memo:          data.memo,
        unlockAt:      data.unlockAt,
        approvalCount: data.approvalCount,
        status:        data.status,
        attested:      data.attested,
        delivered:     data.delivered,
        attestNote:    data.attestNote,
        execTxHash:    data.execTxHash as `0x${string}`,
      }
    : undefined

  return { req, isLoading, refetch }
}

export function useHasVoted(roomId: bigint, who: `0x${string}` | undefined, requestId: bigint | null) {
  const { data } = useReadContract({
    address:      CHATTR_ADDRESS,
    abi:          CHATTR_ABI,
    functionName: 'hasVoted',
    args:         [roomId, who ?? '0x0000000000000000000000000000000000000000', requestId ?? 0n],
    chainId:      TARGET_CHAIN_ID,
    query:        { enabled: IS_DEPLOYED && !!who && requestId !== null, refetchInterval: 5_000 },
  })
  return data ?? false
}
