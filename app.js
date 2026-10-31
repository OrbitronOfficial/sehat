// Sehat workspace: role shell, agent marketplace, and the agents themselves.
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const QS = new URLSearchParams(location.search);  // ?role=&view= lets the live demo show several roles at once
const role = QS.get('role') || (() => { try { return sessionStorage.getItem('sehat_role'); } catch { return null; } })();
if (!ROLES[role]) { location.replace('login.html'); throw new Error('not logged in'); }
// A signed-in person (created account or owner login) sees their own name; demo roles keep the demo people.
const USER = (() => { try { return sessionStorage.getItem('sehat_user'); } catch { return null; } })();
// A hospital, doctor or pharmacy device signs in as one entry of the registry (picked or registered at login).
const ORG = (() => { try { return QS.get('org') || sessionStorage.getItem('sehat_org'); } catch { return null; } })();
const orgInfo = (() => {
  const d = Store.db; if (!ORG) return null;
  if (role === 'hospital') { const h = (d.hospitals || []).find(x => x.name === ORG); return h && { org: h.name, sub: h.area }; }
  if (role === 'pharmacy') { const p = (d.pharmacies || []).find(x => x.name === ORG); return p && { org: p.name, sub: `${p.area} · ${p.km} km` }; }
  if (role === 'doctor') { const x = allDoctors(d).find(x => x.name === ORG); return x && { org: x.name, sub: `${x.spec} · ${x.hospital}` }; }
  return null;
})();
const R = Object.assign({}, ROLES[role] || ROLES.patient, USER && role === 'patient' && !ORG ? { org: USER, sub: 'Sehat member' } : {}, orgInfo || {});  // a staff sign-in never renames the patient
const askedView = QS.get('view') || (() => { try { const v = sessionStorage.getItem('sehat_view'); sessionStorage.removeItem('sehat_view'); return v; } catch { return null; } })();
let view = askedView || 'dashboard';
// Patient, doctor and nurse have their full Sehat Copilot workspace on the same site.
const WORKSPACE = { patient: ['/app', 'Sehat Copilot'], doctor: ['/doctor.html', 'Sehat Doctor'], nurse: ['/staff.html', 'Sehat Nurse'] }[role];
// Every role stays in the hub; the full Copilot workspace is one click away in the sidebar.
if (!askedView && WORKSPACE) view = { patient: 'sehat_copilot', doctor: 'sehat_doctor', nurse: 'sehat_nurse' }[role];

function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 2200); }
function logout() { try { sessionStorage.removeItem('sehat_role'); } catch {} location.href = 'login.html'; }
const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : Math.round(m / 60) + ' h ago'; };
const installed = () => (Store.db.installs[role] || []).filter(i => agent(i));  // skips agents that were retired
const agent = id => AGENTS.find(a => a.id === id) || SUITES.find(s => s.id === id);
const act = (text, fn = () => {}) => Store.update(fn, R.org, text);
const id = p => p + Math.random().toString(36).slice(2, 6).toUpperCase();

function go(v) { view = v; render(); scrollTo(0, 0); const m = $('#main'); m.classList.add('rise'); clearTimeout(m._r); m._r = setTimeout(() => m.classList.remove('rise'), 600); }
function render() {
  $('#org').innerHTML = `<span class="eyebrow">${R.label}</span><b>${R.org}</b><span class="muted">${R.sub}</span>`;
  $('#userChip').innerHTML = `<i>${R.ic}</i>${USER && role !== 'patient' ? esc(USER) + ' · ' : ''}${esc(R.org)}`;
  $('#nav').innerHTML = (WORKSPACE ? `<a class="ws" href="${WORKSPACE[0]}">✚ My ${WORKSPACE[1]} workspace</a>` : '') +
    `<a class="${view === 'dashboard' ? 'on' : ''}" onclick="go('dashboard')">🏠 Network dashboard</a>
    <a class="${view === 'market' ? 'on' : ''}" onclick="go('market')">🛒 Agent Marketplace</a>
    <div class="h">Your agents</div>` +
    installed().map(i => { const a = agent(i); return `<a class="${view === i ? 'on' : ''}" onclick="go('${i}')">${a.ic} ${a.name}</a>`; }).join('') +
    (installed().length ? '' : '<span class="muted" style="padding:0 10px">None yet. Add some from the marketplace.</span>');
  $('#main').innerHTML = (V[view] || V.dashboard)();
  V[view]?.after?.();
}
Store.onChange(render);

const head = (t, p) => `<div class="head"><h1>${t}</h1>${p ? `<p>${p}</p>` : ''}</div>`;
const statusPill = s => `<span class="pill ${{ delivered: 'ok', ready: 'ok', 'out for delivery': 'warn', sent: 'warn', quoted: 'warn', accepted: '', query: 'bad', 'checked-in': 'ok', booked: '', done: 'ok', dispatched: 'warn', received: 'ok', draft: '' }[s] ?? ''}">${s}</span>`;
const RX_STEPS = ['sent', 'quoted', 'accepted', 'ready', 'out for delivery', 'delivered'];
// price per unit (₹) for the demo pharmacy's catalogue; anything else is priced at ₹5 a unit
const PRICES = { 'Paracetamol 650mg': 2, 'Azithromycin 500mg': 12, 'Cetirizine 10mg': 1.5, 'Metformin 500mg': 1.8, 'Amlodipine 5mg': 2.5, 'Pantoprazole 40mg': 6, 'ORS sachet': 20, 'Ibuprofen 400mg': 2 };
const billOf = p => { const items = p.meds.map(m => ({ n: m.name, q: m.qty, r: PRICES[m.name] ?? 5 })); const sub = items.reduce((s, i) => s + i.q * i.r, 0); return { items, sub, delivery: 20, total: Math.round(sub + 20) }; };
const billHTML = b => `<table><tr><th>Medicine</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>${b.items.map(i => `<tr><td>${esc(i.n)}</td><td>${i.q}</td><td>₹${i.r}</td><td>₹${(i.q * i.r).toFixed(0)}</td></tr>`).join('')}<tr><td colspan="3">Delivery</td><td>₹${b.delivery}</td></tr><tr><th colspan="3">Total</th><th>₹${b.total}</th></tr></table>`;

