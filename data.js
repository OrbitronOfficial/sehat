// Sehat data layer: agent catalogue, demo seed, and a shared store.
// The store lives in localStorage and syncs across tabs with BroadcastChannel,
// so a doctor tab and a pharmacy tab see the same prescription move in real time.

const ROLES = {
  hospital: { label: 'Hospital', ic: '🏥', org: 'City Care Hospital', sub: 'Sector 69, Mohali' },
  doctor:   { label: 'Doctor',   ic: '🩺', org: 'Dr. R. K. Bansal',   sub: 'General Physician · City Care' },
  pharmacy: { label: 'Pharmacy', ic: '💊', org: 'Jain Medicos',       sub: 'Sector 70, Mohali · 1.2 km' },
  nurse:    { label: 'Nurse',    ic: '🧑‍⚕️', org: 'Sr. Anita Thomas',  sub: 'Ward B · City Care' },
  patient:  { label: 'Patient',  ic: '🙂', org: 'Rahul Mehra',        sub: '34 y · Mohali' },
  supplier: { label: 'Supplier', ic: '🚚', org: 'Punjab Pharma Distributors', sub: 'Distributor · Industrial Area Ph-8, Mohali' },
};

// Sehat suites: one install gives a role its whole toolkit. `tabs` are feature views.
const SUITES = [
  { id: 'sehat_copilot', ic: '💚', name: 'Sehat Copilot', for: ['patient'], price: 'Free',
    desc: 'Your personal health copilot: read reports from a photo, explain them in your language, family profiles, medicine reminders, journal and order tracking.',
    tabs: [['records', 'Records & OCR'], ['family', 'Family'], ['reminders', 'Reminders'], ['journal', 'Journal'], ['orders', 'Medicines'], ['appointments', 'Book'], ['sos', 'Emergency']] },
  { id: 'sehat_doctor', ic: '🩺', name: 'Sehat Doctor', for: ['doctor'], price: '₹999/mo',
    desc: 'Clinic workspace: patients sorted by urgency, consultation notes that create the prescription and nurse tasks, history, labs and pharmacy chat.',
    tabs: [['consult', 'Consult queue'], ['rxwriter', 'Prescriptions'], ['history', 'Patient history'], ['labs', 'Labs'], ['connect', 'Pharmacy chat']] },
  { id: 'sehat_nurse', ic: '🧑‍⚕️', name: 'Sehat Nurse', for: ['nurse', 'hospital'], price: '₹499/mo',
    desc: 'Ward to-do list fed by doctors\' orders, vitals entry that lands in the patient record, and task history by date.',
    tabs: [['tasks', 'To-do'], ['mar', 'Medicine round'], ['vitals', 'Record vitals'], ['handover', 'Shift handover'], ['taskhistory', 'History']] },
  { id: 'sehat_hospital', ic: '🏥', name: 'Sehat Hospital', for: ['hospital'], price: '₹4,999/mo',
    desc: 'Run the whole hospital: live command centre, beds, appointments, ward tasks, duty roster and hospital inventory.',
    tabs: [['command', 'Command centre'], ['beds', 'Beds'], ['appointments', 'Appointments'], ['tasks', 'Ward tasks'], ['doctors', 'Doctors'], ['roster', 'Duty roster'], ['supply', 'Inventory']] },
  { id: 'sehat_pharmacy', ic: '💊', name: 'Sehat Pharmacy', for: ['pharmacy'], price: '₹1,499/mo',
    desc: 'Run the pharmacy: prescriptions straight from hospitals, doctor chat and calls, supply chain with auto POs, and delivery.',
    tabs: [['rxinbox', 'Prescriptions'], ['connect', 'Doctor connect'], ['supply', 'Supply chain'], ['expiry', 'Expiry'], ['refills', 'Refills due'], ['delivery', 'Delivery']] },
  { id: 'sehat_supply', ic: '🚚', name: 'Sehat Supply', for: ['supplier'], price: '₹2,499/mo',
    desc: 'For distributors: purchase orders from pharmacies and hospitals arrive live with urgency, you accept, dispatch and deliver, and their stock updates itself.',
    tabs: [['poinbox', 'PO inbox'], ['supdash', 'Dashboard'], ['fleet', 'Dispatch'], ['catalogue', 'Warehouse']] },
];

