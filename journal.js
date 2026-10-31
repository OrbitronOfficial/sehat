// Copilot daily journal (per family profile).
// Mood, symptoms, pain/sleep/energy, medicines taken, side effects, note; 14-day history,
// a pre-visit summary the doctor can read, and diet / activity / sleep / habit cards.
const SYMS = ['headache', 'dizziness', 'tiredness', 'nausea', 'pain', 'cough', 'fever', 'breathlessness'];
const MOODS = ['😣', '😕', '😐', '🙂', '😄'];
let jdraft = null, activeProfile = null;
const profile = () => activeProfile || Store.db.family[0].name;
const djOf = n => { const d = Store.db; d.dj = d.dj || {}; return d.dj[n] || []; };
function setProfile(n) { activeProfile = n; jdraft = null; render(); }
const famChip = () => `<div class="famchip">${Store.db.family.map((m, i) => `<button class="${m.name === profile() ? 'on' : ''}" onclick="setProfile(Store.db.family[${i}].name)">${m.age < 12 ? '🧒' : m.age > 55 ? '👵' : '🧑'} ${esc(m.name.split(' ')[0])}</button>`).join('')}</div>`;
function jNew() { const e = djOf(profile()).find(x => x.date === today()); return e ? JSON.parse(JSON.stringify(e)) : { date: today(), mood: 3, syms: [], pain: 0, sleep: 3, energy: 3, meds: 'yes', side: '', note: '' }; }
function jSet(k, v) { jdraft[k] = v; render(); }
function jSym(x) { jdraft.syms = jdraft.syms.includes(x) ? jdraft.syms.filter(y => y !== x) : [...jdraft.syms, x]; render(); }
const scale = (k, max, from = 1) => `<div class="scale">${Array.from({ length: max - from + 1 }, (_, i) => i + from).map(v => `<button class="${jdraft[k] === v ? 'on' : ''}" onclick="jSet('${k}',${v})">${v}</button>`).join('')}</div>`;

