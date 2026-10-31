# Round 2 submission text

Copy these into the byteXL submission form. Live site: https://sehat-copilot.vercel.app · Repository: https://github.com/OrbitronOfficial/sehat-copilot

## Project title

Sehat Copilot: an AI health copilot that explains your records, keeps you on track between visits, and connects you to your doctor

## Project description

PROBLEM
Health information is scattered across prescriptions, lab reports and discharge summaries, and it is written for doctors. Even once a patient understands a report, the hard part comes after the visit: taking medicines on time, noticing a worsening trend, remembering the follow-up, and looking after parents and children too. The doctor, meanwhile, never sees what happens between visits.

WHAT SEHAT COPILOT DOES
One app for the patient's whole care loop, plus a workspace for their doctor and the doctor's staff.

1. UNDERSTAND (Round 1, improved)
- Reads photos, PDFs, Word files and text, including handwritten and bilingual prescriptions. It extracts medicines, doses, test values with ranges, diagnoses and dates, and shows each one beside the line it was read from. Non-medical files are refused.
- Explains every record in plain language in 10 Indian languages (43 on demand), with what each abnormal value means and questions to ask the doctor.
- Files everything into one profile and timeline per family member. If a report is for someone else, it asks who that person is (family member, friend or someone you care for).

2. STAY ON TRACK (Round 2 engagement layer)
- Grounded chat. Ask about your own reports. Every answer is labelled "From your records", "General information" or "Ask your doctor".
- Medicine and appointment reminders built automatically from saved prescriptions: Taken, snooze (15 min, 1 h, pick a time), edit, skip. They stop at the end of the course. Follow-ups become visits (done, missed, upcoming). Export to Google Calendar or .ics.
- Personalised wellness, with reasons. Habits and suggestions come from the user's own logged data. Low or high readings get safe first-aid guidance that always says to consult a doctor, shows 112, and never names a medicine.
- Trends and risk flags. Weekly, 30-day, 90-day and 1-year charts for readings and the health journal (sleep, mood, energy, pain), plus a pre-visit summary to show the doctor.
- Agentic AI the user can check. Every action the AI takes (records read, reminders created) is shown with its source and can be edited or rejected before it takes effect.
- Voice. Speak a question or a journal entry; hear answers read aloud.
- Family profiles. Separate records and reminders per member, a parental PIN for a child's profile, and caregiver alerts when a member misses a dose.
- End-to-end encrypted sync across devices. The key is made on the device from the password (PBKDF2, 210,000 rounds, AES-GCM 256-bit), so the server only ever stores ciphertext.

3. CONNECT TO THE DOCTOR (beyond the brief)
- Doctor workspace. A greeting and a live summary of the day, with today's patients sorted Major / Moderate / Minor from the complaint. The reason is shown and the doctor can override it.
- Consultation to prescription. Record, drop an audio file or type notes, in Hindi, English, Hinglish, Tamil, Bengali, Marathi and more. The AI drafts the prescription. Misheard medicine names are corrected against the reference list, and ambiguous ones are flagged instead of guessed. Anything the doctor did not say is left blank for the doctor to fill in. Non-medical conversations are refused.
- Approve and send. The doctor checks every line and approves. The prescription arrives in the right family member's app and becomes reminders automatically.
- Prescriptions with their recording and transcript, per-patient history, and a to-do list.
- Staff access. A PA, nurse or receptionist joins with a single-use code and can only see and update the to-do list. Everything they add or complete waits in the doctor's daily review.

