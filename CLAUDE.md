# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Site do **Hotel Lagamar** (Varginha/MG), construído a partir de um template-modelo de site de pousada (base Komplexa Hotéis). Site estático em HTML5, CSS3 e JavaScript vanilla — sem build, sem framework, sem `package.json`, sem testes. Português do Brasil em todo o conteúdo.

**Estado atual:** `hotel-config.json` populado com os dados reais do Lagamar; **paleta e tipografia oficiais já aplicadas** em `assets/css/style.css` (quiet luxury: areia/pérola/taupe/sálvia/azul + Cormorant Garamond/Raleway); **todos os formulários levam ao WhatsApp** com mensagem pronta (sem motor de reservas/webhook por enquanto). O que **ainda falta**: reescrever o **conteúdo textual e as imagens** das páginas, que continuam herdados do template-modelo (Pousada Vale das Araucárias) — esse é o próximo passo, feito junto com o cliente. O briefing real está em `Briefing - Hotel Lagamar.md`; o `README.md` mantém o passo a passo genérico de replicação do template.

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

Raiz também guarda: `hotel-config.json`, `blog-plan.json`, `sitemap.xml`, `robots.txt`, `Briefing - Hotel Lagamar.md` (briefing estratégico do cliente), `README.md` com o passo a passo de replicação, `favicon.svg`.

## Arquitetura essencial

### CSS único — `assets/css/style.css`

Todo o estilo em um só arquivo, guiado por custom properties. Paleta oficial do Lagamar ("quiet luxury"): `--accent: #bea178` (areia dourada, cor dominante), `--cta: #365c73` (azul profundo, botões/conversão) com `--cta-hover: #284656`, `--bg: #f7f4ef` (branco pérola), `--heading: #7a6652` (taupe, títulos), `--text: #5d5145` (corpo), `--sage: #8c9681` (verde sálvia, elementos naturais). Tipografia `--font-display: 'Cormorant Garamond'` (serif refinada) e `--font-body: 'Raleway'`. Responsivo em 768/640/480px. Espaçamentos via `clamp()`. Classes curtas quase-BEM: `.rc` room card, `.gi` gallery item, `.exp-card`, `.rp-c`, `.aud-card`, `.fg`, `.btn-gold`/`.btn-green`/`.btn-outline`/`.btn-outline-w`.

### JS único — `assets/js/main.js`

Toda a interatividade vive aqui. Primitivas principais:

- **Forms levam ao WhatsApp.** Como ainda não há motor de reservas nem webhook, **todos** os formulários (contato, captura WhatsApp, modal de reserva) montam uma mensagem pronta com os dados preenchidos e fazem `window.open('wa.me/{WA_NUMBER}?text=...')`. Quando houver motor/webhook, reativar nas funções correspondentes.
- `sendToWebhook(payload)` — POST JSON para `WEBHOOK_URL`. Ainda chamado por todos os forms, mas o `WEBHOOK_URL` é placeholder (`REPLACE-ME`): a chamada falha em silêncio (try/catch) e o WhatsApp é o caminho real. Preencher `WEBHOOK_URL` reativa o envio.
- `pushLead(tipo)` — empurra um evento `gerar_lead` no dataLayer do GTM, com `lead_tipo`.
- `submitContact` — trata o form de `/contato/`: monta mensagem (nome/tel/email/datas/mensagem) e abre o WhatsApp.
- Menu mobile (`openMob`/`closeMob`), header sticky (hero-mode ↔ solid no scroll), lightbox (`openLB`/`closeLB`/`navLB`, lê de `LB_SRCS`), banner de cookies, lazy-load observer, swap do título da aba quando a aba fica oculta.

### Constantes no topo de `main.js` (editar aqui, não em valores espalhados)

```js
const WEBHOOK_URL   // placeholder (REPLACE-ME) — sem webhook ainda; forms vão pro WhatsApp
const HOTEL_NAME    // 'Hotel Lagamar' — usado nas mensagens e payloads
const WA_NUMBER     // '5535997426463' (55 + DDD + número, sem pontuação)
const WA_MESSAGE    // texto genérico pré-preenchido em wa.me?text= (botões diretos)
const BOOKING_URL   // REPLACE-ME — domínio do site quando definido
const MOTOR_BASE    // REPLACE-ME — sem motor; modal de reserva vai pro WhatsApp
```

Não há motor de reservas: o modal `.bk-*` coleta datas/hóspedes e envia tudo pronto pro WhatsApp (ver `submitBooking`). Quando o Lagamar tiver motor, reintroduzir a montagem de URL `{MOTOR_BASE}/search/{ci}/{co}/{adults}-{age1}-{age2}` em `submitBooking`.

## Dois modais globais injetados via JS

Ambos são inseridos no `<body>` em tempo de execução por IIFEs dentro de `main.js`. **Não adicionar HTML por página para eles.** O HTML dos modais está dentro das IIFEs; o CSS está em `style.css`.

### Modal de captura WhatsApp (classes `.wl-*`)

