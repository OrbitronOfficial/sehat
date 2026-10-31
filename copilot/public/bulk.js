'use strict';
/* ================= Bulk upload =================
   Several files at once (file picker with `multiple`, or dropping many). They are read one after another
   in the background; each becomes a draft. The user reviews and saves them one by one with the normal review
   screen ("Review next"), or skips one. The single-file flow (handleFile) and the chat upload are untouched.
   Hooks in app.js: S.bulk, viewAdd -> queueHTML, viewReview -> reviewBanner, saveDraft -> afterSave,
   discardDraft -> onDiscard. */

Object.assign(STR.en, {
  bulk_hint: 'You can pick many files at once.', bulk_title: 'Your documents', bulk_reading: 'Reading {x} of {n}...', bulk_all_read: 'All {n} documents read. Review them one by one.',
  bulk_queued: 'Waiting', bulk_busy: 'Reading...', bulk_ready: 'Ready to review', bulk_failed: 'Could not read', bulk_saved: 'Saved', bulk_skipped: 'Skipped',
  bulk_review: 'Review', bulk_next: 'Review next ({n} left)', bulk_retry: 'Retry', bulk_skip: 'Skip', bulk_more: 'Add more files', bulk_clear: 'Clear list',
  bulk_confirm_clear: 'Clear the list? Documents not saved yet will be dropped.', bulk_done_dates: 'Copilot read {n} documents from {a} to {b}.', bulk_done: 'Copilot read {n} documents.',
  bulk_done_failed: '{n} could not be read. You can retry them above.', bulk_go: 'See my health overview', bulk_go_note: 'Your insights now cover all of these records.',
  bulk_banner: 'Document {i} of {n} in your batch. {left} more to review after this one.', bulk_back: 'Back to the list', bulk_none_saved: 'No documents were saved from this batch.'
});
Object.assign(STR.hi, {
  bulk_hint: 'आप एक साथ कई फ़ाइलें चुन सकते हैं।', bulk_title: 'आपके दस्तावेज़', bulk_reading: '{n} में से {x} पढ़ा जा रहा है...', bulk_all_read: 'सभी {n} दस्तावेज़ पढ़ लिए गए। एक-एक करके जाँचें।',
  bulk_queued: 'इंतज़ार में', bulk_busy: 'पढ़ा जा रहा है...', bulk_ready: 'जाँचने के लिए तैयार', bulk_failed: 'पढ़ा नहीं जा सका', bulk_saved: 'सहेजा गया', bulk_skipped: 'छोड़ा गया',
  bulk_review: 'जाँचें', bulk_next: 'अगला जाँचें ({n} बाकी)', bulk_retry: 'फिर कोशिश करें', bulk_skip: 'छोड़ें', bulk_more: 'और फ़ाइलें जोड़ें', bulk_clear: 'सूची साफ़ करें',
  bulk_confirm_clear: 'सूची साफ़ करें? जो दस्तावेज़ अभी सहेजे नहीं गए हैं वे हट जाएँगे।', bulk_done_dates: 'कोपायलट ने {a} से {b} तक के {n} दस्तावेज़ पढ़े।', bulk_done: 'कोपायलट ने {n} दस्तावेज़ पढ़े।',
  bulk_done_failed: '{n} पढ़े नहीं जा सके। आप ऊपर से उन्हें फिर आज़मा सकते हैं।', bulk_go: 'मेरी सेहत का सारांश देखें', bulk_go_note: 'अब आपकी जानकारी इन सभी रिकॉर्ड को शामिल करती है।',
  bulk_banner: 'आपके समूह का {i}/{n} दस्तावेज़। इसके बाद {left} और जाँचने हैं।', bulk_back: 'सूची पर वापस', bulk_none_saved: 'इस समूह से कोई दस्तावेज़ सहेजा नहीं गया।'
});

