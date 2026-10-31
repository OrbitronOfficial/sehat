"""The unified health profile, built in code from the saved records. No model is involved.

What this module decides, and how:
- Conditions      one entry per condition; "(newly detected)" and "(known case)" are the same
                  condition seen twice, so they merge, and every original wording is kept.
- Medicines       a prescription is evidence that a medicine was prescribed, not that it is
                  still taken. Nothing here is ever called "current".
- Tests           names are normalised, counts are converted to one unit, and each result
                  carries the date it was observed, so a trend reads in the right order.
- Attention       only the latest result of each test can need attention; earlier abnormal
                  results stay in the history.
- Questions       built from the record history, each tied to the records it came from.
- Cross checks    a short list of well-known medicine/lab combinations worth raising with a
                  doctor. Wording describes; it never instructs.
"""
import datetime as dt
import re

import pipeline
import ranges

DISCLAIMER = {
    "en": "Built by software from your saved records. It can be incomplete or wrong where a document was "
          "misread. It is not a diagnosis, and nothing here is advice to change a medicine.",
    "hi": "यह आपके सहेजे रिकॉर्ड से सॉफ़्टवेयर ने बनाया है। जहाँ कोई दस्तावेज़ ग़लत पढ़ा गया हो वहाँ यह अधूरा या ग़लत "
          "हो सकता है। यह निदान नहीं है, और यहाँ कुछ भी दवा बदलने की सलाह नहीं है।",
}

_QUALIFIERS = re.compile(
    r"\b(newly|recently|freshly)\s+(detected|diagnosed)\b|\bknown\s+case(\s+of)?\b|\bk/c/o\b|\bh/o\b|"
    r"\bhistory\s+of\b|\bold\s+case\b|\bcase\s+of\b|\bon\s+treatment\b", re.I)
_CONDITION_ALIASES = {
    "t2dm": "type 2 diabetes mellitus", "type ii diabetes mellitus": "type 2 diabetes mellitus",
    "type 2 diabetes": "type 2 diabetes mellitus", "type 2 dm": "type 2 diabetes mellitus",
    "diabetes mellitus type 2": "type 2 diabetes mellitus", "htn": "hypertension",
    "high blood pressure": "hypertension", "dyslipidaemia": "dyslipidemia",
}
_UNIT = {"days": 1, "day": 1, "weeks": 7, "week": 7, "months": 30, "month": 30, "years": 365, "year": 365}


def _strip_parens(text):
    return re.sub(r"\s+", " ", re.sub(r"\(.*?\)", " ", text or "")).strip(" ,;-")


def condition_key(name):
    """Canonical form used only to decide that two mentions are the same condition."""
    k = _QUALIFIERS.sub(" ", _strip_parens(name).lower())
    k = re.sub(r"[^a-z0-9 ]+", " ", k)
    k = re.sub(r"\s+", " ", k).strip()
    return _CONDITION_ALIASES.get(k, k)


def _date(value):
    try:
        return dt.date.fromisoformat(str(value)[:10])
    except (TypeError, ValueError):
        return None


def course_end(date, duration):
    """End date of a course written like "5 days" or "3 months". None when it cannot be told."""
    start = _date(date)
    m = re.search(r"(\d+)\s*(day|days|week|weeks|month|months|year|years)\b", str(duration or "").lower())
    if not start or not m:
        return None
    return start + dt.timedelta(days=int(m.group(1)) * _UNIT[m.group(2)])


def follow_up_due(date, text):
    """Due date of a written follow-up ("after 3 months"). Months and years count by the calendar
    (14 Mar + 3 months = 14 Jun), the same as the app's Visits view; days and weeks by count."""
    start = _date(date)
    m = re.search(r"(\d+)\s*(day|days|week|weeks|month|months|year|years)\b", str(text or "").lower())
    if not start or not m:
        return None
    n, unit = int(m.group(1)), m.group(2)
    if unit.startswith(("day", "week")):
        return start + dt.timedelta(days=n * _UNIT[unit])
    months = n * (12 if unit.startswith("year") else 1)
    y, mo = divmod(start.month - 1 + months, 12)
    y, mo = start.year + y, mo + 1
    last = (dt.date(y + (mo == 12), mo % 12 + 1, 1) - dt.timedelta(days=1)).day
    return dt.date(y, mo, min(start.day, last))


def observed_date(test_name, record_date):
    """A discharge summary may print several results of one test: "Platelet Count (05/08, lowest)".
    The date inside the name is when that result was observed; otherwise it is the document date."""
    doc = _date(record_date)
    m = re.search(r"\((?:[^)]*?)(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?", test_name or "")
    if m and doc:
        year = int(m.group(3)) if m.group(3) else doc.year
        year += 2000 if year < 100 else 0
        try:
            seen = dt.date(year, int(m.group(2)), int(m.group(1)))
            if seen <= doc + dt.timedelta(days=1):
                return seen, True
        except ValueError:
            pass
    return doc, False


def _conditions(records):
    out = {}
    for rec in records:
        for d in rec.get("diagnoses") or []:
            text = pipeline._s(d.get("name") if isinstance(d, dict) else d, 160)
            key = condition_key(text) if text else ""
            if not key:
                continue
            entry = out.setdefault(key, {"name": _strip_parens(_QUALIFIERS.sub(" ", text)) or text,
                                         "first_seen": rec.get("date"), "mentions": []})
            entry["mentions"].append({"text": text, "date": rec.get("date"), "record": rec.get("id")})
    return list(out.values())


