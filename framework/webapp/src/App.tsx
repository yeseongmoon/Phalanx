import { useEffect, useMemo, useRef, useState } from 'react'
import type { Threat } from './engine/types'
import { runOne, CLUSTER2E } from './engine/algorithm'
import { parseCSV, rowsToThreats, threatsToCSV, download } from './engine/csv'
import threatsData from './data/threats.json'
import { TopBar } from './components/TopBar'
import { TooltipLayer } from './components/Tooltip'
import { Architecture } from './components/Architecture'
import { Builder, type NewThreat } from './components/Builder'
import { ThreatList } from './components/ThreatList'

const SEED = threatsData as Threat[]

export default function App() {
  const [threats, setThreats] = useState<Threat[]>(SEED)   // the 58 ENISA threats load by default
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const custom = useRef(0)
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
  const customCount = threats.filter((t) => t.custom).length

  const addThreat = (n: NewThreat) => {
    custom.current += 1
    const t: Threat = {
      id: 'C' + custom.current, cluster: n.cluster, name: n.name,
      E: CLUSTER2E[n.cluster] || '?', cia: n.cia, A: n.A,
      desc: n.desc || '(analyst-added threat)', note: 'custom', custom: true,
      pre: n.pre || undefined, ttp: n.ttp || undefined, cm: n.cm || undefined,
      impact: n.impact || undefined, conf: n.conf || undefined,
    }
    setThreats((prev) => [...prev, t])   // append to the existing list
    setFilter(null); setQuery(''); setSelectedId(t.id)
  }
  const removeThreat = (id: string) => {
    setThreats((prev) => prev.filter((t) => t.id !== id))
    if (selectedId === id) setSelectedId(null)
  }
  const onLoadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) loadCSV(f)
    e.target.value = ''
  }
  const exportCSV = () => download('enisa_threats_tuple_export.csv', threatsToCSV(threats, runOne))
  const loadCSV = (file: File) => {
    const rd = new FileReader()
    rd.onload = () => {
      try {
        const loaded = rowsToThreats(parseCSV(String(rd.result).replace(/^﻿/, '')))
        if (!loaded.length) throw new Error('no threats parsed')
        custom.current = 0
        setThreats(loaded); setSelectedId(null); setFilter(null); setQuery('')
      } catch (err) {
        alert('Could not load CSV: ' + (err as Error).message +
          '\n\nExpected the schema from build_tuple_workbook.py (enisa_threats_tuple.csv).')
      }
    }
    rd.readAsText(file)
  }
  const reset = () => {
    custom.current = 0
    setThreats(SEED); setSelectedId(null); setFilter(null); setQuery('')
  }

  return (
    <>
      <TooltipLayer />
      <TopBar />
      <div className="app">
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
              <div className="stile cst"><div className="n num">{customCount}</div><div className="l">custom</div></div>
            </div>

            <button type="button" className={'collapse-h' + (showAdd ? ' open' : '')}
              onClick={() => setShowAdd((v) => !v)} aria-expanded={showAdd}>
              <span className="plus">+</span> Add a new threat
              <span className="chev">▸</span>
            </button>
            {showAdd && <div className="add-body"><Builder onAdd={addThreat} /></div>}

            <button className="btn exp" type="button" onClick={exportCSV}>⭳ Export to CSV (opens in Excel)</button>
            <button className="btn ghost" type="button" onClick={reset}>Reset to ENISA database</button>

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
                onSelect={(id) => setSelectedId(id)} onClose={() => setSelectedId(null)} onRemove={removeThreat}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
