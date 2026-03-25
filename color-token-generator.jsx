import { useState, useCallback, useMemo } from "react";

// ── Color Math ────────────────────────────────────────────────────
function hexToRgb(hex){return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];}
function hexToHsl(hex){
  let [r,g,b]=hexToRgb(hex).map(v=>v/255);
  const max=Math.max(r,g,b),min=Math.min(r,g,b);
  let h,s,l=(max+min)/2;
  if(max===min){h=s=0;}
  else{const d=max-min;s=l>0.5?d/(2-max-min):d/(max+min);switch(max){case r:h=((g-b)/d+(g<b?6:0))/6;break;case g:h=((b-r)/d+2)/6;break;case b:h=((r-g)/d+4)/6;break;}}
  return [Math.round(h*360),Math.round(s*100),Math.round(l*100)];
}
function hslToHex(h,s,l){
  s/=100;l/=100;const a=s*Math.min(l,1-l);
  const f=(n)=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(Math.min(k-3,9-k,1),-1))).toString(16).padStart(2,"0");};
  return `#${f(0)}${f(8)}${f(4)}`;
}
function isValidHex(hex){return /^#[0-9A-Fa-f]{6}$/.test(hex);}
function getContrastColor(hex){const [r,g,b]=hexToRgb(hex);return (0.299*r+0.587*g+0.114*b)/255>0.5?"#1a1a1a":"#ffffff";}
function relativeLuminance(hex){const lin=hexToRgb(hex).map(v=>{v/=255;return v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4);});return 0.2126*lin[0]+0.7152*lin[1]+0.0722*lin[2];}
function contrastRatio(h1,h2){const l1=relativeLuminance(h1),l2=relativeLuminance(h2);const b=Math.max(l1,l2),d=Math.min(l1,l2);return Math.round(((b+0.05)/(d+0.05))*100)/100;}
function wcagLevel(r){return r>=7?"AAA":r>=4.5?"AA":r>=3?"Large AA":"失敗";}

// ── Scale ─────────────────────────────────────────────────────────
const SCALE_STEP_OPTIONS=["50","100","200","300","400","500","600","700","800","900"];
const STEP_KEYS={
  4: ["100","300","500","700"],
  6: ["50","100","300","500","700","900"],
  10:["50","100","200","300","400","500","600","700","800","900"],
};
const STEP_LABELS={
  4: {short:"4段階",long:"簡易版", desc:"LP・小規模サイト向け"},
  6: {short:"6段階",long:"標準",   desc:"中小規模サイト向け（推奨）"},
  10:{short:"10段階",long:"フル",  desc:"デザインシステム・Tailwind互換"},
};

function generateScale(hex){
  const [h,s,baseL]=hexToHsl(hex);
  const defs={
    "50": {l:Math.min(97,baseL+42),sv:Math.max(5,s*0.25)},
    "100":{l:Math.min(95,baseL+33),sv:Math.max(8,s*0.4)},
    "200":{l:Math.min(90,baseL+22),sv:Math.max(15,s*0.6)},
    "300":{l:Math.min(82,baseL+12),sv:Math.max(20,s*0.75)},
    "400":{l:Math.min(72,baseL+4), sv:Math.max(25,s*0.9)},
    "500":{l:baseL,                sv:s},
    "600":{l:Math.max(10,baseL-10),sv:Math.min(100,s*1.05)},
    "700":{l:Math.max(8,baseL-20), sv:Math.min(100,s*1.1)},
    "800":{l:Math.max(6,baseL-30), sv:Math.min(100,s*1.15)},
    "900":{l:Math.max(4,baseL-40), sv:Math.min(100,s*1.15)},
  };
  const full={};
  for(const [key,{l,sv}] of Object.entries(defs))
    full[key]=hslToHex(h,Math.min(100,Math.max(0,sv)),Math.max(2,Math.min(97,l)));
  return full;
}
function filterScale(full,steps){return STEP_KEYS[steps].map(key=>({key,hex:full[key]}));}
function generateNeutral(primaryHex){
  const [h,s]=hexToHsl(primaryHex);const ns=Math.min(7,s*0.07);
  return Object.fromEntries([["50",97],["100",95],["200",88],["300",78],["400",62],["500",46],["600",34],["700",24],["800",15],["900",8]].map(([k,l])=>[k,hslToHex(h,ns,l)]));
}

// ── Semantic role mapping ─────────────────────────────────────────
export const DEFAULT_ROLE_STEPS={subtle:"50",chip:"100",light:"300",base:"500",hover:"700",dark:"800"};
const ROLE_META={
  subtle:{label:"subtle",desc:"極薄背景 tint・セクション背景"},
  chip:  {label:"chip",  desc:"チップ・タグ・バッジ背景"},
  light: {label:"light", desc:"ボーダー・アイコン・装飾要素"},
  base:  {label:"base",  desc:"ボタン・リンク等の基本色"},
  hover: {label:"hover", desc:"ホバー・フォーカス状態"},
  dark:  {label:"dark",  desc:"強調テキスト・ダーク調背景"},
};

// Dark mode: scale は反転参照（50↔900, 100↔800 ...）
const DARK_ROLE_STEPS={subtle:"900",chip:"800",light:"600",base:"400",hover:"300",dark:"200"};

function buildSemanticSet(pF,sF,aF,nF,rs){
  return {
    "color-background":       nF[rs.subtle==="50"?"50":"900"],
    "color-surface":          rs.subtle==="50"?"#ffffff":nF["800"],
    "color-surface-variant":  rs.subtle==="50"?nF["100"]:nF["700"],
    "color-on-surface":       rs.subtle==="50"?nF["900"]:nF["50"],
    "color-on-surface-muted": rs.subtle==="50"?nF["500"]:nF["400"],
    "color-border":           rs.subtle==="50"?nF["200"]:nF["700"],
    "color-border-strong":    rs.subtle==="50"?nF["400"]:nF["600"],
    "color-primary-subtle":   pF[rs.subtle],
    "color-primary-chip":     pF[rs.chip],
    "color-primary-light":    pF[rs.light],
    "color-primary":          pF[rs.base],
    "color-primary-hover":    pF[rs.hover],
    "color-primary-dark":     pF[rs.dark],
    "color-on-primary":       getContrastColor(pF[rs.base]),
    "color-secondary-subtle": sF[rs.subtle],
    "color-secondary-chip":   sF[rs.chip],
    "color-secondary-light":  sF[rs.light],
    "color-secondary":        sF[rs.base],
    "color-secondary-hover":  sF[rs.hover],
    "color-secondary-dark":   sF[rs.dark],
    "color-on-secondary":     getContrastColor(sF[rs.base]),
    "color-accent-subtle":    aF[rs.subtle],
    "color-accent-chip":      aF[rs.chip],
    "color-accent-light":     aF[rs.light],
    "color-accent":           aF[rs.base],
    "color-accent-hover":     aF[rs.hover],
    "color-accent-dark":      aF[rs.dark],
    "color-on-accent":        getContrastColor(aF[rs.base]),
    "color-success":          rs.subtle==="50"?"#22c55e":"#4ade80",
    "color-warning":          rs.subtle==="50"?"#f59e0b":"#fbbf24",
    "color-error":            rs.subtle==="50"?"#ef4444":"#f87171",
    "color-info":             rs.subtle==="50"?"#3b82f6":"#60a5fa",
  };
}

function generateSemanticTokens(pHex,sHex,aHex,nF,roleSteps){
  const pF=generateScale(pHex),sF=generateScale(sHex),aF=generateScale(aHex);
  // dark role steps: merge light roleSteps direction with dark inversion
  const darkRs={
    subtle: DARK_ROLE_STEPS.subtle,
    chip:   DARK_ROLE_STEPS.chip,
    light:  DARK_ROLE_STEPS.light,
    base:   roleSteps.base==="500"?"400":roleSteps.base,
    hover:  roleSteps.hover==="700"?"300":roleSteps.hover,
    dark:   roleSteps.dark==="800"?"200":roleSteps.dark,
  };
  return {
    light: buildSemanticSet(pF,sF,aF,nF,roleSteps),
    dark:  buildSemanticSet(pF,sF,aF,nF,darkRs),
  };
}