def _medicines(records, today):
    out = {}
    for rec in records:
        for m in rec.get("medicines") or []:
            name = pipeline._s(m.get("name"), 100)
            if not name:
                continue
            entry = pipeline._find_medicine(m.get("generic")) or pipeline._find_medicine(name)
            key = entry["id"] if entry else re.sub(r"[^a-z0-9]+", " ", name.lower()).strip()
            ends = course_end(rec.get("date"), m.get("duration"))
            item = {k: m.get(k) for k in ("generic", "strength", "dose", "frequency", "timing", "duration")}
            item.update({
                "name": name, "date": rec.get("date"), "record": rec.get("id"),
                "ends": ends.isoformat() if ends else None,
                # never "current": either the written course is over, or we simply do not know
                "status": "course_ended" if ends and ends < today else "unconfirmed",
                "ingredient": re.sub(r"\s*\(.*?\)", "", entry["generic"]) if entry else None,
                "_entry": entry, "mentions": out[key]["mentions"] + 1 if key in out else 1,
            })
            out[key] = item  # records are oldest first, so the latest prescription wins
    return list(out.values())


def _tests(records):
    series = {}
    for rec in records:
        for t in rec.get("tests") or []:
            value = ranges.to_number(t.get("value"))
            if value is None:
                continue
            row = ranges.lookup(t.get("name"))
            key = row[0] if row else _strip_parens(t.get("name")).lower()
            if not key:
                continue
            seen, dated = observed_date(t.get("name"), rec.get("date"))
            std_value, std_unit, note = value, (t.get("unit") or "").strip(), None
            if row and row[0] in ranges._COUNT_SCALE:
                std_value = ranges._scaled(row[0], value, t.get("unit"))
                std_unit = "/cumm"
                if std_value != value:
                    note = f"Converted from {ranges._fmt(value)} {t.get('unit') or ''}".strip()
            if dated:
                note = (note + ". " if note else "") + "Dated from the report line"
            s = series.setdefault(key, {"key": key, "name": row[0] if row else _strip_parens(t.get("name")),
                                        "unit": std_unit, "ref_low": None, "ref_high": None, "points": []})
            s["points"].append({
                "date": seen.isoformat() if seen else None, "value": std_value, "unit": std_unit,
                "orig_value": t.get("value"), "orig_unit": t.get("unit") or "", "orig_name": t.get("name"),
                "flag": t.get("flag") or "unknown", "record": rec.get("id"), "ref_text": t.get("ref_text"),
                "ref_low": _scaled_ref(row, t.get("ref_low"), std_value, value),
                "ref_high": _scaled_ref(row, t.get("ref_high"), std_value, value),
                "comparable": True, "note": note})
    out = []
    for s in series.values():
        s["points"].sort(key=lambda p: p["date"] or "")
        units = [re.sub(r"\s+", "", p["unit"].lower()) for p in s["points"]]
        main = max(set(units), key=units.count)
        for p, u in zip(s["points"], units):
            if u != main:
                p["comparable"] = False
                p["note"] = (p["note"] + ". " if p["note"] else "") + "Reported in a different unit, so not compared"
        usable = [p for p in s["points"] if p["comparable"]]
        s["unit"] = usable[-1]["unit"] if usable else s["unit"]
        s["latest"] = (usable or s["points"])[-1]
        s["ref_low"], s["ref_high"] = s["latest"]["ref_low"], s["latest"]["ref_high"]
        out.append(s)
    return out


def _scaled_ref(row, ref, std_value, value):
    """A count's reference range is converted with the same factor as its value."""
    ref = ranges.to_number(ref)
    if ref is None or not value or std_value == value:
        return ref
    return ref * (std_value / value)


def _attention(tests):
    out = []
    for s in tests:
        p = s["latest"]
        if p["flag"] in ("low", "high", "critical"):
            out.append({"name": s["name"], "value": p["orig_value"], "unit": p["orig_unit"], "flag": p["flag"],
                        "date": p["date"], "record": p["record"], "ref_text": p["ref_text"]})
    order = {"critical": 0, "high": 1, "low": 1}
    return sorted(out, key=lambda a: (order[a["flag"]], a["name"]))


# ---- cross checks: medicine and latest lab value combinations ----

def _latest(tests, name):
    s = next((x for x in tests if x["name"] == name), None)
    return s["latest"] if s else None


def _has(meds, ids=(), tags=(), class_words=()):
    hits = []
    for m in meds:
        e = m.get("_entry")
        if not e or m["status"] == "course_ended":
            continue
        cls = (e.get("class") or "").lower()
        if e["id"] in ids or set(e.get("class_tags") or []) & set(tags) or any(w in cls for w in class_words):
            hits.append(m)
    return hits


