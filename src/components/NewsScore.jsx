/**
 * NewsScore.jsx
 * Cálculo do NEWS2 (National Early Warning Score 2, Royal College of
 * Physicians, 2017).
 *
 * ATENÇÃO CLÍNICA — duas limitações desta implementação:
 *
 * 1. Usa apenas a ESCALA 1 de saturação. A escala 2 existe para pacientes com
 *    insuficiência respiratória hipercápnica e alvo de SpO2 de 88 a 92%, e
 *    tem pontuação própria. Quem for pontuar um retentor de CO2 precisa
 *    conferir a tabela correta à mão.
 * 2. O item de consciência segue o ACVPU: pontua 3 tanto para resposta a voz,
 *    dor ou ausência de resposta quanto para confusão NOVA. Confusão crônica
 *    não pontua.
 *
 * O escore é ferramenta de triagem de deterioração, não de decisão de alta.
 */
import React, { useState, useMemo } from 'react';

/** Faixas de pontuação. Cada item devolve 0 a 3. */
const pontuar = {
  fr: (v) => (v <= 8 ? 3 : v <= 11 ? 1 : v <= 20 ? 0 : v <= 24 ? 2 : 3),
  spo2: (v) => (v <= 91 ? 3 : v <= 93 ? 2 : v <= 95 ? 1 : 0),
  temp: (v) => (v <= 35.0 ? 3 : v <= 36.0 ? 1 : v <= 38.0 ? 0 : v <= 39.0 ? 1 : 2),
  pas: (v) => (v <= 90 ? 3 : v <= 100 ? 2 : v <= 110 ? 1 : v <= 219 ? 0 : 3),
  fc: (v) => (v <= 40 ? 3 : v <= 50 ? 1 : v <= 90 ? 0 : v <= 110 ? 1 : v <= 130 ? 2 : 3),
};

const num = (v) => {
  const n = parseFloat(String(v).replace(',', '.'));
  return isFinite(n) ? n : null;
};

/**
 * @returns { total, itens, completo, risco } ou null se faltar parâmetro.
 */
export const calcularNews = (p) => {
  const fr = num(p.fr), spo2 = num(p.spo2), temp = num(p.temp);
  const pas = num(p.pas), fc = num(p.fc);
  if ([fr, spo2, temp, pas, fc].some(v => v === null)) return null;

  const itens = {
    fr: pontuar.fr(fr),
    spo2: pontuar.spo2(spo2),
    o2: p.o2 ? 2 : 0,
    temp: pontuar.temp(temp),
    pas: pontuar.pas(pas),
    fc: pontuar.fc(fc),
    consciencia: p.consciencia && p.consciencia !== 'A' ? 3 : 0,
  };
  const total = Object.values(itens).reduce((a, b) => a + b, 0);
  const algumTres = Object.values(itens).some(v => v === 3);

  // Faixas de risco do NEWS2. Um único parâmetro valendo 3 já eleva o risco,
  // mesmo com total baixo — é o caso do paciente que descompensa num só eixo.
  const risco =
    total >= 7 ? { nome: 'Alto', cor: '#ff5c5c' }
    : (total >= 5 || algumTres) ? { nome: 'Médio', cor: '#f5a623' }
    : total >= 1 ? { nome: 'Baixo', cor: '#39d98a' }
    : { nome: 'Baixo', cor: '#39d98a' };

  return { total, itens, risco, algumTres };
};

const CAMPOS = [
  { k: 'fr',   rot: 'Frequência respiratória', un: 'irpm',  ph: '18' },
  { k: 'spo2', rot: 'Saturação de O₂',         un: '%',     ph: '96' },
  { k: 'pas',  rot: 'Pressão arterial sistólica', un: 'mmHg', ph: '120' },
  { k: 'fc',   rot: 'Frequência cardíaca',     un: 'bpm',   ph: '78' },
  { k: 'temp', rot: 'Temperatura',             un: '°C',    ph: '36,5' },
];

const CONSCIENCIA = [
  { v: 'A', rot: 'Alerta' },
  { v: 'C', rot: 'Confusão nova' },
  { v: 'V', rot: 'Responde à voz' },
  { v: 'P', rot: 'Responde à dor' },
  { v: 'U', rot: 'Não responsivo' },
];

