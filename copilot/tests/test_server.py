"""HTTP server: real requests to a throwaway local instance. No network beyond 127.0.0.1; the model is stubbed.

Run: python -m unittest discover tests
"""
import base64
import http.client
import json
import os
import sys
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import llm  # noqa: E402
import safety  # noqa: E402
import server  # noqa: E402

LAB = {"id": "r1", "doc_type": "lab_report", "title": "Blood test", "date": "2026-06-18",
       "tests": [{"name": "Hemoglobin", "value": 10, "unit": "g/dL", "confidence": 0.95}]}


class ServerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._quiet = mock.patch.object(server.Handler, "log_message", lambda *a, **k: None)
        cls._quiet.start()
        cls.httpd = ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
        cls.port = cls.httpd.server_address[1]
        cls.thread = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.thread.start()
        cls.opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        cls.thread.join(timeout=5)
        cls._quiet.stop()

    # -- helpers --
    def url(self, path):
        return f"http://127.0.0.1:{self.port}{path}"

    def get(self, path):
        try:
            with self.opener.open(self.url(path), timeout=10) as r:
                return r.status, r.headers, r.read()
        except urllib.error.HTTPError as e:
            return e.code, e.headers, e.read()

    def post(self, path, body=None, raw=None):
        data = raw if raw is not None else json.dumps(body).encode("utf-8")
        req = urllib.request.Request(self.url(path), data=data, method="POST",
                                     headers={"Content-Type": "application/json"})
        try:
            with self.opener.open(req, timeout=10) as r:
                return r.status, json.loads(r.read())
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read())

    def raw_request(self, method, path, headers=None, body=b""):
        conn = http.client.HTTPConnection("127.0.0.1", self.port, timeout=10)
        try:
            conn.request(method, path, body=body, headers=headers or {})
            r = conn.getresponse()
            return r.status, r.getheader("Content-Type"), r.read()
        finally:
            conn.close()

    # -- GET --
    def test_health(self):
        status, headers, body = self.get("/api/health")
        self.assertEqual(status, 200)
        self.assertIn("application/json", headers["Content-Type"])
        data = json.loads(body)
        self.assertTrue(data["ok"])
        self.assertIsInstance(data["gemini"], bool)
        self.assertIsInstance(data["groq"], bool)

    def test_responses_are_not_cached(self):
        self.assertEqual(self.get("/api/health")[1]["Cache-Control"], "no-store")

    def test_samples_lists_five(self):
        samples = json.loads(self.get("/api/samples")[2])["samples"]
        self.assertEqual(len(samples), 5)
        self.assertEqual(len({s["id"] for s in samples}), 5)
        for s in samples:
            self.assertTrue(s["url"].startswith("/samples/"))

    def test_sample_images_exist(self):
        for s in server.SAMPLES:
            self.assertEqual(self.get(s["url"])[0], 200, s["url"])

    def test_langs_has_english_and_hindi(self):
        codes = {x["code"] for x in json.loads(self.get("/api/langs")[2])["languages"]}
        self.assertTrue({"en", "hi"} <= codes)

    def test_demo(self):
        data = json.loads(self.get("/api/demo")[2])
        self.assertIn("records", data)

    def test_root_serves_html(self):
        status, headers, body = self.get("/")
        self.assertEqual(status, 200)
        self.assertIn("text/html", headers["Content-Type"])
        self.assertIn(b"<html", body.lower())

    def test_app_page_serves_html(self):
        status, headers, _ = self.get("/app")
        self.assertEqual(status, 200)
        self.assertIn("text/html", headers["Content-Type"])

    def test_static_asset_content_type(self):
        status, headers, _ = self.get("/app.js")
        self.assertEqual(status, 200)
        self.assertIn("javascript", headers["Content-Type"])

    def test_unknown_api_is_404_json(self):
        status, headers, body = self.get("/api/nope")
        self.assertEqual(status, 404)
        self.assertIn("application/json", headers["Content-Type"])
        self.assertEqual(json.loads(body), {"error": "Not found"})

    def test_unknown_page_is_404(self):
        self.assertEqual(self.get("/no-such-page.html")[0], 404)

    def test_path_traversal_does_not_serve_source(self):
        for path in ("/../server.py", "/..%2fserver.py", "/../../server.py", "/public/../../server.py",
                     "/..\\server.py"):
            status, _, body = self.raw_request("GET", path)
            self.assertEqual(status, 404, path)
            self.assertNotIn(b"class Handler", body, path)

    def test_query_string_is_ignored(self):
        self.assertEqual(self.get("/api/health?x=1")[0], 200)

    # -- POST --
    def test_reflag_returns_flags(self):
        status, out = self.post("/api/reflag", {"record": LAB})
        self.assertEqual(status, 200)
        test = out["record"]["tests"][0]
        self.assertEqual(test["flag"], "low")
        self.assertEqual(test["ref_source"], "standard")

    def test_reflag_without_record_is_400(self):
        status, out = self.post("/api/reflag", {})
        self.assertEqual(status, 400)
        self.assertIn("record", out["error"].lower())

    def test_fhir_returns_bundle(self):
        status, out = self.post("/api/fhir", {"patient": {"name": "Asha"}, "records": [LAB]})
        self.assertEqual(status, 200)
        self.assertEqual(out["resourceType"], "Bundle")
        kinds = [e["resource"]["resourceType"] for e in out["entry"]]
        self.assertIn("Observation", kinds)
        self.assertIn("Composition", kinds)

    def test_abha_bad_number_is_400_with_message(self):
        status, out = self.post("/api/abha", {"abha": "123"})
        self.assertEqual(status, 400)
        self.assertIn("14 digits", out["error"])

    def test_abha_lists_care_contexts_for_every_record(self):
        status, out = self.post("/api/abha", {"abha": "12-3456-7890-1234"})
        self.assertEqual(status, 200)
        self.assertTrue(out["mock"])
        self.assertEqual({c["reference"] for c in out["care_contexts"]}, {r["id"] for r in out["records"]})
        for c in out["care_contexts"]:
            self.assertIn(c["hi_type"], ("DiagnosticReport", "Prescription", "DischargeSummary", "HealthDocumentRecord"))
            self.assertNotIn("via ABDM", c["facility"])

    def test_abha_good_number(self):
        status, out = self.post("/api/abha", {"abha": "12-3456-7890-1234"})
        self.assertEqual(status, 200)
        self.assertTrue(out["linked"])

    def test_invalid_json_is_400(self):
        status, out = self.post("/api/reflag", raw=b"{not json")
        self.assertEqual(status, 400)
        self.assertIn("JSON", out["error"])

    def test_non_object_json_is_400(self):
        status, out = self.post("/api/reflag", raw=b"[1, 2]")
        self.assertEqual(status, 400)
        self.assertIn("JSON object", out["error"])

    def test_extract_unsupported_mime_is_400(self):
        with mock.patch.object(llm, "write_json", side_effect=AssertionError("model called")), \
                mock.patch.object(llm, "read_document", side_effect=AssertionError("model called")):
            status, out = self.post("/api/extract", {"filename": "a.zip", "mime": "application/zip", "data": "AAAA"})
        self.assertEqual(status, 400)
        self.assertIn("Unsupported file type", out["error"])

    def test_extract_without_data_is_400(self):
        status, out = self.post("/api/extract", {"mime": "image/png"})
        self.assertEqual(status, 400)
        self.assertIn("No file", out["error"])

    def test_ask_emergency_uses_fixed_reply_without_model(self):
        with mock.patch.object(llm, "write_json", side_effect=AssertionError("model called")) as m:
            status, out = self.post("/api/ask", {"question": "I have chest pain right now", "records": [LAB]})
        self.assertEqual(status, 200)
        m.assert_not_called()
        self.assertEqual(out["answer"], safety.template("emergency", "en"))
        self.assertEqual(out["gate"], "emergency")
        self.assertEqual(out["label"], "emergency")
        self.assertIn("112", out["answer"])

    def test_ask_emergency_in_hindi(self):
        with mock.patch.object(llm, "write_json", side_effect=AssertionError("model called")):
            status, out = self.post("/api/ask", {"question": "मुझे सीने में दर्द है", "lang": "hi"})
        self.assertEqual(status, 200)
        self.assertEqual(out["answer"], safety.template("emergency", "hi"))

    def test_ask_medication_change_uses_fixed_reply_without_model(self):
        with mock.patch.object(llm, "write_json", side_effect=AssertionError("model called")) as m:
            status, out = self.post("/api/ask", {"question": "Should I stop my metformin tablets?", "records": [LAB]})
        self.assertEqual(status, 200)
        m.assert_not_called()
        self.assertEqual(out["gate"], "medication")
        self.assertEqual(out["label"], "doctor")

    def test_ask_normal_question_reaches_model(self):
        reply = {"kind": "records", "answer": "Your Hemoglobin is 10 g/dL.", "sources": ["r1"]}
        with mock.patch.object(llm, "write_json", return_value=(reply, "stub")) as m:
            status, out = self.post("/api/ask", {"question": "Explain what my hemoglobin means", "records": [LAB]})
        self.assertEqual(status, 200)
        m.assert_called_once()
        self.assertEqual(out["label"], "records")
        self.assertEqual(out["sources"], ["r1"])

    def test_ask_empty_question_is_400(self):
        status, out = self.post("/api/ask", {"question": "   "})
        self.assertEqual(status, 400)

    def test_translate_unknown_language_is_400(self):
        status, out = self.post("/api/translate", {"lang": "xx", "texts": {"a": "Hello"}})
        self.assertEqual(status, 400)
        self.assertIn("Unknown language", out["error"])

    def test_medcheck_endpoint(self):
        status, out = self.post("/api/medcheck", {"medicines": [{"name": "Crocin"}, {"name": "Dolo 650"}]})
        self.assertEqual(status, 200)
        self.assertEqual(len(out["duplicates"]), 1)

    def test_unknown_post_path_is_404(self):
        status, out = self.post("/api/nope", {})
        self.assertEqual(status, 404)
        self.assertEqual(out["error"], "Not found")

    def test_llm_failure_is_503_without_traceback(self):
        with mock.patch.object(llm, "write_json", side_effect=llm.LLMError("secret detail: key=abc")):
            status, out = self.post("/api/overview", {"records": [LAB]})
        self.assertEqual(status, 503)
        self.assertNotIn("secret", out["error"])

    def test_unexpected_error_is_500_without_leak(self):
        with mock.patch.object(llm, "write_json", side_effect=RuntimeError("secret detail")):
            status, out = self.post("/api/overview", {"records": [LAB]})
        self.assertEqual(status, 500)
        self.assertNotIn("secret", out["error"])

    def test_oversized_body_is_rejected(self):
        # the handler checks Content-Length before reading, so a small body with a huge declared length is enough
        status, ctype, body = self.raw_request(
            "POST", "/api/reflag", body=b"{}",
            headers={"Content-Type": "application/json", "Content-Length": str(server.MAX_BODY + 1)})
        self.assertEqual(status, 400)
        self.assertIn("too large", json.loads(body)["error"])

    def test_extract_reports_resting_models(self):
        first = llm._vision_models()[0]
        llm._resting.clear()
        try:
            with mock.patch.object(server.pipeline, "extract", return_value={"id": "r"}):
                status, out = self.post("/api/extract", {"data": "eA==", "mime": "text/plain", "skip": [first]})
            self.assertEqual(status, 200)
            self.assertEqual(out["resting"], [first])
        finally:
            llm._resting.clear()


