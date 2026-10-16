import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CONFIG, validateConfig, opticalLayout, createPersistence } from '../js/calibration.js';
import { createInteractions } from '../js/interactions.js';

test('configuración valida, limita y descarta marcadores antiguos', () => {
  const config = validateConfig({ scale: 999, panX: NaN, opticalCm: 6, showDots: true, format: 'bad', swap: 'true' });
  assert.equal(config.scale, 220);
  assert.equal(config.panX, 0);
  assert.equal(config.format, 'full');
  assert.equal(config.swap, false);
  assert.equal('showDots' in config, false);
});
test('centros ópticos: 6 cm CSS, calibración y límites de pantalla', () => {
  const c = { ...DEFAULT_CONFIG };
  const layout = opticalLayout(800, c);
  assert.ok(Math.abs(layout.separation - 6 * 96 / 2.54) < 1e-9);
  assert.equal(800 / 2 - layout.offset * 2, layout.separation);
  assert.ok(opticalLayout(100, c).limited);
  assert.equal(opticalLayout(100, c).separation, 98);
  assert.equal(opticalLayout(800, { ...c, screenFactor: 2 }).separation, layout.separation * 2);
});
test('persistencia, debounce, recarga y errores de almacenamiento', async () => {
  let stored = JSON.stringify({ calibracion: { scale: 125, showDots: true, format: 'half' } });
  let writes = 0;
  const storage = () => ({ getItem: () => stored, setItem: (_, value) => { stored = value; writes++; } });
  const c = { ...DEFAULT_CONFIG };
  const p = createPersistence(c, () => {}, storage);
  assert.equal(c.scale, 125);
  c.panX = 30; c.parallax = 17; c.cropTop = 8;
  p.schedule(); p.schedule(); p.schedule();
  await new Promise(resolve => setTimeout(resolve, 300));
  assert.equal(writes, 1);
  const restored = {};
  createPersistence(restored, () => {}, storage);
  assert.deepEqual(restored, c);
  Object.assign(c, DEFAULT_CONFIG); p.flush();
  assert.deepEqual(JSON.parse(stored).config, DEFAULT_CONFIG);
  const bad = createPersistence({}, () => {}, () => { throw new Error('denied'); });
  assert.doesNotThrow(() => bad.flush());
});
test('gestos: mover, separar, pellizcar, transiciones y cancelación', () => {
  const handlers = {};
  globalThis.document = { addEventListener() {} };
  globalThis.window = { addEventListener() {} };
  globalThis.requestAnimationFrame = () => {};
  const stage = { addEventListener: (name, fn) => { handlers[name] = fn; }, focus() {}, setPointerCapture() {} };
  const c = { ...DEFAULT_CONFIG };
  let taps = 0;
  createInteractions(stage, c, () => {}, type => { if (type) taps++; }, () => {});
  const fire = (type, id, x, y) => handlers[type]({ type, button: 0, pointerId: id, clientX: x, clientY: y, pointerType: 'touch', preventDefault() {} });
  fire('pointerdown', 1, 100, 100); fire('pointermove', 1, 120, 110);
  assert.equal(c.panX, 20); assert.equal(c.panY, 10);
  fire('pointerdown', 2, 220, 110); fire('pointermove', 2, 270, 110);
  assert.equal(c.scale, 150);
  fire('pointerup', 2, 270, 110); fire('pointermove', 1, 121, 110);
  assert.equal(c.panX, 21); assert.equal(c.scale, 150);
  fire('pointercancel', 1, 121, 110); assert.equal(taps, 0);
  c.interactionMode = 'separate';
  fire('pointerdown', 1, 100, 100); fire('pointermove', 1, 120, 100);
  assert.equal(c.parallax, 10); assert.equal(c.panX, 21);
  fire('pointerup', 1, 120, 100); assert.equal(taps, 0);
});
import { readFile } from 'node:fs/promises';

test('visor conserva configuración entre fotos, UV de recorte, aspecto y libera recursos', async () => {
  class Geometry {
    constructor() {
      this.u = [0, 1, 0, 1]; this.v = [1, 1, 0, 0];
      this.uv = { count: 4, getX: i => this.u[i], setX: (i, n) => { this.u[i] = n; }, setY: (i, n) => { this.v[i] = n; } };
    }
    getAttribute() { return this.uv; }
    dispose() { this.disposed = true; }
  }
  class Material { clone() { return new Material(); } dispose() {} }
  class Mesh {
    constructor(geometry) {
      this.geometry = geometry;
      this.scale = { set: (x, y) => { this.size = { x, y }; } };
      this.position = { set: (x, y) => { this.center = { x, y }; } };
    }
  }
  class Texture { dispose() { this.disposed = true; } }
  const meshes = [];
  const engine = { sceneLeft: { add: m => meshes.push(m) }, sceneRight: { add: m => meshes.push(m) }, getSize: () => ({ width: 800, height: 400 }), requestRender() {}, onResize(fn) { fn(); }, resize() {}, dispose() {} };
  globalThis.__viewerTest = { THREE: { PlaneGeometry: Geometry, MeshBasicMaterial: Material, Mesh, Texture }, engine, opticalLayout };
  let source = await readFile(new URL('../js/viewer.js', import.meta.url), 'utf8');
  source = source.replace("import * as THREE from 'three';", 'const THREE = globalThis.__viewerTest.THREE;')
    .replace("import { createStereoScene } from './scene.js';", 'const createStereoScene = () => globalThis.__viewerTest.engine;')
    .replace("export { DEFAULT_CONFIG } from './calibration.js';", '')
    .replace("import { opticalLayout } from './calibration.js';", 'const opticalLayout = globalThis.__viewerTest.opticalLayout;');
  const { createStereoViewer } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  const config = { ...DEFAULT_CONFIG, scale: 125, panX: 20, panY: 5, cropTop: 10, parallax: 12 };
  const before = { ...config };
  const viewer = createStereoViewer({}, config);
  viewer.setImage({ naturalWidth: 2000, naturalHeight: 1000 }, 'one.jpg');
  assert.deepEqual(meshes[0].geometry.v, [0.9, 0.9, 0, 0]);
  assert.ok(Math.abs(meshes[0].size.x / meshes[0].size.y - 1000 / 900) < 1e-9);
  const old = meshes[0].geometry;
  viewer.setImage({ naturalWidth: 1600, naturalHeight: 600 }, 'two.jpg');
  assert.deepEqual(config, before);
  assert.ok(old.disposed);
  config.format = 'half'; viewer.update();
  assert.ok(Math.abs(meshes[0].size.x / meshes[0].size.y - 1600 / 540) < 1e-9);
  const left = meshes[0].geometry, right = meshes[1].geometry;
  config.swap = true; viewer.update();
  assert.equal(meshes[0].geometry, right); assert.equal(meshes[1].geometry, left);
  viewer.dispose(); assert.ok(left.disposed && right.disposed);
  delete globalThis.__viewerTest;
});
