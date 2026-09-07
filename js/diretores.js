/* Dados dos diretores. */
(function () {
  window.DIRETORES = [
    {
      slug: 'ricardo-rapozo',
      nome: 'Ricardo Rapozo',
      retrato: 'media/time/ricardo-rapozo.jpg',
      bio: [
        'A memória é um espaço em disputa. É por isso que escolhi trabalhar com narrativas.',
        'Minha trajetória começou na televisão, no fim dos anos noventa, e atravessou quase três décadas de audiovisual entre publicidade, documentários, televisão e projetos autorais. Nesse percurso passei pela ilha de edição, pela direção, pela preparação de atores, pelo motion design e pela pós-produção.',
        'Nunca enxerguei essas áreas como disciplinas isoladas. Todas respondem à mesma pergunta: como uma ideia ganha forma, ritmo e significado?',
        'Hoje desenvolvo projetos do conceito ao acabamento final. Pesquisa, roteiro, direção, montagem, animação e finalização fazem parte do mesmo processo criativo. O movimento é a consequência de uma estrutura bem construída. Imagens são os moldes de nossas lembranças.'
      ]
    },
    {
      slug: 'daniela-luquini',
      nome: 'Daniela Luquini',
      retrato: 'media/time/daniela-luquini.jpg',
      bio: [
        'Based in the UK, I am a photographer focused on capturing authentic moments, people and stories with a natural, contemporary approach.',
        'Over the past ten years, I have built a diverse international portfolio across corporate events, fashion, culture, art and content, always looking beyond the subject itself to capture the atmosphere, emotion and character of each project.',
        'My work has taken me to prestigious events around the world, including COP – United Nations Climate Change Conferences, London Fashion Week, TEFAF Maastricht, Milano Design Week, ITB Berlin and WTM London.',
        'I believe the strongest images come from genuine connections, collaboration and making people feel at ease. My aim is not simply to document an occasion, but to create imagery that feels human, tells a story and offers a distinct perspective on each project.'
      ]
    }
  ];
  document.dispatchEvent(new CustomEvent('diretores:pronto'));
})();
