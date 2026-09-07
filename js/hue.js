/* Sorteia a cor da sessão.
   Todas de luminância média-alta: o texto sobre elas é sempre preto,
   e no duotone (mix-blend-mode: darken) a cor define o teto dos claros —
   um tom escuro fecharia a imagem inteira. */

(function () {
  var HUES = ['#EE7B85', '#E9D64A', '#7BC96F', '#7FB2E5', '#F2913F', '#B9A3E3'];

  var anterior = null;
  try { anterior = sessionStorage.getItem('vulpes:hue'); } catch (e) {}

  var pool = HUES.filter(function (c) { return c !== anterior; });
  var cor = pool[Math.floor(Math.random() * pool.length)];

  try { sessionStorage.setItem('vulpes:hue', cor); } catch (e) {}

  document.documentElement.style.setProperty('--hue', cor);
})();