def _cross(meds, tests, lang):
    hi = lang == "hi"
    out = []

    def add(title_en, note_en, title_hi, note_hi, used_meds, point):
        records = sorted({m["record"] for m in used_meds} | ({point["record"]} if point else set()))
        out.append({"title": title_hi if hi else title_en, "note": note_hi if hi else note_en, "records": records})

    creat = _latest(tests, "Serum Creatinine")
    potassium = _latest(tests, "Potassium")
    metformin = _has(meds, ids=("metformin",))
    if metformin and creat and creat["value"] > 1.5 and re.sub(r"\s", "", creat["unit"].lower()) == "mg/dl":
        v = f"{ranges._fmt(creat['value'])} mg/dL ({creat['date']})"
        add("Metformin and kidney function",
            f"Your records show metformin ({metformin[0]['name']}) and a creatinine of {v}, which is above the usual "
            "range. Doctors keep an eye on kidney function with this medicine. Worth raising at your next visit.",
            "मेटफ़ॉर्मिन और किडनी की जाँच",
            f"आपके रिकॉर्ड में मेटफ़ॉर्मिन ({metformin[0]['name']}) है और क्रिएटिनिन {v} है, जो सामान्य सीमा से अधिक है। "
            "इस दवा के साथ डॉक्टर किडनी की जाँच पर नज़र रखते हैं। अगली बार डॉक्टर से इस बारे में बात करें।",
            metformin, creat)
    nsaids = _has(meds, tags=("nsaids",))
    if nsaids and creat and creat["flag"] in ("high", "critical"):
        add("Pain medicine and kidney function",
            f"Your records show {nsaids[0]['name']}, a pain medicine of the NSAID type, and a creatinine above the "
            "range. This combination is one doctors like to know about.",
            "दर्द की दवा और किडनी की जाँच",
            f"आपके रिकॉर्ड में {nsaids[0]['name']} (NSAID प्रकार की दर्द की दवा) है और क्रिएटिनिन सीमा से अधिक है। "
            "डॉक्टर को यह साथ में बताना उपयोगी है।", nsaids, creat)
    thinners = _has(meds, tags=("antiplatelets", "anticoagulants"))
    if len({m["_entry"]["id"] for m in thinners}) >= 2:
        names = " and ".join(sorted({m["name"] for m in thinners})[:2])
        add("Two medicines that affect clotting",
            f"Your records show {names}. They are sometimes prescribed together on purpose. It is worth confirming "
            "with your doctor that both are intended.",
            "खून के थक्के पर असर करने वाली दो दवाएँ",
            f"आपके रिकॉर्ड में {names} हैं। कभी-कभी इन्हें जानबूझकर साथ दिया जाता है। डॉक्टर से पुष्टि कर लें कि "
            "दोनों लेनी हैं।", thinners, None)
    raas = _has(meds, class_words=("ace inhibitor", "arb", "angiotensin"), tags=("potassium_sparing",))
    if raas and potassium and potassium["value"] > 5.1:
        v = f"{ranges._fmt(potassium['value'])} {potassium['unit']} ({potassium['date']})"
        add("Blood pressure medicine and potassium",
            f"Your records show {raas[0]['name']} and a potassium of {v}, above the usual range. This type of "
            "medicine can raise potassium, so it is worth mentioning to your doctor.",
            "ब्लड प्रेशर की दवा और पोटैशियम",
            f"आपके रिकॉर्ड में {raas[0]['name']} है और पोटैशियम {v} है, जो सामान्य सीमा से अधिक है। इस तरह की दवा "
            "पोटैशियम बढ़ा सकती है, इसलिए डॉक्टर को बताएँ।", raas, potassium)
    return out


# ---- questions grounded in the record history ----

def _fmt_point(p):
    return f"{ranges._fmt(p['value']) if isinstance(p['value'], (int, float)) else p['value']} {p['unit']}".strip()


def _questions(tests, meds, records, cross, lang):
    hi = lang == "hi"
    out = []

    def add(en, hi_text, recs):
        out.append({"text": hi_text if hi else en, "records": sorted({r for r in recs if r})})

    scored = []
    for s in tests:
        pts = [p for p in s["points"] if p["comparable"] and p["date"]]
        if not pts:
            continue
        first, last = pts[0], pts[-1]
        change = abs(last["value"] - first["value"]) / abs(first["value"]) if len(pts) > 1 and first["value"] else 0
        scored.append((last["flag"] in ("low", "high", "critical"), change, s, first, last, len(pts)))
    for abnormal, change, s, first, last, n in sorted(scored, key=lambda x: (not x[0], -x[1]))[:4]:
        rng = f" ({last['ref_text']})" if last.get("ref_text") else ""
        side_en = {"low": "below", "high": "above", "critical": "far outside"}.get(last["flag"])
        side_hi = {"low": "से कम", "high": "से अधिक", "critical": "से बहुत बाहर"}.get(last["flag"])
        if n > 1 and abnormal and first["value"] != last["value"]:
            add(f"My {s['name']} went from {_fmt_point(first)} on {first['date']} to {_fmt_point(last)} on "
                f"{last['date']}, and it is still {side_en} the range on the report{rng}. What level should I aim "
                "for, and when should it be checked again?",
                f"मेरा {s['name']} {first['date']} को {_fmt_point(first)} था और {last['date']} को {_fmt_point(last)} "
                f"है, जो अब भी रिपोर्ट की सीमा{rng} {side_hi} है। मुझे किस स्तर का लक्ष्य रखना चाहिए, और अगली जाँच कब हो?",
                [first["record"], last["record"]])
        elif abnormal:
            add(f"My {s['name']} was {_fmt_point(last)} on {last['date']}, {side_en} the range on the report{rng}. "
                "What does this mean for me?",
                f"मेरा {s['name']} {last['date']} को {_fmt_point(last)} था, जो रिपोर्ट की सीमा{rng} {side_hi} है। "
                "मेरे लिए इसका क्या मतलब है?", [last["record"]])
        elif n > 1 and change >= 0.15 and first["flag"] in ("low", "high", "critical"):
            add(f"My {s['name']} was {_fmt_point(first)} on {first['date']} and is {_fmt_point(last)} on "
                f"{last['date']}, now within the range. Should anything change in how it is monitored?",
                f"मेरा {s['name']} {first['date']} को {_fmt_point(first)} था और {last['date']} को {_fmt_point(last)} है, "
                "जो अब सीमा के भीतर है। क्या इसकी निगरानी में कुछ बदलना चाहिए?", [first["record"], last["record"]])
    for m in [m for m in meds if m["status"] == "course_ended"][:1]:
        add(f"The {m['name']} course written on {m['date']} ({m['duration']}) looks finished by its dates. "
            "Can you confirm whether I should still be taking it?",
            f"{m['date']} को लिखी {m['name']} ({m['duration']}) की अवधि तारीख़ों के हिसाब से पूरी हो चुकी है। "
            "क्या आप बता सकते हैं कि मुझे यह अब भी लेनी है या नहीं?", [m["record"]])
    for rec in reversed(records):
        if rec.get("follow_up"):
            add(f"My record from {rec.get('date')} says: \"{rec['follow_up']}\" Is this still due?",
                f"{rec.get('date')} के मेरे रिकॉर्ड में लिखा है: \"{rec['follow_up']}\" क्या यह अब भी बाकी है?",
                [rec.get("id")])
            break
    for c in cross[:2]:
        add(f"About \"{c['title']}\": is this something to check in my case?",
            f"\"{c['title']}\" के बारे में: क्या मेरे मामले में इसे जाँचना चाहिए?", c["records"])
    return out[:7]


