import { useEffect, useMemo, useRef, useState } from 'react'
import sparta from '../data/sparta.json'
import enisa from '../data/enisa_controls.json'
import { STEP_KINDS, KIND_LABEL, type StepKind } from '../engine/types'

/** One authored step of the attack chain: which technique, what it does, and why. */
export type ChainStep = { id: string; kind: StepKind; note: string }

type Tech = { id: string; name: string; tactic: string }
type Control = { title: string; cluster: string; desc: string; frameworks: string[]; sparta: boolean; themes: string[] }
const TECHS = sparta.techniques as Tech[]
const CMS = sparta.countermeasures as { id: string; name: string }[]
const MAP = sparta.map as Record<string, string[]>
const CMNAME: Record<string, string> = Object.fromEntries(CMS.map((c) => [c.id, c.name]))
const TECHBY: Record<string, Tech> = Object.fromEntries(TECHS.map((t) => [t.id, t]))
const ECONTROLS = enisa.controls as Control[]
const BY_E = enisa.byE as Record<string, number[]>

/** TTP technique-chain picker + SPARTA-driven countermeasure suggestions.
 *  Techniques and CM↔technique mappings are bundled from the official SPARTA STIX
 *  dataset (see scripts/gen_sparta.py), so every suggestion is traceable to SPARTA. */
