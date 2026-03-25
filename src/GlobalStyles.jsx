export function GlobalStyles({T}){
  return(
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');
      *{box-sizing:border-box;}
      input[type=color]{-webkit-appearance:none;border:none;padding:0;cursor:pointer;}
      input[type=color]::-webkit-color-swatch-wrapper{padding:0;}
      input[type=color]::-webkit-color-swatch{border:none;border-radius:8px;}
      ::-webkit-scrollbar{width:5px;height:5px;}
      ::-webkit-scrollbar-track{background:transparent;}
      ::-webkit-scrollbar-thumb{background:${T.cardBorder};border-radius:3px;}
      @keyframes fadeIn{from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:translateY(0);}}
      .tab-enter{animation:fadeIn .15s ease-out;}
    `}</style>
  );
}