HOW IT IS BUILT
Pipeline: Read (vision model) -> Check (code) -> Review (user) -> Explain (model) -> Profile (code).
- Code decides, the model writes. High, low and critical flags are computed from the report's own ranges. The model only words the explanation and cannot change a flag.
- Guards. A sentence containing a number that is not in the record is replaced by a factual one. Impossible values are treated as misreads. Handwriting is capped below "please verify". Unreadable lines are never guessed.
- Safety gate before the model. Emergency wording and "can I stop my medicine?" questions get fixed safe replies, in English, Hindi and Hinglish, without calling a model.
- Human in the loop. Nothing is saved before the user checks it against the original, and nothing a doctor drafts reaches a patient before the doctor approves it.
- Least access. Staff tokens can only reach the to-do list. Codes are single-use, and codes and tokens are stored only as hashes.
- Local-first. Records stay on the device. Sync, the doctor-to-patient inbox and staff lists use private Vercel Blob storage.

STANDARDS
ABDM-ready FHIR R4 export: Composition, DiagnosticReport, Observation with LOINC codes, MedicationRequest, Condition and vital signs. A mock ABHA link follows the ABDM steps (number, OTP, consent, choose records, import).

EVIDENCE
- 347 automated tests (341 run, 6 skipped for the in-progress clinic prototype). CI runs lint, a security scan and the tests on every push, and is green.
- Extraction: 140 of 140 fields correct on five synthetic sample documents. These are clean printed samples, not photographed or handwritten paper.
- Consultation audio: 8 synthetic recordings in 6 languages. All 6 consultations produced a draft, and both non-medical conversations were refused. 2 of 13 medicine names were misheard: one is now corrected automatically, the other is flagged for the doctor.

TECH STACK
Python standard-library server on Vercel (no backend dependencies), vanilla JavaScript with no build step, IndexedDB, a service worker, Web Crypto, Three.js, Gemini (document reading), Groq (writing, chat, speech to text) with NVIDIA and OpenRouter as fallbacks, Tesseract.js as a backup reader, and Vercel Blob.

WHAT IS REAL AND WHAT IS MOCKED
- Real: everything above.
- Mocked: the ABHA link, OTP, consent and import.
- All sample documents, patients, doctors and staff are fictional.
- Patient and doctor accounts are stored in the browser; staff access is server-side.
- Translations other than English and Hindi are machine-made.
- The urgency rules, medicine cross-checks and first-aid guidance are not clinician-reviewed.

Sehat Copilot explains records. It is not a diagnosis and does not replace a doctor.

## Test access and evaluation notes

No sign-up is needed. Open https://sehat-copilot.vercel.app/login and pick a role. Each has a one-click demo below the sign-in form, and every demo uses fictional people.

1. PATIENT: "Continue with demo account". This opens the Mehra family (Rahul, Sunita, Aanya) with a year of records, readings, journal entries and medicines. Switch members from the family chip at the top. Try My health (trend charts), Medicines (Taken / snooze / skip), Journal, Wellness, Family, Ask, and ABHA & export. To see extraction, go to Add record and upload a sample or your own document. You review it beside the original before saving.

2. DOCTOR: choose Doctor, then "Continue with doctor demo". This opens Dr. R. K. Bansal's clinic.
- Today: the urgency-sorted queue. Add a patient with a complaint such as "chest pain since morning" to see it sorted to the top.
- Consultation: type notes such as "Metformin 500 mg twice a day after food for 30 days, review in one month", or drop an audio file, then click "Write prescription from this".
- Edit the draft and click "Approve and send to patient". If you send it to "Sunita Mehra", it appears in her profile in the patient demo in the same browser.

3. NURSE / STAFF: choose Nurse / staff, then "Continue with nurse demo". This joins the same clinic's to-do list. Tick a task and it moves into History by date, and it appears in the doctor's daily review (Doctor demo, then To-do). A doctor can also create a real one-time code under To-do, then Staff access.

Notes for evaluators:
- Document reading uses free AI tiers with daily limits. If they are exhausted, bundled samples fall back to a saved reading (the screen says so) and uploads fall back to an on-device reader marked as lower confidence.
- Demo data is stored in your browser, so a different browser starts fresh.
- Microphone recording needs permission. Typed notes or an uploaded audio file work without it.
- Demo video: about 2 minutes 20 seconds, covering the patient, doctor and nurse flows and the connected doctor-to-patient hand-off.
