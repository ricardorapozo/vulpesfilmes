/* V1.8: efeito de cor cobre a página inteira depois de 30s parada, sai
   assim que o mouse volta a se mover. Reaproveita a MESMA classe
   `is-overlay-open` que os painéis já usam (fundo + duotone nas
   mídias, seção 2 do PROJETO.md) — só ativa se nenhum painel de
   verdade já estiver aberto, e só desativa o que ela mesma ligou, pra
   não brigar com `js/panel.js` (que também controla essa classe
   quando um painel abre/fecha). */
(function () {
  var raiz = document.documentElement;
  var ESPERA = 30000;
  var timer = null;
  var ativo = false;

  function painelAberto() {
    return !!document.querySelector('.panel.is-open');
  }

  function ativar() {
    if (painelAberto()) return;
    raiz.classList.add('is-overlay-open');
    ativo = true;
  }

  function desativar() {
    if (!ativo) return;
    raiz.classList.remove('is-overlay-open');
    ativo = false;
  }

  function reiniciar() {
    desativar();
    clearTimeout(timer);
    timer = setTimeout(ativar, ESPERA);
  }

  document.addEventListener('mousemove', reiniciar);
  timer = setTimeout(ativar, ESPERA);
})();
