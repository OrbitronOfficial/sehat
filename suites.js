// Sehat suites: Copilot, Doctor, Nurse, Hospital, Pharmacy, Supply.
// A suite is a tabbed agent; each tab is a feature view (some shared with the single agents in app.js).
const suiteTab = {};
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toTimeString().slice(0, 5);

SUITES.forEach(s => {
  V[s.id] = () => {
    const t = suiteTab[s.id] || s.tabs[0][0];
    return `<div class="hero-card"><span class="eyebrow">${s.for.map(r => ROLES[r].label).join(' · ')} suite · ${R.org}</span><h2>${s.name}</h2><p>${s.desc}</p><span class="orbic">${s.ic}</span></div>
      <div class="tabs">${s.tabs.map(([k, l]) => `<button class="${k === t ? 'on' : ''}" onclick="suiteTab['${s.id}']='${k}';render()">${l}</button>`).join('')}</div>` +
      (V[t] ? V[t]() : '');
  };
  V[s.id].after = () => { const t = suiteTab[s.id] || s.tabs[0][0]; V[t]?.after?.(); };
});
function openTab(suite, tab) { suiteTab[suite] = tab; go(suite); }

// ---------- marketplace: suites first ----------
V.market = () => {
  // Each role sees only what it can install: its own suite and the single agents made for it.
  const mine = a => a.for.includes(role), suites = SUITES.filter(mine), agents = AGENTS.filter(mine);
  const card = (a, big) => { const on = installed().includes(a.id);
    return `<div class="card agent" style="${big ? 'border-color:var(--pri);background:linear-gradient(180deg,var(--soft),var(--card))' : ''}"><span class="ic">${a.ic}</span><div class="row"><b>${a.name}</b><span class="sp"></span><span class="pill">${a.cat || 'Suite · ' + a.tabs.length + ' tools'}</span></div><p>${a.desc}</p>
      <div class="row"><span class="muted">${a.price}</span><span class="sp"></span><button class="btn sm ${on ? 'ghost' : ''}" onclick="toggle('${a.id}')">${on ? 'Remove' : 'Install'}</button></div></div>`; };
  return head('Agent Marketplace', `Everything made for a ${R.label.toLowerCase()}. Install the full suite, or only the single agents you need.`) +
    (suites.length ? `<h3 style="margin-bottom:12px">Your suite</h3><div class="grid g3">${suites.map(s => card(s, true)).join('')}</div>` : '') +
    (agents.length ? `<h3 style="margin:26px 0 12px">Single agents for ${R.label.toLowerCase()}s</h3><div class="grid g3">${agents.map(a => card(a)).join('')}</div>` : '');
};

// ---------- Sehat Copilot (patient) ----------
V.records = () => head('Records & OCR', 'Upload a photo or PDF of a lab report or prescription. AI reads it and explains it in your language.') +
  `<style>
  .rc-drop{display:flex;flex-direction:column;align-items:center;gap:6px;padding:26px 18px;border:1.5px dashed rgba(7,116,196,.35);border-radius:20px;background:linear-gradient(180deg,rgba(234,243,254,.7),rgba(255,255,255,.4));cursor:pointer;text-align:center;transition:border-color .2s}
  .rc-drop:hover{border-color:var(--teal)}.rc-drop b{font-family:var(--display)}.rc-drop input{display:none}
  .rc-bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:14px}.rc-bar select{width:auto}
  .rc-st{margin-top:10px;font-size:.88rem;color:var(--muted);min-height:20px}
  .rc-pt{display:flex;gap:12px;align-items:center;padding:12px 14px;border-radius:16px;background:var(--teal-tint);margin-bottom:12px}.rc-pt .av{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:#fff;font-size:20px}
  .rc-med{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--line)}.rc-med:last-child{border:0}
  .rc-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:4px}.rc-chips span{font-size:.76rem;padding:2px 8px;border-radius:999px;background:var(--teal-tint);color:var(--teal-dark);font-weight:600}
  .rc-sec{font-family:var(--mono);font-size:.68rem;letter-spacing:.14em;text-transform:uppercase;color:var(--teal);margin:16px 0 6px}
  .rc-x p{margin:4px 0}.rc-x ul{margin:4px 0 0;padding-left:18px}
  </style>
  <div class="grid g2"><div class="card">
    <label class="rc-drop" for="oc_f"><span style="font-size:30px">📄</span><b id="oc_n">Choose a photo or PDF</b><span class="muted">Lab report, prescription or discharge summary</span><input type="file" id="oc_f" accept="image/*,application/pdf" onchange="$('#oc_n').textContent=this.files[0]?.name||'Choose a photo or PDF'"></label>
    <div class="rc-bar"><select id="lb_l" aria-label="Explain in">${[['en', 'English'], ['hi', 'हिन्दी'], ['pa', 'ਪੰਜਾਬੀ'], ['bn', 'বাংলা'], ['ta', 'தமிழ்'], ['te', 'తెలుగు'], ['mr', 'मराठी'], ['gu', 'ગુજરાતી'], ['kn', 'ಕನ್ನಡ'], ['ml', 'മലയാളം']].map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>
      <button class="btn" onclick="ocRead()">✨ Read with AI</button></div>
    <div class="rc-st" id="oc_p"></div>
    <details style="margin-top:6px"><summary class="muted" style="cursor:pointer">Or paste report text</summary>
      <textarea id="lb_t" style="min-height:120px;margin-top:8px" placeholder="Haemoglobin 10.4 g/dL&#10;Fasting Blood Sugar 118 mg/dL"></textarea>
      <button class="btn sm ghost" style="margin-top:8px" onclick="ocRec=null;ocExplain()">Explain this text</button></details>
  </div>
  <div class="card" id="lb_o"><p class="muted">Your report, read and explained, appears here.</p></div></div>`;
