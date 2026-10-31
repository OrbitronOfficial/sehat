(function () {
  var ACC = "sehat_accounts", USR = "sehat_user", THEME = "sehat_theme", LANG = "sehat_lang";

  /* ---------- storage helpers ---------- */
  function read(key) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch (e) { return null; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; } catch (e) { return false; }
  }
  function remove(key) { try { localStorage.removeItem(key); } catch (e) {} }
  function readRaw(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function writeRaw(key, v) { try { localStorage.setItem(key, v); } catch (e) {} }

  function el(tag, cls, text, attrs) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  /* ---------- accounts (on-device only) ---------- */
  function hex(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join("");
  }
  function newSalt() { var a = new Uint8Array(16); crypto.getRandomValues(a); return hex(a); }
  async function hash(salt, pw) {
    if (!(window.crypto && crypto.subtle)) throw new Error("This browser cannot create accounts here (secure context needed). Try the demo account.");
    return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + pw)));
  }
  async function syncOn(email, password, name) {  // end-to-end encrypted sync; never blocks sign-in
    if (window.SehatSync) { try { await SehatSync.enable(email, password, name); } catch (e) { /* stays device-only */ } }
  }
  function cleanEmail(e) { return String(e || "").trim().toLowerCase(); }
  function validEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

  var SehatAuth = {
    async signUp(name, email, password) {
      name = String(name || "").trim();
      email = cleanEmail(email);
      if (!name) throw new Error("Please enter your name.");
      if (!validEmail(email)) throw new Error("Please enter a valid email address.");
      if (String(password || "").length < 6) throw new Error("Password must be at least 6 characters.");
      var accounts = read(ACC) || {};
      if (accounts[email]) throw new Error("That email is already registered. Try signing in.");
      var salt = newSalt();
      accounts[email] = { name: name, salt: salt, hash: await hash(salt, password) };
      if (!write(ACC, accounts)) throw new Error("Could not save the account. Browser storage looks blocked.");
      var user = { name: name, email: email, demo: false };
      write(USR, user);
      await syncOn(email, password, name);
      return user;
    },
    async signIn(email, password) {
      email = cleanEmail(email);
      var accounts = read(ACC) || {};
      var acc = accounts[email];
      if (!acc && window.SehatSync) {
        // not on this device yet: an account synced from another device opens with the same password
        var found = await SehatSync.tryCloud(email, String(password || ""));
        if (found) {
          var salt = newSalt();
          acc = accounts[email] = { name: found.name, salt: salt, hash: await hash(salt, String(password || "")) };
          write(ACC, accounts);
        }
      }
      if (!acc || (await hash(acc.salt, String(password || ""))) !== acc.hash) throw new Error("Wrong email or password.");
      var user = { name: acc.name, email: email, demo: false };
      write(USR, user);
      await syncOn(email, password, acc.name);
      return user;
    },
    demo: function () {
      var user = { name: "Jay Tawri", email: "demo@sehat.local", demo: true };
      write(USR, user);
      return user;
    },
    guest: function () { remove(USR); },
    current: function () {
      var u = read(USR);
      return u && typeof u.name === "string" ? u : null;
    },
    signOut: function () { remove(USR); remove("sehat_sync"); },
    renderNav: renderNav
  };
  window.SehatAuth = SehatAuth;

  function renderNav() {
    var u = SehatAuth.current();
    document.querySelectorAll('[data-auth="nav"]').forEach(function (box) {
      box.textContent = "";
      if (u) {
        var first = u.name.trim().split(/\s+/)[0] || u.name;
        box.appendChild(el("span", "hi", "Hi, " + first, { "data-noi18n": "" }));
        box.appendChild(el("a", "btn primary", "Open the app", { href: "/app" }));
        var out = el("button", "btn ghost", "Sign out", { type: "button" });
        out.addEventListener("click", function () { SehatAuth.signOut(); renderNav(); translate(); });
        box.appendChild(out);
      } else {
        box.appendChild(el("a", "btn ghost", "Sign in", { href: "/login" }));
        box.appendChild(el("a", "btn primary", "Try the demo", { href: "/app?demo=1" }));
      }
    });
  }

  /* ---------- theme ---------- */
  var root = document.documentElement;
  function storedTheme() { var t = readRaw(THEME); return t === "dark" || t === "light" ? t : null; }
  function systemTheme() { return window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; }
  function setTheme(t) {
    if (t !== "dark" && t !== "light") t = systemTheme();
    root.dataset.theme = t;
    writeRaw(THEME, t);
  }

  /* ---------- language ---------- */
  var LANGS = [["en", "English"], ["hi", "हिंदी"], ["bn", "বাংলা"], ["te", "తెలుగు"], ["mr", "मराठी"], ["ta", "தமிழ்"], ["gu", "ગુજરાતી"], ["kn", "ಕನ್ನಡ"], ["ml", "മലയാളം"], ["pa", "ਪੰਜਾਬੀ"]];
  var CODES = {};
  LANGS.forEach(function (l) { CODES[l[0]] = true; });
  var ATTRS = ["placeholder", "aria-label", "title"];
  var origText = new Map(), origAttr = new Map(), maps = {}, curLang = "en", ver = 0;

  function storedLang() {
    var v = readRaw(LANG);
    if (!v) return "en";
    if (v.charAt(0) === '"') { try { v = JSON.parse(v); } catch (e) {} }
    return CODES[v] ? v : "en";
  }
  function skip(node) { return !node || !!node.closest("script,style,noscript,[data-noi18n]"); }

  function apply(map) {
    var w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) {
      if (!n.nodeValue.trim() || skip(n.parentElement)) continue;
      if (!origText.has(n)) origText.set(n, n.nodeValue);
      var o = origText.get(n), t = map && map[o.replace(/\s+/g, " ").trim()];
      if (typeof t === "string" && t) {
        var m = o.match(/^(\s*)[\s\S]*?(\s*)$/);
        n.nodeValue = m[1] + t + m[2];
      } else if (n.nodeValue !== o) n.nodeValue = o;
    }
    document.querySelectorAll("[placeholder],[aria-label],[title]").forEach(function (e) {
      if (skip(e)) return;
      var rec = origAttr.get(e);
      if (!rec) { rec = {}; origAttr.set(e, rec); }
      ATTRS.forEach(function (a) {
        if (!e.hasAttribute(a)) return;
        if (!(a in rec)) rec[a] = e.getAttribute(a);
        var t = map && map[rec[a].replace(/\s+/g, " ").trim()];
        e.setAttribute(a, typeof t === "string" && t ? t : rec[a]);
      });
    });
  }
  function translate() { apply(curLang === "en" ? null : maps[curLang] || null); }

  function syncLangUI() {
    document.querySelectorAll("button[data-lang]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.lang === curLang)); });
    document.querySelectorAll("select[data-langselect]").forEach(function (s) { s.value = curLang; });
  }
  function setLang(code) {
    if (!CODES[code]) code = "en";
    writeRaw(LANG, code);
    curLang = code;
    root.lang = code;
    syncLangUI();
    if (code === "en") { apply(null); return Promise.resolve(); }
    var my = ++ver;
    var p = maps[code] ? Promise.resolve(maps[code]) :
      fetch("/i18n/site-" + code + ".json")
        .then(function (r) { return r.ok ? r.json() : {}; })
        .catch(function () { return {}; })
        .then(function (j) { maps[code] = j && typeof j === "object" ? j : {}; return maps[code]; });
    return p.then(function (m) { if (my === ver) apply(m); });
  }

  // Switching should feel instant: once the page is idle, fetch every language file in the
  // background so a later switch reads from memory instead of waiting on the network.
  function preloadLangs() {
    Object.keys(CODES).forEach(function (code, i) {
      if (code === "en" || maps[code]) return;
      setTimeout(function () {
        if (maps[code]) return;
        fetch("/i18n/site-" + code + ".json")
          .then(function (r) { return r.ok ? r.json() : {}; })
          .then(function (j) { if (!maps[code]) maps[code] = j && typeof j === "object" ? j : {}; })
          .catch(function () { /* stays on-demand */ });
      }, 150 * i);
    });
  }
  if (document.readyState === "complete") setTimeout(preloadLangs, 1200);
  else window.addEventListener("load", function () { setTimeout(preloadLangs, 1200); });

  window.SehatSite = { setLang: setLang, getLang: function () { return curLang; }, setTheme: setTheme, translate: translate };

  /* ---------- nav tools: language select + theme toggle ---------- */
  var SVG_NS = "http://www.w3.org/2000/svg";
  function themeIcons(btn) {
    btn.innerHTML = '<svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.500 4 8 8 0 1 0 20 14.500z"/></svg>' +
      '<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.500v2.500M12 19v2.500M2.500 12H5M19 12h2.500M5.200 5.200l1.800 1.800M17 17l1.800 1.800M5.200 18.800L7 17M17 7l1.800-1.800"/></svg>';
  }
  function buildTools() {
    document.querySelectorAll("[data-tools]").forEach(function (box) {
      var lab = el("label", "langsel");
      lab.appendChild(el("span", "sr", "Language"));
      var sel = el("select", null, null, { "data-noi18n": "", "data-langselect": "" });
      LANGS.forEach(function (l) { sel.appendChild(el("option", null, l[1], { value: l[0] })); });
      sel.addEventListener("change", function () { setLang(sel.value); });
      lab.appendChild(sel);
      box.appendChild(lab);
      var tb = el("button", "icon-btn", null, { type: "button", "aria-label": "Switch between light and dark theme" });
      themeIcons(tb);
      tb.addEventListener("click", function () { setTheme(root.dataset.theme === "dark" ? "light" : "dark"); });
      box.appendChild(tb);
    });
  }

  /* ---------- scroll reveal ---------- */
  function initReveal() {
    var els = document.querySelectorAll(".rv");
    var counts = new Map();
    els.forEach(function (e) {
      var n = counts.get(e.parentNode) || 0;
      counts.set(e.parentNode, n + 1);
      e.style.setProperty("--d", Math.min(n, 6) * 70 + "ms");
    });
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach(function (e) { e.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("in"); io.unobserve(x.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach(function (e) { io.observe(e); });
    // Safety net: observers can stall (background tabs, embedded previews), and content
    // must never stay invisible. Reveal whatever is on screen by position as well.
    function sweep() {
      var h = window.innerHeight || 800;
      els.forEach(function (e) {
        if (!e.classList.contains("in") && e.getBoundingClientRect().top < h * 0.94) e.classList.add("in");
      });
    }
    setTimeout(sweep, 300);
    window.addEventListener("scroll", sweep, { passive: true });
    window.addEventListener("resize", sweep);
  }

  /* ---------- Saathi guide ---------- */
  var MASCOT = '<img src="/saathi.svg" width="56" height="56" alt="">';
  var TIPS = {
    landing: "Sehat Copilot explains your prescriptions and lab reports in plain language. Try the live demo to see a sample record.",
    login: "An account is optional. The demo account opens a sample record in one click. Anything you create is kept only in this browser, on this device.",
    pricing: "Everything is free while this is a prototype. The Family and Clinic plans are planned, not built."
  };
  var QA = [
    ["What is Sehat Copilot?", "Sehat Copilot reads your prescriptions and lab reports and explains them in plain language. It is a guide to your records, not a doctor."],
    ["Is my data safe?", "Documents are sent to third-party AI services only to be read. Our server stores nothing. Your records stay on this device, and you can delete everything from the app."],
    ["Do I need an account?", "No. Guest and demo both work. An account is optional."],
    ["Is it free?", "Yes, the prototype is free. Paid plans are planned, not built."]
  ];
  function buildSaathi() {
    var page = document.body.dataset.page || "landing";
    var box = el("div", "saathi");
    box.hidden = true; // stays hidden until the stylesheet has applied, so the mascot never flashes unstyled
    var tip = el("div", "saathi-tip", "Need a hand? Ask Saathi.");
    var btn = el("button", "saathi-btn", null, { type: "button", "aria-label": "Open Saathi, your records guide", "aria-expanded": "false" });
    btn.innerHTML = MASCOT;
    var panel = el("div", "saathi-panel", null, { role: "dialog", "aria-label": "Saathi", tabindex: "-1" });
    panel.hidden = true;

    var top = el("div", "sa-top");
    var head = el("span", "sa-head"); head.innerHTML = MASCOT;
    var ttl = el("div"); ttl.appendChild(el("b", null, "Saathi")); ttl.appendChild(el("span", null, "Your records guide. Not a doctor."));
    var close = el("button", "icon-btn", null, { type: "button", "aria-label": "Close" });
    close.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    top.appendChild(head); top.appendChild(ttl); top.appendChild(close);

    var body = el("div", "sa-body");
    body.appendChild(el("div", "bub", "Hi, I am Saathi. I can answer a few questions about this page."));
    body.appendChild(el("div", "bub tip", TIPS[page] || TIPS.landing));

    var chips = el("div", "sa-chips");
    QA.forEach(function (qa) {
      var c = el("button", null, qa[0], { type: "button" });
      c.addEventListener("click", function () {
        body.appendChild(el("div", "bub me", qa[0]));
        body.appendChild(el("div", "bub", qa[1]));
        translate();
        body.scrollTop = body.scrollHeight;
      });
      chips.appendChild(c);
    });
    var foot = el("div", "sa-foot");
    // Typed questions: report questions need the app (and a sign-in), so the guide says so
    // instead of pretending to answer. Emergency wording always gets the emergency line.
    var form = el("form", "sa-form");
    var input = el("input", null, null, { type: "text", placeholder: "Type your question", "aria-label": "Type your question", autocomplete: "off" });
    form.appendChild(input);
    form.appendChild(el("button", "btn primary", "Ask", { type: "submit" }));
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var q = input.value.trim();
      if (!q) return;
      input.value = "";
      var me = el("div", "bub me", q); me.setAttribute("data-noi18n", "");
      body.appendChild(me);
      var signedIn = !!(window.SehatAuth && SehatAuth.current());
      // Product questions get a fixed answer. Questions about the person's own reports are
      // never answered here: guests are asked to sign in, signed-in users are sent to the app.
      var res = window.SehatFAQ ? SehatFAQ.answer(q) : { kind: "unknown", text: "" };
      if (res.kind === "report") {
        body.appendChild(el("div", "bub", signedIn ? SehatFAQ.TEXT.inapp : res.text));
        var row = el("div", "sa-actions");
        if (signedIn) {
          row.appendChild(el("a", "btn primary", "Open the app", { href: "/app" }));
        } else {
          row.appendChild(el("a", "btn", "Sign in", { href: "/login" }));
          var demo = el("button", "btn primary", "Use demo account", { type: "button" });
          demo.addEventListener("click", function () { SehatAuth.demo(); location.href = "/app?demo=1"; });
          row.appendChild(demo);
        }
        body.appendChild(row);
      } else {
        body.appendChild(el("div", "bub", res.text));
      }
      translate();
      body.scrollTop = body.scrollHeight;
    });
    foot.appendChild(form);
    foot.appendChild(el("a", "btn primary block", "Open the app", { href: "/app" }));

    panel.appendChild(top); panel.appendChild(body); panel.appendChild(chips); panel.appendChild(foot);
    box.appendChild(tip); box.appendChild(panel); box.appendChild(btn);
    document.body.appendChild(box);
    requestAnimationFrame(function () { requestAnimationFrame(function () { box.hidden = false; }); });

    var hideTip = function () { tip.classList.add("gone"); };
    setTimeout(hideTip, 7000 + 1000);
    function open() {
      panel.hidden = false; hideTip();
      btn.setAttribute("aria-expanded", "true");
      translate();
      panel.focus();
    }
    function shut() { panel.hidden = true; btn.setAttribute("aria-expanded", "false"); btn.focus(); }
    btn.addEventListener("click", function () { panel.hidden ? open() : shut(); });
    close.addEventListener("click", shut);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) shut(); });
  }

  /* ---------- story highlight (landing) ---------- */
  function initStory() {
    var steps = document.querySelectorAll(".step"), win = document.getElementById("stageWin");
    if (!steps.length) return;
    var busy = false;
    function update() {
      busy = false;
      var mid = (window.innerHeight || 800) * 0.5, best = null, bd = 1e9;
      steps.forEach(function (s) {
        var r = s.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bd) { bd = d; best = s; }
      });
      steps.forEach(function (s) { s.classList.toggle("on", s === best); });
      if (win && best && window.innerWidth > 980) win.setAttribute("data-step", best.getAttribute("data-step"));
      else if (win) win.setAttribute("data-step", "4");
    }
    function queue() { if (!busy) { busy = true; requestAnimationFrame(update); } }
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    update();
  }

  /* ---------- waitlist buttons (flag stays on this device) ---------- */
  function initWaitlist() {
    var KEY = "sehat_waitlist", flags = read(KEY) || {};
    document.querySelectorAll("[data-wait]").forEach(function (b) {
      var msg = b.parentNode.querySelector(".thanks");
      function show() { b.hidden = true; if (msg) msg.textContent = "Thanks, noted on this device."; translate(); }
      if (flags[b.dataset.wait]) show();
      b.addEventListener("click", function () { flags[b.dataset.wait] = true; write(KEY, flags); show(); });
    });
  }

  /* ---------- dashboard preview (landing) ---------- */
  function initPreview() {
    var win = document.getElementById("demoWin");
    if (!win) return;
    var tabs = Array.prototype.slice.call(win.querySelectorAll('[role="tab"]'));
    var chart = document.getElementById("demoChart");
    function go(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).classList.toggle("cur", on);
      });
      if (focus) tab.focus();
      if (chart) {
        chart.classList.remove("draw");
        if (tab.id === "dt-tim") { void chart.getBoundingClientRect(); chart.classList.add("draw"); }
      }
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { go(t, false); });
      t.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
        else if (e.key === "ArrowLeft") n = tabs[(i + tabs.length - 1) % tabs.length];
        else if (e.key === "Home") n = tabs[0];
        else if (e.key === "End") n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); go(n, true); }
      });
    });
    var rows = win.querySelectorAll("[data-pick]"), expls = win.querySelectorAll(".expl");
    rows.forEach(function (r) {
      r.addEventListener("click", function () {
        rows.forEach(function (x) { x.setAttribute("aria-pressed", String(x === r)); });
        expls.forEach(function (x) { x.hidden = x.getAttribute("data-for") !== r.getAttribute("data-pick"); });
      });
    });
  }

  /* ---------- language wheel and ECG timeline (landing) ---------- */
  var WHEEL = ["Understand your own health records", "अपने स्वास्थ्य रिकॉर्ड को समझें", "নিজের স্বাস্থ্য রিপোর্ট বুঝুন", "మీ ఆరోగ్య రికార్డులను అర్థం చేసుకోండి", "तुमचे आरोग्य रेकॉर्ड समजून घ्या", "உங்கள் உடல்நலப் பதிவுகளைப் புரிந்துகொள்ளுங்கள்", "તમારા આરોગ્ય રેકોર્ડ સમજો", "ನಿಮ್ಮ ಆರೋಗ್ಯ ದಾಖಲೆಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ", "നിങ്ങളുടെ ആരോഗ്യ രേഖകൾ മനസ്സിലാക്കൂ", "ਆਪਣੇ ਸਿਹਤ ਰਿਕਾਰਡ ਸਮਝੋ"];
  var WHEEL_L = ["en", "hi", "bn", "te", "mr", "ta", "gu", "kn", "ml", "pa"];
  function initWheel() {
    var w = document.getElementById("wheel");
    if (!w) return;
    var idx = 0, tok = 0, paused = false;
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    function set(n) { idx = n; w.textContent = WHEEL[n]; w.lang = WHEEL_L[n]; }
    function show(n) {
      var my = ++tok;
      w.classList.add("out");
      setTimeout(function () {
        if (my !== tok) return;
        set(n);
        w.style.transition = "none"; w.style.transform = "translateY(14px)";
        void w.offsetHeight;
        w.style.transition = ""; w.style.transform = "";
        w.classList.remove("out");
      }, 380);
    }
    var chips = document.querySelectorAll(".langs button[data-lang]");
    if (reduce) {
      var sync = function () { set(Math.max(0, WHEEL_L.indexOf(SehatSite.getLang()))); };
      setTimeout(sync, 0);
      chips.forEach(function (b) { b.addEventListener("click", function () { setTimeout(sync, 0); }); });
      return;
    }
    function tick() { if (!paused && !document.hidden) show((idx + 1) % WHEEL.length); setTimeout(tick, 2600); }
    setTimeout(tick, 2200);
    chips.forEach(function (b) {
      var on = function () { paused = true; var n = WHEEL_L.indexOf(b.dataset.lang); if (n >= 0 && n !== idx) show(n); };
      var off = function () { paused = false; };
      b.addEventListener("mouseenter", on); b.addEventListener("focus", on);
      b.addEventListener("mouseleave", off); b.addEventListener("blur", off);
    });
  }
  function initEcg() {
    var box = document.getElementById("ecgBox");
    if (!box) return;
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    function go() { box.classList.add("in"); }
    if (reduce || !("IntersectionObserver" in window)) { go(); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { go(); io.disconnect(); } });
    }, { threshold: 0.4 });
    io.observe(box);
    // Safety net: if the observer stalls, still draw once the box is well on screen.
    function sweep() {
      if (box.classList.contains("in")) return;
      var r = box.getBoundingClientRect(), h = window.innerHeight || 800;
      if (r.top < h * 0.7 && r.bottom > 0) go();
    }
    setTimeout(sweep, 400);
    window.addEventListener("scroll", sweep, { passive: true });
  }

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    renderNav();
    buildTools();
    buildSaathi();
    initReveal();
    initStory();
    initPreview();
    initWheel();
    initEcg();
    initWaitlist();
    var nav = document.getElementById("nav");
    if (nav) {
      var f = function () { nav.classList.toggle("scrolled", window.scrollY > 10); };
      window.addEventListener("scroll", f, { passive: true });
      f();
    }
    document.querySelectorAll("button[data-lang]").forEach(function (b) {
      b.addEventListener("click", function () { setLang(b.dataset.lang); });
    });
    if (window.matchMedia) {
      var mq = matchMedia("(prefers-color-scheme: dark)");
      var onSys = function () { if (!storedTheme()) root.dataset.theme = systemTheme(); };
      if (mq.addEventListener) mq.addEventListener("change", onSys);
    }
    var l = storedLang();
    curLang = l;
    syncLangUI();
    if (l !== "en") setLang(l); else root.lang = "en";
  });
})();

/* Text added after load (form errors, the guide's answers, the waitlist note) is translated
   too. Only added nodes are watched, so the translation pass cannot trigger itself. */
(function () {
  function watch() {
    if (!window.SehatSite || !window.MutationObserver || !document.body) return;
    var timer;
    new MutationObserver(function () {
      clearTimeout(timer);
      timer = setTimeout(function () { if (SehatSite.getLang() !== "en") SehatSite.translate(); }, 60);
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watch); else watch();
})();

/* The DNA helix (dna3d.js) is decoration: fetched after the page is idle, and only on pages that have a place for it. */
(function () {
  function load() {
    if (!document.querySelector("[data-dna]")) return;
    var m = document.createElement("script"); m.type = "module"; m.src = "/dna3d.js"; document.head.appendChild(m);
  }
  if (document.readyState === "complete") setTimeout(load, 1500); else window.addEventListener("load", function () { setTimeout(load, 1500); });
})();
