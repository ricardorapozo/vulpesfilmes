/* Carrossel de fotos (lightbox): clicar numa foto de .galeria-fotos abre a
   imagem grande, com setas pra navegar entre as fotos daquela galeria.
   Assim como o modal de vídeo, é deliberadamente separado do sistema de
   painel — fundo escuro de cinema, conteúdo dinâmico por clique.

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
    /* V11: mesmo tratamento do modal de vídeo — logo e hambúrguer somem
       enquanto a foto está em tela, só "fechar" fica acessível. */
    document.documentElement.classList.add('is-lightbox-open');
    fechar.focus();
  }

  function fecharModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    modal.inert = true;
    document.documentElement.classList.remove('is-lightbox-open');
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
  });

  document.addEventListener('keydown', function (e) {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape') fecharModal();
    else if (e.key === 'ArrowLeft') mostrar(indice - 1);
    else if (e.key === 'ArrowRight') mostrar(indice + 1);
  });
})();
