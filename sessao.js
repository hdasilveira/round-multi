/**
 * sessao.js
 * Estado de um round: a área escolhida e a situação de cada leito.
 *
 * Tudo fica no armazenamento local do aparelho e é amarrado à data. Ao virar
 * o dia, a sessão anterior é descartada e o round recomeça limpo — o round é
 * uma atividade diária, não um registro histórico.
 */

export const CHAVE = 'imulti_sessao';

/** Faixa de leitos de cada área da unidade. */
export const AREAS = {
  1: { nome: 'Área 1', de: 11, ate: 20 },
  2: { nome: 'Área 2', de: 1,  ate: 10 },
  3: { nome: 'Área 3', de: 21, ate: 30 },
};

export const STATUS = {
  pendente: { nome: 'Pendente',    cor: '#f5a623', icone: '○' },
  feito:    { nome: 'Concluído',   cor: '#39d98a', icone: '✓' },
  vazio:    { nome: 'Leito vazio', cor: '#5a7a99', icone: '—' },
  alta:     { nome: 'Alta',        cor: '#4ecdc4', icone: '↗' },
};

export const hoje = () => new Date().toLocaleDateString('pt-BR');

export const leitosDaArea = (area) => {
  const a = AREAS[area];
  if (!a) return [];
  const lista = [];
  for (let n = a.de; n <= a.ate; n++) lista.push(n);
  return lista;
};

/** Sessão nova, com todos os leitos da área pendentes. */
export const novaSessao = (area) => ({
  area,
  data: hoje(),
  leitos: leitosDaArea(area).reduce((acc, n) => {
    acc[n] = { status: 'pendente', form: null, at: null };
    return acc;
  }, {}),
});

/** Carrega a sessão do aparelho; devolve null se for de outro dia. */
export const carregarSessao = () => {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE) || 'null');
    if (bruto?.data === hoje() && AREAS[bruto.area]) return bruto;
  } catch (_) { /* sessão corrompida: começa do zero */ }
  return null;
};

export const salvarSessao = (sessao) => {
  try { localStorage.setItem(CHAVE, JSON.stringify(sessao)); }
  catch (_) { /* armazenamento cheio ou indisponível */ }
};

export const apagarSessao = () => {
  try { localStorage.removeItem(CHAVE); } catch (_) { /* indisponível */ }
};

/** Quantos leitos em cada situação. */
export const contagem = (sessao) => {
  const base = { pendente: 0, feito: 0, vazio: 0, alta: 0 };
  if (!sessao) return base;
  Object.values(sessao.leitos).forEach(l => { base[l.status] = (base[l.status] || 0) + 1; });
  return base;
};

/** O round está encerrado quando nenhum leito segue pendente. */
export const concluida = (sessao) => contagem(sessao).pendente === 0;
