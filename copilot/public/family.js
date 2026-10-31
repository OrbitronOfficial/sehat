'use strict';
/* ================= Family profiles =================
   One account on this device holds several family profiles (self, parents, spouse, children).
   Every record carries a `profile` field ('self' when missing, so older single-profile data
   lands under self). S.records only ever holds the ACTIVE profile's records; the rest wait in
   FAM.others, so the timeline, insights, chat and visit page work per profile unchanged.

   Contract for other modules:
     profKey(name)  -> name for the 'self' profile, name + '@' + profileId otherwise.
                       Use it for every per-profile localStorage key and IndexedDB meta key.
     SehatFamily.active(), SehatFamily.list()  -> current profile id / profiles
     document event 'sehat:profile' {detail:{id}} fires after every switch.

   Profile lock is a parental control inside the app on this device. The PIN is stored as a
   salted SHA-256 hash, the records themselves are NOT encrypted.
   Loaded BEFORE app.js; everything here touches app.js globals only when called. */

const FAM = { list: null, active: 'self', others: [], chats: {}, unlocked: {}, menu: false, modal: null };

function profKey(name) { return FAM.active === 'self' ? name : name + '@' + FAM.active; }
function profKeyFor(name, id) { return !id || id === 'self' ? name : name + '@' + id; }

/* --- called from app.js hooks --- */
async function famBoot() {
  let fam = null;
  try { fam = await dbGet('meta', 'family'); } catch (e) { /* none yet */ }
  FAM.list = SehatFamily._norm(fam && fam.profiles);
  // the account holder is named by their own health profile, not by the login name
  try { const me = await dbGet('meta', 'patient'); FAM.selfName = (me && me.name) || ''; } catch (e) { FAM.selfName = ''; }
  let a = null;
  try { a = localStorage.getItem('sehat_profile'); } catch (e) { /* ignore */ }
  FAM.active = FAM.list.some(p => p.id === a) ? a : 'self';
  // a profile with a PIN does not stay open across a reload: only this browser session's unlocks count
  try { FAM.unlocked = JSON.parse(sessionStorage.getItem('sehat_unlocked') || '{}') || {}; } catch (e) { FAM.unlocked = {}; }
  const cur = FAM.list.find(p => p.id === FAM.active);
  FAM.bootLock = null;
  if (cur && cur.pin && !FAM.unlocked[cur.id]) {
    const free = FAM.list.find(p => !p.pin);
    if (free) FAM.active = free.id; else FAM.bootLock = cur.id;  // every profile locked: ask before showing anything
  }
  SehatFamily._split(S.records);
  if (FAM.bootLock) { FAM.others = FAM.others.concat(S.records); S.records = []; S.patient = null; S.vitals = []; SehatFamily._bootPin(); return; }
  await SehatFamily._loadProfileMeta();
}
/* Stamps the active profile on a record that has none (or names a profile not on this device).
   Returns true when the record belongs to another profile, so it must stay out of S.records. */
function famStamp(r) {
  if (!FAM.list) FAM.list = SehatFamily._norm(null);
  if (!r.profile || !FAM.list.some(p => p.id === r.profile)) r.profile = FAM.active;
  if (r.profile === FAM.active) return false;
  const i = FAM.others.findIndex(x => x.id === r.id);
  if (i >= 0) FAM.others[i] = r; else FAM.others.push(r);
  return true;
}
async function famDemo() { return SehatFamily._demo(); }
function famReset() {
  FAM.list = SehatFamily._norm(null); FAM.active = 'self'; FAM.others = []; FAM.chats = {}; FAM.unlocked = {}; FAM.menu = false; FAM.modal = null; FAM.bootLock = null;
  try { sessionStorage.removeItem('sehat_unlocked'); } catch (e) { /* ignore */ }
  try { localStorage.removeItem('sehat_profile'); localStorage.removeItem('sehat_pin_wait'); } catch (e) { /* ignore */ }
  const m = document.getElementById('famModal'); if (m) m.remove();
}