# ---- wellness log: readings the person takes at home ----
# type: (name, unit, LOINC, reference text). Flags are decided here, never in the browser.
VITALS = {
    "bp": ("Blood pressure", "mmHg", "85354-9", "below 140/90 mmHg"),
    "sugar_fasting": ("Fasting sugar", "mg/dL", "1558-6", "70 - 100 mg/dL"),
    "sugar_pp": ("Sugar after meal", "mg/dL", "1521-4", "70 - 140 mg/dL"),
    "sugar_random": ("Random sugar", "mg/dL", "2339-0", "below 140 mg/dL"),
    "weight": ("Weight", "kg", "29463-7", None),
    "pulse": ("Pulse", "beats/min", "8867-4", "60 - 100 beats/min"),
}
VITAL_NAMES_HI = {"bp": "ब्लड प्रेशर", "sugar_fasting": "खाली पेट शुगर", "sugar_pp": "खाने के बाद शुगर", "sugar_random": "किसी भी समय शुगर",
                  "weight": "वज़न", "pulse": "नब्ज़"}
_BOUNDS = {"bp": (60, 260), "sugar_fasting": (20, 800), "sugar_pp": (20, 800), "sugar_random": (20, 800), "weight": (2, 400), "pulse": (20, 250)}


def vital_flag(kind, value, value2=None):
    """Adult thresholds for a single home reading. Weight has no flag."""
    if kind == "bp":
        if value2 is None:
            return "unknown"
        if value >= 180 or value2 >= 120:
            return "critical"
        if value >= 140 or value2 >= 90:
            return "high"
        if value < 90 or value2 < 60:
            return "low"
        return "normal"
    if kind in ("sugar_fasting", "sugar_pp", "sugar_random"):
        if value < 54 or value > 400:
            return "critical"
        if value < 70:
            return "low"
        return "high" if value > (100 if kind == "sugar_fasting" else 140) else "normal"
    if kind == "pulse":
        if value < 40 or value > 150:
            return "critical"
        if value < 60:
            return "low"
        return "high" if value > 100 else "normal"
    return "unknown"


def clean_vitals(vitals):
    """Validated readings, oldest first. Anything malformed or out of bounds is dropped."""
    out = []
    for v in vitals or []:
        if not isinstance(v, dict) or v.get("type") not in VITALS or not _date(v.get("date")):
            continue
        value, value2 = ranges.to_number(v.get("value")), ranges.to_number(v.get("value2"))
        lo, hi = _BOUNDS[v["type"]]
        if value is None or not lo <= value <= hi:
            continue
        if v["type"] == "bp" and (value2 is None or not 30 <= value2 <= 160):
            continue
        out.append({"id": pipeline._s(v.get("id"), 40), "type": v["type"], "date": str(v["date"])[:10],
                    "value": value, "value2": value2 if v["type"] == "bp" else None,
                    "note": pipeline._s(v.get("note"), 200)})
    return sorted(out, key=lambda v: v["date"])


def _vitals(vitals, lang):
    series = {}
    for v in clean_vitals(vitals):
        name, unit, _, ref = VITALS[v["type"]]
        s = series.setdefault(v["type"], {"type": v["type"], "unit": unit, "ref_text": ref, "points": [],
                                          "name": VITAL_NAMES_HI[v["type"]] if lang == "hi" else name})
        text = f"{ranges._fmt(v['value'])}/{ranges._fmt(v['value2'])}" if v["type"] == "bp" else ranges._fmt(v["value"])
        s["points"].append({"id": v["id"], "date": v["date"], "value": v["value"], "value2": v["value2"],
                            "flag": vital_flag(v["type"], v["value"], v["value2"]), "text": text, "note": v["note"]})
    for s in series.values():
        s["latest"] = s["points"][-1]
    return [series[k] for k in VITALS if k in series]


# ---- persistent out-of-range results, next steps, wellness tips ----
_OUT = ("low", "high", "critical")
_MONTHS = ("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec")
_EVERY = {90: ("about every 3 months", "लगभग हर 3 महीने"), 180: ("about every 6 months", "लगभग हर 6 महीने"),
          365: ("about once a year", "लगभग साल में एक बार")}


def _nice(date):
    d = _date(date)
    return f"{d.day} {_MONTHS[d.month - 1]} {d.year}" if d else str(date or "")


def _persistent(tests):
    """Tests whose latest result and the one before it are both outside the range."""
    out = []
    for s in tests:
        pts = [p for p in s["points"] if p["comparable"] and p["date"]]
        run = []
        for p in reversed(pts):
            if p["flag"] not in _OUT:
                break
            run.append(p)
        if len(run) < 2:
            continue
        run.reverse()
        last = run[-1]
        out.append({"name": s["name"], "unit": last["unit"], "count": len(run), "since": run[0]["date"],
                    "latest": {"value": last["orig_value"], "date": last["date"], "flag": last["flag"]},
                    "records": sorted({p["record"] for p in run if p["record"]})})
    return sorted(out, key=lambda x: (-x["count"], x["name"]))