export default function NewsScore({ T, valoresIniciais, onConfirmar, onFechar }) {
  const [p, setP] = useState(valoresIniciais || {
    fr: '', spo2: '', temp: '', pas: '', fc: '', o2: false, consciencia: 'A',
  });
  const resultado = useMemo(() => calcularNews(p), [p]);
  const ac = T.accent || '#2d8cf0';

  const campo = {
    background: T.bg, border: `1.5px solid ${T.border}`, color: T.text,
    borderRadius: 9, padding: '11px 13px', fontSize: 17, width: 110,
    fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
  };

  const pastilha = (ativo, cor) => ({
    padding: '9px 15px', borderRadius: 20, fontSize: 14, fontWeight: 700,
    fontFamily: 'inherit', cursor: 'pointer', minHeight: 46,
    border: `1.5px solid ${ativo ? cor : T.border}`,
    background: ativo ? `${cor}22` : 'transparent',
    color: ativo ? cor : T.textMuted,
  });

  return (
    <div
      onMouseDown={e => { if (e.target === e.currentTarget) onFechar(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 700,
        background: T.isDark ? 'rgba(0,0,0,0.86)' : 'rgba(0,20,50,0.62)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}>
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18,
        width: 'min(560px,100%)', maxHeight: '92dvh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 20px', borderBottom: `1px solid ${T.border}`, background: T.surface2,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: T.white }}>Score NEWS 2</div>
            <div style={{ fontSize: 12.5, color: T.textMuted }}>National Early Warning Score</div>
          </div>
          <div style={{ flex: 1 }} />
          <button onClick={onFechar} style={{
            background: 'none', border: `1px solid ${T.border}`, color: T.textMuted,
            padding: '6px 12px', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
          }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {CAMPOS.map(c => (
            <div key={c.k} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '9px 0', borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap',
            }}>
              <span style={{ flex: 1, minWidth: 170, fontSize: 14.5, color: T.text }}>{c.rot}</span>
              <input inputMode="decimal" value={p[c.k]} placeholder={c.ph}
                onChange={e => setP({ ...p, [c.k]: e.target.value })} style={campo} />
              <span style={{ fontSize: 13, color: T.textMuted, width: 44 }}>{c.un}</span>
              <span style={{
                width: 30, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 700, fontSize: 16,
                color: resultado ? (resultado.itens[c.k] === 3 ? '#ff5c5c' : resultado.itens[c.k] > 0 ? '#f5a623' : T.textDim) : T.textDim,
              }}>{resultado ? resultado.itens[c.k] : '—'}</span>
            </div>
          ))}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${T.border}`, flexWrap: 'wrap' }}>
            <span style={{ flex: 1, minWidth: 150, fontSize: 14.5, color: T.text }}>Oxigenação</span>
            <button onClick={() => setP({ ...p, o2: false })} style={pastilha(!p.o2, '#39d98a')}>
              Ar ambiente
            </button>
            <button onClick={() => setP({ ...p, o2: true })} style={pastilha(p.o2, '#f5a623')}>
              O₂ suplementar
            </button>
            <span style={{ width: 30, textAlign: 'center', fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, fontSize: 16, color: p.o2 ? '#f5a623' : T.textDim }}>
              {p.o2 ? 2 : 0}
            </span>
          </div>

          <div style={{ padding: '12px 0' }}>
            <div style={{ fontSize: 14.5, color: T.text, marginBottom: 9 }}>Nível de consciência</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {CONSCIENCIA.map(c => (
                <button key={c.v} onClick={() => setP({ ...p, consciencia: c.v })}
                  style={pastilha(p.consciencia === c.v, c.v === 'A' ? '#39d98a' : '#ff5c5c')}>
                  {c.rot}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            marginTop: 6, padding: '10px 13px', borderRadius: 10,
            background: `${T.yellow || '#f5a623'}12`, border: `1px solid ${(T.yellow || '#f5a623')}35`,
            fontSize: 12, color: T.yellow || '#f5a623', lineHeight: 1.55,
          }}>
            Escala 1 de saturação. Para retentor de CO₂, com alvo de 88 a 92%, a pontuação
            é a da escala 2 e precisa ser conferida à parte.
          </div>
        </div>

        <div style={{
          padding: '16px 20px', borderTop: `1px solid ${T.border}`, background: T.surface2,
          display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
        }}>
          <div style={{ flex: 1, minWidth: 150 }}>
            <div style={{ fontSize: 11, color: T.textMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Total</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 32, fontWeight: 800,
                color: resultado ? resultado.risco.cor : T.textDim, lineHeight: 1.1,
              }}>{resultado ? resultado.total : '—'}</span>
              {resultado && (
                <span style={{ fontSize: 14, fontWeight: 700, color: resultado.risco.cor }}>
                  risco {resultado.risco.nome.toLowerCase()}
                  {resultado.algumTres && resultado.total < 5 ? ' (parâmetro isolado em 3)' : ''}
                </span>
              )}
            </div>
          </div>
          <button onClick={onFechar} style={{
            minHeight: 52, padding: '0 20px', borderRadius: 11,
            background: 'none', border: `1.5px solid ${T.border}`, color: T.textMuted,
            fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancelar</button>
          <button disabled={!resultado} onClick={() => onConfirmar(resultado.total, p)}
            style={{
              minHeight: 52, padding: '0 22px', borderRadius: 11,
              background: `linear-gradient(135deg,${ac},#1a5fbd)`, border: 'none', color: '#fff',
              fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
              opacity: resultado ? 1 : 0.45,
            }}>Usar no round →</button>
        </div>
      </div>
    </div>
  );
}
