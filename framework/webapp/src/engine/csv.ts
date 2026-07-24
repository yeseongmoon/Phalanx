import type { Threat, Result, Mapping } from './types'
import { LIFE, ECAT } from './algorithm'

function csvCell(s: unknown): string {
  // collapse any embedded line breaks to a single space so every cell is one line
  // (otherwise Excel turns on "Wrap Text" only for those cells — inconsistent look)
  const v = String(s ?? '').replace(/\s*[\r\n]+\s*/g, ' ').trim().replace(/"/g, '""')
  return '"' + v + '"'
}

export function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let f = '', row: string[] = [], q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++ } else q = false }
      else f += c
    } else {
      if (c === '"') q = true
      else if (c === ',') { row.push(f); f = '' }
      else if (c === '\n') { row.push(f); rows.push(row); row = []; f = '' }
      else if (c !== '\r') f += c
    }
  }
  if (f.length || row.length) { row.push(f); rows.push(row) }
  return rows
}

/** Full tuple table in the schema build_tuple_workbook.py emits (opens in Excel). */
export function threatsToCSV(threats: Threat[], run: (t: Threat) => Result): string {
  const H = ['ID', 'Threat cluster', 'ENISA_Threat', 'E (category)', 'CIA', 'L (lifecycle)',
    'S (segments)', 'A (affected assets)', 'TB (trust boundaries)', 'Pre', 'TTP', 'CM', 'I', 'Conf',
    'Evidence', 'Threat Description (ENISA)', 'Notes', 'Mapping (JSON)']
  const lines = [H.map(csvCell).join(',')]
  for (const t of threats) {
    const r = run(t)
    const L = '{' + r.L.map((p) => p + ':' + LIFE[p]).join(',') + '}'
    lines.push([t.id, t.cluster, t.name, t.E + ' / ' + (ECAT[t.E] || ''), t.cia, L,
      r.segs.join('; '), t.A, r.tb.join(' ; '),
      t.pre || '', t.ttp || '', t.cm || '', t.impact || '', t.conf || '', t.evidence || '', t.desc || '',
      t.custom ? 'analyst-added' : (t.note || ''),
      // last column carries the structured Pass-2 record verbatim, so the rich Details view
      // survives an export→load round-trip (the readable columns above are for humans/Excel)
      t.map ? JSON.stringify(t.map) : ''].map(csvCell).join(','))
  }
  return '﻿' + lines.join('\r\n')
}

/** Parse a CSV in that schema back into threats (for the Load button). */
export function rowsToThreats(rows: string[][]): Threat[] {
  const H = rows[0].map((s) => (s || '').trim())
  const at = (n: string) => H.indexOf(n)
  const iId = at('ID'), iC = at('Threat cluster'), iN = at('ENISA_Threat'), iE = at('E (category)')
  const iCIA = at('CIA'), iA = at('A (affected assets)')
  const iPre = at('Pre'), iTTP = at('TTP'), iCM = at('CM'), iI = at('I'), iConf = at('Conf'), iEv = at('Evidence')
  const iMap = at('Mapping (JSON)')
  const iD = H.findIndex((x) => x.startsWith('Threat Description'))
  if (iN < 0 || iA < 0) throw new Error('expected columns ENISA_Threat and A (affected assets)')
  const cell = (r: string[], i: number) => (i >= 0 ? (r[i] || '').trim() : '')
  // restore the structured Pass-2 record from the JSON column (rich Details survive round-trips)
  const parseMap = (r: string[]): Mapping | undefined => {
    const s = cell(r, iMap)
    if (!s) return undefined
    try { const m = JSON.parse(s); return m && Array.isArray(m.ttp) ? m : undefined } catch { return undefined }
  }
  return rows.slice(1)
    .filter((r) => r.length > 1 && (r[iN] || '').trim())
    .map((r, k) => ({
      id: ((iId >= 0 && r[iId]) || 'L' + (k + 1)).trim(),
      cluster: (r[iC] || '').trim(),
      name: (r[iN] || '').trim(),
      E: (((r[iE] || '').split('/')[0]) || '').trim(),
      cia: (r[iCIA] || '').trim(),
      A: (r[iA] || '').trim(),
      pre: cell(r, iPre) || undefined,
      ttp: cell(r, iTTP) || undefined,
      cm: cell(r, iCM) || undefined,
      impact: cell(r, iI) || undefined,
      conf: cell(r, iConf) || undefined,
      evidence: cell(r, iEv) || undefined,
      map: parseMap(r),
      desc: iD >= 0 ? (r[iD] || '').trim() : '',
      note: 'loaded from CSV',
    }))
}

export function download(filename: string, text: string, type = 'text/csv;charset=utf-8') {
  const blob = new Blob([text], { type })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}
