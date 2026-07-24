import type { ReactNode } from 'react'
import type { Threat, Result } from '../engine/types'
import { phasesStr, ruleClass, RULE_TIPS, PASS1_TIP, PASS2_TIP, PRIMARY_TIP } from '../engine/ui'
import { ClampValue } from './ClampValue'

export function ResultCard({
  threat, result, onClose, onRemove, onEdit, onOpenDetail,
}: {
  threat: Threat
  result: Result
  onClose: () => void
  onRemove?: (id: string) => void
  onEdit?: (id: string) => void
  onOpenDetail?: (id: string) => void
}) {
  const segs = result.segs
  const seg = '{' + segs.join(', ') + '}'
  const tb = result.tb.length ? result.tb.join('  ·  ') : '-'          // show every crossed boundary, not "(+2)"
  const A = threat.A || '—'
  const cia = threat.cia || '—'   // impacted properties only (e.g. "IA" / "CIA")
  const hasDetail = !!(threat.map || threat.pre || threat.ttp || threat.cm || threat.impact || threat.conf)

  const flags: ReactNode[] = []
  if (result.multiseg) flags.push(<><b>R9</b> bridging sub-chain IA→EX/LM→IMP across {segs.join('/')}</>)
  if (result.multilife) flags.push(<><b>R10</b> spans {result.L.length} lifecycle phases</>)
  if (threat.E === 'OUT') flags.push(<><b>R3</b> state kept as enabling precondition</>)

  return (
    <div className="card">
      <button className="xbtn" title="Close result" onClick={(e) => { e.stopPropagation(); onClose() }}>×</button>
      <div className="readhead">
        <span className="rh-l"><span className="rh-dot" /> THREAT RECORD · {threat.id}</span>
        <span className="rh-r">{result.nature}</span>
      </div>
      <div className="cbody">
        {/* top-5 elements (A, E, TTP, S, CM) carry unique accent colors; the rest are muted */}
        <div className="f minor"><span className="k">L</span><span className="v">{phasesStr(result.L)}</span></div>
        <div className="f s"><span className="k">S</span><span className="v">{seg}</span></div>
        <div className="f a"><span className="k">A</span><ClampValue>{A}</ClampValue></div>
        <div className="f minor"><span className="k">TB</span><ClampValue>{tb}</ClampValue></div>
        <div className="f e"><span className="k">E</span><span className="v">{threat.E} · {cia} · {result.nature}</span></div>
        <div className="f minor"><span className="k">Pre</span><ClampValue>{threat.pre || '—'}</ClampValue></div>
        <div className="f ttp"><span className="k">TTP</span><ClampValue>{threat.ttp || result.ttp}</ClampValue></div>
        <div className="f cm"><span className="k">CM</span><ClampValue>{threat.cm || '—'}</ClampValue></div>
        <div className="f minor"><span className="k">I</span><ClampValue>{threat.impact || '—'}</ClampValue></div>
        <div className="f minor"><span className="k">Conf</span><ClampValue>{threat.conf || result.conf}</ClampValue></div>
        {hasDetail && onOpenDetail && (
          <div className="detailrow">
            <button className="detailbtn-sm" onClick={(e) => { e.stopPropagation(); onOpenDetail(threat.id) }}>Details →</button>
          </div>
        )}
      </div>
      <div className="cfoot">
        <div className="rules">{result.rules.map((r) => <span key={r} className={'rc ' + ruleClass(r)} data-tip={RULE_TIPS[r]}>{r}</span>)}</div>
        <div className="tstat">
          <span className="hastip" data-tip={PASS1_TIP}>Pass&nbsp;1 — S·TB·L derived from A <span className="ok">✓</span></span>
          {' · '}
          <span className="hastip" data-tip={PRIMARY_TIP}>primary rule <b>{result.prim}</b></span>
        </div>
        <div className="tstat">
          <span className="hastip" data-tip={PASS2_TIP}>
            Pass&nbsp;2 — {result.arm.startsWith('N/A')
              ? <>TTP N/A · kept as precondition <span className="ok">✓</span></>
              : hasDetail
                ? <>TTP·CM·I mapped to SPARTA <span className="ok">✓</span></>
                : <>not mapped yet <span className="pend">○</span></>}
          </span>
        </div>
        {flags.map((f, i) => <div key={i} className="flag">● {f}</div>)}
        {threat.desc && (
          <div className="desc">
            <span className="desc-lab">Threat description (ENISA)</span>
            {threat.desc}
          </div>
        )}
        {threat.custom && (onEdit || onRemove) && (
          <div className="cardacts">
            {onEdit && <button className="editbtn" onClick={(e) => { e.stopPropagation(); onEdit(threat.id) }}>✎ Edit this threat</button>}
            {onRemove && <button className="removebtn" onClick={(e) => { e.stopPropagation(); onRemove(threat.id) }}>✕ Remove this threat</button>}
          </div>
        )}
      </div>
    </div>
  )
}
