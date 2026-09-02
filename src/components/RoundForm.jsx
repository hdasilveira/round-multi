/**
 * RoundMultidisciplinar.jsx  v4
 *
 * Correções definitivas:
 *  1. PDF: a área de impressão é injetada diretamente em document.body (fora do #root)
 *     via ReactDOM.createPortal — o browser a enxerga mesmo com body>*{display:none}
 *  2. Inputs: todos inline no JSX, sem subcomponentes que wrappem <input>.
 *     Isso elimina o desmonte/remonte que causava perda de foco.
 *  3. RASS: <select> com opções de -5 a +4
 */

import React, { useContext, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import NewsScore from './NewsScore';

// ─── ESTADO INICIAL ───────────────────────────────────────────────────────────
export const emptyForm = (leito = '') => ({
  leito, responsavel: '',
  data: new Date().toLocaleDateString('pt-BR'),

  sed_na: false, sed_pausar_sim: false, sed_pausar_nao: false,
  sed_pausar_motivo: '', sed_rass: '',

  anal_dor_sim: false, anal_dor_nao: false, anal_bps: '',
  anal_otimizar_nao: false, anal_otimizar_sim: false,

  desm_na: false, desm_sim: false, desm_nao: false,
  desm_modo: '', desm_motivo: '',

  tcle_na: false, tcle_pendente: false,
  tcle_autorizado: false, tcle_negado: false,

  cuff_na: false, cuff_sim: false, cuff_nao: false,
  cuff_v1: '', cuff_v2: '', cuff_v3: '',

  sec_sim: false, sec_nao: false, sec_aspecto: '',
  sec_qtd_peq: false, sec_qtd_med: false, sec_qtd_gde: false,
  sec_tosse_ef: false, sec_tosse_parc: false,

  step_a: false, step_b: false, step_c: false, step_d: false,
  step_e: false, step_f: false, step_nao: false,

  nut_vo: false, nut_npt: false, nut_sne: false, nut_npo: false,
  nut_alvo_sim: false, nut_alvo_nao: false, nut_alvo: '', nut_taxa_atual: '',
  nut_trofica: false,
  nut_progredir: false, nut_npo_motivo: '',

  dev_cv_sim: false, dev_cv_nao: false, dev_cv_sitio: '', dev_cv_obs: '',
  dev_shilley_sitio: '', dev_shilley_obs: '',
  dev_sne_sim: false, dev_sne_nao: false, dev_sne_ausente: false, dev_sne_obs: '',
  dev_gtt_sim: false, dev_gtt_nao: false, dev_gtt_ausente: false, dev_gtt_obs: '',
  dev_svd_sim: false, dev_svd_nao: false, dev_svd_ausente: false, dev_svd_obs: '',
  dev_outros_sim: false, dev_outros_nao: false, dev_outros_ausente: false, dev_outros_obs: '',

  proc: '',
  lpp_sim: false, lpp_nao: false, lpp_lesoes: [], lpp_tratamento: '',
  hig_sim: false, hig_nao: false, hig_escova_sim: false, hig_escova_nao: false,
  vis_usual: false, vis_estendida: false, vis_12h: false, vis_24h: false,
  alta_prevista: false, alta_data: '', alta_nao: false,
  news_round: '', news_alta: '', news_params: null,
  plano: '',
});

// Grupos em que as opções se excluem: marcar uma desmarca as irmãs.
// Antes eram checkboxes independentes, então dava para deixar "Sim", "Não" e
// "N/A" assinalados ao mesmo tempo — e a folha impressa saía contraditória.
const GRUPOS_EXCLUSIVOS = [
  ['sed_na', 'sed_pausar_sim', 'sed_pausar_nao'],
  ['anal_dor_sim', 'anal_dor_nao'],
  ['anal_otimizar_sim', 'anal_otimizar_nao'],
  ['desm_na', 'desm_sim', 'desm_nao'],
  ['tcle_na', 'tcle_pendente', 'tcle_autorizado', 'tcle_negado'],
  ['cuff_na', 'cuff_sim', 'cuff_nao'],
  ['sec_sim', 'sec_nao'],
  ['sec_qtd_peq', 'sec_qtd_med', 'sec_qtd_gde'],
  ['sec_tosse_ef', 'sec_tosse_parc'],
  ['nut_vo', 'nut_npt', 'nut_sne', 'nut_npo'],
  ['nut_alvo_sim', 'nut_alvo_nao'],
  ['dev_cv_sim', 'dev_cv_nao'],
  ['dev_sne_sim', 'dev_sne_nao', 'dev_sne_ausente'],
  ['dev_gtt_sim', 'dev_gtt_nao', 'dev_gtt_ausente'],
  ['dev_svd_sim', 'dev_svd_nao', 'dev_svd_ausente'],
  ['dev_outros_sim', 'dev_outros_nao', 'dev_outros_ausente'],
  ['lpp_sim', 'lpp_nao'],
  ['hig_sim', 'hig_nao'],
  ['hig_escova_sim', 'hig_escova_nao'],
  ['vis_usual', 'vis_estendida'],
  ['vis_12h', 'vis_24h'],
  ['alta_prevista', 'alta_nao'],
  // STEP: a mobilização é um estágio único; "Não" exclui todos os demais.
  ['step_a', 'step_b', 'step_c', 'step_d', 'step_e', 'step_f', 'step_nao'],
];

const irmasDe = (k) => {
  const g = GRUPOS_EXCLUSIVOS.find(grupo => grupo.includes(k));
  return g ? g.filter(x => x !== k) : [];
};

// Opções pré-escritas dos campos de texto. Ficam agrupadas aqui para que
// acrescentar item novo seja mexer numa lista, não no meio do formulário.
const SUGESTOES = {
  sed_pausar_motivo: ['Neuroproteção', 'Pós-PCR', 'Desconforto', 'Hipertensão intracraniana',
                      'Instabilidade hemodinâmica', 'Assincronia ventilatória', 'Bloqueio neuromuscular',
                      'Status epilepticus', 'Hipoxemia grave'],
  desm_motivo:       ['Ventilação com parâmetros elevados', 'Sem sensório'],
  lpp_local:         ['Sacral', 'Calcâneo', 'Trocantérica', 'Occipital', 'Maleolar', 'Isquiática'],
  sec_aspecto:       ['Mucoide', 'Hialina', 'Purulenta', 'Piossanguinolenta', 'Sanguinolenta'],
  dev_cv_sitio:      ['VJiD', 'VJiE', 'VSCD', 'VSCE', 'VAD', 'VAE', 'VFD', 'VFE'],
  dev_shilley_sitio: ['VJiD', 'VJiE', 'VSCD', 'VSCE', 'VAD', 'VAE', 'VFD', 'VFE'],
  // Justificativas de permanência, por dispositivo.
  dev_cv_obs:        ['Sem rede periférica', 'Droga vasoativa'],
  dev_shilley_obs:   ['Hemodiálise'],
  dev_sne_obs:       ['Ventilação mecânica', 'Impossibilidade de via oral'],
  dev_gtt_obs:       ['Disfagia', 'Impossibilidade de via oral', 'Nutrição prolongada'],
  dev_svd_obs:       ['Controle de diurese', 'Sondagem tecnicamente difícil'],
  plano:             ['Pausa de sedação', 'Desmame de VM', 'Vigiar sinais de infecção',
                      'Vigiar desconforto', 'Vigiar padrão ventilatório', 'Neuroproteção',
                      'Medidas de conforto'],
};

// Classificação das lesões por pressão (NPUAP/EPUAP).
// Descrição de cada estágio do STEP. Na folha sai só o estágio marcado com a
// sua descrição, em vez da tabela de sete células: a célula preenchida de
// preto era o que o Safari repetia página abaixo ao imprimir.
const STEP_DESCRICAO = {
  step_a: 'A — mobilização passiva/ativa no leito',
  step_b: 'B — exercícios no leito, transferência passiva, sedestação à beira do leito',
  step_c: 'C — exercícios à beira do leito',
  step_d: 'D — treino de ortostase, poltrona assistida/ativa, marcha estacionária',
  step_e: 'E — treino de marcha com equipe (avaliar ida ao banheiro)',
  step_f: 'F — treino de marcha com dispositivo',
  step_nao: 'Não realizada',
};

/** Estágio marcado, com a descrição. Vazio se nada foi assinalado. */
const resumoStep = (form) => {
  const chave = Object.keys(STEP_DESCRICAO).find(k => form[k]);
  return chave ? STEP_DESCRICAO[chave] : '';
};

const CLASSIFICACOES_LPP = [
  'Estágio 1', 'Estágio 2', 'Estágio 3', 'Estágio 4',
  'Lesão tissular profunda', 'LPRDM', 'Não classificável',
];

/** "Sacral (Estágio 2); Calcâneo (LPRDM)" — texto da folha impressa. */
const resumoLesoes = (lesoes = []) => lesoes
  .filter(l => l.local?.trim())
  .map(l => `${l.local.trim()}${l.classificacao ? ` (${l.classificacao})` : ''}`)
  .join('; ');

const RASS_OPTIONS = [
  { value: '+4', label: '+4 — Combativo' },
  { value: '+3', label: '+3 — Muito agitado' },
  { value: '+2', label: '+2 — Agitado' },
  { value: '+1', label: '+1 — Inquieto' },
  { value:  '0', label:  '0 — Alerta e calmo' },
  { value: '-1', label: '-1 — Sonolento' },
  { value: '-2', label: '-2 — Sedação leve' },
  { value: '-3', label: '-3 — Sedação moderada' },
  { value: '-4', label: '-4 — Sedação profunda' },
  { value: '-5', label: '-5 — Não desperta' },
];

// ─── CSS DE IMPRESSÃO ─────────────────────────────────────────────────────────
// Injetado em <head>. A área de impressão vive em document.body fora do #root.
/**
 * Estilos da FOLHA. Ficam separados dos estilos de tela porque são reutilizados
 * no documento isolado que vai para a impressora — lá não existe portal, nem
 * pré-visualização, nem interface do app.
 */
const PRINT_CSS_FOLHA = `
/* Estilos da folha. Ficam FORA do @media print para que a pré-visualização
   em tela use exatamente a mesma renderização que vai para o papel. */
/* #rmd-print é a CAIXA DA PÁGINA: altura definida e sem transbordo.
   #rmd-print-inner é o conteúdo, medido em tempo real e reduzido por
   transform quando passa da altura útil — assim o documento cabe sempre
   numa folha só, sem cortar nada e sem eu adivinhar tamanhos de fonte. */
#rmd-print {
  font-family: Arial, Helvetica, sans-serif;
  font-size: calc(9.2pt * var(--s, 1)); line-height: 1.4; color: #000; background: #fff;
  /* O Chrome respeita @page e nos dá 275mm (297 menos 11mm de margem em cima
     e embaixo). O Safari do iPad IGNORA @page e aplica as margens do próprio
     iOS, maiores que as nossas — a folha ficava alguns milímetros mais alta
     que a área imprimível e, como o bloco de assinaturas não se divide, ele
     saltava inteiro para a página 2. A altura passa a ser ajustada por
     navegador. */
  height: var(--altura-util, 275mm);
  overflow: hidden;
}
/* A folha é sempre uma página. O refluxo por --s garante que o conteúdo
   caiba; o recorte é a última linha de defesa contra uma página extra em
   branco, que era o que aparecia quando algo transbordava alguns milímetros. */
#rmd-print-inner {
  display: flex; flex-direction: column;
  min-height: 100%;
}

/* MODO SIMPLES — usado no WebKit (todo navegador do iPad, inclusive o Chrome,
   porque a Apple obriga o uso do motor do Safari).
   O WebKit pagina mal um container de altura fixa com overflow oculto e
   layout flexível: era daí que vinham a página extra, o conteúdo deslocado e
   o retângulo de fundo. Aqui a folha vira fluxo de documento comum — sem
   altura travada, sem recorte, sem flex — que é o que ele imprime bem. O
   encaixe em uma página passa a depender só do refluxo por --s. */
#rmd-print.simples { height: auto; overflow: visible; }
#rmd-print.simples #rmd-print-inner { display: block; min-height: 0; }
#rmd-print.simples .rp-plano-wrap { display: block; }
#rmd-print.simples .rp-plano { height: calc(58pt * var(--s, 1)); min-height: 0; }
#rmd-print.simples .rp-sign-row { margin-top: calc(20pt * var(--s, 1)); }
#rmd-print .rp-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: calc(16pt * var(--s, 1));
  border-bottom: 1.5px solid #000; padding-bottom: calc(5pt * var(--s, 1)); margin-bottom: calc(5pt * var(--s, 1));
  flex-shrink: 0;
}
#rmd-print .rp-etiqueta {
  border: 1px solid #000; width: calc(200pt * var(--s, 1)); height: calc(52pt * var(--s, 1));
  display: flex; align-items: flex-start; justify-content: center;
  padding-top: calc(3pt * var(--s, 1)); font-size: calc(7.5pt * var(--s, 1)); font-weight: bold;
  letter-spacing: 0.06em; color: #444;
}
#rmd-print .rp-row {
  display: flex; align-items: baseline; gap: calc(5pt * var(--s, 1)); flex-wrap: wrap;
  padding: calc(2.9pt * var(--s, 1)) 0; border-bottom: 1px solid #ddd;
  break-inside: avoid; page-break-inside: avoid;
}
#rmd-print .rp-bold { font-weight: bold; white-space: nowrap; }
#rmd-print .rp-cb { display: inline-flex; align-items: center; gap: calc(3pt * var(--s, 1)); margin-right: calc(5pt * var(--s, 1)); }
#rmd-print .rp-box {
  width: calc(8.5pt * var(--s, 1)); height: calc(8.5pt * var(--s, 1)); border: 1.3px solid #000;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: calc(7pt * var(--s, 1)); font-weight: bold; flex-shrink: 0; vertical-align: middle;
}
/* Sem preenchimento sólido em lugar nenhum da folha: fundos pretos são
   o que o Safari repete ao longo da página na impressão. */
#rmd-print .rp-box.on { background: #fff; color: #000; }
#rmd-print .rp-ul { display: inline-block; min-width: calc(68pt * var(--s, 1)); border-bottom: 1px solid #000; padding: 0 calc(2pt * var(--s, 1)); vertical-align: baseline; }
#rmd-print .rp-ul-w { min-width: calc(130pt * var(--s, 1)); }
#rmd-print .rp-ul-xl { min-width: calc(200pt * var(--s, 1)); }
#rmd-print .rp-dev-table { width: 100%; border-collapse: collapse; margin: calc(3pt * var(--s, 1)) 0; font-size: calc(8.4pt * var(--s, 1)); break-inside: avoid; }
#rmd-print .rp-dev-table td, #rmd-print .rp-dev-table th { border: 1px solid #aaa; padding: calc(2pt * var(--s, 1)) calc(5pt * var(--s, 1)); }
#rmd-print .rp-dev-table th { background: #fff; font-weight: bold; }
#rmd-print .rp-plano-wrap { flex: 1; display: flex; flex-direction: column; min-height: 0; }
#rmd-print .rp-plano {
  border: 1px solid #000; flex: 1; min-height: calc(62pt * var(--s, 1));
  padding: calc(4pt * var(--s, 1)); margin-top: calc(2pt * var(--s, 1)); font-size: calc(9pt * var(--s, 1)); white-space: pre-wrap;
}
#rmd-print .rp-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0 calc(14pt * var(--s, 1)); }
/* As assinaturas fecham a folha e não podem escorregar para a pagina 2:
   break-inside evita a divisao do bloco e as margens enxutas garantem que
   ele caiba no que resta da primeira pagina. */
#rmd-print .rp-sign-row {
  display: grid; grid-template-columns: 1fr 1fr 1fr; gap: calc(14pt * var(--s, 1)); margin-top: calc(12pt * var(--s, 1));
  flex-shrink: 0;
  break-inside: avoid; page-break-inside: avoid;
}
#rmd-print .rp-sign-line { border-top: 1px solid #000; padding-top: calc(2pt * var(--s, 1)); margin-top: calc(18pt * var(--s, 1)); font-size: calc(8pt * var(--s, 1)); text-align: center; }
#rmd-print .rp-id-row { display: flex; gap: calc(20pt * var(--s, 1)); padding: calc(3.5pt * var(--s, 1)) 0; border-bottom: 1px solid #ddd; margin-bottom: calc(2pt * var(--s, 1)); font-size: calc(9.4pt * var(--s, 1)); flex-shrink: 0; }
#rmd-print .rp-title { font-weight: bold; font-size: calc(9.4pt * var(--s, 1)); margin: calc(5pt * var(--s, 1)) 0 calc(1pt * var(--s, 1)); display: block; }

`;

/** Estilos de tela: posicionamento do portal e pré-visualização. */
const PRINT_CSS = PRINT_CSS_FOLHA + `@media screen {
  /* Fora da pré-visualização o portal sai de vista, mas NÃO com display:none:
     um elemento sem layout tem altura zero e não poderia ser medido. */
  /* position absolute em vez de fixed: elementos fixos sao fonte conhecida de
     problema na impressao do Safari, que pode repeti-los ou reposiciona-los. */
  #rmd-print-portal {
    position: absolute; top: 0; left: -20000px;
    width: 210mm; visibility: hidden; pointer-events: none;
  }
  #rmd-print-portal #rmd-print {
    width: 210mm;
    /* Altura útil mais o padding: assim a pré-visualização mede exatamente a
       mesma área que a impressão vai ter. */
    height: calc(var(--altura-util, 275mm) + 22mm);
    padding: 11mm 13mm; box-sizing: border-box;
  }
  #rmd-print-portal.rmd-preview {
    position: fixed; inset: 0; left: 0; z-index: 900;
    visibility: visible; pointer-events: auto;
    width: auto; background: rgba(15,20,28,0.82); overflow: auto;
    padding: 24px 16px 80px;
  }
  #rmd-print-portal.rmd-preview #rmd-print {
    margin: 0 auto; box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    transform: scale(var(--zoom, 1)); transform-origin: top center;
  }
  /* Compensa a altura que a folha perde ao ser reduzida na tela, para que a
     barra inferior não fique sobre ela. */
  #rmd-print-portal.rmd-preview { --altura-extra: 0px; }
}

@media print {
  @page { size: A4 portrait; margin: 11mm 13mm; }

  /* Oculta a interface, MAS preserva o container do portal.
     A regra antiga era "body > *", que escondia o próprio portal — e como
     #rmd-print vive dentro dele, a folha saía em branco por mais que
     estivesse marcada como display:block. */
  body > *:not(#rmd-print-portal) { display: none !important; }

  html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }

  /* O portal precisa voltar a ser um bloco comum. Faltavam altura, largura e
     visibilidade: em modo de pré-visualização ele é uma camada fixa de tela
     inteira com fundo escuro, e era esse fundo que saía impresso como um
     retângulo azul ocupando a página. */
  #rmd-print-portal,
  #rmd-print-portal.rmd-preview {
    display: block !important;
    position: static !important;
    inset: auto !important;
    width: auto !important;
    height: auto !important;
    min-height: 0 !important;
    max-height: none !important;
    background: transparent !important;
    backdrop-filter: none !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
    visibility: visible !important;
    z-index: auto !important;
  }
  #rmd-print, #rmd-print-portal.rmd-preview #rmd-print {
    display: block !important;
    width: auto !important; height: var(--altura-util, 275mm) !important;
    margin: 0 !important; padding: 0 !important;
    box-shadow: none !important;
    /* O zoom da pré-visualização serve para caber na tela do tablet; no papel
       a folha já tem o tamanho certo e ele precisa ser anulado. */
    transform: none !important;
  }
  #rmd-print-inner { transform: none !important; width: 100% !important; zoom: normal !important; }
  .rmd-preview-bar { display: none !important; }

  /* Blocos que não devem ser partidos ao meio. A folha inteira caber numa
     página é responsabilidade do dimensionamento, não de travas de quebra. */
  #rmd-print .rp-sign-row,
  #rmd-print .rp-dev-table,
  #rmd-print .rp-plano { break-inside: avoid; page-break-inside: avoid; }
}
`;

// ─── PRINT AREA (renderizado via portal fora do #root) ────────────────────────
/**
 * Campo com opções pré-escritas e digitação livre.
 * As sugestões são atalhos: tocar num chip acrescenta o termo ao texto e tocar
 * de novo remove. O campo continua editável para o que não estiver na lista, e
 * o que vai para a folha impressa é sempre o texto final.
 *
 * Declarado fora do render: componente criado durante a renderização perde o
 * estado dos filhos a cada pintura — o campo de texto perderia o foco a cada
 * caractere digitado.
 */
function Sugestoes({ opcoes = [], valor = '', onChange, cor, placeholder, T, inputStyle, largura, livre = true }) {
  const termos = valor.split(/\s*[,;]\s*/).map(t => t.trim()).filter(Boolean);
  const marcado = (op) => termos.some(t => t.toLowerCase() === op.toLowerCase());

  const alternar = (op) => {
    const restantes = termos.filter(t => t.toLowerCase() !== op.toLowerCase());
    onChange((marcado(op) ? restantes : [...restantes, op]).join(', '));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 230 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {opcoes.map(op => (
          <button key={op} type="button" onClick={() => alternar(op)} aria-pressed={marcado(op)}
            style={{
              padding: '7px 13px', borderRadius: 20, fontSize: 13.5, fontWeight: 600,
              fontFamily: 'inherit', cursor: 'pointer', minHeight: 40, flexShrink: 0,
              border: `1.5px solid ${marcado(op) ? cor : T.border}`,
              background: marcado(op) ? `${cor}22` : 'transparent',
              color: marcado(op) ? cor : T.textMuted,
              transition: 'background 0.15s, border-color 0.15s',
            }}>
            {op}
          </button>
        ))}
      </div>
      {/* Campos fechados (sítio de cateter, por exemplo) não têm digitação
          livre: a lista já cobre todas as posições possíveis. */}
      {livre && (
        <input type="text" value={valor}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || 'outros: descreva'}
          style={{ ...inputStyle(largura) }}
          onFocus={e => { e.target.style.borderColor = cor; }}
          onBlur={e  => { e.target.style.borderColor = T.border; }}
        />
      )}
    </div>
  );
}

