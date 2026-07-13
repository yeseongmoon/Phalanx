#!/usr/bin/env python3
"""Generate a compact SPARTA dataset for the webapp from the official STIX 2.1 bundle.

Source (authoritative): The Aerospace Corporation — SPARTA.
  Download API:  https://sparta.aerospace.org/download/STIX?f=latest
  Docs:          https://sparta.aerospace.org/resources/working-with

The STIX bundle is the most granular representation of SPARTA; every other
representation is derived from it. We extract:
  - techniques      (attack-pattern)      -> {id, name, tactic}
  - countermeasures (course-of-action)    -> {id, name}
  - mitigations     (related-to: CoA->AP) -> { techniqueId: [countermeasureId...] }

Run:  ../../pptenv/bin/python scripts/gen_sparta.py
Writes: src/data/sparta.json
"""
import json, os, sys, urllib.request, collections

URL = "https://sparta.aerospace.org/download/STIX?f=latest"
OUT = os.path.join(os.path.dirname(__file__), "..", "src", "data", "sparta.json")
# pinned copy vendored into the repo so the build is reproducible without network
VENDOR = os.path.join(os.path.dirname(__file__), "vendor", "sparta_data_v3.2.json")

# SPARTA kill-chain (tactic) order — attacker left-to-right
TACTIC_ORDER = [
    "Reconnaissance", "Resource Development", "Initial Access", "Execution",
    "Persistence", "Defense Evasion", "Lateral Movement", "Exfiltration", "Impact",
]


def sparta_id(o):
    for r in o.get("external_references", []):
        if r.get("source_name") == "sparta":
            return r.get("external_id")
    return None


def load_stix():
    local = sys.argv[1] if len(sys.argv) > 1 else (VENDOR if os.path.exists(VENDOR) else None)
    if local and os.path.exists(local):
        print(f"reading vendored/local STIX: {local}")
        data = json.load(open(local))
        data.setdefault("_filename", os.path.basename(local))
        return data
    print(f"downloading STIX: {URL}")
    with urllib.request.urlopen(URL, timeout=120) as r:
        fname = ""
        cd = r.headers.get("content-disposition", "")
        if "filename=" in cd:
            fname = cd.split("filename=")[-1].strip()
        data = json.loads(r.read())
        data["_filename"] = fname
        return data


def main():
    d = load_stix()
    objs = d["objects"]
    byid = {o["id"]: o for o in objs}

    techniques, countermeasures = [], []
    tech_ok, cm_ok = set(), set()
    for o in objs:
        sid = sparta_id(o)
        if not sid:
            continue
        if o["type"] == "attack-pattern":
            tac = ""
            for k in o.get("kill_chain_phases", []):
                if k.get("kill_chain_name") == "sparta":
                    tac = k.get("phase_name", "")
            techniques.append({"id": sid, "name": o.get("name", ""), "tactic": tac})
            tech_ok.add(o["id"])
        elif o["type"] == "course-of-action" and sid != "CM-NA":
            countermeasures.append({"id": sid, "name": o.get("name", "")})
            cm_ok.add(o["id"])

    # technique -> [countermeasure] via related-to (course-of-action -> attack-pattern)
    mapping = collections.defaultdict(set)
    for o in objs:
        if o.get("type") != "relationship" or o.get("relationship_type") != "related-to":
            continue
        s, t = byid.get(o["source_ref"]), byid.get(o["target_ref"])
        if not s or not t:
            continue
        if s["type"] == "course-of-action" and t["type"] == "attack-pattern" \
                and s["id"] in cm_ok and t["id"] in tech_ok:
            mapping[sparta_id(t)].add(sparta_id(s))

    techniques.sort(key=lambda x: (TACTIC_ORDER.index(x["tactic"]) if x["tactic"] in TACTIC_ORDER else 99, x["id"]))
    countermeasures.sort(key=lambda x: x["id"])
    out = {
        "meta": {
            "source": "SPARTA (The Aerospace Corporation)",
            "file": d.get("_filename", "sparta_data STIX 2.1"),
            "url": URL,
        },
        "tactics": TACTIC_ORDER,
        "techniques": techniques,
        "countermeasures": countermeasures,
        "map": {k: sorted(v) for k, v in sorted(mapping.items())},
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump(out, open(OUT, "w"), ensure_ascii=False, separators=(",", ":"))
    print(f"techniques={len(techniques)} countermeasures={len(countermeasures)} "
          f"mapped_techniques={len(mapping)} -> {os.path.relpath(OUT)}")
    # sanity: the 6 Impact-tactic techniques (should be the SPARTA impact outcomes)
    imp = [t["name"] for t in techniques if t["tactic"] == "Impact"]
    print("Impact-tactic techniques:", imp)


if __name__ == "__main__":
    main()
