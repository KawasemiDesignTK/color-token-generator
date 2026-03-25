import { SemanticDualPreview } from './SemanticDualPreview.jsx';
import { RoleMappingEditor } from './RoleMappingEditor.jsx';
import { SemanticGroupDisplay } from './SemanticGroupDisplay.jsx';

const SEM_GROUPS=[
  {label:"Fixed",           keys:["color-white","color-black"]},
  {label:"Base / Surface",  keys:["color-base","color-surface","color-border","color-text","color-text-muted"]},
  {label:"Primary",         keys:["color-primary","color-primary-dark","color-primary-bg","color-primary-label","color-text-primary"]},
  {label:"Secondary",       keys:["color-secondary","color-secondary-dark","color-secondary-bg","color-secondary-label","color-text-secondary"]},
  {label:"Accent",          keys:["color-accent","color-accent-bg","color-accent-dark"]},
  {label:"Status",          keys:["color-success","color-warning","color-error","color-info"]},
];

export function SemanticTab({semLight,semDark,roleSteps,setRoleSteps,primaryFull,semPreviewMode,T,bp}){
  const activeSem=semPreviewMode==="light"?semLight:semDark;
  const card=(extra={})=>({background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:14,padding:"18px 20px",...extra});

  return(
    <div>
      <SemanticDualPreview semLight={semLight} semDark={semDark} T={T} bp={bp}/>
      <RoleMappingEditor roleSteps={roleSteps} setRoleSteps={setRoleSteps} primaryFull={primaryFull} T={T} bp={bp}/>
      <div style={card()}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:16}}>
          {SEM_GROUPS.map(({label,keys})=>(
            <SemanticGroupDisplay key={label} label={label}
              tokens={keys.map(k=>[k,activeSem[k]]).filter(([,v])=>v)} T={T}/>
          ))}
        </div>
      </div>
    </div>
  );
}
