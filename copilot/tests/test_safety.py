"""Safety gate, answer labels and numeric guard. No network: the model is stubbed.

Run: python -m unittest discover tests
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import llm  # noqa: E402
import pipeline  # noqa: E402
import safety  # noqa: E402

RECORD = pipeline.check({
    "id": "rec_t1", "doc_type": "lab_report", "title": "Blood test", "date": "2026-06-18",
    "tests": [
        {"name": "HbA1c", "value": 7.6, "unit": "%", "ref_low": 4.0, "ref_high": 5.6,
         "ref_text": "4.0 - 5.6", "confidence": 0.98},
        {"name": "Hemoglobin", "value": 14.1, "unit": "g/dL", "ref_low": 13.0, "ref_high": 17.0,
         "ref_text": "13.0 - 17.0", "confidence": 0.98},
    ],
    "medicines": [{"name": "Glycomet", "strength": "500 mg", "confidence": 0.9}],
    "diagnoses": [],
})


class StubModel:
    """Replaces llm.write_json and fails the test if the model is called when it must not be."""

    def __init__(self, reply=None):
        self.reply, self.calls = reply, 0

    def __call__(self, prompt):
        self.calls += 1
        if self.reply is None:
            raise AssertionError("model was called")
        return self.reply, "stub"


class Base(unittest.TestCase):
    def use(self, reply=None):
        stub = StubModel(reply)
        original = llm.write_json
        llm.write_json = stub
        self.addCleanup(setattr, llm, "write_json", original)
        return stub


class GateTests(Base):
    def test_emergency_is_fixed_reply_with_no_model_call(self):
        stub = self.use()
        for q, lang in [("I have chest pain and my HbA1c is high", "en"),
                        ("मुझे सीने में दर्द हो रहा है", "hi"),
                        ("mujhe saans nahi aa rahi", "en"),
                        ("I want to end my life", "en")]:
            out = pipeline.ask(q, [RECORD], lang)
            self.assertEqual(out["gate"], "emergency", q)
            self.assertEqual(out["label"], "emergency")
            self.assertIn("112", out["answer"])
        self.assertEqual(stub.calls, 0)

    def test_emergency_beats_medication(self):
        self.use()
        out = pipeline.ask("Should I stop my tablet? I have chest pain", [RECORD], "en")
        self.assertEqual(out["gate"], "emergency")

    def test_medication_change_is_blocked(self):
        stub = self.use()
        for q, lang in [("Can I stop taking my metformin tablet?", "en"),
                        ("should I double the dose of insulin", "en"),
                        ("Is it ok to skip my medicine today", "en"),
                        ("क्या मैं दवा बंद कर दूं?", "hi"),
                        ("dawai band kar du kya", "en")]:
            out = pipeline.ask(q, [RECORD], lang)
            self.assertEqual(out.get("gate"), "medication", q)
            self.assertEqual(out["label"], "doctor")
        self.assertEqual(stub.calls, 0)

    def test_normal_questions_pass_to_the_model(self):
        stub = self.use({"kind": "general", "answer": "Hemoglobin carries oxygen.", "sources": []})
        for q in ["What does low hemoglobin mean?", "Which medicines am I on?",
                  "How has my HbA1c changed?", "मेरा शुगर कैसा है?"]:
            self.assertIsNone(safety.classify(q), q)
            pipeline.ask(q, [RECORD], "en")
        self.assertEqual(stub.calls, 4)

    def test_every_template_exists_in_every_language(self):
        for kind in ("emergency", "medication"):
            for lang in safety.LANGS:
                self.assertTrue(safety.template(kind, lang).strip())
        with self.assertRaises(KeyError):
            safety.template("emergency", "ta")  # an untranslated language fails loudly


class LabelTests(Base):
    def test_records_label_needs_a_real_source(self):
        self.use({"kind": "records", "answer": "Your HbA1c was 7.6 %.", "sources": ["rec_t1"]})
        self.assertEqual(pipeline.ask("What is my HbA1c?", [RECORD], "en")["label"], "records")

    def test_records_claim_without_a_source_is_downgraded(self):
        self.use({"kind": "records", "answer": "Your HbA1c is fine.", "sources": ["rec_made_up"]})
        out = pipeline.ask("Explain what my HbA1c means", [RECORD], "en")
        self.assertEqual(out["label"], "general")
        self.assertEqual(out["sources"], [])

    def test_treatment_decision_is_labelled_ask_your_doctor(self):
        self.use({"kind": "doctor", "answer": "Please discuss this with your doctor.", "sources": []})
        self.assertEqual(pipeline.ask("Do I need surgery?", [RECORD], "en")["label"], "doctor")


class NumericGuardTests(Base):
    def test_numbers_parser(self):
        self.assertEqual(safety.numbers("7.6 % on 18/06/2026, range 4.0 - 5.6"), {7.6, 18, 6, 2026, 4.0, 5.6})
        self.assertEqual(safety.numbers("platelets 1,50,000 and 150,000"), {150000})
        self.assertEqual(safety.numbers("मान ७.६ है"), {7.6})

    def test_invented_number_replaces_that_finding_only(self):
        self.use({"summary": "Your HbA1c is 7.6 %, above the range.",
                  "findings": [{"name": "HbA1c", "flag": "normal",
                                "meaning": "Your HbA1c is 7.6. Doctors aim for below 6.5."}],
                  "medicines": [{"name": "Glycomet", "purpose": "Helps control blood sugar."}],
                  "questions": ["Should my target be 6.5?", "What should I eat?"]})
        out = pipeline.explain(RECORD, "en")
        finding = out["findings"][0]
        self.assertNotIn("6.5", finding["meaning"])          # invented target removed
        self.assertIn("7.6", finding["meaning"])             # replaced by the factual template
        self.assertEqual(finding["flag"], "high")            # code's flag, not the model's "normal"
        self.assertIn("7.6", out["summary"])                 # clean summary kept as written
        self.assertEqual(out["questions"], ["What should I eat?"])
        self.assertEqual(out["guard_replaced"], 1)

    def test_clean_explanation_is_untouched(self):
        meaning = "This shows average blood sugar over the past two to three months. 7.6 % is above the range of 4.0 - 5.6."
        self.use({"summary": "A blood test from 18 June 2026 with 2 values.",
                  "findings": [{"name": "HbA1c", "flag": "high", "meaning": meaning}],
                  "medicines": [], "questions": []})
        out = pipeline.explain(RECORD, "en")
        self.assertEqual(out["findings"][0]["meaning"], meaning)
        self.assertEqual(out["guard_replaced"], 0)

    def test_hindi_template_is_used_for_hindi(self):
        self.use({"summary": "ठीक है", "findings": [{"name": "HbA1c", "flag": "high", "meaning": "लक्ष्य 6.5 से कम है"}],
                  "medicines": [], "questions": []})
        self.assertIn("संदर्भ सीमा", pipeline.explain(RECORD, "hi")["findings"][0]["meaning"])


class HandwritingTests(unittest.TestCase):
    def test_handwritten_items_are_always_marked_for_checking(self):
        rec = pipeline.normalise({
            "doc_type": "prescription", "handwritten": True, "date": "2026-10-02", "overall_confidence": 0.9,
            "medicines": [{"name": "Glycomet", "strength": "500 mg", "confidence": 0.95}],
            "tests": [{"name": "HbA1c", "value": 7.1, "unit": "%", "confidence": 0.92}]})
        self.assertLessEqual(rec["overall_confidence"], 0.6)
        self.assertTrue(all(x["confidence"] <= 0.6 for x in rec["medicines"] + rec["tests"]))
        self.assertTrue(any("handwritten" in w.lower() for w in rec["warnings"]))

    def test_printed_documents_keep_their_confidence(self):
        rec = pipeline.normalise({"doc_type": "lab_report", "handwritten": False, "date": "2026-10-02",
                                  "tests": [{"name": "HbA1c", "value": 7.1, "unit": "%", "confidence": 0.97}]})
        self.assertEqual(rec["tests"][0]["confidence"], 0.97)


class PlausibilityTests(unittest.TestCase):
    def test_lost_decimal_point_is_not_shown_as_critical(self):
        rec = pipeline.check({"doc_type": "lab_report", "date": "2026-06-18", "tests": [
            {"name": "HbA1c (Glycated Hemoglobin)", "value": 76, "unit": "%", "ref_low": 4.0, "ref_high": 5.6, "confidence": 0.9},
            {"name": "Hemoglobin", "value": 14.1, "unit": "g/dL", "ref_low": 13, "ref_high": 17, "confidence": 0.9}]})
        bad, good = rec["tests"]
        self.assertEqual(bad["flag"], "unknown")
        self.assertLessEqual(bad["confidence"], 0.3)
        self.assertTrue(any("not a possible value" in w for w in rec["warnings"]))
        self.assertEqual(good["flag"], "normal")
        self.assertEqual(good["confidence"], 0.9)

    def test_correcting_the_value_clears_the_mark(self):
        t = {"name": "HbA1c", "value": 76, "unit": "%", "ref_low": 4.0, "ref_high": 5.6, "confidence": 0.9}
        rec = pipeline.check({"doc_type": "lab_report", "date": "2026-06-18", "tests": [t]})
        rec["tests"][0]["value"] = 7.6
        rec = pipeline.check(rec)
        self.assertEqual(rec["tests"][0]["flag"], "high")
        self.assertNotIn("implausible", rec["tests"][0])


class MedicineCheckTests(unittest.TestCase):
    def test_same_ingredient_under_two_brand_names(self):
        out = pipeline.medcheck([{"name": "Tab. Dolo 650"}, {"name": "Crocin"}, {"name": "Glycomet", "generic": "Metformin"}])
        self.assertEqual(len(out["duplicates"]), 1)
        self.assertEqual(out["duplicates"][0]["ingredient"], "Paracetamol")
        self.assertEqual(len(out["duplicates"][0]["names"]), 2)

    def test_known_interaction_pair_is_flagged_once(self):
        out = pipeline.medcheck([{"name": "Ibuprofen"}, {"name": "Warfarin"}])
        self.assertEqual(len(out["interactions"]), 1)
        self.assertEqual(out["interactions"][0]["severity"], "major")
        self.assertIn("pharmacist", out["disclaimer"])

    def test_unknown_medicines_are_reported_not_guessed(self):
        out = pipeline.medcheck([{"name": "Zzyqlor Forte"}])
        self.assertEqual(out["items"][0]["known"], False)
        self.assertEqual(out["duplicates"] + out["interactions"], [])


class LanguageTests(unittest.TestCase):
    def test_every_language_has_safety_text_and_a_disclaimer(self):
        for code in pipeline.LANGS:
            self.assertIn("112", safety.reply("emergency", code))
            self.assertTrue(safety.reply("medication", code))
            self.assertTrue(pipeline._disclaimer(code))

    def test_unknown_language_falls_back_to_english(self):
        self.assertEqual(pipeline._lang("xx"), "en")
        self.assertEqual(pipeline._lang("fr"), "fr")


class DateSanityTests(unittest.TestCase):
    def test_a_date_years_in_the_past_is_questioned(self):
        old = pipeline.check({"doc_type": "prescription", "date": "2020-10-02", "tests": [], "medicines": []})
        self.assertTrue(any("more than two years ago" in w for w in old["warnings"]))
        recent = pipeline.check({"doc_type": "prescription", "date": __import__("datetime").date.today().isoformat(), "tests": [], "medicines": []})
        self.assertFalse(any("two years ago" in w for w in recent["warnings"]))


if __name__ == "__main__":
    unittest.main()


class ChangeIntentTests(Base):
    """R04: a stop/skip/dose-change request that names ANY medicine is caught before _direct and the model."""
    NAMES = {"glycomet", "metformin", "crocin"}

    def test_change_requests_naming_a_medicine_are_gated(self):
        stub = self.use()
        for q, lang in [("Can I stop taking Glycomet now that my HbA1c is lower?", "en"),
                        ("Can I reduce metformin?", "en"),
                        ("Should I double my Crocin", "en"),
                        ("kya main Glycomet band kar sakta hu", "hi"),
                        ("Glycomet chhodna hai", "en"),
                        ("Glycomet kam karna chahta hu", "en"),
                        ("क्या मैं ग्लाइकोमेट बंद कर दूँ दवा", "hi"),
                        ("मैं गोली कम कर दूँ", "hi")]:
            out = pipeline.ask(q, [RECORD], lang)
            self.assertEqual(out.get("gate"), "medication", q)
        self.assertEqual(stub.calls, 0)

    def test_record_medicine_name_not_in_the_reference_list(self):
        rec = dict(RECORD, medicines=[{"name": "Zorbitex", "strength": "5 mg"}])
        self.assertEqual(pipeline.ask("Can I stop Zorbitex?", [rec], "en").get("gate"), "medication")

    def test_plain_information_questions_pass(self):
        for q in ["What is Glycomet for?", "When do I take Glycomet?", "Which medicines am I taking?",
                  "Glycomet kab leni hai"]:
            self.assertIsNone(safety.classify(q, self.NAMES), q)
