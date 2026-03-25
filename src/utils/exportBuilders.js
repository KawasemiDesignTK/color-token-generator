import { hexToRgb } from './colorMath.js';
import { STEP_KEYS } from './scale.js';
import { generateScale, generateNeutral } from './scale.js';
import { generateSemanticTokens } from './semantic.js';
import { buildGradientCSS } from './gradient.js';

// ── Export ────────────────────────────────────────────────────────
export const EXPORT_FORMATS = ['CSS Variables', 'SCSS', 'Tailwind', 'JSON', 'theme.json', 'Figma Variables'];

// themeMode: "light" | "dark" | "both"
export function buildExport(format, pHex, sHex, aHex, steps, roleSteps, themeMode = 'both', gradients = []) {
  const pF = generateScale(pHex),
    sF = generateScale(sHex),
    aF = generateScale(aHex),
    nF = generateNeutral(pHex);
  const keys = STEP_KEYS[steps];
  const scaleMap = { primary: pF, secondary: sF, accent: aF, neutral: nF };
  const filtered = Object.fromEntries(
    Object.entries(scaleMap).map(([n, f]) => [n, keys.map((k) => ({ key: k, hex: f[k] }))])
  );
  const { light: semL, dark: semD } = generateSemanticTokens(pHex, sHex, aHex, nF, roleSteps);

  const useLight = themeMode === 'light' || themeMode === 'both';
  const useDark = themeMode === 'dark' || themeMode === 'both';

  if (format === 'CSS Variables') {
    // Build set of exported primitive step keys for var() reference validation
    const primSet = new Set();
    for (const [n, sc] of Object.entries(filtered))
      sc.forEach(({ key }) => primSet.add(`--color-${n}-${key}`));

    // Build semantic → var() reference maps (only when primitive step exists)
    const buildRefs = (rs, isLight) => {
      const ref = (scale, step) => {
        const varName = `--color-${scale}-${step}`;
        return primSet.has(varName) ? `var(${varName})` : null;
      };
      return {
        'color-base':               ref('neutral', isLight ? '50' : '900'),
        'color-surface':            isLight ? null : ref('neutral', '800'),
        'color-border':             ref('neutral', isLight ? '200' : '700'),
        'color-text':               ref('neutral', isLight ? '900' : '50'),
        'color-text-muted':         ref('neutral', isLight ? '500' : '400'),
        'color-primary':            ref('primary', rs.base),
        'color-primary-dark':       ref('primary', rs.dark),
        'color-primary-bg':         ref('primary', rs.bg),
        'color-primary-label':      ref('primary', rs.label),
        'color-text-primary':       ref('primary', isLight ? '700' : '300'),
        'color-secondary':          ref('secondary', rs.base),
        'color-secondary-dark':     ref('secondary', rs.dark),
        'color-secondary-bg':       ref('secondary', rs.bg),
        'color-secondary-label':    ref('secondary', rs.label),
        'color-text-secondary':     ref('secondary', isLight ? '700' : '300'),
        'color-accent':             ref('accent', rs.base),
        'color-accent-bg':          ref('accent', rs.bg),
        'color-accent-dark':        ref('accent', rs.dark),
      };
    };
    const lightRefs = buildRefs(roleSteps, true);
    const darkRs = {
      bg:    '900', label: '800',
      base:  roleSteps.base === '500' ? '400' : roleSteps.base,
      dark:  roleSteps.dark === '800' ? '200' : roleSteps.dark,
    };
    const darkRefs = buildRefs(darkRs, false);

    const l = [`:root {`, `  /* ── Primitive (${steps}-step) ─────────── */`];
    for (const [n, sc] of Object.entries(filtered))
      sc.forEach(({ key, hex }) => l.push(`  --color-${n}-${key}: ${hex};`));
    if (useLight) {
      l.push(``, `  /* ── Semantic · Light Mode ──────────── */`);
      for (const [k, v] of Object.entries(semL))
        l.push(`  --${k}: ${lightRefs[k] || v};`);
    }
    l.push(`}`);
    if (useDark) {
      const selector = themeMode === 'dark' ? `:root` : `[data-theme="dark"]`;
      l.push(``, `${selector} {`, `  /* ── Semantic · Dark Mode ───────────── */`);
      for (const [k, v] of Object.entries(semD))
        l.push(`  --${k}: ${darkRefs[k] || v};`);
      l.push(`}`);
    }
    return l.join('\n');
  }
  if (format === 'SCSS') {
    const l = [`// ── Primitive (${steps}-step) ──────────────────`];
    for (const [n, sc] of Object.entries(filtered))
      sc.forEach(({ key, hex }) => l.push(`$color-${n}-${key}: ${hex};`));
    if (useLight) {
      l.push(``, `// ── Semantic · Light ────────────────────────`);
      for (const [k, v] of Object.entries(semL))
        l.push(`$${k}${themeMode === 'both' ? '-light' : ''}: ${v};`);
    }
    if (useDark) {
      l.push(``, `// ── Semantic · Dark ─────────────────────────`);
      for (const [k, v] of Object.entries(semD))
        l.push(`$${k}${themeMode === 'both' ? '-dark' : ''}: ${v};`);
    }
    return l.join('\n');
  }
  if (format === 'Tailwind') {
    const colors = {};
    for (const [n, sc] of Object.entries(filtered)) {
      colors[n] = {};
      sc.forEach(({ key, hex }) => {
        colors[n][key] = hex;
      });
    }
    const note =
      themeMode === 'both'
        ? "darkMode: 'class',"
        : themeMode === 'dark'
          ? '// dark-only tokens'
          : '// light-only tokens';
    return `// tailwind.config.js\n${note}\nmodule.exports = {\n  darkMode: 'class',\n  theme: {\n    extend: {\n      colors: ${JSON.stringify(colors, null, 6)}\n    }\n  }\n}`;
  }
  if (format === 'JSON') {
    const prim = {};
    for (const [n, sc] of Object.entries(filtered)) {
      prim[n] = {};
      sc.forEach(({ key, hex }) => {
        prim[n][key] = { value: hex, type: 'color' };
      });
    }
    const sl = {},
      sd = {};
    for (const [k, v] of Object.entries(semL)) sl[k] = { value: v, type: 'color' };
    for (const [k, v] of Object.entries(semD)) sd[k] = { value: v, type: 'color' };
    const semantic =
      themeMode === 'both' ? { light: sl, dark: sd } : themeMode === 'light' ? sl : sd;
    return JSON.stringify({ primitive: prim, semantic }, null, 2);
  }
  if (format === 'theme.json') {
    const semTokens = useLight ? semL : semD;
    const slugMap = {
      'color-white': { slug: 'white', name: 'White' },
      'color-black': { slug: 'black', name: 'Black' },
      'color-base': { slug: 'base', name: 'Base' },
      'color-surface': { slug: 'surface', name: 'Surface' },
      'color-border': { slug: 'border', name: 'Border' },
      'color-text': { slug: 'text', name: 'Text' },
      'color-text-muted': { slug: 'text-muted', name: 'Text Muted' },
      'color-primary': { slug: 'primary', name: 'Primary' },
      'color-primary-dark': { slug: 'primary-dark', name: 'Primary Dark' },
      'color-primary-bg': { slug: 'primary-bg', name: 'Primary Background' },
      'color-primary-label': { slug: 'primary-label', name: 'Primary Label' },
      'color-text-primary': { slug: 'text-primary', name: 'Text Primary' },
      'color-secondary': { slug: 'secondary', name: 'Secondary' },
      'color-secondary-dark': { slug: 'secondary-dark', name: 'Secondary Dark' },
      'color-secondary-bg': { slug: 'secondary-bg', name: 'Secondary Background' },
      'color-secondary-label': { slug: 'secondary-label', name: 'Secondary Label' },
      'color-text-secondary': { slug: 'text-secondary', name: 'Text Secondary' },
      'color-accent': { slug: 'accent', name: 'Accent' },
      'color-accent-bg': { slug: 'accent-bg', name: 'Accent Background' },
      'color-accent-dark': { slug: 'accent-dark', name: 'Accent Dark' },
      'color-success': { slug: 'success', name: 'Success' },
      'color-warning': { slug: 'warning', name: 'Warning' },
      'color-error': { slug: 'error', name: 'Error' },
      'color-info': { slug: 'info', name: 'Info' },
    };
    const palette = Object.entries(semTokens)
      .filter(([k]) => slugMap[k])
      .map(([k, hex]) => ({ slug: slugMap[k].slug, color: hex, name: slugMap[k].name }));
    const colorSettings = { palette };
    if (gradients.length > 0) {
      colorSettings.gradients = gradients.map(g => ({
        name: g.name, slug: g.slug, gradient: buildGradientCSS(g),
      }));
    }
    return JSON.stringify({
      "$schema": "https://schemas.wp.org/trunk/theme.json",
      version: 3,
      settings: { color: colorSettings },
    }, null, 2);
  }
  if (format === 'Figma Variables') {
    const toRgb = (hex) => {
      const [r, g, b] = hexToRgb(hex).map((v) => v / 255);
      return { r, g, b, a: 1 };
    };
    const primE = [];
    for (const [n, sc] of Object.entries(filtered))
      sc.forEach(({ key, hex }) => primE.push([`${n}/${key}`, hex]));
    const primVars = primE.map(([name, hex]) => ({
      name,
      resolvedType: 'COLOR',
      valuesByMode: { '1': toRgb(hex) },
    }));
    const lE = Object.entries(semL).map(([k, v]) => [
      k.replace(/^color-/, '').replace(/-/g, '/'),
      v,
    ]);
    const dE = Object.entries(semD).map(([k, v]) => [
      k.replace(/^color-/, '').replace(/-/g, '/'),
      v,
    ]);
    let semModes, semVars;
    if (themeMode === 'both') {
      semModes = [
        { modeId: 'L', name: 'Light' },
        { modeId: 'D', name: 'Dark' },
      ];
      semVars = lE.map(([name, lh]) => {
        const dh = dE.find(([n]) => n === name)?.[1] || '#ffffff';
        return {
          name,
          resolvedType: 'COLOR',
          valuesByMode: { L: toRgb(lh), D: toRgb(dh) },
        };
      });
    } else if (themeMode === 'light') {
      semModes = [{ modeId: 'L', name: 'Light' }];
      semVars = lE.map(([name, hex]) => ({
        name,
        resolvedType: 'COLOR',
        valuesByMode: { L: toRgb(hex) },
      }));
    } else {
      semModes = [{ modeId: 'D', name: 'Dark' }];
      semVars = dE.map(([name, hex]) => ({
        name,
        resolvedType: 'COLOR',
        valuesByMode: { D: toRgb(hex) },
      }));
    }
    return JSON.stringify(
      {
        version: '1.0',
        collections: [
          {
            name: 'Primitive',
            modes: [{ modeId: '1', name: 'Value' }],
            defaultModeId: '1',
            variables: primVars,
          },
          {
            name: 'Semantic',
            modes: semModes,
            defaultModeId: semModes[0].modeId,
            variables: semVars,
          },
        ],
      },
      null,
      2
    );
  }
}
