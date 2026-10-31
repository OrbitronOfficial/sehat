/* Sehat Copilot: collects prescriptions a doctor approved on the doctor page (beta, local only)
   and files each one under the family member it was written for. */
(function () {
  'use strict';
  async function pull() {
    if (!window.SehatFamily || typeof dbPut !== 'function') return;
    const people = SehatFamily.list();
    const names = people.map(p => p.name).filter(Boolean);
    if (!names.length) return;
    let j;
    try {
      const r = await fetch('/api/inbox', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ names }) });
      j = await r.json();
    } catch (e) { return; }
    const recs = (j && j.records) || [];
    if (!recs.length) return;
    for (const rec of recs) {
      const to = String((rec.patient || {}).name || '').trim().toLowerCase();
      const who = people.find(p => String(p.name || '').trim().toLowerCase() === to);
      rec.profile = who ? who.id : 'self';
      await dbPut('records', rec);
      if (window.SehatRem && rec.profile === SehatFamily.active()) { try { SehatRem.onSaved(rec); } catch (e) { /* reminders are optional */ } }
    }
    alert(recs.length === 1 ? 'Your doctor sent a new prescription. It is now in your records.' : recs.length + ' new prescriptions from your doctor are now in your records.');
    location.reload();
  }
  window.addEventListener('load', () => setTimeout(pull, 1500));
})();
