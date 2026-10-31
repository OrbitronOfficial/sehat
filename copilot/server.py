"""Sehat Copilot server. Stateless: records live on the user's device, the server only
reads documents, checks values, writes explanations and builds FHIR bundles.

Local:  python server.py   ->  http://localhost:8820
Vercel: api/index.py subclasses Handler.
"""
import base64
import binascii
import json
import mimetypes
import os
import time
import re
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
PUBLIC = os.path.join(ROOT, "public")
HUB = os.path.dirname(ROOT)  # the Sehat network site (marketplace, hospital, pharmacy) one level up
MAX_BODY = 6 * 1024 * 1024
MAX_AUDIO = 8 * 1024 * 1024  # decoded; the base64 body is a third larger
AUDIO_EXT = {"webm": "webm", "ogg": "ogg", "mp4": "mp4", "m4a": "m4a", "mpeg": "mp3", "mp3": "mp3",
             "wav": "wav", "x-wav": "wav", "wave": "wav", "flac": "flac", "x-m4a": "m4a", "aac": "m4a"}
# module scripts need a JavaScript type; Windows can report .js as text/plain
TYPES = {".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
         ".svg": "image/svg+xml", ".glb": "model/gltf-binary", ".css": "text/css; charset=utf-8"}
# clean URLs: the site is the front door, the app lives at /app
PAGES = {"/copilot": "landing.html", "/app": "index.html", "/login": "login.html", "/pricing": "pricing.html"}


def _load_env():
    path = os.path.join(ROOT, ".env")
    if not os.path.exists(path):
        return
    with open(path, encoding="utf-8-sig") as f:
        for line in f:
            if "=" in line and not line.lstrip().startswith("#"):
                k, v = line.strip().split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())


_load_env()

import cloud  # noqa: E402
import team  # noqa: E402
import fhir  # noqa: E402
import insights  # noqa: E402
import llm  # noqa: E402
import pipeline  # noqa: E402

SAMPLES = [
    {"id": "lab-mar", "title": "Lab report, March 2026", "doc_type": "lab_report", "url": "/samples/lab-2026-03.png"},
    {"id": "rx-mar", "title": "Prescription, March 2026", "doc_type": "prescription", "url": "/samples/prescription-2026-03.png"},
    {"id": "lab-jun", "title": "Lab report, June 2026", "doc_type": "lab_report", "url": "/samples/lab-2026-06.png"},
    {"id": "dis-aug", "title": "Discharge summary, August 2026", "doc_type": "discharge_summary", "url": "/samples/discharge-2026-08.png"},
    {"id": "lab-sep", "title": "Lab report, September 2026", "doc_type": "lab_report", "url": "/samples/lab-2026-09.png"},
]


