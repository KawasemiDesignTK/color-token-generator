import { contrastRatio, wcagLevel } from '../../utils/colorMath.js';

const SURFACE_CHECK_KEYS = ['300', '400', '500', '600', '700'];

export function ScaleContrastMatrix({ label, fullScale, surfaceHex, bgHex, T, bp }) {
  const mob = bp === 'mobile';
  const keys = Object.keys(fullScale).filter((k) => SURFACE_CHECK_KEYS.includes(k));
  const levelColor = (l) => l === 'AAA' ? '#4aef99' : l === 'AA' ? T.accent : l === 'Large AA' ? '#f59e0b' : '#ef4444';
  const Cell = ({ hex, against, againstLabel }) => {
    const ratio = contrastRatio(hex, against);
    const level = wcagLevel(ratio);
    const lc = levelColor(level);
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: 52, borderRadius: 7, background: against,
        border: `1.5px solid ${level === '失敗' ? '#c03030' : '#30a050'}`,
        gap: 2, padding: '4px',
      }}>
        <span style={{ color: hex, fontFamily: "'DM Mono',monospace", fontSize: 10, fontWeight: 700 }}>Aa</span>
        <span style={{
          background: lc + '22', border: `1px solid ${lc}55`, color: lc,
          borderRadius: 4, fontSize: 8, padding: '1px 5px', fontFamily: "'DM Mono',monospace", fontWeight: 700,
        }}>{level === '失敗' ? '✕' : level} {ratio}:1</span>
        <span style={{ fontSize: 8, color: T.textFaint, fontFamily: "'DM Mono',monospace" }}>{againstLabel}</span>
      </div>
    );
  };
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: T.textFaint, marginBottom: 8, letterSpacing: .3 }}>
        {label} — Surface / Background 対比（300〜700）
      </div>
      <div style={mob ? { overflowX: 'auto', WebkitOverflowScrolling: 'touch' } : {}}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `auto repeat(${keys.length},1fr)`,
        gap: 4, alignItems: 'center',
        ...(mob ? { minWidth: 400 } : {}),
      }}>
        <div style={{ fontSize: 8, color: T.textFaint, fontFamily: "'DM Mono',monospace", textAlign: 'right', paddingRight: 6 }}>step →</div>
        {keys.map((k) => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ width: 28, height: 28, borderRadius: 5, background: fullScale[k], border: `1px solid ${T.cardBorder}` }} />
            <span style={{ fontSize: 8, color: T.textFaint, fontFamily: "'DM Mono',monospace" }}>{k}</span>
          </div>
        ))}
        <div style={{ fontSize: 8, color: T.textFaint, fontFamily: "'DM Mono',monospace", textAlign: 'right', paddingRight: 6 }}>Surface</div>
        {keys.map((k) => (
          <Cell key={k} hex={fullScale[k]} against={surfaceHex} againstLabel="surface" />
        ))}
        <div style={{ fontSize: 8, color: T.textFaint, fontFamily: "'DM Mono',monospace", textAlign: 'right', paddingRight: 6 }}>Background</div>
        {keys.map((k) => (
          <Cell key={k} hex={fullScale[k]} against={bgHex} againstLabel="bg" />
        ))}
      </div>
      </div>
    </div>
  );
}
