"""Delegated to-do access for a doctor's staff (PA, nurse, receptionist).

A doctor invites a staff member and gets a one-time code. The staff member joins with it and
can then only read and change the doctor's to-do list: never patients, prescriptions or
recordings. Everything staff add or complete waits in the doctor's daily review.

Stored with cloud.put_doc: a private Vercel Blob in production, data/team.json locally. Keys and tokens are stored only as SHA-256 hashes.
"""
import hashlib
import secrets
import threading
import time

import cloud

ROLES = ("pa", "nurse", "receptionist")
_LOCK = threading.Lock()


def _h(s):
    return hashlib.sha256(str(s or "").encode()).hexdigest()


def _load():
    return cloud.get_doc("team", {}) or {}


def _save(d):
    cloud.put_doc("team", d)


def _text(s, n=300):
    return " ".join(str(s or "").split())[:n]


def _doctor(d, key):
    if not isinstance(key, str) or len(key) < 32:
        raise ValueError("Missing doctor key.")
    return d.setdefault(_h(key), {"staff": [], "todos": []})


def _staff(d, token):
    th = _h(token)
    for doc in d.values():
        for s in doc["staff"]:
            if s.get("token") == th and s.get("active"):
                return doc, s
    raise PermissionError("This access has ended. Ask the doctor for a new code.")


def handle(b):
    """One entry point: {'action': ..., 'key' (doctor) or 'token' (staff), ...}."""
    act = b.get("action")
    with _LOCK:
        d = _load()
        if act == "join":
            code = _text(b.get("code"), 12).upper()
            for doc in d.values():
                for s in doc["staff"]:
                    if s.get("code") and s["code"] == code and s.get("active"):
                        token = secrets.token_urlsafe(32)
                        s["token"], s["code"], s["joined"] = _h(token), None, int(time.time())  # code is single-use
                        _save(d)
                        return {"token": token, "name": s["name"], "role": s["role"], "doctor": doc.get("name") or "your doctor"}
            raise PermissionError("That code is not valid or was already used.")

        if b.get("token"):  # staff: to-do list only
            doc, me = _staff(d, b["token"])
            if act == "add":
                text = _text(b.get("text"))
                if not text:
                    raise ValueError("Write the task first.")
                doc["todos"].insert(0, {"id": secrets.token_hex(6), "text": text, "by": me["name"], "role": me["role"],
                                        "at": int(time.time()), "done": False, "review": "pending"})
            elif act == "done":
                for t in doc["todos"]:
                    if t["id"] == b.get("id"):
                        t["done"], t["done_by"], t["done_at"] = bool(b.get("done", True)), me["name"], int(time.time())
                        if t.get("review") != "pending":
                            t["review"] = "pending"  # the doctor sees what staff completed
            elif act != "todos":
                raise PermissionError("Staff can only use the to-do list.")
            _save(d)
            return {"todos": doc["todos"], "doctor": doc.get("name") or "your doctor", "me": {"name": me["name"], "role": me["role"]}}

        doc = _doctor(d, b.get("key"))  # doctor: everything below
        if b.get("doctor"):
            doc["name"] = _text(b["doctor"], 80)
        if act == "invite":
            name, role = _text(b.get("name"), 60), b.get("role")
            if not name or role not in ROLES:
                raise ValueError("Give the staff member a name and a role.")
            code = secrets.token_hex(3).upper()
            doc["staff"].append({"id": secrets.token_hex(4), "name": name, "role": role, "code": code, "active": True, "at": int(time.time())})
            _save(d)
            return {"code": code, "staff": _public(doc)}
        if act == "revoke":
            for s in doc["staff"]:
                if s["id"] == b.get("id"):
                    s["active"], s["token"], s["code"] = False, None, None
        elif act == "add":
            text = _text(b.get("text"))
            if text:
                doc["todos"].insert(0, {"id": secrets.token_hex(6), "text": text, "by": "You", "role": "doctor", "at": int(time.time()), "done": False, "review": "ok"})
        elif act == "done":
            for t in doc["todos"]:
                if t["id"] == b.get("id"):
                    t["done"], t["done_by"], t["done_at"] = bool(b.get("done", True)), "You", int(time.time())
        elif act == "review":  # approve or send back what staff did
            for t in doc["todos"]:
                if t["id"] == b.get("id") and b.get("verdict") in ("ok", "redo"):
                    t["review"] = b["verdict"]
                    if b["verdict"] == "redo":
                        t["done"] = False
        elif act == "delete":
            doc["todos"] = [t for t in doc["todos"] if t["id"] != b.get("id")]
        elif act != "state":
            raise ValueError("Unknown action.")
        _save(d)
        return {"todos": doc["todos"], "staff": _public(doc)}


def _public(doc):
    return [{"id": s["id"], "name": s["name"], "role": s["role"], "active": s["active"],
             "code": s.get("code"), "joined": bool(s.get("joined"))} for s in doc["staff"]]
