import { contrastRatio, wcagLevel } from '../../utils/colorMath.js';

const CONTRAST_PAIRS=[
  {label:"Primary / Surface",          fgKey:"color-primary",       bgKey:"color-surface"},
  {label:"Primary / Base",             fgKey:"color-primary",       bgKey:"color-base"},
  {label:"White / Primary",            fgKey:"color-white",         bgKey:"color-primary"},
  {label:"Primary dark / Surface",     fgKey:"color-primary-dark",  bgKey:"color-surface"},
  {label:"Secondary / Surface",        fgKey:"color-secondary",     bgKey:"color-surface"},
  {label:"Accent / Surface",           fgKey:"color-accent",        bgKey:"color-surface"},
  {label:"Text / Surface",             fgKey:"color-text",          bgKey:"color-surface"},
  {label:"Text muted / Surface",       fgKey:"color-text-muted",    bgKey:"color-surface"},
];

export function ContrastTab({semLight,semDark,semPreviewMode,uiDark,T,bp}){
  const contrastSem=semPreviewMode==="light"?semLight:semDark;
  const levelColor=(l)=>l==="AAA"?T.successHex:l==="AA"?T.accent:l==="Large AA"?T.warningHex:T.errorHex;

  return(
    <div>
      <div style={{fontSize:10,color:T.textFaint,fontFamily:"'DM Mono',monospace",marginBottom:14}}>
        WCAG 2.1　AA ≥ 4.5:1　AAA ≥ 7:1　Large AA ≥ 3:1
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(265px,1fr))",gap:10}}>
        {CONTRAST_PAIRS.map(({label,fgKey,bgKey})=>{
          const fg=contrastSem[fgKey];
          const bg=contrastSem[bgKey];
          const ratio=contrastRatio(fg,bg);
          const level=wcagLevel(ratio);
          const lc=levelColor(level);
          return(
            <div key={label} style={{background:T.innerBg,border:`1px solid ${level!=="失敗"?(uiDark?"#1e2a1e":"#c8e8c8"):(uiDark?"#2a1e1e":"#f0c0c0")}`,borderRadius:11,padding:"13px 15px"}}>
              <div style={{fontSize:10,color:T.textFaint,fontFamily:"'DM Mono',monospace",marginBottom:8}}>{label}</div>
              <div style={{height:44,borderRadius:8,background:bg,display:"flex",alignItems:"center",justifyContent:"center",color:fg,fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:600,border:`1px solid ${T.innerBorder}`,marginBottom:8}}>
                Aa テキストサンプル
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:4,flexWrap:"wrap"}}>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.textFaint}}>{fg} / {bg}</span>
                <span style={{background:lc+"22",border:`1px solid ${lc}55`,color:lc,borderRadius:5,fontSize:10,padding:"2px 8px",fontFamily:"'DM Mono',monospace",fontWeight:700}}>{level} {ratio}:1</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
