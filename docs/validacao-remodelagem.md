# Validação da remodelagem — Miguel Mojena

13 de outubro de 2026. Resultado local no worktree `/Users/mac/.codex/worktrees/5787/MiguelMojena LP`. O checkout iniciou limpo em `a5f8360`; não foram encontrados arquivos de instrução adicionais no projeto. Nenhum push, commit, deploy, contato externo ou geração paga foi realizado.

## Entrega

- `index.html`: página em português, com a abertura aprovada, identidade escura, retratos existentes, projetos, ofertas, apresentação, processo e contato.
- Símbolo SVG preservado: comparação dos dois desenhos de path contra `HEAD` aprovada. Favicon alinhado ao mesmo desenho.
- Links originais de Locus, Antônia, Instagram, LinkedIn, GitHub e WhatsApp preservados.
- Ana Stradiotto adicionada com descrição factual, alt em português, link e preview local em `assets/projects/ana-stradiotto-preview.webp` (1200 × 675, 49.406 bytes). Fonte: captura histórica `research/screenshots/desktop-hero.jpg` do projeto Ana, convertida para WebP. O projeto `/Users/mac/Documents/Dev/As` não foi alterado.
- Sistemas/stack/laboratório e carregador cinematográfico substituídos pelo conteúdo principal estático. Retiradas dependências de Three.js e Lenis. Permanecem as mesmas famílias de fontes remotas, com fallback; nenhuma dependência nova instalada.
- Plano estratégico, copy, direção visual, pesos editoriais e preparação de publicação em `planejamento-marca-e-portfolio.md`.

## Verificações técnicas executadas

- Sintaxe do JavaScript inline validada com `node:vm`, sem executar navegação ou mensagens.
- Integridade de HTML verificada com `HTMLParser`: 17 IDs únicos, 12 links internos com destino existente, 7 referências de imagens/source presentes no disco e alt em todas as imagens. Isso é uma verificação focada, não certificação completa de conformidade HTML.
- Links externos em nova aba com `noopener`; implementação final também usa `noreferrer`.
- Quatro links de contato verificados com parser de URL: mesmo destino original, somente parâmetro `text`, com contextos de site institucional, landing page, produto digital e projeto. Nenhum link de WhatsApp foi acionado e nenhuma mensagem foi enviada.
- HTTP 200 confirmado para `https://locusmt.tech/`, `https://vortexcorp1.github.io/AntoniaMojena/` e `https://ana-stradiotto.vercel.app/`. Ana também foi aberta em navegador sem login e exibiu serviços, projetos e contato. A verificação dos outros dois destinos foi HTTP; não foi feita auditoria de seus aplicativos.
- `git diff --check`: aprovado. Revisão de alterações, conteúdo removido, escopo, assets e destinos. Os arquivos de imagem anteriores permanecem sem alteração.
- Não há package.json, pipeline de build ou suíte de testes no portfólio; foram usadas verificações focadas e navegador real.

## Navegador real — Codex In-app Browser

| Largura × altura | Evidência |
| --- | --- |
| 1440 × 900 | Abertura, projetos e contato inspecionados; imagens carregadas; largura da página 1440 |
| 1280 × 720 | Abertura final inspecionada; os dois CTAs terminam aproximadamente em y=710, dentro da viewport; largura da página 1280 |
| 768 × 1024 | Abertura inspecionada; navegação desktop e dois CTAs disponíveis; largura da página 768 |
| 390 × 844 | Abertura, projetos, oferta, apresentação e contato inspecionados; menu e teclado testados; largura da página 390 |
| 320 × 740 | Abertura inspecionada; CTAs empilhados; largura da página 320, sem elementos de conteúdo excedendo a largura no levantamento de geometria |

As cinco imagens principais carregaram no desktop após percorrer a página. No celular, os previews próprios de Locus e Antônia foram selecionados e carregaram; Ana carregou o preview desktop dentro de seu cartão de proporção horizontal. Nenhum cartão caiu no estado de placeholder. As larguras medidas indicam ausência de rolagem horizontal nesses cenários, sem equivaler a inspeção visual de cada elemento em todas as dimensões.

