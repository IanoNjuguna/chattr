// ─── Chain ───────────────────────────────────────────────────────────────────
export const ARC_TESTNET_ID   = 5042002
export const ARC_MAINNET_ID   = 5042
export const TARGET_CHAIN_ID  = ARC_TESTNET_ID  // switch to mainnet when ready

// ─── USDC ─────────────────────────────────────────────────────────────────────
// ERC-20 at 6 decimals — same predeploy address on Arc mainnet and testnet
export const USDC_ADDRESS  = '0x3600000000000000000000000000000000000000' as `0x${string}`
export const USDC_DECIMALS = 6

// ─── Contract ─────────────────────────────────────────────────────────────────
// Fill in after deployment; all features degrade gracefully when this is zero
export const CHATTR_ADDRESS = '0x248bd5d09b394d7d6041188ef3bbc2920ac8e205' as `0x${string}`
export const IS_DEPLOYED = CHATTR_ADDRESS !== '0x0000000000000000000000000000000000000000'

// ─── Explorer ─────────────────────────────────────────────────────────────────
export const EXPLORER_BASE = 'https://explorer.testnet.arc.io'  // testnet
/** Blockscout-style API on the same host. Used to read contract logs. */
export const EXPLORER_API = `${EXPLORER_BASE}/api/v2`
// export const EXPLORER_BASE = 'https://explorer.arc.io'        // mainnet

export function explorerTx(hash: string) {
  return `${EXPLORER_BASE}/tx/${hash}`
}
