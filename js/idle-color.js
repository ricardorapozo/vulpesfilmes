/* V1.8: efeito de cor cobre a página inteira depois de 30s parada, sai
   assim que o mouse volta a se mover. Reaproveita a MESMA classe
   `is-overlay-open` que os painéis já usam (fundo + overlay de cor nas
   mídias, seção 2 do PROJETO.md) — só ativa se nenhum painel de
   verdade já estiver aberto, e só desativa o que ela mesma ligou, pra
   não brigar com `js/panel.js` (que também controla essa classe
   quando um painel abre/fecha).

   V1.18.6: também não ativa enquanto um vídeo "de verdade" está
   tocando (autoplay da página de projeto, slide de vídeo do lightbox,
   ou o modal aberto pela mídia ambiente) — pedido explícito: "quando
   o vídeo dá play... entra o efeito de cor" era uma interrupção
   incômoda de quem está assistindo. `js/video-real.js` detecta esse
   estado (não inclui o loop mudo do feed/carrossel — esse continua
   tocando e não segura o efeito, por pedido explícito também) e
   dispara `video-real:mudou` toda vez que muda; aqui só reage a esse
   evento chamando `reiniciar()` — mesmo tratamento que um `mousemove`
   já dava: se o efeito estava ativo, desliga na hora; e recomeça a
   contagem de 30s do zero (tanto ao começar quanto ao parar de
   tocar — parar de assistir também não é "estar parado" ainda). */
(function () {
  var raiz = document.documentElement;
  var ESPERA = 30000;
  var timer = null;
  var ativo = false;

  function painelAberto() {
    return !!document.querySelector('.panel.is-open');
  }

  function videoRealTocando() {
    return !!(window.VulpesVideoReal && window.VulpesVideoReal.tocando());
  }

  function ativar() {
    if (painelAberto() || videoRealTocando()) return;
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
  document.addEventListener('video-real:mudou', reiniciar);
  timer = setTimeout(ativar, ESPERA);
})();
