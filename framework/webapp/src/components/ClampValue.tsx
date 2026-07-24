import { useLayoutEffect, useRef, useState } from 'react'

// A tuple value on the threat-record card, clamped to 3 lines. When the text is longer, a small
// "…" box appears to expand/collapse it in place — so a heavy record (Pre / CM / I on a fully
// mapped threat) still reads as a compact summary.
export function ClampValue({ children, lines = 3 }: { children: React.ReactNode; lines?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [over, setOver] = useState(false)   // text is taller than the clamp
  const [open, setOpen] = useState(false)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setOver(el.scrollHeight - el.clientHeight > 1)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [children, lines])

  return (
    <span className="v clampwrap">
      <span ref={ref} className={'clamp' + (open ? ' open' : '')} style={open ? undefined : { WebkitLineClamp: lines }}>
        {children}
      </span>
      {(over || open) && (
        <button className={'clampbtn' + (open ? ' open' : '')} title={open ? 'Show less' : 'Show more'}
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}>{open ? '⌃' : '…'}</button>
      )}
    </span>
  )
}
