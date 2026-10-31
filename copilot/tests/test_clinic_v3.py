"""Account-bound clinic regressions. All persistence uses a temporary SQLite DB.

Run: python -m unittest discover -s tests -p test_clinic_v3.py -v
"""
import base64
import http.client
import json
import os
import sys
import tempfile
import threading
import unittest
from datetime import date, timedelta
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import clinic
import server


PASSWORD = 'private-password-123'
DAY = (date.today() + timedelta(days=7)).isoformat()


class ClinicFixture:
    def setUp(self):
        temp = tempfile.TemporaryDirectory(dir=os.path.dirname(__file__), prefix='.clinic-test-')
        self.addCleanup(temp.cleanup)
        db_patch = patch.object(clinic, 'DB_PATH', os.path.join(temp.name, 'clinic.sqlite3'))
        db_patch.start()
        self.addCleanup(db_patch.stop)
        _, self.doc = clinic.handle({'action': 'doctor_demo'}, allow_demo=True)
        self.a = self.add_patient('Alice', email='alice@example.com', phone='+91 98765 43210')
        self.b = self.add_patient('Bob', email='bob@example.com')
        self.alice = self.claim(self.a, 'alice@example.com')
        self.bob = self.claim(self.b, 'bob@example.com')

    def call(self, action, token=None, **values):
        return clinic.handle(dict(values, action=action), self.doc if token is None else token)[0]

    def add_patient(self, name, **contact):
        return self.call('add_patient', name=name, **contact)

    def claim(self, invitation, identifier):
        return clinic.handle(dict(action='claim', identifier=identifier,
                                 claim_code=invitation['claim_code'], password=PASSWORD))[1]

    def draft(self, patient=None, **values):
        body = dict(patient_id=(patient or self.a)['patient']['id'],
                    transcript='Private consultation notes', record={'medicines': [{'name': 'Example'}]})
        body.update(values)
        return self.call('save_consultation', **body)['consultation']

    def appointment(self, patient=None, **values):
        body = dict(patient_id=(patient or self.a)['patient']['id'], date=DAY, time='10:30')
        body.update(values)
        return self.call('appointment', **body)['appointment']

    def assert_error(self, expected_status, action, token=None, **values):
        with self.assertRaises(clinic.ClinicError) as caught:
            self.call(action, token, **values)
        self.assertEqual(expected_status, caught.exception.status)

