/**
 * iMulti — Round Multidisciplinar
 *
 * Fluxo: escolher a área → painel de leitos → formulário do leito → concluir.
 * Um leito não avaliado permanece PENDENTE até ser feito ou justificado como
 * leito vazio ou alta, de modo que nada some por esquecimento.
 */
import React, { useState, useEffect, createContext } from 'react';
import { DARK, LIGHT, makeCSS } from './components/ui';
import SelecaoArea from './components/SelecaoArea';
import PainelLeitos from './components/PainelLeitos';
import RoundForm, { emptyForm } from './components/RoundForm';
import {
  novaSessao, carregarSessao, salvarSessao, apagarSessao, hoje,
} from './utils/sessao';

export const ThemeCtx = createContext(DARK);

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('imulti_tema') !== 'light');
  const [sessao, setSessao] = useState(() => carregarSessao());
  const [tela, setTela] = useState(() => (carregarSessao() ? 'painel' : 'area'));
  const [leitoAberto, setLeitoAberto] = useState(null);

  const T = dark ? DARK : LIGHT;

  useEffect(() => {
    let el = document.getElementById('imulti-css');
    if (!el) { el = document.createElement('style'); el.id = 'imulti-css'; document.head.appendChild(el); }
    el.textContent = makeCSS(T);
  }, [T]);

  useEffect(() => { if (sessao) salvarSessao(sessao); }, [sessao]);

  const trocarTema = () => {
    const proximo = !dark;
    setDark(proximo);
    localStorage.setItem('imulti_tema', proximo ? 'dark' : 'light');
  };

  const escolherArea = (area) => {
    setSessao(novaSessao(area));
    setTela('painel');
  };

  const descartar = () => {
    apagarSessao();
    setSessao(null);
    setTela('area');
  };

  const abrirLeito = (n) => {
    setSessao(s => {
      const leito = s.leitos[n];
      if (leito.form) return s;
      // Primeira abertura: o formulário já nasce com o número do leito.
      return { ...s, leitos: { ...s.leitos, [n]: { ...leito, form: emptyForm(String(n)) } } };
    });
    setLeitoAberto(n);
    setTela('form');
  };

  const atualizarForm = (atualizador) => {
    setSessao(s => {
      const atual = s.leitos[leitoAberto];
      const proximo = typeof atualizador === 'function' ? atualizador(atual.form) : atualizador;
      return { ...s, leitos: { ...s.leitos, [leitoAberto]: { ...atual, form: proximo } } };
    });
  };

  const concluirLeito = () => {
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setSessao(s => ({
      ...s,
      leitos: { ...s.leitos, [leitoAberto]: { ...s.leitos[leitoAberto], status: 'feito', at: hora } },
    }));
    setLeitoAberto(null);
    setTela('painel');
  };

  const justificar = (n, status) => {
    const hora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setSessao(s => ({ ...s, leitos: { ...s.leitos, [n]: { ...s.leitos[n], status, at: hora } } }));
  };

  const reabrir = (n) => {
    setSessao(s => ({ ...s, leitos: { ...s.leitos, [n]: { ...s.leitos[n], status: 'pendente', at: null } } }));
  };

  // Virou o dia com a aba aberta: a sessão de ontem não vale mais.
  useEffect(() => {
    if (sessao && sessao.data !== hoje()) {
      apagarSessao();
      setSessao(null);
      setTela('area');
    }
  }, [sessao]);

  return (
    <ThemeCtx.Provider value={T}>
      {tela === 'area' || !sessao ? (
        <SelecaoArea
          T={T} dark={dark} onToggleTheme={trocarTema}
          sessaoAberta={sessao}
          onEscolher={escolherArea}
          onRetomar={() => setTela('painel')}
          onDescartar={descartar}
        />
      ) : tela === 'painel' ? (
        <PainelLeitos
          T={T} dark={dark} onToggleTheme={trocarTema}
          sessao={sessao}
          onAbrirLeito={abrirLeito}
          onJustificar={justificar}
          onReabrir={reabrir}
          onTrocarArea={() => setTela('area')}
        />
      ) : (
        <RoundForm
          ThemeCtxRef={ThemeCtx}
          leito={String(leitoAberto)}
          form={sessao.leitos[leitoAberto].form}
          setForm={atualizarForm}
          onVoltar={() => { setLeitoAberto(null); setTela('painel'); }}
          onConcluir={concluirLeito}
        />
      )}
    </ThemeCtx.Provider>
  );
}
