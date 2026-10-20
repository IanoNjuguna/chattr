import { USDC_DECIMALS } from './constants'

const DIVISOR = 10 ** USDC_DECIMALS  // 1_000_000

/**
 * Convert 6-decimal USDC base units to a two-decimal display string, rounding
 * half-up. e.g. 1_050_000n → "1.05", 995_000n → "1.00".
 *
 * Rounds rather than truncates on purpose: truncation made 0.995 read as 0.99,
 * so a payout looked a cent short of what the contract sent.
 *
 * Display only. Never feed this back into a transaction amount.
 */
export function fmtUsdc(raw: bigint): string {
  const cents = (raw + 5_000n) / 10_000n   // 10^4 base units = 0.01 USDC
  const whole = cents / 100n
  const frac  = (cents % 100n).toString().padStart(2, '0')
  return `${whole}.${frac}`
}

/**
 * Convert base units to a string with real precision: at least two decimals,
 * at most six, trailing zeros trimmed. e.g. 5_000n → "0.005", 995_000n → "0.995".
 *
 * Use this for fees and payouts, where a sub-cent value rounded to two decimals
 * would display as zero and look like money went missing.
 */
export function fmtUsdcFine(raw: bigint): string {
  const whole = raw / BigInt(DIVISOR)
  const frac  = (raw % BigInt(DIVISOR)).toString().padStart(USDC_DECIMALS, '0')
  const trimmed = frac.replace(/0+$/, '')
  const out = trimmed.length < 2 ? frac.slice(0, 2) : trimmed
  return `${whole}.${out}`
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
