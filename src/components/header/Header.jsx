import { useState, useCallback } from 'react';

export function Header({uiDark,setUiDark,T,onShare}){
  const [copied,setCopied]=useState(false);
  const handleShare=useCallback(()=>{
    const url=onShare();
    navigator.clipboard.writeText(url).then(()=>{
      setCopied(true);
      setTimeout(()=>setCopied(false),1800);
    });
  },[onShare]);

  const btnStyle={
    display:"flex",alignItems:"center",gap:8,padding:"8px 14px",
    borderRadius:10,border:`1.5px solid ${T.cardBorder}`,
    background:T.cardBg,color:T.textMuted,cursor:"pointer",
    fontFamily:"'DM Mono',monospace",fontSize:11,transition:"all .2s",flexShrink:0,
  };

  return(
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:28,gap:12,flexWrap:"wrap"}}>
      <div>
        <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.textFaint,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Design Token Generator</div>
        <h1 style={{margin:0,fontSize:22,fontWeight:600,letterSpacing:-.5,color:T.text}}>カラーパレット作成</h1>
      </div>
      <div style={{display:"flex",gap:8,flexShrink:0}}>
        <button onClick={handleShare} style={btnStyle}>
          {copied?"Copied!":"URL をコピー"}
        </button>
        <button onClick={()=>setUiDark(v=>!v)} style={btnStyle}>
          <span style={{fontSize:16}}>{uiDark?"☀️":"🌙"}</span>
          {uiDark?"ライトモード":"ダークモード"}
        </button>
      </div>
    </div>
  );
}
