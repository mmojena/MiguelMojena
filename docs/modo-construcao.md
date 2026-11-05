# Modo construção — agentes montando a página

5 de novembro de 2026. Branch `feat/modo-construcao-agentes` (worktree `~/worktrees/miguelmojena-agentes`), sobre `origin/main` em `ec433a8`. Publicação em produção autorizada por Miguel em 05/11/2026: merge na `main` por PR e deploy pelo workflow do GitHub Pages (https://mmojena.github.io/MiguelMojena/).

Revisão independente (subagente sem contexto) aprovada sem achados de segurança nem de lógica. Sugestões corrigidas antes do merge:

- caixa da forma do hero medida com a escala de ocultação (exibia 2 × 2);
- "Rever" após o fim da página reconstruía o rodapé fora da tela;
- avanço rápido de bloco sem concluir o fundo da seção (texto escuro sobre fundo escuro por um instante no Contato);
- foco perdido quando "Pular" some no "Página pronta";
- camadas com tamanho zero (legenda oculta no tablet);
- boot sem proteção contra exceção;
- `innerHTML` no nome do arquivo do placeholder.

## Referência e ideia

Reel de referência (@matheusgomes, 02/11/2026): monitor com uma página em branco onde cerca de 30 cursores coloridos, no estilo multiplayer do Figma, desenham caixas com selo de medida, digitam o texto, trocam placeholders cinza por imagens e puxam guias rosa de alinhamento. Uma barra inferior mostra "33 agents · 188 / 737 layers".

Adaptação para o portfólio: um esquadrão de cursores-agente (Miguel, Estratégia, Design, Copy, Imagem, Front-end, QA e três sem nome; seis no celular) constrói cada bloco da página quando ele entra na tela. O efeito conversa com a assinatura "Ideias que ganham forma".

## Como funciona

- `assets/build-mode.js` (JavaScript puro, sem dependências): blocos observados por `IntersectionObserver`; cada bloco tem camadas que os agentes livres pegam por prioridade (bloco visível, especialidade do agente, ordem de leitura e distância).
- Tipos de camada:
  - `text`: caixa desenhada com medida ao vivo, depois digitação linha a linha via `clip-path: polygon` e cursor de texto;
  - `button`: preenchimento varrendo e clique;
  - `image`: placeholder com X e nome do arquivo, espera o carregamento e revela com scanline;
  - `shape`: escala a partir do canto;
  - `rule`: borda puxada com selo de largura;
  - `fill`: balde de tinta no fundo das seções Projetos e Contato.
- Overlay absoluto (`.mmb-layer`, `aria-hidden`) abaixo do cabeçalho fixo. HUD com contagem real de camadas, "Rever" (refaz o que está na tela) e "Pular" (conclui tudo e desliga na sessão; o foco de teclado passa ao primeiro link visível). Quando a última camada é montada, o HUD mostra "✓ Página pronta" por 2,6 s.
- Visitante no time: com mouse (`hover: hover` e `pointer: fine`), uma etiqueta "Você" acompanha o cursor real enquanto os agentes trabalham. O cursor do sistema não é substituído; em toque a etiqueta não aparece.
- Bootstrap no `<head>` adiciona `.mm-build` só com movimento permitido, se o visitante não pulou na sessão e se o user agent não é de robô de busca ou de prévia de link (Googlebot, Bingbot, LinkedIn, X etc.). Se o script não assumir em 4 s, a página aparece normalmente. O script tem versão na URL (`?v=2`) por causa do cache de 10 min do GitHub Pages.

## Garantias

- O texto nunca sai do DOM: só é recortado visualmente. SEO, leitor de tela e i18n (PT/EN/ES) continuam lendo o conteúdo.
- Sem JavaScript ou com `prefers-reduced-motion: reduce`: página idêntica à anterior, sem overlay.
- Blocos que o leitor já passou são concluídos sem animação. Foco por teclado, troca de idioma, redimensionamento, impressão e Esc concluem o que está em andamento.
- Estado final idêntico à página sem animação: estilos computados de todos os elementos comparados. Única diferença: o `clip-path` do retrato, que na referência vem da animação CSS original terminada (`inset(0%)`, visualmente igual).

## Validação executada (local, http://127.0.0.1:8790)

Scripts de QA e vídeos de demonstração mantidos fora do repositório, em `~/worktrees/miguelmojena-agentes-demo/` (`qa.mjs`, `wk.mjs`, `focus.mjs`, `perf.mjs`, `demo-desktop.mp4`, `demo-mobile.mp4`).

| Verificação | Resultado |
| --- | --- |
| Chromium 1440×900, rolagem completa | 0 erros/avisos de console; 89/89 camadas; sem `clip-path` residual; sem overflow (scrollWidth 1440) |
| Comparação com a página sem animação | 1 diferença (retrato, equivalente visual) |
| Chromium 390×844 (mobile) | 0 erros; 6 agentes; 89/89; scrollWidth 390 |
| WebKit 390×844 (motor do Safari) | 0 erros; 89/89; scrollWidth 390 |
| `prefers-reduced-motion: reduce` | sem `.mm-build`, sem overlay |
| JavaScript desligado | conteúdo visível |
| Troca de idioma no meio da construção | etiquetas e HUD traduzidos; nada preso |
| Rever / Pular / recarregar após pular | refaz o hero; pular zera os recortes e desliga na sessão |
| Link direto `#contact` | contato construído, sem resíduo |
| Tab durante a construção | elementos focados nunca recortados |
| Etiqueta "Você" | aparece com mouse durante a construção, some 1,5 s após parar; nunca em toque |
| "Página pronta" | exibida ao concluir 89/89, depois HUD volta ao estado ocioso |
| "Pular" via teclado | foco vai para o primeiro link visível ("Ver projetos") |
| User agent do Googlebot | sem `.mm-build`, sem overlay, nenhum recorte |
| Desempenho, CPU 4× mais lenta | p99 16,8 ms por frame, 0 frames > 50 ms |

## Limites e riscos

- Não testado em aparelhos físicos nem com leitor de tela real.
- LCP: o título e o retrato aparecem por animação (cerca de 2 s), o que pode piorar a métrica de LCP medida por ferramentas. Não medido com Lighthouse.
- Os nomes dos agentes são um recurso visual; a página não afirma que foi construída por agentes.
