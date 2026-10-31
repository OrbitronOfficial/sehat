/* Sehat Copilot: medicine reminders, appointments, calendar export and the "What your copilot did" feed.
   Loaded after app.js. Uses its globals (S, t, esc, render, buildDoses, schedMeds, curKey, curSet, todayKey, fmtDate ...).
   Everything is kept on this device. Reminders follow what the prescription says; the copilot never advises a change. */
(function () {
  const KP = k => (typeof profKey === 'function' ? profKey(k) : k);
  const jget = (k, d) => { try { const v = JSON.parse(localStorage.getItem(KP(k)) || 'null'); return v == null ? d : v; } catch (e) { return d; } };
  const jset = (k, v) => { try { localStorage.setItem(KP(k), JSON.stringify(v)); } catch (e) { /* storage blocked */ } };
  /* the same, for another family profile (caregiver alerts, notification actions) */
  const activeId = () => (window.SehatFamily ? SehatFamily.active() : 'self');
  const KPf = (k, pid) => (pid && typeof profKeyFor === 'function' ? profKeyFor(k, pid) : KP(k));
  const jgetP = (k, d, pid) => { try { const v = JSON.parse(localStorage.getItem(KPf(k, pid)) || 'null'); return v == null ? d : v; } catch (e) { return d; } };
  const jsetP = (k, v, pid) => { try { localStorage.setItem(KPf(k, pid), JSON.stringify(v)); } catch (e) { /* storage blocked */ } };

  /* ---------- labels ---------- */
  Object.assign(STR.en, {
    rm_what: 'What your copilot did', rm_sub: 'Your copilot acts on its own. You can see, edit or reject everything it did.',
    rm_rx: 'Scheduled {n} reminders from your prescription of {date}', rm_rx_note: 'The reminders follow what the prescription says. Nothing starts until you accept.',
    rm_rxe: "This prescription's courses ended on {date}, so no reminders were set.", rm_anyway: 'Set reminders anyway', rm_prn: 'Only when needed — no reminder',
    rm_fu_q: 'Did this follow-up happen?', rm_fu_yes: 'Yes, it happened', rm_fu_na: 'Not needed',
    rm_fu: 'A follow-up looks overdue: {text} (record of {date})', rm_rp: 'A repeat test looks due: {title}',
    rm_visit: 'Drafted questions for your next visit', rm_open_visit: 'Open visit summary', rm_open_rec: 'Open record',
    rm_accept: 'Accept', rm_edit: 'Edit', rm_reject: 'Reject', rm_undo: 'Undo', rm_dismiss: 'Dismiss', rm_done: 'Mark done',
    rm_accepted: 'Accepted. These reminders are on.', rm_rejected: 'Rejected. No reminders were set.',
    rm_at: 'at {time}', rm_until: 'until {date}', rm_snoozed: 'snoozed until {time}', rm_noend: 'no end date',
    rm_snooze: 'Snooze', rm_min: '{n} min', rm_stop: 'Stop reminders for this medicine', rm_cal: 'Add to Google Calendar', nudge_btn: 'Remind to take medicines', nudge_sent: 'Reminder sent to {name}. They will see it when their profile opens.',
    nudge_from: '{from} reminded you to take your medicines', nudge_med: 'Next: {med} at {time}', nudge_open: 'Open medicine schedule', nudge_ok: 'Got it',
    rm_stop_confirm: 'Stop reminders for {name}? This only stops reminders in this app. It does not change your prescription.',
    rm_ed_title: 'Edit reminders', rm_time: 'Time', rm_dose: 'Dose', rm_end: 'Last day', rm_save: 'Save', rm_cancel: 'Cancel',
    rm_ap_title: 'Appointments & follow-ups', rm_ap_add: 'Add appointment', rm_ap_edit: 'Edit appointment', rm_ap_empty: 'No appointments or follow-ups yet.',
    rm_ap_name: 'Title', rm_ap_date: 'Date', rm_ap_time: 'Time', rm_ap_note: 'Note', rm_overdue: 'Overdue', rm_nodate: 'no date found',
    rm_del: 'Delete', rm_del_confirm: 'Delete this appointment?', rm_from: 'From your record of {date}',
    rm_ics: 'Download calendar (.ics)', rm_ics_note: 'Add the file to your phone calendar so alerts reach you even when this app is closed.',
    rm_due: 'Time for {name} ({time})', rm_close: 'Close',
    rm_next: 'Next visit: {date}', rm_link_lbl: 'This visit happened: pick a record', rm_link_none: 'Pick a record...',
    rm_resched: 'Reschedule', rm_new_date: 'New date', rm_fu_gen: 'Follow-up',
    vis_title: 'Visits', vis_done: 'Done', vis_missed: 'Missed', vis_up: 'Upcoming', vis_none: 'Nothing here yet.', vis_for: 'For: {what}', vis_fu_done: 'Follow-up done', vis_linked: 'Visit recorded',
    cg_msg: '{name} missed {med} ({time})', cg_msg_self: 'You have not marked {med} ({time}) as taken', cg_call: 'Call / remind', cg_followed: 'Followed up', cg_note: 'Based on what is marked in this app on this device.',
    td_title: 'Today', td_next: 'Next: {med} at {time}, in {when}', td_over: 'Overdue: {med} was due at {time}', td_alldone: 'No more doses today.',
    td_all_cal: 'Add all my medicine reminders to Google Calendar', td_links: 'If your browser blocked a tab, use these links:', td_one: 'Add {med}', td_each: 'Or add one medicine at a time:',
    td_h: '{h} h', td_hm: '{h} h {m} min', td_m: '{m} min', td_now: 'now',
    rm_taken: 'Taken', rm_in15: 'In 15 min', rm_in60: 'In 1 hour', rm_pick: 'Pick a time', rm_set: 'Set', rm_skip: 'Skip this dose', rm_skipped: 'skipped today'
  });
  Object.assign(STR.hi, {
    rm_what: 'आपके कोपायलट ने क्या किया', rm_sub: 'आपका कोपायलट अपने आप काम करता है। उसने जो किया उसे आप देख, बदल या अस्वीकार कर सकते हैं।',
    rm_rx: '{date} के आपके पर्चे से {n} याद दिलाने तय किए', rm_rx_note: 'याद दिलाना वही है जो पर्चे में लिखा है। आपके स्वीकार करने तक कुछ शुरू नहीं होता।',
    rm_rxe: 'इस पर्चे की दवाओं का कोर्स {date} को पूरा हो चुका है, इसलिए कोई याद दिलाना तय नहीं किया।', rm_anyway: 'फिर भी याद दिलाएँ', rm_prn: 'ज़रूरत पड़ने पर ही — कोई याद दिलाना नहीं',
    rm_fu_q: 'क्या यह फ़ॉलो-अप हुआ था?', rm_fu_yes: 'हाँ, हो गया', rm_fu_na: 'ज़रूरत नहीं थी',
    rm_fu: 'फ़ॉलो-अप की तारीख़ निकल चुकी लगती है: {text} ({date} का रिकॉर्ड)', rm_rp: 'दोबारा जाँच का समय हो गया लगता है: {title}',
    rm_visit: 'अगली मुलाक़ात के लिए सवाल तैयार किए', rm_open_visit: 'विज़िट सारांश खोलें', rm_open_rec: 'रिकॉर्ड खोलें',
    rm_accept: 'स्वीकार करें', rm_edit: 'बदलें', rm_reject: 'अस्वीकार करें', rm_undo: 'वापस करें', rm_dismiss: 'हटाएँ', rm_done: 'पूरा हुआ',
    rm_accepted: 'स्वीकार किया। ये याद दिलाने चालू हैं।', rm_rejected: 'अस्वीकार किया। कोई याद दिलाना नहीं लगाया गया।',
    rm_at: '{time} बजे', rm_until: '{date} तक', rm_snoozed: '{time} तक टाला गया', rm_noend: 'कोई अंतिम तारीख़ नहीं',
    rm_snooze: 'टालें', rm_min: '{n} मिनट', rm_stop: 'इस दवा के याद दिलाने बंद करें', rm_cal: 'Google कैलेंडर में जोड़ें', nudge_btn: 'दवा लेने की याद दिलाएँ', nudge_sent: '{name} को याद दिलाया गया। उनकी प्रोफ़ाइल खुलने पर यह दिखेगा।',
    nudge_from: '{from} ने आपको दवा लेने की याद दिलाई है', nudge_med: 'अगली: {med}, {time} बजे', nudge_open: 'दवा की समय-सारणी खोलें', nudge_ok: 'ठीक है',
    rm_stop_confirm: '{name} के याद दिलाने बंद करें? इससे सिर्फ़ इस ऐप के याद दिलाने बंद होते हैं। आपका पर्चा नहीं बदलता।',
    rm_ed_title: 'याद दिलाने बदलें', rm_time: 'समय', rm_dose: 'खुराक', rm_end: 'आख़िरी दिन', rm_save: 'सहेजें', rm_cancel: 'रद्द करें',
    rm_ap_title: 'अपॉइंटमेंट और फ़ॉलो-अप', rm_ap_add: 'अपॉइंटमेंट जोड़ें', rm_ap_edit: 'अपॉइंटमेंट बदलें', rm_ap_empty: 'अभी कोई अपॉइंटमेंट या फ़ॉलो-अप नहीं है।',
    rm_ap_name: 'शीर्षक', rm_ap_date: 'तारीख़', rm_ap_time: 'समय', rm_ap_note: 'टिप्पणी', rm_overdue: 'तारीख़ निकल गई', rm_nodate: 'तारीख़ नहीं मिली',
    rm_del: 'हटाएँ', rm_del_confirm: 'यह अपॉइंटमेंट हटाएँ?', rm_from: '{date} के आपके रिकॉर्ड से',
    rm_ics: 'कैलेंडर डाउनलोड करें (.ics)', rm_ics_note: 'फ़ाइल को फ़ोन के कैलेंडर में जोड़ें ताकि ऐप बंद होने पर भी अलर्ट मिलें।',
    rm_due: '{name} का समय ({time})', rm_close: 'बंद करें',
    rm_next: 'अगली मुलाक़ात: {date}', rm_link_lbl: 'यह मुलाक़ात हो गई: रिकॉर्ड चुनें', rm_link_none: 'रिकॉर्ड चुनें...',
    rm_resched: 'तारीख़ बदलें', rm_new_date: 'नई तारीख़', rm_fu_gen: 'फ़ॉलो-अप',
    vis_title: 'मुलाक़ातें', vis_done: 'हो चुकी', vis_missed: 'छूट गई', vis_up: 'आने वाली', vis_none: 'यहाँ अभी कुछ नहीं है।', vis_for: 'किसलिए: {what}', vis_fu_done: 'फ़ॉलो-अप हो गया', vis_linked: 'मुलाक़ात दर्ज है',
    cg_msg: '{name} ने {med} ({time}) नहीं ली', cg_msg_self: 'आपने {med} ({time}) ली, यह अभी तक दर्ज नहीं किया', cg_call: 'फ़ोन करें / याद दिलाएँ', cg_followed: 'पूछ लिया गया', cg_note: 'यह इस डिवाइस पर इस ऐप में लगाए गए निशानों पर आधारित है।',
    td_title: 'आज', td_next: 'अगली: {med}, {time} बजे, {when} में', td_over: 'देर हो चुकी: {med} का समय {time} था', td_alldone: 'आज की कोई और खुराक नहीं है।',
    td_all_cal: 'मेरी सभी दवाओं के याद दिलाने Google कैलेंडर में जोड़ें', td_links: 'अगर ब्राउज़र ने कोई टैब रोका, तो ये लिंक इस्तेमाल करें:', td_one: '{med} जोड़ें', td_each: 'या एक-एक दवा जोड़ें:',
    td_h: '{h} घंटे', td_hm: '{h} घंटे {m} मिनट', td_m: '{m} मिनट', td_now: 'अभी',
    rm_taken: 'ले ली', rm_in15: '15 मिनट बाद', rm_in60: '1 घंटे बाद', rm_pick: 'समय चुनें', rm_set: 'तय करें', rm_skip: 'यह खुराक छोड़ें', rm_skipped: 'आज छोड़ी गई'
  });

  /* ---------- dates ---------- */
  const p2 = n => String(n).padStart(2, '0');
  const isoOf = d => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate());
  const dOf = s => new Date(String(s).slice(0, 10) + 'T00:00:00');
  const addDays = (s, n) => { const d = dOf(s); d.setDate(d.getDate() + n); return isoOf(d); };
  const validISO = (y, m, d) => { const x = new Date(y, m - 1, d); return x.getFullYear() === y && x.getMonth() === m - 1 && x.getDate() === d ? y + '-' + p2(m) + '-' + p2(d) : null; };
  const MON = 'jan feb mar apr may jun jul aug sep oct nov dec'.split(' ');
  const NUMW = { a: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, fourteen: 14 };
  function durDays(s) {
    s = String(s || '').toLowerCase();
    const m = s.match(/(\d+(?:\.\d+)?|a|one|two|three|four|five|six|seven|ten|fourteen)\s*(day|d\b|week|wk|month|mo\b)/);
    if (!m) return null;
    const n = isNaN(m[1]) ? NUMW[m[1]] : Number(m[1]);
    return Math.round(n * (/^d/.test(m[2]) ? 1 : (/^(w)/.test(m[2]) ? 7 : 30)));
  }
  /* calendar arithmetic: months and years move by calendar (7 Oct + 3 months = 7 Jan), days and weeks by count */
  function addUnit(iso, n, u) {
    const d = dOf(iso);
    if (u === 'd' || u === 'w') { d.setDate(d.getDate() + n * (u === 'w' ? 7 : 1)); return isoOf(d); }
    const day = d.getDate();
    d.setDate(1); d.setMonth(d.getMonth() + (u === 'y' ? 12 * n : n));
    d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
    return isoOf(d);
  }
  const unitOf = u => /^(day|दिन)/.test(u) ? 'd' : /^(week|wk|हफ|सप्ताह)/.test(u) ? 'w' : /^(month|mo|महीन|माह)/.test(u) ? 'm' : 'y';
  /* a follow-up note is free text: find a date in it, or "after 3 months" / "x 5 days" / "3 महीने बाद" counted from the record date */
  function parseFU(txt, rd) {
    const s = String(txt || '').toLowerCase().replace(/[०-९]/g, c => '०१२३४५६७८९'.indexOf(c));
    let m = s.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) return validISO(+m[1], +m[2], +m[3]);
    if ((m = s.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4}|\d{2})\b/))) return validISO(+m[3] < 100 ? 2000 + +m[3] : +m[3], +m[2], +m[1]);
    if ((m = s.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3})[a-z]*\.?,?\s+(\d{4})/)) && MON.indexOf(m[2]) >= 0) return validISO(+m[3], MON.indexOf(m[2]) + 1, +m[1]);
    if ((m = s.match(/\b([a-z]{3})[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/)) && MON.indexOf(m[1]) >= 0) return validISO(+m[3], MON.indexOf(m[1]) + 1, +m[2]);
    if (rd) {
      m = s.match(/(?:after|in|within|next|x|×|for)\s*(\d+|a|one|two|three|four|five|six|seven|eight|nine|ten|twelve)\s*(days?|weeks?|wks?|months?|mo\b|years?|yrs?)/) ||
        s.match(/(\d+|a|one|two|three|four|five|six|twelve)\s*(days?|weeks?|wks?|months?|years?)\s*(?:later|from now)/) ||
        s.match(/(\d+)\s*(दिन|हफ़?्ते|हफ़?्ता|सप्ताह|महीन[ेा]?|माह|साल|वर्ष)/);
      if (m) return addUnit(String(rd).slice(0, 10), isNaN(m[1]) ? NUMW[m[1]] : Number(m[1]), unitOf(m[2]));
    }
    return null;
  }

  /* ---------- reminder state: edits, snoozes, stopped courses ---------- */
  const SLOT_T = { morning: '08:00', afternoon: '14:00', night: '21:00', asis: '09:00', weekly: '09:00' };
  const ov = pid => { const o = jgetP('sehat_rem', {}, pid); ['t', 'd', 'e', 'x', 's', 'sk'].forEach(k => { if (!o[k]) o[k] = {}; }); return o; };
  const ovSave = (o, pid) => jsetP('sehat_rem', o, pid);
  const tickable = d => d.slot === 'morning' || d.slot === 'afternoon' || d.slot === 'night' || d.slot === 'asis';
  const doseTime = (d, o) => (o || ov()).t[d.key] || SLOT_T[d.slot] || '09:00';
  function endOf(m, o) {
    const e = (o || ov()).e[curKey(m)];
    if (e) return e;
    if (m.ends && /^\d{4}-\d\d-\d\d/.test(m.ends)) return String(m.ends).slice(0, 10);
    const n = durDays(m.duration);
    return n && m.date ? addDays(String(m.date).slice(0, 10), n - 1) : null;
  }
  /* true when the course has ended (end date passed) or the user stopped its reminders */
  function hide(m) {
    const o = ov(), e = endOf(m, o);
    return !!o.x[curKey(m)] || !!(e && e < todayKey());
  }
  const hhmm = ts => { const d = new Date(ts); return d.getHours() + ':' + p2(d.getMinutes()); };
  const medName = m => m.name + (m.strength ? ' ' + m.strength : '');

  /* controls under each dose in the medicine schedule card */
  function doseCtl(d) {
    if (!tickable(d)) return '';
    const o = ov(), m = d.m, sn = o.s[d.key], end = endOf(m, o), live = sn && sn > Date.now();
    const line = [t('rm_at', { time: doseTime(d, o) }), o.d[d.key], end ? t('rm_until', { date: fmtDate(end) }) : t('rm_noend'), live ? t('rm_snoozed', { time: hhmm(sn) }) : '', o.sk[todayKey() + d.key] ? t('rm_skipped') : ''].filter(Boolean).join(' · ');
    const ev = doseEvent(d, o);
    return '<details class="remctl"><summary>' + esc(line) + '</summary><div class="rm-btns"><span class="muted small">' + esc(t('rm_snooze')) + ':</span>' +
      [10, 30, 60].map(n => '<button type="button" class="btn small secondary" data-act="rm_snooze" data-k="' + esc(d.key) + '" data-n="' + n + '">' + esc(t('rm_min', { n })) + '</button>').join('') +
      '<button type="button" class="btn small secondary" data-act="rm_skip" data-k="' + esc(d.key) + '">' + esc(t('rm_skip')) + '</button>' +
      '<button type="button" class="btn small secondary" data-act="rm_edit" data-m="' + esc(curKey(m)) + '">' + esc(t('rm_edit')) + '</button>' +
      '<button type="button" class="btn small danger" data-act="rm_stop" data-m="' + esc(curKey(m)) + '" data-name="' + esc(m.name) + '">' + esc(t('rm_stop')) + '</button>' +
      '<a class="btn small secondary" target="_blank" rel="noopener" href="' + esc(gcal(ev)) + '">' + esc(t('rm_cal')) + '</a></div></details>';
  }

  /* ---------- calendar ---------- */
  const compact = (iso, tm, plusMin) => { const d = new Date(iso + 'T' + (tm || '09:00') + ':00'); d.setMinutes(d.getMinutes() + (plusMin || 0)); return d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + 'T' + p2(d.getHours()) + p2(d.getMinutes()) + '00'; };
  const dcomp = iso => String(iso).slice(0, 10).replace(/-/g, '');
  const calDose = d => tickable(d) || d.slot === 'weekly';  /* "when needed" (SOS) medicines never get a calendar event */
  function doseEvent(d, o) {
    const m = d.m, rd = m.date ? String(m.date).slice(0, 10) : '', today = todayKey();
    return {
      uid: 'sehat-' + d.key.replace(/[^a-z0-9]/gi, '') + '@sehat', title: medName(m), date: rd > today ? rd : today, time: doseTime(d, o), mins: 15,
      until: endOf(m, o), repeat: d.slot === 'weekly' ? 'WEEKLY' : 'DAILY', alarm: '-PT0M',
      details: [(o.d[d.key] || m.dose) ? 'Dose: ' + (o.d[d.key] || m.dose) : '', [m.frequency, m.timing].filter(Boolean).join(', '), 'From your prescription' + (m.date ? ' of ' + String(m.date).slice(0, 10) : '') + '. Reminder only.'].filter(Boolean).join('. ')
    };
  }
  function apptEvent(a) {
    const uid = 'sehat-' + String(a.id).replace(/[^a-z0-9]/gi, '') + '@sehat';
    if (a.src === 'r') {  // a written follow-up: all-day event on the due date
      return { uid, title: 'Follow-up: ' + (a.what || t('rm_fu_gen')), date: a.date, allDay: true, until: null, repeat: null, alarm: '-P1D',
        details: [a.title, a.rdate ? 'Record of ' + String(a.rdate).slice(0, 10) : ''].filter(Boolean).join('. ') };
    }
    return { uid, title: a.title, date: a.date, time: a.time || '09:00', mins: 60, until: null, repeat: null, alarm: '-P1D', details: a.note || '' };
  }
  /* ongoing medicine: repeats with no end; finite course: UNTIL = last day. Weekly stays weekly. */
  function rrule(e, ics) {
    if (!e.repeat) return '';
    return 'FREQ=' + e.repeat + (e.until && e.until >= e.date ? ';UNTIL=' + dcomp(e.until) + (ics ? 'T235959' : '') : '');
  }
  function gcal(e) {
    const enc = encodeURIComponent, rr = rrule(e);
    const dates = e.allDay ? dcomp(e.date) + '/' + dcomp(addDays(e.date, 1)) : compact(e.date, e.time) + '/' + compact(e.date, e.time, e.mins);
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + enc(e.title) + '&dates=' + dates + '&details=' + enc(e.details) + (rr ? '&recur=RRULE:' + rr : '');
  }
  function allEvents() {
    const o = ov();
    return buildDoses(schedMeds()).filter(calDose).map(d => doseEvent(d, o)).concat(appts().filter(a => a.date).map(apptEvent));
  }
  /* one event per medicine (first dose time; other times go in the details) for the "add all" button */
  function medEvents() {
    const o = ov(), ds = buildDoses(schedMeds()).filter(calDose), seen = {}, out = [];
    ds.forEach(d => {
      const k = curKey(d.m);
      if (seen[k]) return;
      seen[k] = 1;
      const e = doseEvent(d, o), more = ds.filter(x => curKey(x.m) === k && x !== d).map(x => doseTime(x, o));
      if (more.length) e.details += (/\.$/.test(e.details) ? ' ' : '. ') + 'Also at ' + more.join(', ');
      out.push(e);
    });
    return out;
  }
  function icsText() {
    const esc2 = s => String(s || '').replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([,;])/g, '\\$1');
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sehat Copilot//Reminders//EN', 'CALSCALE:GREGORIAN'], stamp = compact(todayKey(), '00:00') + 'Z';
    allEvents().forEach(e => {
      L.push('BEGIN:VEVENT', 'UID:' + e.uid, 'DTSTAMP:' + stamp);
      if (e.allDay) L.push('DTSTART;VALUE=DATE:' + dcomp(e.date), 'DTEND;VALUE=DATE:' + dcomp(addDays(e.date, 1)));
      else L.push('DTSTART:' + compact(e.date, e.time), 'DTEND:' + compact(e.date, e.time, e.mins));
      const rr = rrule(e, true);
      if (rr) L.push('RRULE:' + rr);
      L.push('SUMMARY:' + esc2(e.title), 'DESCRIPTION:' + esc2(e.details), 'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc2(e.title), 'TRIGGER:' + e.alarm, 'END:VALARM', 'END:VEVENT');
    });
    L.push('END:VCALENDAR');
    return L.join('\r\n') + '\r\n';
  }
  function downloadIcs() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([icsText()], { type: 'text/calendar' }));
    a.download = 'sehat-reminders.ics';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  /* ---------- appointments & follow-ups ---------- */
  /* A follow-up stays until the user marks it done or links a later record to it. A newer record never closes it by itself. */
  const apStore = () => { const s = jget('sehat_appts', {}); return { items: Array.isArray(s.items) ? s.items : [], done: s.done || {}, links: s.links || {}, resched: s.resched || {}, na: s.na || {}, late: s.late || {} }; };
  const fuClosed = (id, st) => !!(st.done[id] || st.links[id] || st.na[id]);
  const staleFU = a => a.src === 'r' && ((!!a.date && a.date < addDays(todayKey(), -30)) || !!apStore().late[a.rec]);  /* due over 30 days ago, or already past when the document was uploaded: asked about, not raised as overdue */
  const fuDue = (r, st) => st.resched[r.id] || parseFU(r.follow_up, r.date);
  const whatOf = r => {
    const d = arr(r.diagnoses).map(x => (x && typeof x === 'object' ? x.name : x)).filter(x => typeof x === 'string' && x.trim());
    return d.length ? d.slice(0, 2).join(', ') : (r.title || t('rm_fu_gen'));
  };
  function appts() {
    const st = apStore(), out = st.items.filter(a => !st.done[a.id]).map(a => Object.assign({ src: 'm' }, a));
    (S.records || []).forEach(r => {
      if (!r.follow_up || fuClosed(r.id, st)) return;
      out.push({ id: 'fu:' + r.id, src: 'r', title: r.follow_up, date: fuDue(r, st), rec: r.id, rdate: r.date, what: whatOf(r) });
    });
    const key = a => a.date ? a.date + ' ' + (a.time || '09:00') : '9999';
    return out.sort((a, b) => key(a) < key(b) ? -1 : 1);
  }
  /* Add an appointment-style reminder from code (e.g. a sugar recheck). Same shape as the manual form; the same title+date+time is not added twice. */
  function addAppt(o) {
    const title = String((o && o.title) || '').trim(), date = String((o && o.date) || '');
    if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    const st = apStore(), time = (o.time || '').slice(0, 5), note = String(o.note || '').trim();
    let it = st.items.find(x => x.title === title && x.date === date && (x.time || '') === time);
    if (!it) { it = { id: 'a' + Date.now() + Math.random().toString(36).slice(2, 5), title, date, time, note }; st.items.push(it); jset('sehat_appts', st); }
    return it;
  }
  const overdue = a => !!a.date && a.date < todayKey();
  /* "This visit happened": link one later record to the follow-up */
  function linkSel(rec, rdate) {
    const opts = (S.records || []).filter(o => o.id !== rec && o.date && (!rdate || o.date > rdate)).sort((a, b) => String(b.date).localeCompare(String(a.date)));
    if (!opts.length) return '';
    return '<label class="rm-link muted small">' + esc(t('rm_link_lbl')) + '<select data-rmlink="' + esc(rec) + '"><option value="">' + esc(t('rm_link_none')) + '</option>' +
      opts.map(o => '<option value="' + esc(o.id) + '">' + esc(fmtDate(o.date) + ' · ' + (o.title || typeLabel(o.doc_type))) + '</option>').join('') + '</select></label>';
  }
  const calLink = a => a.date ? '<a class="btn small secondary" target="_blank" rel="noopener" href="' + esc(gcal(apptEvent(a))) + '">' + esc(t('rm_cal')) + '</a>' : '';
  function apptCard() {
    const list = appts(), evs = allEvents();
    return '<div class="card" id="rmAppts"><div class="row between"><h2>' + esc(t('rm_ap_title')) + '</h2><button type="button" class="btn small secondary" data-act="rm_ap_new">' + esc(t('rm_ap_add')) + '</button></div>' +
      (list.length ? '<ul class="list rm-ap">' + list.map(a => {
        const when = a.date ? (a.src === 'r' ? t('rm_next', { date: fmtDate(a.date) }) : fmtDate(a.date) + (a.time ? ' ' + a.time : '')) : t('rm_nodate');
        const meta = [when, a.src === 'r' ? t('rm_from', { date: fmtDate(a.rdate) }) : '', a.note].filter(Boolean).join(' · ');
        return '<li><span class="l"><strong>' + esc(a.title) + '</strong>' + (overdue(a) ? ' <span class="flag f-high">' + esc(t('rm_overdue')) + '</span>' : '') + '<br><span class="muted small">' + esc(meta) + '</span>' +
          '<div class="rm-btns">' + calLink(a) +
          (a.src === 'm' ? '<button type="button" class="btn small secondary" data-act="rm_ap_edit" data-id="' + esc(a.id) + '">' + esc(t('rm_edit')) + '</button><button type="button" class="btn small danger" data-act="rm_ap_del" data-id="' + esc(a.id) + '">' + esc(t('rm_del')) + '</button>'
            : '<button type="button" class="btn small secondary" data-act="rm_done" data-rec="' + esc(a.rec) + '">' + esc(t('rm_done')) + '</button><button type="button" class="btn small link" data-act="openrec" data-id="' + esc(a.rec) + '">' + esc(t('rm_open_rec')) + '</button>') +
          '</div>' + (a.src === 'r' ? linkSel(a.rec, a.rdate) : '') + '</span></li>';
      }).join('') + '</ul>' : '<p class="muted">' + esc(t('rm_ap_empty')) + '</p>') +
      (evs.length ? '<div class="rm-btns" style="margin-top:12px"><button type="button" class="btn small" data-act="rm_ics">' + esc(t('rm_ics')) + '</button></div><p class="muted small" style="margin:6px 0 0">' + esc(t('rm_ics_note')) + '</p>' : '') + '</div>';
  }

  /* Visits view card: Done / Missed / Upcoming. The layout agent places it with SehatRem.visitsCard(). */
  const VISIT_TYPES = ['prescription', 'discharge_summary'];  // lab reports are not visits
  function visitsCard() {
    const st = apStore(), recs = S.records || [], all = appts();
    const done = recs.filter(r => VISIT_TYPES.indexOf(r.doc_type) >= 0).map(r => ({ date: r.date, what: whatOf(r), rec: r.id, kind: 'rec' }));
    recs.filter(r => r.follow_up && fuClosed(r.id, st) && !(st.na[r.id] && !st.done[r.id] && !st.links[r.id])).forEach(r => {
      const lk = st.links[r.id] && recs.find(o => o.id === st.links[r.id]);
      done.push({ date: (lk && lk.date) || (typeof st.done[r.id] === 'string' ? st.done[r.id] : '') || fuDue(r, st) || r.date, what: whatOf(r), rec: r.id, kind: lk ? 'link' : 'fu' });
    });
    st.items.filter(a => st.done[a.id]).forEach(a => done.push({ date: a.date, what: a.title, kind: 'm' }));
    done.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    const missed = all.filter(overdue), up = all.filter(a => !overdue(a));
    const row = (a, g) => {
      const meta = [a.date ? (a.src === 'r' ? t('rm_next', { date: fmtDate(a.date) }) : fmtDate(a.date) + (a.time ? ' ' + a.time : '')) : t('rm_nodate'), t('vis_for', { what: a.src === 'r' ? a.what : a.title }), a.src === 'r' ? t('rm_from', { date: fmtDate(a.rdate) }) : ''].filter(Boolean).join(' · ');
      const id = a.src === 'r' ? a.rec : a.id;
      if (g === 'missed' && staleFU(a)) return '<li><span class="l"><strong>' + esc(t('rm_fu_q')) + '</strong><br><span class="muted small">' + esc([a.title, meta].join(' · ')) + '</span><div class="rm-btns">' +
        '<button type="button" class="btn small secondary" data-act="rm_done" data-rec="' + esc(id) + '">' + esc(t('rm_fu_yes')) + '</button><button type="button" class="btn small link" data-act="rm_na" data-rec="' + esc(id) + '">' + esc(t('rm_fu_na')) + '</button></div>' + linkSel(a.rec, a.rdate) + '</span></li>';
      return '<li><span class="l"><strong>' + esc(a.title) + '</strong><br><span class="muted small">' + esc(meta) + '</span><div class="rm-btns">' +
        (g === 'missed' ? '<button type="button" class="btn small secondary" data-act="rm_done" data-rec="' + esc(id) + '">' + esc(t('rm_done')) + '</button><button type="button" class="btn small secondary" data-act="rm_resched" data-id="' + esc(a.id) + '">' + esc(t('rm_resched')) + '</button>' : '') +
        calLink(a) + '</div>' + (a.src === 'r' && g === 'missed' ? linkSel(a.rec, a.rdate) : '') + '</span></li>';
    };
    const drow = d => '<li><span class="l"><strong>' + esc(d.date ? fmtDate(d.date) : t('undated')) + '</strong>' + (d.kind !== 'rec' ? ' <span class="tag green">' + esc(t(d.kind === 'link' ? 'vis_linked' : 'vis_fu_done')) + '</span>' : '') +
      '<br><span class="muted small">' + esc(t('vis_for', { what: d.what })) + '</span>' + (d.rec ? '<div class="rm-btns"><button type="button" class="btn small link" data-act="openrec" data-id="' + esc(d.rec) + '">' + esc(t('rm_open_rec')) + '</button></div>' : '') + '</span></li>';
    const grp = (title, items, fn) => '<h3 style="margin:12px 0 4px">' + esc(t(title)) + ' (' + items.length + ')</h3>' + (items.length ? '<ul class="list rm-ap">' + items.map(fn).join('') + '</ul>' : '<p class="muted small">' + esc(t('vis_none')) + '</p>');
    return '<div class="card" id="rmVisits"><div class="row between"><h2>' + esc(t('vis_title')) + '</h2><button type="button" class="btn small secondary" data-act="rm_ap_new">' + esc(t('rm_ap_add')) + '</button></div>' + grp('vis_done', done, drow) + grp('vis_missed', missed, a => row(a, 'missed')) + grp('vis_up', up, a => row(a, 'up')) + '</div>';
  }

  /* ---------- copilot actions feed ---------- */
  const acts = () => jget('sehat_actions', []);
  const actsSave = l => jset('sehat_actions', l);
  function addAct(a) {
    const l = acts();
    if (l.some(x => x.id === a.id)) return false;
    a.ts = Date.now(); a.st = 'new'; l.push(a); actsSave(l);
    return true;
  }
  function setSt(id, st) { const l = acts(), a = l.find(x => x.id === id); if (a) { a.st = st; actsSave(l); } return a; }
  const actDoses = a => buildDoses(a.meds.map(m => ({ m, date: a.date }))).filter(tickable);
  /* called by app.js after a NEW record is saved */
  function onSaved(rec) {
    const meds = arr(rec.medicines).filter(m => m && m.name).map(m => ({ name: m.name, strength: m.strength || null, dose: m.dose || null, frequency: m.frequency || null, timing: m.timing || null, duration: m.duration || null, date: rec.date || null }));
    if (meds.length) {
      const today = todayKey(), o = ov();
      const isPrn = m => medSlots(m)[0] === 'prn';
      const ended = m => { const e = endOf(m, o); return !isPrn(m) && !!e && e < today; };
      const live = meds.filter(m => !ended(m));
      const a = { id: 'rx:' + rec.id, type: 'rx', rec: rec.id, date: rec.date || todayKey(), meds: live };
      if (actDoses(a).length) addAct(a);
      else if (live.length < meds.length) {
        const last = meds.filter(ended).map(m => endOf(m, o)).sort().pop();
        addAct({ id: 'rxe:' + rec.id, type: 'rxe', rec: rec.id, date: rec.date || todayKey(), end: last, meds });
      }
      addAct({ id: 'visit:' + rec.id, type: 'visit', rec: rec.id });
    }
    if (rec.follow_up) {  // a follow-up date already past at upload is history, not a missed reminder
      const st = apStore(), d = parseFU(rec.follow_up, rec.date);
      if (d && d < todayKey()) { st.late[rec.id] = 1; jset('sehat_appts', st); }
    }
    scan();
  }
  /* overdue follow-ups and overdue repeat tests */
  function scan() {
    if (!S || !S.records || !S.records.length) return;
    const st = apStore(), today = todayKey();
    S.records.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))).filter(r => r.follow_up && !fuClosed(r.id, st) && !st.late[r.id]).filter(r => { const d = fuDue(r, st); return d && d < today && d >= addDays(today, -30); })
      .slice(0, 1).forEach(r => addAct({ id: 'fu:' + r.id, type: 'fu', rec: r.id, text: r.follow_up, date: r.date }));
    const pv = S.insights && S.insights.data && Array.isArray(S.insights.data.preventive) ? S.insights.data.preventive : [];
    pv.filter(p => p && p.kind === 'repeat_test' && p.overdue && p.title).forEach(p => addAct({ id: 'rp:' + String(p.kind || '') + ':' + String(p.title).toLowerCase(), type: 'rp', title: p.title, why: p.why || '', records: arr(p.records) }));
  }
  function actionsCard(opts) {
    try { scan(); } catch (e) { /* ignore */ }
    const fst = apStore(), today0 = todayKey();
    const fuOpen = a => { const r = (S.records || []).find(x => x.id === a.rec); if (!r || fuClosed(r.id, fst) || fst.late[r.id]) return false; const d = fuDue(r, fst); return !d || (d < today0 && d >= addDays(today0, -30)); };
    let l = acts().filter(a => a.type === 'rx' || a.st !== 'rejected').filter(a => a.type !== 'fu' || fuOpen(a)).sort((a, b) => b.ts - a.ts);
    if (opts && opts.recent) l = l.filter(a => a.st === 'new').slice(0, 3); else l = l.slice(0, 6);
    if (!l.length) return '';
    const btn = (act, id, label, cls) => '<button type="button" class="btn small ' + (cls || 'secondary') + '" data-act="' + act + '" data-id="' + esc(id) + '">' + esc(t(label)) + '</button>';
    return '<div class="card rm-feed" id="rmFeed"><h2>' + esc(t('rm_what')) + '</h2><p class="muted small" style="margin:2px 0 8px">' + esc(t('rm_sub')) + '</p><ul class="list">' + l.map(a => {
      let head = '', body = '', b = '';
      if (a.type === 'rx') {
        const ds = actDoses(a), o = ov();
        head = t('rm_rx', { n: ds.length, date: fmtDate(a.date) });
        body = '<ul class="rm-doses">' + a.meds.map(m => {
          const mine = ds.filter(d => d.m === m || curKey(d.m) === curKey(m)), e = endOf(m, o);
          if (medSlots(m)[0] === 'prn') return '<li>' + esc(medName(m)) + ': ' + esc(t('rm_prn')) + '</li>';
          return '<li>' + esc(medName(m)) + ': ' + esc(mine.map(d => doseTime(d, o)).join(', ') || '-') + ' · ' + esc(e ? t('rm_until', { date: fmtDate(e) }) : t('rm_noend')) + '</li>';
        }).join('') + '</ul>';
        if (a.st === 'new') b = btn('rm_acc', a.id, 'rm_accept', '') + btn('rm_aedit', a.id, 'rm_edit') + btn('rm_rej', a.id, 'rm_reject', 'danger') + '</div><p class="muted small" style="margin:6px 0 0">' + esc(t('rm_rx_note')) + '</p><div>';
        else b = '<span class="small">' + esc(t(a.st === 'accepted' ? 'rm_accepted' : 'rm_rejected')) + '</span> ' + (a.st === 'accepted' ? btn('rm_aedit', a.id, 'rm_edit') : '') + btn('rm_undo', a.id, 'rm_undo', 'link');
      } else if (a.type === 'rxe') {
        head = t('rm_rxe', { date: fmtDate(a.end || a.date) });
        body = '<ul class="rm-doses">' + a.meds.map(m => '<li>' + esc(medName(m)) + (medSlots(m)[0] === 'prn' ? ': ' + esc(t('rm_prn')) : '') + '</li>').join('') + '</ul>';
        b = btn('rm_dis', a.id, 'rm_dismiss', 'secondary') + btn('rm_anyway', a.id, 'rm_anyway', 'link');
      } else if (a.type === 'fu') {
        head = t('rm_fu', { text: a.text, date: fmtDate(a.date) });
        const fr = (S.records || []).find(x => x.id === a.rec), due = fr ? fuDue(fr, fst) : parseFU(a.text, a.date);
        body = (due ? '<p class="muted small" style="margin:2px 0 0">' + esc(t('rm_next', { date: fmtDate(due) })) + '</p>' : '') + linkSel(a.rec, a.date);
        b = (due ? calLink({ id: 'fu:' + a.rec, src: 'r', title: a.text, date: due, rdate: a.date, what: fr ? whatOf(fr) : a.text }) : '') + btn('rm_done', a.rec, 'rm_done') + '<button type="button" class="btn small link" data-act="openrec" data-id="' + esc(a.rec) + '">' + esc(t('rm_open_rec')) + '</button>' + btn('rm_dis', a.id, 'rm_dismiss', 'link');
      } else if (a.type === 'cg') {
        head = a.pid === 'self' ? t('cg_msg_self', { med: a.med, time: fmt12(a.time) }) : t('cg_msg', { name: a.name, med: a.med, time: fmt12(a.time) });
        body = '<p class="muted small" style="margin:2px 0 0">' + esc(t('cg_note')) + '</p>';
        b = a.st === 'followed' ? '<span class="small">' + esc(t('cg_followed')) + '</span> ' + btn('rm_dis', a.id, 'rm_dismiss', 'link') : btn('rm_cg_call', a.id, 'cg_call', '') + btn('rm_dis', a.id, 'rm_dismiss', 'link');
      } else if (a.type === 'rp') {
        head = t('rm_rp', { title: a.title });
        body = a.why ? '<p class="muted small" style="margin:2px 0 0">' + esc(a.why) + '</p>' : '';
        b = btn('rm_dis', a.id, 'rm_dismiss', 'link');
      } else {
        head = t('rm_visit');
        b = '<button type="button" class="btn small secondary" data-act="visit">' + esc(t('rm_open_visit')) + '</button>' + btn('rm_dis', a.id, 'rm_dismiss', 'link');
      }
      return '<li><span class="l"><strong>' + esc(head) + '</strong>' + body + '<div class="rm-btns">' + b + '</div></span></li>';
    }).join('') + '</ul></div>';
  }
  const fmt12 = hm => { const m = String(hm || '').match(/^(\d{1,2}):(\d\d)/); if (!m) return String(hm || ''); const h = +m[1]; return ((h % 12) || 12) + ':' + m[2] + ' ' + (h < 12 ? 'am' : 'pm'); };
  function rxMeds(id) { const a = acts().find(x => x.id === id); return a && a.type === 'rx' ? a : null; }

  /* ---------- editor overlay ---------- */
  let ED = null;
  function closeEd() { const n = document.getElementById('remEd'); if (n) n.remove(); ED = null; }
  function openEd(html, state) {
    closeEd(); ED = state;
    const n = document.createElement('div');
    n.id = 'remEd'; n.className = 'rm-ov'; n.setAttribute('role', 'dialog'); n.setAttribute('aria-modal', 'true');
    n.innerHTML = '<div class="rm-box">' + html + '<div class="row" style="margin-top:14px"><button type="button" class="btn" data-act="rm_save">' + esc(t('rm_save')) + '</button><button type="button" class="btn secondary" data-act="rm_cancel">' + esc(t('rm_cancel')) + '</button></div></div>';
    document.body.appendChild(n);
    const f = n.querySelector('input'); if (f) f.focus();
  }
  function editMeds(items) {
    const o = ov(), seen = {};
    let h = '<h2 style="margin-bottom:10px">' + esc(t('rm_ed_title')) + '</h2>';
    items.forEach(x => {
      const k = curKey(x.m); if (seen[k]) return; seen[k] = 1;
      const ds = buildDoses([x]).filter(tickable);
      h += '<fieldset class="rm-fs"><legend>' + esc(medName(x.m)) + '</legend><label class="rm-f">' + esc(t('rm_end')) + '<input type="date" data-e="' + esc(k) + '" value="' + esc(endOf(x.m, o) || '') + '"></label>' +
        ds.map(d => '<div class="rm-two"><label class="rm-f">' + esc(t('rm_time')) + '<input type="time" data-t="' + esc(d.key) + '" value="' + esc(doseTime(d, o)) + '"></label>' +
          '<label class="rm-f">' + esc(t('rm_dose')) + '<input type="text" data-d="' + esc(d.key) + '" value="' + esc(o.d[d.key] || x.m.dose || '') + '"></label></div>').join('') + '</fieldset>';
    });
    openEd(h, { kind: 'meds', items });
  }
  function editAppt(id) {
    const a = id ? apStore().items.find(x => x.id === id) : null;
    const fld = (l, k, ty, v) => '<label class="rm-f">' + esc(t(l)) + '<input type="' + ty + '" id="rmA_' + k + '" value="' + esc(v || '') + '"></label>';
    openEd('<h2 style="margin-bottom:10px">' + esc(t(a ? 'rm_ap_edit' : 'rm_ap_add')) + '</h2>' + fld('rm_ap_name', 'title', 'text', a && a.title) + '<div class="rm-two">' + fld('rm_ap_date', 'date', 'date', a && a.date) + fld('rm_ap_time', 'time', 'time', a && a.time) + '</div>' + fld('rm_ap_note', 'note', 'text', a && a.note), { kind: 'appt', id: a ? a.id : null });
  }
  function editResched(rec) {
    const r = (S.records || []).find(x => x.id === rec), st = apStore();
    openEd('<h2 style="margin-bottom:10px">' + esc(t('rm_resched')) + '</h2><label class="rm-f">' + esc(t('rm_new_date')) + '<input type="date" id="rmR_date" value="' + esc((r && fuDue(r, st)) || todayKey()) + '"></label>', { kind: 'resched', rec });
  }
  function saveEd() {
    if (!ED) return;
    const q = s => Array.from(document.querySelectorAll('#remEd ' + s));
    if (ED.kind === 'resched') {
      const v = (document.getElementById('rmR_date') || {}).value;
      if (!v) return;
      const st = apStore(); st.resched[ED.rec] = v; jset('sehat_appts', st);
    } else if (ED.kind === 'meds') {
      const o = ov();
      q('[data-t]').forEach(i => { if (i.value) { o.t[i.dataset.t] = i.value; delete o.s[i.dataset.t]; } });  // a new time clears an old snooze
      q('[data-d]').forEach(i => { const v = i.value.trim(), k = i.dataset.d; if (v) o.d[k] = v; else delete o.d[k]; });
      q('[data-e]').forEach(i => { if (i.value) o.e[i.dataset.e] = i.value; else delete o.e[i.dataset.e]; });
      ovSave(o);
    } else {
      const v = k => (document.getElementById('rmA_' + k) || {}).value || '';
      const title = v('title').trim(), date = v('date');
      if (!title || !date) { (document.getElementById(title ? 'rmA_date' : 'rmA_title') || {}).focus(); return; }
      const st = apStore(), it = { id: ED.id || 'a' + Date.now(), title, date, time: v('time') || '', note: v('note').trim() };
      const i = st.items.findIndex(x => x.id === it.id);
      if (i >= 0) st.items[i] = it; else st.items.push(it);
      jset('sehat_appts', st);
    }
    closeEd(); render();
  }

  /* ---------- clicks ---------- */
  document.addEventListener('click', e => {
    const el = e.target.closest ? e.target.closest('[data-act^="rm_"]') : null;
    if (!el) return;
    const a = el.dataset.act, id = el.dataset.id;
    if (a === 'rm_acc' || a === 'rm_rej' || a === 'rm_undo') {
      const x = rxMeds(id); if (!x) return;
      x.meds.forEach(m => curSet(curKey(m), a === 'rm_acc'));
      setSt(id, a === 'rm_acc' ? 'accepted' : (a === 'rm_rej' ? 'rejected' : 'new'));
      render();
    } else if (a === 'rm_aedit') { const x = rxMeds(id); if (x) editMeds(x.meds.map(m => ({ m, date: x.date }))); }
    else if (a === 'rm_dis') { setSt(id, 'rejected'); cgChanged(); render(); }
    else if (a === 'rm_na') { const st = apStore(); st.na[el.dataset.rec || id] = todayKey(); jset('sehat_appts', st); render(); }
    else if (a === 'rm_anyway') {  // run the normal flow: restart each ended course from today
      const x = acts().find(q => q.id === id && q.type === 'rxe'); if (!x) return;
      const o = ov(), today = todayKey();
      x.meds.forEach(m => { if (medSlots(m)[0] !== 'prn' && endOf(m, o) && endOf(m, o) < today) o.e[curKey(m)] = addDays(today, (durDays(m.duration) || 5) - 1); });
      ovSave(o);
      const rx = { id: 'rx:' + x.rec, type: 'rx', rec: x.rec, date: x.date, meds: x.meds };
      if (actDoses(rx).length) { const l = acts().filter(q => q.id !== 'rx:' + x.rec); actsSave(l); addAct(rx); }
      setSt(id, 'rejected'); render();
    }
    else if (a === 'rm_done') { const st = apStore(); st.done[el.dataset.rec || id] = todayKey(); jset('sehat_appts', st); render(); }
    else if (a === 'rm_resched') { if (String(id).indexOf('fu:') === 0) editResched(id.slice(3)); else editAppt(id); }
    else if (a === 'rm_cg_call') { const x = acts().find(q => q.id === id); if (x && x.pid && x.pid !== activeId()) nudge(x.pid, x.med, x.time); setSt(id, 'followed'); cgChanged(); render(); }
    else if (a === 'rm_skip') { applyAction('skip', activeId(), el.dataset.k); }
    else if (a === 'rm_cal_all') calAll();
    else if (a.indexOf('rm_t_') === 0) toastClick(el, a);
    else if (a === 'rm_snooze') { const o = ov(); o.s[el.dataset.k] = Date.now() + Number(el.dataset.n) * 60000; ovSave(o); render(); }
    else if (a === 'rm_edit') { const ds = buildDoses(schedMeds()).filter(d => curKey(d.m) === el.dataset.m); if (ds.length) editMeds([{ m: ds[0].m, date: ds[0].date }]); }
    else if (a === 'rm_stop') { if (confirm(t('rm_stop_confirm', { name: el.dataset.name }))) { const o = ov(); o.x[el.dataset.m] = 1; ovSave(o); render(); } }
    else if (a === 'rm_ap_new') editAppt(null);
    else if (a === 'rm_ap_edit') editAppt(id);
    else if (a === 'rm_ap_del') { if (confirm(t('rm_del_confirm'))) { const st = apStore(); st.items = st.items.filter(x => x.id !== id); jset('sehat_appts', st); render(); } }
    else if (a === 'rm_ics') downloadIcs();
    else if (a === 'rm_save') saveEd();
    else if (a === 'rm_cancel') closeEd();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeEd(); });

  /* ---------- applying a dose action (toast buttons, notification buttons) ---------- */
  function applyAction(act, pid, key, val) {
    pid = pid || activeId();
    const day = todayKey(), o = ov(pid), now = Date.now();
    if (act === 'taken') {
      const mk = KPf(day, pid);
      let tk = TAKEN_MEM[mk];
      if (!tk) { try { tk = JSON.parse(localStorage.getItem('sehat_taken_' + mk) || '{}') || {}; } catch (e) { tk = {}; } TAKEN_MEM[mk] = tk; }
      tk[key] = 1;
      try { localStorage.setItem('sehat_taken_' + mk, JSON.stringify(tk)); } catch (e) { /* ignore */ }
    } else if (act === 'snooze15' || act === 'snooze60') { o.s[key] = now + (act === 'snooze15' ? 15 : 60) * 60000; ovSave(o, pid); }
    else if (act === 'at') {
      const ts = /^\d\d:\d\d$/.test(val || '') ? new Date(day + 'T' + val + ':00').getTime() : 0;
      if (!ts || ts <= now) return false;  // today only, and in the future
      o.s[key] = ts; ovSave(o, pid);
    } else if (act === 'skip') { o.sk[day + key] = 1; ovSave(o, pid); }
    else return false;
    try { careScan(); } catch (e) { /* ignore */ }
    try { render(); } catch (e) { /* ignore */ }
    return true;
  }

  /* ---------- in-app toast with quick buttons ---------- */
  (function () {
    const st = document.createElement('style');
    st.textContent = '.rm-toast{max-height:60vh;overflow:auto}.rm-trow+.rm-trow{margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.35)}.rm-trow .rm-btns{margin-top:6px}.rm-ti{font-size:1rem;max-width:7.5rem}' +
      '.rm-today{border:1px solid var(--line);border-radius:10px;padding:10px 12px;margin:0 0 12px}.rm-today h3{margin:0 0 4px;font-size:1rem}.rm-today p{margin:2px 0}.rm-link{display:block;margin-top:8px}.rm-link select{display:block;width:100%;max-width:100%;box-sizing:border-box;margin-top:3px;font-size:1rem}';
    document.head.appendChild(st);
  })();
  function toastRow(msg, pid, key) {
    let n = document.getElementById('rmToast');
    if (!n) { n = document.createElement('div'); n.id = 'rmToast'; n.className = 'rm-toast'; n.setAttribute('role', 'status'); n.setAttribute('aria-live', 'polite'); document.body.appendChild(n); }
    const row = document.createElement('div');
    row.className = 'rm-trow'; row.dataset.pid = pid; row.dataset.k = key;
    const b = (act, label) => '<button type="button" class="btn small secondary" data-act="' + act + '">' + esc(t(label)) + '</button>';
    row.innerHTML = '<div class="rm-tmsg">' + esc(msg) + '</div><div class="rm-btns">' + b('rm_t_taken', 'rm_taken') + b('rm_t_15', 'rm_in15') + b('rm_t_60', 'rm_in60') +
      '<label class="small">' + esc(t('rm_pick')) + ' <input type="time" class="rm-ti" aria-label="' + esc(t('rm_pick')) + '"></label>' + b('rm_t_at', 'rm_set') + b('rm_t_skip', 'rm_skip') + b('rm_t_close', 'rm_close') + '</div>';
    n.appendChild(row); n.hidden = false;
    setTimeout(() => dropRow(row), 10 * 60000);
  }
  function dropRow(row) {
    const n = document.getElementById('rmToast');
    if (row && row.parentNode) row.remove();
    if (n && !n.querySelector('.rm-trow')) n.hidden = true;
  }
  function toastClick(el, a) {
    const row = el.closest('.rm-trow'); if (!row) return;
    const pid = row.dataset.pid, key = row.dataset.k;
    if (a === 'rm_t_close') return dropRow(row);
    const ok = a === 'rm_t_taken' ? applyAction('taken', pid, key) : a === 'rm_t_15' ? applyAction('snooze15', pid, key) : a === 'rm_t_60' ? applyAction('snooze60', pid, key) :
      a === 'rm_t_skip' ? applyAction('skip', pid, key) : a === 'rm_t_at' ? applyAction('at', pid, key, row.querySelector('.rm-ti').value) : false;
    if (ok) dropRow(row); else if (a === 'rm_t_at') row.querySelector('.rm-ti').focus();
  }

  /* ---------- system notifications with action buttons (service worker) ---------- */
  let SWREG = null, SWTRY = false;
  function ensureSW() {
    if (SWREG || SWTRY || !('serviceWorker' in navigator) || typeof remindOn !== 'function' || !remindOn()) return;
    SWTRY = true;  // only after the user granted notification permission
    navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready).then(r => { SWREG = r; }).catch(() => { /* toast and plain notifications still work */ });
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', e => {
      const d = e.data;
      if (d && d.sehat === 'dose-action') applyAction(d.action === 'taken' ? 'taken' : d.action, d.pid, d.key);
    });
  }
  document.addEventListener('change', e => {
    const el = e.target;
    if (el && el.dataset && el.dataset.remind) setTimeout(ensureSW, 1500);
    if (el && el.dataset && el.dataset.rmlink && el.value) { const st = apStore(); st.links[el.dataset.rmlink] = el.value; jset('sehat_appts', st); render(); }
    if (el && el.dataset && el.dataset.dose) setTimeout(refreshToday, 60);
  });
  function notify(msg, pid, key) {
    if (typeof remindOn !== 'function' || !remindOn()) return;
    const title = t('mt_notif_title');
    try {
      if (SWREG && SWREG.showNotification) {
        SWREG.showNotification(title, { body: msg, tag: pid + '|' + key, data: { pid, key }, actions: [{ action: 'taken', title: t('rm_taken') }, { action: 'snooze15', title: t('rm_in15') }, { action: 'snooze60', title: t('rm_in60') }] });
      } else new Notification(title, { body: msg, tag: pid + '|' + key });
    } catch (x) { /* ignore */ }
  }
  (function () {  // opened by a notification button while the app was closed
    try {
      const q = new URLSearchParams(location.search), act = q.get('rm_act');
      if (!act) return;
      applyAction(act === 'taken' ? 'taken' : act, q.get('rm_p') || 'self', q.get('rm_k') || '');
      history.replaceState(null, '', location.pathname);
    } catch (e) { /* ignore */ }
  })();

  /* ---------- the one scheduler: doses with their edited time, snooze, taken tick and course end ---------- */
  const baseDue = (d, o, day) => new Date((day || todayKey()) + 'T' + doseTime(d, o) + ':00').getTime();
  const effDue = (d, o) => { const b = baseDue(d, o), sn = o.s[d.key]; return sn && sn > b ? sn : b; };
  function tick() {
    ensureSW();
    try { careScan(); } catch (e) { /* ignore */ }
    refreshToday();
    if (!S || !S.records || !S.records.length) return;
    const o = ov(), now = Date.now(), day = todayKey(), tk = takenGet(), pid = activeId();
    let f = jget('sehat_fired', {}), dirty = false;
    if (f.day !== day) f = { day, k: {} };
    buildDoses(schedMeds()).filter(tickable).forEach(d => {  // schedMeds already drops stopped and ended courses
      if (tk[d.key] || o.sk[day + d.key]) return;
      const due = effDue(d, o);
      if (now < due || now - due > 10 * 60000) return;
      const fk = profKey(day + '|' + d.key + '|' + due);  // includes the profile: one profile's dose never hides another's
      if (f.k[fk]) return;
      f.k[fk] = 1; dirty = true;
      const msg = t('rm_due', { name: medName(d.m), time: doseTime(d, o) });
      toastRow(msg, pid, d.key);
      notify(msg, pid, d.key);
    });
    if (dirty) jset('sehat_fired', f);
  }
  setInterval(tick, 20000);

  /* ---------- caregiver alerts: what family members marked (or did not mark) on this device ---------- */
  let CGLAST = -1;
  const cleanMed = m => medName(m).replace(/^(tab|tablet|cap|capsule|syp|syrup|inj)\.?\s+/i, '');
  function careDoses(p) {
    const recs = p.id === activeId() ? (S.records || []) : (typeof FAM !== 'undefined' ? FAM.others : []).filter(r => r.profile === p.id);
    const cur = jgetP('sehat_current', {}, p.id), o = ov(p.id), seen = {}, meds = [], today = todayKey();
    recs.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))).forEach(r => arr(r.medicines).forEach(m => {
      if (!m || !m.name) return;
      const k = curKey(m);
      if (seen[k]) return;
      seen[k] = 1;
      const mm = Object.assign({}, m, { date: r.date });
      const e = endOf(mm, o);
      if (cur[k] && !o.x[k] && !(e && e < today)) meds.push({ m: mm, date: r.date });
    }));
    return { doses: buildDoses(meds).filter(tickable), o };
  }
  function takenP(pid) {
    const mk = KPf(todayKey(), pid);
    if (TAKEN_MEM[mk]) return TAKEN_MEM[mk];
    try { return JSON.parse(localStorage.getItem('sehat_taken_' + mk) || '{}') || {}; } catch (e) { return {}; }
  }
  /* caregiver alerts about one member (pid), or all of them */
  function caregiverCount(pid) { return jgetP('sehat_actions', [], 'self').filter(a => a && a.type === 'cg' && a.st === 'new' && (!pid || a.pid === pid)).length; }
  function cgChanged(force) {
    const n = caregiverCount();
    if (n === CGLAST && !force) return;
    CGLAST = n;
    try { window.dispatchEvent(new CustomEvent('sehat:caregiver', { detail: { count: n } })); } catch (e) { /* ignore */ }
  }
  function careScan() {
    if (!window.SehatFamily) return;
    const now = Date.now(), day = todayKey();
    let l = null, add = false;
    SehatFamily.list().forEach(p => {  // the account holder's own doses too, so every profile behaves the same
      const c = careDoses(p), tk = takenP(p.id);
      c.doses.forEach(d => {
        if (tk[d.key]) return;
        const tm = doseTime(d, c.o), due = effDue(d, c.o), missed = !!c.o.sk[day + d.key];
        if (!missed && now < due + 2 * 3600000) return;  // not marked taken within 2 hours of its time
        const id = 'cg:' + p.id + ':' + day + ':' + d.key;
        if (!l) l = jgetP('sehat_actions', [], 'self');
        if (l.some(x => x.id === id)) return;
        l.push({ id, type: 'cg', pid: p.id, name: p.name, med: cleanMed(d.m), time: tm, ts: now, st: 'new' });
        add = true;
      });
    });
    if (add) jsetP('sehat_actions', l, 'self');
    cgChanged();
  }
  document.addEventListener('sehat:profile', () => { try { careScan(); } catch (e) { /* ignore */ } cgChanged(true); });

  /* ---------- Today summary at the top of the medicine schedule ---------- */
  function fmtIn(ms) {
    const m = Math.max(0, Math.round(ms / 60000));
    if (m < 1) return t('td_now');
    const h = Math.floor(m / 60), mm = m % 60;
    return h ? (mm ? t('td_hm', { h, m: mm }) : t('td_h', { h })) : t('td_m', { m: mm });
  }
  function todayInner() {
    const o = ov(), tk = takenGet(), day = todayKey(), now = Date.now();
    const ds = buildDoses(schedMeds()).filter(tickable);
    if (!ds.length) return '';
    const open = ds.filter(d => !tk[d.key] && !o.sk[day + d.key]).map(d => ({ d, due: effDue(d, o) })).sort((a, b) => a.due - b.due);
    const next = open.find(x => x.due >= now), late = open.find(x => x.due < now);
    const line = next ? t('td_next', { med: medName(next.d.m), time: fmt12(hhmm(next.due)), when: fmtIn(next.due - now) }) :
      late ? t('td_over', { med: medName(late.d.m), time: fmt12(hhmm(late.due)) }) : t('td_alldone');
    return '<h3>' + esc(t('td_title')) + '</h3><p><strong>' + esc(line) + '</strong></p><p class="small">' + esc(t('mt_count', { x: ds.filter(d => tk[d.key]).length, y: ds.length })) + '</p>' +
      '<div class="rm-btns"><button type="button" class="btn small" data-act="rm_cal_all">' + esc(t('td_all_cal')) + '</button><button type="button" class="btn small secondary" data-act="rm_ics">' + esc(t('rm_ics')) + '</button></div>' +
      (function () { const evs = medEvents(); return evs.length > 1 ? '<p class="muted small" style="margin:10px 0 4px">' + esc(t('td_each')) + '</p><div class="rm-btns">' + evs.map(e => '<a class="btn small secondary" target="_blank" rel="noopener" href="' + esc(gcal(e)) + '">' + esc(t('td_one', { med: e.title })) + '</a>').join('') + '</div>' : ''; })() +
      '<div id="rmCalLinks"></div>';
  }
  function todayCard() { const h = todayInner(); return h ? '<div class="rm-today" id="rmToday">' + h + '</div>' : ''; }
  function refreshToday() {
    const n = document.getElementById('rmToday');
    if (!n) return;
    const links = document.getElementById('rmCalLinks'), keep = links ? links.innerHTML : '', h = todayInner();
    if (!h) { n.remove(); return; }
    n.innerHTML = h;
    if (keep) document.getElementById('rmCalLinks').innerHTML = keep;
  }
  function injectToday() {
    document.querySelectorAll('.card.medday').forEach(c => {
      if (c.querySelector('.rm-today')) return;
      const h = todayCard(), h2 = c.querySelector('h2');
      if (!h || !h2) return;
      h2.insertAdjacentHTML('afterend', h);
    });
  }
  function calAll() {
    const evs = medEvents();
    evs.forEach(e => { try { window.open(gcal(e), '_blank', 'noopener'); } catch (x) { /* popup blocked */ } });
    const box = document.getElementById('rmCalLinks');
    if (box) box.innerHTML = '<p class="muted small">' + esc(t('td_links')) + '</p><div class="rm-btns">' + evs.map(e => '<a class="btn small secondary" target="_blank" rel="noopener" href="' + esc(gcal(e)) + '">' + esc(t('td_one', { med: e.title })) + '</a>').join('') + '</div>';
  }
  /* Family nudges: a caregiver taps Remind; the member sees it the next time their profile opens.
     Stored as sehat_nudges (synced with the account, so another device of the family sees it too). */
  const NK = 'sehat_nudges';
  const nudges = () => { try { return JSON.parse(localStorage.getItem(NK) || '[]') || []; } catch (e) { return []; } };
  const nudgesSave = l => { try { localStorage.setItem(NK, JSON.stringify(l.slice(-50))); } catch (e) { /* storage blocked */ } };
  const profName = id => { const p = window.SehatFamily && SehatFamily.list().find(x => x.id === id); return p ? String(p.name || '').trim() : ''; };
  function nudge(to, med, time) {
    const from = profName(activeId()) || t('assistant');
    nudgesSave(nudges().filter(n => !(n.to === to && !n.seen)).concat([{ id: 'n' + Date.now().toString(36), to, from, med: med || '', time: time || '', at: Date.now(), seen: false }]));
    return from;
  }
  function nextDoseFor() {
    try {
      const o = ov(), tk = takenGet(), now = Date.now(), day = todayKey();
      const open = buildDoses(schedMeds()).filter(tickable).filter(d => !tk[d.key] && !o.sk[day + d.key]).map(d => ({ d, due: effDue(d, o) })).sort((a, b) => a.due - b.due);
      const n = open.find(x => x.due >= now) || open[0];
      return n ? { med: medName(n.d.m), time: fmt12(hhmm(n.due)) } : null;
    } catch (e) { return null; }
  }
  function injectNudge() {
    const me = activeId(), main = document.querySelector('.main #view') || document.querySelector('.main');
    const n = nudges().filter(x => x.to === me && !x.seen).pop();
    const old = document.getElementById('nudgeBar'); if (old) old.remove();
    if (!n || !main) return;
    const nx = nextDoseFor() || (n.med ? { med: n.med, time: n.time ? fmt12(n.time) : '' } : null);
    main.insertAdjacentHTML('afterbegin', '<div class="card nudge-bar" id="nudgeBar" role="status"><div><strong>' + esc(t('nudge_from', { from: n.from })) + '</strong>' +
      (nx ? '<p class="muted" style="margin:4px 0 0">' + esc(t('nudge_med', { med: nx.med, time: nx.time })) + '</p>' : '') + '</div><div class="rm-btns">' +
      '<button type="button" class="btn small" data-act="rm_nudge_open" data-n="' + esc(n.id) + '">' + esc(t('nudge_open')) + '</button>' +
      '<button type="button" class="btn small secondary" data-act="rm_nudge_ok" data-n="' + esc(n.id) + '">' + esc(t('nudge_ok')) + '</button></div></div>');
  }
  document.addEventListener('click', e => {
    const el = e.target && e.target.closest && e.target.closest('[data-act^="rm_nudge"]');
    if (!el) return;
    const a = el.dataset.act;
    if (a === 'rm_nudge') {
      nudge(el.dataset.pid, '', '');
      el.textContent = t('nudge_sent', { name: profName(el.dataset.pid) }); el.disabled = true;
      return;
    }
    nudgesSave(nudges().map(n => n.id === el.dataset.n ? Object.assign(n, { seen: true }) : n));
    if (a === 'rm_nudge_open') { S.view = 'meds'; render(); } else injectNudge();
  });

  function hookRender() {
    if (typeof render !== 'function') return;
    const prev = render;
    render = function () { prev.apply(this, arguments); try { injectToday(); } catch (e) { /* ignore */ } try { injectNudge(); } catch (e) { /* ignore */ } };
    try { injectToday(); cgChanged(true); injectNudge(); } catch (e) { /* ignore */ }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hookRender); else hookRender();

  window.SehatRem = { addAppt, actionsCard, apptCard, visitsCard, todayCard, doseCtl, hide, onSaved, icsText, gcal, allEvents, parseFU, tick, caregiverCount, careScan, applyAction, medEvents };
})();
