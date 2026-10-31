"""Pipeline: extraction, validation, medicine checks, translation. No network: the model is stubbed.

Run: python -m unittest discover tests
"""
import base64
import datetime as dt
import os
import sys
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import llm  # noqa: E402
import pipeline  # noqa: E402
import server  # noqa: E402

TEXT = "Hemoglobin 14.1 g/dL (13.0 - 17.0) HbA1c 7.6 % Date 18/06/2026"


def b64(s):
    return base64.b64encode(s.encode("utf-8")).decode("ascii")


def stub(reply, provider="stub/model"):
    return mock.patch.object(llm, "write_json", return_value=(reply, provider))


def tomorrow():
    return (dt.date.today() + dt.timedelta(days=1)).isoformat()


class DateTests(unittest.TestCase):
    def test_iso(self):
        self.assertEqual(pipeline._date("2026-03-05"), "2026-03-05")

    def test_iso_with_time(self):
        self.assertEqual(pipeline._date("2026-03-05T10:20:00"), "2026-03-05")

    def test_dd_mm_yyyy_slash(self):
        self.assertEqual(pipeline._date("05/03/2026"), "2026-03-05")

    def test_dd_mm_yyyy_dash(self):
        self.assertEqual(pipeline._date("05-03-2026"), "2026-03-05")

    def test_dotted_and_single_digit(self):
        self.assertEqual(pipeline._date("5.3.2026"), "2026-03-05")

    def test_impossible_dates(self):
        self.assertIsNone(pipeline._date("31/02/2026"))
        self.assertIsNone(pipeline._date("2026-13-45"))

    def test_garbage_and_empty(self):
        for v in ("garbage", "", "   ", None):
            self.assertIsNone(pipeline._date(v), repr(v))


class ConfTests(unittest.TestCase):
    def test_clamps_high_and_low(self):
        self.assertEqual(pipeline._conf(1.7), 1.0)
        self.assertEqual(pipeline._conf(-3), 0.0)

    def test_passes_valid_value(self):
        self.assertEqual(pipeline._conf(0.42), 0.42)
        self.assertEqual(pipeline._conf("0.9"), 0.9)

    def test_default_for_bad_input(self):
        self.assertEqual(pipeline._conf(None), 0.5)
        self.assertEqual(pipeline._conf("high"), 0.5)
        self.assertEqual(pipeline._conf("x", default=0.8), 0.8)


class MatchMedicineTests(unittest.TestCase):
    def test_known_generic(self):
        self.assertEqual(pipeline.match_medicine("Metformin"), (True, None))

    def test_known_brand(self):
        self.assertEqual(pipeline.match_medicine("Glycomet"), (True, None))

    def test_brand_with_dosage_form_prefix(self):
        self.assertEqual(pipeline.match_medicine("Tab. Glycomet 500mg"), (True, None))
        self.assertEqual(pipeline.match_medicine("CAP Omez"), (True, None))

    def test_unknown_has_no_suggestion(self):
        self.assertEqual(pipeline.match_medicine("Zzzqxv"), (False, None))

    def test_near_miss_suggests_correction(self):
        known, suggestion = pipeline.match_medicine("Glycomat")
        self.assertFalse(known)
        self.assertEqual(suggestion, "Glycomet")

    def test_empty_inputs(self):
        for v in (None, "", "Tab.", "500 mg"):
            self.assertEqual(pipeline.match_medicine(v), (False, None), repr(v))


