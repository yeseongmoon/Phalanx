import type { Threat, Result } from '../engine/types'
import { segChunks } from '../engine/algorithm'
import { BANDS, ASSETS, TBS, SEG_VAR } from '../engine/architecture'

function SegIcon({ type, y, color }: { type: string; y: number; color: string }) {
  const stroke = { stroke: color } as const
  const dot = { fill: color, stroke: 'none' } as const
  return (
    <g className="segicon" style={stroke} transform={`translate(44,${y})`}>
      {type === 'hr' && (<>
        <circle cx="8" cy="4" r="3" strokeWidth="1.6" />
        <path d="M2.5,15.5 C2.5,10 13.5,10 13.5,15.5" strokeWidth="1.6" />
      </>)}
      {type === 'space' && (<>
        <rect x="5" y="5" width="7" height="7" rx="1.3" strokeWidth="1.6" />
        <rect x="-1" y="6.5" width="5" height="4" strokeWidth="1.4" />
        <rect x="13" y="6.5" width="5" height="4" strokeWidth="1.4" />
        <line x1="8.5" y1="5" x2="8.5" y2="1.8" strokeWidth="1.4" />
        <circle cx="8.5" cy="1.2" r="1.3" style={dot} />
      </>)}
      {type === 'ground' && (<>
        <circle cx="8" cy="2.6" r="1.3" style={dot} />
        <line x1="8" y1="3.6" x2="4" y2="15.5" strokeWidth="1.6" />
        <line x1="8" y1="3.6" x2="12" y2="15.5" strokeWidth="1.6" />
        <line x1="5.5" y1="11" x2="10.5" y2="11" strokeWidth="1.4" />
        <path d="M13,3 Q15.6,7.5 13,12" strokeWidth="1.2" />
        <path d="M3,3 Q0.4,7.5 3,12" strokeWidth="1.2" />
      </>)}
      {type === 'user' && (<>
        <rect x="4" y="1" width="8" height="14" rx="2" strokeWidth="1.6" />
        <line x1="6.5" y1="12" x2="9.5" y2="12" strokeWidth="1.4" />
      </>)}
    </g>
  )
}

export function Architecture({ threat, result }: { threat: Threat | null; result: Result | null }) {
  const segs = result?.segs ?? []
  const chunks = threat ? segChunks(threat.A) : {}
  const isActive = (key: string) => segs.includes(key)
  const isHit = (a: typeof ASSETS[number]) => {
    if (!segs.includes(a.seg)) return false
    const chunk = (chunks as Record<string, string>)[a.seg] || ''
    return chunk.includes('all assets') || a.kw.some((k) => k && chunk.includes(k))
  }
  const tbActive = (t: typeof TBS[number]) => isActive(t.a) && isActive(t.b)
  const directActive = isActive('User') && isActive('Space')

  return (
    <div className="archwrap">
      <div className="caption">
        {threat && result ? (
          <>
            <b>{threat.name}</b> · {threat.E} · affects <b>{'{' + segs.join(', ') + '}'}</b>
            {result.multiseg && (
              <> · <span className="cross">crosses {result.tb.length} trust boundar{result.tb.length > 1 ? 'ies' : 'y'} (R9)</span></>
            )}
          </>
        ) : 'Select a threat to trace its affected segments.'}
      </div>

      <div className="archbox">
        <svg className="arch" viewBox="-138 0 936 674" xmlns="http://www.w3.org/2000/svg">
          {BANDS.map((b) => (
            <g key={b.id}>
              <rect id={b.id} className={'seg-band' + (isActive(b.key) ? ' active' : '')} x={b.x} y={b.y} width={b.w} height={b.h} rx="13" />
              <SegIcon type={b.icon} y={b.iconY} color={SEG_VAR[b.key]} />
              <text className="seglab" x="70" y={b.labY}>{b.label}</text>
            </g>
          ))}

          {ASSETS.map((a, i) => {
            const cx = a.x + a.w / 2
            return (
              <g key={i} className={'asset' + (isHit(a) ? ' hit' : '')} data-seg={a.seg}>
                <rect x={a.x} y={a.y} width={a.w} height={a.h} rx="9" />
                {a.lines.length === 1 ? (
                  <text x={cx} y={a.y + a.h / 2 + 5} textAnchor="middle">{a.lines[0]}</text>
                ) : (<>
                  <text x={cx} y={a.y + 24} textAnchor="middle">{a.lines[0]}</text>
                  <text className="sub" x={cx} y={a.y + 41} textAnchor="middle">{a.lines[1]}</text>
                </>)}
              </g>
            )
          })}

          {TBS.map((t) => (
            <g key={t.id}>
              <line id={t.id} className={'tb' + (tbActive(t) ? ' active' : '')} x1="18" y1={t.y} x2="642" y2={t.y} />
              <rect className="tbpill" x={t.pillX} y={t.y - 12} width={t.pillW} height="24" rx="12" />
              <text id={t.labId} className={'tblab' + (tbActive(t) ? ' active' : '')} x="330" y={t.y + 4} textAnchor="middle">{t.label}</text>
            </g>
          ))}

          <g id="tb-User-Space" className={'tb-direct' + (directActive ? ' active' : '')}>
            <path d="M648,590 C 712,505 712,250 648,166" />
            <text x="752" y="356" textAnchor="middle">User ↔ Space</text>
            <text x="752" y="375" textAnchor="middle">direct link</text>
            <text x="752" y="394" textAnchor="middle" className="tbnote">bypasses Ground</text>
          </g>
        </svg>
      </div>

      <div className="mlegend">
        <span><span className="msw" style={{ background: 'var(--su)' }}></span>User</span>
        <span><span className="msw" style={{ background: 'var(--sg)' }}></span>Ground / Core</span>
        <span><span className="msw" style={{ background: 'var(--ss)' }}></span>Space</span>
        <span><span className="msw" style={{ background: 'var(--sh)' }}></span>Human Resources</span>
        <span><span className="msw" style={{ background: 'var(--danger)' }}></span>Trust boundary crossed</span>
      </div>
    </div>
  )
}
