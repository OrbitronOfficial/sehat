# Two-minute demo script

For a screen recording or a live walkthrough. One synthetic patient, Jay Tawri, with records from March to September 2026. Timings are a guide.

| Time | Do | Say |
|---|---|---|
| 0:00 | Open https://sehat-copilot.vercel.app | "A patient's records are scattered across prescriptions, lab reports and discharge summaries. Sehat Copilot reads them, explains them, and keeps them in one place." |
| 0:10 | Click "Try the demo" | "This is a sample patient. The dashboard shows what needs attention now, what changed, and what to ask the doctor." |
| 0:25 | Go to Add record, click the sample "Lab report, June 2026" | "Upload a photo or PDF. A vision model reads it into a fixed structure." |
| 0:40 | On the review screen, click the HbA1c value | "Every value shows the exact line it was read from, next to the original. Code, not the AI, decides that this is high, using the range printed on the report. The user can correct anything before it is saved." |
| 0:55 | Save. Switch the language to Hindi | "The explanation is written in plain language, here in Hindi. The numbers, units and medicine names stay as they are." |
| 1:05 | Press Listen | "It can be read aloud for people who do not read easily." |
| 1:15 | Open My health | "The profile is built in code. The two mentions of diabetes are one condition. Medicines are listed as recorded, with their dates, never as 'current'. The platelet results from a discharge summary and a later report form one trend in the right order." |
| 1:35 | Scroll to "Questions for your doctor" | "Questions come from the patient's own history: HbA1c went from 8.4 to 6.9 and is still above the range. Each one links to its source record." |
| 1:45 | Open ABHA & export, click Export FHIR bundle | "Everything exports as an ABDM-style FHIR bundle. The ABHA link is a mock, and the app says so." |
| 1:55 | Ask the chat "Can I stop my metformin?" | "Safety comes first: questions about changing a medicine get a fixed reply to ask the prescriber, without calling a model." |

## If something is slow or fails during the demo

- Document reading uses a free AI tier. If it is busy, a bundled sample shows its saved reading and says so. Use a sample, not a fresh upload, when time is tight.
- The first request after a quiet period can take a few seconds while the server wakes.

## What to be ready to answer

- Accuracy: 140 of 140 fields on five synthetic printed samples. Not measured on real photos or handwriting.
- What is mocked: the ABHA link and import.
- Where data lives: in the browser. Documents are sent to third-party AI services only to be read; the server stores nothing.
- What has not been reviewed by a clinician: the medicine reference list, the cross-check rules and the Hindi safety text.