class NormaliseTests(unittest.TestCase):
    def test_bad_doc_type_becomes_other(self):
        self.assertEqual(pipeline.normalise({"doc_type": "invoice"})["doc_type"], "other")
        self.assertEqual(pipeline.normalise({"doc_type": "lab_report"})["doc_type"], "lab_report")

    def test_non_dict_input(self):
        for raw in (None, [], "text", 5):
            rec = pipeline.normalise(raw)
            self.assertEqual(rec["doc_type"], "other")
            self.assertEqual(rec["tests"], [])
            self.assertEqual(rec["title"], "Health record")

    def test_value_type_coercion(self):
        rec = pipeline.normalise({"tests": [
            {"name": "A", "value": "7.6"}, {"name": "B", "value": 5}, {"name": "C", "value": "Positive"},
            {"name": "D", "value": "1,50,000"}]})
        values = [t["value"] for t in rec["tests"]]
        self.assertEqual(values, [7.6, 5.0, "Positive", 150000.0])
        self.assertIsInstance(values[1], float)

    def test_tests_without_name_are_dropped(self):
        rec = pipeline.normalise({"tests": [{"value": 1}, {"name": "  ", "value": 2}, "junk", None,
                                            {"name": "Hb", "value": 14}]})
        self.assertEqual([t["name"] for t in rec["tests"]], ["Hb"])

    def test_medicines_without_name_are_dropped(self):
        rec = pipeline.normalise({"medicines": [{"strength": "5 mg"}, {"name": "Glycomet"}, "junk"]})
        self.assertEqual([m["name"] for m in rec["medicines"]], ["Glycomet"])

    def test_diagnoses_accept_strings_and_dicts(self):
        rec = pipeline.normalise({"diagnoses": ["Anaemia", {"name": "Diabetes", "confidence": 0.9}, {"name": ""}]})
        self.assertEqual([d["name"] for d in rec["diagnoses"]], ["Anaemia", "Diabetes"])
        self.assertEqual(rec["diagnoses"][0]["confidence"], 0.8)

    def test_flags_are_computed_by_code(self):
        rec = pipeline.normalise({"tests": [{"name": "Hemoglobin", "value": 10, "flag": "normal"}]})
        self.assertEqual(rec["tests"][0]["flag"], "low")

    def test_unread_lines_kept(self):
        rec = pipeline.normalise({"unread": [{"text": "Cr 2l.1", "reason": "smudged"}, "loose line", {"text": ""}]})
        self.assertEqual(rec["unread"], [{"text": "Cr 2l.1", "reason": "smudged"},
                                         {"text": "loose line", "reason": None}])

    def test_unread_capped_at_20(self):
        rec = pipeline.normalise({"unread": [f"line {i}" for i in range(50)]})
        self.assertEqual(len(rec["unread"]), 20)

    def test_tests_capped_at_120(self):
        rec = pipeline.normalise({"tests": [{"name": f"T{i}", "value": i} for i in range(200)]})
        self.assertEqual(len(rec["tests"]), 120)

    def test_handwritten_caps_confidence(self):
        rec = pipeline.normalise({
            "handwritten": True, "overall_confidence": 0.99,
            "tests": [{"name": "Hb", "value": 14, "confidence": 0.99}],
            "medicines": [{"name": "Glycomet", "confidence": 0.95}],
            "diagnoses": [{"name": "Diabetes", "confidence": 0.9}]})
        self.assertEqual(rec["overall_confidence"], pipeline.HANDWRITTEN_CAP)
        for item in rec["tests"] + rec["medicines"] + rec["diagnoses"]:
            self.assertLessEqual(item["confidence"], pipeline.HANDWRITTEN_CAP)

    def test_printed_keeps_confidence(self):
        rec = pipeline.normalise({"overall_confidence": 0.97, "tests": [{"name": "Hb", "value": 14, "confidence": 0.97}]})
        self.assertEqual(rec["tests"][0]["confidence"], 0.97)

    def test_ids_are_unique(self):
        ids = {pipeline.normalise({})["id"] for _ in range(50)}
        self.assertEqual(len(ids), 50)
        self.assertTrue(all(i.startswith("rec_") for i in ids))

    def test_source_is_recorded(self):
        self.assertEqual(pipeline.normalise({}, source="abha")["source"], "abha")

    def test_date_is_normalised(self):
        self.assertEqual(pipeline.normalise({"date": "18/06/2026"})["date"], "2026-06-18")

    def test_less_than_value_keeps_its_sign(self):
        rec = pipeline.normalise({"tests": [{"name": "CRP", "value": "< 5"}]})
        self.assertEqual(rec["tests"][0]["value"], "< 5")


