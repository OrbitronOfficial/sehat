(() => {
  'use strict';
  const art = document.querySelector('.wellness-art');
  if (!art || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'motion-toggle';
  button.textContent = 'Pause motion';
  button.setAttribute('aria-pressed', 'false');
  // Keep the decorative sculpture separate from its accessible motion control.
  art.removeAttribute('role');
  art.removeAttribute('aria-label');
  art.querySelector('.sculpture').setAttribute('aria-hidden', 'true');
  button.addEventListener('click', () => {
    const paused = art.classList.toggle('motion-paused');
    button.setAttribute('aria-pressed', String(paused));
    button.textContent = paused ? 'Resume motion' : 'Pause motion';
  });
  art.append(button);
})();
