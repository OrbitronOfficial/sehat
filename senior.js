// Sehat Senior Mode ("the Dadi / Nani test"): a patient setting that turns the patient app into three big buttons
// for an elder (medicines now, talk to Dr. Saathi, SOS), with spoken reminders in their language, double-dose
// lock, a caregiver alert when a dose is missed and a photo-to-spoken report explainer.
// Settings live in the shared store (prefs[member]), so a doctor can switch it on from the consult too.
const VLANGS = [['hi', 'हिन्दी', 'hi-IN'], ['pa', 'ਪੰਜਾਬੀ', 'pa-IN'], ['ta', 'தமிழ்', 'ta-IN'], ['bn', 'বাংলা', 'bn-IN'], ['te', 'తెలుగు', 'te-IN'], ['mr', 'मराठी', 'mr-IN'], ['gu', 'ગુજરાતી', 'gu-IN'], ['en', 'English', 'en-IN']];
// how each medicine looks once the pharmacy packs it (the demo catalogue); anything else is "your tablet"
const PILLS = { 'Amlodipine 5mg': ['⚪', 'छोटी सफ़ेद गोली', 'BP'], 'Metformin 500mg': ['⚪', 'बड़ी सफ़ेद गोली', 'शुगर'], 'Atorvastatin 10mg': ['🔵', 'नीली गोली', 'कोलेस्ट्रॉल'],
  'Pantoprazole 40mg': ['🟡', 'पीली गोली', 'पेट'], 'Paracetamol 650mg': ['⚪', 'सफ़ेद गोली', 'बुखार'], 'Cetirizine 10mg': ['🟢', 'छोटी गोली', 'एलर्जी'] };
const SLOTS = [['morning', 'सुबह', '🌅', 0, 12], ['afternoon', 'दोपहर', '☀️', 12, 17], ['night', 'रात', '🌙', 17, 24]];
const slotOf = t => SLOTS.find(s => +t.slice(0, 2) >= s[3] && +t.slice(0, 2) < s[4]) || SLOTS[0];
const pOf = n => (Store.db.prefs || {})[n] || {};
function setP(n, k, v) { act(`${k === 'senior' ? (v ? 'turned on' : 'turned off') + ' Senior Mode for' : 'updated settings for'} ${n}`, d => { d.prefs = d.prefs || {}; d.prefs[n] = { ...(d.prefs[n] || {}), [k]: v }; }); }
const seniorAs = () => { try { return localStorage.getItem('sehat_senior_as'); } catch { return null; } };
function useSenior(n, on) { try { on ? localStorage.setItem('sehat_senior_as', n) : localStorage.removeItem('sehat_senior_as'); } catch {} setP(n, 'senior', on); }
const seniorOn = () => { const n = seniorAs(); return n && pOf(n).senior && role === 'patient'; };
function say(text, n) {
  if (!('speechSynthesis' in window)) return toast(text);
  const lang = (VLANGS.find(l => l[0] === (pOf(n).vlang || 'hi')) || VLANGS[0])[2], v = speechSynthesis.getVoices().find(x => x.lang.replace('_', '-').toLowerCase().startsWith(lang.slice(0, 2)));
  const u = new SpeechSynthesisUtterance(text); u.lang = lang; if (v) u.voice = v; u.rate = .9; speechSynthesis.cancel(); speechSynthesis.speak(u);
}
const medsFor = n => Store.db.reminders.filter(r => r.who === n);
const pillTxt = r => { const p = PILLS[r.med]; return p ? `${p[1]} (${p[2]} की)` : r.med; };

