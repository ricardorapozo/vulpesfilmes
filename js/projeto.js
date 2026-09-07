/* Página individual de projeto (projeto.html?slug=<slug>): lê o slug da
   URL, busca em window.PROJETOS e monta título + vídeo (mídia clicável
   abre o modal, sem ícone) + galeria de fotos. Mesmo princípio dos outros
   feeds: nada escrito à mão, tudo derivado do projetos.json.

   Título e mídia ficam juntos dentro de `.block__main` (V9), igual à home:
   é esse agrupamento que limita o alcance do `position: sticky` do título
   à altura do próprio par título+mídia (ver "Título preso no scroll" no
   PROJETO.md) — rolando a mídia cobre o título, mas o título não continua
   "grudado" por cima da galeria de fotos depois, porque ela fica fora de
   `.block__main`, como um item irmão. */
(function () {
  var main = document.getElementById('conteudo-projeto');
  if (!main) return;

  var escapar = window.VulpesHelpers.escapar;
  var midiaHTML = window.VulpesHelpers.midiaHTML;

  function render() {
    var slug = new URLSearchParams(location.search).get('slug');
    var p = (window.PROJETOS || []).find(function (item) { return item.slug === slug; });

    if (!p) {
      main.innerHTML = '<p class="feed__erro">Projeto não encontrado.</p>';
      document.dispatchEvent(new CustomEvent('feed:pronto'));
      return;
    }

    var nome = p.titulo.replace(/\n/g, ' ');
    document.title = nome + ' — vulpesfilmes';
    var titulo = escapar(p.titulo).split('\n').join('<br>');

    var html = '<article class="block bloco-projeto" data-registro="' + p.registro + '">';
    html +=   '<div class="block__main">';
    html +=     '<h1 class="title">' + titulo + '</h1>';
    html +=     '<div class="media" style="--placeholder:' + escapar(p.placeholder) + '">';
    if (p.video) {
      html +=       '<button class="media__play" data-video="' + escapar(p.video) + '" aria-label="Assistir vídeo de ' + escapar(nome) + '"></button>';
    }
    html +=       midiaHTML(p.midia[0], p.placeholder);
    html +=     '</div>';
    html +=   '</div>';

    if (p.galeria && p.galeria.length) {
      html += '<div class="galeria-fotos">';
      p.galeria.forEach(function (foto, i) {
        var alt = foto.alt || (nome + ', foto ' + (i + 1));
        html += '<div class="galeria-fotos__item"><img src="' + escapar(foto.src) + '" alt="' + escapar(alt) + '" loading="lazy"></div>';
      });
      html += '</div>';
    }

    html += '</article>';
    main.innerHTML = html;
    document.dispatchEvent(new CustomEvent('feed:pronto'));
  }

  document.addEventListener('projetos:pronto', render);
})();
