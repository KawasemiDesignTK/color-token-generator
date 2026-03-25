// ── URL encode/decode for state sharing ──────────────────────────

const ROLE_ORDER = ['bg', 'label', 'base', 'dark'];

export function encodeColorState(state) {
  const p = new URLSearchParams();
  if (state.primaryHex) p.set('p', state.primaryHex.replace('#', ''));
  if (state.selSec) p.set('s', state.selSec);
  if (state.selAcc) p.set('a', state.selAcc);
  if (state.customSec) p.set('cs', state.customSec.replace('#', ''));
  if (state.customAcc) p.set('ca', state.customAcc.replace('#', ''));
  if (state.steps) p.set('n', String(state.steps));
  if (state.roleSteps) {
    const rs = state.roleSteps;
    p.set('r', ROLE_ORDER.map(k => rs[k]).join('.'));
  }
  return p.toString();
}

export function decodeColorState(search) {
  const p = new URLSearchParams(search);
  const result = {};
  const pHex = p.get('p');
  if (pHex && /^[0-9a-fA-F]{6}$/.test(pHex)) result.primaryHex = '#' + pHex;
  const s = p.get('s');
  if (s) result.selSec = s;
  const a = p.get('a');
  if (a) result.selAcc = a;
  const cs = p.get('cs');
  if (cs && /^[0-9a-fA-F]{6}$/.test(cs)) result.customSec = '#' + cs;
  const ca = p.get('ca');
  if (ca && /^[0-9a-fA-F]{6}$/.test(ca)) result.customAcc = '#' + ca;
  const n = p.get('n');
  if (n && [4, 6, 10].includes(Number(n))) result.steps = Number(n);
  const r = p.get('r');
  if (r) {
    const parts = r.split('.');
    if (parts.length === 4) {
      result.roleSteps = {};
      ROLE_ORDER.forEach((k, i) => { result.roleSteps[k] = parts[i]; });
    }
  }
  return result;
}
