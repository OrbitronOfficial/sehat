"""Browser check for reminders.js (not collected by unittest: needs Chrome + python playwright).

Start the server first:   PORT=8851 python server.py
Run:                      python tests/e2e_reminders.py
"""
import json
import sys
from playwright.sync_api import sync_playwright

URL = "http://localhost:8851/app?demo=1"
FAILS = []


def check(name, cond, extra=""):
    print(("PASS " if cond else "FAIL ") + name + ("" if cond else "  " + str(extra)))
    if not cond:
        FAILS.append(name)


SETUP = """
async () => {
  const today = todayKey();
  const mk = (id, date, extra) => normalizeRecord(Object.assign({ id, doc_type: 'prescription', title: 'Visit ' + id, date, tests: [], diagnoses: [], medicines: [], follow_up: null }, extra));
  const med = (name, frequency, duration) => ({ name, strength: '500 mg', dose: '1 tablet', frequency, timing: null, duration: duration || null, source_text: name, page: 1, confidence: 1 });
  await saveRecordLocal(mk('e2e_rx', today, { medicines: [med('Tab. Zedmet', 'twice a day'), med('Tab. Zedweek', 'once a week'), med('Tab. Zedsos', 'only when needed'), med('Tab. Zedshort', 'once a day', '5 days')], diagnoses: [{ name: 'Type 2 Diabetes', confidence: 1 }] }));
  await saveRecordLocal(mk('e2e_fu', '2026-10-07', { follow_up: 'after 3 months', diagnoses: [{ name: 'Hypertension', confidence: 1 }] }));
  await saveRecordLocal(mk('e2e_old', '2026-06-01', { follow_up: 'after 1 week', title: 'Old visit' }));
  await saveRecordLocal(mk('e2e_hi', '2026-10-01', { follow_up: '3 महीने बाद' }));
  S.insights = null; S.overview = {};
  S.records.forEach(r => (r.medicines || []).forEach(m => curSet(curKey(m), true)));
  render();
  return S.records.length;
}
"""