// ── Harmony ───────────────────────────────────────────────────────
function getHarmonyPatterns(primaryHex){
  const [h,s,l]=hexToHsl(primaryHex);
  const sl=Math.max(30,s-5),ll=Math.min(65,l+3);
  return {
    secondary:[
      {id:"s1",name:"コンプリメンタリー",desc:"補色 180°",    hex:hslToHex((h+180)%360,sl,ll)},
      {id:"s2",name:"アナロガス",         desc:"類似色 +30°",  hex:hslToHex((h+30)%360, sl,ll)},
      {id:"s3",name:"スプリット補色",     desc:"分裂補色 +150°",hex:hslToHex((h+150)%360,sl,ll)},
    ],
    accent:[
      {id:"a1",name:"トライアド",       desc:"三角配色 +120°",hex:hslToHex((h+120)%360,Math.min(90,s+10),Math.min(60,l))},
      {id:"a2",name:"テトラッド",       desc:"四角配色 +90°", hex:hslToHex((h+90)%360, Math.min(90,s+10),Math.min(58,l))},
      {id:"a3",name:"スプリット補色 B", desc:"分裂補色 +210°",hex:hslToHex((h+210)%360,Math.min(90,s+15),Math.min(60,l-2))},
    ],
  };
}

// ── UI Theme ──────────────────────────────────────────────────────
const THEMES={
  dark:{
    pageBg:"#0c0c0e",cardBg:"#111118",cardBorder:"#222228",
    innerBg:"#0c0c0e",innerBorder:"#1a1a22",
    deepBg:"#080809",deepBorder:"#1a1a20",
    text:"#e8e8ec",textMuted:"#777",textDim:"#555",textFaint:"#444",
    inputBg:"#0c0c0e",inputBorder:"#2a2a30",
    codeText:"#8ecaff",
    accent:"#4a9eff",accentBg:"#111e30",accentBorder:"#1e2e44",
    tagBg:"#4a9eff22",tagBorder:"#4a9eff44",
    btnBg:"#1a1a20",btnHoverBg:"#1a3a2a",btnHoverText:"#4aef99",
    stripBorder:"rgba(255,255,255,0.05)",
    successHex:"#4aef99",warningHex:"#f59e0b",errorHex:"#ef4444",
  },
  light:{
    pageBg:"#f0f0f5",cardBg:"#ffffff",cardBorder:"#dddde8",
    innerBg:"#f8f8fc",innerBorder:"#e4e4ee",
    deepBg:"#f0f2f8",deepBorder:"#dde0ee",
    text:"#1a1a2e",textMuted:"#4a4a68",textDim:"#7a7a98",textFaint:"#aaaabc",
    inputBg:"#f5f5fa",inputBorder:"#c8c8da",
    codeText:"#1a3a8a",
    accent:"#2266dd",accentBg:"#e8f0ff",accentBorder:"#bdd0f8",
    tagBg:"#2266dd22",tagBorder:"#2266dd44",
    btnBg:"#eeeef6",btnHoverBg:"#d0f0e0",btnHoverText:"#1a7a4a",
    stripBorder:"rgba(0,0,0,0.06)",
    successHex:"#16a34a",warningHex:"#d97706",errorHex:"#dc2626",
  },
};

// ── Export ────────────────────────────────────────────────────────
const EXPORT_FORMATS=["CSS Variables","SCSS","Tailwind","JSON","Figma Variables"];

// themeMode: "light" | "dark" | "both"
function buildExport(format,pHex,sHex,aHex,steps,roleSteps,themeMode="both"){
  const pF=generateScale(pHex),sF=generateScale(sHex),aF=generateScale(aHex),nF=generateNeutral(pHex);
  const keys=STEP_KEYS[steps];
  const scaleMap={primary:pF,secondary:sF,accent:aF,neutral:nF};
  const filtered=Object.fromEntries(Object.entries(scaleMap).map(([n,f])=>[n,keys.map(k=>({key:k,hex:f[k]}))]));
  const {light:semL,dark:semD}=generateSemanticTokens(pHex,sHex,aHex,nF,roleSteps);

  const useLight=themeMode==="light"||themeMode==="both";
  const useDark =themeMode==="dark" ||themeMode==="both";

  if(format==="CSS Variables"){
    const l=[`:root {`,`  /* ── Primitive (${steps}-step) ─────────── */`];
    for(const [n,sc] of Object.entries(filtered)) sc.forEach(({key,hex})=>l.push(`  --color-${n}-${key}: ${hex};`));
    if(useLight){
      l.push(``,`  /* ── Semantic · Light Mode ──────────── */`);
      for(const [k,v] of Object.entries(semL)) l.push(`  --${k}: ${v};`);
    }
    l.push(`}`);
    if(useDark){
      const selector=themeMode==="dark"?`:root`:`[data-theme="dark"]`;
      l.push(``,`${selector} {`,`  /* ── Semantic · Dark Mode ───────────── */`);
      for(const [k,v] of Object.entries(semD)) l.push(`  --${k}: ${v};`);
      l.push(`}`);
    }
    return l.join("\n");
  }
  if(format==="SCSS"){
    const l=[`// ── Primitive (${steps}-step) ──────────────────`];
    for(const [n,sc] of Object.entries(filtered)) sc.forEach(({key,hex})=>l.push(`$color-${n}-${key}: ${hex};`));
    if(useLight){
      l.push(``,`// ── Semantic · Light ────────────────────────`);
      for(const [k,v] of Object.entries(semL)) l.push(`$${k}${themeMode==="both"?"-light":""}: ${v};`);
    }
    if(useDark){
      l.push(``,`// ── Semantic · Dark ─────────────────────────`);
      for(const [k,v] of Object.entries(semD)) l.push(`$${k}${themeMode==="both"?"-dark":""}: ${v};`);
    }
    return l.join("\n");
  }
  if(format==="Tailwind"){
    const colors={};
    for(const [n,sc] of Object.entries(filtered)){colors[n]={};sc.forEach(({key,hex})=>{colors[n][key]=hex;});}
    const note=themeMode==="both"?"darkMode: 'class',":themeMode==="dark"?"// dark-only tokens":"// light-only tokens";
    return `// tailwind.config.js\n${note}\nmodule.exports = {\n  darkMode: 'class',\n  theme: {\n    extend: {\n      colors: ${JSON.stringify(colors,null,6)}\n    }\n  }\n}`;
  }
  if(format==="JSON"){
    const prim={};
    for(const [n,sc] of Object.entries(filtered)){prim[n]={};sc.forEach(({key,hex})=>{prim[n][key]={value:hex,type:"color"};});}
    const sl={},sd={};
    for(const [k,v] of Object.entries(semL)) sl[k]={value:v,type:"color"};
    for(const [k,v] of Object.entries(semD)) sd[k]={value:v,type:"color"};
    const semantic=
      themeMode==="both" ?{light:sl,dark:sd}:
      themeMode==="light"?sl:sd;
    return JSON.stringify({primitive:prim,semantic},null,2);
  }
  if(format==="Figma Variables"){
    const toRgb=(hex)=>{const [r,g,b]=hexToRgb(hex).map(v=>v/255);return {r,g,b,a:1};};
    const primE=[];
    for(const [n,sc] of Object.entries(filtered)) sc.forEach(({key,hex})=>primE.push([`${n}/${key}`,hex]));
    const primVars=primE.map(([name,hex])=>({name,resolvedType:"COLOR",valuesByMode:{"1":toRgb(hex)}}));
    const lE=Object.entries(semL).map(([k,v])=>[k.replace(/^color-/,"").replace(/-/g,"/"),v]);
    const dE=Object.entries(semD).map(([k,v])=>[k.replace(/^color-/,"").replace(/-/g,"/"),v]);
    let semModes,semVars;
    if(themeMode==="both"){
      semModes=[{modeId:"L",name:"Light"},{modeId:"D",name:"Dark"}];
      semVars=lE.map(([name,lh])=>{
        const dh=dE.find(([n])=>n===name)?.[1]||"#ffffff";
        return {name,resolvedType:"COLOR",valuesByMode:{"L":toRgb(lh),"D":toRgb(dh)}};
      });
    } else if(themeMode==="light"){
      semModes=[{modeId:"L",name:"Light"}];
      semVars=lE.map(([name,hex])=>({name,resolvedType:"COLOR",valuesByMode:{"L":toRgb(hex)}}));
    } else {
      semModes=[{modeId:"D",name:"Dark"}];
      semVars=dE.map(([name,hex])=>({name,resolvedType:"COLOR",valuesByMode:{"D":toRgb(hex)}}));
    }
    return JSON.stringify({version:"1.0",collections:[
      {name:"Primitive",modes:[{modeId:"1",name:"Value"}],defaultModeId:"1",variables:primVars},
      {name:"Semantic", modes:semModes,defaultModeId:semModes[0].modeId,variables:semVars},
    ]},null,2);
  }
}

