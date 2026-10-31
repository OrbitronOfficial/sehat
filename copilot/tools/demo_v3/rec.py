"""Records demo clips for Sehat Copilot v3. usage: python rec.py front|patient|upload|doctor"""
import json, os, sys, time, shutil, tempfile
from playwright.sync_api import sync_playwright
BASE = "http://localhost:8891"
HERE = os.path.dirname(os.path.abspath(__file__))
SIZE = {"width": 1600, "height": 900}
SAMPLE = r"C:\Users\yashj\OneDrive\Documents\Claude\Tools\test-prescriptions\Sunita Mehra\08-today-lab-report.jpg"
CURSOR = r"""
(() => {
  try { localStorage.setItem('sehat_theme', 'light'); } catch (e) {}
  const start = () => {
    if (document.getElementById('__cur')) return;
    const st = document.createElement('style');
    st.textContent = '@keyframes __rip{from{transform:translate(-50%,-50%) scale(.3);opacity:.6}to{transform:translate(-50%,-50%) scale(1);opacity:0}}.__rip{position:fixed;width:70px;height:70px;border-radius:50%;background:rgba(7,116,196,.25);border:2px solid rgba(7,116,196,.8);pointer-events:none;z-index:2147483646;animation:__rip .55s ease-out forwards}';
    document.documentElement.appendChild(st);
    const c = document.createElement('div'); c.id = '__cur';
    let pos = [800, 450];
    try { pos = JSON.parse(sessionStorage.getItem('__cur') || '[800,450]'); } catch (e) {}
    c.style.cssText = 'position:fixed;left:0;top:0;width:24px;height:32px;z-index:2147483647;pointer-events:none;transform:translate(' + pos[0] + 'px,' + pos[1] + 'px)';
    c.innerHTML = '<svg viewBox="0 0 24 32" width="24" height="32"><path d="M2 1v24l6.5-6 4.5 11 4-1.7-4.5-10.6H22z" fill="#fff" stroke="#0F172A" stroke-width="1.8" stroke-linejoin="round"/></svg>';
    document.documentElement.appendChild(c);
    document.addEventListener('mousemove', e => { c.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)'; try { sessionStorage.setItem('__cur', JSON.stringify([e.clientX, e.clientY])); } catch (err) {} }, true);
    document.addEventListener('mousedown', e => { const r = document.createElement('div'); r.className = '__rip'; r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'; document.documentElement.appendChild(r); setTimeout(() => r.remove(), 600); }, true);
  };
  if (document.documentElement) start();
  document.addEventListener('DOMContentLoaded', start);
})();
"""


