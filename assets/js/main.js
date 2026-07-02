/* ============================================================
   HOTEL LAGAMAR (Varginha/MG) — main.js v3
   Constantes abaixo: preencher REPLACE-ME com os dados reais do cliente
   ============================================================ */

const WEBHOOK_URL = 'https://webhook.example.com/webhook/REPLACE-ME'; // sem webhook ainda; chamadas falham em silêncio (try/catch)
const HOTEL_NAME  = 'Lagamar Resort e Hotel';
const WA_NUMBER   = '5535997426463';
const WA_MESSAGE  = 'Olá! Gostaria de mais informações sobre o Lagamar Resort e Hotel.';
const BOOKING_URL = 'REPLACE-ME'; // domínio do site quando definido
const MOTOR_BASE  = 'REPLACE-ME'; // sem motor de reservas: o modal de reserva leva ao WhatsApp (ver submitBooking)

// ── dataLayer GTM ──
window.dataLayer = window.dataLayer || [];
function pushLead(tipo) {
  window.dataLayer.push({
    event:      'gerar_lead',
    lead_tipo:  tipo,
    pagina:     document.title,
    url:        location.href
  });
}

// ── WEBHOOK ──
async function sendToWebhook(payload) {
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hotel: HOTEL_NAME,
        origem_pagina: document.title,
        url: location.href,
        timestamp: new Date().toISOString(),
        ...payload
      })
    });
  } catch(e) { console.warn('Webhook:', e); }
}

// ── HEADER SCROLL ──
const hdr = document.getElementById('hdr');
const hdrLogo = hdr ? hdr.querySelector('.logo-img') : null;
// branca sobre hero (transparente/escuro), dourada quando o header fica sólido (claro)
const logoWhite = hdrLogo ? hdrLogo.getAttribute('src').replace('logo-gold.png', 'logo.png') : '';
const logoGold = logoWhite.replace('logo.png', 'logo-gold.png');
function setHdrLogo() {
  if (!hdrLogo) return;
  hdrLogo.setAttribute('src', hdr.classList.contains('solid') ? logoGold : logoWhite);
}
setHdrLogo();
if (hdr && hdr.classList.contains('hero-mode')) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 80) { hdr.classList.add('solid'); hdr.classList.remove('hero-mode'); }
    else { hdr.classList.remove('solid'); hdr.classList.add('hero-mode'); }
    setHdrLogo();
  }, { passive: true });
}

// ── MOBILE MENU ──
const ham = document.getElementById('ham');
const mob = document.getElementById('mobnav');
function openMob()  { mob?.classList.add('open'); ham?.classList.add('open'); document.body.style.overflow='hidden'; ham?.setAttribute('aria-expanded','true'); }
function closeMob() { mob?.classList.remove('open'); ham?.classList.remove('open'); document.body.style.overflow=''; ham?.setAttribute('aria-expanded','false'); }
ham?.addEventListener('click', () => mob?.classList.contains('open') ? closeMob() : openMob());

// ── LAZY LOAD ──
const imgObs = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('loaded'); imgObs.unobserve(e.target); } });
}, { rootMargin: '200px' });
document.querySelectorAll('img').forEach(img => {
  if (img.complete && img.naturalWidth > 0) img.classList.add('loaded');
  else {
    img.addEventListener('load',  () => img.classList.add('loaded'), {once:true});
    img.addEventListener('error', () => img.classList.add('loaded'), {once:true});
    imgObs.observe(img);
  }
});


// ── COOKIE BANNER ──
const ckBanner = document.getElementById('cookieBanner');
if (ckBanner && !localStorage.getItem('ck_status')) ckBanner.classList.add('show');
function acceptCookies()  { localStorage.setItem('ck_status','accepted'); if(ckBanner) ckBanner.classList.remove('show'); }
function declineCookies() { localStorage.setItem('ck_status','declined'); if(ckBanner) ckBanner.classList.remove('show'); }

// ── FILTRO QUARTOS ──
function filterRooms(type, btn) {
  document.querySelectorAll('.fbtn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('#roomsGrid .rc').forEach(rc => {
    rc.style.display = (type==='all' || rc.dataset.type===type) ? '' : 'none';
  });
}

// ── FILTRO GALERIA ──
function filterGal(cat, btn) {
  document.querySelectorAll('.fbtn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.gi').forEach(item => {
    item.style.display = (cat === 'all' || item.dataset.cat === cat) ? '' : 'none';
  });
}

