export interface Threat {
  id: string
  cluster: string
  name: string
  E: string
  cia: string
  A: string
  desc?: string
  note?: string
  custom?: boolean
  fresh?: boolean        // added this session (drives the NEW badge); not persisted to CSV
  // analyst-filled SPARTA-mapping side of the tuple (optional; blank on raw ENISA rows).
  // pre/ttp/cm/impact/conf are flat display strings (used by custom threats + CSV export);
  // `map` is the structured Pass-2 record from mappings.json that the card renders richly.
  pre?: string
  ttp?: string
  cm?: string
  impact?: string
  conf?: string
  evidence?: string      // primary sources this record traces to (one per line)
  map?: Mapping
}

/** What a step does in the chain. Drives the R9 bridge marker — explicit data, never sniffed
 *  from the note text. entry = way in · bridge = crosses a trust boundary · effect = impact. */
export type StepKind = 'entry' | 'bridge' | 'effect' | 'step'
export const STEP_KINDS: StepKind[] = ['entry', 'bridge', 'effect', 'step']
export const KIND_LABEL: Record<StepKind, string> = {
  entry: 'entry — way in',
  bridge: 'bridge — crosses a trust boundary (R9)',
  effect: 'effect — impact',
  step: 'step — intermediate',
}
/** A SPARTA technique in a chain: id + name + tactic, plus the analyst's note on its role. */
export interface TechRef { id: string; name: string; tactic: string; kind?: StepKind; note?: string }
/** A countermeasure bound to a stage technique (R8). */
export interface CmRef { id: string; name: string; stage?: string }
/** The structured Pass-2 (SPARTA) mapping authored per threat in framework/mappings.json. */
export interface Mapping {
  name?: string
  pre?: string
  ttp: TechRef[]
  cm_sparta?: CmRef[]
  cm_standards?: string[]
  cm_enisa?: string
  impact?: string
  conf?: { grade?: string; note?: string }
  rules?: string[]
  evidence?: string[]
}

export interface Result {
  segs: string[]
  tb: string[]
  L: number[]
  nature: string
  prim: string
  arm: string
  rules: string[]
  multiseg: boolean
  multilife: boolean
  ttp: string
  conf: string
}