class CheckTests(unittest.TestCase):
    def rec(self, **kw):
        base = {"doc_type": "lab_report", "date": "2026-06-18", "tests": [], "medicines": []}
        base.update(kw)
        return base

    def warnings(self, rec):
        return " | ".join(pipeline.check(rec)["warnings"])

    def test_clean_record_has_no_warnings(self):
        r = self.rec(tests=[{"name": "Hemoglobin", "value": 14, "confidence": 0.95}])
        self.assertEqual(pipeline.check(r)["warnings"], [])

    def test_missing_date(self):
        self.assertIn("No date was found", self.warnings(self.rec(date=None)))

    def test_future_date(self):
        self.assertIn("in the future", self.warnings(self.rec(date=tomorrow())))

    def test_today_is_not_future(self):
        self.assertNotIn("future", self.warnings(self.rec(date=dt.date.today().isoformat())))

    def test_handwritten(self):
        self.assertIn("handwritten", self.warnings(self.rec(handwritten=True)))

    def test_low_confidence_count(self):
        r = self.rec(tests=[{"name": "Hb", "value": 14, "confidence": 0.5}],
                     medicines=[{"name": "Glycomet", "confidence": 0.4}, {"name": "Omez", "confidence": 0.95}])
        self.assertIn("2 item(s) were read with low confidence", self.warnings(r))

    def test_unread_lines_warning(self):
        self.assertIn("3 line(s) could not be read", self.warnings(self.rec(unread=[{}, {}, {}])))

    def test_critical_value(self):
        r = self.rec(tests=[{"name": "Hemoglobin", "value": 5.0, "confidence": 0.95}])
        out = pipeline.check(r)
        self.assertEqual(out["tests"][0]["flag"], "critical")
        self.assertIn("contact your doctor promptly", " ".join(out["warnings"]))

    def test_implausible_value(self):
        r = self.rec(tests=[{"name": "HbA1c", "value": 76, "unit": "%", "confidence": 0.98}])
        out = pipeline.check(r)
        self.assertIn("not a possible value", " ".join(out["warnings"]))
        self.assertLessEqual(out["tests"][0]["confidence"], 0.3)
        self.assertEqual(out["tests"][0]["flag"], "unknown")

    def test_implausible_value_is_not_also_critical(self):
        out = pipeline.check(self.rec(tests=[{"name": "HbA1c", "value": 76, "confidence": 0.98}]))
        self.assertNotIn("far outside", " ".join(out["warnings"]))

    def test_unreadable_other_document(self):
        self.assertIn("does not look like a health record", self.warnings(self.rec(doc_type="other")))

    def test_medicine_near_miss_warns_when_unsure(self):
        r = self.rec(medicines=[{"name": "Glycomat", "confidence": 0.5}])
        self.assertIn('Did the document say "Glycomet"', self.warnings(r))

    def test_medicine_known_flag_set(self):
        out = pipeline.check(self.rec(medicines=[{"name": "Glycomet"}, {"name": "Zzzqxv"}]))
        self.assertEqual([m["known"] for m in out["medicines"]], [True, False])

    def test_generic_name_preferred_then_brand(self):
        out = pipeline.check(self.rec(medicines=[{"name": "Glycomet", "generic": "Unknownium"}]))
        self.assertTrue(out["medicines"][0]["known"])

    def test_safe_to_run_twice(self):
        r = self.rec(date=None, handwritten=True,
                     tests=[{"name": "Hemoglobin", "value": 5.0, "confidence": 0.5},
                            {"name": "Total Cholesterol", "value": 240, "confidence": 0.9}],
                     medicines=[{"name": "Glycomet", "confidence": 0.9}])
        first = pipeline.check(r)
        warnings_1 = list(first["warnings"])
        flags_1 = [t["flag"] for t in first["tests"]]
        ranges_1 = [(t["ref_low"], t["ref_high"], t["ref_source"]) for t in first["tests"]]
        second = pipeline.check(first)
        self.assertEqual(second["warnings"], warnings_1)
        self.assertEqual([t["flag"] for t in second["tests"]], flags_1)
        self.assertEqual([(t["ref_low"], t["ref_high"], t["ref_source"]) for t in second["tests"]], ranges_1)

    def test_rerun_after_edit_rederives_standard_range(self):
        out = pipeline.check(self.rec(tests=[{"name": "Hemoglobin", "value": 14, "confidence": 0.95}]))
        self.assertEqual(out["tests"][0]["flag"], "normal")
        out["tests"][0]["value"] = 9
        self.assertEqual(pipeline.check(out)["tests"][0]["flag"], "low")


