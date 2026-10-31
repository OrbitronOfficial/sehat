"""Encrypted vault storage for multi-device sync.

The browser encrypts everything before it leaves the device (AES-GCM, key derived from the
user's password), so this module only ever handles ciphertext. A vault lives at a path derived
from the account id and a sync token; both come from the password on the device and the
password itself never reaches the server.

On Vercel it uses a private Vercel Blob store (BLOB_READ_WRITE_TOKEN); every read and write needs the token. Each save is a new, uniquely named
object, so a read never meets a stale CDN copy; older versions are deleted after a save.
Without a token (local development) vaults are kept in data/sync/ on disk.
"""
import hashlib
import json
import os
import re
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
LOCAL = os.path.join(ROOT, "data", "sync")
API = "https://blob.vercel-storage.com"
MAX_VAULT = 4 * 1024 * 1024  # Vercel caps a request body at 4.5 MB
HEX64 = re.compile(r"^[0-9a-f]{64}$")


class SyncError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status


def _path(vault_id, token):
    if not (isinstance(vault_id, str) and HEX64.match(vault_id) and isinstance(token, str) and HEX64.match(token)):
        raise SyncError(400, "Invalid sync credentials.")
    return "vault/" + hashlib.sha256((vault_id + ":" + token).encode()).hexdigest()


def _blob_token():
    return os.environ.get("BLOB_READ_WRITE_TOKEN", "")


def _request(method, url, data=None, headers=None, timeout=20):
    if not url.startswith("https://"):
        raise SyncError(500, "Refusing a non-https storage address.")
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:  # nosec B310 - https checked above
            return r.read()
    except urllib.error.HTTPError as e:
        raise SyncError(502, f"Storage error {e.code}.") from e
    except (urllib.error.URLError, OSError) as e:
        raise SyncError(502, "Storage is not reachable.") from e


def _auth():
    return {"authorization": "Bearer " + _blob_token(), "x-api-version": "13"}


def _blob_list(prefix):
    out = json.loads(_request("GET", API + "?prefix=" + urllib.request.quote(prefix + "/") + "&limit=100", headers=_auth()))
    return sorted(out.get("blobs") or [], key=lambda b: b.get("uploadedAt") or "")


def save(vault_id, token, vault, at):
    """Store one encrypted vault (a base64 string) and its timestamp; keep only the newest."""
    path = _path(vault_id, token)
    if not isinstance(vault, str) or not vault or len(vault) > MAX_VAULT:
        raise SyncError(400, "The vault is empty or too large to sync.")
    body = json.dumps({"vault": vault, "at": int(at or time.time() * 1000)}).encode()
    if not _blob_token():
        os.makedirs(LOCAL, exist_ok=True)
        with open(os.path.join(LOCAL, path.split("/")[1] + ".json"), "wb") as f:
            f.write(body)
        return {"ok": True}
    old = _blob_list(path)
    name = f"{path}/{int(time.time() * 1000)}.json"
    _request("PUT", API + "/?pathname=" + urllib.request.quote(name), data=body, headers=dict(_auth(), **{
        "x-content-type": "application/json", "x-add-random-suffix": "1", "x-vercel-blob-access": "private"}))
    if old:  # earlier versions are no longer needed
        try:
            _request("POST", API + "/delete", data=json.dumps({"urls": [b["url"] for b in old]}).encode(),
                     headers=dict(_auth(), **{"content-type": "application/json"}))
        except SyncError:
            pass
    return {"ok": True}


def load(vault_id, token):
    """The newest encrypted vault for these credentials, or None."""
    path = _path(vault_id, token)
    if not _blob_token():
        try:
            with open(os.path.join(LOCAL, path.split("/")[1] + ".json"), "rb") as f:
                return json.loads(f.read())
        except (OSError, ValueError):
            return None
    blobs = _blob_list(path)
    if not blobs:
        return None
    # a private store: reading needs the token too, and the cache is skipped so the newest copy is read
    return json.loads(_request("GET", blobs[-1]["url"] + "?cache=0", headers={"authorization": "Bearer " + _blob_token()}))


def get_doc(name, default=None):
    """A small app document (doctor inbox, staff to-do lists). Private blob on Vercel, data/<name>.json locally."""
    if not re.fullmatch(r"[a-z0-9_-]{1,40}", name):
        raise SyncError(400, "Bad document name.")
    if not _blob_token():
        try:
            with open(os.path.join(ROOT, "data", name + ".json"), encoding="utf-8") as f:
                return json.load(f)
        except (OSError, ValueError):
            return default
    blobs = _blob_list("app/" + name)
    if not blobs:
        return default
    return json.loads(_request("GET", blobs[-1]["url"] + "?cache=0", headers={"authorization": "Bearer " + _blob_token()}))


def put_doc(name, obj):
    if not re.fullmatch(r"[a-z0-9_-]{1,40}", name):
        raise SyncError(400, "Bad document name.")
    body = json.dumps(obj).encode()
    if not _blob_token():
        path = os.path.join(ROOT, "data", name + ".json")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path + ".tmp", "wb") as f:
            f.write(body)
        os.replace(path + ".tmp", path)
        return
    old = _blob_list("app/" + name)
    _request("PUT", API + "/?pathname=" + urllib.request.quote(f"app/{name}/{int(time.time() * 1000)}.json"), data=body, headers=dict(_auth(), **{
        "x-content-type": "application/json", "x-add-random-suffix": "1", "x-vercel-blob-access": "private"}))
    if old:
        try:
            _request("POST", API + "/delete", data=json.dumps({"urls": [b["url"] for b in old]}).encode(),
                     headers=dict(_auth(), **{"content-type": "application/json"}))
        except SyncError:
            pass
