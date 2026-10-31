"""Document -> structured record -> plain-language explanation.

Stage 1  model reads the document and returns JSON in a fixed schema
Stage 2  code validates it, applies reference ranges, checks medicine names
Stage 3  model writes the explanation around flags the code already decided
"""
import base64
import html
import datetime as dt
import difflib
import json
import os
import re
import time
import uuid

import llm
import ranges
import safety

ROOT = os.path.dirname(os.path.abspath(__file__))
HANDWRITTEN_CAP = 0.6
DOC_TYPES = ("lab_report", "prescription", "discharge_summary", "diagnostic_report", "other")
MIME_OK = ("image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain")
DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def _docx_text(data_b64):
    """Plain text of a Word document (paragraphs and table cells), stdlib only."""
    import io
    import zipfile
    try:
        with zipfile.ZipFile(io.BytesIO(base64.b64decode(data_b64))) as z:
            xml = z.read("word/document.xml").decode("utf-8", "replace")
    except (zipfile.BadZipFile, KeyError, ValueError) as e:
        raise ValueError("This Word file could not be opened. Save it again as .docx or PDF.") from e
    xml = re.sub(r"</w:p>|</w:tc>", "\n", xml)
    return html.unescape(re.sub(r"<[^>]+>", "", xml))


DISCLAIMER = {
    "en": "This explanation is for understanding your records only. It is not a diagnosis or "
          "medical advice. Do not start, stop or change any medicine without your doctor.",
    "hi": "यह जानकारी केवल आपके रिकॉर्ड को समझने के लिए है। यह कोई निदान या चिकित्सा सलाह नहीं है। "
          "अपने डॉक्टर से पूछे बिना कोई दवा शुरू, बंद या बदलें नहीं।",
}
with open(os.path.join(ROOT, "data", "medicines.json"), encoding="utf-8") as f:
    _MEDS = json.load(f)
_MED_NAMES = {}
for m in _MEDS:
    names = [re.sub(r"\(.*?\)", "", m["generic"] or "")] + m["brands"]
    names += re.findall(r"\((.*?)\)", m["generic"] or "")
    for n in names + [m.get("id") or ""]:
        if n.strip():
            _MED_NAMES[n.strip().lower()] = m
            # "Dolo 650" must also match a prescription that says "Dolo" with the strength apart
            bare = " ".join(w for w in n.lower().split() if not w[:1].isdigit())
            if len(bare) > 3:
                _MED_NAMES.setdefault(bare, m)

EXTRACT_PROMPT = """You are a medical document reader for Indian healthcare records.
Read the attached document (it may be a photo, scan or PDF; printed or handwritten; English, Hindi or mixed) and return ONE JSON object. Transcribe only what is written. Never guess or fill in a value that you cannot read: use null and lower the confidence.

Schema:
{
 "doc_type": "lab_report" | "prescription" | "discharge_summary" | "diagnostic_report" | "other",
 "title": short title, e.g. "Complete Blood Count" or "Prescription - Dr. Mehta",
 "date": "YYYY-MM-DD" or null (the report / visit / discharge date; Indian documents use DD/MM/YYYY),
 "facility": lab, clinic or hospital name or null,
 "doctor": doctor name or null,
 "patient": {"name": str|null, "age": str|null, "sex": "M"|"F"|null},
 "language_detected": "en" | "hi" | "mixed" | other ISO code,
 "handwritten": true if the clinical content is handwritten,
 "tests": [{"name": test name as printed, "value": number (or string when not numeric, e.g. "Positive"), "unit": str|null, "ref_low": number|null, "ref_high": number|null, "ref_text": the reference range exactly as printed or null, "source_text": the whole line this result was read from, copied exactly as printed, "page": page number (1 for a single image), "confidence": 0-1}],
 "medicines": [{"name": brand or drug name as written, "generic": generic name ONLY if it is written, else null, "strength": e.g. "500 mg" or null, "dose": the amount per intake ONLY if it is written (e.g. "1 tablet", "5 ml"), else null; never assume one tablet, "frequency": plain words, e.g. "twice a day (morning and night)", "timing": e.g. "after food" or null, "duration": e.g. "5 days" or null, "instructions": any other instruction or null, "source_text": the whole line this medicine was read from, copied exactly as written (before you expand shorthand), "page": page number, "confidence": 0-1}],
 "diagnoses": [{"name": str, "confidence": 0-1}],
 "advice": [short strings: diet, lifestyle, follow-up tests the doctor wrote],
 "follow_up": str|null,
 "overall_confidence": 0-1,
 "unread": [{"text": the line as best you can read it, "reason": short reason}]
}

Rules:
- Expand prescription shorthand into plain words in "frequency": OD = once a day, BD/BID = twice a day, TDS/TID = three times a day, QID = four times a day, HS = at bedtime, SOS = only when needed, 1-0-1 = morning and night, 1-1-1 = morning, afternoon and night, 0-0-1 = night only. AC = before food, PC = after food. When a line has both a schedule and SOS (for example "1-1-1 SOS"), keep both: "up to three times a day, only when needed". Never drop SOS.
- Handwritten prescriptions: read slowly, line by line, top to bottom, including lines squeezed into margins and corners. Use the standard written forms doctors use: Tab = tablet, Cap = capsule, Syp = syrup, Inj = injection, amp = ampoule, i/m = into the muscle, i/v = into the vein, stat = one dose given now, x 5d = for 5 days, c/o = complains of, PCM = paracetamol, ORS = oral rehydration salts. An injection given once in the clinic ("stat") is still a medicine: list it with frequency "one dose, given at the clinic". A drug name counts as read only when the letters on the page spell it; if you can read the strength or schedule but not the name, the line goes to "unread", not "medicines".
- Tests the doctor asks for ("Adv: CBC, LFT, TSH", ticked or circled investigations) are requests, not results: put them in "advice" as one string starting "Tests advised:". Never put a test in "tests" without a written result. A printed checklist of investigations down the side of a form is not a list of results; ignore the unticked ones.
- A question mark before a diagnosis ("? Fatty liver") means the doctor only suspects it: write the name as "Suspected: Fatty liver". K/C/O means a known case of that condition: write "Known: Hypertension" (HTN = hypertension, DM = diabetes).
- BBF = before breakfast, BF = before food, AF = after food, HS = at bedtime: put these in "timing".
- Readings taken at the visit and written in the margin (BP, SpO2, pulse, temperature, weight) go in "advice" as one string starting "Recorded at the visit:". They are not lab tests.
- Complaints the doctor noted ("c/o vomiting, loose motions x 2 days") go in "advice" as one string starting "Complaints noted:".
- Translate Hindi instructions into English in the fields, keeping the meaning exact.
- A lab report's "ref_low"/"ref_high" come ONLY from the range printed beside that test. "< 200" means ref_high 200; "> 40" means ref_low 40.
- For discharge summaries, put investigation results in "tests", discharge medicines in "medicines", and final diagnoses in "diagnoses".
- "diagnoses" lists only conditions the document itself states. Do not infer a diagnosis from test values or medicines.
- "unread" lists every line that looks like a result, medicine or diagnosis but that you could not read or parse with confidence (smudged, cut off, garbled digits such as "2l.1", a value with no test name). Put it there and leave it OUT of tests/medicines/diagnoses. Never repair a doubtful value by guessing. Do not list headers, addresses or signatures.
- Confidence reflects how clearly you could read that item: printed and sharp = 0.95+, blurry or handwritten and uncertain = below 0.7.
- If the document is not a health record, return doc_type "other" with empty arrays and overall_confidence 0.
Return JSON only."""

