"""The unified profile: conditions, medicines, test series, attention list, questions, cross checks.

Uses the five bundled sample records (data/demo.json). No network.
Run: python -m unittest discover tests
"""
import datetime as dt
import json
import os
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import insights  # noqa: E402
import pipeline  # noqa: E402

with open(os.path.join(ROOT, "data", "demo.json"), encoding="utf-8") as f:
    DEMO = json.load(f)["records"]
TODAY = dt.date(2026, 10, 10)


def lab(rec_id, date, tests, medicines=(), diagnoses=()):
    return pipeline.check({"id": rec_id, "doc_type": "lab_report", "date": date,
                           "tests": [dict(t, confidence=0.95) for t in tests],
                           "medicines": [dict(m, confidence=0.95) for m in medicines],
                           "diagnoses": [{"name": d, "confidence": 0.9} for d in diagnoses]})


class ConditionTests(unittest.TestCase):
    def test_same_condition_seen_twice_is_one_entry_with_both_mentions(self):
        out = insights.build(DEMO, today=TODAY)
        diabetes = [c for c in out["conditions"] if "diabetes" in c["name"].lower()]
        self.assertEqual(len(diabetes), 1)
        self.assertEqual(len(diabetes[0]["mentions"]), 2)
        wording = " ".join(m["text"] for m in diabetes[0]["mentions"])
        self.assertIn("newly detected", wording)   # original wording is kept
        self.assertIn("known case", wording)
        self.assertEqual(diabetes[0]["first_seen"], "2026-03-14")

    def test_different_conditions_are_not_merged(self):
        self.assertNotEqual(insights.condition_key("Type 1 Diabetes Mellitus"),
                            insights.condition_key("Type 2 Diabetes Mellitus (known case)"))
        self.assertEqual(insights.condition_key("T2DM"), insights.condition_key("Type 2 Diabetes Mellitus (newly detected)"))


class MedicineTests(unittest.TestCase):
    def test_nothing_is_called_current(self):
        out = insights.build(DEMO, today=TODAY)
        self.assertTrue(out["medicines"])
        self.assertTrue(all(m["status"] in ("course_ended", "unconfirmed") for m in out["medicines"]))

    def test_short_course_past_its_dates_is_marked_ended(self):
        out = insights.build(DEMO, today=TODAY)
        dolo = next(m for m in out["medicines"] if "dolo" in m["name"].lower())
        self.assertEqual(dolo["status"], "course_ended")     # 5 days from 8 Aug 2026
        self.assertEqual(dolo["ends"], "2026-08-13")
        glycomet = next(m for m in out["medicines"] if "glycomet" in m["name"].lower())
        self.assertEqual(glycomet["status"], "unconfirmed")  # no end date written: we do not know
        self.assertEqual(glycomet["mentions"], 2)
        self.assertEqual(glycomet["date"], "2026-08-08")     # latest prescription, with its source record

    def test_course_end_parsing(self):
        self.assertEqual(insights.course_end("2026-03-14", "8 weeks"), dt.date(2026, 5, 9))
        self.assertIsNone(insights.course_end("2026-03-14", "as advised"))
        self.assertIsNone(insights.course_end(None, "5 days"))


