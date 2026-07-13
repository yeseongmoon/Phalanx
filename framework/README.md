# 6G NTN Threat-Modeling Framework — Algorithm 1 (ENISA × SPARTA)

A reproducible pipeline that turns ENISA threat data into structured, rule-classified
threat records via the integrated-tuple algorithm.

```
enisa_threats_tuple.xlsx  ──►  python ntn_threat_algorithm.py <table>  ──►  report
       (tuple input)                    (Algorithm 1)                    (deterministic result)
```

The tuple: **TR = ⟨ L, S, A, TB, E, Pre, TTP, CM, I, Conf ⟩**

## Files

| file | what it is |
|---|---|
| `enisa_threats_tuple.xlsx` / `.csv` | **Input.** All **58 ENISA threats**, one per row, with the ENISA-side fields (Cluster, Threat, Description, E, CIA, A) and the derived fields (S, TB, L). `Pre, TTP, CM, I, Conf` are **blank** — the analyst fills the SPARTA/TTP mapping. |
| `ntn_threat_algorithm.py` | **Engine.** Reads the table, runs Algorithm 1 (two passes + audit), prints the report. `python ntn_threat_algorithm.py enisa_threats_tuple.xlsx` |
| `build_tuple_workbook.py` | Regenerates the workbook by joining the analyst sheet with the sourced affected-assets. |
| `report.txt` | Example output. |

## Data provenance (no fabrication)

- **Threat cluster, threat name, description** come from the analyst's authoritative sheet
  `ENISA Dataset Threat Mapping.xlsx` (sheet "ENISA space threat", 58 rows) — the source of truth
  for *which* threats and their clustering.
- **CIA** and **Affected Assets A** are transcribed from the **ENISA *Space Threat Landscape*
  report (March 2025)**, Annex C "Space Threat Taxonomy" (Table 17, pp. 85–95), with the 7-phase
  lifecycle model from §2.1 and the segment taxonomy from §3. Source PDF:
  `references/Space_Threat_Landscape_Report_fin.pdf` (ISBN 978-92-9204-696-5, DOI 10.2824/8841206).
- **5 rows** are flagged in the `Notes` column where the PDF layout was ambiguous — their
  affected-asset *text* is a best-effort transcription (the *segments* are reliable). These are:
  Unauthorized access to recycled/disposed media, Failure of air conditioning or water supply,
  Operating errors, Atmospheric hazards, Failure to maintain information systems.

- **S** (segments) and **TB** (trust boundaries) are **derived from A** (Algorithm 1, Pass 1) and
  are exact.
- **L** (lifecycle) is derived from A via a **documented, Annex-B-grounded keyword→phase model**
  (see `derive_lifecycle`). It is the field most worth refining against Annex B per-asset — it is
  a transparent derivation, not an ENISA per-threat value (ENISA assigns lifecycle to *assets*,
  not threats).

## What the algorithm does

**Pass 1 (ENISA, threat-centric).** The affected-asset SET `A` is the primitive. Derive
`S = segments(A)`, `TB = boundaries between touched segments`, `L = ⋃ asset phases`; and
**validate** them against the stored values (a consistency check — edit `A` and re-run to see it).

**Pass 2 (SPARTA / decision table R1–R10).** Classify each threat's nature and set the TTP arm:

| ENISA category (E) | nature | primary rule | TTP arm |
|---|---|---|---|
| NAA, EIH, PA | adversarial | **R1** | SPARTA TTP expected → *pending* |
| LEI (legacy), ACQ | enabling | **R5** | spawns adversarial chain → *pending* |
| OUT (e.g. "Security services failure") | state/outage | **R3** | **N/A** (kept as precondition) |
| FM, UD | operational/unintentional | **R2** | **N/A** |
| DIS | physical/environmental | **R4** | **N/A** |
| LEG | legal | — | **N/A** |

plus the composable rules: **R6** (1↔many techniques), **R7** (Conf tagging), **R8** (CM linkage),
**R9** (multi-segment footprint → bridging sub-chain), **R10** (multi-lifecycle).
Since the SPARTA columns are blank, TTP/CM/Conf are reported as **PENDING** for adversarial records.

**Post (lines 20–21).** Notes attack-path chaining and the coverage audit (both need the analyst's
`Pre`/`TTP` fields, so they activate after SPARTA mapping).

**Deterministic:** stable ordering, no randomness → identical output every run (verified: xlsx and
csv produce identical reports except the input-filename line).

## The workflow you described

1. **Fill SPARTA** — open the workbook, and for the 30 adversarial records add `Pre`, `TTP`
   (SPARTA v3.2 IDs, e.g. `IA-0007 → EX-0013.01 → IMP-0002/0003`), `CM`, `I`, `Conf`.
2. **Re-run** — the report will show `MAPPED` TTPs, CM crosswalks, and (once Pre is present)
   chained multi-stage attack paths.
3. **Verify** — I review your mapping against the SPARTA primary source.

## Interactive web UI — built (PHALANX)

The engine is intentionally UI-agnostic (pure functions: `derive_segments`, `derive_trust_boundaries`,
`derive_lifecycle`, `classify_nature`, `run`). The interactive tool that wraps it — **PHALANX** — lives
in [`webapp/`](webapp/) (React + Vite + TypeScript). Its `src/engine/algorithm.ts` is a line-for-line
port of this Python engine, guarded by a parity test (`webapp/test/parity.test.ts`) so the CLI result
and the web result can never drift. See [`webapp/README.md`](webapp/README.md).

> The earlier single-file HTML prototypes (`build_app.py`, `render_html.py`, `opt*.html`,
> `threat_flow_app.html`) have been retired in favor of the Vite/React app.

## Coverage

All **58 threats** across the 9 clusters (NAA 23, EIH 8, PA 6, LEG 6, FM 5, UD 4, DIS 2, LEI 2,
OUT 2) — matching the analyst sheet exactly. `E` is set from the analyst's cluster, so the
algorithm's rule classification follows the analyst's clustering (e.g. the analyst places
"Data leaks" under *Legal*, so it is treated as non-adversarial — change the cluster to change the
classification).
