// Diagnose: what did those five transactions actually call, and how many rooms exist?
import { createPublicClient, http, decodeFunctionData, toFunctionSelector, formatUnits } from 'viem'
import { CHATTR_ABI } from '../src/lib/abi'

const CONTRACT = '0x248bd5d09b394d7d6041188ef3bbc2920ac8e205' as `0x${string}`
const HASHES = [
  '0x3447830e78525d99', '0x94f92e67d0c35e7b', '0x242da73a71ed7ca8',
  '0x7f35e5b648d04641', '0x1b7184db1a555993',
] as const

const client = createPublicClient({
  chain: { id: 5042002, name: 'Arc Testnet', nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc.testnet.arc.io'] } } },
  transport: http(),
})

console.log('createRoom selector:', toFunctionSelector('createRoom(string,address[],uint8)'))
console.log('deposit selector   :', toFunctionSelector('deposit(uint256,uint256)'))
console.log('roomCount()        :', await client.readContract({ address: CONTRACT, abi: CHATTR_ABI, functionName: 'roomCount' }))

for (const prefix of HASHES) {
  const txs = await fetch(`https://explorer.testnet.arc.io/api/v2/addresses/${CONTRACT}/transactions?filter=to`).then(r => r.json())
  const item = txs.items.find((t: any) => t.hash.startsWith(prefix))
  if (!item) { console.log(prefix, 'not found'); continue }
  console.log('\n---', item.hash)
  console.log('status:', item.status, '| block:', item.block_number, '| from:', item.from?.hash)
  try {
    const decoded = decodeFunctionData({ abi: CHATTR_ABI, data: item.raw_input })
    console.log('function:', decoded.functionName)
    console.log('args:', JSON.stringify(decoded.args, (_k, v) => typeof v === 'bigint' ? v.toString() : v))
  } catch (e) {
    console.log('decode failed:', (e as Error).message.slice(0, 80), '| selector:', item.raw_input?.slice(0, 10))
  }
}
