# -*- coding: utf-8 -*-
"""
gen_data.py -- Python owns the threat model. This emits, from the xlsx:
  src/data/threats.json       -- the 58 ENISA threats (id, cluster, name, E, cia, A, desc)
  test/parity-fixture.json    -- the Python engine's output per threat (segs, L, rules),
                                 used by the vitest parity test to keep the TS engine honest.

Run from framework/webapp:  ../pptenv/bin/python scripts/gen_data.py
(or point --xlsx / --engine at the framework dir).
"""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
WEBAPP = os.path.dirname(HERE)
FRAMEWORK = os.path.dirname(WEBAPP)
sys.path.insert(0, FRAMEWORK)                       # import ntn_threat_algorithm
import ntn_threat_algorithm as ENG
from openpyxl import load_workbook

XLSX = os.path.join(FRAMEWORK, "enisa_threats_tuple.xlsx")
ws = load_workbook(XLSX, data_only=True)["Tuples"]
threats = []
for r in range(2, ws.max_row + 1):
    if not ws.cell(r,1).value: continue
    threats.append({
        "id": ws.cell(r,1).value, "cluster": ws.cell(r,2).value or "",
        "name": ws.cell(r,3).value or "", "E": (ws.cell(r,4).value or "").split("/")[0].strip(),
        "cia": ws.cell(r,5).value or "", "A": ws.cell(r,8).value or "",
        "desc": ws.cell(r,15).value or "",
    })

fixture = {}
for r in ENG.run(ENG.load_rows(XLSX)):
    fixture[r["id"]] = {"segs": r["dS"], "L": r["dL"], "rules": r["rules"],
                        "nature": r["nature"], "arm": ("N/A" if r["arm"].startswith("N/A") else "SPARTA"),
                        "prim": r["prim"], "tb": r["dTB"]}

os.makedirs(os.path.join(WEBAPP, "src", "data"), exist_ok=True)
os.makedirs(os.path.join(WEBAPP, "test"), exist_ok=True)
json.dump(threats, open(os.path.join(WEBAPP,"src","data","threats.json"),"w",encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(fixture, open(os.path.join(WEBAPP,"test","parity-fixture.json"),"w",encoding="utf-8"), ensure_ascii=False, indent=1)
print("threats.json:", len(threats), "| parity-fixture.json:", len(fixture))
