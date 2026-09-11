/* Carrossel de fotos (lightbox): clicar numa foto de .galeria-fotos abre a
   imagem grande, com setas pra navegar entre as fotos daquela galeria.
   Assim como o modal de vídeo, é deliberadamente separado do sistema de
   painel — conteúdo dinâmico por clique, fora do fundo sorteado por
   sessão dos painéis. Fundo branco (não escuro de cinema como o modal
   de vídeo) desde a V1.6 — pedido explícito pra esse lightbox.

   Lê a lista de fotos direto do DOM (todas as <img> dentro da mesma
   .galeria-fotos clicada), não de projetos.json — funciona pra qualquer
   grade de fotos que exista na página, sem acoplar ao formato do dado.

   V1.17: o vídeo do projeto vira o PRIMEIRO slide da galeria — "o
   usuário clica em uma foto, o vídeo (que tocava em autoplay) para, abre
   a galeria, e uma das fotos é o vídeo." `slides` deixou de ser só
   `{src, alt}`; agora cada item tem `tipo: 'foto'` ou `'video'`, e
   `mostrar()` decide o que fazer com cada um. O link do vídeo vem de
   `data-video` em `.galeria-fotos` (escrito por `js/projeto.js` — esse
   script lê o DOM, não `projetos.json`, então precisa que o dado chegue
   até ele por HTML). */
(function () {
  var modal = document.getElementById('photo-modal');
  if (!modal) return;

  var imgEl = modal.querySelector('.photo-modal__img');
  var videoEl = modal.querySelector('.photo-modal__video');
  var fechar = modal.querySelector('.photo-modal__close');
  var prev = modal.querySelector('.arrow--prev');
  var next = modal.querySelector('.arrow--next');
  var escapar = window.VulpesHelpers.escapar;
  var urlDeEmbed = window.VulpesHelpers.urlDeEmbed;

  var fotos = [];
  var indice = 0;
  var gatilho = null;

  /* "Ele pode voltar parado" — o vídeo entra como slide, mas não toca
     sozinho: `urlDeEmbed(url, false)` monta o embed SEM `autoplay=1`. */
  function mostrar(i) {
    indice = (i + fotos.length) % fotos.length;
    var slide = fotos[indice];

    if (slide.tipo === 'video') {
      imgEl.hidden = true;
      imgEl.src = '';
      videoEl.hidden = false;
      var embed = urlDeEmbed(slide.url, false);
      videoEl.innerHTML = embed
        ? '<iframe src="' + escapar(embed) + '" title="Vídeo do projeto" ' +
          'allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>'
        : '<video src="' + escapar(slide.url) + '" controls playsinline></video>';
      return;
    }

    videoEl.hidden = true;
    videoEl.innerHTML = '';
    imgEl.hidden = false;
    imgEl.src = slide.src;
    imgEl.alt = slide.alt;
  }

  /* Pausa o vídeo de verdade da página (que toca em autoplay fora do
     lightbox, ver js/projeto.js) ao abrir a galeria — senão ele continua
     tocando (e fazendo som) escondido atrás do fundo branco do lightbox.
     Três casos, conforme o que `.projeto-video` estiver mostrando:
     `<video>` local (`.pause()` direto), iframe do YouTube ou do Vimeo
     (cada um com sua própria API de `postMessage` — não dá pra chamar
     `.pause()` num iframe de outro domínio). `enablejsapi=1` no embed do
     YouTube (ver js/helpers.js) é o que garante esse comando ser aceito. */
  function pausarVideoPrincipal() {
    var video = document.querySelector('.projeto-video video');
    if (video) { video.pause(); return; }
    var iframe = document.querySelector('.projeto-video iframe');
    if (!iframe || !iframe.contentWindow) return;
    var src = iframe.src || '';
    if (src.indexOf('youtube.com') !== -1) {
      iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
    } else if (src.indexOf('vimeo.com') !== -1) {
      iframe.contentWindow.postMessage(JSON.stringify({ method: 'pause' }), '*');
    }
  }

  function abrir(lista, i, origem) {
    fotos = lista;
    gatilho = origem;
    pausarVideoPrincipal();
    mostrar(i);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    modal.inert = false;
    /* V11: tratamento parecido com o modal de vídeo (hambúrguer some,
       mesmo conflito de posição com "fechar"), mas com classe própria —
       `is-photo-open`, não `is-lightbox-open`. Fundo branco (patch da
       V1.6) pedia o logo continuar visível aqui; `is-lightbox-open`
       esconderia os dois, então essa tela precisava da própria classe
       pra CSS diferenciar (ver base.css). */
    document.documentElement.classList.add('is-photo-open');
    fechar.focus();
  }

  function fecharModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    modal.inert = true;
    document.documentElement.classList.remove('is-photo-open');
    imgEl.src = '';
    videoEl.innerHTML = ''; /* remove o player do slide, se era esse o slide aberto */
    if (gatilho) gatilho.focus();
    gatilho = null;
  }

  document.addEventListener('click', function (e) {
    var item = e.target.closest('.galeria-fotos__item img');
    if (item) {
      var galeria = item.closest('.galeria-fotos');
      var imgs = Array.prototype.slice.call(galeria.querySelectorAll('img'));
      var lista = imgs.map(function (im) { return { tipo: 'foto', src: im.currentSrc || im.src, alt: im.alt }; });
      var videoUrl = galeria.getAttribute('data-video');
      var deslocamento = 0;
      if (videoUrl) {
        lista.unshift({ tipo: 'video', url: videoUrl });
        deslocamento = 1; /* o vídeo entrou na frente — os índices das fotos andam um pra direita */
      }
      abrir(lista, imgs.indexOf(item) + deslocamento, item);
      return;
    }

    if (!modal.classList.contains('is-open')) return;
    if (e.target === fechar || fechar.contains(e.target) || e.target === modal) { fecharModal(); return; }
    if (e.target === prev || prev.contains(e.target)) { mostrar(indice - 1); return; }
    if (e.target === next || next.contains(e.target)) { mostrar(indice + 1); return; }

    /* V1.16: área de clique maior — a foto inteira navega, não só a
       seta. "Ao clicar no lado direito da foto vamos para a próxima
       foto. Ao clicar na área esquerda, a anterior retorna." Metade
       calculada pela largura de RENDERIZAÇÃO da própria imagem
       (`getBoundingClientRect`), não do `.photo-modal__frame` — a
       imagem usa `object-fit: contain` e pode sobrar área vazia ao
       redor dela dentro do frame; clicar nessa sobra não deveria
       contar como "lado" da foto. */
    if (e.target === imgEl) {
      var meio = imgEl.getBoundingClientRect().left + imgEl.getBoundingClientRect().width / 2;
      mostrar(e.clientX < meio ? indice - 1 : indice + 1);
      return;
    }
  });

  document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') fecharModal();
    else if (e.key === 'ArrowLeft') mostrar(indice - 1);
    else if (e.key === 'ArrowRight') mostrar(indice + 1);
  });
})();
