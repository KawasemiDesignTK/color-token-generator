export function LightDarkToggle({ mode, setMode, T }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>プレビューモード:</span>
      {["light", "dark"].map(m => (
        <button key={m} onClick={() => setMode(m)} style={{
          padding: "4px 14px", borderRadius: 8, cursor: "pointer",
          border: `1.5px solid ${mode === m ? T.accent : T.innerBorder}`,
          background: mode === m ? T.accentBg : "transparent",
          color: mode === m ? T.accent : T.textDim,
          fontSize: 11, fontFamily: "'DM Mono',monospace", transition: "all .15s",
        }}>{m === "light" ? "☀️ Light" : "🌙 Dark"}</button>
      ))}
    </div>
  );
}
