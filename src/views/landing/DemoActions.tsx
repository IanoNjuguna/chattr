interface Props {
  step: 0 | 1 | 2
  amount: string
  onApprove: () => void
  onPay: () => void
  onReplay: () => void
}

/**
 * The landing demo's control strip. It mirrors the real flow: approve, then pay.
 * Nothing here touches a wallet, which is why the caption says it is a sample.
 */
export function DemoActions({ step, amount, onApprove, onPay, onReplay }: Props) {
  const pill = {
    padding: '6px 14px',
    borderRadius: 999,
    fontSize: 11.5,
    fontWeight: 600,
    border: 'none',
  } as const

  return (
    <div
      className="px-7 py-3 flex items-center justify-between gap-3"
      style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)' }}
    >
      <div className="min-w-0">
        <div className="text-[11px] font-medium truncate" style={{ color: 'var(--ink)' }}>
          API credits · ${amount}
        </div>
        <div className="text-[10.5px]" style={{ color: step === 1 ? 'var(--success)' : step === 2 ? 'var(--success)' : 'var(--waiting)' }}>
          {step === 0 ? '1 of 2 approved' : step === 1 ? '2 of 2 approved' : 'Paid · delivered'}
        </div>
      </div>

      {step === 0 && (
        <button onClick={onApprove} style={{ ...pill, background: 'var(--ink)', color: 'var(--bg)' }}>
          Approve
        </button>
      )}
      {step === 1 && (
        <button onClick={onPay} style={{ ...pill, background: 'var(--ink)', color: 'var(--bg)' }}>
          Pay
        </button>
      )}
      {step === 2 && (
        <button onClick={onReplay} style={{ ...pill, background: 'transparent', color: 'var(--subtle)', border: '1px solid var(--border)' }}>
          Replay
        </button>
      )}
    </div>
  )
}
