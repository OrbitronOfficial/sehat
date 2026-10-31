// Sehat data layer: agent catalogue, demo seed, and a shared store.
// The store lives in localStorage and syncs across tabs with BroadcastChannel,
// so a doctor tab and a pharmacy tab see the same prescription move in real time.

const ROLES = {
  hospital: { label: 'Hospital', ic: '🏥', org: 'City Care Hospital', sub: 'Sector 69, Mohali' },
  doctor:   { label: 'Doctor',   ic: '🩺', org: 'Dr. R. K. Bansal',   sub: 'General Physician · City Care' },
  pharmacy: { label: 'Pharmacy', ic: '💊', org: 'Jain Medicos',       sub: 'Sector 70, Mohali · 1.2 km' },
  nurse:    { label: 'Nurse',    ic: '🧑‍⚕️', org: 'Sr. Anita Thomas',  sub: 'Ward B · City Care' },
  patient:  { label: 'Patient',  ic: '🙂', org: 'Rahul Mehra',        sub: '34 y · Mohali' },
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
    tabs: [['tasks', 'To-do'], ['vitals', 'Record vitals'], ['taskhistory', 'History']] },
  { id: 'sehat_hospital', ic: '🏥', name: 'Sehat Hospital', for: ['hospital'], price: '₹4,999/mo',
    desc: 'Run the whole hospital: live command centre, beds, appointments, ER triage, ward tasks and hospital inventory.',
    tabs: [['command', 'Command centre'], ['beds', 'Beds'], ['appointments', 'Appointments'], ['triage', 'ER triage'], ['tasks', 'Ward tasks'], ['supply', 'Inventory']] },
  { id: 'sehat_pharmacy', ic: '💊', name: 'Sehat Pharmacy', for: ['pharmacy'], price: '₹1,499/mo',
    desc: 'Run the pharmacy: prescriptions straight from hospitals, doctor chat and calls, supply chain with auto POs, and delivery.',
    tabs: [['rxinbox', 'Prescriptions'], ['connect', 'Doctor connect'], ['supply', 'Supply chain'], ['delivery', 'Delivery']] },
];

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
  hospital: ['sehat_hospital'],
  doctor: ['sehat_doctor'],
  nurse: ['sehat_nurse'],
  pharmacy: ['sehat_pharmacy'],
  patient: ['sehat_copilot'],
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

const Store = (() => {
  const KEY = 'sehat_db_v2';
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
