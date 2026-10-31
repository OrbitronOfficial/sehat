# Submission text

Copy these into the byteXL submission form. Live site: https://sehat-copilot.vercel.app · Repository: https://github.com/OrbitronOfficial/sehat-copilot

## Project title

Sehat Copilot: an AI personal health copilot that reads, explains and organises your medical records

## Project summary

Sehat Copilot turns scattered prescriptions, lab reports and discharge summaries into one health profile a patient can understand and check. Upload a photo or PDF: it extracts medicines, doses, test values, diagnoses and dates, shows each one beside the line it was read from, checks every value against reference ranges in code, explains the result in plain language in the patient's own language, and files it into a timeline with trends. Home readings such as blood pressure and sugar sit next to the reports. Everything exports as an ABDM-style FHIR R4 bundle. Software, not the AI model, decides what is high or low, and nothing is saved until the user has checked it against the original.

## Solution description

PROBLEM
Health information is fragmented across prescriptions, lab reports, discharge summaries and diagnostic records, and it is written for doctors. The patient is the only person who holds all of it, and the least equipped to read it.

WHAT IT DOES
1. Medical record intelligence and OCR. A photo, PDF or text file is read by a vision model into a fixed schema: medicines, strengths, doses, frequency, test values with units and reference ranges, diagnoses and dates. Prescription shorthand (1-0-1, BD, SOS) is expanded into plain words. Every item carries the exact line it was read from and a reading confidence. Handwritten documents are recognised and every item on them is marked for checking.
2. Health summary in simple language. Each record gets a short summary, a plain explanation of every abnormal value, the purpose of each medicine and questions to ask the doctor, with a Listen button that reads it aloud.
3. Unified health profile. A dashboard, a timeline of all records, conditions merged across documents with their dated mentions, medicines recorded with their prescription dates, the latest value of every test, and trend charts in date order. A chat answers questions from the saved records and from a document dropped straight into it; plain lookups ("what is my latest HbA1c") are answered by code with the source record linked.
4. Wellness data. A log for home readings (blood pressure, sugar, weight, pulse) with trends, shown next to the lab results and included in the export.

HOW IT IS BUILT
A pipeline with the model at the edges and code in the middle: Read (vision model) -> Check (code) -> Review (user) -> Explain (model) -> Profile (code).
- Code decides, the model writes. Whether a value is low, high or critical is computed from the range printed on the report, or a standard table when none is printed. The model only words the explanation and cannot change a flag.
- Guards on the model. A sentence containing a number that is not in the checked record is replaced by a plain factual one. A value no living adult has (HbA1c of 76 %) is treated as a misread, not shown as critical. A date more than two years old is questioned. Lines that cannot be read reliably are listed as "not used", never guessed.
- Human in the loop. The user reviews the extraction beside the original document, which stays pinned and can be enlarged, and can correct any field before saving. Each low-confidence item stays marked until the user confirms it is right or corrects it, and a document for a different patient is not saved into the profile without asking.
- The profile is built in code. A prescription is treated as evidence that a medicine was prescribed, not that it is still taken, so nothing is labelled "current": a medicine enters the schedule and reminders only after the user confirms they take it. Test names and units are normalised so trends are like for like. Only the latest result of a test can need attention. Questions for the doctor are generated from the record history and cite values, dates and source records.
- Safety gate. Emergency wording and questions about stopping or changing a medicine get fixed safe replies without calling a model. Chat answers are labelled "From your records", "General information" or "Ask your doctor".
- Local-first. Records stay in the browser on the user's device; the server is stateless and stores nothing.

BONUS FEATURES
- Multi-language: interface, summaries and chat in 43 languages. Ten ship ready (English, Hindi, Bengali, Telugu, Marathi, Tamil, Gujarati, Kannada, Malayalam, Punjabi); the rest are translated on demand. Hindi and mixed-language documents are read, and handwritten prescriptions are read with every item marked for checking.
- ABDM/ABHA readiness: each document maps to a FHIR R4 Composition (PrescriptionRecord, DiagnosticReportRecord, DischargeSummaryRecord) referencing Observations with LOINC codes, MedicationRequests and Conditions; home readings export as vital-sign Observations. One-click bundle export, and a mock ABHA link that follows the ABDM steps on screen: number, OTP, consent by record type and date range, choose records, import. Every step is labelled mock.

ALSO INCLUDED
A medicine schedule from the prescriptions with optional reminders, a check for the same ingredient under two brand names and known interaction pairs, a printable one-page summary for the doctor, backup and restore, dark and light themes, and Saathi, a guide on every screen.

EVIDENCE
- 281 automated tests, run on every push with lint and a security scan, cover the range logic, the pipeline, the FHIR export, the HTTP server, the safety gate and the profile.
- Extraction scored 140 of 140 fields on the five bundled sample documents (`tools/benchmark.py`). These are clean, printed, synthetic documents; this is not a measure of accuracy on photographed paper or handwriting.

TECH STACK
Python standard-library server on Vercel, vanilla JavaScript frontend, IndexedDB storage, Gemini for document reading, Groq for writing with NVIDIA and OpenRouter as fallbacks, Tesseract.js as a backup reader, Three.js for one decorative element.

WHAT IS REAL AND WHAT IS MOCKED
Real: document reading, range checking, explanations, timeline, profile, trends, chat, wellness log, FHIR export. Mocked: the ABHA link, OTP, consent and import (the flow validates the number format and returns sample records; no SMS is sent and the ABDM sandbox is not called). Sample documents are synthetic. Interface text in languages other than English and Hindi is machine-translated. Accounts are stored on the device only. The medicine reference list and the Hindi safety text have not been reviewed by a clinician. It explains records; it is not a diagnosis and does not replace a doctor.

HOW TO TRY IT
Open the live site and choose "Try the demo" to load a sample patient. You land on the dashboard; open Timeline and any record to see its original, its source lines and its explanation. To see extraction, go to Add record and click a sample or upload your own document.

## Test access and evaluation notes

No login is needed: "Try the demo" on the home page, or "Continue with demo account" on the sign-in page, opens a sample patient in one click. Uploading works for guests. Asking questions in the chat needs the demo account (one click). Document reading uses a free AI tier with a daily limit; if it is exhausted, the bundled samples fall back to a saved reading, which the screen says, and uploads fall back to an on-device reader marked as lower confidence.
