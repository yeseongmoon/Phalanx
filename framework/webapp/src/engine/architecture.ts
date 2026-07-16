/**
 * Geometry of the 6G NTN reference-architecture scene (redesign v5 — Space full-width
 * on top; User and Ground as equal side-by-side boxes; HR a footer band at the base.
 * Three trust boundaries form a T-junction (User↔Space / Ground↔Space across the top,
 * User↔Ground on the vertical divider, labelled below the boxes).
 *
 * The engine-facing data (`seg`, `kw`, `lines`) is unchanged from the original app
 * so asset hit-matching and the parity engine keep working; only the drawing
 * coordinates and figurative `icon` per node are new. `ASSET_OPTIONS` (the
 * builder's picker) is likewise unchanged.
 *
 * Scene viewBox is `0 0 960 720`; the console FRAME is centred inside it.
 */
export type IconKind =
  | 'sat' | 'satfeeder' | 'haps' | 'bus' | 'payload' | 'eps'
  | 'dish' | 'ttc' | 'ops' | 'rack' | 'factory'
  | 'person' | 'vsat' | 'iot'

export interface AssetDef { seg: string; kw: string[]; lines: string[]; cx: number; cy: number; icon: IconKind; inset?: boolean; labelBg?: boolean; sc?: number; flat?: boolean; labelDy?: number; rw?: number; rt?: number; rh?: number }
export interface BandDef { id: string; key: string; label: string; x: number; y: number; w: number; h: number }
export interface TbDef { id: string; labId: string; a: string; b: string; label: string; x1: number; y1: number; x2: number; y2: number; lx: number; ly: number }
export interface BeamDef { id: string; kind: 'service' | 'feeder' | 'telecommand' | 'isl'; x1: number; y1: number; x2: number; y2: number; label: string; lx: number; ly: number; path?: string; endpoints?: string[]; crosses?: string[]; gate?: string }

/** The framed console viewport, centred in the viewBox. */
export const FRAME = { x: 20, y: 10, w: 920, h: 660 }

/** Segment zones (glow on active). Space is the tall full-width sky; User + Ground are equal, compact
 *  surface boxes; HR a footer band. Layout: Space 24–386 · boundary 402 · boxes 418–618 · HR 626–648. */
export const BANDS: BandDef[] = [
  { id: 'seg-Space', key: 'Space', label: 'SPACE / AIR SEGMENT', x: 30, y: 24, w: 900, h: 362 },
  { id: 'seg-User', key: 'User', label: 'USER SEGMENT', x: 24, y: 418, w: 450, h: 210 },
  { id: 'seg-Ground', key: 'Ground', label: 'GROUND / CORE', x: 486, y: 418, w: 450, h: 210 },
  { id: 'seg-HR', key: 'Human Resources', label: 'HUMAN RESOURCES · personnel · roles', x: 24, y: 636, w: 912, h: 22 },
]

/** (LEO / STRATOSPHERE altitude tags removed — the satellites and HAPS speak for themselves.) */
export const ALT_LINES: { y: number; label: string; accent: string }[] = []

/**
 * Exploded callout of the on-board subsystems (BUS / Payload / EPS·AOCS). These ride EVERY satellite,
 * so it hangs below the satellite row and is fed by a leader from each satellite (incl. the ISL ones).
 */
export const SUBSYS = {
  x: 348, y: 128, w: 264, h: 96, title: 'ON-BOARD SUBSYSTEMS',
  leadTo: { x: 480, y: 128 },
  // real modelled satellites — dots hug the satellite's lower-inner edge (just clear of the ring
  // and the label below it), leader runs to the callout
  leadsPrimary: [{ x: 180, y: 124 }, { x: 780, y: 124 }],
  // ambient ISL satellites — light leaders, dots on the satellite bellies
  leadsIsl: [{ x: 300, y: 111 }, { x: 480, y: 111 }, { x: 660, y: 111 }],
}

/** Ambient (non-modelled) satellites strung along the ISL — pure scene decoration, evenly spaced. */
export const DECOR_SATS = [{ cx: 300, cy: 100 }, { cx: 480, cy: 100 }, { cx: 660, cy: 100 }]

