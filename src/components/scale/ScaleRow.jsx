import { getContrastColor, contrastRatio } from '../../utils/colorMath.js';
import { WcagBadge } from '../common/WcagBadge.jsx';

export function ScaleRow({ tokenName, scale, T, showBadges = true }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: T.textFaint, marginBottom: 7, letterSpacing: .3 }}>{tokenName}</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        {scale.map(({ key, hex }) => {
          const fg = getContrastColor(hex);
          const wRatio = contrastRatio(hex, '#ffffff');
          const bRatio = contrastRatio(hex, '#1a1a1a');
          return (
            <div key={key} title={`${hex}\n白テキスト ${wRatio}:1 / 黒テキスト ${bRatio}:1`} style={{
              background: hex, color: fg, borderRadius: 8, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', padding: '8px 4px', minWidth: 62,
              fontSize: 9, fontFamily: "'DM Mono',monospace", gap: 3, cursor: 'default',
              transition: 'transform .12s', userSelect: 'none',
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span style={{ fontWeight: 700, fontSize: 10 }}>{key}</span>
              <span style={{ opacity: .7, fontSize: 8 }}>{hex}</span>
              {showBadges && (
                <div style={{ display: 'flex', gap: 2, marginTop: 1 }}>
                  <WcagBadge ratio={wRatio} label="W " />
                  <WcagBadge ratio={bRatio} label="B " />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
