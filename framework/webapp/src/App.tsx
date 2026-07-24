import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Threat } from './engine/types'
import { runOne, CLUSTER2E } from './engine/algorithm'
import { parseCSV, rowsToThreats, threatsToCSV, download } from './engine/csv'
import threatsData from './data/threats.json'
import { TopBar } from './components/TopBar'
import { TooltipLayer } from './components/Tooltip'
import { Architecture } from './components/Architecture'
import { Builder, type NewThreat, type BuilderState } from './components/Builder'
import { ThreatList } from './components/ThreatList'
import { Home } from './components/Home'
import { Guide } from './components/Guide'
import { Detail } from './components/Detail'

const SEED = threatsData as Threat[]

type View = 'home' | 'guide' | 'model' | 'detail'
const TABS: { id: View; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '◆' },
  { id: 'guide', label: 'Method Guide', icon: '❏' },
  { id: 'model', label: 'Threat Model', icon: '⌖' },
  { id: 'detail', label: 'Details', icon: '≣' },
]

export default function App({ initialView = 'home' }: { initialView?: View } = {}) {
  const [view, setView] = useState<View>(initialView)      // landing page is the front door
  const [detailFocusId, setDetailFocusId] = useState<string | null>(null)   // scroll target on the Details tab
  const [threats, setThreats] = useState<Threat[]>(SEED)   // the 58 ENISA threats load by default
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)                 // unsaved custom-threat changes since last export
  const [confirm, setConfirm] = useState<null | { msg: string; run: () => void }>(null)
  const custom = useRef(0)
  // structured builder state per custom threat, in memory only (for lossless Edit) — not a DB
  const formStore = useRef<Map<string, BuilderState>>(new Map())
  const scrollRef = useRef<HTMLDivElement>(null)

  // When a threat is expanded, center its card in the panel. The card opens
  // instantly (no max-height animation), so the layout is final here and the
  // single smooth scroll lands on the right spot for every row, top to bottom.
  useEffect(() => {
    const scroller = scrollRef.current
    if (!selectedId || !scroller) return
    const raf = requestAnimationFrame(() => {
      const row = scroller.querySelector('.row.sel') as HTMLElement | null
      if (!row) return
      const rowTop = row.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop
      const target = rowTop - Math.max(0, (scroller.clientHeight - row.offsetHeight) / 2)
      scroller.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
    })
    return () => cancelAnimationFrame(raf)
  }, [selectedId])

  // warn on tab close / reload while there are unsaved custom threats (browser shows its generic prompt)
  useEffect(() => {
    if (!dirty) return
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [dirty])

  const results = useMemo(() => new Map(threats.map((t) => [t.id, runOne(t)])), [threats])
  const cats = useMemo(() => [...new Set(threats.map((t) => t.E))], [threats])

  const selected = threats.find((t) => t.id === selectedId) ?? null
  const selectedResult = selected ? results.get(selected.id)! : null

  const q = query.toLowerCase()
  const items = threats.filter(
    (t) => (!filter || t.E === filter) && (!q || t.name.toLowerCase().includes(q) || t.cluster.toLowerCase().includes(q)),
  )
  const advCount = threats.filter((t) => !results.get(t.id)!.arm.startsWith('N/A')).length
  const nadvCount = threats.length - advCount

  const addThreat = (n: NewThreat) => {
    custom.current += 1
    const id = 'C' + custom.current
    const t: Threat = {
      id, cluster: n.cluster, name: n.name,
      E: CLUSTER2E[n.cluster] || '?', cia: n.cia, A: n.A,
      desc: n.desc || '(analyst-added threat)', note: 'custom', custom: true, fresh: true,
      pre: n.pre || undefined, ttp: n.ttp || undefined, cm: n.cm || undefined,
      impact: n.impact || undefined, conf: n.conf || undefined, evidence: n.evidence || undefined,
      map: n.map,
    }
    if (n.form) formStore.current.set(id, n.form)
    setThreats((prev) => [...prev, t])   // append to the existing list
    setDetailFocusId(null)               // don't auto-open anything on the Details tab
    setFilter(null); setQuery(''); setSelectedId(id); setDirty(true); setShowAdd(false)   // collapse the builder
  }
  const updateThreat = (id: string, n: NewThreat) => {
    if (n.form) formStore.current.set(id, n.form)
    setThreats((prev) => prev.map((t) => (t.id === id ? {
      ...t, cluster: n.cluster, name: n.name, E: CLUSTER2E[n.cluster] || '?', cia: n.cia, A: n.A,
      desc: n.desc || '(analyst-added threat)',
      pre: n.pre || undefined, ttp: n.ttp || undefined, cm: n.cm || undefined,
      impact: n.impact || undefined, conf: n.conf || undefined, evidence: n.evidence || undefined,
      map: n.map,
    } : t)))
    setEditingId(null); setSelectedId(id); setDirty(true)
  }
  const editThreat = (id: string) => {
    setEditingId(id); setShowAdd(true); setSelectedId(null)
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const openDetail = (id: string) => { setDetailFocusId(id); setView('detail') }   // card → full dossier
  const clearDetailFocus = useCallback(() => setDetailFocusId(null), [])
  const removeThreat = (id: string) => {
    const next = threats.filter((t) => t.id !== id)
    setThreats(next)
    formStore.current.delete(id)
    if (selectedId === id) setSelectedId(null)
    if (editingId === id) setEditingId(null)
    setDirty(next.some((t) => t.custom))   // unsaved only while custom threats still remain
  }
  // gate a destructive action (reset / load) behind a Save-first prompt when there are unsaved custom threats
  const guardDestructive = (run: () => void, what: string) => {
    const n = threats.filter((t) => t.custom).length
    if (dirty && n > 0) setConfirm({ msg: `You have ${n} unsaved custom threat${n > 1 ? 's' : ''}, which ${what} will discard.`, run })
    else run()
  }
  const onLoadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) guardDestructive(() => loadCSV(f), 'loading a new CSV')
    e.target.value = ''
  }
  const exportCSV = () => { download('enisa_threats_tuple_export.csv', threatsToCSV(threats, runOne)); setDirty(false) }
  const loadCSV = (file: File) => {
    const rd = new FileReader()
    rd.onload = () => {
      try {
        const loaded = rowsToThreats(parseCSV(String(rd.result).replace(/^﻿/, '')))
        if (!loaded.length) throw new Error('no threats parsed')
        // recognise analyst-added rows (C-ids) as custom, and continue the counter past the highest one
        let maxC = 0
        for (const t of loaded) {
          const m = /^C(\d+)$/i.exec(t.id.trim())
          if (m) { t.custom = true; maxC = Math.max(maxC, Number(m[1])) }
        }
        custom.current = maxC; formStore.current.clear(); setEditingId(null); setDirty(false)
        setThreats(loaded); setSelectedId(null); setFilter(null); setQuery('')
      } catch (err) {
        alert('Could not load CSV: ' + (err as Error).message +
          '\n\nExpected the schema from build_tuple_workbook.py (enisa_threats_tuple.csv).')
      }
    }
    rd.readAsText(file)
  }
  const reset = () => {
    custom.current = 0; formStore.current.clear(); setEditingId(null); setDirty(false)
    setThreats(SEED); setSelectedId(null); setFilter(null); setQuery('')
  }

  return (
    <>
      <TooltipLayer />
      <TopBar />
      <nav className="tabs" role="tablist" aria-label="PHALANX views">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={view === t.id}
            className={'tab' + (view === t.id ? ' on' : '')}
            onClick={() => { setDetailFocusId(null); setView(t.id) }}>
            <span className="ti" aria-hidden="true">{t.icon}</span>{t.label}
          </button>
        ))}
      </nav>

      {view === 'home' && <Home onNav={setView} />}
      {view === 'guide' && <Guide />}
      {view === 'detail' && <Detail threats={threats} results={results} focusId={detailFocusId} onFocusConsumed={clearDetailFocus} />}
      {view === 'model' && <div className="app">
        <div className="col mid">
          <div className="chead">
            <div className="t">6G NTN Reference Architecture</div>
            <div className="s">User → Ground/Core → Space · Select a threat to glow its affected segments &amp; assets</div>
          </div>
          <Architecture threat={selected} result={selectedResult} />
        </div>

        <div className="col right">
          <div className="chead">
            <div className="t">Builder &amp; Database</div>
            <div className="s">Add a threat (runs Algorithm 1) · Browse &amp; select</div>
          </div>
          <div className="scroll" ref={scrollRef}>
            <label className="loadbtn">⬆ Load threats from CSV (your threat model)
              <input type="file" accept=".csv" hidden onChange={onLoadFile} />
            </label>

            <div className="sechd">Model</div>
            <div className="stats">
              <div className="stile rec"><div className="n num">{threats.length}</div><div className="l">records</div></div>
              <div className="stile adv"><div className="n num">{advCount}</div><div className="l">adversarial</div></div>
              <div className="stile nadv"><div className="n num">{nadvCount}</div><div className="l">non-adversarial</div></div>
            </div>

            <button type="button" className={'collapse-h' + (showAdd ? ' open' : '')}
              onClick={() => { if (showAdd && editingId) setEditingId(null); setShowAdd((v) => !v) }} aria-expanded={showAdd}>
              <span className="plus">+</span> {editingId ? `Editing threat ${editingId}` : 'Add a new threat'}
              <span className="chev">▸</span>
            </button>
            {showAdd && <div className="add-body">
              <Builder key={editingId ?? 'new'} editing={!!editingId}
                initial={editingId ? formStore.current.get(editingId) : undefined}
                onCancel={() => setEditingId(null)}
                onSubmit={editingId ? (t) => updateThreat(editingId!, t) : addThreat} />
            </div>}

            <button className="btn exp" type="button" onClick={exportCSV}>⭳ Export to CSV (opens in Excel){dirty && <span className="unsaved"> · unsaved</span>}</button>
            <button className="btn ghost" type="button" onClick={() => guardDestructive(reset, 'resetting to the ENISA database')}>Reset to ENISA database</button>

            <div className="sechd">Threats</div>
            <input className="search" placeholder="Search threats…" autoComplete="off"
              value={query} onChange={(e) => setQuery(e.target.value)} />
            <div className="filters">
              <span className={'fchip' + (filter === null ? ' on' : '')} onClick={() => setFilter(null)}>all</span>
              {cats.map((c) => (
                <span key={c} className={'fchip' + (filter === c ? ' on' : '')} onClick={() => setFilter(c)}>{c}</span>
              ))}
            </div>
            {threats.length === 0 ? (
              <div className="empty">
                No threats loaded yet.<br />
                Load a <b>CSV</b> (your threat model) above, or the <b>ENISA database</b>, to begin.
              </div>
            ) : (
              <ThreatList
                items={items} results={results} selectedId={selectedId}
                onSelect={(id) => setSelectedId(id)} onClose={() => setSelectedId(null)} onRemove={removeThreat} onEdit={editThreat} onOpenDetail={openDetail}
              />
            )}
          </div>
        </div>
      </div>}

      {confirm && (
        <div className="modal-back" onClick={() => setConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-t">Unsaved custom threats</div>
            <div className="modal-b">{confirm.msg} Save them to CSV first?</div>
            <div className="modal-acts">
              <button className="btn" onClick={() => { const r = confirm.run; exportCSV(); setConfirm(null); r() }}>💾 Save &amp; continue</button>
              <button className="btn ghost danger" onClick={() => { const r = confirm.run; setConfirm(null); r() }}>Discard &amp; continue</button>
              <button className="btn ghost" onClick={() => setConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
