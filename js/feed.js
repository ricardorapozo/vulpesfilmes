/* Monta feeds de projetos a partir de window.PROJETOS: a home (todos os
   projetos, em #conteudo) e, nas páginas de diretor, a galeria filtrada por
   `diretor` (em .galeria[data-diretor]). A alternância é contada em cada
   feed independentemente, e não com :nth-child(even), para que cada
   projeto consuma um turno, inclusive o carrossel.

   V11: todo projeto com `galeria` não vazia vira carrossel no feed
   automaticamente, não importa o `tipo` salvo em projetos.json — a galeria
   pra página do projeto e o carrossel do feed passam a ser a mesma fonte
   de dado. Quando o projeto também tem um loop ambiente (`midia[0].loop`),
   ele entra como primeiro slide do carrossel, na frente das fotos. */

(function () {
  var escapar = window.VulpesHelpers.escapar;
  var midiaHTML = window.VulpesHelpers.midiaHTML;

  function slidesDoCarrossel(p) {
    if (p.galeria && p.galeria.length) {
      var slides = [];
      if (p.midia && p.midia[0] && p.midia[0].loop) slides.push(p.midia[0]);
      p.galeria.forEach(function (foto) {
        slides.push({ loop: '', poster: foto.src, alt: foto.alt });
      });
      return slides;
    }
    return p.midia;
  }

  function blocoHTML(p, lado) {
    var carrossel = p.tipo === 'carousel' || (p.galeria && p.galeria.length > 0);
    var classe = 'block block--' + lado;
    var titulo = escapar(p.titulo).split('\n').join('<br>');
    var nome = escapar(p.titulo.replace(/\n/g, ' '));
    var link = 'projeto.html?slug=' + escapar(p.slug);
    var html = '';

    html += '<article class="' + classe + '" data-registro="' + p.registro + '">';
    html +=   '<div class="block__main">';
    html +=     '<h2 class="title"><a href="' + link + '">' + titulo + '</a></h2>';

    if (carrossel) {
      html += '<div class="media media--carousel">';
      html +=   '<button class="arrow arrow--prev" aria-label="Item anterior da galeria" hidden>&#8592;</button>';
      html +=   '<div class="track">';
      slidesDoCarrossel(p).forEach(function (m) {
        html += '<div class="slide" style="--placeholder:' + escapar(p.placeholder) + '">';
        if (m.loop) {
          /* Slide de vídeo: clique abre o vídeo de verdade no modal —
             mesmo alvo invisível de .media__play, sem ícone (V8). */
          if (p.video) {
            html += '<button class="media__play" data-video="' + escapar(p.video) + '" aria-label="Assistir vídeo de ' + nome + '"></button>';
          }
        } else {
          /* Slide de foto: clique abre a página do projeto, igual ao título. */
          html += '<a class="slide__link" href="' + link + '" aria-label="Abrir projeto ' + nome + '"></a>';
        }
        html += midiaHTML(m, p.placeholder) + '</div>';
      });
      html +=   '</div>';
      html +=   '<button class="arrow arrow--next" aria-label="Próximo item da galeria">&#8594;</button>';
      html += '</div>';
    } else {
      html += '<div class="media" style="--placeholder:' + p.placeholder + '">';
      /* Sem ícone de play (V8): a mídia inteira vira o alvo de clique,
         sem indicação visual — só quando o projeto tem vídeo de verdade. */
      if (p.video) {
        html += '<button class="media__play" data-video="' + escapar(p.video) + '" aria-label="Assistir vídeo de ' + nome + '"></button>';
      }
      html += midiaHTML(p.midia[0], p.placeholder) + '</div>';
    }

    html +=   '</div>';
    html += '</article>';
    return html;
  }

  function render(lista, alvo) {
    var lado = 'left';
    var html = '';
    lista.forEach(function (p) {
      html += blocoHTML(p, lado);
      lado = (lado === 'left') ? 'right' : 'left';
    });
    alvo.innerHTML = html;
    document.dispatchEvent(new CustomEvent('feed:pronto'));
  }

  document.addEventListener('projetos:pronto', function () {
    /* Home: só se #conteudo existir vazio e não for uma página de diretor —
       time.html reaproveita #conteudo com blocos de pessoa escritos à mão. */
    var feed = document.getElementById('conteudo');
    if (feed && !feed.hasAttribute('data-diretor-page') && !feed.children.length) {
      render(window.PROJETOS, feed);
    }

    /* Página de diretor: galeria derivada por filtro, nunca lista escrita à mão. */
    var galeria = document.querySelector('.galeria[data-diretor]');
    if (galeria) {
      var slug = galeria.getAttribute('data-diretor');
      var lista = window.PROJETOS.filter(function (p) { return p.diretor.indexOf(slug) !== -1; });
      render(lista, galeria);
    }
  });
})();
