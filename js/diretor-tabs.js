/* Alterna entre as abas "trabalhos" e "bio" da página de diretor (V16),
   via hash da URL. Sem hash (ou hash inválido) mostra "trabalhos" — é a
   aba que abre ao clicar no diretor pelo submenu, já que os links de lá
   apontam pra página sem hash nenhum.

   Não depende de projetos:pronto/feed:pronto: o conteúdo das duas abas
   já existe no HTML (a de trabalhos é preenchida por feed.js depois,
   mas o painel em si já existe), só uma fica `hidden` por vez. */
(function () {
  var header = document.querySelector('.diretor-header');
  if (!header) return;

  var abas = Array.prototype.slice.call(header.querySelectorAll('.diretor-tabs a'));
  var paineis = {
    trabalhos: document.getElementById('tab-trabalhos'),
    bio: document.getElementById('tab-bio')
  };

  function mostrar() {
    var nome = (location.hash || '#trabalhos').slice(1);
    if (!paineis[nome]) nome = 'trabalhos';

    Object.keys(paineis).forEach(function (chave) {
      if (paineis[chave]) paineis[chave].hidden = chave !== nome;
    });

    abas.forEach(function (a) {
      if (a.getAttribute('data-tab') === nome) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });

    document.documentElement.classList.toggle('is-tab-bio', nome === 'bio');
    document.documentElement.classList.toggle('is-tab-trabalhos', nome === 'trabalhos');
  }

  window.addEventListener('hashchange', mostrar);
  mostrar();
})();
