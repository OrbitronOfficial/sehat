"""Reference ranges, aliases, number parsing and flagging. No network.

Run: python -m unittest discover tests
"""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import ranges  # noqa: E402


def flag(name, value, unit="", **extra):
    return ranges.flag_test(dict({"name": name, "value": value, "unit": unit}, **extra))


class LookupTests(unittest.TestCase):
    def test_exact_name(self):
        self.assertEqual(ranges.lookup("Hemoglobin")[0], "Hemoglobin")

    def test_alias_hb(self):
        self.assertEqual(ranges.lookup("hb")[0], "Hemoglobin")

    def test_alias_tlc(self):
        self.assertEqual(ranges.lookup("tlc")[0], "Total WBC Count")

    def test_case_insensitive(self):
        self.assertIs(ranges.lookup("HEMOGLOBIN"), ranges.lookup("hemoglobin"))
        self.assertEqual(ranges.lookup("TLC")[0], "Total WBC Count")

    def test_punctuation_and_spacing_ignored(self):
        self.assertEqual(ranges.lookup("  Total   Cholesterol ")[0], "Total Cholesterol")
        self.assertEqual(ranges.lookup("LDL-C")[0], "LDL Cholesterol")

    def test_prefix_serum_creatinine(self):
        self.assertEqual(ranges.lookup("serum creatinine")[0], "Serum Creatinine")

    def test_prefix_serum_is_stripped_for_other_tests(self):
        self.assertEqual(ranges.lookup("Serum Hemoglobin")[0], "Hemoglobin")
        self.assertEqual(ranges.lookup("Plasma Glucose Fasting")[0], "Fasting Blood Sugar")

    def test_parenthetical_name(self):
        self.assertEqual(ranges.lookup("HbA1c (Glycated Hemoglobin)")[0], "HbA1c")

    def test_parenthetical_canonical_name(self):
        self.assertEqual(ranges.lookup("SGPT (ALT)")[0], "SGPT (ALT)")
        self.assertEqual(ranges.lookup("Vitamin D (25-OH)")[0], "Vitamin D (25-OH)")

    def test_unknown_returns_none(self):
        self.assertIsNone(ranges.lookup("Quantum Flux"))

    def test_empty_and_none_return_none(self):
        self.assertIsNone(ranges.lookup(""))
        self.assertIsNone(ranges.lookup(None))

    def test_row_carries_loinc(self):
        self.assertEqual(ranges.lookup("HbA1c")[6], "4548-4")


class ToNumberTests(unittest.TestCase):
    def test_int_and_float(self):
        self.assertEqual(ranges.to_number(5), 5.0)
        self.assertIsInstance(ranges.to_number(5), float)
        self.assertEqual(ranges.to_number(7.6), 7.6)

    def test_numeric_string(self):
        self.assertEqual(ranges.to_number("12.5"), 12.5)
        self.assertEqual(ranges.to_number(" 12.5 "), 12.5)
        self.assertEqual(ranges.to_number("-3"), -3.0)

    def test_less_than_and_greater_than(self):
        self.assertEqual(ranges.to_number("< 200"), 200.0)
        self.assertEqual(ranges.to_number(">40"), 40.0)

    def test_indian_digit_grouping(self):
        self.assertEqual(ranges.to_number("1,50,000"), 150000.0)

    def test_non_numeric_strings(self):
        for s in ("Positive", "", "5 mg", "1.2.3", "abc"):
            self.assertIsNone(ranges.to_number(s), s)

    def test_booleans_are_not_numbers(self):
        self.assertIsNone(ranges.to_number(True))
        self.assertIsNone(ranges.to_number(False))

    def test_none_and_other_types(self):
        self.assertIsNone(ranges.to_number(None))
        self.assertIsNone(ranges.to_number([1]))


