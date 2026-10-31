"""Records the Sehat demo clips from the running app. usage: python rec.py [clip ...]  (default: all)
Needs the local server: python copilot/server.py 2402. Uses room VIDEO so the live demo room stays clean."""
import os, sys, time, shutil, tempfile
from playwright.sync_api import sync_playwright

BASE = "http://localhost:2402"
HERE = os.path.dirname(os.path.abspath(__file__))
SIZE = {"width": 1600, "height": 900}
SAMPLE = os.path.join(HERE, "..", "..", "copilot", "public", "samples", "prescription-2026-03.png")
# a visible cursor with a click ripple, and light theme in room VIDEO
CURSOR = r"""
(() => {
  try { localStorage.setItem('sehat_theme', 'light'); localStorage.setItem('sehat_room', 'VIDEO'); localStorage.setItem('sehat_lang', 'en'); } catch (e) {}
  const start = () => {
    if (document.getElementById('__cur')) return;
    const st = document.createElement('style');
    st.textContent = '@keyframes __rip{from{transform:translate(-50%,-50%) scale(.3);opacity:.6}to{transform:translate(-50%,-50%) scale(1);opacity:0}}.__rip{position:fixed;width:70px;height:70px;border-radius:50%;background:rgba(7,116,196,.25);border:2px solid rgba(7,116,196,.8);pointer-events:none;z-index:2147483646;animation:__rip .55s ease-out forwards}';
    document.documentElement.appendChild(st);
    const c = document.createElement('div'); c.id = '__cur';
    c.style.cssText = 'position:fixed;left:0;top:0;width:24px;height:32px;z-index:2147483647;pointer-events:none;transform:translate(800px,450px)';
    c.innerHTML = '<svg viewBox="0 0 24 32" width="24" height="32"><path d="M2 1v24l6.5-6 4.5 11 4-1.7-4.5-10.6H22z" fill="#fff" stroke="#0F172A" stroke-width="1.8" stroke-linejoin="round"/></svg>';
    document.documentElement.appendChild(c);
    document.addEventListener('mousemove', e => { c.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)'; }, true);
    document.addEventListener('mousedown', e => { const r = document.createElement('div'); r.className = '__rip'; r.style.left = e.clientX + 'px'; r.style.top = e.clientY + 'px'; document.documentElement.appendChild(r); setTimeout(() => r.remove(), 600); }, true);
  };
  if (document.documentElement) start();
  document.addEventListener('DOMContentLoaded', start);
})();
"""


