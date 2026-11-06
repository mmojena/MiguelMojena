# Identidade "Pedra-chave" no portfólio

5 de novembro de 2026. Branch `feat/identidade-pedra-chave`, criada a partir de `origin/main` (`4d872d0`). Worktree: `~/worktrees/miguelmojena-lp-identidade`. Ainda não publicada.

## Pedido

Levar ao portfólio a identidade aprovada no perfil do GitHub (direção executivo noturno, símbolo Pedra-chave), **sem remover nenhuma funcionalidade nem conteúdo**, apenas somando a identidade visual.

## O que entrou

| Item | Arquivo | Natureza |
| --- | --- | --- |
| Camada de identidade: paleta mais profunda, Archivo nos títulos, JetBrains Mono nos rótulos, botões, molduras de mira nas capturas e no retrato, grão, índices de seção (01–05, nos três idiomas) | `assets/identity.css` (novo) | Só aparência |
| Símbolo Pedra-chave no cabeçalho, no rodapé e no favicon | `index.html` (`#mm-symbol`, `<link rel="icon">`) | Troca do desenho |
| Mostrador "Calibre MM-01" atrás do retrato: anéis, radar e marcadores que acendem, tudo girando no compositor | `index.html` (`.id-dial`, decorativo, `aria-hidden`) | Acréscimo |
| Contato como "sinal": holofote projeta o símbolo nas nuvens; botão no verde | `index.html` (`.id-signal`) + `assets/identity/signal.webp` | Acréscimo + aparência |
| Imagem de compartilhamento (WhatsApp, LinkedIn etc.) | `assets/identity/og.jpg` + metatags `og:image` | Acréscimo |
| Fontes Archivo (largura variável) e JetBrains Mono | `<link>` do Google Fonts | Acréscimo (as fontes anteriores continuam carregadas) |
| Modo construção: os agentes também constroem o mostrador e o sinal | `assets/build-mode.js` (SPEC +2 entradas) | Acréscimo |
| Cursor do "Miguel" no contato: escuro só se o fundo for de fato verde | `assets/build-mode.js` (1 condição) | Ajuste necessário: o contato deixou de ser verde |

## O que foi preservado (verificado)

Comparação automática (Chromium/Playwright) entre `origin/main` e a branch:

- **Iguais:** 28 links com os mesmos destinos (inclusive as 8 URLs de WhatsApp por idioma), 99 elementos traduzíveis, 4 botões e 16 títulos.
- **Acréscimos:** IDs e imagens só ganharam itens (`id-dial-path` e `signal.webp`); nada foi removido.
- **Idiomas:** PT/EN/ES funcionando (título, metas e link de contato trocam).
- **Menu no celular:** abre, fecha com Esc e devolve o foco.
- **Modo construção:** completa até "Página pronta", com 10 agentes (91 camadas; antes 89, pelas duas peças novas). "Rever" e "Pular" continuam.
- **Planta e lente de raio-x nas capturas:** intactas (`blueprint.js` não foi alterado).
- **Rolagem 3D, retrato que segue o ponteiro e âncoras antigas (`#systems`, `#lab`):** intactos.
- **Layout:** sem rolagem horizontal em 1440, 1024, 768, 390 e 320 px.
- **Erros:** nenhum erro de console ou de página, com e sem movimento reduzido.
- **Movimento reduzido:** a regra existente da página desliga todas as animações novas.

## Linhas substituídas no `index.html`

Somente `theme-color`, favicon, versão do `build-mode.js` (`v=4` → `v=5`, para não servir cache antigo), o `<link>` de fontes (ampliado) e o desenho dentro de `<symbol id="mm-symbol">`. O restante são acréscimos.

## Reverter

- Só a aparência: remover `<link rel="stylesheet" href="assets/identity.css?v=1">`.
- Tudo: descartar a branch ou dar `git revert` no commit.

## Pendências

1. **Captura do Locus no portfólio:** ainda mostra "Nenhum imóvel em destaque ainda". Trocar a imagem exige regenerar também a planta (`assets/projects/blueprint/locus-preview*.avif`), por isso ficou fora deste escopo.
2. **Conferir num aparelho real:** iPhone/Safari e Android, incluindo desempenho do mostrador.
3. **Publicar:** somente com autorização. PR para `main`, que o workflow do GitHub Pages publica.
