/* Cloudflare Pages Function — roda na borda, antes de servir os
   arquivos estáticos do site (Deploy: Cloudflare Pages, sem build,
   ver PROJETO.md seção 12, "0.17" / changelog do primeiro deploy).

   Pedido: "quando eu compartilho um PROJETO... o card de preview que
   aparece é o previewVulpes.jpg. É possível utilizar o poster de cada
   PROJETO?" `projeto.html` é um template único — as tags `og:image`/
   `og:title`/`og:description`/`og:url` são ESTÁTICAS no HTML, e quem
   troca `document.title`/monta a página pelo `slug` é `js/projeto.js`,
   que crawlers de link preview (WhatsApp, Twitter/X, Facebook, Slack)
   não executam — eles só leem o HTML como veio do servidor (limite já
   catalogado no PROJETO.md, seção 10, "Limite conhecido", antes desta
   versão). Esta function reescreve essas tags na borda, com dados
   REAIS de `projetos.json`, pra QUALQUER visita a `/projeto` — não só
   pra crawlers, não dá pra distinguir um do outro sem sniff de
   User-Agent, e servir a tag certa pra um visitante de verdade também
   não tem contra-indicação nenhuma. Só `/projeto`, sem o `.html`: o
   próprio Cloudflare Pages redireciona `/projeto.html?slug=X` pra
   `/projeto?slug=X` (308, "clean URLs") ANTES desta function rodar —
   confirmado via `wrangler pages dev` local, a forma com `.html`
   nunca chega até aqui.

   Passa direto (`next()`, sem reescrever nada) pra qualquer outra
   rota do site — home, páginas de diretor, `time.html`, mídia, CSS/JS
   — o middleware roda em TODA requisição por padrão, então a guarda
   de pathname no topo é o que mantém o resto do site intocado. */

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  if (url.pathname !== '/projeto') {
    return next();
  }

  const slug = url.searchParams.get('slug');
  const response = await next();
  if (!slug) return response;

  let projeto;
  try {
    const dadosRes = await env.ASSETS.fetch(new URL('/projetos.json', url));
    if (!dadosRes.ok) return response;
    const projetos = await dadosRes.json();
    projeto = projetos.find(function (p) { return p.slug === slug; });
  } catch (erro) {
    return response;
  }
  if (!projeto) return response;

  var nome = projeto.titulo.replace(/\n/g, ' ');
  var tituloCompleto = nome + ' — vulpesfilmes';
  var descricao = (projeto.midia && projeto.midia[0] && projeto.midia[0].alt) || null;

  /* Poster por projeto (V1.14+, ver Pendências no PROJETO.md): alguns
     projetos ainda não têm arquivo de poster, só o campo vazio no
     JSON, ou o campo aponta pra um arquivo que ainda não existe no
     repo — confere de verdade com um fetch antes de trocar a tag,
     senão o card de preview quebraria pra esses projetos em vez de
     continuar mostrando o genérico (pior do que o problema original).
     `.ok` sozinho não basta: o Cloudflare Pages (confirmado via
     `wrangler pages dev`) responde um arquivo QUE NÃO EXISTE com
     `200` + o fallback de SPA (`index.html`), não um `404` de
     verdade — só o `Content-Type` denuncia (`text/html` em vez de
     `image/*`) que aquilo não é a imagem pedida. */
  var posterUrl = null;
  var posterCaminho = projeto.midia && projeto.midia[0] && projeto.midia[0].poster;
  if (posterCaminho) {
    try {
      var posterRes = await env.ASSETS.fetch(new URL('/' + posterCaminho, url));
      var tipo = posterRes.headers.get('content-type') || '';
      if (posterRes.ok && tipo.indexOf('image/') === 0) {
        posterUrl = new URL('/' + posterCaminho, url).toString();
      }
    } catch (erro) {
      posterUrl = null;
    }
  }

  class ReescreverMeta {
    element(el) {
      var chave = el.getAttribute('property') || el.getAttribute('name');
      if (chave === 'og:title' || chave === 'twitter:title') {
        el.setAttribute('content', tituloCompleto);
      } else if (chave === 'description' || chave === 'og:description' || chave === 'twitter:description') {
        if (descricao) el.setAttribute('content', descricao);
      } else if (chave === 'og:url') {
        el.setAttribute('content', url.toString());
      } else if (chave === 'og:image' || chave === 'twitter:image') {
        if (posterUrl) el.setAttribute('content', posterUrl);
      } else if (posterUrl && (chave === 'og:image:width' || chave === 'og:image:height')) {
        /* Dimensão do preview genérico (1200×630) não vale pro poster
           real — cada um tem sua própria proporção. Remove em vez de
           mentir um valor errado; crawler mede a imagem sozinho. */
        el.remove();
      }
    }
  }

  class ReescreverTitle {
    element(el) {
      el.setInnerContent(tituloCompleto);
    }
  }

  return new HTMLRewriter()
    .on('meta', new ReescreverMeta())
    .on('title', new ReescreverTitle())
    .transform(response);
}
