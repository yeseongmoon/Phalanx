// Method Guide — a static explainer page for the PHALANX threat-modeling method.
// Every claim here traces to the project's journal blueprint (SCIE_Journal §6.1 tuple,
// §6.2 decision table R1–R10, §6.3 Algorithm 1) and the primary sources in §17.10.
// No engine code is touched; this is documentation rendered inside the app.
import { Wordmark } from './Wordmark'

type Field = { k: string; accent?: string; name: string; def: string; src: string }

// §6.1 — the 10-element integrated threat record. A is the generative primitive;
// S·TB·L are derived from it, E is set by the ENISA cluster (Pass 1). Pre·TTP·CM·I·Conf
// are authored in Pass 2. Accent colours match the result-card tuple accents.
const PASS1_FIELDS: Field[] = [
  { k: 'L', name: 'Lifecycle phase(s)', def: 'Set-valued.', src: 'Union of the affected assets’ ENISA lifecycle phases (Annex B), filtered by what the precondition makes realizable.' },
  { k: 'S', accent: 'var(--t-s)', name: 'Segment(s)', def: 'Set-valued.', src: 'ENISA segments {Ground, Space, User, Human Resources} (+Network/Core ext.) the assets belong to. Multiple segments are normal, not an exception.' },
  { k: 'A', accent: 'var(--t-a)', name: 'Affected asset(s)', def: 'Set-valued — the generative primitive.', src: 'The ENISA threat’s affected-asset list (Annex C) mapped onto reference-architecture asset IDs. An “all assets in segment X” wildcard expands to the architecture’s asset list.' },
  { k: 'TB', name: 'Trust boundary(ies) crossed', def: 'Set-valued.', src: 'The trust boundaries between the assets in A (e.g. Ground↔Space telecommand link).' },
  { k: 'E', accent: 'var(--t-e)', name: 'ENISA threat category / event', def: '', src: '{NAA, EIH, PA, UD, FM, OUT, DIS, LEG, LEI, Acquisition-of-capabilities} plus the specific threat name.' },
]
const PASS2_FIELDS: Field[] = [
  { k: 'Pre', name: 'Precondition(s) enabling the threat', def: 'The state→action bridge.', src: 'Free text plus asset/state references. Links a non-adversarial state to the adversarial action it enables (rule R3).' },
  { k: 'TTP', accent: 'var(--t-ttp)', name: 'SPARTA tactic · technique(s)', def: '', src: 'STxxxx (tactic) + PREFIX-#### (+ .sub, technique). If none, explicitly “N/A (non-adversarial)”.' },
  { k: 'CM', accent: 'var(--t-cm)', name: 'Countermeasure(s)', def: 'Dual-sourced.', src: 'SPARTA CM00xx crosswalked to NIST SP 800-53 / CCSDS / 3GPP controls, and ENISA threat-level controls.' },
  { k: 'I', name: 'Technical & mission impact', def: '', src: 'SPARTA Impact tactic (IMP-0001…0006: Deception / Disruption / Denial / Degradation / Destruction / Theft) plus mission impact.' },
  { k: 'Conf', name: 'Evidence & mapping confidence', def: '', src: '{High, Med, Low} plus evidence links (standards, real incidents).' },
]

const P1_STEPS: { k: string; t: string }[] = [
  { k: 'A', t: 'Map the ENISA threat’s affected-asset list (Annex C) onto the reference-architecture assets; expand any “all assets in segment X” wildcard.' },
  { k: 'S', t: 'Derive the segment set from A — frequently more than one.' },
  { k: 'TB', t: 'Identify the trust boundaries between the touched assets.' },
  { k: 'L', t: 'Take the union of the assets’ ENISA lifecycle phases (Annex B), then intersect with the phases the precondition makes realizable.' },
  { k: 'E', t: 'Set the ENISA category and threat name from the cluster.' },
  { k: 'Pre', t: 'Record the preconditions that enable the threat (the seed for the Pass 2 bridge).' },
]
const P2_STEPS: { k: string; t: string }[] = [
  { k: 'R1–R10', t: 'Apply the decision table to classify the record (adversarial vs. state / non-adversarial).' },
  { k: 'TTP', t: 'If there is adversarial evidence, map the matching SPARTA techniques. If the trust boundary crosses a segment (e.g. Ground↔Space), issue an intra-record bridging sub-chain IA → EX/LM → IMP (R9). Otherwise TTP = N/A, kept as an enabling precondition (R2–R4).' },
  { k: 'CM', t: 'Attach countermeasures (from the technique chain or the assets) and crosswalk them to NIST / CCSDS / 3GPP controls (R8).' },
  { k: 'I', t: 'Derive the technical & mission impact from the technique chain.' },
  { k: 'Conf', t: 'Grade the evidence — High / Med / Low (R7).' },
  { k: 'L', t: 'Split the record by phase only if TTP or CM differ across its lifecycle set; otherwise keep L as a set (R10).' },
]

