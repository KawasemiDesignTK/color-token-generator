import { STEP_KEYS, STEP_LABELS } from '../../utils/scale.js';
import { ScaleRow } from './ScaleRow.jsx';
import { ScaleContrastMatrix } from './ScaleContrastMatrix.jsx';

export function ScaleTab({steps,primaryScale,secondaryScale,accentScale,neutralScale,primaryFull,secondaryFull,accentFull,semLight,T,bp}){
  return(
    <div>
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
          bgHex={semLight["color-base"]} T={T} bp={bp}/>
        <ScaleContrastMatrix
          label="Secondary" fullScale={secondaryFull}
          surfaceHex={semLight["color-surface"]}
          bgHex={semLight["color-base"]} T={T} bp={bp}/>
        <ScaleContrastMatrix
          label="Accent" fullScale={accentFull}
          surfaceHex={semLight["color-surface"]}
          bgHex={semLight["color-base"]} T={T} bp={bp}/>
      </div>
    </div>
  );
}
