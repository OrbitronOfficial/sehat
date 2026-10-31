"""Scores the saved extraction of the five sample documents against what was printed on them.

The ground truth below is the content tools/make_samples.py draws. The readings scored are
the ones in data/demo.json, produced by tools/build_demo.py through the real pipeline.
This measures clean, printed, synthetic documents only. It says nothing about photos of
real paper or about handwriting.

Run: python tools/benchmark.py
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import ranges  # noqa: E402

# per document: type, date, tests as (name fragment, value, expected flag), medicines as
# (name fragment, strength fragment, frequency fragment), diagnoses as name fragments
TRUTH = {
    "/samples/lab-2026-03.png": {
        "type": "lab_report", "date": "2026-03-12",
        "tests": [("hba1c", 8.4, "high"), ("fasting", 168, "high"), ("total cholesterol", 236, "high"),
                  ("ldl", 152, "high"), ("hdl", 38, "low"), ("triglycerides", 214, "high"),
                  ("hemoglobin", 13.8, "normal"), ("creatinine", 0.9, "normal"), ("tsh", 2.1, "normal"),
                  ("vitamin d", 14, "low")],
        "meds": [], "dx": []},
    "/samples/prescription-2026-03.png": {
        "type": "prescription", "date": "2026-03-14", "tests": [],
        "meds": [("glycomet", "500", "morning and night"), ("atorva", "10", "night"), ("uprise", "60", "week")],
        "dx": ["diabetes", "dyslipidemia", "vitamin d"]},
    "/samples/lab-2026-06.png": {
        "type": "lab_report", "date": "2026-06-18",
        "tests": [("hba1c", 7.6, "high"), ("fasting", 142, "high"), ("total cholesterol", 198, "normal"),
                  ("ldl", 118, "high"), ("hdl", 41, "normal"), ("triglycerides", 176, "high"),
                  ("creatinine", 0.9, "normal"), ("vitamin d", 26, "low")],
        "meds": [], "dx": []},
    "/samples/discharge-2026-08.png": {
        "type": "discharge_summary", "date": "2026-08-08",
        "tests": [("lowest", 68000, "low"), ("at discharge", 142000, "low"), ("hemoglobin", 14.6, "normal"),
                  ("wbc", 3400, "low"), ("sgpt", 88, "high"), ("ns1", "positive", "unknown")],
        "meds": [("dolo", "650", "needed"), ("pan", "40", "morning"), ("glycomet", "500", "morning and night")],
        "dx": ["dengue", "diabetes"]},
    "/samples/lab-2026-09.png": {
        "type": "lab_report", "date": "2026-09-22",
        "tests": [("hba1c", 6.9, "high"), ("fasting", 118, "high"), ("total cholesterol", 172, "normal"),
                  ("ldl", 96, "normal"), ("hdl", 44, "normal"), ("triglycerides", 148, "normal"),
                  ("hemoglobin", 14.1, "normal"), ("platelet", 2.4, "normal"), ("creatinine", 1.0, "normal"),
                  ("vitamin d", 34, "normal")],
        "meds": [], "dx": []},
}


def find(items, fragment, key="name"):
    names = [(str(x.get(key) or "").lower(), x) for x in items]
    # "hemoglobin" must not pick "HbA1c (Glycated Hemoglobin)": a name that starts with it wins
    return next((x for n, x in names if n.startswith(fragment)), None) or next((x for n, x in names if fragment in n), None)


def main():
    with open(os.path.join(ROOT, "data", "demo.json"), encoding="utf-8") as f:
        records = {r.get("file_url"): r for r in json.load(f)["records"]}
    score = {}

    def mark(field, ok):
        hit, total = score.get(field, (0, 0))
        score[field] = (hit + bool(ok), total + 1)

    for url, truth in TRUTH.items():
        rec = records.get(url) or {}
        mark("Document type", rec.get("doc_type") == truth["type"])
        mark("Document date", rec.get("date") == truth["date"])
        for name, value, flag in truth["tests"]:
            t = find(rec.get("tests") or [], name)
            mark("Test found", t)
            got = ranges.to_number(t.get("value")) if t else None
            want = value if isinstance(value, str) else float(value)
            mark("Test value", t and (got == want if not isinstance(value, str) else str(t.get("value")).lower() == value))
            mark("Flag (set by code)", t and t.get("flag") == flag)
        for name, strength, freq in truth["meds"]:
            m = find(rec.get("medicines") or [], name)
            mark("Medicine found", m)
            mark("Medicine strength", m and strength in str(m.get("strength") or m.get("name") or ""))
            mark("Medicine frequency", m and freq in str(m.get("frequency") or "").lower())
        for name in truth["dx"]:
            mark("Diagnosis found", find(rec.get("diagnoses") or [], name))
        extra = len(rec.get("tests") or []) - len(truth["tests"])
        mark("No invented tests", extra <= 0)

    hit = sum(h for h, _ in score.values())
    total = sum(t for _, t in score.values())
    print("| Field | Correct |\n|---|---|")
    for field, (h, t) in score.items():
        print(f"| {field} | {h} of {t} |")
    print(f"| **All fields** | **{hit} of {total}** |")


if __name__ == "__main__":
    main()
