"""Draws the synthetic sample documents in public/samples (one fictional patient).

Run: python tools/make_samples.py
"""
import os

from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "samples")
W = 1100
FONTS = "C:/Windows/Fonts/"


def font(size, bold=False):
    try:
        return ImageFont.truetype(FONTS + ("arialbd.ttf" if bold else "arial.ttf"), size)
    except OSError:
        return ImageFont.load_default()


def page(name, header, sub, meta, body, footer):
    """body: list of ("h", text) | ("p", text) | ("row", [cells]) | ("gap",)"""
    img = Image.new("RGB", (W, 1500), "white")
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, W, 110], fill="#0F4C5C")
    d.text((50, 26), header, font=font(34, True), fill="white")
    d.text((50, 70), sub, font=font(18), fill="#D6E6EA")
    y = 135
    for i, (k, v) in enumerate(meta):
        x = 50 + (i % 2) * 520
        d.text((x, y), f"{k}: ", font=font(19, True), fill="#111")
        d.text((x + d.textlength(f"{k}: ", font=font(19, True)), y), v, font=font(19), fill="#111")
        if i % 2:
            y += 32
    y += 40 if len(meta) % 2 else 10
    d.line([50, y, W - 50, y], fill="#888", width=2)
    y += 18
    cols = [50, 470, 640, 800]
    for item in body:
        kind = item[0]
        if kind == "h":
            y += 8
            d.text((50, y), item[1], font=font(22, True), fill="#0F4C5C")
            y += 36
        elif kind == "p":
            d.text((50, y), item[1], font=font(19), fill="#111")
            y += 30
        elif kind == "row":
            bold = len(item) > 2
            for x, cell in zip(cols, item[1]):
                d.text((x, y), cell, font=font(19, bold), fill="#111")
            y += 32
            if bold:
                d.line([50, y - 4, W - 50, y - 4], fill="#bbb", width=1)
        else:
            y += 16
    y += 30
    d.line([50, y, W - 50, y], fill="#888", width=1)
    d.text((50, y + 12), footer, font=font(16), fill="#555")
    img.crop((0, 0, W, y + 60)).save(os.path.join(OUT, name), optimize=True)


def lab(name, date, rows, lab_no):
    body = [("row", ["Test", "Result", "Unit", "Reference Range"], "head")]
    for section, tests in rows:
        body.append(("h", section))
        body += [("row", list(t)) for t in tests]
    page(name, "CityCare Diagnostics", "NABL Accredited Laboratory  |  Phase 7, Mohali, Punjab",
         [("Patient Name", "Mr. Jay Tawri"), ("Age / Sex", "46 Years / Male"),
          ("Referred By", "Dr. Anita Mehta"), ("Lab No", lab_no),
          ("Collected On", date), ("Reported On", date)],
         body, "Sample document for demonstration. Not a real patient. Results relate only to the sample tested.")


lab("lab-2026-03.png", "12/03/2026", [
    ("DIABETES PROFILE", [("HbA1c (Glycated Hemoglobin)", "8.4", "%", "4.0 - 5.6"),
                          ("Fasting Blood Sugar", "168", "mg/dL", "70 - 100")]),
    ("LIPID PROFILE", [("Total Cholesterol", "236", "mg/dL", "< 200"),
                       ("LDL Cholesterol", "152", "mg/dL", "< 100"),
                       ("HDL Cholesterol", "38", "mg/dL", "> 40"),
                       ("Triglycerides", "214", "mg/dL", "< 150")]),
    ("GENERAL", [("Hemoglobin", "13.8", "g/dL", "13.0 - 17.0"),
                 ("Serum Creatinine", "0.9", "mg/dL", "0.6 - 1.3"),
                 ("TSH", "2.1", "uIU/mL", "0.4 - 4.5"),
                 ("Vitamin D (25-OH)", "14", "ng/mL", "30 - 100")]),
], "CC/26/03/4471")

lab("lab-2026-06.png", "18/06/2026", [
    ("DIABETES PROFILE", [("HbA1c (Glycated Hemoglobin)", "7.6", "%", "4.0 - 5.6"),
                          ("Fasting Blood Sugar", "142", "mg/dL", "70 - 100")]),
    ("LIPID PROFILE", [("Total Cholesterol", "198", "mg/dL", "< 200"),
                       ("LDL Cholesterol", "118", "mg/dL", "< 100"),
                       ("HDL Cholesterol", "41", "mg/dL", "> 40"),
                       ("Triglycerides", "176", "mg/dL", "< 150")]),
    ("GENERAL", [("Serum Creatinine", "0.9", "mg/dL", "0.6 - 1.3"),
                 ("Vitamin D (25-OH)", "26", "ng/mL", "30 - 100")]),
], "CC/26/06/9120")

