'use strict';

/* ================= Strings ================= */
const STR = {
  en: {
    app_name: 'Sehat Copilot',
    local_note: 'Stored on this device',
    disclaimer: 'Sehat Copilot explains your records. It is not a diagnosis. Always confirm with your doctor.',
    nav_add: 'Add record', nav_timeline: 'Timeline', nav_health: 'My health', nav_ask: 'Ask', nav_abha: 'ABHA & export', nav_settings: 'Settings',
    st_title: 'Settings', st_sub: 'Appearance, language, reminders, your account and your data.',
    st_look: 'Appearance', st_light: 'Light', st_dark: 'Dark', st_system: 'Match my device',
    st_lang: 'Language', st_lang_note: 'Explanations and chat answers are written in this language.',
    st_notif: 'Reminders and notifications', st_notif_on: 'Notifications are on for this browser.', st_notif_off: 'Notifications are off. Turn them on to get medicine reminders on this device.',
    st_notif_blocked: 'Notifications are blocked in your browser settings. Allow them for this site to get reminders.', st_notif_btn: 'Turn on notifications', st_notif_na: 'This browser cannot show notifications. Use Google Calendar reminders instead.',
    st_cal: 'Medicine reminders in Google Calendar', st_go_meds: 'Open medicine schedule',
    st_account: 'Account', st_signed: 'Signed in as {who}', st_guest: 'You are using Sehat Copilot as a guest. Records stay on this device.', st_signout: 'Sign out', st_signin: 'Sign in or create an account',
    st_sync_on: 'End-to-end encrypted sync is on: your other devices get the same records, and only your password can open them.', st_sync_off: 'Sync is off. Records are stored only in this browser.',
    st_family: 'Family and parental controls', st_family_note: 'Add family members, set a PIN for a child’s profile, and manage caregiver alerts.', st_go_family: 'Manage family',
    st_export: 'Share with a doctor', st_export_note: 'Export records in the ABDM format (FHIR R4), or print a one-page summary for a visit.', st_go_export: 'Open ABHA and export',
    st_about: 'About', st_about_note: 'Sehat Copilot explains your records. It is not a diagnosis and does not replace a doctor. In an emergency, call 112.',
    add_title: 'Add a health record',
    add_sub: 'Upload a prescription, lab report or discharge summary as a photo or PDF.',
    drop_title: 'Drop a file here', drop_hint: 'Photo, PDF or text file. PDF and text up to 3 MB.',
    choose_file: 'Choose file', take_photo: 'Take photo',
    samples_title: 'Try a sample', samples_none: 'No samples available right now.',
    demo_btn: 'Load full demo profile', demo_hint: 'Adds a sample patient with several records and opens the timeline.',
    processing_title: 'Reading your document',
    err_unread: 'This prescription or report is not readable. Please call your doctor or clinic to confirm the medicines and doses, or try a clearer, well-lit photo of the whole page.',
    warn_hdate: 'The date was read as {date}. Handwritten dates are easy to misread; please confirm it.',
    med_conf: 'You confirmed you take this', warn_ocr: 'This document was read with the backup on-device reader, which is less accurate. Please check every value.',
    warn_hand: 'This document is handwritten. Please check every medicine name and dose against the original.',
    warn_unread: '{n} line(s) could not be read reliably and were left out. They are listed under "Lines not used"; add them by hand if they matter.',
    warn_low: '{n} item(s) were read with low confidence and are marked below.',
    warn_nodate: 'No date was found on this document. Please add it so it appears in the right place on your timeline.',
    warn_future: 'The date on this document is in the future. Please check it.',
    warn_old: 'The date was read as {date}, more than two years ago. If this is a recent document, please correct the date.',
    warn_critical: 'One or more values are far outside the usual range. Please contact your doctor promptly.',
    warn_notrecord: 'This does not look like a health record, or it could not be read. Try a sharper photo.',
    warn_saved: 'The live reader is busy, so this sample shows its saved reading.',
    wait_hint: 'This usually takes 10 to 20 seconds. Handwriting can take a little longer.',
    step_read: 'Reading document', step_extract: 'Extracting', step_check: 'Checking values', step_write: 'Writing summary',
    review_title: 'Review and correct',
    review_sub: 'Compare with the original document. Fix anything that looks wrong, then save.',
    edit_title: 'Edit record',
    original: 'Original document', no_preview: 'The original file is not stored for this record.',
    f_type: 'Document type', f_title: 'Title', f_date: 'Date', f_facility: 'Hospital / lab', f_doctor: 'Doctor', f_patient: 'Patient', f_age: 'Age', f_followup: 'Follow-up',
    type_lab_report: 'Lab report', type_prescription: 'Prescription', type_discharge_summary: 'Discharge summary',
    type_diagnostic_report: 'Diagnostic report', type_other: 'Other',
    sec_tests: 'Tests', sec_meds: 'Medicines', sec_dx: 'Diagnoses', sec_advice: 'Advice',
    t_name: 'Test name', t_value: 'Value', t_unit: 'Unit', t_low: 'Range low', t_high: 'Range high', t_flag: 'Flag', t_range: 'Reference range',
    m_name: 'Medicine', m_generic: 'Generic name', m_strength: 'Strength', m_dose: 'Dose', m_freq: 'Frequency', m_timing: 'Timing', m_duration: 'Duration', m_instr: 'Instructions',
    add_f: '+ {f}', t_ref_text: 'Reference text', m_name_ph: 'Not read - type the name', t_name_ph: 'Not read - type the test name',
    add_test: 'Add test', add_med: 'Add medicine', add_dx: 'Add diagnosis', add_advice: 'Add advice', remove: 'Remove',
    no_items: 'None found.',
    flag_normal: 'Normal', flag_low: 'Low', flag_high: 'High', flag_critical: 'Critical', flag_unknown: 'Unknown',
    low_conf: 'Low confidence - please verify', ok_row: 'This is right', ok_done: 'Checked by you', ok_hint: 'If it matches the original, press "This is right". If not, correct it.', unknown_med: 'Not in our medicine list - please verify',
    handwritten: 'Handwritten', conf_overall: 'Extraction confidence: {p}%', items_check: '{n} items need checking',
    ref_report: 'Range from your report', ref_standard: 'Standard range, not from your report',
    save: 'Save to my records', save_changes: 'Save changes', discard: 'Discard', cancel: 'Cancel', saving: 'Saving...',
    warnings_title: 'Please note',
    timeline_title: 'Health timeline', timeline_sub: 'Your saved records, newest first.',
    tl_empty: 'No records yet. Add your first record to start your timeline.', go_add: 'Add a record',
    filter_all: 'All', undated: 'No date',
    tl_for_doc: 'Showing a new doctor? Narrow it down:', tl_period: 'Period', tl_cond: 'Condition', tl_any: 'All time', tl_m: 'Last {n} months', tl_m1: 'Last month',
    tl_allcond: 'All conditions', tl_count: '{n} of {m} records shown', tl_nomatch: 'No records match these filters.', tl_reset: 'Show everything',
    n_abn: '{a} abnormal of {n} tests', n_tests: '{n} tests', n_meds: '{n} medicines',
    back: 'Back to timeline', edit: 'Edit', delete: 'Delete', confirm_delete: 'Delete this record from this device?',
    expl_title: 'In plain language', findings: 'Key findings', questions: 'Questions to ask your doctor',
    med_purpose: 'What your medicines are for', loading_expl: 'Writing a plain-language explanation...',
    expl_fail: 'Could not load the explanation.', retry: 'Try again', structured: 'Details from the document',
    h_source: 'Source',
    health_title: 'My health', health_sub: 'Everything from your saved records in one place.',
    h_patient: 'Patient', h_name: 'Name', h_age: 'Age', h_sex: 'Sex', h_abha: 'ABHA number', not_linked: 'Not linked',
    h_conditions: 'Conditions', first_seen: 'first seen {d}', h_meds: 'Current medicines', from_rec: 'from {d}',
    h_latest: 'Latest test values', h_trends: 'Trends',
    no_trends: 'Trends appear once a test is measured in two or more records.',
    gen_overview: 'Generate overall summary', overview_title: 'Overall summary', highlights: 'Highlights', watch: 'Worth watching',
    none_yet: 'Nothing here yet. Save a record first.', band_note: 'Shaded band is the reference range.',
    ask_title: 'Ask about your records', ask_sub: 'Answers come only from the records saved on this device.',
    ask_ph: 'Type your question', ask_send: 'Ask',
    doc_unsure: 'Read with low confidence. Check the name against the original before relying on it.',
    ask_ctx: 'Answering for {name} from {n} saved records.', ask_ctx_none: 'No saved records yet.',
    ask_ctx_draft: 'Open document, not saved yet: {title}', ask_attach: 'Add a document', ask_reading: 'Reading your document...',
    ask_doc_me: 'Document: {name}', label_review: 'Under review, not saved', doc_for: 'For', doc_found: 'What stands out', doc_meds: 'Medicines read',
    doc_check: 'To check', doc_unread: '{n} line(s) could not be read and were left out.', doc_save: 'Check against the original and save',
    doc_ask: 'You can ask about this document now. It joins your records only after you check and save it.',
    label_records: 'From your records', label_general: 'General information',
    label_doctor: 'Ask your doctor', label_emergency: 'Emergency',
    pet_name: 'Saathi', pet_sub: 'Your records guide. Not a doctor.', pet_open: 'Open Saathi, your records guide', pet_close: 'Close',
    pet_hello: 'Hi, I am Saathi. I can explain your saved records and show you around. I cannot diagnose or change medicines.',
    pet_tip_add: 'Start here: upload a photo or PDF of a prescription or lab report, or try a sample.',
    pet_tip_review: 'Check each value against the original on the left. Click a value to see the line it was read from, then save.',
    pet_tip_timeline: 'Every saved record is here by date. Open one to see what it means in simple words.',
    pet_tip_health: 'This is your whole picture: conditions, medicines, latest values and how they changed.',
    pet_tip_ask: 'Ask me anything about your saved records. I will tell you where each answer comes from.',
    pet_tip_abha: 'Link a mock ABHA number here, or export all records as a FHIR bundle.',
    pet_q1: 'What changed since my last report?', pet_q2: 'Which values are outside the range?', pet_q3: 'Which medicines am I on?',
    pet_go_ask: 'Open full chat',
    zoom_open: 'Enlarge', zoom_hint: 'Tap the document to zoom in and out.', hw_check: 'Handwritten: check every item against the original',
    sign_in: 'Sign in', sign_out: 'Sign out', guest: 'Guest', demo_user: 'Demo account',
    stat_records: 'Records saved', stat_out: 'Values outside range', stat_meds: 'Current medicines', stat_cond: 'Conditions noted',
    how_1: 'Upload', how_1s: 'A photo or PDF of any prescription or report', how_2: 'Check', how_2s: 'Compare what was read with the original', how_3: 'Understand', how_3s: 'Plain-language summary, timeline and trends',
    q1: 'What changed since my last report?', q2: 'Which medicines am I on and why?', q3: 'Which values should I discuss with my doctor?',
    thinking: 'Looking through your records...', sources: 'Sources', you: 'You', assistant: 'Sehat Copilot',
    ask_empty: 'Save at least one record to ask questions.',
    abha_title: 'ABHA & export',
    abha_about1: 'ABDM (Ayushman Bharat Digital Mission) is India\'s national digital health system. Your ABHA number is a 14-digit health ID that lets records follow you across hospitals.',
    abha_about2: 'Sehat Copilot structures your records in FHIR, the format ABDM uses, so they are ready to share when you choose.',
    abha_demo: 'Demo: simulated ABDM sandbox, no real health data is fetched.',
    abha_link: 'Link ABHA (mock)', abha_label: 'ABHA number', abha_linked: 'Linked: {n}', abha_addr: 'ABHA address',
    abha_import: 'Import records from ABHA (mock)', abha_imported: 'Imported {n} new records from ABHA.',
    abha_bad: 'Enter a 14-digit ABHA number.',
    ab_s1: 'ABHA number', ab_s2: 'OTP', ab_s3: 'Consent', ab_s4: 'Choose records',
    ab_send: 'Send OTP (mock)', ab_otp_label: 'One-time password', ab_otp_hint: 'Mock step: no SMS is sent. Enter any 6 digits.',
    ab_otp_bad: 'Enter 6 digits.', ab_verify: 'Verify (mock)', ab_cancel: 'Cancel',
    ab_consent_title: 'Consent request', ab_consent_who: 'Sehat Copilot is asking to read your records through ABDM.',
    ab_purpose: 'Purpose', ab_purpose_v: 'Self-requested: to show you your own records', ab_types: 'Record types',
    ab_range: 'Date range', ab_expiry: 'Access ends', ab_expiry_v: 'After this import. Nothing is fetched again without asking you.',
    ab_grant: 'Grant consent (mock)', ab_need_type: 'Choose at least one record type.',
    ab_pick_title: 'Records found', ab_pick_none: 'No records of the chosen types were found.', ab_import_sel: 'Import selected',
    ab_real: 'In the real ABDM flow the OTP goes to the phone linked to your ABHA, and consent is approved in your health locker app. Here every step is simulated.',
    hi_DiagnosticReport: 'Diagnostic reports', hi_Prescription: 'Prescriptions', hi_DischargeSummary: 'Discharge summaries', hi_HealthDocumentRecord: 'Other health documents',
    fhir_title: 'Export for ABDM / FHIR', fhir_note: 'Creates a FHIR R4 bundle of your profile and records.',
    fhir_btn: 'Export FHIR bundle', fhir_prev: 'Preview bundle', fhir_counts: 'Resources in the bundle',
    src_from: 'Read from', src_box: 'Source line', src_hint: 'Click a value to see the line it was read from.',
    unread_title: 'Lines not used', unread_sub: 'These lines looked like data but could not be read reliably, so nothing was guessed. Add them by hand if they matter.',
    unit_skip: '{n} result(s) in a different unit are not compared.',
    consent: 'When you upload, the document is sent to third-party AI services (Google Gemini, with Groq, NVIDIA or OpenRouter as backups) only to read and explain it. Our server stores nothing. Records are kept on this device and you can delete any record or all data at any time.',
    privacy: 'Built around the consent, purpose-limitation and erasure principles of India\'s Digital Personal Data Protection Act, 2023. This is a student prototype, not a certified or audited service. Use sample or non-sensitive documents.',
    data_title: 'Your data', wipe_btn: 'Delete all my data', wipe_hint: 'Removes everything stored on this device.',
    confirm_wipe: 'Delete all records and your profile from this device? This cannot be undone.',
    confirm_other: 'This document is for {a}. Your profile is {b}. Save it to this profile anyway?',
    attn_age: '{n} months old. A newer test may show something different.',
    cur_title: 'Are you still taking these?', cur_hint: 'These are written in your records, but nothing here shows you take them today. Only medicines you confirm go into the schedule and reminders.',
    cur_yes: 'Yes, I take this', cur_undo: 'Remove from schedule', cur_empty: 'Confirm a medicine above to see it in a schedule.',
    err_network: 'Could not reach the server. Check your connection and try again.',
    err_busy: 'The document reader is busy right now. Nothing was lost. Please try again in a minute.',
    read_time: 'Time so far', read_cancel: 'Cancel', who_title: 'This document is for {a}', who_q: 'Who is {a}?', who_me: 'This is me', who_pick: 'Save to this profile', who_likely: 'Looks like someone in your family', who_all: 'Or save it to', who_add: 'Add {a} as family, a friend or someone I care for', who_add_t: 'Add {a} to your family', who_add_hint: 'Check the details, then save the document into this new profile.', who_none: 'No other profiles to choose from.', who_back: 'Back', who_err: 'Could not save to that profile. Please try again.',
    moved_to: "Saved to {name}'s records", moved_switch: 'Switch to {name}',
    err_server: 'The server returned an error ({code}).',
    err_type: 'Please upload medical documents only: a photo, PDF, Word (.docx) or text file.',
    err_size: 'This file is larger than 3 MB. Please choose a smaller file.',
    err_image: 'Could not read this image. Try a different photo.',
    err_generic: 'Something went wrong. Please try again.',
    dismiss: 'Dismiss', working: 'Working...',
    sex_male: 'Male', sex_female: 'Female',
    label_signin: 'Sign in needed',
    signin_msg: 'To ask about your reports, please sign in first. It takes one click with the demo account.',
    use_demo_acct: 'Use demo account',
    mt_title: 'Medicines today', mt_empty: 'No medicines found in your prescriptions yet.',
    slot_morning: 'Morning', slot_afternoon: 'Afternoon', slot_night: 'Night', slot_prn: 'When needed', slot_weekly: 'Weekly', slot_asis: 'As prescribed',
    mt_count: '{x} of {y} taken today', mt_taken: 'taken',
    mt_remind: 'Remind me while this app is open', mt_remind_note: 'Reminders only work while this tab is open.',
    mt_remind_denied: 'Notifications are blocked in this browser, so reminders cannot be shown.',
    mt_note: 'This is the schedule written on your prescriptions. Do not change a medicine without asking your doctor.',
    mt_notif_title: 'Sehat Copilot reminder', mt_notif_body: '{slot}: {n} dose(s) from your prescriptions not ticked yet.',
    ph_title: 'Things to ask your pharmacist', ph_loading: 'Checking your medicines against a small reference list...',
    ph_fail: 'Could not check right now', ph_dup: 'Same ingredient twice: {ingredient} is in {names}',
    ph_none: 'Nothing to flag from our small reference list. That is not a guarantee.',
    sev_major: 'Major', sev_moderate: 'Moderate', sev_minor: 'Minor',
    visit_btn: 'Doctor visit summary', visit_title: 'Summary for my doctor', visit_generated: 'Generated on {d}',
    visit_cond: 'Conditions noted in my records', visit_meds: 'Current medicines', visit_abn: 'Latest values outside the reference range',
    visit_changes: 'Changes over time', visit_q: 'Questions I want to ask', visit_notes: 'My own notes',
    visit_how: 'How taken', visit_since: 'Since', visit_none: 'Nothing to list.',
    visit_noq: 'Open a record to see suggested questions here, or write your own below.',
    visit_footer: 'Prepared from the patient\'s own records by Sehat Copilot. Not a clinical document.',
    visit_print: 'Print or save as PDF', visit_back: 'Back',
    bk_title: 'Backup', bk_download: 'Download backup', bk_restore: 'Restore from backup',
    bk_note: 'Your records live only on this device. A backup file is how you move them to another device.',
    bk_done: 'Restored {n} records from the backup.', bk_saved: 'Backup downloaded.',
    bk_big: 'This file is larger than 40 MB, so it cannot be restored here.', bk_bad: 'This does not look like a Sehat Copilot backup file.',
    stat_meds_rec: 'Medicines recorded', h_meds_rec: 'Medicines recorded', visit_meds_rec: 'Medicines recorded',
    mt_title2: 'Medicine schedule from your prescriptions',
    med_note: 'These come from your prescriptions. Only you and your doctor know what you take now.',
    med_ended: 'Course dates have passed', med_ended_d: 'Course dates have passed (ended {d})', med_unconf: 'Not confirmed as current',
    med_presc: 'prescribed {d}', med_dur: 'duration {x}',
    visit_presc: 'Prescribed', visit_status: 'Status',
    ment_title: 'Mentions ({n})', ment_open: 'Open record',
    attn_title: 'Out of range in your latest results', attn_none: 'Everything in your latest results is within range.', attn_nolabs: 'No lab results yet. Upload a lab report to see your values here.', attn_late: '{n} doses today are not marked as taken yet.', attn_late_one: '1 dose today is not marked as taken yet.',
    trend_hist: 'Earlier results stay in each test\'s history above.',
    cross_title: 'Things to discuss with your doctor', q_title: 'Questions for your doctor, from your records',
    ins_loading: 'Putting your records together...',
    src_btn: 'Source',
    conf_label: 'Reading confidence (reported by the AI model, not calibrated): {p}%',
    conf_note: 'It shows how clearly the model could read the item, not how likely the value is correct. Check anything marked.',
    listen: 'Listen', listen_stop: 'Stop',
    greet_morning: 'Good morning, {name}', greet_afternoon: 'Good afternoon, {name}', greet_evening: 'Good evening, {name}', greet_guest: 'Your health at a glance',
    dash_attn_one: 'value needs attention', dash_attn_many: 'values need attention', dash_see: 'See what they mean',
    dash_next: 'Next up', dash_next_from: 'Written in your record of {date}', mock_tag: 'mock', dash_next_none: 'Nothing scheduled in your records.', dash_next_med: '{slot}: {names}',
    dash_changed: 'What changed', dash_changed_none: 'Not enough repeat results yet.',
    dash_doctor: 'For your doctor', dash_doctor_n: '{n} question(s) from your records',
    qa_ask: 'Ask Saathi', qa_export: 'Export',
    vit_title: 'Wellness log', vit_bp: 'Blood pressure', vit_sugar_fasting: 'Fasting sugar', vit_sugar_pp: 'Sugar after meal', vit_sugar_random: 'Random sugar', vit_weight: 'Weight', vit_pulse: 'Pulse',
    vit_type: 'Type', vit_value: 'Reading', vit_upper: 'Upper', vit_lower_in: 'Lower', vit_note: 'Note (optional)', vit_add: 'Add reading', vit_del: 'Delete',
    vit_err_num: 'Please enter numbers only.', vit_err_range: 'That value looks out of range. Please check it ({min} to {max}).',
    vit_err_date: 'Choose a date that is today or earlier.', vit_err_bp: 'The upper number should be higher than the lower one.',
    vit_empty: 'Add a home reading such as blood pressure, sugar or weight to see it next to your reports.',
    vit_caveat: 'Home readings vary with time of day, posture and the device. One reading is not a diagnosis. If a reading worries you, contact your doctor.',
    vit_crit: 'This reading is far outside the usual range. If you feel unwell, call 112 or see a doctor now.',
    vit_all: 'All readings ({n})', vit_lower: 'lower: {v}', vit_home: 'Home readings', qa_reading: 'Add a reading', kick_wellness: 'Wellness',
    kick_today: 'Today', kick_journal: 'Journal and next visit', kick_habits: 'Everyday habits', kick_results: 'Results', kick_meds: 'Medicines', kick_doctor: 'For your doctor', kick_about: 'About you'
  },
  hi: {
    app_name: 'सेहत कोपायलट',
    local_note: 'इस डिवाइस पर सहेजा गया',
    disclaimer: 'सेहत कोपायलट आपके रिकॉर्ड को समझाता है। यह निदान नहीं है। हमेशा अपने डॉक्टर से पुष्टि करें।',
    nav_add: 'रिकॉर्ड जोड़ें', nav_timeline: 'टाइमलाइन', nav_health: 'मेरी सेहत', nav_ask: 'पूछें', nav_abha: 'आभा और एक्सपोर्ट', nav_settings: 'सेटिंग्स',
    st_title: 'सेटिंग्स', st_sub: 'दिखावट, भाषा, याद दिलाने, आपका खाता और आपका डेटा।', st_look: 'दिखावट', st_light: 'लाइट', st_dark: 'डार्क', st_system: 'डिवाइस जैसा',
    st_lang: 'भाषा', st_lang_note: 'समझाना और चैट के जवाब इसी भाषा में लिखे जाते हैं।', st_notif: 'याद दिलाना और सूचनाएँ',
    st_notif_on: 'इस ब्राउज़र में सूचनाएँ चालू हैं।', st_notif_off: 'सूचनाएँ बंद हैं। दवा याद दिलाने के लिए इन्हें चालू करें।', st_notif_blocked: 'ब्राउज़र सेटिंग में सूचनाएँ रोकी गई हैं। इस साइट के लिए अनुमति दें।',
    st_notif_btn: 'सूचनाएँ चालू करें', st_notif_na: 'यह ब्राउज़र सूचनाएँ नहीं दिखा सकता। Google कैलेंडर से याद दिलाना इस्तेमाल करें।', st_cal: 'Google कैलेंडर में दवा याद दिलाना', st_go_meds: 'दवा की समय-सारणी खोलें',
    st_account: 'खाता', st_signed: '{who} के रूप में साइन इन', st_guest: 'आप मेहमान के रूप में इस्तेमाल कर रहे हैं। रिकॉर्ड इसी डिवाइस पर रहते हैं।', st_signout: 'साइन आउट', st_signin: 'साइन इन करें या खाता बनाएँ',
    st_sync_on: 'एंड-टू-एंड एन्क्रिप्टेड सिंक चालू है।', st_sync_off: 'सिंक बंद है। रिकॉर्ड सिर्फ़ इसी ब्राउज़र में हैं।', st_family: 'परिवार और पैरेंटल कंट्रोल',
    st_family_note: 'परिवार के सदस्य जोड़ें, बच्चे की प्रोफ़ाइल पर PIN लगाएँ, देखभाल अलर्ट संभालें।', st_go_family: 'परिवार संभालें', st_export: 'डॉक्टर के साथ साझा करें',
    st_export_note: 'रिकॉर्ड ABDM फ़ॉर्मेट (FHIR R4) में एक्सपोर्ट करें या एक पन्ने का सारांश प्रिंट करें।', st_go_export: 'आभा और एक्सपोर्ट खोलें', st_about: 'जानकारी',
    st_about_note: 'सेहत कोपायलट आपके रिकॉर्ड समझाता है। यह निदान नहीं है और डॉक्टर की जगह नहीं लेता। आपात स्थिति में 112 पर कॉल करें।',
    add_title: 'स्वास्थ्य रिकॉर्ड जोड़ें',
    add_sub: 'पर्चा, लैब रिपोर्ट या डिस्चार्ज सारांश की फोटो या PDF अपलोड करें।',
    drop_title: 'फ़ाइल यहाँ छोड़ें', drop_hint: 'फोटो, PDF या टेक्स्ट फ़ाइल। PDF और टेक्स्ट अधिकतम 3 MB।',
    choose_file: 'फ़ाइल चुनें', take_photo: 'फोटो लें',
    samples_title: 'नमूना आज़माएँ', samples_none: 'अभी कोई नमूना उपलब्ध नहीं है।',
    demo_btn: 'पूरी डेमो प्रोफ़ाइल लोड करें', demo_hint: 'एक नमूना मरीज़ और कई रिकॉर्ड जोड़कर टाइमलाइन खोलता है।',
    processing_title: 'आपका दस्तावेज़ पढ़ा जा रहा है',
    err_unread: 'यह पर्चा या रिपोर्ट पढ़ने लायक नहीं है। दवाइयाँ और खुराक पक्का करने के लिए अपने डॉक्टर या क्लिनिक को फ़ोन करें, या पूरे पन्ने की साफ़, अच्छी रोशनी में फ़ोटो आज़माएँ।',
    warn_hdate: 'तारीख़ {date} पढ़ी गई। हाथ से लिखी तारीख़ें आसानी से ग़लत पढ़ी जाती हैं; कृपया इसकी पुष्टि करें।',
    med_conf: 'आपने पुष्टि की है कि आप यह लेते हैं', warn_ocr: 'यह दस्तावेज़ डिवाइस पर चलने वाले बैकअप रीडर से पढ़ा गया, जो कम सटीक है। कृपया हर मान जाँचें।',
    warn_hand: 'यह दस्तावेज़ हाथ से लिखा है। कृपया हर दवा का नाम और खुराक मूल दस्तावेज़ से मिलाएँ।',
    warn_unread: '{n} पंक्ति(याँ) ठीक से पढ़ी नहीं जा सकीं और छोड़ दी गईं। वे "उपयोग न की गई पंक्तियाँ" में दी गई हैं; ज़रूरी हों तो उन्हें खुद जोड़ें।',
    warn_low: '{n} चीज़ें कम भरोसे के साथ पढ़ी गईं और नीचे चिह्नित हैं।',
    warn_nodate: 'इस दस्तावेज़ पर कोई तारीख़ नहीं मिली। कृपया तारीख़ जोड़ें ताकि यह टाइमलाइन में सही जगह दिखे।',
    warn_future: 'इस दस्तावेज़ की तारीख़ भविष्य की है। कृपया जाँच लें।',
    warn_old: 'तारीख़ {date} पढ़ी गई, जो दो साल से ज़्यादा पुरानी है। अगर यह हाल का दस्तावेज़ है तो कृपया तारीख़ ठीक करें।',
    warn_critical: 'एक या अधिक मान सामान्य सीमा से बहुत बाहर हैं। कृपया जल्द अपने डॉक्टर से संपर्क करें।',
    warn_notrecord: 'यह स्वास्थ्य रिकॉर्ड जैसा नहीं लगता, या इसे पढ़ा नहीं जा सका। ज़्यादा साफ़ फ़ोटो आज़माएँ।',
    warn_saved: 'पढ़ने वाली सेवा अभी व्यस्त है, इसलिए इस नमूने की सहेजी हुई रीडिंग दिखाई जा रही है।',
    wait_hint: 'इसमें आम तौर पर 10 से 20 सेकंड लगते हैं। हाथ की लिखावट में थोड़ा ज़्यादा समय लग सकता है।',
    step_read: 'दस्तावेज़ पढ़ना', step_extract: 'जानकारी निकालना', step_check: 'मान जाँचना', step_write: 'सारांश लिखना',
    review_title: 'जाँचें और सुधारें',
    review_sub: 'मूल दस्तावेज़ से मिलान करें। जो गलत लगे उसे ठीक करें, फिर सहेजें।',
    edit_title: 'रिकॉर्ड संपादित करें',
    original: 'मूल दस्तावेज़', no_preview: 'इस रिकॉर्ड की मूल फ़ाइल सहेजी नहीं गई है।',
    f_type: 'दस्तावेज़ का प्रकार', f_title: 'शीर्षक', f_date: 'तारीख', f_facility: 'अस्पताल / लैब', f_doctor: 'डॉक्टर', f_patient: 'मरीज़', f_age: 'उम्र', f_followup: 'अगली मुलाकात',
    type_lab_report: 'लैब रिपोर्ट', type_prescription: 'पर्चा', type_discharge_summary: 'डिस्चार्ज सारांश',
    type_diagnostic_report: 'जाँच रिपोर्ट', type_other: 'अन्य',
    sec_tests: 'जाँचें', sec_meds: 'दवाइयाँ', sec_dx: 'निदान', sec_advice: 'सलाह',
    t_name: 'जाँच का नाम', t_value: 'मान', t_unit: 'इकाई', t_low: 'सामान्य सीमा (न्यूनतम)', t_high: 'सामान्य सीमा (अधिकतम)', t_flag: 'स्थिति', t_range: 'सामान्य सीमा',
    m_name: 'दवा', m_generic: 'जेनेरिक नाम', m_strength: 'मात्रा (ताकत)', m_dose: 'खुराक', m_freq: 'कितनी बार', m_timing: 'समय', m_duration: 'अवधि', m_instr: 'निर्देश',
    add_f: '+ {f}', t_ref_text: 'सामान्य सीमा (लिखित)', m_name_ph: 'पढ़ा नहीं गया - नाम लिखें', t_name_ph: 'पढ़ा नहीं गया - जाँच का नाम लिखें',
    add_test: 'जाँच जोड़ें', add_med: 'दवा जोड़ें', add_dx: 'निदान जोड़ें', add_advice: 'सलाह जोड़ें', remove: 'हटाएँ',
    no_items: 'कुछ नहीं मिला।',
    flag_normal: 'सामान्य', flag_low: 'कम', flag_high: 'अधिक', flag_critical: 'गंभीर', flag_unknown: 'अज्ञात',
    low_conf: 'कम भरोसा - कृपया जाँचें', ok_row: 'यह सही है', ok_done: 'आपने जाँच लिया', ok_hint: 'अगर यह मूल दस्तावेज़ से मिलता है तो "यह सही है" दबाएँ। नहीं तो इसे ठीक करें।', unknown_med: 'हमारी दवा सूची में नहीं - कृपया जाँचें',
    handwritten: 'हाथ से लिखा', conf_overall: 'जानकारी निकालने का भरोसा: {p}%', items_check: '{n} चीज़ें जाँचने योग्य हैं',
    ref_report: 'सीमा आपकी रिपोर्ट से', ref_standard: 'मानक सीमा, आपकी रिपोर्ट से नहीं',
    save: 'मेरे रिकॉर्ड में सहेजें', save_changes: 'बदलाव सहेजें', discard: 'रद्द करें', cancel: 'वापस', saving: 'सहेजा जा रहा है...',
    warnings_title: 'कृपया ध्यान दें',
    timeline_title: 'स्वास्थ्य टाइमलाइन', timeline_sub: 'आपके सहेजे गए रिकॉर्ड, सबसे नए पहले।',
    tl_empty: 'अभी कोई रिकॉर्ड नहीं है। टाइमलाइन शुरू करने के लिए पहला रिकॉर्ड जोड़ें।', go_add: 'रिकॉर्ड जोड़ें',
    filter_all: 'सभी', undated: 'तारीख नहीं',
    tl_for_doc: 'नए डॉक्टर को दिखाना है? छाँटें:', tl_period: 'समय', tl_cond: 'बीमारी', tl_any: 'पूरा समय', tl_m: 'पिछले {n} महीने', tl_m1: 'पिछला महीना',
    tl_allcond: 'सभी बीमारियाँ', tl_count: '{m} में से {n} रिकॉर्ड', tl_nomatch: 'इन फ़िल्टर से कोई रिकॉर्ड नहीं मिला।', tl_reset: 'सब दिखाएँ',
    n_abn: '{n} जाँचों में से {a} असामान्य', n_tests: '{n} जाँचें', n_meds: '{n} दवाइयाँ',
    back: 'टाइमलाइन पर वापस', edit: 'संपादित करें', delete: 'हटाएँ', confirm_delete: 'इस रिकॉर्ड को इस डिवाइस से हटाएँ?',
    expl_title: 'आसान भाषा में', findings: 'मुख्य निष्कर्ष', questions: 'डॉक्टर से पूछने के सवाल',
    med_purpose: 'आपकी दवाइयाँ किसलिए हैं', loading_expl: 'आसान भाषा में समझाया जा रहा है...',
    expl_fail: 'स्पष्टीकरण लोड नहीं हो सका।', retry: 'फिर कोशिश करें', structured: 'दस्तावेज़ का विवरण',
    h_source: 'स्रोत',
    health_title: 'मेरी सेहत', health_sub: 'आपके सहेजे गए सभी रिकॉर्ड एक जगह।',
    h_patient: 'मरीज़', h_name: 'नाम', h_age: 'उम्र', h_sex: 'लिंग', h_abha: 'आभा नंबर', not_linked: 'जुड़ा नहीं है',
    h_conditions: 'स्वास्थ्य स्थितियाँ', first_seen: 'पहली बार {d} को दिखा', h_meds: 'वर्तमान दवाइयाँ', from_rec: '{d} के रिकॉर्ड से',
    h_latest: 'नवीनतम जाँच मान', h_trends: 'रुझान',
    no_trends: 'जब कोई जाँच दो या अधिक रिकॉर्ड में हो, तब रुझान दिखेंगे।',
    gen_overview: 'कुल सारांश बनाएँ', overview_title: 'कुल सारांश', highlights: 'मुख्य बातें', watch: 'ध्यान देने योग्य',
    none_yet: 'अभी यहाँ कुछ नहीं है। पहले एक रिकॉर्ड सहेजें।', band_note: 'रंगीन पट्टी सामान्य सीमा दिखाती है।',
    ask_title: 'अपने रिकॉर्ड के बारे में पूछें', ask_sub: 'उत्तर केवल इस डिवाइस पर सहेजे रिकॉर्ड से आते हैं।',
    ask_ph: 'अपना सवाल लिखें', ask_send: 'पूछें',
    doc_unsure: 'कम भरोसे से पढ़ा गया। इस पर भरोसा करने से पहले नाम को मूल दस्तावेज़ से मिलाएँ।',
    ask_ctx: '{name} के लिए, {n} सहेजे रिकॉर्ड से उत्तर।', ask_ctx_none: 'अभी कोई रिकॉर्ड सहेजा नहीं गया है।',
    ask_ctx_draft: 'खुला दस्तावेज़, अभी सहेजा नहीं: {title}', ask_attach: 'दस्तावेज़ जोड़ें', ask_reading: 'आपका दस्तावेज़ पढ़ा जा रहा है...',
    ask_doc_me: 'दस्तावेज़: {name}', label_review: 'जाँच में, अभी सहेजा नहीं', doc_for: 'किसके लिए', doc_found: 'ध्यान देने वाली बातें', doc_meds: 'पढ़ी गई दवाएँ',
    doc_check: 'जाँचने के लिए', doc_unread: '{n} पंक्ति(याँ) पढ़ी नहीं जा सकीं और छोड़ दी गईं।', doc_save: 'मूल से मिलाएँ और सहेजें',
    doc_ask: 'आप इस दस्तावेज़ के बारे में अभी पूछ सकते हैं। यह आपके रिकॉर्ड में तभी जुड़ेगा जब आप जाँचकर सहेजेंगे।',
    label_records: 'आपके रिकॉर्ड से', label_general: 'सामान्य जानकारी',
    label_doctor: 'अपने डॉक्टर से पूछें', label_emergency: 'आपातकाल',
    pet_name: 'साथी', pet_sub: 'आपके रिकॉर्ड का मार्गदर्शक। डॉक्टर नहीं।', pet_open: 'साथी खोलें, आपके रिकॉर्ड का मार्गदर्शक', pet_close: 'बंद करें',
    pet_hello: 'नमस्ते, मैं साथी हूँ। मैं आपके सहेजे रिकॉर्ड समझा सकता हूँ और ऐप में रास्ता दिखा सकता हूँ। मैं निदान नहीं करता और दवा नहीं बदलता।',
    pet_tip_add: 'यहाँ से शुरू करें: पर्ची या लैब रिपोर्ट की फ़ोटो या PDF अपलोड करें, या कोई नमूना आज़माएँ।',
    pet_tip_review: 'हर मान को बाईं ओर के मूल दस्तावेज़ से मिलाएँ। किसी मान पर क्लिक करें तो उसकी स्रोत पंक्ति दिखेगी, फिर सहेजें।',
    pet_tip_timeline: 'आपके सारे रिकॉर्ड यहाँ तारीख़ के अनुसार हैं। किसी को खोलें और सरल शब्दों में उसका मतलब देखें।',
    pet_tip_health: 'यह आपकी पूरी तस्वीर है: बीमारियाँ, दवाएँ, ताज़ा मान और उनमें आया बदलाव।',
    pet_tip_ask: 'अपने सहेजे रिकॉर्ड के बारे में कुछ भी पूछें। मैं बताऊँगा कि हर जवाब कहाँ से आया।',
    pet_tip_abha: 'यहाँ नकली (डेमो) ABHA नंबर जोड़ें, या सारे रिकॉर्ड FHIR बंडल के रूप में निर्यात करें।',
    pet_q1: 'पिछली रिपोर्ट के बाद क्या बदला?', pet_q2: 'कौन से मान सीमा से बाहर हैं?', pet_q3: 'मैं कौन सी दवाएँ ले रहा हूँ?',
    pet_go_ask: 'पूरी चैट खोलें',
    zoom_open: 'बड़ा करें', zoom_hint: 'ज़ूम करने के लिए दस्तावेज़ पर टैप करें।', hw_check: 'हाथ से लिखा है: हर चीज़ को मूल दस्तावेज़ से मिलाएँ',
    sign_in: 'साइन इन', sign_out: 'साइन आउट', guest: 'अतिथि', demo_user: 'डेमो खाता',
    stat_records: 'सहेजे रिकॉर्ड', stat_out: 'सीमा से बाहर मान', stat_meds: 'चालू दवाएँ', stat_cond: 'दर्ज बीमारियाँ',
    how_1: 'अपलोड करें', how_1s: 'किसी भी पर्ची या रिपोर्ट की फ़ोटो या PDF', how_2: 'जाँचें', how_2s: 'पढ़े गए मानों को मूल दस्तावेज़ से मिलाएँ', how_3: 'समझें', how_3s: 'सरल भाषा में सार, टाइमलाइन और रुझान',
    q1: 'पिछली रिपोर्ट के बाद क्या बदला?', q2: 'मैं कौन सी दवाइयाँ ले रहा हूँ और क्यों?', q3: 'किन मानों पर मुझे डॉक्टर से बात करनी चाहिए?',
    thinking: 'आपके रिकॉर्ड देखे जा रहे हैं...', sources: 'स्रोत', you: 'आप', assistant: 'सेहत कोपायलट',
    ask_empty: 'सवाल पूछने के लिए कम से कम एक रिकॉर्ड सहेजें।',
    abha_title: 'आभा और एक्सपोर्ट',
    abha_about1: 'ABDM (आयुष्मान भारत डिजिटल मिशन) भारत की राष्ट्रीय डिजिटल स्वास्थ्य प्रणाली है। आपका आभा नंबर 14 अंकों की स्वास्थ्य आईडी है, जिससे आपके रिकॉर्ड अस्पतालों में आपके साथ चलते हैं।',
    abha_about2: 'सेहत कोपायलट आपके रिकॉर्ड को FHIR में रखता है, जो ABDM का इस्तेमाल किया हुआ प्रारूप है, ताकि आप जब चाहें उन्हें साझा कर सकें।',
    abha_demo: 'डेमो: नकली ABDM सैंडबॉक्स, कोई असली स्वास्थ्य डेटा नहीं लाया जाता।',
    abha_link: 'आभा जोड़ें (डेमो)', abha_label: 'आभा नंबर', abha_linked: 'जुड़ा हुआ: {n}', abha_addr: 'आभा पता',
    abha_import: 'आभा से रिकॉर्ड लाएँ (डेमो)', abha_imported: 'आभा से {n} नए रिकॉर्ड लाए गए।',
    abha_bad: '14 अंकों का आभा नंबर डालें।',
    ab_s1: 'आभा नंबर', ab_s2: 'ओटीपी', ab_s3: 'सहमति', ab_s4: 'रिकॉर्ड चुनें',
    ab_send: 'ओटीपी भेजें (डेमो)', ab_otp_label: 'वन-टाइम पासवर्ड', ab_otp_hint: 'डेमो चरण: कोई SMS नहीं भेजा जाता। कोई भी 6 अंक डालें।',
    ab_otp_bad: '6 अंक डालें।', ab_verify: 'जाँचें (डेमो)', ab_cancel: 'रद्द करें',
    ab_consent_title: 'सहमति का अनुरोध', ab_consent_who: 'सेहत कोपायलट ABDM के ज़रिए आपके रिकॉर्ड पढ़ने की अनुमति माँग रहा है।',
    ab_purpose: 'उद्देश्य', ab_purpose_v: 'स्वयं का अनुरोध: आपको आपके अपने रिकॉर्ड दिखाने के लिए', ab_types: 'रिकॉर्ड के प्रकार',
    ab_range: 'तारीख़ की सीमा', ab_expiry: 'अनुमति कब तक', ab_expiry_v: 'इस बार रिकॉर्ड लाने तक। आपसे पूछे बिना दोबारा कुछ नहीं लाया जाएगा।',
    ab_grant: 'सहमति दें (डेमो)', ab_need_type: 'कम से कम एक प्रकार चुनें।',
    ab_pick_title: 'मिले हुए रिकॉर्ड', ab_pick_none: 'चुने गए प्रकार का कोई रिकॉर्ड नहीं मिला।', ab_import_sel: 'चुने हुए लाएँ',
    ab_real: 'असली ABDM प्रक्रिया में ओटीपी आपके आभा से जुड़े फ़ोन पर आता है और सहमति आपके हेल्थ लॉकर ऐप में दी जाती है। यहाँ हर चरण डेमो है।',
    hi_DiagnosticReport: 'जाँच रिपोर्ट', hi_Prescription: 'पर्चे', hi_DischargeSummary: 'डिस्चार्ज सारांश', hi_HealthDocumentRecord: 'अन्य स्वास्थ्य दस्तावेज़',
    fhir_title: 'ABDM / FHIR के लिए एक्सपोर्ट', fhir_note: 'आपकी प्रोफ़ाइल और रिकॉर्ड का FHIR R4 बंडल बनाता है।',
    fhir_btn: 'FHIR बंडल एक्सपोर्ट करें', fhir_prev: 'बंडल का पूर्वावलोकन', fhir_counts: 'बंडल में संसाधन',
    src_from: 'यहाँ से पढ़ा', src_box: 'स्रोत पंक्ति', src_hint: 'किसी मान पर क्लिक करें, जिस पंक्ति से वह पढ़ा गया वह दिखेगी।',
    unread_title: 'जो पंक्तियाँ उपयोग नहीं हुईं', unread_sub: 'ये पंक्तियाँ डेटा जैसी लगीं पर ठीक से पढ़ी नहीं जा सकीं, इसलिए कोई अनुमान नहीं लगाया गया। ज़रूरी हों तो खुद जोड़ें।',
    unit_skip: '{n} नतीजे अलग इकाई में हैं, इसलिए उनकी तुलना नहीं की गई।',
    consent: 'अपलोड करने पर दस्तावेज़ केवल पढ़ने और समझाने के लिए बाहरी AI सेवाओं (Google Gemini; बैकअप में Groq, NVIDIA या OpenRouter) को भेजा जाता है। हमारा सर्वर कुछ भी सहेजता नहीं। रिकॉर्ड इसी डिवाइस पर रहते हैं और आप कोई भी रिकॉर्ड या सारा डेटा कभी भी हटा सकते हैं।',
    privacy: 'यह भारत के डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 के सहमति, उद्देश्य-सीमा और डेटा हटाने के सिद्धांतों को ध्यान में रखकर बनाया गया है। यह छात्रों का प्रोटोटाइप है, कोई प्रमाणित सेवा नहीं। नमूना या गैर-संवेदनशील दस्तावेज़ ही इस्तेमाल करें।',
    data_title: 'आपका डेटा', wipe_btn: 'मेरा सारा डेटा हटाएँ', wipe_hint: 'इस डिवाइस पर सहेजी हर चीज़ हट जाएगी।',
    confirm_wipe: 'इस डिवाइस से सभी रिकॉर्ड और आपकी प्रोफ़ाइल हटाएँ? इसे वापस नहीं किया जा सकता।',
    confirm_other: 'यह दस्तावेज़ {a} का है। आपकी प्रोफ़ाइल {b} की है। फिर भी इसी प्रोफ़ाइल में सहेजें?',
    attn_age: '{n} महीने पुराना। नई जाँच में नतीजा अलग हो सकता है।',
    cur_title: 'क्या आप ये दवाएँ अभी भी ले रहे हैं?', cur_hint: 'ये दवाएँ आपके रिकॉर्ड में लिखी हैं, पर यहाँ से पता नहीं चलता कि आप इन्हें आज ले रहे हैं। जिन दवाओं की आप पुष्टि करेंगे, वही समय-सारणी और रिमाइंडर में आएँगी।',
    cur_yes: 'हाँ, मैं यह लेता/लेती हूँ', cur_undo: 'समय-सारणी से हटाएँ', cur_empty: 'समय-सारणी देखने के लिए ऊपर किसी दवा की पुष्टि करें।',
    err_network: 'सर्वर से संपर्क नहीं हो सका। कनेक्शन जाँचकर फिर कोशिश करें।',
    err_busy: 'दस्तावेज़ पढ़ने वाली सेवा अभी व्यस्त है। कुछ खोया नहीं है। कृपया एक मिनट बाद फिर कोशिश करें।',
    read_time: 'अब तक का समय', read_cancel: 'रद्द करें', who_title: 'यह दस्तावेज़ {a} का है', who_q: '{a} कौन हैं?', who_me: 'यह मैं हूँ', who_pick: 'इस प्रोफ़ाइल में सहेजें', who_likely: 'आपके परिवार में से कोई लगता है', who_all: 'या इसमें सहेजें', who_add: '{a} को परिवार, दोस्त या जिनकी देखभाल करता/करती हूँ, उनमें जोड़ें', who_add_t: '{a} को अपने परिवार में जोड़ें', who_add_hint: 'जानकारी जाँचें, फिर दस्तावेज़ इस नई प्रोफ़ाइल में सहेजें।', who_none: 'चुनने के लिए कोई और प्रोफ़ाइल नहीं है।', who_back: 'पीछे', who_err: 'उस प्रोफ़ाइल में सहेजा नहीं जा सका। कृपया फिर कोशिश करें।',
    moved_to: '{name} के रिकॉर्ड में सहेजा गया', moved_switch: '{name} की प्रोफ़ाइल खोलें',
    err_server: 'सर्वर में त्रुटि हुई ({code})।',
    err_type: 'कृपया केवल मेडिकल दस्तावेज़ अपलोड करें: फोटो, PDF, Word (.docx) या टेक्स्ट फ़ाइल।',
    err_size: 'यह फ़ाइल 3 MB से बड़ी है। कृपया छोटी फ़ाइल चुनें।',
    err_image: 'यह तस्वीर पढ़ी नहीं जा सकी। कोई दूसरी फोटो आज़माएँ।',
    err_generic: 'कुछ गड़बड़ हो गई। कृपया फिर कोशिश करें।',
    dismiss: 'बंद करें', working: 'काम हो रहा है...',
    sex_male: 'पुरुष', sex_female: 'महिला',
    label_signin: 'साइन इन ज़रूरी',
    signin_msg: 'अपनी रिपोर्ट के बारे में पूछने के लिए पहले साइन इन करें। डेमो खाते से बस एक क्लिक में हो जाता है।',
    use_demo_acct: 'डेमो खाता इस्तेमाल करें',
    mt_title: 'आज की दवाइयाँ', mt_empty: 'आपके पर्चों में अभी कोई दवा नहीं मिली।',
    slot_morning: 'सुबह', slot_afternoon: 'दोपहर', slot_night: 'रात', slot_prn: 'ज़रूरत पड़ने पर', slot_weekly: 'साप्ताहिक', slot_asis: 'पर्चे के अनुसार',
    mt_count: 'आज {y} में से {x} ली गईं', mt_taken: 'ली',
    mt_remind: 'ऐप खुला रहने तक मुझे याद दिलाएँ', mt_remind_note: 'याद दिलाना तभी काम करता है जब यह टैब खुला हो।',
    mt_remind_denied: 'इस ब्राउज़र में सूचनाएँ बंद हैं, इसलिए याद दिलाना नहीं दिखाया जा सकता।',
    mt_note: 'यह वही समय-सारणी है जो आपके पर्चों में लिखी है। डॉक्टर से पूछे बिना कोई दवा न बदलें।',
    mt_notif_title: 'सेहत कोपायलट अनुस्मारक', mt_notif_body: '{slot}: आपके पर्चों की {n} खुराक पर अभी निशान नहीं लगा।',
    ph_title: 'फ़ार्मासिस्ट से पूछने की बातें', ph_loading: 'आपकी दवाओं को एक छोटी संदर्भ सूची से मिलाया जा रहा है...',
    ph_fail: 'अभी जाँच नहीं हो सकी', ph_dup: 'एक ही सामग्री दो बार: {ingredient} इनमें है: {names}',
    ph_none: 'हमारी छोटी संदर्भ सूची में बताने लायक कुछ नहीं मिला। यह कोई गारंटी नहीं है।',
    sev_major: 'गंभीर', sev_moderate: 'मध्यम', sev_minor: 'हल्का',
    visit_btn: 'डॉक्टर मुलाकात का सारांश', visit_title: 'मेरे डॉक्टर के लिए सारांश', visit_generated: '{d} को तैयार किया गया',
    visit_cond: 'मेरे रिकॉर्ड में दर्ज स्थितियाँ', visit_meds: 'वर्तमान दवाइयाँ', visit_abn: 'सामान्य सीमा से बाहर नवीनतम मान',
    visit_changes: 'समय के साथ बदलाव', visit_q: 'जो सवाल मैं पूछना चाहता/चाहती हूँ', visit_notes: 'मेरे अपने नोट्स',
    visit_how: 'कैसे ली जाती है', visit_since: 'कब से', visit_none: 'सूची में कुछ नहीं।',
    visit_noq: 'सुझाए गए सवाल देखने के लिए कोई रिकॉर्ड खोलें, या नीचे अपने सवाल लिखें।',
    visit_footer: 'यह सारांश सेहत कोपायलट ने मरीज़ के अपने रिकॉर्ड से तैयार किया है। यह कोई चिकित्सकीय दस्तावेज़ नहीं है।',
    visit_print: 'प्रिंट करें या PDF सहेजें', visit_back: 'वापस',
    bk_title: 'बैकअप', bk_download: 'बैकअप डाउनलोड करें', bk_restore: 'बैकअप से वापस लाएँ',
    bk_note: 'आपके रिकॉर्ड सिर्फ़ इसी डिवाइस पर रहते हैं। बैकअप फ़ाइल से आप उन्हें दूसरे डिवाइस पर ले जा सकते हैं।',
    bk_done: 'बैकअप से {n} रिकॉर्ड वापस लाए गए।', bk_saved: 'बैकअप डाउनलोड हो गया।',
    bk_big: 'यह फ़ाइल 40 MB से बड़ी है, इसलिए यहाँ वापस नहीं लाई जा सकती।', bk_bad: 'यह सेहत कोपायलट की बैकअप फ़ाइल जैसी नहीं लगती।',
    stat_meds_rec: 'दर्ज दवाइयाँ', h_meds_rec: 'दर्ज दवाइयाँ', visit_meds_rec: 'दर्ज दवाइयाँ',
    mt_title2: 'आपके पर्चों के अनुसार दवा की समय-सारणी',
    med_note: 'ये आपके पर्चों से लिया गया है। अभी आप क्या लेते हैं, यह सिर्फ़ आप और आपके डॉक्टर जानते हैं।',
    med_ended: 'कोर्स की तारीखें बीत चुकी हैं', med_ended_d: 'कोर्स की तारीखें बीत चुकी हैं ({d} को समाप्त)', med_unconf: 'चालू होने की पुष्टि नहीं',
    med_presc: '{d} को लिखी गई', med_dur: 'अवधि {x}',
    visit_presc: 'कब लिखी गई', visit_status: 'स्थिति',
    ment_title: 'उल्लेख ({n})', ment_open: 'रिकॉर्ड खोलें',
    attn_title: 'अभी ध्यान देने योग्य', attn_none: 'आपके ताज़ा नतीजों में सब कुछ सामान्य सीमा के भीतर है।', attn_nolabs: 'अभी कोई लैब रिपोर्ट नहीं है। अपने मान यहाँ देखने के लिए लैब रिपोर्ट अपलोड करें।', attn_late: 'आज की {n} खुराकें अभी ली गई के रूप में दर्ज नहीं हैं।', attn_late_one: 'आज की 1 खुराक अभी ली गई के रूप में दर्ज नहीं है।',
    trend_hist: 'पुराने नतीजे हर जाँच के इतिहास में ऊपर बने रहते हैं।',
    cross_title: 'डॉक्टर से चर्चा के लिए बातें', q_title: 'आपके रिकॉर्ड से डॉक्टर के लिए सवाल',
    ins_loading: 'आपके रिकॉर्ड एक साथ जोड़े जा रहे हैं...',
    src_btn: 'स्रोत',
    conf_label: 'पढ़ने का भरोसा (AI मॉडल द्वारा बताया गया, जाँचा हुआ नहीं): {p}%',
    conf_note: 'यह बताता है कि मॉडल ने चीज़ को कितने साफ़ पढ़ा, यह नहीं कि मान कितना सही है। निशान लगी हर चीज़ जाँचें।',
    listen: 'सुनें', listen_stop: 'रोकें',
    greet_morning: 'सुप्रभात, {name}', greet_afternoon: 'नमस्कार, {name}', greet_evening: 'शुभ संध्या, {name}', greet_guest: 'आपकी सेहत एक नज़र में',
    dash_attn_one: 'मान पर ध्यान देना है', dash_attn_many: 'मानों पर ध्यान देना है', dash_see: 'इनका मतलब देखें',
    dash_next: 'आगे क्या', dash_next_from: '{date} के रिकॉर्ड में लिखा है', mock_tag: 'मॉक', dash_next_none: 'आपके रिकॉर्ड में कुछ तय नहीं है।', dash_next_med: '{slot}: {names}',
    dash_changed: 'क्या बदला', dash_changed_none: 'दोहराए गए नतीजे अभी पर्याप्त नहीं हैं।',
    dash_doctor: 'डॉक्टर के लिए', dash_doctor_n: 'आपके रिकॉर्ड से {n} सवाल',
    qa_ask: 'साथी से पूछें', qa_export: 'एक्सपोर्ट',
    vit_title: 'सेहत की डायरी', vit_bp: 'ब्लड प्रेशर', vit_sugar_fasting: 'खाली पेट शुगर', vit_sugar_pp: 'खाने के बाद शुगर', vit_sugar_random: 'किसी भी समय शुगर', vit_weight: 'वज़न', vit_pulse: 'नाड़ी',
    vit_type: 'प्रकार', vit_value: 'माप', vit_upper: 'ऊपरी', vit_lower_in: 'निचला', vit_note: 'नोट (वैकल्पिक)', vit_add: 'माप जोड़ें', vit_del: 'हटाएँ',
    vit_err_num: 'कृपया सिर्फ़ संख्याएँ लिखें।', vit_err_range: 'यह मान सीमा से बाहर लगता है। कृपया जाँचें ({min} से {max})।',
    vit_err_date: 'आज या उससे पहले की तारीख चुनें।', vit_err_bp: 'ऊपरी संख्या निचली से बड़ी होनी चाहिए।',
    vit_empty: 'ब्लड प्रेशर, शुगर या वज़न जैसा घर पर लिया गया माप जोड़ें, ताकि वह आपकी रिपोर्ट के साथ दिखे।',
    vit_caveat: 'घर पर लिए गए माप दिन के समय, बैठने के ढंग और उपकरण के साथ बदलते हैं। एक माप निदान नहीं है। कोई माप चिंता दे तो अपने डॉक्टर से संपर्क करें।',
    vit_crit: 'यह माप सामान्य सीमा से बहुत दूर है। अगर आपको बेचैनी हो तो 112 पर कॉल करें या अभी डॉक्टर को दिखाएँ।',
    vit_all: 'सभी माप ({n})', vit_lower: 'निचला: {v}', vit_home: 'घर पर लिए गए माप', qa_reading: 'माप जोड़ें', kick_wellness: 'सेहत की डायरी',
    kick_today: 'आज', kick_journal: 'डायरी और अगली मुलाक़ात', kick_habits: 'रोज़ की आदतें', kick_results: 'नतीजे', kick_meds: 'दवाइयाँ', kick_doctor: 'डॉक्टर के लिए', kick_about: 'आपके बारे में'
  }
};

