/* Demo data: one year of fictional readings, journal, steps and past records for the Mehra family.
   Loaded by index.html on localhost with ?seed=1, and once for the demo account (/app?demo=1). ?seed=reset (localhost) removes only what this file wrote.
   Everything here is FICTIONAL. Seeded items carry an id prefix (vit_seed_, rec_seed_) or a seed:1 flag so reset is exact.
   Keys written (per profile; "@id" is added by profKeyFor for non-self profiles):
     IndexedDB sehat/meta  : family, patient[@id], vitals[@id]      IndexedDB sehat/records: rec_seed_*
     localStorage          : sehat_journal[@id], sehat_steps[@id], sehat_seed_year (done flag), sehat_seed_manifest */
(function () {
  'use strict';
  const FLAG = 'sehat_seed_year', MAN = 'sehat_seed_manifest', DAYS = 365;
  const SEED_VERSION = 4;  // bump when the demo data changes: browsers on an older version re-seed (records are keyed by id, days are de-duplicated)
  const wantReset = /[?&]seed=reset\b/.test(location.search);
  const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* blocked */ } };

  /* ---------- small helpers ---------- */
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const ago = n => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - n); return d; };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const r1 = x => Math.round(x * 10) / 10;
  function toast(msg, bad) {
    const el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:99999;max-width:92vw;padding:12px 18px;border-radius:12px;font:600 14px system-ui,sans-serif;color:#fff;box-shadow:0 8px 28px rgba(0,0,0,.3);background:' + (bad ? '#b45309' : '#0f766e');
    el.textContent = msg; document.body.appendChild(el);
    setTimeout(() => el.remove(), 9000);
  }
  const ready = () => typeof S !== 'undefined' && S.ready && typeof FAM !== 'undefined' && FAM.list && typeof dbPut === 'function' && typeof SehatFamily !== 'undefined';
  function waitReady(cb, tries) {
    if (ready()) return cb();
    if ((tries || 0) > 200) return toast('Seed: app did not finish booting.', true);
    setTimeout(() => waitReady(cb, (tries || 0) + 1), 100);
  }

  /* ---------- the fictional family ---------- */
  const BANSAL = { doctor: 'Dr. R. K. Bansal', facility: 'Bansal Clinic, Sector 22, Chandigarh', lab: 'Sector 22 Diagnostics, Chandigarh' };
  const KHANNA = { doctor: 'Dr. S. Khanna', facility: 'Little Steps Child Clinic, Zirakpur', lab: 'Zirakpur Child Care Lab' };
  const PEOPLE = [
    { key: 'rahul', name: 'Rahul Mehra', age: 34, sex: 'M', relation: 'brother', id: 'p_rahul', seed: 1101, doc: BANSAL },
    { key: 'sunita', name: 'Sunita Mehra', age: 58, sex: 'F', relation: 'mother', id: 'p_sunita', seed: 2202, doc: BANSAL },
    { key: 'aanya', name: 'Aanya Mehra', age: 8, sex: 'F', relation: 'child', id: 'p_aanya', seed: 3303, doc: KHANNA },
    { key: 'ramesh', name: 'Ramesh Mehra', age: 63, sex: 'M', relation: 'father', id: 'p_ramesh_m', seed: 4404, doc: BANSAL },
    { key: 'sonika', name: 'Sonika Mehra', age: 32, sex: 'F', relation: 'spouse', id: 'p_sonika', seed: 5505, doc: BANSAL }
  ];

  /* ---------- generators: each returns { vitals, journal, steps, records } for one person ---------- */
  function mkV(list, pid, type, d, v, v2, note, sym) {
    list.push({ id: 'vit_seed_' + pid + '_' + type + '_' + ymd(ago(d)), type, date: ymd(ago(d)), value: v, value2: v2 == null ? null : v2, note: note || null, symptoms: sym || [] });
  }
  function T(name, value, unit, lo, hi, text, flag, std) {
    return { name, value, unit, ref_low: lo, ref_high: hi, ref_text: text, ref_source: 'report', flag, source_text: name + ' ' + value + ' ' + unit + ' ' + text, page: 1, confidence: 1, standard_name: std || name };
  }
  const flagOf = (v, lo, hi) => (lo != null && v < lo ? 'low' : (hi != null && v > hi ? 'high' : 'normal'));
  function lab(pid, p, d, title, tests) {
    return { id: 'rec_seed_' + pid + '_lab_' + ymd(ago(d)), profile: pid, doc_type: 'lab_report', title: title + ' - ' + p.doc.lab, date: ymd(ago(d)), facility: p.doc.lab, doctor: p.doc.doctor,
      patient: { name: p.name, age: String(p.age), sex: p.sex }, language_detected: 'en', handwritten: false, source: 'sample', extracted_by: 'sample', overall_confidence: 1,
      tests, medicines: [], diagnoses: [], advice: [], follow_up: null, warnings: [], unread: [], explanation: {} };
  }
  function med(name, strength, freq, timing, dur, generic) { return { name, generic: generic || '', strength, dose: '1', frequency: freq, timing, duration: dur, instructions: null, source_text: name + ' ' + strength + ' ' + freq, page: 1, confidence: 1 }; }
  function rx(pid, p, d, dx, meds, advice, fu) {
    return { id: 'rec_seed_' + pid + '_rx_' + ymd(ago(d)), profile: pid, doc_type: 'prescription', title: 'Prescription - ' + p.doc.doctor, date: ymd(ago(d)), facility: p.doc.facility, doctor: p.doc.doctor,
      patient: { name: p.name, age: String(p.age), sex: p.sex }, language_detected: 'en', handwritten: false, source: 'sample', extracted_by: 'sample', overall_confidence: 1, tests: [],
      medicines: meds, diagnoses: dx.map(n => ({ name: n, confidence: 1 })), advice, follow_up: fu || null, warnings: [], unread: [], explanation: {} };
  }
  function entry(date, o) { return Object.assign({ date, mood: null, symptoms: [], pain: 0, sleep: null, energy: null, meds_taken: null, side_effects: '', note: '', seed: 1 }, o); }

  function gen(p) {
    const R = rng(p.seed), N = () => { let u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const out = { vitals: [], journal: [], steps: [], records: [] }, V = out.vitals, pid = p.id;
    const pctDone = d => 1 - d / (DAYS - 1);  // 0 a year ago -> 1 today
    const med3 = (yes, no) => { const x = R(); return x < yes ? 'yes' : (x < yes + no ? 'no' : 'unsure'); };
    const sc = (x, lo, hi) => Math.round(clamp(x, lo || 1, hi || 5));
    const episodes = [];  // [startDaysAgo, length, kind]
    const inEp = d => episodes.find(e => d <= e[0] && d > e[0] - e[1]);

    if (p.key === 'rahul') {
      [[330, 6], [262, 8], [190, 5], [121, 9], [58, 6], [14, 5]].forEach(e => episodes.push([e[0], e[1], 'back']));
      for (let d = DAYS - 1; d >= 0; d--) {
        const t = pctDone(d), date = ymd(ago(d)), dow = ago(d).getDay();
        if (d % 7 === 2) mkV(V, pid, 'weight', d, r1(lerp(84.6, 80.8, t) + N() * 0.45));
        if (d % 3 === 1 || d % 5 === 0) {
          const border = (d > 195 && d < 235) || (d > 60 && d < 80);  // two borderline stretches
          const sy = Math.round(clamp((border ? 133 : 123) + N() * 5, 108, 150)), di = Math.round(clamp((border ? 86 : 79) + N() * 4, 66, 96));
          mkV(V, pid, 'bp', d, sy, Math.min(di, sy - 25));
        }
        if (d % 6 === 3) mkV(V, pid, 'pulse', d, Math.round(72 + N() * 5));
        if (d % 21 === 6) mkV(V, pid, 'sugar_fasting', d, Math.round(92 + N() * 6));
        const ep = inEp(d);
        if (R() < 0.87) {
          const pain = ep ? Math.round(clamp(7 - (ep[0] - d) * (4 / ep[1]) + N() * 0.8, 2, 8)) : (R() < 0.12 ? 1 : 0);
          out.journal.push(entry(date, { mood: sc(3.9 + N() * 0.7 - (ep ? 1 : 0)), sleep: sc(3.5 + N() * 0.8 - (ep ? 0.8 : 0)), energy: sc(3.6 + N() * 0.7 - (ep ? 0.7 : 0)), pain,
            symptoms: pain >= 3 ? ['pain'] : [], meds_taken: med3(0.92, 0.05),
            note: ep && d === ep[0] ? 'Lower back strain after lifting at the gym / long sitting.' : (ep && d === ep[0] - ep[1] + 1 ? 'Back feels much better.' : ''),
            side_effects: ep && R() < 0.06 ? 'felt sleepy after the muscle relaxant' : '' }));
        }
        if (R() < 0.86) out.steps.push({ date, steps: Math.round(clamp((dow === 0 || dow === 6 ? 7600 : 6400) + N() * 1900 - (ep ? 2200 : 0), 1200, 15000)) });
      }
      [[340, 248, 168, 42, 220, 14], [250, 241, 160, 40, 205, 18], [160, 229, 151, 41, 196, 24], [70, 214, 138, 43, 178, 29]].forEach(c => {
        const [d, tc, ldl, hdl, tg, vd] = c, j = Math.round(N() * 3);
        out.records.push(lab(pid, p, d, 'Lipid profile and Vitamin D', [
          T('Total Cholesterol', tc + j, 'mg/dL', null, 200, '< 200', flagOf(tc + j, null, 200), 'Total Cholesterol'),
          T('LDL Cholesterol', ldl + j, 'mg/dL', null, 100, '< 100', flagOf(ldl + j, null, 100), 'LDL Cholesterol'),
          T('HDL Cholesterol', hdl, 'mg/dL', 40, null, '> 40', flagOf(hdl, 40, null), 'HDL Cholesterol'),
          T('Triglycerides', tg + j, 'mg/dL', null, 150, '< 150', flagOf(tg + j, null, 150), 'Triglycerides'),
          T('Vitamin D (25-OH)', vd, 'ng/mL', 30, 100, '30 - 100', flagOf(vd, 30, 100), 'Vitamin D')]));
      });
      out.records.push(
        rx(pid, p, 335, ['High cholesterol (dyslipidaemia)', 'Vitamin D deficiency'], [med('Tab. Atorvastatin', '10 mg', 'once a day', 'at night', '3 months', 'Atorvastatin'), med('Cap. Vitamin D3', '60000 IU', 'once a week', 'after food', '8 weeks', 'Cholecalciferol')], ['Cut fried food and sweets', 'Walk 30 minutes daily', 'Repeat lipid profile and vitamin D in 3 months'], 'Review in 3 months'),
        rx(pid, p, 262, ['Lumbar muscle strain'], [med('Tab. Thiocolchicoside', '4 mg', 'twice a day', 'after food', '5 days', 'Thiocolchicoside'), med('Tab. Aceclofenac + Paracetamol', '100/325 mg', 'twice a day', 'after food', '5 days')], ['Hot compress twice a day', 'Avoid lifting heavy weights', 'Back-strengthening stretches once pain settles'], 'Review if pain lasts beyond 10 days'),
        rx(pid, p, 121, ['Lumbar muscle strain', 'High cholesterol (dyslipidaemia)'], [med('Tab. Thiocolchicoside', '4 mg', 'twice a day', 'after food', '5 days'), med('Tab. Atorvastatin', '10 mg', 'once a day', 'at night', '3 months', 'Atorvastatin')], ['Sit with back support, stand and stretch hourly', 'Repeat lipid profile in 6 weeks'], 'Review in 3 months'),
        rx(pid, p, 58, ['Lumbar muscle strain'], [med('Tab. Aceclofenac + Paracetamol', '100/325 mg', 'twice a day', 'after food', '3 days'), med('Tab. Pantoprazole', '40 mg', 'once a day', 'before breakfast', '5 days', 'Pantoprazole')], ['Core exercises daily, physiotherapy if it recurs'], 'Physiotherapy if pain returns'));
        out.records.push(rx(pid, p, 9, ['High cholesterol (dyslipidaemia)', 'Vitamin D deficiency'], [med('Tab. Atorvastatin', '10 mg', 'once a day', 'at night', '3 months', 'Atorvastatin'), med('Cap. Vitamin D3', '60000 IU', 'once a week', 'after food', '8 weeks', 'Cholecalciferol')], ['Walk 30 minutes daily', 'Less fried food'], 'After 3 months with lipid profile'));
    }

    if (p.key === 'sunita') {
      for (let d = DAYS - 1; d >= 0; d--) {
        const t = pctDone(d), date = ymd(ago(d)), dow = ago(d).getDay();
        if (d % 2 === 0) {
          const blip = R() < 0.08 ? 28 + R() * 20 : 0;
          mkV(V, pid, 'sugar_fasting', d, Math.round(clamp(lerp(170, 120, Math.pow(t, 0.9)) + N() * 9 + blip, 95, 250)), null, null, blip > 0 && R() < 0.5 ? ['thirst'] : (R() < 0.12 ? ['tired'] : []));
        }
        if (d % 7 === 4) mkV(V, pid, 'sugar_pp', d, Math.round(clamp(lerp(238, 176, t) + N() * 14, 120, 330)));
        if (d % 3 === 0) {
          const sy = Math.round(clamp(lerp(141, 128, t) + N() * 5, 112, 165)), di = Math.round(clamp(lerp(90, 82, t) + N() * 3.5, 64, 100));
          mkV(V, pid, 'bp', d, sy, Math.min(di, sy - 25));
        }
        if (d % 5 === 1) mkV(V, pid, 'pulse', d, Math.round(76 + N() * 5));
        if (d % 14 === 5) mkV(V, pid, 'weight', d, r1(lerp(68.4, 66.2, t) + N() * 0.35));
        if (R() < 0.83) {
          const tired = R() < lerp(0.3, 0.12, t), kn = R() < 0.18;
          out.journal.push(entry(date, { mood: sc(3.6 + N() * 0.7 - (tired ? 0.8 : 0)), sleep: sc(3.2 + N() * 0.8), energy: sc((tired ? 2.2 : 3.4) + N() * 0.6), pain: kn ? Math.round(clamp(2 + R() * 2, 1, 5)) : 0,
            symptoms: [].concat(tired ? ['tiredness'] : [], kn ? ['pain'] : []), meds_taken: med3(0.9, 0.06),
            note: tired && R() < 0.15 ? 'Felt very tired by afternoon, sugar was on the higher side.' : '', side_effects: R() < 0.02 ? 'mild stomach upset after the Metformin tablet' : '' }));
        }
        if (R() < 0.8) out.steps.push({ date, steps: Math.round(clamp(lerp(4300, 5900, t) + (dow === 0 ? -600 : 0) + N() * 1200, 800, 10000)) });
      }
      [[342, 8.7, 176, 252, 6.9, 0.9], [252, 8.2, 158, 226, 6.0, 0.9], [162, 7.7, 140, 204, 5.2, 0.8], [72, 7.2, 126, 188, 4.6, 0.9]].forEach(c => {
        const [d, a1c, fbs, pp, tsh, cr] = c;
        out.records.push(lab(pid, p, d, 'Diabetes and thyroid panel', [
          T('HbA1c (Glycated Hemoglobin)', a1c, '%', 4.0, 5.6, '4.0 - 5.6', flagOf(a1c, 4.0, 5.6), 'HbA1c'),
          T('Fasting Blood Sugar', fbs, 'mg/dL', 70, 100, '70 - 100', flagOf(fbs, 70, 100), 'Fasting Blood Sugar'),
          T('Post-Prandial Blood Sugar', pp, 'mg/dL', 70, 140, '70 - 140', flagOf(pp, 70, 140), 'Post-Prandial Blood Sugar'),
          T('TSH', tsh, 'uIU/mL', 0.4, 4.0, '0.4 - 4.0', flagOf(tsh, 0.4, 4.0), 'TSH'),
          T('Serum Creatinine', cr, 'mg/dL', 0.5, 1.1, '0.5 - 1.1', flagOf(cr, 0.5, 1.1), 'Serum Creatinine')]));
      });
      out.records.push(
        rx(pid, p, 343, ['Type 2 diabetes mellitus', 'Hypertension', 'Hypothyroidism'], [med('Tab. Metformin', '500 mg', 'twice a day', 'after food', '3 months', 'Metformin'), med('Tab. Telmisartan', '40 mg', 'once a day', 'morning', '3 months', 'Telmisartan'), med('Tab. Levothyroxine', '50 mcg', 'once a day', 'empty stomach, 30 minutes before breakfast', '3 months', 'Levothyroxine')], ['Low sugar and low salt diet', 'Walk 30 minutes daily', 'Check fasting sugar and BP at home'], 'Review with HbA1c and TSH in 3 months'),
        rx(pid, p, 253, ['Type 2 diabetes mellitus', 'Hypertension', 'Hypothyroidism'], [med('Tab. Metformin', '1000 mg', 'twice a day', 'after food', '3 months', 'Metformin'), med('Tab. Telmisartan', '40 mg', 'once a day', 'morning', '3 months', 'Telmisartan'), med('Tab. Levothyroxine', '50 mcg', 'once a day', 'empty stomach', '3 months', 'Levothyroxine')], ['Metformin dose increased', 'Keep a sugar diary'], 'Review in 3 months'),
        rx(pid, p, 163, ['Type 2 diabetes mellitus', 'Hypertension', 'Hypothyroidism'], [med('Tab. Metformin', '1000 mg', 'twice a day', 'after food', '3 months', 'Metformin'), med('Tab. Glimepiride', '1 mg', 'once a day', 'before breakfast', '3 months', 'Glimepiride'), med('Tab. Telmisartan', '40 mg', 'once a day', 'morning', '3 months', 'Telmisartan'), med('Tab. Levothyroxine', '75 mcg', 'once a day', 'empty stomach', '3 months', 'Levothyroxine')], ['Glimepiride added, watch for low sugar', 'Levothyroxine dose raised'], 'Review with reports in 3 months'),
        rx(pid, p, 73, ['Type 2 diabetes mellitus', 'Hypertension', 'Hypothyroidism'], [med('Tab. Metformin', '1000 mg', 'twice a day', 'after food', '3 months', 'Metformin'), med('Tab. Glimepiride', '1 mg', 'once a day', 'before breakfast', '3 months', 'Glimepiride'), med('Tab. Telmisartan', '40 mg', 'once a day', 'morning', '3 months', 'Telmisartan'), med('Tab. Levothyroxine', '75 mcg', 'once a day', 'empty stomach', '3 months', 'Levothyroxine')], ['Sugar and BP improving, continue same medicines', 'Annual eye and foot check'], 'Review in 3 months'));
    }

    if (p.key === 'aanya') {
      // winter episodes (cough + fever) and an asthma-type cough; the last one is just starting now
      [[334, 7, 'viral'], [297, 6, 'viral'], [261, 9, 'asthma'], [226, 5, 'asthma'], [6, 5, 'asthma']].forEach(e => episodes.push(e));
      for (let d = DAYS - 1; d >= 0; d--) {
        const t = pctDone(d), date = ymd(ago(d)), dow = ago(d).getDay(), ep = inEp(d);
        if (d % 30 === 12) mkV(V, pid, 'weight', d, r1(lerp(23.9, 26.4, t) + N() * 0.2), null, 'Height ' + Math.round(lerp(123, 128.5, t) + N() * 0.3) + ' cm');
        if (d % 9 === 3 || (ep && ep[2] === 'viral' && d % 2 === 0)) mkV(V, pid, 'pulse', d, Math.round(ep ? 104 + N() * 5 : 88 + N() * 5));
        if (R() < 0.9) {
          const sev = ep ? (ep[0] - d < 3 ? 1 : 0.5) : 0, fever = ep && ep[2] === 'viral' && ep[0] - d < 3;
          out.journal.push(entry(date, { mood: sc(4.2 + N() * 0.6 - sev * 1.4), sleep: sc(4 + N() * 0.7 - sev * 1.2), energy: sc(4.1 + N() * 0.6 - sev * 1.5), pain: ep && R() < 0.3 ? 2 : 0,
            symptoms: ep ? (fever ? ['cough', 'fever'] : ['cough']) : (R() < 0.04 ? ['cough'] : []), meds_taken: med3(0.94, 0.04),
            note: ep && d === ep[0] ? (ep[2] === 'viral' ? 'Cold, cough and fever started, seeing Dr. Khanna.' : 'Night cough and wheeze, used the inhaler.') : '' }));
        }
        if (R() < 0.88) out.steps.push({ date, steps: Math.round(clamp((dow === 0 || dow === 6 ? 9200 : 7000) + N() * 2200 - (ep ? 3000 : 0), 1500, 16000)) });
      }
      [[338, 9.6, 8, 72], [246, 10.2, 13, 74], [155, 10.9, 20, 77], [64, 11.6, 29, 80]].forEach(c => {
        const [d, hb, fer, mcv] = c;
        out.records.push(lab(pid, p, d, 'Haemoglobin and iron studies', [
          T('Haemoglobin', hb, 'g/dL', 11.5, 15.5, '11.5 - 15.5', flagOf(hb, 11.5, 15.5), 'Hemoglobin'),
          T('Serum Ferritin', fer, 'ng/mL', 15, 80, '15 - 80', flagOf(fer, 15, 80), 'Ferritin'),
          T('MCV', mcv, 'fL', 77, 95, '77 - 95', flagOf(mcv, 77, 95), 'MCV')]));
      });
      out.records.push(
        rx(pid, p, 339, ['Iron deficiency anaemia', 'Mild asthma'], [med('Syp. Ferrous Ascorbate', '30 mg/5 ml', 'once a day', 'after food', '3 months', 'Ferrous ascorbate'), med('Inhaler Salbutamol', '100 mcg', 'as needed (2 puffs with spacer)', 'for wheeze or night cough', 'as needed', 'Salbutamol')], ['Iron-rich food: greens, jaggery, dates', 'Avoid dust and cold drinks', 'Repeat Hb in 3 months'], 'Review in 3 months'),
        rx(pid, p, 334, ['Viral fever with cough'], [med('Syp. Paracetamol', '125 mg/5 ml', 'every 6 hours if fever', 'after food', '3 days', 'Paracetamol'), med('Syp. Levocetirizine', '2.5 mg/5 ml', 'once a day', 'at night', '5 days', 'Levocetirizine')], ['Plenty of fluids and rest', 'Warm saline gargles'], 'Review if fever lasts beyond 3 days'),
        rx(pid, p, 261, ['Mild asthma flare', 'Allergic cough'], [med('Tab. Montelukast', '4 mg chewable', 'once a day', 'at night', '4 weeks', 'Montelukast'), med('Inhaler Salbutamol', '100 mcg', 'as needed (2 puffs with spacer)', 'for wheeze or night cough', 'as needed', 'Salbutamol')], ['Keep her away from dust and smoke', 'Steam inhalation at night'], 'Review in 4 weeks'),
        rx(pid, p, 155, ['Iron deficiency anaemia'], [med('Syp. Ferrous Ascorbate', '30 mg/5 ml', 'once a day', 'after food', '3 months', 'Ferrous ascorbate')], ['Continue iron, Hb improving'], 'Repeat Hb in 3 months'));
        out.records.push(rx(pid, p, 11, ['Iron deficiency anaemia', 'Mild asthma'], [med('Syp. Ferrous Ascorbate', '30 mg/5 ml', 'once a day', 'after food', '3 months', 'Ferrous ascorbate'), med('Tab. Montelukast', '4 mg chewable', 'once a day', 'at night', '4 weeks', 'Montelukast')], ['Iron-rich food: green vegetables, jaggery, dates', 'Inhaler before outdoor play if wheezy'], 'After 1 month with Hb report'));
    }
    if (p.key === 'ramesh') {  // hypertension, angioplasty three years ago, on secondary prevention
      for (let d = DAYS - 1; d >= 0; d--) {
        const t = pctDone(d), date = ymd(ago(d)), dow = ago(d).getDay();
        if (d % 2 === 1) { const sy = Math.round(clamp(lerp(146, 132, t) + N() * 6, 115, 170)), di = Math.round(clamp(lerp(92, 84, t) + N() * 4, 66, 104)); mkV(V, pid, 'bp', d, sy, Math.min(di, sy - 25)); }
        if (d % 4 === 2) mkV(V, pid, 'pulse', d, Math.round(clamp(66 + N() * 4, 54, 90)));
        if (d % 14 === 3) mkV(V, pid, 'weight', d, r1(lerp(79.5, 77.4, t) + N() * 0.4));
        if (R() < 0.8) {
          const tired = R() < 0.14, breath = R() < 0.05;
          out.journal.push(entry(date, { mood: sc(3.5 + N() * 0.7), sleep: sc(3.3 + N() * 0.8), energy: sc((tired ? 2.4 : 3.4) + N() * 0.6), pain: Math.round(clamp(N() * 0.8, 0, 10)),
            symptoms: [].concat(tired ? ['tiredness'] : [], breath ? ['breathlessness on stairs'] : []), meds_taken: med3(0.88, 0.07), note: breath ? 'Slight breathlessness climbing stairs, settled with rest.' : '', side_effects: '' }));
        }
        if (R() < 0.85) out.steps.push({ date, steps: Math.round(clamp(lerp(5200, 6800, t) + (dow === 0 ? 900 : 0) + N() * 1300, 1200, 11000)) });
      }
      [[330, 168, 104, 41, 1.0], [240, 152, 92, 42, 1.0], [150, 141, 84, 44, 1.1], [18, 134, 79, 45, 1.1]].forEach(c => {
        const [d, tc, ldl, hdl, cr] = c;
        out.records.push(lab(pid, p, d, 'Lipid profile and kidney function', [
          T('Total Cholesterol', tc, 'mg/dL', null, 200, '< 200', flagOf(tc, null, 200), 'Total Cholesterol'),
          T('LDL Cholesterol', ldl, 'mg/dL', null, 70, '< 70 (heart patients)', flagOf(ldl, null, 70), 'LDL Cholesterol'),
          T('HDL Cholesterol', hdl, 'mg/dL', 40, null, '> 40', flagOf(hdl, 40, null), 'HDL Cholesterol'),
          T('Serum Creatinine', cr, 'mg/dL', 0.7, 1.3, '0.7 - 1.3', flagOf(cr, 0.7, 1.3), 'Serum Creatinine')]));
      });
      out.records.push(rx(pid, p, 160, ['Hypertension', 'Coronary artery disease, post angioplasty'], [med('Tab. Aspirin', '75 mg', 'once a day', 'after lunch', '3 months', 'Aspirin'), med('Tab. Atorvastatin', '40 mg', 'once a day', 'at night', '3 months', 'Atorvastatin'), med('Tab. Metoprolol', '25 mg', 'twice a day', 'after food', '3 months', 'Metoprolol')], ['Walk 30 minutes daily', 'Low-salt diet'], 'After 3 months with lipid profile'));
      out.records.push(rx(pid, p, 6, ['Hypertension', 'Coronary artery disease, post angioplasty'], [med('Tab. Aspirin', '75 mg', 'once a day', 'after lunch', '3 months', 'Aspirin'), med('Tab. Atorvastatin', '40 mg', 'once a day', 'at night', '3 months', 'Atorvastatin'), med('Tab. Metoprolol', '25 mg', 'twice a day', 'after food', '3 months', 'Metoprolol')], ['Walk 30 minutes daily', 'Low-salt diet', 'Report any chest pain at once'], 'After 3 months with ECG and lipid profile'));
    }

    if (p.key === 'sonika') {  // hypothyroid with mild anaemia; the family's caretaker
      for (let d = DAYS - 1; d >= 0; d--) {
        const t = pctDone(d), date = ymd(ago(d)), dow = ago(d).getDay();
        if (d % 14 === 6) mkV(V, pid, 'weight', d, r1(lerp(61.8, 60.6, t) + N() * 0.3));
        if (d % 6 === 2) mkV(V, pid, 'pulse', d, Math.round(clamp(78 + N() * 5, 60, 100)));
        if (R() < 0.78) {
          const tired = R() < lerp(0.32, 0.14, t);
          out.journal.push(entry(date, { mood: sc(3.6 + N() * 0.7 - (tired ? 0.6 : 0)), sleep: sc(3.1 + N() * 0.8), energy: sc((tired ? 2.3 : 3.4) + N() * 0.6), pain: Math.round(clamp(N() * 0.6, 0, 10)),
            symptoms: tired ? ['tiredness'] : [], meds_taken: med3(0.9, 0.05), note: tired && R() < 0.2 ? 'Tired by evening after looking after everyone.' : '', side_effects: '' }));
        }
        if (R() < 0.8) out.steps.push({ date, steps: Math.round(clamp(lerp(6100, 7400, t) + (dow === 6 ? 800 : 0) + N() * 1400, 1500, 13000)) });
      }
      [[300, 7.8, 10.6], [200, 5.9, 11.0], [110, 4.6, 11.4], [14, 3.4, 11.9]].forEach(c => {
        const [d, tsh, hb] = c;
        out.records.push(lab(pid, p, d, 'Thyroid and blood count', [
          T('TSH', tsh, 'mIU/L', 0.4, 4.0, '0.4 - 4.0', flagOf(tsh, 0.4, 4.0), 'TSH'),
          T('Haemoglobin', hb, 'g/dL', 12.0, 15.0, '12.0 - 15.0', flagOf(hb, 12.0, 15.0), 'Haemoglobin')]));
      });
      out.records.push(rx(pid, p, 4, ['Hypothyroidism', 'Mild iron deficiency anaemia'], [med('Tab. Levothyroxine', '50 mcg', 'once a day', 'empty stomach, morning', '3 months', 'Levothyroxine'), med('Tab. Ferrous Ascorbate', '100 mg', 'once a day', 'after lunch', '2 months', 'Ferrous ascorbate')], ['Thyroid tablet 30 minutes before tea or breakfast', 'Iron-rich food'], 'After 6 weeks with TSH and Hb'));
    }
    return out;
  }

  /* ---------- profile plumbing ---------- */
  const famSave = () => dbPut('meta', { profiles: FAM.list }, 'family');
  async function resolveProfile(p, man) {
    const want = p.name.toLowerCase();
    let hit = FAM.list.find(x => String(x.name || '').toLowerCase() === want);
    if (!hit && p.key === 'rahul') {
      const self = FAM.list.find(x => x.id === 'self'), pat = await dbGet('meta', 'patient');
      if (self && !self.name && !(pat && pat.name)) {  // empty account holder: Rahul is the account holder
        self.name = p.name; self.age = p.age; self.sex = p.sex;
        await dbPut('meta', { name: p.name, age: String(p.age), sex: p.sex, abha: null }, 'patient');
        FAM.selfName = p.name; man.selfNamed = true; hit = self;
      }
    }
    if (!hit) {
      hit = { id: p.id, name: p.name, relation: p.relation, age: p.age, sex: p.sex, pin: null, hidden: false };
      FAM.list.push(hit); man.profilesAdded.push(p.id);
    }
    await famSave();
    const k = SehatFamily.profKeyFor('patient', hit.id);
    if (!(await dbGet('meta', k))) await dbPut('meta', { name: p.name, age: String(p.age), sex: p.sex, abha: null }, k);
    return hit.id;
  }

  async function runSeed() {
    // demo browsers from before v4 hold the Round 1 sample family next to the Mehras: rebuild the demo cleanly once
    const u = (typeof currentUser === 'function' && currentUser()) || {};
    if (u.demo && (lsGet(FLAG, 0) || 0) < SEED_VERSION && FAM.list.some(x => x.id === 'p_aarav' || x.id === 'p_ramesh')) {
      for (const st of ['records', 'meta', 'files']) { try { await dbClear(st); } catch (e) { /* store missing */ } }
      Object.keys(localStorage).filter(k => k.indexOf('sehat_') === 0 && !/^sehat_(user|accounts|theme|lang|i18n_)/.test(k)).forEach(k => localStorage.removeItem(k));
      try { sessionStorage.clear(); } catch (e) { /* ignore */ }
      location.replace('/app?demo=1');
      return;
    }
    if (lsGet(FLAG, null) >= SEED_VERSION) { toast('Year data was already seeded. Add ?seed=reset to remove it, then ?seed=1 again.'); return; }
    const man = { at: new Date().toISOString(), profilesAdded: [], selfNamed: false, byProfile: {}, counts: { vitals: 0, journal: 0, steps: 0, records: 0 } };
    const pk = SehatFamily.profKeyFor;
    for (const p of PEOPLE) {
      const pid = await resolveProfile(p, man), g = gen(Object.assign({}, p, { id: pid }));
      // vitals (IndexedDB meta)
      const vk = pk('vitals', pid), oldV = (await dbGet('meta', vk)) || [];
      await dbPut('meta', oldV.filter(e => !String(e.id).startsWith('vit_seed_')).concat(g.vitals), vk);
      // journal + steps (localStorage); keep any entry the user already has for a date
      const jk = pk('sehat_journal', pid), oldJ = lsGet(jk, []), have = new Set(oldJ.map(e => e.date));
      const jNew = g.journal.filter(e => !have.has(e.date));
      lsSet(jk, oldJ.concat(jNew));
      const sk = pk('sehat_steps', pid), oldS = lsGet(sk, []), hs = new Set(oldS.map(e => e.date));
      const sNew = g.steps.filter(e => !hs.has(e.date));
      lsSet(sk, oldS.concat(sNew));
      // records (IndexedDB records); saveRecordLocal stamps/keeps them in the right profile list
      for (const r of g.records) { const rec = normalizeRecord(r); rec.profile = pid; await saveRecordLocal(rec); }
      // the newest prescription is the current course: confirm its medicines so the schedule and calendar show
      const latest = g.records.filter(r => r.doc_type === 'prescription').sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
      if (latest) { const ck = pk('sehat_current', pid), cur = lsGet(ck, {}); (latest.medicines || []).forEach(m => { cur[curKey(m)] = 1; }); lsSet(ck, cur); }
      man.byProfile[pid] = { name: p.name, vitals: g.vitals.length, journal: jNew.length, steps: sNew.length, records: g.records.length, keys: [vk, jk, sk] };
      man.counts.vitals += g.vitals.length; man.counts.journal += jNew.length; man.counts.steps += sNew.length; man.counts.records += g.records.length;
    }
    // family roles: the child cannot open the adults' profiles (demo PIN 1000); Sonika is the caretaker
    const idOf = k => { const q = PEOPLE.find(x => x.key === k); const hit = q && FAM.list.find(x => String(x.name || '').toLowerCase() === q.name.toLowerCase()); return hit ? hit.id : null; };
    const adults = ['rahul', 'sunita', 'ramesh', 'sonika'].map(idOf).filter(Boolean);
    try { await SehatFamily.lockForChild(adults, '1000'); } catch (e) { /* no crypto: skip the lock */ }
    try { await SehatFamily.setCare(idOf('sonika'), ['sunita', 'ramesh', 'aanya', 'rahul'].map(idOf).filter(Boolean)); } catch (e) { /* ignore */ }
    // a week of doses: mostly taken, a few missed; today Sunita and Ramesh have not marked their first dose (caretaker alert)
    for (const p of PEOPLE) {
      const pid = idOf(p.key); if (!pid) continue;
      const latest = (S.records.concat(FAM.others || [])).filter(r => r.profile === pid && r.doc_type === 'prescription').sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
      if (!latest) continue;
      const keys = buildDoses((latest.medicines || []).map(m => ({ m, date: latest.date }))).map(d => d.key), rnd = rng(p.seed + 7);
      for (let d = 7; d >= 0; d--) {
        const k = 'sehat_taken_' + pk(ymd(ago(d)), pid), log = lsGet(k, {});
        keys.forEach((key, i) => {
          if (d === 0) { if (i === 0 && (p.key === 'sunita' || p.key === 'ramesh')) return; if (i === 0) log[key] = 1; return; }
          if (rnd() < 0.88) log[key] = 1;
        });
        lsSet(k, log);
      }
    }
    if (typeof TAKEN_MEM === 'object') Object.keys(TAKEN_MEM).forEach(k => delete TAKEN_MEM[k]);
    try { if (window.SehatRem && SehatRem.careScan) SehatRem.careScan(); } catch (e) { /* ignore */ }
    lsSet(MAN, man); lsSet(FLAG, SEED_VERSION);
    await SehatFamily._loadProfileMeta();
    const first = Object.keys(man.byProfile)[0];
    if (SehatFamily.active() !== first) { try { await SehatFamily.switchTo(first); } catch (e) { /* stay on current profile */ } }
    await SehatFamily._loadProfileMeta();
    S.insights = null; render();
    const c = man.counts, total = c.vitals + c.journal + c.steps + c.records;
    toast('Seeded ' + total + ' items for the Mehra family: ' + c.vitals + ' readings, ' + c.journal + ' journal days, ' + c.steps + ' step days, ' + c.records + ' records.');
  }

  async function runReset() {
    const man = lsGet(MAN, null);
    if (!man) { try { localStorage.removeItem(FLAG); } catch (e) { /* ignore */ } toast('Nothing seeded, nothing to remove.'); return; }
    const pk = SehatFamily.profKeyFor;
    let n = 0;
    for (const pid of Object.keys(man.byProfile)) {
      const vk = pk('vitals', pid), v = (await dbGet('meta', vk)) || [], keep = v.filter(e => !String(e.id).startsWith('vit_seed_'));
      n += v.length - keep.length; await dbPut('meta', keep, vk);
      const jk = pk('sehat_journal', pid), j = lsGet(jk, []), jk2 = j.filter(e => !e.seed);
      n += j.length - jk2.length; if (jk2.length) lsSet(jk, jk2); else localStorage.removeItem(jk);
      const sk = pk('sehat_steps', pid), s = lsGet(sk, []);
      // steps carry no flag (the app strips it): remove the dates this seed wrote, which is all of them for a seeded-only profile
      const seeded = new Set(gen(Object.assign({}, PEOPLE.find(p => p.name === man.byProfile[pid].name), { id: pid })).steps.map(e => e.date));
      const sk2 = s.filter(e => !seeded.has(e.date)); n += s.length - sk2.length;
      if (sk2.length) lsSet(sk, sk2); else localStorage.removeItem(sk);
    }
    const recs = (await dbGetAll('records')).filter(r => String(r.id).startsWith('rec_seed_'));
    for (const r of recs) await dbDel('records', r.id);
    n += recs.length;
    S.records = S.records.filter(r => !String(r.id).startsWith('rec_seed_')); FAM.others = FAM.others.filter(r => !String(r.id).startsWith('rec_seed_'));
    if (SehatFamily.active() !== 'self' && man.profilesAdded.indexOf(SehatFamily.active()) >= 0) await SehatFamily.switchTo('self');
    for (const pid of man.profilesAdded) {  // profiles this seed created
      FAM.list = FAM.list.filter(x => x.id !== pid);
      await dbDel('meta', pk('patient', pid)); await dbDel('meta', pk('vitals', pid));
      Object.keys(localStorage).filter(k => k.endsWith('@' + pid)).forEach(k => { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } });  // app caches for that profile
    }
    if (man.selfNamed) {
      const self = FAM.list.find(x => x.id === 'self'); if (self) { self.name = ''; self.age = null; self.sex = null; }
      await dbDel('meta', 'patient'); FAM.selfName = '';
    }
    await famSave();
    try { localStorage.removeItem(FLAG); localStorage.removeItem(MAN); } catch (e) { /* ignore */ }
    await SehatFamily._loadProfileMeta();
    S.insights = null; render();
    toast('Seed removed: ' + n + ' items deleted. Your own data was left alone.');
    if (history.replaceState) history.replaceState(null, '', location.pathname + location.search.replace(/([?&])seed=reset&?/, '$1').replace(/[?&]$/, ''));
  }

  waitReady(() => (wantReset ? runReset() : runSeed()).catch(e => { console.error('seed-year failed', e); toast('Seed failed: ' + e.message, true); }));
})();
