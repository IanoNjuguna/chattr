import { USDC_DECIMALS } from './constants'

const DIVISOR = 10 ** USDC_DECIMALS  // 1_000_000

/**
 * Convert 6-decimal USDC base units to a two-decimal display string.
 * e.g. 1_050_000n → "1.05"
 * This is the ONE place that knows about decimals. Use it everywhere.
 */
export function fmtUsdc(raw: bigint): string {
  const whole  = raw / BigInt(DIVISOR)
  const frac   = raw % BigInt(DIVISOR)
  const fracStr = frac.toString().padStart(USDC_DECIMALS, '0').slice(0, 2)
  return `${whole}.${fracStr}`
}

/**
 * Parse a user-typed decimal string to USDC base units.
 * e.g. "1.05" → 1_050_000n
 */
export function parseUsdc(value: string): bigint {
  const clean = value.trim()
  if (!clean) return 0n
  const [whole, frac = ''] = clean.split('.')
  const fracPadded = frac.padEnd(USDC_DECIMALS, '0').slice(0, USDC_DECIMALS)
  const w = BigInt(whole || '0')
  const f = BigInt(fracPadded)
  return w * BigInt(DIVISOR) + f
}

/** Format bps as "50/30/20" style string given parallel bps array */
export function fmtBps(bps: number[]): string {
  return bps.map(b => b / 100).join('/')
}