// §6.2 — decision table, translated faithfully from the journal blueprint. Grounding codes
// resolve in the legend below (§17.10). Order and wording preserved.
const RULES: { id: string; cond: string; act: string; conf: string; ground: string }[] = [
  { id: 'R1', cond: 'Intentional cyber threat with evidence of adversarial behaviour.', act: 'Map directly to the relevant SPARTA technique(s).', conf: 'High / Med', ground: 'NIST 800-30 Adversarial threat source (Capability / Intent / Targeting, Tables D-2…D-5); SPARTA/ATT&CK are adversary-behaviour models by definition. [G1]' },
  { id: 'R2', cond: 'Operational failure (FM) with no evidence of attacker involvement.', act: 'TTP = N/A. Record via Pre only.', conf: '—', ground: 'NIST 800-30 Structural (equipment/SW failure); ISO 27005 A (accidental). [G1][G2]' },
  { id: 'R3', cond: 'State-type threat (e.g. OUT “Security services failure”).', act: 'TTP = N/A in itself, and linked as an enabling precondition to a downstream TTP chain. The action-type pair (e.g. NAA “Preventing services”) is a separate record.', conf: 'Med', ground: 'ENISA’s primary source itself distinguishes state vs. action (OUT “Security services failure” ↔ NAA “Preventing services”, Annex C p.87/94). [E2]' },
  { id: 'R4', cond: 'Physical / environmental event (PA / DIS) with no evidence of intent.', act: 'Independent risk event. TTP = N/A.', conf: '—', ground: 'NIST 800-30 Environmental (natural disaster); ISO 27005 E (environmental). [G1][G2]' },
  { id: 'R5', cond: 'Supply-chain vulnerability (LEI / Acquisition-of-capabilities).', act: 'Identify by lifecycle condition, then map an IA / EX / PER / LM chain as a separate record (split condition R10).', conf: 'Med', ground: 'MITRE ATT&CK Resource Development (TA0042) + Supply Chain Compromise (T1195); ENISA “acquisition of capabilities” (borrowed from SPARTA). [G3][E2]' },
  { id: 'R6', cond: 'One ENISA threat maps to multiple SPARTA techniques.', act: 'Allow many-to-many; attach evidence to each mapping individually.', conf: 'each', ground: 'Standard crosswalk practice — NIST IR 8278r1 OLIR / Informative References (“one or more parts”; subset / intersects / superset). [G4]' },
  { id: 'R7', cond: 'Insufficiently-grounded mapping.', act: 'Mark Conf = Low; do not assert as fact.', conf: 'Low', ground: 'Assigning confidence to mappings is standard — OASIS STIX 2.1 normative confidence (None/Low/Med/High). ICD 203 requires only a confidence expression; the level scale follows STIX. [G5][G6]' },
  { id: 'R8', cond: 'Countermeasure (CM) linkage.', act: 'Link CM to a specific asset · interface · attack stage, not to the threat category.', conf: '—', ground: 'SPARTA CM↔technique structure + defense-in-depth principle (design grounded in the framework’s structure). [S3]' },
  { id: 'R9', cond: 'Affected asset spans two or more segments / trust boundaries.', act: 'One record (set-valued S / A / TB) plus a bridging sub-chain (IA → EX/LM → IMP) linking the trust boundaries; tag-distinguished from inter-record chains.', conf: 'each', ground: 'ENISA Annex C data structure (threat → multi-segment affected-asset) + this study’s design decision. [E2]' },
  { id: 'R10', cond: 'One threat spans multiple lifecycle phases.', act: 'Keep L set-valued. Split only when TTP or CM differ by phase; if identical, keep a single record.', conf: '—', ground: 'ENISA Annex B asset × lifecycle column (asset → phase) + this study’s design decision. [E2]' },
]

