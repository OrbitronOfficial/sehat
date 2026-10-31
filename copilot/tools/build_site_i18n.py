"""Machine-translates the landing, sign-in and pricing pages.

The pages are written in English. site.js swaps each text node for its translation using
public/i18n/site-<code>.json, a map from the English text (whitespace collapsed) to the
translated text. This script collects those English strings from the three HTML files and
from the string literals in site.js, and translates the ones each language file is missing.

Run: python tools/build_site_i18n.py            (missing strings only)
     python tools/build_site_i18n.py --force    (redo all)
"""
import json
import os
import re
import sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import server  # noqa: E402,F401  (loads .env)
import llm  # noqa: E402
import pipeline  # noqa: E402

PUBLIC = os.path.join(ROOT, "public")
OUT = os.path.join(PUBLIC, "i18n")
PAGES = ("landing.html", "login.html", "pricing.html")
ATTRS = ("placeholder", "aria-label", "title")
VOID = {"br", "img", "input", "meta", "link", "hr", "source", "path", "circle", "rect", "ellipse", "line", "polyline"}
CHUNK = 25

PROMPT = """Translate these interface texts of a health-records app from English into {language} for ordinary patients in India.

Rules:
- Return ONE JSON object with exactly the same keys ("0", "1", ...), each value the translation of that text.
- Simple everyday words in the native script. Keep short labels short.
- Keep unchanged: Sehat Copilot, Saathi, ABHA, ABDM, FHIR, PDF, HbA1c, Google Gemini, Groq, NVIDIA, OpenRouter, GitHub, HacXLerate, ANTIJAREX, Altrix Labs, numbers, and symbols such as arrows.
- Do not add notes.

{chunk}"""


def norm(text):
    return re.sub(r"\s+", " ", text or "").strip()


def wanted(text):
    return len(text) > 1 and re.search(r"[A-Za-z]{2}", text) is not None


class Collector(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out, self.stack = [], []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        skip = tag in ("script", "style", "svg") or "data-noi18n" in attrs or bool(self.stack and self.stack[-1][1])
        if tag not in VOID:
            self.stack.append((tag, skip))
        if not skip or tag == "svg":
            for a in ATTRS:
                if attrs.get(a) and wanted(norm(attrs[a])) and "data-noi18n" not in attrs:
                    self.out.append(norm(attrs[a]))

    def handle_endtag(self, tag):
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i][0] == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        if self.stack and (self.stack[-1][1] or self.stack[-1][0] == "title"):
            return
        text = norm(data)
        if wanted(text):
            self.out.append(text)


def english():
    found = []
    for page in PAGES:
        c = Collector()
        with open(os.path.join(PUBLIC, page), encoding="utf-8") as f:
            c.feed(f.read())
        found += c.out
    # texts the script builds at run time (the guide's panel, validation messages)
    with open(os.path.join(PUBLIC, "site.js"), encoding="utf-8") as f:
        js = f.read()
    with open(os.path.join(PUBLIC, "faq.js"), encoding="utf-8") as f:  # the guide's fixed answers
        js += " " + f.read()
    for page in PAGES:  # and by the small inline scripts in each page
        with open(os.path.join(PUBLIC, page), encoding="utf-8") as f:
            js += " ".join(re.findall(r"<script[^>]*>(.*?)</script>", f.read(), re.S))
    for m in re.finditer(r"'((?:[^'\\\n]|\\.)*)'|\"((?:[^\"\\\n]|\\.)*)\"", js):
        text = norm((m.group(1) if m.group(1) is not None else m.group(2)).replace("\\'", "'").replace('\\"', '"'))
        if re.match(r"[A-Z]", text) and " " in text and len(text) > 8 and not re.search(r"[<>{}=;]|\\[nu]", text):
            found.append(text)
    seen, out = set(), []
    for t in found:
        if t not in seen:
            seen.add(t)
            out.append(t)
    return out


def translate(texts, code):
    done = {}
    for i in range(0, len(texts), CHUNK):
        part = texts[i:i + CHUNK]
        try:
            out, model = llm.write_json(PROMPT.format(
                language=pipeline.LANGS[code],
                chunk=json.dumps({str(n): t for n, t in enumerate(part)}, ensure_ascii=False, indent=0)))
        except llm.LLMError as e:
            print(f"  {code} chunk {i // CHUNK + 1}: failed, left in English ({str(e)[:80]})", flush=True)
            continue
        for n, t in enumerate(part):
            tr = out.get(str(n))
            if isinstance(tr, str) and tr.strip():
                done[t] = tr.strip()
        print(f"  {code} chunk {i // CHUNK + 1}/{(len(texts) - 1) // CHUNK + 1} via {model}", flush=True)
    return done


def main():
    os.makedirs(OUT, exist_ok=True)
    en = english()
    print(f"{len(en)} English strings", flush=True)
    force = "--force" in sys.argv
    for code in pipeline.BUNDLED:  # the site pages offer the ten bundled languages
        if code == "en":
            continue
        path = os.path.join(OUT, f"site-{code}.json")
        done = {}
        if os.path.exists(path) and not force:
            with open(path, encoding="utf-8") as f:
                done = {k: v for k, v in json.load(f).items() if k in en}
        missing = [t for t in en if t not in done]
        if missing:
            print(f"{code}: {len(missing)} to translate", flush=True)
            done.update(translate(missing, code))
        with open(path, "w", encoding="utf-8") as f:
            json.dump(done, f, ensure_ascii=False, indent=0)
        print(f"  {code}: {len(done)}/{len(en)}", flush=True)


if __name__ == "__main__":
    main()