class ClinicTests(ClinicFixture, unittest.TestCase):
    def test_session_missing_forged_expired_and_logout(self):
        for token in ('', 'made-up-token'):
            self.assert_error(401, 'state', token)
        self.assertEqual('patient', clinic.authenticate(self.alice)['role'])
        with clinic.connect() as db:
            self.assertIsNone(db.execute('SELECT * FROM sessions WHERE token_hash=?', (self.alice,)).fetchone())
            db.execute('UPDATE sessions SET expires=0 WHERE token_hash=?', (clinic.digest(self.alice),))
        self.assert_error(401, 'state', self.alice)
        self.call('logout', self.bob)
        self.assert_error(401, 'state', self.bob)

    def test_doctor_demo_requires_local_permission(self):
        self.assert_error(403, 'doctor_demo', '')

    def test_claim_email_normalization_and_phone(self):
        for name, contact, ident in [('Carol', {'email': 'Carol@Example.COM'}, ' CAROL@example.com '),
                                     ('Dan', {'phone': '+91 (87654) 32109'}, '91-87654-32109')]:
            with self.subTest(contact=contact):
                invitation = self.add_patient(name, **contact)
                token = self.claim(invitation, ident)
                state = self.call('state', token)
                self.assertEqual(invitation['patient']['id'], state['patient']['id'])
                self.assertFalse({'password_hash', 'salt', 'claim_hash'} & state['patient'].keys())
                with clinic.connect() as db:
                    row = db.execute('SELECT * FROM patients WHERE id=?', (state['patient']['id'],)).fetchone()
                    self.assertIsNone(row['claim_hash'])
                    self.assertNotEqual(PASSWORD, row['password_hash'])

    def test_wrong_claim_code_password_and_reclaim(self):
        invitation = self.add_patient('Eve', email='eve@example.com')
        self.assert_error(401, 'claim', '', identifier='eve@example.com', claim_code='wrong', password=PASSWORD)
        self.claim(invitation, 'eve@example.com')
        self.assert_error(401, 'claim', '', identifier='eve@example.com', claim_code=invitation['claim_code'], password=PASSWORD)
        self.assert_error(401, 'login', '', identifier='eve@example.com', password='wrong-password')
        self.assert_error(401, 'login', '', identifier='missing@example.com', password=PASSWORD)
        for password in ('short', 'x' * 257):
            self.assert_error(400, 'login', '', identifier='eve@example.com', password=password)
        result, token = clinic.handle(dict(action='login', identifier='eve@example.com', password=PASSWORD))
        self.assertEqual(invitation['patient']['id'], result['user']['patient_id'])
        self.assertEqual('patient', clinic.authenticate(token)['role'])

    def test_failed_login_attempts_persist_and_rate_limit(self):
        for _ in range(10):
            self.assert_error(401, 'login', '', identifier='alice@example.com', password='wrong-password')
        self.assert_error(429, 'login', '', identifier='alice@example.com', password=PASSWORD)

    def test_concurrent_claim_consumes_invite_once(self):
        # Known gap: clinic.handle reads the unused code before an unconditional
        # UPDATE. Remove expectedFailure when claim consumption becomes atomic.
        invitation = self.add_patient('Concurrent', email='concurrent@example.com')
        barrier = threading.Barrier(2)
        original_hash = clinic.hashlib.pbkdf2_hmac

        def synchronized_hash(*args, **kwargs):
            barrier.wait(timeout=5)
            return original_hash(*args, **kwargs)

        def claim(number):
            try:
                return clinic.handle(dict(action='claim', identifier='concurrent@example.com',
                                         claim_code=invitation['claim_code'], password=PASSWORD + str(number)))[1]
            except clinic.ClinicError:
                return None

        with patch.object(clinic.hashlib, 'pbkdf2_hmac', synchronized_hash), ThreadPoolExecutor(max_workers=2) as pool:
            tokens = list(pool.map(claim, (1, 2)))
        successful = [token for token in tokens if token]
        self.assertEqual(1, len(successful), 'A private claim code must create only one successful claimant')

    def test_patient_cannot_call_doctor_actions(self):
        for action in ('add_patient', 'appointment', 'update_appointment', 'save_consultation', 'approve', 'delete_audio'):
            with self.subTest(action=action):
                self.assert_error(403, action, self.alice)

    def test_patient_state_isolated_and_drafts_private(self):
        approved = self.draft()
        self.call('approve', id=approved['id'])
        self.draft()
        other = self.draft(self.b)
        self.call('approve', id=other['id'])
        self.appointment()
        self.appointment(self.b)
        self.call('checkin', self.bob, consultation_id=other['id'], note='Bob private update')
        state = self.call('state', self.alice, patient_id=self.b['patient']['id'])
        self.assertEqual([approved['id']], [c['id'] for c in state['consultations']])
        self.assertEqual([], state['checkins'])
        self.assertEqual(1, len(state['appointments']))
        self.assertEqual(self.a['patient']['id'], state['appointments'][0]['patient_id'])
        self.assertNotIn('transcript', state['consultations'][0])
        self.assertNotIn('audio_data', state['consultations'][0])

    def test_approval_immutable_idempotent_and_metadata_owned_by_server(self):
        draft = self.draft(record={'patient': {'name': 'Forged'}, 'approved': True, 'id': 'forged', 'medicines': []})
        self.assertEqual('Alice', draft['record']['patient']['name'])
        self.assertNotIn('approved', draft['record'])
        first = self.call('approve', id=draft['id'], follow_up_date=DAY)
        again = self.call('approve', id=draft['id'], record={'notes': 'replace'}, follow_up_date=DAY)
        self.assertEqual(first, again)
        self.assertEqual(1, len(self.call('state')['appointments']))
        self.assertEqual('unassigned', first['appointment']['priority'])
        self.assert_error(409, 'save_consultation', id=draft['id'], patient_id=self.a['patient']['id'], transcript='changed', record={})
        self.assertEqual(first['consultation'], self.call('state')['consultations'][0])

    def test_draft_cannot_be_reassigned_to_another_patient(self):
        draft = self.draft()
        self.assert_error(409, 'save_consultation', id=draft['id'], patient_id=self.b['patient']['id'], transcript='changed', record={})

    def test_invalid_followup_rolls_back_approval_and_appointment(self):
        for extra in ({'follow_up_date': 'invalid'}, {'follow_up_date': DAY, 'follow_up_time': '25:00'},
                      {'follow_up_date': '2000-01-01'}):
            with self.subTest(extra=extra):
                draft = self.draft()
                self.assert_error(400, 'approve', id=draft['id'], **extra)
                with clinic.connect() as db:
                    row = db.execute('SELECT * FROM consultations WHERE id=?', (draft['id'],)).fetchone()
                    self.assertEqual('draft', row['status'])
                    self.assertIsNone(row['approved_at'])
                    self.assertEqual(draft['record'], json.loads(row['record']))
                    self.assertEqual(0, db.execute('SELECT COUNT(*) FROM appointments').fetchone()[0])

    def test_appointment_validation_and_manual_priorities(self):
        for extra in ({'date': 'bad'}, {'time': '24:00'}, {'patient_id': 'missing'}, {'priority': 'automatic'}):
            self.assert_error(400, 'appointment', **dict(dict(patient_id=self.a['patient']['id'], date=DAY), **extra))
        self.assertEqual([], self.call('state')['appointments'])
        appt = self.appointment(reason='severe urgent symptoms')
        self.assertEqual('unassigned', appt['priority'])
        for priority in clinic.PRIORITIES:
            updated = self.call('update_appointment', id=appt['id'], priority=priority)['appointment']
            self.assertEqual(priority, updated['priority'])
        self.assert_error(400, 'update_appointment', id=appt['id'], priority='critical')
        self.assert_error(400, 'update_appointment', id=appt['id'], status='unknown')
        self.assert_error(403, 'update_appointment', self.alice, id=appt['id'], priority='major')

    def test_calendar_escaping_filtering_and_cancelled_exclusion(self):
        appt = self.appointment(reason='a,b;c\\d\r\nBEGIN:VEVENT')
        self.appointment(self.b, reason='Bob confidential')
        cancelled = self.appointment(reason='cancelled private')
        self.call('update_appointment', id=cancelled['id'], status='cancelled')
        calendar = clinic.calendar(self.alice)
        self.assertIn('DESCRIPTION:a\\,b\\;c\\\\d\\nBEGIN:VEVENT\r\n', calendar)
        self.assertEqual(1, calendar.split('\r\n').count('BEGIN:VEVENT'))
        self.assertIn(appt['id'], calendar)
        self.assertNotIn('Bob', calendar)
        self.assertNotIn(cancelled['id'], calendar)
        self.assertEqual(2, clinic.calendar(self.doc).split('\r\n').count('BEGIN:VEVENT'))
        with self.assertRaises(clinic.ClinicError):
            clinic.calendar('')

    def test_checkin_requires_patient_own_approved_consultation(self):
        draft = self.draft()
        self.assert_error(400, 'checkin', self.alice, consultation_id=draft['id'], note='update')
        self.call('approve', id=draft['id'])
        self.assert_error(403, 'checkin', self.doc, consultation_id=draft['id'], note='update')
        self.assert_error(400, 'checkin', self.bob, consultation_id=draft['id'], note='update')
        self.assert_error(400, 'checkin', self.alice, consultation_id=draft['id'], note='  ')
        self.call('checkin', self.alice, consultation_id=draft['id'], note='Doing better', patient_id=self.b['patient']['id'])
        self.assertEqual(self.a['patient']['id'], self.call('state')['checkins'][0]['patient_id'])

    def test_saved_audio_validation_and_explicit_deletion(self):
        for audio in ('data:text/html;base64,YQ==', 'data:audio/webm;base64,!!', {'invalid': True}):
            with self.subTest(audio=audio), self.assertRaises(clinic.ClinicError):
                self.draft(audio_data=audio)
        audio = 'data:audio/webm;base64,YQ=='
        draft = self.draft(audio_data=audio)
        edited = self.draft(id=draft['id'])
        self.assertEqual(audio, edited['audio_data'])
        self.call('delete_audio', id=draft['id'])
        self.assertIsNone(self.call('state')['consultations'][0]['audio_data'])

    def test_saved_audio_rejects_empty_decoded_payload(self):
        with self.assertRaises(clinic.ClinicError):
            self.draft(audio_data='data:audio/webm;base64,')

    def test_saved_audio_enforces_eight_mb_decoded_limit(self):
        audio = 'data:audio/webm;base64,' + base64.b64encode(b'x' * (8 * 1024 * 1024 + 1)).decode()
        with self.assertRaises(clinic.ClinicError):
            self.draft(audio_data=audio)