lab("lab-2026-09.png", "22/09/2026", [
    ("DIABETES PROFILE", [("HbA1c (Glycated Hemoglobin)", "6.9", "%", "4.0 - 5.6"),
                          ("Fasting Blood Sugar", "118", "mg/dL", "70 - 100")]),
    ("LIPID PROFILE", [("Total Cholesterol", "172", "mg/dL", "< 200"),
                       ("LDL Cholesterol", "96", "mg/dL", "< 100"),
                       ("HDL Cholesterol", "44", "mg/dL", "> 40"),
                       ("Triglycerides", "148", "mg/dL", "< 150")]),
    ("GENERAL", [("Hemoglobin", "14.1", "g/dL", "13.0 - 17.0"),
                 ("Platelet Count", "2.4", "lakh/cumm", "1.5 - 4.1"),
                 ("Serum Creatinine", "1.0", "mg/dL", "0.6 - 1.3"),
                 ("Vitamin D (25-OH)", "34", "ng/mL", "30 - 100")]),
], "CC/26/09/2208")

page("prescription-2026-03.png", "Dr. Anita Mehta, MD (Medicine)",
     "Mehta Diabetes & Heart Clinic  |  Sector 70, Mohali  |  Reg. No. PMC 41872",
     [("Patient", "Jay Tawri"), ("Age / Sex", "46 / M"), ("Date", "14/03/2026"), ("Weight", "84 kg")],
     [("h", "Diagnosis"), ("p", "Type 2 Diabetes Mellitus (newly detected)"), ("p", "Dyslipidemia"),
      ("p", "Vitamin D deficiency"), ("gap",), ("h", "Rx"),
      ("p", "1.  Tab. Glycomet 500 mg (Metformin)        1-0-1     after food     x 3 months"),
      ("p", "2.  Tab. Atorva 10 mg (Atorvastatin)           0-0-1     at bedtime     x 3 months"),
      ("p", "3.  Cap. Uprise-D3 60K (Cholecalciferol 60,000 IU)     once a week     x 8 weeks"),
      ("gap",), ("h", "Advice"),
      ("p", "- Brisk walk 30 minutes daily. Avoid sugar, sweets and fried food."),
      ("p", "- Check fasting sugar at home twice a week."),
      ("p", "- Repeat HbA1c and lipid profile after 3 months."),
      ("gap",), ("p", "Follow up: after 3 months with reports.")],
     "Sample document for demonstration. Not a real patient.")

page("discharge-2026-08.png", "Fortune Multispeciality Hospital",
     "Discharge Summary  |  Department of Internal Medicine  |  Mohali, Punjab",
     [("Patient Name", "Mr. Jay Tawri"), ("Age / Sex", "46 Y / Male"),
      ("Date of Admission", "04/08/2026"), ("Date of Discharge", "08/08/2026"),
      ("Consultant", "Dr. Vikram Sood"), ("IP No", "FMH/IP/26/11834")],
     [("h", "Final Diagnosis"), ("p", "Dengue fever (NS1 antigen positive) with thrombocytopenia"),
      ("p", "Type 2 Diabetes Mellitus (known case)"),
      ("h", "Course in Hospital"),
      ("p", "Admitted with high fever, body ache and vomiting for 3 days. Managed with IV fluids"),
      ("p", "and monitoring. Platelet count fell to 68,000 on day 2 and recovered without transfusion."),
      ("p", "No bleeding. Afebrile for 48 hours at discharge."),
      ("h", "Investigations"),
      ("row", ["Test", "Result", "Unit", "Reference Range"], "head"),
      ("row", ["Platelet Count (05/08, lowest)", "68000", "/cumm", "150000 - 410000"]),
      ("row", ["Platelet Count (at discharge)", "142000", "/cumm", "150000 - 410000"]),
      ("row", ["Hemoglobin", "14.6", "g/dL", "13.0 - 17.0"]),
      ("row", ["Total WBC Count", "3400", "/cumm", "4000 - 11000"]),
      ("row", ["SGPT (ALT)", "88", "U/L", "< 45"]),
      ("row", ["Dengue NS1 Antigen", "Positive", "", "Negative"]),
      ("h", "Medicines on Discharge"),
      ("p", "1.  Tab. Dolo 650 mg (Paracetamol)     SOS for fever, maximum 3 tablets a day     x 5 days"),
      ("p", "2.  Tab. Pan 40 mg (Pantoprazole)     1-0-0  before breakfast     x 5 days"),
      ("p", "3.  Continue Tab. Glycomet 500 mg  1-0-1  after food"),
      ("h", "Advice"),
      ("p", "- Drink plenty of fluids (3 litres a day). Rest for one week."),
      ("p", "- Do NOT take ibuprofen, aspirin or other painkillers."),
      ("p", "- Come to emergency at once if bleeding, black stools, severe abdominal pain or drowsiness."),
      ("gap",), ("p", "Follow up: OPD after 3 days with repeat platelet count.")],
     "Sample document for demonstration. Not a real patient.")

print("wrote", sorted(os.listdir(OUT)))