EXPLAIN_PROMPT = """You explain a patient's own medical record to them in {language}, in simple words a 14-year-old could follow. Short sentences. No medical jargon without a plain explanation.

The record below is already extracted and checked. Each test already has a "flag" (low, normal, high, critical, unknown) decided by software from the reference range. You must NOT change a flag, invent a value, or mention anything that is not in the record.

Safety rules:
- Do not diagnose. Say what a value "can be linked to" or "is often checked for", never "you have".
- Do not tell the patient to start, stop or change a medicine or dose.
- For each abnormal test say plainly what the test measures, whether it is above or below the range, and what that commonly means. Keep it calm and factual.
- A "critical" flag: say it needs prompt medical attention.
- Medicines: give the common purpose of each medicine in one line. If you do not recognise it, say so.
- Numbers: write only numbers that appear in the record. Never add a typical range, target or duration as digits; if you need one, write it in words.

Return ONE JSON object:
{{
 "summary": 2-4 sentences: what this document is and the main takeaways,
 "findings": [{{"name": test name exactly as in the record, "flag": the same flag, "meaning": 1-2 sentences}}]  (every test that is not "normal"; if all are normal return one entry that says so with flag "normal"),
 "medicines": [{{"name": medicine name exactly as in the record, "purpose": one line}}],
 "questions": 3-4 useful questions the patient could ask their doctor about this record
}}
All text values must be written in {language}. Keep test and medicine names as they appear.

RECORD:
{record}"""

OVERVIEW_PROMPT = """You are summarising one person's health records for them in {language}, in simple words.
Use only the records below. Flags on tests were decided by software; do not change them. Compare two results of the same test only when their units match; if they differ, say they cannot be compared directly. Do not diagnose and do not advise starting, stopping or changing any medicine.

Return ONE JSON object:
{{
 "summary": 3-5 sentences describing the overall picture across time,
 "highlights": up to 5 short points that are going well or have improved (name the test and the values with dates),
 "watch": up to 5 short points still outside the reference range or worth raising with a doctor
}}
All text in {language}.

PATIENT: {patient}
RECORDS (oldest first):
{records}"""

ASK_PROMPT = """You answer a patient's question about their own health records in {language}, in simple words.

First decide which kind of answer this is:
- "records": the answer is in the records below. Quote the value, its unit, the reference range and the report date. If part of what they ask is missing from the records, say exactly what is missing.
- "general": the question is about what a test, term or medicine generally is, and the records are not needed. Give a short general explanation and say it is general information, not about them.
- "offtopic": the question has nothing to do with health, the body, illness, medicines, tests, the patient's records, wellness (sleep, food, exercise, stress) or using this app. Examples: geography ("where is Chandigarh"), sports, films, maths homework, coding, news, politics, jokes. Do not answer it; the app replies for you.
- "doctor": the question asks what treatment to take, whether to start, stop or change anything, for a diagnosis, or for a prognosis. Do not answer it. Say this needs their doctor and, if useful, which values from the records to show the doctor.

Context rules:
- A record with a "status" of OPEN DOCUMENT is the one the patient has just uploaded and is looking at. "This document", "the open prescription", "what I just uploaded" all mean that record. Say that it is still under review and not saved yet.
- All records here are in the user's own active profile; answer from them as the user's records. A name printed on a document that differs from the account name (a nickname, a spelling, a family member who manages the account) is not a reason to refuse. Only when the records clearly name two different people, say whose record each answer comes from and never mix them.
- "uncertain_items" were read with low confidence (often handwriting) and "lines_not_read" could not be read at all. Never state an uncertain item as a fact: say it was read with low confidence and should be checked against the original. If asked what was unclear, list both.
- Never say what an uncertain medicine is for, or what it treats: its name is not verified.
- A medicine may carry a "status". Say the patient "takes" a medicine only when the status says they confirmed it. If the course has ended, say so. Otherwise say it "is written in" the record and is not confirmed as still being taken.
- Write in {language}, in that language's own script (Hindi in Devanagari, never in Latin letters), whatever script the question uses. Keep test names, medicine names and units as written.

Rules: compare two results of the same test only when their units match; if the units differ, say they cannot be compared directly. Never diagnose. Never advise starting, stopping or changing a medicine or dose. Never write a number that is not in the records. Format: plain text, no markdown (no asterisks, no headings). Write the answer as 2 to 5 short bullet points, one per line, each starting with "• " (a bullet and a space); one short sentence per bullet. A one-line safety reply may skip the bullets.

Return ONE JSON object: {{"kind": "records" | "general" | "doctor" | "offtopic", "answer": str, "sources": [ids of the records you used, empty unless kind is "records"]}}

RECORDS:
{records}

QUESTION: {question}

Write the "answer" in {language}, in its own script, even if the question above is typed in Latin letters."""


# Languages the app can write in: (code, English name for the model, native name, right-to-left).
# English and Hindi have hand-written fixed texts. The next eight ship with machine-translated
# interface labels. Every other language is translated on demand (see translate_labels) and
# its explanations and chat answers are written directly in that language by the model.
LANGUAGES = [
    ("en", "English", "English", False), ("hi", "Hindi (Devanagari script, everyday spoken Hindi)", "हिंदी", False),
    ("bn", "Bengali", "বাংলা", False), ("te", "Telugu", "తెలుగు", False), ("mr", "Marathi", "मराठी", False),
    ("ta", "Tamil", "தமிழ்", False), ("gu", "Gujarati", "ગુજરાતી", False), ("kn", "Kannada", "ಕನ್ನಡ", False),
    ("ml", "Malayalam", "മലയാളം", False), ("pa", "Punjabi (Gurmukhi script)", "ਪੰਜਾਬੀ", False),
    ("or", "Odia", "ଓଡ଼ିଆ", False), ("as", "Assamese", "অসমীয়া", False), ("ur", "Urdu", "اردو", True),
    ("ne", "Nepali", "नेपाली", False), ("si", "Sinhala", "සිංහල", False),
    ("es", "Spanish", "Español", False), ("fr", "French", "Français", False), ("de", "German", "Deutsch", False),
    ("pt", "Portuguese", "Português", False), ("it", "Italian", "Italiano", False), ("nl", "Dutch", "Nederlands", False),
    ("ru", "Russian", "Русский", False), ("uk", "Ukrainian", "Українська", False), ("pl", "Polish", "Polski", False),
    ("tr", "Turkish", "Türkçe", False), ("el", "Greek", "Ελληνικά", False), ("sv", "Swedish", "Svenska", False),
    ("ro", "Romanian", "Română", False), ("hu", "Hungarian", "Magyar", False), ("cs", "Czech", "Čeština", False),
    ("ar", "Arabic", "العربية", True), ("fa", "Persian", "فارسی", True), ("he", "Hebrew", "עברית", True),
    ("zh", "Chinese (Simplified)", "中文", False), ("ja", "Japanese", "日本語", False), ("ko", "Korean", "한국어", False),
    ("id", "Indonesian", "Bahasa Indonesia", False), ("ms", "Malay", "Bahasa Melayu", False),
    ("vi", "Vietnamese", "Tiếng Việt", False), ("th", "Thai", "ไทย", False), ("fil", "Filipino", "Filipino", False),
    ("my", "Burmese", "မြန်မာ", False), ("sw", "Swahili", "Kiswahili", False),
]
LANGS = {code: name for code, name, _, _ in LANGUAGES}
BUNDLED = ("en", "hi", "bn", "te", "mr", "ta", "gu", "kn", "ml", "pa")  # label files shipped with the app


