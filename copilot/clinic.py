"""Local v3 clinic: explicit approval, account-bound records, durable appointments.

This is a localhost demonstration, not a verified clinician identity service.
SQLite persists data outside public/. Never expose doctor_demo on a public host.
"""
import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import time
from datetime import date, datetime, timezone, timedelta

DB_PATH = os.path.join(os.path.dirname(__file__), 'data', 'clinic-v3.sqlite3')
COOKIE = 'sehat_v3_clinic'
PRIORITIES = ('unassigned', 'major', 'moderate', 'minor')


class ClinicError(ValueError):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


class Connection(sqlite3.Connection):
    def __exit__(self, *args):
        try:
            return super().__exit__(*args)
        finally:
            self.close()


def connect():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    db = sqlite3.connect(DB_PATH, timeout=10, factory=Connection)
    db.row_factory = sqlite3.Row
    db.execute('PRAGMA foreign_keys=ON')
    db.executescript('''
      CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE,
        phone TEXT UNIQUE, age TEXT, sex TEXT, claim_hash TEXT,
        password_hash TEXT, salt TEXT, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions (
        token_hash TEXT PRIMARY KEY, role TEXT NOT NULL, patient_id TEXT,
        expires REAL NOT NULL);
      CREATE TABLE IF NOT EXISTS consultations (
        id TEXT PRIMARY KEY, patient_id TEXT NOT NULL REFERENCES patients(id),
        transcript TEXT NOT NULL, audio_data TEXT, record TEXT NOT NULL,
        status TEXT NOT NULL, created_at TEXT NOT NULL, approved_at TEXT);
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY, patient_id TEXT NOT NULL REFERENCES patients(id),
        date TEXT NOT NULL, time TEXT NOT NULL, reason TEXT, priority TEXT NOT NULL,
        status TEXT NOT NULL, consultation_id TEXT UNIQUE REFERENCES consultations(id));
      CREATE TABLE IF NOT EXISTS checkins (
        id TEXT PRIMARY KEY, patient_id TEXT NOT NULL REFERENCES patients(id),
        consultation_id TEXT NOT NULL REFERENCES consultations(id),
        note TEXT NOT NULL, created_at TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS attempts (key TEXT PRIMARY KEY, count INTEGER, started REAL);
    ''')
    return db


def now():
    return datetime.now(timezone.utc).isoformat()


def uid():
    return secrets.token_hex(12)


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def text(value, limit=500):
    return str(value or '').strip()[:limit]


def phone(value):
    value = re.sub(r'[\s()+.-]', '', text(value, 40))
    if value and not re.fullmatch(r'\d{7,15}', value):
        raise ClinicError('Enter a phone number with country code, for example +91 followed by the number.')
    return value or None


def identifier(value):
    value = text(value, 250).lower()
    return value if '@' in value else phone(value)


def public_patient(row):
    return {key: row[key] for key in ('id', 'name', 'email', 'phone', 'age', 'sex')}


def session(db, token):
    row = db.execute('SELECT * FROM sessions WHERE token_hash=? AND expires>?',
                     (digest(token or ''), time.time())).fetchone()
    if not row:
        raise ClinicError('Please sign in to continue.', 401)
    return dict(row)


def doctor(user):
    if user['role'] != 'doctor':
        raise ClinicError('This action is available to the doctor only.', 403)


def new_session(db, role, pid=None):
    token = secrets.token_urlsafe(32)
    db.execute('DELETE FROM sessions WHERE expires < ?', (time.time(),))
    db.execute('INSERT INTO sessions VALUES (?,?,?,?)',
               (digest(token), role, pid, time.time() + 8 * 3600))
    return token


def authenticate(token, role=None):
    with connect() as db:
        user = session(db, token)
        if role == 'doctor':
            doctor(user)
        return user


def checked_date(value):
    try:
        return date.fromisoformat(text(value)).isoformat()
    except ValueError:
        raise ClinicError('Choose a valid date.')


def checked_time(value):
    value = text(value) or '09:00'
    if not re.fullmatch(r'([01]\d|2[0-3]):[0-5]\d', value):
        raise ClinicError('Choose a valid appointment time.')
    return value


