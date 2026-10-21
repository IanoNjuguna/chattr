import { fmtUsdcFine } from '../../lib/money'
import { Avatar } from '../../components/Avatar'

const MEMBERS = [
  '0xA100000000000000000000000000000000000001',
  '0xB200000000000000000000000000000000000002',
  '0xC300000000000000000000000000000000000003',
]

const ROWS = [
  { what: 'Paid designer', who: '0xD400000000000000000000000000000000000004', amt: 120_000_000n, state: 'Delivered', when: '2d' },
  { what: 'Requested · API credits', who: '0xD500000000000000000000000000000000000005', amt: 18_000_000n, state: '1 of 2', when: '3d' },
  { what: 'Split payout · 50/30/20', who: '0xB200000000000000000000000000000000000002', amt: 62_000_000n, state: 'Paid', when: '5d' },
  { what: 'Deposited · hackathon prize', who: '0xA100000000000000000000000000000000000001', amt: 400_000_000n, state: '', when: '6d' },
]

/** The real product, as an object on the page. Not a device frame, not a mockup. */
export function RoomPreview() {
  return (
    <div className="pt-2">
      <div
        className="w-full rounded-2xl overflow-hidden"
        style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
      >
        <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold" style={{ color: 'var(--ink)' }}>
              Hackathon team
            </span>
            <span
              className="mono text-[10px] uppercase tracking-[0.12em] rounded-full px-2 py-1"
              style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}
            >
              2 of 3
            </span>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <span className="amount text-[30px] leading-none" style={{ color: 'var(--ink)' }}>
              {fmtUsdcFine(262_000_000n)}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--subtle)' }}>
              USDC · 0.5% fee
            </span>
          </div>
          <div className="mt-3 flex -space-x-2">
            {MEMBERS.map(a => (
              <Avatar key={a} address={a} size={20} />
            ))}
          </div>
        </div>

        <ul>
          {ROWS.map(row => (
            <li
              key={row.what}
              className="px-5 py-3 flex items-center justify-between gap-3"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <div className="min-w-0">
                <div className="text-[12px] font-medium truncate" style={{ color: 'var(--ink)' }}>
                  {row.what}
                </div>
                <div className="mono text-[10px]" style={{ color: 'var(--subtle)' }}>
                  {row.who.slice(0, 6)}…{row.who.slice(-4)} · {row.when}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="amount text-[12px]" style={{ color: 'var(--ink)' }}>
                  ${fmtUsdcFine(row.amt)}
                </div>
                {row.state && (
                  <div
                    className="text-[10px]"
                    style={{ color: row.state === '1 of 2' ? 'var(--waiting)' : 'var(--success)' }}
                  >
                    {row.state}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>

        <div className="px-5 py-3 flex items-center justify-between">
          <span className="text-[11px]" style={{ color: 'var(--subtle)' }}>
            Receipts keep the outcome
          </span>
          <span className="mono text-[10px]" style={{ color: 'var(--subtle)' }}>
            explorer.arc.io
          </span>
        </div>
      </div>
    </div>
  )
}