@unittest.skip("Clinic prototype HTTP routes are not merged into server.py yet; see V3-NOTES.md")
class ClinicHTTPTests(ClinicFixture, unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.httpd = server.ThreadingHTTPServer(('127.0.0.1', 0), server.Handler)
        cls.worker = threading.Thread(target=cls.httpd.serve_forever, daemon=True)
        cls.worker.start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        cls.worker.join(timeout=5)

    def request(self, path, body=None, token='', headers=None):
        conn = http.client.HTTPConnection('127.0.0.1', self.httpd.server_port, timeout=5)
        try:
            request_headers = {'Content-Type': 'application/json', 'Cookie': clinic.COOKIE + '=' + token}
            request_headers.update(headers or {})
            conn.request('GET' if body is None else 'POST', path,
                         None if body is None else json.dumps(body), request_headers)
            response = conn.getresponse()
            return response.status, dict(response.getheaders()), response.read()
        finally:
            conn.close()

    def test_http_session_cookie_and_logout(self):
        status, headers, _ = self.request('/api/clinic', {'action': 'doctor_demo'})
        self.assertEqual(200, status)
        cookie = headers['Set-Cookie']
        for flag in ('HttpOnly', 'SameSite=Strict', 'Path=/', 'Max-Age=28800'):
            self.assertIn(flag, cookie)
        self.assertEqual(401, self.request('/api/clinic', {'action': 'state'})[0])
        self.assertEqual(200, self.request('/api/clinic', {'action': 'state'}, self.alice)[0])
        status, headers, _ = self.request('/api/clinic', {'action': 'logout'}, self.alice)
        self.assertEqual(200, status)
        self.assertIn('Max-Age=0', headers['Set-Cookie'])
        self.assertEqual(401, self.request('/api/clinic', {'action': 'state'}, self.alice)[0])

    def test_http_cross_origin_rejected(self):
        self.assertEqual(403, self.request('/api/clinic', {'action': 'state'}, self.doc,
                                          {'Origin': 'https://attacker.example'})[0])

    def test_http_consult_doctor_auth_before_model_call(self):
        with patch.object(server.pipeline, 'from_consult', return_value={'draft': True}) as model:
            self.assertEqual(401, self.request('/api/consult', {'transcript': 'notes'})[0])
            self.assertEqual(403, self.request('/api/consult', {'transcript': 'notes'}, self.alice)[0])
            model.assert_not_called()
            self.assertEqual(200, self.request('/api/consult', {'transcript': 'notes'}, self.doc)[0])
            model.assert_called_once()

    def test_http_old_inbox_routes_disabled(self):
        with patch.object(server, '_inbox_rw') as legacy:
            for path in ('/api/inbox', '/api/consult/send'):
                self.assertEqual(410, self.request(path, {'names': ['Alice'], 'record': {'patient': {'name': 'Alice'}}})[0])
            legacy.assert_not_called()

    def test_http_calendar_auth_and_account(self):
        self.appointment(self.b, reason='Bob confidential')
        self.assertEqual(401, self.request('/api/clinic/calendar')[0])
        status, headers, body = self.request('/api/clinic/calendar', token=self.alice)
        self.assertEqual(200, status)
        self.assertIn('text/calendar', headers['Content-Type'])
        self.assertEqual('no-store', headers['Cache-Control'])
        self.assertNotIn(b'Bob', body)

    def test_http_audio_validation_before_transcriber(self):
        with patch.object(server.llm, 'transcribe', return_value='heard words') as transcriber:
            for body in ({}, {'audio': '!!!'}, {'audio': 'YQ==', 'mime': 'text/html'},
                         {'audio': 'data:audio/webm;base64,'}):
                self.assertEqual(400, self.request('/api/transcribe', body)[0])
            transcriber.assert_not_called()
            status, _, body = self.request('/api/transcribe', {'audio': 'YQ==', 'mime': 'audio/webm;codecs=opus', 'lang': 'hi-IN'})
            self.assertEqual(200, status)
            self.assertEqual('heard words', json.loads(body)['text'])
            transcriber.assert_called_once_with(b'a', 'audio/webm', 'voice.webm', 'hi')


if __name__ == '__main__':
    unittest.main()