let lang = 'en';
const BUNDLED = ['en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu', 'kn', 'ml', 'pa'];
let LANG_CODES = BUNDLED.slice();
const LANG_RTL = {};
const SITE_MAPS = {};
try { const l = localStorage.getItem('sehat_lang'); if (/^[a-z]{2,3}$/.test(l || '')) lang = l; } catch (e) { /* ignore */ }
/* The guide's fixed answers (faq.js) are English; their translations live with the site pages. */
function siteText(text) { const m = SITE_MAPS[lang]; return (m && m[text]) || text; }
async function loadSiteMap(code) {
  if (code === 'en' || SITE_MAPS[code] || BUNDLED.indexOf(code) < 0) return;
  try { const r = await fetch('/i18n/site-' + code + '.json'); SITE_MAPS[code] = r.ok ? await r.json() : {}; } catch (e) { SITE_MAPS[code] = {}; }
}
/* Languages beyond the ten bundled ones: labels are machine-translated in small batches the
   first time the language is chosen, shown as they arrive, and cached in this browser. */
const filling = {};
async function fillLang(code) {
  // English and Hindi are written by hand and complete. Every other language, the bundled ones
  // included, has any label it is still missing translated here and remembered on this device.
  if (code === 'en' || code === 'hi' || filling[code] || !STR[code]) return;
  filling[code] = true;
  const keys = Object.keys(STR.en).filter(k => !(k in STR[code]));
  for (let i = 0; i < keys.length; i += 35) {
    const texts = {};
    keys.slice(i, i + 35).forEach(k => { texts[k] = STR.en[k]; });
    try {
      const r = await api('/api/translate', { lang: code, texts });
      Object.assign(STR[code], r.translations || {});
      try { localStorage.setItem('sehat_i18n_' + code, JSON.stringify(STR[code])); } catch (x) { /* ignore */ }
      if (lang === code) render();
    } catch (e) { break; }  // rate limited or offline: keep English for the rest, retry next visit
  }
  filling[code] = false;
}
async function loadLangList() {
  try {
    const r = await api('/api/langs');
    const list = arr(r.languages);
    if (!list.length) return;
    LANG_CODES = list.map(l => l.code);
    list.forEach(l => { LANG_RTL[l.code] = !!l.rtl; });
    const sel = document.getElementById('langSel');
    if (sel) {
      const group = (label, items) => '<optgroup label="' + esc(label) + '">' + items.map(l => '<option value="' + esc(l.code) + '">' + esc(l.native) + (l.native === l.name ? '' : ' · ' + esc(l.name)) + '</option>').join('') + '</optgroup>';
      sel.innerHTML = group('Ready', list.filter(l => l.bundled)) + group('Translated on demand', list.filter(l => !l.bundled));
      sel.value = lang;
    }
    if (LANG_CODES.indexOf(lang) < 0) { lang = 'en'; render(); }
    else { await loadLang(lang); render(); fillLang(lang); }
  } catch (e) { /* keep the ten bundled languages */ }
}
/* English and Hindi labels are written by hand below. The other languages load a
   machine-translated label file on demand; any missing label falls back to English. */
async function loadLang(code) {
  if (STR[code]) return;
  if (BUNDLED.indexOf(code) < 0) {
    try { STR[code] = JSON.parse(localStorage.getItem('sehat_i18n_' + code) || '{}') || {}; } catch (e) { STR[code] = {}; }
    return;
  }
  let extra = {};
  try { extra = JSON.parse(localStorage.getItem('sehat_i18n_' + code) || '{}') || {}; } catch (e) { extra = {}; }
  try { const r = await fetch('/i18n/' + code + '.json'); STR[code] = Object.assign(extra, r.ok ? await r.json() : {}); }
  catch (e) { STR[code] = extra; }
}
async function setLang(code) {
  if (LANG_CODES.indexOf(code) < 0) code = 'en';
  await loadLang(code);
  loadSiteMap(code);
  lang = code;
  fillLang(code);
  try { localStorage.setItem('sehat_lang', lang); } catch (x) { /* ignore */ }
  if (S.error) { S.error = null; S.retry = null; }
  render();
}

function t(key, vars) {
  let s = (STR[lang] && STR[lang][key]);
  if (s == null) s = STR.en[key];
  if (s == null) s = key;
  if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
  return s;
}

/* ================= Helpers ================= */
const $ = (sel, root) => (root || document).querySelector(sel);
function esc(s) {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
const clone = o => JSON.parse(JSON.stringify(o));
const isNum = v => v !== null && v !== '' && v !== undefined && typeof v !== 'boolean' && isFinite(Number(v));
const fmtNum = n => String(+Number(n).toFixed(2));
const arr = v => (Array.isArray(v) ? v : []);
const FLAGS = ['normal', 'low', 'high', 'critical', 'unknown'];
const TYPES = ['lab_report', 'prescription', 'discharge_summary', 'diagnostic_report', 'other'];
const FLAGC = { normal: '#15803D', low: '#B45309', high: '#B45309', critical: '#B91C1C', unknown: '#64748B' };
const isLow = c => c !== null && c !== undefined && c !== '' && isFinite(Number(c)) && Number(c) < 0.7;
const normFlag = f => (FLAGS.indexOf(f) >= 0 ? f : 'unknown');
const isAbn = f => f === 'low' || f === 'high' || f === 'critical';

function dateLocale() {  // the app language's own month names where the browser has them, else English (India)
  try { const l = lang + '-IN'; if (lang !== 'en' && Intl.DateTimeFormat.supportedLocalesOf(l).length) return l; } catch (e) { /* ignore */ }
  return 'en-IN';
}
function fmtDate(d, opts) {
  if (!d) return t('undated');
  const s = String(d).slice(0, 10);
  const dt = new Date(s + 'T00:00:00');
  if (isNaN(dt)) return String(d);
  return dt.toLocaleDateString(dateLocale(), opts || { day: 'numeric', month: 'short', year: 'numeric' });
}
function typeLabel(ty) { return TYPES.indexOf(ty) >= 0 ? t('type_' + ty) : t('type_other'); }
function badge(flag) { const f = normFlag(flag); return '<span class="flag f-' + f + '">' + esc(t('flag_' + f)) + '</span>'; }
/* Review screen: a doubtful item stays marked until the user confirms it or corrects it. */
function reviewTag(x, kind, i) {
  if (x.verified) return '<span class="tag green">' + esc(t('ok_done')) + '</span>';
  if (!isLow(x.confidence)) return '';
  return '<span class="tag amber" title="' + esc(t('ok_hint')) + '">' + esc(t('low_conf')) + '</span>' +
    '<button type="button" class="btn small secondary okrow" data-act="okrow" data-kind="' + kind + '" data-i="' + i + '">' + esc(t('ok_row')) + '</button>';
}
function verifyItem(x) {
  if (!x || x.verified || !isLow(x.confidence)) return false;
  x.read_confidence = x.confidence; x.confidence = 1; x.verified = true;
  return true;
}
function lowTag(c) { return isLow(c) ? '<span class="tag amber">' + esc(t('low_conf')) + '</span>' : ''; }
function refText(x) {
  if (x.ref_text) return x.ref_text;
  const lo = isNum(x.ref_low), hi = isNum(x.ref_high);
  if (lo && hi) return fmtNum(x.ref_low) + ' - ' + fmtNum(x.ref_high);
  if (lo) return '>= ' + fmtNum(x.ref_low);
  if (hi) return '<= ' + fmtNum(x.ref_high);
  return '-';
}
function nl(s) { return esc(s); }

function normalizeRecord(r) {
  r = r && typeof r === 'object' ? r : {};
  r.id = r.id || ('rec_' + Math.random().toString(36).slice(2, 8));
  r.doc_type = TYPES.indexOf(r.doc_type) >= 0 ? r.doc_type : 'other';
  r.title = r.title == null ? '' : r.title;
  r.patient = r.patient && typeof r.patient === 'object' ? r.patient : {};
  r.tests = arr(r.tests).map(x => Object.assign({ name: '', value: '', unit: '', ref_low: null, ref_high: null, flag: 'unknown' }, x || {}));
  r.medicines = arr(r.medicines).map(x => Object.assign({ name: '' }, x || {}));
  r.diagnoses = arr(r.diagnoses).map(x => (typeof x === 'string' ? { name: x, confidence: 1 } : Object.assign({ name: '' }, x || {})));
  r.advice = arr(r.advice).map(x => (x == null ? '' : String(x)));
  r.warnings = arr(r.warnings);
  r.unread = arr(r.unread);
  r.explanation = r.explanation && typeof r.explanation === 'object' ? r.explanation : {};
  return r;
}
const lite = r => { const c = clone(r); delete c.explanation; return c; };

/* ================= Storage ================= */
const mem = { records: new Map(), files: new Map(), meta: new Map() };
let dbPromise = null;
function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise(resolve => {
    try {
      const rq = indexedDB.open('sehat', 1);
      rq.onupgradeneeded = () => {
        const d = rq.result;
        d.createObjectStore('records', { keyPath: 'id' });
        d.createObjectStore('files', { keyPath: 'id' });
        d.createObjectStore('meta');
      };
      rq.onsuccess = () => resolve(rq.result);
      rq.onerror = () => resolve(null);
      rq.onblocked = () => resolve(null);
    } catch (e) { resolve(null); }
  });
  return dbPromise;
}
function idbReq(db, store, mode, fn) {
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(store, mode);
      const r = fn(tx.objectStore(store));
      tx.oncomplete = () => resolve(r ? r.result : undefined);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    } catch (e) { reject(e); }
  });
}
async function dbGetAll(store) {
  const db = await openDB();
  if (db) { try { return await idbReq(db, store, 'readonly', o => o.getAll()); } catch (e) { /* fall back */ } }
  return Array.from(mem[store].values());
}
async function dbGet(store, key) {
  const db = await openDB();
  if (db) { try { const v = await idbReq(db, store, 'readonly', o => o.get(key)); return v === undefined ? null : v; } catch (e) { /* fall back */ } }
  return mem[store].has(key) ? mem[store].get(key) : null;
}
async function dbPut(store, val, key) {
  mem[store].set(store === 'meta' ? key : val.id, val);
  const db = await openDB();
  if (db) { try { await idbReq(db, store, 'readwrite', o => (store === 'meta' ? o.put(val, key) : o.put(val))); } catch (e) { /* mem has it */ } }
}
async function dbDel(store, key) {
  mem[store].delete(key);
  const db = await openDB();
  if (db) { try { await idbReq(db, store, 'readwrite', o => o.delete(key)); } catch (e) { /* ignore */ } }
}
async function dbClear(store) {
  mem[store].clear();
  const db = await openDB();
  if (db) { try { await idbReq(db, store, 'readwrite', o => o.clear()); } catch (e) { /* ignore */ } }
}

/* ================= State ================= */
const S = {
  view: 'add', stage: 'idle', step: 0,
  records: [], patient: null, vitals: [],
  draft: null, editingId: null, pendingFile: null, previewFile: null, dirty: false, reflag: false,
  detailId: null, filter: 'all',
  overview: {}, chat: [], asking: false,
  fhir: null, error: null, retry: null, samples: null, busy: {}, notice: null
};
const getRec = id => S.records.find(r => r.id === id) || null;

/* ================= API ================= */
async function api(path, body, signal) {
  const opt = body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
  if (signal) opt.signal = signal;
  let r;
  try { r = await fetch(path, opt); } catch (e) {
    if (signal && signal.aborted) throw new Error(t('err_busy'));  // timed out or cancelled: do not retry
    await new Promise(ok => setTimeout(ok, 1200));
    try { r = await fetch(path, opt); } catch (e2) { throw new Error(signal && signal.aborted ? t('err_busy') : t('err_network')); }
  }
  let j = null;
  try { j = await r.json(); } catch (e) { /* not json */ }
  if (!r.ok) {
    const err = new Error((j && j.error) || t('err_server', { code: r.status }));
    err.code = j && j.code;
    throw err;
  }
  return j || {};
}
function showError(msg, retry) {
  S.error = msg || t('err_generic');
  S.retry = retry || null;
  paintError();
}
function clearError() { S.error = null; S.retry = null; paintError(); }
function paintError() {
  const el = $('#err');
  if (!el) return;
  if (!S.error) { el.innerHTML = ''; return; }
  el.innerHTML = '<div class="banner" role="alert"><div>' + esc(S.error) + '</div><div class="acts">' +
    (S.retry ? '<button type="button" class="btn small secondary" data-act="retry">' + esc(t('retry')) + '</button>' : '') +
    '<button type="button" class="btn small link" data-act="dismiss">' + esc(t('dismiss')) + '</button></div></div>';
}

/* ================= Files / preview ================= */
function guessMime(name) {
  const n = String(name || '').toLowerCase();
  if (n.endsWith('.pdf')) return 'application/pdf';
  if (n.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  if (n.endsWith('.txt')) return 'text/plain';
  if (n.endsWith('.png')) return 'image/png';
  if (n.endsWith('.webp')) return 'image/webp';
  if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg';
  return '';
}
function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result);
    fr.onerror = () => reject(new Error(t('err_generic')));
    fr.readAsDataURL(file);
  });
}
/* Upload size drives reading time: 1600 px on the long side at JPEG 0.8 keeps printed and
   handwritten text sharp while a 12 MP phone photo goes up as roughly 250 KB instead of several MB. */