// ---------- views ----------
const V = {};

V.dashboard = () => {
  const d = Store.db, mine = rx => role === 'patient' ? rx.patient === R.org : role === 'pharmacy' ? rx.pharmacy === R.org : true;
  const low = Object.values(d.stock).filter(s => s.qty < s.min).length;
  const k = {
    hospital: [['Appointments today', d.appointments.filter(a => hospOf(a) === R.org).length], ['Checked in', d.appointments.filter(a => hospOf(a) === R.org && a.status === 'checked-in').length], ['Beds free', Object.values(d.beds).reduce((s, b) => s + b[0] - b[1], 0)], ['Agents active', installed().length]],
    doctor: [['Patients today', d.appointments.filter(a => a.doctor === R.org).length], ['Prescriptions sent', d.prescriptions.filter(p => p.doctor === R.org).length], ['Pharmacy queries', d.prescriptions.filter(p => p.status === 'query').length], ['Agents active', installed().length]],
    pharmacy: [['New prescriptions', d.prescriptions.filter(p => mine(p) && p.status === 'sent').length], ['Ready to hand over', d.prescriptions.filter(p => mine(p) && p.status === 'ready').length], ['Low-stock items', low], ['Open POs', d.pos.filter(p => !['received', 'delivered'].includes(p.status)).length]],
    nurse: [['Open ward tasks', d.tasks.filter(t => !t.done).length], ['Done today', d.tasks.filter(t => t.done).length], ['Patients in queue', d.appointments.filter(a => a.status !== 'done').length], ['Agents active', installed().length]],
    supplier: [['Open purchase orders', d.pos.filter(p => p.supplier === R.org && ['sent', 'accepted'].includes(p.status)).length], ['On the road', d.pos.filter(p => p.supplier === R.org && p.status === 'dispatched').length], ['Delivered', d.pos.filter(p => p.supplier === R.org && p.status === 'delivered').length], ['Agents active', installed().length]],
    patient: [['Upcoming visits', d.appointments.filter(a => a.patient === R.org && a.status !== 'done').length], ['Medicines on the way', d.prescriptions.filter(p => mine(p) && p.status !== 'delivered').length], ['Journal entries', d.journal.length], ['Agents active', installed().length]],
  }[role] || [];
  // where each KPI tile and activity line leads: [suite, tab] of the role's own suite
  const SUITE = { hospital: 'sehat_hospital', doctor: 'sehat_doctor', pharmacy: 'sehat_pharmacy', nurse: 'sehat_nurse', supplier: 'sehat_supply', patient: 'sehat_copilot' }[role];
  const TO = { hospital: ['appointments', 'appointments', 'beds'], doctor: ['consult', 'rxwriter', 'connect'], pharmacy: ['rxinbox', 'delivery', 'supply', 'supply'], nurse: ['tasks', 'taskhistory', 'vitals'], supplier: ['poinbox', 'fleet', 'supdash'], patient: ['appointments', 'orders', 'journal'] }[role] || [];
  const kgo = i => TO[i] ? `openTab('${SUITE}','${TO[i]}')` : `go('market')`;
  const feedGo = t => /PO|purchase|dispatch|restock|stock/i.test(t) ? ({ pharmacy: 'supply', hospital: 'supply', supplier: 'poinbox' }[role])
    : /RX|prescription|packed|rider|delivered/i.test(t) ? ({ pharmacy: 'rxinbox', doctor: 'rxwriter', patient: 'orders' }[role])
    : /task|vitals|handover|gave|held/i.test(t) ? ({ nurse: 'tasks', hospital: 'tasks' }[role])
    : /booked|checked in|appointment/i.test(t) ? ({ hospital: 'appointments', patient: 'appointments', doctor: 'consult' }[role]) : null;
  return head(`Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${R.org.split(' ')[0] === 'Dr.' ? R.org : R.org.split(' ')[0]}`, 'Everything your agents did, live.') +
    `<div class="grid g4">${k.map(([l, v], i) => `<button class="card kpi click" onclick="${kgo(i)}"><b>${v}</b><span>${l} →</span></button>`).join('')}</div>
    <div class="grid g2" style="margin-top:14px">
      <div class="card"><div class="row"><h3>Your agents</h3><span class="sp"></span><button class="btn sm ghost" onclick="go('market')">+ Add agents</button></div>
        <div class="grid g2" style="margin-top:12px">${installed().map(i => { const a = agent(i); return `<button class="card agent click" style="padding:14px" onclick="go('${i}')"><span class="ic">${a.ic}</span><b>${a.name}</b><p>${a.cat || (a.tabs ? a.tabs.length + ' tools · open →' : 'Open →')}</p></button>`; }).join('') || '<p class="muted">No agents installed.</p>'}</div></div>
      <div class="card"><div class="row"><h3>Live activity</h3><span class="sp"></span><span class="pill">● live</span></div>
        <div class="feed">${d.activity.slice(0, 9).map(a => { const to = feedGo(a.text); return `<div class="${to ? 'click' : ''}" ${to ? `onclick="openTab('${SUITE}','${to}')" role="button" tabindex="0"` : ''}><b>${esc(a.who)}</b> ${esc(a.text)}${to ? ' <span class="go">→</span>' : ''}<br><small>${ago(a.t)}</small></div>`; }).join('')}</div></div>
    </div>
    <p class="muted" style="margin-top:14px">Tip: open another tab as a different role (e.g. Doctor here, Pharmacy there) and watch prescriptions move between them live. <button class="link" style="color:var(--pri)" onclick="if(confirm('Reset all demo data?'))Store.reset()">Reset demo data</button></p>`;
};