# (title en, hi), tests in the group, typical days, days when worth repeating sooner, when "sooner" applies
_REPEAT = [
    (("HbA1c", "HbA1c"), ("HbA1c",), 90, 90, lambda f: True),
    (("Blood sugar", "ब्लड शुगर"), ("Fasting Blood Sugar", "Random Blood Sugar", "Post Prandial Blood Sugar"),
     90, 90, lambda f: True),
    (("Lipid profile", "लिपिड प्रोफ़ाइल"), ("Total Cholesterol", "LDL Cholesterol", "HDL Cholesterol", "Triglycerides"),
     365, 180, lambda f: any(v in _OUT for v in f.values())),
    (("Kidney function (creatinine)", "किडनी की जाँच (क्रिएटिनिन)"), ("Serum Creatinine", "Blood Urea"), 180, 180,
     lambda f: True),
    (("TSH", "TSH"), ("TSH",), 180, 180, lambda f: True),
    (("Liver function test", "लिवर फ़ंक्शन टेस्ट"), ("SGPT (ALT)", "SGOT (AST)"), 180, 180, lambda f: True),
    (("Vitamin D", "विटामिन D"), ("Vitamin D (25-OH)",), None, 90, lambda f: f.get("Vitamin D (25-OH)") == "low"),
    (("Complete blood count", "कम्प्लीट ब्लड काउंट"), ("Hemoglobin", "Total WBC Count", "Platelet Count"), 180, 90,
     lambda f: f.get("Hemoglobin") == "low"),
]


def _repeat_items(tests, today, hi):
    out = []
    by_name = {s["name"]: s for s in tests}
    for (title, members, normal, soon, hot) in _REPEAT:
        found = [by_name[m] for m in members if m in by_name and by_name[m]["latest"]["date"]]
        if not found:
            continue
        flags = {s["name"]: s["latest"]["flag"] for s in found}
        days = soon if hot(flags) else normal
        if not days:
            continue
        last = max(s["latest"]["date"] for s in found)
        due = _date(last) + dt.timedelta(days=days)
        every = _EVERY[days][1 if hi else 0]
        t = title[1 if hi else 0]
        recs = {s["latest"]["record"] for s in found if s["latest"]["date"] == last and s["latest"]["record"]}
        out.append({"kind": "repeat_test", "due": due.isoformat(), "overdue": due < today,
                    "title": f"दोबारा जाँच: {t}" if hi else f"Repeat test: {t}",
                    "why": (f"{t} आमतौर पर {every} दोहराया जाता है। आपका पिछला {_nice(last)} को हुआ था." if hi else
                            f"{t} is usually repeated {every}. Your last one was on {_nice(last)}."),
                    "records": sorted(recs)})
    return out


def _follow_up_items(records, today, hi):
    out = []
    dated = [r for r in records if _date(r.get("date"))]
    for rec in [r for r in reversed(dated) if r.get("follow_up")][:3]:
        text = pipeline._s(rec["follow_up"], 200)
        due = follow_up_due(rec["date"], text)
        d = _nice(rec["date"])
        out.append({"kind": "follow_up", "due": due.isoformat() if due else None, "overdue": bool(due and due < today),
                    "title": f"{d} के रिकॉर्ड का फ़ॉलो-अप" if hi else f"Follow-up from your {d} record",
                    "why": (f"{d} के आपके रिकॉर्ड में लिखा है: \"{text}\"" if hi else
                            f"Your record from {d} says: \"{text}\""),
                    "records": [rec.get("id")] if rec.get("id") else []})
    return out


def _clean_patient(patient):
    p = patient if isinstance(patient, dict) else {}
    age = ranges.to_number(p.get("age"))
    sex = str(p.get("sex") or "").strip().lower()
    return (int(age) if age is not None and 0 < age < 121 else None), ("f" if sex[:1] == "f" else "m" if sex[:1] == "m" else "")


def _screening_items(patient, tests, home, today, hi):
    age, sex = _clean_patient(patient)
    if age is None:
        return []
    out = []

    def add(en, hi_t, why_en, why_hi):
        out.append({"kind": "screening", "title": hi_t if hi else en, "why": why_hi if hi else why_en,
                    "due": None, "overdue": False, "records": []})

    sugar = ("HbA1c", "Fasting Blood Sugar", "Random Blood Sugar", "Post Prandial Blood Sugar")
    lipid = ("Total Cholesterol", "LDL Cholesterol", "HDL Cholesterol", "Triglycerides")
    bp = next((s for s in home if s["type"] == "bp"), None)
    if age >= 30 and not (bp and (today - _date(bp["latest"]["date"])).days <= 365):
        add("Blood pressure check", "ब्लड प्रेशर की जाँच",
            f"At age {age}, a blood pressure check is usually done about once a year.",
            f"{age} वर्ष की उम्र में ब्लड प्रेशर की जाँच आमतौर पर साल में एक बार की जाती है।")
    if age >= 40 and not any(s["name"] in sugar for s in tests):
        diab = age >= 45
        add("Diabetes screening" if diab else "Blood sugar check", "डायबिटीज़ की जाँच" if diab else "ब्लड शुगर की जाँच",
            f"At age {age}, blood sugar is usually checked about once a year, and none is in your records.",
            f"{age} वर्ष की उम्र में ब्लड शुगर आमतौर पर साल में एक बार जाँची जाती है, और आपके रिकॉर्ड में कोई नहीं है।")
    if age >= 40 and not any(s["name"] in lipid for s in tests):
        add("Lipid profile", "लिपिड प्रोफ़ाइल",
            f"At age {age}, a lipid profile is usually done about every 5 years, and none is in your records.",
            f"{age} वर्ष की उम्र में लिपिड प्रोफ़ाइल आमतौर पर लगभग हर 5 साल में होती है, और आपके रिकॉर्ड में कोई नहीं है।")
    if age >= 50:
        add("Colon cancer screening: talk to your doctor", "कोलन कैंसर की जाँच: डॉक्टर से बात करें",
            f"At age {age}, doctors usually discuss colon cancer screening.",
            f"{age} वर्ष की उम्र में डॉक्टर आमतौर पर कोलन कैंसर की जाँच पर चर्चा करते हैं।")
    if sex == "f" and age >= 21:
        add("Cervical screening: talk to your doctor", "सर्वाइकल जाँच: डॉक्टर से बात करें",
            f"At age {age}, cervical screening is usually discussed about every 3 years.",
            f"{age} वर्ष की उम्र में सर्वाइकल जाँच पर आमतौर पर लगभग हर 3 साल में चर्चा होती है।")
    if sex == "f" and age >= 40:
        add("Mammography: talk to your doctor", "मैमोग्राफ़ी: डॉक्टर से बात करें",
            f"At age {age}, doctors usually discuss mammography for women.",
            f"{age} वर्ष की उम्र में डॉक्टर महिलाओं के लिए मैमोग्राफ़ी पर चर्चा करते हैं।")
    return out


