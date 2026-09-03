/**
 * Tutorial.jsx
 * Passo a passo de uso, aberto pelo botão da tela inicial e automaticamente
 * na primeira vez que o aparelho abre o aplicativo.
 */
import React, { useState, useMemo } from 'react';

export const CHAVE_TUTORIAL = 'imulti_tutorial_visto';

/** Já viu o tutorial neste aparelho? */
export const jaViuTutorial = () => {
  try { return localStorage.getItem(CHAVE_TUTORIAL) === '1'; }
  catch (_) { return true; } // sem armazenamento, não insiste
};

export const marcarTutorialVisto = () => {
  try { localStorage.setItem(CHAVE_TUTORIAL, '1'); } catch (_) { /* indisponível */ }
};

const montarPassos = (area) => [
  {
    icone: '🩺',
    titulo: 'O que é o iMulti',
    texto: 'Ferramenta para o round multidisciplinar em terapia intensiva. A equipe percorre a unidade leito a leito, registra a avaliação de cada paciente e imprime uma folha por leito ao final.',
    itens: [
      'Feito para tablet, mas funciona em qualquer navegador.',
      'Não precisa de internet depois de carregado.',
      'Nenhum dado sai do aparelho.',
    ],
  },
  {
    icone: '🗺️',
    titulo: '1. Escolha a área',
    texto: 'Na abertura, selecione onde o round será feito. Cada área corresponde a uma faixa de leitos da unidade.',
    itens: [
      'Área 1 — leitos 11 a 20',
      'Área 2 — leitos 1 a 10',
      'Área 3 — leitos 21 a 30',
    ],
  },
  {
    icone: '🛏️',
    titulo: '2. Painel de leitos',
    texto: 'Os dez leitos da área aparecem com a situação de cada um. É a tela que mostra o que já foi feito e o que falta.',
    itens: [
      '○ Pendente — ainda não avaliado',
      '✓ Concluído — round registrado',
      '— Leito vazio — sem paciente no momento',
      '↗ Alta — paciente já saiu da unidade',
    ],
    nota: 'Um leito só deixa de ficar pendente se for avaliado ou se você justificar a ausência em "Não fazer". É assim que nenhum paciente passa despercebido.',
  },
  {
    icone: '📝',
    titulo: '3. Preencha o leito',
    texto: 'Toque em "Fazer round" e percorra os 15 itens. Os campos que se repetem todo dia têm opções prontas.',
    itens: [
      'Toque num chip para acrescentar o termo; toque de novo para remover.',
      'O campo de texto continua livre para o que não estiver na lista.',
      'Em Sim / Não / N-A, marcar uma opção desmarca as outras.',
    ],
  },
  {
    icone: '🖨️',
    titulo: '4. Gere a folha do leito',
    texto: 'Use "Pré-visualizar" para conferir e "Imprimir / Salvar" para gerar o documento. A folha sempre cabe em uma página só.',
    itens: [
      'Ao salvar como PDF, o nome do arquivo já vem preenchido com o número do leito.',
      'A folha traz espaço para etiqueta e assinatura de médico, enfermeiro e fisioterapeuta.',
      'Um leito concluído pode ser reaberto para revisar ou reimprimir.',
    ],
    nota: 'No iPad o caminho é outro: em vez de imprimir na hora, salve cada leito no Drive e imprima tudo depois, pelo computador. Os próximos passos mostram como.',
  },
  {
    icone: '📐',
    titulo: 'iPad · 1. Ajuste para 93%',
    texto: 'Na caixa de impressão do iPad, antes de qualquer coisa, confira estes três campos.',
    itens: [
      'Tamanho do papel: A4.',
      'Orientação: vertical.',
      'Redimensionamento: 93%.',
    ],
    imagem: 'ipad-1-redimensionar.jpg',
    nota: 'Os 93% são necessários porque o Safari usa margens próprias, maiores que as do documento. Sem esse ajuste a folha passa para uma segunda página.',
  },
  {
    icone: '📤',
    titulo: 'iPad · 2. Envie para o Drive',
    texto: 'Confirmado o ajuste, toque no ícone de compartilhamento no alto da tela e escolha o Google Drive.',
    itens: [
      'O arquivo já vem nomeado com o número do leito — confira antes de enviar.',
      'Não toque em "Imprimir": no round, o iPad só gera e guarda o arquivo.',
    ],
    imagem: 'ipad-2-compartilhar.jpg',
  },
  {
    icone: '📁',
    titulo: 'iPad · 3. Salve na pasta da área',
    texto: `Confira a conta e a pasta de destino antes de confirmar o envio.`,
    itens: [
      'Conta: passagemdeplantaoutihusfp@gmail.com',
      `Pasta: Round Multi - Área ${area || '(a área do round)'}`,
      'Repita para cada leito, sempre na mesma pasta.',
    ],
    imagem: 'ipad-3-drive.jpg',
    nota: 'Ao terminar o round, abra o Drive pelo computador da unidade e imprima todos os arquivos da pasta de uma vez.',
  },
  {
    icone: '💾',
    titulo: 'O round fica salvo',
    texto: 'Tudo é gravado no aparelho conforme você preenche. Fechar a aba sem querer, ou o tablet reiniciar, não custa o trabalho já feito.',
    itens: [
      'Ao reabrir no mesmo dia, o app oferece retomar o round.',
      'Ao virar o dia, o round recomeça limpo.',
      'Imprima antes de usar "Limpar" — a folha não é recuperável depois.',
    ],
  },
];

