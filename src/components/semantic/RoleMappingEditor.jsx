import { getContrastColor } from '../../utils/colorMath.js';
import { SCALE_STEP_OPTIONS } from '../../utils/scale.js';
import { DEFAULT_ROLE_STEPS, ROLE_META } from '../../utils/semantic.js';

export function RoleMappingEditor({ roleSteps, setRoleSteps, primaryFull, T, bp }) {
  const mob = bp === 'mobile';
  const roles = Object.keys(DEFAULT_ROLE_STEPS);
  return (
    <div style={{ background: T.innerBg, border: `1px solid ${T.innerBorder}`, borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: T.textMuted, marginBottom: 4, letterSpacing: .5, display: 'flex', alignItems: 'center', gap: 8 }}>
        ステップ → セマンティックロール マッピング
        <button onClick={() => setRoleSteps({ ...DEFAULT_ROLE_STEPS })} style={{
          background: 'transparent', border: `1px solid ${T.cardBorder}`, borderRadius: 6,
          color: T.textDim, fontSize: 9, padding: '2px 8px', cursor: 'pointer',
          fontFamily: "'DM Mono',monospace", marginLeft: 'auto',
        }}>デフォルトに戻す</button>
      </div>
      <div style={{ fontSize: 10, color: T.textFaint, marginBottom: 12, lineHeight: 1.5 }}>
        各ロールのライトモード割り当てを変更できます。ダークモードは自動で反転します。
      </div>
      <div style={{ display: 'flex', gap: 0, borderRadius: 9, overflow: 'hidden', marginBottom: 14, height: mob ? 20 : 28 }}>
        {roles.map((role) => {
          const hex = primaryFull[roleSteps[role]];
          return (
            <div key={role} style={{
              flex: 1, background: hex, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: getContrastColor(hex), fontFamily: "'DM Mono',monospace", fontSize: mob ? 0 : 8, letterSpacing: .2,
            }}>{role}</div>
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 8 }}>
        {roles.map((role) => {
          const { label, desc } = ROLE_META[role];
          const cur = roleSteps[role];
          const hex = primaryFull[cur];
          return (
            <div key={role} style={{ background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 9, padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 34, height: 34, borderRadius: 7, background: hex, flexShrink: 0, border: `1px solid ${T.stripBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: getContrastColor(hex), fontFamily: "'DM Mono',monospace", fontSize: 9, fontWeight: 700 }}>{cur}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: T.text, fontWeight: 600, marginBottom: 2 }}>-{label}</div>
                <div style={{ fontSize: 9, color: T.textFaint, marginBottom: 5, lineHeight: 1.4 }}>{desc}</div>
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  {SCALE_STEP_OPTIONS.map((step) => (
                    <button key={step} onClick={() => setRoleSteps((prev) => ({ ...prev, [role]: step }))} style={{
                      padding: '2px 6px', borderRadius: 5,
                      border: `1px solid ${cur === step ? T.accent : T.innerBorder}`,
                      background: cur === step ? primaryFull[step] + '33' : 'transparent',
                      color: cur === step ? T.accent : T.textFaint,
                      fontSize: 9, fontFamily: "'DM Mono',monospace", cursor: 'pointer', transition: 'all .1s',
                    }}>{step}</button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
