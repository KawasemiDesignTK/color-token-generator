import { getContrastColor } from '../utils/colorMath.js';
import { generateScale } from '../utils/scale.js';

export function PatternCard({ pattern, selected, onSelect, T }) {
  const fg = getContrastColor(pattern.hex);
  const sc = generateScale(pattern.hex);
  return (
    <div onClick={onSelect} style={{
      border: `2px solid ${selected ? T.accent : T.cardBorder}`, borderRadius: 12,
      padding: '12px 13px', cursor: 'pointer',
      background: selected ? T.accentBg : T.innerBg,
      transition: 'all .15s', flex: '1 1 140px', minWidth: 130,
    }}>
      <div style={{ display: 'flex', gap: 3, marginBottom: 8 }}>
        {['200', '400', '500', '600', '800'].map((k) => (
          <div key={k} style={{ flex: 1, height: 16, borderRadius: 4, background: sc[k] }} />
        ))}
      </div>
      <div style={{
        height: 30, borderRadius: 7, background: pattern.hex, display: 'flex', alignItems: 'center',
        justifyContent: 'center', color: fg, fontFamily: "'DM Mono',monospace", fontSize: 11, marginBottom: 8,
      }}>{pattern.hex}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: selected ? T.text : T.textMuted, marginBottom: 2 }}>{pattern.name}</div>
      <div style={{ fontSize: 10, color: T.textFaint, marginBottom: selected ? 6 : 0 }}>{pattern.desc}</div>
      {selected && <span style={{
        background: T.tagBg, border: `1px solid ${T.tagBorder}`, color: T.accent,
        borderRadius: 5, fontSize: 9, padding: '2px 7px', fontFamily: "'DM Mono',monospace", fontWeight: 600,
      }}>選択中</span>}
    </div>
  );
}
