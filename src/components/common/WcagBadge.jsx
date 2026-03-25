import { wcagLevel } from '../../utils/colorMath.js';

export function WcagBadge({ ratio, label }) {
  const level = wcagLevel(ratio);
  if (level === '失敗')
    return (
      <span
        style={{
          background: 'rgba(0,0,0,0.35)', color: 'rgba(255,255,255,0.45)',
          borderRadius: 3, fontSize: 7, padding: '1px 4px', fontFamily: "'DM Mono',monospace",
          fontWeight: 600, letterSpacing: .3, lineHeight: 1,
        }}
      >{label}✕</span>
    );
  const isAAA = level === 'AAA';
  return (
    <span
      style={{
        background: isAAA ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.35)',
        color: isAAA ? '#7fffb0' : '#ffffffcc',
        borderRadius: 3, fontSize: 7, padding: '1px 4px', fontFamily: "'DM Mono',monospace",
        fontWeight: 700, letterSpacing: .3, lineHeight: 1,
      }}
    >{label}{isAAA ? 'AAA' : 'AA'}</span>
  );
}
