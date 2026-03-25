export function SemanticDualPreview({ semLight, semDark, T, bp }) {
  const previewKeys = ['color-base', 'color-surface', 'color-text', 'color-primary', 'color-primary-dark', 'color-primary-bg', 'color-accent'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: bp === 'mobile' ? '1fr' : '1fr 1fr', gap: 10, marginBottom: 16 }}>
      {[{ label: 'Light Mode', sem: semLight, bg: '#f4f4f8' }, { label: 'Dark Mode', sem: semDark, bg: '#111118' }].map(({ label, sem, bg }) => (
        <div key={label} style={{ background: bg, border: `1px solid ${T.cardBorder}`, borderRadius: 12, padding: '14px 16px' }}>
          <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: sem['color-text-muted'], marginBottom: 10, letterSpacing: .5 }}>{label}</div>
          <div style={{ background: sem['color-surface'], borderRadius: 9, padding: '12px', border: `1px solid ${sem['color-border']}` }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: sem['color-primary'], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: sem['color-white'], fontSize: 12, fontWeight: 700 }}>A</span>
              </div>
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: sem['color-primary-bg'] }} />
            </div>
            <div style={{ fontSize: 11, color: sem['color-text'], fontWeight: 600, marginBottom: 4 }}>見出しテキスト</div>
            <div style={{ fontSize: 10, color: sem['color-text-muted'], marginBottom: 10, lineHeight: 1.5 }}>本文テキストのサンプルです。</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ padding: '5px 12px', borderRadius: 7, background: sem['color-primary'], color: sem['color-white'], fontSize: 10, fontWeight: 600 }}>ボタン</div>
              <div style={{ padding: '5px 12px', borderRadius: 7, background: sem['color-accent'], color: sem['color-white'], fontSize: 10, fontWeight: 600 }}>アクセント</div>
              <div style={{ padding: '4px 10px', borderRadius: 7, background: sem['color-primary-label'], color: sem['color-text-primary'], fontSize: 10, border: `1px solid ${sem['color-primary-bg']}` }}>タグ</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 10, flexWrap: 'wrap' }}>
            {previewKeys.map((k) => sem[k] && (
              <div key={k} title={`${k}: ${sem[k]}`} style={{
                width: 20, height: 20, borderRadius: 4, background: sem[k],
                border: `1px solid ${T.stripBorder}`, flexShrink: 0,
              }} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