export default function Tutorial({ T, area, onFechar }) {
  const [i, setI] = useState(0);
  const PASSOS = useMemo(() => montarPassos(area), [area]);
  const passo = PASSOS[i];
  const ultimo = i === PASSOS.length - 1;
  const ac = T.accent;

  const fechar = () => { marcarTutorialVisto(); onFechar(); };

  return (
    <div
      onMouseDown={e => { if (e.target === e.currentTarget) fechar(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 800,
        background: T.isDark ? 'rgba(0,0,0,0.86)' : 'rgba(0,20,50,0.62)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}>
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18,
        width: 'min(520px,100%)', maxHeight: '92dvh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', animation: 'slideup 0.22s ease',
      }}>
        {/* topo */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 20px', borderBottom: `1px solid ${T.border}`, background: T.surface2,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: `${ac}18`, border: `1px solid ${ac}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>{passo.icone}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: '0.09em', textTransform: 'uppercase' }}>
              Tutorial · {i + 1} de {PASSOS.length}
            </div>
            <div style={{ fontWeight: 700, fontSize: 17, color: T.white, letterSpacing: '-0.02em' }}>
              {passo.titulo}
            </div>
          </div>
          <button onClick={fechar} style={{
            background: 'none', border: `1px solid ${T.border}`, color: T.textMuted,
            padding: '6px 12px', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
          }}>✕</button>
        </div>

        {/* conteúdo */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <p style={{ fontSize: 14.5, color: T.text, lineHeight: 1.65, margin: 0 }}>{passo.texto}</p>

          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 9 }}>
            {passo.itens.map(item => (
              <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: ac, fontSize: 15, lineHeight: 1.5, flexShrink: 0 }}>·</span>
                <span style={{ fontSize: 13.5, color: T.textMuted, lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>

          {passo.imagem && (
            <img
              src={`${process.env.PUBLIC_URL || ''}/tutorial/${passo.imagem}`}
              alt={passo.titulo}
              style={{
                width: '100%', marginTop: 16, borderRadius: 10,
                border: `1px solid ${T.border}`, display: 'block',
              }}
            />
          )}

          {passo.nota && (
            <div style={{
              marginTop: 16, padding: '11px 14px', borderRadius: 10,
              background: `${T.yellow}12`, border: `1px solid ${T.yellow}35`,
              fontSize: 13, color: T.yellow, lineHeight: 1.6,
            }}>{passo.nota}</div>
          )}
        </div>

        {/* navegação */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 20px', borderTop: `1px solid ${T.border}`, background: T.surface2,
        }}>
          <button onClick={() => setI(n => Math.max(0, n - 1))} disabled={i === 0}
            style={{
              minHeight: 46, padding: '0 18px', borderRadius: 10,
              background: 'none', border: `1.5px solid ${T.border}`, color: T.textMuted,
              fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
              opacity: i === 0 ? 0.35 : 1,
            }}>← Voltar</button>

          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 6 }}>
            {PASSOS.map((_, n) => (
              <button key={n} onClick={() => setI(n)} aria-label={`Passo ${n + 1}`}
                style={{
                  width: n === i ? 22 : 8, height: 8, borderRadius: 4, padding: 0,
                  minHeight: 8, border: 'none', cursor: 'pointer',
                  background: n === i ? ac : T.border,
                  transition: 'width 0.2s, background 0.2s',
                }}/>
            ))}
          </div>

          <button onClick={() => (ultimo ? fechar() : setI(n => n + 1))}
            style={{
              minHeight: 46, padding: '0 20px', borderRadius: 10,
              background: `linear-gradient(135deg,${ac},#0d8f88)`, border: 'none', color: '#fff',
              fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
            }}>{ultimo ? 'Começar →' : 'Próximo →'}</button>
        </div>
      </div>
    </div>
  );
}