Intercepta **todo** clique em `a[href*="wa.me/"]` do site (botão flutuante, CTAs do hero, redes sociais no footer etc.). Mostra um card de 340px ancorado bottom-right (desktop) / bottom-center (mobile). Campos obrigatórios: nome/email/telefone. No submit: `pushLead('whatsapp_modal')` → `sendToWebhook` (silencioso) → monta mensagem com os dados → `form.reset()` → fecha → `window.open('wa.me/{WA_NUMBER}?text=...')` com a mensagem preenchida. O botão secundário "📅 Reservar Agora Online" fecha este modal e chama `openBooking()` — não repurpose esse botão para outro destino. Fecha com × / backdrop / Esc.

### Modal de reservas (classes `.bk-*`) — leva ao WhatsApp

Disparado somente por `onclick="openBooking();return false"` explícito nos CTAs "Reservar". **Não intercepta links globalmente** — o trigger é opt-in por botão. Todos os "Reservar"/"Reservar Agora"/"Reservar Estadia"/"Fazer Reserva" seguem esse padrão, incluindo a versão do mobnav que encadeia `closeMob();openBooking();return false`. Na home, o CTA de WhatsApp do hero foi substituído por "Reservar Agora" apontando para este modal.

Form: check-in / check-out / adultos (1–5) / crianças (0–3). Mudar o select de crianças renderiza N selects de idade (0–12). Submit (`submitBooking`) monta uma mensagem de reserva com datas/hóspedes e faz `window.open('wa.me/{WA_NUMBER}?text=...')`, depois fecha. O footer do modal tem um link direto de WhatsApp. Fecha com × / backdrop / Esc.

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

Os iframes em `/contato/` e `/localizacao/` consultam **pelo nome do negócio**, não pelo endereço. Padrão a usar para o Lagamar: `maps.google.com/maps?q=Hotel+Lagamar,+Varginha+-+MG&output=embed`. Consultar por endereço faz o Google interpretar segmentos e renderizar uma rota de direção em vez de um pin. Preserve sempre o padrão (nome + cidade + UF, sem rua). **Confirmar** que esse `q=` cai no pin correto quando o endereço real do hotel estiver disponível.

## SEO e structured data

Cada página inclui JSON-LD Schema.org (LodgingBusiness na home, WebPage + BreadcrumbList no resto, BlogPosting nos posts), meta tags Open Graph, Twitter cards, URL canônica. `sitemap.xml` e `robots.txt` na raiz — atualizar `sitemap.xml` sempre que um post ou página for adicionado.

## Arquivos de configuração

- **`hotel-config.json`** — fonte de verdade do Hotel Lagamar: identidade/tom, `brand_restrictions` (palavras e posicionamentos proibidos pelo briefing), contato, endereço + coordenadas, acomodações, experiências, diferenciais, `events` (vertical de eventos), credibilidade, atrações próximas, integrações (`webhook_url`, `booking_engine_url`), design tokens (pendentes) e configurações de blog. Campos sem dado real estão como `REPLACE-ME`/`TODO`. Mantenha em sincronia com as constantes do `main.js` quando valores mudarem. **Comece por este arquivo ao escrever/ajustar conteúdo.**
- **`blog-plan.json`** — estratégia editorial, regras de SEO, spec do template de post, lista `published` e fila `upcoming`. Pilares de conteúdo: Destino, Experiência, Família, Dicas práticas.

## Fluxo de criação de post no blog

1. Pegar próximo item em `blog-plan.json` → `upcoming`.
2. Copiar `blog/_template/index.html` → `blog/{slug}/index.html`.
3. Trocar cada marcador `%%PLACEHOLDER%%` (título, meta desc, slug, data, seções de conteúdo, palavra-chave).
4. Escrever 800–1200 palavras: intro com keyword, 3–5 `<h2>`, 2+ links internos, `.blog-cta-box` no fim.
5. Adicionar card em `blog/index.html` dentro de `#blogGrid`.
6. Adicionar `<url>` em `sitemap.xml`.
7. Mover item de `upcoming` para `published` em `blog-plan.json`.
8. Commitar localmente (push só quando o usuário fornecer link do repo + ordem explícita — ver "Preferência do usuário").

### Checklist de SEO por post

`<title>` único com keyword (formato `{Título} | Blog Hotel Lagamar`), meta description ≤155 caracteres, URL canônica, Open Graph, `article:published_time`, JSON-LD `BlogPosting` + `BreadcrumbList`, `<h1>` único, `<h2>` por seção, ≥2 links internos, `.blog-cta-box` no fim.

## Contexto do hotel (decisões de conteúdo vêm daqui)

Fonte: briefing estratégico do Hotel Lagamar (`Briefing - Hotel Lagamar.md`) e `hotel-config.json`. Use este bloco para manter coerência ao escrever qualquer seção ou post.

