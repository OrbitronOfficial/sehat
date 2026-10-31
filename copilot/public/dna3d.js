/* A slowly turning DNA double helix, drawn with Three.js as a quiet decoration.

   It mounts into the first visible element carrying a `data-dna` attribute (the closing band
   of the landing page, the lead card of the app dashboard). One renderer and one canvas are
   shared and moved to wherever that element currently is. It pauses when off screen or when
   the tab is hidden, stays still under "reduce motion", and does nothing at all if WebGL is
   unavailable. Purely decorative: aria-hidden, no pointer events. */
import * as THREE from '/vendor/three.module.js';

const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

function start() {
  const canvas = document.createElement('canvas');
  canvas.className = 'dna3d';
  canvas.setAttribute('aria-hidden', 'true');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }); } catch (e) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x0a2a4a, 1.6));
  const light = new THREE.DirectionalLight(0xffffff, 1.8);
  light.position.set(3, 4, 6);
  scene.add(light);

  // two strands of beads joined by rungs: 22 base pairs over two full turns
  const helix = new THREE.Group();
  const PAIRS = 22, HEIGHT = 6.4, RADIUS = 1, TURNS = 2;
  const bead = new THREE.SphereGeometry(0.17, 20, 16);
  const strandA = new THREE.MeshStandardMaterial({ color: 0x0774c4, roughness: 0.35, metalness: 0.1 });
  const strandB = new THREE.MeshStandardMaterial({ color: 0x8ebef9, roughness: 0.35, metalness: 0.1 });
  const rungMat = new THREE.MeshStandardMaterial({ color: 0xc9defa, roughness: 0.6, transparent: true, opacity: 0.75 });
  const rung = new THREE.CylinderGeometry(0.035, 0.035, RADIUS * 2, 8);
  for (let i = 0; i < PAIRS; i++) {
    const f = i / (PAIRS - 1);
    const a = f * Math.PI * 2 * TURNS;
    const y = (f - 0.5) * HEIGHT;
    const x = Math.cos(a) * RADIUS, z = Math.sin(a) * RADIUS;
    const b1 = new THREE.Mesh(bead, strandA); b1.position.set(x, y, z);
    const b2 = new THREE.Mesh(bead, strandB); b2.position.set(-x, y, -z);
    const r = new THREE.Mesh(rung, rungMat);
    r.position.set(0, y, 0);
    r.rotation.z = Math.PI / 2;   // lay the cylinder along x, then turn it to this pair's angle
    r.rotation.y = -a;
    helix.add(b1, b2, r);
  }
  helix.rotation.z = 0.32;        // a slight lean reads better than a perfectly upright column
  scene.add(helix);

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  camera.position.set(0, 0, 13);

  let host = null, w = 0, h = 0, running = false, visible = true, last = 0;
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(es => { visible = es[es.length - 1].isIntersecting; setRunning(); })
    : null;

  function fit() {
    if (!host) return;
    const r = host.getBoundingClientRect();
    const nw = Math.max(1, Math.round(r.width)), nh = Math.max(1, Math.round(r.height));
    if (nw === w && nh === h) return;
    w = nw; h = nh;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.z = w / h < 0.6 ? 15 : 13;   // tall, narrow hosts need a little more distance
    camera.updateProjectionMatrix();
  }
  function draw(t) {
    fit();
    helix.rotation.y = reduce ? 0.6 : t / 1000 * 0.45;
    renderer.render(scene, camera);
  }
  function loop(t) {
    if (!running) return;
    if (t - last > 32) { last = t; draw(t); }
    requestAnimationFrame(loop);
  }
  function setRunning() {
    const on = !!host && visible && !document.hidden;
    if (on === running) return;
    running = on;
    if (on && !reduce) requestAnimationFrame(loop);
  }
  function mount() {
    const target = Array.from(document.querySelectorAll('[data-dna]')).find(el => el.offsetParent !== null) || null;
    if (!target) { host = null; setRunning(); return; }
    if (canvas.parentNode !== target) {
      target.appendChild(canvas);
      if (io) { io.disconnect(); io.observe(target); }
      host = target; w = h = 0; visible = true;
      draw(performance.now());   // one frame straight away, so it is never an empty box
    }
    setRunning();
  }

  new MutationObserver(mount).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('visibilitychange', setRunning);
  window.addEventListener('resize', () => { w = h = 0; if (reduce && host) requestAnimationFrame(draw); });
  mount();
}

try {
  const probe = document.createElement('canvas');
  if (probe.getContext('webgl2') || probe.getContext('webgl')) start();
} catch (e) { /* decoration only: nothing to fall back to */ }