def language_list():
    return [{"code": c, "name": n.split(" (")[0], "native": native, "rtl": rtl, "bundled": c in BUNDLED}
            for c, n, native, rtl in LANGUAGES]


def _lang(code):
    return code if code in LANGS else "en"


def _lang_name(lang):
    return LANGS[_lang(lang)] + ("" if lang in ("en", "hi") else " (native script, simple everyday words)")


def _disclaimer(lang):
    if lang in DISCLAIMER:
        return DISCLAIMER[lang]
    short = safety.SHORT["medication"].get(lang)
    return (short + " " if short else "") + DISCLAIMER["en"]


def _s(v, limit=300):
    if v is None:
        return None
    v = str(v).strip()
    return v[:limit] or None


def _conf(v, default=0.5):
    try:
        return max(0.0, min(1.0, float(v)))
    except (TypeError, ValueError):
        return default


def _page(v):
    try:
        return max(1, int(v))
    except (TypeError, ValueError):
        return None


def _unswap(iso, today=None):
    """A document date in the future is usually day and month read the wrong way round
    (05/10 taken as May 10th becomes 10 May; 10/11 as 11 Oct becomes 10 Nov). If swapping
    them gives a date that is not in the future, use that; the user still confirms it."""
    if not iso:
        return iso
    today = today or dt.date.today()
    d = dt.date.fromisoformat(iso)
    if d <= today or d.day > 12:
        return iso
    try:
        flipped = dt.date(d.year, d.day, d.month)
    except ValueError:
        return iso
    return flipped.isoformat() if flipped <= today else iso


def _date(v):
    v = _s(v)
    if not v:
        return None
    try:
        return dt.date.fromisoformat(v[:10]).isoformat()
    except ValueError:
        m = re.match(r"(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})", v)
        if m:
            try:
                return dt.date(int(m.group(3)), int(m.group(2)), int(m.group(1))).isoformat()
            except ValueError:
                return None
    return None


def match_medicine(name):
    """Returns (known, suggestion). Exact word match is known; a near miss is a suggestion."""
    words = re.sub(r"\b(tab|tablet|cap|capsule|syp|syrup|inj|injection)\b\.?", " ", (name or "").lower())
    words = re.sub(r"[^a-z0-9 ]+", " ", words).split()
    words = [w for w in words if not re.fullmatch(r"\d+(mg|ml|mcg|iu|g)?|mg|ml|mcg|iu", w)]
    if not words:
        return False, None
    for n in (" ".join(words), " ".join(words[:2]), words[0]):
        if n in _MED_NAMES:
            return True, None
    close = difflib.get_close_matches(" ".join(words), list(_MED_NAMES), n=1, cutoff=0.82)
    if not close:
        close = difflib.get_close_matches(words[0], list(_MED_NAMES), n=1, cutoff=0.82)
    return False, (close[0].title() if close else None)


def normalise(raw, source="upload"):
    """Coerce model output into the record schema. Nothing here trusts the model's types."""
    raw = raw if isinstance(raw, dict) else {}
    patient = raw.get("patient") if isinstance(raw.get("patient"), dict) else {}
    rec = {
        "id": "rec_" + uuid.uuid4().hex[:8],
        "doc_type": raw.get("doc_type") if raw.get("doc_type") in DOC_TYPES else "other",
        "title": _s(raw.get("title"), 120) or "Health record",
        "date": _unswap(_date(raw.get("date"))),
        "facility": _s(raw.get("facility"), 160),
        "doctor": _s(raw.get("doctor"), 120),
        "patient": {"name": _s(patient.get("name"), 80), "age": _s(patient.get("age"), 20),
                    "sex": _s(patient.get("sex"), 10)},
        "language_detected": _s(raw.get("language_detected"), 10) or "en",
        "handwritten": bool(raw.get("handwritten")),
        "tests": [], "medicines": [], "diagnoses": [],
        "advice": [_s(a) for a in (raw.get("advice") or []) if _s(a)][:20],
        "follow_up": _s(raw.get("follow_up")),
        "overall_confidence": _conf(raw.get("overall_confidence")),
        "warnings": [], "unread": [], "explanation": {}, "source": source,
    }
    for t in (raw.get("tests") or [])[:120]:
        if not isinstance(t, dict) or not _s(t.get("name")):
            continue
        value = t.get("value")
        num = ranges.to_number(value)
        inequality = isinstance(value, str) and value.strip()[:1] in ("<", ">")
        rec["tests"].append({
            "name": _s(t.get("name"), 100),
            "value": _s(value, 60) if (num is None or inequality) else num,
            "unit": _s(t.get("unit"), 30) or "",
            "ref_low": ranges.to_number(t.get("ref_low")),
            "ref_high": ranges.to_number(t.get("ref_high")),
            "ref_text": _s(t.get("ref_text"), 80),
            "ref_source": None, "flag": "unknown",
            "source_text": _s(t.get("source_text"), 240), "page": _page(t.get("page")),
            "confidence": _conf(t.get("confidence")),
        })
    for m in (raw.get("medicines") or [])[:60]:
        if not isinstance(m, dict) or not _s(m.get("name")):
            continue
        rec["medicines"].append({k: _s(m.get(k), 200) for k in
                                 ("name", "generic", "strength", "dose", "frequency", "timing",
                                  "duration", "instructions")}
                                | {"source_text": _s(m.get("source_text"), 240), "page": _page(m.get("page")),
                                   "confidence": _conf(m.get("confidence"))})
    for d in (raw.get("diagnoses") or [])[:30]:
        name = _s(d.get("name") if isinstance(d, dict) else d, 160)
        if name:
            rec["diagnoses"].append({"name": name,
                                     "confidence": _conf(d.get("confidence") if isinstance(d, dict) else None, 0.8)})
    if rec["handwritten"]:
        # Handwriting is the hardest case and the costliest to get wrong, so the model's own
        # confidence is not trusted: every item is capped below the "please verify" line.
        for item in rec["tests"] + rec["medicines"] + rec["diagnoses"]:
            item["confidence"] = min(item["confidence"], HANDWRITTEN_CAP)
        rec["overall_confidence"] = min(rec["overall_confidence"], HANDWRITTEN_CAP)
    for u in (raw.get("unread") or [])[:20]:
        text = _s(u.get("text") if isinstance(u, dict) else u, 240)
        if text:
            rec["unread"].append({"text": text,
                                  "reason": _s(u.get("reason") if isinstance(u, dict) else None, 120)})
    return check(rec)


