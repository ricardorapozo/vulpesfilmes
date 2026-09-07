/* Modal de vídeo: qualquer elemento com [data-video="<url>"] abre o vídeo
   real do projeto (YouTube, Vimeo ou mp4 local) tocando por cima da página
   atual. É deliberadamente separado do sistema de "painel"
   (menu/quem-somos/contato) em js/panel.js — vídeo pede fundo escuro de
   cinema, não a cor sorteada da sessão, e o conteúdo é dinâmico por
   clique, não fixo no HTML. */
(function () {
  var modal = document.getElementById('video-modal');
  if (!modal) return;

  var frame = modal.querySelector('.video-modal__frame');
  var fechar = modal.querySelector('.video-modal__close');
  var gatilho = null;

  /* Retorna a URL de embed (YouTube/Vimeo) ou null se for um mp4 local —
     nesse caso `abrir()` monta uma <video> em vez de <iframe>. */
  function urlDeEmbed(url) {
    var yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
    if (yt) return 'https://www.youtube.com/embed/' + yt[1] + '?autoplay=1&rel=0';

    var vimeo = url.match(/vimeo\.com\/(\d+)/);
    if (vimeo) return 'https://player.vimeo.com/video/' + vimeo[1] + '?autoplay=1';

    return null;
  }

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
    /* V11: logo e hambúrguer ficam nos mesmos 18px/var(--gutter) do topo
       que o "fechar" do modal — sem escondê-los eles continuam clicáveis
       por baixo/por cima, em conflito visual e de foco. Só "fechar" fica
       acessível enquanto o vídeo toca (ver css/base.css). */
    document.documentElement.classList.add('is-lightbox-open');
    fechar.focus();
  }

  function fecharModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    modal.inert = true;
    document.documentElement.classList.remove('is-lightbox-open');
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