def _preventive(records, tests, home, patient, today, lang):
    """Next steps by code: typical repeat intervals, written follow-ups, age and sex screenings."""
    hi = lang == "hi"
    items = _repeat_items(tests, today, hi) + _follow_up_items(records, today, hi)
    items += _screening_items(patient, tests, home, today, hi)
    return sorted(items, key=lambda i: (not i["overdue"], i["due"] is None, i["due"] or ""))


def _wellness(tests, home, conditions, patient, lang):
    """General lifestyle tips, each with the record value or age that triggered it."""
    hi = lang == "hi"
    by = {s["name"]: s for s in tests}
    out, seen = [], set()

    def add(area, en, hi_t, why_en, why_hi, recs=()):
        if (area, en) not in seen:
            seen.add((area, en))
            out.append({"area": area, "tip": hi_t if hi else en, "why": why_hi if hi else why_en,
                        "records": sorted({r for r in recs if r})})

    def high(*names):
        return next((by[n] for n in names if n in by and by[n]["latest"]["flag"] in ("high", "critical")), None)

    def cond(word):
        return next((c for c in conditions if word in c["name"].lower()), None)

    def says(s, side):
        p = s["latest"]
        num = ranges.to_number(p["orig_value"])
        v = f"{ranges._fmt(num) if num is not None else p['orig_value']} {p['orig_unit']}".strip()
        return (f"आपका {s['name']} {_nice(p['date'])} को {v} था, रिपोर्ट की छपी सीमा {side[1]}",
                f"Your {s['name']} was {v} on {_nice(p['date'])}, {side[0]} the printed range")

    over = ("above", "से अधिक")
    sugar = high("HbA1c", "Fasting Blood Sugar", "Post Prandial Blood Sugar", "Random Blood Sugar")
    diab = cond("diabetes")
    if sugar or diab:
        if sugar:
            why_hi, why_en = says(sugar, over)
            recs = [sugar["latest"]["record"]]
        else:
            m = diab["mentions"][-1]
            why_hi = f"आपके {_nice(m['date'])} के रिकॉर्ड में {diab['name']} लिखा है"
            why_en = f"Your record from {_nice(m['date'])} mentions {diab['name']}"
            recs = [m["record"]]
        add("diet", "Have fewer sugary drinks and refined carbohydrates such as white bread and sweets, and eat more "
            "vegetables and whole grains.", "मीठे पेय और मैदा जैसे रिफ़ाइंड कार्बोहाइड्रेट (सफ़ेद ब्रेड, मिठाई) कम लें, और "
            "सब्ज़ियाँ व साबुत अनाज ज़्यादा खाएँ।", why_en, why_hi, recs)
        add("activity", "Walking for about 30 minutes on most days is a common general suggestion; check with your "
            "doctor first.", "ज़्यादातर दिन लगभग 30 मिनट पैदल चलना एक आम सुझाव है; पहले डॉक्टर से पूछ लें।",
            why_en, why_hi, recs)
    fat = high("LDL Cholesterol", "Total Cholesterol", "Triglycerides")
    if fat:
        why_hi, why_en = says(fat, over)
        add("diet", "Eat less fried and oily food, and more fibre such as vegetables, fruit and pulses.",
            "तला-भुना और चिकना खाना कम खाएँ, और सब्ज़ियाँ, फल व दालें जैसा फ़ाइबर ज़्यादा लें।", why_en, why_hi,
            [fat["latest"]["record"]])
    bp = next((s for s in home if s["type"] == "bp" and s["latest"]["flag"] in ("high", "critical")), None)
    htn = cond("hypertension")
    if bp or htn:
        if bp:
            p = bp["latest"]
            why_en = f"Your home blood pressure was {p['text']} mmHg on {_nice(p['date'])}, above the usual range"
            why_hi = f"घर पर {_nice(p['date'])} को आपका ब्लड प्रेशर {p['text']} mmHg था, जो सामान्य सीमा से अधिक है"
            recs = []
        else:
            m = htn["mentions"][-1]
            why_en = f"Your record from {_nice(m['date'])} mentions {htn['name']}"
            why_hi = f"आपके {_nice(m['date'])} के रिकॉर्ड में {htn['name']} लिखा है"
            recs = [m["record"]]
        add("diet", "Use less salt, and go easy on pickles, papad and packaged snacks.",
            "नमक कम इस्तेमाल करें, और अचार, पापड़ व पैकेट वाले स्नैक्स कम खाएँ।", why_en, why_hi, recs)
    hb = by.get("Hemoglobin")
    if hb and hb["latest"]["flag"] == "low":
        why_hi, why_en = says(hb, ("below", "से कम"))
        add("diet", "Include iron-rich foods such as lentils, green leafy vegetables and jaggery, with a source of "
            "vitamin C like lemon.", "आयरन वाले खाद्य जैसे दालें, हरी पत्तेदार सब्ज़ियाँ और गुड़ लें, साथ में नींबू जैसा "
            "विटामिन C का स्रोत रखें।", why_en, why_hi, [hb["latest"]["record"]])
    vd = by.get("Vitamin D (25-OH)")
    if vd and vd["latest"]["flag"] == "low":
        why_hi, why_en = says(vd, ("below", "से कम"))
        add("habits", "Get some safe morning sunlight, and ask your doctor whether your vitamin D needs testing "
            "or follow-up.", "सुबह की थोड़ी सुरक्षित धूप लें, और डॉक्टर से पूछें कि विटामिन D की जाँच या फ़ॉलो-अप चाहिए या नहीं।",
            why_en, why_hi, [vd["latest"]["record"]])
    liver = high("SGPT (ALT)", "SGOT (AST)")
    if liver:
        why_hi, why_en = says(liver, over)
        add("habits", "Avoid alcohol, and ask your doctor what else is worth avoiding for your liver.",
            "शराब से दूर रहें, और डॉक्टर से पूछें कि लिवर के लिए और क्या टालना चाहिए।", why_en, why_hi,
            [liver["latest"]["record"]])
    age, _ = _clean_patient(patient)
    ground = (f"At age {age}, " if age else "") + "this is general guidance for adults."
    ground_hi = (f"{age} वर्ष की उम्र में " if age else "") + "यह वयस्कों के लिए सामान्य सुझाव है।"
    del out[4:]
    add("sleep", "Aim for 7 to 9 hours of sleep, at regular times.", "रोज़ नियमित समय पर 7 से 9 घंटे सोने का लक्ष्य रखें।",
        ground, ground_hi)
    add("habits", "Avoid smoking and tobacco in any form.", "धूम्रपान और किसी भी रूप में तंबाकू से बचें।", ground, ground_hi)
    if len(out) < 3:
        add("activity", "Walking for about 30 minutes on most days is a common general suggestion; check with your "
            "doctor first.", "ज़्यादातर दिन लगभग 30 मिनट पैदल चलना एक आम सुझाव है; पहले डॉक्टर से पूछ लें।", ground, ground_hi)
    return out[:6]


