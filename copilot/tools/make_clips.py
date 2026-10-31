"""Records one real session of the app being used, for tools/make_intro.py to cut into steps.

A scripted browser signs up, opens a sample report, checks and saves it, reads the explanation,
visits the timeline and dashboard, types a question, and walks the mock ABHA flow. The cursor
and clicks are drawn into the page so they show in the recording. Output: docs/clips/session.webm
and docs/clips/marks.json (when each step starts, and which waiting stretches to cut).

Needs the local server on :8820 and the playwright package with Chrome installed.
Run: python tools/make_clips.py"""
import json
import os
import shutil
import tempfile
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8820"
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs", "clips")
SIZE = {"width": 1200, "height": 750}

CURSOR = r"""
(() => {
  try { localStorage.setItem('sehat_theme', 'light'); } catch (e) {}
  const start = () => {
    if (document.getElementById('__cur')) return;
    const st = document.createElement('style');
    st.textContent = '@keyframes __rip{from{transform:translate(-50%,-50%) scale(.3);opacity:.55}to{transform:translate(-50%,-50%) scale(1);opacity:0}}' +
      '.__rip{position:fixed;width:70px;height:70px;border-radius:50%;background:rgba(15,118,110,.28);border:2px solid rgba(15,118,110,.8);pointer-events:none;z-index:2147483646;animation:__rip .55s ease-out forwards}';
    document.documentElement.appendChild(st);
    const c = document.createElement('div');
    c.id = '__cur';
    let pos = [600, 420];
    try { pos = JSON.parse(sessionStorage.getItem('__cur') || '[600,420]'); } catch (e) {}
    c.style.cssText = 'position:fixed;left:0;top:0;width:24px;height:32px;z-index:2147483647;pointer-events:none;transform:translate(' + pos[0] + 'px,' + pos[1] + 'px)';
    c.innerHTML = '<svg viewBox="0 0 24 32" width="24" height="32"><path d="M2 1v24l6.5-6 4.5 11 4-1.7-4.5-10.6H22z" fill="#fff" stroke="#0F172A" stroke-width="1.8" stroke-linejoin="round"/></svg>';
    document.documentElement.appendChild(c);
    document.addEventListener('mousemove', e => {
      c.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)';
      try { sessionStorage.setItem('__cur', JSON.stringify([e.clientX, e.clientY])); } catch (err) {}
    }, true);
    document.addEventListener('mousedown', e => {
      const r = document.createElement('div');
      r.className = '__rip';
      r.style.left = e.clientX + 'px';
      r.style.top = e.clientY + 'px';
      document.documentElement.appendChild(r);
      setTimeout(() => r.remove(), 600);
    }, true);
  };
  if (document.documentElement) start();
  document.addEventListener('DOMContentLoaded', start);
})();
"""