class ExtractTests(unittest.TestCase):
    REPLY = {"doc_type": "lab_report", "title": "Blood test", "date": "18/06/2026", "overall_confidence": 0.9,
             "tests": [{"name": "Hemoglobin", "value": 14.1, "unit": "g/dL", "confidence": 0.8}]}

    def test_text_plain_uses_write_json(self):
        with stub(dict(self.REPLY), "groq: gpt") as m:
            rec = pipeline.extract("r.txt", "text/plain", b64(TEXT))
        m.assert_called_once()
        self.assertIn("DOCUMENT TEXT:", m.call_args[0][0])
        self.assertIn(TEXT, m.call_args[0][0])
        self.assertEqual(rec["extracted_by"], "groq: gpt")
        self.assertEqual(rec["filename"], "r.txt")
        self.assertEqual(rec["date"], "2026-06-18")
        self.assertEqual(rec["tests"][0]["flag"], "normal")

    def test_mime_with_charset_is_accepted(self):
        with stub(dict(self.REPLY)):
            rec = pipeline.extract("r.txt", "Text/Plain; charset=utf-8", b64(TEXT))
        self.assertEqual(rec["doc_type"], "lab_report")

    def test_ocr_path_lowers_confidence_and_warns(self):
        with stub(dict(self.REPLY)) as m:
            rec = pipeline.extract("scan.png", "text/plain", b64(TEXT), ocr="tesseract")
        self.assertIn("came from OCR", m.call_args[0][0])
        self.assertEqual(rec["extracted_by"], "tesseract + stub/model")
        self.assertEqual(rec["overall_confidence"], round(0.9 * 0.85, 2))
        self.assertEqual(rec["tests"][0]["confidence"], 0.68)
        self.assertTrue(rec["warnings"][0].startswith("This document was read with the backup"))
        self.assertIn("1 item(s) were read with low confidence", " ".join(rec["warnings"]))

    def test_unsupported_mime_raises(self):
        for mime in ("application/zip", "", None, "text/html"):
            with self.assertRaises(ValueError):
                pipeline.extract("x", mime, b64(TEXT))

    def test_too_short_text_raises(self):
        with stub({}) as m:
            with self.assertRaises(ValueError):
                pipeline.extract("x.txt", "text/plain", b64("  too short  "))
        m.assert_not_called()

    def test_image_goes_to_read_document(self):
        with mock.patch.object(llm, "read_document", return_value=(dict(self.REPLY), "gemini-x")) as m:
            rec = pipeline.extract("p.jpg", "image/jpg", "AAAA")
        self.assertEqual(m.call_args[0][1], {"mime": "image/jpeg", "data": "AAAA"})
        self.assertEqual(rec["extracted_by"], "gemini-x")

    def test_llm_error_becomes_vision_unavailable(self):
        with mock.patch.object(llm, "read_document", side_effect=llm.LLMError("quota")):
            with self.assertRaises(pipeline.VisionUnavailable) as cm:
                pipeline.extract("p.pdf", "application/pdf", "AAAA")
        self.assertIn("quota", str(cm.exception))


