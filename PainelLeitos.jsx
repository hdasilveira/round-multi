/**
 * PainelLeitos.jsx
 * Situação de cada leito da área. É a tela onde a equipe se orienta durante o
 * round: quem já foi feito, quem falta, e por que um leito não foi avaliado.
 */
import React, { useState } from 'react';
import { AREAS, STATUS, leitosDaArea, contagem, concluida } from '../utils/sessao';

export default function PainelLeitos({
  T, sessao, onAbrirLeito, onJustificar, onReabrir, onTrocarArea, dark, onToggleTheme,
}) {
  const [menu, setMenu] = useState(null); // leito com menu de justificativa aberto
  const leitos = leitosDaArea(sessao.area);
  const cont = contagem(sessao);
  const tudoPronto = concluida(sessao);

  const selo = (n, cor, texto) => (
    <span key={n} style={{
      padding: '5px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 700,
      background: `${cor}18`, border: `1px solid ${cor}40`, color: cor,
    }}>{texto}</span>
  );

  return (
    <div style={{ minHeight: '100dvh', background: T.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '12px 16px', borderBottom: `1px solid ${T.border}`,
        background: T.surface, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: T.white, letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            iMulti · {AREAS[sessao.area].nome}
          </div>
          <div style={{ fontSize: 12, color: T.textMuted }}>
            Leitos {AREAS[sessao.area].de} a {AREAS[sessao.area].ate} · {sessao.data}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={onToggleTheme} style={{
          background: T.surface2, border: `1px solid ${T.border}`, color: T.textMuted,
          padding: '7px 13px', borderRadius: 20, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit',
        }}>{dark ? '☀️' : '🌙'}</button>
        <button onClick={onTrocarArea} style={{
          background: 'none', border: `1px solid ${T.border}`, color: T.textMuted,
          padding: '7px 14px', borderRadius: 8, fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit',
        }}>Trocar área</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '18px 16px 40px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
            {cont.pendente > 0 && selo('p', STATUS.pendente.cor, `${cont.pendente} pendente(s)`)}
            {cont.feito > 0    && selo('f', STATUS.feito.cor,    `${cont.feito} concluído(s)`)}
            {cont.vazio > 0    && selo('v', STATUS.vazio.cor,    `${cont.vazio} leito(s) vazio(s)`)}
            {cont.alta > 0     && selo('a', STATUS.alta.cor,     `${cont.alta} alta(s)`)}
          </div>

          {tudoPronto && (
            <div style={{
              border: `2px solid ${STATUS.feito.cor}50`, background: `${STATUS.feito.cor}12`,
              borderRadius: 14, padding: '14px 18px', marginBottom: 18,
              fontSize: 14.5, color: STATUS.feito.cor, fontWeight: 700,
            }}>
              ✓ Round da {AREAS[sessao.area].nome} concluído — nenhum leito pendente.
            </div>
          )}

          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))' }}>
            {leitos.map(n => {
              const l = sessao.leitos[n] || { status: 'pendente' };
              const st = STATUS[l.status];
              const pendente = l.status === 'pendente';
              const menuAberto = menu === n;

              return (
                <div key={n} style={{
                  border: `2px solid ${pendente ? `${st.cor}55` : T.border}`,
                  background: T.surface, borderRadius: 14, overflow: 'hidden',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px' }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                      background: `${st.cor}18`, border: `1px solid ${st.cor}40`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 19, fontWeight: 800, color: st.cor,
                    }}>{n}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 15.5, color: T.white }}>Leito {n}</div>
                      <div style={{ fontSize: 12.5, color: st.cor, fontWeight: 600 }}>
                        {st.icone} {st.nome}{l.at ? ` · ${l.at}` : ''}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, padding: '0 14px 14px', flexWrap: 'wrap' }}>
                    <button onClick={() => onAbrirLeito(n)} style={{
                      flex: 1, minWidth: 120, minHeight: 46,
                      background: pendente ? 'linear-gradient(135deg,#4ecdc4,#0d8f88)' : 'none',
                      border: pendente ? 'none' : `1.5px solid ${T.border}`,
                      color: pendente ? '#fff' : T.text,
                      borderRadius: 10, fontWeight: 700, fontSize: 14,
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}>
                      {l.status === 'feito' ? 'Rever / imprimir' : pendente ? 'Fazer round' : 'Fazer mesmo assim'}
                    </button>

                    {pendente && !menuAberto && (
                      <button onClick={() => setMenu(n)} style={{
                        minWidth: 100, minHeight: 46,
                        background: 'none', border: `1.5px solid ${T.border}`, color: T.textMuted,
                        borderRadius: 10, fontWeight: 700, fontSize: 13.5,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}>Não fazer</button>
                    )}

                    {!pendente && (
                      <button onClick={() => onReabrir(n)} style={{
                        minWidth: 100, minHeight: 46,
                        background: 'none', border: `1.5px solid ${T.border}`, color: T.textMuted,
                        borderRadius: 10, fontWeight: 700, fontSize: 13.5,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}>Reabrir</button>
                    )}
                  </div>

                  {menuAberto && (
                    <div style={{
                      borderTop: `1px solid ${T.border}`, background: T.surface2,
                      padding: '12px 14px',
                    }}>
                      <div style={{ fontSize: 12.5, color: T.textMuted, marginBottom: 9 }}>
                        Por que o leito {n} não será avaliado?
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button onClick={() => { onJustificar(n, 'vazio'); setMenu(null); }} style={{
                          flex: 1, minWidth: 110, minHeight: 46,
                          background: `${STATUS.vazio.cor}18`, border: `1.5px solid ${STATUS.vazio.cor}45`,
                          color: STATUS.vazio.cor, borderRadius: 10, fontWeight: 700, fontSize: 13.5,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}>Leito vazio</button>
                        <button onClick={() => { onJustificar(n, 'alta'); setMenu(null); }} style={{
                          flex: 1, minWidth: 110, minHeight: 46,
                          background: `${STATUS.alta.cor}18`, border: `1.5px solid ${STATUS.alta.cor}45`,
                          color: STATUS.alta.cor, borderRadius: 10, fontWeight: 700, fontSize: 13.5,
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}>Alta</button>
                        <button onClick={() => setMenu(null)} style={{
                          minWidth: 90, minHeight: 46,
                          background: 'none', border: `1.5px solid ${T.border}`, color: T.textMuted,
                          borderRadius: 10, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit',
                        }}>Cancelar</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
