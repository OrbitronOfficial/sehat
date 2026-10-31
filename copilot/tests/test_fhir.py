"""FHIR bundle builder. No network.

Run: python -m unittest discover tests
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import fhir  # noqa: E402

LAB = {
    "id": "rec_lab", "doc_type": "lab_report", "title": "Blood test", "date": "2026-06-18",
    "facility": "City Lab", "doctor": "Dr. Mehta",
    "tests": [
        {"name": "Hemoglobin", "value": 10.2, "unit": "g/dL", "ref_low": 12.0, "ref_high": 17.0,
         "ref_text": "12 - 17 g/dL", "flag": "low", "loinc": "718-7", "standard_name": "Hemoglobin"},
        {"name": "HbA1c", "value": 5.0, "unit": "%", "flag": "normal", "loinc": "4548-4"},
        {"name": "Serum Creatinine", "value": 5.0, "unit": "mg/dL", "flag": "critical"},
        {"name": "Total Cholesterol", "value": 240, "unit": "mg/dL", "flag": "high"},
        {"name": "Urine Protein", "value": "Positive", "flag": "unknown"},
    ],
}
RX = {
    "id": "rec_rx", "doc_type": "prescription", "title": "Prescription", "date": "2026-03-02",
    "doctor": "Dr. Rao",
    "medicines": [
        {"name": "Glycomet", "strength": "500 mg", "generic": "Metformin", "dose": "1 tablet",
         "frequency": "twice a day", "timing": "after food", "duration": "30 days"},
        {"name": "Ecosprin"},
    ],
    "diagnoses": [{"name": "Type 2 diabetes"}, {"name": "Hypertension"}],
}
DISCHARGE = {"id": "rec_dis", "doc_type": "discharge_summary", "title": "Discharge", "date": "2026-08-01",
             "diagnoses": [{"name": "Dengue"}]}


def of_type(b, rtype):
    return [e["resource"] for e in b["entry"] if e["resource"]["resourceType"] == rtype]


def by_id(b):
    return {e["resource"]["id"]: e["resource"] for e in b["entry"]}


def resolve(b, ref):
    return by_id(b)[ref["reference"].replace("urn:uuid:", "")]


class BundleShapeTests(unittest.TestCase):
    def setUp(self):
        self.b = fhir.bundle({"name": "Asha"}, [LAB, RX])

    def test_resource_type_and_type(self):
        self.assertEqual(self.b["resourceType"], "Bundle")
        self.assertEqual(self.b["type"], "collection")

    def test_nrces_profile_in_meta(self):
        self.assertEqual(self.b["meta"]["profile"], [fhir.NRCES + "DocumentBundle"])

    def test_has_timestamp_and_id(self):
        self.assertTrue(self.b["timestamp"])
        self.assertTrue(self.b["id"])

    def test_full_urls_match_resource_ids(self):
        for e in self.b["entry"]:
            self.assertTrue(e["fullUrl"].startswith("urn:uuid:"))
            self.assertEqual(e["fullUrl"], "urn:uuid:" + e["resource"]["id"])

    def test_resource_ids_are_unique(self):
        ids = [e["resource"]["id"] for e in self.b["entry"]]
        self.assertEqual(len(ids), len(set(ids)))

    def test_patient_is_first_entry(self):
        self.assertEqual(self.b["entry"][0]["resource"]["resourceType"], "Patient")

    def test_every_reference_resolves(self):
        known = {"urn:uuid:" + i for i in by_id(self.b)}

        def walk(x):
            if isinstance(x, dict):
                if "reference" in x:
                    self.assertIn(x["reference"], known)
                for v in x.values():
                    walk(v)
            elif isinstance(x, list):
                for v in x:
                    walk(v)
        walk(self.b["entry"])

    def test_no_none_or_empty_values_anywhere(self):
        def walk(x):
            if isinstance(x, dict):
                for k, v in x.items():
                    self.assertNotIn(v, (None, "", [], {}), k)
                    walk(v)
            elif isinstance(x, list):
                for v in x:
                    walk(v)
        walk(self.b)

    def test_empty_record_list_gives_patient_only(self):
        b = fhir.bundle({"name": "Asha"}, [])
        self.assertEqual(b["resourceType"], "Bundle")
        self.assertEqual([e["resource"]["resourceType"] for e in b["entry"]], ["Patient"])

    def test_none_records_and_none_patient(self):
        b = fhir.bundle(None, None)
        self.assertEqual(len(b["entry"]), 1)
        self.assertEqual(b["entry"][0]["resource"]["name"][0]["text"], "Unknown")

    def test_non_dict_records_are_ignored(self):
        b = fhir.bundle({}, ["junk", None, 5])
        self.assertEqual(len(b["entry"]), 1)


class PatientTests(unittest.TestCase):
    def test_abha_string_with_dashes_becomes_14_digits(self):
        p = fhir._patient({"name": "A", "abha": "12-3456-7890-1234"})
        ident = p["identifier"][0]
        self.assertEqual(ident["value"], "12345678901234")
        self.assertEqual(len(ident["value"]), 14)
        self.assertEqual(ident["system"], fhir.ABHA_SYSTEM)

    def test_abha_object(self):
        p = fhir._patient({"abha": {"abha_number": "12-3456-7890-1234", "linked": True}})
        self.assertEqual(p["identifier"][0]["value"], "12345678901234")

    def test_no_identifier_when_absent(self):
        self.assertNotIn("identifier", fhir._patient({"name": "A"}))
        self.assertNotIn("identifier", fhir._patient({"abha": ""}))
        self.assertNotIn("identifier", fhir._patient({"abha": {"linked": False}}))

    def test_gender_mapping(self):
        self.assertEqual(fhir._patient({"sex": "M"})["gender"], "male")
        self.assertEqual(fhir._patient({"sex": "f"})["gender"], "female")
        self.assertEqual(fhir._patient({"sex": " Female "})["gender"], "female")
        self.assertEqual(fhir._patient({"sex": "male"})["gender"], "male")

    def test_gender_absent_when_unknown(self):
        self.assertNotIn("gender", fhir._patient({"sex": "other"}))
        self.assertNotIn("gender", fhir._patient({}))

    def test_name_and_profile(self):
        p = fhir._patient({"name": "Asha Rao"})
        self.assertEqual(p["name"], [{"text": "Asha Rao"}])
        self.assertEqual(p["meta"]["profile"], [fhir.NRCES + "Patient"])


class LabRecordTests(unittest.TestCase):
    def setUp(self):
        self.b = fhir.bundle({"name": "Asha"}, [LAB])
        self.obs = of_type(self.b, "Observation")

    def test_one_observation_per_test(self):
        self.assertEqual(len(self.obs), len(LAB["tests"]))

    def test_loinc_coding_for_known_test(self):
        coding = self.obs[0]["code"]["coding"][0]
        self.assertEqual((coding["system"], coding["code"]), (fhir.LOINC, "718-7"))
        self.assertEqual(self.obs[0]["code"]["text"], "Hemoglobin")

    def test_no_coding_without_loinc(self):
        self.assertNotIn("coding", self.obs[2]["code"])

    def test_value_quantity_for_numbers(self):
        self.assertEqual(self.obs[0]["valueQuantity"], {"value": 10.2, "unit": "g/dL"})
        self.assertNotIn("valueString", self.obs[0])

    def test_value_string_for_text(self):
        self.assertEqual(self.obs[4]["valueString"], "Positive")
        self.assertNotIn("valueQuantity", self.obs[4])

    def test_reference_range(self):
        rr = self.obs[0]["referenceRange"][0]
        self.assertEqual(rr["low"]["value"], 12.0)
        self.assertEqual(rr["high"]["value"], 17.0)
        self.assertEqual(rr["text"], "12 - 17 g/dL")

    def test_no_reference_range_when_none_known(self):
        self.assertNotIn("referenceRange", self.obs[1])

    def test_interpretation_codes(self):
        codes = [o["interpretation"][0]["coding"][0]["code"] if "interpretation" in o else None for o in self.obs]
        self.assertEqual(codes, ["L", "N", "AA", "H", None])

    def test_interpretation_uses_hl7_system(self):
        self.assertEqual(self.obs[0]["interpretation"][0]["coding"][0]["system"], fhir.INTERP)

    def test_observation_subject_is_patient(self):
        patient = of_type(self.b, "Patient")[0]
        for o in self.obs:
            self.assertEqual(o["subject"], {"reference": "urn:uuid:" + patient["id"]})

    def test_effective_date_has_ist_offset(self):
        self.assertEqual(self.obs[0]["effectiveDateTime"], "2026-06-18T00:00:00+05:30")

    def test_one_diagnostic_report_referencing_observations(self):
        reports = of_type(self.b, "DiagnosticReport")
        self.assertEqual(len(reports), 1)
        refs = reports[0]["result"]
        self.assertEqual(len(refs), len(self.obs))
        for r in refs:
            self.assertEqual(resolve(self.b, r)["resourceType"], "Observation")
        self.assertEqual(reports[0]["performer"], [{"display": "City Lab"}])

    def test_no_report_when_no_tests(self):
        b = fhir.bundle({}, [RX])
        self.assertEqual(of_type(b, "DiagnosticReport"), [])
        self.assertEqual(of_type(b, "Observation"), [])


class PrescriptionAndConditionTests(unittest.TestCase):
    def setUp(self):
        self.b = fhir.bundle({}, [RX])
        self.meds = of_type(self.b, "MedicationRequest")

    def test_one_request_per_medicine(self):
        self.assertEqual(len(self.meds), 2)
        self.assertTrue(all(m["status"] == "active" and m["intent"] == "order" for m in self.meds))

    def test_dosage_text(self):
        self.assertEqual(self.meds[0]["dosageInstruction"][0]["text"],
                         "1 tablet, twice a day, after food, for 30 days")

    def test_medication_name_includes_strength_and_generic(self):
        self.assertEqual(self.meds[0]["medicationCodeableConcept"]["text"], "Glycomet 500 mg (Metformin)")

    def test_requester_is_doctor(self):
        self.assertEqual(self.meds[0]["requester"], {"display": "Dr. Rao"})

    def test_no_dosage_when_nothing_written(self):
        self.assertNotIn("dosageInstruction", self.meds[1])

    def test_conditions_from_diagnoses(self):
        conds = of_type(self.b, "Condition")
        self.assertEqual([c["code"]["text"] for c in conds], ["Type 2 diabetes", "Hypertension"])
        self.assertEqual(conds[0]["clinicalStatus"]["coding"][0]["code"], "active")
        self.assertEqual(conds[0]["recordedDate"], "2026-03-02")


class CompositionTests(unittest.TestCase):
    def test_one_composition_per_record(self):
        b = fhir.bundle({}, [LAB, RX, DISCHARGE])
        self.assertEqual(len(of_type(b, "Composition")), 3)

    def test_type_coding_matches_document_type(self):
        b = fhir.bundle({}, [LAB, RX, DISCHARGE])
        by_title = {c["title"]: c for c in of_type(b, "Composition")}
        expect = {"Blood test": "721981007", "Prescription": "440545006", "Discharge": "373942005"}
        for title, code in expect.items():
            coding = by_title[title]["type"]["coding"][0]
            self.assertEqual((coding["system"], coding["code"]), (fhir.SNOMED, code))

    def test_profile_matches_document_type(self):
        b = fhir.bundle({}, [RX])
        self.assertEqual(of_type(b, "Composition")[0]["meta"]["profile"], [fhir.NRCES + "PrescriptionRecord"])

    def test_unknown_doc_type_falls_back_to_other(self):
        b = fhir.bundle({}, [{"id": "r", "doc_type": "weird", "title": "X", "date": "2026-01-01"}])
        comp = of_type(b, "Composition")[0]
        self.assertEqual(comp["type"]["coding"][0]["code"], "419891008")

    def test_section_entries_all_resolve(self):
        b = fhir.bundle({}, [LAB, RX])
        for comp in of_type(b, "Composition"):
            self.assertTrue(comp["section"])
            for sec in comp["section"]:
                for entry in sec["entry"]:
                    self.assertIn(resolve(b, entry)["resourceType"],
                                  ("DiagnosticReport", "MedicationRequest", "Condition"))

    def test_composition_without_content_has_no_section(self):
        b = fhir.bundle({}, [{"id": "r", "doc_type": "other", "title": "Blank", "date": "2026-01-01"}])
        self.assertNotIn("section", of_type(b, "Composition")[0])

    def test_record_id_kept_as_identifier(self):
        b = fhir.bundle({}, [RX])
        self.assertEqual(of_type(b, "Composition")[0]["identifier"]["value"], "rec_rx")

    def test_missing_date_defaults_to_today(self):
        b = fhir.bundle({}, [{"id": "r", "doc_type": "other", "title": "Undated"}])
        self.assertRegex(of_type(b, "Composition")[0]["date"], r"^\d{4}-\d{2}-\d{2}T00:00:00\+05:30$")

    def test_records_are_ordered_by_date(self):
        b = fhir.bundle({}, [DISCHARGE, RX])
        self.assertEqual([c["title"] for c in of_type(b, "Composition")], ["Prescription", "Discharge"])


class StripTests(unittest.TestCase):
    def test_removes_none_empty_string_list_dict(self):
        self.assertEqual(fhir._strip({"a": None, "b": "", "c": [], "d": {}, "e": 1}), {"e": 1})

    def test_recursive(self):
        self.assertEqual(fhir._strip({"x": {"y": None, "z": 2}, "l": [{"a": None, "b": 1}]}),
                         {"x": {"z": 2}, "l": [{"b": 1}]})

    def test_keeps_zero_and_false(self):
        self.assertEqual(fhir._strip({"a": 0, "b": False, "c": 0.0}), {"a": 0, "b": False, "c": 0.0})

    def test_scalars_pass_through(self):
        self.assertEqual(fhir._strip("text"), "text")
        self.assertEqual(fhir._strip(5), 5)

    def test_dict_emptied_by_stripping_is_dropped(self):
        self.assertEqual(fhir._strip({"a": {"b": None}}), {})


if __name__ == "__main__":
    unittest.main()
