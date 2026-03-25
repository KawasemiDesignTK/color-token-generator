export function SemanticGroupDisplay({ label, tokens, T }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: T.textFaint, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4, paddingLeft: 2 }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {tokens.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 10px', borderRadius: 8, background: T.innerBg }}>
            <div style={{ width: 22, height: 22, borderRadius: 5, background: v, flexShrink: 0, border: `1px solid ${T.stripBorder}` }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9, color: T.textFaint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>--{k}</div>
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: T.codeText }}>{v}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
