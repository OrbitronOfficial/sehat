"""Reference ranges and flagging. Code decides the flag; the model never does.

Adult ranges, conventional units used by Indian labs. A range printed on the
report itself always wins over this table, because labs calibrate their own.
"""
import re

# key: (display name, unit, low, high, critical_low, critical_high, LOINC, aliases)
_T = [
    ("Hemoglobin", "g/dL", 12.0, 17.0, 7.0, 20.0, "718-7", ["hb", "haemoglobin", "hgb"]),
    ("Total WBC Count", "/cumm", 4000, 11000, 2000, 30000, "6690-2",
     ["wbc", "tlc", "total leucocyte count", "total leukocyte count", "white blood cell count"]),
    ("Platelet Count", "/cumm", 150000, 410000, 50000, 1000000, "777-3", ["platelets", "plt"]),
    ("RBC Count", "million/cumm", 3.8, 5.8, None, None, "789-8", ["rbc", "red blood cell count"]),
    ("Hematocrit", "%", 36, 50, 20, 60, "4544-3", ["pcv", "hct", "packed cell volume"]),
    ("MCV", "fL", 80, 100, None, None, "787-2", ["mean corpuscular volume"]),
    ("ESR", "mm/hr", 0, 20, None, None, "4537-7", ["erythrocyte sedimentation rate"]),
    ("Fasting Blood Sugar", "mg/dL", 70, 100, 54, 400, "1558-6",
     ["fbs", "fasting glucose", "fasting plasma glucose", "glucose fasting", "blood sugar fasting"]),
    ("Post Prandial Blood Sugar", "mg/dL", 70, 140, 54, 400, "1521-4",
     ["ppbs", "pp glucose", "post prandial glucose", "glucose pp", "blood sugar pp"]),
    ("Random Blood Sugar", "mg/dL", 70, 140, 54, 400, "2345-7", ["rbs", "random glucose", "glucose random"]),
    ("HbA1c", "%", 4.0, 5.6, None, 14.0, "4548-4",
     ["glycated hemoglobin", "glycosylated hemoglobin", "glycated haemoglobin", "hba1c glycated hemoglobin"]),
    ("Total Cholesterol", "mg/dL", 0, 200, None, None, "2093-3", ["cholesterol", "cholesterol total", "serum cholesterol"]),
    ("LDL Cholesterol", "mg/dL", 0, 100, None, None, "13457-7", ["ldl", "ldl c", "ldl cholesterol direct"]),
    ("HDL Cholesterol", "mg/dL", 40, 100, None, None, "2085-9", ["hdl", "hdl c"]),
    ("Triglycerides", "mg/dL", 0, 150, None, 500, "2571-8", ["tg", "serum triglycerides"]),
    ("Serum Creatinine", "mg/dL", 0.6, 1.3, None, 4.0, "2160-0", ["creatinine", "s creatinine"]),
    ("Blood Urea", "mg/dL", 15, 40, None, 150, "3091-6", ["urea", "serum urea"]),
    ("Uric Acid", "mg/dL", 3.5, 7.2, None, None, "3084-1", ["serum uric acid"]),
    ("Sodium", "mEq/L", 135, 145, 120, 160, "2951-2", ["serum sodium", "na"]),
    ("Potassium", "mEq/L", 3.5, 5.1, 2.5, 6.5, "2823-3", ["serum potassium", "k"]),
    ("Total Bilirubin", "mg/dL", 0.2, 1.2, None, 15, "1975-2", ["bilirubin total", "serum bilirubin"]),
    ("SGPT (ALT)", "U/L", 0, 45, None, 1000, "1742-6", ["sgpt", "alt", "alanine aminotransferase", "alt sgpt"]),
    ("SGOT (AST)", "U/L", 0, 40, None, 1000, "1920-8", ["sgot", "ast", "aspartate aminotransferase", "ast sgot"]),
    ("Alkaline Phosphatase", "U/L", 40, 130, None, None, "6768-6", ["alp"]),
    ("TSH", "uIU/mL", 0.4, 4.5, 0.01, 100, "3016-3", ["thyroid stimulating hormone", "tsh ultrasensitive"]),
    ("Free T4", "ng/dL", 0.8, 1.8, None, None, "3024-7", ["ft4"]),
    ("Vitamin D (25-OH)", "ng/mL", 30, 100, None, 150, "1989-3",
     ["vitamin d", "25 oh vitamin d", "25 hydroxy vitamin d", "vitamin d total", "vitamin d 25 hydroxy"]),
    ("Vitamin B12", "pg/mL", 200, 900, None, None, "2132-9", ["b12", "cobalamin"]),
    ("Serum Calcium", "mg/dL", 8.5, 10.5, 6.5, 13, "17861-6", ["calcium"]),
    ("Serum Ferritin", "ng/mL", 20, 300, None, None, "2276-4", ["ferritin"]),
    ("CRP", "mg/L", 0, 6, None, None, "1988-5", ["c reactive protein"]),
]

# Counts get reported as 2.4 lakh, 240 (x10^3) or 240000. Bring them to /cumm.
_COUNT_SCALE = {"Platelet Count": 150000, "Total WBC Count": 4000}


