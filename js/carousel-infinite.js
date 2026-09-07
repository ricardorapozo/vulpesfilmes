/* Carrossel infinito com clone e teleporte. */
document.addEventListener('feed:pronto', function () {

  document.querySelectorAll('.media--carousel').forEach(function (car) {
    var track = car.querySelector('.track');
    var slides = Array.prototype.slice.call(track.querySelectorAll('.slide'));
    if (!slides.length) return;

    /* Se há um único slide, não fazer loop */
    if (slides.length === 1) return;

    var slideSize = slides[0].getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap || 0);
    var totalSize = slideSize * slides.length;

    function prepararClone(slide) {
      var clone = slide.cloneNode(true);
      var video = clone.querySelector('video');
      if (video) {
        /* V13: vídeo não tem mais `poster` (prioridade do vídeo sobre a
           imagem estática, ver js/helpers.js) — o clone só remove o
           vídeo e deixa a cor de --placeholder do próprio .slide
           aparecer. Um clone só aparece de relance durante o teleporte,
           então não faz diferença visual real. */
        video.remove();
      }
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('a, button, input, select, textarea, [tabindex]').forEach(function (el) {
        el.setAttribute('tabindex', '-1');
      });
      return clone;
    }

    /* Clonar: conjunto completo antes, original, conjunto completo depois. */
    slides.slice().reverse().forEach(function (s) {
      track.insertBefore(prepararClone(s), track.firstChild);
    });

    slides.forEach(function (s) {
      track.appendChild(prepararClone(s));
    });

    /* Teleportar sem piscar — desliga scroll-snap/scroll-behavior, muda
       scrollLeft e força reflow antes de religar, senão o `smooth` do
       .track (CSS) anima a mudança em vez de saltar. */
    function teleportar(delta) {
      var snap = track.style.scrollSnapType;
      var behavior = track.style.scrollBehavior;
      track.style.scrollSnapType = 'none';
      track.style.scrollBehavior = 'auto';
      track.scrollLeft += delta;
      void track.offsetHeight;
      track.style.scrollSnapType = snap;
      track.style.scrollBehavior = behavior;
    }

    /* Centraliza um slide específico dentro do .track, mexendo só no
       scrollLeft do track — nunca em ancestrais.
       V13 usava `slide.scrollIntoView({ inline:'center', block:'nearest' })`
       aqui, que parecia seguro (`block:'nearest'` "não deveria" mexer no
       eixo vertical), mas `scrollIntoView` rola QUALQUER ancestral rolável
       no caminho, não só o `.track` — se o carrossel (ex.: Dancebook, o
       segundo da home) começava a posição fora da tela, a PÁGINA INTEIRA
       rolava pra baixo até ele ficar "nearest" visível. Era esse o bug da
       V13.1 (v14 do usuário): abrir a home, ou a página de um diretor com
       Dancebook na galeria, pulava direto pro Dancebook. Cálculo manual
       com getBoundingClientRect() só toca `track.scrollLeft` — não existe
       chance de vazar pra um ancestral. */
    function centralizarSlide(slide) {
      var snap = track.style.scrollSnapType;
      var behavior = track.style.scrollBehavior;
      track.style.scrollSnapType = 'none';
      track.style.scrollBehavior = 'auto';
      void track.offsetHeight;
      var trackRect = track.getBoundingClientRect();
      var slideRect = slide.getBoundingClientRect();
      var delta = (slideRect.left + slideRect.width / 2) - (trackRect.left + trackRect.width / 2);
      track.scrollLeft += delta;
      void track.offsetHeight;
      track.style.scrollSnapType = snap;
      track.style.scrollBehavior = behavior;
    }

    /* Posiciona no slide real mais próximo do centro do .track — usado
       tanto no carregamento (o "mais próximo" é o slide 0 do conjunto
       real, já que tudo começa em scrollLeft: 0) quanto depois de um
       resize (ver abaixo), onde o mais próximo pode ser qualquer um. */
    function slideMaisProximoDoCentro() {
      var todos = Array.prototype.slice.call(track.querySelectorAll('.slide'));
      var trackRect = track.getBoundingClientRect();
      var centro = trackRect.left + trackRect.width / 2;
      return todos.reduce(function (a, b) {
        var da = Math.abs((a.getBoundingClientRect().left + a.getBoundingClientRect().width / 2) - centro);
        var db = Math.abs((b.getBoundingClientRect().left + b.getBoundingClientRect().width / 2) - centro);
        return db < da ? b : a;
      });
    }

    /* Posicionar no início do conjunto real, ao carregar a página. */
    centralizarSlide(slides[0]);

    /* O `min-height` de .slide (css/layout.css) é uma rede de segurança
       só pro instante ANTES de qualquer mídia carregar — sem ele, o
       slide (e o cálculo de scroll acima) não tem geometria estável no
       primeiro layout, e o vídeo em loop simplesmente não aparecia (bug
       da V13/V14). Só que `min-height` não desliga sozinho: uma foto que
       já carregou e só precisa de, digamos, 400px de altura continuava
       obrigada a ocupar os 620px do clamp, sobrando uma faixa da cor de
       `--placeholder` ao redor da imagem — a "moldura" colorida (bug da
       V14.1). Assim que a mídia real do slide carrega, tira o
       `min-height` desse slide específico — ele já tem geometria
       suficiente pra se sustentar sozinho a partir daí, via
       `object-fit: contain`. Clones de vídeo (sem `<video>` nenhum,
       removido em `prepararClone`) nunca disparam isso e ficam com o
       piso pra sempre — sem problema, só aparecem de relance durante o
       teleporte. */
    track.querySelectorAll('.slide').forEach(function (s) {
      var midia = s.querySelector('img, video');
      if (!midia) return;
      function liberarAltura() { s.style.minHeight = '0'; }
      if (midia.tagName === 'IMG') {
        if (midia.complete && midia.naturalWidth) liberarAltura();
        else midia.addEventListener('load', liberarAltura, { once: true });
      } else if (midia.readyState >= 1) {
        liberarAltura(); /* HAVE_METADATA: já sabe a proporção intrínseca */
      } else {
        midia.addEventListener('loadedmetadata', liberarAltura, { once: true });
      }
    });

    /* Recentraliza no resize (debounced): sem isso, redimensionar a janela
       muda a largura/altura dos slides mas não a posição de scroll, e o
       navegador pode "ajustar" o scroll-snap sozinho pro ponto mais
       próximo em vez do slide inteiro — as vezes um clone de vídeo (sem
       imagem nenhuma, só a cor de --placeholder) fica visível no lugar de
       uma foto de verdade. */
    var resizeTimeout;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function () {
        centralizarSlide(slideMaisProximoDoCentro());
      }, 150);
    });

    /* Detectar a saída do conjunto real, não uma porcentagem aproximada. */
    var teleportTimeout;
    function verificarTeleporte() {
      clearTimeout(teleportTimeout);
      teleportTimeout = setTimeout(function () {
        var pos = track.scrollLeft;
        var inicioReal = totalSize;
        var fimReal = totalSize * 2;
        var margem = slideSize * .5;

        if (pos < inicioReal - margem) {
          teleportar(totalSize);
        } else if (pos >= fimReal - margem) {
          teleportar(-totalSize);
        }
      }, 120);
    }

    if ('onscrollend' in window) {
      track.addEventListener('scrollend', verificarTeleporte);
    } else {
      track.addEventListener('scroll', verificarTeleporte, { passive: true });
    }

    var prev = car.querySelector('.arrow--prev');
    var next = car.querySelector('.arrow--next');
    if (prev) prev.hidden = false;
    if (next) next.hidden = false;
  });
});
