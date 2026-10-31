"""Model calls. Every call asks for JSON and returns a parsed dict.

Reading a document needs a vision model: Gemini first (images and PDFs), then
OpenRouter (images). NVIDIA and OpenRouter also back up Groq for writing. Writing (explanations, answers, structuring OCR
text) goes to Groq first, so the scarce vision quota is spent only on reading.

Free-tier quotas are per model, so each provider has a chain of models and a
model that reports "quota exhausted" is skipped until its cool-down passes.
"""
import json
import re
import os
import queue
import threading
import time
import urllib.error
import urllib.request

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
# quickest first. Measured on a phone photo of a prescription with thinking off: 3.5-flash-lite,
# flash-lite-latest and 3-flash-preview answer in 3 to 5 s, 3.1-flash-lite in about 10 s, while
# 3.8-flash and 3.7-flash ran past the 28 s call limit, so they come last.
GEMINI_MODELS = ("gemini-3.5-flash-lite,gemini-flash-lite-latest,gemini-3-flash-preview,"
                 "gemini-3.1-flash-lite,gemini-3.8-flash,gemini-3.7-flash")
# a document is sent to these at once and the first good JSON wins; the rest of the chain is the backup
GEMINI_RACE = "gemini-3.5-flash-lite,gemini-flash-lite-latest,gemini-3-flash-preview"
RACE_TIMEOUT = 18   # per racer; a quick model answers in under 10 s
GROQ_MODELS = "openai/gpt-oss-120b,qwen/qwen3.8-27b,openai/gpt-oss-20b"
GEMINI_TEXT_MODELS = "gemini-3.1-flash-lite,gemini-3.5-flash-lite,gemini-flash-lite-latest"
CALL_TIMEOUT = 28   # one model
BUDGET = 52         # whole request; Vercel cuts the function at 60 s

_resting = {}  # model -> time it may be tried again
_NO_THINK_REFUSED = set()  # models that do not accept a zero thinking budget


class LLMError(Exception):
    pass


class _Http(LLMError):
    def __init__(self, code, detail):
        super().__init__(f"HTTP {code}: {detail[:200]}")
        self.code = code
        self.detail = detail


