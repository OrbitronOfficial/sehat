/* Doctor demo data (all patients FICTIONAL): Dr. R. K. Bansal, MD (Medicine), Bansal Clinic, Sector 22 Chandigarh.
   Seeds on first open when the doctor stores are empty (flag sehat_doc_demo); the topbar "Load demo data" button re-seeds.
   Writes: IndexedDB sehat-doctor/consults (ids demo_c_*), localStorage sehat_doc_queue_<date> and sehat_doc_todo.
   Loaded by doctor.html AFTER doctor.js; it re-opens the current sidebar section when done. */
(function () {
  'use strict';
  const FLAG = 'sehat_doc_demo', DAY = 86400000, TK = 'sehat_doc_todo';
  const lsGet = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || 'null'); return v == null ? d : v; } catch (e) { return d; } };
  const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* blocked */ } };
  const dayKey = ms => new Date(ms).toISOString().slice(0, 10);  // same key style as doctor.js
  const at = (daysAgo, hour, min) => { const d = new Date(Date.now() - daysAgo * DAY); d.setHours(hour || 10, min || 0, 0, 0); return d.getTime(); };

  function db() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('sehat-doctor', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('consults', { keyPath: 'id' });
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
  }
  const all = async () => { const d = await db(); return new Promise(res => { const q = d.transaction('consults').objectStore('consults').getAll(); q.onsuccess = () => res(q.result || []); q.onerror = () => res([]); }); };
  async function putMany(list, delIds) {
    const d = await db();
    return new Promise((res, rej) => {
      const tx = d.transaction('consults', 'readwrite'), st = tx.objectStore('consults');
      (delIds || []).forEach(id => st.delete(id));
      list.forEach(c => st.put(c));
      tx.oncomplete = res; tx.onerror = () => rej(tx.error);
    });
  }

  /* ---------- the Mehra family: past visits (match the year seed and the test-prescriptions files) ---------- */
  const med = (name, strength, frequency, timing, duration) => ({ name, generic: '', strength, dose: '', frequency, timing, duration, instructions: '', source_text: '', page: null, confidence: 1 });
  const P = { rahul: { name: 'Rahul Mehra', age: '34', sex: 'M' }, sunita: { name: 'Sunita Mehra', age: '58', sex: 'F' }, aanya: { name: 'Aanya Mehra', age: '8', sex: 'F' } };
  const CONSULTS = [
    // [id, who, daysAgo, complaint, transcript, diagnoses, meds, advice, follow_up]
    ['rahul_chol', 'rahul', 335, 'cholesterol report, tired often', 'Rahul Mehra, 34, desk job. Lipid profile: total 248, LDL 168, HDL 38, TG 220. Vitamin D 14, low. No chest pain. Start atorvastatin 10 mg at night, vitamin D3 60000 IU once a week for 8 weeks. Cut fried food, walk daily, repeat tests in 3 months.',
      ['High cholesterol (dyslipidaemia)', 'Vitamin D deficiency'], [med('Tab. Atorvastatin', '10 mg', 'once a day', 'at night', '3 months'), med('Cap. Vitamin D3', '60000 IU', 'once a week', 'after food', '8 weeks')], ['Cut fried food and sweets', 'Walk 30 minutes daily', 'Repeat lipid profile and vitamin D in 3 months'], 'Review in 3 months'],
    ['rahul_back1', 'rahul', 262, 'low back pain after lifting', 'Back pain for 3 days after lifting a heavy box at the gym. No leg weakness, no numbness. Lumbar muscle strain. Thiocolchicoside 4 mg twice a day and aceclofenac with paracetamol twice a day after food for 5 days. Hot compress, avoid heavy lifting.',
      ['Lumbar muscle strain'], [med('Tab. Thiocolchicoside', '4 mg', 'twice a day', 'after food', '5 days'), med('Tab. Aceclofenac + Paracetamol', '100/325 mg', 'twice a day', 'after food', '5 days')], ['Hot compress twice a day', 'Avoid lifting heavy weights'], 'Review if pain lasts beyond 10 days'],
    ['rahul_lab', 'rahul', 160, 'review lipid and vitamin D report', 'Lipid profile and vitamin D reviewed. LDL 151, vitamin D 24, improving. Continue atorvastatin. Vitamin D sachet once a week for another 8 weeks. Good response, keep walking.',
      ['High cholesterol (dyslipidaemia)', 'Vitamin D deficiency'], [med('Tab. Atorvastatin', '10 mg', 'once a day', 'at night', '3 months'), med('Cap. Vitamin D3', '60000 IU', 'once a week', 'after food', '8 weeks')], ['Sunlight 20 minutes in the morning', 'Repeat tests in 3 months'], 'Review in 3 months'],
    ['rahul_back2', 'rahul', 121, 'back pain again, desk job', 'Back strain recurred after a long drive. Pain 6 out of 10, better on rest. Same medicines for 5 days plus atorvastatin refill. Advised sitting with back support and hourly stretches.',
      ['Lumbar muscle strain', 'High cholesterol (dyslipidaemia)'], [med('Tab. Thiocolchicoside', '4 mg', 'twice a day', 'after food', '5 days'), med('Tab. Atorvastatin', '10 mg', 'once a day', 'at night', '3 months')], ['Sit with back support, stand and stretch hourly', 'Repeat lipid profile in 6 weeks'], 'Review in 3 months'],
    ['rahul_back3', 'rahul', 58, 'back pain third time this year', 'Third episode this year. No red flags. Short course of aceclofenac with paracetamol and pantoprazole for the stomach. Referred to physiotherapy for core strengthening if it returns.',
      ['Lumbar muscle strain'], [med('Tab. Aceclofenac + Paracetamol', '100/325 mg', 'twice a day', 'after food', '3 days'), med('Tab. Pantoprazole', '40 mg', 'once a day', 'before breakfast', '5 days')], ['Core exercises daily', 'Physiotherapy if pain returns'], 'Physiotherapy if pain returns'],
    ['sunita_1', 'sunita', 343, 'sugar high, BP high, tired', 'Sunita Mehra, 58. Known thyroid problem, now fasting sugar 176, HbA1c 8.7, BP 142/90, TSH 6.9. New diagnosis type 2 diabetes with hypertension, mild hypothyroidism. Start metformin 500 twice daily, telmisartan 40 morning, levothyroxine 50 mcg empty stomach. Diet advice given.',
      ['Type 2 diabetes mellitus', 'Hypertension', 'Hypothyroidism'], [med('Tab. Metformin', '500 mg', 'twice a day', 'after food', '3 months'), med('Tab. Telmisartan', '40 mg', 'once a day', 'morning', '3 months'), med('Tab. Levothyroxine', '50 mcg', 'once a day', 'empty stomach, 30 minutes before breakfast', '3 months')], ['Low sugar and low salt diet', 'Walk 30 minutes daily', 'Check fasting sugar and BP at home'], 'Review with HbA1c and TSH in 3 months'],
    ['sunita_2', 'sunita', 253, 'diabetes follow-up', 'HbA1c 8.2, fasting 158. BP 138/88. Metformin increased to 1000 mg twice daily. Keep a sugar diary. Knee pain mild, paracetamol only if needed.',
      ['Type 2 diabetes mellitus', 'Hypertension', 'Hypothyroidism'], [med('Tab. Metformin', '1000 mg', 'twice a day', 'after food', '3 months'), med('Tab. Telmisartan', '40 mg', 'once a day', 'morning', '3 months'), med('Tab. Levothyroxine', '50 mcg', 'once a day', 'empty stomach', '3 months')], ['Metformin dose increased', 'Keep a sugar diary'], 'Review in 3 months'],
    ['sunita_3', 'sunita', 163, 'tired, TSH still high', 'HbA1c 7.7, TSH 5.2, still some afternoon fatigue. Add glimepiride 1 mg before breakfast, explained low sugar signs. Raise levothyroxine to 75 mcg.',
      ['Type 2 diabetes mellitus', 'Hypertension', 'Hypothyroidism'], [med('Tab. Metformin', '1000 mg', 'twice a day', 'after food', '3 months'), med('Tab. Glimepiride', '1 mg', 'once a day', 'before breakfast', '3 months'), med('Tab. Telmisartan', '40 mg', 'once a day', 'morning', '3 months'), med('Tab. Levothyroxine', '75 mcg', 'once a day', 'empty stomach', '3 months')], ['Glimepiride added, watch for low sugar', 'Levothyroxine dose raised'], 'Review with reports in 3 months'],
    ['sunita_4', 'sunita', 73, 'quarterly diabetes review', 'HbA1c 7.2, fasting 126, BP 130/84, TSH 4.6. Improving. Continue all medicines. Annual eye and foot check due.',
      ['Type 2 diabetes mellitus', 'Hypertension', 'Hypothyroidism'], [med('Tab. Metformin', '1000 mg', 'twice a day', 'after food', '3 months'), med('Tab. Glimepiride', '1 mg', 'once a day', 'before breakfast', '3 months'), med('Tab. Telmisartan', '40 mg', 'once a day', 'morning', '3 months'), med('Tab. Levothyroxine', '75 mcg', 'once a day', 'empty stomach', '3 months')], ['Sugar and BP improving, continue same medicines', 'Annual eye and foot check'], 'Review in 3 months'],
    ['aanya_1', 'aanya', 261, 'cough at night, wheeze (regular paediatrician Dr. Khanna away)', 'Aanya, 8, night cough and wheeze for 4 days, worse in cold air. Known mild asthma and iron deficiency under Dr. Khanna, Little Steps Child Clinic. Chest has mild wheeze, no fever. Montelukast 4 mg chewable at night for 4 weeks, salbutamol inhaler with spacer as needed. Advised to follow up with Dr. Khanna.',
      ['Mild asthma flare', 'Allergic cough'], [med('Tab. Montelukast', '4 mg chewable', 'once a day', 'at night', '4 weeks'), med('Inhaler Salbutamol', '100 mcg', 'as needed (2 puffs with spacer)', 'for wheeze or night cough', 'as needed')], ['Keep her away from dust and smoke', 'Steam inhalation at night'], 'Follow up with Dr. Khanna in 4 weeks'],
    ['aanya_2', 'aanya', 155, 'iron syrup refill and Hb check', 'Hb 10.9, ferritin 20, improving. Continue iron syrup for another 3 months. Under Dr. Khanna for regular paediatric care, seen here for refill.',
      ['Iron deficiency anaemia'], [med('Syp. Ferrous Ascorbate', '30 mg/5 ml', 'once a day', 'after food', '3 months')], ['Iron-rich food: greens, jaggery, dates', 'Repeat Hb in 3 months'], 'Repeat Hb in 3 months']
  ];

  function consultFor(c) {
    const [key, who, ago, , transcript, dx, meds, advice, fu] = c, when = at(ago, 11, 20), p = P[who];
    const record = { id: 'demo_c_' + key, doc_type: 'prescription', title: 'Prescription from your doctor', date: dayKey(when), facility: 'Bansal Clinic, Sector 22, Chandigarh', doctor: 'Dr. R. K. Bansal',
      patient: p, language_detected: 'en', handwritten: false, overall_confidence: 1, tests: [], medicines: meds, diagnoses: dx.map(name => ({ name, source_text: '', confidence: 1 })),
      advice, follow_up: fu, warnings: [], unread: [], explanation: {} };
    return { id: record.id, at: when, patient: p, audio: null, transcript, record, sent: true };
  }

  /* ---------- queues: today + earlier days ---------- */
  const ENTRY = (id, name, age, cc, lv, why, ms, done) => ({ id, name, age, cc, lv, why, at: ms, done: !!done });
  const W = { major: 'Red-flag symptom', moderate: 'Needs attention today', minor: 'Routine or follow-up' };
  function todayQueue() {
    const t = h => at(0, h, (h * 7) % 50);
    return [
      ENTRY('dq_sunita', 'Sunita Mehra', '58', 'Diabetes review: sugar still high, feeling tired', 'moderate', W.moderate + ': "sugar"', t(9), false),
      ENTRY('dq_rahul', 'Rahul Mehra', '34', 'Back pain for 4 days, worse after sitting', 'moderate', W.moderate + ': "pain"', t(9) + 600000, false),
      ENTRY('dq_aanya', 'Aanya Mehra', '8', 'Cough and mild fever for 2 days (referred to Dr. Khanna, but seen today)', 'moderate', W.moderate + ': "cough"', t(10), false),
      ENTRY('dq_harpreet', 'Harpreet Singh', '52', 'Chest pain since morning', 'major', W.major + ': "chest pain"', t(8), false),
      ENTRY('dq_meena', 'Meena Kapoor', '63', 'Headache and dizziness, BP running high at home', 'moderate', W.moderate + ': "dizz"', t(10) + 900000, false),
      ENTRY('dq_simran', 'Simran Arora', '24', 'Itchy rash on arms after a new cream', 'moderate', W.moderate + ': "rash"', t(11), false),
      ENTRY('dq_kabir', 'Kabir Malhotra', '41', 'Acidity and bloating after meals', 'minor', W.minor, t(11) + 1200000, false),
      ENTRY('dq_amit', 'Amit Verma', '36', 'Thyroid report check, feeling fine', 'minor', W.minor, t(8) + 1800000, true)
    ];
  }
  function pastQueues() {  // { 'YYYY-MM-DD': [entries] }
    const q = {}, add = (ago, e) => { const k = dayKey(at(ago, 10)); (q[k] = q[k] || []).push(e); };
    CONSULTS.forEach(c => {
      const p = P[c[1]], lv = /pain|sugar|fever|cough|wheeze|BP|tired/i.test(c[3]) ? 'moderate' : 'minor';
      add(c[2], ENTRY('dh_' + c[0], p.name, p.age, c[3], lv, lv === 'moderate' ? W.moderate : W.minor, at(c[2], 10, 15), true));
    });
    [[300, 'Harpreet Singh', '52', 'Knee pain, climbing stairs', 'moderate'], [210, 'Meena Kapoor', '63', 'Blood pressure review', 'minor'], [140, 'Simran Arora', '24', 'Fever and sore throat for 2 days', 'moderate'],
     [95, 'Kabir Malhotra', '41', 'Acidity for two weeks', 'minor'], [40, 'Amit Verma', '36', 'Tiredness, thyroid test advised', 'minor'], [12, 'Meena Kapoor', '63', 'Dizziness on standing', 'moderate']]
      .forEach((x, i) => add(x[0], ENTRY('dh_o' + i, x[1], x[2], x[3], x[4], x[4] === 'moderate' ? W.moderate : W.minor, at(x[0], 12, 5), true)));
    return q;
  }
  const TODOS = [
    'Review Sunita Mehra HbA1c report', 'Call Rahul Mehra about vitamin D result', 'Send Aanya Mehra case note to Dr. S. Khanna (Little Steps Child Clinic, Zirakpur)',
    'Follow up Harpreet Singh: ECG and troponin result', 'Renew clinic BP monitor calibration', 'Dictate summary for Meena Kapoor BP diary'
  ].map((text, i) => ({ text, done: i === 4, demo: 1 }));

  /* ---------- run ---------- */
  async function seed(force) {
    const consults = CONSULTS.map(consultFor), old = await all();
    const delIds = old.filter(c => String(c.id).indexOf('demo_c_') === 0).map(c => c.id);
    await putMany(consults, delIds);
    const pq = pastQueues(), pk = Object.keys(pq);
    pk.forEach(k => { const key = 'sehat_doc_queue_' + k, keep = lsGet(key, []).filter(e => !/^d[qh]_/.test(e.id)); lsSet(key, keep.concat(pq[k])); });
    const tk = 'sehat_doc_queue_' + dayKey(Date.now()), tq = lsGet(tk, []).filter(e => !/^d[qh]_/.test(e.id));
    lsSet(tk, tq.concat(todayQueue()));
    lsSet(TK, lsGet(TK, []).filter(t => !t.demo).concat(TODOS));
    lsSet(FLAG, 1);
    const cur = document.querySelector('#nav [aria-current]'); if (cur) cur.click();  // doctor.js redraws the open section
    return consults.length + pk.reduce((n, k) => n + pq[k].length, 0) + todayQueue().length + TODOS.length;
  }
  let me = null;
  try { me = JSON.parse(localStorage.getItem('sehat_doctor') || 'null'); } catch (e) { /* private mode */ }
  const DEMO = /[?&]demo=1/.test(location.search) || !me;
  const SEED = /[?&]seed=1/.test(location.search);  // a signed-in doctor can load the sample clinic into their own workspace
  async function firstOpen() {
    if (SEED) { const n = await seed(true); if (history.replaceState) history.replaceState(null, '', location.pathname); alert('Loaded ' + n + ' sample items into your workspace.'); return; }
    if (!DEMO) return;
    const empty = !(await all()).length && !lsGet('sehat_doc_queue_' + dayKey(Date.now()), []).length && !lsGet(TK, []).length;
    if (!lsGet(FLAG, 0) && empty) await seed(false);
  }
  function chrome() {
    const who = document.querySelector('.userchip .who');
    if (!DEMO) { if (who) who.textContent = me.name || me.email; return; }
    if (who) { who.textContent = 'Dr. R. K. Bansal, MD (Medicine)'; who.title = 'Bansal Clinic, Sector 22 Chandigarh'; }
    const right = document.querySelector('.top-right'), chip = document.querySelector('.userchip');
    if (right && !document.getElementById('demoLoad')) {
      const b = document.createElement('button');
      b.type = 'button'; b.id = 'demoLoad'; b.className = 'btn small secondary'; b.textContent = 'Load demo data';
      b.title = 'Re-seed the Bansal Clinic demo: queue, past visits and to-dos';
      b.onclick = async () => { b.disabled = true; b.textContent = 'Loading…'; try { const n = await seed(true); b.textContent = 'Loaded ' + n + ' items'; } catch (e) { b.textContent = 'Failed'; console.error(e); } setTimeout(() => { b.textContent = 'Load demo data'; b.disabled = false; }, 2500); };
      right.insertBefore(b, chip || right.firstChild);
    }
  }
  chrome();
  firstOpen().catch(e => console.error('doctor-demo failed', e));
})();
