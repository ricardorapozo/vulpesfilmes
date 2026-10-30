/* Carrega o conteúdo editorial de projetos.json.

   V1.4: a ordem do feed (home e galeria de diretor, ambos em
   js/feed.js) é sempre pela data de postagem, mais recente primeiro —
   não mais a ordem em que os objetos aparecem no arquivo. Todo projeto
   tem um campo `data` (`"AAAA-MM-DD"`); comparar como string funciona
   porque o formato ISO já ordena igual à ordem cronológica. Um projeto
   novo sem `data` preenchida cai por último no sort (`undefined` fica
   "menor" que qualquer string de data) — o oposto do que a regra pede
   ("sempre o primeiro, a não ser que se especifique uma data"), então
   na prática todo projeto novo precisa vir com `data` já preenchida
   (a de hoje, se não houver outra) pra entrar como o mais recente. */
(function () {
  fetch('projetos.json')
    .then(function (resposta) {
      if (!resposta.ok) throw new Error('Não foi possível carregar projetos.json');
      return resposta.json();
    })
    .then(function (projetos) {
      projetos.sort(function (a, b) { return (b.data || '').localeCompare(a.data || ''); });
      window.PROJETOS = projetos;
      /* V1.21: só avisa depois que todos os <script> da página rodaram.
         O fetch começa aqui, antes de feed.js/projeto.js (que ouvem
         `projetos:pronto`) e de media.js/carousel-infinite.js
         (que ouvem o `feed:pronto` disparado em
         seguida). Com rede lenta, ou um desses arquivos demorando a
         baixar, o JSON chegava primeiro, o aviso saía sem ninguém
         ouvindo e a página ficava vazia (galeria de diretor, página de
         projeto) até recarregar. DOMContentLoaded só dispara depois do
         último <script> síncrono do body, então todo mundo já está
         ouvindo. */
      function avisar() { document.dispatchEvent(new CustomEvent('projetos:pronto')); }
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', avisar);
      else avisar();
    })
    .catch(function (erro) {
      console.error(erro);
      var feed = document.getElementById('conteudo');
      if (feed) feed.innerHTML = '<p class="feed__erro">Não foi possível carregar os projetos.</p>';
    });
})();