def checked_record(value, patient):
    if not isinstance(value, dict):
        raise ClinicError('Review a prescription before saving.')
    # Explicit fields prevent a model or client from choosing approval/ownership metadata.
    record = {k: value.get(k) for k in ('medicines', 'diagnoses', 'advice', 'follow_up', 'tests', 'notes') if k in value}
    for field in ('medicines', 'diagnoses', 'tests'):
        if field in record and not isinstance(record[field], list):
            raise ClinicError(field + ' must be a list.')
    for med in record.get('medicines', []):
        if not isinstance(med, dict) or not text(med.get('name')):
            raise ClinicError('Every medicine needs a name. Remove unreadable medicine rows before approval.')
    if len(json.dumps(record)) > 100000:
        raise ClinicError('The prescription is too large.')
    record.update(patient={'name': patient['name'], 'age': patient['age'], 'sex': patient['sex']},
                  date=date.today().isoformat(), doc_type='prescription', source='doctor_consultation')
    return record


def consult_view(row, include_audio=True):
    item = dict(row)
    item['record'] = json.loads(item['record'])
    if not include_audio:
        item.pop('audio_data', None)
        item.pop('transcript', None)
    return item


def seed_demo(db):
    """Idempotent fictional data, available only through explicit local demo actions."""
    today = date.today().isoformat()
    for pid, name, age, sex, at in [('demo-rahul', 'Rahul Mehra · demo', '34', 'M', '09:30'),
                                    ('demo-sunita', 'Sunita Mehra · demo', '58', 'F', '10:00'),
                                    ('demo-aanya', 'Aanya Mehra · demo', '8', 'F', '11:00')]:
        db.execute('INSERT OR IGNORE INTO patients VALUES (?,?,?,?,?,?,?,?,?,?)',
                   (pid, name, pid + '@example.invalid', None, age, sex, None, None, None, now()))
        db.execute('INSERT OR IGNORE INTO appointments VALUES (?,?,?,?,?,?,?,NULL)',
                   (pid + '-' + today, pid, today, at, 'Fictional follow-up · review previous records', 'unassigned', 'scheduled'))
    record = {'id': 'demo-consultation', 'doc_type': 'prescription', 'date': today,
              'patient': {'name': 'Rahul Mehra · demo', 'age': '34', 'sex': 'M'},
              'medicines': [], 'diagnoses': [], 'advice': ['Bring your previous reports and your questions to the next visit.'],
              'follow_up': 'Review after 7 days.', 'doctor': 'Dr. Meera (fictional demo)',
              'notes': 'Synthetic demonstration record. No medicine has been prescribed in this example.', 'approved': True}
    db.execute('INSERT OR IGNORE INTO consultations VALUES (?,?,?,?,?,?,?,?)',
               ('demo-consultation', 'demo-rahul', 'Synthetic conversation. Doctor: Bring your previous reports and questions. Review after 7 days. No medicine prescribed.', None, json.dumps(record), 'approved', now(), now()))
    db.execute('INSERT OR IGNORE INTO appointments VALUES (?,?,?,?,?,?,?,?)',
               ('demo-followup', 'demo-rahul', (date.today()+timedelta(days=7)).isoformat(), '10:30', 'Fictional follow-up', 'unassigned', 'scheduled', 'demo-consultation'))
    db.execute('INSERT OR IGNORE INTO checkins VALUES (?,?,?,?,?)',
               ('demo-question', 'demo-rahul', 'demo-consultation', 'Synthetic update: I have my reports ready. Which records should I bring to my follow-up?', now()))


