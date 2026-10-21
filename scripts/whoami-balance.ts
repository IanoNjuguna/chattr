import { createPublicClient, http, erc20Abi, formatUnits } from 'viem'
import { CHATTR_ABI } from '../src/lib/abi'
import { CHATTR_ADDRESS, USDC_ADDRESS, TARGET_CHAIN_ID } from '../src/lib/constants'

const WHO = (process.argv[2] ?? '0x48cb25f9d82aF721c71437fecAfb295da627BA475') as `0x${string}`
const client = createPublicClient({ transport: http('https://rpc.testnet.arc.io') })

const [count, native, usdc, chainId] = await Promise.all([
  client.readContract({ address: CHATTR_ADDRESS, abi: CHATTR_ABI, functionName: 'roomCount' }),
  client.getBalance({ address: WHO }),
  client.readContract({ address: USDC_ADDRESS, abi: erc20Abi, functionName: 'balanceOf', args: [WHO] }),
  client.getChainId(),
])

console.log('chainId           ', chainId, '(expected', TARGET_CHAIN_ID + ')')
console.log('roomCount()       ', count)
console.log('native 18dp       ', formatUnits(native, 18))
console.log('USDC 6dp balanceOf', formatUnits(usdc, 6))