def check(rec):
    """Stage 2. Safe to re-run after the user edits a record."""
    for t in rec.get("tests") or []:
        if t.get("ref_source") == "standard":  # re-derive from the table after an edit
            t["ref_low"] = t["ref_high"] = None
        ranges.flag_test(t)
    warnings = []
    for m in rec.get("medicines") or []:
        known, suggestion = match_medicine(m.get("generic") or m.get("name"))
        if not known and m.get("generic"):
            known, suggestion = match_medicine(m.get("name"))
        m["known"] = known
        if not known and suggestion and _conf(m.get("confidence")) < 0.85:
            warnings.append(f"\"{m.get('name')}\" was hard to read. Did the document say \"{suggestion}\"? Please check.")
    for t in rec.get("tests") or []:
        if t.get("implausible"):
            t["confidence"] = min(_conf(t.get("confidence")), 0.3)
            warnings.append(f"{t.get('name')}: {t.get('value')} {t.get('unit') or ''} is not a possible value. "
                            "A decimal point was probably missed. Please correct it from the original.")
    today = dt.date.today().isoformat()
    if not rec.get("date"):
        warnings.append("No date was found on this document. Please add it so it appears in the right place on your timeline.")
    elif rec["date"] > today:
        warnings.append("The date on this document is in the future. Please check it.")
    elif rec["date"] < (dt.date.today() - dt.timedelta(days=730)).isoformat():
        # a misread digit in the year is common, especially in handwriting ("2026" read as "2020")
        warnings.append(f"The date was read as {rec['date']}, more than two years ago. If this is a recent "
                        "document, a digit was probably misread. Please check it.")
    if rec.get("handwritten"):
        warnings.append("This document is handwritten. Please check every medicine name and dose against the original.")
        if rec.get("date"):
            warnings.append(f"The date was read as {rec['date']}. Handwritten dates are easy to misread; please confirm it.")
    if rec.get("unread"):
        warnings.append(f"{len(rec['unread'])} line(s) could not be read reliably and were left out. "
                        "They are listed under \"Lines not used\"; add them by hand if they matter.")
    low = sum(1 for x in (rec.get("tests") or []) + (rec.get("medicines") or [])
              if _conf(x.get("confidence")) < 0.7)
    if low:
        warnings.append(f"{low} item(s) were read with low confidence and are marked below.")
    if any(t.get("flag") == "critical" for t in rec.get("tests") or []):
        warnings.append("One or more values are far outside the usual range. Please contact your doctor promptly.")
    if rec.get("doc_type") == "other" and not rec.get("tests") and not rec.get("medicines"):
        warnings.append("This does not look like a health record, or it could not be read. Try a sharper photo.")
    rec["warnings"] = warnings
    return rec


CONSULT_NOTE = """

This is a transcript of a doctor speaking during a consultation, not a scanned page. It may mix
English and Hindi. Extract only what the doctor prescribes or advises for this patient: medicines
(name, strength, dose, frequency, timing, duration), diagnoses, advice and follow-up. Do not invent
anything the doctor did not say; leave a field empty when it was not said. There are no test values
unless the doctor reads out a result. Use the transcript sentence as source_text.
Speech-to-text often misspells drug names (for example "telmezartin" for Telmisartan). When a word
clearly sounds like a known medicine, write its standard generic name; if you are not sure, keep
what was heard.
Never add advice or a follow-up the doctor did not say. For diagnoses, list what the doctor named;
if the doctor named none, you may list the single most likely condition from the patient's complaint
(for example "Insomnia" for years of poor sleep). It will be shown to the doctor as a suggestion to confirm."""


def _snap_medicine(m):
    """Speech-to-text misspells drug names. Replace a name with the reference-list match only when
    one candidate clearly wins; when several are close, keep the name and ask the doctor to check."""
    known, _ = match_medicine(m["name"])
    if known:
        return
    word = re.sub(r"\b(tab|tablet|cap|capsule|syp|syrup|inj|injection)\b\.?", " ", m["name"].lower())
    word = " ".join(w for w in re.sub(r"[^a-z0-9 ]+", " ", word).split() if not re.fullmatch(r"\d+(mg|ml|mcg|iu|g)?", w))
    if not word:
        return
    scores = sorted(((difflib.SequenceMatcher(None, word, n).ratio(), n) for n in _MED_NAMES), reverse=True)[:3]
    if not scores or scores[0][0] < 0.70:
        return
    best = scores[0][0]
    if len(scores) == 1 or best - scores[1][0] >= 0.08:
        m["heard_as"] = m["name"]
        m["name"] = scores[0][1].title()
    else:
        close = [n.title() for r, n in scores if best - r < 0.08]
        m["check"] = "Unclear name. Did you mean " + " or ".join(close) + "?"
        m["confidence"] = min(m.get("confidence") or 1, 0.5)


def _said(item, transcript):
    """True when a drafted diagnosis, advice line or follow-up shares a real word with an English
    (Latin-script) transcript. Other scripts are translated by the model, so they are not checked here."""
    words = [w for w in re.findall(r"[a-z]{4,}", (item or "").lower()) if w not in _FILLER]
    low = transcript.lower()
    return any(w in low or w[:5] in low for w in words)


_FILLER = {"with", "your", "after", "before", "days", "weeks", "week", "month", "months", "daily", "take", "then", "should",
           "come", "back", "review", "visit", "follow", "patient", "doctor", "advised"}


