"""Takes the app screenshots used by tools/make_intro.py into docs/shots (light theme).
Needs the local server running on :8820 and the playwright package with Chrome installed.
Run: python tools/make_shots.py"""
import os
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8820"
OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs", "shots")


def main():
    os.makedirs(OUT, exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True)
        ctx = browser.new_context(viewport={"width": 1440, "height": 900}, color_scheme="light")
        ctx.add_init_script("try { localStorage.setItem('sehat_theme', 'light'); } catch (e) {}")
        page = ctx.new_page()

        def shot(name, wait=800):
            page.wait_for_timeout(wait)
            page.screenshot(path=os.path.join(OUT, name + ".png"))

        def show(view):
            page.evaluate("PET.tipOff = true; PET.open = false; S.view = %r; render(); window.scrollTo(0, 0)" % view)

        page.goto(BASE + "/login", wait_until="load")
        shot("login", 1500)
        page.goto(BASE + "/app?demo=1", wait_until="load")  # loads the synthetic demo profile
        page.wait_for_timeout(6000)
        # show an ordinary signed-in account in the header (the records are still the synthetic samples)
        page.evaluate("localStorage.setItem('sehat_user', JSON.stringify({ name: 'Jay Tawri', email: 'jay@example.com' })); renderUser()")
        show("add")
        shot("add")
        show("timeline")
        shot("timeline")
        rid = page.evaluate("(S.records.find(r => /lab/.test(r.doc_type) && r.date > '2026-09') || S.records[0]).id")
        page.evaluate("PET.tipOff = true; S.view = 'detail'; S.detailId = %r; render(); window.scrollTo(0, 0)" % rid)
        shot("detail", 1500)
        page.click('[data-act="edit"]')  # the review screen: what was read, beside the original
        page.evaluate("window.scrollTo(0, 0)")
        shot("review", 1500)
        page.evaluate("S.draft = null; S.stage = 'idle'; S.editingId = null")
        show("health")
        shot("health", 2500)
        page.evaluate("(() => { const h = [...document.querySelectorAll('h2')].find(x => /trend/i.test(x.innerText)); "
                      "if (h) h.scrollIntoView({ block: 'start' }); window.scrollBy(0, -90); })()")
        shot("trends")
        show("ask")
        page.evaluate("S.chat = []; ask('What is my latest HbA1c?')")  # answered from the records, no model
        page.wait_for_timeout(1500)
        page.evaluate("window.scrollTo(0, 0)")
        shot("ask")
        show("abha")
        shot("abha")
        browser.close()


if __name__ == "__main__":
    main()