### Teclado e navegação

- Menu mobile aberto por clique e por Enter. Botão refletiu `aria-expanded=true` e rótulo “Fechar”.
- Tab passou do botão para Projetos, com contorno de foco de 2 px na cor de destaque.
- Escape fechou o menu, restaurou `aria-expanded=false` e deixou foco no botão Menu.
- Enter em Projetos fechou a navegação expansível, atualizou `#work` e moveu foco para a seção.
- Link “Pular para o conteúdo” levou o foco a `#conteudo`.
- Contato e demais âncoras de navegação observados no navegador. IDs `profile`, `work` e `contact` preservados; compatibilidade de `systems` → `construir` e `lab` → `sobre` implementada, revisada estaticamente.
- Nenhum aviso ou erro nos logs capturados durante a navegação normal. O servidor de teste com scripts bloqueados abaixo produz, como esperado, a mensagem de bloqueio por CSP.

### Sem JavaScript

O mesmo HTML foi servido temporariamente na porta 8766 com `Content-Security-Policy: script-src 'none'`, bloqueando o script inline. No navegador a 390 px, a classe de melhoria `.js` não foi aplicada, o botão permaneceu escondido, os quatro links de navegação ficaram visíveis e os três projetos continuaram no documento. O link Projetos navegou para `#work`. O servidor de QA foi encerrado depois do teste; a política temporária não foi adicionada ao site.

### Movimento

Revisão estática: CSS remove animações, transições e rolagem suave em `prefers-reduced-motion: reduce`; o efeito de ponteiro consulta essa preferência antes de mover o retrato, e a mudança da preferência limpa os deslocamentos. O conteúdo não é ocultado por JavaScript ou condicionado a uma animação. Não há loop contínuo de renderização ou rolagem controlada por biblioteca.

O navegador estava com a preferência de redução de movimento desativada e não expõe emulação dessa preferência. Não foi realizado teste visual com a preferência ativada nem mudança nas configurações do sistema. A entrada breve do retrato foi observada com a preferência normal; capturas finais devem ser avaliadas após seu término.

## Capturas

Todas em `docs/screenshots/`:

- `desktop-hero.png`: abertura final a 1440 px.
- `desktop-projetos.png`: destaque de Locus.
- `desktop-ana-antonia.png`: cartões de Ana e Antônia.
- `desktop-contato.png`: contato e rodapé.
- `desktop-completo.png`: documento completo a 1440 px para revisão visual.
- `mobile-hero.png`: abertura a 390 px.
- `mobile-ana.png`: trecho dos cartões de Antônia e Ana a 390 px.
- `mobile-oferta.png`: escopos e CTAs da oferta a 390 px.
- `mobile-contato.png`: contato e rodapé a 390 px.

## Limites e publicação

O resultado validado é local. A versão publicada de Miguel não foi alterada; sua URL não foi fornecida nesta tarefa. Preview desta sessão: `http://127.0.0.1:8765/`, servido somente no computador local. Se o processo encerrar, executar `python3 -m http.server 8765 --bind 127.0.0.1` na raiz deste worktree.

Não houve teste em dispositivos físicos, leitor de tela, Safari/Chrome adicionais, emulação de redução de movimento, auditoria WCAG completa ou medição de Core Web Vitals/conversão. Não houve aprovação editorial de Ana inferida do HTTP 200. Domínio definitivo de Ana, identificação do projeto referido como “o Pai” permanecem pendentes, sem bloquear a remodelagem.

## Inclusão da Silomé (13/10/2026)

- Endereço https://silome-teste.vercel.app respondeu HTTP 200, sem login; conteúdo renderizado conferido no navegador (sete capítulos, acesso ao catálogo por convite).
- Previews capturados com Chromium headless do site publicado (1600×1000 e 800×1000), convertidos para WebP.
- Cartão verificado em 1440 px (destaque espelhado, imagem à direita) e 500 px (imagem vertical acima do texto), sem placeholder.
- O endereço contém "teste"; trocar quando houver domínio definitivo.
