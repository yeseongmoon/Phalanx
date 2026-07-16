import { describe, it, expect } from 'vitest'
import { BANDS, ASSETS, TBS, TB_DIRECT, SUBSYS, type AssetDef } from '../src/engine/architecture'

/**
 * Mechanical alignment guard for the architecture scene: NO element may overlap another.
 * We reconstruct the bounding boxes exactly as `Architecture.tsx` draws them and assert that
 * nothing collides — a node's figure must sit inside its own selection ring, labels sit below
 * the ring, neighbouring nodes don't touch, titles clear the top row, and the boundary pills
 * don't crowd each other. Keep this in sync with AssetNode / the render when geometry changes.
 */

type Box = { x1: number; y1: number; x2: number; y2: number }
const TOL = 0.6
function overlaps(a: Box, b: Box): boolean {
  const ox = Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1)
  const oy = Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1)
  return ox > TOL && oy > TOL
}
/** true when `inner` sticks out of `outer` by more than TOL on any side */
function stickOut(inner: Box, outer: Box): boolean {
  return inner.x1 < outer.x1 - TOL || inner.x2 > outer.x2 + TOL || inner.y1 < outer.y1 - TOL || inner.y2 > outer.y2 + TOL
}

/** Figure bounds in glyph-local coords (before scale/translate), matching the drawn paths. */
const GLYPH: Record<string, Box> = {
  sat: { x1: -38, y1: -19, x2: 38, y2: 11 }, satfeeder: { x1: -38, y1: -13, x2: 38, y2: 11 },
  haps: { x1: -42, y1: -16, x2: 42, y2: 10 }, bus: { x1: -18, y1: -24, x2: 18, y2: 12 },
  payload: { x1: -15, y1: -10, x2: 15, y2: 18 }, eps: { x1: -16, y1: -10, x2: 16, y2: 9 },
  // dish is drawn inside translate(0,4) scale(0.82): base (-22,-32)..(22,18)
  dish: { x1: -18, y1: -22.2, x2: 18, y2: 18.8 }, ttc: { x1: -11, y1: -22, x2: 11, y2: 18 },
  ops: { x1: -20, y1: -16, x2: 20, y2: 18 }, rack: { x1: -17, y1: -19, x2: 17, y2: 20 },
  factory: { x1: -20, y1: -15, x2: 16, y2: 18 }, person: { x1: -17, y1: -20, x2: 32, y2: 17 },
  vsat: { x1: -15, y1: -13, x2: 15, y2: 14 }, iot: { x1: -9, y1: -11, x2: 20, y2: 23 },
}

const CHARW = 0.6 // rough glyph-width fraction of font size for our mono/sans labels
function labelBox(cx: number, baseline: number, text: string, fs: number): Box {
  const w = text.length * fs * CHARW
  return { x1: cx - w / 2, y1: baseline - fs, x2: cx + w / 2, y2: baseline + 2 }
}

function nodeGeom(a: AssetDef) {
  const sc = a.sc ?? 1
  let ring: Box, glyph: Box, labels: Box[]
  if (a.inset) {
    ring = { x1: a.cx - 23, y1: a.cy - 30, x2: a.cx + 23, y2: a.cy + 14 }
    const g = GLYPH[a.icon]
    glyph = { x1: a.cx + g.x1 * 0.85, y1: a.cy + g.y1 * 0.85 - 5, x2: a.cx + g.x2 * 0.85, y2: a.cy + g.y2 * 0.85 - 5 }
    labels = [labelBox(a.cx, a.cy + 24, a.lines[0], 9)]
    if (a.lines[1]) labels.push(labelBox(a.cx, a.cy + 35, a.lines[1], 8))
  } else {
    const hw = (a.rw ?? 34) * sc
    const boxTop = (a.rt ?? (a.flat ? -17 : -34)) * sc
    const boxH = (a.rh ?? (a.flat ? 28 : 58)) * sc
    ring = { x1: a.cx - hw, y1: a.cy + boxTop, x2: a.cx + hw, y2: a.cy + boxTop + boxH }
    const g = GLYPH[a.icon]
    glyph = { x1: a.cx + g.x1 * sc, y1: a.cy + g.y1 * sc, x2: a.cx + g.x2 * sc, y2: a.cy + g.y2 * sc }
    const lf = 11 * (sc > 1 ? 1.16 : 1)
    const y1 = a.labelDy ?? boxTop + boxH + 14
    labels = [labelBox(a.cx, a.cy + y1, a.lines[0], lf)]
    if (a.lines[1]) labels.push(labelBox(a.cx, a.cy + y1 + 12, a.lines[1], lf * 0.82))
  }
  const union = [ring, ...labels].reduce((u, b) => ({ x1: Math.min(u.x1, b.x1), y1: Math.min(u.y1, b.y1), x2: Math.max(u.x2, b.x2), y2: Math.max(u.y2, b.y2) }))
  return { ring, glyph, labels, union }
}

