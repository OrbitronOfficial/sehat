/* Sehat Copilot: end-to-end encrypted sync across a user's devices.

   IndexedDB stays the working copy on each device. This layer copies it, encrypted, to the
   server and back:
   - A 512-bit secret is derived on the device from the password (PBKDF2, 210,000 rounds,
     salted with the email). Half is the AES-GCM key, half becomes a sync token. The password
     and the key never leave the device; the server stores only ciphertext.
   - After a change the vault is pushed a few seconds later. On opening the app, a newer vault
     from another device replaces the local copy (last save wins).
   - Original document images stay on the device that uploaded them, to keep the vault small.
   Loaded by login.html (to sign in on a new device) and index.html (to push and pull). */
(function () {
  'use strict';
  const CRED = 'sehat_sync', AT = 'sehat_sync_at';
  const SKIP = /^sehat_(sync|accounts|user|theme|lang|i18n_|skip|pin_wait|insights|notified_|profile)/;  // never synced
  const te = new TextEncoder(), td = new TextDecoder();
  const hex = b => Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join('');
  const b64 = b => { let s = ''; const u = new Uint8Array(b); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
  const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  const sha = async s => hex(await crypto.subtle.digest('SHA-256', typeof s === 'string' ? te.encode(s) : s));
  const ok = () => !!(window.crypto && crypto.subtle);
  const creds = () => { try { return JSON.parse(localStorage.getItem(CRED) || 'null'); } catch (e) { return null; } };

  async function derive(email, password) {
    email = String(email || '').trim().toLowerCase();
    const base = await crypto.subtle.importKey('raw', te.encode(String(password || '')), 'PBKDF2', false, ['deriveBits']);
    const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: te.encode('sehat-sync:' + email), iterations: 210000, hash: 'SHA-256' }, base, 512));
    return { email, id: await sha('sehat-id:' + email), token: await sha(bits.slice(32)), key: b64(bits.slice(0, 32)) };
  }
  const aes = c => crypto.subtle.importKey('raw', unb64(c.key), 'AES-GCM', false, ['encrypt', 'decrypt']);
  async function pipe(bytes, Stream) { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new Stream('gzip'))).arrayBuffer()); }
  async function seal(c, obj) {
    let data = te.encode(JSON.stringify(obj)), tag = 'p1';
    if (window.CompressionStream) { data = await pipe(data, CompressionStream); tag = 'g1'; }
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aes(c), data));
    const out = new Uint8Array(iv.length + ct.length); out.set(iv); out.set(ct, iv.length);
    return tag + ':' + b64(out);
  }
  async function open(c, sealed) {
    const [tag, body] = String(sealed).split(':');
    const raw = unb64(body);
    let data = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: raw.slice(0, 12) }, await aes(c), raw.slice(12)));
    if (tag === 'g1') data = await pipe(data, DecompressionStream);
    return JSON.parse(td.decode(data));
  }
  async function post(path, body) {
    const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || 'Sync failed (' + r.status + ')');
    return j;
  }
  const load = c => post('/api/sync/load', { id: c.id, token: c.token }).then(j => j.vault || null);

  /* ---------- used by the sign-in page ---------- */
  async function enable(email, password, name) {
    if (!ok()) return;
    const c = await derive(email, password);
    c.name = name || '';
    localStorage.setItem(CRED, JSON.stringify(c));
  }
  // A new device: the account exists only in the cloud. Opening the vault proves the password.
  async function tryCloud(email, password) {
    if (!ok()) return null;
    const c = await derive(email, password);
    let v = null;
    try { v = await load(c); } catch (e) { return null; }
    if (!v) return null;
    let data;
    try { data = await open(c, v.vault); } catch (e) { return null; }  // wrong password: it doesn't decrypt
    c.name = (data.user && data.user.name) || email.split('@')[0];
    localStorage.setItem(CRED, JSON.stringify(c));
    return { name: c.name };
  }

  /* ---------- the app page: push, pull, badge ---------- */
  const inApp = typeof dbPut === 'function' && typeof dbGetAll === 'function';
  let state = 'off', timer = null, quiet = false;

  async function metaAll() {  // meta rows with their keys (profiles, patient details, readings)
    const db = await openDB();
    if (!db) return Array.from(mem.meta.entries());
    return new Promise(res => {
      const out = [], tx = db.transaction('meta', 'readonly'), cur = tx.objectStore('meta').openCursor();
      cur.onsuccess = () => { const c = cur.result; if (c) { out.push([c.key, c.value]); c.continue(); } else res(out); };
      cur.onerror = () => res(out);
    });
  }
  async function snapshot(c) {
    const ls = {};
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.indexOf('sehat_') === 0 && !SKIP.test(k)) ls[k] = localStorage.getItem(k); }
    return { v: 1, user: { name: c.name || ((typeof currentUser === 'function' && currentUser()) || {}).name || '' }, records: await dbGetAll('records'), meta: await metaAll(), ls };
  }
  async function push() {
    const c = creds(); if (!c || quiet) return;
    paint('busy');
    try {
      const at = Date.now();
      await post('/api/sync', { id: c.id, token: c.token, vault: await seal(c, await snapshot(c)), at });
      localStorage.setItem(AT, String(at)); paint('ok');
    } catch (e) { paint('err', e.message); }
  }
  function later() { if (!creds() || quiet) return; clearTimeout(timer); paint('busy'); timer = setTimeout(push, 3000); }
  async function pull() {
    const c = creds(); if (!c) return paint('off');
    paint('busy');
    let v;
    try { v = await load(c); } catch (e) { return paint('err', e.message); }
    if (!v) return push();  // first device for this account
    if (Number(v.at) <= Number(localStorage.getItem(AT) || 0)) return paint('ok');
    let data;
    try { data = await open(c, v.vault); } catch (e) { return paint('err', 'This device has a different password for the account.'); }
    quiet = true;  // writing the copy must not trigger a push back
    try {
      await dbClear('records'); await dbClear('meta');
      for (const r of data.records || []) await dbPut('records', r);
      for (const [k, val] of data.meta || []) await dbPut('meta', val, k);
      Object.keys(localStorage).filter(k => k.indexOf('sehat_') === 0 && !SKIP.test(k)).forEach(k => localStorage.removeItem(k));
      Object.entries(data.ls || {}).forEach(([k, val]) => localStorage.setItem(k, val));
      localStorage.setItem(AT, String(v.at));
    } finally { quiet = false; }
    location.reload();  // rebuild every view from the newer copy
  }
  function paint(s, why) {
    state = s;
    const el = document.getElementById('userChip'); if (!el) return;
    let b = el.querySelector('.sync-badge');
    if (s === 'off') { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('span'); b.className = 'sync-badge'; el.insertBefore(b, el.firstChild); }
    const L = (typeof lang !== 'undefined' && lang === 'hi')
      ? { ok: 'सिंक हो गया', busy: 'सिंक हो रहा है…', err: 'सिंक रुका', tip: 'आपके डिवाइसों में एन्क्रिप्टेड सिंक' }
      : { ok: 'Synced', busy: 'Syncing…', err: 'Sync paused', tip: 'End-to-end encrypted sync across your devices' };
    b.dataset.s = s; b.textContent = '☁ ' + L[s]; b.title = s === 'err' && why ? why : L.tip;
  }

  if (inApp && ok()) {
    const c = creds(), u = typeof currentUser === 'function' ? currentUser() : null;
    if (c && (!u || u.demo || u.email !== c.email)) localStorage.removeItem(CRED);  // signed out, or someone else
    ['dbPut', 'dbDel', 'dbClear'].forEach(n => { const f = window[n]; window[n] = async function () { const r = await f.apply(this, arguments); later(); return r; }; });
    const set = Storage.prototype.setItem, del = Storage.prototype.removeItem;
    Storage.prototype.setItem = function (k, v) { set.call(this, k, v); if (this === localStorage && String(k).indexOf('sehat_') === 0 && !SKIP.test(k)) later(); };
    Storage.prototype.removeItem = function (k) { del.call(this, k); if (this === localStorage && String(k).indexOf('sehat_') === 0 && !SKIP.test(k)) later(); };
    if (typeof renderUser === 'function') { const ru = window.renderUser; window.renderUser = function () { const r = ru.apply(this, arguments); paint(state); return r; }; }
    if (creds()) { paint('busy'); setTimeout(pull, 400); }
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && timer) { clearTimeout(timer); push(); } });
  }

  window.SehatSync = { enable, tryCloud, push, pull, derive, seal, open };
})();
