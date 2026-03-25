// ── Gradient Utilities ────────────────────────────────────────────
export const LINEAR_DIRECTIONS = [
  { label: '→', value: 'to right', angle: 90 },
  { label: '↓', value: 'to bottom', angle: 180 },
  { label: '↗', value: 'to top right', angle: 45 },
  { label: '↘', value: 'to bottom right', angle: 135 },
  { label: '←', value: 'to left', angle: 270 },
  { label: '↑', value: 'to top', angle: 0 },
  { label: '↖', value: 'to top left', angle: 315 },
  { label: '↙', value: 'to bottom left', angle: 225 },
];

export const GRAD_EXPORT_FORMATS = ['CSS Variables', 'SCSS', 'theme.json', 'JSON'];
export const GRAD_CATEGORIES = ['すべて', '同色系', 'カラー間', 'フェード'];

export function buildGradientCSS(grad) {
  const stops = grad.stops.map((s) => `${s.hex} ${s.pos}%`).join(', ');
  if (grad.type === 'radial') return `radial-gradient(circle, ${stops})`;
  if (grad.type === 'conic') return `conic-gradient(from ${grad.angle}deg, ${stops})`;
  return `linear-gradient(${grad.angle}deg, ${stops})`;
}

export function makePresetGradients(pF, sF, aF) {
  const tonal = (name, slug, full, from, to) => ({
    name, slug, type: 'linear', angle: 135,
    stops: [{ hex: full[from], pos: 0 }, { hex: full[to], pos: 100 }],
    category: '同色系',
  });
  const cross = (name, slug, h1, h2, cat = 'カラー間') => ({
    name, slug, type: 'linear', angle: 135,
    stops: [{ hex: h1, pos: 0 }, { hex: h2, pos: 100 }],
    category: cat,
  });
  return [
    tonal('Primary Tonal Light', 'primary-tonal-light', pF, '100', '400'),
    tonal('Primary Tonal Dark', 'primary-tonal-dark', pF, '600', '900'),
    cross('Primary → Secondary', 'primary-to-secondary', pF['500'], sF['500']),
    cross('Primary → Accent', 'primary-to-accent', pF['500'], aF['500']),
    {
      name: 'Light Fade', slug: 'light-fade', type: 'linear', angle: 180,
      stops: [{ hex: pF['50'], pos: 0 }, { hex: '#ffffff', pos: 100 }],
      category: 'フェード',
    },
    {
      name: 'Dark Fade', slug: 'dark-fade', type: 'linear', angle: 180,
      stops: [{ hex: pF['900'], pos: 0 }, { hex: '#000000', pos: 100 }],
      category: 'フェード',
    },
  ];
}

export function buildGradientExport(gradients, format) {
  if (format === 'CSS Variables') {
    const l = [':root {', '  /* ── Gradients ──────────────── */'];
    gradients.forEach((g) => l.push(`  --gradient-${g.slug}: ${buildGradientCSS(g)};`));
    l.push('}');
    return l.join('\n');
  }
  if (format === 'SCSS') {
    return gradients.map((g) => `$gradient-${g.slug}: ${buildGradientCSS(g)};`).join('\n');
  }
  if (format === 'theme.json') {
    const list = gradients.map((g) => ({
      name: g.name, slug: g.slug, gradient: buildGradientCSS(g),
    }));
    return JSON.stringify({ settings: { color: { gradients: list } } }, null, 2);
  }
  if (format === 'JSON') {
    const obj = {};
    gradients.forEach((g) => {
      obj[`gradient-${g.slug}`] = { value: buildGradientCSS(g), type: 'gradient' };
    });
    return JSON.stringify(obj, null, 2);
  }
}
