export const DEFAULT_CONFIG = Object.freeze({ parallax: 0, scale: 100, panX: 0, panY: 0, vertical: 0, format: 'full', swap: false, opticalCm: 6, screenFactor: 1, cropTop: 0, interactionMode: 'move' });
export const LIMITS = { parallax: [-100, 100], scale: [40, 220], panX: [-160, 160], panY: [-120, 120], vertical: [-50, 50], opticalCm: [1, 10], screenFactor: [0.25, 4], cropTop: [0, 40] };
export const STORAGE_KEY = 'stereolab-calibration';
export function validateConfig(value) {
  const result = { ...DEFAULT_CONFIG };
  if (!value || typeof value !== 'object') return result;
  for (const [key, [min, max]] of Object.entries(LIMITS)) {
    if (typeof value[key] === 'number' && Number.isFinite(value[key])) result[key] = Math.max(min, Math.min(max, value[key]));
  }
  for (const key of ['swap']) if (typeof value[key] === 'boolean') result[key] = value[key];
  if (['full', 'half'].includes(value.format)) result.format = value.format;
  if (['move', 'separate'].includes(value.interactionMode)) result.interactionMode = value.interactionMode;
  return result; // Propiedades antiguas como showDots nunca se aplican.
}
export function opticalLayout(width, config) {
  const requested = config.opticalCm * 96 / 2.54 * config.screenFactor;
  const separation = Math.max(1, Math.min(width - 2, requested));
  return { separation, offset: (width / 2 - separation) / 2, limited: requested > width - 2 };
}
export function createPersistence(config, onStatus, storage = () => localStorage) {
  let timer;
  try {
    const saved = JSON.parse(storage().getItem(STORAGE_KEY));
    Object.assign(config, validateConfig(saved?.calibracion ?? saved?.config ?? saved));
  } catch { onStatus('Guardado no disponible o configuración inválida'); }
  function flush() {
    clearTimeout(timer);
    try { storage().setItem(STORAGE_KEY, JSON.stringify({ version: 1, config: validateConfig(config) })); onStatus('Ajustes guardados'); }
    catch { onStatus('Sin almacenamiento; ajustes en esta sesión'); }
  }
  return { flush, schedule() { clearTimeout(timer); onStatus('Guardando…'); timer = setTimeout(flush, 250); } };
}