# ---- symptom diary summary (patient-reported; code only, no model) ----
_SCALES = {"mood": (1, 5, ("mood", "मनोदशा")), "sleep": (1, 5, ("sleep", "नींद")),
           "energy": (1, 5, ("energy", "ऊर्जा")), "pain": (0, 10, ("pain", "दर्द"))}


def _text(v, n):
    return re.sub(r"\s+", " ", v).strip()[:n] if isinstance(v, str) else ""


def clean_journal(entries, since=None):
    """Validated diary entries, oldest first, at most 400. Bad dates and non-objects are dropped."""
    start = _date(since) if since else None
    out = []
    for e in entries if isinstance(entries, list) else []:
        d = _date(e.get("date")) if isinstance(e, dict) else None
        if not d or (start and d < start):
            continue
        row = {"date": d.isoformat()}
        for k, (lo, top, _) in _SCALES.items():
            v = ranges.to_number(e.get(k))
            row[k] = int(v) if v is not None and lo <= v <= top else None
        syms = e.get("symptoms") if isinstance(e.get("symptoms"), list) else []
        row["symptoms"] = [t for t in (_text(s, 60) for s in syms) if t][:20]
        row["meds_taken"] = e.get("meds_taken") if isinstance(e.get("meds_taken"), bool) else None
        row["side_effects"] = _text(e.get("side_effects"), 120)
        out.append(row)
    return sorted(out, key=lambda r: r["date"])[-400:]


def _avg(rows, k):
    vals = [r[k] for r in rows if r[k] is not None]
    return (sum(vals) / len(vals), len(vals)) if vals else (None, 0)


def _trends(rows, hi):
    """First half of the entries against the second half, for mood, sleep, energy and pain."""
    better, worse = [], []
    half = len(rows) // 2
    for k, (lo, top, names) in _SCALES.items():
        a, na = _avg(rows[:half], k)
        b, nb = _avg(rows[half:], k)
        if na < 3 or nb < 3 or abs(b - a) < (1.0 if k == "pain" else 0.5):
            continue
        good = b < a if k == "pain" else b > a
        nums = f"{a:.1f} → {b:.1f}"
        name = names[1 if hi else 0]
        if hi:
            line = f"मरीज़ ने बताया कि {name} {'बेहतर हुई' if good else 'बिगड़ी'} (औसत {nums}, {top} में से)"
        else:
            line = f"Reported {name} {'improved' if good else 'got worse'} (average {nums} out of {top})"
        (better if good else worse).append(line)
    return better, worse


def _longest_run(days):
    """Longest run of consecutive calendar days in a sorted list of ISO dates."""
    best = cur = 0
    prev = None
    for d in map(_date, days):
        cur = cur + 1 if prev and (d - prev).days == 1 else 1
        best, prev = max(best, cur), d
    return best


def _counted(rows, field, many):
    """Distinct days per spelling, most frequent first. many: the field holds a list."""
    seen = {}
    for r in rows:
        for s in (r[field] if many else [r[field]] if r[field] else []):
            seen.setdefault(s.lower(), {"name": s, "dates": set()})["dates"].add(r["date"])
    return sorted(seen.values(), key=lambda e: (-len(e["dates"]), e["name"].lower()))


