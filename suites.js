// Sehat suites: Copilot, Doctor, Nurse, Hospital, Pharmacy.
// A suite is a tabbed agent; each tab is a feature view (some shared with the single agents in app.js).
const suiteTab = {};
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toTimeString().slice(0, 5);

SUITES.forEach(s => {
  V[s.id] = () => {
    const t = suiteTab[s.id] || s.tabs[0][0];
    return `<div class="row" style="margin-bottom:16px"><span style="font-size:30px">${s.ic}</span><div><h2>${s.name}</h2><span class="muted">${s.desc}</span></div></div>
      <div class="row" style="gap:6px;margin-bottom:18px;border-bottom:1px solid var(--line);padding-bottom:10px">${s.tabs.map(([k, l]) => `<button class="btn sm ${k === t ? '' : 'ghost'}" onclick="suiteTab['${s.id}']='${k}';render()">${l}</button>`).join('')}</div>` +
      (V[t] ? V[t]() : '');
  };
  V[s.id].after = () => { const t = suiteTab[s.id] || s.tabs[0][0]; V[t]?.after?.(); };
});
function openTab(suite, tab) { suiteTab[suite] = tab; go(suite); }

// ---------- marketplace: suites first ----------
V.market = () => {
  const card = (a, big) => { const on = installed().includes(a.id), ok = a.for.includes(role);
    return `<div class="card agent" style="${big ? 'border-color:var(--pri);background:linear-gradient(180deg,var(--soft),var(--card))' : ''}"><span class="ic">${a.ic}</span><div class="row"><b>${a.name}</b><span class="sp"></span><span class="pill">${a.cat || 'Suite · ' + a.tabs.length + ' tools'}</span></div><p>${a.desc}</p>
      <div class="row"><span class="muted">${a.price} · for ${a.for.map(r => ROLES[r].label).join(', ')}</span><span class="sp"></span>${ok ? `<button class="btn sm ${on ? 'ghost' : ''}" onclick="toggle('${a.id}')">${on ? 'Remove' : 'Install'}</button>` : ''}</div></div>`; };
  return head('Agent Marketplace', 'Install a full Sehat suite for your role, or pick single agents. A hospital that only wants appointments installs just Appointment Desk.') +
    `<h3 style="margin-bottom:12px">Sehat suites</h3><div class="grid g3">${SUITES.map(s => card(s, true)).join('')}</div>
     <h3 style="margin:26px 0 12px">Single agents</h3><div class="grid g3">${AGENTS.map(a => card(a)).join('')}</div>`;
};

// ---------- Sehat Copilot (patient) ----------
V.records = () => head('Records & OCR', 'Photo of a lab report or prescription → text → every value explained.') +
  `<div class="grid g2"><div class="card"><label>Upload a photo of a report</label><input type="file" id="oc_f" accept="image/*">
    <div class="row" style="margin-top:8px"><select id="oc_lang" style="width:auto"><option value="eng">English report</option><option value="hin+eng">Hindi + English</option></select><button class="btn sm" onclick="ocRead()">Read photo</button><span id="oc_p" class="muted"></span></div>
    <label>Report text (from the photo, or paste)</label><textarea id="lb_t" style="min-height:150px">Haemoglobin 10.4 g/dL\nFasting Blood Sugar 118 mg/dL\nHbA1c 6.4 %\nVitamin D 14 ng/mL</textarea>
    <div class="row" style="margin-top:10px"><select id="lb_l" style="width:auto"><option value="en">English</option><option value="hi">हिन्दी</option></select><button class="btn" onclick="lbRun()">Explain</button><button class="btn ghost" onclick="lbSave();toast('Saved to journal')">Save to journal</button></div></div>
   <div class="card" id="lb_o"><p class="muted">Explained values appear here.</p></div></div>`;
