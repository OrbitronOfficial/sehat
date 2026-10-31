"""Records -> FHIR R4 Bundle shaped after the ABDM (NRCeS) health-record profiles.

Each uploaded document becomes one Composition (PrescriptionRecord,
DiagnosticReportRecord or DischargeSummaryRecord) that references the
Observations, MedicationRequests and Conditions extracted from it.
"""
import datetime as dt
import re
import uuid

NRCES = "https://nrces.in/ndhm/fhir/r4/StructureDefinition/"
ABHA_SYSTEM = "https://healthid.abdm.gov.in"
LOINC = "http://loinc.org"
SNOMED = "http://snomed.info/sct"
INTERP = "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation"

# doc_type -> (ABDM profile, SNOMED code, display)
RECORD_TYPES = {
    "prescription": ("PrescriptionRecord", "440545006", "Prescription record"),
    "lab_report": ("DiagnosticReportRecord", "721981007", "Diagnostic studies report"),
    "diagnostic_report": ("DiagnosticReportRecord", "721981007", "Diagnostic studies report"),
    "discharge_summary": ("DischargeSummaryRecord", "373942005", "Discharge summary"),
    "other": ("HealthDocumentRecord", "419891008", "Record artifact"),
}
_INTERP = {"low": ("L", "Low"), "high": ("H", "High"), "normal": ("N", "Normal"),
           "critical": ("AA", "Critical abnormal")}


def _id():
    return str(uuid.uuid4())


def _ref(res):
    return {"reference": f"urn:uuid:{res['id']}"}


def _when(date):
    return f"{date}T00:00:00+05:30" if date else None


def _strip(d):
    """Drop None/empty values so the bundle stays valid FHIR."""
    if isinstance(d, dict):
        out = {k: _strip(v) for k, v in d.items()}
        return {k: v for k, v in out.items() if v not in (None, "", [], {})}
    if isinstance(d, list):
        return [x for x in (_strip(x) for x in d) if x not in (None, "", [], {})]
    return d


def _patient(p):
    p = p or {}
    res = {"resourceType": "Patient", "id": _id(), "meta": {"profile": [NRCES + "Patient"]},
           "name": [{"text": p.get("name") or "Unknown"}]}
    sex = (p.get("sex") or "").strip().upper()[:1]
    if sex in ("M", "F"):
        res["gender"] = "male" if sex == "M" else "female"
    abha = p.get("abha")
    number = abha.get("abha_number") if isinstance(abha, dict) else abha
    if number:
        res["identifier"] = [{"type": {"text": "ABHA Number"}, "system": ABHA_SYSTEM,
                              "value": re.sub(r"\D", "", str(number))}]
    return res


def _observation(t, patient, date):
    code = {"text": t.get("name")}
    if t.get("loinc"):
        code["coding"] = [{"system": LOINC, "code": t["loinc"], "display": t.get("standard_name") or t.get("name")}]
    obs = {"resourceType": "Observation", "id": _id(), "meta": {"profile": [NRCES + "Observation"]},
           "status": "final", "code": code, "subject": _ref(patient), "effectiveDateTime": _when(date)}
    value = t.get("value")
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        obs["valueQuantity"] = {"value": value, "unit": t.get("unit")}
    elif value is not None:
        obs["valueString"] = str(value)
    if t.get("ref_low") is not None or t.get("ref_high") is not None or t.get("ref_text"):
        rng = {"text": t.get("ref_text")}
        if t.get("ref_low") is not None:
            rng["low"] = {"value": t["ref_low"], "unit": t.get("unit")}
        if t.get("ref_high") is not None:
            rng["high"] = {"value": t["ref_high"], "unit": t.get("unit")}
        obs["referenceRange"] = [rng]
    if t.get("flag") in _INTERP:
        c, display = _INTERP[t["flag"]]
        obs["interpretation"] = [{"coding": [{"system": INTERP, "code": c, "display": display}]}]
    return obs


def _medication_request(m, patient, date, doctor):
    dosage = ", ".join(x for x in (m.get("dose"), m.get("frequency"), m.get("timing"),
                                   m.get("duration") and f"for {m['duration']}", m.get("instructions")) if x)
    name = " ".join(x for x in (m.get("name"), m.get("strength")) if x)
    return {"resourceType": "MedicationRequest", "id": _id(),
            "meta": {"profile": [NRCES + "MedicationRequest"]},
            "status": "active", "intent": "order",
            "medicationCodeableConcept": {"text": name + (f" ({m['generic']})" if m.get("generic") else "")},
            "subject": _ref(patient), "authoredOn": date,
            "requester": {"display": doctor} if doctor else None,
            "dosageInstruction": [{"text": dosage}] if dosage else None}


