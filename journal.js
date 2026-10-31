// Copilot daily journal (per family profile), stored in the shared network store so the doctor sees it.
// Mood, symptoms, pain/sleep/energy, medicines taken, side effects, note; a live pre-visit summary,
// daily guidance cards with a "today's plan" checklist, 14-day history and the records timeline.
const SYMS = ['Headache', 'Dizziness', 'Tiredness', 'Nausea', 'Pain', 'Cough', 'Fever', 'Breathlessness'];
const MOODS = [['😣', 'Very low'], ['🙁', 'Low'], ['😐', 'Okay'], ['🙂', 'Good'], ['😁', 'Great']];
const MEDS = [['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']];
// General wellness guidance only; the cards say to confirm changes with a doctor or dietitian.
const GUIDE = {
  diet: { ic: '🥗', title: 'Diet', short: 'Half your plate vegetables. Cut sugary drinks.', task: 'Choose one balanced meal today', goodL: 'Eat more', avoidL: 'Limit',
    good: ['Vegetables and salad, half of every plate', 'Dal, beans, eggs or paneer for protein', 'Whole grains: roti, brown rice, oats, millets', 'Plain curd, nuts and seeds in small portions', 'Water or unsweetened drinks'],
    avoid: ['Sweet drinks, packaged juice and soda', 'Sweets, mithai and desserts', 'Fried snacks and refined-flour foods', 'Large portions of white rice or bread'],
    doctor: 'Ask your doctor or dietitian before big changes, especially if you take diabetes medicines.' },
  activity: { ic: '🚶', title: 'Activity', short: 'A 20-minute walk after dinner.', task: 'Take a 20-minute walk', goodL: 'Do this', avoidL: 'Avoid',
    good: ['A 20-minute walk after dinner, most days', 'Light stretching or yoga in the morning', 'Taking the stairs when you can'],
    avoid: ['Sitting for long stretches; stand up every 45–60 minutes', 'Hard exercise when you feel unwell or very tired'],
    doctor: 'Stop and contact your doctor if you feel chest pain, breathlessness or dizziness during activity.' },
  sleep: { ic: '🌙', title: 'Sleep', short: 'Keep a steady bedtime.', task: 'Follow a steady wind-down routine', goodL: 'Do this', avoidL: 'Avoid',
    good: ['Same bedtime and wake-up time, even on weekends', 'A dark, quiet room', 'Dinner at least two hours before bed'],
    avoid: ['Phone or screens in bed', 'Tea or coffee after 4 pm', 'Heavy meals late at night'],
    doctor: 'Tell your doctor if poor sleep lasts more than two weeks.' },
  water: { ic: '💧', title: 'Water', short: 'Keep a bottle within reach.', task: 'Keep water nearby and sip through the day', goodL: 'Do this', avoidL: 'Avoid',
    good: ['Water through the day, and a glass with each meal', 'Keep a refillable bottle where you can see it'],
    avoid: ['Sugary drinks in place of water'],
    doctor: 'If your doctor has asked you to limit fluids, follow their advice instead.' },
};
let jdraft = null, activeProfile = null, jOpen = null, jFilter = 'all';
const profile = () => activeProfile || Store.db.family[0].name;
const djOf = n => { const d = Store.db; d.dj = d.dj || {}; return d.dj[n] || []; };
function setProfile(n) { activeProfile = n; jdraft = null; render(); }
const famChip = () => `<div class="famchip">${Store.db.family.map((m, i) => `<button class="${m.name === profile() ? 'on' : ''}" onclick="setProfile(Store.db.family[${i}].name)">${m.age < 12 ? '🧒' : m.age > 55 ? '👵' : '🧑'} ${esc(m.name.split(' ')[0])}</button>`).join('')}</div>`;
function jNew() { const e = djOf(profile()).find(x => x.date === today()); return e ? JSON.parse(JSON.stringify(e)) : { date: today(), mood: 3, syms: [], pain: 0, sleep: 4, energy: 3, meds: 'yes', side: '', note: '' }; }
function jSet(k, v) { jdraft[k] = v; render(); }
function jSym(x) { jdraft.syms = jdraft.syms.includes(x) ? jdraft.syms.filter(y => y !== x) : [...jdraft.syms, x]; render(); }
// sliders update their number and the live summary without a full redraw, so dragging stays smooth
function jRange(k, v) { jdraft[k] = +v; const o = document.getElementById('jv_' + k); if (o) o.textContent = v + ' / 5'; const s = document.getElementById('jSum'); if (s) s.innerHTML = draftSummary(); }
// the plan is a per-device, per-day checklist
const planKey = () => 'sehat_plan_' + profile() + '_' + today();
const planGet = () => { try { return JSON.parse(localStorage.getItem(planKey()) || '{}'); } catch { return {}; } };
const planSet = p => { try { localStorage.setItem(planKey(), JSON.stringify(p)); } catch {} render(); };
function planAdd(k) { const p = planGet(); if (!p[k]) { p[k] = false; planSet(p); toast("Added to today's plan"); } }
function planTick(k) { const p = planGet(); p[k] = !p[k]; planSet(p); }