// Every agent a role can install. `for` = roles that can use it.
const AGENTS = [
  { id: 'appointments', ic: '📅', name: 'Appointment Desk', for: ['hospital', 'patient'], cat: 'Front desk', price: 'Free',
    desc: 'Patients book from symptoms; the agent picks the right specialist and the earliest slot. Hospitals see the live queue.' },
  { id: 'rxwriter', ic: '📝', name: 'e-Prescription Writer', for: ['doctor'], cat: 'Clinical', price: 'Free',
    desc: 'Write a prescription in seconds. On signing, it is routed to the nearest pharmacy that has every medicine in stock.' },
  { id: 'connect', ic: '📞', name: 'Doctor ↔ Pharmacy Connect', for: ['doctor', 'pharmacy'], cat: 'Communication', price: 'Free',
    desc: 'Pharmacist clarifies a prescription with the doctor by chat or one-tap call, linked to the exact prescription.' },
  { id: 'rxinbox', ic: '📥', name: 'Prescription Inbox', for: ['pharmacy'], cat: 'Fulfilment', price: '₹299/mo',
    desc: 'Prescriptions from hospitals land here with a stock check. Accept, pack, mark ready, hand to delivery.' },
  { id: 'supply', ic: '📦', name: 'Supply Chain AI', for: ['pharmacy', 'hospital'], cat: 'Inventory', price: '₹799/mo',
    desc: 'Tracks stock, predicts run-outs from daily usage, and drafts purchase orders to the right distributor.' },
  { id: 'delivery', ic: '🛵', name: 'Delivery Dispatch', for: ['pharmacy'], cat: 'Fulfilment', price: '₹199/mo',
    desc: 'Assigns a rider to ready orders, shares ETA with the patient, and closes the order on delivery.' },
  { id: 'journal', ic: '📔', name: 'Health Journal', for: ['patient'], cat: 'Records', price: 'Free',
    desc: 'Every visit, prescription and reading in one timeline. Readings are checked against normal ranges.' },
  { id: 'labs', ic: '🧪', name: 'Lab Report Explainer', for: ['patient', 'doctor'], cat: 'Records', price: 'Free',
    desc: 'Paste a lab report; each value is flagged low / normal / high / critical in plain English or Hindi.' },
  { id: 'orders', ic: '🧾', name: 'My Medicines', for: ['patient'], cat: 'Fulfilment', price: 'Free',
    desc: 'Track your prescription from doctor to pharmacy to your door, step by step.' },
  { id: 'sos', ic: '🆘', name: 'Emergency Check', for: ['patient', 'hospital'], cat: 'Emergency', price: 'Free',
    desc: 'Describe what is happening in any language. Danger signs trigger 112 / 108 guidance instantly.' },
];

// Defaults when a role first logs in. A hospital that only wants appointments can remove the rest.
const DEFAULT_INSTALLS = {
  hospital: ['sehat_hospital'],
  doctor: ['sehat_doctor'],
  nurse: ['sehat_nurse'],
  pharmacy: ['sehat_pharmacy'],
  patient: ['sehat_copilot'],
  supplier: ['sehat_supply'],
};

const DOCTORS = [
  { name: 'Dr. R. K. Bansal', spec: 'General Physician', tags: /fever|cold|cough|weak|tired|body|general|bp|sugar|diabet/ },
  { name: 'Dr. Meera Kaur', spec: 'Cardiologist', tags: /chest|heart|palpitation|breath/ },
  { name: 'Dr. Arjun Sethi', spec: 'Orthopaedic', tags: /bone|joint|knee|back|fracture|sprain/ },
  { name: 'Dr. Nisha Gupta', spec: 'Paediatrician', tags: /child|baby|kid|infant/ },
  { name: 'Dr. Kavya Rao', spec: 'Dermatologist', tags: /skin|rash|itch|acne|hair/ },
];

// Distributors and how far each customer is from them (km), for the supplier's PO inbox.
const SUPPLIERS = {
  'Punjab Pharma Distributors': { onSehat: true, km: { 'Jain Medicos': 6.4, 'City Care Hospital': 5.1, 'Apollo Pharmacy Ph-7': 3.9 } },
  'MedLine Wholesale': { onSehat: false, km: {} },
  'Tricity Healthcare': { onSehat: false, km: {} },
};
const VEHICLES = ['PB65 AK 2231 · Tata Ace', 'PB65 BX 0912 · Bolero Pickup', 'Bike courier · Harjit'];

