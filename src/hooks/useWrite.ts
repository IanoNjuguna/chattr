/**
 * All contract-write hooks in one file. Each is a thin wrapper around
 * useWriteContract + useWaitForTransactionReceipt.
 */
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { erc20Abi, maxUint256 } from 'viem'
import { CHATTR_ABI } from '../lib/abi'
import { CHATTR_ADDRESS, USDC_ADDRESS, TARGET_CHAIN_ID } from '../lib/constants'

function useTx(hash: `0x${string}` | undefined) {
  return useWaitForTransactionReceipt({ hash })
}

// ── USDC approval ──────────────────────────────────────────────────────────────
export function useApproveUsdc() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const receipt = useTx(hash)
  const approve = () => writeContract({
    address: USDC_ADDRESS, abi: erc20Abi, functionName: 'approve',
    args: [CHATTR_ADDRESS, maxUint256], chainId: TARGET_CHAIN_ID,
  })
  return { approve, isPending, isConfirming: receipt.isLoading, isSuccess: receipt.isSuccess, error }
}

// ── USDC balance ───────────────────────────────────────────────────────────────
import { useReadContract } from 'wagmi'
export function useUsdcBalance(address: `0x${string}` | undefined) {
  const { data } = useReadContract({
    address: USDC_ADDRESS, abi: erc20Abi, functionName: 'balanceOf',
    args: [address ?? '0x0000000000000000000000000000000000000000'],
    chainId: TARGET_CHAIN_ID, query: { enabled: !!address, refetchInterval: 8_000 },
  })
  return (data ?? 0n) as bigint
}

export function useUsdcAllowance(address: `0x${string}` | undefined) {
  const { data, refetch } = useReadContract({
    address: USDC_ADDRESS, abi: erc20Abi, functionName: 'allowance',
    args: [address ?? '0x0000000000000000000000000000000000000000', CHATTR_ADDRESS],
    chainId: TARGET_CHAIN_ID, query: { enabled: !!address },
  })
  return { allowance: (data ?? 0n) as bigint, refetch }
}

// ── deposit ────────────────────────────────────────────────────────────────────
export function useDeposit() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const receipt = useTx(hash)
  const deposit = (roomId: bigint, amount: bigint) => writeContract({
    address: CHATTR_ADDRESS, abi: CHATTR_ABI, functionName: 'deposit',
    args: [roomId, amount], chainId: TARGET_CHAIN_ID,
  })
  return { deposit, isPending, isConfirming: receipt.isLoading, isSuccess: receipt.isSuccess, hash, error }
}

// ── request ────────────────────────────────────────────────────────────────────
export function useRequestPayout() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const receipt = useTx(hash)
  const requestPayout = (roomId: bigint, to: `0x${string}`, amount: bigint, memo: string, unlockAt: bigint) =>
    writeContract({
      address: CHATTR_ADDRESS, abi: CHATTR_ABI, functionName: 'request',
      args: [roomId, to, amount, memo, unlockAt], chainId: TARGET_CHAIN_ID,
    })
  return { requestPayout, isPending, isConfirming: receipt.isLoading, isSuccess: receipt.isSuccess, hash, error }
}

// ── approve ────────────────────────────────────────────────────────────────────
export function useApproveRequest() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const receipt = useTx(hash)
  const approveRequest = (roomId: bigint, requestId: bigint) => writeContract({
    address: CHATTR_ADDRESS, abi: CHATTR_ABI, functionName: 'approve',
    args: [roomId, requestId], chainId: TARGET_CHAIN_ID,
  })
  return { approveRequest, isPending, isConfirming: receipt.isLoading, isSuccess: receipt.isSuccess, hash, error }
}

// ── execute ────────────────────────────────────────────────────────────────────
export function useExecute() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const receipt = useTx(hash)
  const execute = (roomId: bigint, requestId: bigint) => writeContract({
    address: CHATTR_ADDRESS, abi: CHATTR_ABI, functionName: 'execute',
    args: [roomId, requestId], chainId: TARGET_CHAIN_ID,
  })
  return { execute, isPending, isConfirming: receipt.isLoading, isSuccess: receipt.isSuccess, hash, error }
}

// ── attest ─────────────────────────────────────────────────────────────────────
export function useAttest() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const receipt = useTx(hash)
  const attest = (roomId: bigint, requestId: bigint, delivered: boolean, note: string) =>
    writeContract({
      address: CHATTR_ADDRESS, abi: CHATTR_ABI, functionName: 'attest',
      args: [roomId, requestId, delivered, note], chainId: TARGET_CHAIN_ID,
    })
  return { attest, isPending, isConfirming: receipt.isLoading, isSuccess: receipt.isSuccess, hash, error }
}

// ── createRoom ─────────────────────────────────────────────────────────────────
export function useCreateRoom() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const receipt = useTx(hash)
  const createRoom = (name: string, members: `0x${string}`[], threshold: number) =>
    writeContract({
      address: CHATTR_ADDRESS, abi: CHATTR_ABI, functionName: 'createRoom',
      args: [name, members, threshold], chainId: TARGET_CHAIN_ID,
    })
  return { createRoom, isPending, isConfirming: receipt.isLoading, isSuccess: receipt.isSuccess, hash, error, receipt: receipt.data }
}

// ── setShares / payShares ──────────────────────────────────────────────────────
export function useSetShares() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const receipt = useTx(hash)
  const setShares = (roomId: bigint, members: `0x${string}`[], bps: number[]) =>
    writeContract({
      address: CHATTR_ADDRESS, abi: CHATTR_ABI, functionName: 'setShares',
      args: [roomId, members, bps], chainId: TARGET_CHAIN_ID,
    })
  return { setShares, isPending, isConfirming: receipt.isLoading, isSuccess: receipt.isSuccess, hash, error }
}

export function usePayShares() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const receipt = useTx(hash)
  const payShares = (roomId: bigint, amount: bigint) => writeContract({
    address: CHATTR_ADDRESS, abi: CHATTR_ABI, functionName: 'payShares',
    args: [roomId, amount], chainId: TARGET_CHAIN_ID,
  })
  return { payShares, isPending, isConfirming: receipt.isLoading, isSuccess: receipt.isSuccess, hash, error }
}
