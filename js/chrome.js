/* Chrome: logo, hambúrguer, painéis e rodapé injetados em todas as páginas.
   Este arquivo gerencia a injeção de elementos comuns. */
(function () {
  var chrome = {
    /* Logo, hambúrguer, skip link */
    header: function () {
      var frag = document.createDocumentFragment();
      
      var skip = document.createElement('a');
      skip.className = 'skip';
      skip.href = '#conteudo';
      skip.textContent = 'Pular para o conteúdo';
      frag.appendChild(skip);
      
      var logo = document.createElement('a');
      logo.className = 'logo';
      logo.href = './';
      logo.textContent = 'vulpesfilmes';
      frag.appendChild(logo);
      
      var burger = document.createElement('button');
      burger.className = 'burger';
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-controls', 'menu');
      burger.setAttribute('aria-label', 'Abrir menu');
      for (var i = 0; i < 3; i++) {
        var span = document.createElement('span');
        burger.appendChild(span);
      }
      frag.appendChild(burger);
      
      return frag;
    },

    /* Menu de navegação */
    menu: function () {
      var nav = document.createElement('nav');
      nav.id = 'menu';
      nav.className = 'panel panel--menu';
      nav.setAttribute('aria-label', 'Navegação principal');
      nav.setAttribute('aria-hidden', 'true');
      
      var ul = document.createElement('ul');
      
      var liPortfolio = document.createElement('li');
      var aPortfolio = document.createElement('a');
      aPortfolio.href = './';
      aPortfolio.textContent = 'Projetos';
      liPortfolio.appendChild(aPortfolio);
      ul.appendChild(liPortfolio);
      
      var liDirectors = document.createElement('li');
      var btnDirectors = document.createElement('button');
      btnDirectors.className = 'menu-toggle';
      btnDirectors.setAttribute('aria-expanded', 'false');
      btnDirectors.setAttribute('aria-controls', 'submenu-diretores');
      btnDirectors.textContent = 'Diretores';
      liDirectors.appendChild(btnDirectors);

      var back = document.createElement('button');
      back.className = 'submenu-back';
      back.type = 'button';
      back.textContent = 'voltar';
      liDirectors.appendChild(back);
      
      var submenu = document.createElement('ul');
      submenu.id = 'submenu-diretores';
      submenu.className = 'submenu';
      submenu.hidden = true;
      
      var liRicardo = document.createElement('li');
      var aRicardo = document.createElement('a');
      aRicardo.href = 'ricardo-rapozo.html';
      aRicardo.textContent = 'Ricardo Rapozo';
      liRicardo.appendChild(aRicardo);
      submenu.appendChild(liRicardo);
      
      var liDaniela = document.createElement('li');
      var aDaniela = document.createElement('a');
      aDaniela.href = 'daniela-luquini.html';
      aDaniela.textContent = 'Daniela Luquini';
      liDaniela.appendChild(aDaniela);
      submenu.appendChild(liDaniela);
      
      liDirectors.appendChild(submenu);
      ul.appendChild(liDirectors);
      
      var liAbout = document.createElement('li');
      var aAbout = document.createElement('a');
      aAbout.href = '#quem-somos';
      aAbout.setAttribute('data-abre', 'quem-somos');
      aAbout.textContent = 'Quem somos';
      liAbout.appendChild(aAbout);
      ul.appendChild(liAbout);
      
      var liContact = document.createElement('li');
      var aContact = document.createElement('a');
      aContact.href = '#contato';
      aContact.setAttribute('data-abre', 'contato');
      aContact.textContent = 'Contato';
      liContact.appendChild(aContact);
      ul.appendChild(liContact);
      
      nav.appendChild(ul);
      
      var social = document.createElement('p');
      social.className = 'social';
      social.innerHTML = '<a href="#">vimeo</a><span aria-hidden="true">/</span><a href="#">instagram</a><span aria-hidden="true">/</span><a href="#">youtube</a>';
      nav.appendChild(social);
      
      return nav;
    },

    /* Painel "Quem somos" */
    about: function () {
      var section = document.createElement('section');
      section.id = 'quem-somos';
      section.className = 'panel panel--about';
      section.setAttribute('aria-label', 'Quem somos');
      
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'close';
      btn.setAttribute('data-fecha', '');
      btn.textContent = 'fechar';
      section.appendChild(btn);
      
      var content = document.createElement('div');
      content.className = 'about-content';

      var logo = document.createElement('img');
      logo.className = 'about-content__logo';
      logo.src = 'media/vulpesFilmes-LOGO-HORIZONTAL.png';
      logo.alt = 'vulpesfilmes';
      logo.width = 1791;
      logo.height = 772;
      content.appendChild(logo);

      var prose = document.createElement('div');
      prose.className = 'prose';
      prose.innerHTML = '<p>A Vulpes é um pequeno bureau de soluções audiovisuais. Um lugar para pensar, criar e dar forma a ideias.</p><p>Trabalhamos onde estratégia encontra imagem: na direção, no roteiro, na edição, no motion e na pós-produção. Entramos no projeto conforme o que ele pede, juntando olhar criativo, repertório e precisão técnica para transformar uma boa ideia em algo que realmente mereça ser visto.</p>';
      content.appendChild(prose);

      section.appendChild(content);

      return section;
    },

    /* Card "Contato" */
    contact: function () {
      var section = document.createElement('section');
      section.id = 'contato';
      section.className = 'panel panel--contact';
      section.setAttribute('aria-label', 'Contato');
      section.setAttribute('role', 'dialog');
      section.setAttribute('aria-modal', 'true');

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'close';
      btn.setAttribute('data-fecha', '');
      btn.textContent = 'fechar';
      section.appendChild(btn);

      var card = document.createElement('div');
      card.className = 'contact-card';
      card.innerHTML = '<p class="contact-card__local">São Paulo, Brasil</p>' +
        '<p class="contact-card__item"><a href="mailto:contato@vulpesfilmes.com.br">contato@vulpesfilmes.com.br</a></p>' +
        '<p class="contact-card__item"><a href="tel:+5511994780379">+55 11 994780379</a></p>';
      section.appendChild(card);

      return section;
    },

    /* Modal de vídeo (ver js/video-modal.js) */
    videoModal: function () {
      var div = document.createElement('div');
      div.id = 'video-modal';
      div.className = 'video-modal';
      div.setAttribute('aria-hidden', 'true');
      div.setAttribute('role', 'dialog');
      div.setAttribute('aria-modal', 'true');
      div.setAttribute('aria-label', 'Vídeo do projeto');
      div.inert = true;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'video-modal__close';
      btn.textContent = 'fechar';
      div.appendChild(btn);

      var frame = document.createElement('div');
      frame.className = 'video-modal__frame';
      div.appendChild(frame);

      return div;
    },

    /* Rodapé */
    footer: function () {
      var footer = document.createElement('footer');
      footer.innerHTML = '<p>&copy; 2026 vulpesfilmes</p><p><a href="mailto:contato@vulpesfilmes.com">contato@vulpesfilmes.com</a></p><p>São Paulo / Brasil. Atendendo o mundo todo.</p>';
      return footer;
    },

    /* Injetar tudo no documento */
    inject: function () {
      var body = document.body;
      
      /* Injetar header no topo */
      body.insertBefore(this.header(), body.firstChild);
      
      /* Injetar menu, about, contato e modal de vídeo no fim */
      body.appendChild(this.menu());
      body.appendChild(this.about());
      body.appendChild(this.contact());
      body.appendChild(this.videoModal());
      
      /* Injetar rodapé antes do menu */
      var main = document.getElementById('conteudo');
      if (main && main.nextSibling) {
        body.insertBefore(this.footer(), this.menu());
      } else {
        body.insertBefore(this.footer(), body.querySelector('#menu'));
      }
    }
  };

  chrome.inject();
  document.dispatchEvent(new CustomEvent('chrome:pronto'));
})();