const UPLOAD_SIDE = 1600, UPLOAD_QUALITY = 0.8;
function downscale(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let w = img.naturalWidth, h = img.naturalHeight;
      const m = Math.max(w, h);
      if (m > UPLOAD_SIDE) { const k = UPLOAD_SIDE / m; w = Math.round(w * k); h = Math.round(h * k); }
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const x = c.getContext('2d');
      x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
      x.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', UPLOAD_QUALITY));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error(t('err_image'))); };
    img.src = url;
  });
}
function dataUrlText(d) {
  try {
    const bin = atob(String(d).split(',')[1] || '');
    const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch (e) { return ''; }
}
const blobCache = new Map();
function pdfUrl(f) {
  const key = (f.id || 'pending') + ':' + f.dataUrl.length;
  if (!blobCache.has(key)) {
    const bin = atob(f.dataUrl.split(',')[1] || '');
    const a = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    blobCache.set(key, URL.createObjectURL(new Blob([a], { type: 'application/pdf' })));
  }
  return blobCache.get(key);
}
const safeUrl = u => (/^(\/|https?:\/\/)/.test(String(u || '')) && !/^\/\//.test(String(u || '')) ? String(u) : '');
function urlFile(r) { const u = r && safeUrl(r.file_url); return u ? { mime: guessMime(u.split('?')[0]), url: u } : null; }
function previewHTML(f) {
  if (f && !f.dataUrl && f.url && safeUrl(f.url)) {
    const um = f.mime || guessMime(String(f.url).split('?')[0]);
    if (um === 'application/pdf') return '<embed src="' + esc(f.url) + '" type="application/pdf">';
    return '<img src="' + esc(f.url) + '" alt="' + esc(t('original')) + '">';
  }
  if (!f || !f.dataUrl) return '<p class="muted">' + esc(t('no_preview')) + '</p>';
  const m = f.mime || '';
  try {
    if (m.indexOf('image/') === 0) return '<img src="' + esc(f.dataUrl) + '" alt="' + esc(t('original')) + '">';
    if (m === 'application/pdf') return '<embed src="' + esc(pdfUrl(f)) + '" type="application/pdf">';
    if (m === 'text/plain') return '<pre>' + esc(dataUrlText(f.dataUrl)) + '</pre>';
  } catch (e) { /* fall through */ }
  return '<p class="muted">' + esc(t('no_preview')) + '</p>';
}

/* ================= Upload pipeline ================= */
let stepTimer = null;
function startStepper() {
  stopStepper();
  S.step = 0;
  stepTimer = setInterval(() => {
    if (S.step < 2) { S.step++; if (S.view === 'add' && S.stage === 'processing') render(); }
  }, 1600);
}
function stopStepper() { if (stepTimer) { clearInterval(stepTimer); stepTimer = null; } }
/* elapsed clock on the reading screen ("0:23"); updates the one element, no re-render */
let elapsedTimer = null;
const fmtElapsed = ms => { const n = Math.max(0, Math.floor(ms / 1000)); return Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0'); };
function startElapsed(run) {
  stopElapsed();
  elapsedTimer = setInterval(() => { const el = document.getElementById('rdTimer'); if (el) el.textContent = fmtElapsed(Date.now() - run.t0); }, 500);
}
function stopElapsed() { if (elapsedTimer) { clearInterval(elapsedTimer); elapsedTimer = null; } }
function stopRead() { stopStepper(); stopElapsed(); }
const READ_LIMIT_MS = 75000, OCR_LIMIT_MS = 60000;

/* Backup reader: when no vision model is free, read the image on this device
   with Tesseract and let the server structure the text. */
let tesseractLoading = null;
function loadTesseract() {
  if (window.Tesseract) return Promise.resolve();
  if (!tesseractLoading) {
    tesseractLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
      s.onload = resolve;
      s.onerror = () => { tesseractLoading = null; reject(new Error(t('err_busy'))); };
      document.head.appendChild(s);
    });
  }
  return tesseractLoading;
}
async function ocrOnDevice(dataUrl, signal) {
  let worker = null, tm = null, onAbort = null;
  const limit = new Promise((_, reject) => {
    tm = setTimeout(() => reject(new Error(t('err_busy'))), OCR_LIMIT_MS);  // 60 s cap on a slow phone
    onAbort = () => reject(new Error(t('err_busy')));
    if (signal) { if (signal.aborted) onAbort(); else signal.addEventListener('abort', onAbort); }
  });
  const work = (async () => {
    await loadTesseract();
    worker = await window.Tesseract.createWorker('eng+hin');
    const out = await worker.recognize(dataUrl);
    return (out && out.data && out.data.text) || '';
  })();
  work.catch(() => { /* the limit already reported it */ });
  try { return await Promise.race([limit, work]); }
  finally {
    clearTimeout(tm);
    if (signal && onAbort) signal.removeEventListener('abort', onAbort);
    Promise.resolve(work).then(() => worker && worker.terminate(), () => worker && worker.terminate()).catch(() => {});
    if (worker) { try { worker.terminate().catch(() => {}); } catch (e) { /* ignore */ } }
  }
}
/* PDF backup reader: a typed PDF gives its text straight from pdf.js; a scanned one has its first pages
   drawn to images and read with the same on-device OCR as photos. */
let pdfjsLoading = null;
function loadPdfjs() {
  if (window.pdfjsLib) return Promise.resolve();
  if (!pdfjsLoading) {
    pdfjsLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; resolve(); };
      s.onerror = () => { pdfjsLoading = null; reject(new Error(t('err_busy'))); };
      document.head.appendChild(s);
    });
  }
  return pdfjsLoading;
}
async function pdfOnDevice(dataUrl, signal) {
  await loadPdfjs();
  const bin = atob(String(dataUrl).split(',')[1] || ''), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const pdf = await window.pdfjsLib.getDocument({ data: bytes }).promise, pages = Math.min(pdf.numPages, 5);
  let text = '';
  for (let n = 1; n <= pages; n++) {
    const c = await (await pdf.getPage(n)).getTextContent();
    text += c.items.map(it => it.str + (it.hasEOL ? '\n' : ' ')).join('') + '\n';
  }
  if (text.replace(/\s/g, '').length >= 40) return text;
  text = '';  // scanned PDF: OCR the first pages as images
  for (let n = 1; n <= Math.min(pages, 3); n++) {
    if (signal && signal.aborted) break;
    const page = await pdf.getPage(n), vp = page.getViewport({ scale: 2 }), cv = document.createElement('canvas');
    cv.width = vp.width; cv.height = vp.height;
    await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
    text += await ocrOnDevice(cv.toDataURL('image/jpeg', 0.9), signal) + '\n';
  }
  return text;
}
/* One read with the time limits: 75 s for each /api/extract call, 60 s for the on-device backup reader.
   run = { ctl: AbortController }. Shared with bulk.js. */
async function extractLimited(run, name, outMime, data, dataUrl, isImg, sampleId) {
  const sig = run.ctl.signal;
  const lim = ms => { clearTimeout(run.tm); run.tm = setTimeout(() => run.ctl.abort(), ms); };
  lim(READ_LIMIT_MS);
  try {
    let res;
    try {
      res = await api('/api/extract', { filename: name, mime: outMime, data, lang, sample_id: sampleId || null, skip: skipGet() }, sig);
      skipSet(res.resting);
    } catch (e) {
      const isPdf = outMime === 'application/pdf';
      if (e.code !== 'vision_unavailable' || !(isImg || isPdf)) throw e;
      clearTimeout(run.tm);
      let text = '';
      try { text = isPdf ? await pdfOnDevice(dataUrl, sig) : await ocrOnDevice(dataUrl, sig); } catch (e2) { throw new Error(t('err_busy')); }
      if (text.replace(/\s/g, '').length < 20) throw new Error(t('err_busy'));
      lim(READ_LIMIT_MS);
      res = await api('/api/extract', { filename: name, mime: 'text/plain', data: textToBase64(text), lang, ocr: 'tesseract' }, sig);
    }
    return res;
  } finally { clearTimeout(run.tm); }
}
function textToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/* A reading with no medicines, tests or diagnoses is not shown as an empty record. */
function unreadable(r) {
  if (!arr(r && r.tests).length && !arr(r && r.medicines).length && !arr(r && r.diagnoses).length) return true;
  // read, but so poorly that showing it would mislead: send the person to their doctor instead
  return isNum(r.overall_confidence) && Number(r.overall_confidence) < 0.3;
}
async function handleFile(file, sampleId) {
  if (!file) return;
  const mime = file.type || guessMime(file.name);
  const isImg = mime.indexOf('image/') === 0;
  if (!(isImg || mime === 'application/pdf' || mime === 'text/plain' || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) return showError(t('err_type'));
  if (!isImg && file.size > 3 * 1024 * 1024) return showError(t('err_size'));
  clearError();
  if (S.readRun) { S.readRun.cancelled = true; S.readRun.ctl.abort(); clearTimeout(S.readRun.tm); }
  const run = S.readRun = { ctl: new AbortController(), t0: Date.now(), tm: null };
  S.view = 'add'; S.stage = 'processing'; S.step = 0; S.editingId = null;
  render();
  startElapsed(run);
  try {
    let dataUrl, outMime = mime;
    if (isImg) { dataUrl = await downscale(file); outMime = 'image/jpeg'; }
    else dataUrl = await readAsDataURL(file);
    if (S.readRun !== run) return;  // cancelled
    const data = String(dataUrl).split(',')[1] || '';
    const fileObj = { mime: outMime, dataUrl };
    startStepper();
    const res = await extractLimited(run, file.name || 'upload', outMime, data, dataUrl, isImg, sampleId);
    if (S.readRun !== run) return;
    stopRead(); S.readRun = null;
    const read = normalizeRecord(res.record);
    if (unreadable(read)) throw new Error(t('err_unread'));  // nothing usable: say so instead of an empty review
    S.draft = read;
    S.pendingFile = fileObj; S.previewFile = null;
    S.dirty = false; S.reflag = false;
    S.stage = 'review';
    render();
    window.scrollTo(0, 0);
  } catch (e) {
    if (run.cancelled || (S.readRun && S.readRun !== run)) return;  // cancelled, or a newer read took over
    stopRead(); S.readRun = null;
    S.stage = 'idle';
    render();
    showError(e.message, () => handleFile(file, sampleId));
  }
}
function cancelRead() {
  const run = S.readRun;
  if (run) { run.cancelled = true; clearTimeout(run.tm); run.ctl.abort(); }
  S.readRun = null; stopRead();
  S.stage = 'idle'; S.view = 'add'; clearError(); render();
}

async function runSample(id) {
  const s = arr(S.samples).find(x => x.id === id);
  if (!s) return;
  clearError();
  try {
    const r = await fetch(s.url);
    if (!r.ok) throw new Error(t('err_server', { code: r.status }));
    const b = await r.blob();
    const name = String(s.url).split('?')[0].split('/').pop() || (s.id + '.png');
    const ty = (b.type && b.type !== 'application/octet-stream') ? b.type : guessMime(name);
    handleFile(new File([b], name, { type: ty }), s.id);
  } catch (e) {
    showError(e.message || t('err_network'), () => runSample(id));
  }
}

async function loadSamples() {
  try {
    const r = await api('/api/samples');
    S.samples = arr(r.samples);
  } catch (e) { S.samples = []; }
  if (S.view === 'add' && S.stage === 'idle') render();
}

async function loadDemo() {
  if (S.busy.demo) return;
  S.busy.demo = true; clearError(); render();
  try {
    const d = await api('/api/demo');
    const p = d.patient || {};
    S.patient = { name: p.name || null, age: p.age == null ? null : p.age, sex: p.sex || null, abha: p.abha || null };
    await dbPut('meta', S.patient, 'patient');
    for (const raw of arr(d.records)) {
      const r = normalizeRecord(raw);
      r.profile = 'self';  // family.js: the bundled demo records are Jay's (the 'self' profile)
      await saveRecordLocal(r);
    }
    await famDemo();  // family.js: adds Jay's father and son, with sample records for the father
    if (typeof journalSeedDemo === 'function') journalSeedDemo(); /* journal.js */
    S.view = 'timeline'; S.detailId = null;
  } catch (e) {
    showError(e.message, loadDemo);
  }
  S.busy.demo = false; render();
}

async function saveRecordLocal(r) {
  const elsewhere = famStamp(r);  // family.js: stamps r.profile; true if it belongs to another profile
  await dbPut('records', r);
  if (elsewhere) return;
  const i = S.records.findIndex(x => x.id === r.id);
  if (i >= 0) S.records[i] = r; else S.records.push(r);
}

/* ================= Review / save ================= */
function setPath(obj, path, val) {
  const parts = path.split('.');
  let o = obj;
  for (let i = 0; i < parts.length - 1; i++) { o = o[parts[i]]; if (o == null) return; }
  o[parts[parts.length - 1]] = val;
}
function onEdit(el) {
  if (!S.draft) return;
  const path = el.dataset.path;
  let v = el.value;
  if (el.dataset.num === 'ref') v = isNum(v) ? Number(v) : null;
  else if (el.dataset.num === 'val') v = isNum(v) ? Number(v) : v;
  setPath(S.draft, path, v);
  const hit = /^(tests|medicines|diagnoses)\.(\d+)\./.exec(path);
  if (hit) verifyItem(S.draft[hit[1]][Number(hit[2])]);
  S.dirty = true;
  if (/^tests\./.test(path) && /\.(value|unit|ref_low|ref_high|name|flag)$/.test(path)) S.reflag = true;
}
function addRow(kind) {
  const d = S.draft; if (!d) return;
  if (kind === 'tests') d.tests.push({ name: '', value: '', unit: '', ref_low: null, ref_high: null, ref_text: null, ref_source: null, flag: 'unknown', confidence: 1 });
  else if (kind === 'medicines') d.medicines.push({ name: '', generic: null, strength: '', dose: '', frequency: '', timing: '', duration: '', instructions: '', known: true, confidence: 1 });
  else if (kind === 'diagnoses') d.diagnoses.push({ name: '', confidence: 1 });
  else if (kind === 'advice') d.advice.push('');
  S.dirty = true;
  if (kind === 'tests') S.reflag = true;
  render();
}
function delRow(kind, i) {
  const d = S.draft; if (!d || !Array.isArray(d[kind])) return;
  d[kind].splice(i, 1);
  S.dirty = true;
  if (kind === 'tests') S.reflag = true;
  render();
}
function emptyToNull(o, keys) { keys.forEach(k => { if (o[k] === '' || o[k] === undefined) o[k] = null; }); }

async function saveDraft(target) {
  if (!S.draft || S.busy.save) return;
  const first = v => String(v || '').trim().toLowerCase().replace(/^(mr|mrs|ms|smt|shri|sri|dr)\.?\s+/, '').split(/\s+/)[0];
  const docName = (S.draft.patient || {}).name, myName = (S.patient || {}).name;
  if (typeof target !== 'string') target = null;
  if (!S.editingId && !target && first(docName) && first(myName) && first(docName) !== first(myName)) { askWho(); return; }  // in-page "whose document is it?" dialog
  const toOther = !!(target && window.SehatFamily && target !== SehatFamily.active());
  S.busy.save = true; clearError(); render();
  try {
    let rec = clone(S.draft);
    emptyToNull(rec, ['date', 'facility', 'doctor', 'follow_up']);
    rec.tests = rec.tests.filter(x => x.name || (x.value !== '' && x.value != null));
    rec.medicines = rec.medicines.filter(x => x.name);
    rec.diagnoses = rec.diagnoses.filter(x => x.name);
    rec.advice = rec.advice.filter(x => x && x.trim());
    rec.medicines.forEach(m => emptyToNull(m, ['generic', 'strength', 'dose', 'frequency', 'timing', 'duration', 'instructions']));
    const stillLow = rec.tests.concat(rec.medicines, rec.diagnoses).filter(x => isLow(x.confidence)).length;
    rec.warnings = arr(rec.warnings).map(w => /item\(s\) were read with low confidence/.test(w) ? (stillLow ? stillLow + ' item(s) were read with low confidence and are marked below.' : null) : w).filter(Boolean);
    if (S.reflag) {
      const res = await api('/api/reflag', { record: lite(rec) });
      if (res.record) {
        const ex = rec.explanation;
        rec = Object.assign({}, rec, normalizeRecord(res.record));
        rec.explanation = ex;
      }
    }
    if (S.dirty || S.reflag) rec.explanation = {};
    rec = normalizeRecord(rec);
    if (S.editingId && S.editingId !== rec.id) rec.id = S.editingId;
    if (toOther) rec.profile = target;  // family.js famStamp keeps it out of this profile's S.records
    await saveRecordLocal(rec);
    if (!S.editingId && !toOther && window.SehatRem) { try { SehatRem.onSaved(rec); } catch (x) { /* reminders.js: copilot actions */ } }
    if (S.pendingFile) await dbPut('files', { id: rec.id, mime: S.pendingFile.mime, dataUrl: S.pendingFile.dataUrl });
    const p = rec.patient || {};
    if (!toOther && (!S.patient || !S.patient.name) && (p.name || p.age || p.sex)) {
      S.patient = { name: p.name || null, age: p.age || null, sex: p.sex || null, abha: S.patient ? S.patient.abha || null : null };
      await dbPut('meta', S.patient, profKey('patient'));
    }
    S.draft = null; S.pendingFile = null; S.previewFile = null; S.stage = 'idle'; S.editingId = null;
    S.overview = {};
    if (toOther) {
      const who = (SehatFamily.targets().find(x => x.id === target) || {}).name || '';
      S.moved = { id: target, name: who };
      if (!(window.SehatBulk && SehatBulk.afterSave(rec))) { S.view = 'add'; S.stage = 'idle'; }
      S.busy.save = false; render(); window.scrollTo(0, 0); return;
    }
    if (window.SehatBulk && SehatBulk.afterSave(rec)) { S.busy.save = false; render(); window.scrollTo(0, 0); return; }  // bulk.js: back to the queue
    S.view = 'detail'; S.detailId = rec.id;
    S.busy.save = false;
    render();
    window.scrollTo(0, 0);
  } catch (e) {
    S.busy.save = false;
    render();
    showError(e.message, () => saveDraft(target));
  }
}

/* ---- "Whose document is it?" dialog (replaces the old confirm) ---- */
const whoFirst = v => String(v || '').trim().toLowerCase().replace(/^(mr|mrs|ms|smt|shri|sri|dr)\.?\s+/, '').split(/\s+/)[0];
function whoClose() { const m = document.getElementById('whoModal'); if (m) m.remove(); S.who = null; }
function askWho() {
  const pt = (S.draft && S.draft.patient) || {};
  const ageM = String(pt.age == null ? '' : pt.age).match(/\d+/), sx = String(pt.sex || '');
  S.who = { name: String(pt.name || '').trim(), age: ageM ? ageM[0] : '', sex: /^f/i.test(sx) ? 'F' : /^m/i.test(sx) ? 'M' : (sx ? 'O' : ''), step: 'ask', err: '' };
  paintWho();
}
function paintWho() {
  let m = document.getElementById('whoModal');
  const w = S.who;
  if (!w) { if (m) m.remove(); return; }
  if (!m) { m = document.createElement('div'); m.id = 'whoModal'; m.className = 'fam-modal'; document.body.appendChild(m); }
  const F = window.SehatFamily, a = w.name, esc2 = esc;
  let h;
  if (w.step === 'add') {
    const opt = (v, l, cur) => '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(l) + '</option>';
    h = '<form id="whoForm" novalidate><h2>' + esc(t('who_add_t', { a })) + '</h2><p class="muted small">' + esc(t('who_add_hint')) + '</p>' +
      '<label>' + esc(t('fam_name')) + '<input name="name" maxlength="60" autocomplete="off" value="' + esc(w.name) + '" required></label>' +
      '<div class="fam-2"><label>' + esc(t('fam_relation')) + '<select name="relation">' + ['father', 'mother', 'spouse', 'child', 'brother', 'sister', 'grandparent', 'friend', 'other'].map(r => opt(r, t('rel_' + r), w.rel || 'other')).join('') + '</select></label>' +
      '<label>' + esc(t('fam_age')) + '<input name="age" type="number" inputmode="numeric" min="0" max="120" value="' + esc(w.age) + '"></label>' +
      '<label>' + esc(t('fam_sex')) + '<select name="sex">' + opt('', t('fam_sex_none'), w.sex) + opt('M', t('fam_sex_m'), w.sex) + opt('F', t('fam_sex_f'), w.sex) + opt('O', t('fam_sex_o'), w.sex) + '</select></label></div>' +
      '<p class="fam-err" role="alert">' + esc(w.err || '') + '</p><div class="row fam-btns"><button type="submit" class="btn">' + esc(t('fam_save')) + '</button>' +
      '<button type="button" class="btn secondary" data-act="who_back">' + esc(t('who_back')) + '</button></div></form>';
  } else {
    const all = F ? F.targets() : [], f0 = whoFirst(a);
    const likely = all.filter(p => f0 && String(p.name).toLowerCase().split(/\s+/).some(x => x === f0));
    const list = likely.length ? likely : all.slice(0, 6);
    const btn = p => '<button type="button" class="btn secondary" data-act="who_to" data-id="' + esc(p.id) + '">' + esc(p.name) + ' <span class="muted small">(' + esc(t('rel_' + p.relation)) + ')</span></button>';
    h = '<div id="whoBox"><h2>' + esc(t('who_title', { a })) + '</h2><p>' + esc(t('who_q', { a })) + '</p><div class="who-list">' +
      '<button type="button" class="btn" data-act="who_me">' + esc(t('who_me')) + '</button>' +
      (list.length ? '<p class="muted small" style="margin:6px 0 0">' + esc(t(likely.length ? 'who_likely' : 'who_all')) + '</p>' + list.map(btn).join('') : '') +
      (F && F.canAdd() ? '<button type="button" class="btn secondary" data-act="who_new">+ ' + esc(t('who_add', { a })) + '</button>' : '') +
      '</div><p class="fam-err" role="alert">' + esc(w.err || '') + '</p><div class="row fam-btns"><button type="button" class="btn link" data-act="who_cancel">' + esc(t('cancel')) + '</button></div></div>';
  }
  m.innerHTML = '<div class="fam-dialog" role="dialog" aria-modal="true" aria-label="' + esc(t('who_title', { a })) + '">' + h + '</div>';
  const f = m.querySelector('input,button'); if (f) f.focus();
}
async function whySave(id) { whoClose(); await saveDraft(id); }  // a failed save shows the normal error banner with Try again
document.addEventListener('submit', async e => {
  if (!e.target || e.target.id !== 'whoForm') return;
  e.preventDefault();
  const f = e.target.elements, w = S.who, F = window.SehatFamily;
  if (!w || !F) return;
  w.name = f.name.value.trim(); w.age = f.age.value.trim(); w.sex = f.sex.value; w.rel = f.relation.value;
  const ageN = w.age === '' ? null : Number(w.age);
  if (!w.name) { w.err = t('fam_err_name'); return paintWho(); }
  if (ageN !== null && !(Number.isInteger(ageN) && ageN >= 0 && ageN <= 120)) { w.err = t('fam_err_age'); return paintWho(); }
  let id = null;
  try { id = await F.addMember({ name: w.name, relation: w.rel, age: ageN, sex: w.sex || null }); } catch (x) { /* shown below */ }
  if (!id) { w.err = t('who_err'); return paintWho(); }
  whySave(id);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && S.who) whoClose(); });
function discardDraft() {
  const wasEdit = S.editingId;
  if (window.SehatBulk && !wasEdit) SehatBulk.onDiscard();  // bulk.js: a discarded batch draft counts as skipped
  S.draft = null; S.pendingFile = null; S.previewFile = null; S.stage = 'idle'; S.editingId = null;
  if (wasEdit && getRec(wasEdit)) { S.view = 'detail'; S.detailId = wasEdit; } else S.view = 'add';
  clearError(); render();
}

async function startEdit(id) {
  const r = getRec(id); if (!r) return;
  S.draft = normalizeRecord(clone(r));
  S.editingId = id; S.pendingFile = null;
  S.previewFile = (await dbGet('files', id)) || urlFile(r);
  S.dirty = false; S.reflag = false;
  S.view = 'add'; S.stage = 'review';
  render(); window.scrollTo(0, 0);
}

async function deleteRecord(id) {
  if (!confirm(t('confirm_delete'))) return;
  await dbDel('records', id);
  await dbDel('files', id);
  S.records = S.records.filter(r => r.id !== id);
  S.overview = {};
  S.view = 'timeline'; S.detailId = null;
  render();
}

/* ================= View: Add ================= */
function movedNote() {
  const m = S.moved;
  if (!m) return '';
  return '<div class="notice info moved-note" role="status"><span>' + esc(t('moved_to', { name: m.name })) + '</span><span class="row"><button type="button" class="btn small" data-act="moved_switch" data-id="' + esc(m.id) + '">' + esc(t('moved_switch', { name: m.name })) + '</button>' +
    '<button type="button" class="btn small link" data-act="moved_close">' + esc(t('dismiss')) + '</button></span></div>';
}
function viewAdd() {
  if (S.stage === 'processing') return viewProcessing();
  if (S.stage === 'review') return viewReview();
  const samples = S.samples === null
    ? '<p class="muted">' + esc(t('working')) + '</p>'
    : (S.samples.length
      ? '<div class="sample-row">' + S.samples.map(s =>
        '<button type="button" class="btn secondary small" data-act="sample" data-id="' + esc(s.id) + '">' + esc(s.title || s.id) + '</button>').join('') + '</div>'
      : '<p class="muted">' + esc(t('samples_none')) + '</p>');
  if (window.SehatBulk && S.bulk) return '<div class="page-head"><h1>' + esc(t('add_title')) + '</h1><p>' + esc(t('add_sub')) + '</p></div>' + movedNote() + SehatBulk.queueHTML();  // bulk.js
  return '<div class="page-head"><h1>' + esc(t('add_title')) + '</h1><p>' + esc(t('add_sub')) + '</p></div>' +
    movedNote() +
    (window.SehatRem ? SehatRem.actionsCard({ recent: true }) : '') /* reminders.js */ +
    '<div class="dropzone" id="drop">' +
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>' +
    '<h2>' + esc(t('drop_title')) + '</h2><p class="muted">' + esc(t('drop_hint')) + (window.SehatBulk ? ' ' + esc(t('bulk_hint')) : '') + '</p>' +
    '<div class="row"><button type="button" class="btn" data-act="choose">' + esc(t('choose_file')) + '</button></div></div>' +
    '<ol class="how">' + [1, 2, 3].map(n => '<li><span class="how-n">' + n + '</span><div><strong>' + esc(t('how_' + n)) + '</strong><div class="muted small">' + esc(t('how_' + n + 's')) + '</div></div></li>').join('') + '</ol>' +
    '<p class="muted small consent">' + esc(t('consent')) + '</p>' +
    '<div class="card" style="margin-top:16px"><h2 style="margin-bottom:10px">' + esc(t('samples_title')) + '</h2>' + samples +
    '<div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--line)" class="row">' +
    '<button type="button" class="btn secondary" data-act="demo"' + (S.busy.demo ? ' disabled' : '') + '>' + esc(S.busy.demo ? t('working') : t('demo_btn')) + '</button>' +
    '<span class="muted small">' + esc(t('demo_hint')) + '</span></div></div>';
}

/* Reader models the server last reported as out of daily quota. Sent with the next upload so
   a fresh server instance skips them straight away. Forgotten after an hour. */
function skipGet() {
  try { const v = JSON.parse(localStorage.getItem('sehat_skip') || 'null'); return v && Date.now() - v.at < 36e5 ? v.models : []; } catch (e) { return []; }
}
function skipSet(models) {
  try { localStorage.setItem('sehat_skip', JSON.stringify({ at: Date.now(), models: arr(models) })); } catch (e) { /* storage blocked */ }
}
/* The server writes its notices in English. The fixed ones are shown in the reader's language. */
const WARN_MAP = [
  [/^This document is handwritten/, 'warn_hand'],
  [/^(\d+) line\(s\) could not be read/, 'warn_unread', 'n'],
  [/^(\d+) item\(s\) were read with low confidence/, 'warn_low', 'n'],
  [/^No date was found/, 'warn_nodate'],
  [/date on this document is in the future/, 'warn_future'],
  [/^The date was read as (\S+), more than two years/, 'warn_old', 'date'],
  [/^The date was read as (\S+)\. Handwritten/, 'warn_hdate', 'date'],
  [/far outside the usual range/, 'warn_critical'],
  [/does not look like a health record/, 'warn_notrecord'],
  [/live reader is busy/, 'warn_saved'],
  [/backup on-device reader/, 'warn_ocr']
];
function warnText(w) {
  for (const [re, key, arg] of WARN_MAP) {
    const m = re.exec(String(w || ''));
    if (m) return t(key, arg ? { [arg]: arg === 'date' ? fmtDate(m[1]) : m[1] } : undefined);
  }
  return w;
}
function viewProcessing() {
  const steps = ['step_read', 'step_extract', 'step_check', 'step_write'];
  return '<div class="page-head"><h1>' + esc(t('processing_title')) + '</h1></div><div class="card"><ol class="stepper">' +
    steps.map((k, i) => '<li class="' + (i < S.step ? 'done' : (i === S.step ? 'now' : '')) + '"><span class="dot"></span><span>' + esc(t(k)) + '</span></li>').join('') +
    '</ol><p class="muted small" style="margin:14px 0 0">' + esc(t('wait_hint')) + '</p>' +
    '<div class="read-time"><span class="muted small">' + esc(t('read_time')) + '</span><strong class="mono" id="rdTimer" aria-live="off">' + fmtElapsed(S.readRun ? Date.now() - S.readRun.t0 : 0) + '</strong>' +
    '<button type="button" class="btn small secondary" data-act="cancelread">' + esc(t('read_cancel')) + '</button></div></div>';
}

function fld(label, path, val, o) {
  o = o || {};
  return '<label class="fld ' + (o.cls || '') + '"><span>' + esc(label) + '</span><input type="' + (o.type || 'text') + '" class="' + (o.mono ? 'mono' : '') +
    '" data-path="' + esc(path) + '"' + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + (o.num ? ' data-num="' + o.num + '"' : '') + (o.inputmode ? ' inputmode="' + o.inputmode + '"' : '') +
    ' value="' + esc(val) + '"></label>';
}
function sel(label, path, val, opts, o) {
  o = o || {};
  return '<label class="fld ' + (o.cls || '') + '"><span>' + esc(label) + '</span><select data-path="' + esc(path) + '">' +
    opts.map(op => '<option value="' + esc(op[0]) + '"' + (op[0] === val ? ' selected' : '') + '>' + esc(op[1]) + '</option>').join('') + '</select></label>';
}

function srcAttr(x) { return x && x.source_text ? ' data-src="' + esc(x.source_text) + '"' + (x.page ? ' data-page="' + esc(x.page) + '"' : '') : ''; }
function srcLine(x) { return x && x.source_text ? '<div class="srcline"><span class="muted">' + esc(t('src_from')) + ':</span> ' + esc(x.source_text) + '</div>' : ''; }
/* Review screen: an empty optional field is not drawn as a blank box; it becomes a small "+ Field" chip that reveals the input.
   Revealed fields are remembered per item (WeakMap), so re-renders and row deletes never mix them up. Saved data is unchanged. */
const REVEALED = new WeakMap();
const isBlank = v => v == null || String(v).trim() === '';
const isRevealed = (x, f) => !!(REVEALED.get(x) || {})[f];
function optFields(x, kind, i, defs) {
  const p = kind + '.' + i + '.', shown = [], chips = [];
  defs.forEach(d => {
    if (!isBlank(x[d.f]) || isRevealed(x, d.f)) shown.push(fld(t(d.k), p + d.f, x[d.f], d.o));
    else chips.push('<button type="button" class="chip add" data-act="reveal" data-kind="' + kind + '" data-i="' + i + '" data-f="' + d.f + '">' + esc(t('add_f', { f: t(d.k) })) + '</button>');
  });
  return { html: shown.join(''), chips: chips.length ? '<div class="addchips">' + chips.join('') + '</div>' : '' };
}
function revealField(kind, i, f) {
  const x = S.draft && (S.draft[kind] || [])[i]; if (!x) return;
  const m = REVEALED.get(x) || {}; m[f] = true; REVEALED.set(x, m);
  render();
  const el = document.querySelector('[data-path="' + kind + '.' + i + '.' + f + '"]');
  if (el) el.focus();
}
function testRow(x, i) {
  const p = 'tests.' + i + '.';
  const src = x.ref_source === 'report' ? t('ref_report') : (x.ref_source === 'standard' ? t('ref_standard') : '');
  const opt = optFields(x, 'tests', i, [
    { f: 'unit', k: 't_unit', o: { mono: 1 } },
    { f: 'ref_low', k: 't_low', o: { mono: 1, num: 'ref', inputmode: 'decimal' } },
    { f: 'ref_high', k: 't_high', o: { mono: 1, num: 'ref', inputmode: 'decimal' } },
    { f: 'ref_text', k: 't_ref_text', o: {} }]);
  return '<div class="rowcard"' + srcAttr(x) + '><div class="fields">' +
    fld(t('t_name'), p + 'name', x.name, { cls: 'w2', ph: isBlank(x.name) ? t('t_name_ph') : '' }) +
    fld(t('t_value'), p + 'value', x.value, { mono: 1, num: 'val' }) +
    opt.html +
    sel(t('t_flag'), p + 'flag', normFlag(x.flag), FLAGS.map(f => [f, t('flag_' + f)])) +
    '</div>' + opt.chips + srcLine(x) + '<div class="foot"><div class="tags">' + badge(x.flag) + reviewTag(x, 'tests', i) +
    (src ? '<span class="muted small">' + esc(src) + '</span>' : '') +
    '</div><button type="button" class="xbtn" data-act="delrow" data-kind="tests" data-i="' + i + '">' + esc(t('remove')) + '</button></div></div>';
}
function medRow(x, i) {
  const p = 'medicines.' + i + '.';
  const opt = optFields(x, 'medicines', i, [
    { f: 'generic', k: 'm_generic', o: {} }, { f: 'strength', k: 'm_strength', o: { mono: 1 } }, { f: 'dose', k: 'm_dose', o: {} },
    { f: 'frequency', k: 'm_freq', o: {} }, { f: 'timing', k: 'm_timing', o: {} }, { f: 'duration', k: 'm_duration', o: {} },
    { f: 'instructions', k: 'm_instr', o: { cls: 'wide' } }]);
  return '<div class="rowcard"' + srcAttr(x) + '><div class="fields">' +
    fld(t('m_name'), p + 'name', x.name, { cls: 'w2', ph: isBlank(x.name) ? t('m_name_ph') : '' }) +
    opt.html +
    '</div>' + opt.chips + srcLine(x) + '<div class="foot"><div class="tags">' + reviewTag(x, 'medicines', i) +
    (x.known === false ? '<span class="tag amber">' + esc(t('unknown_med')) + '</span>' : '') +
    '</div><button type="button" class="xbtn" data-act="delrow" data-kind="medicines" data-i="' + i + '">' + esc(t('remove')) + '</button></div></div>';
}

function viewReview() {
  const d = S.draft;
  const f = S.pendingFile || S.previewFile;
  const lowN = d.tests.filter(x => isLow(x.confidence)).length + d.medicines.filter(x => isLow(x.confidence)).length + d.diagnoses.filter(x => isLow(x.confidence)).length;
  const oc = isNum(d.overall_confidence) ? Math.round(Number(d.overall_confidence) * 100) : null;
  const saving = !!S.busy.save;
  return '<div class="page-head"><h1>' + esc(S.editingId ? t('edit_title') : t('review_title')) + '</h1><p>' + esc(t('review_sub')) + '</p></div>' + (window.SehatBulk ? SehatBulk.reviewBanner() : '') /* bulk.js */ +
    '<div class="row" style="margin-bottom:14px">' +
    (d.handwritten ? '<span class="tag amber hw">' + esc(t('hw_check')) + '</span>' : '') +
    (oc !== null && !d.handwritten ? '<span class="small">' + esc(t('conf_label', { p: oc })) + '</span><span class="confbar ' + (oc < 70 ? 'low' : '') + '"><i style="width:' + Math.max(0, Math.min(100, oc)) + '%"></i></span>' : '') +
    (lowN ? '<span class="tag amber">' + esc(t('items_check', { n: lowN })) + '</span>' : '') + '</div>' +
    (oc !== null && !d.handwritten ? '<p class="muted small conf-note">' + esc(t('conf_note')) + '</p>' : '') +
    (d.warnings.length ? '<div class="notice"><strong>' + esc(t('warnings_title')) + '</strong><ul>' + d.warnings.map(w => '<li>' + esc(warnText(w)) + '</li>').join('') + '</ul></div>' : '') +
    (d.unread.length ? '<div class="card unread"><h3>' + esc(t('unread_title')) + '</h3><p class="muted small">' + esc(t('unread_sub')) + '</p><ul>' + d.unread.map(u => '<li><span class="mono">' + esc(u.text) + '</span>' + (u.reason ? ' <span class="muted small">(' + esc(u.reason) + ')</span>' : '') + '</li>').join('') + '</ul></div>' : '') +
    '<div class="review"><div class="card preview-card"><div class="preview-head"><h3>' + esc(t('original')) + '</h3><button type="button" class="btn small secondary" data-zoom="open">' + esc(t('zoom_open')) + '</button></div>' +
    '<div class="srcbox" id="srcbox"><div class="muted small">' + esc(t('src_box')) + '</div><div class="mono" id="srctext">' + esc(t('src_hint')) + '</div></div><div class="preview-doc" data-zoom="open">' + previewHTML(f) + '</div></div>' +
    '<div class="stack"><div class="card"><div class="fields">' +
    sel(t('f_type'), 'doc_type', d.doc_type, TYPES.map(ty => [ty, t('type_' + ty)])) +
    fld(t('f_date'), 'date', d.date, { type: 'date' }) +
    fld(t('f_title'), 'title', d.title, { cls: 'wide' }) +
    fld(t('f_facility'), 'facility', d.facility, { cls: 'w2' }) +
    fld(t('f_doctor'), 'doctor', d.doctor, { cls: 'w2' }) +
    fld(t('f_patient'), 'patient.name', (d.patient || {}).name, { cls: 'w2' }) +
    fld(t('f_age'), 'patient.age', (d.patient || {}).age, { cls: 'w2' }) +
    '</div></div>' +
    '<div class="card"><div class="sec-title"><h2>' + esc(t('sec_tests')) + '</h2><button type="button" class="btn small secondary" data-act="addrow" data-kind="tests">' + esc(t('add_test')) + '</button></div>' +
    (d.tests.length ? d.tests.map(testRow).join('') : '<p class="muted">' + esc(t('no_items')) + '</p>') + '</div>' +
    '<div class="card"><div class="sec-title"><h2>' + esc(t('sec_meds')) + '</h2><button type="button" class="btn small secondary" data-act="addrow" data-kind="medicines">' + esc(t('add_med')) + '</button></div>' +
    (d.medicines.length ? d.medicines.map(medRow).join('') : '<p class="muted">' + esc(t('no_items')) + '</p>') + '</div>' +
    '<div class="card"><div class="sec-title"><h2>' + esc(t('sec_dx')) + '</h2><button type="button" class="btn small secondary" data-act="addrow" data-kind="diagnoses">' + esc(t('add_dx')) + '</button></div>' +
    '<div class="chips">' + d.diagnoses.map((x, i) =>
      '<span class="chip-edit"><input type="text" data-path="diagnoses.' + i + '.name" value="' + esc(x.name) + '" aria-label="' + esc(t('sec_dx')) + '">' +
      reviewTag(x, 'diagnoses', i) +
      '<button type="button" class="xbtn" data-act="delrow" data-kind="diagnoses" data-i="' + i + '" aria-label="' + esc(t('remove')) + '">&times;</button></span>').join('') + '</div>' +
    (d.diagnoses.length ? '' : '<p class="muted">' + esc(t('no_items')) + '</p>') + '</div>' +
    '<div class="card"><div class="sec-title"><h2>' + esc(t('sec_advice')) + '</h2><button type="button" class="btn small secondary" data-act="addrow" data-kind="advice">' + esc(t('add_advice')) + '</button></div>' +
    d.advice.map((a, i) => '<div class="advice-row"><input type="text" data-path="advice.' + i + '" value="' + esc(a) + '" aria-label="' + esc(t('sec_advice')) + '">' +
      '<button type="button" class="xbtn" data-act="delrow" data-kind="advice" data-i="' + i + '">' + esc(t('remove')) + '</button></div>').join('') +
    (d.advice.length ? '' : '<p class="muted">' + esc(t('no_items')) + '</p>') +
    '<div class="fields" style="margin-top:10px">' + fld(t('f_followup'), 'follow_up', d.follow_up, { cls: 'wide' }) + '</div></div>' +
    '<div class="actions"><button type="button" class="btn" data-act="save"' + (saving ? ' disabled' : '') + '>' + esc(saving ? t('saving') : (S.editingId ? t('save_changes') : t('save'))) + '</button>' +
    '<button type="button" class="btn secondary" data-act="discard"' + (saving ? ' disabled' : '') + '>' + esc(S.editingId ? t('cancel') : t('discard')) + '</button></div>' +
    '</div></div>';
}

