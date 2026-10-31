"""Machine-translates the interface labels into the other supported languages.

English and Hindi labels are hand-written in public/app.js. This script reads the English
set and writes public/i18n/<code>.json for each remaining language. A label whose
placeholders do not survive translation is dropped, so the page falls back to English for it.

Run: python tools/build_i18n.py            (only labels that are missing from each file)
     python tools/build_i18n.py --force    (redo all)
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
import server  # noqa: E402,F401  (loads .env)
import llm  # noqa: E402
import pipeline  # noqa: E402

OUT = os.path.join(ROOT, "public", "i18n")
CHUNK = 30
NODE = ("const fs=require('fs');const src=fs.readFileSync(process.argv[1],'utf8');"
        "const i=src.indexOf('const STR = ');const j=src.indexOf('\\n};',i)+2;"
        "console.log(JSON.stringify(eval('('+src.slice(i+12,j)+')').en))")

PROMPT = """Translate the values of this JSON object from English into {language} for the interface of a health-records app used by ordinary patients in India.

Rules:
- Return ONE JSON object with exactly the same keys.
- Use simple everyday words in the native script, the way a pharmacist would explain to a patient. Short labels stay short.
- Keep these unchanged: Sehat Copilot, ABHA, ABDM, FHIR, PDF, Google Gemini, Groq, NVIDIA, OpenRouter, DPDP, and anything inside curly braces such as {{n}} or {{p}}.
- Do not add explanations or notes.

{chunk}"""


def english():
    out = subprocess.run(["node", "-e", NODE, os.path.join(ROOT, "public", "app.js")],
                         capture_output=True, text=True, encoding="utf-8", check=True)
    return json.loads(out.stdout)


def placeholders(text):
    return sorted(re.findall(r"\{[a-z]+\}", str(text)))


def translate(en, code):
    keys, done = list(en), {}
    for i in range(0, len(keys), CHUNK):
        part = {k: en[k] for k in keys[i:i + CHUNK]}
        try:
            out, model = llm.write_json(PROMPT.format(language=pipeline.LANGS[code],
                                                      chunk=json.dumps(part, ensure_ascii=False, indent=0)))
        except llm.LLMError as e:
            print(f"  {code} chunk {i // CHUNK + 1}: failed, left in English ({str(e)[:80]})")
            continue
        kept = 0
        for k, v in part.items():
            tr = out.get(k)
            if isinstance(tr, str) and tr.strip() and placeholders(tr) == placeholders(v):
                done[k] = tr.strip()
                kept += 1
        print(f"  {code} chunk {i // CHUNK + 1}: {kept}/{len(part)} via {model}", flush=True)
    return done


def main():
    os.makedirs(OUT, exist_ok=True)
    en = english()
    force = "--force" in sys.argv
    for code in pipeline.LANGS:
        path = os.path.join(OUT, code + ".json")
        if code in ("en", "hi"):
            continue
        done = {}
        if os.path.exists(path) and not force:
            with open(path, encoding="utf-8") as f:
                done = {k: v for k, v in json.load(f).items() if k in en}
        missing = {k: v for k, v in en.items() if k not in done}
        if not missing:
            continue
        print(f"{code}: {pipeline.LANGS[code]}, {len(missing)} label(s) to translate", flush=True)
        done.update(translate(missing, code))
        with open(path, "w", encoding="utf-8") as f:
            json.dump(done, f, ensure_ascii=False, indent=0)
        print(f"  saved {len(done)}/{len(en)} labels", flush=True)


if __name__ == "__main__":
    main()