def from_consult(transcript, patient=None):
    """Draft a prescription from a consultation transcript. The doctor reviews and approves it."""
    text = str(transcript or "")[:20000]
    if len(text.strip()) < 20:
        raise ValueError("The recording is too short to write a prescription from.")
    raw, provider = llm.write_json(EXTRACT_PROMPT + CONSULT_NOTE + "\n\nDOCUMENT TEXT:\n" + text)
    raw = raw if isinstance(raw, dict) else {}
    raw["doc_type"] = "prescription"
    raw["date"] = raw.get("date") or dt.date.today().isoformat()
    p = patient if isinstance(patient, dict) else {}
    raw["patient"] = {k: p.get(k) or (raw.get("patient") or {}).get(k) for k in ("name", "age", "sex")}
    rec = normalise(raw, "consult")
    for m in rec["medicines"]:
        _snap_medicine(m)
    if not rec["medicines"] and not rec["diagnoses"]:
        raise ValueError("Prescription not made. This conversation does not seem to be a medical consultation. "
                         "Please keep the recording to the patient's symptoms, diagnosis and treatment.")
    latin = len(re.findall(r"[A-Za-z]", text)) > 0.6 * max(1, len(re.findall(r"\w", text)))
    if latin:  # keep only what was actually said; the rest is left for the doctor to fill in
        # a diagnosis the doctor did not name is offered as a suggestion to confirm, never filled in
        rec["suggested_diagnoses"] = [d.get("name") for d in rec["diagnoses"] if d.get("name") and not _said(d.get("name"), text)]
        rec["diagnoses"] = [d for d in rec["diagnoses"] if _said(d.get("name"), text)]
        rec["advice"] = [a for a in rec["advice"] if _said(a, text)]
        if rec.get("follow_up") and not _said(rec["follow_up"], text) and not re.search(r"\b(follow|review|come back|after|next)\b", text, re.I):
            rec["follow_up"] = None
    rec["extracted_by"] = provider
    rec["transcript"] = text
    return rec


class VisionUnavailable(Exception):
    """No vision model could read the file. The page falls back to on-device OCR."""


def _date_hint():
    """Handwritten two-digit years are the commonest misread ("26" taken for "24"). Knowing
    today's date lets the reader weigh a doubtful digit; the user still confirms the date."""
    today = dt.date.today()
    return (f" Today's date is {today.isoformat()}. Dates on Indian documents are written day/month/year, and a "
            f"two-digit year means 20YY (\"26/6/26\" is 26 June 2026). Read the date digit by digit. Most documents "
            f"are recent: if a handwritten year digit could be read two ways, and one reading gives a date within the "
            f"last year while the other is older or in the future, choose the recent one. Never return a date after today.")


def extract(filename, mime, data_b64, source="upload", ocr=None):
    """ocr: name of the on-device OCR engine when `data_b64` is its text output."""
    mime = (mime or "").split(";")[0].strip().lower()
    if mime == "image/jpg":
        mime = "image/jpeg"
    if mime == DOCX:
        data_b64, mime = base64.b64encode(_docx_text(data_b64).encode()).decode(), "text/plain"
    if mime not in MIME_OK:
        raise ValueError("Unsupported file type. Upload a photo, a PDF, a Word (.docx) or a text file.")
    if mime == "text/plain":
        text = base64.b64decode(data_b64).decode("utf-8", "replace")[:20000]
        if len(text.strip()) < 20:
            raise ValueError("No readable text was found in this document. Try a sharper, well-lit photo.")
        note = ("\n\nThe text below came from OCR and may contain misread characters. "
                "Lower the confidence of anything that looks garbled." if ocr else "")
        raw, provider = llm.write_json(EXTRACT_PROMPT + note + "\n\nDOCUMENT TEXT:\n" + text)
    else:
        try:
            raw, provider = llm.read_document(EXTRACT_PROMPT + _date_hint(), {"mime": mime, "data": data_b64})
        except llm.LLMError as e:
            raise VisionUnavailable(str(e)) from e
    rec = normalise(raw, source)
    rec["filename"] = _s(filename, 120)
    rec["extracted_by"] = f"{ocr} + {provider}" if ocr else provider
    if ocr:
        # backup path reads less reliably than the vision model: say so and mark items down
        for item in rec["tests"] + rec["medicines"]:
            item["confidence"] = round(item["confidence"] * 0.85, 2)
        rec["overall_confidence"] = round(rec["overall_confidence"] * 0.85, 2)
        check(rec)
        rec["warnings"].insert(0, "This document was read with the backup on-device reader, which is less "
                                  "accurate. Please compare every value with the original.")
    if rec.get("doc_type") == "other" and not rec.get("tests") and not rec.get("medicines") and not rec.get("diagnoses"):
        raise ValueError("This does not look like a medical document. Please upload medical documents only "
                         "(prescription, lab report, discharge summary or scan report). If it is one, try a sharper photo.")
    return rec


_MED_STATUS = {"confirmed_current": "the patient confirmed they take this now",
               "course_ended": "the prescribed course has ended",
               "unconfirmed": "written in the record; not confirmed as still being taken"}


def _caution(rec):
    """Whose record it is, whether it is saved, and everything that was not read with certainty.
    Without this the writing model would state a doubtful medicine as a fact."""
    out = {}
    name = (rec.get("patient") or {}).get("name")
    if name:
        out["patient"] = name
    if rec.get("under_review"):
        out["status"] = "OPEN DOCUMENT: uploaded just now, still under review, NOT saved yet"
    if rec.get("handwritten"):
        out["handwritten"] = True
    doubtful = [m.get("name") for m in (rec.get("tests") or []) + (rec.get("medicines") or [])
                if isinstance(m, dict) and isinstance(m.get("confidence"), (int, float)) and m["confidence"] < 0.7]
    doubtful += [d.get("name") for d in rec.get("diagnoses") or []
                 if isinstance(d, dict) and isinstance(d.get("confidence"), (int, float)) and d["confidence"] < 0.7]
    if doubtful:
        out["uncertain_items"] = [x for x in doubtful if x]
    unread = [u.get("text") for u in rec.get("unread") or [] if isinstance(u, dict) and u.get("text")]
    if unread:
        out["lines_not_read"] = unread[:8]
    return out


def _compact(rec):
    """What the writing model sees: facts and flags, no confidence noise."""
    return {
        "id": rec.get("id"), "type": rec.get("doc_type"), "title": rec.get("title"),
        "date": rec.get("date"), "facility": rec.get("facility"),
        "tests": [{"name": t.get("name"), "value": t.get("value"), "unit": t.get("unit"),
                   "range": t.get("ref_text"), "flag": t.get("flag")} for t in rec.get("tests") or []],
        "medicines": [dict({k: m.get(k) for k in ("name", "generic", "strength", "dose", "frequency",
                                                   "timing", "duration") if m.get(k)},
                           **({"status": _MED_STATUS[m["status"]]} if m.get("status") in _MED_STATUS else {}))
                      for m in rec.get("medicines") or []],
        "diagnoses": [d.get("name") for d in rec.get("diagnoses") or []],
        "advice": rec.get("advice") or [], "follow_up": rec.get("follow_up"),
        **_caution(rec),
    }


_SIDE = {"en": {"low": "below", "high": "above", "critical": "far outside"},
         "hi": {"low": "से कम", "high": "से अधिक", "critical": "से बहुत बाहर"}}