const SehatFamily = (function () {
  const RELS = ['self', 'father', 'mother', 'spouse', 'child', 'brother', 'sister', 'grandparent', 'friend', 'other'];
  const LOCK_SVG = '<svg class="fam-lock" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

  function strings() {
    Object.assign(STR.en, {
      fam_switch: 'Switch family profile', fam_add: 'Add family member', fam_edit: 'Edit', fam_remove: 'Remove member',
      fam_title_add: 'Add a family member', fam_title_edit: 'Edit profile', fam_name: 'Name', fam_relation: 'Relation', fam_age: 'Age', fam_sex: 'Sex',
      fam_sex_m: 'Male', fam_sex_f: 'Female', fam_sex_o: 'Other', fam_sex_none: 'Not set',
      rel_self: 'Me', rel_father: 'Father', rel_mother: 'Mother', rel_spouse: 'Spouse', rel_child: 'Child', rel_brother: 'Brother', rel_sister: 'Sister', rel_grandparent: 'Grandparent', rel_friend: 'Friend', rel_other: 'Someone else I care for',
      fam_save: 'Save', fam_cancel: 'Cancel', fam_me: 'Me', fam_records: '{n} records',
      fam_lock: 'Profile lock', fam_lock_note: 'Profile lock keeps this profile private inside the app on this device. It does not encrypt the records.',
      fam_pin_new: 'New 4-digit PIN (leave empty to keep)', fam_pin_set: 'Set a 4-digit PIN', fam_hidden: 'Hide from child profiles',
      fam_unlock_remove: 'Remove the lock', fam_locked: 'Locked', fam_pin_title: 'Enter the PIN for {name}', fam_pin_any: 'Open a hidden profile',
      fam_pin_any_title: 'Enter a profile PIN', fam_pin: 'PIN', fam_open: 'Open',
      fam_pin_wrong: 'Wrong PIN. {n} tries left.', fam_pin_wait: 'Too many wrong tries. Please wait {s} seconds.',
      fam_err_name: 'Please enter a name.', fam_err_age: 'Age must be a number from 0 to 120.', fam_err_pin: 'The PIN must be exactly 4 digits.',
      fam_err_hidden: 'Set a PIN first to hide this profile.', fam_err_crypto: 'This browser cannot set a PIN here (it needs a secure https page).',
      fam_confirm_remove: 'Remove {name} and all their records from this device? This cannot be undone.',
      fam_busy: 'Please finish or discard the record you are reviewing, or wait for the answer, before switching profiles.',
      fam_viewing: 'Viewing {name}',
      fam_care_for: 'Caretaker for the family', fam_cared_by: 'Cared for by {name}', fam_view: 'Family overview', fam_active: 'Open now', fam_open_m: 'Open', fam_meds_n: 'Medicines today: {x} of {y} taken', fam_meds_none: 'No medicines being tracked',
      fam_alerts: '{n} doses not marked yet (2+ hours late or skipped)', fam_alert_one: '1 dose not marked yet (2+ hours late or skipped)', fam_add_card: 'Add a family member', fam_add_hint: 'Keep a parent, partner or child\'s records here too.',
      fam_age_n: '{n} years', fam_locked_note: 'Locked. Enter the PIN to open.', fam_hidden_tag: 'Hidden from child profiles', fam_go_health: 'My health',
      pin_card: 'Parental control PIN', pin_note: 'Profiles with this PIN are hidden from child profiles. It keeps them private in the app on this device; it does not encrypt the records.',
      pin_prot: 'Protected profiles', pin_none: 'No profile has a PIN yet. Set one from Family, Edit.', pin_change: 'Change PIN', pin_cur: 'Current PIN', pin_new1: 'New 4-digit PIN', pin_new2: 'New PIN again',
      pin_reset: 'Reset PIN', pin_reset_note: 'The account holder can set a new PIN for every protected profile without the old one.',
      pin_reset_owner: 'To reset the PIN, open the account holder\'s profile ({name}) first.', pin_reset_sure: 'Yes, replace the PIN on every protected profile', pin_reset_go: 'Reset the PIN',
      pin_err_match: 'The two new PINs do not match.', pin_err_sure: 'Tick the box to confirm the reset.', pin_err_owner: 'Only the account holder can reset the PIN.',
      pin_changed: 'PIN changed for {n} profiles.', pin_was_reset: 'PIN reset for {n} profiles.', pin_demo: 'Demo PIN: 1000',
      pin_forgot: 'Forgot PIN?', pin_forgot_title: 'Forgot the PIN?', pin_forgot_note: 'No problem. The account holder ({name}) can set a new PIN for every protected profile without the old one.', pin_forgot_go: 'Reset it as {name}', pin_back: 'Back'
    });
    Object.assign(STR.hi, {
      fam_switch: 'परिवार प्रोफ़ाइल बदलें', fam_add: 'परिवार का सदस्य जोड़ें', fam_edit: 'बदलें', fam_remove: 'सदस्य हटाएँ',
      fam_title_add: 'परिवार का सदस्य जोड़ें', fam_title_edit: 'प्रोफ़ाइल बदलें', fam_name: 'नाम', fam_relation: 'रिश्ता', fam_age: 'उम्र', fam_sex: 'लिंग',
      fam_sex_m: 'पुरुष', fam_sex_f: 'महिला', fam_sex_o: 'अन्य', fam_sex_none: 'नहीं बताया',
      rel_self: 'मैं', rel_father: 'पिता', rel_mother: 'माता', rel_spouse: 'जीवनसाथी', rel_child: 'बच्चा', rel_brother: 'भाई', rel_sister: 'बहन', rel_grandparent: 'दादा-दादी / नाना-नानी', rel_friend: 'दोस्त', rel_other: 'कोई और जिसकी देखभाल करता/करती हूँ',
      fam_save: 'सहेजें', fam_cancel: 'रद्द करें', fam_me: 'मैं', fam_records: '{n} रिकॉर्ड',
      fam_lock: 'प्रोफ़ाइल लॉक', fam_lock_note: 'प्रोफ़ाइल लॉक इस डिवाइस पर ऐप के अंदर इस प्रोफ़ाइल को निजी रखता है। यह रिकॉर्ड को एन्क्रिप्ट नहीं करता।',
      fam_pin_new: 'नया 4 अंकों का पिन (वही रखने के लिए खाली छोड़ें)', fam_pin_set: '4 अंकों का पिन रखें', fam_hidden: 'बच्चों की प्रोफ़ाइल से छिपाएँ',
      fam_unlock_remove: 'लॉक हटाएँ', fam_locked: 'लॉक है', fam_pin_title: '{name} का पिन डालें', fam_pin_any: 'छिपी हुई प्रोफ़ाइल खोलें',
      fam_pin_any_title: 'प्रोफ़ाइल का पिन डालें', fam_pin: 'पिन', fam_open: 'खोलें',
      fam_pin_wrong: 'पिन गलत है। {n} कोशिशें बाकी हैं।', fam_pin_wait: 'बहुत बार गलत पिन डाला गया। कृपया {s} सेकंड रुकें।',
      fam_err_name: 'कृपया नाम लिखें।', fam_err_age: 'उम्र 0 से 120 के बीच की संख्या होनी चाहिए।', fam_err_pin: 'पिन ठीक 4 अंकों का होना चाहिए।',
      fam_err_hidden: 'इस प्रोफ़ाइल को छिपाने से पहले पिन रखें।', fam_err_crypto: 'यह ब्राउज़र यहाँ पिन नहीं रख सकता (इसके लिए सुरक्षित https पेज चाहिए)।',
      fam_confirm_remove: '{name} और उनके सभी रिकॉर्ड इस डिवाइस से हटाएँ? यह वापस नहीं होगा।',
      fam_busy: 'प्रोफ़ाइल बदलने से पहले जिस रिकॉर्ड की जाँच कर रहे हैं उसे पूरा करें या हटाएँ, या जवाब आने तक रुकें।',
      fam_viewing: '{name} की प्रोफ़ाइल',
      fam_care_for: 'परिवार की देखभाल करती/करते हैं', fam_cared_by: '{name} देखभाल करती/करते हैं', fam_view: 'परिवार की झलक', fam_active: 'अभी खुला है', fam_open_m: 'खोलें', fam_meds_n: 'आज की दवाइयाँ: {y} में से {x} ली गईं', fam_meds_none: 'कोई दवा ट्रैक नहीं हो रही',
      fam_alerts: '{n} खुराकें अभी दर्ज नहीं (2+ घंटे देर या छोड़ी गई)', fam_alert_one: '1 खुराक अभी दर्ज नहीं (2+ घंटे देर या छोड़ी गई)', fam_add_card: 'परिवार का सदस्य जोड़ें', fam_add_hint: 'माता-पिता, जीवनसाथी या बच्चे के रिकॉर्ड भी यहीं रखें।',
      fam_age_n: '{n} वर्ष', fam_locked_note: 'लॉक है। खोलने के लिए पिन डालें।', fam_hidden_tag: 'बच्चों की प्रोफ़ाइल से छिपा', fam_go_health: 'मेरी सेहत'
    });
    if (STR.hi) Object.assign(STR.hi, { pin_forgot: 'पिन भूल गए?', pin_forgot_title: 'पिन भूल गए?', pin_forgot_note: 'कोई बात नहीं। खाता धारक ({name}) पुराने पिन के बिना हर सुरक्षित प्रोफ़ाइल का नया पिन रख सकते हैं।', pin_forgot_go: '{name} के रूप में रीसेट करें', pin_back: 'वापस' });
  }

  function norm(list) {
    const out = [];
    (Array.isArray(list) ? list : []).forEach(p => {
      if (!p || typeof p !== 'object' || typeof p.id !== 'string' || out.some(x => x.id === p.id)) return;
      out.push({
        id: p.id, name: String(p.name || ''), relation: p.id === 'self' ? 'self' : (RELS.indexOf(p.relation) > 0 ? p.relation : 'other'),
        age: p.age == null || p.age === '' ? null : Number(p.age), sex: ['M', 'F', 'O'].indexOf(p.sex) >= 0 ? p.sex : null,
        pin: p.pin && p.pin.salt && p.pin.hash ? { salt: String(p.pin.salt), hash: String(p.pin.hash) } : null,
        hidden: !!(p.hidden && p.pin),
        caretaker: !!p.caretaker, caredBy: typeof p.caredBy === 'string' ? p.caredBy : null
      });
    });
    if (!out.some(p => p.id === 'self')) out.unshift({ id: 'self', name: '', relation: 'self', age: null, sex: null, pin: null, hidden: false });
    return out;
  }
  const save = () => dbPut('meta', { profiles: FAM.list }, 'family');
  const byId = id => FAM.list.find(p => p.id === id) || null;
  const isChild = id => { const p = byId(id); return !!(p && p.relation === 'child'); };
  /* The account owner ('self') manages the family and opens any profile; everyone else needs the PIN. */
  const needsPin = p => !!(p.pin && p.id !== FAM.active && isChild(FAM.active) && !FAM.unlocked[p.id]);
  const visible = p => !(p.hidden && isChild(FAM.active) && p.id !== FAM.active && !FAM.unlocked[p.id]);
  const canEdit = p => FAM.active === 'self' || p.id === FAM.active;
  function nameOf(p) {
    if (p.name) return p.name;
    if (p.id === 'self') {
      if (FAM.active === 'self' && S.patient && S.patient.name) return S.patient.name;
      if (FAM.selfName) return FAM.selfName;
      const u = typeof currentUser === 'function' ? currentUser() : null;
      if (u && u.name && !u.demo) return u.name;
    }
    return t('rel_' + p.relation);
  }
  const initials = s => String(s).trim().split(/\s+/).slice(0, 2).map(w => w.charAt(0)).join('').toUpperCase() || '?';
  const avatar = p => '<span class="avatar fam-av rel-' + esc(p.relation) + '" aria-hidden="true">' + esc(initials(nameOf(p))) + '</span>';

  function split(all) {
    const mine = [], rest = [];
    arr(all).forEach(r => { if (!r.profile) r.profile = 'self'; (r.profile === FAM.active ? mine : rest).push(r); });
    S.records = mine; FAM.others = rest;
  }
  async function loadProfileMeta() {
    S.patient = await dbGet('meta', profKey('patient'));
    S.vitals = arr(await dbGet('meta', profKey('vitals'))).map(cleanVital).filter(Boolean);
  }

  async function switchTo(id, opts) {
    if (!byId(id) || (id === FAM.active && !(opts && opts.force))) return;
    if ((S.stage && S.stage !== 'idle') || S.asking) { alert(t('fam_busy')); return; }
    FAM.chats[FAM.active] = S.chat;
    const all = FAM.others.concat(S.records);
    FAM.active = id;
    if (isChild(id)) { FAM.unlocked = {}; saveUnlocked(); }
    try { localStorage.setItem('sehat_profile', id); } catch (e) { /* ignore */ }
    split(all);
    S.chat = FAM.chats[id] || [];
    await loadProfileMeta();
    S.insights = null; S.overview = {}; S.detailId = null; S.fhir = null; S.medcheck = null; S.visitNotes = '';
    S.vform = null; S.notice = null; S.backupMsg = null; S.abhaFlow = null; S.error = null; S.retry = null;
    if (S.view === 'detail') S.view = 'timeline';
    if (S.view === 'visit') S.view = 'health';
    if (S.view === 'add' && S.records.length) S.view = 'health';
    if (typeof stopSpeak === 'function') stopSpeak();
    FAM.menu = false;
    render();
    try { document.dispatchEvent(new CustomEvent('sehat:profile', { detail: { id } })); } catch (e) { /* ignore */ }
  }

  /* --- PIN --- */
  const hex = buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  const cryptoOK = () => !!(window.crypto && crypto.subtle && crypto.getRandomValues);
  async function hashPin(salt, pin) { return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + pin))); }
  async function makePin(pin) { const salt = hex(crypto.getRandomValues(new Uint8Array(16))); return { salt, hash: await hashPin(salt, pin) }; }
  function waitGet() { try { return JSON.parse(localStorage.getItem('sehat_pin_wait') || 'null') || { n: 0, until: 0 }; } catch (e) { return { n: 0, until: 0 }; } }
  function waitSet(w) { try { localStorage.setItem('sehat_pin_wait', JSON.stringify(w)); } catch (e) { /* ignore */ } }
  /* returns the matching profile, or an error message */
  async function checkPin(pin, targets) {
    const w = waitGet(), now = Date.now();
    if (w.until > now) return { err: t('fam_pin_wait', { s: Math.ceil((w.until - now) / 1000) }) };
    if (!/^\d{4}$/.test(pin)) return { err: t('fam_err_pin') };
    for (const p of targets) if (p.pin && await hashPin(p.pin.salt, pin) === p.pin.hash) { waitSet({ n: 0, until: 0 }); return { p }; }
    w.n = (w.n || 0) + 1;
    if (w.n >= 5) { waitSet({ n: 0, until: now + 60000 }); return { err: t('fam_pin_wait', { s: 60 }) }; }
    waitSet({ n: w.n, until: 0 });
    return { err: t('fam_pin_wrong', { n: 5 - w.n }) };
  }

  /* --- header chip and menu --- */
  function paint() {
    const el = document.getElementById('famChip');
    if (!el || !FAM.list) return;
    const me = byId(FAM.active) || FAM.list[0];
    let h = '<button type="button" class="fam-btn" data-fam="menu" aria-haspopup="true" aria-expanded="' + FAM.menu + '" aria-label="' + esc(t('fam_switch') + ': ' + nameOf(me)) + '">' +
      avatar(me) + '<span class="fam-name">' + esc(nameOf(me)) + '</span>' + alertBadge() + '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>';
    if (FAM.menu) {
      const rows = FAM.list.filter(visible).map(p => {
        const n = p.id === FAM.active ? S.records.length : FAM.others.filter(r => r.profile === p.id).length;
        return '<div class="fam-row' + (p.id === FAM.active ? ' on' : '') + '"><button type="button" class="fam-pick" data-fam="pick" data-id="' + esc(p.id) + '"' + (p.id === FAM.active ? ' aria-current="true"' : '') + '>' + avatar(p) +
          '<span class="fam-who"><strong>' + esc(nameOf(p)) + '</strong><span class="muted small">' + esc(t('rel_' + p.relation)) + (p.age != null ? ', ' + esc(p.age) : '') + ' · ' + esc(t('fam_records', { n })) + '</span></span>' +
          (needsPin(p) ? '<span class="fam-lk" title="' + esc(t('fam_locked')) + '">' + LOCK_SVG + '<span class="sr-only">' + esc(t('fam_locked')) + '</span></span>' : '') + '</button>' +
          (canEdit(p) ? '<button type="button" class="btn small secondary fam-edit" data-fam="edit" data-id="' + esc(p.id) + '" aria-label="' + esc(t('fam_edit') + ' ' + nameOf(p)) + '">' + esc(t('fam_edit')) + '</button>' : '') + '</div>';
      }).join('');
      const hiddenAny = FAM.list.some(p => !visible(p));
      h += '<div class="fam-menu" role="menu">' + rows +
        '<button type="button" class="fam-act" data-fam="view">' + esc(t('fam_view')) + '</button>' +
        (!isChild(FAM.active) ? '<button type="button" class="fam-act" data-fam="add">+ ' + esc(t('fam_add')) + '</button>' : '') +
        (hiddenAny ? '<button type="button" class="fam-act" data-fam="pinany">' + LOCK_SVG + ' ' + esc(t('fam_pin_any')) + '</button>' : '') + '</div>';
    }
    el.innerHTML = h;
  }

  /* --- modal: add / edit form, PIN entry --- */
  function modal(html) {
    let m = document.getElementById('famModal');
    if (!m) { m = document.createElement('div'); m.id = 'famModal'; m.className = 'fam-modal'; document.body.appendChild(m); }
    m.innerHTML = '<div class="fam-dialog" role="dialog" aria-modal="true">' + html + '</div>';
    const f = m.querySelector('input:not([type=checkbox]),select'); if (f) f.focus();
  }
  const saveUnlocked = () => { try { sessionStorage.setItem('sehat_unlocked', JSON.stringify(FAM.unlocked)); } catch (e) { /* ignore */ } };
  /* boot with every profile locked: the PIN prompt cannot be dismissed until it is right */
  function bootPin() {
    const go = () => { strings(); openPin(FAM.bootLock); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(go, 0)); else go();
  }
  function closeModal() { if (FAM.bootLock && FAM.modal && FAM.modal.kind === 'pin') return; FAM.modal = null; const m = document.getElementById('famModal'); if (m) m.remove(); }
  function openForm(id) {
    const p = id ? byId(id) : null;
    if (id && (!p || !canEdit(p))) return;
    FAM.modal = { kind: 'form', id: id || null }; FAM.menu = false; paint();
    const rels = p && p.id === 'self' ? ['self'] : RELS.slice(1);
    const opt = (v, l, cur) => '<option value="' + esc(v) + '"' + (v === cur ? ' selected' : '') + '>' + esc(l) + '</option>';
    modal('<form id="famForm" novalidate><h2>' + esc(t(p ? 'fam_title_edit' : 'fam_title_add')) + '</h2>' +
      '<label>' + esc(t('fam_name')) + '<input name="name" maxlength="60" autocomplete="off" value="' + esc(p ? p.name || (p.id === 'self' ? nameOf(p) : '') : '') + '" required></label>' +
      '<div class="fam-2"><label>' + esc(t('fam_relation')) + '<select name="relation">' + rels.map(r => opt(r, t('rel_' + r), p ? p.relation : 'father')).join('') + '</select></label>' +
      '<label>' + esc(t('fam_age')) + '<input name="age" type="number" inputmode="numeric" min="0" max="120" value="' + esc(p && p.age != null ? p.age : '') + '"></label>' +
      '<label>' + esc(t('fam_sex')) + '<select name="sex">' + opt('', t('fam_sex_none'), p ? p.sex || '' : '') + opt('M', t('fam_sex_m'), p && p.sex) + opt('F', t('fam_sex_f'), p && p.sex) + opt('O', t('fam_sex_o'), p && p.sex) + '</select></label></div>' +
      '<fieldset class="fam-lockset"><legend>' + LOCK_SVG + ' ' + esc(t('fam_lock')) + '</legend><p class="muted small">' + esc(t('fam_lock_note')) + '</p>' +
      '<label>' + esc(t(p && p.pin ? 'fam_pin_new' : 'fam_pin_set')) + '<input name="pin" type="password" inputmode="numeric" pattern="\\d{4}" maxlength="4" autocomplete="new-password"></label>' +
      '<label class="fam-check"><input type="checkbox" name="hidden"' + (p && p.hidden ? ' checked' : '') + '> ' + esc(t('fam_hidden')) + '</label>' +
      (p && p.pin ? '<label class="fam-check"><input type="checkbox" name="unlock"> ' + esc(t('fam_unlock_remove')) + '</label>' : '') + '</fieldset>' +
      '<p class="fam-err" role="alert"></p><div class="row fam-btns"><button type="submit" class="btn">' + esc(t('fam_save')) + '</button><button type="button" class="btn secondary" data-fam="close">' + esc(t('fam_cancel')) + '</button>' +
      (p && p.id !== 'self' && FAM.active === 'self' ? '<button type="button" class="btn danger" data-fam="remove" data-id="' + esc(p.id) + '">' + esc(t('fam_remove')) + '</button>' : '') + '</div></form>');
  }
  /* shared by the member form and addMember(): store the profile and its patient details */
  async function persist(p, isNew) {
    if (isNew) FAM.list.push(p);
    FAM.list = norm(FAM.list);
    await save();
    // the profile's patient details feed the insights and the doctor visit page
    const key = profKeyFor('patient', p.id);
    const pt = (await dbGet('meta', key)) || { abha: null };
    Object.assign(pt, { name: p.name, age: p.age == null ? null : String(p.age), sex: p.sex === 'O' ? 'Other' : p.sex });
    await dbPut('meta', pt, key);
    if (p.id === FAM.active) S.patient = pt;
    if (p.id === FAM.active) S.insights = null;
  }
  /* for other modules (the "who is this document for" dialog): same rules as the form; a child profile cannot add members */
  const canAdd = () => !isChild(FAM.active);
  async function addMember(o) {
    if (!canAdd()) return null;
    const name = String((o && o.name) || '').trim().slice(0, 60);
    if (!name) return null;
    const ageN = o && o.age != null && o.age !== '' ? Number(o.age) : null;
    const age = ageN !== null && Number.isInteger(ageN) && ageN >= 0 && ageN <= 120 ? ageN : null;
    const relation = RELS.indexOf(o && o.relation) > 0 ? o.relation : 'other';
    const sex = ['M', 'F', 'O'].indexOf(o && o.sex) >= 0 ? o.sex : null;
    const p = { id: 'p' + Math.random().toString(36).slice(2, 9), name, relation, age, sex, pin: null, hidden: false };
    await persist(p, true);
    return p.id;
  }
  /* profiles a document may be saved into from the active one: not locked behind a PIN, not hidden from a child */
  const targets = () => (FAM.list || []).filter(p => p.id !== FAM.active && !needsPin(p) && visible(p)).map(p => ({ id: p.id, name: nameOf(p), relation: p.relation }));
  async function submitForm(form) {
    const err = msg => { const e = form.querySelector('.fam-err'); if (e) e.textContent = msg; };
    const f = form.elements, id = FAM.modal && FAM.modal.id;
    const name = f.name.value.trim(), ageS = f.age.value.trim(), pin = f.pin.value.trim();
    if (!name) return err(t('fam_err_name'));
    const age = ageS === '' ? null : Number(ageS);
    if (age !== null && !(Number.isInteger(age) && age >= 0 && age <= 120)) return err(t('fam_err_age'));
    if (pin && !/^\d{4}$/.test(pin)) return err(t('fam_err_pin'));
    if (pin && !cryptoOK()) return err(t('fam_err_crypto'));
    const old = id ? byId(id) : null;
    const removeLock = !!(f.unlock && f.unlock.checked);
    let lock = removeLock ? null : (old ? old.pin : null);
    if (pin && !removeLock) lock = await makePin(pin);
    if (f.hidden.checked && !lock) return err(t('fam_err_hidden'));
    const p = old || { id: 'p' + Math.random().toString(36).slice(2, 9) };
    Object.assign(p, { name, relation: p.id === 'self' ? 'self' : f.relation.value, age, sex: f.sex.value || null, pin: lock, hidden: !!(lock && f.hidden.checked) });
    await persist(p, !old);
    closeModal();
    render();
  }
  async function removeMember(id) {
    const p = byId(id);
    if (!p || id === 'self' || FAM.active !== 'self') return;
    if (!confirm(t('fam_confirm_remove', { name: nameOf(p) }))) return;
    const gone = FAM.others.filter(r => r.profile === id);
    for (const r of gone) { await dbDel('records', r.id); await dbDel('files', r.id); }
    FAM.others = FAM.others.filter(r => r.profile !== id);
    await dbDel('meta', profKeyFor('patient', id)); await dbDel('meta', profKeyFor('vitals', id));
    try { Object.keys(localStorage).filter(k => k.slice(-(id.length + 1)) === '@' + id).forEach(k => localStorage.removeItem(k)); } catch (e) { /* ignore */ }
    delete FAM.chats[id]; delete FAM.unlocked[id];
    FAM.list = FAM.list.filter(x => x.id !== id);
    await save();
    closeModal(); render();
  }
  function openPin(id) {
    const p = id === '*' ? null : byId(id);
    FAM.modal = { kind: 'pin', id }; FAM.menu = false; paint();
    modal('<form id="famPin" novalidate><h2>' + esc(p ? t('fam_pin_title', { name: nameOf(p) }) : t('fam_pin_any_title')) + '</h2>' +
      '<p class="muted small">' + esc(t('fam_lock_note')) + '</p><label>' + esc(t('fam_pin')) + '<input name="pin" type="password" inputmode="numeric" pattern="\\d{4}" maxlength="4" autocomplete="off" class="fam-pinbox"></label>' +
      '<p class="fam-err" role="alert"></p><div class="row fam-btns"><button type="submit" class="btn">' + esc(t('fam_open')) + '</button>' + (FAM.bootLock ? '' : '<button type="button" class="btn secondary" data-fam="close">' + esc(t('fam_cancel')) + '</button>') + '</div>' +
      '<p class="small" style="margin:12px 0 0"><button type="button" class="btn link" data-fam="forgot">' + esc(t('pin_forgot')) + '</button></p></form>');
  }
  /* Forgot PIN: the account holder resets it without the old one (Settings, Parental control PIN). */
  function openForgot() {
    const self = byId('self'), back = FAM.modal && FAM.modal.id;
    FAM.modal = { kind: 'pin', id: back, forgot: true }; paint();
    modal('<div><h2>' + esc(t('pin_forgot_title')) + '</h2><p class="muted">' + esc(t('pin_forgot_note', { name: nameOf(self) })) + '</p>' +
      '<div class="row fam-btns"><button type="button" class="btn" data-fam="forgotgo">' + esc(t('pin_forgot_go', { name: nameOf(self) })) + '</button><button type="button" class="btn secondary" data-fam="forgotback" data-id="' + esc(back || '*') + '">' + esc(t('pin_back')) + '</button></div></div>');
  }
  async function forgotGo() {
    FAM.bootLock = null; FAM.modal = null; const m = document.getElementById('famModal'); if (m) m.remove();
    await switchTo('self', { force: true });
    FAM.pinUi = { reset: true }; go('settings');
    setTimeout(() => { const c = document.getElementById('pinCard'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 120);
  }
  async function submitPin(form) {
    const id = FAM.modal && FAM.modal.id;
    const targets = id === '*' ? FAM.list.filter(p => p.pin && !visible(p)) : [byId(id)].filter(Boolean);
    const res = await checkPin(form.elements.pin.value.trim(), targets);
    if (res.err) { form.querySelector('.fam-err').textContent = res.err; form.elements.pin.value = ''; form.elements.pin.focus(); return; }
    FAM.unlocked[res.p.id] = true; saveUnlocked();
    const boot = FAM.bootLock; FAM.bootLock = null;
    closeModal();
    await switchTo(res.p.id, { force: !!boot });
  }
  function pick(id) {
    const p = byId(id);
    if (!p) return;
    if (needsPin(p)) return openPin(id);
    return switchTo(id);
  }

  /* --- family overview: one card per member --- */
  /* reminders.js (if present): number of caregiver alerts, optionally for one profile id */
  function alerts(id) {
    if (isChild(FAM.active)) return 0;  // the caregiver feed belongs to the account owner
    const mp = id && byId(id); if (mp && !visible(mp)) return 0;
    try { const R = window.SehatRem; if (R && typeof R.caregiverCount === 'function') { const n = Number(id ? R.caregiverCount(id) : R.caregiverCount()); return isFinite(n) && n > 0 ? n : 0; } } catch (e) { /* ignore */ }
    return 0;
  }
  const alertTxt = n => n === 1 ? t('fam_alert_one') : t('fam_alerts', { n });
  const alertBadge = () => { const n = alerts(); return n ? '<span class="fam-badge" title="' + esc(alertTxt(n)) + '"><span aria-hidden="true">' + n + '</span><span class="sr-only">' + esc(alertTxt(n)) + '</span></span>' : ''; };
  /* today's doses taken / due. The active profile uses the live schedule; for the others it is worked out from their
     records and their own "I take this" and "taken" keys (approximate: an ended course is not detected). */
  function medProgress(p) {
    try {
      if (p.id === FAM.active) {
        const list = buildDoses(schedMeds()).filter(d => isTickable(d.slot)), tk = takenGet();
        return list.length ? { x: list.filter(d => tk[d.key]).length, y: list.length } : null;
      }
      const cur = JSON.parse(localStorage.getItem(profKeyFor('sehat_current', p.id)) || '{}') || {};
      const seen = {}, meds = [];
      FAM.others.filter(r => r.profile === p.id).forEach(r => arr(r.medicines).forEach(m => { const k = curKey(m); if (k && cur[k] && !seen[k]) { seen[k] = 1; meds.push({ m, date: r.date }); } }));
      const list = buildDoses(meds).filter(d => isTickable(d.slot));
      if (!list.length) return null;
      const tk = JSON.parse(localStorage.getItem('sehat_taken_' + profKeyFor(todayKey(), p.id)) || '{}') || {};
      return { x: list.filter(d => tk[d.key]).length, y: list.length };
    } catch (e) { return null; }
  }
  function view() {
    if (!FAM.list) return '';
    const cards = FAM.list.filter(visible).map(p => {
      const n = p.id === FAM.active ? S.records.length : FAM.others.filter(r => r.profile === p.id).length;
      const locked = needsPin(p), on = p.id === FAM.active, mp = locked ? null : medProgress(p), al = locked ? 0 : alerts(p.id);
      return '<div class="card fam-card' + (on ? ' on' : '') + '" data-pid="' + esc(p.id) + '"><div class="fam-card-top">' + avatar(p).replace('fam-av ', 'fam-av fam-av-lg ') +
        '<div class="fam-card-who"><h3>' + esc(nameOf(p)) + (p.pin ? ' <span class="fam-lk" title="' + esc(t('fam_locked')) + '">' + LOCK_SVG + '<span class="sr-only">' + esc(t('fam_locked')) + '</span></span>' : '') + '</h3>' +
        '<span class="muted small">' + esc(t('rel_' + p.relation)) + (p.age != null ? ' · ' + esc(t('fam_age_n', { n: p.age })) : '') + '</span>' +
        (p.caretaker ? '<span class="tag green" style="margin-top:4px">' + esc(t('fam_care_for')) + '</span>' : p.caredBy && byId(p.caredBy) ? '<span class="muted small">' + esc(t('fam_cared_by', { name: nameOf(byId(p.caredBy)) })) + '</span>' : '') + '</div>' +
        (on ? '<span class="tag green">' + esc(t('fam_active')) + '</span>' : '') + '</div>' +
        '<ul class="fam-stats"><li>' + esc(t('fam_records', { n })) + '</li>' +
        (locked ? '<li class="muted small">' + esc(t('fam_locked_note')) + '</li>' :
          '<li class="small">' + esc(mp ? t('fam_meds_n', mp) : t('fam_meds_none')) + '</li>' +
          (al ? '<li><span class="tag amber">' + esc(al === 1 ? t('fam_alert_one') : t('fam_alerts', { n: al })) + '</span></li>' : '')) +
        (p.hidden ? '<li class="muted small">' + esc(t('fam_hidden_tag')) + '</li>' : '') + '</ul>' +
        '<div class="row fam-card-btns"><button type="button" class="btn small" data-fam="openm" data-id="' + esc(p.id) + '">' + esc(on ? t('fam_go_health') : t('fam_open_m')) + '</button>' +
        (!on && !locked && mp ? '<button type="button" class="btn small secondary" data-act="rm_nudge" data-pid="' + esc(p.id) + '">' + esc(t('nudge_btn')) + '</button>' : '') +
        (canEdit(p) ? '<button type="button" class="btn small secondary" data-fam="edit" data-id="' + esc(p.id) + '" aria-label="' + esc(t('fam_edit') + ' ' + nameOf(p)) + '">' + esc(t('fam_edit')) + '</button>' : '') + '</div></div>';
    }).join('');
    const add = !isChild(FAM.active) ? '<button type="button" class="card fam-card fam-addcard" data-fam="add"><span class="fam-plus" aria-hidden="true">+</span><strong>' + esc(t('fam_add_card')) + '</strong><span class="muted small">' + esc(t('fam_add_hint')) + '</span></button>' : '';
    const hiddenAny = FAM.list.some(p => !visible(p));
    return '<div class="fam-grid">' + cards + add + '</div>' + (hiddenAny ? '<p style="margin-top:12px"><button type="button" class="btn small secondary" data-fam="pinany">' + LOCK_SVG + ' ' + esc(t('fam_pin_any')) + '</button></p>' : '');
  }
  async function openMember(id) {
    const p = byId(id);
    if (!p) return;
    if (id === FAM.active) { go('health'); return; }
    if (needsPin(p)) { openPin(id); return; }
    await switchTo(id);
    if (FAM.active === id) go('health');
  }

  /* --- demo family: Jay (self, the bundled demo records), his father Ramesh and son Aarav --- */
  function lab(id, date, tests, title) {
    return normalizeRecord({
      id, profile: 'p_ramesh', doc_type: 'lab_report', title: title || 'Lab Report - Sunrise Diagnostics', date, facility: 'Sunrise Diagnostics', doctor: 'Dr. K. Rao',
      patient: { name: 'Mr. Ramesh Tawri', age: '72 Years', sex: 'M' }, language_detected: 'en', handwritten: false, source: 'sample', extracted_by: 'sample',
      overall_confidence: 1, tests, medicines: [], diagnoses: [], advice: [], follow_up: null, warnings: [], unread: [], explanation: {}
    });
  }
  const hba1c = v => ({ name: 'HbA1c (Glycated Hemoglobin)', value: v, unit: '%', ref_low: 4.0, ref_high: 5.6, ref_text: '4.0 - 5.6', ref_source: 'report', flag: 'high', source_text: 'HbA1c (Glycated Hemoglobin) ' + v + ' % 4.0 - 5.6', page: 1, confidence: 1, loinc: '4548-4', standard_name: 'HbA1c' });
  function rameshRecords() {
    return [
      lab('rec_fam_r_lab1', '2026-01-08', [hba1c(8.1)]),
      lab('rec_fam_r_lab2', '2026-04-06', [hba1c(8.6)]),
      lab('rec_fam_r_lab3', '2026-07-02', [hba1c(8.9), { name: 'Fasting Blood Sugar', value: 168, unit: 'mg/dL', ref_low: 70, ref_high: 100, ref_text: '70 - 100', ref_source: 'report', flag: 'high', source_text: 'Fasting Blood Sugar 168 mg/dL 70 - 100', page: 1, confidence: 1, loinc: '1558-6', standard_name: 'Fasting Blood Sugar' }]),
      normalizeRecord({
        id: 'rec_fam_r_rx1', profile: 'p_ramesh', doc_type: 'prescription', title: 'Prescription - Dr. K. Rao', date: '2026-07-03', facility: 'Rao Family Clinic', doctor: 'Dr. K. Rao',
        patient: { name: 'Ramesh Tawri', age: '72', sex: 'M' }, language_detected: 'en', handwritten: false, source: 'sample', extracted_by: 'sample', overall_confidence: 1, tests: [],
        medicines: [{ name: 'Tab. Metformin', generic: 'Metformin', strength: '500 mg', dose: '1 tablet', frequency: 'twice a day', timing: 'after food', duration: '6 months', instructions: null, source_text: 'Tab. Metformin 500 mg 1-0-1 after food x 6 months', page: 1, confidence: 1, known: true }],
        diagnoses: [{ name: 'Type 2 Diabetes Mellitus', confidence: 1 }], advice: ['Walk 30 minutes daily', 'Repeat HbA1c in 3 months'], follow_up: null, warnings: [], unread: [], explanation: {}
      })
    ];
  }
  /* demo helpers used by seed-year.js */
  async function lockForChild(ids, pin) {
    if (!cryptoOK()) return;
    for (const id of ids || []) { const p = byId(id); if (p && p.relation !== 'child' && !p.pin) { p.pin = await makePin(String(pin)); p.hidden = true; } }
    FAM.list = norm(FAM.list); await save();
  }
  async function setCare(caretakerId, ids) {
    const c = byId(caretakerId); if (!c) return;
    c.caretaker = true;
    (ids || []).forEach(id => { const p = byId(id); if (p && p.id !== caretakerId) p.caredBy = caretakerId; });
    FAM.list = norm(FAM.list); await save();
  }
  async function demo() {
    const had = FAM.list.length > 1;
    const self = byId('self');
    if (!self.name) Object.assign(self, { name: 'Rahul Mehra', age: 34, sex: 'M' });  // the Mehra family demo; seed-year.js adds the rest
    if (had) { FAM.list = norm(FAM.list); await save(); await loadProfileMeta(); return; }  // the demo opens Jay on purpose, once  // parental-control demo: Aarav cannot see Jay
    FAM.list = norm(FAM.list);
    await save();
    await loadProfileMeta();
  }

  /* --- parental control PIN (Settings card): one PIN shared by the protected profiles --- */
  const protectedList = () => (FAM.list || []).filter(p => p.pin);
  async function changePin(cur, a, b) {
    if (!/^\d{4}$/.test(a)) return { err: t('fam_err_pin') };
    if (a !== b) return { err: t('pin_err_match') };
    if (!cryptoOK()) return { err: t('fam_err_crypto') };
    const prot = protectedList();
    if (!prot.length) return { err: t('pin_none') };
    const res = await checkPin(cur, prot);  // same wrong-try limit as opening a profile
    if (res.err) return { err: res.err };
    let n = 0;
    for (const p of prot) if (await hashPin(p.pin.salt, cur) === p.pin.hash) { p.pin = await makePin(a); n++; }
    await save();
    return { n };
  }
  async function resetPin(a, b, sure) {
    if (FAM.active !== 'self') return { err: t('pin_err_owner') };
    if (!/^\d{4}$/.test(a)) return { err: t('fam_err_pin') };
    if (a !== b) return { err: t('pin_err_match') };
    if (!sure) return { err: t('pin_err_sure') };
    if (!cryptoOK()) return { err: t('fam_err_crypto') };
    const prot = protectedList();
    if (!prot.length) return { err: t('pin_none') };
    for (const p of prot) p.pin = await makePin(a);
    waitSet({ n: 0, until: 0 });
    await save();
    return { n: prot.length };
  }
  function pinCard(demo) {
    if (!FAM.list) return '';
    const prot = protectedList(), ui = FAM.pinUi || {}, msg = ui.msg, self = byId('self');
    const inp = (n, l) => '<label class="fld"><span>' + esc(t(l)) + '</span><input name="' + n + '" type="password" inputmode="numeric" maxlength="4" autocomplete="off" class="d-in" style="max-width:160px"></label>';
    const list = prot.length ? '<ul class="list" id="pinProt">' + prot.map(p => '<li><span class="l"><strong>' + esc(nameOf(p)) + '</strong><br><span class="muted small">' + esc(t('rel_' + p.relation)) + (p.hidden ? ' · ' + esc(t('fam_hidden_tag')) : '') + '</span></span></li>').join('') + '</ul>' : '<p class="muted">' + esc(t('pin_none')) + '</p>';
    const change = prot.length ? '<form id="famPinChange" novalidate style="margin-top:12px"><h3 style="margin:0 0 6px">' + esc(t('pin_change')) + '</h3><div class="row">' + inp('cur', 'pin_cur') + inp('n1', 'pin_new1') + inp('n2', 'pin_new2') + '</div><button type="submit" class="btn">' + esc(t('pin_change')) + '</button></form>' : '';
    const reset = !prot.length ? '' : FAM.active !== 'self' ? '<p class="muted small" style="margin-top:12px">' + esc(t('pin_reset_owner', { name: nameOf(self) })) + '</p>' :
      (ui.reset ? '<form id="famPinReset" novalidate style="margin-top:12px"><h3 style="margin:0 0 6px">' + esc(t('pin_reset')) + '</h3><p class="muted small">' + esc(t('pin_reset_note')) + '</p><div class="row">' + inp('n1', 'pin_new1') + inp('n2', 'pin_new2') + '</div>' +
        '<label class="fam-check"><input type="checkbox" name="sure"> ' + esc(t('pin_reset_sure')) + '</label><div class="row"><button type="submit" class="btn danger">' + esc(t('pin_reset_go')) + '</button><button type="button" class="btn secondary" data-fam="pinresetx">' + esc(t('fam_cancel')) + '</button></div></form>'
        : '<p style="margin-top:12px"><button type="button" class="btn secondary" data-fam="pinreset">' + esc(t('pin_reset')) + '</button></p>');
    return '<div class="card" id="pinCard"><h2 style="margin-bottom:6px">' + esc(t('pin_card')) + '</h2><p class="muted small">' + esc(t('pin_note')) + '</p><h3 style="margin:10px 0 4px">' + esc(t('pin_prot')) + '</h3>' + list + change + reset +
      (msg ? '<p class="small" role="status" id="pinMsg" style="margin:10px 0 0;color:var(' + (msg.ok ? '--ok' : '--crit') + ')">' + esc(msg.text) + '</p>' : '') +
      (demo ? '<p class="muted small" style="margin:10px 0 0">' + esc(t('pin_demo')) + '</p>' : '') + '</div>';
  }
  async function submitPinForm(form, kind) {
    const f = form.elements, v = n => (f[n] ? f[n].value.trim() : '');
    const res = kind === 'change' ? await changePin(v('cur'), v('n1'), v('n2')) : await resetPin(v('n1'), v('n2'), !!(f.sure && f.sure.checked));
    FAM.pinUi = res.err ? { reset: kind === 'reset', msg: { ok: false, text: res.err } } : { reset: false, msg: { ok: true, text: t(kind === 'change' ? 'pin_changed' : 'pin_was_reset', { n: res.n }) } };
    render();
  }

  /* --- events --- */
  document.addEventListener('click', e => {
    const el = e.target && e.target.closest ? e.target.closest('[data-fam]') : null;
    if (!el) {
      if (FAM.menu && !(e.target.closest && e.target.closest('#famChip'))) { FAM.menu = false; paint(); }
      if (e.target && e.target.id === 'famModal') closeModal();
      return;
    }
    const a = el.getAttribute('data-fam'), id = el.getAttribute('data-id');
    if (a === 'menu') { FAM.menu = !FAM.menu; paint(); }
    else if (a === 'pick') pick(id);
    else if (a === 'view') { FAM.menu = false; paint(); go('family'); }
    else if (a === 'openm') openMember(id);
    else if (a === 'edit') openForm(id);
    else if (a === 'add') openForm(null);
    else if (a === 'pinany') openPin('*');
    else if (a === 'forgot') openForgot();
    else if (a === 'forgotgo') forgotGo();
    else if (a === 'forgotback') openPin(id);
    else if (a === 'close') closeModal();
    else if (a === 'remove') removeMember(id);
    else if (a === 'pinreset' || a === 'pinresetx') { FAM.pinUi = { reset: a === 'pinreset' }; render(); }
  });
  document.addEventListener('submit', e => {
    if (!e.target) return;
    if (e.target.id === 'famForm') { e.preventDefault(); submitForm(e.target); }
    else if (e.target.id === 'famPin') { e.preventDefault(); submitPin(e.target); }
    else if (e.target.id === 'famPinChange') { e.preventDefault(); submitPinForm(e.target, 'change'); }
    else if (e.target.id === 'famPinReset') { e.preventDefault(); submitPinForm(e.target, 'reset'); }
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (FAM.modal) closeModal(); else if (FAM.menu) { FAM.menu = false; paint(); }
  });
  /* reminders.js tells us when the caregiver alerts change */
  document.addEventListener('sehat:caregiver', () => { paint(); if (S.view === 'family' && !FAM.modal) render(); });
  /* after app.js has run: add labels and repaint the chip on every render */
  document.addEventListener('DOMContentLoaded', () => {
    strings();
    const prev = render;
    render = function () { prev(); paint(); };
    paint();
  });

  return {
    _norm: norm, _split: split, _loadProfileMeta: loadProfileMeta, _demo: demo, _bootPin: bootPin,
    active: () => FAM.active, list: () => (FAM.list || []).map(p => ({ id: p.id, name: nameOf(p), relation: p.relation, age: p.age, sex: p.sex, locked: !!p.pin, hidden: p.hidden, caretaker: !!p.caretaker, caredBy: p.caredBy || null })),
    switchTo: id => pick(id), view, profKey, profKeyFor, addMember, canAdd, targets,
    pinCard, changePin, resetPin, protectedIds: () => protectedList().map(p => p.id), lockForChild, setCare
  };
})();
window.SehatFamily = SehatFamily;
