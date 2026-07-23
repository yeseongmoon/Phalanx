// Home / About — the landing page: what PHALANX is, the gap it closes, the philosophy
// behind it, and the framework at a glance. DRAFT — copy is grounded in the project
// CLAUDE.md and the journal blueprint (§2 frameworks, §5 architecture, §6 method); refine as
// the paper firms up. No engine code is touched.

import { Wordmark } from './Wordmark'

type View = 'home' | 'guide' | 'model'

const PHILOSOPHY: { t: string; d: string; accent: string }[] = [
  { t: 'Trace, don’t invent', accent: 'var(--signal)', d: 'Every threat, technique, control and countermeasure traces to a primary source — ENISA, SPARTA, NIST / ISO / NIS2 / CCSDS / 3GPP. Anything unverified is flagged, never asserted.' },
  { t: 'State before action', accent: 'var(--t-e)', d: 'A non-adversarial state — a failure, a disabled safeguard — is modelled as a first-class precondition that enables a downstream attacker action, not lumped in with the attack. This state → action bridge is the method’s core novelty.' },
  { t: 'Derive, don’t hand-enter', accent: 'var(--t-s)', d: 'Segments, trust boundaries and lifecycle phases are computed from the affected-asset set — shrinking analyst subjectivity and keeping records consistent across a whole threat model.' },
  { t: 'Mitigate from both sides', accent: 'var(--t-cm)', d: 'Countermeasures are dual-sourced: ENISA standards-traceable controls at the threat level, and SPARTA technique-level countermeasures crosswalked to NIST / CCSDS / 3GPP.' },
  { t: 'Built to be reproduced', accent: 'var(--t-a)', d: 'A published decision codebook (R1–R10), explicit confidence grades, and inter-analyst agreement (κ) make each mapping auditable — defended by reproducibility, not authority.' },
  { t: 'One architecture, end to end', accent: 'var(--t-ttp)', d: 'Everything anchors to a concrete 6G NTN reference architecture — User · Ground / Core · Space · Human Resources — so threats, boundaries and mitigations land on real interfaces.' },
]

const PILLARS: { k: string; t: string; d: string }[] = [
  { k: '◫', t: 'Reference architecture', d: 'A 6G NTN reference model — User, Ground/Core, Space and Human Resources segments with their trust boundaries and links.' },
  { k: '⟨⟩', t: '10-element threat record', d: 'Each ENISA threat becomes one structured tuple: TR = ⟨ L, S, A, TB, E, Pre, TTP, CM, I, Conf ⟩.' },
  { k: '⇄', t: 'Two-pass algorithm', d: 'Pass 1 derives what / where / when from ENISA; a precondition bridges state to action; Pass 2 maps how / mitigation from SPARTA.' },
  { k: 'R', t: 'Decision rules R1–R10', d: 'A grounded codebook that standardises every classification and mapping decision — and makes the process reproducible.' },
]

export function Home({ onNav }: { onNav: (v: View) => void }) {
  return (
    <div className="home">
      <div className="homedoc">
        <section className="hhero">
          <div className="hkicker">6G NTN Threat-Flow Framework</div>
          <h1 className="htitle"><Wordmark /></h1>
          <p className="htag">
            Crosswalking the <b>ENISA Space Threat Landscape</b> and <b>SPARTA</b> into one line of defense
            for <b>6G Non-Terrestrial Networks</b>.
          </p>
          <p className="hlede">
            ENISA tells you <i>what</i> can go wrong and <i>where</i> — including non-adversarial states like
            failures and outages. SPARTA tells you <i>how</i> an adversary acts and how to stop them. Neither,
            alone, gives you an operational threat model for a satellite-integrated 6G network. <Wordmark /> bridges
            the two over a concrete 6G&nbsp;NTN reference architecture — turning each threat into a structured,
            traceable record you can reason about, map and mitigate.
          </p>
          <div className="hcta">
            <button className="hbtn primary" onClick={() => onNav('model')}>Open the threat model →</button>
            <button className="hbtn" onClick={() => onNav('guide')}>Read the method guide</button>
          </div>
          <div className="hdraft">Draft landing page · content to be refined alongside the paper</div>
        </section>

        <section className="hsec">
          <h2 className="hh2">The gap it closes</h2>
          <div className="hgap">
            <div className="hgcard enisa">
              <div className="hg-t">ENISA Space Threat Landscape</div>
              <div className="hg-role">the <b>what</b> &amp; <b>where</b></div>
              <p>A catalogue of space threats mapped to assets, segments and lifecycle — and, uniquely, to non-adversarial states. Strong on coverage and context; silent on adversary mechanics.</p>
            </div>
            <div className="hgplus">＋</div>
            <div className="hgcard sparta">
              <div className="hg-t">SPARTA</div>
              <div className="hg-role">the <b>how</b></div>
              <p>Attacker tactics, techniques and countermeasures for space systems. Strong on mechanics and mitigation; not organised around the space threat landscape or a concrete NTN architecture.</p>
            </div>
            <div className="hgeq">=</div>
            <div className="hgcard phalanx">
              <div className="hg-t"><Wordmark /></div>
              <div className="hg-role">one integrated model</div>
              <p>Each ENISA threat becomes a 10-element record and runs a two-pass algorithm over a 6G NTN reference architecture — carrying state, action and mitigation together.</p>
            </div>
          </div>
        </section>

        <section className="hsec">
          <h2 className="hh2">The philosophy behind it</h2>
          <div className="hphil">
            {PHILOSOPHY.map((p) => (
              <div className="hpcard" key={p.t}>
                <div className="hp-bar" style={{ background: p.accent }} />
                <div className="hp-t">{p.t}</div>
                <p className="hp-d">{p.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="hsec">
          <h2 className="hh2">The framework at a glance</h2>
          <div className="hpillars">
            {PILLARS.map((p) => (
              <div className="hpil" key={p.t}>
                <div className="hpil-k">{p.k}</div>
                <div className="hpil-body">
                  <div className="hpil-t">{p.t}</div>
                  <div className="hpil-d">{p.d}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="hnav-hint">
            See it formalised in the <button className="hlink" onClick={() => onNav('guide')}>Method Guide</button>,
            or put it to work in the <button className="hlink" onClick={() => onNav('model')}>Threat Model</button>.
          </div>
        </section>

        <footer className="hfoot">
          <Wordmark /> · a research tool from KAIST Cyber Security Research Center. Built on the ENISA Space Threat
          Landscape (2025) and SPARTA v3.2 © The Aerospace Corporation, over a 3GPP-grounded 6G NTN reference
          architecture.
        </footer>
      </div>
    </div>
  )
}