// Doctors are matched to a problem by speciality; the registry below says which hospital each one works at.
const SPEC_TAGS = {
  'General Physician': /fever|cold|cough|weak|tired|body|general|bp|sugar|diabet|headache|vomit|stomach/,
  'Cardiologist': /chest|heart|palpitation|breath/,
  'Orthopaedic': /bone|joint|knee|back|fracture|sprain/,
  'Paediatrician': /child|baby|kid|infant/,
  'Dermatologist': /skin|rash|itch|acne|hair/,
};
const SPECS = Object.keys(SPEC_TAGS);
const specFor = t => SPECS.find(s => SPEC_TAGS[s].test(String(t || '').toLowerCase())) || 'General Physician';
const allDoctors = d => (d.hospitals || []).flatMap(h => h.doctors.map(x => ({ ...x, hospital: h.name, km: h.km })));
const hospOf = a => a.hospital || 'City Care Hospital';  // bookings made before the registry belong to City Care

const PHARMACIES = [
  { name: 'Jain Medicos', km: 1.2 },
  { name: 'Apollo Pharmacy Ph-7', km: 2.8 },
  { name: 'Wellness Chemist', km: 4.1 },
];

function seed() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    installs: JSON.parse(JSON.stringify(DEFAULT_INSTALLS)),
    appointments: [
      { id: 'A101', patient: 'Rahul Mehra', doctor: 'Dr. R. K. Bansal', spec: 'General Physician', hospital: 'City Care Hospital', date: today, slot: '10:30', reason: 'Fever and body ache for 3 days', status: 'checked-in' },
      { id: 'A102', patient: 'Sunita Mehra', doctor: 'Dr. Meera Kaur', spec: 'Cardiologist', date: today, slot: '11:15', reason: 'BP follow-up', status: 'booked' },
      { id: 'A103', patient: 'Aman Verma', doctor: 'Dr. Arjun Sethi', spec: 'Orthopaedic', date: today, slot: '12:00', reason: 'Knee pain', status: 'booked' },
    ],
    prescriptions: [],
    messages: [],
    stock: {
      'Paracetamol 650mg':   { qty: 420, min: 150, perDay: 38, supplier: 'Punjab Pharma Distributors' },
      'Azithromycin 500mg':  { qty: 36,  min: 40,  perDay: 9,  supplier: 'Punjab Pharma Distributors' },
      'Cetirizine 10mg':     { qty: 210, min: 80,  perDay: 14, supplier: 'MedLine Wholesale' },
      'Metformin 500mg':     { qty: 300, min: 120, perDay: 22, supplier: 'MedLine Wholesale' },
      'Amlodipine 5mg':      { qty: 11,  min: 60,  perDay: 11, supplier: 'Punjab Pharma Distributors' },
      'Pantoprazole 40mg':   { qty: 150, min: 60,  perDay: 12, supplier: 'Tricity Healthcare' },
      'ORS sachet':          { qty: 95,  min: 50,  perDay: 8,  supplier: 'MedLine Wholesale' },
      'Ibuprofen 400mg':     { qty: 0,   min: 60,  perDay: 10, supplier: 'Punjab Pharma Distributors' },
    },
    pos: [],
    // registry: hospitals and pharmacies on the network; new ones register from the login page
    hospitals: [
      { id: 'H1', name: 'City Care Hospital', area: 'Sector 69, Mohali', km: 2.1, doctors: [{ name: 'Dr. R. K. Bansal', spec: 'General Physician' }, { name: 'Dr. Meera Kaur', spec: 'Cardiologist' }, { name: 'Dr. Arjun Sethi', spec: 'Orthopaedic' }] },
      { id: 'H2', name: 'Mohali Multispeciality Hospital', area: 'Phase 8, Mohali', km: 4.6, doctors: [{ name: 'Dr. Vikram Sood', spec: 'General Physician' }, { name: 'Dr. Nisha Gupta', spec: 'Paediatrician' }, { name: 'Dr. Kavya Rao', spec: 'Dermatologist' }] },
      { id: 'H3', name: 'Sunrise Family Clinic', area: 'Sector 70, Mohali', km: 1.4, doctors: [{ name: 'Dr. Pooja Arora', spec: 'General Physician' }, { name: 'Dr. Harjit Gill', spec: 'Cardiologist' }] },
    ],
    pharmacies: [
      { id: 'P1', name: 'Jain Medicos', area: 'Sector 70, Mohali', km: 1.2, hours: '8 am – 11 pm', live: true },
      { id: 'P2', name: 'Apollo Pharmacy Ph-7', area: 'Phase 7, Mohali', km: 2.8, hours: 'Open 24 hours' },
      { id: 'P3', name: 'Wellness Chemist', area: 'Sector 71, Mohali', km: 4.1, hours: '9 am – 10 pm' },
    ],
    prefs: {},  // per patient: preferred hospital and pharmacy
    warehouse: { 'Paracetamol 650mg': 12000, 'Azithromycin 500mg': 2400, 'Amlodipine 5mg': 5200, 'Ibuprofen 400mg': 3100 },
    batches: [
      { med: 'Azithromycin 500mg', batch: 'AZ2291', qty: 24, exp: '2026-11-20' },
      { med: 'ORS sachet', batch: 'OR1180', qty: 40, exp: '2026-12-05' },
      { med: 'Cetirizine 10mg', batch: 'CT0457', qty: 60, exp: '2027-01-30' },
      { med: 'Paracetamol 650mg', batch: 'PC8812', qty: 200, exp: '2027-09-14' },
    ],
    refills: [
      { patient: 'Sunita Mehra', med: 'Amlodipine 5mg', qty: 30, due: 2, phone: '98xxxxxx21' },
      { patient: 'Rahul Mehra', med: 'Metformin 500mg', qty: 60, due: 5, phone: '98xxxxxx07' },
      { patient: 'Harbhajan Singh', med: 'Metformin 500mg', qty: 60, due: 0, phone: '97xxxxxx44' },
    ],
    roster: [
      { name: 'Dr. R. K. Bansal', role: 'General Physician', shift: 'OPD 09–17', on: true },
      { name: 'Dr. Meera Kaur', role: 'Cardiologist', shift: 'OPD 10–16', on: true },
      { name: 'Dr. Arjun Sethi', role: 'Orthopaedic', shift: 'On call', on: false },
      { name: 'Sr. Anita Thomas', role: 'Nurse · Ward B', shift: 'Day 08–20', on: true },
      { name: 'Br. Manpreet Gill', role: 'Nurse · ER', shift: 'Night 20–08', on: false },
    ],
    mar: [
      { patient: 'Sunita Mehra', bed: 'B-12', med: 'Amlodipine 5mg', dose: '1 tab', time: '09:00', given: null },
      { patient: 'Sunita Mehra', bed: 'B-12', med: 'Pantoprazole 40mg', dose: '1 tab before food', time: '08:00', given: null },
      { patient: 'Aman Verma', bed: 'B-07', med: 'Ibuprofen 400mg', dose: '1 tab after food', time: '14:00', given: null },
    ],
    handover: [],
    journal: [
      { date: '2026-08-12', type: 'Lab', text: 'HbA1c 6.1 % (borderline high)' },
      { date: '2026-09-20', type: 'Reading', text: 'BP 128/84 mmHg' },
    ],
    triage: [],
    tasks: [
      { id: 'N1', patient: 'Sunita Mehra', bed: 'B-12', text: 'Check BP every 4 hours', due: '12:00', by: 'Dr. Meera Kaur', done: null },
      { id: 'N2', patient: 'Aman Verma', bed: 'B-07', text: 'Dressing change, left knee', due: '13:30', by: 'Dr. Arjun Sethi', done: null },
    ],
    beds: { General: [40, 31], ICU: [10, 8], Maternity: [12, 6], Paediatric: [14, 9], Emergency: [8, 5] },
    family: [
      { name: 'Rahul Mehra', rel: 'Self', age: 34, cond: 'Borderline diabetes' },
      { name: 'Sunita Mehra', rel: 'Mother', age: 61, cond: 'Hypertension' },
      { name: 'Aanya Mehra', rel: 'Daughter', age: 7, cond: 'Vaccinations due' },
    ],
    reminders: [{ med: 'Metformin 500mg', time: '08:30', who: 'Rahul Mehra', taken: [] }, { med: 'Amlodipine 5mg', time: '21:00', who: 'Sunita Mehra', taken: [] }],
    activity: [{ t: Date.now(), who: 'Sehat', text: 'Workspace created' }],
  };
}

