/** Single deterministic avatar for an address. Under 80 lines. */

const COLORS = [
  '#2563EB','#7C3AED','#DB2777','#DC2626','#D97706',
  '#059669','#0891B2','#4F46E5','#C026D3','#65A30D',
]

function colorFor(addr: string): string {
  let h = 0
  for (let i = 0; i < addr.length; i++) h = (h * 31 + addr.charCodeAt(i)) >>> 0
  return COLORS[h % COLORS.length]
}

function initials(addr: string): string {
  return addr.slice(2, 4).toUpperCase()
}

interface Props {
  address: string
  size?: number
  title?: string
}

export function Avatar({ address, size = 32, title }: Props) {
  const bg   = colorFor(address)
  const text = initials(address)
  const fs   = Math.round(size * 0.38)

  return (
    <span
      title={title ?? address}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        justifyContent: 'center',
        width:           size,
        height:          size,
        borderRadius:   '50%',
        background:      bg,
        color:          '#fff',
        fontSize:        fs,
        fontFamily:     "'DM Sans', sans-serif",
        fontWeight:      700,
        flexShrink:      0,
        userSelect:     'none',
      }}
    >
      {text}
    </span>
  )
}
