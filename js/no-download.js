/* V17: bloqueia o menu de contexto ("Salvar imagem como...", "Salvar vídeo
   como...") em cima de qualquer <img>/<video> do site. Complementa o CSS de
   base.css (-webkit-user-drag/-webkit-touch-callout), que cobre arrastar e
   o toque longo no celular. Delegado no document — pega também mídia
   inserida depois via JS (feed.js, carousel-infinite.js etc.), sem precisar
   de listener por elemento. */
(function () {
  document.addEventListener('contextmenu', function (evento) {
    if (evento.target.closest('img, video')) evento.preventDefault();
  });
})();