class TestSeriesTests(unittest.TestCase):
    def test_platelet_results_form_one_dated_trend_in_one_unit(self):
        out = insights.build(DEMO, today=TODAY)
        platelets = [s for s in out["tests"] if "platelet" in s["name"].lower()]
        self.assertEqual(len(platelets), 1)
        pts = platelets[0]["points"]
        self.assertEqual([p["date"] for p in pts], ["2026-08-05", "2026-08-08", "2026-09-22"])
        self.assertEqual([p["value"] for p in pts], [68000, 142000, 240000])   # 2.4 lakh converted
        self.assertTrue(all(p["comparable"] and p["unit"] == "/cumm" for p in pts))
        self.assertEqual(pts[2]["orig_value"], 2.4)                             # original is preserved
        self.assertIn("lakh", pts[2]["orig_unit"])
        self.assertIn("Converted", pts[2]["note"])

    def test_observation_date_comes_from_the_report_line_when_printed(self):
        seen, dated = insights.observed_date("Platelet Count (05/08, lowest)", "2026-08-08")
        self.assertEqual((seen, dated), (dt.date(2026, 8, 5), True))
        seen, dated = insights.observed_date("Platelet Count (at discharge)", "2026-08-08")
        self.assertEqual((seen, dated), (dt.date(2026, 8, 8), False))

    def test_incompatible_units_are_kept_apart_with_a_reason(self):
        recs = [lab("a", "2026-01-01", [{"name": "Vitamin D (25-OH)", "value": 20, "unit": "ng/mL"}]),
                lab("b", "2026-02-01", [{"name": "Vitamin D (25-OH)", "value": 22, "unit": "ng/mL"}]),
                lab("c", "2026-03-01", [{"name": "Vitamin D (25-OH)", "value": 60, "unit": "nmol/L"}])]
        series = insights.build(recs, today=TODAY)["tests"][0]
        self.assertEqual([p["comparable"] for p in series["points"]], [True, True, False])
        self.assertIn("different unit", series["points"][2]["note"])
        self.assertEqual(series["latest"]["value"], 22)   # the incomparable result is not "latest"

    def test_only_latest_results_need_attention(self):
        out = insights.build(DEMO, today=TODAY)
        names = [a["name"] for a in out["attention"]]
        self.assertNotIn("Platelet Count", names)                     # low in August, normal in September
        self.assertIn("HbA1c", names)                                 # still above range
        self.assertEqual(len(names), len(set(names)))


class QuestionTests(unittest.TestCase):
    def test_questions_cite_real_values_dates_and_records(self):
        out = insights.build(DEMO, today=TODAY)
        hba1c = next(q for q in out["questions"] if "HbA1c" in q["text"])
        for fact in ("8.4", "6.9", "2026-03-12", "2026-09-22"):
            self.assertIn(fact, hba1c["text"])
        ids = {r["id"] for r in DEMO}
        self.assertTrue(hba1c["records"] and set(hba1c["records"]) <= ids)
        self.assertTrue(all(q["records"] for q in out["questions"]))

    def test_questions_never_tell_the_patient_what_to_do(self):
        for lang in ("en", "hi"):
            for q in insights.build(DEMO, lang, today=TODAY)["questions"]:
                self.assertTrue(q["text"].rstrip().endswith("?"), q["text"])
                self.assertNotRegex(q["text"].lower(), r"\byou should\b|\bstop taking\b|\bstart taking\b")

    def test_hindi_questions_keep_numbers_and_units(self):
        hi = next(q for q in insights.build(DEMO, "hi", today=TODAY)["questions"] if "HbA1c" in q["text"])
        for fact in ("8.4 %", "6.9 %"):
            self.assertIn(fact, hi["text"])


class CrossCheckTests(unittest.TestCase):
    def test_metformin_with_raised_creatinine(self):
        recs = [lab("rx", "2026-09-01", [], medicines=[{"name": "Glycomet", "generic": "Metformin", "strength": "500 mg"}]),
                lab("lab", "2026-09-20", [{"name": "Serum Creatinine", "value": 1.9, "unit": "mg/dL", "ref_low": 0.6, "ref_high": 1.3}])]
        cross = insights.build(recs, today=TODAY)["cross"]
        self.assertEqual(len(cross), 1)
        self.assertIn("1.9", cross[0]["note"])
        self.assertEqual(sorted(cross[0]["records"]), ["lab", "rx"])
        self.assertNotRegex(cross[0]["note"].lower(), r"\bstop\b|\bavoid\b|\bdo not take\b")

    def test_no_flag_when_the_lab_value_is_normal_or_the_course_ended(self):
        normal = [lab("rx", "2026-09-01", [], medicines=[{"name": "Glycomet", "generic": "Metformin"}]),
                  lab("lab", "2026-09-20", [{"name": "Serum Creatinine", "value": 0.9, "unit": "mg/dL", "ref_low": 0.6, "ref_high": 1.3}])]
        self.assertEqual(insights.build(normal, today=TODAY)["cross"], [])
        ended = [lab("rx", "2026-01-01", [], medicines=[{"name": "Ibuprofen", "duration": "5 days"}]),
                 lab("lab", "2026-09-20", [{"name": "Serum Creatinine", "value": 1.9, "unit": "mg/dL", "ref_low": 0.6, "ref_high": 1.3}])]
        self.assertEqual(insights.build(ended, today=TODAY)["cross"], [])

    def test_two_clotting_medicines(self):
        recs = [lab("rx", "2026-09-01", [], medicines=[{"name": "Aspirin"}, {"name": "Clopidogrel"}])]
        cross = insights.build(recs, today=TODAY)["cross"]
        self.assertEqual(len(cross), 1)
        self.assertIn("confirm", cross[0]["note"].lower())

    def test_demo_patient_has_no_cross_flags(self):
        self.assertEqual(insights.build(DEMO, today=TODAY)["cross"], [])