V.market = () => {
  const mine = AGENTS.filter(a => a.for.includes(role)), other = AGENTS.filter(a => !a.for.includes(role));
  const card = a => { const on = installed().includes(a.id), ok = a.for.includes(role);
    return `<div class="card agent"><span class="ic">${a.ic}</span><div class="row"><b>${a.name}</b><span class="sp"></span><span class="pill">${a.cat}</span></div><p>${a.desc}</p>
      <div class="row"><span class="muted">${a.price} · for ${a.for.map(r => ROLES[r].label).join(', ')}</span><span class="sp"></span>
      ${ok ? `<button class="btn sm ${on ? 'ghost' : ''}" onclick="toggle('${a.id}')">${on ? 'Remove' : 'Install'}</button>` : ''}</div></div>`; };
  return head('Agent Marketplace', `Pick only the agents your ${R.label.toLowerCase()} needs. A hospital that only wants appointments installs just that.`) +
    `<div class="grid g3">${mine.map(card).join('')}</div><h3 style="margin:26px 0 12px">For other healthcare roles</h3><div class="grid g3">${other.map(card).join('')}</div>`;
};
function toggle(aid) {
  const on = installed().includes(aid);
  act(`${on ? 'removed' : 'installed'} ${agent(aid).name}`, d => { d.installs[role] = on ? d.installs[role].filter(x => x !== aid) : [...d.installs[role], aid]; });
  toast(on ? 'Agent removed' : 'Agent installed');
}

