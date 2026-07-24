import type { ReactNode } from 'react'
import type { Mapping, CmRef } from '../engine/types'

// Full Pass-2 dossier for one threat, shown on the Details tab. Every field spelled out in full
// (Precondition, Technique chain, …) with a one-line definition, the technique chain, CMs grouped
// by the stage they defend, the standards/ENISA overlay, confidence, decision rules and evidence.

const GRADE: Record<string, string> = { High: 'g-high', Med: 'g-med', Medium: 'g-med', Low: 'g-low' }

function Field({ name, letter, def, children }: { name: string; letter: string; def: string; children: ReactNode }) {
  return (
    <section className="dfield">
      <div className="dfield-h"><span className="dfield-name">{name}</span><span className="dfield-let">{letter}</span></div>
      <div className="dfield-def">{def}</div>
      <div className="dfield-body">{children}</div>
    </section>
  )
}

export function MappingDetail({ map }: { map: Mapping }) {
  const groups: { key: string; items: CmRef[] }[] = []
  for (const c of map.cm_sparta ?? []) {
    const key = c.stage ?? 'general'
    let g = groups.find((x) => x.key === key)
    if (!g) { g = { key, items: [] }; groups.push(g) }
    g.items.push(c)
  }
  const techName = (id: string) => map.ttp.find((t) => t.id === id)?.name
  const chainIdx = (id: string) => { const i = map.ttp.findIndex((t) => t.id === id.trim()); return i < 0 ? 99 : i }
  const stageIds = (k: string) => k.split('+').map((s) => s.trim()).filter(Boolean)
  // order the CM groups: single-technique stages in chain order, then multi-stage groups (each
  // ordered by its earliest technique), and free-text controls (no mapped stage) last.
  const rank = (k: string): [number, number, number] => {
    if (k === 'general') return [3, 0, 0]
    const ids = stageIds(k)
    if (ids.length <= 1) return [1, chainIdx(ids[0] ?? k), 0]
    return [2, Math.min(...ids.map(chainIdx)), ids.length]
  }
  groups.sort((a, b) => {
    const ra = rank(a.key), rb = rank(b.key)
    return ra[0] - rb[0] || ra[1] - rb[1] || ra[2] - rb[2]
  })
  const stageLabel = (k: string) => {
    if (k === 'general') return 'general'
    const ids = stageIds(k)
    if (ids.length > 1) return `${ids.join(' · ')} · shared across stages`
    const id = ids[0] ?? k
    return techName(id) ? `${id} · ${techName(id)}` : id
  }

  return (
    <div className="ddoc-fields">
      {map.pre && (
        <Field name="Precondition" letter="Pre" def="The state that must hold for the chain to be reachable — the state→action bridge (rule R3).">
          <p className="dtext">{map.pre}</p>
        </Field>
      )}

      <Field name="Technique chain" letter="TTP" def="The SPARTA tactic · technique sequence, in attacker order. The highlighted step crosses a trust boundary between segments (rule R9); each step's reasoning is listed below.">
        <div className="chain">
          {map.ttp.map((t, i) => (
            <span className="chain-node" key={t.id + i}>
              {i > 0 && <span className="chain-arr">→</span>}
              <span className={'tech' + (t.kind === 'bridge' ? ' bridge' : '')}>
                <span className="tech-top">
                  <span className="tech-no">{i + 1}</span>
                  <b className="tech-id">{t.id}</b>
                  {t.kind === 'bridge' && <span className="tech-flag" title="crosses a trust boundary (R9)">⇄ R9</span>}
                </span>
                <span className="tech-tac">{t.tactic}</span>
                <span className="tech-name" title={t.name}>{t.name}</span>
              </span>
            </span>
          ))}
        </div>
        {map.ttp.some((t) => t.note) && (
          <ol className="steplist">
            {map.ttp.map((t, i) => (
              <li className={'stepitem' + (t.kind === 'bridge' ? ' bridge' : '')} key={t.id + i}>
                <span className="stepitem-no">{i + 1}</span>
                <div className="stepitem-b">
                  <div className="stepitem-h">
                    <b className="stepitem-id">{t.id}</b>
                    <span className="stepitem-nm">{t.name}</span>
                    {t.kind && <span className={'stepitem-kind k-' + t.kind}>{t.kind}</span>}
                  </div>
                  {t.note && <p className="stepitem-note">{t.note}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Field>

      {(groups.length > 0 || map.cm_standards?.length || map.cm_enisa) && (
      <Field name="Countermeasures" letter="CM" def="Defenses bound to each stage technique (rule R8), dual-sourced with standards and ENISA controls.">
        <div className="cmgroups">
          {groups.map((g) => (
            <div className="cmgroup" key={g.key}>
              <div className="cmg-lab">{stageLabel(g.key)}</div>
              <div className="cmg-chips">{g.items.map((c) => <span className="cmchip" key={c.id}><b>{c.id}</b> {c.name}</span>)}</div>
            </div>
          ))}
          {(map.cm_standards?.length || map.cm_enisa) && (
            <div className="cmgroup overlay">
              <div className="cmg-lab">standards &amp; ENISA · dual-source</div>
              <div className="cmg-std">
                {map.cm_standards?.map((s, i) => <div className="stdline" key={i}>{s}</div>)}
                {map.cm_enisa && <div className="stdline enisa">{map.cm_enisa}</div>}
              </div>
            </div>
          )}
        </div>
      </Field>
      )}

      {map.impact && (
        <Field name="Impact" letter="I" def="Technical & mission consequence; ties to the SPARTA Impact tactic and the ENISA CIA tag.">
          <p className="dtext">{map.impact}</p>
        </Field>
      )}

      {map.conf?.grade && (
        <Field name="Confidence" letter="Conf" def="Evidence grade for this record (STIX 2.1: High / Med / Low), taken at the weakest link (rule R7).">
          <div className="confrow">
            <span className={'confbadge ' + (GRADE[map.conf.grade] || '')}>{map.conf.grade}</span>
          </div>
          {map.conf.note && <p className="dtext muted">{map.conf.note}</p>}
        </Field>
      )}

      {map.rules?.length ? (
        <Field name="Decision rules" letter="R" def="The mapping-decision rules applied (see the Method Guide for R1–R10).">
          <ul className="dlist">{map.rules.map((r, i) => <li key={i}>{r}</li>)}</ul>
        </Field>
      ) : null}

      {map.evidence?.length ? (
        <Field name="Evidence" letter="Src" def="The primary sources this mapping traces to — nothing is asserted without one (no-fabrication).">
          <ul className="dlist">{map.evidence.map((e, i) => <li key={i}>{e}</li>)}</ul>
        </Field>
      ) : null}
    </div>
  )
}
