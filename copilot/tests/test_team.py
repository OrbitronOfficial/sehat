import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import cloud  # noqa: E402
import team  # noqa: E402

KEY = "k" * 48


class TeamAccessTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root, cloud.ROOT = cloud.ROOT, self.tmp.name  # local document store in a scratch folder
        self.env = os.environ.pop("BLOB_READ_WRITE_TOKEN", None)

    def tearDown(self):
        cloud.ROOT = self.root
        if self.env is not None:
            os.environ["BLOB_READ_WRITE_TOKEN"] = self.env
        self.tmp.cleanup()

    def join(self, role="nurse"):
        code = team.handle({"action": "invite", "key": KEY, "name": "Priya", "role": role})["code"]
        return code, team.handle({"action": "join", "code": code})["token"]

    def test_code_is_single_use(self):
        code, _ = self.join()
        with self.assertRaises(PermissionError):
            team.handle({"action": "join", "code": code})

    def test_staff_work_waits_for_doctor_review(self):
        _, tok = self.join()
        t = team.handle({"action": "add", "token": tok, "text": "Book HbA1c test"})["todos"][0]
        self.assertEqual("pending", t["review"])
        state = team.handle({"action": "review", "key": KEY, "id": t["id"], "verdict": "redo"})
        self.assertEqual(("redo", False), (state["todos"][0]["review"], state["todos"][0]["done"]))

    def test_staff_cannot_use_doctor_actions(self):
        _, tok = self.join()
        for act in ("invite", "revoke", "review", "delete", "state"):
            with self.assertRaises(PermissionError):
                team.handle({"action": act, "token": tok, "name": "x", "role": "pa"})

    def test_revoked_staff_lose_access(self):
        _, tok = self.join()
        sid = team.handle({"action": "state", "key": KEY})["staff"][0]["id"]
        team.handle({"action": "revoke", "key": KEY, "id": sid})
        with self.assertRaises(PermissionError):
            team.handle({"action": "todos", "token": tok})

    def test_doctor_key_required(self):
        with self.assertRaises(ValueError):
            team.handle({"action": "state", "key": "short"})


if __name__ == "__main__":
    unittest.main()
