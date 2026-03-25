import { hexToHsl, hslToHex } from './colorMath.js';

// ── Scale ─────────────────────────────────────────────────────────
export const SCALE_STEP_OPTIONS = [
  '50', '100', '200', '300', '400', '500', '600', '700', '800', '900',
];

export const STEP_KEYS = {
  4: ['100', '300', '500', '700'],
  6: ['50', '100', '300', '500', '700', '900'],
  10: ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
};

export const STEP_LABELS = {
  4: { short: '4段階', long: '簡易版', desc: 'LP・小規模サイト向け' },
  6: { short: '6段階', long: '標準', desc: '中小規模サイト向け（推奨）' },
  10: { short: '10段階', long: 'フル', desc: 'デザインシステム・Tailwind互換' },
};

export function generateScale(hex) {
  const [h, s, baseL] = hexToHsl(hex);
  const defs = {
    '50':  { l: Math.min(97, baseL + 42), sv: Math.max(5, s * 0.25) },
    '100': { l: Math.min(95, baseL + 33), sv: Math.max(8, s * 0.4) },
    '200': { l: Math.min(90, baseL + 22), sv: Math.max(15, s * 0.6) },
    '300': { l: Math.min(82, baseL + 12), sv: Math.max(20, s * 0.75) },
    '400': { l: Math.min(72, baseL + 4), sv: Math.max(25, s * 0.9) },
    '500': { l: baseL, sv: s },
    '600': { l: Math.max(10, baseL - 10), sv: Math.min(100, s * 1.05) },
    '700': { l: Math.max(8, baseL - 20), sv: Math.min(100, s * 1.1) },
    '800': { l: Math.max(6, baseL - 30), sv: Math.min(100, s * 1.15) },
    '900': { l: Math.max(4, baseL - 40), sv: Math.min(100, s * 1.15) },
  };
  const full = {};
  for (const [key, { l, sv }] of Object.entries(defs))
    full[key] = hslToHex(h, Math.min(100, Math.max(0, sv)), Math.max(2, Math.min(97, l)));
  return full;
}

export function filterScale(full, steps) {
  return STEP_KEYS[steps].map((key) => ({ key, hex: full[key] }));
}

export function generateNeutral(primaryHex) {
  const [h, s] = hexToHsl(primaryHex);
  const ns = Math.min(7, s * 0.07);
  return Object.fromEntries(
    [
      ['50', 97], ['100', 95], ['200', 88], ['300', 78], ['400', 62],
      ['500', 46], ['600', 34], ['700', 24], ['800', 15], ['900', 8],
    ].map(([k, l]) => [k, hslToHex(h, ns, l)])
  );
}
