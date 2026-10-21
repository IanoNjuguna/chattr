/**
 * chattr brand mark. A C open at three o'clock, optionally with the payment
 * leaving through the opening.
 *
 * The dot collides with the lower arm below ~24px, so small sizes use
 * withDot={false}. The tab icon does the same thing for the same reason.
 */
interface BrandMarkProps {
  size?: number
  withDot?: boolean
  className?: string
}

export function BrandMark({ size = 28, withDot = true, className }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {withDot ? (
        <>
          <path
            d="M47.5 22.5 A19 19 0 1 0 47.5 41.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={9}
            strokeLinecap="round"
          />
          <circle cx="56" cy="32" r="5.5" fill="currentColor" />
        </>
      ) : (
        <path
          d="M45 22 A20 20 0 1 0 45 42"
          fill="none"
          stroke="currentColor"
          strokeWidth={10}
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}

/** The name, set in the display face. No custom lettering. */
export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`display ${className}`} style={{ letterSpacing: '-0.02em' }}>
      chattr
    </span>
  )
}