def _post(url, headers, body, timeout=CALL_TIMEOUT):
    if not url.startswith("https://"):  # provider endpoints only, never file: or other schemes
        raise LLMError("refusing a non-https model endpoint")
    req = urllib.request.Request(
        url, data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": "sehat-copilot/1.0", **headers})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:  # nosec B310 - scheme checked above
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise _Http(e.code, e.read().decode("utf-8", "replace")) from e
    except Exception as e:  # timeouts, DNS, bad JSON
        raise LLMError(str(e) or type(e).__name__) from e


def _parse(text):
    text = (text or "").strip()
    start, end = text.find("{"), text.rfind("}")
    if start < 0 or end < 0:
        raise LLMError("model did not return JSON")
    try:
        return json.loads(text[start:end + 1])
    except json.JSONDecodeError as e:
        raise LLMError(f"bad JSON from model: {e}") from e


def _keys(var):
    """Every key configured for a provider: VAR may hold several separated by commas, and
    VAR_2 ... VAR_6 are read too. Each key has its own quota, so more keys mean more headroom."""
    out = []
    for name in [var] + [f"{var}_{i}" for i in range(2, 7)]:
        for k in re.split(r"[,\s]+", os.environ.get(name, "")):
            if k and k not in out:
                out.append(k)
    return out


def _slot(provider, model, i):
    """Where one model's rest time is kept for the i-th key."""
    return f"{provider}:{model}" + (f"#{i}" if i else "")


def _attempt(provider, model, i, key, call, timeout, errors):
    """One call to one model with the i-th key. Returns the parsed JSON, or None after noting
    why it failed (and resting the model on that key when it is out of quota)."""
    rest_key = _slot(provider, model, i)
    try:
        out = call(model, timeout, key)
        if isinstance(out, dict):
            return out
        errors.append(f"{model}: not a JSON object")
    except _Http as e:
        if e.code == 429:
            # a daily cap rests the model for an hour, a per-minute cap for a minute
            _resting[rest_key] = time.time() + (3600 if re.search(r"PerDay|per day|TPD|RPD", e.detail) else 60)
        elif e.code in (401, 403, 404):
            _resting[rest_key] = time.time() + 3600
        errors.append(f"{model}: {e}")
    except LLMError as e:
        errors.append(f"{model}: {str(e)[:120]}")
    return None


def _free(provider, model, i):
    return _resting.get(_slot(provider, model, i), 0) <= time.time()


def _chain(env_name, default, call, deadline, provider="gemini", per_call=None, keys=(None,), skip=(), errors=None):
    """Try each model in turn, best first, and for each model every key before moving to a
    weaker model. Returns (json, model). Raises LLMError listing why each failed."""
    errors = [] if errors is None else errors
    for model in [m.strip() for m in os.environ.get(env_name, default).split(",") if m.strip()]:
        if model in skip:
            continue
        for i, key in enumerate(keys):
            left = deadline - time.time()
            if left < 4:
                errors.append("out of time")
                raise LLMError("; ".join(errors))
            if not _free(provider, model, i):
                errors.append(f"{model}: resting (quota)")
                continue
            out = _attempt(provider, model, i, key, call, min(per_call or CALL_TIMEOUT, left), errors)
            if out is not None:
                return out, model
    raise LLMError("; ".join(errors) or "no models configured")


def _race(models, call, deadline, keys, errors, provider="gemini"):
    """Send the same request to several models at once, each on its own thread and key where
    there are several keys, and return (json, model) from the first good answer, or None.
    The slower racers are not waited for: they finish in the background and are ignored."""
    entrants = []
    for n, model in enumerate(models):
        order = [(n + j) % len(keys) for j in range(len(keys))]  # spread the racers over the keys
        i = next((i for i in order if _free(provider, model, i)), None)
        if i is None:
            errors.append(f"{model}: resting (quota)")
        else:
            entrants.append((model, i, keys[i]))
    if not entrants:
        return None
    timeout = max(1, min(RACE_TIMEOUT, deadline - time.time() - 4))
    done = queue.Queue()

    def run(model, i, key):
        done.put((model, _attempt(provider, model, i, key, call, timeout, errors)))

    for e in entrants:
        threading.Thread(target=run, args=e, daemon=True).start()
    end = time.time() + timeout + 1
    for _ in entrants:
        try:
            model, out = done.get(timeout=max(0.05, end - time.time()))
        except queue.Empty:
            errors.append("race: no answer in time")
            return None
        if out is not None:
            return out, model
    return None


def _vision_models():
    return [m.strip() for m in os.environ.get("GEMINI_MODELS", GEMINI_MODELS).split(",") if m.strip()]


def rest(models, seconds=1800):
    """A browser reports the reader models it last saw out of daily quota, so a fresh server
    instance does not spend a second on each of them again. Ignored if it would rest them all."""
    known = _vision_models()
    models = models if isinstance(models, (list, tuple)) else []
    names = [m for m in models if isinstance(m, str) and m in known][:len(known)]
    if not names or len(set(names)) >= len(known):
        return
    for m in names:
        for i in range(max(1, len(_keys("GEMINI_API_KEY")))):
            _resting.setdefault(_slot("gemini", m, i), time.time() + seconds)


def resting():
    """Reader models that are out of quota for a while yet."""
    n = max(1, len(_keys("GEMINI_API_KEY")))  # a model rests only when it is out of quota on every key
    return [m for m in _vision_models()
            if all(_resting.get(_slot("gemini", m, i), 0) > time.time() + 300 for i in range(n))]


def _gemini(prompt, file, deadline):
    keys = _keys("GEMINI_API_KEY")
    if not keys:
        raise LLMError("GEMINI_API_KEY not set")
    parts = []
    if file:
        parts.append({"inline_data": {"mime_type": file["mime"], "data": file["data"]}})
    parts.append({"text": prompt})
    body = {"contents": [{"parts": parts}],
            "generationConfig": {"temperature": 0, "responseMimeType": "application/json"}}

    def call(model, timeout, key):
        # Reading a document is transcription, not reasoning: the stronger models spend 20 to 40 s
        # "thinking" by default, so that is turned off. A model that refuses the setting is asked plainly.
        url, head = GEMINI_URL.format(model=model), {"x-goog-api-key": key}
        if model in _NO_THINK_REFUSED:
            out = _post(url, head, body, timeout)
        else:
            quick = dict(body, generationConfig=dict(body["generationConfig"], thinkingConfig={"thinkingBudget": 0}))
            try:
                out = _post(url, head, quick, timeout)
            except _Http as e:
                if e.code != 400:
                    raise
                _NO_THINK_REFUSED.add(model)
                out = _post(url, head, body, timeout)
        try:
            return _parse(out["candidates"][0]["content"]["parts"][0]["text"])
        except (KeyError, IndexError) as e:
            raise LLMError("empty response") from e

    if not file:  # writing: the light models are quick and have the larger free allowance
        return _chain("GEMINI_TEXT_MODELS", GEMINI_TEXT_MODELS, call, deadline, per_call=14, keys=keys)
    # reading: race the quickest models first, then walk the rest of the chain if none answered
    known = _vision_models()
    racers = [m.strip() for m in os.environ.get("GEMINI_RACE", GEMINI_RACE).split(",") if m.strip() in known]
    errors = []
    won = _race(racers, call, deadline, keys, errors) if len(racers) > 1 else None
    if won:
        return won
    return _chain("GEMINI_MODELS", GEMINI_MODELS, call, deadline, keys=keys,
                  skip=racers if len(racers) > 1 else (), errors=errors)


# OpenAI-compatible providers: (endpoint, key variable, text models, vision models, JSON mode)
COMPAT = {
    "groq": (GROQ_URL, "GROQ_API_KEY", GROQ_MODELS, "", True),
    "nvidia": ("https://integrate.api.nvidia.com/v1/chat/completions", "NVIDIA_API_KEY",
               "google/gemma-4-31b-it", "google/gemma-4-31b-it", False),
    "openrouter": ("https://openrouter.ai/api/v1/chat/completions", "OPENROUTER_API_KEY",
                   "google/gemma-4-31b-it:free,google/gemma-4-26b-a4b-it:free",
                   "google/gemma-4-31b-it:free,google/gemma-4-26b-a4b-it:free", False),
}


def _compat(provider, prompt, file, deadline):
    url, key_var, text_models, vision_models, json_mode = COMPAT[provider]
    keys = _keys(key_var)
    if not keys:
        raise LLMError(f"{key_var} not set")
    if file and not file["mime"].startswith("image/"):
        raise LLMError("reads images only")
    models = vision_models if file else text_models
    if not models:
        raise LLMError("no model for this task")
    content = prompt
    if file:
        content = [{"type": "text", "text": prompt},
                   {"type": "image_url", "image_url": {"url": f"data:{file['mime']};base64,{file['data']}"}}]

    def call(model, timeout, key):
        body = {"model": model, "temperature": 0, "max_tokens": 4000,
                "messages": [{"role": "user", "content": content}]}
        if json_mode:
            body["response_format"] = {"type": "json_object"}
        out = _post(url, {"Authorization": f"Bearer {key}"}, body, timeout)
        try:
            return _parse(out["choices"][0]["message"]["content"])
        except (KeyError, IndexError, TypeError) as e:
            raise LLMError("empty response") from e

    env = f"{provider.upper()}_{'VISION_' if file else ''}MODELS"
    # the free NVIDIA vision endpoint is accurate but slow (about 40 s), so it gets the time left
    slow = provider == "nvidia" and file
    return _chain(env, models, call, deadline, provider, per_call=50 if slow else None, keys=keys)


LAST_SKIPPED = []


def _first(order, prompt, file):
    """Try providers in order. Returns (json, "provider/model")."""
    deadline = time.time() + BUDGET
    errors = []
    for provider in order:
        try:
            if provider == "gemini":
                out, model = _gemini(prompt, file, deadline)
            else:
                out, model = _compat(provider, prompt, file, deadline)
            LAST_SKIPPED[:] = [re.sub(r"org_[a-z0-9]+", "org", e)[:900] for e in errors]  # why earlier providers were passed over
            return out, model if provider == "gemini" else f"{provider}: {model}"
        except LLMError as e:
            errors.append(f"{provider}: {e}")
    raise LLMError(" | ".join(errors))


def read_document(prompt, file):
    """Vision. Gemini reads images and PDFs; the others read images only.

    NVIDIA's free vision endpoint takes 40-50 s per page, which would use up the whole
    request and block the faster on-device fallback, so it is opt-in via VISION_ORDER.
    """
    order = os.environ.get("VISION_ORDER", "gemini,openrouter").split(",")
    return _first([p.strip() for p in order], prompt, file)


def write_json(prompt):
    """Text only: explanations, answers, structuring OCR text."""
    order = os.environ.get("TEXT_ORDER", "groq,openrouter,gemini,nvidia").split(",")
    return _first([p.strip() for p in order], prompt, None)


# ---- speech to text (voice questions) ----
GROQ_STT_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
STT_MODEL = "whisper-large-v3-turbo"
STT_LANGS = {"en", "hi", "bn", "te", "mr", "ta", "gu", "kn", "ml", "pa", "ur", "ne", "as", "ar", "es", "fr",
             "de", "pt", "ru", "zh", "ja", "ko", "id", "tr"}


class VoiceUnavailable(LLMError):
    pass


def _multipart(fields, filename, mime, data):
    """A multipart/form-data body built by hand: (bytes, content type)."""
    boundary = "----sehat" + os.urandom(8).hex()
    out = []
    for k, v in fields.items():
        out.append(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode("utf-8"))
    out.append((f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{filename}"\r\n'
                f"Content-Type: {mime}\r\n\r\n").encode("utf-8") + data + b"\r\n")
    out.append(f"--{boundary}--\r\n".encode("utf-8"))
    return b"".join(out), f"multipart/form-data; boundary={boundary}"


def _post_form(url, headers, body, ctype, timeout=CALL_TIMEOUT):
    if not url.startswith("https://"):  # provider endpoints only, never file: or other schemes
        raise LLMError("refusing a non-https model endpoint")
    req = urllib.request.Request(url, data=body, headers={
        "Content-Type": ctype, "User-Agent": "sehat-copilot/1.0", **headers})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:  # nosec B310 - scheme checked above
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise _Http(e.code, e.read().decode("utf-8", "replace")) from e
    except Exception as e:  # timeouts, DNS, bad JSON
        raise LLMError(str(e) or type(e).__name__) from e


def transcribe(audio, mime, filename, lang=None):
    """Speech to text through Groq Whisper. Tries each key on 429/401. Returns the text."""
    fields = {"model": STT_MODEL, "response_format": "json"}
    if lang in STT_LANGS:
        fields["language"] = lang
    body, ctype = _multipart(fields, filename, mime, audio)
    keys = _keys("GROQ_API_KEY")
    for key in keys:
        try:
            out = _post_form(GROQ_STT_URL, {"Authorization": f"Bearer {key}"}, body, ctype)
            return str(out.get("text") or "").strip()
        except _Http as e:
            if e.code not in (429, 401, 403, 413, 500, 502, 503):
                raise
        except LLMError:
            continue
    raise VoiceUnavailable("no speech-to-text key available" if not keys else "speech-to-text keys exhausted")
