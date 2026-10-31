// Sehat Saathi: a floating chat + voice assistant and a site-wide language picker for the hub pages.
// - Language: the page is translated with Google's website translator (cookie `googtrans`), so every
//   hub page reads in the chosen Indian language. The Copilot workspaces keep their own language menu.
// - Voice: the browser's speech recognition listens in the chosen language (hi-IN, ta-IN, …) and
//   replies are spoken back with speech synthesis when the device has a voice for it.
// - Answers: /api/assist (an LLM that understands and replies in any Indian language) when AI keys
//   are set; otherwise a built-in keyword guide in English, Hindi, Hinglish and Punjabi.
(() => {
  if (window.top !== window) return;  // inside the live demo's panes: the outer page already has one
  const LANGS = [['en', 'English', 'en-IN'], ['hi', 'हिन्दी', 'hi-IN'], ['pa', 'ਪੰਜਾਬੀ', 'pa-IN'], ['bn', 'বাংলা', 'bn-IN'], ['ta', 'தமிழ்', 'ta-IN'],
    ['te', 'తెలుగు', 'te-IN'], ['mr', 'मराठी', 'mr-IN'], ['gu', 'ગુજરાતી', 'gu-IN'], ['kn', 'ಕನ್ನಡ', 'kn-IN'], ['ml', 'മലയാളം', 'ml-IN'], ['ur', 'اردو', 'ur-IN'], ['or', 'ଓଡ଼ିଆ', 'or-IN'], ['as', 'অসমীয়া', 'as-IN']];
  const get = () => { try { return localStorage.getItem('sehat_lang') || 'en'; } catch { return 'en'; } };
  let lang = get();
  const tag = () => (LANGS.find(l => l[0] === lang) || LANGS[0])[2];
  const HUB = location.pathname.startsWith('/hub/') ? '' : '/hub/';

  // ---- page translation ----
  function setLang(l) {
    try { localStorage.setItem('sehat_lang', l); } catch {}
    const v = l === 'en' ? '' : `/en/${l}`, host = location.hostname;
    [`googtrans=${v};path=/`, `googtrans=${v};path=/;domain=${host}`, `googtrans=${v};path=/;domain=.${host}`].forEach(c => { document.cookie = c + (v ? '' : ';expires=Thu, 01 Jan 1970 00:00:00 GMT'); });
    location.reload();
  }
  if (lang !== 'en') {
    window.googleTranslateElementInit = () => {
      new google.translate.TranslateElement({ pageLanguage: 'en', autoDisplay: false }, 'g_te');
      // the cookie alone is not always picked up; drive the widget's own picker once it exists
      let n = 0; const t = setInterval(() => { const c = document.querySelector('.goog-te-combo');
        if (c && c.options.length > 1) { c.value = lang; c.dispatchEvent(new Event('change')); clearInterval(t); } else if (++n > 40) clearInterval(t); }, 250);
    };
    const g = document.createElement('div'); g.id = 'g_te'; g.style.display = 'none'; document.body.appendChild(g);
    const s = document.createElement('script'); s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'; document.body.appendChild(s);
  }

  // ---- styles ----
  const css = document.createElement('style');
  css.textContent = `
  body{top:0!important}.goog-te-banner-frame,.skiptranslate iframe,#goog-gt-tt{display:none!important}font{background:none!important;box-shadow:none!important}
  .sx-dock{position:fixed;right:20px;bottom:20px;z-index:90;display:flex;align-items:center;gap:10px}
  .sx-fab{display:flex;align-items:center;gap:10px;border:0;border-radius:999px;padding:6px 18px 6px 6px;cursor:pointer;color:#fff;font:700 .95rem "Outfit",system-ui,sans-serif;background:linear-gradient(180deg,#1A86D6,#0774C4);box-shadow:0 16px 36px -12px rgba(7,116,196,.8)}
  .sx-fab img,.sx-h img{width:40px;height:40px;border-radius:50%;background:#EAF3FE;border:2px solid #fff;flex:none}.sx-fab:hover img{transform:scale(1.06)}.sx-fab img{transition:transform .25s}
  .sx-lang{border:1px solid var(--line,#DCE7F5);border-radius:999px;padding:9px 14px;font:600 .88rem system-ui,sans-serif;background:var(--card-solid,#fff);color:var(--ink,#0A1B2E);box-shadow:0 10px 30px -14px rgba(7,40,80,.3);width:auto}
  .sx{position:fixed;right:20px;bottom:86px;z-index:91;width:min(380px,calc(100vw - 32px));height:min(540px,calc(100vh - 120px));display:none;flex-direction:column;border-radius:24px;overflow:hidden;
    background:var(--card-solid,#fff);border:1px solid var(--line,#DCE7F5);box-shadow:0 40px 90px -30px rgba(7,40,80,.5);font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:var(--ink,#0A1B2E)}
  .sx.on{display:flex}
  .sx-h{display:flex;align-items:center;gap:10px;padding:14px 16px;color:#fff;background:linear-gradient(135deg,#0774C4,#04437A)}.sx-h b{font-family:"Outfit",sans-serif;font-size:1.05rem}.sx-h small{display:block;opacity:.8;font-size:.76rem}
  .sx-h button{margin-left:auto;background:rgba(255,255,255,.15);border:0;color:#fff;border-radius:50%;width:30px;height:30px;cursor:pointer}
  .sx-m{flex:1;overflow:auto;padding:14px;display:flex;flex-direction:column;gap:8px;background:var(--bg,#F3F7FC)}
  .sx-b{max-width:85%;padding:9px 13px;border-radius:16px;font-size:.92rem;line-height:1.45;white-space:pre-wrap}.sx-b.u{align-self:flex-end;background:#0774C4;color:#fff;border-bottom-right-radius:4px}
  .sx-b.a{align-self:flex-start;background:var(--card-solid,#fff);border:1px solid var(--line,#DCE7F5);border-bottom-left-radius:4px}.sx-b a{color:#0774C4;font-weight:700}
  .sx-q{display:flex;flex-wrap:wrap;gap:6px;padding:8px 12px 0}.sx-q button{border:1px solid var(--line,#DCE7F5);background:var(--card-solid,#fff);color:inherit;border-radius:999px;padding:5px 10px;font-size:.8rem;cursor:pointer}
  .sx-f{display:flex;gap:8px;padding:12px;border-top:1px solid var(--line,#DCE7F5)}.sx-f input{flex:1;border:1px solid var(--line,#DCE7F5);border-radius:999px;padding:10px 14px;font:inherit;background:var(--card-solid,#fff);color:inherit}
  .sx-f button{border:0;border-radius:50%;width:42px;height:42px;cursor:pointer;font-size:1.05rem;background:var(--teal-tint,#EAF3FE);color:#0774C4}.sx-f button.go{background:#0774C4;color:#fff}
  .sx-f button.rec{background:#DC2626;color:#fff;animation:sxp 1s infinite alternate}@keyframes sxp{to{box-shadow:0 0 0 8px rgba(220,38,38,.15)}}
  .sx-n{font-size:.72rem;color:var(--muted,#5B6B80);padding:0 14px 10px}
  @media(max-width:560px){.sx-fab span{display:none}.sx-fab{padding:5px}.sx-lang{max-width:120px}}`;
  document.head.appendChild(css);

  // ---- widgets ----
  const sel = document.createElement('select'); sel.className = 'sx-lang notranslate'; sel.setAttribute('aria-label', 'Language');
  sel.innerHTML = LANGS.map(([k, n]) => `<option value="${k}" ${k === lang ? 'selected' : ''}>🌐 ${n}</option>`).join('');
  sel.onchange = () => setLang(sel.value);
  const fab = document.createElement('button'); fab.className = 'sx-fab'; fab.innerHTML = '<img src="/saathi.svg" alt=""><span>Ask Dr. Saathi</span>'; fab.setAttribute('aria-label', 'Ask Dr. Saathi');
  const box = document.createElement('div'); box.className = 'sx'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Sehat Saathi assistant');
  box.innerHTML = `<div class="sx-h"><img src="/saathi.svg" alt=""><div><b>Dr. Saathi</b><small>Type or speak in any Indian language</small></div><button aria-label="Close">✕</button></div>
    <div class="sx-m" id="sxM"></div><div class="sx-q" id="sxQ"></div>
    <div class="sx-f notranslate"><button id="sxMic" aria-label="Speak">🎙</button><input id="sxIn" placeholder="Ask anything…" autocomplete="off"><button class="go" id="sxGo" aria-label="Send">➤</button></div>
    <div class="sx-n">Explains and guides. Not a diagnosis. Emergency: call 112 / 108.</div>`;
  const dock = document.createElement('div'); dock.className = 'sx-dock'; dock.append(sel, fab);
  document.body.append(dock, box);
  const M = box.querySelector('#sxM'), IN = box.querySelector('#sxIn');
  fab.onclick = () => { box.classList.toggle('on'); if (box.classList.contains('on')) IN.focus(); };
  box.querySelector('.sx-h button').onclick = () => box.classList.remove('on');

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function bubble(text, who, link) {
    const b = document.createElement('div'); b.className = 'sx-b ' + who;
    b.innerHTML = esc(text) + (link ? `<br><a href="${link[1]}">${esc(link[0])} →</a>` : '');
    M.appendChild(b); M.scrollTop = M.scrollHeight; return b;
  }
  function speak(t) {
    if (!('speechSynthesis' in window)) return;
    const v = speechSynthesis.getVoices().find(x => x.lang.replace('_', '-').toLowerCase().startsWith(lang)); if (lang !== 'en' && !v) return;
    const u = new SpeechSynthesisUtterance(t); u.lang = tag(); if (v) u.voice = v; speechSynthesis.cancel(); speechSynthesis.speak(u);
  }

  // ---- built-in guide (no AI key needed): English, Hindi (Devanagari), Hinglish, Punjabi (Gurmukhi) ----
  const PAGES = {
    book: ['Book a visit', HUB + 'app.html', 'hospital', 'appointments'], meds: ['Track my medicines', '/app'], report: ['Explain a report', '/app'],
    doctor: ['Doctor workspace', '/login?role=doctor&demo=1'], pharmacy: ['Pharmacy workspace', HUB + 'app.html', 'pharmacy', 'sehat_pharmacy'],
    supply: ['Supplier inbox', HUB + 'app.html', 'supplier', 'sehat_supply'], demo: ['Live demo', HUB + 'demo.html'], login: ['Choose a role', HUB + 'login.html'],
  };
  const RULES = [
    [/emergenc|chest pain|heart attack|breath|unconscious|bleed|आपात|सीने|सांस|बेहोश|seene|saans|behosh|ਐਮਰਜੈਂਸੀ|ਛਾਤੀ|ਸਾਹ/i, 'This could be an emergency. Call 112 or 108 now, or go to the nearest hospital.', null],
    [/book|appointment|doctor|slot|अपॉइंटमेंट|डॉक्टर|दिखाना|milna|ਡਾਕਟਰ|ਮੁਲਾਕਾਤ/i, 'Tell the Appointment Desk your symptoms and it picks the right specialist and the earliest free slot.', 'book'],
    [/report|lab|test|रिपोर्ट|जांच|ਰਿਪੋਰਟ|ਟੈਸਟ/i, 'In Sehat Copilot, upload a photo of your report. Every value is read and explained in your language.', 'report'],
    [/medicine|order|deliver|track|दवा|दवाई|dawai|dawa|ਦਵਾਈ/i, 'Your prescription goes from the doctor to the nearest pharmacy with stock, then to your door. You can track it live.', 'meds'],
    [/stock|supplier|distributor|purchase|PO\b|स्टॉक|सप्लाई|ਸਟਾਕ/i, 'When stock runs low, Supply Chain AI drafts a purchase order; the pharmacy sends it and the distributor accepts, dispatches and delivers.', 'supply'],
    [/pharmac|chemist|फार्मेसी|केमिस्ट|ਫਾਰਮੇਸੀ/i, 'Pharmacies get prescriptions with a stock check, chat with the doctor, and send riders.', 'pharmacy'],
    [/demo|how.*work|कैसे|kaise|ਕਿਵੇਂ/i, 'Open the live demo and go step by step: Doctor → Pharmacy → Supplier → Patient.', 'demo'],
    [/role|login|sign|लॉग|ਲੌਗ/i, 'Pick a demo role: Hospital, Doctor, Nurse, Pharmacy, Patient or Supplier. No sign-up.', 'login'],
    [/hello|hi\b|hey|namaste|नमस्ते|ਸਤ ਸ੍ਰੀ ਅਕਾਲ|sat sri/i, 'Namaste! I am Sehat Saathi. Ask me how to book a doctor, track medicines, explain a report or restock a pharmacy.', null],
  ];
  function go(key) {
    const p = PAGES[key]; if (!p) return;
    try { if (p[2]) { sessionStorage.setItem('sehat_role', p[2]); sessionStorage.setItem('sehat_view', p[3]); } } catch {}
    location.href = p[1];
  }
  function local(q) {
    const r = RULES.find(([re]) => re.test(q));
    return r ? { reply: r[1], go: r[2] } : { reply: 'I can help with booking a doctor, tracking medicines, explaining a report, pharmacy stock and the live demo. Try one of the buttons below.', go: null };
  }

  async function ask(q) {
    if (!q.trim()) return; bubble(q, 'u'); IN.value = '';
    const wait = bubble('…', 'a');
    let out;
    try {
      const r = await fetch('/api/assist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q, lang }) });
      if (!r.ok) throw 0; out = await r.json(); if (!out.reply) throw 0;
    } catch { out = local(q); }
    wait.remove();
    const p = PAGES[out.go];
    const b = bubble(out.reply, 'a', p ? [p[0], '#'] : null);
    if (p) b.querySelector('a').onclick = e => { e.preventDefault(); go(out.go); };
    speak(out.reply);
  }
  box.querySelector('#sxGo').onclick = () => ask(IN.value);
  IN.addEventListener('keydown', e => { if (e.key === 'Enter') ask(IN.value); });
  box.querySelector('#sxQ').innerHTML = [['📅 Book a doctor', 'How do I book a doctor?'], ['🧾 Explain my report', 'Explain my lab report'], ['💊 Track medicines', 'Where is my medicine order?'], ['🚚 Restock', 'How does a pharmacy restock from a distributor?']]
    .map(([l, q]) => `<button data-q="${esc(q)}">${l}</button>`).join('');
  box.querySelectorAll('#sxQ button').forEach(b => b.onclick = () => ask(b.dataset.q));
  bubble('Namaste! I am Dr. Saathi. Type, or tap 🎙 and speak in your language. The 🌐 menu next to my button changes the whole page.', 'a');

  // ---- voice input ----
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition, mic = box.querySelector('#sxMic');
  if (!SR) { mic.title = 'Voice input needs Chrome or Edge'; mic.style.opacity = .5; }
  let rec = null;
  mic.onclick = () => {
    if (!SR) return bubble('Voice input works in Chrome or Edge. You can type instead.', 'a');
    if (rec) { rec.stop(); return; }
    rec = new SR(); rec.lang = tag(); rec.interimResults = true; rec.maxAlternatives = 1;
    mic.classList.add('rec'); IN.placeholder = 'Listening…';
    rec.onresult = e => { const t = [...e.results].map(r => r[0].transcript).join(''); IN.value = t; if (e.results[e.results.length - 1].isFinal) ask(t); };
    rec.onerror = e => { if (e.error === 'not-allowed') bubble('Microphone permission is blocked. Allow it in the address bar, or type.', 'a'); };
    rec.onend = () => { rec = null; mic.classList.remove('rec'); IN.placeholder = 'Ask anything…'; };
    rec.start();
  };
})();