def main():
    with sync_playwright() as p:
        b = p.chromium.launch(channel="chrome")
        ctx = b.new_context(viewport={"width": 390, "height": 800})
        ctx.grant_permissions(["notifications"])
        pg = ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(URL)
        pg.wait_for_function("window.SehatRem && S && S.records && S.records.length > 0", timeout=15000)
        pg.evaluate(SETUP)
        pg.wait_for_function("curInsights().medicines.some(m => /zedmet/i.test(m.name))", timeout=15000)
        pg.evaluate("render()")

        # F1: calendar-month follow-ups
        r = pg.evaluate("""() => ({
          a: SehatRem.parseFU('after 3 months', '2026-10-07'), b: SehatRem.parseFU('Come back x 5 days', '2026-10-07'),
          c: SehatRem.parseFU('3 महीने बाद', '2026-10-07'), d: SehatRem.parseFU('review in 2 weeks', '2026-10-07'),
          e: SehatRem.parseFU('after 1 year', '2026-10-07'), f: SehatRem.parseFU('after 1 month', '2026-01-31') })""")
        check("F1 3 months = 7 Jan 2027", r["a"] == "2027-01-07", r)
        check("F1 x 5 days", r["b"] == "2026-10-12", r)
        check("F1 Hindi", r["c"] == "2027-01-07", r)
        check("F1 weeks/years/clamped month", (r["d"], r["e"], r["f"]) == ("2026-10-21", "2027-10-07", "2026-02-28"), r)
        card = pg.evaluate("SehatRem.apptCard()")
        check("F1 Next visit label in appts card", "Next visit: " in card and "Jan 2027" in card, card[:200])
        ev = pg.evaluate("SehatRem.allEvents().filter(e => e.title.indexOf('Follow-up') === 0).map(e => ({ t: e.title, d: e.date, a: e.allDay, g: SehatRem.gcal(e) }))")
        fu = [e for e in ev if e["d"] == "2027-01-07"]
        check("F1 gcal all-day event", fu and "dates=20270107/20270108" in fu[0]["g"] and "Follow-up%3A%20Hypertension" in fu[0]["g"], ev)
        ics = pg.evaluate("SehatRem.icsText()")
        check("F1 ics has the all-day follow-up", "DTSTART;VALUE=DATE:20270107" in ics)

        # R05 recurrence
        evs = pg.evaluate("SehatRem.allEvents().map(e => ({ t: e.title, g: SehatRem.gcal(e) }))")
        by = {e["t"].split(" ")[1]: e["g"] for e in evs if e["t"].startswith("Tab. Zed")}
        check("R05 ongoing daily has no UNTIL", "RRULE:FREQ=DAILY" in by.get("Zedmet", "") and "UNTIL" not in by.get("Zedmet", ""), by.get("Zedmet"))
        check("R05 finite course keeps UNTIL", "FREQ=DAILY;UNTIL=" in by.get("Zedshort", ""), by.get("Zedshort"))
        check("R05 weekly stays weekly", "FREQ=WEEKLY" in by.get("Zedweek", ""), by.get("Zedweek"))
        check("R05 SOS has no event", "Zedsos" not in by)
        check("R05 ics rules", "RRULE:FREQ=DAILY\r\n" in ics and "RRULE:FREQ=DAILY;UNTIL=" in ics and "RRULE:FREQ=WEEKLY\r\n" in ics)

        # R02: a newer record must not close an overdue follow-up
        ap = pg.evaluate("SehatRem.apptCard()")
        check("R02 old follow-up still listed after later records", "after 1 week" in ap)
        check("R02 link picker present", "data-rmlink" in ap)
        pg.evaluate("""() => { const el = document.createElement('div'); el.innerHTML = SehatRem.apptCard(); document.body.appendChild(el); el.id = 'tmpap'; }""")
        pg.select_option("#tmpap select[data-rmlink='e2e_old']", "e2e_rx")
        pg.wait_for_timeout(300)
        check("R02 linking a record closes it", "after 1 week" not in pg.evaluate("SehatRem.apptCard()"))
        vc = pg.evaluate("SehatRem.visitsCard()")
        check("F2 visits groups", all(x in vc for x in ("Done", "Missed", "Upcoming")) and "Visit recorded" in vc, vc[:300])
        check("F2 missed has Reschedule + Mark done", "rm_resched" in vc and "Missed (" in vc)

        # R03 + toast shortcuts
        pg.evaluate("""() => { const o = JSON.parse(localStorage.getItem('sehat_rem') || '{}'); o.t = o.t || {}; const d = buildDoses(schedMeds()).filter(x => /zedmet/i.test(x.m.name))[0];
          const n = new Date(Date.now() - 60000); o.t[d.key] = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
          localStorage.setItem('sehat_rem', JSON.stringify(o)); window.__dk = d.key; SehatRem.tick(); }""")
        toast = pg.inner_text("#rmToast")
        check("toast shows with all shortcuts", all(x in toast for x in ("Taken", "In 15 min", "In 1 hour", "Pick a time", "Skip this dose")), toast)
        pg.evaluate("SehatRem.tick()")
        check("no duplicate toast for the same dose", pg.locator("#rmToast .rm-trow").count() == 1)
        pg.click("#rmToast button:has-text('In 15 min')")
        s = pg.evaluate("JSON.parse(localStorage.getItem('sehat_rem')).s[window.__dk] - Date.now()")
        check("snooze 15 min applied", 14 * 60000 < s <= 15 * 60000, s)
        pg.evaluate("SehatRem.applyAction('at', 'self', window.__dk, '23:59')")
        s2 = pg.evaluate("JSON.parse(localStorage.getItem('sehat_rem')).s[window.__dk]")
        check("pick a time (today)", s2 and pg.evaluate("new Date(JSON.parse(localStorage.getItem('sehat_rem')).s[window.__dk]).getHours()") == 23)
        check("past time rejected", pg.evaluate("SehatRem.applyAction('at', 'self', window.__dk, '00:00')") is False)
        pg.evaluate("SehatRem.applyAction('taken', 'self', window.__dk)")
        check("taken applied", pg.evaluate("!!takenGet()[window.__dk]"))
        pg.evaluate("SehatRem.applyAction('skip', 'self', window.__dk)")
        check("skip stored", pg.evaluate("!!JSON.parse(localStorage.getItem('sehat_rem')).sk[todayKey() + window.__dk]"))

        # F4 today summary
        tc = pg.evaluate("SehatRem.todayCard()")
        check("F4 today card", "Add all my medicine reminders to Google Calendar" in tc and "taken" in tc.lower() or "of" in tc, tc[:300])

        # F3 caregiver alert for Ramesh
        pg.evaluate("""() => { const day = todayKey();
          localStorage.setItem('sehat_current@p_ramesh', JSON.stringify({ 'tab. metformin': 1 }));
          localStorage.setItem('sehat_rem@p_ramesh', JSON.stringify({ e: { 'tab. metformin': '2027-01-01' }, t: { 'tab. metformin|morning|0': '00:01' }, d: {}, s: {}, x: {}, sk: {} }));
          localStorage.removeItem('sehat_actions'); SehatRem.careScan(); }""")
        n = pg.evaluate("SehatRem.caregiverCount()")
        card = pg.evaluate("SehatRem.actionsCard()")
        check("F3 caregiver alert raised", n >= 1 and "Ramesh Tawri missed Metformin 500 mg" in card and "Call / remind" in card, (n, card[:300]))
        check("F3 honest note", "Based on what is marked in this app on this device." in card)
        pg.evaluate("window.__ev = 0; window.addEventListener('sehat:caregiver', () => window.__ev++)")
        pg.evaluate("""() => { const l = JSON.parse(localStorage.getItem('sehat_actions')); l.forEach(a => { if (a.type === 'cg') a.st = 'followed'; }); localStorage.setItem('sehat_actions', JSON.stringify(l)); }""")
        pg.evaluate("SehatRem.careScan()")
        check("F3 event fires when the count changes and count drops", pg.evaluate("window.__ev") >= 1 and pg.evaluate("SehatRem.caregiverCount()") == 0)

        # R03 profile-scoped dedupe
        keys = pg.evaluate("Object.keys(JSON.parse(localStorage.getItem('sehat_fired') || '{}').k || {})")
        check("R03 fired keys exist", len(keys) >= 1, keys)

        # R01 backup only has own profile files
        pg.evaluate("""async () => { await dbPut('files', { id: 'other_profile_doc', mime: 'text/plain', dataUrl: 'data:text/plain;base64,QQ==' });
          await dbPut('files', { id: 'e2e_rx', mime: 'text/plain', dataUrl: 'data:text/plain;base64,QQ==' }); }""")
        with pg.expect_download() as dl:
            pg.evaluate("backupDownload()")
        data = json.load(open(dl.value.path(), encoding="utf-8"))
        ids = [f["id"] for f in data["files"]]
        check("R01 backup excludes other profiles' files", "other_profile_doc" not in ids and "e2e_rx" in ids, ids)

        # service worker registers after permission
        pg.evaluate("localStorage.setItem('sehat_remind', '1')")
        pg.evaluate("SehatRem.tick()")
        pg.wait_for_timeout(1500)
        reg = pg.evaluate("navigator.serviceWorker.getRegistration().then(r => !!r)")
        check("sw registered after permission", reg)

        # mobile layout: no horizontal overflow with the toast open
        pg.evaluate("localStorage.setItem('sehat_rem', JSON.stringify({ t: {}, d: {}, e: {}, s: {}, x: {}, sk: {} }))")
        over = pg.evaluate("document.documentElement.scrollWidth > window.innerWidth + 1")
        check("390px no horizontal scroll", not over)
        check("no page errors", not errs, errs)
        b.close()
    print("\n%d failed" % len(FAILS))
    sys.exit(1 if FAILS else 0)


if __name__ == "__main__":
    main()