// ---------- Settings tab (patient) ----------
V.psettings = () => {
  const fam = Store.db.family, as = seniorAs(), alerts = (Store.db.alerts || []).slice(0, 5);
  return head('Settings', 'Senior Mode, voice and caregiver for each family member.') + `<div class="grid g2"><div class="card"><span class="eyebrow">👵 Senior Mode</span><h3 style="margin:6px 0">Big buttons for elders</h3>
    <p class="muted">Turns the app into three large buttons: medicines now, talk to Dr. Saathi, and SOS. Reminders are spoken aloud and a missed dose alerts the caregiver.</p>
    ${fam.map(m => { const on = !!pOf(m.name).senior; return `<div class="row" style="padding:12px 0;border-bottom:1px solid var(--line)"><span style="font-size:24px">${m.age > 55 ? '👵' : m.age < 12 ? '🧒' : '🧑'}</span><div><b>${esc(m.name)}</b><br><span class="muted">${m.rel} · ${m.age} y${on && as === m.name ? ' · on this device' : ''}</span></div><span class="sp"></span>
      <button class="btn sm ${on ? '' : 'ghost'}" role="switch" aria-checked="${on}" onclick="useSenior(Store.db.family[${fam.indexOf(m)}].name, ${!on})">${on ? '● Senior Mode on' : 'Turn on'}</button></div>`; }).join('')}
    ${as && pOf(as).senior ? `<button class="btn" style="margin-top:14px" onclick="go('sehat_copilot')">Open Senior Mode for ${esc(as)} →</button>` : ''}</div>
   <div class="card"><span class="eyebrow">Voice & caregiver</span>${fam.map((m, i) => { const p = pOf(m.name); return `<div style="padding:10px 0;border-bottom:1px solid var(--line)"><b>${esc(m.name)}</b>
     <div class="grid g3" style="gap:8px;margin-top:6px"><select onchange="setP(Store.db.family[${i}].name,'vlang',this.value)">${VLANGS.map(([k, l]) => `<option value="${k}" ${(p.vlang || 'hi') === k ? 'selected' : ''}>🔊 ${l}</option>`).join('')}</select>
     <input placeholder="Caregiver (e.g. Rahul)" value="${esc(p.cgName || (m.rel === 'Self' ? '' : fam[0].name.split(' ')[0]))}" onchange="setP(Store.db.family[${i}].name,'cgName',this.value)"><input placeholder="Caregiver phone" inputmode="tel" value="${esc(p.cgPhone || '')}" onchange="setP(Store.db.family[${i}].name,'cgPhone',this.value)"></div></div>`; }).join('')}
     <h3 style="margin-top:16px">Caregiver alerts</h3>${alerts.map(a => `<p>🔔 <b>${esc(a.who)}</b> has not logged ${esc(a.med)} (${a.slot}) · alerted ${esc(a.to)} · ${ago(a.t)}</p>`).join('') || '<p class="muted">No alerts.</p>'}
     <p class="muted" style="font-size:.8rem">Alerts appear here and in the caregiver's Sehat app. Sending WhatsApp or SMS needs a messaging provider, which this prototype does not have yet.</p></div></div>`;
};

