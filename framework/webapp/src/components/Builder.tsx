import { Fragment, useState } from 'react'
import { CLUSTER2E, runOne } from '../engine/algorithm'
import { segKey, phasesStr } from '../engine/ui'
import { ASSET_OPTIONS, PICK_SEGMENTS, type AssetGroup, type AssetOption } from '../engine/architecture'
import { SpartaPicker } from './SpartaPicker'
import enisaData from '../data/enisa_controls.json'

const ECONTROLS = enisaData.controls as { title: string }[]

export interface NewThreat {
  name: string; cluster: string; A: string; cia: string; desc: string
  pre: string; ttp: string; cm: string; impact: string; conf: string
  form?: BuilderState
}

type SegSel = { all: boolean; assets: string[] }
const emptySel = (): Record<string, SegSel> =>
  Object.fromEntries(PICK_SEGMENTS.map((s) => [s, { all: false, assets: [] }]))
const emptyDraft = (): Record<string, string> =>
  Object.fromEntries(PICK_SEGMENTS.map((s) => [s, '']))

const CIA_KEYS = ['C', 'I', 'A'] as const
type CiaKey = typeof CIA_KEYS[number]
// SPARTA Impact (IMP) tactic outcomes — verified against the SPARTA dataset
const IMPACTS = ['Deception', 'Disruption', 'Denial', 'Degradation', 'Destruction', 'Theft']
const CONFS = ['High', 'Medium', 'Low']

/** Raw builder form state, kept in memory (never persisted like a DB) so an analyst-added threat can
 *  be re-opened and edited losslessly — the flat A/TTP/CM strings can't be round-tripped back to picks. */
export interface BuilderState {
  name: string; desc: string; cluster: string; cia: Record<CiaKey, boolean>
  sel: Record<string, SegSel>; pre: string
  chain: string[]; cmSel: string[]; enisaSel: number[]; cmExtra: string[]
  impact: string[]; conf: string
}

