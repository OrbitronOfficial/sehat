// Copilot daily journal (per family profile), laid out like the "Health Journal & Daily Guidance" design:
// welcome header, three at-a-glance metrics, the check-in form, a pre-visit summary card, guidance cards that
// open a detail sheet with "add to today's plan", recent entries and the records timeline.
// Check-ins live in the shared network store, so they sync across devices and the doctor sees them.
const SYMS = ['Headache', 'Dizziness', 'Tiredness', 'Nausea', 'Pain', 'Cough', 'Fever', 'Breathlessness'];
const MOODS = [['😣', 'Very low'], ['🙁', 'Low'], ['😐', 'Okay'], ['🙂', 'Good'], ['😁', 'Great']];
const MEDS = [['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']];
// General wellness information (shown as such); never a personal treatment plan.
const HABITS = {
  diet: { ic: '🥗', tone: 'green', title: 'Diet & nutrition', short: 'What to eat and how to build a balanced plate.', tap: 'Explore meal guide', kicker: 'Food guide',
    lead: 'A simple, flexible way to put together balanced meals using familiar everyday foods.', banner: 'Build a balanced plate',
    bannerText: 'Use variety and balance as a guide. Your needs may differ based on allergies, medicines, culture and health conditions.',
    body: `<div class="jd-grid"><div class="jd-card"><h4>🥣 Easy meal ideas</h4><div class="jd-meal"><b>Breakfast</b><span>Vegetable poha with curd, idli with sambar, or eggs with whole-grain toast.</span></div><div class="jd-meal"><b>Lunch</b><span>Roti or rice, dal or beans, a seasonal sabzi and salad.</span></div><div class="jd-meal"><b>Snack</b><span>A fruit, plain curd, or a small handful of nuts if suitable.</span></div><div class="jd-meal"><b>Dinner</b><span>A home-cooked meal with vegetables and a protein food such as dal, paneer, beans or egg.</span></div></div>
      <div class="jd-card"><h4>🍽️ A simple plate guide</h4><ul><li>Fill about half your plate with vegetables or salad.</li><li>Add a protein food such as dal, beans, paneer, curd, egg or fish.</li><li>Include a grain such as roti, rice or millet.</li><li>Choose water more often; keep portions comfortable.</li></ul></div></div>
      <div class="jd-tip">General meal examples, not a medical diet. With diabetes, kidney disease, food allergies, pregnancy or another condition, ask a registered dietitian or your doctor for a personal plan. Do not change prescribed medicines because of this guide.</div>`,
    task: 'Choose one balanced meal today' },
  activity: { ic: '🚶', tone: '', title: 'Activity', short: 'Simple movement ideas for your day.', tap: 'Explore activity', kicker: 'Move your way',
    lead: 'Pick comfortable movement that fits your day and your current ability.', banner: 'A little movement counts',
    bannerText: 'Start gently and choose something you enjoy. Your doctor can guide you if you have symptoms or a medical restriction.',
    body: `<div class="jd-grid"><div class="jd-card"><h4>🚶 Ideas to try</h4><ul><li>A relaxed walk around your home or outdoors.</li><li>Gentle stretching after sitting for a while.</li><li>Light household activity or a favourite low-impact activity.</li></ul></div>
      <div class="jd-card"><h4>🗓️ Make it easier</h4><ul><li>Break movement into short, comfortable sessions.</li><li>Keep water nearby and wear comfortable footwear.</li><li>Choose a realistic time that works for you.</li></ul></div></div>
      <div class="jd-tip">Do not push through pain, dizziness, chest discomfort or unusual breathlessness. Stop and seek medical advice when these occur.</div>`,
    task: 'Take a comfortable movement break' },
  sleep: { ic: '🌙', tone: 'purple', title: 'Sleep routine', short: 'Small habits for a calmer bedtime.', tap: 'Explore sleep tips', kicker: 'Rest & reset',
    lead: 'A few consistent habits can make it easier to wind down at night.', banner: 'Create a calmer bedtime',
    bannerText: 'A steady routine matters more than trying to make every night perfect.',
    body: `<div class="jd-grid"><div class="jd-card"><h4>🌜 Before bed</h4><ul><li>Keep a regular sleep and wake time.</li><li>Dim bright screens and lights before bedtime.</li><li>Choose a quiet activity such as reading or calm music.</li></ul></div>
      <div class="jd-card"><h4>☀️ During the day</h4><ul><li>Get some daylight when practical.</li><li>Keep daytime naps brief if they affect night sleep.</li><li>Notice whether late caffeine affects your rest.</li></ul></div></div>
      <div class="jd-tip">Sleep needs vary with age and health. If poor sleep continues or affects daily life, talk to a doctor.</div>`,
    task: 'Follow a steady wind-down routine' },
  hydration: { ic: '💧', tone: 'amber', title: 'Hydration', short: 'Easy ways to remember water through the day.', tap: 'Explore hydration', kicker: 'Water reminder',
    lead: 'Build a simple reminder habit so drinking water is easier to remember.', banner: 'Keep water within reach',
    bannerText: 'Your fluid needs depend on activity, climate, medicines and health conditions.',
    body: `<div class="jd-grid"><div class="jd-card"><h4>💧 Easy reminders</h4><ul><li>Keep a refillable bottle where you can see it.</li><li>Have water with regular meals.</li><li>Take small water breaks during your day.</li></ul></div>
      <div class="jd-card"><h4>🥛 Other options</h4><ul><li>Water-rich foods such as cucumber and fruit help too.</li><li>Choose water more often than sugary drinks.</li><li>Refill your bottle when you take a break.</li></ul></div></div>
      <div class="jd-tip">There is no single fluid target for everyone. Follow your doctor if you have been told to limit fluids.</div>`,
    task: 'Keep water nearby and take regular sips' },
};
let jdraft = null, activeProfile = null, jFilter = 'all';
const profile = () => activeProfile || Store.db.family[0].name;
const djOf = n => { const d = Store.db; d.dj = d.dj || {}; return d.dj[n] || []; };
function setProfile(n) { activeProfile = n; jdraft = null; render(); }
const famChip = () => `<div class="famchip">${Store.db.family.map((m, i) => `<button class="${m.name === profile() ? 'on' : ''}" onclick="setProfile(Store.db.family[${i}].name)">${m.age < 12 ? '🧒' : m.age > 55 ? '👵' : '🧑'} ${esc(m.name.split(' ')[0])}</button>`).join('')}</div>`;
function jNew() { const e = djOf(profile()).find(x => x.date === today()); return e ? JSON.parse(JSON.stringify(e)) : { date: today(), mood: 3, syms: [], pain: 0, sleep: 4, energy: 3, meds: 'yes', side: '', note: '' }; }
function jSet(k, v) { jdraft[k] = v; render(); }
function jSym(x) { jdraft.syms = jdraft.syms.includes(x) ? jdraft.syms.filter(y => y !== x) : [...jdraft.syms, x]; render(); }
function jRange(k, v) { jdraft[k] = +v; const o = document.getElementById('jv_' + k); if (o) o.textContent = v + ' / 5'; if (k === 'sleep') { const m = document.getElementById('jm_sleep'); if (m) m.textContent = v + ' / 5'; } }
// today's plan: a per-device, per-day checklist
const planKey = () => 'sehat_plan_' + profile() + '_' + today();
const planGet = () => { try { return JSON.parse(localStorage.getItem(planKey()) || '{}'); } catch { return {}; } };
const planSet = p => { try { localStorage.setItem(planKey(), JSON.stringify(p)); } catch {} render(); };
function planAdd(k) { const p = planGet(); if (!(k in p)) { p[k] = false; planSet(p); toast("Added to today's plan"); } jSheet(k); }
function planTick(k) { const p = planGet(); p[k] = !p[k]; planSet(p); }