export const ASSETS: AssetDef[] = [
  // Space — orbital platforms (LEO), lifted to the top of the sky
  { seg: 'Space', kw: ['gnb', 'service satellite'], lines: ['Service sat', 'gNB / gNB-DU'], cx: 130, cy: 100, icon: 'sat', sc: 1.4, rw: 42, rt: -22, rh: 36 },
  { seg: 'Space', kw: ['feeder'], lines: ['Feeder sat'], cx: 830, cy: 100, icon: 'satfeeder', sc: 1.4, rw: 42, rt: -22, rh: 36 },
  // Space/Air — HAPS at its true (stratospheric) altitude, centred, below the subsystems callout
  { seg: 'Space', kw: ['haps', 'uas', 'drone'], lines: ['HAPS / UAS'], cx: 480, cy: 328, icon: 'haps', sc: 1.35, flat: true, labelDy: 33, rw: 46 },
  // Space — on-board subsystems, shown inside the exploded callout (they ride every satellite)
  { seg: 'Space', kw: ['bus', 'cdhs', 'com'], lines: ['BUS', 'CDHS / COM'], cx: 400, cy: 180, icon: 'bus', inset: true },
  { seg: 'Space', kw: ['payload', 'pdhs', 'plcom', 'udhs'], lines: ['Payload', 'PDHS / PLCOM'], cx: 480, cy: 180, icon: 'payload', inset: true },
  { seg: 'Space', kw: ['eps', 'aocs', 'rtos', 'obsw', 'obc'], lines: ['EPS / AOCS', 'RTOS / OBSW'], cx: 560, cy: 180, icon: 'eps', inset: true },
  // Ground — stations on the surface (right box), a tidy 3 + 2 grid, all centred about the box centre
  { seg: 'Ground', kw: ['ttc', 'tt&c', 'sle', 'sdl'], lines: ['TT&C', 'SLE / SDL'], cx: 592, cy: 480, icon: 'ttc' },
  { seg: 'Ground', kw: ['control centre', 'mission control', 'operations centre', 'satellite control'], lines: ['Satellite', 'Control Centre'], cx: 711, cy: 480, icon: 'ops' },
  { seg: 'Ground', kw: ['gateway', 'san'], lines: ['NTN Gateway', 'SAN'], cx: 830, cy: 480, icon: 'dish' },
  { seg: 'Ground', kw: ['core', 'network', 'wan', 'mec'], lines: ['5G / 6G Core'], cx: 651, cy: 568, icon: 'rack' },
  { seg: 'Ground', kw: ['production', 'assembly', 'manufactur', 'checkout', 'simulator', 'test', 'egse', 'mgse', 'document management', 'erp', 'prototyp', 'crypto', 'transport', 'design'], lines: ['Production', 'Checkout · Crypto'], cx: 771, cy: 568, icon: 'factory' },
  // User — at the surface (left box), one centred row
  { seg: 'User', kw: ['ue', 'endpoint', 'consumer', 'handheld'], lines: ['Handheld UE'], cx: 130, cy: 518, icon: 'person' },
  { seg: 'User', kw: ['vsat'], lines: ['VSAT'], cx: 249, cy: 518, icon: 'vsat' },
  { seg: 'User', kw: ['iot'], lines: ['IoT (NB-IoT-NTN)'], cx: 368, cy: 518, icon: 'iot' },
]

/**
 * Trust boundaries. Ground↔Space is the horizontal interface above the Ground box;
 * User↔Ground is the vertical divider, labelled *below* the two surface boxes.
 * (The horizontal User↔Space "direct" interface above the User box is rendered separately.)
 */
export const TBS: TbDef[] = [
  { id: 'tb-Ground-Space', labId: 'lab-gs', a: 'Ground', b: 'Space', label: 'Ground ↔ Space', x1: 486, y1: 402, x2: 936, y2: 402, lx: 711, ly: 402 },
  { id: 'tb-User-Ground', labId: 'lab-ug', a: 'User', b: 'Ground', label: 'User ↔ Ground', x1: 480, y1: 418, x2: 480, y2: 628, lx: 480, ly: 402 },
]

/** The horizontal User↔Space direct interface (above the User box; bypasses Ground). */
export const TB_DIRECT = { id: 'tb-User-Space', label: 'User ↔ Space', x1: 24, y1: 402, x2: 470, y2: 402, lx: 249, ly: 402 }

/**
 * Physical links. Each is its own beam tied to its endpoint assets (`endpoints`) so it lights only
 * when a selected threat actually hits one of its ends — not the whole segment. Every user terminal
 * has its own service link to the Service sat, routed orthogonally (right-angle, like TT&C→BUS) up to
 * three parallel risers just under the satellite. Labels render as boxed chips carrying the per-link
 * interface name (NR-Uu for NR terminals, NB-IoT-NTN for the IoT terminal).
 */