def _condition(d, patient, date):
    return {"resourceType": "Condition", "id": _id(), "meta": {"profile": [NRCES + "Condition"]},
            "clinicalStatus": {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/condition-clinical",
                                           "code": "active"}]},
            "code": {"text": d.get("name")}, "subject": _ref(patient), "recordedDate": date}


VITAL_CATEGORY = {"coding": [{"system": "http://terminology.hl7.org/CodeSystem/observation-category",
                              "code": "vital-signs", "display": "Vital Signs"}]}


def _vital_observation(v, meta, patient):
    name, unit, loinc, _ = meta
    obs = {"resourceType": "Observation", "id": _id(), "meta": {"profile": [NRCES + "ObservationVitalSigns"]},
           "status": "final", "category": [VITAL_CATEGORY],
           "code": {"coding": [{"system": LOINC, "code": loinc, "display": name}], "text": name},
           "subject": _ref(patient), "effectiveDateTime": _when(v["date"]),
           "performer": [{"display": "Self-reported by the patient"}],
           "note": [{"text": v["note"]}] if v.get("note") else None}
    if v["type"] == "bp":
        obs["component"] = [
            {"code": {"coding": [{"system": LOINC, "code": "8480-6", "display": "Systolic blood pressure"}]},
             "valueQuantity": {"value": v["value"], "unit": "mmHg"}},
            {"code": {"coding": [{"system": LOINC, "code": "8462-4", "display": "Diastolic blood pressure"}]},
             "valueQuantity": {"value": v["value2"], "unit": "mmHg"}}]
    else:
        obs["valueQuantity"] = {"value": v["value"], "unit": unit}
    return obs


def bundle(patient, records, vitals=None):
    pat = _patient(patient)
    resources = [pat]
    for rec in sorted((r for r in records or [] if isinstance(r, dict)), key=lambda r: r.get("date") or ""):
        profile, code, display = RECORD_TYPES.get(rec.get("doc_type"), RECORD_TYPES["other"])
        date = rec.get("date")
        sections = []

        obs = [_observation(t, pat, date) for t in rec.get("tests") or []]
        if obs:
            report = {"resourceType": "DiagnosticReport", "id": _id(),
                      "meta": {"profile": [NRCES + "DiagnosticReportLab"]}, "status": "final",
                      "code": {"text": rec.get("title")}, "subject": _ref(pat),
                      "effectiveDateTime": _when(date),
                      "performer": [{"display": rec["facility"]}] if rec.get("facility") else None,
                      "result": [_ref(o) for o in obs]}
            resources += obs + [report]
            sections.append({"title": "Investigations", "entry": [_ref(report)]})

        meds = [_medication_request(m, pat, date, rec.get("doctor")) for m in rec.get("medicines") or []]
        if meds:
            resources += meds
            sections.append({"title": "Medications", "entry": [_ref(m) for m in meds]})

        conds = [_condition(d, pat, date) for d in rec.get("diagnoses") or []]
        if conds:
            resources += conds
            sections.append({"title": "Diagnoses", "entry": [_ref(c) for c in conds]})

        resources.append({
            "resourceType": "Composition", "id": _id(), "meta": {"profile": [NRCES + profile]},
            "status": "final",
            "type": {"coding": [{"system": SNOMED, "code": code, "display": display}], "text": display},
            "subject": _ref(pat), "date": _when(date) or _when(dt.date.today().isoformat()),
            "author": [{"display": rec.get("doctor") or rec.get("facility") or "Unknown"}],
            "title": rec.get("title"),
            "identifier": {"system": "urn:sehat-copilot:record", "value": rec.get("id")},
            "section": sections})

    if vitals:
        import insights  # local import: insights imports pipeline, which this module does not need otherwise
        for v in insights.clean_vitals(vitals):
            resources.append(_vital_observation(v, insights.VITALS[v["type"]], pat))

    return _strip({
        "resourceType": "Bundle", "id": _id(), "type": "collection",
        "meta": {"profile": [NRCES + "DocumentBundle"]},
        "timestamp": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "entry": [{"fullUrl": f"urn:uuid:{r['id']}", "resource": r} for r in resources]})
