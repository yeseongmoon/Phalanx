/** Static geometry of the 6G NTN reference-architecture SVG (matches the original app). */
export interface AssetDef { seg: string; kw: string[]; lines: string[]; x: number; y: number; w: number; h: number }
export interface BandDef { id: string; key: string; label: string; x: number; y: number; w: number; h: number; icon: string; iconY: number; labY: number }
export interface TbDef { id: string; labId: string; a: string; b: string; y: number; label: string; pillX: number; pillW: number }

export const BANDS: BandDef[] = [
  { id: 'seg-HR', key: 'Human Resources', label: 'HUMAN RESOURCES — personnel · roles', x: 18, y: 16, w: 624, h: 44, icon: 'hr', iconY: 31.5, labY: 44 },
  { id: 'seg-Space', key: 'Space', label: 'SPACE / AIR SEGMENT', x: 18, y: 76, w: 624, h: 178, icon: 'space', iconY: 88.5, labY: 101 },
  { id: 'seg-Ground', key: 'Ground', label: 'GROUND SEGMENT & NETWORK / CORE', x: 18, y: 300, w: 624, h: 182, icon: 'ground', iconY: 312.5, labY: 325 },
  { id: 'seg-User', key: 'User', label: 'USER SEGMENT', x: 18, y: 526, w: 624, h: 132, icon: 'user', iconY: 538.5, labY: 551 },
]

export const ASSETS: AssetDef[] = [
  { seg: 'Space', kw: ['gnb', 'service satellite'], lines: ['Service sat', 'gNB / gNB-DU'], x: 38, y: 112, w: 184, h: 56 },
  { seg: 'Space', kw: ['feeder'], lines: ['Feeder sat'], x: 238, y: 112, w: 184, h: 56 },
  { seg: 'Space', kw: ['haps', 'uas', 'drone'], lines: ['HAPS / UAS'], x: 438, y: 112, w: 184, h: 56 },
  { seg: 'Space', kw: ['bus', 'cdhs', 'com'], lines: ['BUS', 'CDHS / COM'], x: 38, y: 178, w: 184, h: 56 },
  { seg: 'Space', kw: ['payload', 'pdhs', 'plcom', 'udhs'], lines: ['Payload', 'PDHS / PLCOM'], x: 238, y: 178, w: 184, h: 56 },
  { seg: 'Space', kw: ['eps', 'aocs', 'rtos', 'obsw', 'obc'], lines: ['EPS / AOCS', 'RTOS / OBSW'], x: 438, y: 178, w: 184, h: 56 },
  { seg: 'Ground', kw: ['gateway', 'san'], lines: ['NTN Gateway', '/ SAN'], x: 38, y: 336, w: 134, h: 56 },
  { seg: 'Ground', kw: ['ttc', 'tt&c', 'sle', 'sdl'], lines: ['TT&C', 'SLE / SDL'], x: 188, y: 336, w: 134, h: 56 },
  { seg: 'Ground', kw: ['control centre', 'mission control', 'operations centre', 'satellite control'], lines: ['Satellite', 'Control Centre'], x: 338, y: 336, w: 134, h: 56 },
  { seg: 'Ground', kw: ['core', 'network', 'wan', 'mec'], lines: ['5G / 6G Core'], x: 488, y: 336, w: 134, h: 56 },
  { seg: 'Ground', kw: ['production', 'assembly', 'manufactur', 'checkout', 'simulator', 'test', 'egse', 'mgse', 'document management', 'erp', 'prototyp', 'crypto', 'transport', 'design'], lines: ['Production · Assembly · Checkout · Crypto · Simulators', 'design → test · SLE/SDL protocols · transport'], x: 38, y: 406, w: 584, h: 56 },
  { seg: 'User', kw: ['ue', 'endpoint', 'consumer', 'handheld'], lines: ['Handheld UE'], x: 38, y: 566, w: 184, h: 64 },
  { seg: 'User', kw: ['vsat'], lines: ['VSAT'], x: 238, y: 566, w: 184, h: 64 },
  { seg: 'User', kw: ['iot'], lines: ['IoT (NB-IoT-NTN)'], x: 438, y: 566, w: 184, h: 64 },
]

export const TBS: TbDef[] = [
  { id: 'tb-Ground-Space', labId: 'lab-gs', a: 'Ground', b: 'Space', y: 278, label: 'Ground ↔ Space · telecommand link', pillX: 205, pillW: 250 },
  { id: 'tb-User-Ground', labId: 'lab-ug', a: 'User', b: 'Ground', y: 504, label: 'User ↔ Ground / RAN · service link (NR-Uu)', pillX: 180, pillW: 300 },
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
