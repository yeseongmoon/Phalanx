import { useEffect, useRef, useState } from 'react'
import type { Threat, Result } from '../engine/types'
import { phasesFull } from '../engine/ui'
import { MappingDetail } from './MappingDetail'

// The Details tab — a LIST of mapped threats; each row expands in place to its full dossier
// (same pattern as the summary card). Reference threats render the structured MappingDetail;
// custom threats that carry only flat fields render a lighter flat view. Threats with no Pass-2
// content at all are omitted (they are Pass-1 only).

function hasMapping(t: Threat) {
  return !!(t.map || t.pre || t.ttp || t.cm || t.impact || t.conf)
}

function FlatDetail({ threat }: { threat: Threat }) {
  const row = (name: string, letter: string, val?: string) =>
    val ? (
      <section className="dfield">
        <div className="dfield-h"><span className="dfield-name">{name}</span><span className="dfield-let">{letter}</span></div>
        <div className="dfield-body"><p className="dtext">{val}</p></div>
      </section>
    ) : null
  const ev = (threat.evidence || '').split('\n').map((s) => s.trim()).filter(Boolean)
  return (
    <div className="ddoc-fields">
      {row('Precondition', 'Pre', threat.pre)}
      {row('Technique chain', 'TTP', threat.ttp)}
      {row('Countermeasures', 'CM', threat.cm)}
      {row('Impact', 'I', threat.impact)}
      {row('Confidence', 'Conf', threat.conf)}
      {ev.length > 0 && (
        <section className="dfield">
          <div className="dfield-h"><span className="dfield-name">Evidence</span><span className="dfield-let">Src</span></div>
          <div className="dfield-body"><ul className="dlist">{ev.map((e, i) => <li key={i}>{e}</li>)}</ul></div>
        </section>
      )}
    </div>
  )
}

/** A phase banner — the Details-page counterpart of the builder's PHASE 1 / PHASE 2 headers. */
function PhaseBar({ no, title, sub, kind }: { no: string; title: string; sub: string; kind: string }) {
  return (
    <div className={'dphase ' + kind}>
      <span className="dphase-no">{no}</span>
      <div className="dphase-tt">
        <div className="dphase-t">{title}</div>
        <div className="dphase-s">{sub}</div>
      </div>
    </div>
  )
}

/** The expanded body of a dossier — the two passes, without the row header (the list row is it). */
function DossierBody({ threat, result }: { threat: Threat; result: Result }) {
  // one line per element; a multi-part value (assets by segment, several boundaries) gets one
  // line per part rather than being crammed onto a single ";"-separated line
  const assets = (threat.A || '').split(';').map((s) => s.trim()).filter(Boolean)
  // full, un-abbreviated phase names on the roomy Details page — one per line, with its number
  const lifeLines = result.L.length ? result.L.map((p, i) => `${p} · ${phasesFull(result.L)[i]}`) : ['—']
  const rows: { k: string; lines: string[] }[] = [
    { k: 'Segments', lines: [result.segs.join(', ') || '—'] },
    { k: 'Affected assets', lines: assets.length ? assets : ['—'] },
    { k: 'Trust boundaries', lines: result.tb.length ? result.tb : ['—'] },
    { k: 'Lifecycle', lines: lifeLines },
    { k: 'CIA impact', lines: [threat.cia || '—'] },
  ]
  return (
    <div className="dossier-body">
      <PhaseBar no="1" kind="p1" title="ENISA record" sub="what & where · L · S · A · TB · E (derived)" />
      <div className="dossier-enisa">
        {rows.map((r) => (
          <div className="drow" key={r.k}>
            <div className="drow-k">{r.k}</div>
            <div className="drow-v">{r.lines.map((l, i) => <div className="drow-line" key={i}>{l}</div>)}</div>
          </div>
        ))}
      </div>
      <PhaseBar no="2" kind="p2" title="SPARTA mapping" sub="how · Pre · TTP · CM · I · Conf (analyst-authored)" />
      {threat.map ? <MappingDetail map={threat.map} /> : <FlatDetail threat={threat} />}
    </div>
  )
}

/** One collapsible list row: a summary header that expands to the full dossier in place. */
function DossierRow({ threat, result, open, onToggle }: {
  threat: Threat; result: Result; open: boolean; onToggle: () => void
}) {
  const steps = threat.map?.ttp?.length ?? 0
  const conf = threat.map?.conf?.grade || threat.conf
  const gradeClass = conf === 'High' ? 'g-high' : conf === 'Low' ? 'g-low' : conf ? 'g-med' : ''
  return (
    <section className={'drrow' + (open ? ' open' : '')} id={'d-' + threat.id}>
      <button className="drrow-head" onClick={onToggle} aria-expanded={open}>
        <span className="drrow-id">{threat.id}</span>
        <span className="drrow-name">{threat.name}{threat.custom && <span className="dossier-tag">custom</span>}</span>
        <span className="drrow-meta">
          {steps > 0 && <span className="drrow-steps">{steps}-step chain</span>}
          {conf && <span className={'confbadge sm ' + gradeClass}>{conf}</span>}
          <span className="drrow-nat">{result.nature} · {threat.E}</span>
        </span>
        <span className="drrow-chev">▾</span>
      </button>
      {open && <DossierBody threat={threat} result={result} />}
    </section>
  )
}

export function Detail({ threats, results, focusId, onFocusConsumed }: {
  threats: Threat[]
  results: Map<string, Result>
  focusId?: string | null
  onFocusConsumed?: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const mapped = threats.filter(hasMapping)
  const [open, setOpen] = useState<string | null>(null)

  // when opened from a card's "Details →" button, expand that row, scroll to it, and flash it —
  // then clear the focus so the tab doesn't re-open it on the next visit
  useEffect(() => {
    if (!focusId) return
    setOpen(focusId)
    const raf = requestAnimationFrame(() => {
      const el = ref.current?.querySelector('#d-' + CSS.escape(focusId)) as HTMLElement | null
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        el.classList.add('flash')
        setTimeout(() => el.classList.remove('flash'), 1400)
      }
      onFocusConsumed?.()
    })
    return () => cancelAnimationFrame(raf)
  }, [focusId, onFocusConsumed])

  return (
    <div className="detailpage" ref={ref}>
      <div className="detaildoc">
        <header className="dhead">
          <div className="gkicker">Detailed Threat Model</div>
          <h1>Worked threat records — in depth</h1>
          <p className="glede">
            Every mapped threat with its full Pass-2 record — precondition, technique chain, countermeasures
            by stage, impact, confidence, and the primary-source evidence. Click a row to open it. Field names
            in full here; the tuple shorthand and the R1–R10 rules are defined in the <b>Method Guide</b>.
          </p>
          <div className="dcount">{mapped.length} of {threats.length} threats mapped</div>
        </header>
        {mapped.length === 0 ? (
          <div className="empty">No threats mapped yet. Map a threat (Pass 2) to see its full record here.</div>
        ) : (
          <div className="drlist">
            {mapped.map((t) => (
              <DossierRow key={t.id} threat={t} result={results.get(t.id)!}
                open={open === t.id} onToggle={() => setOpen((cur) => (cur === t.id ? null : t.id))} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