class Rec:
    def __init__(self, pw, name):
        self.pw, self.name, self.tmp = pw, name, tempfile.mkdtemp(prefix="sehat_vid_")

    def __enter__(self):
        self.browser = self.pw.chromium.launch(headless=True)
        self.ctx = self.browser.new_context(viewport=SIZE, record_video_dir=self.tmp, record_video_size=SIZE, color_scheme="light")
        self.ctx.add_init_script(CURSOR)
        self.page = self.ctx.new_page()
        self.page.on("dialog", lambda d: d.accept())
        return self

    def pause(self, ms): self.page.wait_for_timeout(ms)

    def move(self, sel, nth=0, steps=28):
        el = self.page.locator(sel).nth(nth); el.scroll_into_view_if_needed(); b = el.bounding_box()
        self.page.mouse.move(b["x"] + b["width"] / 2, b["y"] + b["height"] / 2, steps=steps); return el

    def click(self, sel, after=600, nth=0):
        el = self.move(sel, nth); self.pause(150); el.click(delay=70); self.pause(after)

    def scroll(self, total, step=40, gap=28):
        for _ in range(abs(total) // step): self.page.mouse.wheel(0, step if total > 0 else -step); self.pause(gap)
        self.pause(300)

    def js(self, code): return self.page.evaluate(code)

    def __exit__(self, *a):
        v = self.page.video; self.ctx.close(); vp = v.path(); self.browser.close()
        os.makedirs(os.path.join(HERE, "clips"), exist_ok=True)
        shutil.copyfile(vp, os.path.join(HERE, "clips", self.name + ".webm")); shutil.rmtree(self.tmp, ignore_errors=True)
        print("recorded", self.name)


def reset_room(pw):
    """Fresh demo data in room VIDEO before recording."""
    b = pw.chromium.launch(headless=True); c = b.new_context(); c.add_init_script(CURSOR); p = c.new_page()
    p.goto(BASE + "/hub/demo.html?room=VIDEO"); p.wait_for_timeout(4000)
    p.evaluate("Store.reset()"); p.wait_for_timeout(2500); b.close()


def home(r):
    r.page.goto(BASE + "/?room=VIDEO"); r.pause(3500)
    r.page.mouse.move(1100, 420, steps=30); r.pause(2500)
    r.scroll(900); r.pause(2500); r.scroll(1000); r.pause(1800); r.scroll(1200); r.pause(1500)


def login(r):
    r.page.goto(BASE + "/hub/login.html?room=VIDEO"); r.pause(2500)
    r.page.mouse.move(420, 640, steps=40); r.pause(1800)
    r.click(".rb >> nth=1", 300)  # Doctor demo account: types, signs in, flips to live stats
    r.pause(5500)


def demo(r):
    r.page.goto(BASE + "/hub/demo.html?room=VIDEO"); r.pause(5000)
    r.click("#autoBtn", 500)
    t = time.time()
    while time.time() - t < 80:
        r.pause(1000)
        if r.js("!autoOn"): break
    r.pause(2500)


def records(r):
    r.page.goto(BASE + "/hub/app.html?role=patient&view=sehat_copilot&room=VIDEO"); r.pause(3000)
    r.click(".tabs button >> nth=0", 800)
    r.page.set_input_files("#oc_f", SAMPLE); r.pause(600)
    r.move("#lb_l"); r.page.select_option("#lb_l", "hi"); r.pause(700)
    r.click("text=Read with AI", 500)
    t = time.time()
    while time.time() - t < 70:
        r.pause(1000)
        if r.js("!!document.querySelector('#oc_x .rc-sec, #oc_x p:not(.muted)')"): break
    r.pause(1500); r.page.mouse.move(1150, 500, steps=30); r.scroll(500); r.pause(3500)


def journal(r):
    r.page.goto(BASE + "/hub/app.html?role=patient&view=sehat_copilot&room=VIDEO"); r.pause(2500)
    r.click(".tabs button >> text=Journal", 1500)
    r.scroll(380); r.click(".jx2 .moods button >> nth=3", 500); r.click(".jx2 .chips button >> text=Headache", 500)
    r.click(".jx2 .habit >> nth=0", 2600); r.click("#jModal >> text=Add to today's plan", 1500); r.click(".jd-x", 1200)
    r.pause(1200)


def senior(r):
    r.page.goto(BASE + "/hub/app.html?role=patient&view=sehat_copilot&room=VIDEO"); r.pause(2500)
    r.js("Store.update(d=>{d.reminders=d.reminders.filter(x=>x.who!=='Sunita Mehra');['08:30','14:00','21:00'].forEach((t,i)=>d.reminders.push({med:['Amlodipine 5mg','Pantoprazole 40mg','Atorvastatin 10mg'][i],time:t,who:'Sunita Mehra',taken:[]}))});"
         "useSenior('Sunita Mehra', true); setP('Sunita Mehra','vlang','hi'); go('sehat_copilot');")
    r.pause(3500); r.page.mouse.move(700, 470, steps=30); r.pause(1500)
    r.click(".sr .tk", 2500)
    r.move(".sr .hd select"); r.page.select_option(".sr .hd select", "ta"); r.pause(3000)
    r.page.select_option(".sr .hd select", "pa"); r.pause(3000)
    r.js("useSenior('Sunita Mehra', false)"); r.pause(300)


# opening trio: the same booking seen by a patient, the doctor and the pharmacy
def tp(r):
    r.page.goto(BASE + "/hub/app.html?role=patient&view=sehat_copilot&room=VIDEO"); r.pause(2500)
    r.click(".tabs button >> text=Book", 1500)
    r.move("#ap_sug .row >> nth=0"); r.pause(1500)
    r.click("#ap_sug .row button >> nth=0", 2500); r.scroll(300); r.pause(2000)


def td(r):
    r.page.goto(BASE + "/hub/app.html?role=doctor&view=sehat_doctor&room=VIDEO"); r.pause(3000)
    r.move(".card h3 >> nth=0"); r.pause(1200)
    r.move("button[onclick='csSave()']"); r.pause(400); r.js("csSave()"); r.pause(2200)
    r.move("button[onclick='rxSend()']"); r.pause(400); r.js("rxSend()"); r.pause(2500)


def tph(r):
    r.page.goto(BASE + "/hub/app.html?role=pharmacy&view=sehat_pharmacy&room=VIDEO"); r.pause(3000)
    r.move(".card h3 >> nth=0"); r.pause(1200)
    r.move("button:has-text('send bill')"); r.pause(400); r.js("rxAccept(Store.db.prescriptions.find(p=>p.status==='sent').id)"); r.pause(2500); r.scroll(200); r.pause(2000)


CLIPS = {"home": home, "login": login, "demo": demo, "records": records, "journal": journal, "senior": senior, "tp": tp, "td": td, "tph": tph}
if __name__ == "__main__":
    names = sys.argv[1:] or list(CLIPS)
    with sync_playwright() as pw:
        if "demo" in names or "tp" in names or not sys.argv[1:]: reset_room(pw)
        for n in names:
            with Rec(pw, n) as r: CLIPS[n](r)