// Cloud network: every device in the same room shares one live store through Supabase (Postgres +
// realtime). The anon key is a public, browser-safe key; access is limited by row-level security.
// Offline or without a key, everything keeps working on this device exactly as before.
const CLOUD = { url: 'https://twksjeogwwhvxjnndbbo.supabase.co', key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3a3NqZW9nd3dodnhqbm5kYmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM0NjA0MjMsImV4cCI6MjEwOTAzNjQyM30.So_-VtnM68317k4GJnsBxKM1UOy7ErnHaz7rXsmkOAc' };
const ROOM = (() => {
  let r = null;
  try { r = new URLSearchParams(location.search).get('room'); if (r) localStorage.setItem('sehat_room', r); r = r || localStorage.getItem('sehat_room'); } catch {}
  return String(r || 'GRAVITON').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 40) || 'GRAVITON';
})();

const Store = (() => {
  const KEY = 'sehat_db_v2';
  const ch = 'BroadcastChannel' in window ? new BroadcastChannel('sehat') : null;
  let db;
  try { db = JSON.parse(localStorage.getItem(KEY)) || seed(); } catch { db = seed(); }
  // Older saved demos lack newer collections (supplier, roster…): fill them in without wiping data.
  const fill = d => {
    const base = seed();
    Object.keys(base).forEach(k => { if (!(k in d)) d[k] = base[k]; });
    Object.keys(DEFAULT_INSTALLS).forEach(r => { d.installs[r] = d.installs[r] || [...DEFAULT_INSTALLS[r]]; });
    return d;
  };
  fill(db);
  const listeners = [];
  const cloud = { id: Math.random().toString(36).slice(2), sb: null, status: CLOUD.key ? 'connecting' : 'off', t: 0 };
  const cloudEvent = () => { try { dispatchEvent(new CustomEvent('sehat-cloud', { detail: { status: cloud.status, room: ROOM } })); } catch {} };
  const push = () => {
    if (!cloud.sb) return;
    clearTimeout(cloud.t);
    cloud.t = setTimeout(() => cloud.sb.from('networks').upsert({ room: ROOM, data: db, updated_by: cloud.id, updated_at: new Date().toISOString() })
      .then(r => { if (r.error) { cloud.status = 'error'; cloudEvent(); } }), 250);
  };
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {}
    ch && ch.postMessage('sync');
    push();
  };
  const reload = () => { try { db = JSON.parse(localStorage.getItem(KEY)) || db; } catch {} listeners.forEach(f => f()); };
  ch && (ch.onmessage = reload);
  addEventListener('storage', e => e.key === KEY && reload());
  // a change made on another device: take it, share it with this device's other tabs, redraw
  const remote = data => {
    db = fill(data);
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {}
    ch && ch.postMessage('sync');
    listeners.forEach(f => f());
  };
  if (CLOUD.key) {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js';
    s.onload = async () => {
      try {
        cloud.sb = window.supabase.createClient(CLOUD.url, CLOUD.key);
        const { data, error } = await cloud.sb.from('networks').select('data').eq('room', ROOM).maybeSingle();
        if (error) throw error;
        if (data && data.data) remote(data.data); else push();  // first device in this room seeds it
        cloud.sb.channel('room-' + ROOM)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'networks', filter: 'room=eq.' + ROOM }, p => {
            if (p.new && p.new.data && p.new.updated_by !== cloud.id) remote(p.new.data);
          })
          .subscribe(st => { cloud.status = st === 'SUBSCRIBED' ? 'live' : st === 'CHANNEL_ERROR' || st === 'TIMED_OUT' ? 'error' : cloud.status; cloudEvent(); });
      } catch (e) { cloud.status = 'error'; cloudEvent(); }
    };
    s.onerror = () => { cloud.status = 'error'; cloudEvent(); };
    document.head.appendChild(s);
  }
  return {
    get db() { return db; },
    get cloud() { return { status: cloud.status, room: ROOM }; },
    update(fn, who, text) {
      fn(db);
      if (text) db.activity.unshift({ t: Date.now(), who, text });
      db.activity = db.activity.slice(0, 60);
      save(); listeners.forEach(f => f());
    },
    onChange(f) { listeners.push(f); },
    reset() { db = seed(); save(); listeners.forEach(f => f()); },
  };
})();