async function ocRead() {
  const f = $('#oc_f').files[0]; if (!f) return toast('Choose a photo first');
  if (!window.Tesseract) return toast('OCR needs internet the first time');
  $('#oc_p').textContent = 'Reading… 0%';
  try {
    const { data } = await Tesseract.recognize(f, $('#oc_lang').value, { logger: m => { if (m.status === 'recognizing text') $('#oc_p').textContent = 'Reading… ' + Math.round(m.progress * 100) + '%'; } });
    $('#lb_t').value = data.text.trim(); $('#oc_p').textContent = `Done · ${Math.round(data.confidence)}% confidence`; lbRun();
  } catch (e) { $('#oc_p').textContent = 'OCR failed: ' + e.message; }
}

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
  const d = Store.db, urg = a => (d.triage.find(t => t.name === a.patient)?.score || 0) * 10 + (/chest|breath|bleed|faint/i.test(a.reason) ? 30 : 0) + (a.status === 'checked-in' ? 5 : 0);
  const q = d.appointments.filter(a => a.status !== 'done').sort((a, b) => urg(b) - urg(a));
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
     <div class="card"><h3>Notes, labs & tasks</h3>${Store.db.journal.filter(j => j.text.includes(sel) || sel === ROLES.patient.org).slice(0, 8).map(j => `<p><span class="pill">${j.type}</span> ${esc(j.text)}</p>`).join('')}${Store.db.tasks.filter(t => t.patient === sel).map(t => `<p>🧑‍⚕️ ${esc(t.text)} ${t.done ? '<span class="pill ok">done</span>' : '<span class="pill warn">pending</span>'}</p>`).join('') || ''}</div></div>`;
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
  const k = [['Bed occupancy', Math.round(occ / tot * 100) + '%'], ['OPD today', d.appointments.length], ['ER queue', d.triage.length], ['Open ward tasks', d.tasks.filter(t => !t.done).length], ['Low-stock items', Object.values(d.stock).filter(s => s.qty < s.min).length], ['Prescriptions to pharmacy', d.prescriptions.length]];
  return head('Command centre', 'The whole hospital on one screen, updated live by every agent.') +
    `<div class="grid g3">${k.map(([l, v]) => `<div class="card kpi"><b>${v}</b><span>${l}</span></div>`).join('')}</div>
    <div class="grid g2" style="margin-top:14px"><div class="card"><h3>Departments</h3>${Object.entries(d.beds).map(([n, [t, o]]) => `<div style="margin:8px 0"><div class="row"><b>${n}</b><span class="sp"></span><span class="muted">${o}/${t}</span></div><div class="steps"><span class="on" style="flex:${o}"></span><span style="flex:${t - o}"></span></div></div>`).join('')}</div>
     <div class="card"><h3>Live activity</h3><div class="feed">${d.activity.slice(0, 8).map(a => `<div><b>${esc(a.who)}</b> ${esc(a.text)}<br><small>${ago(a.t)}</small></div>`).join('')}</div></div></div>`;
};
V.beds = () => head('Beds', 'Admit and discharge. Occupancy updates the command centre instantly.') +
  `<div class="grid g3">${Object.entries(Store.db.beds).map(([n, [t, o]]) => `<div class="card"><div class="row"><h3>${n}</h3><span class="sp"></span><span class="pill ${o / t > .85 ? 'bad' : o / t > .6 ? 'warn' : 'ok'}">${t - o} free</span></div>
    <p class="muted">${o} of ${t} occupied</p><div class="row"><button class="btn sm" onclick="bdMove('${n}',1)" ${o >= t ? 'disabled' : ''}>Admit</button><button class="btn sm ghost" onclick="bdMove('${n}',-1)" ${o <= 0 ? 'disabled' : ''}>Discharge</button></div></div>`).join('')}</div>`;
function bdMove(n, k) { act(`${k > 0 ? 'admitted a patient to' : 'discharged a patient from'} ${n}`, d => { d.beds[n][1] += k; }); }

render();
