'use strict';
/* ================= Voice assistant =================
   A mic button in the Ask form (#askForm) and the Saathi panel (#petForm).
   Press to record, press again to stop (it also stops after 8 s of silence or 30 s in all).
   The audio goes to /api/transcribe; if that fails and the browser has the Web Speech API,
   the browser listens instead. The text is sent with ask(), and the answer is spoken back
   in the app language. Loaded after app.js; it adds its buttons with a MutationObserver,
   so app.js renders need no changes. Microphone permission is asked only on press. */
(function () {
  Object.assign(STR.en, {
    voice_mic: 'Speak your question', voice_stop: 'Stop recording',
    voice_listening: 'Listening… press the mic again to stop.', voice_transcribing: 'Transcribing…',
    voice_again: 'Please say that again. Your browser is listening now.',
    voice_err_denied: 'Microphone permission was denied. Allow the microphone for this site in your browser settings, or type your question.',
    voice_err_nomic: 'No microphone was found on this device. Please type your question.',
    voice_err_empty: 'I could not hear anything. Please try again, a little closer to the microphone.',
    voice_err_unavail: 'Voice input is not available right now. Please type your question.',
    voice_err_generic: 'The microphone did not work this time. Please try again or type your question.',
    voice_no_tts: 'This device has no {lang} voice, so the answer is shown as text only.'
  });
  Object.assign(STR.hi, {
    voice_mic: 'अपना सवाल बोलें', voice_stop: 'रिकॉर्डिंग रोकें',
    voice_listening: 'सुन रहे हैं… रोकने के लिए माइक फिर से दबाएँ।', voice_transcribing: 'लिख रहे हैं…',
    voice_again: 'कृपया फिर से बोलें। अब आपका ब्राउज़र सुन रहा है।',
    voice_err_denied: 'माइक्रोफ़ोन की अनुमति नहीं मिली। ब्राउज़र की सेटिंग में इस साइट के लिए माइक्रोफ़ोन चालू करें, या अपना सवाल लिखें।',
    voice_err_nomic: 'इस डिवाइस पर कोई माइक्रोफ़ोन नहीं मिला। कृपया अपना सवाल लिखें।',
    voice_err_empty: 'कुछ सुनाई नहीं दिया। कृपया माइक्रोफ़ोन के थोड़ा पास आकर फिर से बोलें।',
    voice_err_unavail: 'अभी आवाज़ से सवाल पूछना उपलब्ध नहीं है। कृपया अपना सवाल लिखें।',
    voice_err_generic: 'इस बार माइक्रोफ़ोन ने काम नहीं किया। फिर से कोशिश करें या अपना सवाल लिखें।',
    voice_no_tts: 'इस डिवाइस पर {lang} की आवाज़ नहीं है, इसलिए जवाब सिर्फ़ लिखकर दिखाया गया है।'
  });

  const TAG = { en: 'en-IN', hi: 'hi-IN', te: 'te-IN', ta: 'ta-IN', bn: 'bn-IN', mr: 'mr-IN', gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN', pa: 'pa-IN' };
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const canRecord = () => !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && typeof MediaRecorder !== 'undefined');
  const FORMS = { askForm: 'askInput', petForm: 'petInput' };
  // state: idle | rec (MediaRecorder) | trans (waiting for /api/transcribe) | listen (Web Speech)
  const V = { state: 'idle', msg: '', kind: '', form: null, rec: null, stream: null, chunks: [], tick: null, ctx: null, sr: null, useWeb: false };
  window.SehatVoice = V;

  const MIC_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
  const STOP_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor"/></svg>';

  function inject() {
    if (!canRecord() && !SR) return;
    Object.keys(FORMS).forEach(id => {
      const f = document.getElementById(id);
      if (!f || f.querySelector('.mic')) return;
      const input = document.getElementById(FORMS[id]);
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'btn secondary mic' + (id === 'petForm' ? ' small' : ''); b.setAttribute('data-mic', id);
      if (input) f.insertBefore(b, input); else f.appendChild(b);
      const st = document.createElement('div');
      st.className = 'voice-status'; st.setAttribute('role', 'status'); st.setAttribute('aria-live', 'polite'); st.setAttribute('data-voice', id);
      f.insertAdjacentElement('afterend', st);
      paintOne(id);
    });
  }
  function paintOne(id) {
    const b = document.querySelector('[data-mic="' + id + '"]');
    const st = document.querySelector('[data-voice="' + id + '"]');
    const mine = V.form === id;
    const live = mine && (V.state === 'rec' || V.state === 'listen');
    if (b) {
      const icon = live ? 'stop' : 'mic';
      if (b.getAttribute('data-icon') !== icon) { b.setAttribute('data-icon', icon); b.innerHTML = live ? STOP_SVG : MIC_SVG; }
      b.classList.toggle('rec', live);
      b.classList.toggle('busy', mine && V.state === 'trans');
      b.setAttribute('aria-pressed', live ? 'true' : 'false');
      const lbl = t(live ? 'voice_stop' : 'voice_mic');
      b.setAttribute('aria-label', lbl); b.title = lbl;
      b.disabled = (V.state === 'idle' && !!S.asking) || (V.state !== 'idle' && !mine) || (mine && V.state === 'trans');
    }
    if (st) {
      let txt = '', cls = 'voice-status';
      if (mine && (V.state === 'rec' || V.state === 'listen')) { txt = V.msg || t('voice_listening'); cls += ' on'; }
      else if (mine && V.state === 'trans') { txt = t('voice_transcribing'); cls += ' on'; }
      else if (mine && V.msg) { txt = V.msg; if (V.kind === 'err') cls += ' err'; }
      if (st.textContent !== txt) st.textContent = txt;
      if (st.className !== cls) st.className = cls;
    }
  }
  const paint = () => Object.keys(FORMS).forEach(paintOne);
  new MutationObserver(() => { inject(); paint(); }).observe(document.body, { childList: true, subtree: true });

  function say(msg, kind) { V.msg = msg || ''; V.kind = kind || ''; paint(); }
  function fail(msg) { cleanup(); V.state = 'idle'; say(msg, 'err'); }
  function cleanup() {
    clearInterval(V.tick); V.tick = null;
    if (V.stream) { try { V.stream.getTracks().forEach(tr => tr.stop()); } catch (e) { /* ignore */ } V.stream = null; }
    if (V.ctx) { try { V.ctx.close(); } catch (e) { /* ignore */ } V.ctx = null; }
  }
  function micErr(e) {
    const n = e && e.name;
    if (n === 'NotAllowedError' || n === 'SecurityError' || n === 'not-allowed' || n === 'service-not-allowed') return t('voice_err_denied');
    if (n === 'NotFoundError' || n === 'OverconstrainedError' || n === 'audio-capture') return t('voice_err_nomic');
    if (n === 'no-speech') return t('voice_err_empty');
    return t('voice_err_generic');
  }
  function pickMime() {
    const c = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
    for (const m of c) { try { if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) return m; } catch (e) { /* ignore */ } }
    return '';
  }

  async function toggle(id) {
    if (V.state === 'rec') { if (V.form === id) stopRec(); return; }
    if (V.state === 'listen') { if (V.form === id && V.sr) { try { V.sr.stop(); } catch (e) { /* ignore */ } } return; }
    if (V.state === 'trans' || S.asking) return;
    V.form = id; say('');
    if (typeof stopSpeak === 'function') stopSpeak();
    if (V.useWeb || !canRecord()) return startWeb('');
    try { V.stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { return fail(micErr(e)); }
    const mime = pickMime();
    try { V.rec = mime ? new MediaRecorder(V.stream, { mimeType: mime }) : new MediaRecorder(V.stream); }
    catch (e) { cleanup(); return SR ? startWeb('') : fail(t('voice_err_generic')); }
    V.chunks = [];
    V.rec.ondataavailable = ev => { if (ev.data && ev.data.size) V.chunks.push(ev.data); };
    V.rec.onstop = () => onStopped(mime);
    V.rec.start(250);
    V.state = 'rec'; paint();
    watch();
  }
  /* stop after 8 s without sound above a low level, or 30 s in all */
  function watch() {
    const t0 = Date.now();
    let loud = t0, an = null, buf = null;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) { V.ctx = new AC(); an = V.ctx.createAnalyser(); an.fftSize = 1024; V.ctx.createMediaStreamSource(V.stream).connect(an); buf = new Uint8Array(an.fftSize); }
    } catch (e) { an = null; }
    V.tick = setInterval(() => {
      const now = Date.now();
      if (an) {
        an.getByteTimeDomainData(buf);
        let sum = 0; for (let i = 0; i < buf.length; i++) { const x = (buf[i] - 128) / 128; sum += x * x; }
        if (Math.sqrt(sum / buf.length) > 0.03) loud = now;
      }
      if (now - loud > 8000 || now - t0 > 30000) stopRec();
    }, 200);
  }
  function stopRec() {
    clearInterval(V.tick); V.tick = null;
    if (V.rec && V.rec.state !== 'inactive') { try { V.rec.stop(); } catch (e) { fail(t('voice_err_generic')); } }
  }
  const toB64 = blob => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1] || ''); r.onerror = () => no(r.error); r.readAsDataURL(blob); });

  async function onStopped(mime) {
    const type = (V.rec && V.rec.mimeType) || mime || 'audio/webm';
    const blob = new Blob(V.chunks, { type });
    V.rec = null; V.chunks = [];
    cleanup();
    if (blob.size < 800) return fail(t('voice_err_empty'));
    V.state = 'trans'; paint();
    let text = '', code = '';
    try {
      const r = await fetch('/api/transcribe', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: await toB64(blob), mime: type.split(';')[0], lang }) });
      let j = null; try { j = await r.json(); } catch (e) { /* not json */ }
      if (r.ok && j && typeof j.text === 'string') text = j.text.trim();
      else code = (j && j.code) || 'http_' + r.status;
    } catch (e) { code = 'network'; }
    if (text) return submit(text);
    if (!code) return fail(t('voice_err_empty'));  // the server heard nothing
    if (SR) { if (code === 'voice_unavailable') V.useWeb = true; return startWeb(t('voice_again')); }
    fail(t('voice_err_unavail'));
  }

  function startWeb(msg) {
    if (!SR) return fail(t('voice_err_unavail'));
    let got = '', err = null;
    const r = new SR();
    r.lang = TAG[lang] || lang; r.interimResults = false; r.maxAlternatives = 1; r.continuous = false;
    r.onresult = e => { try { got = Array.from(e.results).map(x => x[0].transcript).join(' ').trim(); } catch (x) { /* ignore */ } };
    r.onerror = e => { err = e.error || 'error'; };
    r.onend = () => {
      clearTimeout(V.tick); V.sr = null;
      if (got) submit(got);
      else fail(err ? micErr({ name: err }) : t('voice_err_empty'));
    };
    V.sr = r; V.state = 'listen'; say(msg);
    try { r.start(); } catch (e) { V.sr = null; return fail(t('voice_err_generic')); }
    V.tick = setTimeout(() => { try { r.stop(); } catch (e) { /* ignore */ } }, 30000);
  }

  async function submit(text) {
    V.state = 'idle'; say('');
    const input = document.getElementById(FORMS[V.form] || 'askInput');
    if (input) input.value = text;   // show what was heard for a moment, then send it
    await new Promise(ok => setTimeout(ok, 350));
    const i2 = document.getElementById(FORMS[V.form] || 'askInput');
    if (i2) i2.value = '';
    const before = S.chat.length;
    await ask(text);
    const m = S.chat[S.chat.length - 1];
    if (S.chat.length > before && m && m.role === 'bot' && m.text && m.label !== 'signin') speakAnswer(m);
  }

  function voicesNow() {
    return new Promise(ok => {
      let v = [];
      try { v = speechSynthesis.getVoices() || []; } catch (e) { /* ignore */ }
      if (v.length) return ok(v);
      let done = false;
      const fin = () => { if (done) return; done = true; try { ok(speechSynthesis.getVoices() || []); } catch (e) { ok([]); } };
      try { speechSynthesis.addEventListener('voiceschanged', fin, { once: true }); } catch (e) { /* ignore */ }
      setTimeout(fin, 1200);
    });
  }
  function langName() {
    const o = document.querySelector('#langSel option[value="' + lang + '"]');
    return o ? o.textContent.split(' · ')[0] : lang;
  }
  async function speakAnswer(m) {
    if (typeof speakOK !== 'function' || !speakOK()) return say(t('voice_no_tts', { lang: langName() }));
    const base = lang.toLowerCase();
    const voices = await voicesNow();
    const has = voices.some(v => String(v.lang || '').toLowerCase().replace('_', '-').split('-')[0] === base);
    if (!has) return say(t('voice_no_tts', { lang: langName() }));
    if (speakText(m.text, lang)) { SPEAK.key = 'msg:' + S.chat.indexOf(m); paintListen(); }
  }

  document.addEventListener('click', e => {
    const b = e.target && e.target.closest ? e.target.closest('[data-mic]') : null;
    if (b) { e.preventDefault(); toggle(b.getAttribute('data-mic')); }
  });
  inject();
})();
