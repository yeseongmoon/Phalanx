// The PHALANX wordmark — the brand's signature is a Greek capital lambda (Λ, U+039B) in
// place of each Latin A: PHΛLΛNX. role="img" + aria-label keeps the real, searchable name
// "PHALANX" for screen readers and the accessibility tree; only the glyphs on screen change.
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className ? `wm ${className}` : 'wm'} role="img" aria-label="PHALANX">
      PH<span className="wm-l">Λ</span>L<span className="wm-l">Λ</span>NX
    </span>
  )
}
