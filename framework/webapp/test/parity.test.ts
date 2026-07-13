import { describe, it, expect } from 'vitest'
import { runOne } from '../src/engine/algorithm'
import type { Threat } from '../src/engine/types'
import threats from '../src/data/threats.json'
import fixture from './parity-fixture.json'

/**
 * The TS engine must be byte-identical to the Python engine (ntn_threat_algorithm.py).
 * `parity-fixture.json` is produced by scripts/gen_data.py from the Python engine.
 * Regenerate both if you touch either engine.
 */
type Fix = Record<string, { segs: string[]; L: number[]; rules: string[]; nature: string; arm: string; prim: string; tb: string[] }>

describe('TS engine == Python engine (all 58 threats)', () => {
  const fix = fixture as Fix
  for (const t of threats as Threat[]) {
    it(`${t.id} ${t.name}`, () => {
      const r = runOne(t)
      const f = fix[t.id]
      expect(r.segs).toEqual(f.segs)
      expect(r.L).toEqual(f.L)
      expect(r.rules).toEqual(f.rules)
      expect(r.nature).toEqual(f.nature)
      expect(r.arm.startsWith('N/A') ? 'N/A' : 'SPARTA').toEqual(f.arm)
      expect(r.prim).toEqual(f.prim)
      expect(r.tb).toEqual(f.tb)
    })
  }
})
