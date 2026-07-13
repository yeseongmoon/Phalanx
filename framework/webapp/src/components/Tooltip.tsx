import { useEffect, useRef } from 'react'

/**
 * A single fixed-position tooltip for any element carrying a `data-tip` attribute.
 * Fixed positioning means it is never clipped by the card / scroll containers.
 * Mount once near the app root.
 */
export function TooltipLayer() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const tip = ref.current!
    const move = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest?.('[data-tip]') as HTMLElement | null
      if (!el) { tip.classList.remove('on'); return }
      tip.textContent = el.getAttribute('data-tip') || ''
      tip.classList.add('on')
      const r = tip.getBoundingClientRect()
      let x = e.clientX + 16
      let y = e.clientY + 18
      if (x + r.width > window.innerWidth - 8) x = e.clientX - r.width - 14
      if (y + r.height > window.innerHeight - 8) y = e.clientY - r.height - 14
      tip.style.left = Math.max(8, x) + 'px'
      tip.style.top = Math.max(8, y) + 'px'
    }
    const hide = () => tip.classList.remove('on')
    document.addEventListener('mousemove', move)
    window.addEventListener('scroll', hide, true)
    return () => {
      document.removeEventListener('mousemove', move)
      window.removeEventListener('scroll', hide, true)
    }
  }, [])
  return <div ref={ref} className="apptip" />
}