class MedcheckTests(unittest.TestCase):
    def test_duplicate_ingredient_under_two_brands(self):
        out = pipeline.medcheck([{"name": "Crocin"}, {"name": "Dolo 650"}])
        self.assertEqual(len(out["duplicates"]), 1)
        self.assertEqual(out["duplicates"][0]["ingredient"], "Paracetamol")
        self.assertEqual(out["duplicates"][0]["names"], ["Crocin", "Dolo 650"])

    def test_same_name_twice_is_not_a_duplicate(self):
        self.assertEqual(pipeline.medcheck([{"name": "Crocin"}, {"name": "crocin"}])["duplicates"], [])

    def test_known_interaction_pair(self):
        out = pipeline.medcheck([{"name": "Brufen"}, {"name": "Ecosprin"}])
        self.assertEqual(len(out["interactions"]), 1)
        inter = out["interactions"][0]
        self.assertEqual({inter["a"], inter["b"]}, {"Ibuprofen", "Aspirin"})
        self.assertIn(inter["severity"], ("minor", "moderate", "major"))
        self.assertEqual(sorted(inter["names"]), ["Brufen", "Ecosprin"])

    def test_interactions_sorted_most_severe_first(self):
        out = pipeline.medcheck([{"name": "Brufen"}, {"name": "Ecosprin"}, {"name": "Warfarin"}, {"name": "Omez"}])
        rank = {"major": 3, "moderate": 2, "minor": 1}
        ranks = [rank[i["severity"]] for i in out["interactions"]]
        self.assertEqual(ranks, sorted(ranks, reverse=True))
        self.assertTrue(out["interactions"])

    def test_unknown_medicines_reported_as_not_known(self):
        out = pipeline.medcheck([{"name": "Zzzqxv"}, {"name": "Glycomet"}])
        self.assertEqual([(i["name"], i["known"]) for i in out["items"]], [("Zzzqxv", False), ("Glycomet", True)])
        self.assertIsNone(out["items"][0]["ingredient"])
        self.assertEqual(out["items"][1]["ingredient"], "Metformin")
        self.assertEqual(out["interactions"], [])

    def test_notes_contain_no_instruction(self):
        out = pipeline.medcheck([{"name": "Brufen"}, {"name": "Warfarin"}])
        self.assertTrue(out["interactions"])
        for inter in out["interactions"]:
            self.assertNotRegex(inter["note"].lower(), r"\b(avoid|do not|don't|stop|must not|never)\b")

    def test_neutral_strips_instruction_clause(self):
        self.assertEqual(pipeline._neutral("Higher risk of serious bleeding; avoid the combination"),
                         "Higher risk of serious bleeding.")

    def test_every_reference_note_is_neutral(self):
        for med in pipeline._MEDS:
            for inter in med.get("interactions") or []:
                note = pipeline._neutral(inter.get("note")).lower()
                self.assertNotRegex(note, r"\b(avoid|do not|don't|must not|never)\b", med["id"])

    def test_junk_entries_are_ignored(self):
        out = pipeline.medcheck([None, "x", {"name": ""}, {"name": "Glycomet"}])
        self.assertEqual(len(out["items"]), 1)

    def test_empty_list(self):
        out = pipeline.medcheck([])
        self.assertEqual((out["items"], out["duplicates"], out["interactions"]), ([], [], []))

    def test_disclaimer_language(self):
        self.assertEqual(pipeline.medcheck([], "hi")["disclaimer"], pipeline.MEDCHECK_NOTE["hi"])
        self.assertEqual(pipeline.medcheck([], "xx")["disclaimer"], pipeline.MEDCHECK_NOTE["en"])


class TranslateLabelsTests(unittest.TestCase):
    def test_unknown_language_raises(self):
        with stub({}) as m:
            with self.assertRaises(ValueError):
                pipeline.translate_labels("xx", {"a": "Hello"})
        m.assert_not_called()

    def test_english_raises(self):
        with self.assertRaises(ValueError):
            pipeline.translate_labels("en", {"a": "Hello"})

    def test_empty_texts_raise(self):
        for texts in (None, {}, [], "text"):
            with self.assertRaises(ValueError):
                pipeline.translate_labels("hi", texts)

    def test_placeholders_that_do_not_survive_are_dropped(self):
        reply = {"a": "नमस्ते {n}", "b": "पृष्ठ", "c": "ठीक है", "d": "{n} और {p}"}
        texts = {"a": "Hello {n}", "b": "Page {p}", "c": "OK", "d": "{p} and {n}"}
        with stub(reply):
            out = pipeline.translate_labels("hi", texts)
        self.assertEqual(out, {"a": "नमस्ते {n}", "c": "ठीक है", "d": "{n} और {p}"})

    def test_missing_and_non_string_translations_are_dropped(self):
        with stub({"a": "x", "b": 5, "c": "  "}):
            out = pipeline.translate_labels("hi", {"a": "A", "b": "B", "c": "C", "d": "D"})
        self.assertEqual(out, {"a": "x"})

    def test_only_string_inputs_are_sent(self):
        with stub({"a": "x"}) as m:
            pipeline.translate_labels("hi", {"a": "A", "b": 5, "c": "   "})
        prompt = m.call_args[0][0]
        self.assertIn('"a"', prompt)
        self.assertNotIn('"b"', prompt)

    def test_at_most_40_labels_are_sent(self):
        reply = {f"k{i}": f"v{i}" for i in range(60)}
        with stub(reply):
            out = pipeline.translate_labels("hi", {f"k{i}": f"t{i}" for i in range(60)})
        self.assertEqual(len(out), 40)


