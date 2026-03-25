import { useState, useMemo, useEffect, useRef } from 'react';
import { isValidHex } from '../../utils/colorMath.js';
import { SCALE_STEP_OPTIONS } from '../../utils/scale.js';
import { LINEAR_DIRECTIONS, GRAD_EXPORT_FORMATS, GRAD_CATEGORIES, buildGradientCSS, buildGradientExport } from '../../utils/gradient.js';

export function GradientTab({presets,T,bp,paletteFull,semanticTokens,savedGradients,setSavedGradients}){
  const mob=bp==="mobile";
  const [selected,setSelected]=useState(null);
  const [customStops,setCustomStops]=useState(null);
  const [customType,setCustomType]=useState("linear");
  const [customAngle,setCustomAngle]=useState(135);
  const [catFilter,setCatFilter]=useState("すべて");
  const [gradExportFmt,setGradExportFmt]=useState("CSS Variables");
  const [gradCopied,setGradCopied]=useState(false);
  const [openPickerIdx,setOpenPickerIdx]=useState(null);
  const [pickerTab,setPickerTab]=useState("scale");
  const pickerRef=useRef(null);

  useEffect(()=>{
    if(openPickerIdx===null)return;
    const handler=(e)=>{if(pickerRef.current&&!pickerRef.current.contains(e.target))setOpenPickerIdx(null);};
    document.addEventListener("mousedown",handler);
    return ()=>document.removeEventListener("mousedown",handler);
  },[openPickerIdx]);

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
    setSavedGradients(prev=>[...prev,{...editGrad,slug,name:"カスタム "+slug.slice(-4),category:"カスタム"}]);
  };

  const gradExportCode=useMemo(()=>buildGradientExport(savedGradients,gradExportFmt),[savedGradients,gradExportFmt]);

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
              <div key={idx} ref={openPickerIdx===idx?pickerRef:null} style={{marginBottom:8}}>
                <div style={{
                  display:"flex",alignItems:"center",gap:8,flexWrap:mob?"wrap":"nowrap",
                  background:T.innerBg,borderRadius:openPickerIdx===idx?"8px 8px 0 0":"8px",
                  padding:"6px 10px",
                  borderBottom:openPickerIdx===idx?`1px solid ${T.cardBorder}`:"none",
                }}>
                  <div style={{position:"relative",flexShrink:0}}>
                    <div style={{
                      width:32,height:32,borderRadius:7,background:stop.hex,
                      border:`2px solid ${openPickerIdx===idx?T.accent:T.inputBorder}`,
                      cursor:"pointer",transition:"border-color .15s",
                    }} onClick={()=>setOpenPickerIdx(openPickerIdx===idx?null:idx)}/>
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

                  <button onClick={()=>{setOpenPickerIdx(openPickerIdx===idx?null:idx);setPickerTab("scale");}}
                    title="パレットから選択" style={{
                    padding:"3px 9px",borderRadius:6,cursor:"pointer",flexShrink:0,
                    border:`1px solid ${openPickerIdx===idx?T.accent:T.innerBorder}`,
                    background:openPickerIdx===idx?T.accentBg:"transparent",
                    color:openPickerIdx===idx?T.accent:T.textFaint,
                    fontSize:10,...mono(),transition:"all .13s",
                  }}>🎨</button>

                  <button onClick={()=>removeStop(idx)} style={{
                    background:"transparent",border:`1px solid ${T.cardBorder}`,
                    borderRadius:5,color:T.textFaint,fontSize:11,
                    width:22,height:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                    ...(mob?{}:{order:1}),
                  }}>✕</button>

                  <div style={{display:"flex",alignItems:"center",gap:8,flex:1,...(mob?{width:"100%"}:{})}}>
                    <span style={{fontSize:10,color:T.textFaint,...mono(),flexShrink:0}}>位置</span>
                    <input type="range" min={0} max={100} value={stop.pos}
                      onChange={e=>updateStop(idx,"pos",Number(e.target.value))}
                      style={{flex:1,accentColor:T.accent}}/>
                    <span style={{...mono(),fontSize:11,color:T.textMuted,width:32,textAlign:"right"}}>{stop.pos}%</span>
                  </div>
                </div>

                {/* Inline palette picker panel */}
                {openPickerIdx===idx&&(
                  <div style={{
                    background:T.innerBg,borderRadius:"0 0 8px 8px",
                    border:`1px solid ${T.cardBorder}`,borderTop:"none",
                    padding:"10px 12px",maxHeight:220,overflowY:"auto",
                  }}>
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

        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:16}}>
          {savedGradients.map((g,i)=>(
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
                <button onClick={()=>setSavedGradients(l=>l.filter((_,j)=>j!==i))} style={{
                  background:"transparent",border:"none",color:T.textFaint,
                  fontSize:10,cursor:"pointer",padding:0,flexShrink:0,
                }}>✕</button>
              </div>
            </div>
          ))}
        </div>

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