// ── LIGHTBOX ──
let lbCur = 0; const LB_SRCS = [];
function openLB(i) {
  lbCur=i; const lbImg=document.getElementById('lbImg'); const lbCnt=document.getElementById('lbCnt');
  if(!lbImg) return;
  lbImg.src=LB_SRCS[i]||''; if(lbCnt) lbCnt.textContent=(i+1)+' / '+LB_SRCS.length;
  document.getElementById('lb')?.classList.add('open'); document.body.style.overflow='hidden';
}
function closeLB() { document.getElementById('lb')?.classList.remove('open'); document.body.style.overflow=''; }
function navLB(d) {
  lbCur=(lbCur+d+LB_SRCS.length)%LB_SRCS.length;
  document.getElementById('lbImg').src=LB_SRCS[lbCur]||'';
  document.getElementById('lbCnt').textContent=(lbCur+1)+' / '+LB_SRCS.length;
}
document.getElementById('lb')?.addEventListener('click', e => { if(e.target===document.getElementById('lb')) closeLB(); });
document.addEventListener('keydown', e => {
  if(!document.getElementById('lb')?.classList.contains('open')) return;
  if(e.key==='Escape') closeLB(); if(e.key==='ArrowLeft') navLB(-1); if(e.key==='ArrowRight') navLB(1);
});

// ── FORMULÁRIO CONTATO → WhatsApp ──
// Sem webhook/motor por enquanto: monta a mensagem com os dados e abre o WhatsApp.
async function submitContact(e) {
  e.preventDefault();
  const form = e.target;
  const d = Object.fromEntries(new FormData(form));

  pushLead('formulario_contato');
  sendToWebhook({ tipo: 'contato', ...d }); // opcional/pendente — falha em silêncio

  let msg = `Olá! Vim pelo site do ${HOTEL_NAME} e gostaria de mais informações.\n\n`;
  if (d.nome)     msg += `*Nome:* ${d.nome}\n`;
  if (d.telefone) msg += `*Telefone:* ${d.telefone}\n`;
  if (d.email)    msg += `*E-mail:* ${d.email}\n`;
  if (d.checkin)  msg += `*Check-in:* ${d.checkin}\n`;
  if (d.checkout) msg += `*Check-out:* ${d.checkout}\n`;
  if (d.mensagem) msg += `*Mensagem:* ${d.mensagem}\n`;

  form.reset();
  document.getElementById('contactOk')?.classList.add('show');
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
}

// ── TÍTULO DA ABA ao sair da página ──
const tituloOriginal = document.title;
document.addEventListener('visibilitychange', () => {
  document.title = document.hidden
    ? '👋 Volte Aqui — Estamos te esperando!'
    : tituloOriginal;
});