def _stamps(video):
    """Seconds into the recording at which each corner stamp first shows."""
    import subprocess
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", video, "-vf", "fps=25,crop=6:6:1:1,scale=1:1",
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
    out, on = [], False
    for i in range(len(raw) // 3):
        r, g, b = raw[i * 3:i * 3 + 3]
        hit = r > 170 and g < 110 and b > 170
        if hit and not on:
            out.append(round(i / 25, 2))
        on = hit
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    tmp = tempfile.mkdtemp(prefix="sehat_clips_")
    marks, cuts, events = [], [], []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        ctx = browser.new_context(viewport=SIZE, record_video_dir=tmp, record_video_size=SIZE, color_scheme="light")
        ctx.add_init_script(CURSOR)
        page = ctx.new_page()
        pause = page.wait_for_timeout

        def event(kind, name=None):
            """The recording's clock does not run evenly with ours (it compresses while the page is
            busy), so every step and cut is stamped into the picture itself: a small magenta square
            in the corner for a few frames, found again afterwards."""
            page.evaluate("""() => { const m = document.createElement('div');
              m.style.cssText = 'position:fixed;left:0;top:0;width:8px;height:8px;background:#ff00ff;z-index:2147483647';
              document.documentElement.appendChild(m); setTimeout(() => m.remove(), 150); }""")
            events.append((kind, name))
            pause(260)

        mark = lambda name: event("mark", name)

        def go(sel, after=450, nth=0):
            """Glide to an element and click it."""
            el = page.locator(sel).nth(nth)
            el.scroll_into_view_if_needed()
            box = el.bounding_box()
            x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
            page.mouse.move(x, y, steps=26)
            pause(160)
            el.click(delay=70)  # a real click at the same spot (retries if the layout was still settling)
            pause(after)

        def typed(sel, text, delay=62):
            go(sel, 200)
            page.keyboard.type(text, delay=delay)
            pause(300)

        def waiting(fn):
            """Run a wait that should not be watched: keep its first 1.4 s and last 0.4 s only."""
            event("wait_a")
            fn()
            event("wait_b")

        def scroll(total, step=60, gap=45):
            for _ in range(abs(total) // step):
                page.mouse.wheel(0, step if total > 0 else -step)
                pause(gap)
            pause(350)

        page.goto(BASE + "/login", wait_until="domcontentloaded")
        pause(1200)

        mark("login")  # create an account on this device
        go("#t-up")
        typed("#name", "Jay Tawri")
        typed("#email", "jay@example.com")
        typed("#pw", "walkthrough-only-1")
        go("#submit", 300)
        page.wait_for_url("**/app*", wait_until="domcontentloaded", timeout=30000)
        page.wait_for_function("typeof S !== 'undefined' && S.ready", timeout=20000)
        page.evaluate("PET.tipOff = true; renderPet()")
        pause(900)

        mark("add")  # a real file is uploaded and read live
        # The desktop's own drag cannot be recorded, so the file being carried is drawn in the page;
        # the upload itself is real (the same file goes through the page's file input).
        page.evaluate("""() => { const f = document.createElement('div'); f.id = '__file';
          f.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483646;pointer-events:none;display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:10px;background:#fff;border:1px solid #CBD5D1;box-shadow:0 10px 24px rgba(15,23,42,.18);font:600 13px system-ui;color:#0F172A;transform:translate(1210px,640px) rotate(-3deg)';
          f.innerHTML = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#0F766E" stroke-width="2" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/></svg>lab-report-sept.jpg';
          document.documentElement.appendChild(f);
          document.addEventListener('mousemove', e => { f.style.transform = 'translate(' + (e.clientX + 16) + 'px,' + (e.clientY + 12) + 'px) rotate(-3deg)'; }, true); }""")
        page.mouse.move(1150, 700, steps=10)
        pause(400)
        drop = page.locator("#drop").bounding_box()
        page.mouse.move(drop["x"] + drop["width"] / 2, drop["y"] + drop["height"] / 2, steps=42)
        pause(500)
        page.evaluate("document.getElementById('__file').remove()")
        page.set_input_files("#fileInput", os.path.join(os.path.dirname(OUT), "..", "public", "samples", "lab-2026-09.png"))
        waiting(lambda: page.wait_for_function("S.stage !== 'processing'", timeout=90000))
        if page.evaluate("S.stage") != "review":  # no reader free just now: open the bundled sample instead
            go('[data-act="sample"]:has-text("September")', 300)
            waiting(lambda: page.wait_for_function("S.stage === 'review'", timeout=90000))
        pause(900)

        mark("review")  # what was read, beside the original
        pause(700)
        scroll(300, gap=70)
        box = page.locator('[data-path="tests.0.value"]').bounding_box()
        if box:
            page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2, steps=30)
            pause(1500)
        scroll(360, gap=70)
        go('[data-act="save"]', 300)
        page.wait_for_function("S.view === 'detail'", timeout=30000)

        event("gap_a")  # off camera: the explanation being written, so the step opens on the finished page
        page.wait_for_function(
            "(() => { const r = getRec(S.detailId), e = r && r.explanation; return !!(e && ((e[lang] && e[lang].summary) || e.summary)); })()", timeout=90000)
        pause(500)
        event("gap_b")

        mark("detail")  # the explanation in plain words
        pause(1500)
        page.mouse.move(520, 420, steps=24)
        scroll(420, gap=85)
        pause(1200)

        event("gap_a")  # off camera: the rest of the sample patient's history (it includes this same report)
        first = page.evaluate("S.detailId")
        page.evaluate("loadDemo()")
        page.wait_for_function("S.records.length >= 6", timeout=30000)
        page.evaluate("""async id => {
          await new Promise(done => { const o = indexedDB.open('sehat'); o.onsuccess = () => {
            const tx = o.result.transaction(['records', 'files'], 'readwrite');
            tx.objectStore('records').delete(id); tx.objectStore('files').delete(id); tx.oncomplete = done; tx.onerror = done; }; o.onerror = done; });
          S.records = S.records.filter(r => r.id !== id); S.insights = null; S.overview = {};
        }""", first)
        pause(600)
        # the profile carries the account holder's name, and the dashboard's 3D model is loaded ahead of its step
        page.evaluate("(async () => { S.patient = Object.assign({}, S.patient || {}, { name: 'Jay Tawri' }); await dbPut('meta', S.patient, 'patient'); PET.tipOff = true; S.view = 'health'; render(); })()")
        try:
            page.wait_for_selector("[data-dna] canvas", timeout=20000)
        except Exception:
            pass
        pause(1200)
        page.evaluate("PET.tipOff = true; PET.open = false; S.view = 'detail'; render(); window.scrollTo(0, 0)")
        pause(300)
        event("gap_b")

        mark("timeline")
        go('[data-act="nav"][data-view="timeline"]', 1100)
        page.mouse.move(640, 420, steps=22)
        scroll(560, gap=75)

        mark("health")
        go('[data-act="nav"][data-view="health"]', 300)
        event("gap_a")  # off camera: the moment the 3D model takes to appear
        try:
            page.wait_for_selector("[data-dna] canvas", timeout=20000)
        except Exception:
            pass
        pause(900)
        event("gap_b")
        pause(1200)
        page.mouse.move(640, 430, steps=18)
        scroll(1500, gap=58)
        pause(600)

        mark("ask")  # Saathi, the guide that floats on every screen
        page.evaluate("window.scrollTo({ top: 0, behavior: 'smooth' })")
        pause(700)
        go(".pet-btn", 900)
        typed("#petInput", "Hi", delay=110)
        go('#petForm button[type="submit"]', 1700)
        typed("#petInput", "What is my latest HbA1c?", delay=55)
        go('#petForm button[type="submit"]', 3200)

        mark("abha")
        go('[data-pet="close"]', 400)
        go('[data-act="nav"][data-view="abha"]', 900)
        typed("#abhaInput", "12345678901234", delay=55)
        go('#abhaForm button[type="submit"]', 300)
        page.wait_for_selector("#abhaOtp", timeout=20000)
        typed("#abhaOtp", "482913", delay=90)
        go('#abhaOtpForm button[type="submit"]', 900)
        go('#abhaConsentForm button[type="submit"]', 900)
        go('#abhaPickForm button[type="submit"]', 1600)
        mark("lang")  # the same screen in other languages
        go('[data-act="nav"][data-view="health"]', 1200)
        sel = page.locator("#langSel").bounding_box()
        page.mouse.move(sel["x"] + sel["width"] / 2, sel["y"] + sel["height"] / 2, steps=26)
        pause(500)
        for code in ("hi", "ta", "bn", "en"):
            page.select_option("#langSel", code)
            pause(1500)
        mark("end")
        pause(600)
        video = page.video
        ctx.close()
        browser.close()
        shutil.copyfile(video.path(), os.path.join(OUT, "session.webm"))
    stamps = _stamps(os.path.join(OUT, "session.webm"))
    if len(stamps) != len(events):
        raise SystemExit(f"found {len(stamps)} stamps in the recording for {len(events)} events; record again")
    opened = None
    for (kind, name), at in zip(events, stamps):
        if kind == "mark":
            marks.append((name, at))
        elif kind in ("wait_a", "gap_a"):
            opened = at
        elif kind == "wait_b" and at - opened > 2.6:
            cuts.append((round(opened + 1.4, 2), round(at - 0.4, 2)))  # keep the start and end of a wait
        elif kind == "gap_b":
            cuts.append((opened, at))
    with open(os.path.join(OUT, "marks.json"), "w", encoding="utf-8") as f:
        json.dump({"size": [SIZE["width"], SIZE["height"]], "marks": marks, "cuts": cuts}, f, indent=1)
    shutil.rmtree(tmp, ignore_errors=True)
    print("recorded", marks[-1][1], "s; steps:", marks, "cuts:", cuts)


if __name__ == "__main__":
    main()