class LanguageTests(unittest.TestCase):
    def test_language_list_shape(self):
        langs = pipeline.language_list()
        self.assertEqual(len(langs), len(pipeline.LANGUAGES))
        for entry in langs:
            self.assertEqual(set(entry), {"code", "name", "native", "rtl", "bundled"})
        codes = [x["code"] for x in langs]
        self.assertEqual(len(codes), len(set(codes)))

    def test_language_list_values(self):
        by_code = {x["code"]: x for x in pipeline.language_list()}
        self.assertEqual(by_code["hi"]["name"], "Hindi")
        self.assertTrue(by_code["ur"]["rtl"])
        self.assertFalse(by_code["en"]["rtl"])
        self.assertTrue(by_code["ta"]["bundled"])
        self.assertFalse(by_code["fr"]["bundled"])

    def test_lang_fallback(self):
        self.assertEqual(pipeline._lang("hi"), "hi")
        self.assertEqual(pipeline._lang("xx"), "en")
        self.assertEqual(pipeline._lang(None), "en")
        self.assertEqual(pipeline._lang(""), "en")

    def test_disclaimer_falls_back_to_english(self):
        self.assertEqual(pipeline._disclaimer("fr"), pipeline.DISCLAIMER["en"])
        self.assertTrue(pipeline._disclaimer("bn").endswith(pipeline.DISCLAIMER["en"]))


class MockAbhaTests(unittest.TestCase):
    def test_requires_14_digits(self):
        for bad in ("123", "", None, "12-3456-7890-123", "12-3456-7890-12345", "abcd"):
            with self.assertRaises(ValueError, msg=repr(bad)):
                server.mock_abha(bad)

    def test_formats_number(self):
        out = server.mock_abha("12345678901234")
        self.assertEqual(out["abha_number"], "12-3456-7890-1234")
        self.assertTrue(out["linked"])
        self.assertTrue(out["mock"])

    def test_accepts_dashes_and_spaces(self):
        self.assertEqual(server.mock_abha("12 3456 7890 1234")["abha_number"], "12-3456-7890-1234")

    def test_address_ends_with_last_four_digits(self):
        addr = server.mock_abha("12-3456-7890-1234")["abha_address"]
        self.assertTrue(addr.endswith("1234@abdm"), addr)

    def test_records_flagged_source_abha_and_checked(self):
        out = server.mock_abha("12-3456-7890-1234")
        self.assertTrue(out["records"])
        for rec in out["records"]:
            self.assertEqual(rec["source"], "abha")
            self.assertIn("warnings", rec)
            for t in rec.get("tests") or []:
                self.assertIn(t["flag"], ("low", "normal", "high", "critical", "unknown"))


class NeutralNotes(unittest.TestCase):
    """Interaction notes state a risk and never tell the reader what to do."""

    def test_instruction_clauses_are_dropped(self):
        cases = {
            "Higher risk of serious bleeding; avoid the combination": "Higher risk of serious bleeding.",
            "Reduces levothyroxine absorption; separate by at least 4 hours": "Reduces levothyroxine absorption.",
            "Markedly reduces warfarin effect; needs INR monitoring": "Markedly reduces warfarin effect.",
            "Reduces steroid effect; dose may need increase": "Reduces steroid effect.",
            "Severe, possibly fatal drop in blood pressure - never take together":
                "Severe, possibly fatal drop in blood pressure.",
        }
        for note, want in cases.items():
            self.assertEqual(pipeline._neutral(note), want)

    def test_no_reference_note_keeps_an_instruction(self):
        import json as _json
        import os as _os
        path = _os.path.join(_os.path.dirname(_os.path.dirname(__file__)), "data", "medicines.json")
        with open(path, encoding="utf-8") as f:
            data = _json.load(f)
        meds = data if isinstance(data, list) else data.get("medicines", [])
        for m in meds:
            for i in m.get("interactions", []):
                out = pipeline._neutral(i.get("note", "")).lower()
                for word in ("avoid", "never", "separate by", "take the", "monitor", "dose may"):
                    self.assertNotIn(word, out, i.get("note"))


