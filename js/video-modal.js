/* Modal de vídeo: qualquer elemento com [data-video="<url>"] abre o vídeo
   real do projeto (YouTube, Vimeo ou mp4 local) tocando por cima da página
   atual. É deliberadamente separado do sistema de "painel"
   (menu/quem-somos/contato) em js/panel.js — fundo próprio fixo, não a
   cor sorteada da sessão, e o conteúdo é dinâmico por clique, não fixo
   no HTML. Fundo branco (patch), não mais preto de cinema. */
(function () {
  var modal = document.getElementById('video-modal');
  if (!modal) return;

  var frame = modal.querySelector('.video-modal__frame');
  var fechar = modal.querySelector('.video-modal__close');
  var gatilho = null;
  var urlDeEmbed = window.VulpesHelpers.urlDeEmbed;

  function abrir(url, origem) {
    if (!url) return;
    gatilho = origem;
    var embed = urlDeEmbed(url);
    frame.innerHTML = embed
      ? '<iframe src="' + embed + '" title="Vídeo do projeto" ' +
        'allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>'
      : '<video src="' + url + '" controls autoplay playsinline></video>';
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    modal.inert = false;
    /* V11: hambúrguer fica nos mesmos 18px/var(--gutter) do topo que o
       "fechar" do modal — sem escondê-lo, os dois ficam sobrepostos, em
       conflito visual e de foco. Classe `is-photo-open` (mesma do
       lightbox de fotos, patch — os dois têm fundo branco agora, o
       mesmo tratamento de chrome faz sentido pros dois): esconde só o
       hambúrguer, não o logo — sem fundo escuro, não tem "modo cinema"
       pra justificar escondê-lo também (ver css/base.css). */
    document.documentElement.classList.add('is-photo-open');
    fechar.focus();
  }

  function fecharModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    modal.inert = true;
    document.documentElement.classList.remove('is-photo-open');
    frame.innerHTML = ''; /* remove o player, que já para o áudio/vídeo */
    if (gatilho) gatilho.focus();
    gatilho = null;
  }

  document.addEventListener('click', function (e) {
    var alvo = e.target.closest('[data-video]');
    if (alvo) {
      e.preventDefault();
      abrir(alvo.getAttribute('data-video'), alvo);
      return;
    }
    if (!modal.classList.contains('is-open')) return;
    if (e.target === fechar || fechar.contains(e.target) || e.target === modal) fecharModal();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) fecharModal();
  });
})();