function pillBox(lx: number, ly: number, label: string): Box {
  const w = label.length * 6.4 + 38
  return { x1: lx - w / 2, y1: ly - 11, x2: lx + w / 2, y2: ly + 11 }
}

describe('scene geometry — nothing overlaps', () => {
  const geom = new Map(ASSETS.map((a) => [a, nodeGeom(a)]))

  it('each figure sits inside its own selection ring', () => {
    const bad = ASSETS.filter((a) => stickOut(geom.get(a)!.glyph, geom.get(a)!.ring)).map((a) => a.lines.join(' '))
    expect(bad, `figures poking out of their ring: ${bad.join(', ')}`).toEqual([])
  })

  it('each label sits clear of its own ring', () => {
    const bad = ASSETS.filter((a) => geom.get(a)!.labels.some((l) => overlaps(l, geom.get(a)!.ring))).map((a) => a.lines.join(' '))
    expect(bad, `ring overlaps its own label: ${bad.join(', ')}`).toEqual([])
  })

  it('no two nodes in a segment overlap (ring + labels)', () => {
    const bad: string[] = []
    for (const seg of ['User', 'Ground', 'Space']) {
      const items = ASSETS.filter((a) => a.seg === seg && !a.inset)
      for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++)
        if (overlaps(geom.get(items[i])!.union, geom.get(items[j])!.union)) bad.push(`${items[i].lines[0]} × ${items[j].lines[0]}`)
    }
    expect(bad, `overlapping nodes: ${bad.join(', ')}`).toEqual([])
  })

  it('on-board-subsystem chips + callout title do not overlap', () => {
    const chips = ASSETS.filter((a) => a.inset)
    const title: Box = { x1: SUBSYS.x + SUBSYS.w / 2 - (SUBSYS.title.length * 6) / 2, y1: SUBSYS.y + 17 - 9, x2: SUBSYS.x + SUBSYS.w / 2 + (SUBSYS.title.length * 6) / 2, y2: SUBSYS.y + 17 + 2 }
    const bad: string[] = []
    for (let i = 0; i < chips.length; i++) {
      if (overlaps(geom.get(chips[i])!.union, title)) bad.push(`${chips[i].lines[0]} × title`)
      for (let j = i + 1; j < chips.length; j++) if (overlaps(geom.get(chips[i])!.union, geom.get(chips[j])!.union)) bad.push(`${chips[i].lines[0]} × ${chips[j].lines[0]}`)
    }
    expect(bad, `callout collisions: ${bad.join(', ')}`).toEqual([])
  })

  it('segment titles clear every node ring in their band', () => {
    const bad: string[] = []
    for (const b of BANDS) {
      if (b.h <= 30) continue // HR footer has no nodes
      const title = labelBox(b.x + b.w / 2, b.y + 20, b.label, 11.5)
      for (const a of ASSETS) if (a.seg === b.key && !a.inset && overlaps(title, geom.get(a)!.ring)) bad.push(`${b.label} × ${a.lines[0]}`)
    }
    expect(bad, `title over a node ring: ${bad.join(', ')}`).toEqual([])
  })

  it('boundary pills do not crowd each other', () => {
    const pills = [...TBS, TB_DIRECT].map((t) => ({ id: t.label, box: pillBox(t.lx, t.ly, t.label) }))
    const bad: string[] = []
    for (let i = 0; i < pills.length; i++) for (let j = i + 1; j < pills.length; j++)
      if (overlaps(pills[i].box, pills[j].box)) bad.push(`${pills[i].id} × ${pills[j].id}`)
    expect(bad, `crowded boundary pills: ${bad.join(', ')}`).toEqual([])
  })
})