// The live store re-renders the page on every change (a save, another tab): keep the result on screen.
let ocLast = null;
const ocKeep = () => { ocLast = { o: $('#lb_o').innerHTML, p: $('#oc_p').innerHTML, l: $('#lb_l').value, n: $('#oc_n').textContent }; };
V.records.after = () => { if (!ocLast) return; $('#lb_o').innerHTML = ocLast.o; $('#oc_p').innerHTML = ocLast.p; $('#lb_l').value = ocLast.l; $('#oc_n').textContent = ocLast.n; };
// The AI reader (/api/extract) reads photos and PDFs, lab reports or prescriptions; /api/explain writes the
// explanation in the chosen language. Without AI, the on-device OCR + lab-value checker is the backup.
let ocRec = null;
const fileToData = f => new Promise((res, rej) => {
  if (f.type === 'application/pdf') { const r = new FileReader(); r.onload = () => res({ mime: 'application/pdf', data: String(r.result).split(',')[1] }); r.onerror = rej; return r.readAsDataURL(f); }
  const img = new Image(); img.onload = () => { const k = Math.min(1, 1800 / Math.max(img.width, img.height)), c = document.createElement('canvas');
    c.width = img.width * k; c.height = img.height * k; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(img.src);
    res({ mime: 'image/jpeg', data: c.toDataURL('image/jpeg', .88).split(',')[1] }); };
  img.onerror = rej; img.src = URL.createObjectURL(f);
});
const postJSON = async (url, body) => { const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || 'AI unavailable'); return j; };
function recText(r) {
  return [...(r.tests || []).map(t => `${t.name} ${t.value ?? ''} ${t.unit || ''}`.trim()), ...(r.medicines || []).map(m => [m.name, m.strength, m.dose, m.frequency, m.duration].filter(Boolean).join(' · ')),
    ...(r.diagnoses || []).map(d => 'Diagnosis: ' + d.name), r.advice ? 'Advice: ' + r.advice : ''].filter(Boolean).join('\n');
}
async function ocRead() {
  const f = $('#oc_f').files[0]; if (!f) return toast('Choose a photo or PDF first');
  $('#oc_p').innerHTML = '<span class="pill">⏳ Reading with AI…</span>'; ocRec = null; $('#lb_o').innerHTML = '<p class="muted">Reading your document…</p>';
  try {
    const { mime, data } = await fileToData(f);
    const res = await postJSON('/api/extract', { filename: f.name, mime, data, lang: $('#lb_l').value });
    ocRec = res.record; $('#lb_t').value = recText(ocRec);
    $('#oc_p').innerHTML = `<span class="pill ok">✓ Read by AI</span> ${(ocRec.tests || []).length} tests · ${(ocRec.medicines || []).length} medicines`; ocExplain();
  } catch (e) {
    if (f.type === 'application/pdf' || !window.Tesseract) { $('#oc_p').textContent = 'AI reader is busy. Try again in a minute.'; return; }
    $('#oc_p').textContent = 'AI busy · reading on this device… 0%';
    try {
      const { data } = await Tesseract.recognize(f, 'eng', { logger: m => { if (m.status === 'recognizing text') $('#oc_p').textContent = 'Reading on this device… ' + Math.round(m.progress * 100) + '%'; } });
      $('#lb_t').value = data.text.trim(); $('#oc_p').textContent = `Read on this device · ${Math.round(data.confidence)}% confidence (less accurate)`; document.querySelector('details') && (document.querySelector('details').open = true); lbParse().length ? lbRun() : ($('#lb_o').innerHTML = '<p class="muted">The device reader could not find clear values. Try again when the AI reader is free.</p>');
    } catch (e2) { $('#oc_p').textContent = 'Could not read this file: ' + e2.message; }
  }
}
async function ocExplain() {
  const lang = $('#lb_l').value, out = $('#lb_o'), cls = { critical: 'bad', high: 'warn', low: 'warn', normal: 'ok', unknown: '' };
  if (!ocRec) {  // pasted text: lab values are checked here; anything else is read by the AI first
    if (!$('#lb_t').value.trim()) return toast('Choose a file or paste text first');
    if (lbParse().length) return lbRun();
    out.innerHTML = '<p class="muted">Reading the text with AI…</p>';
    try { ocRec = (await postJSON('/api/extract', { filename: 'pasted.txt', mime: 'text/plain', data: textToB64($('#lb_t').value), lang })).record; }
    catch (e) { out.innerHTML = '<p class="muted">No lab values found in this text, and the AI reader is busy. Try a clearer photo or paste values like "Haemoglobin 10.4 g/dL".</p>'; return; }
  }
  const r = ocRec, pt = r.patient || {}, tests = r.tests || [], meds = r.medicines || [];
  const meta = [pt.age, pt.sex, r.doctor, r.date].filter(Boolean).map(esc).join(' · ');
  out.innerHTML = `<div class="row" style="margin-bottom:10px"><h3>${esc(r.title || 'Your document')}</h3><span class="sp"></span><button class="btn sm ghost" onclick="ocSave()">📔 Save to journal</button></div>` +
    (pt.name || meta ? `<div class="rc-pt"><span class="av">👤</span><div><b>${esc(pt.name || 'Patient')}</b><br><span class="muted">${meta}</span></div></div>` : '') +
    (tests.length ? '<div class="rc-sec">Test results</div>' + tests.map(t => `<div class="rc-med"><div style="flex:1"><b>${esc(t.name)}</b> ${esc(t.value ?? '')} ${esc(t.unit || '')}${t.ref_text ? `<br><small class="muted">Normal ${esc(t.ref_text)}</small>` : ''}</div><span class="pill ${cls[t.flag] ?? ''}">${esc(t.flag || 'unknown')}</span></div>`).join('') : '') +
    (meds.length ? '<div class="rc-sec">Medicines</div>' + meds.map(m => `<div class="rc-med"><span style="font-size:20px">💊</span><div style="flex:1"><b>${esc(m.name)}</b>${m.strength ? ` <span class="muted">${esc(m.strength)}</span>` : ''}<div class="rc-chips">${[m.dose, m.frequency, m.timing, m.duration].filter(Boolean).map(x => `<span>${esc(x)}</span>`).join('')}</div><small class="muted" data-purpose="${esc(m.name)}"></small></div></div>`).join('') : '') +
    (!tests.length && !meds.length ? '<p class="muted">Nothing readable was found. Try a sharper, well-lit photo.</p>' : '') +
    '<div class="ai rc-x" id="oc_x" style="margin-top:14px"><span style="font-size:22px">🤖</span><div><span class="eyebrow">AI explanation</span><p class="muted">Writing it in your language…</p></div></div>';
  try {
    const x = (await postJSON('/api/explain', { record: r, lang })).explanation || {};
    (x.medicines || []).forEach(m => { const el = [...out.querySelectorAll('[data-purpose]')].find(e => e.dataset.purpose === m.name); if (el) el.textContent = m.purpose; });
    const findings = tests.length ? (x.findings || []).filter(f => tests.some(t => t.name === f.name)) : [];  // no test results, no "all normal" line
    $('#oc_x').innerHTML = `<span style="font-size:22px">🤖</span><div><span class="eyebrow">AI explanation</span><p>${esc(x.summary || '')}</p>` +
      (findings.length ? findings.map(f => `<p><b>${esc(f.name)}</b>: ${esc(f.meaning)}</p>`).join('') : '') +
      ((x.questions || []).length ? `<div class="rc-sec">Ask your doctor</div><ul>${x.questions.map(q => `<li>${esc(q)}</li>`).join('')}</ul>` : '') +
      '<p class="muted" style="margin-top:10px">Explains, never diagnoses. Show this to your doctor.</p></div>'; ocKeep();
  } catch (e) { $('#oc_x').innerHTML = '<span style="font-size:22px">🤖</span><div><span class="eyebrow">AI explanation</span><p class="muted">The explanation is busy right now. The values above are read and flagged.</p></div>'; ocKeep(); }
}
// Save what was read: an AI-read record (tests or medicines), else the lab values typed or pasted.
function ocSave() {
  const r = ocRec, today = new Date().toISOString().slice(0, 10);
  if (r && ((r.tests || []).length || (r.medicines || []).length)) {
    const parts = [...(r.tests || []).map(t => `${t.name} ${t.value ?? ''} ${t.unit || ''} (${t.flag || 'unknown'})`.replace(/\s+/g, ' ')), ...(r.medicines || []).map(m => [m.name, m.dose, m.frequency, m.duration].filter(Boolean).join(' '))];
    const who = (r.patient || {}).name ? ` for ${r.patient.name}` : '';
    act(`saved ${r.doc_type || 'a record'}${who} to the journal`, d => d.journal.unshift({ date: r.date || today, type: (r.tests || []).length ? 'Lab' : 'Prescription', text: `${r.title || 'Record'}${who}: ${parts.join(', ')}` }));
    return toast('Saved to journal');
  }
  const rows = lbParse();
  if (!rows.length) return toast('Read a report first. Nothing to save yet.');
  lbSave(); toast('Saved to journal');
}
function textToB64(t) { return btoa(String.fromCharCode(...new TextEncoder().encode(t))); }