def _plain_finding(t, lang):
    """One factual sentence built from the checked values. No model involved."""
    value = f"{t.get('value')} {t.get('unit') or ''}".strip()
    rng = t.get("ref_text") or ("छपी नहीं है" if lang == "hi" else "not printed")
    if lang == "hi":
        return f"{t.get('name')}: {value}. यह संदर्भ सीमा ({rng}) {_SIDE['hi'][t['flag']]} है।"
    return f"{t.get('name')} is {value}, {_SIDE['en'][t['flag']]} the reference range ({rng})."


def _plain_summary(rec, lang):
    tests = rec.get("tests") or []
    abnormal = sum(1 for t in tests if t.get("flag") in ("low", "high", "critical"))
    meds = len(rec.get("medicines") or [])
    if lang == "hi":
        return (f"{rec.get('title')}: {len(tests)} जाँच मान, जिनमें से {abnormal} संदर्भ सीमा से बाहर हैं; "
                f"{meds} दवा(एँ)।")
    return (f"{rec.get('title')}: {len(tests)} test value(s), {abnormal} outside the reference range, "
            f"{meds} medicine(s).")


def _fallback_explanation(rec, lang):
    """Used when no model is reachable: plain facts from the flags, nothing more."""
    return {
        "summary": _plain_summary(rec, lang),
        "findings": [{"name": t["name"], "flag": t["flag"], "meaning": _plain_finding(t, lang)}
                     for t in rec.get("tests") or [] if t.get("flag") in ("low", "high", "critical")],
        "medicines": [{"name": m["name"], "purpose": (_MED_NAMES.get((m.get("generic") or m["name"]).lower(), {})
                                                      .get("class") or "Ask your doctor or pharmacist.")}
                      for m in rec.get("medicines") or []],
        "questions": ["What do the values outside the range mean for me?",
                      "Do I need any follow-up tests?"] if lang != "hi" else
                     ["सीमा से बाहर वाले मानों का मेरे लिए क्या मतलब है?", "क्या मुझे कोई और जाँच करानी चाहिए?"],
        "disclaimer": _disclaimer(lang), "fallback": True,
    }


def _verified_numbers(rec):
    """Every number the model is allowed to repeat: what is in the checked record, plus counts."""
    allowed = safety.numbers(json.dumps(_compact(rec), ensure_ascii=False))
    for t in rec.get("tests") or []:
        allowed |= safety.numbers(f"{t.get('ref_low')} {t.get('ref_high')}")
    allowed |= safety.numbers(json.dumps(rec.get("patient") or {}, ensure_ascii=False))
    tests = rec.get("tests") or []
    abnormal = sum(1 for t in tests if t.get("flag") in ("low", "high", "critical"))
    unknown = sum(1 for t in tests if t.get("flag") == "unknown")
    allowed |= {float(n) for n in (len(tests), abnormal, unknown, abnormal + unknown,
                                   len(tests) - abnormal, len(tests) - abnormal - unknown,
                                   len(rec.get("medicines") or []), len(rec.get("diagnoses") or []))}
    return allowed


def _doubtful_medicines(rec):
    """Names read with low confidence in a document the user has not checked and saved yet."""
    if not rec.get("under_review"):
        return set()
    return {_s(m.get("name"), 100) for m in rec.get("medicines") or []
            if isinstance(m.get("confidence"), (int, float)) and m["confidence"] < 0.7}


def explain(rec, lang="en"):
    lang = _lang(lang)
    by_name = {t.get("name"): t for t in rec.get("tests") or []}
    try:
        out, model = llm.write_json(EXPLAIN_PROMPT.format(
            language=_lang_name(lang), record=json.dumps(_compact(rec), ensure_ascii=False)))
    except llm.LLMError:
        return _fallback_explanation(rec, lang)

    # Numeric guard: a number the model wrote that is not in the checked record is treated as
    # invented, and that piece of text is replaced by the plain factual template.
    allowed = _verified_numbers(rec)
    replaced = 0
    findings = []
    for f in out.get("findings") or []:
        if not (isinstance(f, dict) and _s(f.get("name")) and _s(f.get("meaning"), 600)):
            continue
        name = _s(f["name"], 100)
        test = by_name.get(name)
        meaning = _s(f["meaning"], 600)
        # the code's flag wins over whatever the model wrote back
        flag = test.get("flag") if test else (_s(f.get("flag"), 10) or "unknown")
        if safety.unverified(meaning, allowed):
            replaced += 1
            if not (test and flag in _SIDE["en"]):
                continue
            meaning = _plain_finding(test, lang)
        findings.append({"name": name, "flag": flag, "meaning": meaning})

    summary = _s(out.get("summary"), 1200) or ""
    if not summary or safety.unverified(summary, allowed):
        replaced += bool(summary)
        summary = _plain_summary(rec, lang)

    medicines = []
    doubtful = _doubtful_medicines(rec)
    for m in out.get("medicines") or []:
        if not (isinstance(m, dict) and _s(m.get("name"))):
            continue
        purpose = _s(m.get("purpose"), 300)
        if purpose and safety.unverified(purpose, allowed):
            replaced += 1
            purpose = None
        name = _s(m["name"], 100)
        if name in doubtful:  # the name itself is not verified yet, so saying what it is for would be a guess
            medicines.append({"name": name, "purpose": None, "uncertain": True})
        else:
            medicines.append({"name": name, "purpose": purpose})

    questions = [q for q in (_s(q, 300) for q in out.get("questions") or [])
                 if q and not safety.unverified(q, allowed)][:5]
    return {"summary": summary, "findings": findings, "medicines": medicines, "questions": questions,
            "disclaimer": _disclaimer(lang), "guard_replaced": replaced, "model": model}


def _sorted(records):
    return sorted((r for r in records or [] if isinstance(r, dict)), key=lambda r: r.get("date") or "")


def overview(patient, records, lang="en"):
    lang = _lang(lang)
    if not records:
        return {"summary": "", "highlights": [], "watch": [], "disclaimer": _disclaimer(lang)}
    out, _ = llm.write_json(OVERVIEW_PROMPT.format(
        language=_lang_name(lang), patient=json.dumps(patient or {}, ensure_ascii=False),
        records=json.dumps([_compact(r) for r in _sorted(records)[-25:]], ensure_ascii=False)))
    return {"summary": _s(out.get("summary"), 1500) or "",
            "highlights": [_s(x, 300) for x in (out.get("highlights") or []) if _s(x)][:5],
            "watch": [_s(x, 300) for x in (out.get("watch") or []) if _s(x)][:5],
            "disclaimer": _disclaimer(lang)}


# ---- straight lookups: "what is my latest HbA1c" needs no model ----

_NEEDS_MODEL = re.compile(r"why|explain|mean|chang|trend|compar|differ|should|cause|normal for|kyu|kyon|matlab|"
                          r"previous|earlier|before|\bago\b|first|\bin (jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|\b20\d\d\b|pehle|पहले|"
                          r"क्यों|मतलब|बदल|तुलना|समझा", re.I)
