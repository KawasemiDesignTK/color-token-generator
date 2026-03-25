import { generateScale } from './scale.js';

// ── Semantic role mapping ─────────────────────────────────────────
export const DEFAULT_ROLE_STEPS = {
  bg: '50', label: '100', base: '500', dark: '800',
};

export const ROLE_META = {
  bg:    { label: 'bg', desc: 'セクション背景・極淡ティント' },
  label: { label: 'label', desc: 'タグ・ラベル・バッジ背景' },
  base:  { label: 'base', desc: 'ボタン・リンク等の基本色' },
  dark:  { label: 'dark', desc: '強調テキスト・ダーク調背景' },
};

// Dark mode: scale は反転参照
export const DARK_ROLE_STEPS = {
  bg: '900', label: '800', base: '400', dark: '200',
};

function buildSemanticSet(pF, sF, aF, nF, rs) {
  const isLight = rs.bg === '50';
  return {
    // Fixed
    'color-white':              '#ffffff',
    'color-black':              '#000000',
    // Base / Surface
    'color-base':               isLight ? nF['50'] : nF['900'],
    'color-surface':            isLight ? '#ffffff' : nF['800'],
    'color-border':             isLight ? nF['200'] : nF['700'],
    'color-text':               isLight ? nF['900'] : nF['50'],
    'color-text-muted':         isLight ? nF['500'] : nF['400'],
    // Primary
    'color-primary':            pF[rs.base],
    'color-primary-dark':       pF[rs.dark],
    'color-primary-bg':         pF[rs.bg],
    'color-primary-label':      pF[rs.label],
    'color-text-primary':       isLight ? pF['700'] : pF['300'],
    // Secondary
    'color-secondary':          sF[rs.base],
    'color-secondary-dark':     sF[rs.dark],
    'color-secondary-bg':       sF[rs.bg],
    'color-secondary-label':    sF[rs.label],
    'color-text-secondary':     isLight ? sF['700'] : sF['300'],
    // Accent
    'color-accent':             aF[rs.base],
    'color-accent-bg':          aF[rs.bg],
    'color-accent-dark':        aF[rs.dark],
    // Status
    'color-success': isLight ? '#22c55e' : '#4ade80',
    'color-warning': isLight ? '#f59e0b' : '#fbbf24',
    'color-error':   isLight ? '#ef4444' : '#f87171',
    'color-info':    isLight ? '#3b82f6' : '#60a5fa',
  };
}

export function generateSemanticTokens(pHex, sHex, aHex, nF, roleSteps) {
  const pF = generateScale(pHex),
    sF = generateScale(sHex),
    aF = generateScale(aHex);
  const darkRs = {
    bg:    DARK_ROLE_STEPS.bg,
    label: DARK_ROLE_STEPS.label,
    base:  roleSteps.base === '500' ? '400' : roleSteps.base,
    dark:  roleSteps.dark === '800' ? '200' : roleSteps.dark,
  };
  return {
    light: buildSemanticSet(pF, sF, aF, nF, roleSteps),
    dark:  buildSemanticSet(pF, sF, aF, nF, darkRs),
  };
}