const JCSS = `<style>
.jx .moods{display:flex;gap:8px;flex-wrap:wrap}.jx .moods button{width:52px;height:52px;border-radius:16px;border:1px solid var(--line);background:var(--card-solid);font-size:24px;cursor:pointer;transition:transform .2s,box-shadow .2s;filter:saturate(.7)}
.jx .moods button:hover{transform:translateY(-2px)}.jx .moods button.on{border:2px solid var(--teal);box-shadow:0 0 0 4px rgba(142,190,249,.35);filter:none}
.jx .moodl{font-size:.8rem;color:var(--muted);margin-top:4px}
.jx .rg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.jx .rc{border:1px solid var(--line);border-radius:14px;padding:10px 12px;background:var(--card-solid)}
.jx .rc .t{display:flex;justify-content:space-between;font-size:.8rem;font-weight:700;color:var(--muted)}.jx .rc output{color:var(--teal-dark);font-family:var(--display);font-weight:800}
.jx .rc input{padding:0;border:0;box-shadow:none;accent-color:#0774C4;background:none;margin:8px 0 2px}.jx .rc .e{display:flex;justify-content:space-between;font-size:.7rem;color:var(--muted)}
.jx dl{display:grid;grid-template-columns:110px 1fr;gap:6px 12px;margin:10px 0 0;font-size:.9rem}.jx dt{color:var(--muted)}.jx dd{margin:0;font-weight:600}
.jx .tiles{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px}.jx .tile{display:flex;gap:10px;text-align:left;border:1px solid var(--line);border-radius:14px;padding:12px;background:var(--card-solid);cursor:pointer;font:inherit;color:inherit;transition:transform .2s,border-color .2s}
.jx .tile:hover{transform:translateY(-2px);border-color:#8EBEF9}.jx .tile.on{border-color:var(--teal);background:var(--teal-tint)}.jx .tile.done{border-color:rgba(5,150,105,.4)}.jx .tile b{display:block}.jx .tile span{font-size:.8rem;color:var(--muted)}
.jx .det{margin-top:12px;padding:14px;border-radius:14px;border:1px solid rgba(7,116,196,.25);background:var(--teal-tint)}.jx .det .two{display:grid;grid-template-columns:1fr 1fr;gap:12px}.jx .det ul{margin:4px 0 0;padding-left:18px;font-size:.88rem}
.jx .lh{font-size:.75rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase}.jx .lh.g{color:var(--ok)}.jx .lh.a{color:var(--crit)}
.jx .plan label{display:flex;gap:8px;align-items:center;margin:6px 0;color:var(--ink);font-size:.9rem;cursor:pointer}.jx .plan input{width:auto;accent-color:#059669}
.jx .flt{display:inline-flex;gap:3px;padding:3px;border-radius:999px;background:rgba(7,116,196,.06);border:1px solid var(--line)}.jx .flt button{border:0;background:none;border-radius:999px;padding:4px 10px;font-size:.78rem;font-weight:600;color:var(--muted);cursor:pointer}.jx .flt button.on{background:var(--card-solid);color:var(--teal-dark)}
@media(max-width:600px){.jx .rg,.jx .tiles,.jx .det .two{grid-template-columns:1fr}}
</style>`;