# Values no living adult has. A reading outside these almost always means the reader lost a
# decimal point or merged two numbers ("7.6" read as "76"), so it is treated as a misread
# and never shown as a critical result.
PLAUSIBLE = {
    "Hemoglobin": (2, 25), "HbA1c": (3, 20), "Hematocrit": (8, 75), "MCV": (40, 160),
    "Fasting Blood Sugar": (15, 1500), "Post Prandial Blood Sugar": (15, 1500), "Random Blood Sugar": (15, 1500),
    "Total Cholesterol": (40, 1000), "LDL Cholesterol": (5, 700), "HDL Cholesterol": (3, 200),
    "Triglycerides": (10, 6000), "Serum Creatinine": (0.1, 30), "Blood Urea": (2, 500),
    "Uric Acid": (0.5, 25), "Sodium": (90, 190), "Potassium": (1, 10), "Total Bilirubin": (0.05, 60),
    "TSH": (0.001, 600), "Free T4": (0.05, 12), "Vitamin D (25-OH)": (1, 300), "Vitamin B12": (30, 20000),
    "Serum Calcium": (3, 20), "ESR": (0, 200),
}


def _key(s):
    s = re.sub(r"\(.*?\)", " ", (s or "").lower())
    return re.sub(r"[^a-z0-9]+", " ", s).strip()


_BY_NAME = {}
for row in _T:
    for alias in [row[0]] + row[7]:
        _BY_NAME[_key(alias)] = row
    _BY_NAME[_key(row[0].replace("(", " ").replace(")", " "))] = row


def lookup(name):
    k = _key(name)
    if k in _BY_NAME:
        return _BY_NAME[k]
    for prefix in ("serum ", "s ", "blood ", "plasma "):
        if k.startswith(prefix) and k[len(prefix):] in _BY_NAME:
            return _BY_NAME[k[len(prefix):]]
    full = _key((name or "").replace("(", " ").replace(")", " "))
    return _BY_NAME.get(full)


def to_number(v):
    if isinstance(v, (int, float)) and not isinstance(v, bool):
        return float(v)
    if isinstance(v, str):
        m = re.fullmatch(r"\s*[<>]?\s*(-?\d[\d,]*\.?\d*)\s*", v)
        if m:
            try:
                return float(m.group(1).replace(",", ""))
            except ValueError:
                return None
    return None


def _scaled(std_name, value, unit):
    """Normalise count units to /cumm so the standard table applies."""
    floor = _COUNT_SCALE.get(std_name)
    if floor is None:
        return value
    u = (unit or "").lower()
    if "lakh" in u or "lac" in u:
        return value * 100000
    if "10^3" in u or "10*3" in u or "x10" in u or "thou" in u or "k/" in u:
        return value * 1000
    # no usable unit: platelets under 20 are lakhs (1.5 to 4.5), white cells under 100 are thousands
    if std_name == "Platelet Count" and value < 20:
        return value * 100000
    if value < (2000 if std_name == "Platelet Count" else 100):
        return value * 1000
    return value


def flag_test(t):
    """Fill flag, ref_low/ref_high/ref_source, loinc and a canonical name in place."""
    row = lookup(t.get("name"))
    if row:
        t["loinc"] = row[6]
        t["standard_name"] = row[0]
    value = to_number(t.get("value"))
    lo, hi = to_number(t.get("ref_low")), to_number(t.get("ref_high"))
    if value is None:
        t["flag"] = "unknown"
        return t
    sign = str(t.get("value")).strip()[:1] if isinstance(t.get("value"), str) else ""
    if sign in "<>" and sign:
        # "below 5" is normal when 5 is within the upper limit, "above 40" is high when 40 is at or over it;
        # anything else cannot be decided from an inequality
        t["ref_source"] = "report" if (lo is not None or hi is not None) else None
        if sign == "<" and hi is not None and value <= hi and (lo is None or lo <= 0):
            t["flag"] = "normal"
        elif sign == ">" and hi is not None and value >= hi:
            t["flag"] = "high"
        elif sign == "<" and lo is not None and lo > 0 and value <= lo:
            t["flag"] = "low"
        else:
            t["flag"] = "unknown"
        t.pop("implausible", None)
        return t

    has_report_range = lo is not None or hi is not None
    if has_report_range:
        t["ref_source"] = "report"
        cmp_value = value
    elif row:
        lo, hi = row[2], row[3]
        cmp_value = _scaled(row[0], value, t.get("unit"))
        t["ref_low"], t["ref_high"], t["ref_source"] = lo, hi, "standard"
        if not t.get("ref_text"):
            t["ref_text"] = f"{_fmt(lo)} - {_fmt(hi)} {row[1]}"
    else:
        t["flag"], t["ref_source"] = "unknown", None
        return t

    flag = "normal"
    if lo is not None and cmp_value < lo:
        flag = "low"
    elif hi is not None and cmp_value > hi:
        flag = "high"
    if row:
        crit_value = _scaled(row[0], value, t.get("unit"))
        if row[4] is not None and crit_value < row[4]:
            flag = "critical"
        elif row[5] is not None and crit_value > row[5]:
            flag = "critical"
    t["flag"] = flag
    limits = PLAUSIBLE.get(row[0]) if row else None
    if limits and not (limits[0] <= value <= limits[1]):
        t["implausible"] = True
        t["flag"] = "unknown"
    else:
        t.pop("implausible", None)
    return t


def _fmt(n):
    if n is None:
        return ""
    return str(int(n)) if float(n).is_integer() else str(n)
