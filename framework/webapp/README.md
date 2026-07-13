# PHALANX

**Crosswalking the ENISA Space Threat Landscape and SPARTA into one line of defense for 6G NTN.**

PHALANX is an interactive threat-modeling tool for 6G Non-Terrestrial Networks. It turns each
ENISA space threat into a structured 10-element tuple and runs a two-pass algorithm — an **ENISA**
pass (*what & where*) that derives segments, trust boundaries and lifecycle from the affected
assets, and a **SPARTA** pass (*how*) that maps attacker techniques and countermeasures — over a
6G NTN reference architecture you can see light up.

> Tuple `TR = ⟨L, S, A, TB, E, Pre, TTP, CM, I, Conf⟩` · React + Vite + TypeScript · dark theme.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
```

| script | what it does |
|---|---|
| `npm run dev` | Vite dev server (hot reload) |
| `npm run build` | typecheck + production build to `dist/` |
| `npm run preview` | serve the production build |
| `npm run test` | **parity test** (TS engine == Python) + render smoke test |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run gen:sparta` | rebuild `src/data/sparta.json` from the vendored SPARTA STIX bundle |
| `npm run gen:enisa` | rebuild `src/data/enisa_controls.json` from the vendored ENISA workbook (needs `openpyxl`) |

## The two passes

1. **ENISA — what & where.** From the affected-asset set `A`, Pass 1 derives segments `S`,
   trust boundaries `TB`, and lifecycle phases `L`; the cluster sets the ENISA category `E`.
   The **precondition** `Pre` is the state→action bridge (rule R3) that links the two passes.
2. **SPARTA — how.** Pass 2 classifies via decision rules R1–R10 and maps the attacker technique
   chain `TTP`, countermeasures `CM`, and impact `I`. A searchable picker builds the `IA → EX → IMP`
   chain from real SPARTA technique IDs and **auto-suggests the countermeasures SPARTA maps to them**.

The result card colour-codes the five load-bearing elements (`A · S · E · TTP · CM`) and keeps the
supporting five (`L · TB · Pre · I · Conf`) legible in white.

## Dual-framework mitigation (SPARTA + ENISA)

Countermeasures come from **both** sources:
- **SPARTA countermeasures** — tactical, mapped to the specific techniques you pick.
- **ENISA controls** — strategic, mapped to the threat and each traceable to ISO 27001 / NIST
  CSF & IRs / NIS2 / NASA BPG / BSI / METI. ENISA controls are ranked so that the ones whose theme
  overlaps your chosen techniques' SPARTA countermeasures (`⚡ TTP`) surface first.

## The engine is single-source, verified

`src/engine/algorithm.ts` is a line-for-line port of the reference Python engine.
`test/parity.test.ts` runs it over all 58 ENISA threats and compares segments, lifecycle, rules,
nature, arm, primary rule, and trust boundaries against a fixture the Python engine produced — so
the two can never silently drift.

## Data & attribution

Third-party datasets are vendored under `scripts/vendor/` and compiled to compact JSON in `src/data/`:

- **SPARTA** — Space Attack Research & Tactic Analysis, © The Aerospace Corporation.
  STIX 2.1 bundle from <https://sparta.aerospace.org/download/STIX?f=latest> (v3.2).
- **ENISA Space Threat Landscape — Control Framework**, © ENISA.
  From <https://github.com/enisaeu/Space-Threat-Landscape> (`Control Framework.xlsx`).

Please observe the respective sources' terms when redistributing their data.

## Structure

```
src/
  engine/       algorithm.ts (canonical) · types.ts · ui.ts · csv.ts · architecture.ts (SVG geometry)
  components/   TopBar · Architecture · ThreatList · ResultCard · Builder · SpartaPicker
  data/         threats.json · sparta.json · enisa_controls.json   (generated)
  App.tsx       state + layout
scripts/        gen_sparta.py · gen_enisa_controls.py · gen_data.py · vendor/ (pinned sources)
test/           parity.test.ts · render.test.tsx · parity-fixture.json
```