_ABOUT_ME = re.compile(r"\b(my|latest|last|current|recent|mera|meri|mere)\b|मेर", re.I)
_QUALIFIERS = ("a1c", "ldl", "hdl", "vldl", "fasting", "post", "pp", "random", "free", "total", "direct", "indirect")


def _test_key(name):
    entry = ranges.lookup(name or "")
    return str(entry[0] if isinstance(entry, (tuple, list)) and entry else name or "").lower()


_SIDE_EN = {"normal": "within", "low": "below", "high": "above", "critical": "far outside"}
_SIDE_HI = {"normal": "के अंदर", "low": "से कम", "high": "से अधिक", "critical": "से बहुत बाहर"}


def _nice_date(iso):
    """2026-09-22 -> 22 Sep 2026; anything else is returned as it came."""
    try:
        d = dt.date.fromisoformat(iso)
        return f"{d.day} {d:%b %Y}"
    except (TypeError, ValueError):
        return iso or ""


def _direct(question, records, lang):
    """Answer a plain "what is my X" from the saved records by code. Returns None when the
    question needs explaining, names no test, or names more than one."""
    if lang not in ("en", "hi") or _NEEDS_MODEL.search(question) or not _ABOUT_ME.search(question):
        return None
    draft_tests = {_test_key(t.get("name")) for r in records if isinstance(r, dict) and r.get("under_review")
                   for t in r.get("tests") or [] if isinstance(t, dict)}
    q = " " + re.sub(r"[^a-z0-9\u0900-\u097f]+", " ", question.lower()) + " "
    hits = {}
    for r in _sorted(records):
        if r.get("under_review"):
            continue
        for t in r.get("tests") or []:
            name = _s(t.get("name"), 80)
            if not name or t.get("value") in (None, ""):
                continue
            entry = ranges.lookup(name)
            canon = entry[0] if isinstance(entry, (tuple, list)) and entry else name
            keys = {re.sub(r"[^a-z0-9]+", " ", n.lower()).strip() for n in (name, str(canon))}
            if any(len(k) > 2 and f" {k} " in q for k in keys):
                label = " " + " ".join(keys) + " "
                if any(f" {w} " in q and f" {w} " not in label for w in _QUALIFIERS):
                    continue  # "hemoglobin a1c" is not Hemoglobin; "fasting glucose" is not Glucose
                hits[str(canon).lower()] = (t, r)  # later records overwrite: the latest wins
    if len(hits) != 1:
        return None
    t, r = next(iter(hits.values()))
    low = isinstance(t.get("confidence"), (int, float)) and not isinstance(t.get("confidence"), bool) and t["confidence"] < 0.7
    if low or _test_key(t.get("name")) in draft_tests:
        return None  # a doubtful reading, or one the open document also has: let the full answer explain
    value = f"{t.get('value')} {t.get('unit') or ''}".strip()
    title, date, rng, flag = r.get("title") or "a saved record", _nice_date(r.get("date")), t.get("ref_text"), t.get("flag")
    if lang == "hi":
        text = f"आपके रिकॉर्ड में सबसे नया {t.get('name')} {value} है। यह {title} ({date}) से है।"
        if rng and flag in _SIDE_HI:
            text += f" रिपोर्ट पर छपी सीमा {rng} है; यह मान सीमा {_SIDE_HI[flag]} है।"
    else:
        text = f"Your latest {t.get('name')} is {value}, from {title} dated {date}."
        if rng and flag in _SIDE_EN:
            text += f" The range printed on the report is {rng}; this value is {_SIDE_EN[flag]} that range."
    return {"answer": text, "sources": [r.get("id")], "label": "records", "direct": True}


def _asked_language(question):
    """The language the question explicitly asks to be answered in, if any."""
    q = " " + question.lower() + " "
    for code, english, native, _ in LANGUAGES:
        name = english.split(" (")[0].lower()
        if (f" in {name} " in q or f" in {name}." in q or f" in {name}?" in q or f" {name} mein " in q
                or f" {name} me " in q or f" {name} main " in q or f"{native.lower()} में" in q or f"{native.lower()} मध्ये" in q):
            return code
    return None


def _mostly_devanagari(text):
    letters = [c for c in str(text or "") if c.isalpha()]
    return not letters or sum("ऀ" <= c <= "ॿ" for c in letters) / len(letters) > 0.5


OFFTOPIC = {
    "en": ("I am Sehat Copilot, your health assistant, so I only help with health.\n"
           "• Your reports, test values and medicines\n• Symptoms, sleep, food and exercise\n"
           "• What to ask your doctor\nTry: What does my latest HbA1c mean?"),
    "hi": ("मैं सेहत कोपायलट हूँ, सिर्फ़ सेहत से जुड़े सवालों में मदद करता हूँ।\n"
           "• रिपोर्ट, जाँच और दवाइयाँ\n• लक्षण, नींद, खाना, व्यायाम\n• डॉक्टर से क्या पूछें"),
}


def _bullets(text):
    """Chat answers read as short bullet points: one point per line or sentence, each starting "• "."""
    text = (text or "").strip()
    lines = [x.strip(" -*•\t") for x in re.split(r"\n+", text) if x.strip(" -*•\t")]
    if len(lines) == 1:
        lines = [x.strip() for x in re.split(r"(?<=[.!?।])\s+(?=[^\s])", lines[0]) if x.strip()]
    if len(lines) < 2:
        return text
    return "\n".join("• " + x for x in lines)


def ask(question, records, lang="en"):
    lang = _lang(lang)
    question = _s(question, 600)
    if not question:
        raise ValueError("Type a question first.")
    lang = _asked_language(question) or lang  # "answer in Hindi" beats the interface language
    names = set(_MED_NAMES) | {n.lower() for r in (records or []) if isinstance(r, dict)
                               for m in r.get("medicines") or [] if isinstance(m, dict)
                               for n in (m.get("name"), m.get("generic")) if n}
    names |= {" ".join(w for w in n.split() if w not in ("tab", "tablet", "cap", "capsule", "syp", "inj") and not w[:1].isdigit())
              for n in list(names)}
    gated = safety.gate(question, lang, names)  # emergency, then medication change: no model call, before _direct
    if gated:
        return dict(gated, disclaimer=_disclaimer(lang))
    direct = _direct(question, records or [], lang)
    if direct:
        return dict(direct, disclaimer=_disclaimer(lang))
    prompt = ASK_PROMPT.format(
        language=_lang_name(lang), question=question,
        records=json.dumps([_compact(r) for r in _sorted(records)[-25:]], ensure_ascii=False))
    started = time.time()
    out, _ = llm.write_json(prompt)
    if lang == "hi" and not _mostly_devanagari(out.get("answer")) and time.time() - started < 6:
        # the model mirrored a Hinglish question: ask once more, in the right script
        try:
            out, _ = llm.write_json(prompt + " Your last answer used Latin letters. Write it again in Devanagari (हिंदी).")
        except llm.LLMError:
            pass
    if out.get("kind") == "offtopic":  # a health assistant stays a health assistant
        return {"answer": OFFTOPIC.get(lang) or OFFTOPIC["en"], "sources": [], "label": "general", "disclaimer": _disclaimer(lang)}
    ids = {r.get("id") for r in records if isinstance(r, dict)}
    sources = [x for x in (out.get("sources") or []) if x in ids]
    # "From your records" is only shown when the answer really cites a saved record
    if out.get("kind") == "doctor":
        label = "doctor"
    elif sources:
        label = "records"
    else:
        label = "general"
    return {"answer": _bullets((_s(out.get("answer"), 2500) or "").replace("**", "")),
            "sources": sources, "label": label, "disclaimer": _disclaimer(lang)}


