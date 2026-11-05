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

**Atualização 05/11/2026, branch `feat/rolagem-3d`:** pedido do Miguel após ver em produção. "Pular" deixa de desligar a animação para as próximas aberturas: vale só para a visita atual, e toda abertura ou recarga constrói de novo. Entra a profundidade 3D na rolagem (seção abaixo). Publicado com autorização do Miguel (PR #5).

**Atualização 05/11/2026, branch `feat/blueprint-nome`:** camadas inspiradas no getlayers.ai, escolhidas a partir de consulta aos perfis `commercial` e `strategist`. Os dois priorizaram "blueprint → site real" e "retrato dentro do nome" e desaconselharam vitrine 3D, abertura com monograma e modo inspeção. Detalhes na seção "Planta, nome e peso". Publicação autorizada por Miguel em 05/11/2026.

## Referência e ideia

Reel de referência (@matheusgomes, 02/11/2026): monitor com uma página em branco onde cerca de 30 cursores coloridos, no estilo multiplayer do Figma, desenham caixas com selo de medida, digitam o texto, trocam placeholders cinza por imagens e puxam guias rosa de alinhamento. Uma barra inferior mostra "33 agents · 188 / 737 layers".

Adaptação para o portfólio: um esquadrão de cursores-agente (Miguel, Estratégia, Design, Copy, Imagem, Front-end, QA e três sem nome; seis no celular) constrói cada bloco da página quando ele entra na tela. O efeito conversa com a assinatura "Ideias que ganham forma".

## Como funciona

- `assets/build-mode.js` (JavaScript puro, sem dependências): blocos observados por `IntersectionObserver`; cada bloco tem camadas que os agentes livres pegam por prioridade (bloco visível, especialidade do agente, ordem de leitura e distância).
- Tipos de camada:
  - `text`: caixa desenhada com medida ao vivo, depois digitação linha a linha via `clip-path: polygon` e cursor de texto;
  - `button`: preenchimento varrendo e clique;
  - `image`: placeholder com X e nome do arquivo, espera o carregamento e revela com scanline. Nas capturas de projeto, a planta é desenhada primeiro, varrendo da esquerda, e a captura real é renderizada sobre ela de cima para baixo;
  - `shape`: escala a partir do canto;
  - `rule`: borda puxada com selo de largura;
  - `fill`: balde de tinta no fundo das seções Projetos e Contato.
- Overlay absoluto (`.mmb-layer`, `aria-hidden`) abaixo do cabeçalho fixo. HUD com contagem real de camadas, "Rever" (refaz o que está na tela) e "Pular" (conclui tudo nesta visita; o HUD continua com "Rever" e o foco de teclado passa para ele). Nada é gravado no navegador: toda abertura ou recarga constrói de novo. Quando a última camada é montada, o HUD mostra "✓ Página pronta" por 2,6 s.
- Cada tarefa guarda a caixa do elemento no início ("âncora") e, a cada quadro, mapeia a âncora sobre a caixa atual (translação + escala) num contêiner `.mmb-task`. Assim seleção, cursor de digitação, placeholder e o agente acompanham o elemento enquanto a profundidade 3D o move. As medidas de linha ficam em pixels CSS do elemento (a escala dos ancestrais é descontada), então o recorte do texto continua exato.
- Visitante no time: com mouse (`hover: hover` e `pointer: fine`), uma etiqueta "Você" acompanha o cursor real enquanto os agentes trabalham. O cursor do sistema não é substituído; em toque a etiqueta não aparece.
- Bootstrap no `<head>` adiciona `.mm-build` só com movimento permitido e se o user agent não é de robô de busca ou de prévia de link (Googlebot, Bingbot, LinkedIn, X etc.). Se o script não assumir em 4 s, a página aparece normalmente. Os scripts têm versão na URL (`build-mode.js?v=4`, `blueprint.js?v=1`) por causa do cache de 10 min do GitHub Pages.

## Planta, nome e peso

- **Planta das capturas** (`assets/blueprint.js`, `assets/projects/blueprint/*.avif`):
  - Cada captura tem uma versão em linhas verde-limão sobre grafite, com grade de 32 px. Ela é gerada da própria captura por detecção de bordas no ffmpeg (`edgedetect` com limiares 0,06/0,16; Antônia 0,12/0,3, por excesso de detalhe). É uma estilização da página pronta, não o wireframe original do projeto.
  - O módulo cria um `<picture>` gêmeo dentro de cada `.project__preview`, espelhando os `<source>` de celular e computador. As plantas são carregadas a 900 px de distância e são decorativas (`alt=""`, `aria-hidden`, sem eventos de ponteiro).
  - Se o AVIF não decodificar, a planta é pulada: a montagem cai na revelação simples e a lente não aparece.
  - Lente "raio-x" (só com mouse): um círculo de 104 px mostra a planta sob o cursor, com anel e etiqueta "Estrutura" (EN "Structure", ES "Estructura"). Fica desligada enquanto os agentes montam aquele quadro (`.mmb-building`).
- **Retrato dentro do nome:** "Mojena." passou a ser verde-limão sólido, na altura do peito, atrás da cabeça e na frente do painel. Uma cópia `.hero__word--front`, só com contorno e máscara na metade de baixo, passa na frente do corpo. A cópia acompanha a digitação dos agentes (`twin`) e a profundidade da rolagem. Antes, a palavra ficava atrás do painel e quase não aparecia.
- **Peso:**
  - Os retratos ganharam `<picture>` com WebP com transparência: `portrait.webp` tem 110 KB (antes 1,5 MB em PNG) e `contact-portrait-final.webp` tem 112 KB (antes 1,3 MB). O PNG continua como reserva.
  - Medição local em condição de celular lento (Chromium, 412×823, CPU 4× mais lenta, 150 ms de latência, 1,6 Mbps, sem cache, mediana de 3 rodadas): 1.681 KB → 353 KB baixados (−79%). FCP 784 → 916 ms e LCP 2.620 → 2.720 ms, dentro da variação entre rodadas (em outra medição da versão anterior: 616 e 2.280 ms). O LCP é o título, que surge pela digitação dos agentes, e por isso não depende do peso. Não é nota do PageSpeed: a API pública do Google estava sem cota no dia.
  - O WebP foi codificado pelo canvas do Chromium. O AVIF com transparência gerado pelo `sips` do macOS aparece totalmente transparente no Chromium (verificado lendo pixels), e o ffmpeg local (SVT-AV1) não codifica canal alfa monocromático.

## Profundidade na rolagem (pranchetas num canvas)

CSS puro em `index.html`, com animações ligadas à rolagem (`animation-timeline: view()`), só `transform` e `opacity` (rodam no compositor, presas ao dedo ou ao mouse). Independente do modo construção: continua ativa depois de "Pular". Desligada sem suporte do navegador (`@supports`) e com movimento reduzido.

- Recuo: hero, Projetos, Oferta, Sobre e Processo, enquanto saem por cima (`exit 0%` → `exit 100%`), inclinam para trás e encolhem a partir da borda de baixo (`perspective(1600px) rotateX(6deg) scale(.92)`) e escurecem até 38%.
- Canvas: fundo de pontos sutil no `body` (26 px), visível só nas laterais quando uma seção recua; as seções ganham fundo sólido igual ao de antes.
- Hero em camadas: "Mojena." fica 150 px para trás e esmaece; o painel atrás do retrato, 60 px. Usa a propriedade `translate`, que se soma ao `transform` usado pelos agentes no painel.
- Capturas dos projetos: zoom e deslocamento lento dentro da moldura enquanto atravessam a tela (`scale` 1,16 → 1,09; `translate` −4% → 4%).
- Contato: chega de trás (`rotateX(-7deg) scale(.9)` → normal) enquanto entra.
- Sem rolagem com inércia artificial (tipo Lenis): a rolagem nativa do aparelho foi mantida de propósito, sem sequestro de rolagem.

## Garantias

- O texto nunca sai do DOM: só é recortado visualmente. SEO, leitor de tela e i18n (PT/EN/ES) continuam lendo o conteúdo.
- Sem JavaScript ou com `prefers-reduced-motion: reduce`: página idêntica à anterior, sem overlay. Movimento reduzido também desliga a profundidade 3D.
- Blocos que o leitor já passou são concluídos sem animação. Foco por teclado, troca de idioma, redimensionamento, impressão e Esc concluem o que está em andamento.
- Estado final idêntico à página sem animação: estilos computados de todos os elementos comparados (referência = mesma página com `build-mode.js` bloqueado). Diferenças: o `clip-path` do retrato, que na referência vem da animação CSS original terminada (`inset(0%)`, visualmente igual), e a quarta casa decimal da transformação 3D da seção Processo, por fração de pixel na posição final de rolagem.

## Validação executada (local, http://127.0.0.1:8790)

Scripts de QA e vídeos de demonstração mantidos fora do repositório, em `~/worktrees/miguelmojena-agentes-demo/` (`qa.mjs`, `extra.mjs`, `regress.mjs`, `track.mjs`, `fx.mjs`, `wk.mjs`, `focus.mjs`, `perf.mjs`, `demo-*.mp4`, `demo3d-*.mp4`).

| Verificação | Resultado |
| --- | --- |
| Chromium 1440×900, rolagem completa | 0 erros/avisos de console; 89/89 camadas; sem `clip-path` residual; sem overflow (scrollWidth 1440) |
| Comparação com a página sem animação | 1 diferença (retrato, equivalente visual) |
| Chromium 390×844 (mobile) | 0 erros; 6 agentes; 89/89; scrollWidth 390 |
| WebKit 390×844 (motor do Safari) | 0 erros; 89/89; scrollWidth 390 |
| `prefers-reduced-motion: reduce` | sem `.mm-build`, sem overlay |
| JavaScript desligado | conteúdo visível |
| Troca de idioma no meio da construção | etiquetas e HUD traduzidos; nada preso |
| Rever / Pular / recarregar após pular | refaz o hero; pular conclui 89/89 sem gravar nada no navegador; ao recarregar a construção volta |
| Link direto `#contact` | contato construído, sem resíduo |
| Tab durante a construção | elementos focados nunca recortados |
| Etiqueta "Você" | aparece com mouse durante a construção, some 1,5 s após parar; nunca em toque |
| "Página pronta" | exibida ao concluir 89/89, depois HUD volta ao estado ocioso |
| "Pular" via teclado | foco vai para "Rever" no HUD |
| Profundidade 3D (Chromium e WebKit) | `animation-timeline: view()` suportado; recuo, canvas e chegada do contato renderizados sem erro |
| Agentes acompanhando o 3D | rolagem contínua pela página: distância entre cursor de digitação/caixa e o texto sendo digitado = 0 px (99 amostras Chromium, 294 WebKit) |
| User agent do Googlebot | sem `.mm-build`, sem overlay, nenhum recorte |
| Desempenho, CPU 4× mais lenta | p99 16,8 ms por frame, 0 frames > 50 ms |

## Limites e riscos

- Não testado em aparelhos físicos nem com leitor de tela real.
- Navegadores sem suporte a `animation-timeline` ficam sem a profundidade 3D, mas o modo construção funciona normalmente. Firefox não foi testado.
- LCP: o título e o retrato aparecem por animação (cerca de 2 s), o que pode piorar a métrica de LCP medida por ferramentas. Não medido com Lighthouse.
- Os nomes dos agentes são um recurso visual; a página não afirma que foi construída por agentes.
