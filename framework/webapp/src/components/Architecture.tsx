import type { Threat, Result } from '../engine/types'
import { segChunks } from '../engine/algorithm'
import { BANDS, ASSETS, TBS, TB_DIRECT, BEAMS, STARS, EARTH, FRAME, ALT_LINES, SUBSYS, DECOR_SATS, SEG_VAR, type AssetDef, type IconKind } from '../engine/architecture'

/* ------------------------------------------------------------------ *
 * Figurative glyphs — each drawn centred at (0,0). Stroke uses
 * `currentColor`, set by the wrapping <g.asset> to the segment accent,
 * so the whole node brightens/glows via CSS on `.asset.hit`.
 * ------------------------------------------------------------------ */
const DARK = '#0e1d34'

function Glyph({ kind }: { kind: IconKind }) {
  switch (kind) {
    case 'sat': // Service satellite (gNB) — body + wings + antenna + a downlink coverage cone
      return (
        <g className="fig">
          <line x1="-32" y1="0" x2="32" y2="0" strokeWidth="1.4" />
          <rect x="-30" y="-11" width="15" height="22" fill={DARK} strokeWidth="1.2" />
          <rect x="15" y="-11" width="15" height="22" fill={DARK} strokeWidth="1.2" />
          <line x1="-26" y1="-11" x2="-26" y2="11" strokeWidth=".7" opacity=".6" />
          <line x1="-21" y1="-11" x2="-21" y2="11" strokeWidth=".7" opacity=".6" />
          <line x1="20" y1="-11" x2="20" y2="11" strokeWidth=".7" opacity=".6" />
          <line x1="25" y1="-11" x2="25" y2="11" strokeWidth=".7" opacity=".6" />
          <rect x="-11" y="-9" width="22" height="18" rx="3" fill={DARK} strokeWidth="1.6" />
          <path d="M-4,-9 L0,-17 L4,-9" fill="none" strokeWidth="1.4" />
          <circle cx="0" cy="-18" r="1.6" className="acfill" />
          <rect x="-4" y="-3" width="8" height="6" rx="1" className="acfill" opacity=".85" />
        </g>
      )
    case 'satfeeder': // Feeder satellite — body + wings + a prominent relay dish
      return (
        <g className="fig">
          <line x1="-32" y1="0" x2="32" y2="0" strokeWidth="1.4" />
          <rect x="-30" y="-10" width="14" height="20" fill={DARK} strokeWidth="1.2" />
          <rect x="16" y="-10" width="14" height="20" fill={DARK} strokeWidth="1.2" />
          <line x1="-26" y1="-10" x2="-26" y2="10" strokeWidth=".7" opacity=".6" />
          <line x1="-21" y1="-10" x2="-21" y2="10" strokeWidth=".7" opacity=".6" />
          <line x1="21" y1="-10" x2="21" y2="10" strokeWidth=".7" opacity=".6" />
          <line x1="26" y1="-10" x2="26" y2="10" strokeWidth=".7" opacity=".6" />
          <rect x="-10" y="-8" width="20" height="16" rx="3" fill={DARK} strokeWidth="1.6" />
          <path d="M-9,-11 A11 11 0 0 1 9,-11 L5,-3 A6 6 0 0 0 -5,-3 Z" fill={DARK} strokeWidth="1.5" />
          <circle cx="0" cy="-8" r="1.4" className="acfill" />
        </g>
      )
    case 'haps': // stratospheric platform — flying-wing drone
      return (
        <g className="fig">
          <path d="M-40,0 Q0,-15 40,0 Q0,9 -40,0 Z" fill={DARK} strokeWidth="1.5" />
          <rect x="-27" y="-2" width="6" height="9" rx="1.5" fill={DARK} strokeWidth="1" />
          <rect x="-11" y="-2" width="6" height="9" rx="1.5" fill={DARK} strokeWidth="1" />
          <rect x="5" y="-2" width="6" height="9" rx="1.5" fill={DARK} strokeWidth="1" />
          <rect x="21" y="-2" width="6" height="9" rx="1.5" fill={DARK} strokeWidth="1" />
          <rect x="-5" y="-4" width="10" height="6" rx="1.5" className="acfill" opacity=".85" />
        </g>
      )
    case 'bus': // CDHS / COM — data-handling core with a comms antenna
      return (
        <g className="fig">
          <rect x="-13" y="-11" width="26" height="22" rx="3" fill={DARK} strokeWidth="1.5" />
          <rect x="-7" y="-5" width="14" height="10" rx="1.5" fill="none" strokeWidth="1" opacity=".75" />
          <circle cx="0" cy="0" r="2.4" className="acfill" />
          {[-8, 0, 8].map((x) => <line key={'l' + x} x1="-13" y1={x} x2="-17" y2={x} strokeWidth="1.1" />)}
          {[-8, 0, 8].map((x) => <line key={'r' + x} x1="13" y1={x} x2="17" y2={x} strokeWidth="1.1" />)}
          <line x1="0" y1="-11" x2="0" y2="-18" strokeWidth="1.2" />
          <path d="M-4,-20 q4,-3 8,0 M-6,-23 q6,-4 12,0" fill="none" strokeWidth="1" opacity=".8" />
        </g>
      )
    case 'payload': // PDHS / PLCOM — phased-array antenna emitting spot beams
      return (
        <g className="fig">
          <path d="M-15,-9 L15,-9 L11,3 L-11,3 Z" fill={DARK} strokeWidth="1.5" />
          {[-8, -3, 2, 7].map((x) => <line key={x} x1={x} y1="-9" x2={x} y2="3" strokeWidth=".7" opacity=".55" />)}
          <path d="M-9,4 L-14,17 M0,4 L0,18 M9,4 L14,17" strokeWidth="1.3" opacity=".85" />
          <path d="M-14,17 L0,18 L14,17" strokeWidth="1" className="acstroke" opacity=".7" />
        </g>
      )
    case 'eps': // EPS / AOCS — power cell + reaction-wheel (attitude)
      return (
        <g className="fig">
          <rect x="-15" y="-9" width="15" height="18" rx="2" fill={DARK} strokeWidth="1.5" />
          <line x1="-11" y1="-9" x2="-11" y2="9" strokeWidth=".7" opacity=".55" />
          <line x1="-4" y1="-9" x2="-4" y2="9" strokeWidth=".7" opacity=".55" />
          <path d="M-9,2 L-7,-2 L-5,2 L-3,-2" fill="none" strokeWidth="1.3" className="acstroke" />
          <circle cx="8" cy="0" r="8" fill={DARK} strokeWidth="1.5" />
          <line x1="8" y1="-8" x2="8" y2="8" strokeWidth="1" opacity=".7" />
          <line x1="0" y1="0" x2="16" y2="0" strokeWidth="1" opacity=".7" />
          <circle cx="8" cy="0" r="2" className="acfill" />
        </g>
      )
    case 'dish': // NTN Gateway — parabolic dish (scaled down to match the other ground icons)
      return (
        <g className="fig">
          <g transform="translate(0,4) scale(0.82)">
            <path d="M-22,-20 A26 26 0 0 1 22,-20 L14,-4 A16 16 0 0 0 -14,-4 Z" fill={DARK} strokeWidth="1.9" />
            <line x1="0" y1="-12" x2="7" y2="-28" strokeWidth="1.9" />
            <circle cx="8" cy="-30" r="2.2" className="acfill" />
            <line x1="0" y1="-4" x2="0" y2="18" strokeWidth="2.4" />
            <line x1="-11" y1="18" x2="11" y2="18" strokeWidth="2.4" />
          </g>
        </g>
      )
    case 'ttc': // TT&C — tracking antenna mast with command signal rings
      return (
        <g className="fig">
          <line x1="0" y1="18" x2="0" y2="-6" strokeWidth="2" />
          <line x1="-9" y1="18" x2="9" y2="18" strokeWidth="2" />
          <line x1="-6" y1="6" x2="6" y2="2" strokeWidth="1.4" />
          <circle cx="0" cy="-9" r="3.4" fill={DARK} strokeWidth="1.5" />
          <circle cx="0" cy="-9" r="1.3" className="acfill" />
          <path d="M6,-16 a10 10 0 0 1 0,14 M11,-20 a16 16 0 0 1 0,22" fill="none" strokeWidth="1.1" className="acstroke" opacity=".85" />
        </g>
      )
    case 'ops': // Satellite Control Centre — mission-ops monitor on a stand
      return (
        <g className="fig">
          <rect x="-19" y="-15" width="38" height="26" rx="2.5" fill={DARK} strokeWidth="1.6" />
          <path d="M-13,-2 L-8,-2 L-5,-8 L0,4 L4,-4 L7,-2 L13,-2" fill="none" strokeWidth="1.3" className="acstroke" />
          <line x1="0" y1="11" x2="0" y2="16" strokeWidth="1.6" />
          <line x1="-10" y1="17" x2="10" y2="17" strokeWidth="2" />
        </g>
      )
    case 'rack': // 5G / 6G Core — server rack
      return (
        <g className="fig">
          <rect x="-17" y="-18" width="34" height="38" rx="2" fill={DARK} strokeWidth="1.5" />
          {[-13, -5, 3, 11].map((y) => (
            <g key={y}>
              <rect x="-12" y={y} width="24" height="5" rx="1" fill="#0a1a2c" strokeWidth=".8" />
              <circle cx="8" cy={y + 2.5} r="1" className="acfill" />
            </g>
          ))}
        </g>
      )
    case 'factory': // Production / Assembly — supply-chain factory
      return (
        <g className="fig">
          <path d="M-20,18 L-20,-2 L-8,6 L-8,-2 L4,6 L4,-2 L16,6 L16,18 Z" fill={DARK} strokeWidth="1.5" />
          <rect x="10" y="-14" width="5" height="12" fill={DARK} strokeWidth="1.2" />
          <rect x="-14" y="8" width="6" height="6" fill="#0a1a2c" strokeWidth=".8" />
          <rect x="-2" y="8" width="6" height="6" fill="#0a1a2c" strokeWidth=".8" />
        </g>
      )
    case 'person': // Handheld UE — person with phone
      return (
        <g className="fig">
          <circle cx="-7" cy="-13" r="6" strokeWidth="1.8" fill="none" />
          <path d="M-17,17 Q-17,-3 -7,-3 Q3,-3 3,11 L3,17" strokeWidth="1.8" fill="none" />
          <rect x="7" y="-8" width="12" height="22" rx="2.5" fill={DARK} strokeWidth="1.6" />
          <rect x="9.5" y="-5" width="7" height="13" rx="1" className="acfill" opacity=".8" />
          <path d="M19,-4 q7,-3 7,-10 M19,2 q12,-4 12,-16" fill="none" strokeWidth="1.2" className="acstroke" opacity=".7" />
        </g>
      )
    case 'vsat': // VSAT — small terminal dish
      return (
        <g className="fig">
          <path d="M-15,-12 A17 17 0 0 1 15,-12 L9,0 A11 11 0 0 0 -9,0 Z" fill={DARK} strokeWidth="1.5" />
          <line x1="0" y1="-2" x2="0" y2="14" strokeWidth="1.8" />
          <line x1="-9" y1="14" x2="9" y2="14" strokeWidth="1.8" />
        </g>
      )
    case 'iot': // IoT — sensor node radiating
      return (
        <g className="fig">
          <rect x="-9" y="-9" width="18" height="18" rx="3" fill={DARK} strokeWidth="1.6" />
          <circle cx="0" cy="0" r="3" className="acfill" opacity=".85" />
          <path d="M11,-7 q6,7 0,15 M15,-11 q10,10 0,23" fill="none" strokeWidth="1.1" className="acstroke" opacity=".7" />
        </g>
      )
  }
}