def handle(body, token='', allow_demo=False):
    """Return (payload, new cookie token or None); empty token clears cookie."""
    action = body.get('action')
    with connect() as db:
        if action == 'patient_demo':
            if not allow_demo:
                raise ClinicError('Patient demo is available only on this local machine.', 403)
            seed_demo(db)
            return {'user': {'role': 'patient', 'name': 'Rahul Mehra · demo', 'patient_id': 'demo-rahul'}}, new_session(db, 'patient', 'demo-rahul')
        if action == 'doctor_demo':
            if not allow_demo:
                raise ClinicError('Doctor demo is only available on this local machine.', 403)
            return {'user': {'role': 'doctor', 'name': 'Dr. Meera · demo'}}, new_session(db, 'doctor')
        if action in ('login', 'claim'):
            ident = identifier(body.get('identifier'))
            key = digest(str(ident))
            attempt = db.execute('SELECT * FROM attempts WHERE key=?', (key,)).fetchone()
            if attempt and attempt['started'] > time.time() - 900 and attempt['count'] >= 10:
                raise ClinicError('Too many attempts. Please wait 15 minutes.', 429)
            if not attempt or attempt['started'] < time.time() - 900:
                db.execute('INSERT OR REPLACE INTO attempts VALUES (?,?,?)', (key, 0, time.time()))
            db.execute('UPDATE attempts SET count=count+1 WHERE key=?', (key,))
            db.commit()  # failed credentials must still count toward the limit
            row = db.execute('SELECT * FROM patients WHERE email=? OR phone=?', (ident, ident)).fetchone()
            password = str(body.get('password') or '')
            if len(password) < 10 or len(password) > 256:
                raise ClinicError('Use a password between 10 and 256 characters.')
            if action == 'claim':
                code = text(body.get('claim_code'))
                if not row or row['password_hash'] or not hmac.compare_digest(row['claim_hash'] or '', digest(code)):
                    raise ClinicError('Check your contact details and the private code from the clinic.', 401)
                salt = secrets.token_hex(16)
                ph = hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(salt), 210000).hex()
                consumed = db.execute('UPDATE patients SET salt=?,password_hash=?,claim_hash=NULL WHERE id=? AND password_hash IS NULL AND claim_hash=?', (salt, ph, row['id'], digest(code)))
                if consumed.rowcount != 1:
                    raise ClinicError('This invitation has already been used. Sign in with your password.', 409)
            elif not row or not row['password_hash'] or not hmac.compare_digest(
                    row['password_hash'], hashlib.pbkdf2_hmac('sha256', password.encode(), bytes.fromhex(row['salt']), 210000).hex()):
                raise ClinicError('The contact details or password do not match.', 401)
            db.execute('DELETE FROM attempts WHERE key=?', (key,))
            return {'user': {'role': 'patient', 'name': row['name'], 'patient_id': row['id']}}, new_session(db, 'patient', row['id'])

        user = session(db, token)
        if action == 'logout':
            db.execute('DELETE FROM sessions WHERE token_hash=?', (digest(token),))
            return {'ok': True}, ''
        if action == 'state':
            if user['role'] == 'doctor':
                return {'user': {'role': 'doctor', 'name': 'Dr. Meera · demo'},
                        'patients': [public_patient(r) for r in db.execute('SELECT * FROM patients ORDER BY name')],
                        'appointments': [dict(r) for r in db.execute('SELECT * FROM appointments ORDER BY date,time')],
                        'consultations': [consult_view(r) for r in db.execute('SELECT * FROM consultations ORDER BY created_at DESC')],
                        'checkins': [dict(r) for r in db.execute('SELECT * FROM checkins ORDER BY created_at DESC')]}, None
            pid = user['patient_id']
            patient = public_patient(db.execute('SELECT * FROM patients WHERE id=?', (pid,)).fetchone())
            return {'user': {'role': 'patient', 'name': patient['name'], 'patient_id': pid}, 'patient': patient,
                    'appointments': [dict(r) for r in db.execute('SELECT * FROM appointments WHERE patient_id=? ORDER BY date,time', (pid,))],
                    'consultations': [consult_view(r, False) for r in db.execute(
                        "SELECT * FROM consultations WHERE patient_id=? AND status='approved' ORDER BY approved_at DESC", (pid,))],
                    'checkins': [dict(r) for r in db.execute('SELECT * FROM checkins WHERE patient_id=? ORDER BY created_at DESC', (pid,))]}, None
        if action == 'checkin':
            if user['role'] != 'patient':
                raise ClinicError('Sign in as the patient to send an update.', 403)
            cid, note = text(body.get('consultation_id')), text(body.get('note'), 4000)
            match = db.execute("SELECT id FROM consultations WHERE id=? AND patient_id=? AND status='approved'", (cid, user['patient_id'])).fetchone()
            if not match or not note:
                raise ClinicError('Choose one of your approved prescriptions and write an update.')
            db.execute('INSERT INTO checkins VALUES (?,?,?,?,?)', (uid(), user['patient_id'], cid, note, now()))
            return {'ok': True}, None

        doctor(user)
        if action == 'seed_demo':
            if not allow_demo:
                raise ClinicError('Demo data is available only on this local machine.', 403)
            seed_demo(db)
            return {'ok': True}, None
        if action == 'add_patient':
            name, email, number = text(body.get('name'), 150), text(body.get('email'), 250).lower() or None, phone(body.get('phone'))
            if not name or not (email or number):
                raise ClinicError('Enter a patient name and an email or phone number.')
            if email and not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email):
                raise ClinicError('Enter a valid email address.')
            pid, code = uid(), secrets.token_urlsafe(12)
            try:
                db.execute('INSERT INTO patients VALUES (?,?,?,?,?,?,?,?,?,?)',
                           (pid, name, email, number, text(body.get('age'), 10), text(body.get('sex'), 30), digest(code), None, None, now()))
            except sqlite3.IntegrityError:
                raise ClinicError('That contact already belongs to a patient. Select their existing chart.')
            return {'patient': public_patient(db.execute('SELECT * FROM patients WHERE id=?', (pid,)).fetchone()), 'claim_code': code}, None
        if action == 'appointment':
            pid = text(body.get('patient_id'))
            if not db.execute('SELECT id FROM patients WHERE id=?', (pid,)).fetchone():
                raise ClinicError('Choose a registered patient.')
            priority = body.get('priority', 'unassigned')
            if priority not in PRIORITIES:
                raise ClinicError('Choose a valid doctor-assigned priority.')
            aid = uid()
            db.execute('INSERT INTO appointments VALUES (?,?,?,?,?,?,?,NULL)',
                       (aid, pid, checked_date(body.get('date')), checked_time(body.get('time')), text(body.get('reason'), 1000), priority, 'scheduled'))
            return {'appointment': dict(db.execute('SELECT * FROM appointments WHERE id=?', (aid,)).fetchone())}, None
        if action == 'update_appointment':
            row = db.execute('SELECT * FROM appointments WHERE id=?', (text(body.get('id')),)).fetchone()
            if not row:
                raise ClinicError('Appointment not found.', 404)
            priority, status = body.get('priority', row['priority']), body.get('status', row['status'])
            if priority not in PRIORITIES or status not in ('scheduled', 'completed', 'cancelled', 'missed'):
                raise ClinicError('Choose a valid status and priority.')
            db.execute('UPDATE appointments SET priority=?,status=?,date=?,time=? WHERE id=?',
                       (priority, status, checked_date(body.get('date', row['date'])), checked_time(body.get('time', row['time'])), row['id']))
            return {'appointment': dict(db.execute('SELECT * FROM appointments WHERE id=?', (row['id'],)).fetchone())}, None
        if action == 'save_consultation':
            patient = db.execute('SELECT * FROM patients WHERE id=?', (text(body.get('patient_id')),)).fetchone()
            if not patient:
                raise ClinicError('Choose a registered patient.')
            transcript = text(body.get('transcript'), 100000)
            if not transcript and not body.get('audio_data'):
                raise ClinicError('Add consultation notes or a transcript before saving.')
            record = checked_record(body.get('record') or {}, patient)
            audio = body.get('audio_data') or None
            if audio:
                if not isinstance(audio, str) or len(audio) > 12 * 1024 * 1024 or not re.match(r'^data:audio/[\w.+-]+(?:;[^,]*)?;base64,', audio):
                    raise ClinicError('Use an audio recording smaller than 8 MB.')
                try:
                    decoded = base64.b64decode(audio.split(',', 1)[1], validate=True)
                    if not decoded or len(decoded) > 8 * 1024 * 1024:
                        raise ClinicError('Use a nonempty audio recording smaller than 8 MB.')
                except (ValueError, TypeError):
                    raise ClinicError('The audio recording could not be saved.')
            cid = text(body.get('id')) or uid()
            old = db.execute('SELECT * FROM consultations WHERE id=?', (cid,)).fetchone()
            if old and (old['status'] == 'approved' or old['patient_id'] != patient['id']):
                raise ClinicError('An approved prescription or patient identity cannot be overwritten.', 409)
            if old:
                db.execute('UPDATE consultations SET transcript=?,audio_data=?,record=? WHERE id=?',
                           (transcript, audio if audio is not None else old['audio_data'], json.dumps(record), cid))
            else:
                db.execute('INSERT INTO consultations VALUES (?,?,?,?,?,?,?,NULL)',
                           (cid, patient['id'], transcript, audio, json.dumps(record), 'draft', now()))
            return {'consultation': consult_view(db.execute('SELECT * FROM consultations WHERE id=?', (cid,)).fetchone())}, None
        if action == 'delete_audio':
            db.execute('UPDATE consultations SET audio_data=NULL WHERE id=?', (text(body.get('id')),))
            return {'ok': True}, None
        if action == 'approve':
            row = db.execute('SELECT * FROM consultations WHERE id=?', (text(body.get('id')),)).fetchone()
            if not row:
                raise ClinicError('Save the consultation draft first.', 404)
            if row['status'] == 'approved':
                appt = db.execute('SELECT * FROM appointments WHERE consultation_id=?', (row['id'],)).fetchone()
                return {'consultation': consult_view(row), 'appointment': dict(appt) if appt else None}, None
            patient = db.execute('SELECT * FROM patients WHERE id=?', (row['patient_id'],)).fetchone()
            record = checked_record(body.get('record') or json.loads(row['record']), patient)
            stamp = now()
            record.update(id=row['id'], approved=True, approved_at=stamp, doctor='Dr. Meera (local demo)')
            db.execute("UPDATE consultations SET status='approved',approved_at=?,record=? WHERE id=?", (stamp, json.dumps(record), row['id']))
            appt = None
            if body.get('follow_up_date'):
                day, at = checked_date(body['follow_up_date']), checked_time(body.get('follow_up_time'))
                if day < date.today().isoformat():
                    raise ClinicError('A new follow-up must be today or later. Please review the date.')
                aid = uid()
                db.execute('INSERT INTO appointments VALUES (?,?,?,?,?,?,?,?)',
                           (aid, row['patient_id'], day, at, 'Follow-up after consultation', 'unassigned', 'scheduled', row['id']))
                appt = dict(db.execute('SELECT * FROM appointments WHERE id=?', (aid,)).fetchone())
            return {'consultation': consult_view(db.execute('SELECT * FROM consultations WHERE id=?', (row['id'],)).fetchone()), 'appointment': appt}, None
        raise ClinicError('Unknown clinic action.')


