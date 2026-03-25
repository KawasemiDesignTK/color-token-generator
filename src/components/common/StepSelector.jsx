import { STEP_KEYS, STEP_LABELS } from '../../utils/scale.js';

export function StepSelector({ steps, setSteps, T, bp }) {
  const mob = bp === 'mobile';
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', ...(mob ? { flexDirection: 'column' } : {}) }}>
      {[4, 6, 10].map((n) => {
        const { short, long, desc } = STEP_LABELS[n];
        const active = steps === n;
        return (
          <button key={n} onClick={() => setSteps(n)} style={{
            flex: '1 1 0', minWidth: mob ? 0 : 120, padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
            border: `1.5px solid ${active ? T.accent : T.innerBorder}`,
            background: active ? T.accentBg : T.innerBg,
            transition: 'all .15s', textAlign: 'left',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 3 }}>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 13, fontWeight: 700, color: active ? T.accent : T.textMuted }}>{short}</span>
              <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: active ? T.accent + '99' : T.textFaint }}>{long}</span>
              {n === 6 && <span style={{ background: T.tagBg, border: `1px solid ${T.tagBorder}`, color: T.accent, borderRadius: 4, fontSize: 8, padding: '1px 5px', fontFamily: "'DM Mono',monospace", fontWeight: 600 }}>推奨</span>}
            </div>
            <div style={{ fontSize: 10, color: active ? T.codeText : T.textFaint, fontFamily: "'DM Mono',monospace", marginBottom: 3 }}>{STEP_KEYS[n].join(' · ')}</div>
            <div style={{ fontSize: 9, color: active ? T.textDim : T.textFaint }}>{desc}</div>
          </button>
        );
      })}
    </div>
  );
}