/* ================= View: Timeline ================= */
function sortedRecords() {
  return S.records.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
}
function viewTimeline() {
  const head = '<div class="page-head"><h1>' + esc(t('timeline_title')) + '</h1><p>' + esc(t('timeline_sub')) + '</p></div>';
  if (!S.records.length) {
    return head + '<div class="card empty"><p>' + esc(t('tl_empty')) + '</p><button type="button" class="btn" data-act="nav" data-view="add">' + esc(t('go_add')) + '</button></div>';
  }
  const present = TYPES.filter(ty => S.records.some(r => r.doc_type === ty));
  if (S.filter !== 'all' && present.indexOf(S.filter) < 0) S.filter = 'all';
  const chips = '<div class="chips" style="margin-bottom:6px"><button type="button" class="chip" data-act="filter" data-type="all" aria-pressed="' + (S.filter === 'all') + '">' + esc(t('filter_all')) + '</button>' +
    present.map(ty => '<button type="button" class="chip" data-act="filter" data-type="' + ty + '" aria-pressed="' + (S.filter === ty) + '">' + esc(t('type_' + ty)) + '</button>').join('') + '</div>';
  // for a new doctor: only the last N months, and only one condition
  const conds = [];
  S.records.forEach(r => arr(r.diagnoses).forEach(d => { const n = String((d && d.name) || '').trim(); if (n && !conds.some(c => c.toLowerCase() === n.toLowerCase())) conds.push(n); }));
  if (S.tlCond && !conds.some(c => c.toLowerCase() === S.tlCond.toLowerCase())) S.tlCond = '';
  const since = S.tlMonths ? new Date(Date.now() - S.tlMonths * 30.44 * 864e5).toISOString().slice(0, 10) : '';
  const hasCond = r => arr(r.diagnoses).some(d => String((d && d.name) || '').trim().toLowerCase() === S.tlCond.toLowerCase());
  const chip = (act, v, on, label) => '<button type="button" class="chip" data-act="' + act + '" data-v="' + esc(v) + '" aria-pressed="' + on + '">' + esc(label) + '</button>';
  const narrow = '<div class="card tl-narrow"><p class="muted small" style="margin:0 0 8px">' + esc(t('tl_for_doc')) + '</p>' +
    '<div class="chips"><span class="muted small">' + esc(t('tl_period')) + ':</span>' + chip('tlmonths', 0, !S.tlMonths, t('tl_any')) + chip('tlmonths', 1, S.tlMonths === 1, t('tl_m1')) +
    [2, 3, 6, 12].map(n => chip('tlmonths', n, S.tlMonths === n, t('tl_m', { n }))).join('') + '</div>' +
    (conds.length ? '<div class="chips" style="margin-top:8px"><span class="muted small">' + esc(t('tl_cond')) + ':</span>' + chip('tlcond', '', !S.tlCond, t('tl_allcond')) +
      conds.slice(0, 12).map(c => chip('tlcond', c, !!S.tlCond && S.tlCond.toLowerCase() === c.toLowerCase(), c)).join('') + '</div>' : '') + '</div>';
  const typed = sortedRecords().filter(r => S.filter === 'all' || r.doc_type === S.filter);
  const list = typed.filter(r => (!since || (r.date && String(r.date) >= since)) && (!S.tlCond || hasCond(r)));
  const narrowed = !!(S.tlMonths || S.tlCond);
  const countLine = narrowed ? '<p class="muted small">' + esc(t('tl_count', { n: list.length, m: typed.length })) + ' · <button type="button" class="btn small link" data-act="tlreset">' + esc(t('tl_reset')) + '</button></p>' : '';
  if (!list.length) return head + chips + narrow + countLine + '<div class="card empty"><p>' + esc(t('tl_nomatch')) + '</p></div>';
  let out = '', cur = null;
  list.forEach(r => {
    const key = r.date ? String(r.date).slice(0, 7) : 'none';
    if (key !== cur) {
      if (cur !== null) out += '</div>';
      cur = key;
      const label = key === 'none' ? t('undated') : fmtDate(key + '-01', { month: 'long', year: 'numeric' });
      out += '<div class="tl-month">' + esc(label) + '</div><div class="tl">';
    }
    out += timelineCard(r);
  });
  if (cur !== null) out += '</div>';
  return head + chips + narrow + countLine + out;
}
function timelineCard(r) {
  const tests = arr(r.tests), abn = tests.filter(x => isAbn(x.flag)).length;
  const ex = (r.explanation && (r.explanation[lang] || r.explanation.en || r.explanation.hi)) || null;
  const counts = [];
  if (tests.length) counts.push(abn ? '<span class="abn">' + esc(t('n_abn', { a: abn, n: tests.length })) + '</span>' : '<span>' + esc(t('n_tests', { n: tests.length })) + '</span>');
  if (arr(r.medicines).length) counts.push('<span>' + esc(t('n_meds', { n: r.medicines.length })) + '</span>');
  return '<div class="tl-item"><button type="button" class="tl-card" data-act="openrec" data-id="' + esc(r.id) + '">' +
    '<div class="top"><span class="mono">' + esc(fmtDate(r.date)) + '</span><span class="badge type">' + esc(typeLabel(r.doc_type)) + '</span>' +
    (r.handwritten ? '<span class="badge">' + esc(t('handwritten')) + '</span>' : '') + '</div>' +
    '<div class="ttl">' + esc(r.title || typeLabel(r.doc_type)) + '</div>' +
    (r.facility ? '<div class="sub">' + esc(r.facility) + '</div>' : '') +
    (counts.length ? '<div class="counts">' + counts.join('') + '</div>' : '') +
    (ex && ex.summary ? '<div class="sum">' + esc(ex.summary) + '</div>' : '') + '</button></div>';
}

/* ================= View: Detail ================= */
function explHTML(ex) {
  ex = ex || {};
  const f = arr(ex.findings), m = arr(ex.medicines), q = arr(ex.questions);
  return '<div class="expl-tools">' + listenBtn('expl') + '</div>' + (ex.summary ? '<p>' + esc(ex.summary) + '</p>' : '') +
    (f.length ? '<h3>' + esc(t('findings')) + '</h3>' + f.map(x =>
      '<div class="finding"><div class="nm"><span>' + esc(x.name) + '</span>' + badge(x.flag) + '</div>' + (x.meaning ? '<p>' + esc(x.meaning) + '</p>' : '') + '</div>').join('') : '') +
    (m.length ? '<h3>' + esc(t('med_purpose')) + '</h3><ul class="qlist">' + m.map(x => '<li><strong>' + esc(x.name) + '</strong>' + (x.purpose ? ': ' + esc(x.purpose) : '') + '</li>').join('') + '</ul>' : '') +
    (q.length ? '<h3>' + esc(t('questions')) + '</h3><ul class="qlist">' + q.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') +
    (ex.disclaimer ? '<p class="muted small" style="margin-top:12px">' + esc(ex.disclaimer) + '</p>' : '');
}
function viewDetail() {
  const r = getRec(S.detailId);
  if (!r) { S.view = 'timeline'; return viewTimeline(); }
  const tests = arr(r.tests), meds = arr(r.medicines), dx = arr(r.diagnoses), adv = arr(r.advice);
  const oc = isNum(r.overall_confidence) ? Math.round(Number(r.overall_confidence) * 100) : null;
  const kv = [[t('f_type'), typeLabel(r.doc_type)], [t('f_date'), r.date ? fmtDate(r.date) : ''], [t('f_facility'), r.facility], [t('f_doctor'), r.doctor], [t('f_patient'), [(r.patient || {}).name, (r.patient || {}).age].filter(Boolean).join(', ')]]
    .filter(x => x[1]).map(x => '<dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd>').join('');
  return '<button type="button" class="btn link" data-act="nav" data-view="timeline" style="margin-bottom:8px">&larr; ' + esc(t('back')) + '</button>' +
    '<div class="row between" style="margin-bottom:12px"><div><h1>' + esc(r.title || typeLabel(r.doc_type)) + '</h1>' +
    '<div class="row" style="margin-top:6px"><span class="badge type">' + esc(typeLabel(r.doc_type)) + '</span>' +
    (r.handwritten ? '<span class="badge">' + esc(t('handwritten')) + '</span>' : '') +
    (oc !== null ? '<span class="muted small">' + esc(t('conf_label', { p: oc })) + '</span>' : '') + '</div>' +
    (oc !== null ? '<p class="muted small conf-note">' + esc(t('conf_note')) + '</p>' : '') + '</div>' +
    '<div class="row"><button type="button" class="btn secondary" data-act="edit" data-id="' + esc(r.id) + '">' + esc(t('edit')) + '</button>' +
    '<button type="button" class="btn danger" data-act="delete" data-id="' + esc(r.id) + '">' + esc(t('delete')) + '</button></div></div>' +
    (arr(r.warnings).length ? '<div class="notice"><strong>' + esc(t('warnings_title')) + '</strong><ul>' + r.warnings.map(w => '<li>' + esc(warnText(w)) + '</li>').join('') + '</ul></div>' : '') +
    (window.SehatRem ? SehatRem.actionsCard({ recent: true }) : '') /* reminders.js: shown right after saving */ +
    '<div class="detail"><div class="stack">' +
    '<div class="card expl"><h2 style="margin-bottom:10px">' + esc(t('expl_title')) + '</h2><div id="expl"></div></div>' +
    '<div class="card"><h2 style="margin-bottom:10px">' + esc(t('structured')) + '</h2>' + (kv ? '<dl class="kv" style="margin-bottom:12px">' + kv + '</dl>' : '') +
    (tests.length ? '<h3 style="margin:12px 0 4px">' + esc(t('sec_tests')) + '</h3><div class="tablewrap"><table class="data"><thead><tr><th>' + esc(t('t_name')) + '</th><th>' + esc(t('t_value')) + '</th><th>' + esc(t('t_range')) + '</th><th>' + esc(t('t_flag')) + '</th></tr></thead><tbody>' +
      tests.map((x, i) => '<tr><td>' + esc(x.name) + srcBtn(x, 'tests', i) + (isLow(x.confidence) ? '<br>' + lowTag(x.confidence) : '') + '</td><td class="mono">' + esc(x.value) + ' ' + esc(x.unit) + '</td><td class="mono">' + esc(refText(x)) + '</td><td>' + badge(x.flag) + '</td></tr>').join('') + '</tbody></table></div>' : '') +
    (meds.length ? '<h3 style="margin:14px 0 4px">' + esc(t('sec_meds')) + '</h3><div class="tablewrap"><table class="data"><thead><tr><th>' + esc(t('m_name')) + '</th><th>' + esc(t('m_dose')) + '</th><th>' + esc(t('m_freq')) + '</th><th>' + esc(t('m_duration')) + '</th></tr></thead><tbody>' +
      meds.map((x, i) => '<tr><td><strong>' + esc(x.name) + '</strong>' + srcBtn(x, 'medicines', i) + (x.generic ? '<br><span class="muted small">' + esc(x.generic) + '</span>' : '') +
        (x.instructions ? '<br><span class="small">' + esc(x.instructions) + '</span>' : '') +
        (x.known === false ? '<br><span class="tag amber">' + esc(t('unknown_med')) + '</span>' : '') + (isLow(x.confidence) ? '<br>' + lowTag(x.confidence) : '') + '</td>' +
        '<td class="mono">' + esc([x.strength, x.dose].filter(Boolean).join(' / ')) + '</td><td>' + esc([x.frequency, x.timing].filter(Boolean).join(', ')) + '</td><td>' + esc(x.duration) + '</td></tr>').join('') + '</tbody></table></div>' : '') +
    (dx.length ? '<h3 style="margin:14px 0 6px">' + esc(t('sec_dx')) + '</h3><div class="chips">' + dx.map(x => '<span class="chip static">' + esc(x.name) + '</span>').join('') + '</div>' : '') +
    (adv.length ? '<h3 style="margin:14px 0 6px">' + esc(t('sec_advice')) + '</h3><ul class="qlist">' + adv.map(a => '<li>' + esc(a) + '</li>').join('') + '</ul>' : '') +
    (r.follow_up ? '<p style="margin-top:12px"><strong>' + esc(t('f_followup')) + ':</strong> ' + esc(r.follow_up) + '</p>' : '') +
    '</div></div>' +
    '<div class="card preview-card"><div class="preview-head"><h3>' + esc(t('original')) + '</h3><button type="button" class="btn small secondary" data-zoom="open">' + esc(t('zoom_open')) + '</button></div>' +
    '<div class="srcbox" id="srcbox"><div class="muted small">' + esc(t('src_box')) + '</div><div class="mono" id="srctext">' + esc(t('src_hint')) + '</div></div><div class="preview-doc" data-zoom="open" id="pv"></div></div></div>';
}

const explInFlight = new Set();
async function afterDetail() {
  const id = S.detailId, r = getRec(id);
  if (!r) return;
  S.detailFile = null;
  dbGet('files', id).then(f => {
    if (!f) f = urlFile(r);
    if (S.detailId === id) S.detailFile = f || null;
    const el = $('#pv');
    if (el && S.detailId === id && S.view === 'detail') el.innerHTML = previewHTML(f);
  });
  loadExpl(r);
}
async function loadExpl(r) {
  const L = lang;
  const box = () => ((S.view === 'detail' && S.detailId === r.id && lang === L) ? $('#expl') : null);
  let ex = r.explanation && r.explanation[L];
  if (!ex) {
    const key = r.id + ':' + L;
    if (explInFlight.has(key)) { if (box()) box().innerHTML = loadingExpl(); return; }
    explInFlight.add(key);
    if (box()) box().innerHTML = loadingExpl();
    try {
      const res = await api('/api/explain', { record: lite(r), lang: L });
      ex = res.explanation || {};
      r.explanation = r.explanation || {};
      r.explanation[L] = ex;
      await dbPut('records', r);
    } catch (e) {
      explInFlight.delete(key);
      if (box()) box().innerHTML = '<p class="muted">' + esc(t('expl_fail')) + '</p><button type="button" class="btn small secondary" data-act="retryexpl">' + esc(t('retry')) + '</button>';
      showError(e.message);
      return;
    }
    explInFlight.delete(key);
  }
  if (box()) box().innerHTML = explHTML(ex);
}
function loadingExpl() {
  return '<p class="muted">' + esc(t('loading_expl')) + '</p><div class="skeleton" style="width:90%"></div><div class="skeleton" style="width:75%"></div><div class="skeleton" style="width:82%"></div>';
}

/* ================= View: Health ================= */
function profile() {
  const recs = sortedRecords();
  const cond = new Map();
  recs.slice().reverse().forEach(r => arr(r.diagnoses).forEach(d => {
    const k = String(d.name || '').trim().toLowerCase();
    if (k && !cond.has(k)) cond.set(k, { name: d.name, date: r.date, id: r.id });
  }));
  const meds = new Map();
  recs.filter(r => r.doc_type === 'prescription' || r.doc_type === 'discharge_summary').forEach(r => arr(r.medicines).forEach(m => {
    const k = String(m.name || '').trim().toLowerCase();
    if (k && !meds.has(k)) meds.set(k, { m, date: r.date, id: r.id });
  }));
  const latest = new Map();
  recs.forEach(r => arr(r.tests).forEach(x => {
    const k = String(x.name || '').trim().toLowerCase();
    if (k && !latest.has(k)) latest.set(k, { x, date: r.date, id: r.id });
  }));
  const series = new Map();
  recs.slice().reverse().forEach(r => {
    if (!r.date) return;
    arr(r.tests).forEach(x => {
      if (!isNum(x.value)) return;
      const k = String(x.standard_name || x.name || '').trim().toLowerCase();
      if (!k) return;
      const unit = String(x.unit || '').replace(/\s+/g, '').toLowerCase();
      if (!series.has(k)) series.set(k, { name: x.standard_name || x.name, unit: x.unit, ukey: unit, pts: [], skipped: 0 });
      if (series.get(k).ukey !== unit) { series.get(k).skipped++; return; }
      series.get(k).pts.push({ date: String(r.date).slice(0, 10), v: Number(x.value), flag: x.flag, lo: isNum(x.ref_low) ? Number(x.ref_low) : null, hi: isNum(x.ref_high) ? Number(x.ref_high) : null });
    });
  });
  const trends = Array.from(series.values()).filter(s => s.pts.length >= 2);
  return { cond: Array.from(cond.values()), meds: Array.from(meds.values()), latest: Array.from(latest.values()), trends };
}

function chartSVG(s) {
  const W = 360, H = 160, pl = 38, pr = 46, pt = 16, pb = 26;
  const pts = s.pts;
  let band = null;
  for (let i = pts.length - 1; i >= 0; i--) { if (pts[i].lo !== null || pts[i].hi !== null) { band = { lo: pts[i].lo, hi: pts[i].hi }; break; } }
  const vals = pts.map(p => p.v);
  let mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
  if (band) { if (band.lo !== null) { mn = Math.min(mn, band.lo); mx = Math.max(mx, band.lo); } if (band.hi !== null) { mn = Math.min(mn, band.hi); mx = Math.max(mx, band.hi); } }
  if (mx === mn) { mx += 1; mn -= 1; }
  const padv = (mx - mn) * 0.12; mn -= padv; mx += padv;
  const ts = pts.map(p => Date.parse(p.date));
  const t0 = Math.min.apply(null, ts), t1 = Math.max.apply(null, ts);
  const X = i => (t1 === t0 ? pl + (W - pl - pr) * (i / Math.max(1, pts.length - 1)) : pl + (ts[i] - t0) / (t1 - t0) * (W - pl - pr));
  const Y = v => pt + (1 - (v - mn) / (mx - mn)) * (H - pt - pb);
  let g = '';
  if (band) {
    const top = band.hi !== null ? Y(band.hi) : pt, bot = band.lo !== null ? Y(band.lo) : H - pb;
    g += '<rect x="' + pl + '" y="' + top.toFixed(1) + '" width="' + (W - pl - pr) + '" height="' + Math.max(1, bot - top).toFixed(1) + '" fill="#055A99" opacity="0.13"/>';
  }
  g += '<line x1="' + pl + '" y1="' + (H - pb) + '" x2="' + (W - pr) + '" y2="' + (H - pb) + '" stroke="var(--line)"/>';
  g += '<polyline fill="none" stroke="var(--muted)" stroke-width="1.5" points="' + pts.map((p, i) => X(i).toFixed(1) + ',' + Y(p.v).toFixed(1)).join(' ') + '"/>';
  pts.forEach((p, i) => { g += '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(p.v).toFixed(1) + '" r="4" fill="' + FLAGC[normFlag(p.flag)] + '" stroke="var(--card)" stroke-width="1.5"><title>' + esc(fmtDate(p.date) + ': ' + fmtNum(p.v) + ' ' + (s.unit || '') + ' (' + t('flag_' + normFlag(p.flag)) + ')' + (p.note ? ' - ' + p.note : '')) + '</title></circle>'; });
  const li = pts.length - 1;
  g += '<text class="last" x="' + (X(li) + 7).toFixed(1) + '" y="' + (Y(pts[li].v) + 3).toFixed(1) + '">' + esc(fmtNum(pts[li].v)) + '</text>';
  g += '<text x="' + (pl - 5) + '" y="' + (pt + 4) + '" text-anchor="end">' + esc(fmtNum(mx)) + '</text>';
  g += '<text x="' + (pl - 5) + '" y="' + (H - pb) + '" text-anchor="end">' + esc(fmtNum(mn)) + '</text>';
  const short = { day: 'numeric', month: 'short', year: '2-digit' };
  g += '<text x="' + pl + '" y="' + (H - 8) + '" text-anchor="start">' + esc(fmtDate(pts[0].date, short)) + '</text>';
  g += '<text x="' + (W - pr) + '" y="' + (H - 8) + '" text-anchor="end">' + esc(fmtDate(pts[li].date, short)) + '</text>';
  return '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(s.name) + '">' + g + '</svg>';
}

function abhaNumber(p) {
  const a = p && p.abha;
  if (!a) return '';
  return typeof a === 'string' ? a : (a.number || a.abha_number || '');
}
/* ---- Insights: the server groups the records; if it fails, profile() is used instead ---- */
function hashStr(s) { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return h.toString(36); }
function insightsKey() { return lang + '|' + S.records.length + '|' + hashStr(JSON.stringify(S.records.map(lite)) + '#' + JSON.stringify(S.vitals)); }
const ukeyOf = u => String(u || '').replace(/\s+/g, '').toLowerCase();
function fallbackInsights() {
  const P = profile(), recs = sortedRecords(), map = new Map();
  recs.forEach(r => arr(r.tests).forEach(x => {
    const k = String(x.standard_name || x.name || '').trim().toLowerCase();
    if (!k) return;
    if (!map.has(k)) map.set(k, { key: k, name: x.standard_name || x.name, unit: x.unit || '', ref_low: isNum(x.ref_low) ? Number(x.ref_low) : null, ref_high: isNum(x.ref_high) ? Number(x.ref_high) : null, points: [] });
    map.get(k).points.push({ date: r.date ? String(r.date).slice(0, 10) : null, value: isNum(x.value) ? Number(x.value) : null, unit: x.unit || '', orig_value: x.value, orig_unit: x.unit || '', flag: x.flag, record: r.id, comparable: true, note: null, ref_text: refText(x) });
  }));
  const tests = Array.from(map.values()).map(x => {
    const latest = x.points[0];
    x.points.forEach(p => { p.comparable = ukeyOf(p.unit) === ukeyOf(latest.unit); });
    x.points.reverse();
    x.latest = latest;
    return x;
  });
  const attention = tests.filter(x => isAbn(normFlag(x.latest.flag))).map(x => ({ name: x.name, value: x.latest.orig_value, unit: x.latest.unit, flag: x.latest.flag, date: x.latest.date, record: x.latest.record, ref_text: x.latest.ref_text }));
  return {
    fallback: true,
    conditions: P.cond.map(c => ({ name: c.name, first_seen: c.date || null, mentions: [{ text: c.name, date: c.date || null, record: c.id }] })),
    medicines: P.meds.map(o => ({ name: o.m.name, generic: o.m.generic || null, strength: o.m.strength || null, dose: o.m.dose || null, frequency: o.m.frequency || null, timing: o.m.timing || null, duration: o.m.duration || null, date: o.date || null, record: o.id, ends: null, status: 'unconfirmed', mentions: 1 })),
    tests, attention, questions: [], cross: [], vitals: [], disclaimer: ''
  };
}
function normInsights(d) {
  d = d && typeof d === 'object' ? d : {};
  const tests = arr(d.tests).filter(x => x && typeof x === 'object').map(x => {
    x.points = arr(x.points).filter(p => p && typeof p === 'object');
    if (!x.latest) x.latest = x.points[x.points.length - 1] || {};
    return x;
  });
  return { conditions: arr(d.conditions), medicines: arr(d.medicines), tests, attention: arr(d.attention), questions: arr(d.questions), cross: arr(d.cross), vitals: arr(d.vitals), disclaimer: d.disclaimer || '', persistent: arr(d.persistent), preventive: arr(d.preventive), wellness: arr(d.wellness) /* journal.js cards */ };
}
async function runInsights(key) {
  let res = null;
  try { res = await api('/api/insights', { records: S.records.map(lite), vitals: S.vitals, lang, patient: { age: (S.patient || {}).age, sex: (S.patient || {}).sex } }); } catch (e) { /* fall back to profile() */ }
  if (!S.insights || S.insights.key !== key) return;
  if (res && typeof res === 'object' && Array.isArray(res.tests)) {
    S.insights.state = 'ok'; S.insights.data = normInsights(res); S.insights.stale = null;
    try { localStorage.setItem(profKey('sehat_insights'), JSON.stringify({ key, day: new Date().toISOString().slice(0, 10), data: res })); } catch (x) { /* ignore */ }
  } else S.insights.state = 'fail';
  const typing = document.activeElement && document.activeElement.closest && document.activeElement.closest('#vitForm,#stepForm,#jrCard');
  if (INS_VIEWS.indexOf(S.view) >= 0 && !typing) render();
}
/* Used by views: starts the request when records or language changed. */
/* views that show insight cards: re-rendered when the insights arrive */
const INS_VIEWS = ['health', 'visit', 'meds', 'visits', 'journal', 'wellness'];
function getInsights() {
  if (!S.records.length && !S.vitals.length) return { loading: false, data: fallbackInsights() };
  const key = insightsKey();
  if (!S.insights || S.insights.key !== key) {
    // while the new profile loads, keep showing the previous one rather than a blank state
    const stale = S.insights && (S.insights.data || S.insights.stale) || null;
    S.insights = { key, state: 'loading', data: null, stale };
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(profKey('sehat_insights')) || 'null'); } catch (x) { /* ignore */ }
    if (saved && saved.key === key && saved.day === new Date().toISOString().slice(0, 10) && saved.data && Array.isArray(saved.data.tests) && Array.isArray(saved.data.preventive)) {  // a profile cached before Round 2 lacks the new cards
      S.insights.state = 'ok'; S.insights.data = normInsights(saved.data);
    } else runInsights(key);
  }
  if (S.insights.state === 'ok') return { loading: false, data: S.insights.data };
  if (S.insights.state === 'loading' && S.insights.stale) return { loading: false, data: S.insights.stale };
  if (S.insights.state === 'fail') return { loading: false, data: fallbackInsights() };
  return { loading: true, data: null };
}
/* Used by listeners: never starts a request. */
function curInsights() { return S.insights && S.insights.state === 'ok' && S.insights.data ? S.insights.data : fallbackInsights(); }
/* A medicine written in a record is not proof it is taken today: the user confirms each one
   before it can enter the schedule, the reminders or "Next up". Kept on this device. */
function curKey(m) { return String((m && m.name) || '').trim().toLowerCase(); }
function curGet() { try { return JSON.parse(localStorage.getItem(profKey('sehat_current')) || '{}') || {}; } catch (e) { return {}; } }
function curSet(k, on) {
  const c = curGet();
  if (on) c[k] = 1; else delete c[k];
  try { localStorage.setItem(profKey('sehat_current'), JSON.stringify(c)); } catch (e) { /* storage blocked */ }
}
function schedAll() { return curInsights().medicines.filter(m => m.status !== 'course_ended').map(m => ({ m, date: m.date })); }
function schedMeds() { const c = curGet(); return schedAll().filter(x => c[curKey(x.m)] && !(window.SehatRem && SehatRem.hide(x.m))); /* reminders.js: drops stopped / ended courses */ }
function confirmMedsCard() {
  const all = schedAll(), c = curGet();
  if (!all.length) return '';
  return '<div class="card"><h2 style="margin-bottom:6px">' + esc(t('cur_title')) + '</h2><p class="muted small">' + esc(t('cur_hint')) + '</p><ul class="list">' +
    all.map(x => { const k = curKey(x.m), on = !!c[k]; return '<li><span class="l"><strong>' + esc(x.m.name) + '</strong>' + (x.date ? '<br><span class="muted small">' + esc(fmtDate(x.date)) + '</span>' : '') +
      '</span><span class="r"><button type="button" class="btn small' + (on ? ' link' : ' secondary') + '" data-act="curmed" data-k="' + esc(k) + '" data-on="' + (on ? '0' : '1') + '">' + esc(t(on ? 'cur_undo' : 'cur_yes')) + '</button></span></li>'; }).join('') + '</ul></div>';
}

function attnAge(date) {
  const n = date ? Math.floor((Date.now() - new Date(date).getTime()) / (30.4 * 864e5)) : 0;
  return n >= 2 ? '<br><span class="small" style="color:var(--warn)">' + esc(t('attn_age', { n: n })) + '</span>' : '';
}
function recLink(id, label) {
  const r = getRec(id);
  if (!r) return '';
  return '<button type="button" class="chip" data-act="openrec" data-id="' + esc(id) + '">' + esc(label || ((r.title || typeLabel(r.doc_type)) + (r.date ? ' (' + fmtDate(r.date) + ')' : ''))) + '</button>';
}
const recLinks = ids => { const h = arr(ids).map(i => recLink(i)).join(''); return h ? '<div class="chips" style="margin-top:6px">' + h + '</div>' : ''; };

/* trend series built only from points the server marked comparable */
function trendSeries(I) {
  return I.tests.map(x => {
    const pts = arr(x.points).filter(p => p.comparable !== false && isNum(p.value) && p.date).sort((a, b) => String(a.date).localeCompare(String(b.date)));
    return {
      name: x.name, unit: x.unit, skipped: arr(x.points).filter(p => p.comparable === false).length,
      pts: pts.map(p => ({ date: String(p.date).slice(0, 10), v: Number(p.value), flag: p.flag, note: p.note || null, lo: isNum(x.ref_low) ? Number(x.ref_low) : null, hi: isNum(x.ref_high) ? Number(x.ref_high) : null }))
    };
  }).filter(s => s.pts.length >= 2);
}
function changeText(s) {
  const a = s.pts[0], b = s.pts[s.pts.length - 1], u = s.unit ? ' ' + s.unit : '';
  return fmtNum(a.v) + u + ' (' + fmtDate(a.date) + ')  →  ' + fmtNum(b.v) + u + ' (' + fmtDate(b.date) + ')';
}
function biggestChange(series) {
  let best = null;
  series.forEach(s => {
    const a = s.pts[0], b = s.pts[s.pts.length - 1];
    if (!a.v) return;
    const rel = Math.abs((b.v - a.v) / a.v);
    if (!best || rel > best.rel) best = { s, rel };
  });
  return best;
}
const ptVal = p => (p.orig_value != null && p.orig_value !== '' ? p.orig_value : p.value);
const ptUnit = p => (p.orig_value != null && p.orig_value !== '' ? (p.orig_unit != null ? p.orig_unit : p.unit) : p.unit);

function greetingLine() {
  const u = currentUser(), p = S.patient || {};
  const other = window.SehatFamily && SehatFamily.active() !== 'self';  // another profile is open: greet that person
  // greet the person whose health profile is open; the login name is only a fallback
  // the open family profile's own name wins: S.patient can still hold the previous profile for a moment
  const act = window.SehatFamily ? SehatFamily.list().find(x => x.id === SehatFamily.active()) : null;
  const nm = String((act && act.name) || (other ? p.name : (p.name || (u && u.name))) || '').trim().replace(/^((mr|mrs|ms|miss|dr|shri|smt|kumari|master)\.?\s+)+/i, '').split(/\s+/)[0];
  if (!nm) return t('greet_guest');
  const h = new Date().getHours();
  return t(h < 12 ? 'greet_morning' : (h < 18 ? 'greet_afternoon' : 'greet_evening'), { name: nm });
}
function nextUpHTML() {
  // a follow-up note is only "next" while its record is recent; older ones are already past
  const r = sortedRecords().find(x => x.follow_up && x.date && (Date.now() - new Date(x.date).getTime()) < 30 * 864e5);
  if (r) return '<p class="dash-t">' + esc(r.follow_up) + '</p><p class="muted small">' + esc(t('dash_next_from', { date: fmtDate(r.date) })) + '</p>';
  const doses = buildDoses(schedMeds()).filter(d => d.slot === 'morning' || d.slot === 'afternoon' || d.slot === 'night');
  const order = ['morning', 'afternoon', 'night'], h = new Date().getHours(), cur = h < 12 ? 0 : (h < 18 ? 1 : 2);
  for (let k = 0; k < 3; k++) {
    const slot = order[(cur + k) % 3], l = doses.filter(d => d.slot === slot);
    if (l.length) {
      const names = Array.from(new Set(l.map(d => d.m.name))).join(', ');
      return '<p class="dash-t">' + esc(t('dash_next_med', { slot: t('slot_' + slot), names })) + '</p>';
    }
  }
  return '<p class="muted">' + esc(t('dash_next_none')) + '</p>';
}
const QA_ICON = {
  add: '<path d="M12 5v14M5 12h14"/>',
  ask: '<path d="M4 5h16v11H9l-5 4z"/>',
  visit: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
  exp: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  vit: '<path d="M3 12h4l2-6 4 12 2-6h6"/>'
};
function quickTile(icon, label, attrs) {
  return '<button type="button" class="qa" ' + attrs + '><svg viewBox="0 0 24 24" aria-hidden="true">' + QA_ICON[icon] + '</svg><span>' + esc(label) + '</span></button>';
}
/* "All clear" only when there is something to be clear about: no lab results is said plainly,
   and doses not marked today are not hidden behind a green tick. */
function okLine(I) {
  const late = window.SehatRem && SehatRem.caregiverCount && window.SehatFamily ? SehatRem.caregiverCount(SehatFamily.active()) : 0;
  const base = arr(I.tests).length ? t('attn_none') : t('attn_nolabs');
  return { text: late ? base + ' ' + t(late === 1 ? 'attn_late_one' : 'attn_late', { n: late }) : base, warn: !arr(I.tests).length || late > 0 };
}
function dashHTML(I) {
  const n = I.attention.length, latest = sortedRecords()[0], series = trendSeries(I), best = biggestChange(series);
  const chips = I.attention.slice(0, 3).map(a => '<span class="chip static">' + esc(a.name + ' ' + (a.value == null ? '' : a.value) + (a.unit ? ' ' + a.unit : '')) + ' ' + badge(a.flag) + '</span>').join('');
  const lead = '<div class="card dash-lead ' + (n ? 'warn' : 'ok') + '"><div class="dna" data-dna aria-hidden="true"></div><div class="kicker">' + esc(t('kick_today')) + '</div>' +
    (n ? '<div class="dash-big"><span class="dash-num">' + n + '</span><span class="dash-lbl">' + esc(t(n === 1 ? 'dash_attn_one' : 'dash_attn_many')) + '</span></div>' +
      '<div class="chips" style="margin:10px 0 14px">' + chips + '</div>' +
      (latest ? '<button type="button" class="btn" data-act="openrec" data-id="' + esc(latest.id) + '">' + esc(t('dash_see')) + '</button>' : '')
      : '<div class="dash-ok' + (okLine(I).warn ? ' muted' : '') + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg><span>' + esc(okLine(I).text) + '</span></div>') + '</div>';
  const side = '<div class="dash-side">' +
    '<div class="card mini"><div class="kicker">' + esc(t('dash_next')) + '</div>' + nextUpHTML() + '</div>' +
    '<div class="card mini"><div class="kicker">' + esc(t('dash_changed')) + '</div>' +
    (best ? '<p class="dash-t"><strong>' + esc(best.s.name) + '</strong></p><p class="small" style="margin:0">' + esc(changeText(best.s)) + '</p>' : '<p class="muted">' + esc(t('dash_changed_none')) + '</p>') + '</div>' +
    '<div class="card mini"><div class="kicker">' + esc(t('dash_doctor')) + '</div><p class="dash-t">' + esc(t('dash_doctor_n', { n: I.questions.length })) + '</p>' +
    '<button type="button" class="btn small secondary" data-act="visit">' + esc(t('visit_btn')) + '</button></div></div>';
  const quick = '<div class="quick">' + quickTile('add', t('nav_add'), 'data-act="nav" data-view="add"') + quickTile('ask', t('qa_ask'), 'data-pet="open"') +
    quickTile('visit', t('visit_btn'), 'data-act="visit"') + quickTile('vit', t('qa_reading'), 'data-act="nav" data-view="wellness"') + quickTile('exp', t('qa_export'), 'data-act="nav" data-view="abha"') + '</div>';
  return '<div class="dash">' + lead + side + '</div>' + quick;
}
function skelCard(n) {
  let h = '<div class="card"><div class="skeleton" style="width:40%;height:18px"></div>';
  for (let i = 0; i < n; i++) h += '<div class="skeleton" style="width:' + (92 - i * 9) + '%"></div>';
  return h + '</div>';
}
function medStatusChip(m) {
  if (m.status === 'course_ended') return '<span class="tag">' + esc(m.ends ? t('med_ended_d', { d: fmtDate(m.ends) }) : t('med_ended')) + '</span>';
  if (curGet()[curKey(m)]) return '<span class="tag green">' + esc(t('med_conf')) + '</span>';
  return '<span class="tag amber">' + esc(t('med_unconf')) + '</span>';
}
function medsRecordedCard(I) {
  return '<div class="card"><h2 style="margin-bottom:10px">' + esc(t('h_meds_rec')) + '</h2>' +
    (I.medicines.length ? '<ul class="list meds-rec">' + I.medicines.map(m => {
      const how = [m.dose, m.frequency, m.timing].filter(Boolean).join(', ');
      return '<li><span class="l"><strong>' + esc(m.name) + '</strong>' + (m.strength ? ' <span class="mono">' + esc(m.strength) + '</span>' : '') +
        (how ? '<br><span class="small">' + esc(how) + '</span>' : '') +
        '<br><span class="muted small">' + esc(t('med_presc', { d: fmtDate(m.date) })) + (m.duration ? ' · ' + esc(t('med_dur', { x: m.duration })) : '') + '</span></span>' +
        '<span class="r">' + medStatusChip(m) + '</span></li>';
    }).join('') + '</ul>' : '<p class="muted">' + esc(t('no_items')) + '</p>') +
    '<p class="muted small" style="margin:10px 0 0">' + esc(t('med_note')) + '</p></div>';
}
// remember which dashboard sections the user folded or opened
document.addEventListener('toggle', e => { const d = e.target; if (d && d.matches && d.matches('details.hsec[data-k]')) (S.secOpen = S.secOpen || {})[d.dataset.k] = d.open; }, true);
function jrH(I, w) { return typeof journalHTML === 'function' ? journalHTML(I, w) : ''; } /* journal.js hook */

/* ==========================================================================
   DEMO MODES: Mode 1 (3D Patient), Mode 2 (Avanade Copilot), Mode 3 (Normal AI)
   ========================================================================== */
function getDemoMode() {
  const m = (location.search.match(/[?&]demo=([123])\b/) || [])[1];
  if (m) return m;
  try {
    const s = sessionStorage.getItem('sehat_demo_mode');
    if (s && ['1', '2', '3'].includes(s)) return s;
  } catch (e) {}
  return '1';
}

function setDemoMode(mode) {
  if (!['1', '2', '3'].includes(String(mode))) mode = '1';
  try { sessionStorage.setItem('sehat_demo_mode', mode); } catch (e) {}
  location.assign('/app?demo=' + mode);
}

function updateDemoPills() {
  const mode = getDemoMode();
  ['1', '2', '3'].forEach(m => {
    const el = document.getElementById('demoPill' + m);
    if (el) {
      if (m === mode) {
        el.classList.add('active');
        el.setAttribute('aria-pressed', 'true');
      } else {
        el.classList.remove('active');
        el.setAttribute('aria-pressed', 'false');
      }
    }
  });
}

function caiMarkdown(text) {
  if (!text) return '';
  const lines = text.split('\n');
  const out = [];
  let inTable = false;
  let tableRows = [];
  let inList = false;

  function flushTable() {
    if (!inTable) return '';
    let res = '<div style="overflow-x:auto; margin:14px 0"><table class="kv" style="width:100%; border-collapse:collapse; font-size:0.88rem;">';
    for (let i = 0; i < tableRows.length; i++) {
      const row = tableRows[i];
      const cells = row.split('|').slice(1, -1).map(c => c.trim());
      if (i === 1 && cells.every(c => /^[- :]+$/.test(c))) continue;
      const tag = (i === 0) ? 'th' : 'td';
      res += '<tr>' + cells.map(c => '<' + tag + ' style="padding:8px 12px; border:1px solid var(--line-light); text-align:left;">' + inlineMd(c) + '</' + tag + '>').join('') + '</tr>';
    }
    res += '</table></div>';
    inTable = false;
    tableRows = [];
    return res;
  }

  function inlineMd(str) {
    return str
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+?)\*/g, '<em>$1</em>');
  }

  for (let i = 0; i < lines.length; i++) {
    const s = lines[i].trim();
    if (s.startsWith('|') && s.endsWith('|')) {
      if (!inTable) {
        if (inList) { out.push('</ul>'); inList = false; }
        inTable = true;
      }
      tableRows.push(s);
      continue;
    } else if (inTable) {
      out.push(flushTable());
    }

    if (s.startsWith('* ') || s.startsWith('- ') || /^\d+\.\s/.test(s)) {
      if (!inList) {
        out.push('<ul style="margin:8px 0; padding-left:22px; line-height:1.65;">');
        inList = true;
      }
      const itemText = s.replace(/^[*\-\d\.]+\s+/, '');
      out.push('<li>' + inlineMd(itemText) + '</li>');
      continue;
    } else if (inList) {
      out.push('</ul>');
      inList = false;
    }

    if (s.startsWith('### ')) {
      out.push('<h3 style="margin:16px 0 8px; font-size:1.1rem; color:var(--ink);">' + inlineMd(s.slice(4)) + '</h3>');
    } else if (s === '---') {
      out.push('<hr style="margin:16px 0; border:0; border-top:1px solid var(--line-light);">');
    } else if (s) {
      out.push('<p style="margin:6px 0; line-height:1.65;">' + inlineMd(s) + '</p>');
    }
  }
  if (inTable) out.push(flushTable());
  if (inList) out.push('</ul>');
  return out.join('\n');
}