def calendar(token):
    """Export current appointments. No OAuth/synchronization claims."""
    with connect() as db:
        user = session(db, token)
        query = "SELECT a.*,p.name FROM appointments a JOIN patients p ON p.id=a.patient_id WHERE a.status='scheduled'"
        rows = db.execute(query + (' AND patient_id=?' if user['role'] == 'patient' else ''),
                          (user['patient_id'],) if user['role'] == 'patient' else ()).fetchall()
    def escape(s):
        return str(s).replace('\\', '\\\\').replace('\r', '').replace('\n', '\\n').replace(';', '\\;').replace(',', '\\,')
    lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Sehat V3//Clinic//EN', 'CALSCALE:GREGORIAN']
    for row in rows:
        when = row['date'].replace('-', '') + 'T' + row['time'].replace(':', '') + '00'
        lines += ['BEGIN:VEVENT', 'UID:' + row['id'] + '@sehat.local',
                  'DTSTAMP:' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'),
                  'DTSTART;TZID=Asia/Kolkata:' + when, 'DURATION:PT30M',
                  'SUMMARY:' + escape('Consultation · ' + row['name']),
                  'DESCRIPTION:' + escape(row['reason'] or 'Follow-up'),
                  'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:Appointment reminder',
                  'END:VALARM', 'END:VEVENT']
    lines.append('END:VCALENDAR')
    return '\r\n'.join(lines) + '\r\n'
