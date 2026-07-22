import type { Threat, Result } from '../engine/types'
import { ECAPCOL, segKey } from '../engine/ui'
import { ResultCard } from './ResultCard'

export function ThreatList({
  items, results, selectedId, onSelect, onClose, onRemove, onEdit,
}: {
  items: Threat[]
  results: Map<string, Result>
  selectedId: string | null
  onSelect: (id: string) => void
  onClose: () => void
  onRemove: (id: string) => void
  onEdit: (id: string) => void
}) {
  if (!items.length) return <div className="empty">No threats match.</div>
  const renderRow = (t: Threat) => {
    const r = results.get(t.id)!
    const dots = r.segs.length ? r.segs : ['']
    return (
      <div key={t.id} className={'row' + (t.id === selectedId ? ' sel' : '')} data-id={t.id} onClick={() => onSelect(t.id)}>
        <div className="rowhead">
          <span className="rid">{t.id}</span>
          <span className="rname">{t.name}{t.custom && <> <span className="new">NEW</span></>}</span>
          <span className="segdots">{dots.map((s, i) => <span key={i} className={'sd ' + (s ? segKey(s) : '')}></span>)}</span>
          <span className="ecap" style={{ background: ECAPCOL[r.nature] || '#5f6b86', color: '#fff' }}>{t.E}</span>
        </div>
        <div className="detail">{t.id === selectedId && <ResultCard threat={t} result={r} onClose={onClose} onRemove={onRemove} onEdit={onEdit} />}</div>
      </div>
    )
  }
  // reference (ENISA) threats stay on top; a thick divider separates the analyst's custom threats below
  const ref = items.filter((t) => !t.custom)
  const cust = items.filter((t) => t.custom)
  return (
    <>
      {ref.map(renderRow)}
      {cust.length > 0 && <div className="list-sep"><span>custom threats · {cust.length}</span></div>}
      {cust.map(renderRow)}
    </>
  )
}