// ── MODAL DE CAPTURA WHATSAPP ──
(function initWaLeadModal() {
  const WA_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';

  const bookingBlock = `
      <div class="wl-or"><span>ou</span></div>
      <button type="button" class="wl-book">📅 Reservar Agora Online</button>
    `;

  const html = `
    <div class="wl-ov" id="waLeadModal" role="dialog" aria-modal="true" aria-labelledby="waLeadTitle" aria-hidden="true">
      <div class="wl-box" role="document">
        <button class="wl-close" type="button" aria-label="Fechar">×</button>
        <div class="wl-hdr">
          <div class="wl-icon-circle">${WA_SVG}</div>
          <div class="wl-hdr-txt">
            <h4 id="waLeadTitle" class="wl-title">Fale pelo WhatsApp</h4>
            <p class="wl-sub">Preencha para agilizar seu atendimento</p>
          </div>
        </div>
        <form class="wl-form" id="waLeadForm" novalidate>
          <div class="wl-fg">
            <label for="wl-nome">Seu Nome *</label>
            <input id="wl-nome" name="nome" type="text" placeholder="Nome completo" required autocomplete="name">
          </div>
          <div class="wl-fg">
            <label for="wl-email">E-mail *</label>
            <input id="wl-email" name="email" type="email" placeholder="seu@email.com" required autocomplete="email">
          </div>
          <div class="wl-fg">
            <label for="wl-telefone">Telefone *</label>
            <input id="wl-telefone" name="telefone" type="tel" placeholder="(21) 99999-9999" required autocomplete="tel">
          </div>
          <button class="wl-submit" type="submit">Ir para o WhatsApp</button>
        </form>
        ${bookingBlock}
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);

  const modal  = document.getElementById('waLeadModal');
  const box    = modal.querySelector('.wl-box');
  const form   = document.getElementById('waLeadForm');
  const closeX = modal.querySelector('.wl-close');

  function open()  { modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; setTimeout(()=>form.querySelector('input')?.focus(), 50); }
  function close() { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }

  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  closeX.addEventListener('click', close);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });

  // intercepta todos os links pro WhatsApp
  document.querySelectorAll('a[href*="wa.me/"]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); open(); });
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
    const d = Object.fromEntries(new FormData(form));
    pushLead('whatsapp_modal');
    sendToWebhook({ tipo: 'whatsapp_modal', ...d }); // opcional/pendente
    let msg = `Olá! Vim pelo site do ${HOTEL_NAME}.\n\n`;
    if (d.nome)     msg += `*Nome:* ${d.nome}\n`;
    if (d.telefone) msg += `*Telefone:* ${d.telefone}\n`;
    if (d.email)    msg += `*E-mail:* ${d.email}\n`;
    form.reset();
    close();
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  });

  // O botão "Reservar Agora Online" abre o modal de reservas do motor
  const bookBtn = modal.querySelector('.wl-book');
  bookBtn?.addEventListener('click', e => {
    e.preventDefault();
    close();
    if (typeof openBooking === 'function') openBooking();
  });
})();

// ── MODAL DE RESERVA → WhatsApp ──
// Sem motor de reservas ainda: o modal coleta datas/hóspedes e envia tudo pronto pro WhatsApp.
// Calendário visual de intervalo: clique no check-in, depois no check-out; o caminho entre
// os dias "acende" (start → in-range → end). Navegação por mês, sem permitir datas passadas.
const BK_MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const BK_WEEK   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const bkState = { view: null, checkin: null, checkout: null, hover: null };

function bkStrip(d)    { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
function bkToday()     { return bkStrip(new Date()); }
function bkFirstOf(d)  { return new Date(d.getFullYear(), d.getMonth(), 1); }
function bkISO(d)      { return d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : ''; }
function bkParse(iso)  { if (!iso) return null; const [y,m,d] = iso.split('-').map(Number); return new Date(y, m-1, d); }
function bkSame(a,b)   { return a && b && a.getTime() === b.getTime(); }
function bkFmt(d)      { return d ? `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}` : ''; }
function bkNights()    { return bkState.checkin && bkState.checkout ? Math.round((bkState.checkout - bkState.checkin)/86400000) : 0; }

function openBooking() {
  const m = document.getElementById('bkModal');
  if (!m) return;
  if (!bkState.view) bkState.view = bkFirstOf(bkToday());
  bkRenderCal();
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeBooking() {
  document.getElementById('bkModal')?.classList.remove('open');
  document.body.style.overflow = '';
}

// Monta o cabeçalho + grade do mês em exibição (start/end/in-range aplicados por bkPaint)
function bkRenderCal() {
  const cal = document.getElementById('bkCal');
  if (!cal) return;
  const view  = bkState.view;
  const y = view.getFullYear(), mo = view.getMonth();
  const today = bkToday();
  const startDow    = new Date(y, mo, 1).getDay();
  const daysInMonth = new Date(y, mo + 1, 0).getDate();
  const canPrev = !(y === today.getFullYear() && mo === today.getMonth());

  let cells = '';
  for (let i = 0; i < startDow; i++) cells += '<span class="bk-day bk-empty"></span>';
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(y, mo, d);
    const past = date < today;
    const extra = [past ? 'bk-past' : '', bkSame(date, today) ? 'bk-today' : ''].filter(Boolean).join(' ');
    const iso = bkISO(date);
    cells += `<button type="button" class="bk-day ${extra}" ${past ? 'disabled' : ''} data-iso="${iso}"`
           + ` onclick="bkPick('${iso}')" onmouseenter="bkHover('${iso}')">${d}</button>`;
  }

  cal.innerHTML =
    `<div class="bk-cal-head">
       <button type="button" class="bk-nav" ${canPrev ? '' : 'disabled'} onclick="bkNav(-1)" aria-label="Mês anterior">&lsaquo;</button>
       <span class="bk-cal-title">${BK_MONTHS[mo]} ${y}</span>
       <button type="button" class="bk-nav" onclick="bkNav(1)" aria-label="Próximo mês">&rsaquo;</button>
     </div>
     <div class="bk-week">${BK_WEEK.map(w => `<span>${w}</span>`).join('')}</div>
     <div class="bk-grid" onmouseleave="bkHover(null)">${cells}</div>`;
  bkPaint();
}

// Atualiza as classes de intervalo sem reconstruir a grade (evita flicker no hover)
function bkPaint() {
  const cal = document.getElementById('bkCal');
  if (!cal) return;
  const ci = bkState.checkin, co = bkState.checkout;
  const end = co || (ci && !co && bkState.hover && bkState.hover > ci ? bkState.hover : null);
  cal.querySelectorAll('.bk-day[data-iso]').forEach(btn => {
    const date = bkParse(btn.dataset.iso);
    btn.classList.remove('bk-start', 'bk-end', 'bk-inrange', 'bk-preview');
    if (bkSame(date, ci)) btn.classList.add('bk-start');
    if (co && bkSame(date, co)) btn.classList.add('bk-end');
    if (ci && !co && end && bkSame(date, end)) btn.classList.add('bk-end', 'bk-preview');
    if (ci && end && date > ci && date < end) btn.classList.add('bk-inrange');
  });
  bkSummary();
}

function bkNav(dir) {
  const v = bkState.view;
  bkState.view = new Date(v.getFullYear(), v.getMonth() + dir, 1);
  bkState.hover = null;
  bkRenderCal();
}

function bkPick(iso) {
  const date = bkParse(iso);
  const { checkin, checkout } = bkState;
  if (!checkin || checkout || date <= checkin) {
    bkState.checkin = date;   // inicia (ou reinicia) um novo intervalo
    bkState.checkout = null;
  } else {
    bkState.checkout = date;  // fecha o intervalo
  }
  bkState.hover = null;
  const warn = document.getElementById('bkWarn');
  if (warn) warn.style.display = 'none';
  bkPaint();
}

function bkHover(iso) {
  if (bkState.checkin && !bkState.checkout) {
    bkState.hover = bkParse(iso);
    bkPaint();
  }
}

// Resumo (check-in / check-out / noites) + inputs ocultos p/ submitBooking
function bkSummary() {
  const ci = bkState.checkin, co = bkState.checkout;
  const inEl = document.getElementById('bkSumIn'), outEl = document.getElementById('bkSumOut');
  if (inEl)  { inEl.textContent  = ci ? bkFmt(ci) : 'Selecione'; inEl.classList.toggle('bk-sum-set', !!ci); }
  if (outEl) { outEl.textContent = co ? bkFmt(co) : 'Selecione'; outEl.classList.toggle('bk-sum-set', !!co); }
  const nEl = document.getElementById('bkNights');
  if (nEl) {
    const n = bkNights();
    nEl.textContent = n ? `${n} ${n === 1 ? 'noite' : 'noites'}` : '';
    nEl.style.display = n ? '' : 'none';
  }
  const hi = document.getElementById('bk-checkin'), ho = document.getElementById('bk-checkout');
  if (hi) hi.value = bkISO(ci);
  if (ho) ho.value = bkISO(co);
}

function updateChildAges() {
  const n = parseInt(document.getElementById('bk-children')?.value || '0');
  const container = document.getElementById('bkChildAges');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const fg = document.createElement('div');
    fg.className = 'fg';
    fg.innerHTML = `<label>Idade criança ${i + 1}</label>
      <select id="bk-child-${i}">
        ${Array.from({length:13}, (_, a) => `<option value="${a}">${a} ${a===1?'ano':'anos'}</option>`).join('')}
      </select>`;
    container.appendChild(fg);
  }
}

function submitBooking(e) {
  e.preventDefault();
  const ci = bkState.checkin, co = bkState.checkout;
  if (!ci || !co) {
    const warn = document.getElementById('bkWarn');
    if (warn) warn.style.display = 'block';
    return;
  }
  const adults = document.getElementById('bk-adults').value;
  const nChildren = parseInt(document.getElementById('bk-children')?.value || '0');
  const childAges = [];
  for (let i = 0; i < nChildren; i++) {
    const age = document.getElementById(`bk-child-${i}`)?.value;
    if (age !== undefined) childAges.push(age);
  }
  pushLead('reserva_whatsapp');
  const n = bkNights();
  let msg = `Olá! Gostaria de fazer uma reserva no ${HOTEL_NAME}.\n\n`;
  msg += `*Check-in:* ${bkFmt(ci)}\n`;
  msg += `*Check-out:* ${bkFmt(co)}\n`;
  msg += `*Noites:* ${n}\n`;
  msg += `*Adultos:* ${adults}\n`;
  if (nChildren) msg += `*Crianças:* ${nChildren} (idades: ${childAges.join(', ')})\n`;
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  closeBooking();
}

// Injeta o modal de reservas no final do body
(function injectBookingModal() {
  const waText = encodeURIComponent('Olá, gostaria de fazer uma reserva.');
  const html = `
    <div class="bk-modal" id="bkModal" role="dialog" aria-modal="true" aria-labelledby="bkTitle" aria-hidden="true">
      <div class="bk-modal-box">
        <button class="bk-close" onclick="closeBooking()" aria-label="Fechar">&times;</button>
        <div class="bk-header">
          <img src="/assets/img/logo-gold.png" alt="${HOTEL_NAME}" class="bk-logo">
          <div>
            <h3 id="bkTitle">Reserve sua Estadia</h3>
            <p>Preencha os dados e finalize pelo WhatsApp</p>
          </div>
        </div>
        <form onsubmit="submitBooking(event)" class="bk-form">
          <div class="bk-scroll">
          <div class="bk-summary">
            <div class="bk-sum-item">
              <span class="bk-sum-lbl">Check-in</span>
              <span class="bk-sum-val" id="bkSumIn">Selecione</span>
            </div>
            <span class="bk-sum-sep">&rarr;</span>
            <div class="bk-sum-item">
              <span class="bk-sum-lbl">Check-out</span>
              <span class="bk-sum-val" id="bkSumOut">Selecione</span>
            </div>
            <span class="bk-nights" id="bkNights" style="display:none"></span>
          </div>
          <div class="bk-cal" id="bkCal"></div>
          <input type="hidden" id="bk-checkin">
          <input type="hidden" id="bk-checkout">
          <p class="bk-warn" id="bkWarn" style="display:none">Selecione as datas de check-in e check-out no calendário.</p>
          <div class="bk-row">
            <div class="fg">
              <label>Adultos *</label>
              <select id="bk-adults">
                <option value="1">1 adulto</option>
                <option value="2" selected>2 adultos</option>
                <option value="3">3 adultos</option>
                <option value="4">4 adultos</option>
                <option value="5">5 adultos</option>
              </select>
            </div>
            <div class="fg">
              <label>Crianças</label>
              <select id="bk-children" onchange="updateChildAges()">
                <option value="0" selected>Nenhuma</option>
                <option value="1">1 criança</option>
                <option value="2">2 crianças</option>
                <option value="3">3 crianças</option>
              </select>
            </div>
          </div>
          <div class="bk-child-ages" id="bkChildAges"></div>
          </div><!-- /.bk-scroll -->
          <button type="submit" class="bk-submit">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.6.1-.2.3-.7 1-.9 1.1-.2.2-.3.2-.6.1-1.6-.8-2.6-1.5-3.6-3.3-.3-.5.3-.5.8-1.5.1-.2 0-.3 0-.5-.1-.2-.6-1.5-.9-2-.2-.5-.4-.4-.6-.5H8c-.2 0-.5.1-.7.3-.9.9-1.1 2.2-.5 3.5.7 1.6 1.6 3 3 4.3 2 1.8 3.7 2.4 4.9 2.6.7.1 1.7.1 2.3-.4.4-.3.9-1 .9-1.8 0-.3 0-.3-.1-.4-.1-.1-.3-.2-.5-.3z"/><path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm0 18.2c-1.5 0-2.9-.4-4.1-1.1l-.3-.2-3 .9.9-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>
            Pedir reserva pelo WhatsApp</button>
          <p class="bk-alt">Prefere falar com a gente?
            <a href="https://wa.me/${WA_NUMBER}?text=${waText}" target="_blank" rel="noopener" class="bk-wa-link">Fale pelo WhatsApp</a>
          </p>
        </form>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
  const bk = document.getElementById('bkModal');
  bk?.addEventListener('click', e => { if (e.target === bk) closeBooking(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && bk?.classList.contains('open')) closeBooking(); });
})();

/* ── Som do vídeo do hero ──
   O vídeo de fundo toca mudo (autoplay exige muted). O áudio vive num <audio>
   separado, sincronizado com o vídeo. O botão liga/desliga e mantém o sync. */
function toggleHeroSound() {
  const v = document.getElementById('heroVideo');
  const a = document.getElementById('heroAudio');
  const btn = document.getElementById('heroSoundBtn');
  if (!a || !btn) return;
  const ic = btn.querySelector('.hero-sound-ic');
  const tx = btn.querySelector('.hero-sound-tx');
  const isOn = btn.getAttribute('aria-pressed') === 'true';
  if (isOn) {
    a.pause();
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'Ligar som do vídeo');
    if (ic) ic.textContent = '🔇';
    if (tx) tx.textContent = 'Ligar som';
  } else {
    if (v) { try { a.currentTime = v.currentTime % (a.duration || v.currentTime + 1); } catch (e) {} }
    a.play().catch(() => {});
    btn.setAttribute('aria-pressed', 'true');
    btn.setAttribute('aria-label', 'Desligar som do vídeo');
    if (ic) ic.textContent = '🔊';
    if (tx) tx.textContent = 'Desligar som';
  }
}