class WellnessTests(unittest.TestCase):
    READINGS = [
        {"id": "v1", "type": "bp", "date": "2026-10-01", "value": 128, "value2": 82},
        {"id": "v2", "type": "bp", "date": "2026-10-08", "value": 152, "value2": 94},
        {"id": "v3", "type": "sugar_fasting", "date": "2026-10-08", "value": 96},
        {"id": "v4", "type": "weight", "date": "2026-10-08", "value": 84},
        {"id": "bad1", "type": "bp", "date": "2026-10-08", "value": 900, "value2": 80},      # impossible
        {"id": "bad2", "type": "mood", "date": "2026-10-08", "value": 5},                    # unknown type
        {"id": "bad3", "type": "pulse", "date": "not a date", "value": 72},
    ]

    def test_flags_are_decided_in_code(self):
        self.assertEqual(insights.vital_flag("bp", 128, 82), "normal")
        self.assertEqual(insights.vital_flag("bp", 152, 94), "high")
        self.assertEqual(insights.vital_flag("bp", 118, 92), "high")       # either number can raise it
        self.assertEqual(insights.vital_flag("bp", 185, 100), "critical")
        self.assertEqual(insights.vital_flag("bp", 86, 55), "low")
        self.assertEqual(insights.vital_flag("sugar_fasting", 96), "normal")
        self.assertEqual(insights.vital_flag("sugar_fasting", 130), "high")
        self.assertEqual(insights.vital_flag("sugar_pp", 130), "normal")
        self.assertEqual(insights.vital_flag("sugar_fasting", 48), "critical")
        self.assertEqual(insights.vital_flag("pulse", 112), "high")
        self.assertEqual(insights.vital_flag("weight", 84), "unknown")     # weight is never flagged

    def test_series_are_dated_and_bad_readings_are_dropped(self):
        out = insights.build([], today=TODAY, vitals=self.READINGS)
        kinds = [s["type"] for s in out["vitals"]]
        self.assertEqual(kinds, ["bp", "sugar_fasting", "weight"])
        bp = out["vitals"][0]
        self.assertEqual([p["text"] for p in bp["points"]], ["128/82", "152/94"])
        self.assertEqual(bp["latest"]["flag"], "high")

    def test_latest_abnormal_reading_needs_attention_and_raises_a_question(self):
        out = insights.build(DEMO, today=TODAY, vitals=self.READINGS)
        home = [a for a in out["attention"] if a.get("source") == "vitals"]
        self.assertEqual([(a["name"], a["value"]) for a in home], [("Blood pressure", "152/94")])
        self.assertTrue(any("152/94" in q["text"] and q["text"].endswith("?") for q in out["questions"]))

    def test_readings_export_as_fhir_vital_signs(self):
        import fhir
        b = fhir.bundle({"name": "Test"}, [], self.READINGS)
        obs = [e["resource"] for e in b["entry"] if e["resource"]["resourceType"] == "Observation"]
        self.assertEqual(len(obs), 4)
        bp = next(o for o in obs if o["code"]["coding"][0]["code"] == "85354-9")
        self.assertEqual([c["valueQuantity"]["value"] for c in bp["component"]], [128, 82])
        self.assertTrue(all(o["category"][0]["coding"][0]["code"] == "vital-signs" for o in obs))


