import { HeroCopy } from './landing/HeroCopy'
import { RoomPreview } from './landing/RoomPreview'

/** One screen, two columns, no scroll. */
export function Landing() {
  return (
    <main className="min-h-dvh overflow-y-auto lg:h-dvh lg:overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div className="mx-auto max-w-6xl lg:h-full px-6 lg:px-10 py-10">
        <div className="grid h-full gap-10 lg:grid-cols-[1fr_1.02fr] lg:gap-14 items-center">
          <HeroCopy />
          <RoomPreview />
        </div>
      </div>
    </main>
  )
}
