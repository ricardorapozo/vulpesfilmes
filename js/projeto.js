/* Página individual de projeto (projeto.html?slug=<slug>): lê o slug da
   URL, busca em window.PROJETOS e monta a página. Mesmo princípio dos
   outros feeds: nada escrito à mão, tudo derivado do projetos.json.

   V1.6: reformulada por completo, a partir de referência visual — em vez
   do título grande + mídia ambiente clicável (que abria o vídeo de
   verdade num modal), a página agora é uma barra fixa no topo
   ("Diretor: Título") e o vídeo de verdade tocando direto, sem clique
   nenhum no meio do caminho. `js/video-modal.js` continua existindo e
   sendo usado — é o que ainda abre o vídeo a partir da mídia ambiente
   na home e na galeria de diretor — só a página do PRÓPRIO projeto parou
   de depender dele. `urlDeEmbed()` (conversão de link de YouTube/Vimeo
   pra URL de embed) foi promovida de `js/video-modal.js` pra
   `js/helpers.js` porque agora os dois arquivos precisam dela.

   V1.6 (patch): a galeria de fotos (`.galeria-fotos`) volta, abaixo do
   vídeo, quando o projeto tem `galeria` não vazia — `js/photo-modal.js`
   também volta a ser carregado (ver `projeto.html`). Fundo do lightbox
   trocado de preto de cinema pra branco (`css/base.css`, `.photo-modal`
   — `.galeria-fotos` só existe nessa página, então a regra muda direto
   na base, sem precisar de modificador).

   V1.6 (patch): `.projeto-barra` virou HTML estático em `projeto.html`
   (`#projeto-barra`), irmã de `<main>` e de `.projeto-voltar` dentro de
   `.projeto-corpo`, em vez de nascer dentro do `html` que este arquivo
   escreve em `main.innerHTML`. `render()` continua preenchendo o
   CONTEÚDO dela, só que via `barra.innerHTML = ...` em vez de
   concatenar no `html` de `<main>` — a posição em si é CSS puro.
   Precisou sair de dentro de `<main>` porque no mobile ela
   ganhou o mesmo truque de `position: sticky` limitado pelo rodapé que
   `.projeto-voltar` já usa (ver PROJETO.md, seção 6) — esse truque
   exige que o elemento seja filho direto de `.projeto-corpo`, não
   neto. */
(function () {
  var main = document.getElementById('conteudo-projeto');
  if (!main) return;

  var barra = document.getElementById('projeto-barra');

  var escapar = window.VulpesHelpers.escapar;
  var urlDeEmbed = window.VulpesHelpers.urlDeEmbed;

  /* Iframe (YouTube/Vimeo, com autoplay) quando dá pra converter o link;
     senão (mp4 local) um <video> de verdade, com controles — mesma
     bifurcação que `js/video-modal.js` já fazia dentro do modal.

     Com som, de propósito (patch — pedido explícito: "quando entramos
     na página e o vídeo dá autoplay ele VEM COM SOM ATIVADO"). Sem
     `mute`/`muted` na URL/atributo, o navegador tenta autoplay com som
     — atenção, é só a intenção do código: a política de autoplay de
     cada navegador decide se aceita ou não (geralmente aceita se o
     domínio já tem "engajamento de mídia" suficiente pro visitante; se
     não aceitar, o navegador recusa o autoplay silenciosamente ou o
     player entra pausado — não é algo que dá pra forçar daqui). */
  function videoHTML(p, nome) {
    if (!p.video) return '';
    var embed = urlDeEmbed(p.video);
    if (embed) {
      return '<iframe src="' + escapar(embed) + '" title="Vídeo de ' + escapar(nome) + '" ' +
             'allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen loading="eager"></iframe>';
    }
    return '<video src="' + escapar(p.video) + '" controls autoplay playsinline></video>';
  }

  function render() {
    var slug = new URLSearchParams(location.search).get('slug');
    var p = (window.PROJETOS || []).find(function (item) { return item.slug === slug; });

    if (!p) {
      document.documentElement.classList.remove('is-projeto-sem-galeria');
      main.innerHTML = '<p class="feed__erro">Projeto não encontrado.</p>';
      document.dispatchEvent(new CustomEvent('feed:pronto'));
      return;
    }

    /* V1.10: sem galeria, a página vira "só o player" — vídeo enchendo
       a viewport, sem rolagem, sem rodapé, botão "fechar" no lugar do
       burger (ver css/layout.css, `html.is-projeto-sem-galeria`). Com
       galeria, mantém o esquema de sempre (rolagem normal, burger,
       galeria de fotos abaixo do vídeo). */
    document.documentElement.classList.toggle('is-projeto-sem-galeria', !(p.galeria && p.galeria.length));

    var nome = p.titulo.replace(/\n/g, ' ');
    document.title = nome + ' — vulpesfilmes';

    /* `p.diretor` é um array (V1.8.1, suporte a co-direção) — pode ter
       1 ou mais slugs. Nomes juntados com ", " entre os do meio e
       " e " antes do último, pro caso de mais de um diretor. */
    var diretores = (p.diretor || []).map(function (slug) {
      return (window.DIRETORES || []).find(function (d) { return d.slug === slug; });
    }).filter(Boolean);

    if (barra) {
      var barraHTML = '';
      if (diretores.length) {
        var links = diretores.map(function (d) {
          return '<a href="' + escapar(d.slug) + '.html">' + escapar(d.nome) + '</a>';
        });
        barraHTML += (links.length > 1
          ? links.slice(0, -1).join(', ') + ' e ' + links[links.length - 1]
          : links[0]) + ': ';
      }
      barraHTML += escapar(nome);
      barra.innerHTML = barraHTML;
    }

    var html = '<div class="projeto-video">' + videoHTML(p, nome) + '</div>';

    if (p.galeria && p.galeria.length) {
      html += '<div class="galeria-fotos">';
      p.galeria.forEach(function (foto, i) {
        var alt = foto.alt || (nome + ', foto ' + (i + 1));
        html += '<div class="galeria-fotos__item"><img src="' + escapar(foto.src) + '" alt="' + escapar(alt) + '" loading="lazy"></div>';
      });
      html += '</div>';
    }

    main.innerHTML = html;
    document.dispatchEvent(new CustomEvent('feed:pronto'));
  }

  document.addEventListener('projetos:pronto', render);
})();
