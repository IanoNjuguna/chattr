// Independent verification of the testnet deployment.
// Reads the chain directly through the same RPC the app uses, and proves the
// cross-room guard is in the deployed runtime code rather than trusting
// Arc Studio's report.
import { createPublicClient, http, keccak256, toHex } from 'viem'
import { CHATTR_ABI } from '../src/lib/abi'

const CURRENT = '0x248bd5d09b394d7d6041188ef3bbc2920ac8e205' as `0x${string}`
const SUPERSEDED = '0xe94fc65ee82484ca85769ec65c767de30146f40f' as `0x${string}`
const TX = '0x389255810c5928ea060bd605078ffd5f6ae0a8d2eb1b33ad30dd4b2be9b73572' as `0x${string}`

const client = createPublicClient({
  chain: {
    id: 5042002,
    name: 'Arc Testnet',
    nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
    rpcUrls: { default: { http: ['https://rpc.testnet.arc.io'] } },
  },
  transport: http(),
})

const wrongRoomSelector = keccak256(toHex('WrongRoom()')).slice(0, 10)
const code = (await client.getCode({ address: CURRENT })) ?? '0x'
const oldCode = (await client.getCode({ address: SUPERSEDED })) ?? '0x'

console.log('chainId                    ', await client.getChainId())
console.log('deployed bytecode bytes    ', (code.length - 2) / 2)
console.log('feeBps()                   ', await client.readContract({ address: CURRENT, abi: CHATTR_ABI, functionName: 'feeBps' }))
console.log('treasury()                 ', await client.readContract({ address: CURRENT, abi: CHATTR_ABI, functionName: 'treasury' }))
console.log('usdc()                     ', await client.readContract({ address: CURRENT, abi: CHATTR_ABI, functionName: 'usdc' }))
console.log('roomCount()                ', await client.readContract({ address: CURRENT, abi: CHATTR_ABI, functionName: 'roomCount' }))
console.log('WrongRoom selector         ', wrongRoomSelector)
console.log('guard in CURRENT bytecode  ', code.includes(wrongRoomSelector.slice(2)))
console.log('guard in SUPERSEDED code   ', oldCode.includes(wrongRoomSelector.slice(2)))
const rc = await client.getTransactionReceipt({ hash: TX })
console.log('tx status                  ', rc.status, '| block', rc.blockNumber)
console.log('tx deployer                ', rc.from)
