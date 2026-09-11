/* Painel é um componente com três variantes. Menu desce do topo,
   contato e quem-somos são cards centralizados, fade simples de
   opacidade (ver `.panel--about`/`.panel--contact` em base.css). Esc,
   clique fora, foco preso, inert atrás. .is-overlay-open no <html>
   dispara a cor de fundo e o overlay de cor nas mídias — independente
   da animação de entrada/saída de cada painel, não muda com nenhuma
   delas.

   V1.7 tinha trocado a entrada/saída do "quem somos" pelo "dip to
   white" padrão do site (`document.startViewTransition()`, mesmo
   truque de `js/diretor-tabs.js`); V1.7.8 reverteu — pedido explícito
   pra tirar o dip e voltar a um fade in/out normal, igual ao card de
   contato. */
(function () {
  var raiz = document.documentElement;
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');
  var about = document.getElementById('quem-somos');
  var contato = document.getElementById('contato');
  var main = document.getElementById('conteudo');
  var paineis = [menu, about, contato].filter(Boolean);

  var aberto = null;
  var gatilho = null;

  var FOCAVEIS = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

  function sincronizar() {
    var algum = paineis.some(function (p) { return p.classList.contains('is-open'); });
    raiz.classList.toggle('is-overlay-open', algum);
    if (main) main.inert = algum;
    burger.setAttribute('aria-expanded', menu && menu.classList.contains('is-open') ? 'true' : 'false');
    burger.setAttribute('aria-label', menu && menu.classList.contains('is-open') ? 'Fechar menu' : 'Abrir menu');
    paineis.forEach(function (p) {
      var aberto = p.classList.contains('is-open');
      p.inert = !aberto;
      p.setAttribute('aria-hidden', aberto ? 'false' : 'true');
    });
  }

  function abrir(painel, origem) {
    gatilho = origem || document.activeElement;

    /* Troca entre painéis: por padrão os movimentos se sobrepõem em
       120ms, senão a tela fica vazia no meio e o corte parece erro de
       carregamento. .is-overlay-open nunca cai, então a cor não pisca.

       Abrir "quem somos" é a exceção: pedido explícito de sequência
       limpa — "a barra do menu se recolhe e o card aparece com fade
       in", sem sobrepor os dois movimentos. Com um card tão grande
       (90vw de largura), a sobreposição padrão deixava o conteúdo da
       página (fotos, títulos) visível ATRAVÉS do card ainda
       semitransparente em plena animação — um "fantasma" que lia como
       se o fundo também estivesse mudando. Por isso espera o painel
       anterior terminar de recolher de verdade (mesma duração de
       `--t-panel`, tokens.css) antes de começar o fade do card. */
    var espera = painel === about ? 480 : 120;

    if (aberto && aberto !== painel) {
      aberto.classList.remove('is-open');
      setTimeout(function () { painel.classList.add('is-open'); sincronizar(); focar(painel); }, espera);
      aberto = painel;
      return;
    }

    painel.classList.add('is-open');
    aberto = painel;
    sincronizar();
    focar(painel);
  }

  function focar(painel) {
    var alvo = painel.querySelector(FOCAVEIS);
    if (alvo) alvo.focus();
  }

  function fechar() {
    paineis.forEach(function (p) { p.classList.remove('is-open'); });
    if (menu) menu.style.height = '';
    if (menu) menu.classList.remove('is-directors-open');
    raiz.classList.remove('is-directors-open');
    // Fechar todos os submenus
    document.querySelectorAll('.menu-toggle').forEach(function (btn) {
      btn.setAttribute('aria-expanded', 'false');
      var submenu = document.getElementById(btn.getAttribute('aria-controls'));
      if (submenu) submenu.hidden = true;
    });
    aberto = null;
    sincronizar();
    if (gatilho) gatilho.focus();
  }

  burger.addEventListener('click', function () {
    if (menu.classList.contains('is-open')) fechar();
    else abrir(menu, burger);
  });

  document.querySelectorAll('.menu-toggle').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var isExpanded = btn.getAttribute('aria-expanded') === 'true';
      var shouldExpand = !isExpanded;
      var alturaMenu = menu ? menu.getBoundingClientRect().height : 0;
      btn.setAttribute('aria-expanded', !isExpanded);
      var submenu = document.getElementById(btn.getAttribute('aria-controls'));
      if (submenu) submenu.hidden = isExpanded;
      if (shouldExpand) {
        if (menu) menu.style.height = alturaMenu + 'px';
        if (menu) menu.classList.add('is-directors-open');
        raiz.classList.add('is-directors-open');
      } else {
        if (menu) menu.style.height = '';
        if (menu) menu.classList.remove('is-directors-open');
        raiz.classList.remove('is-directors-open');
      }
    });
  });

  document.querySelectorAll('.submenu-back').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var toggle = btn.parentElement.querySelector('.menu-toggle');
      var submenu = btn.parentElement.querySelector('.submenu');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
      if (submenu) submenu.hidden = true;
      if (menu) menu.style.height = '';
      if (menu) menu.classList.remove('is-directors-open');
      raiz.classList.remove('is-directors-open');
      if (toggle) toggle.focus();
    });
  });

  document.querySelectorAll('[data-abre]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      var alvo = document.getElementById(el.getAttribute('data-abre'));
      if (!alvo) return;
      e.preventDefault();
      abrir(alvo, el);
    });
  });

  document.querySelectorAll('[data-fecha]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); fechar(); });
  });

  document.addEventListener('keydown', function (e) {
    if (!aberto) return;

    if (e.key === 'Escape') { fechar(); return; }

    if (e.key === 'Tab') {
      var itens = Array.prototype.slice.call(aberto.querySelectorAll(FOCAVEIS));
      if (!itens.length) return;
      var primeiro = itens[0];
      var ultimo = itens[itens.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
    }
  });

  document.addEventListener('click', function (e) {
    if (!aberto) return;
    if (aberto.contains(e.target) || burger.contains(e.target)) return;
    if (e.target.closest('[data-abre]')) return;
    fechar();
  });

  sincronizar();
})();
