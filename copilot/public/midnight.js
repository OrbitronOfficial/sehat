/* Alternative presentation only: the clinic APIs and patient tools remain unchanged. */
(() => {
  'use strict';
  document.documentElement.classList.add('midnight');
  const pages = new Set(['/', '/landing.html', '/doctor.html', '/patient-portal.html', '/app', '/login', '/login.html', '/pricing']);
  function keepVariant() {
    document.querySelectorAll('a[href]').forEach(a => {
      if (a.dataset.original) return;
      const url = new URL(a.href, location.href);
      if (url.origin === location.origin && pages.has(url.pathname)) a.href = '/v2' + (url.pathname === '/' ? '' : url.pathname) + url.search + url.hash;
    });
  }
  keepVariant();
  let pending = false;
  new MutationObserver(() => { if (!pending) { pending = true; requestAnimationFrame(() => { pending = false; keepVariant(); }); } }).observe(document.body, {childList:true,subtree:true});
  const isLanding = /\/(?:v2\/?|v2\/landing\.html)$/.test(location.pathname);
  if (isLanding) {
    const title = document.querySelector('.hero h1');
    if (title) title.innerHTML = 'A clearer view.<br>A healthier <em>connection.</em>';
    const cta = document.querySelector('.hero .button');
    if (cta) cta.textContent = 'Explore Your Health ↗';
    const secondary = document.querySelector('.hero .text-link');
    if (secondary) { secondary.textContent = 'How It Works ↓'; secondary.href = '#how'; }
    const visual = document.querySelector('.wellness-art');
    if (visual) {
      const graphic = document.createElement('div'); graphic.className = 'molecular-scene'; graphic.setAttribute('aria-hidden', 'true');
      graphic.innerHTML = '<div class="molecule-core"></div><div class="molecule-ring ring-a"></div><div class="molecule-ring ring-b"></div><div class="molecule-ring ring-c"></div><span class="molecule-node node-a"></span><span class="molecule-node node-b"></span><span class="molecule-node node-c"></span><div class="molecule-caption">CONNECTED CARE <span>Listen · Review · Understand</span></div>';
      visual.prepend(graphic);
      visual.addEventListener('pointermove', e => { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; const box = visual.getBoundingClientRect(); graphic.style.transform = `perspective(900px) rotateY(${(e.clientX-box.left-box.width/2)/35}deg) rotateX(${-(e.clientY-box.top-box.height/2)/45}deg)`; });
      visual.addEventListener('pointerleave', () => { graphic.style.transform = ''; });
    }
  }
  const switcher = document.createElement('a'); switcher.className = 'variant-switch'; switcher.href = '/'; switcher.textContent = '← Original design'; switcher.dataset.original = 'true';
  // Keep the comparison link outside route rewriting.
  switcher.addEventListener('click', e => { e.preventDefault(); location.assign('/'); });
  document.body.append(switcher);
})();