// ---------- Senior home ----------
let sosT = null;
function seniorHome() {
  const n = seniorAs(), first = n.split(' ')[0], p = pOf(n), now = new Date(), hr = now.getHours(), cur = SLOTS.find(s => hr >= s[3] && hr < s[4]);
  const mine = medsFor(n), slot = [cur, ...SLOTS].find(s => mine.some(r => slotOf(r.time) === s)) || cur, due = mine.filter(r => slotOf(r.time) === slot);
  const done = due.length && due.every(r => r.taken.includes(today())), cg = p.cgName || Store.db.family[0].name.split(' ')[0];
  const alert = (Store.db.alerts || []).find(a => a.who === n && a.day === today());
  return `<style>.sr{font-size:20px}.sr h1{font-size:2.2rem}.sr .big{display:block;width:100%;text-align:left;border-radius:28px;padding:24px 26px;margin-bottom:16px;border:2px solid var(--line);background:var(--card-solid);color:var(--ink);font:inherit;cursor:pointer;box-shadow:var(--shadow)}
   .sr .big h2{font-size:1.6rem;margin:0 0 6px}.sr .big p{margin:0;color:var(--muted)}.sr .ok{background:#ECFDF5;border-color:#059669}.sr .sos{background:#FEF2F2;border-color:#DC2626}.sr .sos h2{color:#B91C1C}
   .sr .tk{display:inline-flex;margin-top:14px;padding:16px 26px;border-radius:999px;background:#059669;color:#fff;font-weight:800;font-size:1.3rem;border:0;cursor:pointer}.sr .pill-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px}.sr .pl{padding:8px 14px;border-radius:14px;background:var(--teal-tint);font-size:1.05rem}
   .sr .mini{display:flex;gap:10px;flex-wrap:wrap}.sr .mini button{font-size:1rem}
   :root[data-theme="dark"] .sr .ok{background:rgba(5,150,105,.15)}:root[data-theme="dark"] .sr .sos{background:rgba(220,38,38,.15)}
   .sosx{position:fixed;inset:0;z-index:99;background:rgba(127,29,29,.92);color:#fff;display:grid;place-items:center;text-align:center;font-size:22px}.sosx b{font-size:5rem;display:block}.sosx button{margin-top:18px;font-size:1.2rem;padding:16px 30px;border-radius:999px;border:2px solid #fff;background:transparent;color:#fff;cursor:pointer}</style>
  <div class="sr"><div class="row" style="margin-bottom:14px"><div><span class="eyebrow">👵 Senior Mode</span><h1>नमस्ते, ${esc(first)} जी</h1></div><span class="sp"></span><button class="btn sm ghost" onclick="useSenior('${esc(n)}', false);render()">Standard mode</button></div>
   ${alert ? `<div class="ai">🔔 ${esc(alert.med)} की दवा अभी तक नहीं ली गई, इसलिए ${esc(alert.to)} को सूचना भेजी गई है।</div>` : ''}
   <div class="big ${done ? 'ok' : ''}"><h2>${slot[2]} ${slot[1]} की दवाइयां</h2>
     ${due.length ? `<div class="pill-row">${due.map(r => `<span class="pl">${(PILLS[r.med] || ['💊'])[0]} ${pillTxt(r)} · ${r.time}</span>`).join('')}</div>` : '<p>इस समय कोई दवा नहीं है।</p>'}
     ${due.length ? (done ? `<p style="margin-top:12px;color:#047857;font-weight:800">✅ आज ${slot[1]} की दवा हो चुकी है</p>` : `<button class="tk" onclick="srTake('${slot[0]}')">✅ मैंने ले ली</button>`) : ''}
     <div class="mini" style="margin-top:12px"><button class="btn sm ghost" onclick="srSpeak('${slot[0]}')">🔊 सुनिए</button></div></div>
   <button class="big" onclick="srAsk()"><h2>🎙️ डॉक्टर साथी से बात करें</h2><p>"बस बोलिए, हम सुन रहे हैं…"</p></button>
   <button class="big sos" onclick="srSOS()"><h2>🆘 मदद चाहिए / आपातकाल</h2><p>एक बार दबाएं: ${esc(cg)} और 112 को कॉल, City Care को सूचना</p></button>
   <label class="big" style="cursor:pointer"><h2>📄 रिपोर्ट की फोटो → सुनिए</h2><p id="srRep">फोटो लीजिए, डॉक्टर साथी पढ़कर सुनाएंगे।</p><input type="file" accept="image/*,application/pdf" style="display:none" onchange="srReport(this.files[0])"></label></div>`;
}
function srTake(slot) {
  const n = seniorAs(); act(`${n} took the ${slot} medicines`, d => d.reminders.forEach(r => { if (r.who === n && slotOf(r.time)[0] === slot && !r.taken.includes(today())) r.taken.push(today()); }));
  say(`बहुत अच्छे। आज ${(SLOTS.find(s => s[0] === slot) || SLOTS[0])[1]} की दवा हो गई।`, n);
}
function srSpeak(slot) {
  const n = seniorAs(), first = n.split(' ')[0], due = medsFor(n).filter(r => slotOf(r.time)[0] === slot), s = SLOTS.find(x => x[0] === slot);
  say(due.length ? `${first} जी, ${s[1]} की दवा का समय हो गया है: ${due.map(pillTxt).join(', ')}।` : `${first} जी, अभी कोई दवा नहीं है।`, n);
}
function srAsk() { const f = document.querySelector('.sx-fab'); if (f) { f.click(); setTimeout(() => document.getElementById('sxMic')?.click(), 400); } else toast('Dr. Saathi is loading…'); }
function srSOS() {
  const n = seniorAs(); let s = 3; const o = document.createElement('div'); o.className = 'sosx';
  o.innerHTML = `<div>मदद भेज रहे हैं…<b id="sosN">3</b><button onclick="srCancel()">रद्द करें (Cancel)</button></div>`; document.body.appendChild(o);
  sosT = setInterval(() => { s--; const e = document.getElementById('sosN'); if (e) e.textContent = s; if (s <= 0) { clearInterval(sosT); o.remove(); srSend(n); } }, 1000);
}
function srCancel() { clearInterval(sosT); document.querySelector('.sosx')?.remove(); toast('Cancelled'); }
function srSend(n) {
  const p = pOf(n), cg = p.cgName || Store.db.family[0].name.split(' ')[0], m = Store.db.family.find(f => f.name === n) || {};
  act(`🆘 SOS from ${n} · City Care ER alerted`, d => { d.sos = d.sos || []; d.sos.unshift({ who: n, t: Date.now(), age: m.age, cond: m.cond, meds: [...new Set(d.reminders.filter(r => r.who === n).map(r => r.med))], to: 'City Care Hospital', ack: false }); }, ['patient', 'hospital']);
  const o = document.createElement('div'); o.className = 'sosx';
  o.innerHTML = `<div>✅ City Care ER को सूचना भेज दी गई<br><br><a href="tel:112" style="color:#fff;font-size:2rem;font-weight:800">📞 112 पर कॉल करें</a><br><br>${p.cgPhone ? `<a href="tel:${esc(p.cgPhone)}" style="color:#fff;font-size:1.6rem">📞 ${esc(cg)} को कॉल करें</a>` : `<span style="font-size:1rem">${esc(cg)} का नंबर Settings में जोड़ें</span>`}<br><button onclick="this.closest('.sosx').remove()">ठीक है</button></div>`;
  document.body.appendChild(o); say('मदद आ रही है। घबराइए मत।', n);
}
async function srReport(f) {
  if (!f) return; const n = seniorAs(), lang = pOf(n).vlang || 'hi', out = document.getElementById('srRep');
  out.textContent = 'पढ़ रहे हैं…';
  try {
    const { mime, data } = await fileToData(f), rec = (await postJSON('/api/extract', { filename: f.name, mime, data, lang })).record;
    const x = (await postJSON('/api/explain', { record: rec, lang })).explanation || {};
    out.textContent = x.summary || 'रिपोर्ट पढ़ ली गई।'; say(x.summary || 'रिपोर्ट पढ़ ली गई।', n);
  } catch (e) { out.textContent = 'अभी पढ़ नहीं पाए। थोड़ी देर बाद फिर कोशिश करें।'; }
}
// a dose still not taken 45 minutes after its time alerts the caregiver once that day
function srWatch() {
  const n = seniorAs(); if (!n || !pOf(n).senior) return; const now = new Date(), cg = pOf(n).cgName || Store.db.family[0].name.split(' ')[0];
  medsFor(n).forEach(r => { const [h, m] = r.time.split(':').map(Number), due = new Date(); due.setHours(h, m + 45, 0, 0);
    if (now > due && !r.taken.includes(today()) && !(Store.db.alerts || []).some(a => a.who === n && a.med === r.med && a.day === today()))
      act(`🔔 alerted ${cg}: ${n} has not logged ${r.med}`, d => { d.alerts = d.alerts || []; d.alerts.unshift({ who: n, med: r.med, slot: slotOf(r.time)[1], to: cg, day: today(), t: Date.now() }); }); });
}