// detail sheets live on <body>, so the live store's re-renders never close them
function jModal(html) {
  let m = document.getElementById('jModal');
  if (!m) { m = document.createElement('div'); m.id = 'jModal'; m.className = 'jd-back'; m.onclick = e => { if (e.target === m) jClose(); }; document.body.appendChild(m); }
  m.innerHTML = `<div class="jd-modal" role="dialog" aria-modal="true">${html}</div>`; m.classList.add('open');
}
function jClose() { const m = document.getElementById('jModal'); if (m) m.classList.remove('open'); }
addEventListener('keydown', e => { if (e.key === 'Escape') jClose(); });
function jSheet(k) {
  const h = HABITS[k], inPlan = k in planGet();
  jModal(`<div class="jd-top"><div><div class="eyebrow">${h.kicker}</div><h3>${h.title}</h3><p class="muted">${h.lead}</p></div><button class="jd-x" onclick="jClose()" aria-label="Close">×</button></div>
    <div class="jd-banner"><span>${h.ic}</span><div><b>${h.banner}</b><p>${h.bannerText}</p></div></div>${h.body}
    <div class="row" style="margin-top:12px"><small class="muted">General wellness information · not a personal treatment plan</small><span class="sp"></span>
    ${inPlan ? '<span class="pill ok">✓ Added to today\'s plan</span>' : `<button class="btn sm" onclick="planAdd('${k}')">＋ Add to today's plan</button>`}</div>`);
}
function jSummary() {
  const L = djOf(profile()).filter(e => (Date.now() - new Date(e.date)) / 864e5 <= 14), avg = k => L.length ? (L.reduce((s, e) => s + e[k], 0) / L.length).toFixed(1) : '–', cnt = {};
  L.forEach(e => e.syms.forEach(x => { cnt[x] = (cnt[x] || 0) + 1; }));
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 3), missed = L.filter(e => e.meds !== 'yes').length, side = L.filter(e => e.side).map(e => e.side);
  jModal(`<div class="jd-top"><div><div class="eyebrow">Your care, connected</div><h3>Pre-visit summary · ${esc(profile())}</h3></div><button class="jd-x" onclick="jClose()" aria-label="Close">×</button></div>
    <div class="jd-banner"><span>🩺</span><div><b>A clearer picture for your doctor</b><p>Your daily mood, symptoms, sleep, energy and medicine notes, organised with your records.</p></div></div>
    <div class="jd-grid"><div class="jd-card"><h4>Last ${L.length} day(s)</h4><ul><li>Average sleep ${avg('sleep')}/5, energy ${avg('energy')}/5, mood ${avg('mood')}/5</li><li>${top.length ? 'Most common: ' + top.map(([x, c]) => `${x} (${c})`).join(', ') : 'No symptoms logged'}</li><li>${missed ? `Medicines missed or unsure on ${missed} day(s)` : 'Medicines taken every logged day'}</li>${side.length ? `<li>Side effects noted: ${esc(side.slice(0, 2).join('; '))}</li>` : ''}</ul></div>
      <div class="jd-card"><h4>What happens next?</h4><p>🔒 Private until you share. Your pharmacy, hospital staff and others never see your journal. Share and your doctor sees your check-ins and the reports you uploaded; stop sharing at any time.</p></div></div>
    <div class="row" style="margin-top:12px"><small class="muted">${L.length ? '' : 'Save a few check-ins for a fuller summary.'}</small><span class="sp"></span>${(Store.db.prefs || {})[profile()]?.shareDj ? '<span class="pill ok">✓ Shared with your doctor</span><button class="btn sm ghost" onclick="stopSharing();jClose()">Stop sharing</button>' : '<button class="btn" onclick="shareSummary();jClose()">Share with doctor</button>'}</div>`);
}