function AssetNode({ a, hit }: { a: AssetDef; hit: boolean }) {
  const twoLine = a.lines.length > 1
  const style = { color: SEG_VAR[a.seg] } as React.CSSProperties
  if (a.inset) {
    // compact node inside the callout; the ring hugs the glyph so labels stay clear below it
    return (
      <g className={'asset inset' + (hit ? ' hit' : '')} data-seg={a.seg} style={style} transform={`translate(${a.cx},${a.cy})`}>
        <rect className="activebox" x="-23" y="-30" width="46" height="44" rx="9" />
        <g transform="translate(0,-5) scale(0.85)"><Glyph kind={a.icon} /></g>
        <text className="alabel" x="0" y="24" textAnchor="middle">{a.lines[0]}</text>
        {twoLine && <text className="alabel sub" x="0" y="35" textAnchor="middle">{a.lines[1]}</text>}
      </g>
    )
  }
  const sc = a.sc ?? 1
  const hw = (a.rw ?? 34) * sc // ring half-width — hugs the glyph (per-asset override for wide/narrow icons)
  const boxTop = (a.rt ?? (a.flat ? -17 : -34)) * sc // flat = short, wide glyph (e.g. HAPS) → shorter ring hugs it
  const boxH = (a.rh ?? (a.flat ? 28 : 58)) * sc
  const y1 = a.labelDy ?? boxTop + boxH + 14 // label baseline (tight for flat/HAPS; negative = above the icon)
  const lf = 11 * (sc > 1 ? 1.16 : 1)
  return (
    <g className={'asset' + (hit ? ' hit' : '')} data-seg={a.seg} style={style} transform={`translate(${a.cx},${a.cy})`}>
      <rect className="activebox" x={-hw} y={boxTop} width={2 * hw} height={boxH} rx={12 * sc} />
      <g transform={`scale(${sc})`}><Glyph kind={a.icon} /></g>
      {a.labelBg && (() => {
        const lw = Math.max(...a.lines.map((l) => l.length)) * lf * 0.6 + 14
        return <rect className="alabelbg" x={-lw / 2} y={y1 - 11} width={lw} height={twoLine ? 27 : 15} rx="5" />
      })()}
      {twoLine ? (
        <>
          <text className="alabel" x="0" y={y1} textAnchor="middle" style={{ fontSize: `${lf}px` }}>{a.lines[0]}</text>
          <text className="alabel sub" x="0" y={y1 + 12} textAnchor="middle" style={{ fontSize: `${lf * 0.82}px` }}>{a.lines[1]}</text>
        </>
      ) : (
        <text className="alabel" x="0" y={y1} textAnchor="middle" style={{ fontSize: `${lf}px` }}>{a.lines[0]}</text>
      )}
    </g>
  )
}