def _json_file(name, default):
    try:
        with open(os.path.join(ROOT, "data", name), encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


HI_TYPES = {"lab_report": "DiagnosticReport", "diagnostic_report": "DiagnosticReport",
            "prescription": "Prescription", "discharge_summary": "DischargeSummary"}


def mock_abha(number):
    """Simulated ABDM sandbox: validates the format and returns canned records."""
    digits = re.sub(r"\D", "", str(number or ""))
    if len(digits) != 14:
        raise ValueError("An ABHA number has 14 digits, for example 12-3456-7890-1234.")
    data = _json_file("abha_mock.json", {"name": "Demo User", "records": []})
    records = [pipeline.check(dict(r, source="abha")) for r in data.get("records", [])]
    name = data.get("name") or "Demo User"
    # ABDM calls each visit or report a hospital holds a "care context"; consent is given per
    # record type ("health information type") and date range, then chosen contexts are fetched.
    contexts = [{"reference": r.get("id"), "display": r.get("title") or "Record", "date": r.get("date"),
                 "facility": re.sub(r"\s*\(via ABDM\)", "", r.get("facility") or "") or "Health facility",
                 "hi_type": HI_TYPES.get(r.get("doc_type"), "HealthDocumentRecord")} for r in records]
    return {"linked": True, "mock": True, "care_contexts": contexts,
            "abha_number": f"{digits[:2]}-{digits[2:6]}-{digits[6:10]}-{digits[10:]}",
            "abha_address": re.sub(r"[^a-z]", "", name.lower())[:12] + digits[-4:] + "@abdm",
            "name": name, "records": records}


class Handler(BaseHTTPRequestHandler):
    server_version = "SehatCopilot/1.0"

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s\n" % (self.command, fmt % args))

    def _send(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _body(self, limit=MAX_BODY):
        length = int(self.headers.get("Content-Length") or 0)
        if length > limit:
            raise ValueError("That file is too large. Please keep uploads under 3 MB.")
        try:
            data = json.loads(self.rfile.read(length) or b"{}")
        except ValueError:
            raise ValueError("Request body must be JSON.")
        if not isinstance(data, dict):
            raise ValueError("Request body must be a JSON object.")
        return data

    def _static(self, path):
        if path in ("", "/") or path.rstrip("/") == "/v2":  # Sehat's front door is the v2 glass landing; v1 stays at /hub/
            path = "/hub/v2.html"
        base, rel = PUBLIC, PAGES.get(path.rstrip("/") or "/") or path.lstrip("/")
        if path.startswith("/hub/"):
            base, rel = HUB, (path[5:] or "index.html")
            if "/" in rel:  # only the hub's own top-level files, never copilot/ or .git
                return self._send(404, {"error": "Not found"})
        full = os.path.normpath(os.path.join(base, rel))
        if not (full == base or full.startswith(base + os.sep)) or not os.path.isfile(full):
            return self._send(404, {"error": "Not found"})
        with open(full, "rb") as f:
            body = f.read()
        self.send_response(200)
        ext = os.path.splitext(full)[1].lower()
        self.send_header("Content-Type", TYPES.get(ext) or mimetypes.guess_type(full)[0] or "application/octet-stream")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split("?")[0]
        if path == "/api/health":
            return self._send(200, {"ok": True, "gemini": bool(os.environ.get("GEMINI_API_KEY")),
                                    "keys": {"gemini": len(llm._keys("GEMINI_API_KEY")), "groq": len(llm._keys("GROQ_API_KEY"))},
                                    "groq": bool(os.environ.get("GROQ_API_KEY"))})
        if path == "/api/langs":
            return self._send(200, {"languages": pipeline.language_list()})
        if path == "/api/samples":
            return self._send(200, {"samples": SAMPLES})
        if path == "/api/demo":
            return self._send(200, _json_file("demo.json", {"patient": {}, "records": []}))
        if path.startswith("/api/"):
            return self._send(404, {"error": "Not found"})
        return self._static(path)

    def do_POST(self):
        path = self.path.split("?")[0]
        try:
            b = self._body(MAX_AUDIO * 4 // 3 + 4096 if path == "/api/transcribe" else MAX_BODY)
            lang = b.get("lang") or "en"
            if path == "/api/extract":
                if not b.get("data"):
                    raise ValueError("No file was received.")
                llm.rest(b.get("skip"))
                out = {"record": _extract(b), "resting": llm.resting()}
            elif path == "/api/reflag":
                out = {"record": pipeline.check(_record(b))}
            elif path == "/api/explain":
                out = {"explanation": pipeline.explain(_record(b), lang)}
            elif path == "/api/overview":
                out = {"overview": pipeline.overview(b.get("patient"), b.get("records") or [], lang)}
            elif path == "/api/ask":
                out = pipeline.ask(b.get("question"), b.get("records") or [], lang)
            elif path == "/api/insights":
                out = insights.build(b.get("records") or [], lang, vitals=b.get("vitals"), patient=b.get("patient"))
            elif path == "/api/journal_summary":
                out = insights.journal_summary(b.get("entries"), b.get("since"), lang)
            elif path == "/api/sync":  # save this account's encrypted vault (ciphertext only)
                out = cloud.save(b.get("id"), b.get("token"), b.get("vault"), b.get("at"))
            elif path == "/api/sync/load":  # credentials in the body, never in the URL
                out = {"vault": cloud.load(b.get("id"), b.get("token"))}
            elif path == "/api/transcribe":
                out = {"text": _transcribe(b)}
            elif path == "/api/medcheck":
                out = pipeline.medcheck(b.get("medicines") or [], lang)
            elif path == "/api/translate":
                out = {"lang": lang, "translations": pipeline.translate_labels(lang, b.get("texts"))}
            elif path == "/api/abha":
                out = mock_abha(b.get("abha"))
            elif path == "/api/consult":  # doctor beta: transcript to a draft prescription
                out = pipeline.from_consult(b.get("transcript"), b.get("patient"))
            elif path == "/api/consult/send":  # doctor approved: queue it for the patient's app
                out = inbox_send(b)
            elif path == "/api/team":  # doctor's staff: to-do list access only
                out = team.handle(b)
            elif path == "/api/inbox":  # patient app collects prescriptions sent to its family names
                out = {"records": inbox_pull(b.get("names"))}
            elif path == "/api/fhir":
                out = fhir.bundle(b.get("patient"), b.get("records") or [], b.get("vitals"))
            else:
                return self._send(404, {"error": "Not found"})
            return self._send(200, out)
        except cloud.SyncError as e:
            return self._send(e.status, {"error": str(e)})
        except PermissionError as e:
            return self._send(403, {"error": str(e)})
        except ValueError as e:
            return self._send(400, {"error": str(e)})
        except pipeline.VisionUnavailable as e:
            sys.stderr.write(f"Vision unavailable: {e}\n")
            return self._send(503, {"code": "vision_unavailable",
                                    "error": "The AI document reader is busy right now. Please try again in a "
                                             "minute, or upload a photo instead of a PDF."})
        except llm.VoiceUnavailable as e:
            sys.stderr.write(f"Voice unavailable: {e}\n")
            return self._send(503, {"code": "voice_unavailable",
                                    "error": "Voice input is not available right now. Please type your question."})
        except llm.LLMError as e:
            sys.stderr.write(f"LLM error: {e}\n")
            return self._send(503, {"error": "The AI reader is busy or unreachable right now. Please try again in a moment."})
        except Exception as e:  # never leak a traceback to the page
            sys.stderr.write(f"Server error on {path}: {e!r}\n")
            return self._send(500, {"error": "Something went wrong on our side. Please try again."})


def _saved_sample(sample_id):
    """The saved reading of a bundled sample, from an earlier run of this same pipeline."""
    sample = next((s for s in SAMPLES if s["id"] == sample_id), None)
    saved = sample and next((r for r in _json_file("demo.json", {}).get("records", [])
                             if r.get("file_url") == sample["url"]), None)
    if not saved:
        return None
    rec = pipeline.check(dict(saved, id="rec_" + os.urandom(4).hex(), source="sample"))
    rec["extracted_by"] = f"{saved.get('extracted_by')} (saved reading)"
    return rec


def _extract(b):
    # a bundled sample is answered at once from its saved reading: no model call, no quota spent
    rec = b.get("sample_id") and not b.get("ocr") and _saved_sample(b.get("sample_id"))
    if rec:
        return rec
    return pipeline.extract(b.get("filename"), b.get("mime"), b["data"], ocr=b.get("ocr") and "tesseract")


def _inbox_rw(items=None):
    """Approved prescriptions waiting for the patient's app (private blob on Vercel, data/ locally)."""
    if items is None:
        return cloud.get_doc("doctor_inbox", []) or []
    cloud.put_doc("doctor_inbox", items)


def inbox_send(b):
    """Beta, local only: an approved prescription waits here until the patient's app collects it."""
    rec = b.get("record")
    name = str(((rec or {}).get("patient") or {}).get("name") or "").strip()
    if not isinstance(rec, dict) or not name:
        raise ValueError("Add the patient's name before sending.")
    rec["approved_by_doctor"] = True
    items = _inbox_rw()
    items.append({"to": name.lower(), "record": rec, "at": int(time.time())})
    _inbox_rw(items)
    return {"ok": True, "queued": name}


def inbox_pull(names):
    want = {str(n).strip().lower() for n in (names or []) if str(n).strip()}
    items = _inbox_rw()
    mine = [i for i in items if i.get("to") in want]
    if mine:
        _inbox_rw([i for i in items if i.get("to") not in want])
    return [i["record"] for i in mine]


def _transcribe(b):
    """Validate a base64 voice clip and turn it into text. Raises ValueError (400) on bad input."""
    raw = b.get("audio")
    if not isinstance(raw, str) or not raw.strip():
        raise ValueError("No audio was received.")
    mime = str(b.get("mime") or "audio/webm").split(";")[0].strip().lower()
    kind, _, sub = mime.partition("/")
    if kind not in ("audio", "video") or sub not in AUDIO_EXT:
        raise ValueError("That audio format is not supported.")
    if raw.startswith("data:"):
        raw = raw.partition(",")[2]
    if len(raw) > MAX_AUDIO * 4 // 3 + 8:
        raise ValueError("That recording is too long. Please keep it under a minute or two.")
    try:
        audio = base64.b64decode(raw, validate=True)
    except (binascii.Error, ValueError):
        raise ValueError("The audio was not valid.")
    if not audio or len(audio) > MAX_AUDIO:
        raise ValueError("No audio was received." if not audio else "That recording is too long. Please keep it under a minute or two.")
    code = re.split(r"[-_]", str(b.get("lang") or "").lower())[0]
    text = llm.transcribe(audio, f"audio/{AUDIO_EXT[sub]}", "voice." + AUDIO_EXT[sub], code)
    if not text:
        raise ValueError("I could not hear any words. Please try again.")
    return text


def _record(body):
    rec = body.get("record")
    if not isinstance(rec, dict):
        raise ValueError("A record is required.")
    return rec


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else int(os.environ.get("PORT", 8820))
    print(f"Sehat Copilot on http://localhost:{port}")
    ThreadingHTTPServer(("", port), Handler).serve_forever()