# ---- interface labels on demand ----

LABELS_PROMPT = """Translate the values of this JSON object from English into {language} for the interface of a health-records app used by ordinary patients.

Rules:
- Return ONE JSON object with exactly the same keys.
- Simple everyday words in the native script. Short labels stay short.
- Keep unchanged: Sehat Copilot, Saathi, ABHA, ABDM, FHIR, PDF, HbA1c, and anything inside curly braces such as {{n}} or {{p}}.
- No notes or explanations.

{chunk}"""


def translate_labels(lang, texts):
    """Translate up to 40 interface labels. A label whose {placeholders} do not survive is dropped."""
    if lang not in LANGS or lang == "en":
        raise ValueError("Unknown language.")
    if not isinstance(texts, dict) or not texts:
        raise ValueError("Nothing to translate.")
    part = {str(k)[:60]: str(v)[:600] for k, v in list(texts.items())[:40] if isinstance(v, str) and v.strip()}
    out, _ = llm.write_json(LABELS_PROMPT.format(language=LANGS[lang], chunk=json.dumps(part, ensure_ascii=False, indent=0)))
    holders = lambda x: sorted(re.findall(r"\{[a-z]+\}", x))
    return {k: out[k].strip() for k, v in part.items()
            if isinstance(out.get(k), str) and out[k].strip() and holders(out[k]) == holders(v)}


# ---- medicine cross-check ----

MEDCHECK_NOTE = {
    "en": "From a small reference list made for this prototype and not reviewed by a pharmacist. It can miss "
          "interactions and can flag ones that do not matter for you. Do not change any medicine because of it; "
          "ask your doctor or pharmacist.",
    "hi": "यह इस प्रोटोटाइप के लिए बनी एक छोटी संदर्भ सूची से है, जिसे किसी फार्मासिस्ट ने जाँचा नहीं है। इसमें कुछ "
          "बातें छूट सकती हैं और कुछ ऐसी भी दिख सकती हैं जो आपके लिए मायने नहीं रखतीं। इसके आधार पर कोई दवा न बदलें; "
          "अपने डॉक्टर या फार्मासिस्ट से पूछें।",
}
_SEVERITY = {"major": 3, "moderate": 2, "minor": 1}


def _find_medicine(name):
    words = re.sub(r"\b(tab|tablet|cap|capsule|syp|syrup|inj|injection)\b\.?", " ", (name or "").lower())
    words = [w for w in re.sub(r"[^a-z0-9 ]+", " ", words).split()
             if not re.fullmatch(r"\d+(mg|ml|mcg|iu|g|k)?|mg|ml|mcg|iu", w)]
    for n in (" ".join(words), " ".join(words[:2]), words[0] if words else ""):
        if n and n in _MED_NAMES:
            return _MED_NAMES[n]
    return None


_INSTRUCTION = re.compile(r"(take|give|use|separate|space|reduce|increase|adjust|monitor|check|consider|switch|"
                          r"dose|needs?|requires?|should|must|prefer|limit|hold|withhold)\b", re.I)


_DOSE_TALK = re.compile("dose|monitor|adjust", re.I)


def _neutral(note):
    """Reference notes describe a risk. Any instruction in them ("avoid the combination") is
    dropped: this app never tells anyone to change a medicine."""
    note = _s(note, 300) or ""
    parts = [p.strip() for p in note.split(";") if p.strip()]
    # the first clause states the risk; later clauses that tell the reader what to do are dropped
    keep = parts[:1] + [p for p in parts[1:] if not (_INSTRUCTION.match(p) or _DOSE_TALK.search(p))]
    note = "; ".join(keep)
    return re.sub(r"[;,.]?\s*(avoid|do not|don't|stop|must not|never)\b[^.;]*", "", note, flags=re.I).strip(" ;,.-") + "."


def medcheck(medicines, lang="en"):
    """Duplicate ingredients and known interaction pairs among the user's current medicines.
    Pure lookup in data/medicines.json: no model is involved."""
    items, found = [], []
    for m in (medicines or [])[:40]:
        if not isinstance(m, dict) or not _s(m.get("name")):
            continue
        entry = _find_medicine(m.get("generic")) or _find_medicine(m.get("name"))
        name = _s(m.get("name"), 100)
        items.append({"name": name, "ingredient": re.sub(r"\s*\(.*?\)", "", entry["generic"]) if entry else None,
                      "class": entry.get("class") if entry else None, "known": bool(entry)})
        if entry:
            found.append((name, entry))

    by_id = {}
    for name, entry in found:
        by_id.setdefault(entry["id"], []).append(name)
    duplicates = [{"ingredient": re.sub(r"\s*\(.*?\)", "", next(e["generic"] for _, e in found if e["id"] == mid)),
                   "names": sorted(set(names), key=str.lower)}
                  for mid, names in by_id.items() if len({n.lower() for n in names}) > 1]

    pairs = {}
    for name_a, a in found:
        for name_b, b in found:
            if a["id"] == b["id"]:
                continue
            for inter in a.get("interactions") or []:
                if inter["with"] == b["id"] or inter["with"] in (b.get("class_tags") or []):
                    key = tuple(sorted((a["id"], b["id"])))
                    rank = _SEVERITY.get(inter.get("severity"), 1)
                    if key not in pairs or rank > pairs[key][0]:
                        pairs[key] = (rank, {"a": re.sub(r"\s*\(.*?\)", "", a["generic"]),
                                             "b": re.sub(r"\s*\(.*?\)", "", b["generic"]),
                                             "names": [name_a, name_b],
                                             "severity": inter.get("severity") if inter.get("severity") in _SEVERITY else "minor",
                                             "note": _neutral(inter.get("note"))})
    interactions = [v for _, v in sorted(pairs.values(), key=lambda x: -x[0])]
    return {"items": items, "duplicates": duplicates, "interactions": interactions,
            "disclaimer": MEDCHECK_NOTE.get(lang, MEDCHECK_NOTE["en"])}