class ShapeTests(unittest.TestCase):
    def test_empty_and_malformed_input(self):
        out = insights.build([], today=TODAY)
        self.assertEqual((out["conditions"], out["medicines"], out["tests"], out["attention"], out["questions"]), ([], [], [], [], []))
        self.assertTrue(insights.build([None, "x", {"id": "r", "tests": [{"name": None, "value": 1}]}], today=TODAY)["disclaimer"])

    def test_output_is_json_serialisable(self):
        json.dumps(insights.build(DEMO, "hi", today=TODAY))


class PersistentTests(unittest.TestCase):
    def test_two_high_results_in_a_row_are_persistent(self):
        recs = [lab("a", "2026-03-01", [{"name": "HbA1c", "value": 7.5, "unit": "%"}]),
                lab("b", "2026-06-01", [{"name": "HbA1c", "value": 7.1, "unit": "%"}]),
                lab("c", "2026-09-01", [{"name": "HbA1c", "value": 6.9, "unit": "%"}])]
        p = insights.build(recs, today=TODAY)["persistent"]
        self.assertEqual(len(p), 1)
        self.assertEqual((p[0]["name"], p[0]["count"], p[0]["since"]), ("HbA1c", 3, "2026-03-01"))
        self.assertEqual(p[0]["latest"], {"value": 6.9, "date": "2026-09-01", "flag": "high"})
        self.assertEqual(p[0]["records"], ["a", "b", "c"])

    def test_back_in_range_or_single_result_is_not_persistent(self):
        recs = [lab("a", "2026-03-01", [{"name": "HbA1c", "value": 7.5, "unit": "%"},
                                        {"name": "Hemoglobin", "value": 9, "unit": "g/dL"}]),
                lab("b", "2026-06-01", [{"name": "HbA1c", "value": 5.2, "unit": "%"}])]
        self.assertEqual(insights.build(recs, today=TODAY)["persistent"], [])


