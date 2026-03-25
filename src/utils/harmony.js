import { hexToHsl, hslToHex } from './colorMath.js';

// ── Harmony ───────────────────────────────────────────────────────
export function getHarmonyPatterns(primaryHex) {
  const [h, s, l] = hexToHsl(primaryHex);
  const sl = Math.max(30, s - 5),
    ll = Math.min(65, l + 3);
  return {
    secondary: [
      { id: 's1', name: 'コンプリメンタリー', desc: '補色 180°', hex: hslToHex((h + 180) % 360, sl, ll) },
      { id: 's2', name: 'アナロガス', desc: '類似色 +30°', hex: hslToHex((h + 30) % 360, sl, ll) },
      { id: 's3', name: 'スプリット補色', desc: '分裂補色 +150°', hex: hslToHex((h + 150) % 360, sl, ll) },
    ],
    accent: [
      { id: 'a1', name: 'トライアド', desc: '三角配色 +120°', hex: hslToHex((h + 120) % 360, Math.min(90, s + 10), Math.min(60, l)) },
      { id: 'a2', name: 'テトラッド', desc: '四角配色 +90°', hex: hslToHex((h + 90) % 360, Math.min(90, s + 10), Math.min(58, l)) },
      { id: 'a3', name: 'スプリット補色 B', desc: '分裂補色 +210°', hex: hslToHex((h + 210) % 360, Math.min(90, s + 15), Math.min(60, l - 2)) },
    ],
  };
}
