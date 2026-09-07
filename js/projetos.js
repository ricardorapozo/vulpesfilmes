/* Carrega o conteúdo editorial de projetos.json. */
(function () {
  fetch('projetos.json')
    .then(function (resposta) {
      if (!resposta.ok) throw new Error('Não foi possível carregar projetos.json');
      return resposta.json();
    })
    .then(function (projetos) {
      window.PROJETOS = projetos;
      document.dispatchEvent(new CustomEvent('projetos:pronto'));
    })
    .catch(function (erro) {
      console.error(erro);
      var feed = document.getElementById('conteudo');
      if (feed) feed.innerHTML = '<p class="feed__erro">Não foi possível carregar os projetos.</p>';
    });
})();