V.family = () => head('Family', 'One account for the whole family. Each member has their own records and reminders.') +
  `<div class="grid g3">${Store.db.family.map((m, i) => `<div class="card"><div class="row"><span style="font-size:28px">${m.age < 12 ? '🧒' : m.age > 55 ? '👵' : '🧑'}</span><div><b>${esc(m.name)}</b><br><span class="muted">${m.rel} · ${m.age} y</span></div></div>
    <p style="margin:10px 0 6px"><span class="pill">${esc(m.cond)}</span></p><span class="muted">${Store.db.reminders.filter(r => r.who === m.name).length} reminders · ${Store.db.appointments.filter(a => a.patient === m.name).length} visits</span></div>`).join('')}
   <div class="card"><b>Add member</b><input id="fm_n" placeholder="Name" style="margin-top:8px"><div class="row" style="margin-top:8px"><input id="fm_r" placeholder="Relation" style="flex:1"><input id="fm_a" type="number" placeholder="Age" style="width:80px"></div><button class="btn sm" style="margin-top:8px" onclick="fmAdd()">Add</button></div></div>`;
function fmAdd() { const n = $('#fm_n').value.trim(); if (n) act(`added ${n} to the family`, d => d.family.push({ name: n, rel: $('#fm_r').value || 'Family', age: +$('#fm_a').value || 0, cond: 'No conditions noted' })); }

