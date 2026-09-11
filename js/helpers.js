/* Funções compartilhadas entre feed.js (home + galeria de diretor) e
   projeto.js (página individual do projeto), pra não duplicar a lógica de
   escape e de montagem de <img>/<video>. */
(function () {
  function escapar(valor) {
    return String(valor || '').replace(/[&<>"']/g, function (caractere) {
      return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[caractere];
    });
  }

  function midiaHTML(item, placeholder) {
    if (item.loop) {
      /* V13: sem `poster`. Vídeo em loop tem prioridade sobre poster —
         nunca mostra uma imagem estática por cima/no lugar do vídeo. Até
         o vídeo carregar, quem preenche o espaço é a cor de
         `--placeholder` do próprio .media/.slide, não uma foto. */
      return '<video muted loop playsinline preload="none" ' +
             'data-src="' + escapar(item.loop) + '" aria-label="' + escapar(item.alt) + '" ' +
             'style="--placeholder:' + escapar(placeholder) + '"></video>';
    }
    return '<img src="' + escapar(item.poster) + '" alt="' + escapar(item.alt) + '" ' +
           'style="--placeholder:' + escapar(placeholder) + '">';
  }

  /* V1.6: movido de js/video-modal.js pra cá — o player inline da própria
     página de projeto (js/projeto.js) precisa da mesma conversão de URL
     pra embed, e duplicar a regex em dois arquivos era um convite a
     desalinhar um do outro depois. Retorna a URL de embed (YouTube/Vimeo)
     ou null se for um mp4 local — nesse caso quem chama monta uma <video>
     em vez de <iframe>.

     `autoplay` (V1.17, padrão `true` — todo chamador existente continua
     pedindo autoplay sem precisar passar o segundo argumento) fica
     `false` só pro slide de vídeo dentro do lightbox de fotos
     (js/photo-modal.js): "ele pode voltar parado" — o vídeo entra como
     mais um slide da galeria, mas não deve tocar sozinho ao ser exibido
     ali. `enablejsapi=1` no embed do YouTube é o que permite pausar via
     `postMessage` de fora do iframe (ver js/photo-modal.js,
     `pausarVideoPrincipal()`) — sem isso, o comando de pause às vezes é
     ignorado pelo player. */
  function urlDeEmbed(url, autoplay) {
    var comSom = autoplay === false ? '' : '&autoplay=1';

    var yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
    if (yt) return 'https://www.youtube.com/embed/' + yt[1] + '?rel=0&enablejsapi=1' + comSom;

    var vimeo = url.match(/vimeo\.com\/(\d+)/);
    if (vimeo) return 'https://player.vimeo.com/video/' + vimeo[1] + '?' + (autoplay === false ? '' : 'autoplay=1');

    return null;
  }

  window.VulpesHelpers = { escapar: escapar, midiaHTML: midiaHTML, urlDeEmbed: urlDeEmbed };
})();