export function Builder({ onSubmit, initial, editing = false, onCancel }: {
  onSubmit: (t: NewThreat) => void
  initial?: BuilderState
  editing?: boolean
  onCancel?: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [desc, setDesc] = useState(initial?.desc ?? '')
  const [cluster, setCluster] = useState(initial?.cluster ?? Object.keys(CLUSTER2E)[0])
  const [cia, setCia] = useState<Record<CiaKey, boolean>>(initial?.cia ?? { C: false, I: false, A: false })
  const [sel, setSel] = useState<Record<string, SegSel>>(initial?.sel ?? emptySel())
  const [draft, setDraft] = useState<Record<string, string>>(emptyDraft)
  const [expanded, setExpanded] = useState<string | null>(null)   // the one open asset group (accordion — one at a time)
  // bridge: precondition (state→action)
  const [pre, setPre] = useState(initial?.pre ?? '')
  // SPARTA-mapping side (optional) — open it if the edited threat already carries a mapping
  const [showMap, setShowMap] = useState(!!initial && (initial.chain.length + initial.cmSel.length + initial.enisaSel.length + initial.cmExtra.length + initial.impact.length > 0))
  const [chain, setChain] = useState<string[]>(initial?.chain ?? [])
  const [cmSel, setCmSel] = useState<string[]>(initial?.cmSel ?? [])
  const [enisaSel, setEnisaSel] = useState<number[]>(initial?.enisaSel ?? [])
  const [cmExtra, setCmExtra] = useState<string[]>(initial?.cmExtra ?? [])
  const [impact, setImpact] = useState<string[]>(initial?.impact ?? [])
  const [conf, setConf] = useState(initial?.conf ?? '')

  const buildA = () => {
    const parts: string[] = []
    for (const seg of PICK_SEGMENTS) {
      const s = sel[seg]
      const label = seg === 'Human Resources' ? 'Human resources' : seg
      if (s.all) parts.push(`${label}: all assets`)
      else if (s.assets.length) parts.push(`${label}: ${s.assets.join(', ')}`)
    }
    return parts.join('; ')
  }
  const ciaStr = () => CIA_KEYS.filter((k) => cia[k]).join('')
  const A = buildA()
  // live Pass-1 preview: S · TB · L are DERIVED from A by Algorithm 1, never entered by hand
  const derived = A ? runOne({ id: '_preview', cluster, name: name || '_', E: CLUSTER2E[cluster] || '?', cia: ciaStr(), A }) : null

  const toggleCia = (k: CiaKey) => setCia((c) => ({ ...c, [k]: !c[k] }))
  const toggleImpact = (x: string) =>
    setImpact((cur) => (cur.includes(x) ? cur.filter((v) => v !== x) : [...cur, x]))
  const toggleAll = (seg: string) =>
    setSel((s) => ({ ...s, [seg]: { all: !s[seg].all, assets: [] } }))
  const removeAsset = (seg: string, token: string) =>
    setSel((s) => ({ ...s, [seg]: { ...s[seg], assets: s[seg].assets.filter((a) => a !== token) } }))
  // toggle a single asset/sub-asset chip (free multi-select — the analyst picks whatever is relevant)
  const toggleAsset = (seg: string, token: string) =>
    setSel((s) => {
      const cur = s[seg]; if (cur.all) return s
      const assets = cur.assets.includes(token) ? cur.assets.filter((a) => a !== token) : [...cur.assets, token]
      return { ...s, [seg]: { ...cur, assets } }
    })
  const toggleExpand = (seg: string, label: string) => setExpanded((e) => (e === seg + '|' + label ? null : seg + '|' + label))
  // picking the whole asset clears (and, in the UI, disables) its sibling parts — the whole covers them
  const selectWhole = (seg: string, g: AssetGroup, whole: AssetOption) =>
    setSel((s) => {
      const cur = s[seg]; if (cur.all) return s
      const partToks = g.items.filter((it) => !it.whole).map((it) => it.token)
      const assets = cur.assets.includes(whole.token)
        ? cur.assets.filter((a) => a !== whole.token)
        : [...cur.assets.filter((a) => !partToks.includes(a)), whole.token]
      return { ...s, [seg]: { ...cur, assets } }
    })
  const addOther = (seg: string) => {
    const v = draft[seg].trim()
    if (!v) return
    setSel((s) => (s[seg].all || s[seg].assets.includes(v) ? s : { ...s, [seg]: { ...s[seg], assets: [...s[seg].assets, v] } }))
    setDraft((d) => ({ ...d, [seg]: '' }))
  }

  const resetForm = () => {
    setName(''); setDesc(''); setCluster(Object.keys(CLUSTER2E)[0]); setCia({ C: false, I: false, A: false })
    setSel(emptySel()); setDraft(emptyDraft()); setExpanded(null)
    setPre(''); setChain([]); setCmSel([]); setEnisaSel([]); setCmExtra([]); setImpact([]); setConf(''); setShowMap(false)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (!A) { alert('Select at least one affected asset (or “All assets” for a segment).'); return }
    // CM is dual-sourced — group by provenance with ONE label per source (not "ENISA:" per control):
    //   SPARTA: <technique-mapped countermeasure IDs + free-text> · ENISA: <threat-mapped control titles>
    const spartaCm = [...cmSel, ...cmExtra]
    const enisaCm = enisaSel.map((i) => ECONTROLS[i].title)
    const cm = [
      spartaCm.length ? 'SPARTA: ' + spartaCm.join(', ') : '',
      enisaCm.length ? 'ENISA: ' + enisaCm.join(', ') : '',
    ].filter(Boolean).join('  ·  ')
    // structured form kept for lossless edit round-trip (in memory only, not a DB)
    const form: BuilderState = { name: name.trim(), desc: desc.trim(), cluster, cia, sel, pre: pre.trim(), chain, cmSel, enisaSel, cmExtra, impact, conf }
    onSubmit({
      name: name.trim(), cluster, A, cia: ciaStr(), desc: desc.trim(),
      pre: pre.trim(), ttp: chain.join(' → '),
      cm,
      impact: impact.join(', '), conf, form,
    })
    if (!editing) resetForm()
  }

  return (
    <form onSubmit={submit} autoComplete="off">
        {/* ── Phase 1 · ENISA (Pass 1): what & where — always open, this is the required core ── */}
        <div className="phase phase-enisa">
          <div className="phase-h">
            <span className="phase-no">1</span>
            <div className="phase-tt">
              <div className="phase-t">ENISA — what &amp; where</div>
              <div className="phase-s">Space Threat Landscape · yields L · S · A · TB · E</div>
            </div>
          </div>
          <div className="phase-body">
            <div className="field">
              <label>Threat name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Uplink command injection" required />
            </div>
            <div className="field">
              <label>Threat description <span className="opt">(optional)</span></label>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Short description of what this threat does…" />
            </div>
            <div className="field">
              <label>Cluster (sets ENISA category E)</label>
              <select value={cluster} onChange={(e) => setCluster(e.target.value)}>
                {Object.keys(CLUSTER2E).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>CIA impact</label>
              <div className="ciarow">
                {CIA_KEYS.map((k) => (
                  <button key={k} type="button" className={'ctog' + (cia[k] ? ' on' : '')}
                    onClick={() => toggleCia(k)} aria-pressed={cia[k]}>{k}</button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Affected assets — pick per segment</label>
              <div className="apick">
                {PICK_SEGMENTS.map((seg) => {
                  const s = sel[seg]
                  const groups = ASSET_OPTIONS[seg]
                  const known = new Set(groups.flatMap((g) => g.items.map((it) => it.token)))
                  if (!groups.length) known.add(seg)   // a segment with no sub-assets (HR) is a single self-named asset
                  const custom = s.assets.filter((a) => !known.has(a))
                  // bucket consecutive groups by section so an opened group's panel lands below its whole
                  // section's chips (keeps a row of boxes together instead of splitting it)
                  const sections: { section?: string; groups: AssetGroup[] }[] = []
                  for (const g of groups) {
                    const last = sections[sections.length - 1]
                    if (last && (last.section ?? '') === (g.section ?? '')) last.groups.push(g)
                    else sections.push({ section: g.section, groups: [g] })
                  }
                  return (
                    <div className="apick-seg" key={seg}>
                      <div className="apick-seg-h">
                        <span className={'apick-dot ' + segKey(seg)} />{seg}
                        {groups.length > 0 && <button type="button" className={'achip all seg-all' + (s.all ? ' on' : '')} onClick={() => toggleAll(seg)}>All assets</button>}
                      </div>
                      <div className="apick-chips">
                        {!groups.length && (
                          <button type="button" disabled={s.all}
                            className={'achip' + (s.assets.includes(seg) ? ' on' : '')}
                            onClick={() => toggleAsset(seg, seg)}>{seg}</button>
                        )}
                        {sections.map((sec, si) => {
                          const openG = sec.groups.find((g) => !s.all && expanded === seg + '|' + g.label)
                          const wholeOn = openG ? openG.items.some((w) => w.whole && s.assets.includes(w.token)) : false
                          return (
                            <Fragment key={si}>
                              {sec.section && <div className="apick-section">{sec.section}</div>}
                              {sec.groups.map((g) => {
                                const nsel = g.items.filter((it) => s.assets.includes(it.token)).length
                                const isOpen = !s.all && expanded === seg + '|' + g.label
                                return (
                                  <button key={g.label} type="button" disabled={s.all} aria-expanded={isOpen}
                                    className={'achip group' + (nsel > 0 ? ' on' : '') + (isOpen ? ' open' : '')}
                                    onClick={() => toggleExpand(seg, g.label)}>
                                    {g.label}
                                    {nsel > 0 && <span className="achip-badge">{nsel}</span>}
                                    <span className="achip-caret">▾</span>
                                  </button>
                                )
                              })}
                              {openG && (
                                <div className="apick-sub">
                                  <div className="apick-sub-h">{openG.label}</div>
                                  <div className="apick-sub-chips">
                                    {openG.items.map((it) => (
                                      <button key={it.token} type="button" disabled={s.all || (!it.whole && wholeOn)}
                                        className={'achip sub' + (s.assets.includes(it.token) ? ' on' : '')}
                                        onClick={() => (it.whole ? selectWhole(seg, openG, it) : toggleAsset(seg, it.token))}>{it.label}</button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </Fragment>
                          )
                        })}
                      </div>
                      {custom.length > 0 && (
                        <div className="apick-group">
                          <div className="apick-group-lab">Other (custom)</div>
                          <div className="apick-group-chips">
                            {custom.map((c) => (
                              <button key={c} type="button" className="achip on custom" onClick={() => removeAsset(seg, c)} title="Remove">{c} ×</button>
                            ))}
                          </div>
                        </div>
                      )}
                      <input className="achip-input other" placeholder="+ other asset (free text)…" disabled={s.all}
                        value={draft[seg]} onChange={(e) => setDraft((d) => ({ ...d, [seg]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addOther(seg) } }}
                        onBlur={() => addOther(seg)} />
                    </div>
                  )
                })}
              </div>
              <div className="apick-preview">
                {A ? <><span className="apick-k">A =</span> {A}</> : <span className="apick-empty">Select assets above — this builds the affected-assets string.</span>}
              </div>
              {derived && (
                <div className="apick-derived">
                  <span className="apick-k">derives →</span> S {'{' + derived.segs.join(', ') + '}'} · TB {derived.tb.length} · L {phasesStr(derived.L)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Bridge · Precondition: the state→action pivot (R3) that links the two passes ── */}
        <div className="bridge">
          <div className="bridge-h">
            <span className="bridge-ic">⇅</span> Pre — precondition
            <span className="bridge-tag">state → action bridge · R3</span>
          </div>
          <textarea value={pre} onChange={(e) => setPre(e.target.value)}
            placeholder="What must already hold for the attack to proceed — e.g. adversary holds valid uplink credentials; SDLS not enforced" />
        </div>

        {/* ── Phase 2 · SPARTA (Pass 2): how — collapsible, mapped by the analyst now or later ── */}
        <div className="phase phase-sparta">
          <button type="button" className={'phase-h' + (showMap ? ' open' : '')}
            onClick={() => setShowMap((v) => !v)} aria-expanded={showMap}>
            <span className="phase-no">2</span>
            <div className="phase-tt">
              <div className="phase-t">SPARTA — how</div>
              <div className="phase-s">Attack technique mapping · yields TTP · CM · I</div>
            </div>
            <span className="phase-opt">OPTIONAL</span>
            <span className="chev">▸</span>
          </button>
          {showMap && (
            <div className="phase-body">
              <SpartaPicker chain={chain} setChain={setChain} cmSel={cmSel} setCmSel={setCmSel}
                cmExtra={cmExtra} setCmExtra={setCmExtra} e={CLUSTER2E[cluster] || ''} enisaSel={enisaSel} setEnisaSel={setEnisaSel} />
              <div className="field">
                <label>I — impact <span className="opt">(SPARTA outcome)</span></label>
                <div className="improw">
                  {IMPACTS.map((x) => (
                    <button key={x} type="button" className={'achip' + (impact.includes(x) ? ' on' : '')}
                      onClick={() => toggleImpact(x)} aria-pressed={impact.includes(x)}>{x}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* record-level annotation — not part of either pass */}
        <div className="record-foot">
          <div className="rf-l">Conf — record confidence<span className="rf-s">Analyst's confidence in this tuple</span></div>
          <div className="confrow">
            {CONFS.map((c) => (
              <button key={c} type="button" className={'ctog' + (conf === c ? ' on' : '')}
                onClick={() => setConf(conf === c ? '' : c)} aria-pressed={conf === c}>{c}</button>
            ))}
          </div>
        </div>

        <div className="builder-actions">
          <button className="btn" type="submit">{editing ? 'Update threat' : 'Run Algorithm 1 & add'}</button>
          <button className="btn ghost" type="button" onClick={editing ? onCancel : resetForm}>{editing ? 'Cancel' : 'Reset'}</button>
        </div>
    </form>
  )
}
