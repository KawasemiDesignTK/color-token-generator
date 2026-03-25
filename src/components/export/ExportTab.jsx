import { useState, useMemo } from 'react';
import { EXPORT_FORMATS, buildExport } from '../../utils/exportBuilders.js';

const FILE_NAMES = {
  'CSS Variables': 'color-tokens.css',
  'SCSS': 'color-tokens.scss',
  'Tailwind': 'tailwind.config.js',
  'JSON': 'color-tokens.json',
  'theme.json': 'theme.json',
  'Figma Variables': 'figma-variables.json',
};

export function ExportTab({primaryHex,secondaryHex,accentHex,steps,roleSteps,uiDark,T,savedGradients=[],defaultGradients=[]}){
  const [exportFormat,setExportFormat]=useState("CSS Variables");
  const [exportThemeMode,setExportThemeMode]=useState("both");
  const [copied,setCopied]=useState(false);

  const gradForExport=savedGradients.length>0?savedGradients:defaultGradients;
  const exportCode=useMemo(()=>buildExport(exportFormat,primaryHex,secondaryHex,accentHex,steps,roleSteps,exportThemeMode,gradForExport),[exportFormat,primaryHex,secondaryHex,accentHex,steps,roleSteps,exportThemeMode,gradForExport]);

  const handleDownload=()=>{
    const filename=FILE_NAMES[exportFormat]||'color-tokens.txt';
    const blob=new Blob([exportCode],{type:'text/plain'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=filename; a.click();
    URL.revokeObjectURL(url);
  };

  return(
    <div>
      {/* Format selector + Copy */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,marginBottom:12}}>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          {EXPORT_FORMATS.map(f=>(
            <button key={f} onClick={()=>setExportFormat(f)} style={{
              padding:"5px 13px",borderRadius:8,
              border:`1.5px solid ${exportFormat===f?T.accent:T.cardBorder}`,
              background:exportFormat===f?T.accentBg:"transparent",
              color:exportFormat===f?T.accent:T.textDim,
              fontSize:11,fontFamily:"'DM Mono',monospace",cursor:"pointer",transition:"all .15s",
            }}>{f}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>{navigator.clipboard.writeText(exportCode);setCopied(true);setTimeout(()=>setCopied(false),1800);}} style={{
            padding:"5px 16px",borderRadius:8,border:`1.5px solid ${T.cardBorder}`,
            background:copied?T.btnHoverBg:T.btnBg,color:copied?T.btnHoverText:T.textMuted,
            fontSize:11,fontFamily:"'DM Mono',monospace",cursor:"pointer",transition:"all .2s",
          }}>{copied?"✓ Copied":"Copy"}</button>
          <button onClick={handleDownload} style={{
            padding:"5px 16px",borderRadius:8,border:`1.5px solid ${T.cardBorder}`,
            background:T.btnBg,color:T.textMuted,
            fontSize:11,fontFamily:"'DM Mono',monospace",cursor:"pointer",transition:"all .2s",
          }}>Download</button>
        </div>
      </div>

      {/* Theme mode selector */}
      <div style={{
        display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",
        padding:"10px 14px",borderRadius:10,
        background:T.innerBg,border:`1px solid ${T.innerBorder}`,
        marginBottom:12,
      }}>
        <span style={{fontSize:11,color:T.textMuted,fontWeight:600,flexShrink:0}}>セマンティック出力:</span>
        {[
          {id:"light", icon:"☀️", label:"Light のみ"},
          {id:"dark",  icon:"🌙", label:"Dark のみ"},
          {id:"both",  icon:"◑",  label:"両方"},
        ].map(({id,icon,label})=>(
          <button key={id} onClick={()=>setExportThemeMode(id)} style={{
            display:"flex",alignItems:"center",gap:5,
            padding:"5px 14px",borderRadius:8,cursor:"pointer",
            border:`1.5px solid ${exportThemeMode===id?T.accent:T.innerBorder}`,
            background:exportThemeMode===id?T.accentBg:"transparent",
            color:exportThemeMode===id?T.accent:T.textDim,
            fontSize:11,fontFamily:"'DM Mono',monospace",transition:"all .15s",
          }}>
            <span>{icon}</span>{label}
          </button>
        ))}
        <span style={{fontSize:10,color:T.textFaint,fontFamily:"'DM Mono',monospace",marginLeft:4}}>
          {exportThemeMode==="light"?"プリミティブ + Lightセマンティック":
           exportThemeMode==="dark" ?"プリミティブ + Darkセマンティック":
           "プリミティブ + Light / Darkセマンティック（両方）"}
        </span>
      </div>

      {/* Hints (collapsible) */}
      {exportFormat==="theme.json"&&(
        <details style={{marginBottom:12}}>
          <summary style={{fontSize:11,color:T.textMuted,cursor:"pointer",fontFamily:"'DM Mono',monospace",padding:"6px 0"}}>
            💡 WordPress theme.json の使い方
          </summary>
          <div style={{background:uiDark?"#141a22":"#eef2ff",border:`1px solid ${uiDark?"#1e2a3a":"#b0c4f0"}`,borderRadius:8,padding:"9px 13px",fontSize:11,color:uiDark?"#7aaee8":"#1a3a8a",fontFamily:"'DM Mono',monospace",lineHeight:1.6}}>
            <code>settings.color.palette</code>（セマンティック24トークン）と <code>settings.color.gradients</code>（グラデーション）を出力します。テーマの <code>theme.json</code> にマージするか、「WP Theme JSON Converter」Figmaプラグインで Import してご利用ください。
            {exportThemeMode==="both"&&" ※ theme.json はシングルモードです。Light モードの値を出力しています。"}
          </div>
        </details>
      )}
      {exportFormat==="Figma Variables"&&(
        <details style={{marginBottom:12}}>
          <summary style={{fontSize:11,color:T.textMuted,cursor:"pointer",fontFamily:"'DM Mono',monospace",padding:"6px 0"}}>
            💡 Figma Variables の使い方
          </summary>
          <div style={{background:uiDark?"#141e14":"#eef8ee",border:`1px solid ${uiDark?"#2a3a20":"#b0d8b0"}`,borderRadius:8,padding:"9px 13px",fontSize:11,color:uiDark?"#7ec87e":"#2a6a2a",fontFamily:"'DM Mono',monospace",lineHeight:1.6}}>
            {exportThemeMode==="both"?"Semantic コレクションに Light / Dark の2モードが含まれます。":
                exportThemeMode==="light"?"Semantic コレクションに Light モードのみ含まれます。":
                "Semantic コレクションに Dark モードのみ含まれます。"}「Variables Import Export JSON」プラグイン等で読み込み可能です。
          </div>
        </details>
      )}
      {exportFormat==="CSS Variables"&&(
        <details style={{marginBottom:12}}>
          <summary style={{fontSize:11,color:T.textMuted,cursor:"pointer",fontFamily:"'DM Mono',monospace",padding:"6px 0"}}>
            💡 CSS Variables の出力について
          </summary>
          <div style={{background:uiDark?"#141a22":"#eef2ff",border:`1px solid ${uiDark?"#1e2a3a":"#b0c4f0"}`,borderRadius:8,padding:"9px 13px",fontSize:11,color:uiDark?"#7aaee8":"#1a3a8a",fontFamily:"'DM Mono',monospace",lineHeight:1.6}}>
            {exportThemeMode==="both"?<>プリミティブ・Lightセマンティックを <code>:root</code>、Darkセマンティックを <code>[data-theme="dark"]</code> に出力します。</>:
                exportThemeMode==="light"?<>プリミティブ・Lightセマンティックを <code>:root</code> に出力します。</>:
                <>プリミティブ・Darkセマンティックを <code>:root</code> に出力します。</>}
          </div>
        </details>
      )}

      <pre style={{
        background:T.deepBg,border:`1px solid ${T.deepBorder}`,borderRadius:10,
        padding:"14px 16px",fontSize:10,fontFamily:"'DM Mono',monospace",
        color:T.codeText,overflowX:"auto",margin:0,lineHeight:1.8,
        maxHeight:420,overflowY:"auto",
      }}>{exportCode}</pre>
    </div>
  );
}