class FlagTests(unittest.TestCase):
    def test_normal_uses_standard_range(self):
        t = flag("Hemoglobin", 14.0, "g/dL")
        self.assertEqual(t["flag"], "normal")
        self.assertEqual(t["ref_source"], "standard")

    def test_low(self):
        self.assertEqual(flag("Hemoglobin", 10.0)["flag"], "low")

    def test_high(self):
        self.assertEqual(flag("Hemoglobin", 18.0)["flag"], "high")

    def test_boundaries_are_normal(self):
        self.assertEqual(flag("Hemoglobin", 12.0)["flag"], "normal")
        self.assertEqual(flag("Hemoglobin", 17.0)["flag"], "normal")

    def test_critical_low(self):
        self.assertEqual(flag("Hemoglobin", 6.5)["flag"], "critical")

    def test_critical_high(self):
        self.assertEqual(flag("Hemoglobin", 21.0)["flag"], "critical")

    def test_critical_threshold_is_exclusive(self):
        self.assertEqual(flag("Hemoglobin", 7.0)["flag"], "low")

    def test_critical_on_one_sided_table_row(self):
        self.assertEqual(flag("Serum Creatinine", 5.0)["flag"], "critical")
        self.assertEqual(flag("Serum Creatinine", 2.0)["flag"], "high")

    def test_report_range_wins_over_standard(self):
        # 12.5 is normal on the standard table but low on this lab's own 13 - 17
        t = flag("Hemoglobin", 12.5, "g/dL", ref_low=13.0, ref_high=17.0)
        self.assertEqual(t["flag"], "low")
        self.assertEqual(t["ref_source"], "report")
        self.assertEqual((t["ref_low"], t["ref_high"]), (13.0, 17.0))

    def test_report_range_may_be_one_sided(self):
        t = flag("Total Cholesterol", 240, "mg/dL", ref_high=200)
        self.assertEqual(t["flag"], "high")
        self.assertEqual(t["ref_source"], "report")

    def test_report_range_as_strings(self):
        t = flag("Hemoglobin", 14, ref_low="13", ref_high="17")
        self.assertEqual(t["flag"], "normal")

    def test_report_range_still_triggers_critical(self):
        t = flag("Hemoglobin", 6.0, "g/dL", ref_low=13.0, ref_high=17.0)
        self.assertEqual(t["flag"], "critical")

    def test_standard_fallback_fills_range_fields(self):
        t = flag("Hemoglobin", 14.0, "g/dL")
        self.assertEqual((t["ref_low"], t["ref_high"]), (12.0, 17.0))
        self.assertEqual(t["ref_source"], "standard")
        self.assertEqual(t["ref_text"], "12 - 17 g/dL")

    def test_standard_fallback_keeps_existing_ref_text(self):
        t = flag("Hemoglobin", 14.0, ref_text="see note")
        self.assertEqual(t["ref_text"], "see note")

    def test_fractional_bounds_formatting(self):
        self.assertEqual(flag("TSH", 2.0)["ref_text"], "0.4 - 4.5 uIU/mL")

    def test_loinc_and_standard_name_added(self):
        t = flag("hb", 14.0)
        self.assertEqual(t["loinc"], "718-7")
        self.assertEqual(t["standard_name"], "Hemoglobin")

    def test_non_numeric_value_is_unknown(self):
        self.assertEqual(flag("Hemoglobin", "Positive")["flag"], "unknown")
        self.assertEqual(flag("Hemoglobin", None)["flag"], "unknown")

    def test_unknown_test_without_range_is_unknown(self):
        t = flag("Quantum Flux", 5)
        self.assertEqual(t["flag"], "unknown")
        self.assertIsNone(t["ref_source"])
        self.assertNotIn("loinc", t)

    def test_unknown_test_with_report_range_is_flagged(self):
        t = flag("Quantum Flux", 5, ref_low=1, ref_high=3)
        self.assertEqual(t["flag"], "high")
        self.assertEqual(t["ref_source"], "report")

    def test_platelets_in_lakh(self):
        self.assertEqual(flag("Platelet Count", 2.4, "lakh/cumm")["flag"], "normal")

    def test_platelets_in_lakh_low(self):
        self.assertEqual(flag("Platelet Count", 0.8, "lakh/cumm")["flag"], "low")

    def test_platelets_in_thousands(self):
        self.assertEqual(flag("Platelets", 240, "x10^3/uL")["flag"], "normal")
        self.assertEqual(flag("Platelets", 90, "x10^3/uL")["flag"], "low")

    def test_platelets_plain_count(self):
        self.assertEqual(flag("Platelet Count", 240000, "/cumm")["flag"], "normal")

    def test_platelet_critical_after_scaling(self):
        self.assertEqual(flag("Platelet Count", 30, "x10^3/uL")["flag"], "critical")

    def test_wbc_plain_count(self):
        self.assertEqual(flag("TLC", 7500, "/cumm")["flag"], "normal")
        self.assertEqual(flag("TLC", 13000, "/cumm")["flag"], "high")

    def test_wbc_in_thousands_small_number(self):
        self.assertEqual(flag("WBC", 7.5, "x10^3/uL")["flag"], "normal")


class PlausibilityTests(unittest.TestCase):
    def test_hba1c_76_is_implausible(self):
        t = flag("HbA1c", 76, "%")
        self.assertTrue(t["implausible"])
        self.assertEqual(t["flag"], "unknown")

    def test_implausible_never_shown_critical(self):
        # 76 % would be far above the critical limit of 14
        self.assertNotEqual(flag("HbA1c", 76, "%")["flag"], "critical")

    def test_correcting_value_clears_mark(self):
        t = flag("HbA1c", 76, "%")
        self.assertTrue(t["implausible"])
        t.update(value=7.6, ref_low=None, ref_high=None, ref_source=None)
        ranges.flag_test(t)
        self.assertNotIn("implausible", t)
        self.assertEqual(t["flag"], "high")

    def test_plausible_value_has_no_mark(self):
        self.assertNotIn("implausible", flag("HbA1c", 7.6, "%"))

    def test_plausibility_uses_numeric_value_for_text_numbers(self):
        self.assertTrue(flag("Hemoglobin", "140", "g/dL")["implausible"])

    def test_limits_are_inclusive(self):
        self.assertNotIn("implausible", flag("Hemoglobin", 25))
        self.assertTrue(flag("Hemoglobin", 25.1)["implausible"])

    def test_test_without_limits_never_implausible(self):
        self.assertNotIn("implausible", flag("CRP", 5000))


if __name__ == "__main__":
    unittest.main()