class Rec:
    def __init__(self, name):
        self.name = name
        self.marks = []
        self.tmp = tempfile.mkdtemp(prefix="sehat_v3_")

    def __enter__(self):
        self.pw = sync_playwright().start()
        self.browser = self.pw.chromium.launch(headless=True)
        self.ctx = self.browser.new_context(viewport=SIZE, record_video_dir=self.tmp, record_video_size=SIZE,
                                            color_scheme="light", device_scale_factor=1)
        self.ctx.add_init_script(CURSOR)
        self.page = self.ctx.new_page()
        self.page.on("dialog", lambda d: d.accept())
        self.t0 = time.time()
        return self

    def pause(self, ms):
        self.page.wait_for_timeout(ms)

    def mark(self, name):
        self.marks.append((name, round(time.time() - self.t0, 2)))

    def move_to(self, sel, nth=0, steps=30):
        el = self.page.locator(sel).nth(nth)
        el.scroll_into_view_if_needed()
        b = el.bounding_box()
        self.page.mouse.move(b["x"] + b["width"] / 2, b["y"] + b["height"] / 2, steps=steps)
        return el

    def go(self, sel, after=500, nth=0):
        el = self.move_to(sel, nth)
        self.pause(150)
        el.click(delay=70)
        self.pause(after)

    def typed(self, sel, text, delay=55):
        self.go(sel, 150)
        self.page.keyboard.type(text, delay=delay)
        self.pause(250)

    def scroll(self, total, step=50, gap=30):
        for _ in range(abs(total) // step):
            self.page.mouse.wheel(0, step if total > 0 else -step)
            self.pause(gap)
        self.pause(300)

    def __exit__(self, *a):
        self.mark("end")
        v = self.page.video
        self.ctx.close()
        vp = v.path()
        self.browser.close()
        self.pw.stop()
        dst = os.path.join(HERE, "clips")
        os.makedirs(dst, exist_ok=True)
        shutil.copyfile(vp, os.path.join(dst, self.name + ".webm"))
        json.dump(self.marks, open(os.path.join(dst, self.name + ".json"), "w"))
        shutil.rmtree(self.tmp, ignore_errors=True)
        print(self.name, self.marks)


def tipoff(r):
    r.page.evaluate("try{PET.tipOff=true; renderPet()}catch(e){}")


def front():
    with Rec("front") as r:
        p = r.page
        p.goto(BASE + "/", wait_until="domcontentloaded")
        r.pause(1500)
        r.mark("landing")
        r.scroll(3200, step=40, gap=26)
        r.pause(500)
        p.evaluate("window.scrollTo({top:0,behavior:'smooth'})")
        r.pause(1200)
        r.mark("signin")
        p.goto(BASE + "/login", wait_until="domcontentloaded")
        r.pause(1600)
        r.go("#r-doc", 1400)
        r.go("#r-pat", 1400)
        r.pause(600)


def patient():
    with Rec("patient") as r:
        p = r.page
        p.goto(BASE + "/login", wait_until="domcontentloaded")
        r.pause(800)
        r.mark("login")
        r.go("#demo", 300)
        p.wait_for_url("**/app*", timeout=30000)
        p.wait_for_function("typeof S!=='undefined' && S.ready && S.records.length>0", timeout=30000)
        tipoff(r)
        try:
            p.wait_for_selector("[data-dna] canvas", timeout=15000)
        except Exception:
            pass
        r.pause(1200)
        r.mark("dash")
        for pts in [(500, 300), (900, 260), (1100, 380), (700, 420), (520, 260), (1000, 300)]:
            p.mouse.move(*pts, steps=25)
            r.pause(250)
        r.pause(800)

        def vsc(n=600):
            def f():
                r.pause(900)
                p.mouse.move(800, 450, steps=15)
                r.scroll(n, step=40, gap=34)
                r.pause(700)
            return f

        def nav(view, name, body):
            sel = f'[data-act="nav"][data-view="{view}"]'
            try:
                if not p.locator(sel).first.is_visible():
                    r.go('[data-act="more"]', 500)
                r.go(sel, 700)
            except Exception as e:
                print("nav fallback", view, e)
                p.evaluate(f"S.view='{view}';render()")
            tipoff(r)
            r.mark(name)
            body()

        nav("timeline", "timeline", vsc(500))
        nav("health", "health", vsc(1100))

        def meds():
            r.pause(1000)
            for txt in ["Taken", "15 min", "1 h", "Skip"]:
                try:
                    loc = p.locator(f'button:has-text("{txt}")')
                    if loc.count():
                        r.move_to(f'button:has-text("{txt}")')
                        r.pause(500)
                        if txt == "Taken":
                            loc.first.click(delay=70)
                            r.pause(700)
                except Exception as e:
                    print("meds", txt, e)
            r.scroll(300)
            r.pause(500)
        nav("meds", "meds", meds)
        nav("visits", "visits", vsc(500))
        nav("journal", "journal", vsc(900))
        nav("wellness", "wellness", vsc(700))
        nav("family", "family", vsc(500))

        def ask():
            r.pause(800)
            r.typed("#askInput", "What does my latest HbA1c mean?", delay=50)
            r.go('#askForm button[type="submit"]', 300)
            r.mark("ask_wait")
            try:
                p.wait_for_function("!S.asking", timeout=60000)
            except Exception:
                pass
            r.mark("ask_done")
            r.pause(1000)
            p.evaluate("document.querySelector('#askForm')&&document.querySelector('#askForm').scrollIntoView({block:'end'})")
            r.pause(2400)
        nav("ask", "ask", ask)

        def abha():
            r.pause(1000)
            r.scroll(500, gap=36)
            r.pause(800)
        nav("abha", "abha", abha)


def upload():
    with Rec("upload") as r:
        p = r.page
        p.goto(BASE + "/app?demo=1", wait_until="domcontentloaded")
        p.wait_for_function("typeof S!=='undefined' && S.ready && S.records.length>0", timeout=30000)
        tipoff(r)
        r.pause(500)
        r.go('[data-act="nav"][data-view="add"]', 900)
        tipoff(r)
        r.mark("add")
        r.pause(1500)
        r.move_to("#drop")
        r.pause(800)
        p.set_input_files("#fileInput", SAMPLE)
        r.pause(1500)
        r.mark("wait_a")
        try:
            p.wait_for_function("S.stage==='review'", timeout=120000)
        except Exception as e:
            print("upload wait failed", e)
        r.mark("wait_b")
        tipoff(r)
        r.pause(1500)
        r.mark("review")
        r.pause(1000)
        r.scroll(400, gap=40)
        r.pause(800)
        r.scroll(-400, gap=30)
        r.pause(600)


def doctor():
    with Rec("doctor") as r:
        p = r.page
        p.goto(BASE + "/login", wait_until="domcontentloaded")
        r.pause(1000)
        r.go("#r-doc", 900)
        r.mark("docdemo")
        r.go("#docDemo", 300)
        p.wait_for_url("**/doctor.html", timeout=20000)
        r.pause(1200)
        r.mark("queue")
        for n, a, c in [("Ravi Kumar", "54", "routine follow-up"), ("Meena Sharma", "47", "fever 2 days"),
                        ("Arjun Singh", "62", "chest pain since morning")]:
            r.typed("#qName", n, 40)
            r.typed("#qAge", a, 40)
            r.typed("#qCc", c, 35)
            r.go("#qAdd", 700)
        r.mark("sorted")
        r.pause(1800)
        r.mark("start")
        r.go('[data-start]', 900)
        r.mark("notes")
        r.scroll(400, gap=30)
        r.typed("#transcript", "Patient reports chest tightness since morning, worse on climbing stairs. No fever. "
                "BP one thirty eight over ninety. Advise ECG today, tablet aspirin seventy five milligram once daily "
                "after food, review in three days.", delay=18)
        r.mark("draft_click")
        r.go("#draftBtn", 300)
        try:
            p.wait_for_function("document.querySelector('#draftCard') && getComputedStyle(document.querySelector('#draftCard')).display!=='none'", timeout=90000)
        except Exception as e:
            print("draft wait", e)
        r.mark("draft_ready")
        r.pause(1200)
        p.evaluate("document.querySelector('#draftCard').scrollIntoView({behavior:'smooth'})")
        r.pause(2500)
        r.scroll(300, gap=40)
        r.pause(1200)
        r.mark("approve")
        r.go("#approveBtn", 1500)
        r.mark("approved")
        r.pause(1500)


if __name__ == "__main__":
    globals()[sys.argv[1]]()
