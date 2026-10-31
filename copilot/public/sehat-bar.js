// Sehat network bridge for the patient, doctor and nurse workspaces.
// - A bar linking to the rest of the Sehat network.
// - SehatNet.routeRx(record): a prescription the doctor approves is routed to the nearest pharmacy
//   with stock, in the same shared store the pharmacy and hospital screens use (same origin).
// - On the patient workspace, a live tracker shows the order moving from pharmacy to door.
(function () {
  const KEY = 'sehat_db_v2';
  const role = location.pathname.includes('doctor') ? 'doctor' : location.pathname.includes('staff') ? 'nurse' : 'patient';
  const name = { patient: 'Sehat Copilot', doctor: 'Sehat Doctor', nurse: 'Sehat Nurse' }[role];
  const ch = 'BroadcastChannel' in window ? new BroadcastChannel('sehat') : null;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  async function load() {
    try { const d = JSON.parse(localStorage.getItem(KEY)); if (d) return d; } catch {}
    // First visit: build the demo store from the hub's own seed, in its own scope.
    const src = await (await fetch('/hub/data.js')).text();
    return new Function(src + '\nreturn { db: seed(), PHARMACIES };')().db;
  }
  const save = d => { localStorage.setItem(KEY, JSON.stringify(d)); ch && ch.postMessage('sync'); };
  const PHARMACIES = [{ name: 'Jain Medicos', km: 1.2 }, { name: 'Apollo Pharmacy Ph-7', km: 2.8 }];

  // Match a spoken/typed medicine to a stocked item by its first word (e.g. "Paracetamol 650 mg").
  const matchStock = (stock, med) => { const w = (med.name || '').toLowerCase().split(/\s+/)[0]; return Object.keys(stock).find(k => k.toLowerCase().startsWith(w)); };

  window.SehatNet = {
    async routeRx(record) {
      try {
        const d = await load(), p = record.patient || {};
        const meds = (record.medicines || []).map(m => {
          const k = matchStock(d.stock, m);
          return { name: k || [m.name, m.strength].filter(Boolean).join(' '), dose: [m.dose, m.duration || m.instructions].filter(Boolean).join(' · ') || 'as directed', qty: 10 };
        });
        const ok = meds.every(m => (d.stock[m.name] && d.stock[m.name].qty) >= m.qty), ph = ok ? PHARMACIES[0] : PHARMACIES[1];
        const rx = { id: 'RX' + Math.random().toString(36).slice(2, 6).toUpperCase(), patient: p.name || 'Patient', doctor: 'Dr. R. K. Bansal',
          dx: (record.diagnoses || []).map(x => x.name).join(', ') || 'Consultation', meds, pharmacy: ph.name, km: ph.km, status: 'sent', t: Date.now(), rider: null };
        d.prescriptions.unshift(rx);
        d.journal.unshift({ date: new Date().toISOString().slice(0, 10), type: 'Prescription', text: `${rx.dx}: ${meds.map(m => m.name).join(', ')} (${rx.doctor})` });
        d.activity.unshift({ t: Date.now(), who: 'Sehat Doctor', text: `approved ${rx.id} for ${rx.patient} → routed to ${ph.name} (${ph.km} km)` });
        save(d);
        return rx;
      } catch (e) { console.warn('Sehat routing skipped:', e); return null; }
    },
  };

  // ---------- bar ----------
  const bar = document.createElement('div');
  bar.setAttribute('role', 'navigation');
  bar.style.cssText = 'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9999;display:flex;gap:6px;align-items:center;' +
    'background:#0F172Aee;color:#fff;padding:6px 8px 6px 14px;border-radius:9999px;font:600 13px "Plus Jakarta Sans",system-ui,sans-serif;box-shadow:0 12px 30px -10px #0774c480';
  const btn = (t, f) => { const x = document.createElement('button'); x.textContent = t; x.onclick = f;
    x.style.cssText = 'border:0;border-radius:9999px;padding:7px 12px;background:#ffffff1a;color:#fff;font:inherit;cursor:pointer'; return x; };
  const hub = view => () => { try { sessionStorage.setItem('sehat_role', role); sessionStorage.setItem('sehat_view', view); } catch {} location.href = '/hub/app.html'; };
  const label = document.createElement('span'); label.textContent = '● ' + name; label.style.marginRight = '6px';
  bar.append(label, btn('Sehat network', hub('dashboard')), btn('Agent marketplace', hub('market')),
    btn('Log out', () => { try { sessionStorage.removeItem('sehat_role'); } catch {} location.href = '/hub/login.html'; }));
  document.body.appendChild(bar);

  // ---------- patient: live medicine tracker ----------
  if (role !== 'patient') return;
  const STEPS = [['sent', 'Sent to pharmacy'], ['accepted', 'Accepted'], ['ready', 'Packed'], ['out for delivery', 'On the way'], ['delivered', 'Delivered']];
  const card = document.createElement('div');
  card.style.cssText = 'position:fixed;right:16px;bottom:76px;z-index:9998;width:min(340px,calc(100vw - 32px));background:#fff;color:#0F172A;border:1px solid #E2E8F0;border-radius:18px;' +
    'padding:14px 16px;font:13px/1.5 "Plus Jakarta Sans",system-ui,sans-serif;box-shadow:0 20px 40px -12px rgba(7,116,196,.25);display:none';
  document.body.appendChild(card);
  async function draw() {
    let d; try { d = JSON.parse(localStorage.getItem(KEY)); } catch {}
    const fam = d ? d.family.map(f => f.name.toLowerCase()) : [];
    const rx = d && d.prescriptions.find(p => fam.some(f => f.split(' ')[0] === (p.patient || '').toLowerCase().split(' ')[0]) && Date.now() - p.t < 864e5);
    if (!rx) { card.style.display = 'none'; return; }
    const i = Math.max(0, STEPS.findIndex(s => s[0] === (rx.status === 'query' ? 'sent' : rx.status)));
    card.style.display = '';
    card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:14px">💊 Your medicines</b><span style="color:#0774C4;font-weight:600">${esc(STEPS[i][1])}</span></div>
      <div style="color:#64748B;margin:2px 0 8px">${esc(rx.patient)} · ${esc(rx.pharmacy)} (${rx.km} km)</div>
      <div style="display:flex;gap:4px">${STEPS.map((s, j) => `<span style="flex:1;height:6px;border-radius:9px;background:${j <= i ? '#0774C4' : '#E2E8F0'}"></span>`).join('')}</div>
      ${rx.status === 'query' ? '<div style="margin-top:8px;color:#D97706">Pharmacist is confirming something with your doctor.</div>' : ''}
      ${rx.rider && rx.status === 'out for delivery' ? `<div style="margin-top:8px">🛵 ${esc(rx.rider)} · arriving in ~${Math.max(1, Math.round((rx.eta - Date.now()) / 60000))} min</div>` : ''}
      <div style="margin-top:8px;color:#64748B">${rx.meds.map(m => esc(m.name)).join(' · ')}</div>`;
  }
  draw();
  ch && (ch.onmessage = draw);
  addEventListener('storage', e => { if (e.key === KEY) draw(); });
  setInterval(draw, 15000);
})();
