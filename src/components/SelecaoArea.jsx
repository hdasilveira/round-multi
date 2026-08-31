/**
 * SelecaoArea.jsx
 * Tela de abertura: escolha da área do round.
 */
import React from 'react';
import { AREAS, leitosDaArea, contagem } from '../utils/sessao';

export default function SelecaoArea({ T, sessaoAberta, onEscolher, onRetomar, onDescartar, onTutorial, dark, onToggleTheme }) {
  const cont = contagem(sessaoAberta);

  return (
    <div style={{ minHeight: '100dvh', background: T.bg, display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '14px 18px', borderBottom: `1px solid ${T.border}`,
        background: T.surface, display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 11,
          background: 'linear-gradient(135deg,#4ecdc4,#0d8f88)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 21, flexShrink: 0,
        }}>🩺</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 20, color: T.white, letterSpacing: '-0.03em', lineHeight: 1.1 }}>iMulti</div>
          <div style={{ fontSize: 12, color: T.textMuted }}>Round multidisciplinar</div>
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={onTutorial} style={{
          background: 'none', border: `1px solid #4ecdc450`, color: '#4ecdc4',
          padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
        }}>❔ Tutorial</button>
        <button onClick={onToggleTheme} style={{
          background: T.surface2, border: `1px solid ${T.border}`, color: T.textMuted,
          padding: '8px 14px', borderRadius: 20, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
        }}>{dark ? '☀️ Dia' : '🌙 Noite'}</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 18px 40px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>

          {sessaoAberta && (
            <div style={{
              border: `2px solid #4ecdc450`, background: '#4ecdc410',
              borderRadius: 16, padding: '18px 20px', marginBottom: 24,
            }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: T.white }}>
                Round de hoje em andamento — {AREAS[sessaoAberta.area].nome}
              </div>
              <div style={{ fontSize: 13.5, color: T.textMuted, marginTop: 5, lineHeight: 1.6 }}>
                {cont.feito} concluído(s) · {cont.pendente} pendente(s) · {cont.vazio + cont.alta} justificado(s)
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                <button onClick={onRetomar} style={{
                  flex: 1, minWidth: 180, minHeight: 52,
                  background: 'linear-gradient(135deg,#4ecdc4,#0d8f88)', border: 'none',
                  color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 15.5,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>Retomar round →</button>
                <button onClick={onDescartar} style={{
                  minWidth: 140, minHeight: 52,
                  background: 'none', border: `2px solid ${T.border}`, color: T.textMuted,
                  borderRadius: 12, fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
                }}>Descartar</button>
              </div>
            </div>
          )}

          <div style={{ fontSize: 22, fontWeight: 700, color: T.white, letterSpacing: '-0.02em', marginBottom: 6 }}>
            {sessaoAberta ? 'Ou comece em outra área' : 'Em qual área será o round?'}
          </div>
          <div style={{ fontSize: 14, color: T.textMuted, lineHeight: 1.6, marginBottom: 20 }}>
            Escolher uma área nova substitui o round em andamento.
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            {Object.entries(AREAS).map(([num, a]) => (
              <button key={num} onClick={() => onEscolher(Number(num))} style={{
                textAlign: 'left', background: T.surface, border: `2px solid ${T.border}`,
                borderRadius: 16, padding: '20px 22px', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: 18, minHeight: 92,
              }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                  background: T.surface2, border: `1px solid ${T.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, fontWeight: 800, color: T.white,
                }}>{num}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: T.white }}>{a.nome}</div>
                  <div style={{ fontSize: 14, color: T.textMuted, marginTop: 3 }}>
                    Leitos {a.de} a {a.ate} · {leitosDaArea(Number(num)).length} leitos
                  </div>
                </div>
                <div style={{ fontSize: 22, color: T.textDim }}>→</div>
              </button>
            ))}
          </div>

          <button onClick={onTutorial} style={{
            width: '100%', marginTop: 18, minHeight: 56,
            background: 'none', border: `1.5px dashed ${T.border}`, color: T.textMuted,
            borderRadius: 14, fontSize: 14.5, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>❔ Primeira vez aqui? Veja como usar o iMulti</button>

          <div style={{ marginTop: 28, fontSize: 11, color: T.textDim, lineHeight: 1.7 }}>
            Desenvolvido por <strong style={{ color: T.textMuted }}>Henrique Ceron da Silveira</strong>,
            Residente de Medicina Intensiva — Hospital Universitário São Francisco de Paula — UCPel.
            <br/>© {new Date().getFullYear()} Henrique Ceron da Silveira. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </div>
  );
}