class DirectLookup(unittest.TestCase):
    """Plain "what is my X" questions are answered by code from the saved records."""

    RECS = [
        {"id": "r1", "title": "Old panel", "date": "2026-03-12",
         "tests": [{"name": "HbA1c", "value": 8.4, "unit": "%", "ref_text": "4.0 - 5.6", "flag": "high"}]},
        {"id": "r2", "title": "New panel", "date": "2026-09-22",
         "tests": [{"name": "HbA1c", "value": 6.9, "unit": "%", "ref_text": "4.0 - 5.6", "flag": "high"},
                   {"name": "Haemoglobin", "value": 13.9, "unit": "g/dL", "ref_text": "13 - 17", "flag": "normal"}]},
    ]

    def test_latest_value_is_cited_without_a_model(self):
        out = pipeline.ask("What is my latest HbA1c?", self.RECS, "en")
        self.assertTrue(out.get("direct"))
        self.assertEqual(out["sources"], ["r2"])
        self.assertEqual(out["label"], "records")
        self.assertIn("6.9 %", out["answer"])
        self.assertIn("above", out["answer"])
        self.assertNotIn("8.4", out["answer"])

    def test_hindi_answer_is_in_devanagari(self):
        out = pipeline.ask("mera HbA1c kitna hai", self.RECS, "hi")
        self.assertTrue(out.get("direct"))
        self.assertIn("6.9 %", out["answer"])
        self.assertTrue(any("\u0900" <= ch <= "\u097f" for ch in out["answer"]))

    def test_explaining_or_two_tests_is_left_to_the_model(self):
        self.assertIsNone(pipeline._direct("Why did my HbA1c change?", self.RECS, "en"))
        self.assertIsNone(pipeline._direct("HbA1c and haemoglobin please", self.RECS, "en"))
        self.assertIsNone(pipeline._direct("What medicines am I on?", self.RECS, "en"))

    def test_a_document_under_review_is_never_the_direct_answer(self):
        recs = self.RECS + [{"id": "d1", "under_review": True, "date": "2026-10-10",
                             "tests": [{"name": "HbA1c", "value": 11.0, "unit": "%"}]}]
        # the open document has this test too, so the full answer (which knows about the draft) handles it
        self.assertIsNone(pipeline._direct("What is my HbA1c?", recs, "en"))

    def test_direct_answers_only_the_test_that_was_asked_about(self):
        recs = self.RECS + [{"id": "r3", "title": "CBC", "date": "2026-09-25",
                             "tests": [{"name": "Hemoglobin", "value": 14.1, "unit": "g/dL", "flag": "normal"}]}]
        self.assertIsNone(pipeline._direct("What is my hemoglobin A1c?", recs, "en"))
        self.assertIsNone(pipeline._direct("what was my hemoglobin in march", recs, "en"))
        self.assertIsNone(pipeline._direct("what is hemoglobin", recs, "en"))
        self.assertIn("14.1", pipeline._direct("What is my hemoglobin?", recs, "en")["answer"])

    def test_a_doubtful_value_is_not_stated_as_fact(self):
        recs = [{"id": "r9", "title": "Scan", "date": "2026-09-25",
                 "tests": [{"name": "HbA1c", "value": 76, "unit": "%", "confidence": 0.3}]}]
        self.assertIsNone(pipeline._direct("What is my latest HbA1c?", recs, "en"))
        self.assertEqual(pipeline._compact(recs[0])["uncertain_items"], ["HbA1c"])

    def test_emergency_still_wins(self):
        out = pipeline.ask("I have chest pain, what is my HbA1c", self.RECS, "en")
        self.assertFalse(out.get("direct"))


