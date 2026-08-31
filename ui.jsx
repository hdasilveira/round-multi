/**
 * ui.jsx — tema e folha de estilo global do iMulti.
 */

// ─── THEME ────────────────────────────────────────────────────────────────────
export const DARK = {
  bg:'#0b0f14', surface:'#131920', surface2:'#1a2230',
  border:'#1e2d3d', borderMid:'#243447',
  accent:'#2d8cf0', accentDim:'#1a3a5c',
  green:'#39d98a', yellow:'#f5a623', red:'#ff5c5c',
  orange:'#f0822d', purple:'#b39dfa', teal:'#4ecdc4',
  text:'#d4e2f0', textMuted:'#5a7a99', textDim:'#2e4460', white:'#f0f6ff',
  notepadBg:'#0e1a0e', notepadBorder:'#2a4020', notepadText:'#8ecf7a',
  isDark: true,
};
export const LIGHT = {
  bg:'#f0f4f8', surface:'#ffffff', surface2:'#e8eef5',
  border:'#d0dcea', borderMid:'#c0cedd',
  accent:'#1a6fd4', accentDim:'#daeaff',
  green:'#1a9e5c', yellow:'#c47d00', red:'#d63030',
  orange:'#c4601a', purple:'#6a48d0', teal:'#1a9e96',
  text:'#1a2535', textMuted:'#4a6080', textDim:'#9ab0c8', white:'#0f1a2a',
  notepadBg:'#f0faf0', notepadBorder:'#90c878', notepadText:'#2a6010',
  isDark: false,
};

export const makeCSS = T => `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=DM+Sans:wght@400;500;600;700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body,#root{height:100%}
  body{background:${T.bg};color:${T.text};font-family:'DM Sans',sans-serif;font-size:16px;line-height:1.55;transition:background 0.25s,color 0.25s;-webkit-tap-highlight-color:transparent}
  ::-webkit-scrollbar{width:6px;height:6px}
  ::-webkit-scrollbar-track{background:transparent}
  ::-webkit-scrollbar-thumb{background:${T.border};border-radius:4px}
  button{font-family:inherit;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;min-height:32px}
  input,textarea,select{font-family:inherit;font-size:15px}
  input:focus,textarea:focus{outline:1px solid ${T.accent}60}
  a{text-decoration:none}
  ::placeholder{color:${T.textDim}}
  @keyframes pulse-border{0%,100%{box-shadow:0 0 0 0 ${T.yellow}50}50%{box-shadow:0 0 0 4px ${T.yellow}20}}
  @keyframes fadein{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
  @keyframes slideup{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
  @media(max-width:768px){
    input,textarea,select{font-size:16px !important}
  }
  @media print{
    .no-print{display:none !important}
    article{break-inside:avoid}
  }
  @media(min-width:901px){
    .saps3-result-panel{display:block !important}
    .saps3-subtitle{display:inline !important}
    .saps3-mobile-result{display:none !important}
  }
`;

// O iMulti usa apenas tema e CSS global; os demais componentes visuais
// vieram do sistema maior e não têm uso aqui.
