# Sehat v3 — local clinic prototype

Open http://localhost:9000/ . Original v1 (8840) and v2 (8890) were not edited. Nothing pushed.

## Try it

1. Doctor workspace → Enter doctor demo → Load fictional demo patients.
2. Open a patient, type consultation notes or record with explicit patient consent.
3. Create the draft, check the source and edit every instruction as necessary.
4. An explicit follow-up interval suggests a date. Choose the appointment time.
5. Check the review box and approve. The prescription becomes immutable and an appointment is saved for both doctor and patient.
6. Patient portal → Explore patient demo for a no-signup walkthrough. For a newly registered patient, enroll with the private code provided by the doctor and email OR phone, then sign in with that identifier and a password.
7. Patient updates and questions appear in the doctor's selected-patient history.

The demo access is intentionally restricted to loopback. It is not clinician verification. All demo profiles are fictional. Demo queue priorities start unassigned; only the doctor changes them.

## Implemented

- Per-patient recording consent, original audio, transcript, typed notes and draft editing.
- Audio is saved before transcription. Typed notes remain available if the AI service fails.
- Server-side patient ownership, salted PBKDF2 passwords, single-use enrollment, expiring HttpOnly sessions and a login attempt limit.
- Atomic approval, immutable issued prescriptions and persistent SQLite records outside the public folder.
- Doctor-assigned queue priority, explicit completion, shared appointments and account-filtered calendar exports.
- Patient approved records, printing, pre-visit questions and acknowledgment.
- New landing page, patient portal and doctor workspace; existing health tools preserved at /app with a light visual pass.

## Verified

- Existing and v3 Python regression suite, JavaScript syntax checks.
- Browser: register fictional patient; real AI drafting from typed synthetic notes; no invented medicines for a no-medication consultation; 3-month interval → 24 January 2027; approval; patient login and own approved record; matching appointment; patient update submitted.
- Tests cover patient isolation, auth, concurrent invite use, atomic approval, audio validation and calendar scope.

## Limits / not verified

- Microphone capture is implemented, but a real spoken consultation and speaker attribution have not been end-to-end tested. AI output still needs doctor review.
- Local doctor demo is not production authentication. SQLite includes unencrypted clinical text/audio; do not deploy publicly or enter real patient data before adding verified clinician access, encryption, audit/retention controls and a privacy review.
- Email/phone are login identifiers. There is no SMS/email OTP, outbound notification service or password recovery flow.
- Follow-ups automatically appear in both in-app calendars. Google links and ICS are exports, not live synchronization; external edits/stops do not propagate.
- The existing /app local health workspace is separate from clinic authentication/data. Full migration/merging is not implemented.
- Mobile-responsive CSS is present; real phone mic/calendar delivery and full mobile journey remain unverified.
- Original recording limit is 8 MB (low bitrate recording); very long transcripts need splitting. Browser/API failures show errors rather than pretending completion.

## Best next additions

Verified clinic accounts and account recovery; Google Calendar OAuth sync; reliable consented reminders; audit trail and signed prescription versions; explicit patient consent for importing the old health workspace; reviewable speaker attribution.