class Caution(unittest.TestCase):
    def test_uncertain_and_unread_reach_the_writer(self):
        c = pipeline._compact({"id": "d1", "under_review": True, "handwritten": True, "patient": {"name": "Sanchita"},
                               "medicines": [{"name": "Tab. Domperidone", "confidence": 0.6}, {"name": "Clear", "confidence": 0.95}],
                               "diagnoses": [{"name": "Acute Gastritis", "confidence": 0.6}],
                               "unread": [{"text": "Inj. ? 1 amp stat", "reason": "x"}]})
        self.assertIn("NOT saved", c["status"])
        self.assertEqual(c["patient"], "Sanchita")
        self.assertEqual(c["uncertain_items"], ["Tab. Domperidone", "Acute Gastritis"])
        self.assertEqual(c["lines_not_read"], ["Inj. ? 1 amp stat"])

    def test_a_clean_saved_record_adds_nothing(self):
        self.assertNotIn("status", pipeline._compact({"id": "r", "medicines": [{"name": "A", "confidence": 0.98}]}))


class ReviewRound3(unittest.TestCase):
    def test_uncertain_medicine_gets_no_purpose_while_under_review(self):
        rec = {"id": "d1", "under_review": True, "tests": [],
               "medicines": [{"name": "Tab. Domperidone", "confidence": 0.6}, {"name": "Tab. Paracetamol", "confidence": 0.95}]}
        reply = {"summary": "A prescription.", "findings": [], "questions": [],
                 "medicines": [{"name": "Tab. Domperidone", "purpose": "For nausea."}, {"name": "Tab. Paracetamol", "purpose": "For fever."}]}
        with mock.patch.object(llm, "write_json", return_value=(reply, "stub")):
            meds = {m["name"]: m for m in pipeline.explain(rec, "en")["medicines"]}
        self.assertIsNone(meds["Tab. Domperidone"]["purpose"])
        self.assertTrue(meds["Tab. Domperidone"]["uncertain"])
        self.assertEqual(meds["Tab. Paracetamol"]["purpose"], "For fever.")

    def test_a_saved_record_keeps_its_purposes(self):
        rec = {"id": "r1", "tests": [], "medicines": [{"name": "Tab. Domperidone", "confidence": 0.6}]}
        reply = {"summary": "A prescription.", "findings": [], "questions": [], "medicines": [{"name": "Tab. Domperidone", "purpose": "For nausea."}]}
        with mock.patch.object(llm, "write_json", return_value=(reply, "stub")):
            self.assertEqual(pipeline.explain(rec, "en")["medicines"][0]["purpose"], "For nausea.")

    def test_medicine_status_reaches_the_writer(self):
        c = pipeline._compact({"id": "r", "medicines": [{"name": "A", "status": "confirmed_current"}, {"name": "B", "status": "course_ended"},
                                                        {"name": "C", "status": "anything else"}, {"name": "D"}]})
        self.assertIn("confirmed", c["medicines"][0]["status"])
        self.assertIn("ended", c["medicines"][1]["status"])
        self.assertNotIn("status", c["medicines"][2])
        self.assertNotIn("status", c["medicines"][3])

    def test_explicit_language_request_wins(self):
        self.assertEqual(pipeline._asked_language("Explain my HbA1c in Hindi"), "hi")
        self.assertEqual(pipeline._asked_language("is report ko tamil mein samjhao"), "ta")
        self.assertEqual(pipeline._asked_language("please answer in Bengali."), "bn")
        self.assertIsNone(pipeline._asked_language("What is my latest HbA1c?"))
        recs = [{"id": "r2", "title": "Panel", "date": "2026-09-22",
                 "tests": [{"name": "HbA1c", "value": 6.9, "unit": "%", "ref_text": "4.0 - 5.6", "flag": "high"}]}]
        out = pipeline.ask("What is my latest HbA1c? Answer in Hindi", recs, "en")
        self.assertTrue(any("\u0900" <= ch <= "\u097f" for ch in out["answer"]))


class DateSwapTests(unittest.TestCase):
    def test_future_date_with_day_and_month_swapped_is_flipped(self):
        today = dt.date(2026, 10, 24)
        self.assertEqual(pipeline._unswap("2026-11-10", today), "2026-10-11")
        self.assertEqual(pipeline._unswap("2026-12-05", today), "2026-05-12")
        self.assertEqual(pipeline._unswap("2026-10-02", today), "2026-10-02")  # not in the future: kept
        self.assertEqual(pipeline._unswap("2026-11-25", today), "2026-11-25")  # day > 12: cannot be a swap
        self.assertIsNone(pipeline._unswap(None, today))


if __name__ == "__main__":
    unittest.main()
