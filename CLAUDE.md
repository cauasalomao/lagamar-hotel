# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

**Template-modelo** para sites de pousada, derivado da base Komplexa Hotéis. Site estático preenchido com uma identidade fictícia (**Pousada Vale das Araucárias**, Campos do Pinhão/RS) que funciona como ponto de partida ao duplicar o projeto para um novo cliente. HTML5, CSS3 e JavaScript vanilla — sem build, sem framework, sem `package.json`, sem testes. Português do Brasil em todo o conteúdo.

Quando o usuário pedir "adaptar este site para o cliente X", a operação é primariamente busca/substituição — a lista completa de termos a trocar está em `README.md`. Este CLAUDE.md foca na arquitetura e nas pegadinhas que não dá pra descobrir só lendo o código.

## Desenvolvimento

Sem build e sem instalação:

```bash
python -m http.server 8000
# ou
npx serve .
```

Sem testes e sem linting.

## Estrutura de páginas

Cada página é um diretório com `index.html` para URLs limpas:

```
/                            Home (hero + strip + prévias de sobre/experiências/quartos/blog + CTA)
/sobre/                      Sobre, história
/experiencia/                Atividades (Cavalgada, Pescaria, Quadriciclo, Pet, etc.)
/acomodacoes/                4 chalés em grid (sem filtros)
/galeria/                    Galeria completa com lightbox (sem filtros — array único)
/localizacao/                Mapa + atrações próximas
/contato/                    Formulário + mapa
/blog/                       Índice do blog
/blog/_template/             Template para novos posts (marcadores %%PLACEHOLDER%%)
/blog/{slug}/                Posts individuais
```

Raiz também guarda: `hotel-config.json`, `blog-plan.json`, `sitemap.xml`, `robots.txt`, dois briefings `.md` de referência, `README.md` com o passo a passo de replicação, `favicon.svg`.

## Arquitetura essencial

### CSS único — `assets/css/style.css`

Todo o estilo em um só arquivo, guiado por custom properties (`--accent: #5b7a3d` verde floresta, `--cta: #f6b230` dourado, `--font-display: 'Pinyon Script'`, `--font-body: 'Raleway'`). Responsivo em 768/640/480px. Espaçamentos via `clamp()`. Classes curtas quase-BEM: `.rc` room card, `.gi` gallery item, `.exp-card`, `.rp-c`, `.aud-card`, `.fg`, `.btn-gold`/`.btn-green`/`.btn-outline`/`.btn-outline-w`.

### JS único — `assets/js/main.js`

Toda a interatividade vive aqui. Primitivas principais:

- `sendToWebhook(payload)` — POST JSON para `WEBHOOK_URL` com `{hotel, origem_pagina, url, timestamp, ...payload}`. Usado por todos os forms.
- `pushLead(tipo)` — empurra um evento `gerar_lead` no dataLayer do GTM, com `lead_tipo`.
- `submitContact` — trata o form de `/contato/`.
- Menu mobile (`openMob`/`closeMob`), header sticky (hero-mode ↔ solid no scroll), lightbox (`openLB`/`closeLB`/`navLB`, lê de `LB_SRCS`), banner de cookies, lazy-load observer, swap do título da aba quando a aba fica oculta.

### Constantes no topo de `main.js` (editar aqui, não em valores espalhados)

```js
const WEBHOOK_URL   // URL do webhook n8n/Zapier — todos os forms postam aqui
const HOTEL_NAME    // usado em todos os payloads de webhook
const WA_NUMBER     // formato '55 + DDD + número' sem pontuação
const WA_MESSAGE    // texto pré-preenchido em wa.me?text=
const BOOKING_URL   // domínio do site
const MOTOR_BASE    // base do motor de reservas
```

Formato da URL do motor: `{MOTOR_BASE}/search/{ci}/{co}/{adults}-{age1}-{age2}` (ex.: 2 adultos + crianças de 5 e 8 anos → `.../search/2026-05-10/2026-05-12/2-5-8`). Atualmente aponta para o domínio-modelo — trocar `MOTOR_BASE` pela URL do motor real (Foco Multimídia ou equivalente) ao ativar reservas para um cliente.

## Dois modais globais injetados via JS

Ambos são inseridos no `<body>` em tempo de execução por IIFEs dentro de `main.js`. **Não adicionar HTML por página para eles.** O HTML dos modais está dentro das IIFEs; o CSS está em `style.css`.

### Modal de captura WhatsApp (classes `.wl-*`)

