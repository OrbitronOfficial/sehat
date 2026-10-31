/* Sehat Copilot v3: small presentation effects. A light that follows the cursor over the lead
   card and a gentle 3D tilt on cards. Purely visual; skipped for touch and reduced motion. */
(function () {
  'use strict';
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || matchMedia('(hover: none)').matches) return;
  const SEL = '.dash-lead, .qa, .stat';
  document.addEventListener('pointermove', e => {
    const el = e.target.closest && e.target.closest(SEL);
    if (!el) return;
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.classList.add('fx-tilt');
    const k = el.classList.contains('dash-lead') ? 3 : 5;
    el.style.setProperty('--ry', ((x - 0.5) * k).toFixed(2) + 'deg');
    el.style.setProperty('--rx', ((0.5 - y) * k).toFixed(2) + 'deg');
    el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
    el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
  }, { passive: true });
  document.addEventListener('pointerout', e => {
    const el = e.target.closest && e.target.closest(SEL);
    if (el && !el.contains(e.relatedTarget)) { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); }
  }, { passive: true });
})();