export const BEAMS: BeamDef[] = [
  { id: 'beam-isl', kind: 'isl', x1: 189, y1: 100, x2: 771, y2: 100, label: 'ISL', lx: 480, ly: 78, endpoints: ['service satellite', 'feeder'] },
  // anchored on their ground endpoint (Gateway / TT&C) so they light only when that node is actually
  // hit — not for any Ground+Space threat — then gated on Space so they reach the sat only in scope
  { id: 'beam-feeder', kind: 'feeder', x1: 830, y1: 446, x2: 830, y2: 140, label: 'feeder · SRI', lx: 830, ly: 248, endpoints: ['gateway'], gate: 'Space' },
  { id: 'beam-tc', kind: 'telecommand', x1: 592, y1: 446, x2: 400, y2: 224, label: 'TT&C · TC/TM', lx: 496, ly: 248, path: 'M592,446 L592,248 L400,248 L400,224', endpoints: ['ttc'], gate: 'Space' },
  // Collector-bus service link. Each terminal taps straight up into the rail; one riser leaves the rail
  // (left end, under the sat) up to the Service sat. The rail is SPLIT at each column so a terminal only
  // lights the span it actually travels to reach the riser: rail1 (UE↔VSAT) carries VSAT+IoT, rail2
  // (VSAT↔IoT) carries only IoT. Taps light per-terminal; the riser carries any terminal (User↔Space).
  { id: 'beam-service', kind: 'service', x1: 130, y1: 484, x2: 130, y2: 456, label: 'service · NR-Uu', lx: 216, ly: 248, endpoints: ['ue'], gate: 'Space' },
  { id: 'beam-service-vsat', kind: 'service', x1: 249, y1: 484, x2: 249, y2: 456, label: '', lx: 0, ly: 0, endpoints: ['vsat'], gate: 'Space' },
  { id: 'beam-service-iot', kind: 'service', x1: 368, y1: 484, x2: 368, y2: 456, label: 'IoT · NB-IoT-NTN', lx: 216, ly: 276, endpoints: ['iot'], gate: 'Space' },
  // drawn right→left so the marching-dash flow runs from the terminals toward the riser (toward the sat)
  { id: 'beam-service-rail1', kind: 'service', x1: 249, y1: 456, x2: 130, y2: 456, label: '', lx: 0, ly: 0, endpoints: ['vsat', 'iot'], gate: 'Space' },
  { id: 'beam-service-rail2', kind: 'service', x1: 368, y1: 456, x2: 249, y2: 456, label: '', lx: 0, ly: 0, endpoints: ['iot'], gate: 'Space' },
  { id: 'beam-service-riser', kind: 'service', x1: 130, y1: 456, x2: 130, y2: 151, label: '', lx: 0, ly: 0, crosses: ['User', 'Space'] },
]

/** Earth limb — its top arc sits behind the bottom of the surface boxes (fills the base, no dead space). */
export const EARTH = { cx: 480, cy: 2014, r: 1400 }

/** A few fixed stars for the space backdrop (deterministic, so SSR/tests stay stable). */
export const STARS: { x: number; y: number; r: number; o: number }[] = [
  { x: 90, y: 90, r: 1, o: 0.6 }, { x: 430, y: 70, r: 0.7, o: 0.4 }, { x: 250, y: 250, r: 1.3, o: 0.7 },
  { x: 630, y: 80, r: 0.8, o: 0.5 }, { x: 720, y: 250, r: 1, o: 0.7 }, { x: 616, y: 300, r: 0.7, o: 0.5 },
  { x: 660, y: 200, r: 1.2, o: 0.6 }, { x: 120, y: 300, r: 0.8, o: 0.5 }, { x: 900, y: 240, r: 1, o: 0.6 },
  { x: 100, y: 190, r: 0.7, o: 0.4 }, { x: 470, y: 320, r: 0.8, o: 0.45 }, { x: 300, y: 330, r: 0.7, o: 0.4 },
  { x: 790, y: 320, r: 0.9, o: 0.5 }, { x: 210, y: 96, r: 0.7, o: 0.4 }, { x: 160, y: 160, r: 0.9, o: 0.5 },
  { x: 905, y: 320, r: 0.7, o: 0.4 }, { x: 380, y: 300, r: 0.8, o: 0.45 }, { x: 905, y: 150, r: 0.8, o: 0.45 },
]

/** segment accent CSS variable per band key */
export const SEG_VAR: Record<string, string> = {
  'Human Resources': 'var(--sh)', Space: 'var(--ss)', Ground: 'var(--sg)', User: 'var(--su)',
}

/**
 * Options for the custom-threat builder's affected-asset picker.
 * `label` is shown on the chip; `token` is what goes into the A string — chosen so it
 * contains the keywords the engine uses (segment glow + lifecycle derivation).
 */
export interface AssetOption { label: string; token: string }
export const PICK_SEGMENTS = ['User', 'Ground', 'Space', 'Human Resources'] as const
export const ASSET_OPTIONS: Record<string, AssetOption[]> = {
  User: [
    { label: 'Handheld UE', token: 'Handheld UE' },
    { label: 'VSAT', token: 'VSAT' },
    { label: 'IoT (NB-IoT-NTN)', token: 'IoT (NB-IoT-NTN)' },
  ],
  Ground: [
    { label: 'NTN Gateway / SAN', token: 'NTN Gateway / SAN' },
    { label: 'TT&C (SLE/SDL)', token: 'TTC Ground (SLE/SDL)' },
    { label: 'Satellite Control Centre', token: 'Satellite Control Centre' },
    { label: '5G / 6G Core', token: '5G / 6G Core network' },
    { label: 'Production / Assembly / Checkout', token: 'Production, Assembly, Checkout, Crypto, Simulators' },
  ],
  Space: [
    { label: 'Service satellite (gNB)', token: 'Service satellite (gNB-DU)' },
    { label: 'Feeder satellite', token: 'Feeder satellite' },
    { label: 'HAPS / UAS', token: 'HAPS / UAS' },
    { label: 'BUS (CDHS/COM)', token: 'BUS (CDHS/COM)' },
    { label: 'Payload (PDHS/PLCOM)', token: 'Payload (PDHS/PLCOM)' },
    { label: 'EPS / AOCS / RTOS', token: 'EPS / AOCS / RTOS' },
  ],
  'Human Resources': [],
}