Intercepta **todo** clique em `a[href*="wa.me/"]` do site (botão flutuante, CTAs do hero, redes sociais no footer etc.). Mostra um card de 340px ancorado bottom-right (desktop) / bottom-center (mobile). Campos obrigatórios: nome/email/telefone. No submit: `pushLead('whatsapp_modal')` → webhook → `form.reset()` → fecha → `window.open('wa.me/{WA_NUMBER}?text=...')`. O botão secundário "📅 Reservar Agora Online" fecha este modal e chama `openBooking()` — não repurpose esse botão para outro destino. Fecha com × / backdrop / Esc.

### Modal de reservas (classes `.bk-*`) — motor Foco Multimídia

Disparado somente por `onclick="openBooking();return false"` explícito nos CTAs "Reservar". **Não intercepta links globalmente** — o trigger é opt-in por botão. Todos os "Reservar"/"Reservar Agora"/"Reservar Estadia"/"Fazer Reserva" seguem esse padrão, incluindo a versão do mobnav que encadeia `closeMob();openBooking();return false`. Na home, o CTA de WhatsApp do hero foi substituído por "Reservar Agora" apontando para este modal.

Form: check-in / check-out / adultos (1–5) / crianças (0–3). Mudar o select de crianças renderiza N selects de idade (0–12). Submit monta a URL e faz `window.open(url, '_blank', 'noopener')`, depois fecha. O footer do modal tem um fallback por WhatsApp. Fecha com × / backdrop / Esc.

Ao adicionar um novo CTA "Reservar" em qualquer lugar, use:

```html
<a href="#" onclick="openBooking();return false" class="btn-gold">Reservar Agora</a>
```

## Renderização da galeria

`/galeria/index.html` tem um `<div class="gal-g" id="galGrid"></div>` vazio e uma única array inline `GALLERY` (path + alt) no final da página. Um único pass do script monta o grid e popula `LB_SRCS`. Para adicionar/remover fotos, edite só a array — os índices (`openLB(i)`) são calculados.

Neste template, a array contém 12 entradas, todas apontando para `placeholder.svg`. Ao adaptar para um cliente, substitua os paths por fotos reais (e acrescente entradas conforme o cliente tiver material).

## Padrão de dobras alternadas (página Experiência)

O `<style>` inline em `experiencia/index.html` define modificadores reutilizáveis:

- `.sec-green` / `.sec-green-dark` — seção verde sólida com sobreposições de texto branco para `.feat-block`, `.txt-block`, `.txt-item`. A variante `-dark` usa `--accent-hover` (#1a4922).
- `.sec-photo` — seção com imagem de fundo fixa. **Não use `background-attachment: fixed`** — ele está quebrado globalmente por `html { zoom: 0.8 }`. A solução: a seção tem `clip-path: inset(0)` + `isolation: isolate`; `::before` é `position: fixed; inset: 0` com `background-image: var(--bg-photo)`; `::after` é a sobreposição escura, também fixed. O estilo inline define `--bg-photo: url(...)`. Isso dá um parallax real clipado aos limites da seção.
- `.aud-grid` / `.aud-card` — grid de 3 colunas com cards de imagem, overlay em gradiente e label em fonte display no terço inferior.
- `.quad-split` — imagem à esquerda, texto+cards à direita. Combinado com `.quad-cols` (grid 2×2 de itens).

## Placeholders de imagem e logo

Este template **não tem fotos reais**. Todas as tags `<img>` e `background-image` apontam para um de três arquivos:

- `assets/img/placeholder.svg` — SVG genérico (retângulo + ícone de montanha + texto "FOTO") usado em 100% dos conteúdos.
- `assets/img/logo-placeholder.svg` — usado onde o logo do cliente apareceria (header, footer, logo no modal de reservas injetado por JS).
- `favicon.svg` — único favicon referenciado (um `<link rel="icon" type="image/svg+xml" href="favicon.svg">` por página, sem PNG/ICO fallback).

**Ao duplicar para um cliente**, substitua esses placeholders:
1. Coloque as fotos reais em `assets/img/` (use subpastas temáticas se quiser: `hero/`, `quartos/`, `atividades/`).
2. Rode um find/replace trocando `placeholder.svg` pelos paths reais em cada HTML (ou edite por seção).
3. Substitua `logo-placeholder.svg` pelo logo do cliente; se o novo logo for PNG, atualize a extensão em cada `<img src=...>` e na constante do modal de reservas injetado por `main.js`.
4. Substitua `favicon.svg` (pode adicionar PNG/ICO para suporte em navegadores antigos).

As tags `<img>` preservam `alt` descritivo — esses alts funcionam como documentação de "o que deveria entrar aqui" quando o template for adaptado.

## Google Maps embed

Os iframes em `/contato/` e `/localizacao/` consultam **pelo nome do negócio**, não pelo endereço: `maps.google.com/maps?q=Pousada+Vale+das+Arauc%C3%A1rias,+Campos+do+Pinh%C3%A3o+-+RS&output=embed`. Consultar por endereço faz o Google interpretar segmentos e renderizar uma rota de direção em vez de um pin. Para a nova cliente, troque o parâmetro `q=` preservando o padrão (nome + cidade + UF, sem rua).

## SEO e structured data

Cada página inclui JSON-LD Schema.org (LodgingBusiness na home, WebPage + BreadcrumbList no resto, BlogPosting nos posts), meta tags Open Graph, Twitter cards, URL canônica. `sitemap.xml` e `robots.txt` na raiz — atualizar `sitemap.xml` sempre que um post ou página for adicionado.

## Arquivos de configuração

- **`hotel-config.json`** — fonte de verdade ficcional: contato (telefone/e-mail/WA), endereço + coordenadas, 4 acomodações, atividades, pacotes, política pet, atrações próximas, restaurantes locais, integrações (`webhook_url`, `booking_engine_url`), design tokens, configurações de blog. Mantenha em sincronia com as constantes do `main.js` quando valores mudarem. **Comece por este arquivo ao adaptar o site para um novo cliente.**
- **`blog-plan.json`** — estratégia editorial, regras de SEO, spec do template de post, lista `published` e fila `upcoming`. Pilares de conteúdo: Destino, Experiência, Família, Dicas práticas.

## Fluxo de criação de post no blog

1. Pegar próximo item em `blog-plan.json` → `upcoming`.
2. Copiar `blog/_template/index.html` → `blog/{slug}/index.html`.
3. Trocar cada marcador `%%PLACEHOLDER%%` (título, meta desc, slug, data, seções de conteúdo, palavra-chave).
4. Escrever 800–1200 palavras: intro com keyword, 3–5 `<h2>`, 2+ links internos, `.blog-cta-box` no fim.
5. Adicionar card em `blog/index.html` dentro de `#blogGrid`.
6. Adicionar `<url>` em `sitemap.xml`.
7. Mover item de `upcoming` para `published` em `blog-plan.json`.
8. Commitar e fazer push.

### Checklist de SEO por post

`<title>` único com keyword (formato `{Título} | Blog Pousada Vale das Araucárias`), meta description ≤155 caracteres, URL canônica, Open Graph, `article:published_time`, JSON-LD `BlogPosting` + `BreadcrumbList`, `<h1>` único, `<h2>` por seção, ≥2 links internos, `.blog-cta-box` no fim.

## Contexto do hotel (decisões de conteúdo vêm daqui)

- **Localização:** Campos do Pinhão, Serra Geral, RS — rodovia RS 453.
- **História:** propriedade familiar desde 2005, aberta como pousada em 2019.
- **4 unidades:** Chalé Mirante (casais, luxo), Chalé Araucária (famílias, vista lago), Chalé Rancho (famílias, animais), Casarão Pinhão (grupos até 12).
- **Diferencial:** cavalgadas e pôneis inclusos na diária.
- **Público:** famílias 35–45 com crianças, incluindo famílias com crianças autistas buscando contato com animais.
- **Origem dos hóspedes:** Rio Grande do Sul (Porto Alegre, Caxias, Gramado) + Santa Catarina + Paraná.
- **Self-catering:** sem refeições inclusas (cozinha completa em cada unidade); café da manhã planejado.
- **Expansão:** piscina aquecida, infantil, ofurô em obras.
- **Tom:** acolhedor, familiar, autêntico — como receber amigos em casa. Nunca formal.
- **Idioma:** português brasileiro em todo o site.

Ao adaptar para um cliente real, **este bloco inteiro é a primeira coisa a reescrever neste CLAUDE.md** — as decisões de conteúdo (tom, público, diferenciais, atrações próximas) são o que a LLM usa para manter coerência ao escrever novas seções ou posts.

## Convenções

- Dispatcher de webhook trata o roteamento de leads; todo form passa por `sendToWebhook` + `pushLead`.
- Modais usam o toggle da classe `.open`. `document.body.style.overflow = 'hidden'` enquanto aberto, restaurado no fechamento.
- Forms `preventDefault` → webhook → evento GTM → ação de UI (redirect / WhatsApp / estado de sucesso).
- `<style>` inline em subpáginas (sobre, experiencia) guardam regras específicas da página; o global fica em `assets/css/style.css`.
- O path do logo no markup injetado por JS usa `/assets/img/logo-placeholder.svg` absoluto para resolver corretamente a partir de qualquer profundidade.
- Não edite a CSS legada `.wa-modal` — é herança do template base sem uso; o modal de WhatsApp vivo usa classes `.wl-*`.

## Preferência do usuário

O usuário mantém a branch `main` sincronizada com o repositório remoto e **faz commit + push após cada alteração de código, sem precisar pedir**. Ao adaptar este template para um cliente real, o fluxo segue o mesmo padrão.