const JCSS = `<style>
.jx2 .metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:16px}.jx2 .metric{display:flex;align-items:center;gap:12px;padding:14px 16px}
.jx2 .mi{width:40px;height:40px;border-radius:13px;display:grid;place-items:center;font-size:20px;background:var(--teal-tint)}.jx2 .mi.t{background:#E7F8F5}.jx2 .mi.v{background:#F1EEFF}
.jx2 .metric small{display:block;color:var(--muted);font-size:.78rem}.jx2 .metric b{font-family:var(--display);font-size:1.15rem}
.jx2 .moods{display:flex;gap:8px;flex-wrap:wrap}.jx2 .moods button{width:48px;height:48px;border-radius:15px;border:1px solid var(--line);background:var(--card-solid);font-size:22px;cursor:pointer;transition:transform .2s;filter:saturate(.7)}
.jx2 .moods button:hover{transform:translateY(-2px)}.jx2 .moods button.on{border:2px solid #4c9be8;box-shadow:0 0 0 4px #e1f0ff;filter:none}
.jx2 .rg{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.jx2 .rc{border:1px solid var(--line);border-radius:14px;padding:10px 12px;background:var(--card-solid)}
.jx2 .rc .t{display:flex;justify-content:space-between;font-size:.78rem;font-weight:700;color:var(--muted)}.jx2 .rc output{color:var(--teal-dark);font-family:var(--display);font-weight:800}
.jx2 .rc input{padding:0;border:0;box-shadow:none;background:none;accent-color:#348be2;margin:8px 0 2px}.jx2 .rc .e{display:flex;justify-content:space-between;font-size:.68rem;color:var(--muted)}
.jx2 .sumcard{overflow:hidden;background:linear-gradient(110deg,var(--card-solid) 0%,var(--card-solid) 60%,var(--teal-tint) 100%)}.jx2 .sumcard .txt{max-width:72%;position:relative;z-index:1}
.jx2 .orbw{position:absolute;right:18px;top:20px;width:88px;height:88px;display:grid;place-items:center;perspective:500px}.jx2 .ring{position:absolute;inset:2px;border:1px solid #8fc8f5;border-radius:50%;transform:rotateX(65deg) rotateZ(-25deg);animation:jorb 11s linear infinite}
.jx2 .ring.b{inset:11px;border-color:#7ad8d0;animation-duration:14s;animation-direction:reverse}.jx2 .orb{width:52px;height:52px;border-radius:50%;background:radial-gradient(circle at 31% 25%,#fff 0%,#d5f2ff 12%,#70baf4 35%,#347fdb 68%,#1a4c98 100%);box-shadow:inset -8px -9px 15px #143b7955,0 10px 28px #4b9fe85c;animation:jflt 5s ease-in-out infinite}
@keyframes jorb{to{transform:rotateX(65deg) rotateZ(335deg)}}@keyframes jflt{50%{transform:translateY(-6px)}}
.jx2 .hgrid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.jx2 .habit{display:flex;gap:10px;text-align:left;border:1px solid var(--line);border-radius:14px;padding:12px;background:var(--card-solid);cursor:pointer;font:inherit;color:inherit;transition:transform .2s,border-color .2s,box-shadow .2s}
.jx2 .habit:hover{transform:translateY(-2px);border-color:#cfe2f5;box-shadow:0 7px 17px #315d8d14}.jx2 .habit.done{border-color:#bfe7d6;background:#f7fffb}
.jx2 .hi{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;flex:none;background:#f0f7ff;font-size:18px}.jx2 .hi.green{background:#eff9f4}.jx2 .hi.purple{background:#f5f1ff}.jx2 .hi.amber{background:#fff7e9}
.jx2 .habit b{display:block;font-size:.92rem}.jx2 .habit small{display:block;color:var(--muted);font-size:.78rem;line-height:1.4}.jx2 .habit .tap{display:block;margin-top:5px;font-size:.66rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--teal)}.jx2 .habit.done .tap{color:var(--ok)}
.jx2 .plan{margin-top:12px;padding:10px 12px;border-radius:12px;background:var(--teal-tint);border:1px solid var(--line)}.jx2 .plan label{display:flex;gap:8px;align-items:center;margin:5px 0;color:var(--ink);font-size:.88rem;cursor:pointer}.jx2 .plan input{width:auto;accent-color:#239a80}
.jx2 .entry{display:flex;align-items:center;gap:10px;padding:9px;border:1px solid var(--line);border-radius:12px;margin-bottom:6px}.jx2 .edate{width:38px;height:40px;border-radius:10px;display:grid;place-items:center;background:var(--teal-tint);color:var(--teal-dark);font-size:.68rem;font-weight:800;text-align:center;line-height:1.2;flex:none}
.jx2 .empty{border:1px dashed var(--line);border-radius:12px;padding:12px;color:var(--muted);font-size:.86rem}
.jx2 .flt{display:inline-flex;gap:3px;padding:3px;border-radius:9px;background:rgba(7,116,196,.06)}.jx2 .flt button{border:0;background:none;border-radius:7px;padding:4px 9px;font-size:.74rem;color:var(--muted);cursor:pointer}.jx2 .flt button.on{background:var(--card-solid);color:var(--teal-dark);font-weight:700}
.jx2 .rec{display:grid;grid-template-columns:12px 1fr;gap:10px;padding:9px 0;border-bottom:1px solid var(--line)}.jx2 .rec:last-child{border:0}.jx2 .dot{width:8px;height:8px;border-radius:50%;background:#3c91e5;margin-top:5px;box-shadow:0 0 0 3px #eaf4ff}.jx2 .dot.r{background:#27b5a1;box-shadow:0 0 0 3px #eaf9f6}
.jx2 .tag{font-size:.66rem;font-weight:800;letter-spacing:.04em;color:#347fc2;background:#eff7ff;padding:3px 7px;border-radius:6px;text-transform:uppercase}.jx2 .tag.r{color:#239c90;background:#eaf9f6}
.jd-back{position:fixed;inset:0;z-index:95;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(13,30,53,.6);-webkit-backdrop-filter:blur(7px);backdrop-filter:blur(7px)}.jd-back.open{display:flex}
.jd-modal{width:min(660px,100%);max-height:86vh;overflow:auto;border-radius:22px;background:var(--card-solid);color:var(--ink);padding:22px;box-shadow:0 30px 90px rgba(7,26,52,.35);animation:jin .24s ease}@keyframes jin{from{opacity:0;transform:translateY(10px) scale(.985)}}
.jd-top{display:flex;justify-content:space-between;gap:12px;margin-bottom:14px}.jd-top h3{font-size:1.4rem;margin:4px 0}.jd-x{border:1px solid var(--line);background:var(--card-solid);border-radius:10px;width:34px;height:34px;font-size:18px;cursor:pointer;color:var(--muted)}
.jd-banner{display:flex;gap:12px;align-items:center;border:1px solid #dcecf8;border-radius:15px;padding:14px;background:linear-gradient(115deg,#eff8ff,#f6fbff 60%,#eefaf8);margin-bottom:12px}.jd-banner>span{width:46px;height:46px;border-radius:13px;background:#fff;display:grid;place-items:center;font-size:23px;flex:none}.jd-banner p{margin:2px 0 0;color:#5b6b80;font-size:.86rem}.jd-banner b{color:#233955}
:root[data-theme="dark"] .jd-banner{background:var(--teal-tint);border-color:var(--line)}:root[data-theme="dark"] .jd-banner p,:root[data-theme="dark"] .jd-banner b{color:var(--ink)}
.jd-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.jd-card{border:1px solid var(--line);border-radius:13px;padding:12px}.jd-card h4{margin:0 0 8px;font-size:.92rem}.jd-card ul{margin:0;padding-left:18px;font-size:.86rem;color:var(--muted)}.jd-card p{margin:0;font-size:.86rem;color:var(--muted)}
.jd-meal{display:grid;grid-template-columns:78px 1fr;gap:8px;padding:6px 0;border-bottom:1px solid var(--line);font-size:.84rem}.jd-meal:last-child{border:0}.jd-meal b{color:var(--teal)}.jd-meal span{color:var(--muted)}
.jd-tip{margin-top:10px;padding:10px 12px;border-radius:11px;background:#fff9ed;border:1px solid #f4e7ce;color:#846c48;font-size:.82rem}
@media(max-width:700px){.jx2 .metrics,.jx2 .rg,.jd-grid{grid-template-columns:1fr}.jx2 .sumcard .txt{max-width:100%}.jx2 .orbw{display:none}}
</style>`;

