import type { ReactNode } from 'react'
import type { Threat, Result } from '../engine/types'
import { phasesStr, ruleClass, RULE_TIPS, PASS1_TIP, PRIMARY_TIP } from '../engine/ui'

export function ResultCard({
  threat, result, onClose, onRemove,
}: {
  threat: Threat
  result: Result
  onClose: () => void
  onRemove?: (id: string) => void
}) {
  const segs = result.segs
  const seg = '{' + segs.join(', ') + '}'
  const tb = result.tb.length ? result.tb[0] + (result.tb.length > 1 ? `  (+${result.tb.length - 1})` : '') : '-'
  const A = threat.A || '—'

  const flags: ReactNode[] = []
  if (result.multiseg) flags.push(<><b>R9</b> bridging sub-chain IA→EX/LM→IMP across {segs.join('/')}</>)
  if (result.multilife) flags.push(<><b>R10</b> spans {result.L.length} lifecycle phases</>)
  if (threat.E === 'OUT') flags.push(<><b>R3</b> state kept as enabling precondition</>)

  return (
    <div className="card">
      <button className="xbtn" title="Close result" onClick={(e) => { e.stopPropagation(); onClose() }}>×</button>
      <div className="cbody">
        {/* top-5 elements (A, E, TTP, S, CM) carry unique accent colors; the rest are muted */}
        <div className="f minor"><span className="k">L</span><span className="v">{phasesStr(result.L)}</span></div>
        <div className="f s"><span className="k">S</span><span className="v">{seg}</span></div>
        <div className="f a"><span className="k">A</span><span className="v">{A}</span></div>
        <div className="f minor"><span className="k">TB</span><span className="v">{tb}</span></div>
        <div className="f e"><span className="k">E</span><span className="v">{threat.E} · CIA {threat.cia} · {result.nature}</span></div>
        <div className="f minor"><span className="k">Pre</span><span className="v">{threat.pre || '—'}</span></div>
        <div className="f ttp"><span className="k">TTP</span><span className="v">{threat.ttp || result.ttp}</span></div>
        <div className="f cm"><span className="k">CM</span><span className="v">{threat.cm || '—'}</span></div>
        <div className="f minor"><span className="k">I</span><span className="v">{threat.impact || '—'}</span></div>
        <div className="f minor"><span className="k">Conf</span><span className="v">{threat.conf || result.conf}</span></div>
      </div>
      <div className="cfoot">
        <div className="rules">{result.rules.map((r) => <span key={r} className={'rc ' + ruleClass(r)} data-tip={RULE_TIPS[r]}>{r}</span>)}</div>
        <div className="tstat">
          <span className="hastip" data-tip={PASS1_TIP}>Pass&nbsp;1 — S·TB·L derived from A <span className="ok">✓</span></span>
          {' · '}
          <span className="hastip" data-tip={PRIMARY_TIP}>primary rule <b>{result.prim}</b></span>
        </div>
        {flags.map((f, i) => <div key={i} className="flag">● {f}</div>)}
        {threat.desc && (
          <div className="desc">
            <span className="desc-lab">Threat description (ENISA)</span>
            {threat.desc}
          </div>
        )}
        {threat.custom && onRemove && (
          <button className="removebtn" onClick={(e) => { e.stopPropagation(); onRemove(threat.id) }}>✕ Remove this threat</button>
        )}
      </div>
    </div>
  )
}