const SehatBulk = (function () {
  const MAX_BYTES = 3 * 1024 * 1024;  // same limit as a single non-image upload
  let seq = 0;
  const items = () => (S.bulk ? S.bulk.items : []);
  const count = st => items().filter(i => i.status === st).length;
  const redraw = () => { if (S.view === 'add' && S.stage === 'idle') render(); };

  function add(files) {
    if (S.stage === 'processing' || S.stage === 'review') return showError(t('fam_busy'));
    clearError();
    if (!S.bulk) S.bulk = { items: [], cur: null, running: false, tok: ++seq };
    files.forEach(f => {
      const mime = f.type || guessMime(f.name), isImg = mime.indexOf('image/') === 0;
      const bad = !(isImg || mime === 'application/pdf' || mime === 'text/plain') ? t('err_type') : (!isImg && f.size > MAX_BYTES ? t('err_size') : null);
      S.bulk.items.push({ id: 'b' + (++seq), file: f, name: f.name || 'upload', status: bad ? 'failed' : 'queued', err: bad, draft: null, pending: null, rec: null });
    });
    S.view = 'add'; render(); window.scrollTo(0, 0);
    run();
  }

  /* the same reading steps as handleFile, without touching the review screen */
  async function readOne(file) {
    const mime = file.type || guessMime(file.name), isImg = mime.indexOf('image/') === 0;
    let dataUrl, outMime = mime;
    if (isImg) { dataUrl = await downscale(file); outMime = 'image/jpeg'; } else dataUrl = await readAsDataURL(file);
    const data = String(dataUrl).split(',')[1] || '', name = file.name || 'upload';
    const res = await extractLimited({ ctl: new AbortController() }, name, outMime, data, dataUrl, isImg, null);  // app.js: 75 s per read, 60 s on-device backup
    const draft = normalizeRecord(res.record);
    if (typeof unreadable === 'function' && unreadable(draft)) throw new Error(t('err_unread'));  // listed as failed, with retry
    return { draft, pending: { mime: outMime, dataUrl } };
  }
  async function run() {
    const B = S.bulk;
    if (!B || B.running) return;
    B.running = true;
    for (;;) {
      if (S.bulk !== B) return;
      const it = B.items.find(i => i.status === 'queued');
      if (!it) break;
      it.status = 'reading'; it.err = null; redraw();
      try {
        const r = await readOne(it.file);
        if (S.bulk !== B) return;
        it.draft = r.draft; it.pending = r.pending; it.status = 'ready';
      } catch (e) {
        if (S.bulk !== B) return;
        it.status = 'failed'; it.err = e.message || t('err_generic');
      }
      redraw();
    }
    B.running = false; redraw();
  }

  function review(id) {
    const B = S.bulk; if (!B || S.stage !== 'idle') return;
    const it = id ? B.items.find(i => i.id === id) : B.items.find(i => i.status === 'ready');
    if (!it || it.status !== 'ready') return;
    B.cur = it.id;
    S.draft = normalizeRecord(clone(it.draft)); S.pendingFile = it.pending; S.previewFile = null;
    S.dirty = false; S.reflag = false; S.editingId = null; S.stage = 'review'; S.view = 'add';
    clearError(); render(); window.scrollTo(0, 0);
  }
  const current = id => { const d = id || (S.draft && S.draft.id); return S.bulk && S.bulk.cur && d && !S.editingId ? items().find(i => i.id === S.bulk.cur && i.draft && i.draft.id === d) || null : null; };
  /* called by saveDraft once the record is stored; true = stay on the queue instead of opening the record */
  function afterSave(rec) {
    const it = current(rec.id);
    if (!it) return false;
    it.status = 'saved'; it.rec = { id: rec.id, date: rec.date || null }; it.draft = null; it.pending = null; S.bulk.cur = null;
    S.view = 'add';
    return true;
  }
  function onDiscard() {
    const it = current();
    if (it) { it.status = 'skipped'; it.draft = null; it.pending = null; S.bulk.cur = null; }
  }
  function reviewBanner() {
    const it = current();
    if (!it) return '';
    const n = items().length, i = items().indexOf(it) + 1, left = count('ready') - 1;
    return '<div class="notice info bulk-banner"><span>' + esc(t('bulk_banner', { i, n, left: Math.max(0, left) })) + '</span></div>';
  }

  const STATUS_CLS = { queued: '', reading: 'amber', ready: 'green', failed: 'red', saved: 'green', skipped: '' };
  function row(it) {
    const label = { queued: 'bulk_queued', reading: 'bulk_busy', ready: 'bulk_ready', failed: 'bulk_failed', saved: 'bulk_saved', skipped: 'bulk_skipped' }[it.status];
    let acts = '';
    if (it.status === 'ready') acts = '<button type="button" class="btn small secondary" data-bulk="review" data-id="' + it.id + '">' + esc(t('bulk_review')) + '</button><button type="button" class="btn small link" data-bulk="skip" data-id="' + it.id + '">' + esc(t('bulk_skip')) + '</button>';
    else if (it.status === 'failed') acts = '<button type="button" class="btn small secondary" data-bulk="retry" data-id="' + it.id + '"' + (it.err === t('err_type') || it.err === t('err_size') ? ' hidden' : '') + '>' + esc(t('bulk_retry')) + '</button><button type="button" class="btn small link" data-bulk="skip" data-id="' + it.id + '">' + esc(t('bulk_skip')) + '</button>';
    return '<li data-status="' + it.status + '"><span class="l"><strong class="bq-name">' + esc(it.name) + '</strong>' +
      (it.status === 'failed' && it.err ? '<br><span class="small" style="color:var(--crit)">' + esc(it.err) + '</span>' : '') +
      (it.status === 'saved' && it.rec && it.rec.date ? '<br><span class="muted small">' + esc(fmtDate(it.rec.date)) + '</span>' : '') + '</span>' +
      '<span class="r bq-r"><span class="tag ' + STATUS_CLS[it.status] + '">' + esc(t(label)) + '</span>' + acts + '</span></li>';
  }
  function summary() {
    const saved = items().filter(i => i.status === 'saved'), failed = count('failed');
    if (!saved.length) return '<p class="muted">' + esc(t('bulk_none_saved')) + '</p>';
    const ds = saved.map(i => i.rec.date).filter(Boolean).sort();
    return '<div class="notice info" role="status"><strong>' + esc(ds.length ? t('bulk_done_dates', { n: saved.length, a: fmtDate(ds[0]), b: fmtDate(ds[ds.length - 1]) }) : t('bulk_done', { n: saved.length })) + '</strong><br>' + esc(t('bulk_go_note')) +
      (failed ? '<br>' + esc(t('bulk_done_failed', { n: failed })) : '') + '</div>';
  }
  function queueHTML() {
    const B = S.bulk, n = B.items.length, pend = count('queued') + count('reading'), ready = count('ready');
    const done = n - pend - ready - count('failed');  // saved or skipped
    const allDone = !pend && !ready;
    const readN = n - pend - count('failed');
    const status = pend ? '<p class="small" role="status"><strong>' + esc(t('bulk_reading', { x: Math.min(n, n - pend + 1), n })) + '</strong></p>' : (ready ? '<p class="small" role="status"><strong>' + esc(t('bulk_all_read', { n: readN })) + '</strong></p>' : '');
    return '<div class="card" id="bulkQ"><div class="row between"><h2>' + esc(t('bulk_title')) + ' (' + n + ')</h2>' +
      '<div class="row"><button type="button" class="btn small secondary" data-bulk="more"' + '>' + esc(t('bulk_more')) + '</button><button type="button" class="btn small link" data-bulk="clear">' + esc(t('bulk_clear')) + '</button></div></div>' +
      status + '<ul class="list bq">' + B.items.map(row).join('') + '</ul>' +
      (ready ? '<div class="row" style="margin-top:12px"><button type="button" class="btn" data-bulk="next">' + esc(t('bulk_next', { n: ready })) + '</button></div>' : '') +
      (allDone && done >= 0 ? '<div style="margin-top:14px">' + summary() + '<div class="row" style="margin-top:12px"><button type="button" class="btn" data-bulk="go">' + esc(t('bulk_go')) + '</button></div></div>' : '') + '</div>';
  }

  document.addEventListener('click', e => {
    const el = e.target && e.target.closest ? e.target.closest('[data-bulk]') : null;
    if (!el || !S.bulk) return;
    const a = el.getAttribute('data-bulk'), id = el.getAttribute('data-id'), it = id ? items().find(i => i.id === id) : null;
    if (a === 'next') review();
    else if (a === 'review') review(id);
    else if (a === 'retry' && it) { it.status = 'queued'; it.err = null; render(); run(); }
    else if (a === 'skip' && it) { it.status = 'skipped'; it.draft = null; it.pending = null; render(); }
    else if (a === 'more') { S.chatUpload = false; const f = document.getElementById('fileInput'); if (f) f.click(); }
    else if (a === 'clear') { if (!count('ready') || confirm(t('bulk_confirm_clear'))) { S.bulk = null; render(); } }
    else if (a === 'go') { S.bulk = null; go('health'); }
  });
  /* a queue belongs to the profile it was started in */
  document.addEventListener('sehat:profile', () => { S.bulk = null; });

  return { add, queueHTML, reviewBanner, afterSave, onDiscard };
})();
window.SehatBulk = SehatBulk;
