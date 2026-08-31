# iMulti

Ferramenta de round multidisciplinar em terapia intensiva, para uso em tablet
à beira do leito.

## Como funciona

1. **Escolha da área** — Área 1 (leitos 11–20), Área 2 (1–10) ou Área 3 (21–30).
2. **Painel de leitos** — mostra a situação de cada um: pendente, concluído,
   leito vazio ou alta. Um leito só sai de *pendente* se for avaliado ou se a
   ausência for justificada, então nada some por esquecimento.
3. **Formulário do leito** — os 15 itens do round, com opções pré-escritas nos
   campos que se repetem.
4. **Folha** — pré-visualização fiel e impressão em página única, com
   assinaturas de médico, enfermeiro e fisioterapeuta.

A sessão fica no armazenamento local do aparelho e é amarrada à data: ao virar
o dia, o round recomeça limpo.

## Rodar

```bash
npm install
npm start        # desenvolvimento
npm run build    # produção
```

Sem backend e sem dependências além de React — funciona offline depois de
carregado.

## Adaptação a outra instituição

Os pontos que mudam de serviço para serviço:

| O quê | Onde |
|---|---|
| Áreas e faixas de leitos | `src/utils/sessao.js` → `AREAS` |
| Opções pré-escritas dos campos | `src/components/RoundForm.jsx` → `SUGESTOES` |
| Campos do formulário | `src/components/RoundForm.jsx` → `emptyForm` |
| Grupos de opções exclusivas | `src/components/RoundForm.jsx` → `GRUPOS_EXCLUSIVOS` |
| Cabeçalho e rodapé da folha | `src/components/RoundForm.jsx` → `PrintArea` |
| Cores do tema | `src/components/ui.jsx` → `DARK` / `LIGHT` |

Nenhum desses pontos exige mexer na lógica: são listas e constantes.

---

Desenvolvido por Henrique Ceron da Silveira, Residente de Medicina Intensiva —
Hospital Universitário São Francisco de Paula — UCPel.
© 2026 Henrique Ceron da Silveira. Todos os direitos reservados.