function draftSummary() {
  const e = jdraft, rows = [['Mood', MOODS[e.mood - 1].join(' ')], ['Symptoms', e.syms.length ? e.syms.join(', ') : 'None logged'], ['Pain', e.pain + ' of 5'], ['Sleep', e.sleep + ' of 5'], ['Energy', e.energy + ' of 5'],
    ['Medicines', MEDS.find(m => m[0] === e.meds)[1]]];
  if (e.side) rows.push(['Side effects', e.side]); if (e.note) rows.push(['Note', e.note]);
  return rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('');
}
function trend() {
  const L = djOf(profile()).filter(e => (Date.now() - new Date(e.date)) / 864e5 <= 14);
  if (!L.length) return '';
  const avg = k => (L.reduce((s, e) => s + e[k], 0) / L.length).toFixed(1), cnt = {};
  L.forEach(e => e.syms.forEach(x => { cnt[x] = (cnt[x] || 0) + 1; }));
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 3), missed = L.filter(e => e.meds !== 'yes').length;
  return `<p class="muted" style="margin:12px 0 0"><b style="color:var(--ink)">Last ${L.length} day(s):</b> sleep ${avg('sleep')}/5 · energy ${avg('energy')}/5 · mood ${avg('mood')}/5${top.length ? ' · most common: ' + top.map(([x, c]) => `${x} (${c})`).join(', ') : ''}${missed ? ` · medicines missed/unsure ${missed} day(s)` : ''}</p>`;
}