class VoiceAndJournalRouteTests(ServerTests):
    """Input validation for /api/transcribe and the new JSON routes. The network is always mocked."""

    @staticmethod
    def clip(n=100):
        return base64.b64encode(b"\x1aE\xdf\xa3" + b"0" * n).decode()

    def test_transcribe_sends_audio_and_returns_text(self):
        with mock.patch.object(llm, "transcribe", return_value="what is hba1c") as t:
            status, out = self.post("/api/transcribe", {"audio": self.clip(), "mime": "audio/webm;codecs=opus", "lang": "hi-IN"})
        self.assertEqual((status, out), (200, {"text": "what is hba1c"}))
        audio, mime, name, lang = t.call_args[0]
        self.assertTrue(audio.startswith(b"\x1aE"))
        self.assertEqual((mime, name, lang), ("audio/webm", "voice.webm", "hi"))

    def test_transcribe_rejects_bad_input_with_400(self):
        bad = [{}, {"audio": ""}, {"audio": 5}, {"audio": "!!!not base64!!!", "mime": "audio/webm"},
               {"audio": self.clip(), "mime": "text/html"}, {"audio": self.clip(), "mime": "audio/exe"}]
        with mock.patch.object(llm, "transcribe", side_effect=AssertionError("network used")):
            for body in bad:
                status, out = self.post("/api/transcribe", body)
                self.assertEqual(status, 400, body)
                self.assertTrue(out["error"])

    def test_transcribe_rejects_oversized_audio(self):
        big = base64.b64encode(b"0" * (server.MAX_AUDIO + 1)).decode()
        with mock.patch.object(llm, "transcribe", side_effect=AssertionError("network used")):
            status, out = self.post("/api/transcribe", {"audio": big, "mime": "audio/webm"})
        self.assertEqual(status, 400)
        self.assertIn("too long", out["error"])

    def test_transcribe_without_a_working_key_is_503_voice_unavailable(self):
        with mock.patch.object(llm, "transcribe", side_effect=llm.VoiceUnavailable("none")):
            status, out = self.post("/api/transcribe", {"audio": self.clip(), "mime": "audio/webm"})
        self.assertEqual(status, 503)
        self.assertEqual(out["code"], "voice_unavailable")

    def test_transcribe_empty_result_is_400(self):
        with mock.patch.object(llm, "transcribe", return_value=""):
            status, _ = self.post("/api/transcribe", {"audio": self.clip(), "mime": "audio/webm"})
        self.assertEqual(status, 400)

    def test_llm_transcribe_tries_next_key_and_builds_multipart(self):
        calls = []

        def fake(url, headers, body, ctype, timeout=0):
            calls.append((url, headers["Authorization"], body, ctype))
            if len(calls) == 1:
                raise llm._Http(429, "rate limit")
            return {"text": " hello "}
        with mock.patch.dict(os.environ, {"GROQ_API_KEY": "k1,k2"}), mock.patch.object(llm, "_post_form", fake):
            self.assertEqual(llm.transcribe(b"AUDIO", "audio/webm", "voice.webm", "hi"), "hello")
        self.assertEqual([c[1] for c in calls], ["Bearer k1", "Bearer k2"])
        body = calls[1][2]
        for part in (b'name="model"', b"whisper-large-v3-turbo", b'name="language"', b'filename="voice.webm"', b"AUDIO"):
            self.assertIn(part, body)
        self.assertTrue(calls[1][0].startswith("https://") and "boundary=" in calls[1][3])

    def test_llm_transcribe_all_keys_failing_or_none_is_voice_unavailable(self):
        def fail(*a, **k):
            raise llm._Http(401, "bad key")
        with mock.patch.dict(os.environ, {"GROQ_API_KEY": "k1"}), mock.patch.object(llm, "_post_form", fail):
            with self.assertRaises(llm.VoiceUnavailable):
                llm.transcribe(b"A", "audio/webm", "voice.webm", "en")
        with mock.patch.object(llm, "_keys", return_value=[]):
            with self.assertRaises(llm.VoiceUnavailable):
                llm.transcribe(b"A", "audio/webm", "voice.webm", "en")

    def test_llm_post_form_refuses_non_https(self):
        with self.assertRaises(llm.LLMError):
            llm._post_form("file:///etc/passwd", {}, b"", "x")

    def test_unsupported_language_is_omitted(self):
        seen = []
        with mock.patch.object(llm, "_keys", return_value=["k"]), \
                mock.patch.object(llm, "_post_form", lambda u, h, body, c, timeout=0: seen.append(body) or {"text": "x"}):
            llm.transcribe(b"A", "audio/webm", "voice.webm", "xx")
        self.assertNotIn(b'name="language"', seen[0])

    def test_journal_summary_route(self):
        entries = [{"date": "2026-10-0%d" % i, "symptoms": ["cough"], "meds_taken": i % 2 == 0} for i in range(1, 5)]
        status, out = self.post("/api/journal_summary", {"entries": entries, "lang": "en"})
        self.assertEqual(status, 200)
        self.assertEqual(out["symptoms"][0]["count"], 4)
        self.assertEqual(out["adherence"], {"taken": 2, "missed": 2, "unknown": 0})
        status, out = self.post("/api/journal_summary", {"entries": "bad"})
        self.assertEqual((status, out["entries"]), (200, 0))

    def test_insights_route_passes_patient_and_returns_new_keys(self):
        status, out = self.post("/api/insights", {"records": [LAB], "patient": {"age": 55, "sex": "F"}})
        self.assertEqual(status, 200)
        for key in ("persistent", "preventive", "wellness"):
            self.assertIn(key, out)
        self.assertTrue(any(i["kind"] == "screening" for i in out["preventive"]))


for _name in [n for n in dir(ServerTests) if n.startswith("test_") and n not in VoiceAndJournalRouteTests.__dict__]:
    setattr(VoiceAndJournalRouteTests, _name, None)  # run only the new tests, not the inherited ones


class HandlerUnitTests(unittest.TestCase):
    def test_record_helper_requires_dict(self):
        with self.assertRaises(ValueError):
            server._record({"record": "nope"})
        self.assertEqual(server._record({"record": {"a": 1}}), {"a": 1})

    def test_pages_map_to_existing_files(self):
        for page, name in server.PAGES.items():
            self.assertTrue(os.path.isfile(os.path.join(server.PUBLIC, name)), (page, name))

    def test_reported_resting_models_are_skipped_but_never_all(self):
        models = llm._vision_models()
        llm._resting.clear()
        try:
            llm.rest(models)  # a browser cannot rest every model
            self.assertEqual(llm.resting(), [])
            llm.rest([models[0], "not-a-model", 7])
            self.assertEqual(llm.resting(), [models[0]])
        finally:
            llm._resting.clear()


if __name__ == "__main__":
    unittest.main()
