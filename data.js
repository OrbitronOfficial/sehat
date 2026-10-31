// Sehat data layer: agent catalogue, demo seed, and a shared store.
// The store lives in localStorage and syncs across tabs with BroadcastChannel,
// so a doctor tab and a pharmacy tab see the same prescription move in real time.

const ROLES = {
  hospital: { label: 'Hospital', ic: '🏥', org: 'City Care Hospital', sub: 'Sector 69, Mohali' },
  doctor:   { label: 'Doctor',   ic: '🩺', org: 'Dr. R. K. Bansal',   sub: 'General Physician · City Care' },
  pharmacy: { label: 'Pharmacy', ic: '💊', org: 'Jain Medicos',       sub: 'Sector 70, Mohali · 1.2 km' },
  patient:  { label: 'Patient',  ic: '🙂', org: 'Rahul Mehra',        sub: '34 y · Mohali' },
};

// Every agent a role can install. `for` = roles that can use it.
const AGENTS = [
  { id: 'appointments', ic: '📅', name: 'Appointment Desk', for: ['hospital', 'patient'], cat: 'Front desk', price: 'Free',
    desc: 'Patients book from symptoms; the agent picks the right specialist and the earliest slot. Hospitals see the live queue.' },
  { id: 'triage', ic: '🚑', name: 'ER Triage', for: ['hospital'], cat: 'Emergency', price: '₹499/mo',
    desc: 'Scores walk-ins red / yellow / green from symptoms and vitals and orders the ER queue.' },
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
  hospital: ['appointments', 'triage', 'supply'],
  doctor: ['rxwriter', 'connect', 'labs'],
  pharmacy: ['rxinbox', 'supply', 'connect', 'delivery'],
  patient: ['appointments', 'orders', 'journal', 'labs', 'sos'],
};

const DOCTORS = [
  { name: 'Dr. R. K. Bansal', spec: 'General Physician', tags: /fever|cold|cough|weak|tired|body|general|bp|sugar|diabet/ },
  { name: 'Dr. Meera Kaur', spec: 'Cardiologist', tags: /chest|heart|palpitation|breath/ },
  { name: 'Dr. Arjun Sethi', spec: 'Orthopaedic', tags: /bone|joint|knee|back|fracture|sprain/ },
  { name: 'Dr. Nisha Gupta', spec: 'Paediatrician', tags: /child|baby|kid|infant/ },
  { name: 'Dr. Kavya Rao', spec: 'Dermatologist', tags: /skin|rash|itch|acne|hair/ },
];

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
      { id: 'A101', patient: 'Rahul Mehra', doctor: 'Dr. R. K. Bansal', spec: 'General Physician', date: today, slot: '10:30', reason: 'Fever and body ache for 3 days', status: 'checked-in' },
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
      'Amlodipine 5mg':      { qty: 18,  min: 60,  perDay: 11, supplier: 'Tricity Healthcare' },
      'Pantoprazole 40mg':   { qty: 150, min: 60,  perDay: 12, supplier: 'Tricity Healthcare' },
      'ORS sachet':          { qty: 95,  min: 50,  perDay: 8,  supplier: 'MedLine Wholesale' },
      'Ibuprofen 400mg':     { qty: 0,   min: 60,  perDay: 10, supplier: 'Punjab Pharma Distributors' },
    },
    pos: [],
    journal: [
      { date: '2026-08-12', type: 'Lab', text: 'HbA1c 6.1 % (borderline high)' },
      { date: '2026-09-20', type: 'Reading', text: 'BP 128/84 mmHg' },
    ],
    triage: [],
    activity: [{ t: Date.now(), who: 'Sehat', text: 'Workspace created' }],
  };
}

const Store = (() => {
  const KEY = 'sehat_db_v1';
  const ch = 'BroadcastChannel' in window ? new BroadcastChannel('sehat') : null;
  let db;
  try { db = JSON.parse(localStorage.getItem(KEY)) || seed(); } catch { db = seed(); }
  const listeners = [];
  const save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {}
    ch && ch.postMessage('sync');
  };
  const reload = () => { try { db = JSON.parse(localStorage.getItem(KEY)) || db; } catch {} listeners.forEach(f => f()); };
  ch && (ch.onmessage = reload);
  addEventListener('storage', e => e.key === KEY && reload());
  return {
    get db() { return db; },
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