export function SpartaPicker({
  chain, setChain, cmSel, setCmSel, cmExtra, setCmExtra, e, enisaSel, setEnisaSel,
}: {
  chain: ChainStep[]; setChain: (v: ChainStep[]) => void
  cmSel: string[]; setCmSel: (v: string[]) => void
  cmExtra: string[]; setCmExtra: (v: string[]) => void
  e: string
  enisaSel: number[]; setEnisaSel: (v: number[]) => void
}) {
  const [q, setQ] = useState('')
  const [extra, setExtra] = useState('')
  const [active, setActive] = useState(0)   // highlighted option for keyboard nav
  const [eShow, setEShow] = useState(6)              // how many ENISA controls are revealed (rank order)
  const menuRef = useRef<HTMLDivElement>(null)
  const eFieldRef = useRef<HTMLDivElement>(null)

  const ids = useMemo(() => chain.map((c) => c.id), [chain])
  const matches = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return []
    return TECHS.filter((t) => !ids.includes(t.id) &&
      (t.id.toLowerCase().includes(s) || t.name.toLowerCase().includes(s))).slice(0, 40)
  }, [q, ids])

  useEffect(() => { setActive(0) }, [q])
  // keep the highlighted option scrolled into view
  useEffect(() => {
    const el = menuRef.current?.children[active] as HTMLElement | undefined
    el?.scrollIntoView({ block: 'nearest' })
  }, [active, matches.length])

  const onKey = (e: React.KeyboardEvent) => {
    if (!matches.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, matches.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (matches[active]) addTech(matches[active].id) }
    else if (e.key === 'Escape') { e.preventDefault(); setQ('') }
  }

  // union of SPARTA countermeasures mapped to the chosen techniques
  const suggestions = useMemo(() => {
    const set = new Set<string>()
    ids.forEach((id) => (MAP[id] || []).forEach((cm) => set.add(cm)))
    return [...set].sort()
  }, [ids])

  // SPARTA countermeasure themes (names) invoked by the chosen chain — the TTP↔ENISA bridge
  const chosenThemes = useMemo(() => {
    const set = new Set<string>()
    ids.forEach((id) => (MAP[id] || []).forEach((cm) => { const n = CMNAME[cm]; if (n) set.add(n.toLowerCase()) }))
    return set
  }, [ids])
  const eMatch = (c: Control) => c.themes.some((t) => chosenThemes.has(t))

  // ENISA controls for this threat's category, ranked: TTP-relevant first, then SPARTA-backed
  const eControls = useMemo(() => {
    const idxs = BY_E[e] || []
    return [...idxs].sort((a, b) => {
      const ca = ECONTROLS[a], cb = ECONTROLS[b]
      const ma = ca.themes.some((t) => chosenThemes.has(t)) ? 1 : 0
      const mb = cb.themes.some((t) => chosenThemes.has(t)) ? 1 : 0
      if (ma !== mb) return mb - ma
      if (ca.sparta !== cb.sparta) return ca.sparta ? -1 : 1
      return a - b
    })
  }, [e, chosenThemes])
  const shownE = eControls.slice(0, eShow)
  // collapsing can leave the scroller past the new (shorter) bottom → snap the section back into view
  const showLess = () => { setEShow(6); requestAnimationFrame(() => eFieldRef.current?.scrollIntoView({ block: 'nearest' })) }
  const toggleE = (i: number) => setEnisaSel(enisaSel.includes(i) ? enisaSel.filter((x) => x !== i) : [...enisaSel, i])

  // a new step defaults its kind from where it lands: first = entry, Impact tactic = effect
  const addTech = (id: string) => {
    if (!ids.includes(id)) {
      const kind: StepKind = chain.length === 0 ? 'entry' : TECHBY[id]?.tactic === 'Impact' ? 'effect' : 'step'
      setChain([...chain, { id, kind, note: '' }])
    }
    setQ('')
  }
  const rmTech = (id: string) => setChain(chain.filter((x) => x.id !== id))
  const setStep = (id: string, patch: Partial<ChainStep>) =>
    setChain(chain.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  const toggleCm = (id: string) => setCmSel(cmSel.includes(id) ? cmSel.filter((x) => x !== id) : [...cmSel, id])
  const addAll = () => setCmSel([...new Set([...cmSel, ...suggestions])])
  const clearAll = () => setCmSel(cmSel.filter((id) => !suggestions.includes(id)))
  const addExtra = () => {
    const v = extra.trim()
    if (v && !cmExtra.includes(v)) setCmExtra([...cmExtra, v])
    setExtra('')
  }

  return (
    <>
      <div className="field">
        <label>TTP — SPARTA technique chain</label>
        <div className="hint chain-guide">Add <b>one technique per attack step</b> — each one you add becomes a link in the chain, in attacker order (Initial&nbsp;Access&nbsp;→&nbsp;Execution&nbsp;→&nbsp;…&nbsp;→&nbsp;Impact). Search and click to add.</div>
        <div className="tpick">
          <input className="tpick-in" value={q} placeholder="Search SPARTA techniques (ID or name)…"
            role="combobox" aria-expanded={matches.length > 0} aria-autocomplete="list"
            onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} />
          {matches.length > 0 && (
            <div className="tpick-menu" ref={menuRef} role="listbox">
              {matches.map((t, i) => (
                <div key={t.id} role="option" aria-selected={i === active}
                  className={'tpick-opt' + (i === active ? ' active' : '')}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => { e.preventDefault(); addTech(t.id) }}>
                  <span className="tpick-id">{t.id}</span>
                  <span className="tpick-nm">{t.name}</span>
                  <span className="tpick-tac">{t.tactic}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        {chain.length > 0 ? (
          <>
            <div className="chain">
              {chain.map((s, i) => (
                <span key={s.id} className="chain-wrap">
                  {i > 0 && <span className="chain-arrow">→</span>}
                  <span className={'chain-chip' + (s.kind === 'bridge' ? ' bridge' : '')} title={TECHBY[s.id]?.name}>
                    <span className="chain-step">{i + 1}</span>
                    <span className="chain-tac">{TECHBY[s.id]?.tactic}</span>
                    {s.id}<span className="x" onClick={() => rmTech(s.id)}>×</span>
                  </span>
                </span>
              ))}
            </div>
            {/* per-step: what this step does in the chain, and why */}
            <div className="stepedit">
              {chain.map((s, i) => (
                <div className={'stepedit-row' + (s.kind === 'bridge' ? ' bridge' : '')} key={s.id}>
                  <span className="stepedit-no">{i + 1}</span>
                  <div className="stepedit-b">
                    <div className="stepedit-h">
                      <b className="stepedit-id">{s.id}</b>
                      <span className="stepedit-nm">{TECHBY[s.id]?.name}</span>
                      <select className="stepedit-kind" value={s.kind}
                        onChange={(ev) => setStep(s.id, { kind: ev.target.value as StepKind })}>
                        {STEP_KINDS.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
                      </select>
                    </div>
                    <input className="stepedit-note" value={s.note}
                      placeholder="How does this step happen? e.g. the compromised ground system issues valid telecommands over the TC link…"
                      onChange={(ev) => setStep(s.id, { note: ev.target.value })} />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="chain-empty">Your attack chain will build here — add techniques above.</div>
        )}
        <div className="hint">{TECHS.length} techniques from SPARTA {sparta.meta.file.includes('v') ? sparta.meta.file.match(/v[\d.]+/)?.[0] : ''}.</div>
      </div>

      <div className="field">
        <label>CM — countermeasure(s) <span className="opt">(auto-suggested by SPARTA)</span></label>
        {suggestions.length > 0 ? (
          <>
            <div className="cmsug-h">
              SPARTA maps {suggestions.length} countermeasure{suggestions.length > 1 ? 's' : ''} to your chain
              {suggestions.every((id) => cmSel.includes(id))
                ? <button type="button" className="cmsug-all clear" onClick={clearAll}>− clear all</button>
                : <button type="button" className="cmsug-all" onClick={addAll}>+ add all</button>}
            </div>
            <div className="improw">
              {suggestions.map((id) => (
                <button key={id} type="button" className={'achip' + (cmSel.includes(id) ? ' on' : '')}
                  onClick={() => toggleCm(id)} title={CMNAME[id]} aria-pressed={cmSel.includes(id)}>
                  {id} · {CMNAME[id]}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="hint">Add techniques above to see the countermeasures SPARTA maps to them.</div>
        )}
        {cmExtra.length > 0 && (
          <div className="improw" style={{ marginTop: 8 }}>
            {cmExtra.map((c) => (
              <button key={c} type="button" className="achip on custom" onClick={() => setCmExtra(cmExtra.filter((x) => x !== c))} title="Remove">{c} ×</button>
            ))}
          </div>
        )}
        <input className="achip-input" style={{ marginTop: 8, width: '100%' }} placeholder="+ other control (free text)…"
          value={extra} onChange={(ev) => setExtra(ev.target.value)}
          onKeyDown={(ev) => { if (ev.key === 'Enter') { ev.preventDefault(); addExtra() } }}
          onBlur={addExtra} />
      </div>

      <div className="field" ref={eFieldRef}>
        <label>ENISA controls {e && <span className="opt">— category {e} · {eControls.length} mapped, ranked</span>}</label>
        {eControls.length === 0 ? (
          <div className="hint">No ENISA controls mapped to this category.</div>
        ) : (
          <>
            <div className="ectrls">
              {shownE.map((i) => {
                const c = ECONTROLS[i]
                const on = enisaSel.includes(i)
                const match = eMatch(c)
                return (
                  <button type="button" key={i} className={'ectrl' + (on ? ' on' : '') + (match ? ' match' : '')}
                    onClick={() => toggleE(i)} title={c.desc} aria-pressed={on}>
                    <span className="ectrl-tick">{on ? '✓' : '+'}</span>
                    <span className="ectrl-main">
                      <span className="ectrl-t">{c.title}</span>
                      <span className="ectrl-fw">{c.frameworks.map((f) => <em key={f} className={f === 'SPARTA' ? 'sp' : ''}>{f}</em>)}</span>
                    </span>
                    {match && <span className="ectrl-tag">⚡ TTP</span>}
                  </button>
                )
              })}
            </div>
            <div className="ectrl-morerow">
              {eShow < eControls.length && (
                <button type="button" className="ectrl-more" onClick={() => setEShow((n) => Math.min(n + 10, eControls.length))}>
                  + show {Math.min(10, eControls.length - eShow)} more <span className="ectrl-more-n">· {eControls.length - eShow} of {eControls.length} hidden</span>
                </button>
              )}
              {eShow > 6 && (
                <button type="button" className="ectrl-more less" onClick={showLess}>− show less</button>
              )}
            </div>
            <div className="hint">Ranked <b>TTP-relevant first</b>, then SPARTA-backed. Each traceable to ISO / NIST / NIS2 / …  <b>⚡ TTP</b> = control theme overlaps a countermeasure your chosen techniques invoke.</div>
          </>
        )}
      </div>
    </>
  )
}