V.reminders = () => {
  const r = Store.db.reminders, rx = Store.db.prescriptions.filter(p => Store.db.family.some(f => f.name === p.patient));
  return head('Medicine reminders', 'Reminders are created automatically from every prescription. Tap when taken.') +
    `<div class="grid g2"><div class="card"><h3>Today</h3>${r.map((x, i) => { const tk = x.taken.includes(today());
      return `<div class="row" style="padding:10px 0;border-bottom:1px solid var(--line)"><b>${x.time}</b><div>${esc(x.med)}<br><span class="muted">${esc(x.who)}</span></div><span class="sp"></span>${tk ? '<span class="pill ok">Taken ✓</span>' : `<button class="btn sm" onclick="rmTake(${i})">Mark taken</button>`}</div>`; }).join('') || '<p class="muted">No reminders.</p>'}</div>
     <div class="card"><h3>From prescriptions</h3>${rx.map(p => `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><b>${p.id}</b> · ${esc(p.patient)}<br>${p.meds.map(m => `<span class="pill" style="margin:3px 3px 0 0">${esc(m.name)} · ${esc(m.dose)}</span>`).join('')}<br><button class="btn sm ghost" style="margin-top:6px" onclick="rmFrom('${p.id}')">Create reminders</button></div>`).join('') || '<p class="muted">New prescriptions will show here.</p>'}</div></div>`;
};
function rmTake(i) { act(`took ${Store.db.reminders[i].med}`, d => d.reminders[i].taken.push(today())); }
function rmFrom(pid) {
  act(`set reminders for ${pid}`, d => { const p = d.prescriptions.find(x => x.id === pid);
    p.meds.forEach(m => { const slots = (m.dose.match(/^(\d)-(\d)-(\d)/) || [0, 1, 0, 0]).slice(1).map(Number); ['08:30', '14:00', '21:00'].forEach((t, i) => { if (slots[i] && !d.reminders.some(r => r.med === m.name && r.time === t)) d.reminders.push({ med: m.name, time: t, who: p.patient, taken: [] }); }); }); });
  toast('Reminders created');
}