/**
 * Editor das lesões por pressão.
 *
 * Cada lesão é um registro próprio com local e classificação, e não um item
 * numa lista de texto: o mesmo sítio pode ter duas lesões de estágios
 * diferentes, e uma lista simples não daria conta disso.
 */
function EditorLesoes({ lesoes = [], onChange, T, cor, inputStyle }) {
  const atualizar = (id, campo, valor) =>
    onChange(lesoes.map(l => (l.id === id ? { ...l, [campo]: valor } : l)));

  const acrescentar = (local = '') =>
    onChange([...lesoes, { id: Date.now() + Math.random(), local, classificacao: '' }]);

  const remover = (id) => onChange(lesoes.filter(l => l.id !== id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1, minWidth: 260 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: T.textMuted, marginRight: 2 }}>Acrescentar lesão:</span>
        {SUGESTOES.lpp_local.map(op => (
          <button key={op} type="button" onClick={() => acrescentar(op)}
            style={{
              padding: '7px 13px', borderRadius: 20, fontSize: 13.5, fontWeight: 600,
              fontFamily: 'inherit', cursor: 'pointer', minHeight: 40,
              border: `1.5px solid ${T.border}`, background: 'transparent', color: T.textMuted,
            }}>+ {op}</button>
        ))}
        <button type="button" onClick={() => acrescentar('')}
          style={{
            padding: '7px 13px', borderRadius: 20, fontSize: 13.5, fontWeight: 700,
            fontFamily: 'inherit', cursor: 'pointer', minHeight: 40,
            border: `1.5px solid ${cor}45`, background: `${cor}12`, color: cor,
          }}>+ Outro local</button>
      </div>

      {lesoes.length === 0 && (
        <div style={{ fontSize: 13, color: T.textDim, fontStyle: 'italic' }}>
          Nenhuma lesão registrada. Toque num sítio acima para acrescentar.
        </div>
      )}

      {lesoes.map((l, i) => (
        <div key={l.id} style={{
          border: `1.5px solid ${cor}35`, background: `${cor}0c`,
          borderRadius: 12, padding: '12px 13px',
          display: 'flex', flexDirection: 'column', gap: 9,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <span style={{
              width: 26, height: 26, borderRadius: 8, flexShrink: 0,
              background: `${cor}22`, color: cor, fontWeight: 800, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{i + 1}</span>
            <input type="text" value={l.local}
              onChange={e => atualizar(l.id, 'local', e.target.value)}
              placeholder="local da lesão"
              style={{ ...inputStyle(), flex: 1 }}
              onFocus={e => { e.target.style.borderColor = cor; }}
              onBlur={e  => { e.target.style.borderColor = T.border; }}
            />
            <button type="button" onClick={() => remover(l.id)}
              style={{
                minHeight: 40, padding: '0 13px', borderRadius: 9,
                background: 'none', border: `1.5px solid ${T.border}`, color: T.textMuted,
                fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
              }}>✕</button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {CLASSIFICACOES_LPP.map(c => {
              const marcado = l.classificacao === c;
              return (
                <button key={c} type="button" aria-pressed={marcado}
                  onClick={() => atualizar(l.id, 'classificacao', marcado ? '' : c)}
                  style={{
                    padding: '6px 12px', borderRadius: 18, fontSize: 13, fontWeight: 600,
                    fontFamily: 'inherit', cursor: 'pointer', minHeight: 38,
                    border: `1.5px solid ${marcado ? cor : T.border}`,
                    background: marcado ? `${cor}25` : 'transparent',
                    color: marcado ? cor : T.textMuted,
                  }}>{c}</button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// Caixa de marcação e linha pontilhada da folha. Declaradas fora do render:
// componentes criados dentro dele são recriados a cada pintura.
const PCB = ({ c }) => <span className={`rp-box${c ? ' on' : ''}`}>{c ? '✕' : ''}</span>;
const UL = ({ v, w, xl }) => (
  <span className={`rp-ul${w ? ' rp-ul-w' : ''}${xl ? ' rp-ul-xl' : ''}`}>{v}</span>
);

function PrintArea({ form }) {
  return (
    <div id="rmd-print">
      <div id="rmd-print-inner">
      {/* Cabeçalho */}
      <div className="rp-header">
        <div>
          <div style={{ fontSize: '8.6pt', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
            Hospital Universitário
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '14pt', lineHeight: 1.15 }}>São Francisco de Paula — UCPel</div>
          <div style={{ fontSize: '9.6pt', fontWeight: 'bold', marginTop: '6pt' }}>
            Round Multidisciplinar
          </div>
          <div style={{ fontSize: '9.2pt', marginTop: '4pt' }}>DATA — {form.data}</div>
        </div>
        <div className="rp-etiqueta">ETIQUETA DE IDENTIFICAÇÃO</div>
      </div>

      {/* Identificação */}
      <div className="rp-id-row">
        <span><strong>Leito/Iniciais:</strong> <UL v={form.leito} w /></span>
        <span><strong>Responsável:</strong> <UL v={form.responsavel} w /></span>
      </div>

      {/* 1 */}
      <div className="rp-row">
        <span className="rp-bold">1. Protocolo sedação:</span>
        <span className="rp-cb"><PCB c={form.sed_na} /> N/a</span>
        Pausar sedação
        <span className="rp-cb"><PCB c={form.sed_pausar_sim} /> Sim</span>
        <span className="rp-cb"><PCB c={form.sed_pausar_nao} /> Não: <UL v={form.sed_pausar_motivo} w /></span>
        RASS alvo: <UL v={form.sed_rass} />
      </div>

      {/* 2 */}
      <div className="rp-row">
        <span className="rp-bold">2. Protocolo analgesia:</span>
        Dor:
        <span className="rp-cb"><PCB c={form.anal_dor_sim} /> Sim</span>
        <span className="rp-cb"><PCB c={form.anal_dor_nao} /> Não</span>
        BPS/Escala numérica: <UL v={form.anal_bps} />
        Otimizar analgesia:
        <span className="rp-cb"><PCB c={form.anal_otimizar_sim} /> Sim</span>
        <span className="rp-cb"><PCB c={form.anal_otimizar_nao} /> Não</span>
      </div>

      {/* 3 */}
      <div className="rp-row">
        <span className="rp-bold">3. Desmame de VM?</span>
        <span className="rp-cb"><PCB c={form.desm_na} /> N/a</span>
        <span className="rp-cb"><PCB c={form.desm_sim} /> Sim ⇒ <UL v={form.desm_modo} /></span>
        <span className="rp-cb"><PCB c={form.desm_nao} /> Não ⇒ <UL v={form.desm_motivo} w /></span>
      </div>

      {/* 4 */}
      <div className="rp-row">
        <span className="rp-bold">4. TCLE pesquisa?</span>
        <span className="rp-cb"><PCB c={form.tcle_na} /> N/a</span>
        <span className="rp-cb"><PCB c={form.tcle_pendente} /> Pendente</span>
        <span className="rp-cb"><PCB c={form.tcle_autorizado} /> Autorizado</span>
        <span className="rp-cb"><PCB c={form.tcle_negado} /> Negado</span>
      </div>

      {/* 5 */}
      <div className="rp-row">
        <span className="rp-bold">5. Registros pressão cuff (c/ cufômetro):</span>
        <span className="rp-cb"><PCB c={form.cuff_na} /> N/a</span>
        <span className="rp-cb"><PCB c={form.cuff_sim} /> Sim</span>
        <span className="rp-cb"><PCB c={form.cuff_nao} /> Não ⇒ Valores:</span>
Inicial: <UL v={form.cuff_v1} /> · Ajustado para: <UL v={form.cuff_v2} /> / <UL v={form.cuff_v3} />
      </div>

      {/* 6 */}
      <div className="rp-row">
        <span className="rp-bold">6. Secreção respiratória?</span>
        <span className="rp-cb"><PCB c={form.sec_sim} /> Sim</span>
        <span className="rp-cb"><PCB c={form.sec_nao} /> Não</span>
        {' '}Quantidade:
        <span className="rp-cb"><PCB c={form.sec_qtd_peq} /> pequena</span>
        <span className="rp-cb"><PCB c={form.sec_qtd_med} /> média</span>
        <span className="rp-cb"><PCB c={form.sec_qtd_gde} /> grande</span>
        {' '}Tosse:
        <span className="rp-cb"><PCB c={form.sec_tosse_ef} /> efetiva</span>
        <span className="rp-cb"><PCB c={form.sec_tosse_parc} /> parcialmente efetiva</span>
        {' '}Aspecto: <UL v={form.sec_aspecto} w />
      </div>

      {/* 7 */}
      <div className="rp-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <span className="rp-bold">7. Protocolo de mobilização STEP:</span>
        <UL v={resumoStep(form)} xl />
      </div>

      {/* 8 */}
      <div className="rp-row">
        <span className="rp-bold">8. Nutrição:</span>
        <span className="rp-cb"><PCB c={form.nut_vo}  /> VO</span>
        <span className="rp-cb"><PCB c={form.nut_npt} /> NPT</span>
        <span className="rp-cb"><PCB c={form.nut_sne} /> SNE</span>
        Alvo:
        <span className="rp-cb"><PCB c={form.nut_trofica} /> Dieta trófica</span>
        {' '}Alvo: <UL v={form.nut_alvo} /> mL/h
        {' '}Atingido:
        <span className="rp-cb"><PCB c={form.nut_alvo_sim} /> Sim</span>
        <span className="rp-cb"><PCB c={form.nut_alvo_nao} /> Não</span>
        {form.nut_alvo_nao && <>{' '}Taxa atual: <UL v={form.nut_taxa_atual} /> mL/h</>}
        <span className="rp-cb"><PCB c={form.nut_progredir} /> Progredir</span>
        <span className="rp-cb"><PCB c={form.nut_npo} /> NPO ⇒ Motivo: <UL v={form.nut_npo_motivo} w /></span>
      </div>

      {/* 9 */}
      <div className="rp-row" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
        <span className="rp-bold">9. Dispositivos — pode ser removido?</span>
        <table className="rp-dev-table" style={{ marginTop: '3pt' }}>
          <thead>
            <tr>
              <th style={{ width: '12%' }}>Dispositivo</th>
              <th style={{ width: '17%' }}>Sítio / Detalhe</th>
              <th style={{ width: '26%', textAlign: 'center' }}>Pode remover?</th>
              <th>Justificativa da permanência</th>
            </tr>
          </thead>
          <tbody>
            {[
              { l:'CV',    sitio:form.dev_cv_sitio, sim:form.dev_cv_sim,     nao:form.dev_cv_nao,     obs:form.dev_cv_obs,      cb:true  },
              { l:'Shilley',sitio:form.dev_shilley_sitio, sim:false,           nao:false,               obs:form.dev_shilley_obs, cb:false },
              { l:'SNE',   sitio:'',                sim:form.dev_sne_sim,    nao:form.dev_sne_nao,    obs:form.dev_sne_obs,     cb:true, ausente:form.dev_sne_ausente },
              { l:'GTT',   sitio:'',                sim:form.dev_gtt_sim,    nao:form.dev_gtt_nao,    obs:form.dev_gtt_obs,     cb:true, ausente:form.dev_gtt_ausente },
              { l:'SVD',   sitio:'',                sim:form.dev_svd_sim,    nao:form.dev_svd_nao,    obs:form.dev_svd_obs,     cb:true, ausente:form.dev_svd_ausente },
              { l:'Outros',sitio:'',                sim:form.dev_outros_sim, nao:form.dev_outros_nao, obs:form.dev_outros_obs,  cb:true, ausente:form.dev_outros_ausente },
            ].map(d => (
              <tr key={d.l}>
                <td><strong>{d.l}</strong></td>
                <td>{d.sitio}</td>
                <td style={{ textAlign: 'center' }}>
                  {d.cb && <>
                    <span className="rp-cb"><PCB c={d.sim} /> S</span>{' '}
                    <span className="rp-cb"><PCB c={d.nao} /> N</span>
                    {d.ausente !== undefined && <>{' '}<span className="rp-cb"><PCB c={d.ausente} /> não possui</span></>}
                  </>}
                </td>
                <td>{d.obs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 10-14 duas colunas */}
      <div className="rp-two-col">
        <div className="rp-col-left">
          <div className="rp-row">
            <span className="rp-bold">10. Procedimento?</span> <UL v={form.proc} xl />
          </div>
          <div className="rp-row" style={{ flexDirection:'column', alignItems:'flex-start', gap:'2pt' }}>
            <span className="rp-bold">11. Lesão por pressão?</span>
            <span>
              <span className="rp-cb"><PCB c={form.lpp_sim} /> Sim — <UL v={resumoLesoes(form.lpp_lesoes)} xl /></span>
              <span className="rp-cb" style={{ marginLeft:'6pt' }}><PCB c={form.lpp_nao} /> Não</span>
            </span>
            <span style={{ fontSize:'8.5pt' }}>Tratamento: <UL v={form.lpp_tratamento} w /></span>
          </div>
          <div className="rp-row">
            <span className="rp-bold">12. Higiene oral</span>
            <span className="rp-cb"><PCB c={form.hig_sim} /> Sim</span>
            <span className="rp-cb"><PCB c={form.hig_nao} /> Não</span>
            Escova
            <span className="rp-cb"><PCB c={form.hig_escova_sim} /> Sim</span>
            <span className="rp-cb"><PCB c={form.hig_escova_nao} /> Não</span>
          </div>
        </div>
        <div className="rp-col-right">
          <div className="rp-row">
            <span className="rp-bold">13. Visita</span>
            <span className="rp-cb"><PCB c={form.vis_usual} /> Usual</span>
            <span className="rp-cb"><PCB c={form.vis_estendida} /> Estendida ⇒</span>
            <span className="rp-cb"><PCB c={form.vis_12h} /> 12 h</span>
            <span className="rp-cb"><PCB c={form.vis_24h} /> 24 h</span>
          </div>
          <div className="rp-row">
            <span className="rp-bold">14. Alta?</span>
            <span className="rp-cb"><PCB c={form.alta_prevista} /> Prevista para: <UL v={form.alta_data} /></span>
            <span className="rp-cb"><PCB c={form.alta_nao} /> Não</span>
          </div>
          {form.alta_prevista && (
            <div className="rp-row">
              <span className="rp-bold">NEWS no round:</span> <UL v={form.news_round} />
              <span className="rp-bold" style={{ marginLeft:'8pt' }}>NEWS na alta:</span> <UL v={form.news_alta} />
            </div>
          )}
        </div>
      </div>

      {/* 15 — cresce para preencher o que sobrar da folha */}
      <div className="rp-plano-wrap" style={{ marginTop:'5pt' }}>
        <span className="rp-title">15. PLANO TERAPÊUTICO:</span>
        <div className="rp-plano">{form.plano}</div>
      </div>

      {/* Assinaturas */}
      <div className="rp-sign-row">
        {['Médico','Enfermeiro','Fisioterapeuta'].map(r => (
          <div key={r} className="rp-sign-line">{r}</div>
        ))}
      </div>

      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
/**
 * Formulário de um leito. O estado vive na sessão (App), que sabe quais
 * leitos da área já foram feitos — assim sair e voltar não perde nada e a
 * impressão de qualquer leito continua disponível.
 */
export default function RoundForm({ ThemeCtxRef, leito, form, setForm, onVoltar, onConcluir }) {
  // Tablet em pé tem cerca de 768px: abaixo disso os controles empilham.
  const [estreito, setEstreito] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 900 : false
  );
  useEffect(() => {
    const aoRedimensionar = () => setEstreito(window.innerWidth < 900);
    window.addEventListener('resize', aoRedimensionar);
    window.addEventListener('orientationchange', aoRedimensionar);
    return () => {
      window.removeEventListener('resize', aoRedimensionar);
      window.removeEventListener('orientationchange', aoRedimensionar);
    };
  }, []);
  const T = useContext(ThemeCtxRef);
  const [limparModal, setLimparModal] = useState(false);
  const [newsModal, setNewsModal] = useState(false);

  // Nó no body para o portal de impressão e a folha de estilo.
  // Criados em efeito (não durante o render) para não deixar nós órfãos
  // quando o React monta o componente duas vezes em modo estrito.
  // O nó é construído no inicializador (operação pura, sem tocar no documento)
  // e só é anexado ao body dentro do efeito. Assim ele já existe na primeira
  // pintura, o portal funciona de imediato e nada fica órfão ao desmontar.
  const [portal] = useState(() => {
    const div = document.createElement('div');
    div.id = 'rmd-print-portal';
    return div;
  });
  const [preview, setPreview] = useState(false);
  const [escala, setEscala] = useState(1);

  useEffect(() => {
    document.body.appendChild(portal);

    const style = document.createElement('style');
    style.id = 'rmd-print-css';
    style.textContent = PRINT_CSS;
    document.head.appendChild(style);

    return () => {
      try { portal.remove(); } catch (_) { /* nó já removido */ }
      try { style.remove(); } catch (_) { /* nó já removido */ }
    };
  }, [portal]);

  // Mantém a classe da pré-visualização em sincronia com o estado.
  useEffect(() => {
    if (!portal) return;
    portal.classList.toggle('rmd-preview', preview);
  }, [portal, preview]);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const tog = k => setForm(f => {
    const ligando = !f[k];
    const next = { ...f, [k]: ligando };
    if (ligando) irmasDe(k).forEach(irma => { next[irma] = false; });
    return next;
  });

  /** Descarta o que foi preenchido neste leito. */
  const limparLeito = () => { setForm(emptyForm(leito)); setLimparModal(false); };

  /**
   * Encaixa a folha em uma página só.
   * Mede a altura real do conteúdo e, se passar da área útil, aplica redução
   * proporcional, alargando o miolo na mesma medida para manter a largura.
   * Duas passadas bastam para convergir, porque alargar reflui o texto.
   */
  /**
   * Encaixa a folha em uma página só.
   *
   * A redução é feita pela variável --s, que multiplica TODOS os tamanhos em
   * pt da folha: o texto reflui de verdade, exatamente como aconteceria com
   * uma fonte menor. Antes isso era feito com transform/zoom, que funciona no
   * Chrome mas não sobrevive ao motor de impressão do Safari — no iPad a
   * folha saía com barras pretas, conteúdo deslocado e em duas páginas,
   * porque a impressão partia do layout NÃO transformado.
   */
  const ajustarEscala = useCallback(() => {
    const caixa = document.getElementById('rmd-print');
    const miolo = document.getElementById('rmd-print-inner');
    if (!caixa || !miolo) return;

    const estilo = window.getComputedStyle(caixa);
    const padding = (parseFloat(estilo.paddingTop) || 0) + (parseFloat(estilo.paddingBottom) || 0);

    // No modo simples a caixa não tem altura fixa para servir de referência,
    // então o alvo vem da própria variável, convertida de milímetros.
    const mmEmPx = (mm) => (mm * 96) / 25.4;
    const alturaDeclarada = getComputedStyle(document.documentElement)
      .getPropertyValue('--altura-util').trim();
    const alvoFixo = mmEmPx(parseFloat(alturaDeclarada) || 275);

    let k = 1;
    caixa.style.setProperty('--s', '1');

    // Quatro passadas: mudar o tamanho da fonte reflui o texto e altera a
    // altura, então cada estimativa refina a anterior.
    for (let passada = 0; passada < 4; passada++) {
      const util = caixa.classList.contains('simples')
        ? alvoFixo
        : caixa.clientHeight - padding;
      const real = miolo.scrollHeight;
      if (!util || !real || real <= util - 2) break;
      k = k * (util / real) * 0.995;
      caixa.style.setProperty('--s', String(k));
    }
    setEscala(k);
  }, []);

  // No iOS todo navegador roda sobre o WebKit, então a detecção é por motor,
  // não por marca: Chrome e Firefox no iPad têm o mesmo comportamento do Safari.
  const [webkit] = useState(() => {
    const ua = navigator.userAgent || '';
    const iOS = /iPad|iPhone|iPod/.test(ua)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const safariDesktop = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
    return iOS || safariDesktop;
  });

  useLayoutEffect(() => {
    // Onde não controlamos as margens da página, a folha é dimensionada com
    // folga para caber mesmo com as margens que o sistema impuser.
    document.documentElement.style.setProperty('--altura-util', webkit ? '250mm' : '275mm');
    const caixa = document.getElementById('rmd-print');
    if (caixa) caixa.classList.toggle('simples', webkit);
  }, [webkit]);

  useLayoutEffect(() => { ajustarEscala(); });

  // Pré-visualização em tablet retrato: a folha A4 tem 794px de largura e não
  // cabe numa tela de 768px. O zoom encaixa sem cortar.
  useLayoutEffect(() => {
    if (!portal) return;
    const largura = Math.min(window.innerWidth - 24, 794);
    portal.style.setProperty('--zoom', String(Math.min(1, largura / 794)));
  }, [portal, preview]);

  const folha = form;

  /**
   * Deixa a folha pronta para o papel, independentemente de como a impressão
   * foi disparada: pelo botão do app ou pelo menu do navegador (no iPad, o
   * compartilhamento do Safari). Sem isto, imprimir com a pré-visualização
   * aberta levava para o papel a camada escura de fundo dela.
   */
  const prepararFolha = useCallback(() => {
    if (portal) {
      portal.classList.remove('rmd-preview');
      portal.style.removeProperty('--zoom');
    }
    ajustarEscala();
  }, [portal, ajustarEscala]);

  useEffect(() => {
    const consulta = window.matchMedia ? window.matchMedia('print') : null;
    const aoEntrarEmImpressao = (e) => { if (e.matches) prepararFolha(); };
    window.addEventListener('beforeprint', prepararFolha);
    if (consulta?.addEventListener) consulta.addEventListener('change', aoEntrarEmImpressao);
    else if (consulta?.addListener) consulta.addListener(aoEntrarEmImpressao);
    return () => {
      window.removeEventListener('beforeprint', prepararFolha);
      if (consulta?.removeEventListener) consulta.removeEventListener('change', aoEntrarEmImpressao);
      else if (consulta?.removeListener) consulta.removeListener(aoEntrarEmImpressao);
    };
  }, [prepararFolha]);

  /**
   * Impressão em documento isolado.
   *
   * Antes o app inteiro era escondido por CSS e só a folha ficava visível.
   * No WebKit (todo navegador do iPad) isso não funcionava: o fundo escuro da
   * interface continuava sendo pintado, virava um bloco azul abaixo da folha
   * e empurrava conteúdo para uma segunda página.
   *
   * Agora a folha é copiada para um iframe com documento próprio, contendo
   * apenas ela e a sua folha de estilo. Não existe app dentro dele — não há
   * o que vazar, esconder ou empurrar. É a mesma técnica que sistemas de
   * prontuário usam para gerar impressos previsíveis.
   */
  const imprimir = () => {
    setPreview(false);

    // Alguns navegadores usam o título do documento PRINCIPAL como nome
    // sugerido do arquivo, mesmo quando quem imprime é o iframe — daí o nome
    // sair sempre como o título da página. Trocamos os dois.
    const tituloOriginal = document.title;
    document.title = leito ? String(leito) : 'round';
    const restaurar = () => {
      document.title = tituloOriginal;
      window.removeEventListener('afterprint', restaurar);
    };
    window.addEventListener('afterprint', restaurar);
    setTimeout(restaurar, 120000);

    requestAnimationFrame(() => requestAnimationFrame(() => {
      prepararFolha();

      const folhaEl = document.getElementById('rmd-print');
      if (!folhaEl) return;

      const escala = folhaEl.style.getPropertyValue('--s') || '1';
      const alturaUtil = getComputedStyle(document.documentElement)
        .getPropertyValue('--altura-util').trim() || '275mm';

      const anterior = document.getElementById('rmd-print-frame');
      if (anterior) anterior.remove();

      const quadro = document.createElement('iframe');
      quadro.id = 'rmd-print-frame';
      quadro.setAttribute('aria-hidden', 'true');
      // Fora de vista, mas com dimensões reais: um iframe de tamanho zero não
      // chega a diagramar o conteúdo e imprimiria em branco.
      quadro.style.cssText =
        'position:absolute;left:-20000px;top:0;width:210mm;height:297mm;border:0;';
      document.body.appendChild(quadro);

      const doc = quadro.contentWindow.document;
      doc.open();
      doc.write(
        '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">' +
        // O título vira o nome sugerido do arquivo ao salvar como PDF.
        '<title>' + (leito ? String(leito) : 'round') + '</title>' +
        '<style>' +
        ':root{--altura-util:' + alturaUtil + ';}' +
        'html,body{margin:0;padding:0;background:#fff;}' +
        '@page{size:A4 portrait;margin:11mm 13mm;}' +
        PRINT_CSS_FOLHA +
        '</style></head><body>' +
        folhaEl.outerHTML +
        '</body></html>'
      );
      doc.close();

      // Garante a escala calculada, que vive numa propriedade inline.
      const copia = doc.getElementById('rmd-print');
      if (copia) copia.style.setProperty('--s', escala);

      const disparar = () => {
        quadro.contentWindow.focus();
        quadro.contentWindow.print();
        // O iframe só sai depois da caixa de impressão; removê-lo antes
        // cancelaria o trabalho em alguns navegadores.
        setTimeout(() => { try { quadro.remove(); } catch (_) { /* já removido */ } }, 60000);
      };

      // Espera o documento do iframe diagramar antes de mandar imprimir.
      if (doc.readyState === 'complete') requestAnimationFrame(disparar);
      else quadro.onload = () => requestAnimationFrame(disparar);
    }));
  };

  // Cores do tema
  const ac = T.accent || '#2d8cf0';
  const gr = T.green  || '#39d98a';
  const or = T.orange || '#f0822d';
  const pu = T.purple || '#b39dfa';
  const te = T.teal   || '#4ecdc4';
  const re = T.red    || '#ff5c5c';
  const ye = T.yellow || '#f5a623';

  // ── Atoms de estilo inline (não são componentes React, são só objetos) ──
  const inputStyle = (extraW) => ({
    background: T.bg, border: `2px solid ${T.border}`,
    borderRadius: 8, padding: '10px 14px',
    fontSize: 15, color: T.text,
    outline: 'none', minWidth: 0,
    width: extraW || undefined,
    flex: extraW ? '0 0 auto' : 1,
    fontFamily: 'inherit',
  });

  const cbPillStyle = (active, color) => ({
    display: 'inline-flex', alignItems: 'center', gap: 10,
    cursor: 'pointer', userSelect: 'none',
    padding: '10px 16px',
    background: active ? `${color}20` : T.surface2,
    border: `2px solid ${active ? color : T.border}`,
    borderRadius: 10, minHeight: 48, flexShrink: 0,
  });

  const cbTextStyle = (active, color) => ({
    fontSize: 15, fontWeight: active ? 700 : 400,
    color: active ? color : T.text, whiteSpace: 'nowrap',
  });

  const shStyle = (color) => ({
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '13px 18px',
    background: `${color}14`, borderLeft: `4px solid ${color}`,
  });

  const rowStyle = {
    display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10,
    padding: '12px 18px',
    borderBottom: `1px solid ${T.border}40`,
  };

  const cardStyle = {
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: 12, overflow: 'hidden', marginBottom: 8,
  };

  const lblStyle = {
    fontSize: 14, color: T.textMuted, fontWeight: 500, whiteSpace: 'nowrap',
  };

  const numBadge = (n, color) => (
    <span style={{
      width: 28, height: 28, borderRadius: '50%',
      background: color, color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 13, fontWeight: 800, flexShrink: 0,
    }}>{n}</span>
  );

  // Checkbox pill genérico — inline, sem subcomponente
  const CB = (k, label, color) => (
    <label key={k} style={cbPillStyle(form[k], color)}>
      <input
        type="checkbox" checked={form[k]}
        onChange={() => tog(k)}
        style={{ width: 20, height: 20, accentColor: color, cursor: 'pointer', flexShrink: 0 }}
      />
      <span style={cbTextStyle(form[k], color)}>{label}</span>
    </label>
  );

  const selectStyle = {
    background: T.bg, border: `2px solid ${T.border}`,
    borderRadius: 8, padding: '10px 14px',
    fontSize: 15, color: T.text,
    outline: 'none', cursor: 'pointer',
    fontFamily: 'inherit', flex: '0 0 auto',
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <>
      {/* Portal de impressão — montado em document.body, fora do #root */}
      {portal && ReactDOM.createPortal(
        <>
          <PrintArea form={folha} />
          {preview && (<>
            {escala < 0.72 && (
              <div className="rmd-preview-bar" style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 2,
                padding: '10px 16px', textAlign: 'center',
                background: 'rgba(245,166,35,0.95)', color: '#1a1200',
                fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
              }}>
                Folha reduzida a {Math.round(escala * 100)}% para caber em uma página.
                Considere encurtar o plano terapêutico.
              </div>
            )}
            <div className="rmd-preview-bar" style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              display: 'flex', gap: 12, justifyContent: 'center',
              padding: '14px 16px', background: 'rgba(15,20,28,0.95)',
              borderTop: '1px solid rgba(255,255,255,0.15)',
            }}>
              <button onClick={() => setPreview(false)} style={{
                background: 'none', border: '1px solid rgba(255,255,255,0.35)',
                color: '#fff', padding: '12px 22px', borderRadius: 10,
                fontSize: 15, minHeight: 48, cursor: 'pointer', fontFamily: 'inherit',
              }}>← Voltar ao formulário</button>
              <button onClick={() => imprimir()} style={{
                background: 'linear-gradient(135deg,#2d8cf0,#1a5fbd)', color: '#fff',
                border: 'none', padding: '12px 26px', borderRadius: 10,
                fontWeight: 700, fontSize: 15, minHeight: 48, cursor: 'pointer', fontFamily: 'inherit',
              }}>🖨️ Imprimir / Salvar</button>
            </div>
          </>)}
        </>,
        portal
      )}

      {/* Interface visual */}
      <div style={{
        height: '100dvh', display: 'flex', flexDirection: 'column',
        background: T.bg, color: T.text,
        fontFamily: 'DM Sans, sans-serif', overflow: 'hidden',
      }}>

        {/* TOPBAR */}
        <div style={{
          background: T.surface, borderBottom: `1px solid ${T.border}`,
          padding: '12px 20px', display: 'flex', alignItems: 'center',
          gap: 14, flexShrink: 0, flexWrap: 'wrap',
        }}>
          <button onClick={onVoltar} style={{
            background: 'none', border: `1px solid ${T.border}`,
            color: T.textMuted, padding: '10px 18px', borderRadius: 9,
            fontSize: 15, minHeight: 44, cursor: 'pointer', fontFamily: 'inherit',
          }}>← Voltar</button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `linear-gradient(135deg,${te},#1a7a60)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
            }}>🩺</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 17, color: T.white }}>Round Multidisciplinar</div>
              <div style={{ fontSize: 12, color: T.textMuted }}>Hospital Universitário São Francisco de Paula · UCPel</div>
            </div>
          </div>

          <div style={{
            padding: '6px 14px', borderRadius: 20,
            background: `${ac}18`, border: `1px solid ${ac}40`,
            fontSize: 13, color: ac, fontWeight: 700,
          }}>Leito {leito}</div>

          <div style={{ flex: 1 }} />

          <button onClick={() => setPreview(true)} style={{
            background: 'none', border: `2px solid ${ac}50`,
            color: ac, padding: '12px 20px', borderRadius: 10,
            fontWeight: 700, fontSize: 15, minHeight: 48, cursor: 'pointer', fontFamily: 'inherit',
          }}>👁 Pré-visualizar</button>

          <button onClick={() => imprimir()} style={{
            background: `linear-gradient(135deg,${ac},#1a5fbd)`,
            color: '#fff', border: 'none', padding: '12px 22px', borderRadius: 10,
            fontWeight: 700, fontSize: 15, minHeight: 48, cursor: 'pointer',
            fontFamily: 'inherit', boxShadow: `0 0 16px ${ac}35`,
          }}>🖨️ Imprimir / Salvar</button>

          <button onClick={onConcluir} style={{
            background: `linear-gradient(135deg,${gr},#1a7a50)`, border: 'none',
            color: '#fff', padding: '12px 22px', borderRadius: 10,
            fontWeight: 700, fontSize: 15, minHeight: 48, cursor: 'pointer', fontFamily: 'inherit',
            flex: estreito ? '1 1 100%' : '0 0 auto',
          }}>✓ Concluir</button>
        </div>

        {/* FORM SCROLLÁVEL */}
        <div style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          padding: '16px 16px 80px',
        }}>

          {/* CABEÇALHO */}
          <div style={{ ...cardStyle, padding: '18px 20px', marginBottom: 10 }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: `2px solid ${ac}`, paddingBottom: 10, marginBottom: 14,
              flexWrap: 'wrap', gap: 8,
            }}>
              <div>
                <div style={{ fontSize: 11, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Hospital Universitário
                </div>
                <div style={{ fontWeight: 800, fontSize: 17, color: T.white }}>São Francisco de Paula — UCPel</div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: ac }}>Round Multidisciplinar</div>
            </div>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {[
                { k: 'leito',      label: 'Leito / Iniciais',         color: ac, ph: 'Ex: 14 / J.D.S.' },
                { k: 'responsavel',label: 'Responsável pelo round',    color: T.textMuted, ph: 'Nome / equipe' },
                { k: 'data',       label: 'Data',                      color: T.textMuted, ph: 'dd/mm/aaaa' },
              ].map(({ k, label, color, ph }) => (
                <div key={k} style={{ flex: k === 'data' ? '1 1 140px' : k === 'leito' ? '2 1 200px' : '3 1 240px' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                    {label}
                  </div>
                  <input
                    type="text" value={form[k]}
                    onChange={e => upd(k, e.target.value)}
                    placeholder={ph}
                    style={{ ...inputStyle(), width: '100%', fontSize: 16, flex: undefined }}
                    onFocus={e => { e.target.style.borderColor = ac; }}
                    onBlur={e  => { e.target.style.borderColor = T.border; }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── 1. SEDAÇÃO ── */}
          <div style={cardStyle}>
            <div style={shStyle(pu)}>
              {numBadge(1, pu)}
              <span style={{ fontSize: 15, fontWeight: 700, color: T.white }}>Protocolo de Sedação</span>
            </div>
            <div style={rowStyle}>
              {CB('sed_na', 'N/A', T.textMuted)}
              <span style={lblStyle}>Pausar sedação:</span>
              {CB('sed_pausar_sim', 'Sim', gr)}
              {CB('sed_pausar_nao', 'Não', re)}
              <span style={lblStyle}>Motivo (se não pausar):</span>
              <Sugestoes opcoes={SUGESTOES.sed_pausar_motivo} valor={form.sed_pausar_motivo}
                onChange={v => upd('sed_pausar_motivo', v)} cor={re} T={T} inputStyle={inputStyle}
                placeholder="outros: descreva o motivo"/>
            </div>
            {/* RASS como select */}
            <div style={rowStyle}>
              <span style={lblStyle}>RASS alvo:</span>
              <select
                value={form.sed_rass}
                onChange={e => upd('sed_rass', e.target.value)}
                style={selectStyle}
              >
                <option value="">— selecionar —</option>
                {RASS_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── 2. ANALGESIA ── */}
          <div style={cardStyle}>
            <div style={shStyle(re)}>
              {numBadge(2, re)}
              <span style={{ fontSize: 15, fontWeight: 700, color: T.white }}>Protocolo de Analgesia</span>
            </div>
            <div style={rowStyle}>
              <span style={lblStyle}>Dor:</span>
              <span style={lblStyle}>Dor:</span>
              {CB('anal_dor_sim', 'Sim', re)}
              {CB('anal_dor_nao', 'Não', gr)}
              <span style={lblStyle}>BPS / escala numérica:</span>
              <input type="text" value={form.anal_bps}
                onChange={e => upd('anal_bps', e.target.value)}
                placeholder="0–10"
                style={{ ...inputStyle(110) }}
                onFocus={e => { e.target.style.borderColor = ac; }}
                onBlur={e  => { e.target.style.borderColor = T.border; }}
              />
              <div style={{ width: 2, height: 32, background: T.border, margin: '0 4px' }} />
              <span style={lblStyle}>Otimizar analgesia:</span>
              {CB('anal_otimizar_sim', 'Sim', gr)}
              {CB('anal_otimizar_nao', 'Não', re)}
            </div>
          </div>

          {/* ── 3. DESMAME VM ── */}
          <div style={cardStyle}>
            <div style={shStyle(te)}>
              {numBadge(3, te)}
              <span style={{ fontSize: 15, fontWeight: 700, color: T.white }}>Desmame de VM</span>
            </div>
            <div style={rowStyle}>
              {CB('desm_na', 'N/A', T.textMuted)}
              {CB('desm_sim', 'Sim', gr)}
              <input type="text" value={form.desm_modo}
                onChange={e => upd('desm_modo', e.target.value)}
                placeholder="PSV / Ayre / modo..."
                style={{ ...inputStyle(200) }}
                onFocus={e => { e.target.style.borderColor = ac; }}
                onBlur={e  => { e.target.style.borderColor = T.border; }}
              />
              {CB('desm_nao', 'Não', re)}
              <span style={lblStyle}>⇒ Motivo:</span>
              <Sugestoes opcoes={SUGESTOES.desm_motivo} valor={form.desm_motivo}
                onChange={v => upd('desm_motivo', v)} cor={re} T={T} inputStyle={inputStyle}
                placeholder="outros: justifique"/>
            </div>
          </div>

          {/* ── 4. TCLE ── */}
          <div style={cardStyle}>
            <div style={shStyle(ye)}>
              {numBadge(4, ye)}
              <span style={{ fontSize: 15, fontWeight: 700, color: T.white }}>TCLE Pesquisa</span>
            </div>
            <div style={rowStyle}>
              {CB('tcle_na', 'N/A', T.textMuted)}
              {CB('tcle_pendente', 'Pendente', ye)}
              {CB('tcle_autorizado', 'Autorizado', gr)}
              {CB('tcle_negado', 'Negado', re)}
            </div>
          </div>

          {/* ── 5. CUFF ── */}
          <div style={cardStyle}>
            <div style={shStyle(or)}>
              {numBadge(5, or)}
              <span style={{ fontSize: 15, fontWeight: 700, color: T.white }}>Pressão de Cuff (c/ cufômetro)</span>
            </div>
            <div style={rowStyle}>
              {CB('cuff_na', 'N/A', T.textMuted)}
              {CB('cuff_sim', 'Sim', gr)}
              {CB('cuff_nao', 'Não', re)}
              <span style={lblStyle}>Valores (cmH₂O):</span>
              {[['cuff_v1','inicial'],['cuff_v2','ajustado para'],['cuff_v3','ajustado para']].map(([k, rot]) => (
                <div key={k} style={{ display:'flex', flexDirection:'column', gap:3 }}>
                  <span style={{ fontSize:11, color:T.textDim, letterSpacing:'0.03em' }}>{rot}</span>
                  <input type="text" value={form[k]}
                    onChange={e => upd(k, e.target.value)}
                    placeholder="—"
                    style={{ ...inputStyle(96) }}
                    onFocus={e => { e.target.style.borderColor = ac; }}
                    onBlur={e  => { e.target.style.borderColor = T.border; }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ── 6. SECREÇÃO ── */}
          <div style={cardStyle}>
            <div style={shStyle(ac)}>
              {numBadge(6, ac)}
              <span style={{ fontSize: 15, fontWeight: 700, color: T.white }}>Secreção Respiratória</span>
            </div>
            <div style={rowStyle}>
              {CB('sec_sim', 'Sim', ac)}
              {CB('sec_nao', 'Não', T.textMuted)}
              <span style={lblStyle}>Quantidade:</span>
              {CB('sec_qtd_peq', 'Pequena', ac)}
              {CB('sec_qtd_med', 'Média', ye)}
              {CB('sec_qtd_gde', 'Grande', re)}
              <span style={lblStyle}>Tosse:</span>
              {CB('sec_tosse_ef', 'Efetiva', gr)}
              {CB('sec_tosse_parc', 'Parcialmente efetiva', ye)}
              <span style={lblStyle}>⇒ Aspecto:</span>
              <Sugestoes opcoes={SUGESTOES.sec_aspecto} valor={form.sec_aspecto}
                onChange={v => upd('sec_aspecto', v)} cor={ye} T={T} inputStyle={inputStyle}
                placeholder="outros: descreva o aspecto"/>
            </div>
          </div>

          {/* ── 7. STEP ── */}
          <div style={cardStyle}>
            <div style={shStyle(gr)}>
              {numBadge(7, gr)}
              <span style={{ fontSize: 15, fontWeight: 700, color: T.white }}>Protocolo de Mobilização STEP</span>
            </div>
            <div style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
                {[['step_a','A'],['step_b','B'],['step_c','C'],['step_d','D'],
                  ['step_e','E'],['step_f','F'],['step_nao','Não']].map(([k, l]) => (
                  // Botão em vez de <label> com <input> oculto: um campo
                  // invisível recebe foco ao ser tocado e o navegador rola até
                  // ele, o que jogava a tela para o fim do formulário. Botão é
                  // visível, então o foco não move a rolagem.
                  <button key={k} type="button" role="checkbox" aria-checked={form[k]}
                    aria-label={l === 'Não' ? 'Sem mobilização' : `Estágio ${l}`}
                    onClick={() => tog(k)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: l === 'Não' ? 80 : 62, height: 56,
                      background: form[k] ? `${gr}22` : T.surface2,
                      border: `2px solid ${form[k] ? gr : T.border}`,
                      borderRadius: 10, cursor: 'pointer', userSelect: 'none',
                      fontWeight: 700, fontSize: 18, fontFamily: 'inherit',
                      color: form[k] ? gr : T.textMuted,
                      transition: 'background 0.15s, border-color 0.15s', flexShrink: 0,
                    }}>
                    {l}
                  </button>                ))}
              </div>
              <div style={{
                fontSize: 12, color: T.textDim, lineHeight: 1.7,
                padding: '8px 12px', background: T.bg,
                borderRadius: 8, border: `1px solid ${T.border}40`,
              }}>
                <strong style={{ color: T.textMuted }}>A</strong> Mob. passiva/ativa leito ·{' '}
                <strong style={{ color: T.textMuted }}>B</strong> Exercícios no leito, sedestação ·{' '}
                <strong style={{ color: T.textMuted }}>C</strong> Exercícios beira-leito ·{' '}
                <strong style={{ color: T.textMuted }}>D</strong> Ortostase, poltrona, marcha estacionária ·{' '}
                <strong style={{ color: T.textMuted }}>E</strong> Marcha c/ equipe ·{' '}
                <strong style={{ color: T.textMuted }}>F</strong> Marcha c/ dispositivo
              </div>
            </div>
          </div>

          {/* ── 8. NUTRIÇÃO ── */}
          <div style={cardStyle}>
            <div style={shStyle(or)}>
              {numBadge(8, or)}
              <span style={{ fontSize: 15, fontWeight: 700, color: T.white }}>Nutrição</span>
            </div>
            <div style={rowStyle}>
              {CB('nut_vo', 'VO', or)}
              {CB('nut_npt', 'NPT', or)}
              {CB('nut_sne', 'SNE', or)}
              {CB('nut_trofica', 'Dieta trófica', te)}
            </div>
            <div style={rowStyle}>
              <span style={lblStyle}>Alvo:</span>
              <input type="text" value={form.nut_alvo}
                onChange={e => upd('nut_alvo', e.target.value)}
                placeholder="mL/h"
                style={{ ...inputStyle(110) }}
                onFocus={e => { e.target.style.borderColor = ac; }}
                onBlur={e  => { e.target.style.borderColor = T.border; }}
              />
              <div style={{ width: 2, height: 32, background: T.border, margin: '0 4px' }} />
              <span style={lblStyle}>Alvo atingido?</span>
              {CB('nut_alvo_sim', 'Sim', gr)}
              {CB('nut_alvo_nao', 'Não', re)}
              {/* Alvo não atingido: registra-se em que taxa a dieta está correndo. */}
              {form.nut_alvo_nao && <>
                <span style={lblStyle}>⇒ Taxa atual:</span>
                <input type="text" value={form.nut_taxa_atual}
                  onChange={e => upd('nut_taxa_atual', e.target.value)}
                  placeholder="mL/h"
                  style={{ ...inputStyle(110) }}
                  onFocus={e => { e.target.style.borderColor = re; }}
                  onBlur={e  => { e.target.style.borderColor = T.border; }}
                />
              </>}
              {CB('nut_progredir', 'Progredir', te)}
            </div>
            <div style={rowStyle}>
              {CB('nut_npo', 'NPO', re)}
              {form.nut_npo && <>
                <span style={lblStyle}>⇒ Motivo:</span>
                <input type="text" value={form.nut_npo_motivo}
                  onChange={e => upd('nut_npo_motivo', e.target.value)}
                  placeholder="procedimento, íleo paralítico..."
                  style={{ ...inputStyle() }}
                  onFocus={e => { e.target.style.borderColor = ac; }}
                  onBlur={e  => { e.target.style.borderColor = T.border; }}
                />
              </>}
            </div>
          </div>

          {/* ── 9. DISPOSITIVOS ── */}
          <div style={cardStyle}>
            <div style={shStyle(re)}>
              {numBadge(9, re)}
              <span style={{ fontSize: 15, fontWeight: 700, color: T.white }}>Dispositivos</span>
            </div>
            {[
              { label:'CVC',    simK:'dev_cv_sim',     naoK:'dev_cv_nao',     obsK:'dev_cv_obs',     sitioK:'dev_cv_sitio' },
              { label:'Shilley',simK:null,              naoK:null,             obsK:'dev_shilley_obs', sitioK:'dev_shilley_sitio' },
              { label:'SNE',    simK:'dev_sne_sim',    naoK:'dev_sne_nao',    obsK:'dev_sne_obs',    ausenteK:'dev_sne_ausente' },
              { label:'GTT',    simK:'dev_gtt_sim',    naoK:'dev_gtt_nao',    obsK:'dev_gtt_obs',    ausenteK:'dev_gtt_ausente' },
              { label:'SVD',    simK:'dev_svd_sim',    naoK:'dev_svd_nao',    obsK:'dev_svd_obs',    ausenteK:'dev_svd_ausente' },
              { label:'Outros', simK:'dev_outros_sim', naoK:'dev_outros_nao', obsK:'dev_outros_obs', ausenteK:'dev_outros_ausente' },
            ].map(dev => (
              <div key={dev.label} style={{ ...rowStyle, alignItems: dev.sitioK ? 'flex-start' : 'center' }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: T.white, minWidth: 72,
                  paddingTop: 8 }}>{dev.label}</span>
                {dev.sitioK && <>
                  <span style={lblStyle}>Sítio:</span>
                  <Sugestoes opcoes={SUGESTOES[dev.sitioK]} valor={form[dev.sitioK]}
                    onChange={v => upd(dev.sitioK, v)} cor={re} T={T} inputStyle={inputStyle}
                    livre={false}/>
                </>}
                {dev.simK && <>
                  <span style={lblStyle}>Pode remover?</span>
                  {CB(dev.simK, 'Sim', gr)}
                  {CB(dev.naoK, 'Não', re)}
                  {/* Terceiro estado: o paciente não tem o dispositivo. */}
                  {dev.ausenteK && CB(dev.ausenteK, 'Não possui', T.textMuted)}
                </>}
                <Sugestoes opcoes={SUGESTOES[dev.obsK] || []} valor={form[dev.obsK]}
                  onChange={v => upd(dev.obsK, v)} cor={ac} T={T} inputStyle={inputStyle}
                  placeholder="justificativa da permanência"/>
              </div>
            ))}
          </div>

          {/* ── 10. PROCEDIMENTO ── */}
          <div style={cardStyle}>
            <div style={shStyle(pu)}>
              {numBadge(10, pu)}
              <span style={{ fontSize: 15, fontWeight: 700, color: T.white }}>Procedimento</span>
            </div>
            <div style={rowStyle}>
              <input type="text" value={form.proc}
                onChange={e => upd('proc', e.target.value)}
                placeholder="Ex: traqueostomia amanhã, biópsia, TRS, broncoscopia..."
                style={{ ...inputStyle() }}
                onFocus={e => { e.target.style.borderColor = ac; }}
                onBlur={e  => { e.target.style.borderColor = T.border; }}
              />
            </div>
          </div>

          {/* ── 11. LPP ── */}
          <div style={cardStyle}>
            <div style={shStyle(or)}>
              {numBadge(11, or)}
              <span style={{ fontSize: 15, fontWeight: 700, color: T.white }}>Lesão por Pressão</span>
            </div>
            <div style={{ ...rowStyle, alignItems: 'flex-start' }}>
              {CB('lpp_sim', 'Sim', re)}
              {CB('lpp_nao', 'Não', gr)}
              {form.lpp_sim && <>
                <EditorLesoes lesoes={form.lpp_lesoes} onChange={v => upd('lpp_lesoes', v)}
                  T={T} cor={re} inputStyle={inputStyle}/>
                <span style={lblStyle}>Tratamento:</span>
                <input type="text" value={form.lpp_tratamento}
                  onChange={e => upd('lpp_tratamento', e.target.value)}
                  placeholder="curativo, cobertura..."
                  style={{ ...inputStyle() }}
                  onFocus={e => { e.target.style.borderColor = ac; }}
                  onBlur={e  => { e.target.style.borderColor = T.border; }}
                />
              </>}
            </div>
          </div>

          {/* ── 12. HIGIENE ORAL ── */}
          <div style={cardStyle}>
            <div style={shStyle(te)}>
              {numBadge(12, te)}
              <span style={{ fontSize: 15, fontWeight: 700, color: T.white }}>Higiene Oral</span>
            </div>
            <div style={rowStyle}>
              {CB('hig_sim', 'Sim', gr)}
              {CB('hig_nao', 'Não', re)}
              <div style={{ width: 2, height: 32, background: T.border, margin: '0 6px' }} />
              <span style={lblStyle}>Escova:</span>
              {CB('hig_escova_sim', 'Sim', gr)}
              {CB('hig_escova_nao', 'Não', re)}
            </div>
          </div>

          {/* ── 13. VISITA ── */}
          <div style={cardStyle}>
            <div style={shStyle(ac)}>
              {numBadge(13, ac)}
              <span style={{ fontSize: 15, fontWeight: 700, color: T.white }}>Visita</span>
            </div>
            <div style={rowStyle}>
              {CB('vis_usual', 'Usual', ac)}
              {CB('vis_estendida', 'Estendida', ac)}
              <span style={lblStyle}>⇒</span>
              {CB('vis_12h', '12 h', te)}
              {CB('vis_24h', '24 h', te)}
            </div>
          </div>

          {/* ── 14. ALTA ── */}
          <div style={cardStyle}>
            <div style={shStyle(gr)}>
              {numBadge(14, gr)}
              <span style={{ fontSize: 15, fontWeight: 700, color: T.white }}>Alta</span>
            </div>
            <div style={rowStyle}>
              {CB('alta_prevista', 'Prevista para:', gr)}
              {form.alta_prevista && (
                <input type="text" value={form.alta_data}
                  onChange={e => upd('alta_data', e.target.value)}
                  placeholder="dd/mm/aaaa"
                  style={{ ...inputStyle(160) }}
                  onFocus={e => { e.target.style.borderColor = ac; }}
                  onBlur={e  => { e.target.style.borderColor = T.border; }}
                />
              )}
              {CB('alta_nao', 'Não prevista', re)}
            </div>

            {/* O escore só aparece quando há alta prevista, que é quando ele
                serve de parâmetro objetivo para a decisão. */}
            {form.alta_prevista && (
              <div style={{ ...rowStyle, alignItems: 'center' }}>
                <span style={lblStyle}>Score NEWS no round:</span>
                <input type="text" value={form.news_round} readOnly
                  placeholder="—"
                  style={{ ...inputStyle(90), fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 700, fontSize: 17, textAlign: 'center' }}
                />
                <button type="button" onClick={() => setNewsModal(true)}
                  style={{
                    minHeight: 46, padding: '0 16px', borderRadius: 10,
                    background: `${ac}18`, border: `1.5px solid ${ac}50`, color: ac,
                    fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                  }}>{form.news_round ? 'Recalcular' : 'Calcular NEWS'}</button>

                <div style={{ width: 2, height: 32, background: T.border, margin: '0 4px' }} />

                <span style={lblStyle}>Score NEWS na alta:</span>
                <input type="text" value={form.news_alta}
                  onChange={e => upd('news_alta', e.target.value)}
                  placeholder="preencher na alta"
                  style={{ ...inputStyle(150), fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: 700, fontSize: 17, textAlign: 'center' }}
                  onFocus={e => { e.target.style.borderColor = ac; }}
                  onBlur={e  => { e.target.style.borderColor = T.border; }}
                />
              </div>
            )}
          </div>

          {/* ── 15. PLANO TERAPÊUTICO ── */}
          <div style={cardStyle}>
            <div style={shStyle(ac)}>
              {numBadge(15, ac)}
              <span style={{ fontSize: 15, fontWeight: 700, color: T.white }}>Plano Terapêutico</span>
            </div>
            <div style={{ padding: '14px 18px' }}>
              {/* Atalhos: acrescentam a frase ao texto e saem dele se tocados
                  de novo. O plano continua livre para edição. */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
                {SUGESTOES.plano.map(op => {
                  // Itens entram lado a lado, separados por ponto e vírgula:
                  // uma lista em linhas cresceria em altura e poderia empurrar
                  // a folha para uma segunda página.
                  const itens = (form.plano || '').split(';').map(l => l.trim()).filter(Boolean);
                  const marcado = itens.some(l => l.toLowerCase() === op.toLowerCase());
                  return (
                    <button key={op} type="button" aria-pressed={marcado}
                      onClick={() => {
                        const restantes = itens.filter(l => l.toLowerCase() !== op.toLowerCase());
                        upd('plano', (marcado ? restantes : [...restantes, op]).join('; '));
                      }}
                      style={{
                        padding:'8px 14px', borderRadius:20, fontSize:13.5, fontWeight:600,
                        fontFamily:'inherit', cursor:'pointer', minHeight:40,
                        border:`1.5px solid ${marcado ? ac : T.border}`,
                        background: marcado ? `${ac}22` : 'transparent',
                        color: marcado ? ac : T.textMuted,
                      }}>
                      {op}
                    </button>
                  );
                })}
              </div>
              <textarea
                value={form.plano}
                onChange={e => upd('plano', e.target.value)}
                placeholder="Plano terapêutico do dia, objetivos e condutas definidas no round..."
                rows={6}
                style={{
                  width: '100%', background: T.bg,
                  border: `2px solid ${T.border}`, color: T.text,
                  borderRadius: 10, padding: '14px 16px',
                  fontSize: 15, fontFamily: 'DM Sans, sans-serif',
                  lineHeight: 1.7, resize: 'vertical', outline: 'none',
                }}
                onFocus={e => { e.target.style.borderColor = ac; }}
                onBlur={e  => { e.target.style.borderColor = T.border; }}
              />
            </div>
          </div>

          {/* ASSINATURAS */}
          <div style={{ display: 'grid', gridTemplateColumns: estreito ? '1fr' : '1fr 1fr 1fr', gap: 12, marginBottom: 10 }}>
            {['Médico','Enfermeiro','Fisioterapeuta'].map(r => (
              <div key={r} style={{
                textAlign: 'center', padding: '14px 10px',
                background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10,
              }}>
                <div style={{ height: 36, borderBottom: `1px solid ${T.border}`, marginBottom: 8 }} />
                <div style={{ fontSize: 13, color: T.textMuted, fontWeight: 600 }}>{r}</div>
              </div>
            ))}
          </div>

          {/* HISTÓRICO */}
          {/* BOTÕES BOTTOM */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <button onClick={() => setPreview(true)} style={{
              flex: 1, minWidth: 200, minHeight: 56,
              background: 'none', border: `2px solid ${ac}50`, color: ac,
              borderRadius: 12, fontWeight: 700, fontSize: 16,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>👁 Pré-visualizar folha</button>
            <button onClick={() => imprimir()} style={{
              flex: 1, minWidth: 200, minHeight: 56,
              background: `linear-gradient(135deg,${ac},#1a5fbd)`,
              color: '#fff', border: 'none', borderRadius: 12,
              fontWeight: 700, fontSize: 16, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: `0 0 18px ${ac}35`,
            }}>🖨️ Imprimir / Salvar</button>
            <button onClick={onConcluir} style={{
              flex: 1, minWidth: 200, minHeight: 56,
              background: `linear-gradient(135deg,${gr},#1a7a50)`, border: 'none',
              color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 16,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>✓ Concluir leito {leito}</button>
            <button onClick={() => setLimparModal(true)} style={{
              flex: '0 0 auto', minWidth: 150, minHeight: 56,
              background: 'none', border: `2px solid ${T.border}`,
              color: T.textMuted, borderRadius: 12, fontWeight: 700, fontSize: 16,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>🧹 Limpar</button>
          </div>

        </div>{/* /scroll */}
      </div>{/* /interface */}

      {/* MODAL — limpar */}
      {newsModal && (
        <NewsScore
          T={T}
          valoresIniciais={form.news_params}
          onFechar={() => setNewsModal(false)}
          onConfirmar={(total, params) => {
            setForm(f => ({ ...f, news_round: String(total), news_params: params }));
            setNewsModal(false);
          }}
        />
      )}

      {limparModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: T.isDark ? 'rgba(0,0,0,0.87)' : 'rgba(0,20,50,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 500, backdropFilter: 'blur(4px)', padding: 16,
        }}>
          <div style={{
            background: T.surface, border: `2px solid ${T.border}`,
            borderRadius: 18, padding: 28, width: 'min(460px,100%)',
            maxHeight: '92vh', overflowY: 'auto',
          }}>
            <div style={{ fontWeight: 700, fontSize: 19, color: T.white, marginBottom: 6 }}>🧹 Limpar formulário</div>
            <div style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.6, marginBottom: 22 }}>
              Não pode ser desfeito — imprima antes o que precisar guardar.
            </div>

            <button onClick={limparLeito} style={{
              width: '100%', textAlign: 'left', minHeight: 64,
              background: T.surface2, border: `2px solid ${T.border}`,
              borderRadius: 12, padding: '14px 16px', marginBottom: 12,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              <div style={{ fontWeight: 700, fontSize: 15.5, color: T.white }}>Limpar o leito {leito}</div>
              <div style={{ fontSize: 13, color: T.textMuted, marginTop: 3, lineHeight: 1.5 }}>
                Apaga o que foi preenchido neste leito. Os demais leitos da área não são afetados.
              </div>
            </button>

            <button onClick={() => setLimparModal(false)} style={{
              width: '100%', minHeight: 52,
              background: 'none', border: `2px solid ${T.border}`,
              color: T.textMuted, borderRadius: 12,
              fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
            }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL */}
    </>
  );
}