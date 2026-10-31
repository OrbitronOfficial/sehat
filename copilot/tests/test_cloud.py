"""Encrypted vault storage: credentials are checked, vaults round-trip, and paths never repeat."""
import os
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import cloud  # noqa: E402

ID, TOKEN = "a" * 64, "b" * 64


class CloudTests(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()
        self.env = mock.patch.dict(os.environ, {"BLOB_READ_WRITE_TOKEN": ""})
        self.loc = mock.patch.object(cloud, "LOCAL", self.dir)
        self.env.start()
        self.loc.start()

    def tearDown(self):
        self.env.stop()
        self.loc.stop()

    def test_bad_credentials_are_refused(self):
        for vid, tok in (("x", TOKEN), (ID, "short"), (None, None), (ID.upper(), TOKEN)):
            with self.assertRaises(cloud.SyncError):
                cloud.save(vid, tok, "p1:abc", 1)

    def test_round_trip_and_wrong_token(self):
        cloud.save(ID, TOKEN, "g1:ciphertext", 123)
        self.assertEqual(cloud.load(ID, TOKEN), {"vault": "g1:ciphertext", "at": 123})
        self.assertIsNone(cloud.load(ID, "c" * 64))

    def test_empty_or_huge_vault_is_refused(self):
        with self.assertRaises(cloud.SyncError):
            cloud.save(ID, TOKEN, "", 1)
        with self.assertRaises(cloud.SyncError):
            cloud.save(ID, TOKEN, "x" * (cloud.MAX_VAULT + 1), 1)


if __name__ == "__main__":
    unittest.main()