const GROUNDING: { code: string; text: string }[] = [
  { code: 'G1', text: 'NIST SP 800-30 Rev.1 — threat-source taxonomy: Adversarial / Accidental / Structural / Environmental (App. D).' },
  { code: 'G2', text: 'ISO/IEC 27005 — threat origin D / A / E: Deliberate / Accidental / Environmental (Annex C, 2008–2018 eds.).' },
  { code: 'G3', text: 'MITRE ATT&CK — Resource Development (TA0042) + Supply Chain Compromise (T1195).' },
  { code: 'G4', text: 'NIST IR 8278r1 — many-to-many crosswalk semantics (OLIR / Informative References).' },
  { code: 'G5', text: 'OASIS STIX 2.1 — normative confidence property (None / Low / Med / High).' },
  { code: 'G6', text: 'ODNI ICD 203 — analytic standard requiring an expressed confidence.' },
  { code: 'E2', text: 'ENISA Space Threat Landscape (2025) — Annex B (asset × lifecycle) and Annex C (threat × affected-asset).' },
  { code: 'S3', text: 'SPARTA (Aerospace) — countermeasure↔technique mapping structure.' },
]

function TupleChip({ f }: { f: { k: string; accent?: string } }) {
  return <span className="tk" style={f.accent ? { color: f.accent, borderColor: f.accent } : undefined}>{f.k}</span>
}