// ---------- Sehat Doctor ----------
V.consult = () => {
  const d = Store.db, urg = a => (/chest|breath|bleed|faint/i.test(a.reason) ? 30 : 0) + (a.status === 'checked-in' ? 5 : 0);
  const q = d.appointments.filter(a => a.status !== 'done' && (role !== 'doctor' || a.doctor === R.org)).sort((a, b) => urg(b) - urg(a));
  return head('Consult queue', 'Patients sorted by urgency. Your note creates the prescription and the nurse\'s tasks in one go.') +
    `<div class="grid g2"><div class="card"><h3>Waiting (${q.length})</h3>${q.map((a, i) => `<div class="row" style="padding:9px 0;border-bottom:1px solid var(--line)"><span class="pill ${urg(a) >= 30 ? 'bad' : urg(a) >= 5 ? 'warn' : ''}">${urg(a) >= 30 ? 'urgent' : a.status}</span><div><b>${esc(a.patient)}</b> · ${a.slot}<br><span class="muted">${esc(a.reason)}</span></div><span class="sp"></span><button class="btn sm ghost" onclick="$('#cs_p').value='${esc(a.patient)}'">Open</button></div>`).join('') || '<p class="muted">Queue is clear.</p>'}</div>
     <div class="card"><h3>Consultation note</h3><label>Patient</label><select id="cs_p">${q.map(a => `<option>${esc(a.patient)}</option>`).join('')}</select>
      <label>Findings</label><textarea id="cs_n">Fever 101°F for 3 days, throat congested, chest clear. Likely viral.</textarea>
      <label>Orders for the nurse</label>${['Check temperature every 6 hours', 'Start IV fluids', 'Collect blood sample (CBC)', 'Give first dose now'].map((o, i) => `<label style="display:flex;gap:8px;margin:4px 0;color:var(--txt)"><input type="checkbox" class="cs_o" value="${o}" style="width:auto" ${i === 0 ? 'checked' : ''}>${o}</label>`).join('')}
      <button class="btn" style="margin-top:10px" onclick="csSave()">Save note → write prescription</button></div></div>`;
};
function csSave() {
  const p = $('#cs_p').value; if (!p) return toast('No patient selected');
  const orders = [...document.querySelectorAll('.cs_o:checked')].map(x => x.value), note = $('#cs_n').value;
  act(`saved consult for ${p}, ${orders.length} nurse task(s)`, d => {
    d.journal.unshift({ date: today(), type: 'Consult', text: `${p}: ${note} (${R.org})` });
    orders.forEach(o => d.tasks.push({ id: id('N'), patient: p, bed: 'OPD', text: o, due: now(), by: R.org, done: null }));
  });
  suiteTab.sehat_doctor = 'rxwriter'; render();
  setTimeout(() => { const s = $('#rx_p'); if (s) s.value = p; const dx = $('#rx_dx'); if (dx) dx.value = note.split('.').slice(-2, -1)[0]?.trim() || 'As per consult'; }, 0);
}
V.history = () => {
  const names = [...new Set(Store.db.appointments.map(a => a.patient))], sel = window.histP || names[0];
  return head('Patient history', 'Everything about a patient on one screen: visits, prescriptions, notes, labs, nurse tasks.') +
    `<select onchange="histP=this.value;render()" style="max-width:300px">${names.map(n => `<option ${n === sel ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select>
    <div class="grid g2" style="margin-top:14px"><div class="card"><h3>Visits & prescriptions</h3>${Store.db.appointments.filter(a => a.patient === sel).map(a => `<p>📅 ${a.date} ${a.slot} · ${esc(a.doctor)} — ${esc(a.reason)}</p>`).join('')}${Store.db.prescriptions.filter(p => p.patient === sel).map(p => `<p>💊 ${p.id}: ${p.meds.map(m => esc(m.name)).join(', ')} ${statusPill(p.status)}</p>`).join('')}</div>
     <div class="card"><h3>Notes, labs & tasks</h3>${((Store.db.dj || {})[sel] || []).slice(-3).reverse().map(e => `<p>📔 <b>Check-in ${e.date.slice(5)}</b>: mood ${e.mood}/5 · pain ${e.pain}/5 · sleep ${e.sleep}/5${e.syms.length ? ' · ' + esc(e.syms.join(', ')) : ''}${e.meds !== 'yes' ? ' · <span class="pill warn">medicines ' + e.meds + '</span>' : ''}</p>`).join('')}${Store.db.journal.filter(j => j.text.includes(sel) || sel === ROLES.patient.org).slice(0, 8).map(j => `<p><span class="pill">${j.type}</span> ${esc(j.text)}</p>`).join('')}${Store.db.tasks.filter(t => t.patient === sel).map(t => `<p>🧑‍⚕️ ${esc(t.text)} ${t.done ? '<span class="pill ok">done</span>' : '<span class="pill warn">pending</span>'}</p>`).join('') || ''}</div></div>`;
};

// ---------- Sehat Nurse ----------
V.tasks = () => {
  const open = Store.db.tasks.filter(t => !t.done);
  return head('Ward to-do', 'Tasks arrive from doctors\' consultation notes. Tick them off; the doctor sees it instantly.') +
    `<div class="card">${open.map(t => `<div class="row" style="padding:10px 0;border-bottom:1px solid var(--line)"><span class="pill warn">${t.due}</span><div><b>${esc(t.text)}</b><br><span class="muted">${esc(t.patient)} · ${t.bed} · ordered by ${esc(t.by)}</span></div><span class="sp"></span><button class="btn sm" onclick="tkDone('${t.id}')">Done ✓</button></div>`).join('') || '<p class="muted">All tasks done. 🎉</p>'}</div>`;
};
function tkDone(tid) { act('completed a ward task', d => { const t = d.tasks.find(x => x.id === tid); t.done = { at: Date.now(), by: R.org }; }); }
V.vitals = () => head('Record vitals', 'Vitals go straight into the patient\'s record and are flagged if out of range.') +
  `<div class="card" style="max-width:560px"><label>Patient</label><select id="vt_p">${[...new Set(Store.db.appointments.map(a => a.patient))].map(n => `<option>${esc(n)}</option>`).join('')}</select>
   <div class="grid g4"><div><label>Temp °F</label><input id="vt_t" type="number" value="100.4"></div><div><label>Pulse</label><input id="vt_h" type="number" value="96"></div><div><label>BP sys</label><input id="vt_b" type="number" value="132"></div><div><label>SpO₂</label><input id="vt_o" type="number" value="97"></div></div>
   <button class="btn" style="margin-top:12px" onclick="vtSave()">Save vitals</button></div>`;
function vtSave() {
  const p = $('#vt_p').value, t = +$('#vt_t').value, h = +$('#vt_h').value, b = +$('#vt_b').value, o = +$('#vt_o').value, fl = [];
  if (t >= 100.4) fl.push('fever'); if (h > 100) fl.push('high pulse'); if (b >= 140) fl.push('high BP'); if (o < 94) fl.push('low SpO₂');
  act(`recorded vitals for ${p}${fl.length ? ' ⚠ ' + fl.join(', ') : ''}`, d => d.journal.unshift({ date: today(), type: 'Vitals', text: `${p}: T ${t}°F, P ${h}, BP ${b}, SpO₂ ${o}%${fl.length ? ' — ' + fl.join(', ') : ''}` }));
  toast(fl.length ? 'Saved · flagged: ' + fl.join(', ') : 'Vitals saved');
}
V.taskhistory = () => {
  const done = Store.db.tasks.filter(t => t.done).sort((a, b) => b.done.at - a.done.at);
  return head('Task history', 'Who did what, and when.') +
    `<div class="card"><table><tr><th>Done at</th><th>Task</th><th>Patient</th><th>By</th></tr>${done.map(t => `<tr><td>${new Date(t.done.at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</td><td>${esc(t.text)}</td><td>${esc(t.patient)}</td><td>${esc(t.done.by)}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">Nothing completed yet.</td></tr>'}</table></div>`;
};

// ---------- Sehat Hospital ----------
V.command = () => {
  const d = Store.db, beds = Object.values(d.beds), tot = beds.reduce((s, b) => s + b[0], 0), occ = beds.reduce((s, b) => s + b[1], 0);
  const k = [['Bed occupancy', Math.round(occ / tot * 100) + '%'], ['OPD today', d.appointments.length], ['Staff on duty', (d.roster || []).filter(p => p.on).length], ['Open ward tasks', d.tasks.filter(t => !t.done).length], ['Low-stock items', Object.values(d.stock).filter(s => s.qty < s.min).length], ['Prescriptions to pharmacy', d.prescriptions.length]];
  return head('Command centre', 'The whole hospital on one screen, updated live by every agent.') +
    `<div class="grid g3">${k.map(([l, v]) => `<div class="card kpi"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
    <div class="grid g2" style="margin-top:14px"><div class="card"><h3>Departments</h3>${Object.entries(d.beds).map(([n, [t, o]]) => `<div style="margin:8px 0"><div class="row"><b>${n}</b><span class="sp"></span><span class="muted">${o}/${t}</span></div><div class="steps"><span class="on" style="flex:${o}"></span><span style="flex:${t - o}"></span></div></div>`).join('')}</div>
     <div class="card"><h3>Live activity</h3><div class="feed">${d.activity.slice(0, 8).map(a => `<div><b>${esc(a.who)}</b> ${esc(a.text)}<br><small>${ago(a.t)}</small></div>`).join('')}</div></div></div>`;
};
V.beds = () => head('Beds', 'Admit and discharge. Occupancy updates the command centre instantly.') +
  `<div class="grid g3">${Object.entries(Store.db.beds).map(([n, [t, o]]) => `<div class="card"><div class="row"><h3>${n}</h3><span class="sp"></span><span class="pill ${o / t > .85 ? 'bad' : o / t > .6 ? 'warn' : 'ok'}">${t - o} free</span></div>
    <p class="muted">${o} of ${t} occupied</p><div class="row"><button class="btn sm" onclick="bdMove('${n}',1)" ${o >= t ? 'disabled' : ''}>Admit</button><button class="btn sm ghost" onclick="bdMove('${n}',-1)" ${o <= 0 ? 'disabled' : ''}>Discharge</button></div></div>`).join('')}</div>`;
function bdMove(n, k) { act(`${k > 0 ? 'admitted a patient to' : 'discharged a patient from'} ${n}`, d => { d.beds[n][1] += k; }); }

// ---------- Sehat Pharmacy: expiry + refills ----------
const daysTo = d => Math.ceil((new Date(d) - new Date(today())) / 864e5);
V.expiry = () => {
  const b = [...Store.db.batches].sort((x, y) => x.exp.localeCompare(y.exp));
  return head('Expiry tracker', 'Batches sorted by expiry. Sell near-expiry stock first, or send it back to the distributor before it is wasted.') +
    `<div class="card"><table><tr><th>Medicine</th><th>Batch</th><th>Qty</th><th>Expires</th><th></th></tr>${b.map(x => { const n = daysTo(x.exp);
      return `<tr><td>${esc(x.med)}</td><td class="muted">${x.batch}</td><td>${x.qty}</td><td><span class="pill ${n <= 30 ? 'bad' : n <= 90 ? 'warn' : 'ok'}">${n < 0 ? 'expired' : n + ' days'}</span></td>
        <td>${x.ret ? '<span class="pill">return requested</span>' : n <= 90 ? `<button class="btn sm ghost" onclick="exReturn('${x.batch}')">Return to distributor</button>` : ''}</td></tr>`; }).join('')}</table></div>`;
};
function exReturn(bt) { act(`requested return of batch ${bt}`, d => { d.batches.find(x => x.batch === bt).ret = true; }); toast('Return request sent'); }
V.refills = () => head('Refills due', 'Patients on long-term medicines who run out soon. Pack it before they ask.') +
  `<div class="card">${Store.db.refills.map((r, i) => `<div class="row" style="padding:10px 0;border-bottom:1px solid var(--line)"><span class="pill ${r.due <= 1 ? 'bad' : r.due <= 3 ? 'warn' : ''}">${r.due === 0 ? 'today' : 'in ' + r.due + ' d'}</span><div><b>${esc(r.patient)}</b><br><span class="muted">${esc(r.med)} × ${r.qty}</span></div><span class="sp"></span>
    ${r.done ? '<span class="pill ok">' + r.done + '</span>' : `<button class="btn sm ghost" onclick="rfDo(${i},'Reminder sent')">Send reminder</button><button class="btn sm" onclick="rfDo(${i},'Packed')">Pack refill</button>`}</div>`).join('')}</div>`;
function rfDo(i, what) { act(`${what.toLowerCase()} for ${Store.db.refills[i].patient}'s ${Store.db.refills[i].med}`, d => { d.refills[i].done = what; }); }

// ---------- Sehat Hospital: duty roster ----------
V.roster = () => head('Duty roster', 'Who is on shift right now. Toggle anyone on or off duty.') +
  `<div class="grid g3">${Store.db.roster.map((p, i) => `<div class="card"><div class="row"><b>${esc(p.name)}</b><span class="sp"></span><span class="pill ${p.on ? 'ok' : ''}">${p.on ? 'on duty' : 'off'}</span></div><p class="muted" style="margin:6px 0 10px">${esc(p.role)} · ${esc(p.shift)}</p>
    <button class="btn sm ghost" onclick="rsToggle(${i})">${p.on ? 'Mark off duty' : 'Mark on duty'}</button></div>`).join('')}</div>`;
function rsToggle(i) { const p = Store.db.roster[i]; act(`marked ${p.name} ${p.on ? 'off' : 'on'} duty`, d => { d.roster[i].on = !d.roster[i].on; }); }

// ---------- Sehat Nurse: medicine round + shift handover ----------
V.mar = () => head('Medicine round', 'Each due dose on the ward. Mark it given and the time and nurse are recorded.') +
  `<div class="card"><table><tr><th>Time</th><th>Patient</th><th>Medicine</th><th></th></tr>${Store.db.mar.map((m, i) => [m, i]).sort((a, b) => a[0].time.localeCompare(b[0].time)).map(([m, i]) => `<tr><td><b>${m.time}</b></td><td>${esc(m.patient)}<br><span class="muted">${m.bed}</span></td><td>${esc(m.med)}<br><span class="muted">${esc(m.dose)}</span></td>
    <td>${m.given ? `<span class="pill ${m.given.held ? 'warn' : 'ok'}">${m.given.held ? 'held' : 'given'} ${m.given.at} · ${esc(m.given.by)}</span>` : `<button class="btn sm" onclick="marGive(${i})">Given ✓</button> <button class="link" onclick="marGive(${i},1)">Hold</button>`}</td></tr>`).join('')}</table></div>`;
function marGive(i, held) { const m = Store.db.mar[i]; act(`${held ? 'held' : 'gave'} ${m.med} for ${m.patient}`, d => { d.mar[i].given = { at: now(), by: R.org, held: !!held }; }); }
V.handover = () => {
  const open = Store.db.tasks.filter(t => !t.done), due = Store.db.mar.filter(m => !m.given);
  return head('Shift handover', 'Pre-filled from open tasks and pending doses. Add your notes, then hand over.') +
    `<div class="grid g2"><div class="card"><h3>Auto summary</h3><p class="muted">${open.length} open task(s) · ${due.length} dose(s) not yet given</p>
      <ul>${open.map(t => `<li>${esc(t.patient)} (${t.bed}): ${esc(t.text)}</li>`).join('')}${due.map(m => `<li>${esc(m.patient)}: ${esc(m.med)} due ${m.time}</li>`).join('')}</ul>
      <label>Notes for the next shift</label><textarea id="ho_n" placeholder="e.g. B-12 had a headache at 18:00, BP rechecked 138/88"></textarea>
      <button class="btn" style="margin-top:10px" onclick="hoSave()">Hand over</button></div>
     <div class="card"><h3>Past handovers</h3>${Store.db.handover.map(h => `<div style="padding:9px 0;border-bottom:1px solid var(--line)"><b>${esc(h.by)}</b> <small class="muted">${new Date(h.t).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</small><br>${esc(h.summary)}${h.note ? '<br>📝 ' + esc(h.note) : ''}</div>`).join('') || '<p class="muted">None yet.</p>'}</div></div>`;
};
function hoSave() {
  const open = Store.db.tasks.filter(t => !t.done).length, due = Store.db.mar.filter(m => !m.given).length, note = $('#ho_n').value.trim();
  act('handed over the shift', d => d.handover.unshift({ t: Date.now(), by: R.org, summary: `${open} open task(s), ${due} dose(s) pending`, note }));
  toast('Shift handed over');
}

// ---------- Sehat Supply (distributor) ----------
const myPOs = () => Store.db.pos.filter(p => p.supplier === R.org && p.status !== 'draft');  // drafts stay with the pharmacy until sent
const coverTxt = c => c == null ? '—' : c <= 0 ? 'out of stock' : c === 1 ? '1 day of cover' : c + ' days of cover';
const etaMin = p => Math.max(1, Math.round((p.eta - Date.now()) / 60000));
const sortPO = (a, b) => PO_STEPS.indexOf(a.status) - PO_STEPS.indexOf(b.status) || (a.urgency ?? 99) - (b.urgency ?? 99);
V.poinbox = () => head('📥 Purchase order inbox', 'Orders from pharmacies and hospitals on Sehat arrive here the moment they are sent, most urgent first.') +
  (myPOs().sort(sortPO).map(p => `<div class="card" style="margin-bottom:14px"><div class="row"><h3>${p.id}</h3><span class="pill ${p.urgency <= 1 ? 'bad' : p.urgency <= 4 ? 'warn' : ''}">${coverTxt(p.urgency)}</span><span class="sp"></span>${statusPill(p.status)}</div>
    <p class="muted" style="margin:6px 0 0">${ROLES[p.fromRole]?.ic || '🏪'} <b style="color:var(--ink)">${esc(p.from || 'Jain Medicos')}</b> · ${p.km != null ? p.km + ' km away' : 'distance unknown'}${p.t ? ' · requested ' + new Date(p.t).toLocaleTimeString('en-IN', { timeStyle: 'short' }) + ' (' + ago(p.t) + ')' : ''}</p>
    ${poSteps(p)}
    <table><tr><th>Item</th><th>Qty</th><th>Their cover</th><th>Our warehouse</th></tr>${p.items.map(i => { const w = Store.db.warehouse[i.n] ?? 0; return `<tr><td>${esc(i.n)}</td><td><b>${i.q}</b></td><td>${coverTxt(i.cover)}</td><td><span class="pill ${w >= i.q || p.status === 'dispatched' || p.status === 'delivered' ? 'ok' : 'bad'}">${w >= i.q ? w + ' available' : 'short (' + w + ')'}</span></td></tr>`; }).join('')}</table>
    <div class="row" style="margin-top:12px">${p.status === 'sent' ? `<button class="btn sm" onclick="spAccept('${p.id}')">Accept order</button>` : ''}
      ${p.status === 'accepted' ? `<select id="veh_${p.id}" style="width:auto">${VEHICLES.map(v => `<option>${v}</option>`).join('')}</select><select id="eta_${p.id}" style="width:auto">${[30, 45, 60, 90, 120].map(m => `<option value="${m}">ETA ${m} min</option>`).join('')}</select><button class="btn sm" onclick="spDispatch('${p.id}')">🚚 Dispatch</button>` : ''}
      ${p.status === 'dispatched' ? `<span class="muted">🚚 ${esc(p.vehicle)} · ETA ~${etaMin(p)} min</span><button class="btn sm" onclick="spDeliver('${p.id}')">Delivered ✓</button>` : ''}
      ${p.status === 'delivered' ? `<span class="muted">Delivered ${p.deliveredAt ? ago(p.deliveredAt) : ''} · ${esc(p.from)}'s stock updated</span>` : ''}</div></div>`).join('')
    || '<div class="card"><p class="muted">No purchase orders yet. In another tab, open Sehat Pharmacy → Supply chain and draft POs; they land here live.</p></div>');
function spAccept(pid) { act(`accepted ${pid}`, d => { d.pos.find(p => p.id === pid).status = 'accepted'; }); toast('Order accepted'); }
function spDispatch(pid) {
  const v = $('#veh_' + pid).value, m = +$('#eta_' + pid).value;
  act(`dispatched ${pid} · ${v} · ETA ${m} min`, d => { const p = d.pos.find(x => x.id === pid); Object.assign(p, { status: 'dispatched', vehicle: v, eta: Date.now() + m * 60000, dispatchedAt: Date.now() }); p.items.forEach(i => { if (d.warehouse[i.n] != null) d.warehouse[i.n] = Math.max(0, d.warehouse[i.n] - i.q); }); });
}
function spDeliver(pid) {
  act(`delivered ${pid}, customer stock updated`, d => { const p = d.pos.find(x => x.id === pid); p.status = 'delivered'; p.deliveredAt = Date.now(); p.items.forEach(i => { if (d.stock[i.n]) d.stock[i.n].qty += i.q; }); });
  toast('Delivered · their stock went up');
}
V.supdash = () => {
  const po = myPOs(), isToday = t => t && new Date(t).toDateString() === new Date().toDateString();
  const by = {}; po.forEach(p => { by[p.from] = (by[p.from] || 0) + 1; });
  const low = Object.entries(Store.db.stock).filter(([, s]) => s.supplier === R.org && s.qty < s.min);
  return head('Distributor dashboard', 'Your customers on Sehat, live.') +
    `<div class="grid g4">${[['Open orders', po.filter(p => ['sent', 'accepted'].includes(p.status)).length], ['Dispatched today', po.filter(p => isToday(p.dispatchedAt)).length], ['Delivered today', po.filter(p => isToday(p.deliveredAt)).length], ['Customers ordering', Object.keys(by).length]].map(([l, v]) => `<div class="card kpi"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
    <div class="grid g2" style="margin-top:16px"><div class="card"><h3>Top requesting customers</h3>${Object.entries(by).sort((a, b) => b[1] - a[1]).map(([n, c]) => `<div class="row" style="padding:8px 0;border-bottom:1px solid var(--line)"><b>${esc(n)}</b><span class="sp"></span><span class="pill">${c} order${c > 1 ? 's' : ''}</span></div>`).join('') || '<p class="muted">No orders yet.</p>'}</div>
     <div class="card"><h3>Low stock at your customers</h3><p class="muted">Items you supply that are below minimum at Jain Medicos, before they even order.</p>${low.map(([n, s]) => `<div class="row" style="padding:8px 0;border-bottom:1px solid var(--line)"><b>${n}</b><span class="muted">${s.qty} left · min ${s.min}</span><span class="sp"></span><span class="pill ${s.qty / s.perDay < 2 ? 'bad' : 'warn'}">${coverTxt(Math.floor(s.qty / s.perDay))}</span></div>`).join('') || '<p class="muted">All good.</p>'}</div></div>`;
};
V.fleet = () => {
  const out = myPOs().filter(p => p.status === 'dispatched');
  return head('Dispatch', 'Vehicles and what each one is carrying.') +
    `<div class="grid g3">${VEHICLES.map(v => { const p = out.find(x => x.vehicle === v); return `<div class="card"><div class="row"><b>🚚 ${v}</b><span class="sp"></span><span class="pill ${p ? 'warn' : 'ok'}">${p ? 'on the road' : 'free'}</span></div>
      <p class="muted" style="margin-top:8px">${p ? `${p.id} → ${esc(p.from)} · ETA ~${etaMin(p)} min` : 'Waiting at warehouse'}</p></div>`; }).join('')}</div>`;
};
V.catalogue = () => head('Warehouse', 'Your stock. Dispatching an order takes it out of here.') +
  `<div class="card"><table><tr><th>Item</th><th>In warehouse</th><th>Pending in open orders</th></tr>${Object.entries(Store.db.warehouse).map(([n, q]) => { const pend = myPOs().filter(p => ['sent', 'accepted'].includes(p.status)).flatMap(p => p.items).filter(i => i.n === n).reduce((s, i) => s + i.q, 0);
    return `<tr><td>${n}</td><td>${q.toLocaleString('en-IN')}</td><td>${pend || '—'}</td></tr>`; }).join('')}</table></div>`;

// ---------- Sehat Hospital: its doctors on the network ----------
V.doctors = () => {
  const h = (Store.db.hospitals || []).find(x => x.name === R.org);
  if (!h) return head('Doctors', 'This hospital is not in the network registry yet.');
  return head('Doctors', `Doctors at ${esc(h.name)}. Patients see them as recommendations when they book.`) +
    `<div class="grid g2"><div class="card">${h.doctors.map(x => `<div class="row" style="padding:9px 0;border-bottom:1px solid var(--line)"><b>${esc(x.name)}</b><span class="muted">${esc(x.spec)}</span><span class="sp"></span><span class="pill">${Store.db.appointments.filter(a => a.doctor === x.name && a.status !== 'done').length} waiting</span></div>`).join('')}</div>
     <div class="card"><h3>Add a doctor</h3><label>Name</label><input id="dr_n" placeholder="e.g. Dr. Simran Kaur"><label>Speciality</label><select id="dr_s">${SPECS.map(x => `<option>${x}</option>`).join('')}</select><button class="btn" style="margin-top:12px" onclick="drAdd()">Add doctor</button></div></div>`;
};
function drAdd() {
  let n = $('#dr_n').value.trim(); if (!n) return toast('Enter a name'); if (!/^dr\.?\s/i.test(n)) n = 'Dr. ' + n;
  const sp = $('#dr_s').value; act(`added ${n} (${sp})`, d => { const h = d.hospitals.find(x => x.name === R.org); if (h && !h.doctors.some(x => x.name === n)) h.doctors.push({ name: n, spec: sp }); });
  toast(n + ' added');
}

render();
