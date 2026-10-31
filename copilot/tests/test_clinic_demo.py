import os
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import clinic  # noqa: E402


class DemoTests(unittest.TestCase):
    def test_demo_is_local_and_idempotent(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(clinic, 'DB_PATH', os.path.join(folder, 'clinic.db')):
            with self.assertRaises(clinic.ClinicError):
                clinic.handle({'action': 'patient_demo'})
            _, token = clinic.handle({'action': 'patient_demo'}, allow_demo=True)
            clinic.handle({'action': 'patient_demo'}, allow_demo=True)
            state, _ = clinic.handle({'action': 'state'}, token)
            self.assertEqual(1, len(state['consultations']))
            self.assertEqual(2, len(state['appointments']))
            self.assertEqual('demo-rahul', state['patient']['id'])
            self.assertTrue(all(c['status'] == 'approved' for c in state['consultations']))

    def test_doctor_demo_does_not_infer_priority(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(clinic, 'DB_PATH', os.path.join(folder, 'clinic.db')):
            _, token = clinic.handle({'action': 'doctor_demo'}, allow_demo=True)
            clinic.handle({'action': 'seed_demo'}, token, allow_demo=True)
            state, _ = clinic.handle({'action': 'state'}, token)
            self.assertEqual(3, len(state['patients']))
            self.assertEqual({'unassigned'}, {a['priority'] for a in state['appointments']})
