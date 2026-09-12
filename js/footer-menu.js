/* V1.18: os itens do menu principal (Projetos/Diretores/Quem somos/
   Contato/Instagram) passam a existir também no rodapé — pedido
   explícito, com dois comportamentos específicos pra essa cópia:

   "Projetos" (ao clicar, volta a página pra cima): nas outras 3
   páginas o link se comporta normal (`href="./"`, navega pra home);
   só quando JÁ estamos na home é que precisa de JS — sem isso, clicar
   recarregaria a própria página à toa. Comparo o `pathname` resolvido
   do link com o da página atual (ambos sem o `index.html` final, pra
   "/", "/index.html" contarem como o mesmo endereço) — só intercepto
   quando são o mesmo lugar.

   "Diretores" vira um `<button data-abre="menu">` (não link — não
   existe destino de navegação, só abre o painel; mesmo raciocínio do
   `.menu-toggle` da nav de verdade, que também é botão). `js/panel.js`
   já sabe abrir `#menu` sozinho via `[data-abre]` (script carregado
   ANTES deste aqui, ver ordem das tags <script> no HTML — importa,
   porque dependo do painel já estar aberto quando meu listener roda,
   os dois escutam o mesmo clique no mesmo elemento). Só falta expandir
   o submenu Ricardo/Daniela, que normalmente pede um segundo clique em
   ".menu-toggle" dentro do painel — simulo esse clique (reaproveita a
   lógica de `js/panel.js` inteira, sem duplicar nada daqui). */
(function () {
  document.querySelectorAll('.rodape-projetos').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var aqui = location.pathname.replace(/index\.html$/, '');
      var alvo = new URL(a.href, location.href).pathname.replace(/index\.html$/, '');
      if (aqui === alvo) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  document.querySelectorAll('.rodape-diretores').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var toggle = document.querySelector('.menu-toggle');
      if (toggle && toggle.getAttribute('aria-expanded') !== 'true') toggle.click();
    });
  });
})();
