# Color Token Generator

デザイントークン設計に特化したカラーパレット生成ツール。
A color palette generator specialized for design token workflows.

**Live demo:** https://color-token-generator.k-info.workers.dev/

---

## Features

| Tab | Description |
|---|---|
| **Scale** | Generate Primary / Secondary / Accent / Neutral scales with WCAG badges + contrast matrix |
| **Semantic** | Light/Dark side-by-side preview with role mapping editor (bg / label / base / dark) |
| **Contrast** | WCAG 2.1 contrast ratio checker (8 pairs) |
| **Gradient** | 6 presets + custom editor + palette picker + export |
| **Export** | CSS Variables / SCSS / Tailwind / JSON / Figma Variables / WordPress theme.json |

## Highlights

- Input a corporate primary color → Secondary & Accent auto-derived via color harmony
- WCAG 2.1 compliant — AA/AAA badges on every color pair
- Semantic tokens with `var()` references (e.g. `--color-primary: var(--color-primary-500)`)
- State persisted via localStorage + URL params (shareable links)
- Responsive: mobile / tablet / desktop

## Tech Stack

- React 19 + Vite
- Zero external UI dependencies (inline styles)
- Pure JS color math (HSL/RGB, WCAG contrast ratio)

## Getting Started

```bash
npm install
npm run dev      # dev server → http://localhost:5173
npm run build    # production build → dist/
npm run preview  # preview build
```

## License

MIT © [Kawasemi Design](https://kawasemi-design.com)
