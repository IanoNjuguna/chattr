/** Composer: Top-up and Request forms. Under 80 lines each; split into sub-panels. */
import { useState } from 'react'
import { toast } from 'sonner'
import { parseUsdc } from '../lib/money'
import { useDeposit, useRequestPayout, useUsdcAllowance, useApproveUsdc, useUsdcBalance } from '../hooks/useWrite'
import { fmtUsdc } from '../lib/money'
import type { RoomData } from '../lib/types'

interface Props {
  room:          RoomData | undefined
  roomId:        bigint
  connectedAddr: `0x${string}` | undefined
  onDone:        () => void
}

type Tab = 'topup' | 'request'

function parseAddr(s: string): `0x${string}` | null {
  return /^0x[0-9a-fA-F]{40}$/.test(s) ? s as `0x${string}` : null
}

export function Composer({ room, roomId, connectedAddr, onDone }: Props) {
  const [tab, setTab]         = useState<Tab>('topup')
  const [amount, setAmount]   = useState('')
  const [toAddr, setToAddr]   = useState('')
  const [memo, setMemo]       = useState('')
  const [unlock, setUnlock]   = useState('')

  const { deposit, isPending: dep_p, isConfirming: dep_c, isSuccess: dep_s, error: dep_e } = useDeposit()
  const { requestPayout, isPending: req_p, isConfirming: req_c, isSuccess: req_s, error: req_e } = useRequestPayout()
  const { approve: approveUsdc, isPending: appr_p, isSuccess: appr_s } = useApproveUsdc()
  const { allowance } = useUsdcAllowance(connectedAddr)
  const balance       = useUsdcBalance(connectedAddr)

  const parsedAmt = parseUsdc(amount)
  const needsApproval = parsedAmt > 0n && allowance < parsedAmt

  // surface errors
  if (dep_e)  toast.error(dep_e.message?.slice(0, 80)  ?? 'Deposit failed')
  if (req_e)  toast.error(req_e.message?.slice(0, 80)  ?? 'Request failed')
  if (dep_s || req_s) { toast.success('Done!'); onDone(); }
  if (appr_s) toast.success('USDC approved')

  const isBusy = dep_p || dep_c || req_p || req_c || appr_p

  const handleDeposit = () => {
    if (parsedAmt <= 0n) return toast.error('Enter an amount')
    if (needsApproval)   return approveUsdc()
    deposit(roomId, parsedAmt)
  }

  const handleRequest = () => {
    if (parsedAmt <= 0n)    return toast.error('Enter an amount')
    if (!room)              return toast.error('Room not loaded')
    if (parsedAmt > room.balance) return toast.error('Amount exceeds room balance')
    const addr = parseAddr(toAddr)
    if (!addr)              return toast.error('Invalid payee address')
    const unlockTs = unlock ? BigInt(Math.floor(new Date(unlock).getTime() / 1000)) : 0n
    if (!connectedAddr)     return toast.error('Connect wallet')
    const isMember = room.members.some(m => m.toLowerCase() === connectedAddr.toLowerCase())
    if (!isMember)          return toast.error('Not a room member')
    requestPayout(roomId, addr, parsedAmt, memo, unlockTs)
  }

  const tabStyle = (t: Tab): React.CSSProperties => ({
    flex: 1, padding: '6px 0', fontSize: 13, fontWeight: 600, borderRadius: 6,
    background: tab === t ? 'var(--surface-strong)' : 'transparent',
    color:      tab === t ? 'var(--ink)'             : 'var(--muted)',
    border:     'none', cursor: 'pointer',
  })

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', fontSize: 14, borderRadius: 8,
    background: 'var(--surface-muted)', border: '1px solid var(--border)',
    color: 'var(--ink)', outline: 'none',
  }

  const btnStyle: React.CSSProperties = {
    width: '100%', padding: '10px', borderRadius: 8, fontSize: 14,
    fontWeight: 600, background: 'var(--accent)', color: '#0d1b2f',
    border: 'none', cursor: isBusy ? 'not-allowed' : 'pointer',
    opacity: isBusy ? 0.7 : 1,
  }

  const label = (s: string) => (
    <label className="text-xs font-medium block mb-1" style={{ color: 'var(--muted)' }}>{s}</label>
  )

  return (
    <div className="px-4 py-4" style={{ borderTop: '1px solid var(--border)' }}>
      {/* tabs */}
      <div className="flex gap-1 p-1 rounded-lg mb-4" style={{ background: 'var(--surface-muted)' }}>
        <button style={tabStyle('topup')}   onClick={() => setTab('topup')}>Top up</button>
        <button style={tabStyle('request')} onClick={() => setTab('request')}>Request</button>
      </div>

      <div className="space-y-3">
        {/* amount */}
        <div>
          {label('Amount (USDC)')}
          <input
            style={inputStyle} type="number" min="0" step="0.01"
            placeholder="0.00"
            value={amount} onChange={e => setAmount(e.target.value)}
          />
          {connectedAddr && (
            <p className="text-xs mt-1" style={{ color: 'var(--subtle)' }}>
              Balance: ${fmtUsdc(balance)} USDC
            </p>
          )}
        </div>

        {tab === 'request' && (
          <>
            <div>
              {label('Payee address')}
              <input style={inputStyle} placeholder="0x…" value={toAddr} onChange={e => setToAddr(e.target.value)} />
            </div>
            <div>
              {label('Memo')}
              <input style={inputStyle} placeholder="Invoice #001 — design work" value={memo} onChange={e => setMemo(e.target.value)} />
            </div>
            <div>
              {label('Unlock at (optional)')}
              <input style={inputStyle} type="datetime-local" value={unlock} onChange={e => setUnlock(e.target.value)} />
            </div>
          </>
        )}

        <button
          style={btnStyle}
          disabled={isBusy}
          onClick={tab === 'topup' ? handleDeposit : handleRequest}
        >
          {isBusy
            ? (dep_p || req_p ? 'Confirm in wallet…' : 'Confirming…')
            : needsApproval && tab === 'topup'
            ? 'Approve USDC first'
            : tab === 'topup' ? 'Top up' : 'Request payout'}
        </button>
      </div>
    </div>
  )
}
