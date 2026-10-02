/**
 * Cronometro.jsx
 * Selo de tempo decorrido do round, visível em todas as telas enquanto ele
 * acontece.
 *
 * A contagem não é guardada tique a tique: o que fica salvo são os instantes
 * de início e de fim. O relógio da tela é só uma leitura da diferença, o que
 * mantém o tempo correto mesmo se a aba for fechada e reaberta no meio.
 */
import React, { useState, useEffect } from 'react';
import { decorridos, formatarTempo, mediaPorLeito } from '../utils/sessao';

/** Segundo a segundo enquanto estiver correndo; parado, não gasta temporizador. */
function useAgora(ativo) {
  const [agora, setAgora] = useState(() => Date.now());
  useEffect(() => {
    if (!ativo) return undefined;
    const t = setInterval(() => setAgora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [ativo]);
  return agora;
}

export default function Cronometro({ T, sessao, compacto, onParar, onRetomar }) {
  const cron = sessao?.cronometro;
  const correndo = !!cron?.inicio && !cron?.fim;
  const agora = useAgora(correndo);

  // Antes do primeiro leito não há o que mostrar.
  if (!cron?.inicio) return null;

  const segundos = decorridos(cron, agora);
  const media = mediaPorLeito(sessao, agora);
  const cor = correndo ? (T.teal || '#4ecdc4') : T.textMuted;

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: compacto ? 8 : 10,
      padding: compacto ? '5px 11px' : '7px 14px',
      borderRadius: 20, background: `${cor}14`, border: `1px solid ${cor}40`,
      flexShrink: 0,
    }}>
      <span style={{ fontSize: compacto ? 13 : 14 }}>{correndo ? '⏱' : '⏸'}</span>

      <span style={{
        fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
        fontSize: compacto ? 14 : 16, color: cor, letterSpacing: '0.02em',
        fontVariantNumeric: 'tabular-nums',
      }}>{formatarTempo(segundos)}</span>

      {!compacto && media !== null && (
        <span style={{ fontSize: 11.5, color: T.textMuted, whiteSpace: 'nowrap' }}>
          {formatarTempo(media)}/leito
        </span>
      )}

      {!compacto && correndo && onParar && (
        <button onClick={onParar} title="Encerrar a contagem do round"
          style={{
            background: 'none', border: `1px solid ${T.border}`, color: T.textMuted,
            padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', minHeight: 'unset',
          }}>parar</button>
      )}

      {!compacto && !correndo && onRetomar && (
        <button onClick={onRetomar} title="Voltar a contar"
          style={{
            background: 'none', border: `1px solid ${T.border}`, color: T.textMuted,
            padding: '2px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', minHeight: 'unset',
          }}>retomar</button>
      )}
    </div>
  );
}