V.journal = () => {
  jdraft = jdraft || jNew();
  const list = djOf(profile()).filter(e => (Date.now() - new Date(e.date)) / 864e5 <= 14).sort((a, b) => b.date.localeCompare(a.date));
  return famChip() + head('How are you today?', 'A quick note on how you feel. It helps you remember things for your doctor.') +
   `<div class="grid g2"><div class="card"><span class="eyebrow">Daily journal · ${esc(profile())}</span>
    <label>Mood</label><div class="scale">${MOODS.map((m, i) => `<button style="font-size:20px" class="${jdraft.mood === i + 1 ? 'on' : ''}" onclick="jSet('mood',${i + 1})">${m}</button>`).join('')}</div>
    <label>Symptoms today</label><div class="chips">${SYMS.map(x => `<button class="${jdraft.syms.includes(x) ? 'on' : ''}" onclick="jSym('${x}')">${x}</button>`).join('')}</div>
    <div class="grid g3"><div><label>Pain (0–5)</label>${scale('pain', 5, 0)}</div><div><label>Sleep (1 poor, 5 good)</label>${scale('sleep', 5)}</div><div><label>Energy (1 low, 5 high)</label>${scale('energy', 5)}</div></div>
    <label>Did you take your medicines today?</label><div class="chips">${[['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']].map(([k, l]) => `<button class="${jdraft.meds === k ? 'on' : ''}" onclick="jSet('meds','${k}')">${l}</button>`).join('')}</div>
    <label>Anything you noticed after medicines (side effects)?</label><input value="${esc(jdraft.side)}" oninput="jdraft.side=this.value" placeholder="e.g. felt sleepy after the evening tablet">
    <label>Note</label><textarea oninput="jdraft.note=this.value">${esc(jdraft.note)}</textarea>
    <button class="btn" style="margin-top:12px" onclick="jSave()">Save today</button></div>
   <div class="grid" style="align-content:start">${preVisit()}${habitCards()}
    <div class="card"><h3>Recent entries</h3>${list.map(e => `<div style="padding:8px 0;border-bottom:1px solid var(--line)"><b>${e.date}</b> ${MOODS[e.mood - 1]} <span class="muted">sleep ${e.sleep}/5 · energy ${e.energy}/5${e.pain ? ' · pain ' + e.pain + '/5' : ''}</span><br>${e.syms.map(x => `<span class="pill" style="margin:3px 3px 0 0">${x}</span>`).join('')}${e.note ? `<br><small class="muted">${esc(e.note)}</small>` : ''}</div>`).join('') || '<p class="muted">No entries in the last 14 days.</p>'}</div>
    <div class="card"><h3>Records timeline</h3>${Store.db.journal.slice(0, 6).map(j => `<div style="padding:6px 0;border-bottom:1px solid var(--line)"><span class="pill">${j.type}</span> <small class="muted">${j.date}</small><br>${esc(j.text)}</div>`).join('')}</div></div></div>`;
};
function jSave() {
  const n = profile(), e = jdraft;
  act(`saved a journal entry for ${n}`, d => { d.dj = d.dj || {}; d.dj[n] = (d.dj[n] || []).filter(x => x.date !== e.date).concat([e]); });
  jdraft = null; toast('Saved.');
}
function preVisit() {
  const L = djOf(profile()).filter(e => (Date.now() - new Date(e.date)) / 864e5 <= 14);
  if (!L.length) return '<div class="card"><span class="eyebrow">Pre-visit summary</span><p class="muted">Log a few days and a summary for your doctor appears here.</p></div>';
  const avg = k => (L.reduce((s, e) => s + e[k], 0) / L.length).toFixed(1), cnt = {};
  L.forEach(e => e.syms.forEach(x => { cnt[x] = (cnt[x] || 0) + 1; }));
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 3), missed = L.filter(e => e.meds !== 'yes').length, side = L.filter(e => e.side).map(e => e.side);
  return `<div class="card"><span class="eyebrow">Pre-visit summary · last ${L.length} day(s)</span><ul style="margin:8px 0;padding-left:18px">
    <li>Average sleep ${avg('sleep')}/5, energy ${avg('energy')}/5, mood ${avg('mood')}/5</li>
    <li>${top.length ? 'Most common: ' + top.map(([x, c]) => `${x} (${c} day${c > 1 ? 's' : ''})`).join(', ') : 'No symptoms logged'}</li>
    <li>${missed ? `Medicines missed or unsure on ${missed} day(s)` : 'Medicines taken every logged day'}</li>${side.length ? `<li>Side effects noted: ${esc(side.slice(0, 2).join('; '))}</li>` : ''}</ul>
    <button class="btn sm ghost" onclick="shareSummary()">Share with doctor</button></div>`;
}
function shareSummary() { act(`shared ${profile()}'s pre-visit summary with ${ROLES.doctor.org}`); toast('Shared with your doctor'); }
function habitCards() {
  const L = djOf(profile()).slice(-7), low = k => L.length > 0 && L.reduce((s, e) => s + e[k], 0) / L.length < 3;
  const c = [['🥗', 'Diet', 'Half your plate vegetables; cut sugary drinks.'], ['🚶', 'Activity', '20-minute walk after dinner helps sugar and sleep.'],
    ['😴', 'Sleep', low('sleep') ? 'Your sleep has been low: same bedtime, no screens 1 hour before.' : 'Keep a steady bedtime.'],
    ['🌿', 'Habits', low('energy') ? 'Low energy lately: drink water, step out in daylight.' : '8 glasses of water a day.']];
  return `<div class="card"><span class="eyebrow">Next steps · habits</span><div class="grid g2" style="margin-top:8px">${c.map(([i, t, x]) => `<div><b>${i} ${t}</b><br><span class="muted">${x}</span></div>`).join('')}</div></div>`;
}
render();
