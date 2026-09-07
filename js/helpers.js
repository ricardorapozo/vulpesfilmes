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

  window.VulpesHelpers = { escapar: escapar, midiaHTML: midiaHTML };
})();
