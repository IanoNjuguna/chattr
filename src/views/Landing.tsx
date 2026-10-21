import { HeroCopy } from './landing/HeroCopy'
import { RoomPreview } from './landing/RoomPreview'

/** Landing. One screen, two columns, no scroll on a laptop. */
export function Landing() {
  return (
    <main className="min-h-dvh" style={{ background: 'var(--bg)' }}>
      <div className="mx-auto max-w-6xl px-6 lg:px-10 py-14 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.02fr_1fr] lg:gap-16 items-start">
          <HeroCopy />
          <RoomPreview />
        </div>

        <div
          className="mt-14 pt-5 flex flex-wrap items-center justify-between gap-3 text-[11px] uppercase tracking-[0.14em]"
          style={{ borderTop: '1px solid var(--border)', color: 'var(--subtle)' }}
        >
          <span>Built in Arc Studio · 24 contract tests</span>
          <span>USDC on Arc · no other token · no subscription</span>
        </div>
      </div>
    </main>
  )
}
