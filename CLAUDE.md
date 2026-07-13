# PHALANX — project context for Claude Code

PHALANX is an interactive threat-modeling tool for **6G Non-Terrestrial Networks** that
**crosswalks the ENISA Space Threat Landscape (what/where) and SPARTA (how) into one model**.
Each ENISA threat becomes a 10-element tuple and runs a two-pass algorithm over a 6G NTN
reference architecture.

Tuple: `TR = ⟨ L, S, A, TB, E, Pre, TTP, CM, I, Conf ⟩`
- **ENISA pass (Pass 1):** from affected assets `A`, derive segments `S`, trust boundaries `TB`,
  lifecycle `L`; cluster sets category `E`.
- **Bridge:** `Pre` (precondition) is the state→action link (rule R3).
- **SPARTA pass (Pass 2):** classify via rules R1–R10; map technique chain `TTP`, countermeasures
  `CM`, impact `I`. `Conf` is a record-level confidence annotation.

## Where things live

- `framework/webapp/` — **the app** (React + Vite + TypeScript). Work here for anything UI/tool.
  - `src/engine/algorithm.ts` — **canonical engine**, a line-for-line port of the Python reference.
  - `src/engine/` — also `types.ts`, `ui.ts`, `csv.ts`, `architecture.ts` (SVG geometry).
  - `src/components/` — `TopBar`, `Architecture`, `Builder`, `SpartaPicker`, `ResultCard`, `ThreatList`.
  - `src/data/` — **generated**: `threats.json`, `sparta.json`, `enisa_controls.json`.
  - `scripts/` — data generators + `vendor/` (pinned SPARTA STIX + ENISA workbook).
  - `test/` — `parity.test.ts` (TS engine == Python fixture, all 58 threats) + `render.test.tsx`.
- `framework/ntn_threat_algorithm.py` — **reference Python engine** (source of truth for parity).
- `framework/build_tuple_workbook.py`, `framework/enisa_threats_tuple.xlsx/.csv` — data pipeline.

## Commands (run inside `framework/webapp/`)

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc --noEmit + vite build
npm run test       # parity + render tests (expect all passing)
npm run typecheck
npm run gen:sparta # rebuild src/data/sparta.json from vendored SPARTA STIX
npm run gen:enisa  # rebuild src/data/enisa_controls.json from vendored ENISA workbook (needs openpyxl)
```

Always run `npx tsc --noEmit && npm test` after changes; keep the 60-test suite green.

## Conventions & invariants

- **Single-source engine.** `algorithm.ts` is the only engine; the Python-parity test guarantees the
  two never drift (it once caught a trust-boundary string drift — the HR boundary must read exactly
  `Human Resources <-> technical segment (organizational boundary)`). If you touch either engine,
  run `npm run gen` (needs the framework Python env) and `npm run test`.
- **No fabrication.** Every threat/technique/control/countermeasure must trace to a reliable source
  (ENISA, SPARTA, NIST/ISO/NIS2, …). Do not invent IDs, mappings, or values; cite the source.
- **Dual-framework mitigation.** `CM` draws from SPARTA countermeasures (technique-mapped, from the
  STIX dataset) *and* ENISA controls (threat-mapped, standards-traceable). ENISA controls are ranked
  by TTP-theme overlap; the bridge is grounded in ENISA's own SPARTA-analysis sheet.
- **Dark theme**, CSS custom properties in `src/styles.css`. Result-card colors: top-5 tuple elements
  (`A·S·E·TTP·CM`) carry unique accents; the rest stay white/legible.

## Data sources (vendored under `framework/webapp/scripts/vendor/`)

- **SPARTA** © The Aerospace Corporation — STIX 2.1, `https://sparta.aerospace.org/download/STIX?f=latest` (v3.2).
- **ENISA Space Threat Landscape — Control Framework** © ENISA — `https://github.com/enisaeu/Space-Threat-Landscape`.

Note: the repo excludes the virtualenv, `node_modules`, research papers, and the `references/` PDF
library. Session history/memory is per-machine (`~/.claude/`), not in the repo — this file is the
portable project context.