// ── Gradient Utilities ────────────────────────────────────────────
const LINEAR_DIRECTIONS=[
  {label:"→",     value:"to right",          angle:90},
  {label:"↓",     value:"to bottom",         angle:180},
  {label:"↗",     value:"to top right",      angle:45},
  {label:"↘",     value:"to bottom right",   angle:135},
  {label:"←",     value:"to left",           angle:270},
  {label:"↑",     value:"to top",            angle:0},
  {label:"↖",     value:"to top left",       angle:315},
  {label:"↙",     value:"to bottom left",    angle:225},
];

function buildGradientCSS(grad){
  const stops=grad.stops.map(s=>`${s.hex} ${s.pos}%`).join(", ");
  if(grad.type==="radial") return `radial-gradient(circle, ${stops})`;
  if(grad.type==="conic")  return `conic-gradient(from ${grad.angle}deg, ${stops})`;
  return `linear-gradient(${grad.angle}deg, ${stops})`;
}

function makePresetGradients(pF,sF,aF){
  // same-hue tonal
  const tonal=(name,slug,full,from,to)=>({
    name,slug,type:"linear",angle:135,
    stops:[{hex:full[from],pos:0},{hex:full[to],pos:100}],
    category:"同色系",
  });
  // cross-color
  const cross=(name,slug,h1,h2,cat="カラー間")=>({
    name,slug,type:"linear",angle:135,
    stops:[{hex:h1,pos:0},{hex:h2,pos:100}],
    category:cat,
  });
  return [
    tonal("Primary Tonal Light","primary-tonal-light", pF,"100","400"),
    tonal("Primary Tonal",      "primary-tonal",       pF,"300","700"),
    tonal("Primary Tonal Dark", "primary-tonal-dark",  pF,"600","900"),
    tonal("Secondary Tonal",    "secondary-tonal",     sF,"300","700"),
    tonal("Accent Tonal",       "accent-tonal",        aF,"300","700"),
    cross("Primary → Secondary","primary-to-secondary",pF["500"],sF["500"]),
    cross("Primary → Accent",   "primary-to-accent",   pF["500"],aF["500"]),
    cross("Secondary → Accent", "secondary-to-accent", sF["500"],aF["500"]),
    {name:"Primary → Secondary → Accent","slug":"tri-blend",type:"linear",angle:135,
     stops:[{hex:pF["500"],pos:0},{hex:sF["500"],pos:50},{hex:aF["500"],pos:100}],category:"3色"},
    {name:"Light Fade",         slug:"light-fade",     type:"linear",angle:180,
     stops:[{hex:pF["50"],pos:0},{hex:"#ffffff",pos:100}],category:"フェード"},
    {name:"Dark Fade",          slug:"dark-fade",      type:"linear",angle:180,
     stops:[{hex:pF["900"],pos:0},{hex:"#000000",pos:100}],category:"フェード"},
    {name:"Primary Radial",     slug:"primary-radial", type:"radial",angle:0,
     stops:[{hex:pF["300"],pos:0},{hex:pF["700"],pos:100}],category:"Radial"},
  ];
}

function buildGradientExport(gradients,format){
  if(format==="CSS Variables"){
    const l=[":root {","  /* ── Gradients ──────────────── */"];
    gradients.forEach(g=>l.push(`  --gradient-${g.slug}: ${buildGradientCSS(g)};`));
    l.push("}"); return l.join("\n");
  }
  if(format==="SCSS"){
    return gradients.map(g=>`$gradient-${g.slug}: ${buildGradientCSS(g)};`).join("\n");
  }
  if(format==="theme.json"){
    const list=gradients.map(g=>({
      name:g.name, slug:g.slug, gradient:buildGradientCSS(g),
    }));
    return JSON.stringify({"settings":{"color":{"gradients":list}}},null,2);
  }
  if(format==="JSON"){
    const obj={};
    gradients.forEach(g=>{obj[`gradient-${g.slug}`]={value:buildGradientCSS(g),type:"gradient"};});
    return JSON.stringify(obj,null,2);
  }
}

// ── Gradient Tab Component ────────────────────────────────────────
const GRAD_EXPORT_FORMATS=["CSS Variables","SCSS","theme.json","JSON"];
const GRAD_CATEGORIES=["すべて","同色系","カラー間","3色","フェード","Radial"];