function FieldTable({ fields }: { fields: Field[] }) {
  return (
    <div className="gtbl fieldtbl">
      {fields.map((f) => (
        <div className="frow" key={f.k}>
          <div className="fk"><TupleChip f={f} /></div>
          <div className="fbody">
            <div className="fname">{f.name}{f.def && <span className="fdef"> · {f.def}</span>}</div>
            <div className="fsrc">{f.src}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function Guide() {
  return (
    <div className="guide">
      <div className="guidedoc">
        <header className="ghero">
          <div className="gkicker">Method Guide</div>
          <h1>How <Wordmark /> models a 6G NTN threat</h1>
          <p className="glede">
            <Wordmark /> turns each <b>ENISA Space Threat Landscape</b> entry into one structured record — a
            ten-element tuple — and processes it in <b>two passes</b> over a 6G NTN reference architecture.
            Pass&nbsp;1 reads the threat through ENISA (<i>what</i> is affected, <i>where</i>, and <i>when</i>).
            Pass&nbsp;2 reads it through <b>SPARTA</b> (<i>how</i> an adversary would act, and how to stop them).
            A single-field bridge — the <i>precondition</i> — links a non-adversarial state to the adversarial
            action it enables.
          </p>

          <div className="gflow">
            <div className="gf enisa"><span className="gf-t">Pass 1 · ENISA</span><span className="gf-s">derive</span><span className="gf-k">L · S · A · TB · E</span></div>
            <span className="gf-arrow">→</span>
            <div className="gf bridge"><span className="gf-t">Bridge</span><span className="gf-s">state → action</span><span className="gf-k">Pre</span></div>
            <span className="gf-arrow">→</span>
            <div className="gf sparta"><span className="gf-t">Pass 2 · SPARTA</span><span className="gf-s">map</span><span className="gf-k">TTP · CM · I · Conf</span></div>
          </div>
        </header>

        <section className="gsec">
          <h2><span className="gnum">01</span> The threat record</h2>
          <div className="tuple-line">
            TR = ⟨&nbsp;
            {[...PASS1_FIELDS, ...PASS2_FIELDS].map((f, i) => (
              <span key={f.k}>{i > 0 && <span className="tsep">, </span>}<TupleChip f={f} /></span>
            ))}
            &nbsp;⟩
          </div>
          <p className="gp">
            <b>A is the generative primitive</b> — the affected-asset set drives everything else. <b>S</b>,
            <b> TB</b> and <b>L</b> are <i>derived</i> from it (never hand-entered), and the ENISA cluster sets
            <b> E</b>. The remaining five fields are authored in Pass&nbsp;2.
          </p>

          <div className="gsub">Pass 1 — derived by the engine</div>
          <FieldTable fields={PASS1_FIELDS} />
          <div className="gsub">Pass 2 — authored by the analyst</div>
          <FieldTable fields={PASS2_FIELDS} />

          <div className="gnote">
            <b>Design decision — TTP may be empty.</b> State / condition-type and non-adversarial threats
            (FM, much of OUT, DIS) are kept as <code>TTP = N/A</code> and live as a <b>precondition</b> only.
            This makes “state-type threat vs. attacker action” an invariant of the data structure, not a
            judgement call.
          </div>
        </section>

        <section className="gsec">
          <h2><span className="gnum">02</span> Phase 1 — the ENISA pass <span className="gh-sub">what · where · when</span></h2>
          <p className="gp">
            Threat-centric: the record is created per <b>ENISA threat</b>, and the affected-asset set is the
            primitive from which segments, trust boundaries and lifecycle are derived. A threat that touches
            Ground <i>and</i> Space (e.g. “Seizure of control: Satellite bus”) stays a <b>single set-valued
            record</b> rather than being split apart.
          </p>
          <ol className="gsteps">
            {P1_STEPS.map((s) => (
              <li key={s.k}><span className="stk">{s.k}</span><span>{s.t}</span></li>
            ))}
          </ol>
        </section>

        <section className="gsec">
          <h2><span className="gnum">03</span> Phase 2 — the SPARTA pass <span className="gh-sub">how · mitigation</span></h2>
          <p className="gp">
            Adversary-behaviour-centric: each record is run through the R1–R10 decision table, then the
            technique chain, countermeasures, impact and confidence are filled in.
          </p>
          <ol className="gsteps">
            {P2_STEPS.map((s) => (
              <li key={s.k}><span className="stk">{s.k}</span><span>{s.t}</span></li>
            ))}
          </ol>
          <div className="gnote bridge-note">
            <b>Bridging sub-chain (R9).</b> When a record’s trust boundary crosses a segment — Ground↔Space
            over the telecommand link, say — the technique chain is issued <i>inside the one record</i> as a
            bridging sub-chain <code>IA → EX/LM → IMP</code> that stitches the two segments together. A
            time-ordered kill-chain across separate threats is instead expressed as <b>inter-record</b>
            chaining (one record’s post-condition satisfying another’s precondition), followed by a coverage
            audit over every asset × phase.
          </div>
        </section>

        <section className="gsec">
          <h2><span className="gnum">04</span> Mapping decision rules <span className="gh-sub">R1 – R10</span></h2>
          <p className="gp">
            The decision table is a <b>codebook</b> derived from the two frameworks’ own definitions and from
            established risk / crosswalk standards — defended by <b>explicitness + reproducibility</b>
            (inter-analyst agreement, κ), not by authority.
          </p>
          <div className="gtbl ruletbl">
            <div className="rrow rhead">
              <div className="rc-id">#</div>
              <div className="rc-cond">Condition — nature of the ENISA threat</div>
              <div className="rc-act">Action — SPARTA mapping</div>
              <div className="rc-conf">Conf</div>
              <div className="rc-grd">Grounding</div>
            </div>
            {RULES.map((r) => (
              <div className="rrow" key={r.id}>
                <div className="rc-id"><span className="rid">{r.id}</span></div>
                <div className="rc-cond">{r.cond}</div>
                <div className="rc-act">{r.act}</div>
                <div className="rc-conf">{r.conf}</div>
                <div className="rc-grd">{r.ground}</div>
              </div>
            ))}
          </div>

          <div className="gnote honest">
            <b>An honest distinction.</b> <b>R1–R5</b> are strongly grounded in external standards and primary
            sources (forced by definition or by the data). <b>R6–R7</b> are established crosswalk / analysis
            practice. <b>R8–R9–R10</b> follow each framework’s structure but embed <i>this study’s design
            decisions</i> — so they are stated as such rather than overclaimed as “derived from standards”;
            their justification is validated empirically by inter-analyst agreement (κ).
          </div>

          <div className="glegend">
            <div className="gsub">Grounding sources</div>
            {GROUNDING.map((g) => (
              <div className="glg" key={g.code}><span className="glg-c">[{g.code}]</span><span>{g.text}</span></div>
            ))}
          </div>
        </section>

        <footer className="gfoot">
          Reproduces the formal method from the project’s journal blueprint (§6). Sources: ENISA Space Threat
          Landscape (2025) · SPARTA v3.2 © The Aerospace Corporation · NIST SP 800-30 Rev.1 · ISO/IEC 27005 ·
          MITRE ATT&amp;CK · NIST IR 8278r1 · OASIS STIX 2.1 · ODNI ICD 203.
        </footer>
      </div>
    </div>
  )
}
