import { ConnectKitButton } from 'connectkit'
import { BrandMark, Wordmark } from '../../components/BrandMark'
import { go } from '../../lib/routing'

const OBJECTIONS = [
  'Not a multisig you have to babysit. Two approvals, then it pays.',
  'No other token to buy. USDC pays the gas on Arc.',
  'You cannot drain it alone, and you cannot quietly spend it.',
]

/** The left column: the whole pitch, one screen, no scroll. */
export function HeroCopy() {
  return (
    <div className="flex flex-col justify-center h-full">
      <div className="flex items-center gap-2.5" style={{ color: 'var(--ink)' }}>
        <BrandMark size={26} withDot />
        <Wordmark className="text-[17px]" />
      </div>

      <h1
        className="display mt-9 text-[40px] leading-[1.05] lg:text-[58px]"
        style={{ color: 'var(--ink)', textWrap: 'balance', maxWidth: '15ch' }}
      >
        Split the pot, without trusting one person with it.
      </h1>

      <p className="mt-5 max-w-lg text-[15px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
        A shared USDC room for your team. Everyone sees the balance. Nothing leaves
        without two approvals. Every payment keeps a receipt.
      </p>

      <div className="mt-8 flex items-center gap-5">
        <ConnectKitButton.Custom>
          {({ isConnected, show }) => (
            <button
              onClick={isConnected ? () => go('/new') : show}
              className="rounded-full px-6 py-3 text-sm font-semibold"
              style={{ background: 'var(--ink)', color: 'var(--bg)' }}
            >
              {isConnected ? 'Create a room' : 'Connect wallet'}
            </button>
          )}
        </ConnectKitButton.Custom>

        <button
          onClick={() => go('/r/0')}
          className="text-sm font-medium underline underline-offset-4"
          style={{ color: 'var(--ink-2)' }}
        >
          Open a live room
        </button>
      </div>

      <ul className="mt-10 space-y-2.5">
        {OBJECTIONS.map(line => (
          <li key={line} className="flex gap-2.5 text-[13px]" style={{ color: 'var(--muted)' }}>
            <span aria-hidden style={{ color: 'var(--success)' }}>✓</span>
            {line}
          </li>
        ))}
      </ul>

    </div>
  )
}