def journal_summary(entries, since=None, lang="en", today=None):
    """Counts and trends from the person's own diary. Everything is patient-reported, never a finding."""
    hi = lang == "hi"
    rows = clean_journal(entries, since)
    days = sorted({r["date"] for r in rows})
    symptoms = [{"name": e["name"], "count": len(e["dates"]), "first": min(e["dates"]), "last": max(e["dates"])}
                for e in _counted(rows, "symptoms", True)]
    missed = sorted({r["date"] for r in rows if r["meds_taken"] is False})
    taken = {r["date"] for r in rows if r["meds_taken"] is True} - set(missed)
    adherence = {"taken": len(taken), "missed": len(missed), "unknown": len(days) - len(taken) - len(missed)}
    side = [{"text": e["name"], "count": len(e["dates"])} for e in _counted(rows, "side_effects", False)]
    better, worse = _trends(rows, hi)
    concerns = []
    for s in symptoms:
        if s["count"] >= 3:
            concerns.append(f"{s['name']} {s['count']} दिन बताया गया" if hi else f"{s['name']} was reported on {s['count']} days")
    bad = sorted({r["date"] for r in rows if r["pain"] is not None and r["pain"] >= 7})
    if bad:
        top = max(r["pain"] for r in rows if r["pain"] is not None)
        concerns.append(f"दर्द {len(bad)} दिन 7/10 या उससे अधिक बताया गया (सबसे अधिक {top}/10)" if hi else
                        f"Pain was reported at 7/10 or more on {len(bad)} day(s) (highest {top}/10)")
    run = _longest_run(missed)
    if run >= 2:
        concerns.append(f"लगातार {run} दिन खुराक छूटी बताई गई" if hi else f"Doses were marked missed on {run} days in a row")
    qs = []
    for s in symptoms[:2]:
        qs.append(f"मैंने {s['count']} दिन {s['name']} दर्ज किया; क्या इसे जाँचना ज़रूरी है?" if hi else
                  f"I noted {s['name']} on {s['count']} days; is this worth checking?")
    if bad:
        qs.append(f"मेरा दर्द {len(bad)} दिन 7/10 या अधिक रहा; ऐसे में मुझे क्या करना चाहिए?" if hi else
                  f"My pain was 7/10 or more on {len(bad)} day(s); what should I do when it is this strong?")
    if missed:
        qs.append(f"मैंने {len(missed)} दिन खुराक छूटी दर्ज की; छूटी खुराक को लेकर सही तरीका क्या है?" if hi else
                  f"I marked missed doses on {len(missed)} day(s); what is the right way to handle a missed dose?")
    for f in side[:1]:
        qs.append(f"मैंने {f['count']} दिन \"{f['text']}\" दर्ज किया; क्या इसे जाँचना ज़रूरी है?" if hi else
                  f"I noted \"{f['text']}\" on {f['count']} day(s); is this worth checking?")
    if worse:
        qs.append("मेरे दर्ज किए अनुसार कुछ बातें बिगड़ीं; इनके लिए मैं क्या देखूँ?" if hi else
                  "Some of the things I tracked got worse; what should I keep an eye on?")
    for en, hi_t in (("Is there anything I should track differently in my diary?", "मेरी डायरी में क्या मुझे अलग तरह से दर्ज करना चाहिए?"),
                     ("What should I keep tracking until my next visit?", "अगली मुलाक़ात तक मुझे क्या दर्ज करते रहना चाहिए?"),
                     ("Is there anything in my diary that worries you?", "क्या मेरी डायरी में कुछ ऐसा है जो आपको चिंताजनक लगता है?")):
        if len(qs) < 3:
            qs.append(hi_t if hi else en)
    start = _date(since)
    return {"period": {"from": days[0] if days else (start.isoformat() if start else None),
                       "to": days[-1] if days else None},
            "entries": len(rows), "symptoms": symptoms, "improving": better, "worsening": worse,
            "missed_days": missed, "adherence": adherence, "side_effects": side, "concerns": concerns,
            "questions": qs[:5], "entry_dates": days}


def build(records, lang="en", today=None, vitals=None, patient=None):
    lang = lang if lang in DISCLAIMER else "en"
    today = today or dt.date.today()
    records = sorted((r for r in records or [] if isinstance(r, dict)), key=lambda r: r.get("date") or "")
    meds = _medicines(records, today)
    tests = _tests(records)
    cross = _cross(meds, tests, lang)
    questions = _questions(tests, meds, records, cross, lang)
    for m in meds:
        m.pop("_entry", None)
    home = _vitals(vitals, lang)
    attention = _attention(tests)
    for s in home:
        p = s["latest"]
        if p["flag"] in ("low", "high", "critical"):
            attention.append({"name": s["name"], "value": p["text"], "unit": s["unit"], "flag": p["flag"],
                              "date": p["date"], "record": None, "ref_text": s["ref_text"], "source": "vitals"})
            hi = lang == "hi"
            side = {"low": ("below", "से कम"), "high": ("above", "से अधिक"), "critical": ("far outside", "से बहुत बाहर")}[p["flag"]]
            if len(questions) < 8:
                questions.append({"records": [], "text": (
                    f"घर पर {p['date']} को मेरा {s['name']} {p['text']} {s['unit']} आया, जो सामान्य सीमा ({s['ref_text']}) {side[1]} है। "
                    "क्या मुझे इसे दोबारा नापना चाहिए, और कब?" if hi else
                    f"At home on {p['date']} my {s['name'].lower()} was {p['text']} {s['unit']}, {side[0]} the usual range "
                    f"({s['ref_text']}). Should I measure it again, and when?")})
    conditions = _conditions(records)
    return {"conditions": conditions, "medicines": meds, "tests": tests, "vitals": home,
            "attention": attention, "questions": questions, "cross": cross,
            "persistent": _persistent(tests),
            "preventive": _preventive(records, tests, home, patient, today, lang),
            "wellness": _wellness(tests, home, conditions, patient, lang),
            "disclaimer": DISCLAIMER[lang]}
