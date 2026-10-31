"""Runs the real pipeline over the sample documents and saves data/demo.json,
so the "Load full demo profile" button works without spending model calls.

Run: python tools/build_demo.py
"""
import base64
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import server  # noqa: E402  (loads .env)
import pipeline  # noqa: E402

records = []
for s in server.SAMPLES:
    path = os.path.join(ROOT, "public", s["url"].lstrip("/"))
    with open(path, "rb") as f:
        data = base64.b64encode(f.read()).decode()
    rec = pipeline.extract(os.path.basename(path), "image/png", data, source="sample")
    rec["id"] = "rec_demo_" + s["id"].replace("-", "")
    rec["file_url"] = s["url"]
    for lang in ("en", "hi"):
        rec["explanation"][lang] = pipeline.explain(rec, lang)
    flags = [t["flag"] for t in rec["tests"]]
    print(f"{s['id']}: {rec['doc_type']} {rec['date']} by {rec['extracted_by']} | "
          f"{len(rec['tests'])} tests ({sum(f != 'normal' for f in flags)} abnormal), "
          f"{len(rec['medicines'])} meds, {len(rec['diagnoses'])} dx | warnings: {rec['warnings']}")
    records.append(rec)

patient = {"name": "Jay Tawri", "age": "46", "sex": "M", "abha": None}
with open(os.path.join(ROOT, "data", "demo.json"), "w", encoding="utf-8") as f:
    json.dump({"patient": patient, "records": records}, f, ensure_ascii=False, indent=1)
print("saved data/demo.json")