V.journal = () => {
  jdraft = jdraft || jNew();
  const all = djOf(profile()), list = all.filter(e => (Date.now() - new Date(e.date)) / 864e5 <= 14).sort((a, b) => b.date.localeCompare(a.date));
  const plan = planGet(), pk = Object.keys(plan), first = profile().split(' ')[0];
  const recs = Store.db.journal.filter(j => jFilter === 'all' || (jFilter === 'lab' ? /lab/i.test(j.type) : /reading|vitals/i.test(j.type))).slice(0, 8);
  const range = (k, lo, a, b) => `<div class="rc"><div class="t"><span>${{ pain: 'Pain level', sleep: 'Sleep quality', energy: 'Energy level' }[k]}</span><output id="jv_${k}">${jdraft[k]} / 5</output></div><input type="range" min="${lo}" max="5" value="${jdraft[k]}" oninput="jRange('${k}',this.value)"><div class="e"><span>${a}</span><span>${b}</span></div></div>`;
  return JCSS + famChip() + `<div class="jx2">
   <div class="row" style="margin-bottom:16px;align-items:flex-end"><div><span class="eyebrow">Your personal health space</span><h1 style="margin-top:6px">Your health, in focus.</h1><p class="muted" style="margin:6px 0 0">A quick daily check-in can make your next doctor visit more meaningful.</p></div><span class="sp"></span>
    <button class="btn ghost" onclick="document.getElementById('jRecs').scrollIntoView({behavior:'smooth'})">View health records</button><button class="btn" onclick="document.getElementById('jForm').scrollIntoView({behavior:'smooth'})">＋ Daily check-in</button></div>
   <div class="metrics"><div class="card metric"><span class="mi">🙂</span><div><small>Today's mood</small><b>${MOODS[jdraft.mood - 1][1]}</b></div></div><div class="card metric"><span class="mi t">〰️</span><div><small>Sleep quality</small><b id="jm_sleep">${jdraft.sleep} / 5</b></div></div><div class="card metric"><span class="mi v">📅</span><div><small>Journal entries</small><b>${all.length} saved</b> <small style="display:inline">· synced</small></div></div></div>
   <div class="grid g2" style="align-items:start"><div class="card" id="jForm"><div class="row"><div><span class="eyebrow">Daily journal · ${esc(profile())}</span><h2 style="margin:6px 0 2px">How are you feeling today?</h2><p class="muted" style="margin:0">Small details help you and your doctor spot patterns.</p></div><span class="sp"></span><span class="pill">Today's check-in</span></div>
    <label>Mood</label><div class="moods">${MOODS.map(([m, l], i) => `<button class="${jdraft.mood === i + 1 ? 'on' : ''}" title="${l}" aria-label="${l} mood" onclick="jSet('mood',${i + 1})">${m}</button>`).join('')}</div>
    <label>Symptoms today <span style="font-weight:400">· select all that apply</span></label><div class="chips">${SYMS.map(x => `<button class="${jdraft.syms.includes(x) ? 'on' : ''}" onclick="jSym('${x}')">${x}</button>`).join('')}</div>
    <div class="rg" style="margin-top:14px">${range('pain', 0, 'None', 'Severe')}${range('sleep', 1, 'Poor', 'Good')}${range('energy', 1, 'Low', 'High')}</div>
    <label>Did you take your medicines today?</label><div class="chips">${MEDS.map(([k, l]) => `<button class="${jdraft.meds === k ? 'on' : ''}" onclick="jSet('meds','${k}')">${l}</button>`).join('')}</div>
    <label>Anything noticed after medicines? <span style="font-weight:400">· optional</span></label><input value="${esc(jdraft.side)}" oninput="jdraft.side=this.value" placeholder="e.g. felt sleepy after the evening tablet">
    <label>Note for your care team <span style="font-weight:400">· optional</span></label><textarea oninput="jdraft.note=this.value" placeholder="Anything else you would like your doctor to know…">${esc(jdraft.note)}</textarea>
    <div class="row" style="margin-top:14px"><span class="muted" style="font-size:.8rem">🔒 ${all.some(x => x.date === today()) ? 'Saved today · private to you' : 'Private to you'}${(Store.db.prefs || {})[profile()]?.shareDj ? ' · shared with your doctor' : ''}</span><span class="sp"></span><button class="btn" onclick="jSave()">Save today's check-in →</button></div></div>
   <div class="grid" style="align-content:start;gap:14px">
    <div class="card sumcard"><div class="txt"><span class="eyebrow">Your care, connected</span><h3 style="margin:6px 0">Pre-visit summary</h3><p class="muted" style="margin:0 0 10px">Bring your journal and health records together for a clearer doctor visit.</p><button class="btn sm ghost" onclick="jSummary()">See your summary →</button></div><div class="orbw" aria-hidden="true"><div class="ring"></div><div class="ring b"></div><div class="orb"></div></div></div>
    <div class="card"><div class="row"><h3>Daily guidance · small steps</h3><span class="sp"></span><small class="muted">Tap a card to explore</small></div>
     <div class="hgrid">${Object.entries(HABITS).map(([k, h]) => `<button class="habit ${plan[k] ? 'done' : ''}" onclick="jSheet('${k}')"><span class="hi ${h.tone}">${h.ic}</span><span><b>${h.title}</b><small>${h.short}</small><span class="tap">${plan[k] ? '✓ Done today' : h.tap + ' ↗'}</span></span></button>`).join('')}</div>
     ${pk.length ? `<div class="plan"><div class="row"><b style="font-size:.8rem;letter-spacing:.06em">YOUR TODAY PLAN</b><span class="sp"></span><span class="pill">${pk.filter(k => plan[k]).length} / ${pk.length} done</span></div>${pk.map(k => `<label><input type="checkbox" ${plan[k] ? 'checked' : ''} onchange="planTick('${k}')">${HABITS[k].ic} ${HABITS[k].task}</label>`).join('')}</div>` : ''}</div>
    <div class="card"><div class="row" style="margin-bottom:10px"><h3>Recent journal entries</h3><span class="sp"></span><span class="muted" style="font-size:.78rem">${list.length} in 14 days</span></div>
     ${list.slice(0, 4).map(e => { const dt = new Date(e.date); return `<div class="entry"><span class="edate">${dt.getDate()}<br>${dt.toLocaleDateString('en', { month: 'short' })}</span><div><b style="font-size:.9rem">${(MOODS[e.mood - 1] || MOODS[2]).join(' ')} day · ${e.syms.length ? esc(e.syms.join(', ')) : 'No symptoms'}</b><br><small class="muted">Pain ${e.pain}/5 · sleep ${e.sleep}/5 · energy ${e.energy}/5 · medicines: ${MEDS.find(m => m[0] === e.meds)?.[1] || e.meds}</small></div></div>`; }).join('') || '<div class="empty">◷ No journal entries yet. Save your first check-in to start building your health story.</div>'}</div>
    <div class="card" id="jRecs"><div class="row" style="margin-bottom:8px"><h3>Records timeline</h3><span class="sp"></span><div class="flt">${[['all', 'All'], ['lab', 'Lab'], ['reading', 'Vitals']].map(([k, l]) => `<button class="${jFilter === k ? 'on' : ''}" onclick="jFilter='${k}';render()">${l}</button>`).join('')}</div></div>
     ${recs.map(j => { const r = /reading|vitals/i.test(j.type); return `<div class="rec"><span class="dot ${r ? 'r' : ''}"></span><div><span class="tag ${r ? 'r' : ''}">${r ? 'Vital reading' : esc(j.type)}</span> <small class="muted">${j.date}</small><p style="margin:4px 0 0;font-size:.88rem">${esc(j.text)}</p>${/critical/i.test(j.text) ? '<span class="pill bad" style="margin-top:4px">Marked critical · contact your doctor soon</span>' : ''}</div></div>`; }).join('') || '<div class="empty">No records yet. Read a report in Records & OCR and save it to the journal.</div>'}</div>
   </div></div></div>`;
};
function jSave() {
  const n = profile(), e = { ...jdraft, t: Date.now() };
  act(`saved a daily check-in for ${n}`, d => { d.dj = d.dj || {}; d.dj[n] = (d.dj[n] || []).filter(x => x.date !== e.date).concat([e]); });
  jdraft = null; toast('Saved. Your doctor\'s summary is updated.');
}
// Consent: the doctor sees check-ins and self-uploaded reports only after the patient shares them, until they stop.
function shareSummary() { const n = profile(); act(`shared ${n}'s check-ins with their doctor`, d => { d.prefs = d.prefs || {}; d.prefs[n] = { ...(d.prefs[n] || {}), shareDj: true }; }, ['patient', 'doctor']); toast('Shared with your doctor'); }
function stopSharing() { const n = profile(); act(`stopped sharing ${n}'s check-ins`, d => { d.prefs = d.prefs || {}; d.prefs[n] = { ...(d.prefs[n] || {}), shareDj: false }; }, ['patient', 'doctor']); toast('Your doctor can no longer see your check-ins'); }
render();