function GradientTab({presets,T,paletteFull,semanticTokens}){
  const [selected,setSelected]=useState(null); // index
  const [customStops,setCustomStops]=useState(null); // override stops
  const [customType,setCustomType]=useState("linear");
  const [customAngle,setCustomAngle]=useState(135);
  const [savedList,setSavedList]=useState(()=>presets.slice(0,8));
  const [catFilter,setCatFilter]=useState("すべて");
  const [gradExportFmt,setGradExportFmt]=useState("CSS Variables");
  const [gradCopied,setGradCopied]=useState(false);
  const [openPickerIdx,setOpenPickerIdx]=useState(null); // which stop has picker open
  const [pickerTab,setPickerTab]=useState("scale"); // "scale" | "semantic"

  const filtered=useMemo(()=>
    catFilter==="すべて"?presets:presets.filter(g=>g.category===catFilter),
  [presets,catFilter]);

  const activePre=selected!=null?filtered[selected]:null;
  const editGrad=activePre?{
    ...activePre,
    stops:customStops||activePre.stops,
    type:customType,angle:customAngle,
  }:null;

  const selectPreset=(i)=>{
    setSelected(i);
    const g=filtered[i];
    setCustomStops(null);
    setCustomType(g.type);
    setCustomAngle(g.angle);
  };

  const updateStop=(idx,field,val)=>{
    const base=customStops||(activePre?.stops||[]);
    const next=base.map((s,i)=>i===idx?{...s,[field]:val}:s);
    setCustomStops(next);
  };

  const addStop=()=>{
    const base=customStops||(activePre?.stops||[]);
    setCustomStops([...base,{hex:"#888888",pos:50}]);
  };

  const removeStop=(idx)=>{
    const base=customStops||(activePre?.stops||[]);
    if(base.length<=2) return;
    setCustomStops(base.filter((_,i)=>i!==idx));
  };

  const saveToList=()=>{
    if(!editGrad) return;
    const slug=`custom-${Date.now()}`;
    setSavedList(prev=>[...prev,{...editGrad,slug,name:"カスタム "+slug.slice(-4),category:"カスタム"}]);
  };

  const gradExportCode=useMemo(()=>buildGradientExport(savedList,gradExportFmt),[savedList,gradExportFmt]);

  const mono=(extra={})=>({fontFamily:"'DM Mono',monospace",...extra});

  return(
    <div>
      {/* Category filter */}
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
        {GRAD_CATEGORIES.map(c=>(
          <button key={c} onClick={()=>{setCatFilter(c);setSelected(null);}} style={{
            padding:"4px 12px",borderRadius:7,cursor:"pointer",
            border:`1.5px solid ${catFilter===c?T.accent:T.innerBorder}`,
            background:catFilter===c?T.accentBg:"transparent",
            color:catFilter===c?T.accent:T.textDim,
            fontSize:11,...mono(),transition:"all .13s",
          }}>{c}</button>
        ))}
      </div>

      {/* Preset grid */}
      <div style={{
        display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",
        gap:8,marginBottom:20,
      }}>
        {filtered.map((g,i)=>{
          const css=buildGradientCSS(g);
          const isActive=selected===i;
          return(
            <div key={g.slug} onClick={()=>selectPreset(i)} style={{
              borderRadius:12,overflow:"hidden",cursor:"pointer",
              border:`2px solid ${isActive?T.accent:T.cardBorder}`,
              transition:"all .15s",background:T.cardBg,
            }}>
              <div style={{height:64,background:css,transition:"background .2s"}}/>
              <div style={{padding:"8px 10px"}}>
                <div style={{fontSize:11,fontWeight:600,color:isActive?T.accent:T.text,marginBottom:2,
                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{g.name}</div>
                <div style={{fontSize:9,color:T.textFaint,...mono()}}>{g.category}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Editor panel */}
      {editGrad&&(
        <div style={{background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:14,padding:"20px 22px",marginBottom:20}}>
          <div style={{fontSize:12,fontWeight:600,color:T.textMuted,marginBottom:14,letterSpacing:.5}}>
            エディタ — {activePre?.name}
          </div>

          {/* Big preview */}
          <div style={{
            height:100,borderRadius:12,background:buildGradientCSS(editGrad),
            marginBottom:16,border:`1px solid ${T.cardBorder}`,
            display:"flex",alignItems:"flex-end",padding:"8px 12px",
          }}>
            <code style={{
              background:"rgba(0,0,0,0.5)",color:"#fff",borderRadius:5,
              fontSize:9,...mono(),padding:"3px 8px",wordBreak:"break-all",lineHeight:1.4,
            }}>{buildGradientCSS(editGrad)}</code>
          </div>

          {/* Type selector */}
          <div style={{display:"flex",gap:20,marginBottom:14,flexWrap:"wrap"}}>
            <div>
              <div style={{fontSize:10,color:T.textFaint,...mono(),marginBottom:6}}>タイプ</div>
              <div style={{display:"flex",gap:5}}>
                {["linear","radial","conic"].map(t=>(
                  <button key={t} onClick={()=>setCustomType(t)} style={{
                    padding:"4px 12px",borderRadius:7,cursor:"pointer",
                    border:`1.5px solid ${customType===t?T.accent:T.innerBorder}`,
                    background:customType===t?T.accentBg:"transparent",
                    color:customType===t?T.accent:T.textDim,
                    fontSize:11,...mono(),transition:"all .13s",
                  }}>{t}</button>
                ))}
              </div>
            </div>

            {/* Direction (linear/conic) */}
            {(customType==="linear"||customType==="conic")&&(
              <div>
                <div style={{fontSize:10,color:T.textFaint,...mono(),marginBottom:6}}>
                  方向 ({customAngle}°)
                </div>
                <div style={{display:"flex",gap:3,flexWrap:"wrap",maxWidth:220}}>
                  {LINEAR_DIRECTIONS.map(d=>(
                    <button key={d.value} onClick={()=>setCustomAngle(d.angle)} title={d.value} style={{
                      width:32,height:32,borderRadius:6,cursor:"pointer",fontSize:14,
                      border:`1.5px solid ${customAngle===d.angle?T.accent:T.innerBorder}`,
                      background:customAngle===d.angle?T.accentBg:"transparent",
                      color:customAngle===d.angle?T.accent:T.textDim,
                      display:"flex",alignItems:"center",justifyContent:"center",
                    }}>{d.label}</button>
                  ))}
                  {/* Custom angle input */}
                  <input type="number" min={0} max={360} value={customAngle}
                    onChange={e=>setCustomAngle(Number(e.target.value))}
                    style={{
                      width:52,padding:"4px 6px",borderRadius:6,
                      background:T.inputBg,border:`1.5px solid ${T.inputBorder}`,
                      color:T.text,...mono(),fontSize:11,outline:"none",
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Color stops */}
          <div style={{marginBottom:12}}>
            <div style={{fontSize:10,color:T.textFaint,...mono(),marginBottom:8,
              display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span>カラーストップ</span>
              <button onClick={addStop} style={{
                background:T.accentBg,border:`1px solid ${T.accentBorder}`,color:T.accent,
                borderRadius:6,fontSize:10,padding:"2px 10px",cursor:"pointer",...mono(),
              }}>＋ 追加</button>
            </div>
            {(customStops||editGrad.stops).map((stop,idx)=>(
              <div key={idx} style={{marginBottom:8}}>
                {/* Stop row */}
                <div style={{
                  display:"flex",alignItems:"center",gap:8,
                  background:T.innerBg,borderRadius:openPickerIdx===idx?"8px 8px 0 0":"8px",
                  padding:"6px 10px",
                  borderBottom:openPickerIdx===idx?`1px solid ${T.cardBorder}`:"none",
                }}>
                  {/* Current color swatch + native picker */}
                  <div style={{position:"relative",flexShrink:0}}>
                    <div style={{
                      width:32,height:32,borderRadius:7,background:stop.hex,
                      border:`2px solid ${openPickerIdx===idx?T.accent:T.inputBorder}`,
                      cursor:"pointer",transition:"border-color .15s",
                    }} onClick={()=>setOpenPickerIdx(openPickerIdx===idx?null:idx)}/>
                    {/* invisible native color input overlay for direct pick */}
                    <input type="color" value={stop.hex}
                      onChange={e=>updateStop(idx,"hex",e.target.value)}
                      style={{
                        position:"absolute",inset:0,opacity:0,cursor:"pointer",
                        width:"100%",height:"100%",
                      }}/>
                  </div>

                  <input type="text" value={stop.hex} maxLength={7}
                    onChange={e=>{if(isValidHex(e.target.value))updateStop(idx,"hex",e.target.value);}}
                    style={{
                      background:T.inputBg,border:`1px solid ${T.inputBorder}`,borderRadius:6,
                      padding:"4px 8px",color:T.text,...mono(),fontSize:11,outline:"none",width:88,
                    }}/>

                  {/* Palette picker toggle button */}
                  <button onClick={()=>{setOpenPickerIdx(openPickerIdx===idx?null:idx);setPickerTab("scale");}}
                    title="パレットから選択" style={{
                    padding:"3px 9px",borderRadius:6,cursor:"pointer",flexShrink:0,
                    border:`1px solid ${openPickerIdx===idx?T.accent:T.innerBorder}`,
                    background:openPickerIdx===idx?T.accentBg:"transparent",
                    color:openPickerIdx===idx?T.accent:T.textFaint,
                    fontSize:10,...mono(),transition:"all .13s",
                  }}>🎨</button>

                  <span style={{fontSize:10,color:T.textFaint,...mono(),flexShrink:0}}>位置</span>
                  <input type="range" min={0} max={100} value={stop.pos}
                    onChange={e=>updateStop(idx,"pos",Number(e.target.value))}
                    style={{flex:1,accentColor:T.accent}}/>
                  <span style={{...mono(),fontSize:11,color:T.textMuted,width:32,textAlign:"right"}}>{stop.pos}%</span>
                  <button onClick={()=>removeStop(idx)} style={{
                    background:"transparent",border:`1px solid ${T.cardBorder}`,
                    borderRadius:5,color:T.textFaint,fontSize:11,
                    width:22,height:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                  }}>✕</button>
                </div>

                {/* Inline palette picker panel */}
                {openPickerIdx===idx&&(
                  <div style={{
                    background:T.innerBg,borderRadius:"0 0 8px 8px",
                    border:`1px solid ${T.cardBorder}`,borderTop:"none",
                    padding:"10px 12px",
                  }}>
                    {/* Tab: Scale / Semantic */}
                    <div style={{display:"flex",gap:5,marginBottom:10}}>
                      {["scale","semantic"].map(pt=>(
                        <button key={pt} onClick={()=>setPickerTab(pt)} style={{
                          padding:"3px 12px",borderRadius:6,cursor:"pointer",
                          border:`1px solid ${pickerTab===pt?T.accent:T.innerBorder}`,
                          background:pickerTab===pt?T.accentBg:"transparent",
                          color:pickerTab===pt?T.accent:T.textDim,
                          fontSize:10,...mono(),transition:"all .12s",
                        }}>{pt==="scale"?"スケール":"セマンティック"}</button>
                      ))}
                    </div>

                    {pickerTab==="scale"&&(
                      <div>
                        {Object.entries(paletteFull).map(([name,full])=>(
                          <div key={name} style={{marginBottom:8}}>
                            <div style={{fontSize:9,color:T.textFaint,...mono(),
                              letterSpacing:1,textTransform:"uppercase",marginBottom:5}}>{name}</div>
                            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                              {SCALE_STEP_OPTIONS.map(step=>{
                                const hex=full[step];
                                const isActive=stop.hex===hex;
                                return(
                                  <div key={step} onClick={()=>{updateStop(idx,"hex",hex);setOpenPickerIdx(null);}}
                                    title={`${name}-${step}: ${hex}`}
                                    style={{
                                      width:34,borderRadius:6,overflow:"hidden",
                                      border:`2px solid ${isActive?T.accent:"transparent"}`,
                                      cursor:"pointer",transition:"border-color .1s",flexShrink:0,
                                    }}>
                                    <div style={{height:22,background:hex}}/>
                                    <div style={{
                                      background:T.cardBg,padding:"1px 2px",
                                      fontSize:7,...mono(),color:T.textFaint,textAlign:"center",
                                    }}>{step}</div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {pickerTab==="semantic"&&(
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        {Object.entries(semanticTokens).map(([key,hex])=>{
                          const isActive=stop.hex===hex;
                          return(
                            <div key={key} onClick={()=>{updateStop(idx,"hex",hex);setOpenPickerIdx(null);}}
                              title={`--${key}: ${hex}`}
                              style={{
                                display:"flex",flexDirection:"column",alignItems:"center",
                                width:44,cursor:"pointer",
                                border:`2px solid ${isActive?T.accent:"transparent"}`,
                                borderRadius:6,overflow:"hidden",transition:"border-color .1s",flexShrink:0,
                              }}>
                              <div style={{width:"100%",height:22,background:hex}}/>
                              <div style={{
                                background:T.cardBg,padding:"2px 2px",width:"100%",
                                fontSize:6,...mono(),color:T.textFaint,textAlign:"center",
                                overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",
                              }}>{key.replace("color-","")}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button onClick={saveToList} style={{
            padding:"6px 18px",borderRadius:8,cursor:"pointer",
            background:T.accentBg,border:`1.5px solid ${T.accent}`,color:T.accent,
            fontSize:11,...mono(),transition:"all .15s",
          }}>＋ 保存リストに追加</button>
        </div>
      )}

      {/* Saved list + export */}
      <div style={{background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:14,padding:"20px 22px"}}>
        <div style={{fontSize:12,fontWeight:600,color:T.textMuted,marginBottom:10,letterSpacing:.5}}>
          保存済みグラデーション（エクスポート対象）
        </div>

        {/* Saved swatches */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
          {savedList.map((g,i)=>(
            <div key={g.slug} style={{
              width:80,borderRadius:9,overflow:"hidden",
              border:`1px solid ${T.cardBorder}`,flexShrink:0,
            }}>
              <div style={{height:40,background:buildGradientCSS(g)}}/>
              <div style={{padding:"4px 6px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <span style={{fontSize:8,color:T.textFaint,...mono(),
                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:55}}>
                  {g.slug.replace("gradient-","").slice(0,12)}
                </span>
                <button onClick={()=>setSavedList(l=>l.filter((_,j)=>j!==i))} style={{
                  background:"transparent",border:"none",color:T.textFaint,
                  fontSize:10,cursor:"pointer",padding:0,flexShrink:0,
                }}>✕</button>
              </div>
            </div>
          ))}
        </div>

        {/* Format + copy */}
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center",marginBottom:12}}>
          {GRAD_EXPORT_FORMATS.map(f=>(
            <button key={f} onClick={()=>setGradExportFmt(f)} style={{
              padding:"4px 12px",borderRadius:7,cursor:"pointer",
              border:`1.5px solid ${gradExportFmt===f?T.accent:T.cardBorder}`,
              background:gradExportFmt===f?T.accentBg:"transparent",
              color:gradExportFmt===f?T.accent:T.textDim,
              fontSize:11,...mono(),transition:"all .13s",
            }}>{f}</button>
          ))}
          <button onClick={()=>{navigator.clipboard.writeText(gradExportCode);setGradCopied(true);setTimeout(()=>setGradCopied(false),1800);}} style={{
            padding:"5px 16px",borderRadius:8,border:`1.5px solid ${T.cardBorder}`,
            background:gradCopied?T.btnHoverBg:T.btnBg,color:gradCopied?T.btnHoverText:T.textMuted,
            fontSize:11,...mono(),cursor:"pointer",transition:"all .2s",marginLeft:"auto",
          }}>{gradCopied?"✓ Copied":"Copy"}</button>
        </div>

        {gradExportFmt==="theme.json"&&(
          <div style={{background:T.innerBg,border:`1px solid ${T.innerBorder}`,
            borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:10,
            color:T.textMuted,...mono(),lineHeight:1.5}}>
            💡 WordPress theme.json の <code>settings.color.gradients</code> 形式です。既存 theme.json の該当箇所にマージしてください。
          </div>
        )}

        <pre style={{
          background:T.deepBg,border:`1px solid ${T.deepBorder}`,borderRadius:10,
          padding:"12px 14px",fontSize:10,...mono(),
          color:T.codeText,overflowX:"auto",margin:0,lineHeight:1.8,
          maxHeight:320,overflowY:"auto",
        }}>{gradExportCode}</pre>
      </div>
    </div>
  );
}


const TABS=["スケール","セマンティック","コントラスト","グラデーション","エクスポート"];

// Compact WCAG badge: shows W(hite) or B(lack) text pass level
function WcagBadge({ratio,label}){
  const level=wcagLevel(ratio);
  if(level==="失敗") return(
    <span style={{
      background:"rgba(0,0,0,0.35)",color:"rgba(255,255,255,0.45)",
      borderRadius:3,fontSize:7,padding:"1px 4px",fontFamily:"'DM Mono',monospace",
      fontWeight:600,letterSpacing:.3,lineHeight:1,
    }}>{label}✕</span>
  );
  const isAAA=level==="AAA";
  return(
    <span style={{
      background:isAAA?"rgba(0,0,0,0.55)":"rgba(0,0,0,0.35)",
      color:isAAA?"#7fffb0":"#ffffffcc",
      borderRadius:3,fontSize:7,padding:"1px 4px",fontFamily:"'DM Mono',monospace",
      fontWeight:700,letterSpacing:.3,lineHeight:1,
    }}>{label}{isAAA?"AAA":"AA"}</span>
  );
}

function ScaleRow({tokenName,scale,T,showBadges=true}){
  return(
    <div style={{marginBottom:18}}>
      <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.textFaint,marginBottom:7,letterSpacing:.3}}>{tokenName}</div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
        {scale.map(({key,hex})=>{
          const fg=getContrastColor(hex);
          const wRatio=contrastRatio(hex,"#ffffff");
          const bRatio=contrastRatio(hex,"#1a1a1a");
          return(
            <div key={key} title={`${hex}\n白テキスト ${wRatio}:1 / 黒テキスト ${bRatio}:1`} style={{
              background:hex,color:fg,borderRadius:8,display:"flex",flexDirection:"column",
              alignItems:"center",justifyContent:"center",padding:"8px 4px",minWidth:62,
              fontSize:9,fontFamily:"'DM Mono',monospace",gap:3,cursor:"default",
              transition:"transform .12s",userSelect:"none",
            }}
            onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
            onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}
            >
              <span style={{fontWeight:700,fontSize:10}}>{key}</span>
              <span style={{opacity:.7,fontSize:8}}>{hex}</span>
              {showBadges&&(
                <div style={{display:"flex",gap:2,marginTop:1}}>
                  <WcagBadge ratio={wRatio} label="W "/>
                  <WcagBadge ratio={bRatio} label="B "/>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Surface/Background contrast matrix — middle steps only (300-700)
const SURFACE_CHECK_KEYS=["300","400","500","600","700"];

function ScaleContrastMatrix({label,fullScale,surfaceHex,bgHex,T}){
  const keys=Object.keys(fullScale).filter(k=>SURFACE_CHECK_KEYS.includes(k));
  const levelColor=(l)=>l==="AAA"?"#4aef99":l==="AA"?T.accent:l==="Large AA"?"#f59e0b":"#ef4444";
  const Cell=({hex,against,againstLabel})=>{
    const ratio=contrastRatio(hex,against);
    const level=wcagLevel(ratio);
    const lc=levelColor(level);
    return(
      <div style={{
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        height:52,borderRadius:7,background:against,
        border:`1.5px solid ${level==="失敗"?"#c03030":"#30a050"}`,
        gap:2,padding:"4px",
      }}>
        <span style={{
          color:hex,fontFamily:"'DM Mono',monospace",fontSize:10,fontWeight:700,
        }}>Aa</span>
        <span style={{
          background:lc+"22",border:`1px solid ${lc}55`,color:lc,
          borderRadius:4,fontSize:8,padding:"1px 5px",fontFamily:"'DM Mono',monospace",fontWeight:700,
        }}>{level==="失敗"?"✕":level} {ratio}:1</span>
        <span style={{fontSize:8,color:T.textFaint,fontFamily:"'DM Mono',monospace"}}>{againstLabel}</span>
      </div>
    );
  };
  return(
    <div style={{marginBottom:20}}>
      <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.textFaint,marginBottom:8,letterSpacing:.3}}>
        {label} — Surface / Background 対比（300〜700）
      </div>
      <div style={{
        display:"grid",
        gridTemplateColumns:`auto repeat(${keys.length},1fr)`,
        gap:4,alignItems:"center",
      }}>
        {/* header */}
        <div style={{fontSize:8,color:T.textFaint,fontFamily:"'DM Mono',monospace",textAlign:"right",paddingRight:6}}>step →</div>
        {keys.map(k=>(
          <div key={k} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            <div style={{width:28,height:28,borderRadius:5,background:fullScale[k],border:`1px solid ${T.cardBorder}`}}/>
            <span style={{fontSize:8,color:T.textFaint,fontFamily:"'DM Mono',monospace"}}>{k}</span>
          </div>
        ))}
        {/* Surface row */}
        <div style={{fontSize:8,color:T.textFaint,fontFamily:"'DM Mono',monospace",textAlign:"right",paddingRight:6}}>Surface</div>
        {keys.map(k=>(
          <Cell key={k} hex={fullScale[k]} against={surfaceHex} againstLabel="surface"/>
        ))}
        {/* Background row */}
        <div style={{fontSize:8,color:T.textFaint,fontFamily:"'DM Mono',monospace",textAlign:"right",paddingRight:6}}>Background</div>
        {keys.map(k=>(
          <Cell key={k} hex={fullScale[k]} against={bgHex} againstLabel="bg"/>
        ))}
      </div>
    </div>
  );
}

function PatternCard({pattern,selected,onSelect,T}){
  const fg=getContrastColor(pattern.hex);
  const sc=generateScale(pattern.hex);
  return(
    <div onClick={onSelect} style={{
      border:`2px solid ${selected?T.accent:T.cardBorder}`,borderRadius:12,
      padding:"12px 13px",cursor:"pointer",
      background:selected?T.accentBg:T.innerBg,
      transition:"all .15s",flex:"1 1 140px",minWidth:130,
    }}>
      <div style={{display:"flex",gap:3,marginBottom:8}}>
        {["200","400","500","600","800"].map(k=>(
          <div key={k} style={{flex:1,height:16,borderRadius:4,background:sc[k]}}/>
        ))}
      </div>
      <div style={{
        height:30,borderRadius:7,background:pattern.hex,display:"flex",alignItems:"center",
        justifyContent:"center",color:fg,fontFamily:"'DM Mono',monospace",fontSize:11,marginBottom:8,
      }}>{pattern.hex}</div>
      <div style={{fontSize:11,fontWeight:600,color:selected?T.text:T.textMuted,marginBottom:2}}>{pattern.name}</div>
      <div style={{fontSize:10,color:T.textFaint,marginBottom:selected?6:0}}>{pattern.desc}</div>
      {selected&&<span style={{
        background:T.tagBg,border:`1px solid ${T.tagBorder}`,color:T.accent,
        borderRadius:5,fontSize:9,padding:"2px 7px",fontFamily:"'DM Mono',monospace",fontWeight:600,
      }}>選択中</span>}
    </div>
  );
}

function RoleMappingEditor({roleSteps,setRoleSteps,primaryFull,T}){
  const roles=Object.keys(DEFAULT_ROLE_STEPS);
  return(
    <div style={{background:T.innerBg,border:`1px solid ${T.innerBorder}`,borderRadius:12,padding:"16px 18px",marginBottom:16}}>
      <div style={{fontSize:11,fontWeight:600,color:T.textMuted,marginBottom:4,letterSpacing:.5,display:"flex",alignItems:"center",gap:8}}>
        ステップ → セマンティックロール マッピング
        <button onClick={()=>setRoleSteps({...DEFAULT_ROLE_STEPS})} style={{
          background:"transparent",border:`1px solid ${T.cardBorder}`,borderRadius:6,
          color:T.textDim,fontSize:9,padding:"2px 8px",cursor:"pointer",
          fontFamily:"'DM Mono',monospace",marginLeft:"auto",
        }}>デフォルトに戻す</button>
      </div>
      <div style={{fontSize:10,color:T.textFaint,marginBottom:12,lineHeight:1.5}}>
        各ロールのライトモード割り当てを変更できます。ダークモードは自動で反転します。
      </div>
      <div style={{display:"flex",gap:0,borderRadius:9,overflow:"hidden",marginBottom:14,height:28}}>
        {roles.map(role=>{
          const hex=primaryFull[roleSteps[role]];
          return(
            <div key={role} style={{
              flex:1,background:hex,display:"flex",alignItems:"center",justifyContent:"center",
              color:getContrastColor(hex),fontFamily:"'DM Mono',monospace",fontSize:8,letterSpacing:.2,
            }}>{role}</div>
          );
        })}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>
        {roles.map(role=>{
          const {label,desc}=ROLE_META[role];
          const cur=roleSteps[role];
          const hex=primaryFull[cur];
          return(
            <div key={role} style={{background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:9,padding:"10px 12px",display:"flex",gap:10,alignItems:"center"}}>
              <div style={{width:34,height:34,borderRadius:7,background:hex,flexShrink:0,border:`1px solid ${T.stripBorder}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{color:getContrastColor(hex),fontFamily:"'DM Mono',monospace",fontSize:9,fontWeight:700}}>{cur}</span>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'DM Mono',monospace",fontSize:11,color:T.text,fontWeight:600,marginBottom:2}}>-{label}</div>
                <div style={{fontSize:9,color:T.textFaint,marginBottom:5,lineHeight:1.4}}>{desc}</div>
                <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
                  {SCALE_STEP_OPTIONS.map(step=>(
                    <button key={step} onClick={()=>setRoleSteps(prev=>({...prev,[role]:step}))} style={{
                      padding:"2px 6px",borderRadius:5,
                      border:`1px solid ${cur===step?T.accent:T.innerBorder}`,
                      background:cur===step?primaryFull[step]+"33":"transparent",
                      color:cur===step?T.accent:T.textFaint,
                      fontSize:9,fontFamily:"'DM Mono',monospace",cursor:"pointer",transition:"all .1s",
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

function SemanticGroupDisplay({label,tokens,T}){
  return(
    <div style={{marginBottom:8}}>
      <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",color:T.textFaint,letterSpacing:1,textTransform:"uppercase",marginBottom:4,paddingLeft:2}}>{label}</div>
      <div style={{display:"flex",flexDirection:"column",gap:2}}>
        {tokens.map(([k,v])=>(
          <div key={k} style={{display:"flex",alignItems:"center",gap:9,padding:"6px 10px",borderRadius:8,background:T.innerBg}}>
            <div style={{width:22,height:22,borderRadius:5,background:v,flexShrink:0,border:`1px solid ${T.stripBorder}`}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:9,color:T.textFaint,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>--{k}</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.codeText}}>{v}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepSelector({steps,setSteps,T}){
  return(
    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
      {[4,6,10].map(n=>{
        const {short,long,desc}=STEP_LABELS[n];
        const active=steps===n;
        return(
          <button key={n} onClick={()=>setSteps(n)} style={{
            flex:"1 1 0",minWidth:120,padding:"10px 14px",borderRadius:10,cursor:"pointer",
            border:`1.5px solid ${active?T.accent:T.innerBorder}`,
            background:active?T.accentBg:T.innerBg,
            transition:"all .15s",textAlign:"left",
          }}>
            <div style={{display:"flex",alignItems:"baseline",gap:6,marginBottom:3}}>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,fontWeight:700,color:active?T.accent:T.textMuted}}>{short}</span>
              <span style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:active?T.accent+"99":T.textFaint}}>{long}</span>
              {n===6&&<span style={{background:T.tagBg,border:`1px solid ${T.tagBorder}`,color:T.accent,borderRadius:4,fontSize:8,padding:"1px 5px",fontFamily:"'DM Mono',monospace",fontWeight:600}}>推奨</span>}
            </div>
            <div style={{fontSize:10,color:active?T.codeText:T.textFaint,fontFamily:"'DM Mono',monospace",marginBottom:3}}>{STEP_KEYS[n].join(" · ")}</div>
            <div style={{fontSize:9,color:active?T.textDim:T.textFaint}}>{desc}</div>
          </button>
        );
      })}
    </div>
  );
}

// Semantic preview: side-by-side light/dark
function SemanticDualPreview({semLight,semDark,T}){
  const previewKeys=["color-background","color-surface","color-on-surface","color-primary","color-primary-hover","color-primary-subtle","color-accent"];
  return(
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
      {[{label:"Light Mode",sem:semLight,bg:"#f4f4f8"},{label:"Dark Mode",sem:semDark,bg:"#111118"}].map(({label,sem,bg})=>(
        <div key={label} style={{background:bg,border:`1px solid ${T.cardBorder}`,borderRadius:12,padding:"14px 16px"}}>
          <div style={{fontSize:10,fontFamily:"'DM Mono',monospace",color:sem["color-on-surface-muted"],marginBottom:10,letterSpacing:.5}}>{label}</div>
          <div style={{background:sem["color-surface"],borderRadius:9,padding:"12px",border:`1px solid ${sem["color-border"]}`}}>
            <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:10}}>
              <div style={{width:28,height:28,borderRadius:6,background:sem["color-primary"],display:"flex",alignItems:"center",justifyContent:"center"}}>
                <span style={{color:sem["color-on-primary"],fontSize:12,fontWeight:700}}>A</span>
              </div>
              <div style={{flex:1,height:8,borderRadius:4,background:sem["color-primary-subtle"]}}/>
            </div>
            <div style={{fontSize:11,color:sem["color-on-surface"],fontWeight:600,marginBottom:4}}>見出しテキスト</div>
            <div style={{fontSize:10,color:sem["color-on-surface-muted"],marginBottom:10,lineHeight:1.5}}>本文テキストのサンプルです。</div>
            <div style={{display:"flex",gap:6}}>
              <div style={{padding:"5px 12px",borderRadius:7,background:sem["color-primary"],color:sem["color-on-primary"],fontSize:10,fontWeight:600}}>ボタン</div>
              <div style={{padding:"5px 12px",borderRadius:7,background:sem["color-accent"],color:sem["color-on-accent"],fontSize:10,fontWeight:600}}>アクセント</div>
              <div style={{padding:"4px 10px",borderRadius:7,background:sem["color-primary-chip"],color:sem["color-primary"],fontSize:10,border:`1px solid ${sem["color-primary-light"]}`}}>タグ</div>
            </div>
          </div>
          <div style={{display:"flex",gap:4,marginTop:10,flexWrap:"wrap"}}>
            {previewKeys.map(k=>sem[k]&&(
              <div key={k} title={`${k}: ${sem[k]}`} style={{
                width:20,height:20,borderRadius:4,background:sem[k],
                border:`1px solid ${T.stripBorder}`,flexShrink:0,
              }}/>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function App(){
  const [primaryHex,setPrimaryHex]=useState("#1A6FDB");
  const [primaryInput,setPrimaryInput]=useState("#1A6FDB");
  const [selSec,setSelSec]=useState("s1");
  const [selAcc,setSelAcc]=useState("a1");
  const [customSec,setCustomSec]=useState(null);
  const [customAcc,setCustomAcc]=useState(null);
  const [steps,setSteps]=useState(6);
  const [roleSteps,setRoleSteps]=useState({...DEFAULT_ROLE_STEPS});
  const [tab,setTab]=useState(0);
  const [exportFormat,setExportFormat]=useState("CSS Variables");
  const [exportThemeMode,setExportThemeMode]=useState("both"); // "light"|"dark"|"both"
  const [copied,setCopied]=useState(false);
  const [uiDark,setUiDark]=useState(true);  // UI theme toggle
  const [semPreviewMode,setSemPreviewMode]=useState("light"); // semantic tab preview

  const T=THEMES[uiDark?"dark":"light"];

  const patterns=useMemo(()=>isValidHex(primaryHex)?getHarmonyPatterns(primaryHex):{secondary:[],accent:[]},[primaryHex]);
  const secondaryHex=useMemo(()=>customSec||(patterns.secondary.find(p=>p.id===selSec)?.hex||"#888888"),[patterns,selSec,customSec]);
  const accentHex=useMemo(()=>customAcc||(patterns.accent.find(p=>p.id===selAcc)?.hex||"#888888"),[patterns,selAcc,customAcc]);

  const primaryFull=useMemo(()=>generateScale(primaryHex),[primaryHex]);
  const secondaryFull=useMemo(()=>generateScale(secondaryHex),[secondaryHex]);
  const accentFull=useMemo(()=>generateScale(accentHex),[accentHex]);
  const neutralFull=useMemo(()=>generateNeutral(primaryHex),[primaryHex]);

  const primaryScale=useMemo(()=>filterScale(primaryFull,steps),[primaryFull,steps]);
  const secondaryScale=useMemo(()=>filterScale(secondaryFull,steps),[secondaryFull,steps]);
  const accentScale=useMemo(()=>filterScale(accentFull,steps),[accentFull,steps]);
  const neutralScale=useMemo(()=>filterScale(neutralFull,steps),[neutralFull,steps]);

  const {light:semLight,dark:semDark}=useMemo(()=>generateSemanticTokens(primaryHex,secondaryHex,accentHex,neutralFull,roleSteps),[primaryHex,secondaryHex,accentHex,neutralFull,roleSteps]);
  const activeSem=semPreviewMode==="light"?semLight:semDark;

  const exportCode=useMemo(()=>buildExport(exportFormat,primaryHex,secondaryHex,accentHex,steps,roleSteps,exportThemeMode),[exportFormat,primaryHex,secondaryHex,accentHex,steps,roleSteps,exportThemeMode]);

  const presetGradients=useMemo(()=>makePresetGradients(primaryFull,secondaryFull,accentFull),[primaryFull,secondaryFull,accentFull]);

  const applyPrimary=useCallback((hex)=>{if(!isValidHex(hex))return;setPrimaryHex(hex);setCustomSec(null);setCustomAcc(null);},[]);

  const levelColor=(l)=>l==="AAA"?T.successHex:l==="AA"?T.accent:l==="Large AA"?T.warningHex:T.errorHex;

  const contrastSem=semPreviewMode==="light"?semLight:semDark;
  const contrastData=[
    {label:"Primary / Surface",          fg:contrastSem["color-primary"],       bg:contrastSem["color-surface"]},
    {label:"Primary / Background",       fg:contrastSem["color-primary"],       bg:contrastSem["color-background"]},
    {label:"on-Primary / Primary",       fg:contrastSem["color-on-primary"],    bg:contrastSem["color-primary"]},
    {label:"Primary hover / Surface",    fg:contrastSem["color-primary-hover"], bg:contrastSem["color-surface"]},
    {label:"Secondary / Surface",        fg:contrastSem["color-secondary"],     bg:contrastSem["color-surface"]},
    {label:"Accent / Surface",           fg:contrastSem["color-accent"],        bg:contrastSem["color-surface"]},
    {label:"on-Surface / Surface",       fg:contrastSem["color-on-surface"],    bg:contrastSem["color-surface"]},
    {label:"on-Surface-muted / Surface", fg:contrastSem["color-on-surface-muted"],bg:contrastSem["color-surface"]},
  ];

  const semGroups=[
    {label:"Base / Surface",  keys:["color-background","color-surface","color-surface-variant","color-on-surface","color-on-surface-muted","color-border","color-border-strong"]},
    {label:"Primary",         keys:["color-primary-subtle","color-primary-chip","color-primary-light","color-primary","color-primary-hover","color-primary-dark","color-on-primary"]},
    {label:"Secondary",       keys:["color-secondary-subtle","color-secondary-chip","color-secondary-light","color-secondary","color-secondary-hover","color-secondary-dark","color-on-secondary"]},
    {label:"Accent",          keys:["color-accent-subtle","color-accent-chip","color-accent-light","color-accent","color-accent-hover","color-accent-dark","color-on-accent"]},
    {label:"Status",          keys:["color-success","color-warning","color-error","color-info"]},
  ];

  // shared card style
  const card=(extra={})=>({background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:14,padding:"18px 20px",...extra});
  const label11=(extra={})=>({fontSize:11,fontWeight:600,color:T.textMuted,letterSpacing:.5,...extra});

  return(
    <div style={{minHeight:"100vh",background:T.pageBg,color:T.text,fontFamily:"'DM Sans',sans-serif",padding:"36px 22px 60px",boxSizing:"border-box",transition:"background .25s,color .25s"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;}
        input[type=color]{-webkit-appearance:none;border:none;padding:0;cursor:pointer;}
        input[type=color]::-webkit-color-swatch-wrapper{padding:0;}
        input[type=color]::-webkit-color-swatch{border:none;border-radius:8px;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:${T.cardBorder};border-radius:3px;}
      `}</style>

      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:28,gap:12,flexWrap:"wrap"}}>
        <div>
          <div style={{fontFamily:"'DM Mono',monospace",fontSize:10,color:T.textFaint,letterSpacing:2,textTransform:"uppercase",marginBottom:4}}>Design Token Generator</div>
          <h1 style={{margin:0,fontSize:22,fontWeight:600,letterSpacing:-.5,color:T.text}}>カラーパレット作成</h1>
        </div>
        {/* UI theme toggle */}
        <button onClick={()=>setUiDark(v=>!v)} style={{
          display:"flex",alignItems:"center",gap:8,padding:"8px 14px",
          borderRadius:10,border:`1.5px solid ${T.cardBorder}`,
          background:T.cardBg,color:T.textMuted,cursor:"pointer",
          fontFamily:"'DM Mono',monospace",fontSize:11,transition:"all .2s",flexShrink:0,
        }}>
          <span style={{fontSize:16}}>{uiDark?"☀️":"🌙"}</span>
          {uiDark?"ライトモード":"ダークモード"}
        </button>
      </div>

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
        <StepSelector steps={steps} setSteps={setSteps} T={T}/>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,marginBottom:18,flexWrap:"wrap"}}>
        {TABS.map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)} style={{
            padding:"6px 16px",borderRadius:9,
            border:`1.5px solid ${tab===i?T.accent:T.innerBorder}`,
            background:tab===i?T.accentBg:"transparent",
            color:tab===i?T.accent:T.textDim,
            fontSize:12,fontWeight:tab===i?600:400,cursor:"pointer",transition:"all .15s",
          }}>{t}</button>
        ))}
      </div>

      {/* Tab: Scale */}
      {tab===0&&(
        <div style={card()}>
          <div style={{fontSize:11,color:T.textDim,marginBottom:10}}>
            表示: <span style={{color:T.codeText,fontFamily:"'DM Mono',monospace"}}>{STEP_LABELS[steps].short}（{STEP_LABELS[steps].long}）</span>
            　{STEP_KEYS[steps].join(" · ")}
          </div>
          {/* Badge legend */}
          <div style={{
            display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",
            background:T.innerBg,border:`1px solid ${T.innerBorder}`,
            borderRadius:8,padding:"7px 12px",marginBottom:16,fontSize:10,color:T.textDim,
          }}>
            <span>バッジ凡例:</span>
            <span style={{background:"rgba(100,100,100,0.3)",color:"#7fffb0",borderRadius:3,fontSize:9,padding:"1px 5px",fontFamily:"'DM Mono',monospace",fontWeight:700}}>W AAA</span>
            <span style={{fontSize:9,color:T.textFaint}}>白テキスト AAA（≥7:1）</span>
            <span style={{background:"rgba(100,100,100,0.3)",color:"#ffffffcc",borderRadius:3,fontSize:9,padding:"1px 5px",fontFamily:"'DM Mono',monospace",fontWeight:700}}>B AA</span>
            <span style={{fontSize:9,color:T.textFaint}}>黒テキスト AA（≥4.5:1）</span>
            <span style={{background:"rgba(100,100,100,0.3)",color:"rgba(255,255,255,0.4)",borderRadius:3,fontSize:9,padding:"1px 5px",fontFamily:"'DM Mono',monospace",fontWeight:600}}>W ✕</span>
            <span style={{fontSize:9,color:T.textFaint}}>不合格</span>
          </div>
          <ScaleRow tokenName="primary / --color-primary-*" scale={primaryScale} T={T}/>
          <ScaleRow tokenName="secondary / --color-secondary-*" scale={secondaryScale} T={T}/>
          <ScaleRow tokenName="accent / --color-accent-*" scale={accentScale} T={T}/>
          <ScaleRow tokenName="neutral / --color-neutral-*" scale={neutralScale} T={T}/>

          {/* Surface / Background contrast matrix */}
          <div style={{borderTop:`1px solid ${T.innerBorder}`,marginTop:8,paddingTop:20}}>
            <div style={{fontSize:11,fontWeight:600,color:T.textMuted,marginBottom:4}}>
              Surface / Background 対比マトリクス
            </div>
            <div style={{fontSize:10,color:T.textFaint,marginBottom:16,lineHeight:1.6}}>
              各カラーの 300〜700 ステップを、セマンティックの Surface・Background に重ねた場合のコントラスト比です（50〜200・800〜900 は実用上の背景/装飾用途のため省略）。
            </div>
            <ScaleContrastMatrix
              label="Primary" fullScale={primaryFull}
              surfaceHex={semLight["color-surface"]}
              bgHex={semLight["color-background"]} T={T}/>
            <ScaleContrastMatrix
              label="Secondary" fullScale={secondaryFull}
              surfaceHex={semLight["color-surface"]}
              bgHex={semLight["color-background"]} T={T}/>
            <ScaleContrastMatrix
              label="Accent" fullScale={accentFull}
              surfaceHex={semLight["color-surface"]}
              bgHex={semLight["color-background"]} T={T}/>
          </div>
        </div>
      )}

      {/* Tab: Semantic */}
      {tab===1&&(
        <div>
          <SemanticDualPreview semLight={semLight} semDark={semDark} T={T}/>
          <RoleMappingEditor roleSteps={roleSteps} setRoleSteps={setRoleSteps} primaryFull={primaryFull} T={T}/>
          <div style={card()}>
            {/* Light/Dark toggle for token list */}
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <span style={{fontSize:11,color:T.textMuted,fontWeight:600}}>トークン表示モード:</span>
              {["light","dark"].map(m=>(
                <button key={m} onClick={()=>setSemPreviewMode(m)} style={{
                  padding:"4px 14px",borderRadius:8,cursor:"pointer",
                  border:`1.5px solid ${semPreviewMode===m?T.accent:T.innerBorder}`,
                  background:semPreviewMode===m?T.accentBg:"transparent",
                  color:semPreviewMode===m?T.accent:T.textDim,
                  fontSize:11,fontFamily:"'DM Mono',monospace",transition:"all .15s",
                }}>{m==="light"?"☀️ Light":"🌙 Dark"}</button>
              ))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:16}}>
              {semGroups.map(({label,keys})=>(
                <SemanticGroupDisplay key={label} label={label}
                  tokens={keys.map(k=>[k,activeSem[k]]).filter(([,v])=>v)} T={T}/>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Contrast */}
      {tab===2&&(
        <div style={card()}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,flexWrap:"wrap"}}>
            <span style={{fontSize:11,color:T.textMuted,fontWeight:600}}>チェックモード:</span>
            {["light","dark"].map(m=>(
              <button key={m} onClick={()=>setSemPreviewMode(m)} style={{
                padding:"4px 14px",borderRadius:8,cursor:"pointer",
                border:`1.5px solid ${semPreviewMode===m?T.accent:T.innerBorder}`,
                background:semPreviewMode===m?T.accentBg:"transparent",
                color:semPreviewMode===m?T.accent:T.textDim,
                fontSize:11,fontFamily:"'DM Mono',monospace",transition:"all .15s",
              }}>{m==="light"?"☀️ Light":"🌙 Dark"}</button>
            ))}
            <span style={{fontSize:10,color:T.textFaint,fontFamily:"'DM Mono',monospace"}}>WCAG 2.1　AA ≥ 4.5:1　AAA ≥ 7:1　Large AA ≥ 3:1</span>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(265px,1fr))",gap:10}}>
            {contrastData.map(({label,fg,bg})=>{
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
      )}

      {/* Tab: Gradient */}
      {tab===3&&(
        <div style={card()}>
          <GradientTab presets={presetGradients} T={T}
            paletteFull={{primary:primaryFull,secondary:secondaryFull,accent:accentFull}}
            semanticTokens={semLight}/>
        </div>
      )}

      {/* Tab: Export */}
      {tab===4&&(
        <div style={card()}>
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
            <button onClick={()=>{navigator.clipboard.writeText(exportCode);setCopied(true);setTimeout(()=>setCopied(false),1800);}} style={{
              padding:"5px 16px",borderRadius:8,border:`1.5px solid ${T.cardBorder}`,
              background:copied?T.btnHoverBg:T.btnBg,color:copied?T.btnHoverText:T.textMuted,
              fontSize:11,fontFamily:"'DM Mono',monospace",cursor:"pointer",transition:"all .2s",
            }}>{copied?"✓ Copied":"Copy"}</button>
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

          {/* Hints */}
          {exportFormat==="Figma Variables"&&(
            <div style={{background:uiDark?"#141e14":"#eef8ee",border:`1px solid ${uiDark?"#2a3a20":"#b0d8b0"}`,borderRadius:8,padding:"9px 13px",marginBottom:12,fontSize:11,color:uiDark?"#7ec87e":"#2a6a2a",fontFamily:"'DM Mono',monospace",lineHeight:1.6}}>
              💡 {exportThemeMode==="both"?"Semantic コレクションに Light / Dark の2モードが含まれます。":
                  exportThemeMode==="light"?"Semantic コレクションに Light モードのみ含まれます。":
                  "Semantic コレクションに Dark モードのみ含まれます。"}「Variables Import Export JSON」プラグイン等で読み込み可能です。
            </div>
          )}
          {exportFormat==="CSS Variables"&&(
            <div style={{background:uiDark?"#141a22":"#eef2ff",border:`1px solid ${uiDark?"#1e2a3a":"#b0c4f0"}`,borderRadius:8,padding:"9px 13px",marginBottom:12,fontSize:11,color:uiDark?"#7aaee8":"#1a3a8a",fontFamily:"'DM Mono',monospace",lineHeight:1.6}}>
              💡 {exportThemeMode==="both"?<>プリミティブ・Lightセマンティックを <code>:root</code>、Darkセマンティックを <code>[data-theme="dark"]</code> に出力します。</>:
                  exportThemeMode==="light"?<>プリミティブ・Lightセマンティックを <code>:root</code> に出力します。</>:
                  <>プリミティブ・Darkセマンティックを <code>:root</code> に出力します。</>}
            </div>
          )}

          <pre style={{
            background:T.deepBg,border:`1px solid ${T.deepBorder}`,borderRadius:10,
            padding:"14px 16px",fontSize:10,fontFamily:"'DM Mono',monospace",
            color:T.codeText,overflowX:"auto",margin:0,lineHeight:1.8,
            maxHeight:420,overflowY:"auto",
          }}>{exportCode}</pre>
        </div>
      )}
    </div>
  );
}