- **Negócio:** Hotel Lagamar, 24 suítes (expansão planejada para 50), em Varginha/MG. Endereço: Condomínio Lagamar, Varginha - MG.
- **Acomodação:** as 24 suítes são **todas iguais** — categoria única "Apartamento 2 Quartos – Vista Lago" (70m²; suíte king + quarto casal/solteiro; 2 banheiros; varanda com vista lago/jardim/rio). A página /acomodacoes/ comunica padrão único, não um grid de tipos.
- **Contato:** WhatsApp/telefone (35) 99742-6463 (`5535997426463`), e-mail lagamaroficial@gmail.com, Instagram @lagamarhotel.
- **Localização:** região tranquila de Minas Gerais, à beira da represa. ~70km de São Thomé das Letras, ~200km de Capitólio.
- **História:** adquirido em 2009 pelo atual proprietário, encantado pela raridade da vista; desenvolvido desde então para experiências memoráveis na natureza.
- **Identidade física:** arquitetura em madeira de lei, integração com a natureza, vista privilegiada para a represa, pôr do sol como experiência marcante.
- **Restaurantes:** a curadoria é feita **direto na recepção** com os hóspedes — **não listar** restaurantes nomeados no site.
- **Experiências:** piscina externa, piscina aquecida, sauna, arborismo, caminhadas, corridas ao ar livre, acesso à represa, café da manhã, curadoria de restaurantes da região.
- **Eventos (vertical relevante):** casamentos, bodas, chá revelação, confraternizações e eventos corporativos, celebrações familiares.
- **Público:** casais (inclusive casais jovens), famílias e pessoas idosas que valorizam a natureza e buscam desacelerar.
- **Origem dos hóspedes:** Minas Gerais, São Paulo, Rio de Janeiro e cidades da região.
- **Credibilidade:** placa de homenagem do Governador, depoimentos reais, histórico consolidado.
- **Conversão:** WhatsApp é o canal principal; também e-mail e atendimento humanizado.
- **Tom:** acolhedor, natural, humanizado. Pilares: natureza, acolhimento, família, conexão, contemplação, bem-estar, celebrações.
- **Idioma:** português brasileiro em todo o site.

⚠️ **Restrições de marca — "quiet luxury" (obrigatórias):** o **visual** pode ser refinado/contemporâneo (referências Aman, Six Senses, boutique mediterrâneo, Trancoso — daí a paleta areia/pérola/taupe e a serif Cormorant); a **comunicação verbal** NUNCA usa luxo/ostentação. Evitar as palavras *luxo, luxuoso, premium, sofisticação ostensiva, hotelaria de luxo, alto padrão sofisticado, status social*. Nada de comparações com resorts de alto luxo nem apelo de exclusividade financeira. Público **não desejado**: focados em ostentação, quem não gosta de animais, quem só valoriza alto padrão sofisticado. (Detalhes em `hotel-config.json → brand_restrictions`.)

**Lacunas que ainda faltam** (marcadas `TODO` em `hotel-config.json`): CEP e coordenadas exatas, domínio do site, motor de reservas e webhook (hoje tudo vai pro WhatsApp), CNPJ, horários de check-in/out e diária média. **Já resolvidos:** contato, paleta/tipografia, categoria única de suíte, curadoria de restaurantes (na recepção).

## Convenções

- Dispatcher de webhook trata o roteamento de leads; todo form passa por `sendToWebhook` + `pushLead`.
- Modais usam o toggle da classe `.open`. `document.body.style.overflow = 'hidden'` enquanto aberto, restaurado no fechamento.
- Forms `preventDefault` → webhook → evento GTM → ação de UI (redirect / WhatsApp / estado de sucesso).
- `<style>` inline em subpáginas (sobre, experiencia) guardam regras específicas da página; o global fica em `assets/css/style.css`.
- O path do logo no markup injetado por JS usa `/assets/img/logo-placeholder.svg` absoluto para resolver corretamente a partir de qualquer profundidade.
- Não edite a CSS legada `.wa-modal` — é herança do template base sem uso; o modal de WhatsApp vivo usa classes `.wl-*`.

## Preferência do usuário — política de Git

Commits locais automáticos na branch `main` são ok e esperados após cada alteração de código, sem precisar pedir.

**Push para o GitHub, porém, NÃO é automático.** Um push anterior deste template sobrescreveu o repositório de um cliente real em produção. Para evitar reincidência:

- **Nunca** rodar `git push`, `gh pr create`, `gh repo create`, ou qualquer comando que envie conteúdo deste diretório para o GitHub por iniciativa própria.
- Publicar só quando o usuário **explicitamente** fornecer, na mesma instrução, **(a)** a URL do repositório remoto correto **e (b)** a ordem clara de dar push/publicar. Ambos os itens precisam estar presentes — um sem o outro não basta.
- Antes de executar o push autorizado, rodar `git remote -v` e confirmar que o remote aponta para a URL fornecida (adicionar/ajustar `origin` se necessário).
- Isso também vale ao adaptar o template para um novo cliente: commits locais sim, push só com link + ordem explícitos.
