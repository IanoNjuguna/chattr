import { describe, expect, test } from 'bun:test'
import { fmtUsdc, fmtUsdcFine, parseUsdc } from './money'

describe('fmtUsdc, two decimals rounded half-up', () => {
  test('rounds a sub-cent remainder up instead of dropping it', () => {
    // 0.995 used to render as "0.99", a cent short of what was sent
    expect(fmtUsdc(995_000n)).toBe('1.00')
  })

  test('leaves an exact amount alone', () => {
    expect(fmtUsdc(1_000_000n)).toBe('1.00')
    expect(fmtUsdc(8_500_000n)).toBe('8.50')
    expect(fmtUsdc(0n)).toBe('0.00')
  })

  test('rounds half up at exactly half a cent', () => {
    expect(fmtUsdc(15_000n)).toBe('0.02')   // 0.015
    expect(fmtUsdc(5_000n)).toBe('0.01')    // 0.005 ... to 0.01
    expect(fmtUsdc(4_999n)).toBe('0.00')    // 0.004999
  })

  test('rounds down below half a cent', () => {
    expect(fmtUsdc(10_500n)).toBe('0.01')   // 0.0105
    expect(fmtUsdc(1_234_567n)).toBe('1.23')
  })
})

describe('fmtUsdcFine, real precision for fees and payouts', () => {
  test('shows a sub-cent fee instead of zero', () => {
    expect(fmtUsdcFine(5_000n)).toBe('0.005')
  })

  test('shows a payout that lands between cents', () => {
    expect(fmtUsdcFine(995_000n)).toBe('0.995')
  })

  test('keeps two decimals for round amounts', () => {
    expect(fmtUsdcFine(1_000_000n)).toBe('1.00')
    expect(fmtUsdcFine(0n)).toBe('0.00')
  })

  test('trims trailing zeros but never below two decimals', () => {
    expect(fmtUsdcFine(1_200_000n)).toBe('1.20')
    expect(fmtUsdcFine(1_234_567n)).toBe('1.234567')
  })
})

describe('parseUsdc', () => {
  test('round-trips a plain amount', () => {
    expect(parseUsdc('1.05')).toBe(1_050_000n)
    expect(parseUsdc('0.005')).toBe(5_000n)
    expect(parseUsdc('')).toBe(0n)
  })
})