class PreventiveTests(unittest.TestCase):
    def items(self, recs, **kw):
        return insights.build(recs, today=TODAY, **kw)["preventive"]

    def test_repeat_test_due_and_overdue_from_fixed_today(self):
        old = self.items([lab("a", "2026-06-01", [{"name": "HbA1c", "value": 7.1, "unit": "%"}])])
        item = next(i for i in old if i["title"].endswith("HbA1c"))
        self.assertEqual((item["kind"], item["due"], item["overdue"]), ("repeat_test", "2026-08-30", True))
        self.assertIn("1 Jun 2026", item["why"])
        self.assertEqual(item["records"], ["a"])
        new = self.items([lab("b", "2026-09-22", [{"name": "HbA1c", "value": 7.1, "unit": "%"}])])
        item = next(i for i in new if i["title"].endswith("HbA1c"))
        self.assertEqual((item["due"], item["overdue"]), ("2026-12-21", False))

    def test_lipid_interval_depends_on_range(self):
        high = self.items([lab("a", "2026-01-01", [{"name": "LDL Cholesterol", "value": 150, "unit": "mg/dL"}])])
        ok = self.items([lab("a", "2026-01-01", [{"name": "LDL Cholesterol", "value": 80, "unit": "mg/dL"}])])
        self.assertEqual(next(i for i in high if "Lipid" in i["title"])["due"], "2026-06-30")
        self.assertEqual(next(i for i in ok if "Lipid" in i["title"])["due"], "2027-01-01")

    def test_follow_up_interval_is_parsed(self):
        def rx(rec_id, date, text):
            return pipeline.check({"id": rec_id, "doc_type": "prescription", "date": date,
                                   "follow_up": text, "medicines": [], "tests": []})
        recs = [rx("f", "2026-09-01", "Review after 3 months with reports"),
                rx("g", "2026-10-05", "Come back x 10 days"),
                rx("h", "2026-10-06", "Visit when needed")]
        by = {i["records"][0]: i for i in self.items(recs) if i["kind"] == "follow_up"}
        self.assertEqual((by["f"]["due"], by["f"]["overdue"]), ("2026-12-01", False))
        self.assertEqual((by["g"]["due"], by["g"]["overdue"]), ("2026-10-15", False))
        self.assertEqual((by["h"]["due"], by["h"]["overdue"]), (None, False))
        late = [i for i in self.items([rx("z", "2026-06-01", "after 1 week")]) if i["kind"] == "follow_up"]
        self.assertTrue(late[0]["overdue"])

    def test_follow_up_stays_after_a_later_record(self):
        def rx(rec_id, date, fu):
            return pipeline.check({"id": rec_id, "doc_type": "prescription", "date": date,
                                   "follow_up": fu, "medicines": [], "tests": []})
        recs = [rx("a", "2026-06-01", "after 1 week"), rx("b", "2026-09-01", None)]
        got = [i for i in self.items(recs) if i["kind"] == "follow_up"]
        self.assertEqual([i["records"] for i in got], [["a"]])
        self.assertTrue(got[0]["overdue"])

    def test_screening_by_age_and_sex(self):
        def titles(**p):
            return [i["title"] for i in self.items([], patient=p) if i["kind"] == "screening"]
        self.assertEqual(self.items([]), [])   # no age, no records: nothing invented
        self.assertEqual(titles(age=35, sex="F"), ["Blood pressure check", "Cervical screening: talk to your doctor"])
        t = titles(age=52, sex="female")
        for want in ("Diabetes screening", "Lipid profile", "Colon cancer screening: talk to your doctor",
                     "Mammography: talk to your doctor"):
            self.assertIn(want, t)
        self.assertNotIn("Mammography: talk to your doctor", titles(age=52, sex="M"))

    def test_screening_skipped_when_test_already_in_records(self):
        recs = [lab("a", "2026-09-01", [{"name": "HbA1c", "value": 5.2, "unit": "%"}])]
        t = [i["title"] for i in self.items(recs, patient={"age": 50, "sex": "M"}) if i["kind"] == "screening"]
        self.assertNotIn("Diabetes screening", t)
        self.assertIn("Lipid profile", t)

    def test_hindi_items_use_devanagari(self):
        recs = [lab("a", "2026-06-01", [{"name": "HbA1c", "value": 7.1, "unit": "%"}])]
        item = insights.build(recs, "hi", today=TODAY)["preventive"][0]
        self.assertRegex(item["why"], "[ऀ-ॿ]")


class WellnessGuidanceTests(unittest.TestCase):
    def tips(self, recs, **kw):
        return insights.build(recs, today=TODAY, **kw)["wellness"]

    def test_high_hba1c_tips_cite_the_record_date(self):
        tips = self.tips([lab("a", "2026-09-22", [{"name": "HbA1c", "value": 6.9, "unit": "%"}])])
        diet = [t for t in tips if t["area"] == "diet"]
        self.assertEqual(diet[0]["why"], "Your HbA1c was 6.9 % on 22 Sep 2026, above the printed range")
        self.assertEqual(diet[0]["records"], ["a"])
        self.assertIn("activity", [t["area"] for t in tips])

    def test_no_tip_for_absent_conditions(self):
        tips = self.tips([lab("a", "2026-09-22", [{"name": "HbA1c", "value": 5.0, "unit": "%"}])])
        text = " ".join(t["tip"] for t in tips).lower()
        for word in ("sugary", "salt", "iron", "alcohol", "fried", "sunlight"):
            self.assertNotIn(word, text)

    def test_always_sleep_and_habit_tip_and_bounded_size(self):
        for recs in ([], DEMO):
            tips = self.tips(recs)
            self.assertTrue(3 <= len(tips) <= 6)
            self.assertIn("sleep", [t["area"] for t in tips])
            self.assertEqual(len({(t["area"], t["tip"]) for t in tips}), len(tips))
            self.assertTrue(all(t["why"] for t in tips))

    def test_low_hemoglobin_and_vitamin_d_and_home_bp(self):
        recs = [lab("a", "2026-09-01", [{"name": "Hemoglobin", "value": 9, "unit": "g/dL"},
                                        {"name": "Vitamin D", "value": 12, "unit": "ng/mL"}])]
        vit = [{"id": "v", "type": "bp", "date": "2026-10-01", "value": 150, "value2": 95}]
        text = " ".join(t["tip"] for t in self.tips(recs, vitals=vit)).lower()
        for word in ("iron", "sunlight", "salt"):
            self.assertIn(word, text)


