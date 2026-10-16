import { LIMITS } from './calibration.js';

export function createInteractions(stage, config, changed, onTap, status) {
  const pointers = new Map();
  let baseline = null;
  let tap = null;
  function rebase() {
    const points = [...pointers.values()];
    baseline = points.length ? { points: points.map(p => ({ ...p })), config: { ...config } } : null;
  }
  function apply(patch) {
    for (const [key, value] of Object.entries(patch)) {
      config[key] = LIMITS[key] ? Math.max(LIMITS[key][0], Math.min(LIMITS[key][1], value)) : value;
    }
    changed();
  }
  stage.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    stage.focus({ preventScroll: true });
    stage.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    tap = pointers.size === 1 ? { x: event.clientX, y: event.clientY, time: performance.now(), type: event.pointerType } : null;
    if (pointers.size > 1) onTap(null);
    rebase();
  });
  stage.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId)) return;
    event.preventDefault();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (tap && Math.hypot(event.clientX - tap.x, event.clientY - tap.y) > 6) { tap = null; onTap(null); }
    const points = [...pointers.values()];
    const start = baseline.points;
    const c = baseline.config;
    if (points.length >= 2) {
      const distance = p => Math.hypot(p[1].x - p[0].x, p[1].y - p[0].y);
      if (distance(start) > 5) apply({ scale: c.scale * distance(points) / distance(start) });
    } else {
      const dx = points[0].x - start[0].x, dy = points[0].y - start[0].y;
      apply(config.interactionMode === 'move' ? { panX: c.panX + dx, panY: c.panY + dy } : { parallax: c.parallax + dx * 0.5 });
    }
  }, { passive: false });
  function release(event) {
    if (!pointers.has(event.pointerId)) return;
    if (event.type === 'pointerup' && tap && performance.now() - tap.time < 350) onTap(tap.type);
    tap = null;
    pointers.delete(event.pointerId);
    rebase();
  }
  for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) stage.addEventListener(name, release);
  function move(x, y, factor = 1) {
    apply(config.interactionMode === 'move' ? { panX: config.panX + x * factor, panY: config.panY + y * factor } : { parallax: config.parallax + x * factor * 0.5 });
  }
  function toggle() { apply({ interactionMode: config.interactionMode === 'move' ? 'separate' : 'move' }); }
  let lastKey = 0;
  document.addEventListener('keydown', event => {
    if (event.target.closest?.('input,select,textarea,button,[contenteditable="true"]') || event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (!['arrowleft','arrowright','arrowup','arrowdown','m',' ','+','=','-','[',']'].includes(key)) return;
    event.preventDefault();
    const now = performance.now();
    if (now - lastKey < 40) return;
    lastKey = now;
    if (key.startsWith('arrow')) move(key === 'arrowleft' ? -2 : key === 'arrowright' ? 2 : 0, key === 'arrowup' ? -2 : key === 'arrowdown' ? 2 : 0);
    else if ((key === 'm' || key === ' ') && !event.repeat) toggle();
    else if (['+','=','-'].includes(key)) apply({ scale: config.scale + (key === '-' ? -2 : 2) });
    else if (['[',']'].includes(key)) apply({ parallax: config.parallax + (key === '[' ? -1 : 1) });
  });
  let previous = 0, wasSelect = false;
  const deadZone = value => Math.abs(value || 0) < 0.2 ? 0 : Math.sign(value) * (Math.abs(value) - 0.2) / 0.8;
  function poll(time) {
    const elapsed = Math.min(50, time - previous) / 1000;
    previous = time;
    if (!document.hidden) {
      let pads = [];
      try { pads = [...(navigator.getGamepads?.() || [])].filter(Boolean); } catch { /* API restringida */ }
      const pad = pads[0];
      if (pad) {
        const pressed = n => !!pad.buttons[n]?.pressed;
        const x = deadZone(pad.axes[0]) + Number(pressed(15)) - Number(pressed(14));
        const y = deadZone(pad.axes[1]) + Number(pressed(13)) - Number(pressed(12));
        if (x || y) move(x, y, 60 * elapsed);
        if (pressed(0) && !wasSelect) toggle();
        wasSelect = pressed(0);
        const zoom = Number(pressed(5)) - Number(pressed(4));
        const parallax = Number(pressed(7)) - Number(pressed(6));
        if (zoom || parallax) apply({ scale: config.scale + zoom * 30 * elapsed, parallax: config.parallax + parallax * 20 * elapsed });
      } else wasSelect = false;
    }
    requestAnimationFrame(poll);
  }
  window.addEventListener('gamepadconnected', () => status('Mando detectado: joystick/cruceta, A modo, LB/RB zoom, LT/RT paralaje.'));
  window.addEventListener('gamepaddisconnected', () => status('Mando desconectado. Puedes continuar con gestos o teclado.'));
  requestAnimationFrame(poll);
}