/* ==========================================================================
   DEMO 2: Avanade Health AI Copilot View
   ========================================================================== */
function viewAvanadeCopilot(I) {
  S.avTab = S.avTab || 'soap';

  // 1. Enterprise Hero
  const hero = `
    <div class="av-hero">
      <div class="av-hero-tag">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
        Avanade Health AI Copilot · Microsoft Azure Health Data Services
      </div>
      <h1>Be more with Copilot in Healthcare</h1>
      <p>Enterprise ambient clinical intelligence synthesizing Jay Tawri's multiformat records into automated SOAP charting, care team rounds, diagnostic telemetry, and pharmacovigilance safety shields.</p>
      <div class="av-trust-badges">
        <span class="av-badge"><span style="color:#10B981">●</span> Active Ambient Telemetry</span>
        <span class="av-badge">🛡️ HIPAA Compliant</span>
        <span class="av-badge">⚡ HL7 FHIR R4 Connected</span>
        <span class="av-badge">🔒 Azure Health Data Services Guardrails</span>
        <span class="av-badge">🩺 HITRUST Certified</span>
      </div>
    </div>
  `;

  // 2. Impact KPIs Ribbon
  const kpis = `
    <div class="av-kpis">
      <div class="av-kpi-card">
        <div class="av-kpi-num">94%</div>
        <div class="av-kpi-lbl">Charting Time Saved<br><span class="muted small">Ambient note generated in &lt; 2.4s</span></div>
      </div>
      <div class="av-kpi-card">
        <div class="av-kpi-num">0</div>
        <div class="av-kpi-lbl">Missed Contraindications<br><span class="muted small">Renal &amp; LFT safety verified</span></div>
      </div>
      <div class="av-kpi-card">
        <div class="av-kpi-num">2.8x</div>
        <div class="av-kpi-lbl">Faster Multidisciplinary Rounds<br><span class="muted small">Automated clinical briefings</span></div>
      </div>
      <div class="av-kpi-card">
        <div class="av-kpi-num">100%</div>
        <div class="av-kpi-lbl">Clinical Auditability<br><span class="muted small">Cited to source FHIR resources</span></div>
      </div>
    </div>
  `;

  // 3. Module Tabs Bar
  const tabs = `
    <div class="av-tabs-bar" role="tablist">
      <button type="button" class="av-tab-btn ${S.avTab === 'soap' ? 'active' : ''}" data-avtab="soap">
        <span>🩺</span> Ambient SOAP Note
      </button>
      <button type="button" class="av-tab-btn ${S.avTab === 'team' ? 'active' : ''}" data-avtab="team">
        <span>👥</span> Care Team Rounds
      </button>
      <button type="button" class="av-tab-btn ${S.avTab === 'telemetry' ? 'active' : ''}" data-avtab="telemetry">
        <span>📊</span> Diagnostic Telemetry
      </button>
      <button type="button" class="av-tab-btn ${S.avTab === 'safety' ? 'active' : ''}" data-avtab="safety">
        <span>🛡️</span> Pharmacovigilance Shield
      </button>
    </div>
  `;

  // 4. Tab Content
  let tabContent = '';
  if (S.avTab === 'soap') {
    tabContent = `
      <div class="stack" style="gap:16px">
        <div class="card" style="border-left: 4px solid #FF5800; background: linear-gradient(135deg, rgba(255,88,0,0.04), transparent)">
          <div class="row between" style="align-items:center; flex-wrap:wrap; gap:10px">
            <div>
              <div style="font-weight:700; font-size:1.05rem; color:var(--ink)">Ambient Clinical SOAP Note · Ready for EHR Export</div>
              <div class="muted small">Synthesized from 4 clinical records (CityCare Diagnostic Labs &amp; Dr. Anita Mehta Rx) · Per CMS / HL7 FHIR documentation standards</div>
            </div>
            <div class="row" style="gap:8px">
              <button type="button" class="btn small primary" id="btnCopySoap" style="background:#FF5800; border-color:#FF5800">📋 Copy to EHR Clipboard</button>
              <button type="button" class="btn small secondary" onclick="alert('FHIR R4 Composition resource generated and staged for Cerner/Epic/ABDM sync.')">⚡ Export FHIR Bundle</button>
            </div>
          </div>
        </div>

        <div class="av-soap-grid">
          <!-- Subjective -->
          <div class="av-soap-box">
            <div class="av-soap-head">
              <div class="row" style="gap:10px; align-items:center">
                <span class="av-soap-letter let-s">S</span>
                <div>
                  <strong style="font-size:1.05rem">Subjective</strong>
                  <div class="muted small">Patient History &amp; Reported Symptoms</div>
                </div>
              </div>
              <span class="tag green">Verified</span>
            </div>
            <div class="small" style="line-height:1.65; color:var(--ink)">
              <p><strong>Chief Complaint:</strong> Routine follow-up for Type 2 Diabetes Mellitus; follow-up after resolution of seasonal cough &amp; viral symptoms.</p>
              <p><strong>History of Present Illness:</strong> Patient reports regular compliance with oral Metformin 500 mg. No reported hypoglycemic symptoms, syncope, or gastrointestinal distress. Energy levels stable; appetite normal.</p>
              <p><strong>Allergies:</strong> No known drug allergies (NKDA).</p>
            </div>
          </div>

          <!-- Objective -->
          <div class="av-soap-box">
            <div class="av-soap-head">
              <div class="row" style="gap:10px; align-items:center">
                <span class="av-soap-letter let-o">O</span>
                <div>
                  <strong style="font-size:1.05rem">Objective</strong>
                  <div class="muted small">Diagnostic Findings &amp; Clinical Telemetry</div>
                </div>
              </div>
              <span class="tag amber">2 Attention Items</span>
            </div>
            <div class="small" style="line-height:1.65; color:var(--ink)">
              <ul style="margin:0; padding-left:18px">
                <li><strong>Fasting Blood Sugar:</strong> <span class="mono" style="color:#F59E0B; font-weight:700">118 mg/dL</span> (Ref: 70–100 mg/dL · Impaired fasting glucose)</li>
                <li><strong>HbA1c:</strong> <span class="mono" style="font-weight:700">6.9%</span> (Target for controlled diabetes: &lt; 7.0%)</li>
                <li><strong>Liver Enzymes (SGPT / ALT):</strong> <span class="mono" style="color:#EF4444; font-weight:700">88 U/L</span> (Ref: 0–45 U/L · ⚠️ 1.95x Upper Limit)</li>
                <li><strong>Serum Creatinine:</strong> <span class="mono" style="font-weight:700; color:#10B981">1.0 mg/dL</span> (Normal renal clearance, eGFR &gt;90 mL/min)</li>
                <li><strong>Platelet Count:</strong> <span class="mono" style="font-weight:700; color:#10B981">240,000 /µL</span> (Normal physiological recovery)</li>
              </ul>
            </div>
          </div>

          <!-- Assessment -->
          <div class="av-soap-box">
            <div class="av-soap-head">
              <div class="row" style="gap:10px; align-items:center">
                <span class="av-soap-letter let-a">A</span>
                <div>
                  <strong style="font-size:1.05rem">Assessment</strong>
                  <div class="muted small">Copilot Clinical Synthesis &amp; Diagnoses</div>
                </div>
              </div>
              <span class="tag blue">AI Decision Support</span>
            </div>
            <div class="small" style="line-height:1.65; color:var(--ink)">
              <p><strong>1. Type 2 Diabetes Mellitus (ICD-10: E11.9):</strong> Fair glycemic control (HbA1c 6.9%) on single-agent Metformin 500 mg. Fasting blood sugar slightly elevated at 118 mg/dL.</p>
              <p><strong>2. Isolated Transaminitis (ICD-10: R74.0):</strong> Elevated SGPT (88 U/L) without clinical jaundice. High probability of metabolic non-alcoholic fatty liver (NAFLD) given diabetic background.</p>
              <p><strong>3. Pharmacological Safety:</strong> Normal renal function (Creatinine 1.0) confirms Metformin can be safely maintained without lactic acidosis risk.</p>
            </div>
          </div>

          <!-- Plan -->
          <div class="av-soap-box">
            <div class="av-soap-head">
              <div class="row" style="gap:10px; align-items:center">
                <span class="av-soap-letter let-p">P</span>
                <div>
                  <strong style="font-size:1.05rem">Plan &amp; Orders</strong>
                  <div class="muted small">Therapeutic Protocol &amp; Care Directives</div>
                </div>
              </div>
              <span class="tag green">Actionable</span>
            </div>
            <div class="small" style="line-height:1.65; color:var(--ink)">
              <p><strong>1. Medications:</strong> Maintain Metformin Hydrochloride 500 mg once daily post-dinner.</p>
              <p><strong>2. Diagnostic Workup:</strong> Order Ultrasound Whole Abdomen to rule out hepatic steatosis; schedule repeat LFT (SGPT/SGOT) + Fasting Lipid Profile in 6 weeks.</p>
              <p><strong>3. Lifestyle Guidance:</strong> Restrict dietary simple carbohydrates (&lt;130g/day); brisk walking 30 min/day (150 min/wk).</p>
              <p><strong>4. Care Coordination:</strong> Notify Dr. Anita Mehta &amp; Nutritionist Sunita Sharma via Copilot Care Handover.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (S.avTab === 'team') {
    tabContent = `
      <div class="stack" style="gap:16px">
        <div class="card" style="border-left: 4px solid #8B5CF6">
          <div class="row between" style="align-items:center">
            <div>
              <div style="font-weight:700; font-size:1.05rem; color:var(--ink)">Multidisciplinary Care Team Rounds &amp; Virtual Handovers</div>
              <div class="muted small">Synchronized clinical collaboration powered by Microsoft 365 Copilot &amp; Azure Health Data Services</div>
            </div>
            <button type="button" class="btn small primary" style="background:#8B5CF6; border-color:#8B5CF6" onclick="alert('Virtual care round summary dispatched to Dr. Anita Mehta and care coordinators.')">🚀 Trigger Care Handover</button>
          </div>
        </div>

        <div class="av-team-grid">
          <div class="av-team-card">
            <div class="av-team-avatar">AM</div>
            <div style="flex:1">
              <strong>Dr. Anita Mehta, MD</strong>
              <div class="muted small">Lead Attending Physician · Internal Medicine</div>
              <div style="margin-top:6px"><span class="tag green">Signed Ambulatory Plan</span></div>
            </div>
          </div>

          <div class="av-team-card">
            <div class="av-team-avatar" style="background:linear-gradient(135deg, #4FA3F0, #3B82F6)">SL</div>
            <div style="flex:1">
              <strong>Dr. Sarah Lin, MD</strong>
              <div class="muted small">Endocrinologist · Sub-Specialist</div>
              <div style="margin-top:6px"><span class="tag blue">Reviewed HbA1c 6.9%</span></div>
            </div>
          </div>

          <div class="av-team-card">
            <div class="av-team-avatar" style="background:linear-gradient(135deg, #10B981, #059669)">SS</div>
            <div style="flex:1">
              <strong>Sunita Sharma, RN</strong>
              <div class="muted small">Care Coordinator &amp; Diabetic Educator</div>
              <div style="margin-top:6px"><span class="tag green">Nutrition Outreach Set</span></div>
            </div>
          </div>

          <div class="av-team-card">
            <div class="av-team-avatar" style="background:linear-gradient(135deg, #F59E0B, #D97706)">RK</div>
            <div style="flex:1">
              <strong>Rajesh Kumar, PharmD</strong>
              <div class="muted small">Clinical Pharmacist · Drug Safety</div>
              <div style="margin-top:6px"><span class="tag green">Renal Clearance Cleared</span></div>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 style="margin-bottom:12px">Active Clinical Checklist for Jay Tawri</h3>
          <ul class="list" style="margin:0">
            <li style="padding:10px 0; border-bottom:1px solid var(--line-light)">
              <label style="display:flex; align-items:center; gap:12px; cursor:pointer">
                <input type="checkbox" checked style="width:18px; height:18px; accent-color:#10B981">
                <span><strong>Metformin 500mg Renal Clearance Audit:</strong> Serum Creatinine verified 1.0 mg/dL (eGFR normal).</span>
              </label>
            </li>
            <li style="padding:10px 0; border-bottom:1px solid var(--line-light)">
              <label style="display:flex; align-items:center; gap:12px; cursor:pointer">
                <input type="checkbox" checked style="width:18px; height:18px; accent-color:#10B981">
                <span><strong>Post-Viral Platelet Recovery:</strong> Rebounded to 240,000 /µL, no thrombocytopenia recurrence.</span>
              </label>
            </li>
            <li style="padding:10px 0; border-bottom:1px solid var(--line-light)">
              <label style="display:flex; align-items:center; gap:12px; cursor:pointer">
                <input type="checkbox" style="width:18px; height:18px; accent-color:#FF5800">
                <span><strong>Hepatic Transaminitis Workup:</strong> Schedule repeat LFT and Ultrasound Whole Abdomen for SGPT 88 U/L.</span>
              </label>
            </li>
            <li style="padding:10px 0">
              <label style="display:flex; align-items:center; gap:12px; cursor:pointer">
                <input type="checkbox" style="width:18px; height:18px; accent-color:#FF5800">
                <span><strong>Low Glycemic Index Nutrition Counseling:</strong> Sunita Sharma to schedule 1:1 consultation.</span>
              </label>
            </li>
          </ul>
        </div>
      </div>
    `;
  } else if (S.avTab === 'telemetry') {
    tabContent = `
      <div class="stack" style="gap:16px">
        <div class="card" style="border-left: 4px solid #4FA3F0">
          <div style="font-weight:700; font-size:1.05rem; color:var(--ink)">Real-time Diagnostic Biomarker Telemetry</div>
          <div class="muted small">Extracted from CityCare Diagnostic Pathology Report (22-Sep-2026) · Synthesized with historical records</div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px">
          <div class="card" style="border-top:3px solid #F59E0B">
            <div class="row between">
              <strong>Fasting Blood Sugar</strong>
              <span class="tag amber">Attention</span>
            </div>
            <div style="font-size:2.2rem; font-weight:800; font-family:var(--mono); margin:8px 0; color:#F59E0B">118 <span style="font-size:1rem; color:var(--muted)">mg/dL</span></div>
            <div class="small muted">Reference: 70 – 100 mg/dL</div>
            <div class="small" style="margin-top:10px; padding:8px 10px; background:rgba(245,158,11,0.08); border-radius:8px">
              💡 <strong>Copilot Insight:</strong> Impaired fasting glucose. Reflects dawn phenomenon; well-managed by continued bedtime Metformin.
            </div>
          </div>

          <div class="card" style="border-top:3px solid #EF4444">
            <div class="row between">
              <strong>SGPT / ALT (Liver Enzyme)</strong>
              <span class="tag red">Elevated 1.95x</span>
            </div>
            <div style="font-size:2.2rem; font-weight:800; font-family:var(--mono); margin:8px 0; color:#EF4444">88 <span style="font-size:1rem; color:var(--muted)">U/L</span></div>
            <div class="small muted">Reference: 0 – 45 U/L</div>
            <div class="small" style="margin-top:10px; padding:8px 10px; background:rgba(239,68,68,0.08); border-radius:8px">
              ⚠️ <strong>Copilot Insight:</strong> Asymptomatic transaminitis. Most common differential: Non-Alcoholic Fatty Liver Disease (NAFLD). Recommend hepatic ultrasound.
            </div>
          </div>

          <div class="card" style="border-top:3px solid #10B981">
            <div class="row between">
              <strong>HbA1c (Glycated Hemoglobin)</strong>
              <span class="tag green">Within Target</span>
            </div>
            <div style="font-size:2.2rem; font-weight:800; font-family:var(--mono); margin:8px 0; color:#10B981">6.9 <span style="font-size:1rem; color:var(--muted)">%</span></div>
            <div class="small muted">Diabetic Goal: &lt; 7.0%</div>
            <div class="small" style="margin-top:10px; padding:8px 10px; background:rgba(16,185,129,0.08); border-radius:8px">
              ✅ <strong>Copilot Insight:</strong> Patient is meeting therapeutic target on 500mg Metformin monotherapy.
            </div>
          </div>

          <div class="card" style="border-top:3px solid #10B981">
            <div class="row between">
              <strong>Serum Creatinine</strong>
              <span class="tag green">Optimal Clearance</span>
            </div>
            <div style="font-size:2.2rem; font-weight:800; font-family:var(--mono); margin:8px 0; color:#10B981">1.0 <span style="font-size:1rem; color:var(--muted)">mg/dL</span></div>
            <div class="small muted">Reference: 0.7 – 1.3 mg/dL</div>
            <div class="small" style="margin-top:10px; padding:8px 10px; background:rgba(16,185,129,0.08); border-radius:8px">
              🛡️ <strong>Copilot Insight:</strong> Normal glomerular filtration clearance. Confirms complete renal safety for current prescription.
            </div>
          </div>

          <div class="card" style="border-top:3px solid #3B82F6">
            <div class="row between">
              <strong>Platelet Count</strong>
              <span class="tag blue">Normal Rebound</span>
            </div>
            <div style="font-size:2.2rem; font-weight:800; font-family:var(--mono); margin:8px 0; color:#3B82F6">240,000 <span style="font-size:1rem; color:var(--muted)">/µL</span></div>
            <div class="small muted">Reference: 150,000 – 450,000 /µL</div>
            <div class="small" style="margin-top:10px; padding:8px 10px; background:rgba(59,130,246,0.08); border-radius:8px">
              ✅ <strong>Copilot Insight:</strong> Full recovery to physiological baseline following prior viral symptom episode.
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (S.avTab === 'safety') {
    tabContent = `
      <div class="stack" style="gap:16px">
        <div class="card" style="border-left: 4px solid #10B981">
          <div style="font-weight:700; font-size:1.05rem; color:var(--ink)">Avanade Pharmacovigilance &amp; Cross-Drug Safety Shield</div>
          <div class="muted small">Continuous algorithmic monitoring of drug-disease interactions, renal clearance thresholds, and metabolic safety</div>
        </div>

        <div class="card">
          <div class="row between" style="margin-bottom:12px; align-items:center">
            <div>
              <h3 style="margin:0">Active Monitored Regimen: Metformin Hydrochloride 500 mg</h3>
              <div class="muted small">Prescribed by Dr. Anita Mehta · Oral administration, once daily post-dinner</div>
            </div>
            <span class="tag green" style="font-size:0.9rem; padding:6px 12px">🛡️ Zero Critical Conflicts</span>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px; margin-top:16px">
            <div style="padding:14px; border-radius:12px; background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.2)">
              <div style="font-weight:700; color:#10B981; margin-bottom:4px">✅ Renal Clearance Safety Shield</div>
              <p class="small" style="margin:0; line-height:1.5">Metformin clearance is 100% renal. Patient's serum creatinine is 1.0 mg/dL (estimated GFR &gt; 90 mL/min). Clinical risk of lactic acidosis is negligible (&lt; 3 cases per 100,000 patient-years).</p>
            </div>

            <div style="padding:14px; border-radius:12px; background:rgba(245,158,11,0.06); border:1px solid rgba(245,158,11,0.2)">
              <div style="font-weight:700; color:#F59E0B; margin-bottom:4px">⚠️ Hepatic Transaminitis Advisory</div>
              <p class="small" style="margin:0; line-height:1.5">SGPT is 88 U/L. While Metformin is not hepatotoxic at 500mg, avoid dosage escalation to 1000mg+ until hepatic ultrasound and repeat liver profile are confirmed stable.</p>
            </div>

            <div style="padding:14px; border-radius:12px; background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.2)">
              <div style="font-weight:700; color:#10B981; margin-bottom:4px">✅ Cross-Drug Interaction Screen</div>
              <p class="small" style="margin:0; line-height:1.5">Cross-referenced against Paracetamol, seasonal antihistamines, and multivitamins. No cytochrome P450 CYP3A4 inhibitors or contraindicating co-prescriptions.</p>
            </div>

            <div style="padding:14px; border-radius:12px; background:rgba(16,185,129,0.06); border:1px solid rgba(16,185,129,0.2)">
              <div style="font-weight:700; color:#10B981; margin-bottom:4px">✅ Hypoglycemia Risk Profile</div>
              <p class="small" style="margin:0; line-height:1.5">Metformin is an insulin sensitizer (does not stimulate pancreatic beta-cell insulin secretion). Monotherapy carries near-zero risk of symptomatic hypoglycemia.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="stack" style="gap:24px">
      ${hero}
      ${kpis}
      ${tabs}
      ${tabContent}
    </div>
  `;
}

/* ==========================================================================
   DEMO 3: Conversational AI Workspace (ChatGPT / Claude / Gemini Style)
   ========================================================================== */
function caiSubmitPrompt(promptText) {
  if (!promptText || !promptText.trim()) return;
  const q = promptText.trim();
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  S.caiMessages = S.caiMessages || [];
  S.caiMessages.push({
    role: 'user',
    time,
    text: q
  });

  const lower = q.toLowerCase();
  let thought = '';
  let reply = '';

  if (lower.includes('sgpt') || lower.includes('liver') || lower.includes('alt')) {
    thought = `1. Searched lab reports for hepatic biomarkers: SGPT / ALT found at 88 U/L (Reference 0–45 U/L).
2. Evaluated physiological context: 1.95x elevation in an ambulatory patient without clinical jaundice.
3. Cross-referenced medications: Metformin 500mg has no hepatotoxicity profile; patient is not taking hepatotoxic NSAIDs.
4. Primary differential: Metabolic dysfunction-associated steatotic liver disease (MASLD / NAFLD) linked to Type 2 diabetes.
5. Synthesized layman explanation emphasizing reassurance, ultrasound screening, and dietary steps.`;
    reply = `### Understanding Your SGPT Level (88 U/L) in Plain English

**What is SGPT?**
SGPT (also called ALT) is an enzyme found mainly inside your liver cells. When liver cells experience mild irritation, extra fat buildup, or inflammation, they release some of this enzyme into your bloodstream.

* **Your Result:** **88 U/L**
* **Standard Healthy Range:** **0 to 45 U/L**
* **What this means:** Your level is roughly **twice the normal limit**. This is a **mild-to-moderate elevation**, not an acute medical emergency.

---

### Common Causes & Context for You
1. **Fatty Liver (Metabolic Steatosis):** Because you have Type 2 Diabetes, it is very common for excess triglycerides or sugars to temporarily store as microscopic fat droplets in liver tissue.
2. **Post-viral Recovery:** Your recent seasonal viral episode can also cause transient enzyme elevations that normalize over 4–8 weeks.
3. **Medication Check:** Your **Metformin 500mg** is cleared through your kidneys (not your liver) and is **safe** to continue.

---

### Practical Next Steps to Discuss with Dr. Anita Mehta:
* **Ultrasound Whole Abdomen:** A simple 10-minute scan to confirm if mild fatty liver is present.
* **Repeat LFT in 6–8 Weeks:** To track if the numbers are returning to the normal zone.
* **Dietary Focus:** Cutting out sugary drinks, refined flour, and deep-fried foods can significantly reduce liver fat within weeks.`;
  } else if (lower.includes('diet') || lower.includes('carb') || lower.includes('food') || lower.includes('eat')) {
    thought = `1. Analyzed metabolic parameters: Fasting glucose 118 mg/dL, HbA1c 6.9%, SGPT 88 U/L.
2. Formulated nutritional prescription targeting simultaneous glycemic stabilization and hepatic steatosis reversal.
3. Designed practical meal structure aligned with Indian dietary preferences.`;
    reply = `### Personalized Nutritional Plan for Jay (HbA1c 6.9% & SGPT 88 U/L)

To lower fasting blood sugar and reduce liver fat simultaneously, the gold standard is a **low-glycemic, anti-inflammatory Mediterranean/DASH-style dietary approach**:

---

#### 🟢 Foods to Prioritize Every Day
* **High-Fiber Complex Carbs:** Whole pulses (moong, chana, rajma), steel-cut oats, quinoa, or millets (jowar, ragi) instead of white polished rice.
* **Leafy Greens & Sulfur Vegetables:** Spinach (palak), methi, broccoli, cabbage, cauliflower (these supply glutathione precursors which support liver detoxification).
* **Healthy Fats:** 5–6 soaked almonds, 2 walnuts, olive oil or cold-pressed mustard oil in moderation (rich in Omega-3 & monounsaturated fats).
* **Lean Proteins:** Tofu, paneer, sprouts, eggs, or skinless chicken/fish to preserve muscle and prevent glucose spikes.

---

#### 🔴 Foods to Strictly Minimize
* **Liquid Sugars:** Fruit juices, sweetened sodas, sweetened chai/coffee (fructose directly converts to liver fat).
* **Refined Flours & Trans Fats:** Maida breads, bakery biscuits, samosas, packaged snacks.
* **Late-night Heavy Meals:** Finish dinner by 8:00 PM; Metformin 500mg works best when not competing with heavy late-night carb loads.

---

#### 🚶 Exercise Synergy
* **The "10-Minute Post-Meal Walk":** Walking briskly for 10–15 minutes after lunch and dinner drops postprandial glucose by 20–30% and accelerates liver fat burning.`;
  } else if (lower.includes('metformin') || lower.includes('damage') || lower.includes('kidney') || lower.includes('renal')) {
    thought = `1. Pharmacovigilance screening: Metformin Hydrochloride 500mg oral OD.
2. Verified renal clearance: Serum Creatinine 1.0 mg/dL -> estimated GFR >90 mL/min (normal).
3. Evaluated hepatic contraindications: Mild transaminitis without hepatic failure is NOT a contraindication.
4. Formulated clear safety reassurance backed by pharmacological evidence.`;
    reply = `### Pharmacovigilance Assessment: Metformin 500 mg

**Direct Answer:** **No, Metformin 500 mg does not cause liver damage**, nor is it the cause of your elevated SGPT (88 U/L).

---

### Pharmacological Facts
1. **Kidney Clearance:** Metformin is **not metabolized by the liver**. It is filtered and excreted almost entirely through your kidneys.
2. **Renal Safety Confirmed:** Your **Serum Creatinine is 1.0 mg/dL**, which corresponds to an estimated glomerular filtration rate (eGFR) over **90 mL/min**. This confirms your kidneys are clearing the medication normally and safely.
3. **Lactic Acidosis Risk:** Clinical studies show that at 500 mg daily with normal renal function, the risk of lactic acidosis is practically zero (<3 in 100,000 patient-years).
4. **Protective Effects:** In many clinical trials, Metformin actually **improves** fatty liver disease over time by increasing insulin sensitivity in hepatic tissue.

---

**Clinical Takeaway:** You should **not stop taking your Metformin 500 mg** without Dr. Anita Mehta's guidance, as it is keeping your HbA1c at 6.9%.`;
  } else if (lower.includes('email') || lower.includes('draft') || lower.includes('visit') || lower.includes('doctor') || lower.includes('brief')) {
    thought = `1. Gathered patient context: Jay Tawri (28 M), Type 2 Diabetes, Metformin 500mg OD.
2. Highlighted key findings: Fasting glucose 118, SGPT 88, HbA1c 6.9%, Creatinine 1.0.
3. Drafted a structured, professional physician brief ready to copy or email.`;
    reply = `### Draft Physician Consultation Brief for Dr. Anita Mehta

**Patient:** Jay Tawri (28y Male) · **Date of Review:** 24 October 2026
**Current Medication:** Metformin Hydrochloride 500 mg OD (Post-dinner)

---

**Dear Dr. Mehta,**

I am writing to share my recent lab report from CityCare Diagnostic Pathology (dated 22-Sep-2026) ahead of our upcoming consultation.

**Current Lab Summary:**
* **Fasting Blood Sugar:** 118 mg/dL *(Reference: 70–100 mg/dL)*
* **HbA1c:** 6.9% *(Diabetic target: <7.0%)*
* **SGPT / ALT:** 88 U/L *(Reference: 0–45 U/L — 1.95x elevated)*
* **Serum Creatinine:** 1.0 mg/dL *(Normal renal clearance)*
* **Platelet Count:** 240,000 /µL *(Normal recovery post seasonal cough)*

**Questions for Our Consultation:**
1. Given the elevated SGPT (88 U/L), would you recommend an **Ultrasound of the Whole Abdomen** to check for fatty liver (steatosis)?
2. Should I continue Metformin 500 mg at the current dosage, or do you recommend repeating the LFT and Lipid profile in 6 weeks?
3. Are there specific dietary or lifestyle modifications you would advise to bring both fasting sugar and liver enzymes into the optimal range?

Thank you,  
**Jay Tawri**`;
  } else {
    thought = `1. Synthesized user inquiry: "${q}".
2. Cross-referenced Jay Tawri's health profile: 28y M, Type 2 DM (HbA1c 6.9%, Fasting Glucose 118), SGPT 88 U/L, Creatinine 1.0 mg/dL, Metformin 500mg.
3. Provided structured, evidence-based clinical guidance.`;
    reply = `### Clinical Copilot Response

Regarding your query: *"**${esc(q)}**"*

Based on Jay Tawri's clinical records (CityCare Diagnostic Pathology and Dr. Anita Mehta's prescription):

* **Current Health Status:** Type 2 Diabetes is well-controlled on Metformin 500 mg (HbA1c 6.9%). Platelets have recovered to a normal 240,000 /µL.
* **Areas for Monitoring:** Fasting blood sugar is slightly elevated at 118 mg/dL, and SGPT (liver enzyme) is 88 U/L (mild elevation requiring ultrasound evaluation).
* **Medication Safety:** Normal serum creatinine (1.0 mg/dL) confirms complete renal safety for Metformin continuation.

Feel free to ask for specific diet guidelines, medication interactions, or a summary for your doctor!`;
  }

  S.caiMessages.push({
    role: 'assistant',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    thought,
    text: reply
  });

  render();
}

function viewConversationalAI(I) {
  S.caiThread = S.caiThread || 't1';
  if (!S.caiMessages || !S.caiMessages.length) {
    S.caiMessages = [
      {
        role: 'user',
        time: '10:14 AM',
        text: 'Can you summarize Jay Tawri\'s latest medical status, abnormal lab values, and what adjustments or questions we should ask Dr. Anita Mehta?'
      },
      {
        role: 'assistant',
        time: '10:14 AM',
        thought: `1. Extracted and cross-correlated 4 primary clinical records from Jay Tawri's encrypted vault.
2. Verified CityCare Diagnostic Pathology Report (22 Sep 2026):
   • Fasting Blood Sugar: 118 mg/dL (Abnormal - Pre-diabetic baseline cutoff 100 mg/dL).
   • SGPT / ALT: 88 U/L (Elevated - 1.95x upper limit of normal 45 U/L).
   • HbA1c: 6.9% (Fair diabetic control, within ADA therapeutic target <7.0%).
   • Serum Creatinine: 1.0 mg/dL (Optimal renal clearance, validates Metformin safety).
   • Platelet Count: 240,000 /µL (Recovered, normal physiological range).
3. Evaluated Dr. Anita Mehta Prescription (10 Feb 2026):
   • Metformin Hydrochloride 500 mg OD (Oral, once daily post-dinner).
4. Formulated actionable clinical recommendations prioritizing liver enzyme monitoring and physician questions.`,
        text: `### Clinical Executive Summary: Jay Tawri (28y Male)

Jay's overall health profile demonstrates **stable glycemic management** on monotherapy, alongside an **isolated liver enzyme elevation (SGPT 88 U/L)** that warrants clinical follow-up with Dr. Anita Mehta.

---

### 🔍 Key Diagnostic Findings

| Diagnostic Biomarker | Jay's Value | Standard Clinical Range | Status / Copilot Insight | Source Document |
| :--- | :--- | :--- | :--- | :--- |
| **Fasting Blood Sugar** | **118 mg/dL** | 70 – 100 mg/dL | ⚠️ **Mild Elevation** (Impaired fasting glucose) | *CityCare Labs 22-Sep* |
| **SGPT / ALT** | **88 U/L** | 0 – 45 U/L | ⚠️ **Elevated 1.95x** (Suggestive of metabolic steatosis / NAFLD) | *CityCare Labs 22-Sep* |
| **HbA1c** | **6.9%** | &lt; 7.0% (Diabetic target) | ✅ **Controlled** (Target achieved on Metformin 500mg) | *CityCare Labs 22-Sep* |
| **Serum Creatinine** | **1.0 mg/dL** | 0.7 – 1.3 mg/dL | ✅ **Normal Clearance** (Confirms safe Biguanide use) | *CityCare Labs 22-Sep* |
| **Platelets** | **240,000 /µL** | 150k – 450k /µL | ✅ **Normal** (Rebounded from previous seasonal illness) | *CityCare Labs 22-Sep* |

---

### 💊 Current Medication Assessment
* **Metformin 500 mg (1 tab daily):** Safe to continue. Patient's normal creatinine (1.0 mg/dL) provides clear renal safety against lactic acidosis.

---

### 📋 Recommended Discussion Points for Dr. Anita Mehta
1. **Ultrasound Screening:** Request an Ultrasound of the Whole Abdomen to check for mild hepatic steatosis (fatty liver) correlating with SGPT 88 U/L.
2. **Repeat LFT Timeline:** Ask if repeat SGPT and a Fasting Lipid Profile should be performed in 6 weeks.
3. **Lifestyle Adjustments:** Maintain a lower glycemic index diet (&lt;130g carbs/day) and 30 minutes of brisk daily walking to simultaneously reduce both fasting sugar and liver triglycerides.`
      }
    ];
  }

  const threads = [
    { id: 't1', title: 'HbA1c & Fasting Glucose Plan', time: 'Today' },
    { id: 't2', title: 'Metformin 500mg Renal Clearance', time: 'Yesterday' },
    { id: 't3', title: 'CityCare Lab Diagnostic Summary', time: '22 Sep' },
    { id: 't4', title: 'Platelet Rebound from Viral Illness', time: '15 Sep' },
    { id: 't5', title: 'Prep for Dr. Anita Mehta Visit', time: '10 Feb' }
  ];

  const threadListHTML = threads.map(t => `
    <button type="button" class="cai-thread-item ${S.caiThread === t.id ? 'active' : ''}" data-thread="${t.id}">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">${t.title}</span>
    </button>
  `).join('');

  const msgsHTML = S.caiMessages.map(m => {
    const isUser = m.role === 'user';
    const avatar = isUser ? '<div class="cai-avatar u-av">JT</div>' : '<div class="cai-avatar ai-av">✨</div>';
    let body = '';
    if (m.thought) {
      body += `
        <details class="cai-thought-box" open>
          <summary>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a6 6 0 0 0-6 6c0 2.22 1.21 4.16 3 5.2V17a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-3.8c1.79-1.04 3-2.98 3-5.2a6 6 0 0 0-6-6zM10 21h4"></path></svg>
            Clinical Reasoning &amp; Audit Trail
          </summary>
          <div class="cai-thought-content">${esc(m.thought).replace(/\n/g, '<br>')}</div>
        </details>
      `;
    }
    body += caiMarkdown(m.text);
    return `
      <div class="cai-msg-row ${isUser ? 'user' : 'ai'}">
        ${avatar}
        <div class="cai-bubble">
          <div class="row between" style="margin-bottom:8px">
            <strong style="font-size:0.88rem; color:${isUser ? '#3B82F6' : '#8B5CF6'}">${isUser ? 'Jay Tawri (Patient)' : 'Medical AI Copilot'}</strong>
            <span class="muted small">${m.time || ''}</span>
          </div>
          <div class="cai-text">${body}</div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="cai-workspace">
      <!-- Sidebar -->
      <aside class="cai-sidebar">
        <button type="button" class="cai-new-btn" id="caiNewChatBtn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          New Consultation
        </button>

        <div class="cai-patient-capsule">
          <strong>Jay Tawri</strong>
          <div class="muted small">28y · Male · ABHA: 91-8273-9912</div>
          <div class="small" style="color:#8B5CF6; font-weight:700; margin-top:4px">● 4 Encrypted Vault Records Loaded</div>
        </div>

        <div style="font-size:0.78rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; color:var(--muted); margin-top:8px; padding-left:6px">Recent Clinical Threads</div>
        <div class="cai-thread-list">
          ${threadListHTML}
        </div>

        <div style="margin-top:auto; padding-top:14px; border-top:1px solid var(--line-light); font-size:0.8rem; color:var(--muted); display:flex; align-items:center; gap:6px">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10B981"></span>
          <span>Claude 3.5 Sonnet / Gemini 2.5 Pro Medical Core</span>
        </div>
      </aside>

      <!-- Main Chat Area -->
      <main class="cai-chat-area">
        <div class="cai-header-bar">
          <div class="cai-model-tag">
            <span class="sparkle">✨</span>
            <span>Conversational Health Copilot</span>
            <span class="tag purple" style="font-size:0.75rem; padding:2px 8px">Standard AI Mode</span>
          </div>
          <div class="row" style="gap:8px">
            <button type="button" class="btn small ghost" id="caiClearBtn" title="Clear conversation">🗑️ Clear</button>
            <button type="button" class="btn small secondary" onclick="alert('Exporting clinical conversation brief as signed summary.')">📄 Export Brief</button>
          </div>
        </div>

        <div class="cai-mobile-threads" aria-label="Recent consultation threads">
          ${threads.map(t => `<button type="button" class="cai-mobile-thread-chip ${S.caiThread === t.id ? 'active' : ''}" data-thread="${t.id}">💬 ${esc(t.title)}</button>`).join('')}
        </div>

        <div class="cai-stream" id="caiStream">
          ${msgsHTML}
        </div>

        <!-- Prompt Starter Pills -->
        <div style="margin-top:12px">
          <div style="font-size:0.82rem; font-weight:700; color:var(--muted); margin-bottom:8px">Suggested Clinical Queries:</div>
          <div class="cai-starters">
            <button type="button" class="cai-starter-btn" data-prompt="Explain SGPT 88 U/L in plain English for Jay">
              <span>🔬</span>
              <span>Explain SGPT 88 U/L in plain English</span>
            </button>
            <button type="button" class="cai-starter-btn" data-prompt="What dietary plan is best for HbA1c 6.9% and elevated liver enzymes?">
              <span>🥗</span>
              <span>Personalized low-carb diet for Jay</span>
            </button>
            <button type="button" class="cai-starter-btn" data-prompt="Can Metformin 500 mg cause liver damage or raise SGPT?">
              <span>💊</span>
              <span>Does Metformin damage the liver or kidneys?</span>
            </button>
            <button type="button" class="cai-starter-btn" data-prompt="Draft a physician consultation brief to email Dr. Anita Mehta">
              <span>📋</span>
              <span>Draft visit consultation brief for Dr. Mehta</span>
            </button>
          </div>
        </div>

        <!-- Sticky Floating Dock -->
        <div class="cai-input-dock">
          <form id="caiForm" class="cai-input-row">
            <button type="button" class="btn ghost" style="padding:6px; border:0" title="Attach Lab Report or Prescription" onclick="alert('Select a prescription or lab report PDF/image to upload and parse.')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
            </button>
            <input type="text" id="caiInput" placeholder="Ask anything about Jay's labs, medications, or doctor visits..." autocomplete="off">
            <button type="submit" class="cai-send-btn" title="Send query" aria-label="Send">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </form>
        </div>
      </main>
    </div>
  `;
}

function viewHealth() {
  const head = '<div class="page-head"><h1>' + esc(t('health_title')) + '</h1><p>' + esc(t('health_sub')) + '</p></div>';
  if (!S.records.length && !S.vitals.length) return head + '<div class="card empty"><p>' + esc(t('none_yet')) + '</p><button type="button" class="btn" data-act="nav" data-view="add">' + esc(t('go_add')) + '</button></div>' +
    (typeof hubTiles === 'function' ? hubTiles() : '');  // wellness.js
  const p = S.patient || {}, ab = abhaNumber(p);
  const sexLbl = s => { const v = String(s || '').toLowerCase(); return v === 'male' || v === 'm' ? t('sex_male') : (v === 'female' || v === 'f' ? t('sex_female') : (s || '')); };
  const headV = '<div class="page-head row between"><div><div class="kicker">' + esc(t('health_title')) + '</div><h1>' + esc(greetingLine()) + '</h1><p>' +
    esc(fmtDate(todayKey(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })) + '</p></div>' +
    '<button type="button" class="btn secondary" data-act="visit">' + esc(t('visit_btn')) + '</button></div>';
  const g = getInsights();
  if (g.loading) {
    return headV + '<div class="dash"><div class="card dash-lead"><div class="skeleton" style="width:30%;height:44px"></div><div class="skeleton" style="width:70%"></div><div class="skeleton" style="width:50%"></div></div>' +
      '<div class="dash-side">' + skelCard(2) + skelCard(2) + '</div></div><div class="stack">' + skelCard(3) + skelCard(4) + '</div><p class="muted small" role="status">' + esc(t('ins_loading')) + '</p>';
  }
  const I = g.data, ov = S.overview[lang];
  const demoMode = getDemoMode();
  if (demoMode === '2') return headV + viewAvanadeCopilot(I);
  if (demoMode === '3') return viewConversationalAI(I);
  const sched = I.medicines.filter(m => m.status !== 'course_ended').map(m => ({ m, date: m.date }));
  const tile = (n, label, cls) => '<div class="stat ' + cls + '"><div class="stat-n">' + esc(n) + '</div><div class="stat-l">' + esc(label) + '</div></div>';
  const tiles = '<div class="stats">' + tile(S.records.length, t('stat_records'), 's-teal') + tile(I.attention.length, t('stat_out'), I.attention.length ? 's-amber' : 's-green') +
    tile(I.medicines.length, t('stat_meds_rec'), 's-blue') + tile(I.conditions.length, t('stat_cond'), 's-plain') + '</div>';
  const series = trendSeries(I);
  const attn = '<div class="card"><h2 style="margin-bottom:10px">' + esc(t('attn_title')) + '</h2>' +
    (I.attention.length ? '<ul class="list">' + I.attention.map(a => '<li><span class="l"><strong>' + esc(a.name) + '</strong><br><span class="muted small">' + esc(fmtDate(a.date)) + (a.ref_text ? ' · ' + esc(t('t_range')) + ': ' + esc(a.ref_text) : '') + '</span>' + attnAge(a.date) + recLinks([a.record]) + '</span><span class="r"><span class="mono">' + esc(a.value == null ? '' : a.value) + ' ' + esc(a.unit || '') + '</span><br>' + badge(a.flag) + '</span></li>').join('') + '</ul>'
      : '<p class="dash-okline">' + esc(okLine(I).text) + '</p>') + '</div>';
  const latestCard = '<div class="card"><h2 style="margin-bottom:10px">' + esc(t('h_latest')) + '</h2>' +
    (I.tests.length ? '<ul class="list">' + I.tests.map(x => { const l = x.latest; return '<li><span class="l">' + esc(x.name) + '<br><span class="muted small">' + esc(fmtDate(l.date)) + '</span></span><span class="r"><span class="mono">' + esc(l.value == null ? ptVal(l) : l.value) + ' ' + esc(l.unit || x.unit || '') + '</span><br>' + badge(l.flag) + '</span></li>'; }).join('') + '</ul>' : '<p class="muted">' + esc(t('no_items')) + '</p>') + '</div>';
  const trendsCard = '<div class="card full"><h2 style="margin-bottom:10px">' + esc(t('h_trends')) + '</h2>' +
    (series.length ? '<div class="trends">' + series.map(s => '<div class="trend"><h4><span>' + esc(s.name) + '</span><span class="mono muted small">' + esc(s.unit) + '</span></h4>' + chartSVG(s) + (s.skipped ? '<p class="muted small">' + esc(t('unit_skip', { n: s.skipped })) + '</p>' : '') + '</div>').join('') + '</div><p class="muted small" style="margin-top:8px">' + esc(t('band_note')) + '</p><p class="muted small" style="margin:2px 0 0">' + esc(t('trend_hist')) + '</p>' : '<p class="muted">' + esc(t('no_trends')) + '</p>') + '</div>';
  const crossCard = I.cross.length ? '<div class="card"><h2 style="margin-bottom:10px">' + esc(t('cross_title')) + '</h2><ul class="list cross">' + I.cross.map(c => '<li><span class="l"><strong>' + esc(c.title) + '</strong><br><span class="small">' + esc(c.note) + '</span>' + recLinks(c.records) + '</span></li>').join('') + '</ul></div>' : '';
  const qCard = I.questions.length ? '<div class="card"><h2 style="margin-bottom:10px">' + esc(t('q_title')) + '</h2><ul class="list cross">' + I.questions.map(q => '<li><span class="l">' + esc(q.text) + recLinks(q.records) + '</span></li>').join('') + '</ul></div>' : '';
  const ovCard = '<div class="card"><div class="row between"><h2>' + esc(t('overview_title')) + '</h2><div class="row">' + (ov && ov.summary ? listenBtn('overview') : '') + '<button type="button" class="btn secondary" data-act="overview"' + (S.busy.overview ? ' disabled' : '') + '>' + esc(S.busy.overview ? t('working') : t('gen_overview')) + '</button></div></div>' +
    (ov ? '<div style="margin-top:12px">' + (ov.summary ? '<p>' + esc(ov.summary) + '</p>' : '') +
      (arr(ov.highlights).length ? '<h3 style="margin:10px 0 4px">' + esc(t('highlights')) + '</h3><ul class="qlist">' + ov.highlights.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') +
      (arr(ov.watch).length ? '<h3 style="margin:10px 0 4px">' + esc(t('watch')) + '</h3><ul class="qlist">' + ov.watch.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '') +
      (ov.disclaimer ? '<p class="muted small" style="margin-top:10px">' + esc(ov.disclaimer) + '</p>' : '') + '</div>' : '') + '</div>';
  const condCard = '<div class="card"><h2 style="margin-bottom:10px">' + esc(t('h_conditions')) + '</h2>' +
    (I.conditions.length ? '<ul class="list conds">' + I.conditions.map(c => {
      const ms = arr(c.mentions);
      return '<li><span class="l">' + esc(c.name) + '</span><span class="r muted small">' + (c.first_seen ? esc(t('first_seen', { d: fmtDate(c.first_seen) })) : '') + '</span>' +
        (ms.length ? '<details class="mentions"><summary>' + esc(t('ment_title', { n: ms.length })) + '</summary><ul>' + ms.map(m => '<li>“' + esc(m.text) + '”' + (m.date ? ' <span class="muted small">' + esc(fmtDate(m.date)) + '</span>' : '') + ' ' + recLink(m.record, t('ment_open')) + '</li>').join('') + '</ul></details>' : '') + '</li>';
    }).join('') + '</ul>' : '<p class="muted">' + esc(t('no_items')) + '</p>') + '</div>';
  const patientCard = '<div class="card"><h2 style="margin-bottom:10px">' + esc(t('h_patient')) + '</h2><dl class="kv"><dt>' + esc(t('h_name')) + '</dt><dd>' + esc(p.name || '-') + '</dd><dt>' + esc(t('h_age')) + '</dt><dd>' + esc(p.age || '-') + '</dd><dt>' + esc(t('h_sex')) + '</dt><dd>' + esc(sexLbl(p.sex) || '-') + '</dd><dt>' + esc(t('h_abha')) + '</dt><dd class="mono">' + esc(ab ? ab + ' (' + t('mock_tag') + ')' : t('not_linked')) + '</dd></dl></div>';
  // Folding sections keep a long dashboard readable; the first ones start open and a choice is kept across re-renders.
  const sec = (k, body, open) => '<details class="hsec" data-k="' + k + '"' + ((S.secOpen && k in S.secOpen ? S.secOpen[k] : open) ? ' open' : '') +
    '><summary class="kicker">' + esc(t(k)) + '</summary>' + body + '</details>';
  // The overview only; medicines, visits, journal and wellness have their own views (hubTiles links to them).
  return headV + dashHTML(I) + tiles + (typeof hubTiles === 'function' ? hubTiles() : '') /* wellness.js */ + (window.SehatRem ? SehatRem.actionsCard() : '') /* reminders.js */ +
    sec('kick_results', '<div class="stack">' + attn + jrH(I, 'risk') + '</div><div class="health-grid" style="margin-top:14px">' + latestCard + trendsCard + '</div>', true) +
    sec('kick_doctor', '<div class="stack">' + crossCard + qCard + ovCard + '</div>', true) +
    sec('kick_about', '<div class="health-grid">' + patientCard + condCard + '</div>', false);
}
async function genOverview() {
  if (S.busy.overview) return;
  S.busy.overview = true; clearError(); render();
  const L = lang;
  try {
    const res = await api('/api/overview', { patient: S.patient || {}, records: S.records.map(lite), lang: L });
    S.overview[L] = res.overview || {};
  } catch (e) { showError(e.message, genOverview); }
  S.busy.overview = false; render();
}

/* ================= View: Ask ================= */
function srcChips(ids) {
  return arr(ids).map(id => {
    const r = getRec(id);
    if (!r && S.draft && (S.draft.id === id || id === 'open_document')) return '<button type="button" class="chip" data-act="nav" data-view="add">' + esc(t('ask_ctx_draft', { title: S.draft.title || typeLabel(S.draft.doc_type) })) + '</button>';
    if (!r) return '';
    return '<button type="button" class="chip" data-act="openrec" data-id="' + esc(id) + '">' + esc((r.title || typeLabel(r.doc_type)) + (r.date ? ' (' + fmtDate(r.date) + ')' : '')) + '</button>';
  }).join('');
}
/* A document dropped into the chat is read and explained right there. It stays a draft
   ("under review") until the user checks it against the original and saves it. */
function chatRecords() {
  const ended = {}, ok = curGet();
  curInsights().medicines.forEach(m => { if (m.status === 'course_ended') ended[curKey(m)] = 1; });
  const list = S.records.map(r => {
    const c = lite(r);
    arr(c.medicines).forEach(m => { const k = curKey(m); m.status = ended[k] ? 'course_ended' : (ok[k] ? 'confirmed_current' : 'unconfirmed'); });
    return c;
  });
  if (S.draft && !S.editingId) { const d = lite(S.draft); d.under_review = true; if (!d.id) d.id = 'open_document'; list.push(d); }
  return list;
}
function askContextHTML() {
  const p = S.patient || {}, n = S.records.length;
  let h = '<p class="muted small ask-ctx">' + esc(n ? t('ask_ctx', { name: p.name || t('you'), n: n }) : t('ask_ctx_none'));
  if (S.draft && !S.editingId) h += '<br><strong>' + esc(t('ask_ctx_draft', { title: S.draft.title || typeLabel(S.draft.doc_type) })) + '</strong>';
  return h + '</p>';
}
function docMsgHTML(m) {
  const d = m.doc, ex = d.ex || {}, li = a => '<ul class="doc-ul">' + a.map(x => '<li>' + x + '</li>').join('') + '</ul>';
  let h = '<strong>' + esc(d.title) + '</strong>' + (d.date ? ' <span class="muted small">' + esc(fmtDate(d.date)) + '</span>' : '');
  if (d.patient) h += '<br><span class="muted small">' + esc(t('doc_for')) + ': ' + esc(d.patient) + '</span>';
  if (ex.summary) h += '<p style="margin:8px 0">' + esc(ex.summary) + '</p>';
  const f = arr(ex.findings).filter(x => x && x.flag !== 'normal');
  if (f.length) h += '<div class="muted small">' + esc(t('doc_found')) + '</div>' + li(f.map(x => '<b>' + esc(x.name) + '</b> ' + badge(x.flag) + '<br>' + esc(x.meaning || '')));
  if (d.meds.length) h += '<div class="muted small">' + esc(t('doc_meds')) + '</div>' + li(d.meds.map(x => '<b>' + esc(x.name) + '</b>' + (x.unsure ? ' <span class="flag f-unknown">' + esc(t('flag_unknown')) + '</span><br><span class="small" style="color:var(--warn)">' + esc(t('doc_unsure')) + '</span>' : (x.purpose ? ': ' + esc(x.purpose) : ''))));
  const w = d.warnings.slice();
  if (d.unread) w.push(t('doc_unread', { n: d.unread }));
  if (w.length) h += '<div class="muted small">' + esc(t('doc_check')) + '</div>' + li(w.map(esc));
  return h + '<p class="muted small" style="margin:8px 0">' + esc(t('doc_ask')) + '</p>' +
    (S.draft && S.draft.id === d.id ? '<button type="button" class="btn small" data-act="nav" data-view="add">' + esc(t('doc_save')) + '</button>' : '');
}
async function chatFile(file) {
  if (!file || S.asking) return;
  const mime = file.type || guessMime(file.name), isImg = mime.indexOf('image/') === 0;
  if (!(isImg || mime === 'application/pdf' || mime === 'text/plain' || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) return showError(t('err_type'));
  if (!isImg && file.size > 3 * 1024 * 1024) return showError(t('err_size'));
  if (S.draft && (S.dirty || S.editingId) && !confirm(t('discard') + '?')) return;
  clearError();
  S.chat.push({ role: 'me', text: t('ask_doc_me', { name: file.name || 'upload' }) });
  S.asking = true; S.reading = true; render(); scrollChat();
  try {
    const dataUrl = isImg ? await downscale(file) : await readAsDataURL(file), outMime = isImg ? 'image/jpeg' : mime;
    let res;
    try {
      res = await api('/api/extract', { filename: file.name || 'upload', mime: outMime, data: String(dataUrl).split(',')[1] || '', lang, skip: skipGet() });
      skipSet(res.resting);
    } catch (e) { if (e.code === 'vision_unavailable') throw new Error(t('err_busy')); throw e; }
    const rec = normalizeRecord(res.record);
    if (unreadable(rec)) throw new Error(t('err_unread'));
    S.draft = rec; S.pendingFile = { mime: outMime, dataUrl }; S.previewFile = null;
    S.dirty = false; S.reflag = false; S.stage = 'review'; S.editingId = null;
    let ex = {};
    try { ex = (await api('/api/explain', { record: Object.assign(lite(rec), { under_review: true }), lang })).explanation || {}; S.draft.explanation = ex; } catch (e) { /* the facts below still show */ }
    const purpose = {};
    arr(ex.medicines).forEach(x => { if (x && x.name) purpose[x.name] = x.purpose; });
    S.chat.push({ role: 'bot', label: 'review', doc: {
      id: rec.id, title: rec.title || typeLabel(rec.doc_type), date: rec.date, patient: (rec.patient || {}).name || '', ex,
      meds: arr(rec.medicines).map(x => { const unsure = isNum(x.confidence) && x.confidence < 0.7; return { name: [x.name, x.strength].filter(Boolean).join(' '), unsure, purpose: unsure ? '' : (purpose[x.name] || '') }; }),
      warnings: arr(rec.warnings).map(warnText), unread: arr(rec.unread).length
    } });
  } catch (e) {
    S.chat.push({ role: 'bot', text: e.message || t('err_generic'), label: 'general' });
  }
  S.asking = false; S.reading = false; render(); scrollChat();
}
function viewAsk() {
  const head = '<div class="page-head"><h1>' + esc(t('ask_title')) + '</h1><p>' + esc(t('ask_sub')) + '</p></div>';
  const qs = !S.records.length ? '' : ['q1', 'q2', 'q3'].map(k => '<button type="button" class="chip" data-act="askq" data-q="' + k + '">' + esc(t(k)) + '</button>').join('');
  const msgs = S.chat.map(m => {
    if (m.role === 'me') return '<div class="msg me"><div class="who">' + esc(t('you')) + '</div>' + esc(m.text) + '</div>';
    if (m.doc) return '<div class="msg"><div class="who">' + esc(t('assistant')) + '<span class="lbl lbl-doctor">' + esc(t('label_review')) + '</span></div>' + docMsgHTML(m) + '</div>';
    const src = srcChips(m.sources);
    const kinds = ['records', 'general', 'doctor', 'emergency', 'signin'];
    const lbl = kinds.indexOf(m.label) >= 0 ? '<span class="lbl lbl-' + m.label + '">' + esc(t('label_' + m.label)) + '</span>' : '';
    return '<div class="msg' + (m.label === 'emergency' ? ' urgent' : '') + '"><div class="who">' + esc(t('assistant')) + lbl + '</div>' + esc(m.label === 'signin' ? t('signin_msg') : m.text) + signinBtns(m) + msgListen(m) + (src ? '<div class="srcs"><div class="muted small" style="margin-bottom:4px">' + esc(t('sources')) + '</div><div class="chips">' + src + '</div></div>' : '') + '</div>';
  }).join('');
  return head + askContextHTML() + '<div class="chips">' + qs + '</div>' +
    '<div class="chat" id="chat">' + msgs + (S.asking ? '<div class="msg muted">' + esc(t(S.reading ? 'ask_reading' : 'thinking')) + '</div>' : '') + '</div>' +
    '<form class="askform" id="askForm"><button type="button" class="btn secondary" data-act="askfile"' + (S.asking ? ' disabled' : '') + '>' + esc(t('ask_attach')) + '</button><input type="text" id="askInput" placeholder="' + esc(t('ask_ph')) + '" aria-label="' + esc(t('ask_ph')) + '" autocomplete="off"><button type="submit" class="btn"' + (S.asking ? ' disabled' : '') + '>' + esc(t('ask_send')) + '</button></form>';
}
async function ask(q) {
  q = String(q || '').trim();
  if (!q || S.asking) return;
  S.chat.push({ role: 'me', text: q });
  const known = window.SehatFAQ ? SehatFAQ.answer(q) : null;
  if (known && (known.kind === 'faq' || (known.kind === 'emergency' && !currentUser()))) {
    // what the product is, how it works, pricing, privacy: fixed answers, no model, no sign-in
    S.chat.push({ role: 'bot', text: siteText(known.text), label: known.kind === 'emergency' ? 'emergency' : 'general' });
    render(); scrollChat();
    return;
  }
  if (!currentUser()) {
    // guests: questions about reports need sign-in; nothing is sent to the API
    S.chat.push({ role: 'bot', text: '', label: 'signin', q: q });
    render(); scrollChat();
    return;
  }
  S.asking = true; clearError(); render(); scrollChat();
  try {
    const res = await api('/api/ask', { question: q, records: chatRecords(), lang });
    S.chat.push({ role: 'bot', text: res.answer || '', sources: arr(res.sources), label: res.label || null });
  } catch (e) {
    showError(e.message, () => ask(q));
  }
  S.asking = false; render(); scrollChat();
}
function scrollChat() { const c = $('#chat'); if (c) { const f = $('#askForm'); (f || c).scrollIntoView({ block: 'end' }); } }

/* ================= View: ABHA ================= */
function fmtAbha(digits) {
  const d = String(digits || '').replace(/\D/g, '').slice(0, 14);
  const parts = [d.slice(0, 2), d.slice(2, 6), d.slice(6, 10), d.slice(10, 14)].filter(Boolean);
  return parts.join('-');
}
function viewAbha() {
  const p = S.patient || {};
  const linked = abhaNumber(p);
  const addr = p.abha && typeof p.abha === 'object' ? p.abha.address : '';
  const counts = {};
  if (S.fhir) arr(S.fhir.entry).forEach(e => { const rt = e && e.resource && e.resource.resourceType; if (rt) counts[rt] = (counts[rt] || 0) + 1; });
  return '<div class="page-head"><h1>' + esc(t('abha_title')) + '</h1></div><div class="stack">' +
    '<div class="card"><p>' + esc(t('abha_about1')) + '</p><p class="muted" style="margin:0">' + esc(t('abha_about2')) + '</p></div>' +
    '<div class="card"><div class="notice info" style="margin-bottom:12px">' + esc(t('abha_demo')) + '</div>' +
    (S.abhaFlow ? abhaFlowHTML() + '<p class="muted small" style="margin:12px 0 0">' + esc(t('ab_real')) + '</p></div>' : (linked ? '<p><strong>' + esc(t('abha_linked', { n: '' })) + '</strong><span class="mono">' + esc(linked) + '</span>' + (addr ? '<br><span class="muted small">' + esc(t('abha_addr')) + ': <span class="mono">' + esc(addr) + '</span></span>' : '') + '</p>' +
      '<button type="button" class="btn" data-act="abhaimport"' + (S.busy.abha ? ' disabled' : '') + '>' + esc(S.busy.abha ? t('working') : t('abha_import')) + '</button>' : '') +
    '<form class="abha-form" id="abhaForm" style="' + (linked ? 'margin-top:14px' : '') + '"><label class="fld"><span>' + esc(t('abha_label')) + '</span><input type="text" id="abhaInput" class="mono" inputmode="numeric" placeholder="12-3456-7890-1234" maxlength="17" autocomplete="off"></label>' +
    '<button type="submit" class="btn' + (linked ? ' secondary' : '') + '"' + (S.busy.abha ? ' disabled' : '') + '>' + esc(S.busy.abha ? t('working') : t('ab_send')) + '</button></form>' +
    (S.notice ? '<p class="small" style="margin-top:10px;color:var(--ok)">' + esc(S.notice) + '</p>' : '') +
    '<p class="muted small" style="margin:12px 0 0">' + esc(t('ab_real')) + '</p></div>') +
    '<div class="card"><h2 style="margin-bottom:6px">' + esc(t('fhir_title')) + '</h2><p class="muted">' + esc(t('fhir_note')) + '</p>' +
    '<button type="button" class="btn" data-act="fhir"' + (S.busy.fhir || !S.records.length ? ' disabled' : '') + '>' + esc(S.busy.fhir ? t('working') : t('fhir_btn')) + '</button>' +
    (S.fhir ? '<div style="margin-top:14px"><div class="muted small">' + esc(t('fhir_counts')) + '</div><div class="counts-list">' +
      Object.keys(counts).map(k => '<span class="badge"><span class="mono">' + esc(k) + '</span>&nbsp;' + counts[k] + '</span>').join('') + '</div>' +
      '<details class="preview"><summary>' + esc(t('fhir_prev')) + '</summary><pre>' + esc(JSON.stringify(S.fhir, null, 2)) + '</pre></details></div>' : '') + '</div>' +
    backupCard() +
    '<div class="card"><h2 style="margin-bottom:6px">' + esc(t('data_title')) + '</h2><p class="muted">' + esc(t('consent')) + '</p><p class="muted small">' + esc(t('privacy')) + '</p><p class="muted">' + esc(t('wipe_hint')) + '</p><button type="button" class="btn danger" data-act="wipe">' + esc(t('wipe_btn')) + '</button></div></div>';
}
/* Mock ABDM flow: number -> OTP -> consent -> choose care contexts -> import. Every step is simulated. */
function abhaSteps(cur) {
  return '<ol class="ab-steps">' + ['ab_s1', 'ab_s2', 'ab_s3', 'ab_s4'].map((k, i) =>
    '<li class="' + (i + 1 === cur ? 'on' : (i + 1 < cur ? 'done' : '')) + '"><span>' + (i + 1) + '</span>' + esc(t(k)) + '</li>').join('') + '</ol>';
}
function abhaFlowHTML() {
  const f = S.abhaFlow, cancel = '<button type="button" class="btn secondary" data-act="abhacancel">' + esc(t('ab_cancel')) + '</button>';
  const cc = arr(f.res && f.res.care_contexts);
  if (f.step === 2) {
    return abhaSteps(2) + '<form class="abha-form" id="abhaOtpForm"><label class="fld"><span>' + esc(t('ab_otp_label')) + '</span>' +
      '<input type="text" id="abhaOtp" class="mono" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="000000"></label>' +
      '<button type="submit" class="btn">' + esc(t('ab_verify')) + '</button>' + cancel + '</form>' +
      '<p class="muted small" style="margin:10px 0 0">' + esc(t('ab_otp_hint')) + '</p>';
  }
  if (f.step === 3) {
    const types = Array.from(new Set(cc.map(c => c.hi_type)));
    const dates = cc.map(c => c.date).filter(Boolean).sort();
    const range = dates.length ? fmtDate(dates[0]) + ' – ' + fmtDate(new Date().toISOString().slice(0, 10)) : '-';
    return abhaSteps(3) + '<form id="abhaConsentForm"><h3 style="margin:0 0 4px">' + esc(t('ab_consent_title')) + '</h3><p class="muted">' + esc(t('ab_consent_who')) + '</p>' +
      '<dl class="kv"><dt>' + esc(t('ab_purpose')) + '</dt><dd>' + esc(t('ab_purpose_v')) + '</dd>' +
      '<dt>' + esc(t('ab_types')) + '</dt><dd>' + types.map(h => '<label class="chk"><input type="checkbox" name="hi" value="' + esc(h) + '" checked> ' + esc(t('hi_' + h)) + '</label>').join('') + '</dd>' +
      '<dt>' + esc(t('ab_range')) + '</dt><dd>' + esc(range) + '</dd>' +
      '<dt>' + esc(t('ab_expiry')) + '</dt><dd>' + esc(t('ab_expiry_v')) + '</dd></dl>' +
      '<div class="abha-form"><button type="submit" class="btn">' + esc(t('ab_grant')) + '</button>' + cancel + '</div></form>';
  }
  const list = cc.filter(c => f.types.indexOf(c.hi_type) >= 0);
  return abhaSteps(4) + '<form id="abhaPickForm"><h3 style="margin:0 0 8px">' + esc(t('ab_pick_title')) + '</h3>' +
    (list.length ? list.map(c => '<label class="chk row"><input type="checkbox" name="cc" value="' + esc(c.reference) + '" checked> <span><b>' + esc(c.display) + '</b><br><span class="muted small">' +
      esc([c.facility, fmtDate(c.date), t('hi_' + c.hi_type)].filter(Boolean).join(' · ')) + '</span></span></label>').join('') : '<p class="muted">' + esc(t('ab_pick_none')) + '</p>') +
    '<div class="abha-form" style="margin-top:12px">' + (list.length ? '<button type="submit" class="btn"' + (S.busy.abha ? ' disabled' : '') + '>' + esc(S.busy.abha ? t('working') : t('ab_import_sel')) + '</button>' : '') + cancel + '</div></form>';
}
async function abhaStart(digits, linkedAlready) {
  if (S.busy.abha) return;
  S.busy.abha = true; S.notice = null; clearError(); render();
  try {
    const res = await api('/api/abha', { abha: digits });
    if (!res.linked) throw new Error(t('err_generic'));
    S.abhaFlow = { step: linkedAlready ? 3 : 2, digits, res, types: [] };
  } catch (e) { showError(e.message, () => abhaStart(digits, linkedAlready)); }
  S.busy.abha = false; render();
}
async function abhaVerify() {
  const f = S.abhaFlow, otp = (($('#abhaOtp') || {}).value || '').replace(/\D/g, '');
  if (!f) return;
  if (otp.length !== 6) return showError(t('ab_otp_bad'));
  clearError();
  const old = S.patient || {}, res = f.res;
  S.patient = {
    name: old.name || res.name || null, age: old.age == null ? null : old.age, sex: old.sex || null,
    abha: { number: res.abha_number || fmtAbha(f.digits), address: res.abha_address || '', name: res.name || '' }
  };
  await dbPut('meta', S.patient, profKey('patient'));
  f.step = 3; render();
}
function abhaGrant(form) {
  const f = S.abhaFlow;
  if (!f) return;
  f.types = Array.from(form.querySelectorAll('input[name="hi"]:checked')).map(x => x.value);
  if (!f.types.length) return showError(t('ab_need_type'));
  clearError(); f.step = 4; render();
}
async function abhaImport(form) {
  const f = S.abhaFlow;
  if (!f || S.busy.abha) return;
  const picked = Array.from(form.querySelectorAll('input[name="cc"]:checked')).map(x => x.value);
  S.busy.abha = true; render();
  let n = 0;
  try {
    for (const raw of arr(f.res.records)) {
      if (picked.indexOf(raw.id) < 0 || getRec(raw.id)) continue;
      const r = normalizeRecord(raw);
      r.source = 'abha';
      await saveRecordLocal(r); n++;
    }
    S.notice = t('abha_imported', { n: n });
    if (n) S.overview = {};
    S.abhaFlow = null;
  } catch (e) { showError(e.message); }
  S.busy.abha = false; render();
}
async function linkAbha(digits, importOnly) {
  if (S.busy.abha) return;
  S.busy.abha = true; S.notice = null; clearError(); render();
  try {
    const res = await api('/api/abha', { abha: digits });
    if (!res.linked) throw new Error(t('err_generic'));
    const old = S.patient || {};
    S.patient = {
      name: old.name || res.name || null, age: old.age == null ? null : old.age, sex: old.sex || null,
      abha: { number: res.abha_number || fmtAbha(digits), address: res.abha_address || '', name: res.name || '' }
    };
    await dbPut('meta', S.patient, profKey('patient'));
    if (importOnly) {
      let n = 0;
      for (const raw of arr(res.records)) {
        const r = normalizeRecord(raw);
        r.source = 'abha';
        if (getRec(r.id)) continue;
        await saveRecordLocal(r); n++;
      }
      S.notice = t('abha_imported', { n: n });
      if (n) S.overview = {};
    }
  } catch (e) { showError(e.message, () => linkAbha(digits, importOnly)); }
  S.busy.abha = false; render();
}
async function exportFhir() {
  if (S.busy.fhir) return;
  S.busy.fhir = true; clearError(); render();
  try {
    const b = await api('/api/fhir', { patient: S.patient || {}, records: S.records.map(lite), vitals: S.vitals });
    S.fhir = b;
    const blob = new Blob([JSON.stringify(b, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'sehat-fhir-bundle.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  } catch (e) { showError(e.message, exportFhir); }
  S.busy.fhir = false; render();
}
async function wipeAll() {
  if (!confirm(t('confirm_wipe'))) return;
  await dbClear('records'); await dbClear('files'); await dbClear('meta');
  famReset();  // family.js: forget every profile, back to a single 'self'
  try {
    // every per-profile key (sehat_journal@id, sehat_steps, sehat_fired ...), the sign-in and the sync credentials; only language and theme stay
    Object.keys(localStorage).filter(k => /^sehat_/.test(k) && k !== 'sehat_lang' && k !== 'sehat_theme').forEach(k => localStorage.removeItem(k));
    Object.keys(sessionStorage).filter(k => /^sehat_/.test(k)).forEach(k => sessionStorage.removeItem(k));
  } catch (e) { /* storage blocked: nothing was cached there */ }
  S.visitNotes = ''; S.medcheck = null; S.abhaFlow = null; S.pendingFile = null; S.previewFile = null;
  if (typeof TAKEN_MEM === 'object' && TAKEN_MEM) Object.keys(TAKEN_MEM).forEach(k => delete TAKEN_MEM[k]);
  S.records = []; S.patient = null; S.vitals = []; S.vform = null; S.bulk = null; S.insights = null; S.overview = {}; S.chat = []; S.fhir = null; S.notice = null;
  S.draft = null; S.stage = 'idle'; S.view = 'add'; S.detailId = null;
  render();
}

/* ================= Sign-in gate for questions ================= */
function signinBtns(m) {
  if (!m || m.label !== 'signin') return '';
  return '<div class="signin-acts"><a class="btn small" href="/login">' + esc(t('sign_in')) + '</a>' +
    '<button type="button" class="btn small secondary" data-act="demoacct" data-i="' + S.chat.indexOf(m) + '">' + esc(t('use_demo_acct')) + '</button></div>';
}
document.addEventListener('click', e => {
  const el = e.target && e.target.closest ? e.target.closest('[data-act="demoacct"]') : null;
  if (!el) return;
  try { localStorage.setItem('sehat_user', JSON.stringify({ name: 'Jay Tawri', email: 'demo@sehat.local', demo: true })); } catch (x) { /* ignore */ }
  const i = Number(el.dataset.i), m = S.chat[i];
  const q = m && m.q;
  if (m) { if (i > 0 && S.chat[i - 1].role === 'me') S.chat.splice(i - 1, 2); else S.chat.splice(i, 1); }
  render();
  if (q) ask(q);
});

/* ================= Medicines today ================= */
const SLOT_ORDER = ['morning', 'afternoon', 'night', 'asis', 'prn', 'weekly'];
const TAKEN_MEM = {};
function todayKey() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
/* Reads the written frequency and timing of a medicine and returns the slots it falls in. */
function medSlots(m) {
  const all = (String(m.frequency || '') + ' ' + String(m.timing || '')).toLowerCase();
  if (/when needed|if needed|as needed|only when|\bsos\b|\bprn\b/.test(all)) return ['prn'];
  if (/once a week|once weekly|weekly|per week|a week|every week/.test(all)) return ['weekly'];
  if (/four times|4 times|\bqid\b|\bqds\b/.test(all)) return ['morning', 'afternoon', 'night', 'night'];
  if (/three times|3 times|thrice|\btid\b|\btds\b/.test(all)) return ['morning', 'afternoon', 'night'];
  if (/twice|two times|2 times|\bbd\b|\bbid\b/.test(all)) return ['morning', 'night'];
  const pat = all.match(/\b([01])\s*-\s*([01])\s*-\s*([01])\b/);
  if (pat) {
    const o = [];
    if (pat[1] === '1') o.push('morning');
    if (pat[2] === '1') o.push('afternoon');
    if (pat[3] === '1') o.push('night');
    if (o.length) return o;
  }
  const hits = [];
  if (/morning|breakfast/.test(all)) hits.push('morning');
  if (/afternoon|lunch/.test(all)) hits.push('afternoon');
  if (/evening|night|bedtime|bed time|dinner/.test(all)) hits.push('night');
  if (/once|daily|\bod\b|every day|one time|1 time/.test(all)) return [hits[0] || 'asis'];
  return hits.length ? hits : ['asis'];
}
function buildDoses(P) {
  const list = Array.isArray(P) ? P : P.meds;
  const out = [];
  list.forEach(o => medSlots(o.m).forEach((slot, i) => {
    out.push({ key: String(o.m.name || '').trim().toLowerCase() + '|' + slot + '|' + i, slot, m: o.m, date: o.date });
  }));
  return out;
}
const isTickable = slot => slot === 'morning' || slot === 'afternoon' || slot === 'night' || slot === 'asis';
function takenGet() {
  const k = profKey(todayKey());  // family.js: ticks are per profile
  if (!TAKEN_MEM[k]) { try { TAKEN_MEM[k] = JSON.parse(localStorage.getItem('sehat_taken_' + k) || '{}') || {}; } catch (e) { TAKEN_MEM[k] = {}; } }
  return TAKEN_MEM[k];
}
function takenSave() { const k = profKey(todayKey()); try { localStorage.setItem('sehat_taken_' + k, JSON.stringify(TAKEN_MEM[k] || {})); } catch (e) { /* ignore */ } }
function remindOn() {
  try { return localStorage.getItem('sehat_remind') === '1' && typeof Notification !== 'undefined' && Notification.permission === 'granted'; } catch (e) { return false; }
}
function takenCountText(doses) {
  const tk = takenGet(), list = doses.filter(d => isTickable(d.slot));
  return t('mt_count', { x: list.filter(d => tk[d.key]).length, y: list.length });
}
function medsTodayCard(P) {
  const doses = buildDoses(P), tk = takenGet();
  let h = '<div class="card medday"><h2 style="margin-bottom:10px">' + esc(t('mt_title2')) + '</h2>';
  if (!doses.length) return h + '<p class="muted">' + esc(t(schedAll().length ? 'cur_empty' : 'mt_empty')) + '</p></div>';
  h += '<p class="small" style="margin:0 0 8px"><strong id="takenCount">' + esc(takenCountText(doses)) + '</strong></p>';
  SLOT_ORDER.forEach(slot => {
    const list = doses.filter(d => d.slot === slot);
    if (!list.length) return;
    h += '<div class="slot"><h3>' + esc(t('slot_' + slot)) + '</h3><ul class="list">' + list.map(d => {
      const m = d.m;
      const detail = [(slot === 'asis' || slot === 'prn' || slot === 'weekly') ? m.frequency : '', m.timing].filter(Boolean).join(', ');
      const body = '<span class="l"><strong>' + esc(m.name) + '</strong>' + (m.strength ? ' <span class="mono">' + esc(m.strength) + '</span>' : '') +
        (detail ? '<br><span class="muted small">' + esc(detail) + '</span>' : '') + '</span>';
      if (!isTickable(slot)) return '<li>' + body + '</li>';
      return '<li><label class="dose"><input type="checkbox" data-dose="' + esc(d.key) + '"' + (tk[d.key] ? ' checked' : '') + '>' + body +
        '<span class="muted small dose-lbl">' + esc(t('mt_taken')) + '</span></label>' + (window.SehatRem ? SehatRem.doseCtl(d) : '') /* reminders.js: snooze / edit / stop */ + '</li>';
    }).join('') + '</ul></div>';
  });
  const supported = typeof Notification !== 'undefined';
  h += '<div class="remind"><label class="dose"><input type="checkbox" data-remind="1"' + (remindOn() ? ' checked' : '') + (supported ? '' : ' disabled') + '><span class="l">' + esc(t('mt_remind')) + '</span></label>' +
    '<p class="muted small" style="margin:4px 0 0">' + esc(t('mt_remind_note')) + '</p>' +
    '<p class="small remind-denied" id="remindDenied" hidden>' + esc(t('mt_remind_denied')) + '</p></div>' +
    '<p class="muted small" style="margin:12px 0 0">' + esc(t('mt_note')) + '</p></div>';
  return h;
}
document.addEventListener('change', async e => {
  const el = e.target;
  if (!el || !el.hasAttribute) return;
  if (el.hasAttribute('data-dose')) {
    const tk = takenGet(), key = el.getAttribute('data-dose');
    if (el.checked) tk[key] = 1; else delete tk[key];
    takenSave();
    const c = document.getElementById('takenCount');
    if (c) c.textContent = takenCountText(buildDoses(schedMeds()));
  } else if (el.hasAttribute('data-remind')) {
    const den = document.getElementById('remindDenied');
    if (den) den.hidden = true;
    if (el.checked) {
      let perm = 'denied';
      try { perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission(); } catch (x) { /* ignore */ }
      if (perm !== 'granted') {
        el.checked = false;
        if (den) den.hidden = false;
        try { localStorage.setItem('sehat_remind', '0'); } catch (x) { /* ignore */ }
        return;
      }
    }
    try { localStorage.setItem('sehat_remind', el.checked ? '1' : '0'); } catch (x) { /* ignore */ }
  }
});
/* In-app dose reminders: reminders.js (SehatRem.tick) is the only scheduler. It respects edited times, snoozes, taken ticks and course ends. */
function checkReminders() { if (window.SehatRem) SehatRem.tick(); }

/* ================= Things to ask your pharmacist ================= */
async function runMedcheck(key, meds) {
  let res = null;
  try { res = await api('/api/medcheck', { medicines: meds, lang }); } catch (e) { /* fail silently */ }
  if (S.medcheck && S.medcheck.key === key) {
    S.medcheck.state = res && typeof res === 'object' ? 'ok' : 'fail';
    S.medcheck.data = res;
    if (S.view === 'health' || S.view === 'meds') render();
  }
}
function pharmacistCard(P) {
  P = Array.isArray(P) ? { meds: P } : P;
  if (!P.meds.length) return '';
  const meds = P.meds.map(o => ({ name: o.m.name, generic: o.m.generic, strength: o.m.strength }));
  const key = lang + '|' + JSON.stringify(meds);
  if (!S.medcheck || S.medcheck.key !== key) { S.medcheck = { key, state: 'loading', data: null }; runMedcheck(key, meds); }
  const mc = S.medcheck;
  let h = '<div class="card"><h2 style="margin-bottom:10px">' + esc(t('ph_title')) + '</h2>';
  if (mc.state === 'loading') return h + '<p class="muted">' + esc(t('ph_loading')) + '</p></div>';
  if (mc.state === 'fail') return h + '<p class="muted">' + esc(t('ph_fail')) + '</p></div>';
  const d = mc.data || {}, dups = arr(d.duplicates), ints = arr(d.interactions);
  if (!dups.length && !ints.length) h += '<p>' + esc(t('ph_none')) + '</p>';
  else {
    h += '<ul class="list pharm">' +
      dups.map(x => '<li><span class="l">' + esc(t('ph_dup', { ingredient: x.ingredient, names: arr(x.names).join(', ') })) + '</span></li>').join('') +
      ints.filter(x => (arr(x.names)[0] || x.a) && (arr(x.names)[1] || x.b)).map(x => {
        const nm = arr(x.names), sev = ['major', 'moderate', 'minor'].indexOf(x.severity) >= 0 ? x.severity : 'minor';
        return '<li><span class="l">' + esc((nm[0] || x.a) + ' + ' + (nm[1] || x.b) + ': ' + x.note) + '</span><span class="r"><span class="sev sev-' + sev + '">' + esc(t('sev_' + sev)) + '</span></span></li>';
      }).join('') + '</ul>';
  }
  if (d.disclaimer) h += '<p class="muted small" style="margin:10px 0 0">' + esc(d.disclaimer) + '</p>';
  return h + '</div>';
}

/* ================= Doctor visit summary ================= */
function viewVisit() {
  if (!S.records.length) { S.view = 'health'; return viewHealth(); }
  const p = S.patient || {}, ab = abhaNumber(p);
  const sx = String(p.sex || '').toLowerCase();
  const sexTxt = sx === 'male' || sx === 'm' ? t('sex_male') : (sx === 'female' || sx === 'f' ? t('sex_female') : (p.sex || ''));
  const line = [p.name, p.age ? t('h_age') + ' ' + p.age : '', sexTxt, ab ? t('h_abha') + ' ' + ab + ' (' + t('mock_tag') + ')' : ''].filter(Boolean).join('  |  ');
  const headBlock = '<div class="visit-head"><h1>' + esc(t('visit_title')) + '</h1>' +
    '<p class="visit-pt">' + esc(line || '-') + '</p><p class="muted small">' + esc(t('visit_generated', { d: fmtDate(todayKey()) })) + '</p></div>';
  const g = getInsights();
  if (g.loading) {
    return '<div class="visit">' + headBlock + '<div class="skeleton" style="width:60%"></div><div class="skeleton" style="width:85%"></div><div class="skeleton" style="width:70%"></div>' +
      '<div class="row noprint" style="margin-top:16px"><button type="button" class="btn secondary" data-act="nav" data-view="health">' + esc(t('visit_back')) + '</button></div></div>';
  }
  const I = g.data;
  const seen = new Set(), qs = [];
  const addQ = q => { const s = String(q || '').trim(), k = s.toLowerCase(); if (s && !seen.has(k) && qs.length < 6) { seen.add(k); qs.push(s); } };
  I.questions.forEach(q => addQ(q && q.text));
  sortedRecords().forEach(r => { const ex = r.explanation && r.explanation[lang]; arr(ex && ex.questions).forEach(addQ); });
  const th = a => '<thead><tr>' + a.map(x => '<th>' + esc(x) + '</th>').join('') + '</tr></thead>';
  const none = '<p class="muted">' + esc(t('visit_none')) + '</p>';
  const sec = (title, body) => '<section class="visit-sec"><h2>' + esc(title) + '</h2>' + body + '</section>';
  const notes = S.visitNotes || '';
  const series = trendSeries(I).slice(0, 8);
  return '<div class="visit">' + headBlock +
    sec(t('visit_cond'), I.conditions.length ? '<ul class="qlist">' + I.conditions.map(c => '<li>' + esc(c.name) + (c.first_seen ? ' <span class="muted small">(' + esc(t('first_seen', { d: fmtDate(c.first_seen) })) + ')</span>' : '') + '</li>').join('') + '</ul>' : none) +
    sec(t('visit_meds_rec'), I.medicines.length ? '<div class="tablewrap"><table class="data">' + th([t('m_name'), t('m_strength'), t('visit_how'), t('visit_presc'), t('visit_status')]) + '<tbody>' +
      I.medicines.map(m => '<tr><td><strong>' + esc(m.name) + '</strong></td><td>' + esc(m.strength || '') + '</td><td>' + esc([m.dose, m.frequency, m.timing].filter(Boolean).join(', ')) + '</td><td>' + esc(fmtDate(m.date)) + '</td><td>' + esc(m.status === 'course_ended' ? (m.ends ? t('med_ended_d', { d: fmtDate(m.ends) }) : t('med_ended')) : t('med_unconf')) + '</td></tr>').join('') + '</tbody></table></div><p class="muted small" style="margin:8px 0 0">' + esc(t('med_note')) + '</p>' : none) +
    sec(t('visit_abn'), I.attention.length ? '<div class="tablewrap"><table class="data">' + th([t('t_name'), t('t_value'), t('t_range'), t('f_date'), t('t_flag')]) + '<tbody>' +
      I.attention.map(a => '<tr><td>' + esc(a.name) + '</td><td class="mono">' + esc(a.value == null ? '' : a.value) + ' ' + esc(a.unit || '') + '</td><td class="mono">' + esc(a.ref_text || '-') + '</td><td>' + esc(fmtDate(a.date)) + '</td><td><strong>' + esc(t('flag_' + normFlag(a.flag))) + '</strong></td></tr>').join('') + '</tbody></table></div>' : none) +
    vitVisitHTML(I) +
    sec(t('visit_changes'), series.length ? '<ul class="qlist">' + series.map(s => '<li><strong>' + esc(s.name) + ':</strong> ' + esc(changeText(s)) + '</li>').join('') + '</ul>' : none) +
    (typeof journalVisitHTML === 'function' ? journalVisitHTML() : '') + /* journal.js */
    sec(t('visit_q'), (qs.length ? '<ul class="qlist">' + qs.map(q => '<li>' + esc(q) + '</li>').join('') + '</ul>' : '<p class="muted noprint">' + esc(t('visit_noq')) + '</p>') +
      '<h3 style="margin:12px 0 6px">' + esc(t('visit_notes')) + '</h3><textarea id="visitNotes" class="visit-notes" rows="5" aria-label="' + esc(t('visit_notes')) + '">' + esc(notes) + '</textarea>' +
      '<div class="print-notes" id="visitNotesPrint">' + esc(notes) + '</div>') +
    '<p class="muted small visit-foot">' + esc(t('visit_footer')) + '</p>' +
    '<div class="row noprint" style="margin-top:16px"><button type="button" class="btn" data-act="print">' + esc(t('visit_print')) + '</button>' +
    '<button type="button" class="btn secondary" data-act="nav" data-view="health">' + esc(t('visit_back')) + '</button></div></div>';
}
document.addEventListener('click', e => {
  const el = e.target && e.target.closest ? e.target.closest('[data-act]') : null;
  if (!el) return;
  const a = el.dataset.act;
  if (a === 'visit') go('visit');
  else if (a === 'print') window.print();
  else if (a === 'bkdownload') backupDownload();
  else if (a === 'bkrestore') { const i = document.getElementById('restoreInput'); if (i) i.click(); }
});
document.addEventListener('click', e => {
  if (e.target && e.target.closest && e.target.closest('[data-act="nav"]')) S.backupMsg = null;
}, true);
document.addEventListener('input', e => {
  if (!e.target || e.target.id !== 'visitNotes') return;
  S.visitNotes = e.target.value;
  const m = document.getElementById('visitNotesPrint');
  if (m) m.textContent = S.visitNotes;
});

/* ================= Settings =================
   One place for appearance, language, reminders, account and data. Delete and backup reuse
   the same actions as the export page. */
function viewSettings() {
  const theme = (() => { try { return localStorage.getItem('sehat_theme') || 'system'; } catch (e) { return 'system'; } })();
  const opt = (v, label) => '<button type="button" class="chip" data-act="settheme" data-v="' + v + '" aria-pressed="' + (theme === v) + '">' + esc(label) + '</button>';
  const langs = Array.from(document.querySelectorAll('#langSel option')).map(o => '<option value="' + esc(o.value) + '"' + (o.value === lang ? ' selected' : '') + '>' + esc(o.textContent) + '</option>').join('');
  const N = window.Notification, perm = N ? N.permission : 'na';
  const notif = perm === 'granted' ? t('st_notif_on') : perm === 'denied' ? t('st_notif_blocked') : perm === 'na' ? t('st_notif_na') : t('st_notif_off');
  const u = currentUser(), synced = (() => { try { return !!localStorage.getItem('sehat_sync'); } catch (e) { return false; } })();
  const card = (title, body) => '<div class="card"><h2 style="margin-bottom:8px">' + esc(title) + '</h2>' + body + '</div>';
  return '<div class="page-head"><h1>' + esc(t('st_title')) + '</h1><p>' + esc(t('st_sub')) + '</p></div>' +
    card(t('st_look'), '<div class="chips">' + opt('light', t('st_light')) + opt('dark', t('st_dark')) + opt('system', t('st_system')) + '</div>') +
    card(t('st_lang'), '<p class="muted small">' + esc(t('st_lang_note')) + '</p><select id="stLang" class="d-in" style="max-width:320px">' + langs + '</select>') +
    card(t('st_notif'), '<p class="muted">' + esc(notif) + '</p><div class="row">' + (perm === 'default' ? '<button type="button" class="btn" data-act="stnotif">' + esc(t('st_notif_btn')) + '</button>' : '') +
      '<button type="button" class="btn secondary" data-act="nav" data-view="meds">' + esc(t('st_go_meds')) + '</button></div><p class="muted small" style="margin-top:8px">' + esc(t('st_cal')) + '</p>') +
    card(t('st_account'), '<p>' + esc(u && !u.demo ? t('st_signed', { who: u.email || u.name }) : u && u.demo ? t('st_signed', { who: t('demo_user') }) : t('st_guest')) + '</p><p class="muted small">' + esc(synced ? t('st_sync_on') : t('st_sync_off')) + '</p>' +
      '<a class="btn secondary" href="/login">' + esc(u ? t('st_signout') : t('st_signin')) + '</a>') +
    card(t('st_family'), '<p class="muted">' + esc(t('st_family_note')) + '</p><button type="button" class="btn secondary" data-act="nav" data-view="family">' + esc(t('st_go_family')) + '</button>') +
    card(t('st_export'), '<p class="muted">' + esc(t('st_export_note')) + '</p><button type="button" class="btn secondary" data-act="nav" data-view="abha">' + esc(t('st_go_export')) + '</button>') +
    (window.SehatFamily && SehatFamily.pinCard ? SehatFamily.pinCard(!!(u && u.demo)) : '') /* family.js: parental control PIN */ +
    backupCard() +
    '<div class="card"><h2 style="margin-bottom:6px">' + esc(t('data_title')) + '</h2><p class="muted">' + esc(t('consent')) + '</p><p class="muted small">' + esc(t('privacy')) + '</p><p class="muted">' + esc(t('wipe_hint')) + '</p><button type="button" class="btn danger" data-act="wipe">' + esc(t('wipe_btn')) + '</button></div>' +
    card(t('st_about'), '<p class="muted">' + esc(t('st_about_note')) + '</p>');
}
document.addEventListener('change', e => {
  if (!e.target || e.target.id !== 'stLang') return;
  const sel = document.getElementById('langSel');
  if (sel) { sel.value = e.target.value; sel.dispatchEvent(new Event('change', { bubbles: true })); } else setLang(e.target.value);
});

/* ================= Backup and restore ================= */
function backupCard() {
  const m = S.backupMsg;
  return '<div class="card"><h2 style="margin-bottom:6px">' + esc(t('bk_title')) + '</h2><p class="muted">' + esc(t('bk_note')) + '</p>' +
    '<div class="row"><button type="button" class="btn" data-act="bkdownload">' + esc(t('bk_download')) + '</button>' +
    '<button type="button" class="btn secondary" data-act="bkrestore">' + esc(t('bk_restore')) + '</button></div>' +
    '<input type="file" id="restoreInput" accept="application/json,.json" hidden>' +
    (m ? '<p class="small" role="status" style="margin:10px 0 0;color:var(' + (m.ok ? '--ok' : '--crit') + ')">' + esc(m.text) + '</p>' : '') + '</div>';
}
async function backupDownload() {
  try {
    const mine = new Set(S.records.map(r => r.id));  // only this profile's originals: never another family member's documents
    const files = arr(await dbGetAll('files')).filter(f => f && mine.has(f.id));
    const payload = { version: 1, exportedAt: new Date().toISOString(), patient: S.patient || null, records: S.records, files, vitals: S.vitals };
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'sehat-backup-' + todayKey() + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    S.backupMsg = { ok: true, text: t('bk_saved') };
  } catch (e) { S.backupMsg = { ok: false, text: t('err_generic') }; }
  render();
}
async function backupRestore(file) {
  if (!file) return;
  try {
    if (file.size > 40 * 1024 * 1024) throw new Error(t('bk_big'));
    let j = null;
    try { j = JSON.parse(await file.text()); } catch (x) { throw new Error(t('bk_bad')); }
    const good = j && typeof j === 'object' && j.version === 1 && Array.isArray(j.records) &&
      (j.files === undefined || Array.isArray(j.files)) && (j.vitals === undefined || Array.isArray(j.vitals)) && (j.patient == null || typeof j.patient === 'object') &&
      j.records.every(r => r && typeof r === 'object' && typeof r.id === 'string' && r.id) &&
      arr(j.files).every(f => f && typeof f === 'object' && typeof f.id === 'string' && f.id && typeof f.dataUrl === 'string' && f.dataUrl.indexOf('data:') === 0);
    if (!good) throw new Error(t('bk_bad'));
    if (j.patient) {
      S.patient = { name: j.patient.name || null, age: j.patient.age == null ? null : j.patient.age, sex: j.patient.sex || null, abha: j.patient.abha || null };
      await dbPut('meta', S.patient, profKey('patient'));
    }
    const ids = new Set(j.records.map(r => r.id)), me = window.SehatFamily ? SehatFamily.active() : 'self';
    for (const raw of j.records) { const rec = normalizeRecord(raw); rec.profile = me; await saveRecordLocal(rec); }  // restored records belong to the profile that is open
    for (const f of arr(j.files).filter(f => ids.has(f.id))) await dbPut('files', { id: f.id, mime: String(f.mime || ''), dataUrl: f.dataUrl });
    if (arr(j.vitals).length) {
      const byId = new Map(S.vitals.map(e => [e.id, e]));
      arr(j.vitals).map(cleanVital).filter(Boolean).forEach(e => byId.set(e.id, e));
      S.vitals = Array.from(byId.values());
      await saveVitals();
    }
    S.overview = {};
    S.backupMsg = { ok: true, text: t('bk_done', { n: j.records.length }) };
  } catch (e) {
    S.backupMsg = { ok: false, text: (e && (e.message === t('bk_big') || e.message === t('bk_bad'))) ? e.message : t('err_generic') };
  }
  render();
}
document.addEventListener('change', e => {
  if (!e.target || e.target.id !== 'restoreInput') return;
  const f = e.target.files && e.target.files[0];
  e.target.value = '';
  backupRestore(f);
});

/* ================= Wellness log (home readings) ================= */
const VIT_TYPES = ['bp', 'sugar_fasting', 'sugar_pp', 'sugar_random', 'weight', 'pulse'];
const VIT_SYMPTOMS = ['thirst', 'tired', 'blur'];  // optional symptoms ticked with a sugar reading (wellness.js shows them)
const isSugar = ty => /^sugar_/.test(ty);
const VIT_UNIT = { bp: 'mmHg', sugar_fasting: 'mg/dL', sugar_pp: 'mg/dL', sugar_random: 'mg/dL', weight: 'kg', pulse: 'beats/min' };
const VIT_BOUNDS = { bp: [60, 260], sugar_fasting: [20, 800], sugar_pp: [20, 800], sugar_random: [20, 800], weight: [2, 400], pulse: [20, 250] };
const VIT_BOUNDS2 = [30, 160];
function cleanVital(e) {
  if (!e || typeof e !== 'object' || typeof e.id !== 'string' || !e.id) return null;
  if (VIT_TYPES.indexOf(e.type) < 0 || !/^\d{4}-\d{2}-\d{2}$/.test(String(e.date || '')) || !isNum(e.value)) return null;
  return { id: e.id, type: e.type, date: e.date, value: Number(e.value), value2: e.type === 'bp' && isNum(e.value2) ? Number(e.value2) : null, note: e.note ? String(e.note).slice(0, 200) : null,
    symptoms: isSugar(e.type) ? arr(e.symptoms).filter(k => VIT_SYMPTOMS.indexOf(k) >= 0) : [] };
}
async function saveVitals() { await dbPut('meta', S.vitals, profKey('vitals')); }  // family.js: per profile
function vf() {
  if (!S.vform) S.vform = { type: 'bp', date: '', v: '', v2: '', note: '', sym: [], err: null };
  if (!S.vform.date) S.vform.date = todayKey();
  return S.vform;
}
const vitText = e => (e.type === 'bp' && e.value2 != null ? fmtNum(e.value) + '/' + fmtNum(e.value2) : fmtNum(e.value));
/* The browser only displays flags; the server decides them (matched to readings by id). */
function vitGroups(I) {
  return VIT_TYPES.map(ty => {
    const entries = S.vitals.filter(e => e.type === ty).sort((a, b) => a.date.localeCompare(b.date));
    if (!entries.length) return null;
    const sg = arr(I && I.vitals).find(g => g && g.type === ty) || {};
    const byId = {};
    arr(sg.points).forEach(p => { if (p && p.id) byId[p.id] = p; });
    const pts = entries.map(e => { const sp = byId[e.id] || {}; return { e, flag: sp.flag || 'unknown', text: sp.text || vitText(e) }; });
    return { type: ty, name: sg.name || t('vit_' + ty), unit: sg.unit || VIT_UNIT[ty], ref_text: sg.ref_text || null, pts, latest: pts[pts.length - 1] };
  }).filter(Boolean);
}
const vitBadge = (type, flag) => (type === 'weight' || normFlag(flag) === 'unknown' ? '' : badge(flag));
function vitSeries(g) {
  return {
    name: g.name, unit: g.unit,
    pts: g.pts.slice(-30).map(p => ({
      date: p.e.date, v: p.e.value, flag: p.flag, lo: null, hi: null,
      note: [p.e.type === 'bp' && p.e.value2 != null ? t('vit_lower', { v: fmtNum(p.e.value2) }) : '', p.e.note || ''].filter(Boolean).join(' - ')
    }))
  };
}
function wellnessCard(I) {
  const f = vf(), groups = vitGroups(I), bp = f.type === 'bp';
  const opts = VIT_TYPES.map(ty => '<option value="' + ty + '"' + (f.type === ty ? ' selected' : '') + '>' + esc(t('vit_' + ty)) + '</option>').join('');
  const errTxt = f.err ? t(f.err.k, f.err.vars) : '';
  const form = '<form id="vitForm" class="vit-form" novalidate>' +
    '<label class="fld"><span>' + esc(t('vit_type')) + '</span><select id="vitType">' + opts + '</select></label>' +
    '<label class="fld"><span>' + esc(t('f_date')) + '</span><input type="date" id="vitDate" max="' + esc(todayKey()) + '" value="' + esc(f.date) + '"></label>' +
    '<div class="fld vit-val"><span>' + esc(t('vit_value')) + '</span><div class="vit-nums">' +
    '<input type="text" inputmode="decimal" id="vitV" class="mono" autocomplete="off" aria-label="' + esc(bp ? t('vit_upper') : t('vit_value')) + '" placeholder="' + esc(bp ? t('vit_upper') : '') + '" value="' + esc(f.v) + '">' +
    (bp ? '<span class="muted">/</span><input type="text" inputmode="decimal" id="vitV2" class="mono" autocomplete="off" aria-label="' + esc(t('vit_lower_in')) + '" placeholder="' + esc(t('vit_lower_in')) + '" value="' + esc(f.v2) + '">' : '') +
    '<span class="muted small vit-unit">' + esc(VIT_UNIT[f.type]) + '</span></div></div>' +
    (isSugar(f.type) ? '<fieldset class="fld wide vit-sym"><legend>' + esc(t('sg_sym')) + '</legend>' + VIT_SYMPTOMS.map(k => '<label><input type="checkbox" data-sym="' + k + '"' + (arr(f.sym).indexOf(k) >= 0 ? ' checked' : '') + '> ' + esc(t('sg_sym_' + k)) + '</label>').join('') + '</fieldset>' : '') +
    '<label class="fld wide"><span>' + esc(t('vit_note')) + '</span><input type="text" id="vitNote" maxlength="120" autocomplete="off" value="' + esc(f.note) + '"></label>' +
    '<div class="vit-act"><button type="submit" class="btn">' + esc(t('vit_add')) + '</button></div>' +
    '<p class="vit-err" id="vitErr" role="alert"' + (errTxt ? '' : ' hidden') + '>' + esc(errTxt) + '</p></form>';
  const body = groups.length ? '<div class="vit-groups">' + groups.map(g => {
    const l = g.latest;
    return '<div class="vit-group"><div class="row between"><h3>' + esc(g.name) + '</h3><span class="muted small">' + esc(fmtDate(l.e.date)) + '</span></div>' +
      '<div class="vit-latest"><span class="vit-big mono">' + esc(l.text) + '</span><span class="muted">' + esc(g.unit) + '</span>' + vitBadge(g.type, l.flag) + '</div>' +
      (g.ref_text ? '<p class="muted small" style="margin:2px 0 0">' + esc(g.ref_text) + '</p>' : '') +
      (l.flag === 'critical' ? '<p class="vit-crit" role="alert">' + esc(t('vit_crit')) + '</p>' : '') +
      (window.SehatWell ? SehatWell.latestBox(l.e) : '') /* wellness.js: guidance for an out-of-range latest reading */ +
      (g.pts.length >= 2 && !window.SehatWell ? '<div class="trend">' + chartSVG(vitSeries(g)) + '</div>' : '') +  /* wellness.js draws the 7/30 day graphs */
      '<details class="vit-all"><summary>' + esc(t('vit_all', { n: g.pts.length })) + '</summary><ul class="list">' +
      g.pts.slice().reverse().map(p => '<li><span class="l"><span class="mono">' + esc(p.text) + ' ' + esc(g.unit) + '</span> ' + vitBadge(g.type, p.flag) + '<br><span class="muted small">' + esc(fmtDate(p.e.date)) + (p.e.note ? ' · ' + esc(p.e.note) : '') + '</span></span>' +
        '<span class="r"><button type="button" class="btn small danger" data-act="vitdel" data-id="' + esc(p.e.id) + '">' + esc(t('vit_del')) + '</button></span></li>').join('') + '</ul></details></div>';
  }).join('') + '</div>' : '<p class="muted">' + esc(t('vit_empty')) + '</p>';
  return '<div class="card" id="wellness"><h2 style="margin-bottom:10px">' + esc(t('vit_title')) + '</h2>' + form + (window.SehatWell ? SehatWell.savedBox() : '') /* wellness.js */ + body +
    '<p class="muted small" style="margin:12px 0 0">' + esc(t('vit_caveat')) + '</p></div>';
}
function vitVisitHTML(I) {
  const groups = vitGroups(I);
  if (!groups.length) return '';
  return '<section class="visit-sec"><h2>' + esc(t('vit_home')) + '</h2><div class="tablewrap"><table class="data"><thead><tr><th>' + esc(t('vit_value')) + '</th><th>' + esc(t('t_value')) + '</th><th>' + esc(t('f_date')) + '</th><th>' + esc(t('t_flag')) + '</th></tr></thead><tbody>' +
    groups.map(g => { const l = g.latest, show = g.type !== 'weight' && normFlag(l.flag) !== 'unknown'; return '<tr><td>' + esc(g.name) + '</td><td class="mono">' + esc(l.text) + ' ' + esc(g.unit) + '</td><td>' + esc(fmtDate(l.e.date)) + '</td><td>' + (show ? '<strong>' + esc(t('flag_' + normFlag(l.flag))) + '</strong>' : '-') + '</td></tr>'; }).join('') +
    '</tbody></table></div></section>';
}
const vNum = s => { s = String(s == null ? '' : s).trim().replace(',', '.'); return /^\d{1,4}(\.\d{1,2})?$/.test(s) ? Number(s) : NaN; };
async function addVital() {
  const f = vf(), ty = f.type, b = VIT_BOUNDS[ty];
  const bad = (k, vars) => { f.err = { k, vars }; render(); };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.date) || f.date > todayKey()) return bad('vit_err_date');
  const v = vNum(f.v);
  if (isNaN(v)) return bad('vit_err_num');
  if (v < b[0] || v > b[1]) return bad('vit_err_range', { min: b[0], max: b[1] });
  let v2 = null;
  if (ty === 'bp') {
    v2 = vNum(f.v2);
    if (isNaN(v2)) return bad('vit_err_num');
    if (v2 < VIT_BOUNDS2[0] || v2 > VIT_BOUNDS2[1]) return bad('vit_err_range', { min: VIT_BOUNDS2[0], max: VIT_BOUNDS2[1] });
    if (v2 >= v) return bad('vit_err_bp');
  }
  const note = String(f.note || '').trim();
  S.vitals.push({ id: 'vit_' + Math.random().toString(36).slice(2, 10), type: ty, date: f.date, value: v, value2: v2, note: note ? note.slice(0, 120) : null, symptoms: isSugar(ty) ? arr(f.sym).slice() : [] });
  f.v = ''; f.v2 = ''; f.note = ''; f.sym = []; f.err = null;
  if (window.SehatWell) SehatWell.onSaved(S.vitals[S.vitals.length - 1]);  // wellness.js: guidance right after saving
  try { await saveVitals(); } catch (e) { /* kept in memory */ }
  render();
}
async function delVital(id) {
  S.vitals = S.vitals.filter(e => e.id !== id);
  try { await saveVitals(); } catch (e) { /* ignore */ }
  render();
}
document.addEventListener('submit', e => {
  if (!e.target || e.target.id !== 'vitForm') return;
  e.preventDefault();
  addVital();
});
document.addEventListener('input', e => {
  const el = e.target;
  if (!el || !el.id || !S.vform) return;
  if (el.id === 'vitDate') S.vform.date = el.value;
  else if (el.id === 'vitV') S.vform.v = el.value;
  else if (el.id === 'vitV2') S.vform.v2 = el.value;
  else if (el.id === 'vitNote') S.vform.note = el.value;
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el && el.dataset && el.dataset.sym) { const f = vf(); f.sym = arr(f.sym).filter(x => x !== el.dataset.sym); if (el.checked) f.sym.push(el.dataset.sym); return; }
  if (!el || !el.id) return;
  if (el.id === 'vitType') { const f = vf(); f.type = VIT_TYPES.indexOf(el.value) >= 0 ? el.value : 'bp'; f.v = ''; f.v2 = ''; f.err = null; render(); }
  else if (el.id === 'vitDate') vf().date = el.value;
});
document.addEventListener('click', e => {
  const el = e.target && e.target.closest ? e.target.closest('[data-act="vitdel"],[data-act="vitgo"]') : null;
  if (!el) return;
  if (el.dataset.act === 'vitdel') delVital(el.dataset.id);
  else {
    if (S.view !== 'wellness') { go('wellness'); }
    const c = document.getElementById('wellness');
    const fold = c && c.closest('details');
    if (fold) { fold.open = true; (S.secOpen = S.secOpen || {})[fold.dataset.k] = true; }
    if (c) { c.scrollIntoView({ behavior: 'smooth', block: 'start' }); const i = document.getElementById('vitV'); if (i) setTimeout(() => i.focus({ preventScroll: true }), 350); }
  }
});

/* ================= Source buttons in the record detail ================= */
function srcBtn(x, kind, i) {
  return x && x.source_text ? '<br><button type="button" class="btn link small srcbtn" data-act="showsrc" data-kind="' + kind + '" data-i="' + i + '">' + esc(t('src_btn')) + '</button>' : '';
}
document.addEventListener('click', e => {
  const el = e.target && e.target.closest ? e.target.closest('[data-act="showsrc"]') : null;
  if (!el) return;
  const kind = el.dataset.kind === 'medicines' ? 'medicines' : 'tests';
  const r = getRec(S.detailId), x = r && arr(r[kind])[Number(el.dataset.i)];
  const box = document.getElementById('srcbox'), text = document.getElementById('srctext');
  if (!x || !x.source_text || !box || !text) return;
  box.classList.add('on');
  text.textContent = x.source_text + (x.page ? '  (p. ' + x.page + ')' : '');
  box.scrollIntoView({ block: 'nearest' });
});

/* ================= Listen (text to speech) ================= */
const SPEAK_LANG = { en: 'en-IN', hi: 'hi-IN', bn: 'bn-IN', te: 'te-IN', ta: 'ta-IN', mr: 'mr-IN', gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN', pa: 'pa-IN' };
const SPEAK = { key: null, tag: null, vk: undefined };
const speakOK = () => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
function stripMd(s) {
  return String(s == null ? '' : s).replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_#`>~|]+/g, ' ')
    .replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
}
function paintListen() {
  document.querySelectorAll('[data-listen]').forEach(b => {
    const on = SPEAK.key === b.getAttribute('data-listen');
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    const sp = b.querySelector('span');
    if (sp) sp.textContent = t(on ? 'listen_stop' : 'listen');
  });
}
function stopSpeak() {
  SPEAK.tag = null;
  if (speakOK()) { try { speechSynthesis.cancel(); } catch (e) { /* ignore */ } }
  SPEAK.key = null;
  paintListen();
}
function speakText(text, code) {
  if (!speakOK()) return false;
  const parts = stripMd(text).split('\n').filter(Boolean);
  if (!parts.length) return false;
  try { speechSynthesis.cancel(); } catch (e) { /* ignore */ }
  const tag = {};
  SPEAK.tag = tag;
  parts.forEach((part, i) => {
    const u = new SpeechSynthesisUtterance(part);
    u.lang = SPEAK_LANG[code] || code;
    u.rate = 0.95;
    if (i === parts.length - 1) {
      u.onend = u.onerror = () => { if (SPEAK.tag === tag) { SPEAK.tag = null; SPEAK.key = null; paintListen(); } };
    }
    speechSynthesis.speak(u);
  });
  return true;
}
function listenBtn(key) {
  if (!speakOK()) return '';
  const on = SPEAK.key === key;
  return '<button type="button" class="btn small secondary listen" data-listen="' + esc(key) + '" aria-pressed="' + on + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg><span>' + esc(t(on ? 'listen_stop' : 'listen')) + '</span></button>';
}
function msgListen(m) {
  return m && m.role === 'bot' && m.label !== 'signin' && m.text ? '<div class="msg-tools">' + listenBtn('msg:' + S.chat.indexOf(m)) + '</div>' : '';
}
function listenText(key) {
  if (key === 'expl') {
    const r = getRec(S.detailId), ex = r && r.explanation && r.explanation[lang];
    if (!ex) return '';
    return [ex.summary].concat(arr(ex.findings).map(f => f.name + (f.meaning ? ': ' + f.meaning : ''))).filter(Boolean).join('\n');
  }
  if (key === 'overview') { const ov = S.overview[lang]; return ov && ov.summary ? ov.summary : ''; }
  if (key.indexOf('msg:') === 0) { const m = S.chat[Number(key.slice(4))]; return m ? String(m.text || '') : ''; }
  return '';
}
document.addEventListener('click', e => {
  const el = e.target && e.target.closest ? e.target.closest('[data-listen]') : null;
  if (!el) return;
  const key = el.getAttribute('data-listen');
  if (SPEAK.key === key) { stopSpeak(); return; }
  const txt = listenText(key);
  if (txt && speakText(txt, lang)) { SPEAK.key = key; paintListen(); }
});

/* ================= Render ================= */
const ICONS = {
  add: '<path d="M12 5v14M5 12h14"/>',
  timeline: '<path d="M7 3v18"/><circle cx="7" cy="7" r="1.5"/><circle cx="7" cy="17" r="1.5"/><path d="M11 7h9M11 17h6"/>',
  health: '<path d="M3 12h4l2-6 4 12 2-6h6"/>',
  ask: '<path d="M4 5h16v11H9l-5 4z"/>',
  abha: '<path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z"/>',
  meds: '<rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(-35 12 12)"/><path d="M9.5 8.7l5 6.6"/>',
  visits: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
  journal: '<path d="M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6z"/><path d="M6 3v18M10 8h5M10 12h5"/>',
  wellness: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.500-7 10-7 10z"/>',
  family: '<circle cx="9" cy="8" r="3"/><path d="M3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1"/><circle cx="17" cy="9" r="2.200"/><path d="M17 14a4 4 0 0 1 4 4v2"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  more: '<circle cx="5" cy="12" r="1.600"/><circle cx="12" cy="12" r="1.600"/><circle cx="19" cy="12" r="1.600"/>'
};
/* third item 'sec': on the phone bottom bar these live under "More" (the bar keeps at most 5 items) */
const NAV = [['add', 'nav_add'], ['timeline', 'nav_timeline'], ['health', 'nav_health'], ['meds', 'nav_meds'], ['visits', 'nav_visits', 'sec'], ['journal', 'nav_journal', 'sec'], ['wellness', 'nav_wellness', 'sec'], ['family', 'nav_family', 'sec'], ['ask', 'nav_ask', 'sec'], ['abha', 'nav_abha', 'sec'], ['settings', 'nav_settings', 'sec']];

function applyStatic() {
  updateDemoPills();
  document.documentElement.lang = lang;
  document.documentElement.dir = LANG_RTL[lang] ? 'rtl' : 'ltr';
  document.title = t('app_name');
  $('#brandName').textContent = t('app_name');
  $('#localNote').textContent = t('local_note');
  $('#disclaimer').textContent = t('disclaimer');
  if ($('#langSel')) $('#langSel').value = lang;
  const cur = S.view === 'detail' ? 'timeline' : (S.view === 'visit' ? 'health' : S.view);
  const nb = (n, c) => '<button type="button" class="' + (c || '') + '" data-act="nav" data-view="' + n[0] + '"' + (cur === n[0] ? ' aria-current="page"' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS[n[0]] + '</svg><span>' + esc(t(n[1])) + '</span></button>';
  const secs = NAV.filter(n => n[2]), secCur = secs.some(n => n[0] === cur);
  $('#nav').className = 'nav' + (S.moreOpen ? ' more-open' : '');
  $('#nav').innerHTML = NAV.map(n => nb(n, n[2] ? 'nv-sec' : '')).join('') +
    '<button type="button" class="nv-more" data-act="more" aria-expanded="' + !!S.moreOpen + '"' + (secCur ? ' aria-current="page"' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true">' + ICONS.more + '</svg><span>' + esc(t('nav_more')) + '</span></button>' +
    '<div class="nav-sheet" role="group" aria-label="' + esc(t('nav_more')) + '">' + secs.map(n => nb(n, 'nv-sheet')).join('') + '</div>';
  syncDiscHeight();
}
function syncDiscHeight() {
  const d = $('#disclaimer');
  if (d) document.documentElement.style.setProperty('--disc-h', d.offsetHeight + 'px');
}

function render() {
  const vk = S.view + ':' + (S.view === 'detail' ? S.detailId : '');
  if (SPEAK.vk !== undefined && SPEAK.vk !== vk) stopSpeak();
  SPEAK.vk = vk;
  applyStatic();
  const v = $('#view');
  let html;
  switch (S.view) {
    case 'timeline': html = viewTimeline(); break;
    case 'detail': html = viewDetail(); break;
    case 'health': html = viewHealth(); break;
    case 'meds': html = viewMeds(); break;           // wellness.js
    case 'visits': html = viewVisits(); break;
    case 'journal': html = viewJournal(); break;
    case 'wellness': html = viewWellness(); break;
    case 'family': html = viewFamily(); break;
    case 'visit': html = viewVisit(); break;
    case 'ask': html = viewAsk(); break;
    case 'abha': html = viewAbha(); break;
    case 'settings': html = viewSettings(); break;
    default: html = viewAdd();
  }
  // keep ask input text if re-rendering
  const keep = (S.view === 'ask' && $('#askInput')) ? $('#askInput').value : null;
  v.innerHTML = html;
  if (keep) { const i = $('#askInput'); if (i) i.value = keep; }
  paintError();
  if (S.view === 'detail') afterDetail();
}

function go(view) {
  if (S.view === 'add' && S.stage === 'review' && view !== 'add' && S.dirty && !confirm(t('discard') + '?')) return;
  S.chatUpload = false;
  if (view !== 'add' && S.stage === 'review' && S.view === 'add') { S.draft = null; S.pendingFile = null; S.previewFile = null; S.stage = 'idle'; S.editingId = null; }
  S.view = view; S.notice = null; S.moved = null; S.moreOpen = false;
  clearError();
  render();
  window.scrollTo(0, 0);
}

/* ================= Events ================= */
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const a = el.dataset.act;
  switch (a) {
    case 'lang':
      lang = el.dataset.lang === 'hi' ? 'hi' : 'en';
      try { localStorage.setItem('sehat_lang', lang); } catch (x) { /* ignore */ }
      if (S.error) { S.error = null; S.retry = null; }
      render(); break;
    case 'nav': go(el.dataset.view); break;
    case 'more': S.moreOpen = !S.moreOpen; applyStatic(); break;
    case 'choose': S.chatUpload = false; $('#fileInput').click(); break;
    case 'askfile': S.chatUpload = true; $('#fileInput').click(); break;
    case 'photo': S.chatUpload = false; $('#camInput').click(); break;
    case 'sample': runSample(el.dataset.id); break;
    case 'demo': loadDemo(); break;
    case 'addrow': addRow(el.dataset.kind); break;
    case 'reveal': revealField(el.dataset.kind, Number(el.dataset.i), el.dataset.f); break;
    case 'delrow': delRow(el.dataset.kind, Number(el.dataset.i)); break;
    case 'okrow': if (S.draft && verifyItem((S.draft[el.dataset.kind] || [])[Number(el.dataset.i)])) { S.dirty = true; render(); } break;
    case 'save': saveDraft(); break;
    case 'discard': discardDraft(); break;
    case 'filter': S.filter = el.dataset.type; render(); break;
    case 'tlmonths': S.tlMonths = Number(el.dataset.v) || 0; render(); break;
    case 'tlcond': S.tlCond = el.dataset.v || ''; render(); break;
    case 'settheme': {
      const v = el.dataset.v, dark = v === 'dark' || (v === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
      try { if (v === 'system') localStorage.removeItem('sehat_theme'); else localStorage.setItem('sehat_theme', v); } catch (x) { /* ignore */ }
      document.documentElement.dataset.theme = dark ? 'dark' : 'light'; render(); break;
    }
    case 'stnotif': if (window.Notification) Notification.requestPermission().then(() => render()); break;
    case 'tlreset': S.tlMonths = 0; S.tlCond = ''; S.filter = 'all'; render(); break;
    case 'openrec': S.detailId = el.dataset.id; S.view = 'detail'; clearError(); render(); window.scrollTo(0, 0); break;
    case 'edit': startEdit(el.dataset.id); break;
    case 'delete': deleteRecord(el.dataset.id); break;
    case 'retryexpl': { const r = getRec(S.detailId); if (r) { clearError(); loadExpl(r); } break; }
    case 'overview': genOverview(); break;
    case 'askq': ask(t(el.dataset.q)); break;
    case 'abhaimport': { const d = abhaNumber(S.patient).replace(/\D/g, ''); if (d.length === 14) abhaStart(d, true); break; }
    case 'curmed': curSet(el.dataset.k, el.dataset.on === '1'); render(); break;
    case 'abhacancel': S.abhaFlow = null; clearError(); render(); break;
    case 'fhir': exportFhir(); break;
    case 'wipe': wipeAll(); break;
    case 'dismiss': clearError(); break;
    case 'cancelread': cancelRead(); break;
    case 'who_me': whySave(window.SehatFamily ? SehatFamily.active() : 'self'); break;
    case 'who_to': whySave(el.dataset.id); break;
    case 'who_new': if (S.who) { S.who.step = 'add'; S.who.err = ''; paintWho(); } break;
    case 'who_back': if (S.who) { S.who.step = 'ask'; S.who.err = ''; paintWho(); } break;
    case 'who_cancel': whoClose(); break;
    case 'moved_switch': { const id = el.dataset.id; S.moved = null; if (window.SehatFamily) SehatFamily.switchTo(id); break; }
    case 'moved_close': S.moved = null; render(); break;
    case 'retry': { const fn = S.retry; clearError(); if (fn) fn(); break; }
  }
});

document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset && el.dataset.path) onEdit(el);
  else if (el.id === 'abhaInput') el.value = fmtAbha(el.value);
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset && el.dataset.path) { onEdit(el); if (el.dataset.path === 'doc_type') { /* no re-render needed */ } }
});

document.addEventListener('submit', e => {
  const f = e.target;
  if (f.id === 'askForm') {
    e.preventDefault();
    const i = $('#askInput'); const q = i ? i.value : '';
    if (i) i.value = '';
    ask(q);
  } else if (f.id === 'abhaForm') {
    e.preventDefault();
    const d = ($('#abhaInput').value || '').replace(/\D/g, '');
    if (d.length !== 14) return showError(t('abha_bad'));
    abhaStart(d, false);
  } else if (f.id === 'abhaOtpForm') {
    e.preventDefault(); abhaVerify();
  } else if (f.id === 'abhaConsentForm') {
    e.preventDefault(); abhaGrant(f);
  } else if (f.id === 'abhaPickForm') {
    e.preventDefault(); abhaImport(f);
  }
});

['fileInput', 'camInput'].forEach(id => {
  $('#' + id).addEventListener('change', e => {
    const all = Array.from(e.target.files || []), f = all[0];
    e.target.value = '';
    if (S.chatUpload && (S.view === 'ask' || PET.open)) { S.chatUpload = false; chatFile(f); }
    else if ((all.length > 1 || S.bulk) && window.SehatBulk) { S.chatUpload = false; SehatBulk.add(all); }  // bulk.js: several files at once
    else { S.chatUpload = false; handleFile(f); }
  });
});

document.addEventListener('dragover', e => {
  e.preventDefault();
  const z = e.target.closest && e.target.closest('#drop');
  const d = $('#drop'); if (d) d.classList.toggle('over', !!z);
});
document.addEventListener('dragleave', e => { if (!e.relatedTarget) { const d = $('#drop'); if (d) d.classList.remove('over'); } });
document.addEventListener('drop', e => {
  e.preventDefault();
  const d = $('#drop'); if (d) d.classList.remove('over');
  if (e.target.closest && e.target.closest('#drop') && e.dataTransfer && e.dataTransfer.files.length) {
    if ((e.dataTransfer.files.length > 1 || S.bulk) && window.SehatBulk) SehatBulk.add(Array.from(e.dataTransfer.files)); else handleFile(e.dataTransfer.files[0]);
  }
});

window.addEventListener('resize', syncDiscHeight);

/* ================= Init ================= */
(async function init() {
  render();
  try {
    S.records = arr(await dbGetAll('records')).map(normalizeRecord);
    S.patient = await dbGet('meta', 'patient');
    S.vitals = arr(await dbGet('meta', 'vitals')).map(cleanVital).filter(Boolean);
    await famBoot();  // family.js: keep only the active profile's records; its own patient and vitals
  } catch (e) { S.records = []; }
  S.ready = true;
  if ((S.records.length || S.vitals.length) && S.view === 'add' && S.stage === 'idle') S.view = 'health';
  render();
  loadSamples();
})();

/* Source line: focusing or clicking an extracted row shows the line it was read from. */
function showSource(e) {
  const row = e.target && e.target.closest ? e.target.closest('.rowcard[data-src]') : null;
  const box = document.getElementById('srcbox'), text = document.getElementById('srctext');
  if (!row || !box || !text) return;
  document.querySelectorAll('.rowcard.picked').forEach(r => r.classList.remove('picked'));
  row.classList.add('picked');
  box.classList.add('on');
  text.textContent = row.getAttribute('data-src') + (row.getAttribute('data-page') ? '  (p. ' + row.getAttribute('data-page') + ')' : '');
}
document.addEventListener('focusin', showSource);
document.addEventListener('click', showSource);

/* ================= Language selector ================= */
document.addEventListener('change', e => { if (e.target && e.target.id === 'langSel') setLang(e.target.value); });
if (lang !== 'en' && lang !== 'hi') loadLang(lang).then(() => render());

/* ================= Saathi: the floating guide =================
   A helper that stays on every screen. It gives a tip for the current screen and
   answers questions through the same safety-gated /api/ask as the Ask page, sharing
   one conversation with it. It is a guide to the records, not a doctor. */
const PET = { open: false, seen: {}, tipOff: false };
const PET_SVG = '<img class="pet-svg" src="/saathi.svg" width="64" height="64" alt="">';
function petScreen() {
  if (S.view === 'add' && S.stage === 'review') return 'review';
  return S.view === 'detail' ? 'timeline' : (S.view === 'visit' ? 'health' : S.view);
}
function petMsgs() {
  const kinds = ['records', 'general', 'doctor', 'emergency', 'signin'];
  const msgs = S.chat.slice(-8).map(m => {
    if (m.role === 'me') return '<div class="pet-msg me">' + esc(m.text) + '</div>';
    if (m.doc) return '<div class="pet-msg"><div class="pet-lbl"><span class="lbl lbl-doctor">' + esc(t('label_review')) + '</span></div>' + docMsgHTML(m) + '</div>';
    const lbl = kinds.indexOf(m.label) >= 0 ? '<span class="lbl lbl-' + m.label + '">' + esc(t('label_' + m.label)) + '</span>' : '';
    return '<div class="pet-msg' + (m.label === 'emergency' ? ' urgent' : '') + '">' + (lbl ? '<div class="pet-lbl">' + lbl + '</div>' : '') + esc(m.label === 'signin' ? t('signin_msg') : m.text) + signinBtns(m) + msgListen(m) + '</div>';
  }).join('');
  return '<div class="pet-msg">' + esc(t('pet_hello')) + '</div><div class="pet-msg tip">' + esc(t('pet_tip_' + petScreen())) + '</div>' + msgs +
    (S.asking ? '<div class="pet-msg muted">' + esc(t(S.reading ? 'ask_reading' : 'thinking')) + '</div>' : '');
}
function renderPet() {
  const el = document.getElementById('pet');
  if (!el) return;
  const screen = petScreen();
  // the Ask page is already the full chat, so the floating guide would only cover the input
  if (screen === 'ask') { PET.open = false; el.className = 'pet'; el.innerHTML = ''; return; }
  if (!PET.open) {
    const showTip = !PET.tipOff && !PET.seen[screen] && screen !== 'review';
    el.className = 'pet' + (screen === 'review' ? ' mini' : '');
    // the tip is a nudge, not an overlay: it goes away by itself after a few seconds
    if (showTip) { clearTimeout(PET.timer); PET.timer = setTimeout(() => { PET.seen[screen] = true; renderPet(); }, 7000); }
    el.innerHTML = (showTip ? '<div class="pet-bubble" role="status"><span>' + esc(t('pet_tip_' + screen)) + '</span><button type="button" data-pet="tipoff" aria-label="' + esc(t('pet_close')) + '">&times;</button></div>' : '') +
      '<button type="button" class="pet-btn" data-pet="open" aria-label="' + esc(t('pet_open')) + '">' + PET_SVG + '</button>';
    return;
  }
  const typed = (document.getElementById('petInput') || {}).value || '';
  el.className = 'pet open';
  el.innerHTML = '<section class="pet-panel" role="dialog" aria-label="' + esc(t('pet_name')) + '">' +
    '<header><span class="pet-head">' + PET_SVG + '</span><div><strong>' + esc(t('pet_name')) + '</strong><div class="muted small">' + esc(t('pet_sub')) + '</div></div>' +
    '<button type="button" class="xbtn" data-pet="close" aria-label="' + esc(t('pet_close')) + '">&times;</button></header>' +
    '<div class="pet-body" id="petBody">' + petMsgs() + '</div>' +
    '<div class="pet-chips">' + ['pet_q1', 'pet_q2', 'pet_q3'].map(k => '<button type="button" class="chip" data-pet="q" data-q="' + esc(t(k)) + '">' + esc(t(k)) + '</button>').join('') + '</div>' +
    '<form class="pet-form" id="petForm"><button type="button" class="btn small secondary pet-add" data-pet="file" title="' + esc(t('ask_attach')) + '" aria-label="' + esc(t('ask_attach')) + '"' + (S.asking ? ' disabled' : '') + '><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 11.5l-8.6 8.6a5.5 5.5 0 0 1-7.8-7.8l8.6-8.6a3.7 3.7 0 0 1 5.2 5.2l-8.6 8.6a1.8 1.8 0 0 1-2.6-2.6l7.9-7.9"/></svg></button><input type="text" id="petInput" placeholder="' + esc(t('ask_ph')) + '" aria-label="' + esc(t('ask_ph')) + '" autocomplete="off"><button type="submit" class="btn small"' + (S.asking ? ' disabled' : '') + '>' + esc(t('ask_send')) + '</button></form>' +
    '<button type="button" class="pet-link" data-pet="goask">' + esc(t('pet_go_ask')) + '</button></section>';
  const input = document.getElementById('petInput');
  if (input && typed) input.value = typed;
  const body = document.getElementById('petBody');
  if (body) body.scrollTop = body.scrollHeight;
}
const renderPage = render;
render = function () { renderPage(); renderPet(); };
document.addEventListener('click', e => {
  const b = e.target && e.target.closest ? e.target.closest('[data-pet]') : null;
  if (!b) return;
  const a = b.getAttribute('data-pet');
  if (a === 'open') { PET.open = true; PET.seen[petScreen()] = true; }
  else if (a === 'close') PET.open = false;
  else if (a === 'tipoff') PET.tipOff = true;
  else if (a === 'q') { ask(b.getAttribute('data-q')); return; }
  else if (a === 'file') { S.chatUpload = true; $('#fileInput').click(); return; }
  else if (a === 'goask') { PET.open = false; go('ask'); return; }
  renderPet();
  if (a === 'open') {
    const panel = document.querySelector('.pet-panel'); if (panel) panel.classList.add('fresh');
    const i = document.getElementById('petInput'); if (i) i.focus();
  }
});
document.addEventListener('submit', e => {
  if (!e.target || e.target.id !== 'petForm') return;
  e.preventDefault();
  const i = document.getElementById('petInput');
  const q = i ? i.value : '';
  if (i) i.value = '';
  ask(q);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && PET.open) { PET.open = false; renderPet(); } });
renderPet();

/* ================= Account chip =================
   Accounts are a convenience kept in this browser only (see site.js); the app works for
   a guest too, so automated checks and first-time visitors are never blocked by a login. */
function currentUser() {
  try { const u = JSON.parse(localStorage.getItem('sehat_user') || 'null'); return u && u.name ? u : null; } catch (e) { return null; }
}
function renderUser() {
  const el = document.getElementById('userChip');
  if (!el) return;
  const u = currentUser();
  el.textContent = '';
  const who = document.createElement('span');
  who.className = 'who';
  // the account holder's health-profile name, so the header never shows a different person from the family chip
  const selfName = window.SehatFamily ? ((SehatFamily.list().find(p => p.id === 'self') || {}).name || '') : '';
  who.textContent = u ? (u.demo ? t('demo_user') : String(selfName || u.name).split(' ')[0]) : t('guest');
  const link = document.createElement('a');
  link.href = '/login';
  link.textContent = u ? t('sign_out') : t('sign_in');
  if (u) link.addEventListener('click', () => { try { localStorage.removeItem('sehat_user'); } catch (e) { /* ignore */ } });
  if (u) {
    const av = document.createElement('span');
    av.className = 'avatar'; av.setAttribute('aria-hidden', 'true');
    av.textContent = String(selfName || u.name).trim().split(/\s+/).slice(0, 2).map(w => w.charAt(0)).join('').toUpperCase();
    el.appendChild(av);
  }
  el.appendChild(who); el.appendChild(link);
}
const renderWithPet = render;
render = function () { renderWithPet(); renderUser(); };
renderUser();
/* /app?demo=1 (the landing page's "Try the live demo") loads the demo profile once. */
(async function demoFromLink() {
  if (!/[?&]demo=[123]\b/.test(location.search)) return;
  const demoMatch = (location.search.match(/[?&]demo=([123])\b/) || [])[1];
  if (demoMatch) {
    try { sessionStorage.setItem('sehat_demo_mode', demoMatch); } catch (e) {}
  }
  for (let i = 0; i < 40 && !S.ready; i++) await new Promise(r => setTimeout(r, 100));
  if (!currentUser()) {
    try { localStorage.setItem('sehat_user', JSON.stringify({ name: 'Jay Tawri', email: 'demo@sehat.local', demo: true })); } catch (e) { /* ignore */ }
    renderUser();
  }
  if (!S.records.length) await loadDemo();
  // demo only: the sample family takes the medicines on their records, so the schedule and reminders have something to show
  try {
    const all = await dbGetAll('records');
    for (const p of (window.SehatFamily ? SehatFamily.list() : [{ id: 'self' }])) {
      const key = window.SehatFamily ? SehatFamily.profKeyFor('sehat_current', p.id) : 'sehat_current';
      const names = {};
      all.filter(r => (r.profile || 'self') === p.id).forEach(r => arr(r.medicines).forEach(m => { if (curKey(m)) names[curKey(m)] = 1; }));
      if (Object.keys(names).length && !localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(names));
    }
  } catch (e) { /* storage blocked: the schedule just starts empty */ }
  if (typeof journalSeedDemo === 'function') journalSeedDemo(); /* journal.js */
  const want = (location.search.match(/[?&]view=([a-z]+)/) || [])[1];  // /app?demo=1&view=timeline opens that tab
  if (S.records.length && S.stage === 'idle') { S.view = ['timeline', 'ask', 'abha', 'add', 'meds', 'visits', 'journal', 'wellness', 'family'].indexOf(want) >= 0 ? want : 'health'; render(); }
  try {
    const keep = demoMatch || getDemoMode();
    history.replaceState(null, '', '/app?demo=' + keep);
  } catch (e) { /* ignore */ }
})();

/* ================= Theme =================
   Dark and light share one key with the site pages. The choice is applied before first
   paint by a small script in the page head; this only handles the toggle. */
document.addEventListener('click', e => {
  if (!e.target || !e.target.closest || !e.target.closest('#themeBtn')) return;
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('sehat_theme', next); } catch (x) { /* ignore */ }
});

/* ================= Enlarge the original =================
   Checking a medicine line against the source must not need scrolling: the original stays
   pinned on the review screen, and one tap opens it full screen, where a tap zooms. */
function closeZoom() { const z = document.getElementById('zoom'); if (z) z.remove(); document.body.classList.remove('zooming'); }
function openZoom() {
  const f = (S.view === 'detail' && S.detailFile) || S.pendingFile || S.previewFile;
  if (!f || !(f.dataUrl || f.url)) return;
  closeZoom();
  const z = document.createElement('div');
  z.id = 'zoom'; z.className = 'zoom'; z.setAttribute('role', 'dialog'); z.setAttribute('aria-label', t('original'));
  z.innerHTML = '<div class="zoom-bar"><span>' + esc(t('zoom_hint')) + '</span><button type="button" class="btn small" data-zoom="close">' + esc(t('pet_close')) + '</button></div><div class="zoom-body" data-zoom="toggle">' + previewHTML(f) + '</div>';
  document.body.appendChild(z);
  document.body.classList.add('zooming');
}
document.addEventListener('click', e => {
  const el = e.target && e.target.closest ? e.target.closest('[data-zoom]') : null;
  if (!el) return;
  const a = el.getAttribute('data-zoom');
  if (a === 'open') openZoom();
  else if (a === 'close') closeZoom();
  else if (a === 'toggle') el.classList.toggle('big');
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeZoom(); });

/* load the full language list (43) and the guide's translations for the current language */
loadLangList();
loadSiteMap(lang);

/* ================= DNA helix =================
   A decorative Three.js helix (dna3d.js) for the dashboard's lead card. It is fetched only
   once a host element exists, after the page is idle, so it never delays the app. */
(function () {
  let done = false;
  const tick = setInterval(() => {
    if (done || !document.querySelector('[data-dna]')) return;
    done = true; clearInterval(tick);
    const m = document.createElement('script'); m.type = 'module'; m.src = '/dna3d.js'; document.head.appendChild(m);
  }, 1500);
})();


/* Global Event Listeners for Demo 2 & Demo 3 */
document.addEventListener('click', e => {
  const pill = e.target.closest('.demo-pill');
  if (pill) {
    const mode = pill.dataset.demo || pill.dataset.mode;
    if (mode) {
      e.preventDefault();
      setDemoMode(mode);
      return;
    }
  }
  const avTabBtn = e.target.closest('.av-tab-btn');
  if (avTabBtn && avTabBtn.dataset.avtab) {
    S.avTab = avTabBtn.dataset.avtab;
    render();
    return;
  }
  const copySoapBtn = e.target.closest('#btnCopySoap');
  if (copySoapBtn) {
    const soapText = `CLINICAL SOAP NOTE - JAY TAWRI (28y M)
SUBJECTIVE:
Type 2 Diabetes follow-up. Compliant with Metformin 500mg OD. Seasonal symptoms resolved. No hypoglycemia.

OBJECTIVE:
Fasting Glucose: 118 mg/dL (Elevated)
HbA1c: 6.9% (Controlled)
SGPT/ALT: 88 U/L (Elevated 1.95x)
Serum Creatinine: 1.0 mg/dL (Normal)
Platelets: 240,000 /µL (Normal)

ASSESSMENT:
1. Type 2 Diabetes Mellitus - Controlled on Metformin 500mg.
2. Isolated Transaminitis (SGPT 88 U/L) - Likely metabolic steatosis (NAFLD).
3. Renal clearance confirmed safe for Biguanide continuation.

PLAN:
1. Continue Metformin 500mg OD post-dinner.
2. Order USG Abdomen & repeat LFT in 6 weeks.
3. Dietary carbohydrate restriction (<130g/day) + 30 min daily walking.`;
    navigator.clipboard.writeText(soapText).then(() => {
      copySoapBtn.textContent = '✅ Copied to EHR Clipboard!';
      setTimeout(() => { copySoapBtn.textContent = '📋 Copy to EHR Clipboard'; }, 2000);
    });
    return;
  }
  const starterBtn = e.target.closest('.cai-starter-btn');
  if (starterBtn && starterBtn.dataset.prompt) {
    caiSubmitPrompt(starterBtn.dataset.prompt);
    return;
  }
  const threadBtn = e.target.closest('.cai-thread-item') || e.target.closest('.cai-mobile-thread-chip');
  if (threadBtn && threadBtn.dataset.thread) {
    S.caiThread = threadBtn.dataset.thread;
    render();
    return;
  }
  const newChatBtn = e.target.closest('#caiNewChatBtn');
  if (newChatBtn) {
    S.caiMessages = [
      {
        role: 'assistant',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: 'New consultation started for Jay Tawri. How can I assist you with clinical evaluation, diagnostic interpretation, or treatment planning?'
      }
    ];
    render();
    return;
  }
  const clearBtn = e.target.closest('#caiClearBtn');
  if (clearBtn) {
    S.caiMessages = [];
    render();
    return;
  }
});

document.addEventListener('submit', e => {
  const form = e.target.closest('#caiForm');
  if (form) {
    e.preventDefault();
    const input = form.querySelector('#caiInput');
    if (input && input.value.trim()) {
      caiSubmitPrompt(input.value.trim());
      input.value = '';
    }
  }
});