class JournalSummaryTests(unittest.TestCase):
    def entries(self):
        out = []
        for i in range(1, 9):
            out.append({"date": f"2026-10-{i:02d}", "mood": 2 if i <= 4 else 4, "sleep": 2 if i <= 4 else 4,
                        "energy": 3, "pain": 8 if i == 2 else 2,
                        "symptoms": ["Dizziness"] if i in (1, 2, 3, 5, 6, 7) else [],
                        "meds_taken": False if i in (3, 4) else True, "side_effects": "dry mouth" if i > 6 else "",
                        "note": "x"})
        return out

    def test_counts_trends_and_adherence(self):
        out = insights.journal_summary(self.entries(), lang="en", today=TODAY)
        self.assertEqual(out["period"], {"from": "2026-10-01", "to": "2026-10-08"})
        self.assertEqual(out["entries"], 8)
        self.assertEqual(out["symptoms"], [{"name": "Dizziness", "count": 6, "first": "2026-10-01", "last": "2026-10-07"}])
        self.assertIn("Reported sleep improved (average 2.0 → 4.0 out of 5)", out["improving"])
        self.assertTrue(any("mood" in x for x in out["improving"]))
        self.assertFalse(any("energy" in x for x in out["improving"] + out["worsening"]))
        self.assertEqual(out["missed_days"], ["2026-10-03", "2026-10-04"])
        self.assertEqual(out["adherence"], {"taken": 6, "missed": 2, "unknown": 0})
        self.assertEqual(out["side_effects"], [{"text": "dry mouth", "count": 2}])
        self.assertEqual(len(out["entry_dates"]), 8)

    def test_concerns_and_safe_questions(self):
        out = insights.journal_summary(self.entries(), lang="en")
        text = " ".join(out["concerns"])
        self.assertIn("Dizziness was reported on 6 days", text)
        self.assertIn("highest 8/10", text)
        self.assertIn("2 days in a row", text)
        self.assertTrue(3 <= len(out["questions"]) <= 5)
        self.assertIn("I noted Dizziness on 6 days; is this worth checking?", out["questions"])
        joined = " ".join(out["questions"]).lower()
        self.assertNotIn("caused", joined)
        self.assertNotIn("because of your medicine", joined)

    def test_worsening_needs_three_values_in_each_half(self):
        e = [{"date": f"2026-10-{i:02d}", "sleep": 4 if i <= 4 else 2} for i in range(1, 9)]
        self.assertEqual(insights.journal_summary(e)["worsening"], ["Reported sleep got worse (average 4.0 → 2.0 out of 5)"])
        self.assertEqual(insights.journal_summary(e[:5])["worsening"], [])

    def test_cleaning_and_since(self):
        e = self.entries() + [{"date": "not-a-date", "mood": 1}, "junk",
                              {"date": "2026-10-09", "mood": 99, "pain": -1, "symptoms": "nope"}]
        out = insights.journal_summary(e, since="2026-10-05")
        self.assertEqual(out["period"]["from"], "2026-10-05")
        self.assertEqual(out["entries"], 5)
        self.assertEqual(len(insights.clean_journal([{"date": "2026-01-01"}] * 500)), 400)
        empty = insights.journal_summary([], lang="hi")
        self.assertEqual((empty["entries"], empty["adherence"]["unknown"]), (0, 0))

    def test_hindi(self):
        out = insights.journal_summary(self.entries(), lang="hi")
        self.assertRegex(out["questions"][0], "[ऀ-ॿ]")


if __name__ == "__main__":
    unittest.main()
