/* Daily health journal, pre-visit summary and the risk / next-step / habit cards.
   Loaded after app.js. Entries stay on this device (per family profile). */
(function () {
  'use strict';
  const pk = k => (typeof profKey === 'function' ? profKey(k) : k);
  const JKEY = 'sehat_journal';
  const SYMS = ['headache', 'dizziness', 'tiredness', 'nausea', 'pain', 'cough', 'fever', 'breathlessness'];
  const MOODS = ['😣', '😕', '😐', '🙂', '😄'];
  const AREA_ICON = { diet: '🥗', activity: '🚶', sleep: '😴', habits: '🌿' };

  Object.assign(STR.en, {
    jr_title: 'How are you today?', jr_sub: 'A quick note on how you feel. It stays on this device and helps you remember things for your doctor.',
    jr_kick: 'Daily journal', jr_date: 'Date', jr_mood: 'Mood', jr_symptoms: 'Symptoms today', jr_other: 'Something else', jr_add: 'Add',
    jr_pain: 'Pain', jr_sleep: 'Sleep', jr_energy: 'Energy', jr_sleep_h: '1 poor, 5 good', jr_energy_h: '1 low, 5 high',
    jr_meds: 'Did you take your medicines today?', jr_yes: 'Yes', jr_no: 'No', jr_unsure: 'Not sure',
    jr_side: 'Anything you noticed after medicines (side effects)?', jr_side_ph: 'e.g. felt sleepy after the evening tablet',
    jr_note: 'Note', jr_save: 'Save today', jr_save_d: 'Save entry', jr_saved: 'Saved.', jr_replace: 'You already have an entry for this date. Saving will replace it.',
    jr_hist: 'Recent entries', jr_more: 'Show all ({n})', jr_hist_none: 'No entries in the last 14 days.', jr_edit: 'Edit', jr_del: 'Delete', jr_new: 'New entry',
    jr_sym_ph: 'Type a symptom', jr_pain_n: 'Pain {n}/10',
    sym_headache: 'Headache', sym_dizziness: 'Dizziness', sym_tiredness: 'Tiredness', sym_nausea: 'Nausea', sym_pain: 'Pain', sym_cough: 'Cough', sym_fever: 'Fever', sym_breathlessness: 'Breathlessness',
    pv_title: 'Before your next visit', pv_sub: 'Summary of what you noted in your journal, to talk through with your doctor.',
    pv_since: 'Since', pv_last_rec: 'Since last record', pv_30: 'Last 30 days', pv_make: 'Prepare summary', pv_working: 'Preparing...',
    pv_none: 'No journal entries in this period yet. Add a few days in the journal above.', pv_fail: 'Could not prepare the summary right now. Please try again.',
    pv_period: 'Period', pv_entries: '{n} entries', pv_symptoms: 'Main symptoms you noted', pv_times: '{n} days', pv_improving: 'You noted these getting better', pv_worsening: 'You noted these getting worse',
    pv_missed: 'Days you missed medicines', pv_missed_n: '{n} days marked "No"', pv_adh: 'Taken {a}, missed {b}, not sure {c}', pv_side: 'Possible side effects you noted', pv_concerns: 'Things worth raising',
    pv_questions: 'Questions you could ask your doctor', pv_days: 'Days covered', pv_caveat: 'Patient-reported, from your own notes. It does not show what caused anything. Please discuss it with your doctor.',
    pv_visit: 'Journal since your last record', pv_open: 'Open this day',
    pr_title: 'Staying out of range', pr_since: 'Out of range in the last {n} reports, since {d}', pr_disc: 'Worth discussing with your doctor.',
    nx_title: 'Next steps', nx_due: 'Due by {d}', nx_over: 'Overdue since {d}', nx_repeat_test: 'Repeat test', nx_screening: 'Screening', nx_follow_up: 'Follow-up',
    wl_title: 'For you: everyday habits', wl_why: 'Why: {w}', wl_foot: 'General wellness guidance, not medical advice.',
    wl_diet: 'Food and drink', wl_activity: 'Activity', wl_sleep: 'Sleep', wl_habits: 'Habits'
  });
  Object.assign(STR.hi, {
    jr_title: 'आज आप कैसे हैं?', jr_sub: 'अपनी सेहत पर एक छोटा नोट। यह इसी डिवाइस पर रहता है और डॉक्टर को बताने की बातें याद रखने में मदद करता है।',
    jr_kick: 'रोज़ की डायरी', jr_date: 'तारीख़', jr_mood: 'मूड', jr_symptoms: 'आज के लक्षण', jr_other: 'कुछ और', jr_add: 'जोड़ें',
    jr_pain: 'दर्द', jr_sleep: 'नींद', jr_energy: 'ऊर्जा', jr_sleep_h: '1 खराब, 5 अच्छी', jr_energy_h: '1 कम, 5 ज़्यादा',
    jr_meds: 'क्या आज आपने दवाइयाँ ली?', jr_yes: 'हाँ', jr_no: 'नहीं', jr_unsure: 'पक्का नहीं',
    jr_side: 'दवा के बाद कुछ महसूस हुआ (दुष्प्रभाव)?', jr_side_ph: 'जैसे शाम की गोली के बाद नींद आई',
    jr_note: 'नोट', jr_save: 'आज का सेव करें', jr_save_d: 'एंट्री सेव करें', jr_saved: 'सेव हो गया।', jr_replace: 'इस तारीख़ की एंट्री पहले से है। सेव करने पर वह बदल जाएगी।',
    jr_hist: 'हाल की एंट्री', jr_more: 'सभी देखें ({n})', jr_hist_none: 'पिछले 14 दिनों में कोई एंट्री नहीं।', jr_edit: 'बदलें', jr_del: 'हटाएँ', jr_new: 'नई एंट्री',
    jr_sym_ph: 'लक्षण लिखें', jr_pain_n: 'दर्द {n}/10',
    sym_headache: 'सिरदर्द', sym_dizziness: 'चक्कर', sym_tiredness: 'थकान', sym_nausea: 'मतली', sym_pain: 'दर्द', sym_cough: 'खाँसी', sym_fever: 'बुखार', sym_breathlessness: 'साँस फूलना',
    pv_title: 'अगली मुलाक़ात से पहले', pv_sub: 'आपकी डायरी के नोट का सार, डॉक्टर से बात करने के लिए।',
    pv_since: 'से', pv_last_rec: 'पिछले रिकॉर्ड से', pv_30: 'पिछले 30 दिन', pv_make: 'सार तैयार करें', pv_working: 'तैयार हो रहा है...',
    pv_none: 'इस अवधि में अभी कोई एंट्री नहीं। ऊपर डायरी में कुछ दिन जोड़ें।', pv_fail: 'अभी सार तैयार नहीं हो सका। कृपया फिर कोशिश करें।',
    pv_period: 'अवधि', pv_entries: '{n} एंट्री', pv_symptoms: 'आपके बताए मुख्य लक्षण', pv_times: '{n} दिन', pv_improving: 'आपके अनुसार ये बेहतर हुए', pv_worsening: 'आपके अनुसार ये बिगड़े',
    pv_missed: 'दवा छूटने के दिन', pv_missed_n: '{n} दिन "नहीं" लिखा', pv_adh: 'ली {a}, छूटी {b}, पक्का नहीं {c}', pv_side: 'आपके बताए संभावित दुष्प्रभाव', pv_concerns: 'बताने लायक बातें',
    pv_questions: 'डॉक्टर से पूछने के सवाल', pv_days: 'शामिल दिन', pv_caveat: 'यह आपके अपने नोट पर आधारित है। इससे किसी बात का कारण नहीं पता चलता। कृपया डॉक्टर से चर्चा करें।',
    pv_visit: 'पिछले रिकॉर्ड के बाद की डायरी', pv_open: 'यह दिन खोलें',
    pr_title: 'सीमा से बाहर बने रहना', pr_since: 'पिछली {n} रिपोर्ट में सीमा से बाहर, {d} से', pr_disc: 'डॉक्टर से चर्चा करने लायक।',
    nx_title: 'अगले कदम', nx_due: '{d} तक', nx_over: '{d} से देर', nx_repeat_test: 'जाँच दोहराएँ', nx_screening: 'स्क्रीनिंग', nx_follow_up: 'फ़ॉलो-अप',
    wl_title: 'आपके लिए: रोज़ की आदतें', wl_why: 'क्यों: {w}', wl_foot: 'सामान्य सेहत सुझाव, चिकित्सा सलाह नहीं।',
    wl_diet: 'खान-पान', wl_activity: 'गतिविधि', wl_sleep: 'नींद', wl_habits: 'आदतें'
  });

  /* ---------- storage ---------- */
  function load() {
    try { const a = JSON.parse(localStorage.getItem(pk(JKEY)) || '[]'); return Array.isArray(a) ? a.filter(e => e && /^\d{4}-\d{2}-\d{2}$/.test(e.date)).map(e => Object.assign(blank(e.date), e, { symptoms: arr(e.symptoms) })) : []; } catch (e) { return []; }
  }
  function save(a) { try { localStorage.setItem(pk(JKEY), JSON.stringify(a)); } catch (e) { /* ignore */ } }
  window.SehatJournal = { load: () => load() };
  const byDate = a => a.slice().sort((x, y) => (x.date < y.date ? 1 : -1));
  function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); }
  function blank(date) { return { date: date || todayKey(), mood: null, symptoms: [], pain: 0, sleep: null, energy: null, meds_taken: null, side_effects: '', note: '' }; }

  const J = { form: null, since: null, sum: null, saved: false };
  function form() { if (!J.form) { J.form = Object.assign(blank(), load().find(e => e.date === todayKey()) || {}); } return J.form; }
  function symLabel(s) { return SYMS.indexOf(s) >= 0 ? t('sym_' + s) : s; }
  const rerender = () => { if (typeof render === 'function') render(); };

  /* ---------- demo seed ---------- */
  window.journalSeedDemo = function () {
    if (load().length) return;
    const out = [], missed = [22, 15, 9];
    for (let n = 30; n >= 0; n--) {
      if (n % 7 === 4) continue; // a few days without a note
      const early = n > 20, mid = n > 10 && n <= 20;
      const syms = [];
      if (early) { syms.push('dizziness'); if (n % 2 === 0) syms.push('tiredness'); }
      else if (mid) { if (n % 3 === 0) syms.push('tiredness'); if (n === 14) syms.push('headache'); }
      else if (n === 3) syms.push('tiredness');
      const e = blank(daysAgo(n));
      e.symptoms = syms;
      e.mood = early ? 2 + (n % 2) : (mid ? 3 : 4);
      e.sleep = early ? 2 + (n % 2) : (mid ? 3 : 4);
      e.energy = early ? 2 : (mid ? 3 : 4);
      e.pain = syms.indexOf('headache') >= 0 ? 4 : 0;
      e.meds_taken = missed.indexOf(n) >= 0 ? 'no' : (n === 12 ? 'unsure' : 'yes');
      if (n === 26 || n === 25) e.side_effects = 'felt a bit sleepy after the morning tablet';
      if (n === 22) e.note = 'Forgot the tablets while travelling.';
      if (n === 1) e.note = 'Feeling much better this week.';
      out.push(e);
    }
    save(out);
  };

  /* ---------- journal card ---------- */
  function scale(name, cur, n) {
    let h = '<div class="chips" role="group" aria-label="' + esc(t('jr_' + name)) + '">';
    for (let i = 1; i <= n; i++) h += '<button type="button" class="chip jr-n" data-act="jr_set" data-k="' + name + '" data-v="' + i + '" aria-pressed="' + (cur === i) + '">' + i + '</button>';
    return h + '</div>';
  }
  function journalCard() {
    const f = form(), existing = load().some(e => e.date === f.date);
    const moods = '<div class="chips jr-moods" role="group" aria-label="' + esc(t('jr_mood')) + '">' + MOODS.map((m, i) => '<button type="button" class="chip jr-mood" data-act="jr_set" data-k="mood" data-v="' + (i + 1) + '" aria-pressed="' + (f.mood === i + 1) + '" aria-label="' + (i + 1) + '/5">' + m + '</button>').join('') + '</div>';
    const syms = SYMS.concat(f.symptoms.filter(s => SYMS.indexOf(s) < 0));
    const symChips = '<div class="chips">' + syms.map(s => '<button type="button" class="chip" data-act="jr_sym" data-v="' + esc(s) + '" aria-pressed="' + (f.symptoms.indexOf(s) >= 0) + '">' + esc(symLabel(s)) + '</button>').join('') + '</div>' +
      '<div class="row" style="margin-top:8px;flex-wrap:nowrap"><input type="text" id="jrSymTxt" maxlength="40" autocomplete="off" placeholder="' + esc(t('jr_sym_ph')) + '" aria-label="' + esc(t('jr_other')) + '" style="flex:1;min-width:0"><button type="button" class="btn small secondary" data-act="jr_symadd">' + esc(t('jr_add')) + '</button></div>';
    const yn = [['yes', 'jr_yes'], ['no', 'jr_no'], ['unsure', 'jr_unsure']].map(x => '<button type="button" class="chip" data-act="jr_set" data-k="meds_taken" data-v="' + x[0] + '" aria-pressed="' + (f.meds_taken === x[0]) + '">' + esc(t(x[1])) + '</button>').join('');
    const fld = (label, inner) => '<div class="fld jr-f"><span>' + esc(label) + '</span>' + inner + '</div>';
    return '<div class="card" id="jrCard"><div class="row between"><h2>' + esc(t('jr_title')) + '</h2>' + (f.date !== todayKey() ? '<button type="button" class="btn small secondary" data-act="jr_new">' + esc(t('jr_new')) + '</button>' : '') + '</div>' +
      '<p class="muted small" style="margin:4px 0 12px">' + esc(t('jr_sub')) + '</p><div class="jr-form">' +
      fld(t('jr_date'), '<input type="date" id="jrDate" max="' + esc(todayKey()) + '" value="' + esc(f.date) + '">') +
      fld(t('jr_mood'), moods) + fld(t('jr_symptoms'), symChips) +
      fld(t('jr_pain') + ': ' + f.pain + '/10', '<input type="range" id="jrPain" min="0" max="10" step="1" value="' + f.pain + '" aria-label="' + esc(t('jr_pain')) + '">') +
      fld(t('jr_sleep') + ' (' + t('jr_sleep_h') + ')', scale('sleep', f.sleep, 5)) + fld(t('jr_energy') + ' (' + t('jr_energy_h') + ')', scale('energy', f.energy, 5)) +
      fld(t('jr_meds'), '<div class="chips">' + yn + '</div>') +
      fld(t('jr_side'), '<input type="text" id="jrSide" maxlength="160" autocomplete="off" placeholder="' + esc(t('jr_side_ph')) + '" value="' + esc(f.side_effects) + '">') +
      fld(t('jr_note'), '<textarea id="jrNote" rows="2" maxlength="400">' + esc(f.note) + '</textarea>') + '</div>' +
      (existing ? '<p class="muted small" style="margin:8px 0 0">' + esc(t('jr_replace')) + '</p>' : '') +
      '<div class="row" style="margin-top:10px"><button type="button" class="btn" data-act="jr_save">' + esc(f.date === todayKey() ? t('jr_save') : t('jr_save_d')) + '</button>' + (J.saved ? '<span class="tag green" role="status">' + esc(t('jr_saved')) + '</span>' : '') + '</div>' +
      histHTML() + '</div>';
  }
  function histHTML() {
    const lo = daysAgo(13), list = byDate(load()).filter(e => e.date >= lo);
    const row = e => {
      const bits = [e.symptoms.length ? e.symptoms.map(symLabel).join(', ') : '', e.pain ? t('jr_pain_n', { n: e.pain }) : ''].filter(Boolean).join(' · ');
      return '<li><button type="button" class="jr-row" data-act="jr_open" data-date="' + esc(e.date) + '"><span class="jr-em">' + (e.mood ? MOODS[e.mood - 1] : '·') + '</span><span class="l"><strong>' + esc(fmtDate(e.date)) + '</strong>' + (bits ? '<br><span class="muted small">' + esc(bits) + '</span>' : '') + '</span></button>' +
        '<span class="r"><button type="button" class="btn small danger" data-act="jr_del" data-date="' + esc(e.date) + '">' + esc(t('jr_del')) + '</button></span></li>';
    };
    if (!list.length) return '<h3 style="margin:16px 0 6px">' + esc(t('jr_hist')) + '</h3><p class="muted small">' + esc(t('jr_hist_none')) + '</p>';
    return '<h3 style="margin:16px 0 6px">' + esc(t('jr_hist')) + '</h3><ul class="list jr-hist">' + list.slice(0, 5).map(row).join('') + '</ul>' +
      (list.length > 5 ? '<details class="more"><summary>' + esc(t('jr_more', { n: list.length })) + '</summary><ul class="list jr-hist">' + list.slice(5).map(row).join('') + '</ul></details>' : '');
  }

  /* ---------- pre-visit summary ---------- */
  function lastRecordDate() {
    const ds = (S.records || []).map(r => r.date && String(r.date).slice(0, 10)).filter(Boolean).sort();
    return ds.length ? ds[ds.length - 1] : null;
  }
  function since() { if (!J.since) J.since = daysAgo(30); return J.since; }
  function dBtn(d) { return '<button type="button" class="chip jr-date" data-act="jr_open" data-date="' + esc(d) + '" title="' + esc(t('pv_open')) + '">' + esc(fmtDate(d, { day: 'numeric', month: 'short' })) + '</button>'; }
  const dBtns = ds => ds.length ? '<div class="chips" style="margin-top:6px">' + ds.map(dBtn).join('') + '</div>' : '';
  async function runSummary() {
    const s = since(), entries = load().filter(e => e.date >= s).sort((a, b) => (a.date < b.date ? -1 : 1));
    if (!entries.length) { J.sum = { state: 'empty', s }; return rerender(); }
    J.sum = { state: 'loading', s }; rerender();
    try {
      const r = await api('/api/journal_summary', { entries: entries.map(e => ({ date: e.date, mood: e.mood, symptoms: e.symptoms, pain: e.pain, sleep: e.sleep, energy: e.energy, meds_taken: e.meds_taken === 'yes' ? true : (e.meds_taken === 'no' ? false : null), side_effects: e.side_effects, note: e.note })), since: s, lang });
      J.sum = { state: 'ok', s, data: r };
    } catch (e) { J.sum = { state: 'fail', s, msg: e && e.message }; }
    const ae = document.activeElement;
    if (!(ae && ae.closest && ae.closest('#jrCard'))) rerender();
  }
  function summaryBody() {
    const S2 = J.sum, row = (h, b) => '<div class="jr-sec"><h3>' + esc(h) + '</h3>' + b + '</div>';
    if (!S2) return '';
    if (S2.state === 'loading') return '<div class="skeleton" style="width:70%"></div><div class="skeleton" style="width:50%"></div>';
    if (S2.state === 'empty') return '<p class="muted">' + esc(t('pv_none')) + '</p>';
    if (S2.state === 'fail') return '<p class="vit-err" role="alert">' + esc(t('pv_fail')) + '</p>';
    const d = S2.data || {}, a = arr, ent = load();
    const list = xs => '<ul class="qlist">' + xs.map(x => '<li>' + esc(typeof x === 'string' ? x : (x && (x.text || x.name)) || '') + '</li>').join('') + '</ul>';
    const p = d.period || {};
    let h = '<p><strong>' + esc(t('pv_period')) + ':</strong> ' + esc(fmtDate(p.from || S2.s)) + ' - ' + esc(fmtDate(p.to || todayKey())) + ' · ' + esc(t('pv_entries', { n: d.entries == null ? a(d.entry_dates).length : d.entries })) + '</p>';
    if (a(d.symptoms).length) h += row(t('pv_symptoms'), '<ul class="qlist">' + a(d.symptoms).map(s => '<li><strong>' + esc(symLabel(String(s.name || '').toLowerCase())) + '</strong> · ' + esc(t('pv_times', { n: s.count })) +
      '<div class="chips" style="margin-top:4px">' + [s.first, s.last].filter((x, i, ar) => x && ar.indexOf(x) === i).map(dBtn).join('') + '</div></li>').join('') + '</ul>');
    if (a(d.improving).length) h += row(t('pv_improving'), list(d.improving));
    if (a(d.worsening).length) h += row(t('pv_worsening'), list(d.worsening));
    const ad = d.adherence || {}, missedDates = Array.isArray(d.missed_days) ? d.missed_days.slice().sort() : ent.filter(e => e.date >= S2.s && e.meds_taken === 'no').map(e => e.date).sort();
    if (missedDates.length) h += row(t('pv_missed'), '<p style="margin:0">' + esc(t('pv_missed_n', { n: missedDates.length })) + '</p>' + (ad.taken != null ? '<p class="muted small" style="margin:2px 0 0">' + esc(t('pv_adh', { a: ad.taken || 0, b: ad.missed || 0, c: ad.unknown || 0 })) + '</p>' : '') + dBtns(missedDates));
    if (a(d.side_effects).length) h += row(t('pv_side'), '<ul class="qlist">' + a(d.side_effects).map(s => {
      const txt = typeof s === 'string' ? s : s.text, ds = ent.filter(e => e.date >= S2.s && e.side_effects && txt && String(e.side_effects).toLowerCase().indexOf(String(txt).toLowerCase().slice(0, 20)) >= 0).map(e => e.date).sort();
      return '<li>' + esc(txt) + (s.count > 1 ? ' <span class="muted small">× ' + esc(s.count) + '</span>' : '') + dBtns(ds) + '</li>';
    }).join('') + '</ul>');
    if (a(d.concerns).length) h += row(t('pv_concerns'), list(d.concerns));
    if (a(d.questions).length) h += row(t('pv_questions'), list(d.questions));
    if (a(d.entry_dates).length) h += row(t('pv_days'), dBtns(a(d.entry_dates).slice().sort()));
    return h + '<p class="muted small" style="margin:10px 0 0">' + esc(t('pv_caveat')) + '</p>';
  }
  function sinceBar() {
    const lr = lastRecordDate();
    return '<div class="row noprint jr-since"><label class="fld" style="flex:0 0 auto"><span>' + esc(t('pv_since')) + '</span><input type="date" id="jrSince" max="' + esc(todayKey()) + '" value="' + esc(since()) + '"></label>' +
      '<button type="button" class="btn small secondary" data-act="jr_since30">' + esc(t('pv_30')) + '</button>' +
      (lr ? '<button type="button" class="btn small secondary" data-act="jr_sincerec" data-date="' + esc(lr) + '">' + esc(t('pv_last_rec')) + '</button>' : '') +
      '<button type="button" class="btn small" data-act="jr_sum"' + (J.sum && J.sum.state === 'loading' ? ' disabled' : '') + '>' + esc(J.sum && J.sum.state === 'loading' ? t('pv_working') : t('pv_make')) + '</button></div>';
  }
  function previsitCard() {
    return '<div class="card" id="pvCard"><h2>' + esc(t('pv_title')) + '</h2><p class="muted small" style="margin:4px 0 10px">' + esc(t('pv_sub')) + '</p>' + sinceBar() + '<div style="margin-top:12px">' + summaryBody() + '</div></div>';
  }
  window.journalVisitHTML = function () {
    if (!load().length) return '';
    if (!J.sum) setTimeout(() => { if (!J.sum && S.view === 'visit') runSummary(); }, 0);
    return '<section class="visit-sec"><h2>' + esc(t('pv_visit')) + '</h2>' + sinceBar() + '<div style="margin-top:10px">' + summaryBody() + '</div></section>';
  };

  /* ---------- insight cards ---------- */
  function persistentCard(I) {
    const xs = arr(I && I.persistent); if (!xs.length) return '';
    return '<div class="card"><h2 style="margin-bottom:10px">' + esc(t('pr_title')) + '</h2><ul class="list">' + xs.map(p => {
      const l = p.latest || {};
      return '<li><span class="l"><strong>' + esc(p.name) + '</strong><br><span class="muted small">' + esc(t('pr_since', { n: p.count, d: fmtDate(p.since) })) + '</span>' + recLinks(p.records) + '</span>' +
        '<span class="r"><span class="mono">' + esc(l.value == null ? '' : l.value) + ' ' + esc(p.unit || '') + '</span><br>' + badge(l.flag) + '</span></li>';
    }).join('') + '</ul><p class="small" style="margin:10px 0 0"><strong>' + esc(t('pr_disc')) + '</strong></p></div>';
  }
  function nextCard(I) {
    const xs = arr(I && I.preventive).filter(x => !(x && x.kind === 'follow_up' && typeof viewVisits === 'function')); if (!xs.length) return '';  // follow-ups live in the Visits view
    const item = x => {
      const kind = ['repeat_test', 'screening', 'follow_up'].indexOf(x.kind) >= 0 ? '<span class="tag">' + esc(t('nx_' + x.kind)) + '</span> ' : '';
      const due = x.due ? (x.overdue ? '<span class="tag amber">' + esc(t('nx_over', { d: fmtDate(x.due) })) + '</span>' : '<span class="muted small">' + esc(t('nx_due', { d: fmtDate(x.due) })) + '</span>') : '';
      return '<li><span class="l">' + kind + '<strong>' + esc(x.title) + '</strong>' + (x.why ? '<br><span class="small">' + esc(x.why) + '</span>' : '') + (due ? '<br>' + due : '') + recLinks(x.records) + '</span></li>';
    };
    // the most pressing few first; the rest one tap away
    return '<div class="card"><h2 style="margin-bottom:10px">' + esc(t('nx_title')) + '</h2><ul class="list cross">' + xs.slice(0, 4).map(item).join('') + '</ul>' +
      (xs.length > 4 ? '<details class="more"><summary>' + esc(t('jr_more', { n: xs.length })) + '</summary><ul class="list cross">' + xs.slice(4).map(item).join('') + '</ul></details>' : '') + '</div>';
  }
  function wellnessRecCard(I) {
    // tips from the person's own logged data come first; they replace server tips for the same sleep / activity area
    const dt = window.SehatWell && SehatWell.dataTips ? SehatWell.dataTips() : [], own = dt.map(x => x.area).filter(a => a === 'sleep' || a === 'activity');
    const xs = dt.concat(arr(I && I.wellness).filter(x => own.indexOf(x.area) < 0)); if (!xs.length) return '';
    const known = ['diet', 'activity', 'sleep', 'habits'];
    const areas = known.filter(a => xs.some(x => x.area === a)).concat(Array.from(new Set(xs.map(x => x.area))).filter(a => known.indexOf(a) < 0));
    return '<div class="card"><h2 style="margin-bottom:10px">' + esc(t('wl_title')) + '</h2>' + areas.map(a => '<div class="jr-area"><h3><span aria-hidden="true">' + (AREA_ICON[a] || '🌿') + '</span> ' + esc(STR.en['wl_' + a] ? t('wl_' + a) : a) + '</h3><ul class="list cross">' +
      xs.filter(x => x.area === a).map(x => '<li><span class="l">' + (x.own ? '<span class="tag">' + esc(t('wl_own')) + '</span> ' : '') + '<strong>' + esc(x.tip) + '</strong>' + (x.why ? '<br><span class="small">' + esc(t('wl_why', { w: x.why })) + '</span>' : '') + recLinks(x.records) + '</span></li>').join('') + '</ul></div>').join('') +
      '<p class="muted small" style="margin:10px 0 0">' + esc(t('wl_foot')) + '</p></div>';
  }
  const sec = (k, body) => '<section class="hsec"><div class="kicker">' + esc(t(k)) + '</div>' + body + '</section>';
  window.journalHTML = function (I, where) {
    if (where === 'top') return sec('jr_kick', '<div class="stack">' + journalCard() + (window.SehatWell && SehatWell.trendCard ? SehatWell.trendCard() : '') + previsitCard() + '</div>');
    if (where === 'risk') return persistentCard(I) + nextCard(I);
    if (where === 'habits') { const h = wellnessRecCard(I); return h ? '<section class="hsec">' + h + '</section>' : ''; }
    return '';
  };

  /* ---------- events ---------- */
  function addSym(v) {
    v = String(v || '').trim().toLowerCase().slice(0, 40); if (!v) return;
    const f = form(); if (f.symptoms.indexOf(v) < 0) f.symptoms.push(v);
  }
  function grabText() { // keep what is typed in the text boxes across a re-render
    const f = form(), side = document.getElementById('jrSide'), note = document.getElementById('jrNote');
    if (side) f.side_effects = side.value; if (note) f.note = note.value;
  }
  function saveForm() {
    grabText();
    const f = form(), txt = document.getElementById('jrSymTxt');
    if (txt && txt.value.trim()) addSym(txt.value);
    f.side_effects = String(f.side_effects || '').trim(); f.note = String(f.note || '').trim();
    const all = load().filter(e => e.date !== f.date);
    all.push(JSON.parse(JSON.stringify(f))); save(all);
    J.saved = true; J.sum = null; rerender();
    setTimeout(() => { J.saved = false; }, 4000);
  }
  function openEntry(date) {
    J.form = Object.assign(blank(date), load().find(e => e.date === date) || {}); J.saved = false;
    if (S.view !== 'journal') S.view = 'journal';
    rerender();
    const c = document.getElementById('jrCard'); if (c && c.scrollIntoView) c.scrollIntoView({ block: 'start' });
  }
  document.addEventListener('click', e => {
    const el = e.target && e.target.closest ? e.target.closest('[data-act^="jr_"]') : null;
    if (!el) return;
    const a = el.dataset.act, f = form();
    switch (a) {
      case 'jr_set': {
        grabText();
        const k = el.dataset.k, raw = el.dataset.v, v = (k === 'meds_taken') ? raw : Number(raw);
        f[k] = f[k] === v ? null : v; J.saved = false; return rerender();
      }
      case 'jr_sym': { grabText(); const v = el.dataset.v, i = f.symptoms.indexOf(v); if (i >= 0) f.symptoms.splice(i, 1); else f.symptoms.push(v); J.saved = false; return rerender(); }
      case 'jr_symadd': { grabText(); const x = document.getElementById('jrSymTxt'); if (x) addSym(x.value); return rerender(); }
      case 'jr_save': return saveForm();
      case 'jr_new': J.form = blank(); J.saved = false; return rerender();
      case 'jr_open': return openEntry(el.dataset.date);
      case 'jr_del': save(load().filter(x => x.date !== el.dataset.date)); if (f.date === el.dataset.date) J.form = null; J.sum = null; return rerender();
      case 'jr_sum': return runSummary();
      case 'jr_since30': J.since = daysAgo(30); J.sum = null; return rerender();
      case 'jr_sincerec': J.since = el.dataset.date; J.sum = null; return rerender();
    }
  });
  document.addEventListener('input', e => {
    const el = e.target; if (!el || !el.id) return;
    if (el.id === 'jrPain') { const f = form(); f.pain = Number(el.value); const s = el.parentNode.firstChild; if (s) s.textContent = t('jr_pain') + ': ' + f.pain + '/10'; J.saved = false; }
    else if (el.id === 'jrSide') form().side_effects = el.value;
    else if (el.id === 'jrNote') form().note = el.value;
  });
  document.addEventListener('change', e => {
    const el = e.target; if (!el || !el.id) return;
    if (el.id === 'jrDate' && /^\d{4}-\d{2}-\d{2}$/.test(el.value) && el.value <= todayKey()) openEntry(el.value);
    else if (el.id === 'jrSince' && /^\d{4}-\d{2}-\d{2}$/.test(el.value)) { J.since = el.value; J.sum = null; rerender(); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target && e.target.id === 'jrSymTxt') {
      e.preventDefault(); grabText(); addSym(e.target.value); rerender();
      const x = document.getElementById('jrSymTxt'); if (x) x.focus();
    }
  });
})();
