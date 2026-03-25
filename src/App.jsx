import { useState, useCallback, useMemo, useEffect } from "react";
import { isValidHex } from "./utils/colorMath.js";
import { getHarmonyPatterns } from "./utils/harmony.js";
import { DEFAULT_ROLE_STEPS } from "./utils/semantic.js";
import { THEMES, TABS } from "./constants/theme.js";
import { useColorEngine } from "./hooks/useColorEngine.js";
import { usePersistence } from "./hooks/usePersistence.js";
import { useBreakpoint } from "./hooks/useBreakpoint.js";
import { GlobalStyles } from "./GlobalStyles.jsx";
import { Header } from "./components/header/Header.jsx";
import { StepSelector } from "./components/common/StepSelector.jsx";
import { LightDarkToggle } from "./components/common/LightDarkToggle.jsx";
import { PatternCard } from "./components/PatternCard.jsx";
import { ScaleTab } from "./components/scale/ScaleTab.jsx";
import { SemanticTab } from "./components/semantic/SemanticTab.jsx";
import { ContrastTab } from "./components/contrast/ContrastTab.jsx";
import { GradientTab } from "./components/gradient/GradientTab.jsx";
import { ExportTab } from "./components/export/ExportTab.jsx";

// ── Main ──────────────────────────────────────────────────────────
export default function App(){
  const { initial, persist, getShareUrl } = usePersistence({
    primaryHex: "#1A6FDB", selSec: "s1", selAcc: "a1",
    customSec: null, customAcc: null, steps: 6,
    roleSteps: { ...DEFAULT_ROLE_STEPS }, uiDark: true, tab: 0,
  });

  const [primaryHex,setPrimaryHex]=useState(initial.primaryHex);
  const [primaryInput,setPrimaryInput]=useState(initial.primaryHex);
  const [selSec,setSelSec]=useState(initial.selSec);
  const [selAcc,setSelAcc]=useState(initial.selAcc);
  const [customSec,setCustomSec]=useState(initial.customSec);
  const [customAcc,setCustomAcc]=useState(initial.customAcc);
  const [steps,setSteps]=useState(initial.steps);
  const [roleSteps,setRoleSteps]=useState(initial.roleSteps);
  const [tab,setTab]=useState(initial.tab);
  const [uiDark,setUiDark]=useState(initial.uiDark);
  const [semPreviewMode,setSemPreviewMode]=useState("light");

  // Persist to localStorage (debounced)
  useEffect(()=>{
    const timer=setTimeout(()=>persist({primaryHex,selSec,selAcc,customSec,customAcc,steps,roleSteps,uiDark,tab}),300);
    return ()=>clearTimeout(timer);
  },[primaryHex,selSec,selAcc,customSec,customAcc,steps,roleSteps,uiDark,tab,persist]);

  const T=THEMES[uiDark?"dark":"light"];
  const {bp,isMobile}=useBreakpoint();

  const patterns=useMemo(()=>isValidHex(primaryHex)?getHarmonyPatterns(primaryHex):{secondary:[],accent:[]},[primaryHex]);
  const secondaryHex=useMemo(()=>customSec||(patterns.secondary.find(p=>p.id===selSec)?.hex||"#888888"),[patterns,selSec,customSec]);
  const accentHex=useMemo(()=>customAcc||(patterns.accent.find(p=>p.id===selAcc)?.hex||"#888888"),[patterns,selAcc,customAcc]);

  const {
    primaryFull,secondaryFull,accentFull,neutralFull,
    primaryScale,secondaryScale,accentScale,neutralScale,
    semLight,semDark,
    presetGradients,
  }=useColorEngine(primaryHex,secondaryHex,accentHex,steps,roleSteps);

  // Initialized with presets on first render; user can add/remove in GradientTab
  const [savedGradients,setSavedGradients]=useState(()=>presetGradients);

  const applyPrimary=useCallback((hex)=>{if(!isValidHex(hex))return;setPrimaryHex(hex);setCustomSec(null);setCustomAcc(null);},[]);

  // shared card style
  const card=(extra={})=>({background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:14,padding:"18px 20px",...extra});
  const label11=(extra={})=>({fontSize:11,fontWeight:600,color:T.textMuted,letterSpacing:.5,...extra});

  return(
    <div style={{minHeight:"100vh",background:T.pageBg,color:T.text,fontFamily:"'DM Sans',sans-serif",padding:isMobile?"20px 12px 40px":"36px 22px 60px",boxSizing:"border-box",transition:"background .25s,color .25s"}}>
      <GlobalStyles T={T}/>
      <Header uiDark={uiDark} setUiDark={setUiDark} T={T}
        onShare={()=>getShareUrl({primaryHex,selSec,selAcc,customSec,customAcc,steps,roleSteps})}/>

      {/* Primary */}
      <div style={{...card(),marginBottom:16}}>
        <div style={{...label11(),marginBottom:10}}>PRIMARY — コーポレートカラー</div>
        <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
          <input type="color" value={primaryHex} onChange={e=>{setPrimaryInput(e.target.value);applyPrimary(e.target.value);}}
            style={{width:52,height:52,borderRadius:10,border:"none",cursor:"pointer",background:"none"}}/>
          <input type="text" value={primaryInput} maxLength={7}
            onChange={e=>{setPrimaryInput(e.target.value);if(isValidHex(e.target.value))applyPrimary(e.target.value);}}
            style={{background:T.inputBg,border:`1.5px solid ${isValidHex(primaryInput)?T.inputBorder:"#8b3a3a"}`,borderRadius:9,padding:"9px 13px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:14,outline:"none",width:128}}
          />
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {["50","100","300","500","700","800","900"].map(k=>(
              <div key={k} style={{width:26,height:26,borderRadius:6,background:primaryFull[k],border:`1px solid ${T.stripBorder}`}} title={`${k}: ${primaryFull[k]}`}/>
            ))}
          </div>
        </div>
      </div>

      {/* Secondary & Accent */}
      {[
        {type:"secondary",label:"SECONDARY",pats:patterns.secondary,sel:selSec,setSel:setSelSec,custom:customSec,setCustom:setCustomSec,current:secondaryHex},
        {type:"accent",   label:"ACCENT",   pats:patterns.accent,   sel:selAcc,setSel:setSelAcc,custom:customAcc,setCustom:setCustomAcc,current:accentHex},
      ].map(({type,label,pats,sel,setSel,custom,setCustom,current})=>(
        <div key={type} style={{...card(),marginBottom:14}}>
          <div style={{...label11(),marginBottom:12}}>{label} — カラーハーモニー候補</div>
          <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:12}}>
            {pats.map(p=>(
              <PatternCard key={p.id} pattern={p} selected={!custom&&sel===p.id} T={T}
                onSelect={()=>{setSel(p.id);setCustom(null);}}/>
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,paddingTop:10,borderTop:`1px solid ${T.innerBorder}`,flexWrap:"wrap"}}>
            <span style={{fontSize:10,color:T.textFaint,fontFamily:"'DM Mono',monospace",flexShrink:0}}>カスタム:</span>
            <input type="color" value={current} onChange={e=>setCustom(e.target.value)}
              style={{width:32,height:32,borderRadius:7,border:"none",cursor:"pointer",background:"none"}}/>
            <input type="text" value={custom||current} maxLength={7}
              onChange={e=>{if(isValidHex(e.target.value))setCustom(e.target.value);}}
              style={{background:T.inputBg,border:`1.5px solid ${T.inputBorder}`,borderRadius:7,padding:"6px 11px",color:T.text,fontFamily:"'DM Mono',monospace",fontSize:12,outline:"none",width:106}}
            />
            {custom&&<button onClick={()=>setCustom(null)} style={{background:"transparent",border:`1px solid ${T.cardBorder}`,borderRadius:6,color:T.textDim,fontSize:10,padding:"3px 9px",cursor:"pointer",fontFamily:"'DM Mono',monospace"}}>リセット</button>}
          </div>
        </div>
      ))}

      {/* Preview bar */}
      <div style={{display:"flex",height:38,borderRadius:12,overflow:"hidden",marginBottom:20,gap:1.5}}>
        {[...primaryScale,...secondaryScale.slice(1,secondaryScale.length-1),...accentScale.slice(1,accentScale.length-1),...neutralScale.slice(1,neutralScale.length-1)].map(({hex},i)=>(
          <div key={i} style={{flex:1,background:hex,transition:"flex .25s"}}
            onMouseEnter={e=>e.currentTarget.style.flex="3"}
            onMouseLeave={e=>e.currentTarget.style.flex="1"}/>
        ))}
      </div>

      {/* Step selector */}
      <div style={{...card({padding:"14px 16px"}),marginBottom:14}}>
        <div style={{fontSize:10,color:T.textFaint,fontFamily:"'DM Mono',monospace",marginBottom:10,letterSpacing:.5}}>スケール段階数</div>
        <StepSelector steps={steps} setSteps={setSteps} T={T} bp={bp}/>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,marginBottom:18,...(isMobile?{overflowX:"auto",WebkitOverflowScrolling:"touch",flexWrap:"nowrap",paddingBottom:4}:{flexWrap:"wrap"})}}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)} style={{
            padding:"6px 16px",borderRadius:9,flexShrink:0,
            border:`1.5px solid ${tab===i?T.accent:T.innerBorder}`,
            background:tab===i?T.accentBg:"transparent",
            color:tab===i?T.accent:T.textDim,
            fontSize:12,fontWeight:tab===i?600:400,cursor:"pointer",transition:"all .15s",
          }}>{t}</button>
        ))}
      </div>

      {/* Light/Dark toggle (shared between Semantic & Contrast) */}
      {(tab===1||tab===2)&&(
        <div style={{...card({padding:"10px 16px"}),marginBottom:10}}>
          <LightDarkToggle mode={semPreviewMode} setMode={setSemPreviewMode} T={T}/>
        </div>
      )}

      {/* Tab content with fade-in */}
      <div key={tab} className="tab-enter">
        {tab===0&&(
          <div style={card()}>
            <ScaleTab steps={steps}
              primaryScale={primaryScale} secondaryScale={secondaryScale}
              accentScale={accentScale} neutralScale={neutralScale}
              primaryFull={primaryFull} secondaryFull={secondaryFull} accentFull={accentFull}
              semLight={semLight} T={T} bp={bp}/>
          </div>
        )}

        {tab===1&&(
          <SemanticTab semLight={semLight} semDark={semDark}
            roleSteps={roleSteps} setRoleSteps={setRoleSteps} primaryFull={primaryFull}
            semPreviewMode={semPreviewMode} T={T} bp={bp}/>
        )}

        {tab===2&&(
          <div style={card()}>
            <ContrastTab semLight={semLight} semDark={semDark}
              semPreviewMode={semPreviewMode}
              uiDark={uiDark} T={T} bp={bp}/>
          </div>
        )}

        {tab===3&&(
          <div style={card()}>
            <GradientTab presets={presetGradients} T={T} bp={bp}
              paletteFull={{primary:primaryFull,secondary:secondaryFull,accent:accentFull}}
              semanticTokens={semLight}
              savedGradients={savedGradients} setSavedGradients={setSavedGradients}/>
          </div>
        )}

        {tab===4&&(
          <div style={card()}>
            <ExportTab primaryHex={primaryHex} secondaryHex={secondaryHex} accentHex={accentHex}
              steps={steps} roleSteps={roleSteps} uiDark={uiDark} T={T}
              savedGradients={savedGradients} defaultGradients={presetGradients}/>
          </div>
        )}
      </div>
    </div>
  );
}