// ---------- hook into the patient suite, the doctor's consult and City Care's command centre ----------
const baseCopilot = V.sehat_copilot, baseCopilotAfter = V.sehat_copilot.after;
V.sehat_copilot = () => {
  if (seniorOn()) return seniorHome();
  const al = (Store.db.alerts || []).filter(a => a.day === today()), so = (Store.db.sos || []).filter(s => Date.now() - s.t < 864e5 && Store.db.family.some(f => f.name === s.who));
  return (so.length ? `<div class="ai" style="border-color:#DC2626">🆘 <b>SOS from ${esc(so[0].who)}</b> ${ago(so[0].t)} · City Care ER alerted</div>` : '') +
    (al.length ? `<div class="ai">🔔 <b>Caregiver alert:</b> ${al.map(a => `${esc(a.who)} has not logged ${esc(a.med)}`).join('; ')}</div>` : '') + baseCopilot();
};
V.sehat_copilot.after = () => { if (seniorOn()) { setTimeout(srWatch, 300); return; } baseCopilotAfter && baseCopilotAfter(); };
const baseConsult = V.consult;
V.consult = () => baseConsult().replace('<button class="btn" style="margin-top:10px" onclick="csSave()">',
  '<label style="display:flex;gap:8px;margin:10px 0 0;color:var(--txt)"><input type="checkbox" id="cs_senior" style="width:auto"> 👵 Enable Senior Mode &amp; voice reminders for this patient</label><button class="btn" style="margin-top:10px" onclick="csSave()">');
const baseCsSave = csSave;
csSave = function () { const p = $('#cs_p')?.value, on = $('#cs_senior')?.checked; if (p && on) act(`turned on Senior Mode for ${p}`, d => { d.prefs = d.prefs || {}; d.prefs[p] = { ...(d.prefs[p] || {}), senior: true }; }); baseCsSave(); };
const baseCommand = V.command;
V.command = () => { const so = (Store.db.sos || []).filter(s => !s.ack && (s.to === R.org || role !== 'hospital')).slice(0, 3);
  return so.map((s, i) => `<div class="ai" style="border-color:#DC2626"><span style="font-size:24px">🆘</span><div style="flex:1"><b>SOS · ${esc(s.who)}</b>${s.age ? ', ' + s.age + ' y' : ''} · ${ago(s.t)}<br><span class="muted">${esc(s.cond || '')}${s.meds.length ? ' · on ' + esc(s.meds.join(', ')) : ''}</span></div><button class="btn sm red" onclick="act('acknowledged the SOS from ${esc(s.who)}',d=>{const x=d.sos.find(y=>y.t===${s.t});if(x)x.ack=true})">Ambulance sent ✓</button></div>`).join('') + baseCommand(); };
render();