// ----- Appointment Desk -----
function freeSlot(doc, date) {
  const taken = Store.db.appointments.filter(a => a.doctor === doc && a.date === date).map(a => a.slot);
  return ['09:30', '10:00', '10:30', '11:15', '12:00', '14:00', '15:30', '16:15', '17:00'].find(s => !taken.includes(s)) || '18:00';
}
const pref = p => (Store.db.prefs || {})[p] || {};
function setPref(k, v) { const p = role === 'patient' ? R.org : null; if (!p) return; act(`set preferred ${k}: ${v}`, d => { d.prefs = d.prefs || {}; d.prefs[p] = { ...(d.prefs[p] || {}), [k]: v }; }); toast('Saved'); }
// Doctors for a problem: the right speciality first, then the rest; inside a hospital, or across all of them by distance.
function recommend(text, hosp) {
  const spec = specFor(text), docs = allDoctors(Store.db).filter(x => !hosp || x.hospital === hosp);
  return docs.sort((x, y) => (y.spec === spec) - (x.spec === spec) || x.km - y.km);
}
const apHosp = () => role === 'hospital' ? R.org : ($('#ap_h') ? $('#ap_h').value : (pref(R.org).hospital || 'City Care Hospital'));
V.appointments = () => {
  const d = Store.db, mineA = a => role === 'patient' ? a.patient === R.org : role === 'hospital' ? hospOf(a) === R.org : role === 'doctor' ? a.doctor === R.org : true;
  const list = d.appointments.filter(mineA), hs = [...(d.hospitals || [])].sort((x, y) => x.km - y.km), ph = [...(d.pharmacies || [])].sort((x, y) => x.km - y.km);
  const myH = pref(R.org).hospital || 'City Care Hospital';
  return head('📅 Appointment Desk', role === 'patient' ? 'Tell us what is wrong. Pick a hospital and Sehat recommends the right doctor and the earliest slot.' : `Bookings for ${esc(R.org)}. Patients book themselves; you check them in.`) +
    `<div class="grid g2"><div class="card"><h3>${role === 'patient' ? 'Book a visit' : 'Book for a walk-in'}</h3>
      ${role !== 'patient' ? '<label>Patient name</label><input id="ap_name" placeholder="e.g. Priya Sharma">' : ''}
      <label>What's the problem?</label><textarea id="ap_why" oninput="apSuggest()">${role === 'patient' ? 'Fever and body ache for 3 days' : 'Chest tightness and breathlessness when climbing stairs'}</textarea>
      <div class="grid g2" style="gap:10px">${role === 'patient' ? `<div><label>Hospital</label><select id="ap_h" onchange="apSuggest()"><option value="">All hospitals (nearest first)</option>${hs.map(h => `<option ${h.name === myH ? 'selected' : ''} value="${esc(h.name)}">${esc(h.name)} · ${h.km} km</option>`).join('')}</select></div>` : ''}
        <div><label>Date</label><input id="ap_date" type="date" value="${new Date().toISOString().slice(0, 10)}" onchange="apSuggest()"></div></div>
      <label>Recommended doctors</label><div id="ap_sug"></div>
      ${role === 'patient' ? `<label>Your pharmacy for prescriptions</label><select onchange="setPref('pharmacy',this.value)"><option value="">Nearest with stock (automatic)</option>${ph.map(p => `<option ${pref(R.org).pharmacy === p.name ? 'selected' : ''} value="${esc(p.name)}">${esc(p.name)} · ${p.km} km · ${esc(p.hours || '')}</option>`).join('')}</select>` : ''}</div>
     <div class="card"><h3>${role === 'patient' ? 'Your appointments' : 'Queue'}</h3><table><tr><th>Time</th><th>Patient</th><th>Doctor</th><th>Status</th><th></th></tr>
      ${list.map(a => `<tr><td>${a.date.slice(5)} ${a.slot}</td><td>${esc(a.patient)}<br><small class="muted">${esc(a.reason)}</small></td><td>${esc(a.doctor)}<br><small class="muted">${esc(a.spec)}${role !== 'hospital' ? ' · ' + esc(hospOf(a)) : ''}</small></td><td>${statusPill(a.status)}</td>
        <td>${role === 'hospital' && a.status === 'booked' ? `<button class="btn sm" onclick="apCheck('${a.id}')">Check in</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">No appointments yet.</td></tr>'}</table></div></div>`;
};
V.appointments.after = () => apSuggest();
function apSuggest() {
  const why = $('#ap_why').value, date = $('#ap_date').value, spec = specFor(why), docs = recommend(why, apHosp()).slice(0, 4);
  $('#ap_sug').innerHTML = `<p class="muted" style="margin:0 0 6px">🤖 Looks like a <b style="color:var(--ink)">${spec}</b> visit.</p>` + (docs.map((x, i) => `<div class="row" style="padding:9px 12px;border:1px solid ${i ? 'var(--line)' : 'var(--teal)'};border-radius:14px;margin-bottom:8px;background:${i ? 'var(--card-solid)' : 'var(--soft)'}">
    <div><b>${esc(x.name)}</b> ${x.spec === spec ? '<span class="pill ok">match</span>' : ''}<br><span class="muted">${esc(x.spec)} · ${esc(x.hospital)} · ${x.km} km · next ${freeSlot(x.name, date)}</span></div><span class="sp"></span>
    <button class="btn sm ${i ? 'ghost' : ''}" onclick="apBook('${esc(x.name)}','${esc(x.hospital)}')">Book</button></div>`).join('') || '<p class="muted">No doctors at this hospital yet.</p>');
}
function apBook(docName, hospName) {
  const why = $('#ap_why').value.trim(), date = $('#ap_date').value, patient = role === 'patient' ? R.org : ($('#ap_name').value.trim() || 'Walk-in patient');
  const x = docName ? allDoctors(Store.db).find(y => y.name === docName && (!hospName || y.hospital === hospName)) : recommend(why, apHosp())[0];
  if (!x) return toast('Pick a doctor');
  const a = { id: id('A'), patient, doctor: x.name, spec: x.spec, hospital: x.hospital, date, slot: freeSlot(x.name, date), reason: why || 'General consultation', status: 'booked' };
  act(`booked ${patient} with ${x.name} at ${x.hospital}, ${a.slot}`, d => { d.appointments.push(a); if (role === 'patient') { d.prefs = d.prefs || {}; d.prefs[patient] = { ...(d.prefs[patient] || {}), hospital: x.hospital }; } });
  toast(`Booked ${a.slot} with ${x.name} at ${x.hospital}`);
}
function apCheck(aid) { act('checked in a patient', d => { d.appointments.find(a => a.id === aid).status = 'checked-in'; }); }

// ----- e-Prescription Writer (doctor) -----
let draft = [];
// Which pharmacy a prescription goes to: the patient's choice, else the nearest that can fill it (only pharmacies
// that share live stock on Sehat can be checked; the others are shown as "stock not shared").
const canFill = (p, meds) => p.live && meds.every(m => (Store.db.stock[m.name]?.qty || 0) >= m.qty);
function rxPharmacyFor(patient) {
  const ph = [...(Store.db.pharmacies || [])].sort((x, y) => x.km - y.km), mine = pref(patient).pharmacy;
  return ph.find(p => p.name === mine) || ph.find(p => canFill(p, draft)) || ph[0];
}
function rxPharmDraw() {
  const s = $('#rx_ph'); if (!s) return;
  const pick = rxPharmacyFor($('#rx_p').value), mine = pref($('#rx_p').value).pharmacy;
  s.innerHTML = [...(Store.db.pharmacies || [])].sort((x, y) => x.km - y.km).map(p => `<option ${p.name === pick.name ? 'selected' : ''} value="${esc(p.name)}">${esc(p.name)} · ${p.km} km · ${p.live ? (canFill(p, draft) ? '✓ all in stock' : 'short on stock') : 'stock not shared'}${p.name === mine ? ' · patient\'s choice' : ''}</option>`).join('');
}
V.rxwriter = () => {
  const pts = Store.db.appointments.filter(a => a.doctor === R.org || role !== 'doctor');
  return head('📝 e-Prescription Writer', 'Sign once. The prescription goes straight to the nearest pharmacy with stock, and the patient is told.') +
    `<div class="grid g2"><div class="card"><label>Patient</label><select id="rx_p" onchange="rxPharmDraw()">${pts.map(a => `<option>${esc(a.patient)}</option>`).join('')}</select>
      <label>Diagnosis / notes</label><input id="rx_dx" value="Viral fever">
      <label>Add medicine</label><div class="row"><input id="rx_m" list="medlist" placeholder="Start typing…" style="flex:2"><input id="rx_d" placeholder="1-0-1 × 5 days" style="flex:1"><input id="rx_q" type="number" value="10" style="width:80px"><button class="btn sm" onclick="rxAdd()">Add</button></div>
      <datalist id="medlist">${Object.keys(Store.db.stock).map(m => `<option>${m}</option>`).join('')}</datalist>
      <div id="rx_list" style="margin-top:10px"></div>
      <label>Send to pharmacy</label><select id="rx_ph"></select>
      <button class="btn" style="margin-top:12px" onclick="rxSend()">✍️ Sign & send to pharmacy</button></div>
     <div class="card"><h3>Sent prescriptions</h3>${Store.db.prescriptions.filter(p => p.doctor === R.org || role !== 'doctor').map(p => `<div style="padding:10px 0;border-bottom:1px solid var(--line)"><div class="row"><b>${p.id}</b> · ${esc(p.patient)}<span class="sp"></span>${statusPill(p.status)}</div><small class="muted">${p.meds.map(m => m.name).join(', ')} → ${p.pharmacy}</small></div>`).join('') || '<p class="muted">Nothing sent yet.</p>'}</div></div>`;
};
V.rxwriter.after = () => { if (!draft.length) draft = [{ name: 'Paracetamol 650mg', dose: '1-0-1 × 5 days', qty: 10 }, { name: 'Cetirizine 10mg', dose: '0-0-1 × 5 days', qty: 5 }]; rxDraw(); rxPharmDraw(); };
function rxDraw() {
  const st = Store.db.stock;
  $('#rx_list').innerHTML = draft.map((m, i) => `<div class="row" style="padding:6px 0;border-bottom:1px dashed var(--line)"><b>${esc(m.name)}</b><span class="muted">${esc(m.dose)} · qty ${m.qty}</span><span class="sp"></span>
    <span class="pill ${(st[m.name]?.qty || 0) >= m.qty ? 'ok' : 'bad'}">${(st[m.name]?.qty || 0) >= m.qty ? 'in stock nearby' : 'low nearby'}</span><button class="link" onclick="draft.splice(${i},1);rxDraw()">✕</button></div>`).join('');
}
function rxAdd() { const n = $('#rx_m').value.trim(); if (!n) return; draft.push({ name: n, dose: $('#rx_d').value || 'as directed', qty: +$('#rx_q').value || 1 }); $('#rx_m').value = ''; rxDraw(); }
function rxSend() {
  if (!draft.length) return toast('Add at least one medicine');
  const pn = $('#rx_ph') ? $('#rx_ph').value : rxPharmacyFor($('#rx_p').value).name, ph = (Store.db.pharmacies || []).find(p => p.name === pn) || PHARMACIES[0];
  const rx = { id: id('RX'), patient: $('#rx_p').value, doctor: role === 'doctor' ? R.org : ROLES.doctor.org, dx: $('#rx_dx').value, meds: draft, pharmacy: ph.name, km: ph.km, status: 'sent', t: Date.now(), rider: null };
  act(`sent ${rx.id} for ${rx.patient} → ${ph.name} (${ph.km} km)`, d => {
    d.prescriptions.unshift(rx);
    d.journal.unshift({ date: new Date().toISOString().slice(0, 10), type: 'Prescription', text: `${rx.dx}: ${draft.map(m => m.name).join(', ')} (${rx.doctor})` });
    const ap = d.appointments.find(a => a.patient === rx.patient && a.status !== 'done'); if (ap) ap.status = 'done';
  });
  draft = []; toast(`Sent to ${ph.name}`);
}

// ----- Prescription Inbox (pharmacy) -----
V.rxinbox = () => {
  const st = Store.db.stock, list = Store.db.prescriptions.filter(p => p.pharmacy === R.org || role !== 'pharmacy');
  return head('📥 Prescription Inbox', 'Prescriptions from hospitals arrive here with a live stock check. Prepare them before the patient even asks.') +
    (list.map(p => `<div class="card" style="margin-bottom:12px"><div class="row"><h3>${p.id}</h3><span class="muted">${esc(p.patient)} · from ${esc(p.doctor)} · ${ago(p.t)}</span><span class="sp"></span>${statusPill(p.status)}</div>
      <div class="steps">${RX_STEPS.map(s => `<span class="${RX_STEPS.indexOf(p.status) >= RX_STEPS.indexOf(s) ? 'on' : ''}"></span>`).join('')}</div>
      <table><tr><th>Medicine</th><th>Dose</th><th>Qty</th><th>Stock</th></tr>${p.meds.map(m => { const q = st[m.name]?.qty || 0; return `<tr><td>${esc(m.name)}</td><td>${esc(m.dose)}</td><td>${m.qty}</td><td><span class="pill ${q >= m.qty ? 'ok' : 'bad'}">${q >= m.qty ? q + ' in stock' : 'short (' + q + ')'}</span></td></tr>`; }).join('')}</table>
      <div class="row" style="margin-top:10px">
        ${p.status === 'sent' || p.status === 'query' ? `<button class="btn sm" onclick="rxAccept('${p.id}')">Accept · send bill to patient</button>` : ''}
        ${p.status === 'quoted' ? `<span class="pill warn">Waiting for ${esc(p.patient)} to approve ₹${(p.bill || billOf(p)).total}</span>` : ''}
        ${p.status === 'accepted' ? `<button class="btn sm" onclick="rxReady('${p.id}')">Packed · mark ready</button>` : ''}
        ${p.status === 'ready' ? `<button class="btn sm" onclick="go('delivery')">Send for delivery →</button>` : ''}
        <button class="btn sm ghost" onclick="askDoctor('${p.id}')">📞 Ask doctor</button></div></div>`).join('') || `<div class="card"><p class="muted">No prescriptions yet. Log in as Doctor in another tab and send one.</p></div>`);
};
// The pharmacist accepts and sends the bill; the patient approves it; only then is it packed.
function rxAccept(pid) { act(`accepted ${pid} and sent the bill to the patient`, d => { const p = d.prescriptions.find(x => x.id === pid); p.status = 'quoted'; p.bill = billOf(p); }); }
function rxApprove(pid) { act(`approved the bill for ${pid}`, d => { const p = d.prescriptions.find(x => x.id === pid); if (p.status === 'quoted') { p.status = 'accepted'; p.approvedAt = Date.now(); } }); toast('Approved. The pharmacy will pack it now.'); }
function rxReady(pid) {
  act(`packed ${pid}, ready for pickup/delivery`, d => { const p = d.prescriptions.find(x => x.id === pid); p.status = 'ready'; p.meds.forEach(m => { if (d.stock[m.name]) d.stock[m.name].qty = Math.max(0, d.stock[m.name].qty - m.qty); }); });
}
function askDoctor(pid) { connectRx = pid; go('connect'); }

// ----- Doctor ↔ Pharmacy Connect -----
let connectRx = null;
V.connect = () => {
  const rxs = Store.db.prescriptions; connectRx = connectRx || rxs[0]?.id;
  const msgs = Store.db.messages.filter(m => m.rx === connectRx), me = role;
  const other = role === 'doctor' ? ROLES.pharmacy.org : ROLES.doctor.org;
  return head('📞 Doctor ↔ Pharmacy Connect', 'Clarify a prescription without a single phone tag. Every message is tied to the prescription.') +
    (rxs.length ? `<div class="grid g2"><div class="card"><label>Prescription</label><select onchange="connectRx=this.value;render()">${rxs.map(p => `<option ${p.id === connectRx ? 'selected' : ''} value="${p.id}">${p.id} · ${esc(p.patient)}</option>`).join('')}</select>
      <div style="margin-top:12px;max-height:340px;overflow:auto">${msgs.map(m => `<div class="msg ${m.from === me ? 'me' : 'them'}">${esc(m.text)}<br><small style="opacity:.7">${m.from === me ? 'You' : esc(ROLES[m.from].org)} · ${ago(m.t)}</small></div>`).join('') || '<p class="muted">No messages yet.</p>'}</div>
      <div class="row" style="margin-top:10px"><input id="cn_t" placeholder="Type a message…" style="flex:1" onkeydown="if(event.key==='Enter')cnSend()"><button class="btn sm" onclick="cnSend()">Send</button></div>
      <div class="row" style="margin-top:8px">${(role === 'pharmacy' ? ['Is a generic substitute OK?', 'Out of stock. Alternative?', 'Please confirm the dose.'] : ['Generic is fine.', 'Use the alternative brand.', 'Dose is correct as written.']).map(q => `<button class="btn sm ghost" onclick="cnSend(this.textContent)">${q}</button>`).join('')}</div></div>
     <div class="card"><h3>Call ${esc(other)}</h3><p class="muted">One tap. The call is logged against ${connectRx}.</p><button class="btn" onclick="cnCall()">📞 Call now</button>
      <h3 style="margin-top:20px">Prescription</h3>${(() => { const p = rxs.find(x => x.id === connectRx); return p ? `<p><b>${esc(p.patient)}</b> · ${esc(p.dx)}</p><ul>${p.meds.map(m => `<li>${esc(m.name)} — ${esc(m.dose)}</li>`).join('')}</ul>${statusPill(p.status)}` : ''; })()}</div></div>`
      : '<div class="card"><p class="muted">No prescriptions yet.</p></div>');
};
function cnSend(text) {
  const t = text || $('#cn_t').value.trim(); if (!t || !connectRx) return;
  act(`messaged about ${connectRx}: "${t}"`, d => { d.messages.push({ rx: connectRx, from: role, text: t, t: Date.now() }); if (role === 'pharmacy') { const p = d.prescriptions.find(x => x.id === connectRx); if (p && p.status === 'sent') p.status = 'query'; } });
}
function cnCall() { act(`called ${role === 'doctor' ? 'the pharmacy' : 'the doctor'} about ${connectRx}`, d => d.messages.push({ rx: connectRx, from: role, text: '📞 Call placed (2 min 14 s)', t: Date.now() })); toast('Calling… (demo)'); }

// ----- Supply Chain AI -----
const PO_STEPS = ['sent', 'accepted', 'dispatched', 'delivered'];
const poOpen = p => !['received', 'delivered'].includes(p.status);
const stockRows = () => Object.entries(Store.db.stock).map(([n, s]) => ({ n, ...s, days: s.perDay ? Math.floor(s.qty / s.perDay) : 99 })).sort((a, b) => a.days - b.days);
// One-line insight computed from the stock table: the item that runs out first and whether a PO already covers it.
function supplyInsight(rows) {
  const r = rows[0]; if (!r || r.days >= 5) return 'Every item has at least 5 days of cover at current daily use.';
  const po = Store.db.pos.find(p => poOpen(p) && p.items.some(i => i.n === r.n));
  const when = r.qty === 0 ? 'is out of stock' : `runs out in ${r.days < 1 ? 'under a day' : r.days + (r.days === 1 ? ' day' : ' days')}`;
  return `<b>${r.n}</b> ${when} (${r.qty} left, ~${r.perDay}/day). ${po ? `${po.id} to ${po.supplier} is ${po.status}.` : `A PO to ${r.supplier} is ready to draft.`}`;
}
const poSteps = p => `<div class="steps">${PO_STEPS.map(s => `<span class="${PO_STEPS.indexOf(p.status === 'received' ? 'delivered' : p.status) >= PO_STEPS.indexOf(s) ? 'on' : ''}"></span>`).join('')}</div>`;
V.supply = () => {
  const rows = stockRows(), need = rows.filter(r => r.qty < r.min || r.days < 5);
  const toOrder = need.filter(r => !Store.db.pos.some(p => poOpen(p) && p.from === R.org && p.items.some(i => i.n === r.n)));
  return head('📦 Supply Chain AI', 'Predicts run-outs from daily usage and drafts purchase orders, grouped by distributor. Distributors on Sehat get them live.') +
    `<div class="ai"><span style="font-size:22px">🤖</span><div><span class="eyebrow">AI insight</span><br>${supplyInsight(rows)}</div></div>
    <div class="grid g3"><div class="card kpi"><b>${rows.length}</b><span>SKUs tracked</span></div><div class="card kpi"><b style="color:var(--bad)">${need.length}</b><span>need reorder</span></div><div class="card kpi"><b>${Store.db.pos.filter(poOpen).length}</b><span>open purchase orders</span></div></div>
    <div class="card" style="margin-top:16px"><div class="row"><h3>Stock</h3><span class="sp"></span>${toOrder.length ? `<button class="btn sm" onclick="poDraft()">🤖 Draft POs for ${toOrder.length} items</button>` : need.length ? '<span class="pill ok">All low items on order</span>' : ''}</div>
      <table><tr><th>Medicine</th><th>In stock</th><th>Min</th><th>Use / day</th><th>Runs out in</th><th>Distributor</th></tr>${rows.map(r => `<tr><td>${r.n}</td><td>${r.qty}</td><td>${r.min}</td><td>${r.perDay}</td><td><span class="pill ${r.days < 2 ? 'bad' : r.days < 5 ? 'warn' : 'ok'}">${r.qty === 0 ? 'OUT' : r.days + ' days'}</span></td><td class="muted">${r.supplier}</td></tr>`).join('')}</table></div>
    <div class="card" style="margin-top:16px"><div class="row"><h3>Purchase orders</h3><span class="sp"></span>${Store.db.pos.some(p => p.status === 'draft' && p.from === R.org) ? '<button class="btn sm" onclick="poSendAll()">📤 Send all drafts to distributors</button>' : ''}</div>${Store.db.pos.filter(p => p.from === R.org || !p.from).map(p => `<div style="padding:10px 0;border-bottom:1px solid var(--line)"><div class="row"><b>${p.id}</b><span class="muted">→ ${p.supplier}</span><span class="muted">${p.items.map(i => i.n + ' ×' + i.q).join(', ')}</span><span class="sp"></span>${statusPill(p.status)}
        ${p.status === 'draft' ? `<button class="btn sm" onclick="poSend('${p.id}')">📤 Send to distributor</button>` : ''}${poOpen(p) && p.status !== 'draft' && !SUPPLIERS[p.supplier]?.onSehat ? `<button class="btn sm ghost" onclick="poRecv('${p.id}')">Mark received</button>` : ''}</div>${poSteps(p)}
        <small class="muted">${p.status === 'dispatched' ? `🚚 ${esc(p.vehicle)} · arriving in ~${Math.max(1, Math.round((p.eta - Date.now()) / 60000))} min` : p.status === 'draft' ? 'AI draft · check quantities, then send' : p.status === 'delivered' ? 'Delivered · stock updated automatically' : SUPPLIERS[p.supplier]?.onSehat ? 'Distributor on Sehat · updates live' : 'Distributor not on Sehat yet · sent by email/WhatsApp'}</small></div>`).join('') || '<p class="muted">No POs yet.</p>'}</div>`;
};
function poDraft() {
  act('drafted purchase orders for low stock', d => {
    const by = {};
    Object.entries(d.stock).forEach(([n, s]) => { if ((s.qty < s.min || s.qty / s.perDay < 5) && !d.pos.some(p => poOpen(p) && p.from === R.org && p.items.some(i => i.n === n)))
      (by[s.supplier] = by[s.supplier] || []).push({ n, q: Math.max(s.min * 2 - s.qty, s.perDay * 14), cover: s.perDay ? Math.floor(s.qty / s.perDay) : 99 }); });
    Object.entries(by).forEach(([sup, items]) => d.pos.unshift({ id: id('PO'), supplier: sup, from: R.org, fromRole: role, km: SUPPLIERS[sup]?.km[R.org] ?? null, items, status: 'draft', t: Date.now(), urgency: Math.min(...items.map(i => i.cover)) }));
  });
  toast('POs drafted. Review, then send to the distributor');
}
function poSend(pid) {
  act(`sent ${pid} to ${Store.db.pos.find(p => p.id === pid).supplier}`, d => { const p = d.pos.find(x => x.id === pid); p.status = 'sent'; p.t = Date.now(); });
  toast(SUPPLIERS[Store.db.pos.find(p => p.id === pid).supplier]?.onSehat ? 'Sent · the distributor sees it now' : 'Sent by email/WhatsApp');
}
function poSendAll() { Store.db.pos.filter(p => p.status === 'draft' && p.from === R.org).forEach(p => poSend(p.id)); }
function poRecv(pid) { act(`received ${pid}, stock updated`, d => { const p = d.pos.find(x => x.id === pid); p.status = 'received'; p.items.forEach(i => { if (d.stock[i.n]) d.stock[i.n].qty += i.q; }); }); }

// ----- Delivery Dispatch -----
const RIDERS = ['Gurpreet (bike)', 'Ravi (bike)', 'Sahil (scooter)'];
V.delivery = () => {
  const list = Store.db.prescriptions.filter(p => ['ready', 'out for delivery', 'delivered'].includes(p.status) && (role !== 'pharmacy' || p.pharmacy === R.org));
  return head('🛵 Delivery Dispatch', 'Assign a rider, share the ETA with the patient, close on delivery.') +
    `<div class="card"><table><tr><th>Order</th><th>Patient</th><th>Status</th><th>Rider</th><th></th></tr>${list.map(p => `<tr><td>${p.id}</td><td>${esc(p.patient)}</td><td>${statusPill(p.status)}</td><td>${p.rider || '—'}</td>
      <td>${p.status === 'ready' ? `<button class="btn sm" onclick="dlSend('${p.id}')">Assign rider</button>` : p.status === 'out for delivery' ? `<button class="btn sm" onclick="dlDone('${p.id}')">Delivered ✓</button>` : ''}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">Nothing ready yet.</td></tr>'}</table></div>`;
};
function dlSend(pid) { const r = RIDERS[Math.floor(Math.random() * RIDERS.length)]; act(`assigned ${r} to ${pid} · ETA 25 min`, d => { const p = d.prescriptions.find(x => x.id === pid); p.status = 'out for delivery'; p.rider = r; p.eta = Date.now() + 25 * 60000; }); }
function dlDone(pid) { act(`delivered ${pid}`, d => { d.prescriptions.find(x => x.id === pid).status = 'delivered'; }); }

// ----- My Medicines (patient) -----
V.orders = () => {
  const list = Store.db.prescriptions.filter(p => p.patient === R.org);
  const label = { sent: 'Sent to pharmacy', quoted: 'Bill sent', accepted: 'You approved', ready: 'Packed & ready', 'out for delivery': 'On the way', delivered: 'Delivered' };
  return head('🧾 My Medicines', 'From your doctor to your door. No queue at the counter.') +
    (list.map(p => `<div class="card" style="margin-bottom:12px"><div class="row"><h3>${p.id}</h3><span class="muted">${esc(p.doctor)} → ${esc(p.pharmacy)} (${p.km} km)</span><span class="sp"></span>${statusPill(p.status)}</div>
      <div class="steps">${RX_STEPS.map(s => `<span class="${RX_STEPS.indexOf(p.status === 'query' ? 'sent' : p.status) >= RX_STEPS.indexOf(s) ? 'on' : ''}"></span>`).join('')}</div>
      <div class="row muted">${RX_STEPS.map(s => `<span style="flex:1;font-size:12px">${label[s]}</span>`).join('')}</div>
      ${p.status === 'query' ? '<p class="pill warn">Pharmacist is confirming something with your doctor</p>' : ''}
      ${p.status === 'quoted' ? `<div class="ai" style="margin-top:10px"><span style="font-size:22px">🧾</span><div style="flex:1"><b>${esc(p.pharmacy)} sent your bill</b>${billHTML(p.bill || billOf(p))}<div class="row" style="margin-top:10px"><button class="btn" onclick="rxApprove('${p.id}')">✓ Approve · pay on delivery</button><span class="muted">They pack it only after you approve.</span></div></div></div>` : ''}
      ${p.rider && p.status === 'out for delivery' ? `<p>🛵 ${p.rider} · arriving in ~${Math.max(1, Math.round((p.eta - Date.now()) / 60000))} min</p>` : ''}
      <ul>${p.meds.map(m => `<li>${esc(m.name)} — ${esc(m.dose)}</li>`).join('')}</ul></div>`).join('') || '<div class="card"><p class="muted">No prescriptions yet. After your visit, the doctor\'s prescription appears here automatically.</p></div>');
};

// ----- Health Journal (patient) -----
const READ = { 'Blood sugar (fasting)': ['mg/dL', 70, 100], 'Systolic BP': ['mmHg', 90, 130], 'Pulse': ['bpm', 60, 100], 'Weight': ['kg', 0, 999], 'SpO₂': ['%', 95, 100] };
V.journal = () => head('📔 Health Journal', 'Your visits, prescriptions, lab results and readings in one place, shared with your doctor when you choose.') +
  `<div class="grid g2"><div class="card"><h3>Add a reading</h3><div class="row"><select id="jr_k" style="flex:2">${Object.keys(READ).map(k => `<option>${k}</option>`).join('')}</select><input id="jr_v" type="number" placeholder="value" style="flex:1"><button class="btn sm" onclick="jrAdd()">Add</button></div>
    <label>Or write a note</label><textarea id="jr_n" placeholder="Felt dizzy after lunch…"></textarea><button class="btn sm ghost" style="margin-top:8px" onclick="jrNote()">Save note</button></div>
   <div class="card"><h3>Timeline</h3>${Store.db.journal.map(j => `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><span class="pill">${j.type}</span> <small class="muted">${j.date}</small><br>${esc(j.text)}</div>`).join('')}</div></div>`;
function jrAdd() {
  const k = $('#jr_k').value, v = +$('#jr_v').value; if (!v) return;
  const [u, lo, hi] = READ[k], flag = v < lo ? ' (low)' : v > hi ? ' (high)' : ' (normal)';
  act(`logged ${k} ${v} ${u}${flag}`, d => d.journal.unshift({ date: new Date().toISOString().slice(0, 10), type: 'Reading', text: `${k} ${v} ${u}${flag}` }));
}
function jrNote() { const t = $('#jr_n').value.trim(); if (t) act('added a journal note', d => d.journal.unshift({ date: new Date().toISOString().slice(0, 10), type: 'Note', text: t })); }

// ----- Lab Report Explainer -----
const LABS = [['Hemoglobin', 'g/dL', 12, 17, 7, 20, /(^|[^a-z])(hb|haemoglobin|hemoglobin)([^a-z1]|$)/], ['Fasting Blood Sugar', 'mg/dL', 70, 100, 54, 400, /fbs|fasting/], ['HbA1c', '%', 4, 5.6, null, 14, /hba1c/],
  ['Platelet Count', '/cumm', 150000, 410000, 50000, 1e6, /platelet/], ['TSH', 'uIU/mL', 0.4, 4.5, 0.01, 100, /tsh/], ['Serum Creatinine', 'mg/dL', 0.6, 1.3, null, 4, /creatinine/],
  ['Total Cholesterol', 'mg/dL', 0, 200, null, null, /cholesterol/], ['Vitamin D', 'ng/mL', 30, 100, null, 150, /vitamin d/], ['Vitamin B12', 'pg/mL', 200, 900, null, null, /b12/], ['Potassium', 'mEq/L', 3.5, 5.1, 2.5, 6.5, /potassium/]];
const HI = { low: 'कम', high: 'ज़्यादा', normal: 'सामान्य', critical: 'गंभीर – आज डॉक्टर को दिखाएं' };
V.labs = () => head('🧪 Lab Report Explainer', 'Paste a report. Every value is checked against its normal range. Explains, never diagnoses.') +
  `<div class="grid g2"><div class="card"><textarea id="lb_t" style="min-height:170px">Haemoglobin 10.4 g/dL\nFasting Blood Sugar 118 mg/dL\nHbA1c 6.4 %\nPlatelets 2.1 lakh\nTSH 2.3\nVitamin D 14 ng/mL</textarea>
    <div class="row" style="margin-top:10px"><select id="lb_l" style="width:auto"><option value="en">English</option><option value="hi">हिन्दी</option></select><button class="btn" onclick="lbRun()">Explain</button>${role === 'patient' ? '<button class="btn ghost" onclick="lbSave()">Save to journal</button>' : ''}</div></div>
   <div class="card" id="lb_o"><p class="muted">Results appear here.</p></div></div>`;
function lbParse() {
  const rows = [];
  $('#lb_t').value.split('\n').forEach(line => { const l = line.toLowerCase(), r = LABS.find(x => x[6].test(l)), m = l.match(/\d+(\.\d+)?/g); if (!r || !m) return;
    let v = parseFloat(m[m.length - 1]); if (/lakh/.test(l)) v *= 1e5; else if (r[1] === '/cumm' && v < 1000) v *= 1000;
    rows.push({ r, v, s: (r[4] != null && v < r[4]) || (r[5] != null && v > r[5]) ? 'critical' : v < r[2] ? 'low' : v > r[3] ? 'high' : 'normal' }); });
  return rows;
}
function lbRun() {
  const rows = lbParse(), hi = $('#lb_l').value === 'hi', cls = { critical: 'bad', high: 'warn', low: 'warn', normal: 'ok' };
  $('#lb_o').innerHTML = `<h3>${rows.length} values · ${rows.filter(x => x.s !== 'normal').length} need attention</h3>` + rows.map(({ r, v, s }) => `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><b>${r[0]}</b> ${v.toLocaleString('en-IN')} ${r[1]} <span class="pill ${cls[s]}">${hi ? HI[s] : s}</span><br><small class="muted">Normal ${r[2]}–${r[3]} ${r[1]}</small></div>`).join('') + '<p class="muted">Show these to your doctor. Not a diagnosis.</p>';
}
function lbSave() { const rows = lbParse(); if (rows.length) act('saved a lab report to the journal', d => d.journal.unshift({ date: new Date().toISOString().slice(0, 10), type: 'Lab', text: rows.map(x => `${x.r[0]} ${x.v} ${x.r[1]} (${x.s})`).join(', ') })); }

// ----- Emergency Check -----
const EMERG = /chest pain|pain in (my |the )?chest|heart attack|seene? (me|mein) dard|सीने में दर्द|can'?t breathe|breathless|saans|सांस|stroke|face drooping|slurred|unconscious|behosh|बेहोश|fits|seizure|overdose|vomiting blood|bleeding (heavily|a lot)|suicid|poison/i;
V.sos = () => head('🆘 Emergency Check', 'Describe what is happening, in English, Hindi or Hinglish.') +
  `<div class="grid g2"><div class="card"><textarea id="sos_t">Papa ko seene mein dard ho raha hai aur paseena aa raha hai</textarea><button class="btn" style="margin-top:10px" onclick="sosRun()">Check</button></div><div class="card" id="sos_o"></div></div>`;
function sosRun() {
  const e = EMERG.test($('#sos_t').value);
  $('#sos_o').innerHTML = e ? `<span class="pill bad">EMERGENCY</span><h3 style="margin:10px 0">Call 112 or 108 now.</h3><p>यह आपातकालीन स्थिति हो सकती है। तुरंत 112 / 108 पर कॉल करें या नज़दीकी अस्पताल जाएं।</p><a class="btn red" href="tel:108">📞 Call 108</a> <button class="btn ghost" onclick="act('raised an SOS alert to City Care ER');toast('City Care ER alerted')">Alert City Care ER</button>`
    : '<span class="pill ok">No danger signs found</span><p>Book a regular visit if it continues.</p><button class="btn ghost" onclick="go(\'appointments\')">Book a visit</button>';
}

render();
