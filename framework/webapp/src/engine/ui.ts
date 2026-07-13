import { LIFE } from './algorithm'

/** Solid, high-contrast category-tag colors (visible for UD/FM/LEG too). */
export const ECAPCOL: Record<string, string> = {
  adversarial: '#ef5a6f', 'enabling/legacy': '#e0870c', 'state/outage': '#e0870c',
  'operational/unintentional': '#5f6b86', 'physical/environmental': '#0ea472',
  legal: '#8257e6', unknown: '#5f6b86',
}

export function ruleClass(r: string): string {
  if (r === 'R1' || r === 'R5') return 'r-adv'
  if (r === 'R2' || r === 'R3' || r === 'R4') return 'r-na'
  if (r === 'R9' || r === 'R10') return 'r-span'
  return 'r-mod'
}

export function phasesStr(L: number[]): string {
  return L.length ? '{' + L.join(',') + '} ' + L.map((p) => LIFE[p].slice(0, 3)).join('/') : '-'
}

export function segKey(s: string): string {
  return s === 'Human Resources' ? 'HR' : s
}

/** Plain-language explanations of the decision rules (shown as tooltips). */
export const RULE_TIPS: Record<string, string> = {
  R1: 'R1 · Adversarial threat → maps to SPARTA attacker techniques (TTP).',
  R2: 'R2 · Operational failure, no attacker → TTP = N/A.',
  R3: 'R3 · State/outage condition (not an action) → TTP = N/A; kept as a precondition for later steps.',
  R4: 'R4 · Physical/environmental event, no intent → TTP = N/A.',
  R5: 'R5 · Supply-chain / legacy enabling condition → spawns an adversarial chain.',
  R6: 'R6 · One ENISA threat maps to several SPARTA techniques (many-to-many).',
  R7: 'R7 · Every mapping carries a confidence grade (High / Med / Low).',
  R8: 'R8 · Countermeasures attach to specific assets & interfaces, not whole categories.',
  R9: 'R9 · Spans two or more segments → emit a bridging sub-chain across the trust boundary.',
  R10: 'R10 · Spans several satellite-lifecycle phases.',
}
export const PASS1_TIP =
  'Pass 1 of Algorithm 1: Segments, Trust boundaries and Lifecycle are computed automatically from the Affected Assets (A) — not entered by hand. ✓ = consistent.'
export const PRIMARY_TIP =
  'The rule that sets the threat’s fundamental branch (R1 adversarial · R2 failure · R3 state · R4 environmental · R5 legacy). R6–R10 are add-on modifiers.'
