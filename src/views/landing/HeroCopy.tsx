import { ConnectKitButton } from 'connectkit'
import { BrandMark } from '../../components/BrandMark'
import { go } from '../../lib/routing'

/**
 * One screen. The headline is two words, the rest is one line of plain
 * language. No fee, no chain, no test counts: a person deciding whether this
 * is for them does not need any of that, and every one of those words costs
 * a reader.
 */
export function HeroCopy() {
  return (
    <div className="flex flex-col justify-center h-full">
      <div className="flex items-center gap-2" style={{ color: 'var(--ink)' }}>
        <BrandMark size={22} withDot />
        <span className="display text-[15px] tracking-tight">chattr</span>
      </div>

      <h1
        className="display mt-8 text-[56px] leading-[0.98] lg:text-[76px]"
        style={{ color: 'var(--ink)' }}
      >
        Shared money.
      </h1>

      <p className="mt-5 text-[15px]" style={{ color: 'var(--ink-2)' }}>
        A pot your team can see, and nobody can empty alone.
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
          className="text-sm underline underline-offset-4"
          style={{ color: 'var(--muted)' }}
        >
          See one
        </button>
      </div>

      <p className="mt-10 max-w-[34ch] text-[13px] leading-relaxed" style={{ color: 'var(--subtle)' }}>
        You cannot drain it alone, and you cannot quietly spend it.
      </p>
    </div>
  )
}
