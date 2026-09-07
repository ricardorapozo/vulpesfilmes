/* Dois riscos resolvidos aqui:
   1. Dez loops em autoplay simultâneo travam celular. Só toca o que está visível.
   2. No feed (fora do carrossel), só o vídeo visível toca — os que saem da
      tela pausam. Dentro do carrossel isso não vale mais desde V13: o
      vídeo em loop começa a tocar assim que aparece (lazy, como antes),
      mas não pausa mais ao rolar pra outro slide — continua tocando em
      loop mesmo fora de destaque. */

document.addEventListener('feed:pronto', function () {

  var calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('.media img').forEach(function (imagem) {
    imagem.addEventListener('error', function () {
      imagem.hidden = true;
      imagem.closest('.media').classList.add('is-missing');
    });
  });

  document.querySelectorAll('.media video').forEach(function (video) {
    video.addEventListener('error', function () {
      video.hidden = true;
      video.closest('.media').classList.add('is-missing');
    });
  });

  /* Carrega (se preciso) e toca. `.play()` pode rejeitar mesmo com
     `muted` — sobretudo logo depois de setar `.src`, se o navegador ainda
     não processou a troca (mais comum em arquivos maiores, tipo os
     ~18MB do Dossiê Anônimo). Sem retry, esse vídeo específico ficava
     pausado no `currentTime: 0` pra sempre, silenciosamente — o
     `.catch(function(){})` de antes engolia o erro e não tentava de novo. */
  function tocar(v) {
    if (!v.src && v.dataset.src) v.src = v.dataset.src;
    v.play().catch(function () {
      v.addEventListener('canplay', function tentarDeNovo() {
        v.removeEventListener('canplay', tentarDeNovo);
        v.play().catch(function () {});
      }, { once: true });
    });
  }

  /* ---------- vídeo por visibilidade ---------- */

  if (!calmo && 'IntersectionObserver' in window) {

    var obsPagina = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        var v = e.target;
        if (v.closest('.media--carousel')) return; /* carrossel tem observer próprio */
        if (e.isIntersecting) {
          tocar(v);
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.25 });

    document.querySelectorAll('video').forEach(function (v) { obsPagina.observe(v); });

    document.querySelectorAll('.track').forEach(function (track) {
      var obsSlide = new IntersectionObserver(function (entradas) {
        entradas.forEach(function (e) {
          var v = e.target.querySelector('video');
          if (!v || !e.isIntersecting) return;
          /* V13: sem pausa ao sair de vista — só dispara o carregamento
             lazy e o play() na primeira vez que o slide aparece; depois
             disso o loop continua rodando mesmo rolando pra outro slide. */
          tocar(v);
        });
      }, { root: track, threshold: 0.6 });

      track.querySelectorAll('.slide').forEach(function (s) { obsSlide.observe(s); });
    });
  }

  /* ---------- setas do carrossel ---------- */

  document.querySelectorAll('.media--carousel').forEach(function (car) {
    var track = car.querySelector('.track');
    var prev = car.querySelector('.arrow--prev');
    var next = car.querySelector('.arrow--next');
    var slide = track.querySelector('.slide');
    if (!track || !slide) return;

    function passo() {
      return slide.getBoundingClientRect().width + parseFloat(getComputedStyle(track).gap || 0);
    }

    prev.addEventListener('click', function () { track.scrollBy({ left: -passo(), behavior: 'smooth' }); });
    next.addEventListener('click', function () { track.scrollBy({ left: passo(), behavior: 'smooth' }); });
  });
});
