/* Carrossel de fotos (lightbox): clicar numa foto de .galeria-fotos abre a
   imagem grande, com setas pra navegar entre as fotos daquela galeria.
   Assim como o modal de vídeo, é deliberadamente separado do sistema de
   painel — conteúdo dinâmico por clique, fora do fundo sorteado por
   sessão dos painéis. Fundo branco (não escuro de cinema como o modal
   de vídeo) desde a V1.6 — pedido explícito pra esse lightbox.

   Lê a lista de fotos direto do DOM (todas as <img> dentro da mesma
   .galeria-fotos clicada), não de projetos.json — funciona pra qualquer
   grade de fotos que exista na página, sem acoplar ao formato do dado. */
(function () {
  var modal = document.getElementById('photo-modal');
  if (!modal) return;

  var imgEl = modal.querySelector('.photo-modal__img');
  var fechar = modal.querySelector('.photo-modal__close');
  var prev = modal.querySelector('.arrow--prev');
  var next = modal.querySelector('.arrow--next');

  var fotos = [];
  var indice = 0;
  var gatilho = null;

  function mostrar(i) {
    indice = (i + fotos.length) % fotos.length;
    imgEl.src = fotos[indice].src;
    imgEl.alt = fotos[indice].alt;
  }

  function abrir(lista, i, origem) {
    fotos = lista;
    gatilho = origem;
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
    if (gatilho) gatilho.focus();
    gatilho = null;
  }

  document.addEventListener('click', function (e) {
    var item = e.target.closest('.galeria-fotos__item img');
    if (item) {
      var galeria = item.closest('.galeria-fotos');
      var imgs = Array.prototype.slice.call(galeria.querySelectorAll('img'));
      var lista = imgs.map(function (im) { return { src: im.currentSrc || im.src, alt: im.alt }; });
      abrir(lista, imgs.indexOf(item), item);
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