V.journal = () => {
  jdraft = jdraft || jNew();
  const list = djOf(profile()).filter(e => (Date.now() - new Date(e.date)) / 864e5 <= 14).sort((a, b) => b.date.localeCompare(a.date));
  const plan = planGet(), pk = Object.keys(plan), g = jOpen && GUIDE[jOpen];
  const recs = Store.db.journal.filter(j => jFilter === 'all' || (jFilter === 'lab' ? /lab/i.test(j.type) : /reading|vitals/i.test(j.type))).slice(0, 8);
  const range = (k, lo, a, b) => `<div class="rc"><div class="t"><span>${{ pain: 'Pain level', sleep: 'Sleep quality', energy: 'Energy level' }[k]}</span><output id="jv_${k}">${jdraft[k]} / 5</output></div><input type="range" min="${lo}" max="5" value="${jdraft[k]}" oninput="jRange('${k}',this.value)"><div class="e"><span>${a}</span><span>${b}</span></div></div>`;
  return JCSS + famChip() + head('Daily journal', new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' · takes about a minute; your doctor sees it in the summary.') +
   `<div class="grid g2 jx"><div class="card"><span class="eyebrow">Daily check-in · ${esc(profile())}</span><h3 style="margin:6px 0 2px">How are you feeling today?</h3>
    <label>Mood</label><div class="moods">${MOODS.map(([m, l], i) => `<button class="${jdraft.mood === i + 1 ? 'on' : ''}" title="${l}" aria-label="${l} mood" onclick="jSet('mood',${i + 1})">${m}</button>`).join('')}</div><div class="moodl">${MOODS[jdraft.mood - 1][1]}</div>
    <label>Symptoms today <span style="font-weight:400">· select all that apply</span></label><div class="chips">${SYMS.map(x => `<button class="${jdraft.syms.includes(x) ? 'on' : ''}" onclick="jSym('${x}')">${x}</button>`).join('')}</div>
    <label>How was today?</label><div class="rg">${range('pain', 0, 'None', 'Severe')}${range('sleep', 1, 'Poor', 'Good')}${range('energy', 1, 'Low', 'High')}</div>
    <label>Did you take your medicines today?</label><div class="chips">${MEDS.map(([k, l]) => `<button class="${jdraft.meds === k ? 'on' : ''}" onclick="jSet('meds','${k}')">${l}</button>`).join('')}</div>
    <label>Anything you noticed after medicines? <span style="font-weight:400">· optional</span></label><input value="${esc(jdraft.side)}" oninput="jdraft.side=this.value;document.getElementById('jSum').innerHTML=draftSummary()" placeholder="e.g. felt sleepy after the evening tablet">
    <label>Note for your doctor <span style="font-weight:400">· optional</span></label><textarea oninput="jdraft.note=this.value;document.getElementById('jSum').innerHTML=draftSummary()" placeholder="Anything else your doctor should know">${esc(jdraft.note)}</textarea>
    <div class="row" style="margin-top:14px;border-top:1px solid var(--line);padding-top:12px"><span class="muted">${djOf(profile()).some(x => x.date === today()) ? '✓ Saved today · saving again updates it' : 'Not saved yet today'}</span><span class="sp"></span><button class="btn" onclick="jSave()">Save today →</button></div></div>
   <div class="grid" style="align-content:start">
    <div class="card"><div class="row"><span class="eyebrow">Pre-visit summary</span><span class="sp"></span><button class="btn sm ghost" onclick="shareSummary()">Share with doctor</button></div><p class="muted" style="margin:4px 0 0">Updates as you fill the form.</p><dl id="jSum">${draftSummary()}</dl>${trend()}</div>
    <div class="card"><div class="row"><span class="eyebrow">Daily guidance · small steps</span><span class="sp"></span><small class="muted">Tap a card</small></div>
     <div class="tiles">${Object.entries(GUIDE).map(([k, t]) => `<button class="tile ${jOpen === k ? 'on' : ''} ${plan[k] ? 'done' : ''}" onclick="jOpen=jOpen==='${k}'?null:'${k}';render()"><span style="font-size:22px">${t.ic}</span><div><b>${t.title}${plan[k] ? ' ✓' : ''}</b><span>${t.short}</span></div></button>`).join('')}</div>
     ${g ? `<div class="det"><div class="two"><div><div class="lh g">${g.goodL}</div><ul>${g.good.map(x => `<li>${x}</li>`).join('')}</ul></div><div><div class="lh a">${g.avoidL}</div><ul>${g.avoid.map(x => `<li>${x}</li>`).join('')}</ul></div></div>
       <p class="muted" style="margin:10px 0 8px">${g.doctor}</p>${jOpen in plan ? '<span class="pill ok">✓ In today\'s plan</span>' : `<button class="btn sm" onclick="planAdd('${jOpen}')">＋ Add to today's plan</button>`}</div>` : ''}
     ${pk.length ? `<div class="plan" style="margin-top:12px"><div class="row"><b>Today's plan</b><span class="sp"></span><span class="pill">${pk.filter(k => plan[k]).length} / ${pk.length} done</span></div>${pk.map(k => `<label><input type="checkbox" ${plan[k] ? 'checked' : ''} onchange="planTick('${k}')">${GUIDE[k].ic} ${GUIDE[k].task}</label>`).join('')}</div>` : ''}
     <p class="muted" style="font-size:.78rem;margin:10px 0 0">General wellness information, not a personal treatment plan.</p></div>
    <div class="card"><div class="row"><h3>Recent entries</h3><span class="sp"></span><span class="muted">${list.length} in 14 days</span></div>${list.map(e => `<div style="padding:9px 0;border-bottom:1px solid var(--line)"><div class="row"><b>${e.date.slice(5)}</b><span style="font-size:18px">${(MOODS[e.mood - 1] || MOODS[2])[0]}</span><span class="muted">pain ${e.pain}/5 · sleep ${e.sleep}/5 · energy ${e.energy}/5</span></div>${e.syms.map(x => `<span class="pill" style="margin:4px 4px 0 0">${x}</span>`).join('')}${e.note ? `<br><small class="muted">${esc(e.note)}</small>` : ''}</div>`).join('') || '<p class="muted">Save today\'s check-in to start your health story.</p>'}</div>
   </div></div>
   <div class="card jx" style="margin-top:16px"><div class="row"><h3>Records timeline</h3><span class="sp"></span><div class="flt">${[['all', 'All'], ['lab', 'Lab'], ['reading', 'Vitals']].map(([k, l]) => `<button class="${jFilter === k ? 'on' : ''}" onclick="jFilter='${k}';render()">${l}</button>`).join('')}</div></div>
    ${recs.map(j => `<div style="padding:9px 0;border-bottom:1px solid var(--line)"><span class="pill ${/critical/i.test(j.text) ? 'bad' : ''}">${j.type}</span> <small class="muted">${j.date}</small><br>${esc(j.text)}${/critical/i.test(j.text) ? '<br><span class="pill bad" style="margin-top:4px">Marked critical · contact your doctor soon</span>' : ''}</div>`).join('') || '<p class="muted">No records yet. Read a report in Records & OCR and save it to the journal.</p>'}</div>`;
};
function jSave() {
  const n = profile(), e = { ...jdraft, t: Date.now() };
  act(`saved a daily check-in for ${n}`, d => { d.dj = d.dj || {}; d.dj[n] = (d.dj[n] || []).filter(x => x.date !== e.date).concat([e]); });
  jdraft = null; toast('Saved. Your doctor\'s summary is updated.');
}
function shareSummary() { act(`shared ${profile()}'s pre-visit summary with ${ROLES.doctor.org}`); toast('Shared with your doctor'); }
render();
