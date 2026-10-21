// What the chain actually shows right now for the deployed contract.
import { createPublicClient, http, erc20Abi, formatUnits } from 'viem'
import { CHATTR_ABI } from '../src/lib/abi'

const env = (k: string) => process.env[k] as `0x${string}` | undefined
const CONTRACT = (env('CHATTR') ?? '0x248bd5d09b394d7d6041188ef3bbc2920ac8e205') as `0x${string}`
const USDC = '0x3600000000000000000000000000000000000000' as `0x${string}`

const client = createPublicClient({
  chain: {
    id: 5042002,
    name: 'Arc Testnet',
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc.testnet.arc.io'] } },
  },
  transport: http(),
})

const rooms = await client.readContract({ address: CONTRACT, abi: CHATTR_ABI, functionName: 'roomCount' })
const held = await client.readContract({ address: USDC, abi: erc20Abi, functionName: 'balanceOf', args: [CONTRACT] })
console.log('block            ', await client.getBlockNumber())
console.log('roomCount()      ', rooms)
console.log('contract USDC    ', formatUnits(held, 6), 'USDC')

const who = env('ADDR')
if (who) {
  const bal = await client.readContract({ address: USDC, abi: erc20Abi, functionName: 'balanceOf', args: [who] })
  const nonce = await client.getTransactionCount({ address: who })
  console.log('wallet           ', who)
  console.log('wallet USDC      ', formatUnits(bal, 6), 'USDC')
  console.log('wallet nonce     ', nonce)
}

if (rooms > 0n) {
  const r = await client.readContract({ address: CONTRACT, abi: CHATTR_ABI, functionName: 'getRoom', args: [0n] })
  console.log('room 0           ', r.name, '| balance', formatUnits(r.balance, 6), '| threshold', r.threshold, '| members', r.members.length)
}
