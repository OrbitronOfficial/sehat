"""Lists the models each key can reach and tries one tiny call per Gemini flash model.

Run: python tools/check_models.py
"""
import json
import os
import sys
import urllib.error
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import server  # noqa: E402,F401  (loads .env)
import llm  # noqa: E402


def get(url, headers):
    req = urllib.request.Request(url, headers={**headers, "User-Agent": "sehat-copilot/1.0"})
    try:
        return json.loads(urllib.request.urlopen(req, timeout=30).read())
    except urllib.error.HTTPError as e:
        return {"err": e.read().decode()[:600]}


g = get("https://api.groq.com/openai/v1/models", {"Authorization": "Bearer " + os.environ.get("GROQ_API_KEY", "")})
print("GROQ:", sorted(m["id"] for m in g.get("data", [])) or g)

m = get("https://generativelanguage.googleapis.com/v1beta/models?pageSize=200",
        {"x-goog-api-key": os.environ.get("GEMINI_API_KEY", "")})
flash = [x["name"].split("/")[1] for x in m.get("models", [])
         if "generateContent" in x.get("supportedGenerationMethods", []) and "flash" in x["name"]]
print("GEMINI flash:", flash or m)
for name in flash:
    os.environ["GEMINI_MODEL"] = name
    try:
        llm._gemini('Return the JSON object {"ok": true}')
        print("  OK  ", name)
    except llm.LLMError as e:
        print("  FAIL", name, "-", str(e)[:110].replace("\n", " "))
