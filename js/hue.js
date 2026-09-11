/* Sorteia a cor da sessão.
   Todas de luminância média-alta: o texto sobre elas é sempre preto —
   tanto no overlay das mídias (mix-blend-mode: multiply, V1.17.3)
   quanto no fundo do rodapé (sempre nessa cor, V1.17.3, ver
   PROJETO.md seção 2 "Rodapé"). Um tom escuro quebraria os dois. */

(function () {
  var HUES = ['#EE7B85', '#E9D64A', '#7BC96F', '#7FB2E5', '#F2913F', '#B9A3E3'];

  var anterior = null;
  try { anterior = sessionStorage.getItem('vulpes:hue'); } catch (e) {}

  var pool = HUES.filter(function (c) { return c !== anterior; });
  var cor = pool[Math.floor(Math.random() * pool.length)];

  try { sessionStorage.setItem('vulpes:hue', cor); } catch (e) {}

  document.documentElement.style.setProperty('--hue', cor);
})();
