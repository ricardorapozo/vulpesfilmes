/* V1.18.6: detecta quando um vídeo "de verdade" está tocando — com som,
   pra ser assistido — nos três lugares onde isso acontece no site:
   `.projeto-video` (autoplay da página de projeto), `.photo-modal__video`
   (primeiro slide do lightbox de fotos, V1.17) e `.video-modal__frame`
   (modal aberto ao clicar na mídia ambiente do feed/carrossel). Expõe
   `window.VulpesVideoReal.tocando()` e dispara `video-real:mudou`
   (`detail.tocando`, booleano) sempre que esse estado muda — consumido
   por `js/idle-color.js`, que não deve deixar o efeito de cor cobrir um
   vídeo que o usuário está ativamente assistindo.

   Deliberadamente NÃO cobre `.media video`/`.slide video` (o loop mudo
   do feed e do carrossel, sempre tocando sozinho em segundo plano) —
   pedido explícito: "precisamos que os vídeos do loop continuem
   tocando, eles não podem interromper a entrada do efeito de cor." Se
   esses loops contassem como "vídeo real", o efeito quase nunca
   ligaria na home, já que eles tocam o tempo todo.

   Três formas de saber se está tocando, uma por tipo de player:
   - `<video>` local: eventos nativos `play`/`pause`/`ended`.
   - iframe do YouTube: precisa de `enablejsapi=1` (já ligado em todo
     embed, ver `js/helpers.js`) — manda `{event:'listening'}` assim
     que o iframe carrega, e a partir daí o YouTube avisa sozinho
     (`infoDelivery`, `info.playerState`: `1` = tocando) toda vez que
     o estado muda.
   - iframe do Vimeo: manda `{method:'addEventListener', value:'play'}`
     (e `'pause'`/`'ended'`) assim que o iframe carrega — o player.js
     do Vimeo passa a mandar `{event:'play'}`/`{event:'pause'}` sozinho
     a partir daí.

   Cada container tem o conteúdo trocado via `innerHTML` em momentos
   diferentes (`.photo-modal__video` a cada troca de slide;
   `.video-modal__frame` a cada abertura; `.projeto-video` uma vez só,
   no primeiro render — mas ainda não existe quando este script roda,
   é criado depois por `js/projeto.js`) — um `MutationObserver` por
   container reconecta o listener certo toda vez que o conteúdo troca,
   em vez de espalhar essa lógica pelos três arquivos que criam esse
   conteúdo. */
(function () {
  var CONTAINERS = ['.projeto-video', '.photo-modal__video', '.video-modal__frame'];
  var tocando = {};

  function marcar(chave, valor) {
    if (tocando[chave] === valor) return;
    tocando[chave] = valor;
    var algum = CONTAINERS.some(function (c) { return tocando[c]; });
    document.dispatchEvent(new CustomEvent('video-real:mudou', { detail: { tocando: algum } }));
  }

  function observarVideoLocal(chave, video) {
    video.addEventListener('play', function () { marcar(chave, true); });
    video.addEventListener('pause', function () { marcar(chave, false); });
    video.addEventListener('ended', function () { marcar(chave, false); });
    if (!video.paused) marcar(chave, true);
  }

  function observarYouTube(chave, iframe) {
    iframe.addEventListener('load', function () {
      if (!iframe.contentWindow) return;
      iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening', id: chave }), '*');
    });
  }

  function observarVimeo(chave, iframe) {
    iframe.addEventListener('load', function () {
      if (!iframe.contentWindow) return;
      ['play', 'pause', 'ended'].forEach(function (evento) {
        iframe.contentWindow.postMessage(JSON.stringify({ method: 'addEventListener', value: evento }), '*');
      });
    });
  }

  function achaChavePorJanela(janela) {
    for (var i = 0; i < CONTAINERS.length; i++) {
      var iframe = document.querySelector(CONTAINERS[i] + ' iframe');
      if (iframe && iframe.contentWindow === janela) return CONTAINERS[i];
    }
    return null;
  }

  window.addEventListener('message', function (e) {
    var dado;
    try { dado = JSON.parse(e.data); } catch (err) { return; }

    if (dado && dado.event === 'infoDelivery' && dado.info && typeof dado.info.playerState === 'number') {
      var chaveYT = achaChavePorJanela(e.source);
      if (chaveYT) marcar(chaveYT, dado.info.playerState === 1);
      return;
    }

    if (dado && (dado.event === 'play' || dado.event === 'pause' || dado.event === 'ended')) {
      var chaveVM = achaChavePorJanela(e.source);
      if (chaveVM) marcar(chaveVM, dado.event === 'play');
    }
  });

  function reconectar(chave) {
    var container = document.querySelector(chave);
    if (!container) { marcar(chave, false); return; }
    var video = container.querySelector('video');
    if (video) { observarVideoLocal(chave, video); return; }
    var iframe = container.querySelector('iframe');
    if (!iframe) { marcar(chave, false); return; }
    var src = iframe.src || '';
    if (src.indexOf('youtube.com') !== -1) observarYouTube(chave, iframe);
    else if (src.indexOf('vimeo.com') !== -1) observarVimeo(chave, iframe);
  }

  CONTAINERS.forEach(function (chave) {
    var container = document.querySelector(chave);
    if (container) {
      reconectar(chave);
      new MutationObserver(function () { reconectar(chave); }).observe(container, { childList: true });
      return;
    }
    /* `.projeto-video` não existe ainda no primeiro carregamento —
       `js/projeto.js` só cria ele depois de `projetos:pronto`. Observa
       `#conteudo-projeto` (existe desde o HTML estático) até o filho
       aparecer, então conecta nele igual aos outros dois. */
    var pai = document.getElementById('conteudo-projeto');
    if (!pai) return;
    var esperar = new MutationObserver(function () {
      var alvo = document.querySelector(chave);
      if (!alvo) return;
      reconectar(chave);
      new MutationObserver(function () { reconectar(chave); }).observe(alvo, { childList: true });
      esperar.disconnect();
    });
    esperar.observe(pai, { childList: true, subtree: true });
  });

  window.VulpesVideoReal = {
    tocando: function () { return CONTAINERS.some(function (c) { return tocando[c]; }); }
  };
})();
