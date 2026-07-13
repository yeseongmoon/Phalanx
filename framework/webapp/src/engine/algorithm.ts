/**
 * Algorithm 1 — ENISA × SPARTA integrated threat modeling for 6G NTN.
 *
 * This is the CANONICAL engine for the app. It is a line-for-line port of
 * ../../../ntn_threat_algorithm.py and is guarded by test/parity.test.ts, which
 * checks it against a fixture produced by the Python engine (scripts/gen_data.py).
 * If you change one, regenerate the fixture and keep them identical.
 */
import type { Threat, Result } from './types'

export const LIFE: Record<number, string> = {
  1: 'Design and Development', 2: 'Assembly', 3: 'Pre-launch', 4: 'Launch',
  5: 'In-orbit Testing', 6: 'Operations', 7: 'Decommissioning',
}
export const SEGORDER = ['User', 'Ground', 'Space', 'Human Resources']

export const CLUSTER2E: Record<string, string> = {
  'Nefarious activity/abuse': 'NAA', 'Evaesdropping/Interception/Hijacking': 'EIH',
  'Physical access': 'PA', 'Unintentional damage': 'UD', 'Failures or malfunctions': 'FM',
  'Outages': 'OUT', 'Disaster': 'DIS', 'Legal': 'LEG', 'Legacy infrastructure': 'LEI',
}
export const ECAT: Record<string, string> = {
  NAA: 'Nefarious Activity/Abuse', EIH: 'Eavesdropping/Interception/Hijacking',
  PA: 'Physical Attacks', UD: 'Unintentional Damage', FM: 'Failures or malfunctions',
  OUT: 'Outages', DIS: 'Disaster', LEG: 'Legal', LEI: 'Legacy infrastructure',
}

const ADVERSARIAL = ['NAA', 'EIH', 'PA']
const FAILURE = ['FM', 'UD']
const STATE = ['OUT']
const ENVIRON = ['DIS']
const ENABLING = ['LEI', 'ACQ']
const LEGAL = ['LEG']

export function deriveSegments(A: string): string[] {
  const a = (A || '').toLowerCase()
  const s: string[] = []
  if (a.includes('ground:')) s.push('Ground')
  if (a.includes('space:')) s.push('Space')
  if (a.includes('user:')) s.push('User')
  if (a.includes('human resources:') || a.includes('human resource:')) s.push('Human Resources')
  if (a.includes('ground & space:')) {
    if (!s.includes('Ground')) s.push('Ground')
    if (!s.includes('Space')) s.push('Space')
  }
  return SEGORDER.filter((x) => s.includes(x))
}

export function deriveTB(segs: string[]): string[] {
  const t: string[] = []
  if (segs.includes('User') && segs.includes('Ground')) t.push('User <-> Ground/RAN (service link)')
  if (segs.includes('Ground') && segs.includes('Space')) t.push('Ground <-> Space (feeder / telecommand link)')
  if (segs.includes('User') && segs.includes('Space')) t.push('User <-> Space (direct service link)')
  if (segs.includes('Human Resources') && segs.length > 1) t.push('Human Resources <-> technical segment (organizational boundary)')
  return t.length ? t : ['(none - single segment / internal)']
}

export function deriveLife(A: string, segs: string[]): number[] {
  const a = (A || '').toLowerCase()
  const p = new Set<number>()
  const add = (arr: number[]) => arr.forEach((x) => p.add(x))
  const GE = [1, 2, 3], GO = [4, 5, 6, 7], SP = [3, 4, 5, 6, 7]
  if (segs.includes('Ground')) {
    if (a.includes('all assets') || ['ttc', 'control centre', 'mission control', 'crypto unit ground', 'operations'].some((k) => a.includes(k))) add(GO)
    if (a.includes('all assets') || ['production', 'design', 'development', 'assembly', 'manufactur', 'checkout', 'test', 'simulator', 'egse', 'mgse', 'document management', 'erp', 'prototyp', 'transport'].some((k) => a.includes(k))) add(GE)
    if (a.includes('all assets')) { add(GE); add(GO) }
  }
  if (segs.includes('Space')) add(SP)
  if (segs.includes('User')) p.add(6)
  if (segs.includes('Human Resources')) add([1, 2, 3, 4, 5, 6, 7])
  const arr = [...p].sort((x, y) => x - y)
  return arr.length ? arr : [6]
}

export function classify(code: string): [string, string, string] {
  if (ADVERSARIAL.includes(code)) return ['adversarial', 'R1', 'SPARTA TTP expected']
  if (ENABLING.includes(code)) return ['enabling/legacy', 'R5', 'SPARTA TTP expected (spawns adversarial chain)']
  if (STATE.includes(code)) return ['state/outage', 'R3', 'N/A (state kept as precondition)']
  if (FAILURE.includes(code)) return ['operational/unintentional', 'R2', 'N/A (non-adversarial)']
  if (ENVIRON.includes(code)) return ['physical/environmental', 'R4', 'N/A (non-adversarial)']
  if (LEGAL.includes(code)) return ['legal', '--', 'N/A (no SPARTA mapping)']
  return ['unknown', '--', 'N/A']
}

export function runOne(t: Threat): Result {
  const segs = deriveSegments(t.A)
  const tb = deriveTB(segs)
  const L = deriveLife(t.A, segs)
  const [nature, prim, arm] = classify(t.E)
  const R = new Set<string>()
  if (ADVERSARIAL.includes(t.E)) R.add('R1')
  if (FAILURE.includes(t.E)) R.add('R2')
  if (STATE.includes(t.E)) R.add('R3')
  if (ENVIRON.includes(t.E)) R.add('R4')
  if (ENABLING.includes(t.E)) R.add('R5')
  const adv = ADVERSARIAL.includes(t.E) || ENABLING.includes(t.E)
  if (adv) { R.add('R6'); R.add('R8') }
  R.add('R7')
  if (segs.length >= 2) R.add('R9')
  if (L.length >= 2) R.add('R10')
  const rules = [...R].sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))
  return {
    segs, tb, L, nature, prim, arm, rules,
    multiseg: segs.length >= 2, multilife: L.length >= 2,
    ttp: arm.startsWith('N/A') ? 'N/A -- by ' + prim : 'PENDING -- SPARTA',
    conf: arm.startsWith('N/A') ? '--' : 'PENDING',
  }
}

/** Split A into per-segment text so "all assets" / keyword matches stay in-segment. */
export function segChunks(A: string): Record<string, string> {
  const a = A || ''
  const chunks: Record<string, string> = { Ground: '', Space: '', User: '', 'Human Resources': '' }
  const re = /(human resources|human resource|ground & space|ground|space|user)\s*:/gi
  const ms: { e: number; i: number; seg: string }[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(a)) !== null) ms.push({ e: re.lastIndex, i: m.index, seg: m[1].toLowerCase() })
  for (let k = 0; k < ms.length; k++) {
    const start = ms[k].e
    const stop = k + 1 < ms.length ? ms[k + 1].i : a.length
    const txt = ' ' + a.slice(start, stop).toLowerCase()
    const seg = ms[k].seg
    if (seg.startsWith('ground & space')) { chunks.Ground += txt; chunks.Space += txt }
    else if (seg.startsWith('human')) chunks['Human Resources'] += txt
    else if (seg[0] === 'g') chunks.Ground += txt
    else if (seg[0] === 's') chunks.Space += txt
    else if (seg[0] === 'u') chunks.User += txt
  }
  return chunks
}