export function Architecture({ threat, result }: { threat: Threat | null; result: Result | null }) {
  const segs = result?.segs ?? []
  const chunks = threat ? segChunks(threat.A) : {}
  const isActive = (key: string) => segs.includes(key)
  const isHit = (a: AssetDef) => {
    if (!segs.includes(a.seg)) return false
    const chunk = (chunks as Record<string, string>)[a.seg] || ''
    return chunk.includes('all assets') || a.kw.some((k) => k && chunk.includes(k))
  }
  const tbActive = (t: typeof TBS[number]) => isActive(t.a) && isActive(t.b)
  const directActive = isActive('User') && isActive('Space')
  // a link lights up only when the selected threat actually hits one of its endpoint assets,
  // so e.g. a VSAT-specific threat highlights the VSAT service link alone (not every user link)
  const assetByKw = (kw: string) => ASSETS.find((a) => a.kw.includes(kw))
  const hitKw = (kw: string) => { const a = assetByKw(kw); return a ? isHit(a) : false }
  // a boundary-crossing beam (`crosses`) lights only when BOTH segments it spans are affected — so it
  // reaches into space exactly when the threat does, matching its trust boundary. A within-segment stub
  // (`endpoints`) lights when its own terminal asset is hit.
  const beamActive = (bm: typeof BEAMS[number]) => {
    if (bm.crosses) return bm.crosses.every(isActive)
    const hit = (bm.endpoints ?? []).some(hitKw)
    return bm.gate ? hit && isActive(bm.gate) : hit
  }
  // chip state: the NR-Uu / NB-IoT-NTN chips share one merged service link, so the one matching the
  // selected terminal stays lit while the other dims to grey. Gated on Space so the chip only reacts
  // when the service link actually crosses into space (matching the lines).
  const nrHit = (hitKw('ue') || hitKw('vsat')) && isActive('Space')
  const iotHit = hitKw('iot') && isActive('Space')
  const chipState = (bm: typeof BEAMS[number]) => {
    if (bm.id === 'beam-service') return nrHit ? 'on' : iotHit ? 'dim' : ''
    if (bm.id === 'beam-service-iot') return iotHit ? 'on' : nrHit ? 'dim' : ''
    return beamActive(bm) ? 'on' : ''
  }

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
        ) : 'Select a threat to trace its affected segments across the User → Ground → Space path.'}
      </div>

      <div className="archbox">
        <svg className="arch" viewBox="0 0 960 680" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="sky" cx="0.5" cy="0.1" r="1.05">
              <stop offset="0" stopColor="#0e1b31" />
              <stop offset="0.55" stopColor="#070d1a" />
              <stop offset="1" stopColor="#04070e" />
            </radialGradient>
            <linearGradient id="earthfill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0c1a30" />
              <stop offset="1" stopColor="#05090f" />
            </linearGradient>
            <radialGradient id="atmo" cx="0.5" cy="1" r="0.55">
              <stop offset="0" stopColor="#2fd9e6" stopOpacity="0" />
              <stop offset="0.85" stopColor="#2fd9e6" stopOpacity="0.10" />
              <stop offset="0.97" stopColor="#54ffe0" stopOpacity="0.34" />
              <stop offset="1" stopColor="#54ffe0" stopOpacity="0" />
            </radialGradient>
            <clipPath id="frameclip">
              <rect x={FRAME.x} y={FRAME.y} width={FRAME.w} height={FRAME.h} rx="18" />
            </clipPath>
          </defs>

          {/* backdrop, clipped to the console frame */}
          <g clipPath="url(#frameclip)">
            <rect x={FRAME.x} y={FRAME.y} width={FRAME.w} height={FRAME.h} fill="url(#sky)" />
            <g className="stars">
              {STARS.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.r} opacity={s.o} />)}
            </g>
            <circle className="earthlimb" cx={EARTH.cx} cy={EARTH.cy} r={EARTH.r} fill="url(#earthfill)" />
            <rect x={FRAME.x} y="572" width={FRAME.w} height="98" fill="url(#atmo)" />
          </g>
          <rect className="frame" x={FRAME.x} y={FRAME.y} width={FRAME.w} height={FRAME.h} rx="18" />

          {/* altitude tags (LEO / STRATO) — distinct, accent-coloured */}
          {ALT_LINES.map((a) => (
            <g key={a.label} className="alt">
              <line x1="36" y1={a.y} x2="54" y2={a.y} style={{ stroke: a.accent }} />
              <text x="60" y={a.y + 4} style={{ fill: a.accent }}>{a.label}</text>
            </g>
          ))}

          {/* segment zones — kept as seg-band rects (glow when the segment is implicated); title top-centre */}
          {BANDS.map((b) => (
            <g key={b.id}>
              <rect id={b.id} className={'seg-band' + (isActive(b.key) ? ' active' : '')} x={b.x} y={b.y} width={b.w} height={b.h} rx="14" />
              <text className="seglab" x={b.x + b.w / 2} y={b.h <= 30 ? b.y + b.h / 2 : b.y + 20} textAnchor="middle" dominantBaseline={b.h <= 30 ? 'central' : 'auto'}>{b.label}</text>
            </g>
          ))}

          {/* trust boundaries — Ground↔Space (top of Ground box), User↔Ground (vertical divider),
              and User↔Space direct (top of User box) form a T-junction */}
          {(() => {
            const all = [...TBS.map((t) => ({ t, act: tbActive(t) })), { t: TB_DIRECT as typeof TBS[number], act: directActive }]
            const pillW = (t: typeof TBS[number]) => t.label.length * 6.4 + 38
            // x-range each pill occupies (+margin) so we can cut the boundary lines around every pill
            const cuts = all.map(({ t }) => [t.lx - pillW(t) / 2 - 4, t.lx + pillW(t) / 2 + 4] as [number, number])
            const segs = (x1: number, x2: number) => {
              const hit = cuts.filter(([a, b]) => b > x1 && a < x2).sort((p, q) => p[0] - q[0])
              const out: [number, number][] = []; let cur = x1
              for (const [a, b] of hit) { if (a > cur) out.push([cur, a]); cur = Math.max(cur, b) }
              if (cur < x2) out.push([cur, x2])
              return out
            }
            return all.map(({ t, act }) => {
              const w = pillW(t); const x0 = t.lx - w / 2
              const cls = 'tb' + (act ? ' active' : '')
              return (
                <g key={t.id}>
                  {t.y1 === t.y2
                    ? segs(t.x1, t.x2).map(([a, b], i) => <line key={i} id={i === 0 ? t.id : undefined} className={cls} x1={a} y1={t.y1} x2={b} y2={t.y1} />)
                    : <line id={t.id} className={cls} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />}
                  <rect className={'tbpill' + (act ? ' active' : '')} x={x0} y={t.ly - 11} width={w} height="22" rx="11" />
                  <path className={'tbshield' + (act ? ' active' : '')} transform={`translate(${x0 + 15},${t.ly})`}
                    d="M0,-6.5 L5.5,-4.3 L5.5,1 C5.5,4.6 0,7.4 0,7.4 C0,7.4 -5.5,4.6 -5.5,1 L-5.5,-4.3 Z" />
                  <text id={(t as { labId?: string }).labId} className={'tblab' + (act ? ' active' : '')} x={x0 + 26} y={t.ly + 4} textAnchor="start">{t.label}</text>
                </g>
              )
            })
          })()}

          {/* animated signal-flow beams — straight, or a right-angle path (telecommand → BUS) */}
          {BEAMS.map((bm) => (
            <g key={bm.id} className={'beam beam-' + bm.kind + (beamActive(bm) ? ' active' : '')}>
              {bm.path ? (<>
                <path className="base" fill="none" d={bm.path} />
                <path className="flow" fill="none" d={bm.path} />
              </>) : (<>
                <line className="base" x1={bm.x1} y1={bm.y1} x2={bm.x2} y2={bm.y2} />
                <line className="flow" x1={bm.x1} y1={bm.y1} x2={bm.x2} y2={bm.y2} />
              </>)}
              {bm.label && (() => {
                const cw = bm.label.length * 7 + 18
                return (
                  <g className={'beamchip ' + chipState(bm)}>
                    <rect className="beamchipbg" x={bm.lx - cw / 2} y={bm.ly - 11} width={cw} height="22" rx="6" />
                    <text className="beamlab" x={bm.lx} y={bm.ly + 4} textAnchor="middle">{bm.label}</text>
                  </g>
                )
              })()}
            </g>
          ))}

          {/* ambient (non-modelled) satellites strung along the ISL — scene decoration only */}
          {DECOR_SATS.map((d, i) => (
            <g key={i} className="decorsat" transform={`translate(${d.cx},${d.cy}) scale(0.62)`}>
              <rect className="decorbg" x="-34" y="-14" width="68" height="28" rx="5" />
              <line x1="-30" y1="0" x2="30" y2="0" strokeWidth="1.6" />
              <rect x="-30" y="-9" width="13" height="18" />
              <rect x="17" y="-9" width="13" height="18" />
              <rect x="-9" y="-7" width="18" height="14" rx="2" />
            </g>
          ))}

          {/* exploded on-board-subsystems callout — every satellite carries these, so a faint
              leader fans in from each satellite (incl. the ambient ISL ones) to the callout */}
          <g className="subsys">
            {[...SUBSYS.leadsPrimary, ...SUBSYS.leadsIsl].map((s, i) => (
              <line key={'l' + i} className="subsys-leader" x1={s.x} y1={s.y} x2={SUBSYS.leadTo.x} y2={SUBSYS.leadTo.y} />
            ))}
            {[...SUBSYS.leadsPrimary, ...SUBSYS.leadsIsl].map((s, i) => (
              <circle key={'d' + i} className="subsys-dot" cx={s.x} cy={s.y} r="2.4" />
            ))}
            <rect className="subsys-panel" x={SUBSYS.x} y={SUBSYS.y} width={SUBSYS.w} height={SUBSYS.h} rx="10" />
            <text className="subsys-title" x={SUBSYS.x + SUBSYS.w / 2} y={SUBSYS.y + 17} textAnchor="middle">{SUBSYS.title}</text>
          </g>

          {/* figurative asset nodes (inset subsystems render on top of the callout) */}
          {ASSETS.map((a, i) => <AssetNode key={i} a={a} hit={isHit(a)} />)}
        </svg>
      </div>

      <div className="mlegend">
        <span><span className="msw" style={{ background: 'var(--su)' }}></span>User</span>
        <span><span className="msw" style={{ background: 'var(--sg)' }}></span>Ground / Core</span>
        <span><span className="msw" style={{ background: 'var(--ss)' }}></span>Space</span>
        <span><span className="msw" style={{ background: 'var(--sh)' }}></span>Human Resources</span>
        <span className="mdiv" aria-hidden="true"></span>
        <span><span className="msline"></span>Physical link</span>
        <span><span className="msw" style={{ background: 'var(--danger)' }}></span>Trust boundary crossed</span>
      </div>
    </div>
  )
}
