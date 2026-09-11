# vulpesfilmes — documento do projeto

**Versão 1.11.** Site no ar em produção — `vulpesfilmes.com` é o domínio
principal, `vulpesfilmes.com.br` redireciona pra ele. Saiu do beta:
`0.01` até `0.17.1` foram o desenvolvimento antes do primeiro deploy;
daqui pra frente, mudanças pedidas em uma mesma leva viram uma versão
`1.1`, `1.2`, etc. — sem o prefixo `0.` (esse prefixo só existia pra
marcar que o site ainda não tinha ido ao ar; agora foi). Ver Changelog,
seção 12.

---

## 1. Princípio

A home não se apresenta. Ela entra direto no primeiro trabalho.
Não há manchete, não há "somos uma produtora", não há grade de thumbnails.
A página é uma coluna vertical de blocos grandes que alternam de lado.

Tudo é calado até o menu abrir. Aí a página inunda de cor e as imagens viram duotone.
Esse é o único momento barulhento do site, e ele só acontece a pedido do usuário.

---

## 2. Cor

### Estado base

| token | valor | uso |
|---|---|---|
| `--paper` | `#F7F6F4` | fundo da página |
| `--ink` | `#000000` | tipografia, ícones |
| `--ink-60` | `rgba(0,0,0,.6)` | metadados |
| `--panel-bg` | `#FFFFFF` | fundo do menu e quem somos |

Fundo é off-white, não branco puro. Consequência: nenhum elemento pode ser branco
puro, porque ele destaca do fundo. Vídeos com fundo claro precisam de atenção.

### Estado painel aberto

Vale para os três painéis do site — menu, quem somos e contato. Não é um
efeito do menu, é o efeito de qualquer painel aberto (**ou da página parada
por 30s, V1.8 — ver "Ativação por inatividade" no fim desta seção**). Classe
no `<html>`: `.is-overlay-open`.

Uma cor é sorteada e passa a valer como `--hue`. Ela ocupa o fundo inteiro
e vira o tom do duotone das mídias.

```js
const HUES = ['#EE7B85', '#E9D64A', '#7BC96F', '#7FB2E5', '#F2913F', '#B9A3E3'];
```

Regras da paleta:

- Todas as cores são de luminância média-alta. A tipografia sobre elas é sempre
  `--ink` preto, e todas passam 4.5:1 de contraste com preto. Nenhuma cor escura
  entra na lista, senão o texto quebra.
- Sorteio a cada carregamento de página. Guardar a última em `sessionStorage`
  e reamostrar se repetir — duas visitas seguidas na mesma cor matam o efeito.
- A cor é sorteada no carregamento, não na abertura do menu. Abrir e fechar o
  menu três vezes seguidas deve dar sempre a mesma cor dentro da mesma visita.

### Duotone

Aplicado às mídias apenas enquanto o menu está aberto.

```css
.media { position: relative; }

.media video,
.media img {
  filter: grayscale(1) contrast(1.3) brightness(.92);
  transition: filter .28s ease;
}

.media::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--hue);
  mix-blend-mode: darken;
  opacity: 0;
  transition: opacity .28s ease;
  pointer-events: none;
}

.is-overlay-open .media::after { opacity: 1; }
```

`darken` mantém as sombras pretas e limita os claros ao valor da cor — é o que
produz o alto contraste do mockup. `screen` ou `multiply` dariam resultado errado:
o primeiro lava as sombras, o segundo escurece tudo.

**Bug corrigido (patch): a cobertura vazava conforme o site crescia.**
O trecho acima é só pra `.media` — a classe do feed/carrossel original.
Cada versão que trouxe mídia com um container de classe diferente
(`.diretor-bio__foto`, a bio do diretor, V16; `.projeto-video`, o
vídeo de verdade da página de projeto, V1.6; `.galeria-fotos__item`, a
grade de fotos, V1.1) deixou essa mídia nova de fora do duotone sem
ninguém perceber, porque a regra nunca dava erro — só silenciosamente
não se aplicava. Pedido explícito depois de encontrarem o problema: "o
efeito de cor deve cobrir TODOS os elementos da página, inclusive as
fotos e vídeos. A única coisa que fica por cima é o menu, submenu,
quem somos e contato." Corrigido repetindo exatamente o mesmo par de
regras (`position:relative` + `::after` + filtro) pros três
containers que faltavam — ver `css/layout.css`, logo depois do bloco
de `.media` acima, com um comentário listando os quatro lugares.

**Ficam de fora, de propósito, não por descuido:** o menu (texto, sem
mídia nenhuma dentro), os painéis "quem somos" (`.about-content__logo`)
e "contato" (sem mídia), e os dois lightboxes — modal de vídeo e de
fotos. Os lightboxes não são um esquecimento: eles já são sistemas com
fundo próprio, deliberadamente fora da cor da sessão desde que existem
(ver seção 6, "Modal de vídeo") — o mesmo princípio de "quem somos"/
"contato" ficarem por cima, só que documentado num lugar diferente.

**Se um container de mídia novo aparecer numa versão futura**, ele
precisa entrar nessa lista também — não existe um mecanismo que
detecta mídia nova automaticamente; é uma cobertura por enumeração, e
esse bug é a prova de que esquecer de atualizá-la é fácil.

No estado base o `filter` fica desligado (`filter: none`), então as mídias
aparecem em cor cheia.

### Ativação por inatividade (V1.8)

"Quando a página ficar parada por 30 segundos o efeito de cor toma toda a
página. Ele sai assim que o mouse se mover novamente." `js/idle-color.js`,
script novo, carregado nas 5 páginas junto com `js/panel.js`:

```js
document.addEventListener('mousemove', reiniciar);
timer = setTimeout(ativar, 30000);
```

`ativar()` só faz `raiz.classList.add('is-overlay-open')` — reaproveita a
MESMA classe/efeito dos painéis (fundo + duotone), não um efeito visual
separado. `reiniciar()` (chamado a cada `mousemove`) desativa e zera o
cronômetro — qualquer movimento do mouse adia os 30s de novo, começando do
zero; só falta de movimento sustentada dispara o efeito.

**Coordenação com `js/panel.js`, pra não brigar pela mesma classe:**
`js/panel.js` já controla `.is-overlay-open` sozinho (seção "Painel" abaixo)
sempre que um painel abre/fecha, recalculando do zero (`raiz.classList.toggle
('is-overlay-open', algumPainelAberto)`) — sem coordenação, o idle e o painel
ligariam/desligariam a mesma classe por cima um do outro. Duas guardas
resolvem isso sem precisar os dois arquivos se conhecerem:

- **`ativar()` não faz nada se algum painel real já estiver aberto**
  (`document.querySelector('.panel.is-open')`) — não faz sentido o efeito de
  inatividade "ativar" algo que já está ativo por outro motivo, e evita que o
  idle pise no estado que o painel está gerenciando.
- **`desativar()` só remove a classe se foi o PRÓPRIO idle que ligou**
  (flag `ativo`, interno do script) — se um painel está aberto quando o mouse
  se move, `ativo` nunca virou `true` (a guarda acima impediu), então
  `desativar()` não faz nada e o efeito do painel continua intacto. Testado
  via Playwright com `page.clock` (fast-forward sem esperar de verdade):
  painel aberto + 31s parado + mouse se movendo, nessa ordem, mantém
  `is-overlay-open` verdadeiro do início ao fim; fechar o painel derruba a
  classe (por `panel.js`); os próximos 31s parado ativam o idle normalmente.
- Nenhum dos dois lados precisa saber que o outro existe além dessas duas
  checagens — `panel.js` não foi alterado nesta versão.

Reaproveita as MESMAS transições CSS que já animam a entrada/saída do efeito
em qualquer painel (`body { transition: background-color var(--t-panel) }`,
`.28s` no filtro/duotone das mídias) — nenhuma CSS nova foi necessária, só o
toggle da classe.

---

## 3. Tipografia

Display: **Advent Pro** (Google Fonts, variável, eixos `wdth` 100–200 e `wght`
100–900) — títulos, menu, "quem somos". Corpo de texto/leitura corrida:
**Inter** (ver "Sans-serif no lugar de Newsreader" abaixo) — bio dos
diretores, cartão de contato, e a barra `[Diretor]: [Título]` do topo da
página de projeto (pequena/discreta o bastante pra pedir a mesma fonte de
leitura corrida, não a de destaque).

```css
@import url('https://fonts.googleapis.com/css2?family=Advent+Pro:wdth,wght@100..200,100..900&display=swap');
```

| papel | wdth | wght | tamanho | entrelinha | tracking |
|---|---|---|---|---|---|
| título de projeto | 200 | 900 | `clamp(30px, 5.4vw, 74px)` | 0.94 | -0.01em |
| item de menu | 200 | 800 | `clamp(30px, 4vw, 52px)` | 0.98 | -0.01em |
| logo | 175 | 700 | 21px | 1 | 0 |
| redes sociais | 175 | 600 | 19px | 1 | 0 |
| metadados | 100 | 400 | 14px | 1.5 | 0 |

`font-variation-settings` ignora `font-weight`. O peso tem que entrar dentro
da própria declaração:

```css
.title {
  font-family: 'Advent Pro', sans-serif;
  font-variation-settings: 'wdth' 200, 'wght' 700;
}
```

Consequência editorial: em `wdth 200` cada palavra ocupa quase o dobro da largura.
Títulos de projeto devem caber em duas linhas no desktop. "Cobertura Conferência
Brasileira de Carbono 2026" já é o limite superior — títulos mais longos que esse
precisam ser encurtados na redação, não no CSS.

### Sans-serif no lugar de Newsreader (V1.9)

"Vamos mudar a fonte 'News reader', precisamos de uma fonte sem serifa.
Limpa e leve." **Inter** substitui a Newsreader em TODO lugar que a
usava — não é uma troca pontual num componente, é a fonte de leitura
corrida do site inteiro:

```css
@import url('https://fonts.googleapis.com/css2?family=Advent+Pro:wdth,wght@100..200,100..900&family=Inter:wght@300..700&display=swap');
```

- `.bio` (bio dos diretores em `time.html`; nas páginas de diretor,
  `.diretor-bio--destaque .bio` sobrescreve pra Advent Pro por cima
  disso, ver seção 6 — não afetado por essa troca)
- `.contact-card__item` (e-mail no card de contato)
- `.projeto-barra` (`[Diretor]: [Título]`, topo da página de projeto)

As três regras ganharam `font-weight: 300` explícito — o peso mais leve
que o range importado (`300..700`) permite, direto ao pedido "leve".
Faixa de peso importada (`300..700`) deixada mais ampla que o uso atual
(só `300`) de propósito: dá espaço pra usar um peso mais forte em algum
componente futuro sem precisar editar o `@import`.

**Por que Inter, e não outra sans-serif**: pedido não nomeou uma fonte
específica, só o critério ("sem serifa, limpa e leve") — Inter é uma
escolha segura e testada para texto corrido pequeno (foi desenhada
para telas, com bom espaçamento em tamanhos de parágrafo), com peso
leve disponível nativamente na variável do Google Fonts, sem competir
visualmente com a Advent Pro (que já cobre todo o papel "display" do
site). Se não agradar, é uma troca de uma linha no `@import` + três
`font-family`.

---

## 4. Estrutura da home

```
[logo — fixo, topo esquerdo]          [hambúrguer — fixo, topo direito]

  projeto 01 ─ alinhado à esquerda
    título
    mídia

                       projeto 02 ─ alinhado à direita
                                        título
                                        mídia

  projeto 03 ─ alinhado à esquerda
  ...
```

- Bloco = título + mídia, ambos do mesmo lado, mesma largura.
- Largura do bloco: 82% da viewport. Sobra 18% na coluna oposta — vazia,
  sem elemento nenhum dentro dela (o ícone que existia ali foi removido
  em V8, ver "Ícone de galeria" abaixo).
- Alternância contada em JS (`js/feed.js`), não por `:nth-child(even)`: cada
  projeto consome um turno de lado, inclusive o carrossel — `:nth-child`
  não daria conta disso se algum tipo de projeto no meio da lista precisasse
  pular a contagem.
- Sem grade de 12 colunas. Cada bloco é um grid de duas colunas: bloco e coluna vazia.
- Espaço vertical entre blocos: `clamp(72px, 12vh, 160px)`.

### Tipos de mídia

Cada projeto usa um dos dois no feed (home e galeria de diretor). O campo
`tipo` vive no `projetos.json`, não no HTML — mas desde V11 ele deixou de
ser a única coisa que decide.

**`single`** — uma peça só. A largura acompanha o formato do arquivo, não uma
grade fixa. Um 16:9 e um 4:5 ocupam larguras diferentes. Alinhado ao lado do bloco.

**`carousel`** — várias peças em faixa horizontal, item central grande e os
vizinhos espiando nas bordas. Setas ← e → nas laterais, centradas na vertical.

**Galeria alimenta o carrossel automaticamente (V11).** Todo projeto com
`galeria` não vazia vira carrossel no feed, **não importa o valor de
`tipo`** — a galeria da página do projeto e o carrossel do feed passam a
ser a mesma fonte de dado (`js/feed.js`, função `slidesDoCarrossel()`).
Quando o projeto também tem loop ambiente (`midia[0].loop`), ele entra
como primeiro slide, na frente das fotos da galeria. É o caso de
`cbcc-2026` (loop + 4 fotos) e `dancebook-brasil` (loop + 3 fotos): os
dois têm carrossel no feed **e** galeria de fotos na página do projeto,
vindas do mesmo array. `tipo: "carousel"` continua salvo nesses projetos
por clareza, mas na prática quem decide é a presença de `galeria`. Um
projeto sem `galeria` continua respeitando `tipo` normalmente (é o caso
de `dossie-anonimo`, `gree-smartwind-brasil` etc., hoje todos `single`).

```css
.media--carousel .track {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  scrollbar-width: none;
  padding-inline: 7vw;
}
.media--carousel .track::-webkit-scrollbar { display: none; }

.media--carousel .slide {
  flex: 0 0 81%;
  scroll-snap-align: center;
}
```

Scroll-snap nativo. Sem biblioteca. As setas chamam `scrollBy`, e no celular
o arrasto já funciona de graça.

**O `overflow-x` fica no `.track`, nunca acima.** Se subir para `.media` ou
`.block`, mata o título preso. É a armadilha 1 da seção anterior, e o carrossel
é justamente o componente que convida a cometê-la.

**Setas.** Elas flutuam sobre os slides vizinhos, cujo conteúdo é imprevisível —
uma seta preta some sobre um vídeo escuro. Solução sem chrome:

```css
.arrow {
  color: #fff;
  mix-blend-mode: difference;
  z-index: 3;
}
```

`difference` inverte contra o que estiver atrás: branca sobre escuro, preta
sobre claro. Sempre legível, sem pílula, sem sombra, sem fundo. Mantém o
vocabulário calado do site.

Setas são `<button>` com `aria-label` ("Próximo item da galeria"), não `div`.
**As setas nunca somem.** O carrossel é infinito: quando chega no fim, teleporta
de volta para o começo sem piscar, mantendo a ilusão de uma fita contínua.
Internamente, slides são clonados antes e depois do conjunto original; quando o
scroll toca a zona de clones, a posição salta para o equivalente no conjunto real.
Clones nunca têm `<video>` — o `<video>` do slide original é simplesmente
removido no clone (V13; antes virava um `<img>` do poster, mas o vídeo
não tem mais poster nenhum, ver "Vídeo tem prioridade sobre poster"
abaixo) — a cor de `--placeholder` do próprio `.slide` preenche o espaço.
Um clone só aparece de relance durante o teleporte, então isso não muda
nada visualmente. Triplicar vídeo de verdade (não só o poster) quebraria
o orçamento de desempenho.

**Vídeo dentro do carrossel:** carrega e começa a tocar assim que o slide
aparece (`IntersectionObserver` com `root` no próprio `.track` e
`threshold: 0.6`), mas **não pausa mais ao rolar pra outro slide (V13)** —
antes disso, só o slide "ativo" tocava e os outros ficavam pausados; agora
o loop continua rodando mesmo fora de destaque. `js/media.js`.

**Armadilha (corrigida em V13): um slide sem mídia carregada não tem
altura nenhuma.** Nem `<video>` nem `<img>` têm `width`/`height` fixos no
HTML — antes da mídia carregar, o navegador não sabe que altura dar pro
slide, e o `.track` inteiro podia colapsar pra `0px` (ou pro tamanho
padrão de vídeo do navegador, 300×150) até o primeiro frame chegar. Isso
tornava qualquer leitura de geometria logo no carregamento (posição do
carrossel, ver abaixo) instável e, na prática, fazia o primeiro slide
(o vídeo em loop) nunca ficar visível pro `IntersectionObserver` — ele
simplesmente nunca carregava, e quem aparecia era o vídeo/foto errado.
`.slide` ganhou `min-height: clamp(220px, 42vw, 620px)` — o mesmo valor
já usado no placeholder de "mídia em produção" — garantindo altura
estável desde o primeiro layout, sem depender de nada ter carregado.

**Armadilha (corrigida em V0.14.1): `min-height` sem desligar depois virou
uma moldura colorida em cima de fotos já carregadas.** O conserto da V13
acima resolveu o timing, mas `min-height` é uma restrição permanente — uma
foto que só precisa de, digamos, 400px de altura continuava obrigada a
ocupar os até 620px do clamp, sobrando uma faixa da cor de
`--placeholder` ao redor da imagem (bege no CBCC, vermelho no Dancebook).
Piorava porque `.track` não tinha `align-items` definido (`stretch` por
padrão): mesmo um slide com `min-height` já zerado continuava esticado
pra igualar o slide mais alto da fileira — geralmente o de vídeo. Duas
mudanças, as duas necessárias:

1. `.track` ganhou `align-items: center` — cada slide passa a ter sua
   própria altura (por conteúdo), não mais esticada pra igualar o
   vizinho mais alto. Mesmo princípio do `single`: aspecto diferente,
   altura diferente.
2. `carousel-infinite.js` agora escuta o carregamento de cada mídia
   individualmente (`load` pra `<img>`, `loadedmetadata` pra `<video>` —
   metadata já basta, porque só a proporção intrínseca importa) e zera o
   `min-height` daquele slide específico assim que ela carrega. O
   `min-height` catch continua servindo de rede de segurança só pro
   instante antes de qualquer coisa carregar; depois disso, cada slide se
   sustenta sozinho via `object-fit: contain`. Clones de vídeo (sem
   `<video>` nenhum) nunca disparam isso e ficam com o piso pra sempre —
   sem problema, só aparecem de relance durante o teleporte.

**Armadilha (corrigida em V13, revisada em V14): posicionar o carrossel
no início do conjunto real não é `slideSize × quantidade`.** Era assim
que `carousel-infinite.js` calculava `totalSize` e usava pra pular
`track.scrollLeft` direto pro começo do conjunto real ao carregar a
página. Só que com `scroll-snap-align: center` e o `padding-inline:
var(--peek)` do `.track`, o ponto de snap "de verdade" do primeiro slide
quase nunca bate exatamente com essa conta — e assim que o
`scroll-snap-type` (desligado durante o pulo, igual ao `teleportar()`)
voltava a ficar ativo, o navegador "corrigia" a posição pro snap point
mais próximo, que raramente era o slide certo. Na prática, o carrossel
carregava mostrando um slide qualquer no meio da fita, não o vídeo em
loop do início.

V13 trocou por `slides[0].scrollIntoView({ inline: 'center', block:
'nearest' })` — só que `scrollIntoView` rola **qualquer ancestral
rolável** no caminho até o elemento ficar visível, não só o `.track`.
`block: 'nearest'` parece seguro (não devia mexer no eixo vertical), mas
se o carrossel inteiro começa fora da tela (caso do Dancebook, o segundo
carrossel da home, ou de qualquer carrossel numa galeria de diretor mais
abaixo na página), a chamada rolava a **página inteira** pra baixo até
ele aparecer. Sintoma em V14: abrir a home, ou a página de um diretor com
Dancebook na galeria, pulava direto pro Dancebook, sem o usuário rolar
nada.

**V14 substitui por um cálculo manual com `getBoundingClientRect()`**,
que só escreve em `track.scrollLeft` — não existe ancestral pra vazar:

```js
function centralizarSlide(slide) {
  var trackRect = track.getBoundingClientRect();
  var slideRect = slide.getBoundingClientRect();
  var delta = (slideRect.left + slideRect.width / 2) - (trackRect.left + trackRect.width / 2);
  track.scrollLeft += delta;
}
```

Isso não é só o mesmo posicionamento inicial sem o efeito colateral — a
mesma função também resolve o bug irmão do V14: **redimensionar a janela
podia deixar um clone de vídeo (sem imagem nenhuma, só a cor de
`--placeholder`) visível no lugar de uma foto**, porque mudar a largura
dos slides sem realinhar o scroll deixa a posição desatualizada.
`carousel-infinite.js` agora escuta `resize` (debounced 150ms) e chama
`centralizarSlide(slideMaisProximoDoCentro())` — reencontra qual slide
(real ou clone) está mais perto do centro do `.track` no momento e
recentraliza nele, sem se importar se é o slide 0 ou não.

**Arrastar com o mouse rola o carrossel (V1.4).** Toque sempre rolou
sozinho — é o `overflow-x: auto` padrão do navegador respondendo ao
gesto nativo de swipe, nunca precisou de JS. Faltava só o mouse, que
não tem gesto de arrastar embutido no browser para scroll horizontal.
`carousel-infinite.js` usa Pointer Events filtrando por
`e.pointerType === 'mouse'` — toque e caneta continuam exatamente no
scroll nativo, sem passar pelo código novo:

```js
track.addEventListener('pointerdown', function (e) {
  if (e.pointerType !== 'mouse' || e.button !== 0) return;
  arrastando = true;
  inicioX = e.clientX;
  inicioScroll = track.scrollLeft;
});
window.addEventListener('pointermove', function (e) {
  if (!arrastando) return;
  track.scrollLeft = inicioScroll - (e.clientX - inicioX);
});
```

**Armadilha encontrada e corrigida no processo: `track.setPointerCapture()`
quebra clique normal, não só o arrasto.** A primeira versão capturava o
ponteiro no `pointerdown` (padrão comum pra esse tipo de interação), mas
capturar o ponteiro faz o navegador reencaminhar o `click` resultante
pro próprio elemento que capturou (`track`), não pro elemento
visualmente sob o cursor. `js/video-modal.js` procura `[data-video]` com
`e.target.closest(...)`, que olha só pra ancestrais — com o clique
reencaminhado pro `track`, `.media__play` (um descendente) nunca era
encontrado, e **qualquer clique no carrossel, mesmo sem arrastar nada,
parava de abrir o vídeo**. Corrigido tirando o `setPointerCapture` e
movendo `pointermove`/`pointerup` pro `window` em vez do `track` — sem
precisar de captura, e como bônus o arrasto continua funcionando mesmo
se o cursor sair da área do carrossel no meio de um gesto rápido.

**Suprimir o clique depois de um arrasto de verdade.** Sem isso, soltar
o mouse depois de arrastar também dispararia "click" em cima do que
estivesse embaixo do cursor — abriria o vídeo ou navegaria pro projeto
só por ter arrastado, sem intenção de clicar em nada. Um limiar de 4px
de movimento (`moveuDeVerdade`) distingue "foi só um clique" de "foi um
arrasto"; um listener de `click` em fase de **captura** no `track`
(roda antes de qualquer handler de clique do próprio slide) cancela o
evento quando o gesto foi de fato um arrasto.

**Cursor**: `.track { cursor: grab }`, `.track:active { cursor: grabbing }`
— só affordance visual, não muda o comportamento.

**Bug real encontrado ao verificar isso: `projeto.html` nunca carregava
`js/carousel-infinite.js`.** Passou despercebido desde a V1.3 (quando
`js/projeto.js` ganhou a capacidade de montar `.media--carousel` na
própria página do projeto, ver seção 6) porque `js/media.js` — que
*está* incluído em `projeto.html` — já cuida das setas e do autoplay
por visibilidade, então o carrossel *parecia* funcionar. O que faltava,
sem barulho nenhum (nenhum erro de console), era só o loop infinito
(clonagem) e a centralização inicial — o carrossel do Spaten, citado
como referência do que "infinito" deveria parecer, não estava de fato
infinito até esse ajuste. Corrigido adicionando `<script
src="js/carousel-infinite.js">` em `projeto.html`, na mesma posição
relativa (logo depois de `media.js`) que as outras páginas já usam.
**Regra geral, agora garantida:** todo `.media--carousel` do site, em
qualquer página, é automaticamente infinito e arrastável — não é algo
que se ativa por página, é global via
`document.querySelectorAll('.media--carousel')` em `carousel-
infinite.js`, carregado (agora) em toda página que pode ter carrossel.

**Setas: só visíveis com o mouse por perto, e por baixo do alvo de
clique do slide até V1.5 (bug corrigido).** Duas mudanças na V1.5, uma
de comportamento pedida e um bug real encontrado ao mexer nas setas:

1. **Bug: a seta esquerda não respondia ao clique.** `.arrow` e
   `.slide__link`/`.media__play` (o alvo de clique invisível que cobre
   o slide inteiro) empatavam em `z-index: 3` — `.arrow` usava o token
   `--z-arrow`, o outro par tinha `3` hardcoded. Em empate de
   `z-index`, quem vem depois no DOM ganha a disputa de empilhamento; e
   como as setas são declaradas **antes** do `.track` (e de seus
   slides) no HTML de `js/feed.js`/`js/projeto.js`, o link/botão
   invisível do slide sempre pintava por cima, interceptando o clique
   destinado à seta sempre que os dois se sobrepunham visualmente —
   não só num caso raro, em qualquer carrossel onde a seta ficasse
   perto o bastante da borda de um slide. Corrigido subindo
   `--z-arrow` pra `5` em `tokens.css`, bem acima dos dois.
2. **Setas escondidas por padrão, reveladas no hover do carrossel
   inteiro** (não da seta em si — ela é pequena demais pra um hover
   próprio fazer sentido como gatilho). `.media--carousel .arrow {
   opacity: 0 }`, `.media--carousel:hover .arrow { opacity: 1 }`.
   Escopado a `.media--carousel .arrow`, não a `.arrow` sozinho — as
   setas do lightbox de fotos (`.photo-modal__frame .arrow`,
   `base.css`) são outro contexto (modal, sem gesto de arrastar) e
   continuam sempre visíveis, sem essa regra. `:focus-within` revela a
   seta também pra quem navega por teclado — sem isso, ela ficaria
   focável mas invisível assim que o foco chegasse nela.

**Vídeo tem prioridade sobre poster (V13).** `midiaHTML()` não coloca mais
`poster="..."` no `<video>` — nunca mostra uma foto estática por cima ou
no lugar do vídeo em loop. Até o vídeo carregar (ou se ele falhar), quem
preenche o espaço é a cor de `--placeholder` do `.media`/`.slide`, não uma
imagem específica. Vale pra qualquer projeto com `loop`, dentro ou fora
de carrossel — resolve de vez a "armadilha do poster duplicado" descrita
na seção 4 (que era sintoma da falta dessa regra geral, não só do caso
do Dancebook).

**Teto de altura: `88vh`.** Vale para os dois tipos de mídia.

```css
.media { max-height: 88vh; }
.media video, .media img { height: 100%; object-fit: contain; }
```

Sem isso, uma peça vertical vira uma faixa estreita e altíssima, e o título
preso no topo fica grudado tempo demais — o efeito deixa de ser um momento e
vira uma condição. No carrossel o teto é ainda mais necessário, porque a faixa
mistura formatos e sem ele cada slide teria uma altura diferente.

`object-fit: contain` e não `cover`: recortar a peça do cliente para caber numa
caixa não é aceitável num site de produtora.

### Clique: o bloco não pode mais ser um link só

Na seção 5 o bloco inteiro era um link, e hover na mídia sublinhava o título.
Com carrossel isso quebra: clicar para avançar um slide dispararia a navegação.

Nova regra, válida para os dois tipos de mídia, para o comportamento não mudar
de projeto para projeto:

- O **título** é sempre um link para a página do projeto (o ícone de
  galeria que existia ao lado foi removido em V8).
- Em `single`, a **mídia** é decorativa, a não ser que o projeto tenha
  campo `video` preenchido — nesse caso ela abre o modal de vídeo (V7/V8,
  ver seção 6).
- Em `carousel`, **cada slide tem seu próprio destino de clique (V12)**:
  o slide de vídeo (`m.loop`) abre o modal, igual ao `single`; um slide de
  foto (`galeria`) é um link pra página do projeto, igual ao título. O
  arrastar/rolar do carrossel continua funcionando do mesmo jeito — não
  há conflito na prática porque o navegador só dispara `click` quando o
  ponteiro não se moveu (mouse) ou o toque não virou scroll (touch); não
  foi preciso nenhuma lógica extra de "isso foi um clique ou um arrasto".
- O hover é apenas tipográfico: passar o mouse em qualquer parte do bloco clareia
  o título para 30%. Isso é `.block:hover`, que é estado visual, não área clicável.
  **Removido na V5** — ver "Hover — bloco de projeto" abaixo; o parágrafo
  fica só pra explicar a origem da regra de clique.

Custo: a área clicável fica menor. Ganho: nunca há ambiguidade sobre o que um
clique faz. Vale a troca.

### Ícone de galeria

**Removido em V8.** Existia um ícone na coluna oposta ao bloco, alinhado ao
topo da mídia, que deveria abrir a galeria — mas nunca chegou a fazer nada
até a página de projeto existir (V7), e mesmo depois disso o link
duplicava o que o título já fazia. O título é o único acesso à página do
projeto agora. A coluna oposta ao bloco continua vazia (é o respiro de
18% da seção 4), só sem elemento nenhum dentro dela.

### Título preso no scroll

Ao rolar, o título gruda abaixo do logo e a mídia sobe por cima dele, cortando
as letras progressivamente até cobri-lo. O título nunca sai do bloco: quando o
bloco termina, ele vai embora junto.

```css
.block {
  position: relative;
  isolation: isolate;
}

.block .title {
  position: sticky;
  top: 56px;
  z-index: 1;
}

.block .media {
  position: relative;
  z-index: 2;
}
```

`isolation: isolate` confina os `z-index` dentro de cada bloco, para a mídia do
projeto 1 não competir com o título do projeto 2. Não interfere no sticky.

**Três armadilhas, todas fatais e silenciosas:**

1. `overflow: hidden` em qualquer ancestral do título mata o sticky sem erro
  no console. O `overflow: hidden` da mídia fica em `.media`, que é irmão do
  título, não ancestral — está seguro. Mas nenhum wrapper acima de `.block`
  pode ter overflow.
2. `transform`, `filter`, `perspective`, `backdrop-filter` ou `will-change`
   em `.block` ou acima transformam o sticky em fixed dentro daquele elemento.
  Nenhum `transform` de hover existe em `.block` ou nos seus ancestrais.
  Isso é uma restrição permanente do arquivo, não um detalhe de implementação.
3. A mídia precisa ser opaca. Poster com transparência deixa o título aparecer
   por baixo e o efeito desmonta.

**O `top: 56px` existe por causa do logo.** O logo é fixo no canto superior
esquerdo, e nos blocos alinhados à esquerda o título passaria por baixo dele.
O valor tem que ser a altura do logo mais o respiro. Se o logo mudar de tamanho,
esse número muda junto — vale virar token (`--logo-clearance`).

**Ordem de planos, do fundo para a frente:** fundo → título preso → mídia →
logo → hambúrguer → painel do menu. O logo continua legível enquanto a
mídia cobre o título, como na referência.

**Respiro no estado de repouso.** O título precisa ser lido antes de começar a
ser cortado. Se a mídia encostar no título, o efeito nunca acontece — ela já
começa cobrindo. Manter no mínimo `clamp(20px, 3vh, 40px)` entre o fim do título
e o topo da mídia.

---

## 5. Componentes e estados

### Logo

`position: fixed`, topo esquerdo, sempre visível, sempre `--ink`.
Fica acima do menu no eixo Z — no mockup 3 ele continua legível com o painel aberto.

### Menu

- **Não existe em `projeto.html` (V1.11).** O menu inteiro (`.burger`,
  `<nav id="menu">`, "quem somos", "contato") saiu do HTML da página de
  projeto — sem burger (que sumiu de propósito, ver seção 6, "Página de
  projeto"), esses painéis não tinham mais gatilho nenhum, então
  ficaram removidos em vez de deixados como código morto inacessível.
  `js/panel.js` também parou de ser carregado só nessa página, pelo
  mesmo motivo. Descrição abaixo vale pras outras 4 páginas do site
  (`index.html`, `ricardo-rapozo.html`, `daniela-luquini.html`,
  `time.html`), onde nada mudou.
- **Primeiro item, "Projetos" (V1.10) — era "Portfólio".** "vamos mudar
  a nomenclatura da página PORTFOLIO, agora vai se chamar PROJETOS."
  Só o texto do link muda (`<a href="./">`, mesmo destino de sempre);
  nenhuma URL, arquivo ou estrutura foi renomeada — é `index.html` por
  baixo, como sempre foi. `js/chrome.js` (não usado por nenhum HTML
  hoje, mantido em sincronia por precaução — ver seção 10) também
  atualizado, pelo mesmo motivo.
- Painel desce do topo com altura natural do conteúdo, sem espaço negativo e sem scroll (overflow hidden).
- Ao abrir: `--paper` do `body` vira `--hue`, hambúrguer vira X, mídias entram em duotone.
- Fundo do painel: branco puro (`--panel-bg: #FFFFFF`), não sorteado.
- Item da página atual não tem sublinhado visual (atributo `aria-current="page"` permanece para acessibilidade).
- Redes sociais: só Instagram (`.social`, V1.2 — antes tinha Vimeo e
  YouTube também, separados por `/`; removidos a pedido, `href="#"`
  ainda como placeholder). Com um link só, o separador `/` deixou de
  fazer sentido e saiu do HTML.
- **"Diretores" é um botão que revela submenu com nomes.** Clicar em nome navega para página do diretor.
  O botão recebe o mesmo tratamento de hover/foco dos links do menu (linha animada) — não é
  exclusivo de `<a>`, vale para `.menu-toggle` também.
- Submenu abre no mesmo painel, com a mesma altura do menu principal, e oferece botão `voltar`.
  **Armadilha de CSS:** como o botão `voltar` fica entre o toggle e o `<ul class="submenu">` no HTML,
  a regra que revela o submenu não pode usar `+` (irmão imediato) — tem que ser `~` (irmão geral),
  senão o submenu nunca aparece mesmo com `aria-expanded="true"`.
- **"Contato" abre um card**, não um `mailto:` direto (ver "Card de contato" abaixo).
- **Texto dos itens do menu (`.panel--menu ul a`, `.menu-toggle`,
  `.submenu a`): `'wdth' 200, 'wght' 900`** (V1.7.7 — era `'wght' 800`,
  pedido explícito incluindo o submenu "Diretores"). É o mesmo teto do
  eixo variável usado nas manchetes do site (`.title`,
  `.diretor-nome`). `.social` (Instagram) e `.submenu-back` ("voltar")
  ficam de fora de propósito — pedido foi só pros itens de navegação,
  não pro rodapé de redes sociais nem pro botão de voltar do submenu.
- Esc fecha o painel inteiro e reseta o submenu.
- Fecha com Esc e com clique fora.
- Foco preso dentro do painel enquanto aberto; ao fechar, foco volta ao hambúrguer.
- `aria-expanded` no botão, `inert` no conteúdo atrás.

### Hover — menu

Uma linha animada que entra pela esquerda e sai pela direita.

```css
.panel--menu a { position: relative; }

.panel--menu a::after {
  content: '';
  position: absolute;
  left: 0; right: 0; bottom: -.06em;
  height: 3px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: right;
  transition: transform .175s cubic-bezier(.22,.61,.36,1);
}

.panel--menu a:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}
```

A troca de `transform-origin` cria o efeito de direção: a linha entra pela esquerda
no hover (origin muda para left) e sairia pela direita (origin volta para right) ao
sair. `skip-ink: none` porque em `wdth 200` os descendentes cortariam a linha em
vários pontos.

**`:focus-visible` continua com `text-decoration` estático.** Indicador de foco
precisa aparecer instantaneamente; animar atrasa a informação para quem mais
precisa dela.

### Hover — bloco de projeto

**Removido na V5.** O título não escurece mais em repouso nem responde ao hover
do mouse — fica sempre em opacidade cheia. A mídia continua sem responder a
hover, como antes. O indicador de foco de teclado (sublinhado, ver seção
"Foco de teclado") continua existindo — é a única reação visual que resta
no bloco.

### Foco de teclado

Opacidade a 75% não serve como indicador de foco. Quem navega por Tab
recebe a mesma linha do menu, em qualquer lugar do site:

```css
.block:focus-visible .title,
.menu a:focus-visible {
  text-decoration: underline;
  text-decoration-thickness: 3px;
  text-underline-offset: .14em;
  text-decoration-skip-ink: none;
}
```

Nenhum vocabulário novo entra no sistema — a linha só reaparece onde é necessária.

### Proteção contra download de mídia (V17)

Site inteiro, todas as páginas. Não é proteção real — quem sabe abrir o
devtools sempre consegue a mídia — só tira os três atalhos mais casuais
de "salvar":

1. **Menu de contexto** (botão direito → "Salvar imagem/vídeo como...")
   — bloqueado via JS, `js/no-download.js`, um listener de `contextmenu`
   no `document` que cancela o evento quando o alvo é `img` ou `video`
   (delegado, então cobre mídia inserida depois via `feed.js`/
   `carousel-infinite.js` sem precisar de listener por elemento).
2. **Arrastar a imagem** pra fora da aba/janela (vira um download em
   alguns navegadores) — `-webkit-user-drag: none` em `img, video`
   (`base.css`).
3. **Toque longo no celular** (menu de "salvar na galeria" do iOS/
   Android) — `-webkit-touch-callout: none`, mesma regra.

`js/no-download.js` é carregado em toda página que tem mídia (todas,
menos os painéis puramente textuais) — ver seção 10, estrutura de
arquivos.

### Transição entre páginas (V1.1, "dip to white" desde V1.1.1)

**"Dip to white"** em qualquer navegação interna — clicar num link do
menu, num projeto, em "voltar" etc: a página que está saindo dissolve
pro branco, e só depois o branco dissolve pra página que está entrando.
Duas animações em sequência (não um crossfade simultâneo), cada uma
cobrindo metade do tempo total (`--t-page`):

```css
@view-transition {
  navigation: auto;
}

::view-transition-image-pair(root) {
  background-color: #fff;
}

@keyframes dip-to-white-out { to { opacity: 0; } }
@keyframes dip-to-white-in { from { opacity: 0; } }

::view-transition-old(root) {
  animation: dip-to-white-out calc(var(--t-page) / 2) var(--ease-out) both;
}

::view-transition-new(root) {
  animation: dip-to-white-in calc(var(--t-page) / 2) var(--ease-out) calc(var(--t-page) / 2) both;
}
```

É a **View Transitions API "cross-document"** — pensada exatamente pra
site multi-página como este (sem SPA, sem router). Por padrão, o
navegador faz um crossfade simultâneo (página antiga perdendo opacidade
enquanto a nova ganha, ao mesmo tempo) — a V1.1 usava esse padrão sem
alterar. A V1.1.1 substitui isso por duas animações independentes: a
antiga (`::view-transition-old`) só perde opacidade, na primeira metade
do tempo; a nova (`::view-transition-new`) começa em opacidade `0` e só
ganha opacidade na segunda metade (via `animation-delay` igual à
primeira metade) — no meio das duas, com as duas em opacidade zero, o
que aparece é o `background-color: #fff` do
`::view-transition-image-pair(root)`, o "branco" do meio do dip. O
`both` no fill-mode de cada animação é essencial: sem ele, a nova
apareceria no estado padrão (opacidade 1) durante o delay, em vez de
ficar invisível esperando sua vez.

**Precisa da regra nas duas pontas** — a página que o usuário está
saindo E a que está entrando — pro navegador ativar a transição; como
está em `base.css`, carregado em toda página, toda navegação interna já
entra automaticamente, sem precisar listar rotas nem marcar links.

**Troca de aba trabalhos/bio do diretor tem o mesmo efeito, mas por
outro mecanismo (V1.1.1).** Isso não é uma navegação de verdade — é
hash mudando dentro do mesmo documento (`js/diretor-tabs.js`) — então a
versão "cross-document" da API descrita acima nunca entra em ação
sozinha aí; a V1.1 deixou esse caso escapar do fade por esse motivo. A
correção usa a segunda forma da mesma API,
`document.startViewTransition()` ("same-document"): mesmos pseudo-
elementos (`::view-transition-old/new(root)`), mesmo CSS acima, sem
precisar de nenhuma regra extra — só entra em ação a partir do
`hashchange` (troca de aba clicada pelo usuário), não no primeiro
`mostrar()` do carregamento da página, que não precisa de transição
porque a página inteira acabou de fazer a própria ao navegar até ali.

**Abrir/fechar "quem somos" usa o mesmo truque "same-document" (V1.7)**
— ver seção 6, "Quem somos". Terceiro uso da mesma API no site (depois
da navegação entre páginas e da troca de aba do diretor), sempre pelo
mesmo motivo: a mudança não é uma navegação de verdade, então só a
versão `document.startViewTransition()` entra em ação.

**Suporte**: Chrome/Edge 126+. Em navegadores sem suporte (Safari,
Firefox, no momento em que isto foi escrito), a regra é simplesmente
ignorada — navegação normal, sem transição, sem erro nenhum; e
`document.startViewTransition` sendo `undefined` faz
`mostrarComTransicao()` cair no `else` (troca de aba direto, sem
efeito). É progressive enhancement puro nos dois casos: zero risco de
quebrar algo pra quem não tem o recurso.

**Movimento reduzido**: `@media (prefers-reduced-motion: reduce)`
(`layout.css`) desliga a animação das pseudo-elements de transição —
diferente do resto do site, isso não é coberto pelo
`* { transition-duration: .01ms !important; }` já existente, porque
view transitions usam `animation`, não `transition`; o navegador não
desliga isso sozinho, precisa de uma regra explícita.

**O logo não sofre o dip (V1.2).** `.logo` recebe `view-transition-
name: logo` (`base.css`), o que tira ele do grupo `root` — que é quem
passa pelo dip-to-white — e o trata como um elemento persistente,
pareado entre a página que sai e a que entra (o navegador casa
elementos com o mesmo `view-transition-name` nos dois lados
automaticamente). Como o logo é idêntico — mesma posição fixa, mesmo
texto — em toda página do site, ele já ficaria visualmente parado
mesmo só com isso; `::view-transition-group/old/new(logo) { animation:
none !important; }` garante isso de forma explícita, sem depender de
"por acaso as duas capturas serem iguais". Vale tanto pra navegação
cross-document quanto pra troca de aba trabalhos/bio (same-document) —
é o mesmo mecanismo de nomes nos dois casos.

---

## 6. Páginas internas

### Diretores

Cada diretor tem página própria: `ricardo-rapozo.html` e `daniela-luquini.html`.

**Estrutura de cada página (V16)** — duas abas, "trabalhos" e "bio",
trocadas via hash da URL:

1. `.diretor-header`: nome do diretor centralizado (`<h1
   class="diretor-nome">`) + as duas abas (`.diretor-tabs`), também
   centralizadas.
2. `#tab-trabalhos`: a galeria filtrada daquele diretor (mesmo mecanismo
   de sempre, ver abaixo) — é a aba que abre por padrão, sem hash.
3. `#tab-bio`, com `hidden` no HTML por padrão: retrato + bio lado a lado
   (`.diretor-bio`), sem título nenhum dentro do bloco — o nome já está
   no cabeçalho da página, comum às duas abas.
4. Rodapé.

**`js/diretor-tabs.js`** troca entre as duas: lê `location.hash` (`#bio`
ou o que não seja reconhecido vira `trabalhos`), alterna `hidden` nos dois
`<section>`, `aria-current="page"` na aba ativa (só pra acessibilidade,
sem estilo visual próprio — mesma convenção do menu principal, ver seção
5), e duas classes no `<html>` — `is-tab-trabalhos` / `is-tab-bio` — hoje
sem efeito em CSS, mantidas por poderem ser úteis a alguma diferença
futura entre as abas. Não depende de `projetos:pronto` — o conteúdo das
duas abas já existe no HTML, só uma fica escondida.

**`.diretor-nome`** tem o mesmo tamanho grande e centralizado
(`clamp(48px, 8vw, 108px)`) nas duas abas — é o título da página, não um
elemento subordinado ao conteúdo de uma aba específica (correção V0.16.1;
a V16 original diminuía o nome na aba trabalhos, lendo errado a
referência visual, que mostrava o mesmo tamanho nas duas telas).

**`.diretor-tabs`** usa a mesma animação de sublinhado do menu principal
(`::after` com `transform: scaleX()`, ver seção 5) só no hover — sem
nenhum indicativo visual estático de aba ativa. O sublinhado visível sob
"bio" nas referências enviadas era o cursor do mouse parado ali no
momento do print, não um estado persistente (correção V0.16.1; a V16
original tinha implementado esse sublinhado como estático, preso a
`[aria-current="page"]`).

**A aba ativa se destaca pelo peso da fonte** (V17): `.diretor-tabs
a[aria-current="page"]` sobe de `'wght' 700` pro teto do eixo, `900`. O
hover (linha animada) continua idêntico nas duas abas, ativa ou não —
só o peso muda. Pedido explícito do usuário pra esse componente
especificamente; diferente da convenção do menu principal (onde
`aria-current` continua sem estilo visual nenhum, ver "Hover — menu").

Os links do submenu "Diretores" (no menu principal) apontam pra página
sem hash nenhum — por isso caem direto na aba trabalhos, como pedido.

**Link "voltar" no fim da página** (V17): `<p class="diretor-voltar">`
fica direto dentro de `.feed`, como irmão dos dois `<section>` das abas
— não duplicado dentro de cada um — então aparece igual em trabalhos e
em bio sem lógica extra. Alinhado à direita, com a mesma animação de
sublinhado no hover dos outros links do site; o espaçamento antes dele
vem de graça do `gap` do `.feed` (flex column), que só conta espaço
entre irmãos visíveis — a aba escondida (`hidden`) não participa do
flex, então o gap aparece certinho entre a aba aberta e o link.

**A galeria de trabalhos é derivada por filtro** — nunca uma segunda
lista escrita à mão. O campo `diretor` em cada projeto contém o slug do
diretor responsável. Implementado em V6, em `js/feed.js`: a mesma função
que monta a home (título+mídia alternando de lado) roda de novo,
filtrando `window.PROJETOS` por `p.diretor === slug` e injetando em
`.galeria[data-diretor="<slug>"]` (agora dentro de `#tab-trabalhos`, mas
o seletor não liga pra profundidade de aninhamento). A alternância
recomeça do zero em cada página — não continua a contagem da home. Se
nenhum projeto bater com o slug, a seção fica vazia (sem placeholder de
"nenhum projeto ainda"; ninguém pediu isso ainda).

**A bio (`.diretor-bio`) é duas colunas simples** — `grid-template-columns:
38vw 1fr` (`1fr 38vw` com o modificador `.diretor-bio--right`, caso da
Daniela), sem subgrid nenhuma. Antes da V16, o nome do diretor vinha
*dentro* do bloco de bio como um `<h1 class="title">` de altura variável
(1 ou 2 linhas dependendo do nome), e alinhar a bio com o topo do retrato
exigia uma subgrid pra descobrir a altura real do título em tempo de
layout (ver `.block--pessoa .block__main` — essa técnica continua
existindo, mas só serve mais o `time.html`, que não tem abas e mantém o
nome dentro do bloco). Sem título dentro do bloco, a V16 não precisa mais
desse truque: as duas colunas simplesmente começam alinhadas ao centro
vertical (`align-items: center` — correção V0.16.2; a V16 original usava
`start`, grudando foto e texto no topo mesmo quando um bloco é bem mais
alto que o outro, o que não batia com a referência).

**O retrato (`.diretor-bio__foto img`) usa `object-fit: cover` com
`aspect-ratio: 3 / 4` fixo**, em vez de `object-fit: contain` com só um
`max-height` (V0.16.2). A foto sempre preenche a coluna inteira num
recorte 3:4 (uma "máscara" retangular sobre a imagem original) em vez de
sobrar espaço vazio quando a proporção do arquivo não bate exatamente
com a da coluna. **Cuidado se mexer aqui**: `width: 100%` sozinho não
basta — é preciso `height: auto` explícito junto de `aspect-ratio`,
porque os atributos `width`/`height` do `<img>` no HTML (usados pra
evitar layout shift) contam como um valor de `height` de baixa
prioridade (nível user-agent); sem o `height: auto` do autor pra
sobrescrever isso, o navegador usa a altura do atributo HTML ao pé da
letra e ignora o `aspect-ratio` da regra CSS.

**O texto da bio (`.diretor-bio .bio`) sobrescreve o `.bio` genérico**
(compartilhado com `time.html`) com fonte maior e mais respiro
(`font-size: clamp(17px, 1.35vw, 20px)`, `line-height: 1.6`,
`position: static` — sem o sticky-ao-rolar que faz sentido só ao lado de
uma galeria) — V0.16.2. O `.bio` de base é dimensionado pra ser uma
coluna estreita e discreta ao lado da mídia grande de um bloco da home;
na aba bio, o texto é o conteúdo principal da tela e pedia um tratamento
maior, mais parecido com leitura de artigo. **O primeiro parágrafo vira
uma frase de efeito** — `.diretor-bio .bio p:first-child` em negrito
(`font-weight: 700`) e bem maior (`clamp(24px, 2.3vw, 32px)`), sem aspas
no texto. Na V16 a frase de abertura de Ricardo ("A memória é um espaço
em disputa.") tinha aspas literais no HTML e nenhum destaque tipográfico
— a referência tratava a frase como uma epígrafe, não uma citação
pontuada. A Daniela não tem frase entre aspas, mas ganha o mesmo
destaque no primeiro parágrafo pra manter as duas bios consistentes.

**A partir da V1.7.5, o modificador `.diretor-bio--destaque` substitui
esse tratamento — primeiro só em Ricardo, depois (V1.7.10) também em
Daniela, mesma "formatação" pros dois.** Pedido original (Ricardo):
"use a mesma fonte (peso, largura e entrelinha) do QUEM SOMOS. Faça o
box do texto do tamanho da foto e da largura da página. Ajuste a fonte
para caber." A primeira leitura (V1.7.5) empilhou foto e texto (texto
embaixo, largura cheia da página) — a referência enviada em seguida
mostrou que "da largura da página" não queria dizer "em vez de ficar ao
lado da foto": o layout certo é foto e texto LADO A LADO, como sempre
foi em `.diretor-bio`, só que com a caixa de texto esticada pra mesma
altura da foto e a fonte do "quem somos". Corrigido na V1.7.6 ("o texto
da bio tem que estar ao lado da foto. CRAVE NA REF"). V1.7.10 estendeu
o mesmo modificador pra Daniela ("APLIQUE A MESMA FORMATACAO DE RICARDO
RAPOZO"), com texto novo também (removido o parágrafo de abertura
"Baseada no Reino Unido..."; sobram os 3 parágrafos seguintes).
Documentação abaixo já reflete a versão corrigida e estendida:

- **Texto atualizado em `ricardo-rapozo.html`/`daniela-luquini.html` E
  em `time.html`** (mesmo conteúdo nas duas páginas que reproduzem cada
  bio, pra não divergir), mas o modificador `.diretor-bio--destaque` só
  vai nos HTMLs das páginas de diretor. `time.html` mantém o layout
  em Inter de sempre pros dois (era Newsreader até a V1.9), só com o
  texto atualizado.
- **Continua o grid de duas colunas herdado de `.diretor-bio`/
  `.diretor-bio--right`** (`38vw 1fr` pro Ricardo, `1fr 38vw` pra
  Daniela — o modificador não mexe em `grid-template-columns`, só em
  `align-items`). **`align-items: stretch`** no lugar do `center`
  herdado: no grid padrão, os dois itens ficam centralizados na altura
  NATURAL de cada um (a foto bem mais alta que o texto); com `stretch`,
  `.bio` estica até a altura da LINHA do grid — que a foto já define,
  por ser a mais alta. É assim que a caixa de texto vira "do tamanho da
  foto" ficando ao lado dela, sem nenhum cálculo manual de altura: o
  próprio grid resolve, pros dois lados (`--right` ou não).
- **Fonte "ajustada pra caber": `font-size: 2.4vw`, não `clamp()`** —
  um valor só, compartilhado pelas duas bios ("mesma formatação").
  Testado via Playwright (busca binária pelo maior `font-size` que
  ainda cabe na altura da coluna, sem `scrollHeight` estourar
  `clientHeight`) em seis larguras de tela (1024–2560px) pros DOIS
  textos: o de Ricardo (2 parágrafos) cabia até ~2.47vw–2.58vw; o de
  Daniela (3 parágrafos, um pouco mais longo E com uma quebra de
  parágrafo a mais) cabia só até ~2.44vw. `2.4vw` fica com margem de
  segurança abaixo do mais apertado dos dois — calibrar pro texto mais
  longo é o que garante que QUALQUER bio futura com esse modificador
  também caiba, não só as duas de hoje.
- **`overflow-y: hidden`, não `auto` (V1.7.10, era `auto` desde a
  V1.7.5).** Pedido explícito: "não deixe barra de rolagem nos textos
  da bio." Mesmo com o `font-size` calibrado com margem de segurança,
  uma barra de rolagem (native do navegador) é um estado visual pior
  que um corte silencioso de 1-2px que na prática nunca chega a cortar
  uma linha inteira de texto — `hidden` garante que isso nunca aparece,
  não importa o navegador/hinting de fonte.
- **Mesma fonte do "quem somos"**: `font-family: 'Advent Pro'`
  (explícito aqui porque `.bio` de base usa Inter, sans-serif, desde a
  V1.9 — era Newsreader antes),
  `font-variation-settings: 'wdth' 200, 'wght' 900`, `line-height: .9`.
  A regra de epígrafe do primeiro parágrafo (`.diretor-bio .bio
  p:first-child`) é resetada dentro do modificador (`font-weight/
  font-size/line-height: inherit`) — sem epígrafe, todos os parágrafos
  usam o mesmo tratamento tipográfico único.
- **Mobile (`@media max-width:820px`)**: `.diretor-bio` genérico já
  vira uma coluna só nesse breakpoint (foto e texto empilham em linhas
  separadas do grid — `align-items: stretch` do desktop não tem mais
  efeito de igualar alturas, cada item vira dono da própria linha). Só
  falta um `font-size` de leitura normal (`clamp(22px, 6vw, 30px)`, não
  o valor calibrado pra caber ao lado da foto) e a foto ganha
  `width:100%`, já que não precisa mais bater com a largura de uma
  caixa de texto ao lado.
- **Armadilha de mobile só em `--right` (Daniela), achada e corrigida
  na V1.7.10: `grid-row` não resetado no breakpoint.** O bloco mobile
  acima sempre resetou `grid-column: 1` pra `.diretor-bio--right .diretor
  -bio__foto`/`.bio`, mas nunca `grid-row` — e o desktop de
  `.diretor-bio--right` fixa os dois em `grid-row: 1` (pra ficarem lado
  a lado, foto na coluna 2). Sem resetar isso, no mobile (uma coluna só)
  os dois itens continuavam na MESMA célula do grid — foto e texto
  sobrepostos, cada um influenciando a altura auto do outro via
  `align-items: stretch`, resultado em uma altura de caixa sem sentido
  que cortava a maior parte do texto atrás da foto opaca (só a última
  linha ou parágrafo sobrava visível, dependendo da largura). Ricardo
  nunca teve esse bug por não usar `--right` (sem `grid-row` fixo pra
  início de conversa, o auto-placement do grid já colocava foto e bio
  em linhas separadas). Corrigido com `grid-row: auto` no mesmo lugar
  onde `grid-column` já era resetado.

**Dados dos diretores** vivem em `js/diretores.js`:

```js
window.DIRETORES = [
  { slug: 'ricardo-rapozo', nome: '...', retrato: '...', bio: [...] },
  ...
]
```

A bio é um array de parágrafos, não uma string, para maior flexibilidade
na renderização e tradução futura. (Esse arquivo é dado estrutural — o
conteúdo real de cada bio está escrito direto no HTML de cada página, não
puxado daqui; `diretores.js` documenta o formato pretendido pra quando
isso for automatizado.)

### Página de projeto (V7, revisado em V9/V10, reformulada por completo em V1.6)

Resolve duas pendências que ficaram em aberto por várias versões: cada
projeto agora tem página própria (`projeto.html?slug=<slug>`), e o vídeo
"de verdade" (não o loop mudo ambiente) tem um destino claro pra tocar.

**`projeto.html` é um template só**, não uma página por projeto — segue o
mesmo princípio de tudo aqui: nada escrito à mão. `js/projeto.js` lê
`?slug=` da URL e busca o projeto em `window.PROJETOS`.

**V1.6: reformulação completa, a partir de referência visual.** Da V7 à
V1.5, a página de projeto reaproveitava a "linguagem" da home: título
grande + mídia ambiente clicável (abrindo o vídeo de verdade num modal)
+ grade de fotos abaixo. A V1.6 troca isso tudo por duas peças só:

1. **Barra fixa no topo no desktop** (`.projeto-barra`), centralizada,
   texto sem fundo próprio (um patch chegou a dar fundo em pílula pra
   resolver contraste sobre o vídeo, mas foi revertido: "erro meu",
   segundo o próprio pedido) — `[Diretor]: [Título do projeto]`,
   inteira em Inter (era Newsreader até a V1.9), `font-size: clamp(11px,
   1.3vw, 15px)` (dois patches seguidos pedindo "diminua um ponto",
   1px a menos nos dois limites do `clamp` a cada vez: `17px/13px` →
   `16px/12px` (V1.9) → `15px/11px` (V1.9.1)). O nome do diretor é link
   pra página dele (`<slug>.html`, resolvido via `window.DIRETORES` —
   `js/diretores.js` carregado também em `projeto.html`, só pra isso),
   sempre sublinhado — não só no hover/foco como o resto dos links do
   site; exceção deliberada, pedida pra esse componente
   especificamente. `max-width: min(60vw, 640px)` com `white-space:
   nowrap` + `text-overflow: ellipsis` evita colisão com logo/voltar em
   título longo ou tela estreita, truncando em vez de quebrar linha ou
   invadir os dois.

   **No mobile (≤820px), sempre vira uma faixa branca fixa no rodapé**
   (V1.6, unificado nas duas variantes da página desde a V1.11). Pedido
   original: "quando vamos para a versão mobile, o [diretor][título]
   vão para uma barra branca fixa no rodapé." `position: sticky;
   bottom: 0`, `width: 100%`, fundo `var(--paper)` — precisa ser filha
   direta de `.projeto-corpo` (não neta, dentro de `<main>`) pro
   "alcance" do sticky (limitado pela caixa do pai) funcionar; por isso
   é HTML estático em `projeto.html` (`#projeto-barra`, `<p>` vazio,
   irmã de `<main>`), e `render()` só preenche `barra.innerHTML`. Sem
   galeria, `.projeto-corpo` é uma coluna flex de `100vh` (ver bloco
   "sem galeria" abaixo) e `#projeto-barra` é o último item dela —
   `position: sticky` sem nada rolando ao redor vira, na prática,
   `relative`: fica parada na própria posição de flex-item, que já é o
   rodapé da coluna.
2. **`.projeto-voltar`, um link só, fixo no canto superior direito, nas
   DUAS variantes da página (V1.11)** — substitui três mecanismos
   antigos por um: o antigo `.projeto-voltar` sticky-até-o-fim-da-
   rolagem (só com galeria, ver histórico logo abaixo), o `.projeto-
   fechar` (só sem galeria, V1.10), e o `.burger` (que sumiu de vez das
   duas). Texto "voltar", `href="./"`. Ver "LOGO — [Diretor]: [Título]
   — VOLTAR" no comentário de `css/layout.css` pro detalhe de
   alinhamento vertical entre os três elementos do chrome fixo (item 3
   abaixo).
3. **Alinhamento vertical entre logo, barra e voltar (V1.11) — achado
   num screenshot marcado à mão.** "Atente-se para o alinhamento
   desses elementos. Eu desenhei uma linha para mostrar como eles estão
   desalinhados." Os três são `position: fixed` com fontes de tamanhos
   DIFERENTES — usar o mesmo `top` fixo nos três alinha o TOPO da caixa
   de cada um, não o CENTRO do texto, e caixas de altura diferente com
   o mesmo topo ficam com centros diferentes. Corrigido calculando o
   `top` de cada um a partir da MESMA linha média (a do `.logo`,
   `18px + 21px/2 = 28.5px` do topo da viewport), subtraindo metade da
   própria altura de caixa (`font-size × line-height`) — `.projeto-
   barra` guarda o próprio `font-size` numa custom property (`--fs`)
   pra poder reusar no cálculo do `top` (`calc(28.5px - (var(--fs) *
   1.3) / 2)`); `.projeto-voltar` calcula direto (`19px`, fixo, já que
   não tem tamanho variável). Verificado via Playwright: os três
   centros de texto batendo em `28.5px` exatos, nas duas variantes.
4. **O vídeo de verdade toca direto, sem clique nenhum no meio do
   caminho.** Não é mais a mídia ambiente (loop mudo) esperando um
   clique pra abrir um modal — `js/projeto.js` converte `p.video`
   direto num `<iframe>` (YouTube/Vimeo) ou `<video>` (mp4 local) com
   autoplay, dentro de `.projeto-video`.

**Sem galeria, a página vira "só o player" — vídeo enchendo a viewport,
sem rolagem, sem rodapé (V1.10).** Pedido explícito, com referência
visual: "Quando ela NÃO TIVER GALERIA veremos apenas o player do
vídeo, sem rolagem da página... não temos rodapé." `js/projeto.js`
decide sozinho, em `render()`, sem nenhuma configuração nova em
`projetos.json`: `p.galeria` vazio ou ausente vira
`html.classList.toggle('is-projeto-sem-galeria', true)` — toda a
mudança de layout é CSS reagindo a essa classe, zero HTML gerado a
mais.

- **Sem rolagem**: `html.is-projeto-sem-galeria, html.is-projeto-sem-
  galeria body { height:100%; overflow:hidden }` — mesmo princípio de
  `html.is-overlay-open { overflow:hidden }` (seção 2), travando a
  PÁGINA; quem se adapta é o vídeo, não o contrário.
- **Vídeo enche o espaço**: `.projeto-corpo` vira `height:100vh;
  display:flex; flex-direction:column`; `#conteudo-projeto` (== `.feed`,
  cujo `padding-top` já reserva a folga do chrome fixo) vira `flex:1;
  min-height:0` pra ocupar o resto da altura; `.projeto-video` também
  `flex:1; min-height:0`, `padding-inline:0` (full-bleed, sem gutter
  lateral — "só o player"); o `<iframe>`/`<video>` dentro ganha
  `height:100%` e perde o `aspect-ratio:16/9` fixo (a proporção real do
  vídeo passa a ser secundária ao espaço disponível na viewport —
  pode letterboxar ou esticar levemente conforme a proporção original).
  `min-height:0` em cada nível é o que permite um item flex encolher
  abaixo do tamanho do próprio conteúdo — sem isso, o vídeo (com sua
  altura intrínseca) empurraria a página pra fora da viewport de novo,
  reintroduzindo a rolagem que essa variante existe pra evitar.
- **Com galeria, essa parte não se aplica** — `is-projeto-sem-galeria`
  nunca entra, a página mantém rolagem normal e a galeria de fotos
  abaixo do vídeo. O chrome fixo (item 1–3 acima) e a ausência de
  burger/rodapé (V1.11) já são iguais nas duas variantes — só o "sem
  rolagem" continua exclusivo de quando não há galeria.

**O que saiu da página de projeto nessa reformulação** — mas continua
existindo e em uso na home/galeria de diretor, só não mais aqui, então
nada foi apagado do site, só parou de aparecer nesse template
específico: título como `<h1 class="title">`; o agrupamento
`.block__main` e o truque de "título preso no scroll" (não fazia mais
sentido sem um título grande pra prender); `.bloco-projeto`; a mídia
ambiente clicável abrindo modal (`js/video-modal.js` continua existindo
e sendo acionado a partir da home/galeria de diretor — só a própria
página do projeto parou de carregar esse script); o carrossel de
`midia` no topo (V1.3 — deixou de fazer sentido sem a mídia ambiente,
já que agora só existe UM vídeo de verdade por projeto, não vários
cortes de loop pra escolher).

**A grade de fotos voltou logo depois, num patch na mesma versão.** A
V1.6 original também tinha tirado `.galeria-fotos` e seu lightbox
(`js/photo-modal.js`) da página de projeto — pedido explícito trouxe os
dois de volta, abaixo do vídeo, quando `p.galeria` não está vazio (o
dado nunca saiu de `projetos.json`; só a leitura em `js/projeto.js`
tinha sido removida por uma leva, e voltou). Diferença desse retorno em
relação a como era antes da V1.6: o **lightbox agora abre com fundo
branco** (`var(--paper)`, não mais `rgba(0,0,0,.92)` de cinema — ver
`.photo-modal` em `base.css`), pedido explícito, e **o logo continua
visível** enquanto ele está aberto. Isso introduziu uma classe própria,
`is-photo-open` — e num patch seguinte (ver "Modal de vídeo" abaixo), o
modal de vídeo passou a usar a mesma classe e o mesmo tratamento de
fundo, então os dois lightboxes do site hoje se comportam de forma
idêntica nesse aspecto.

**Vídeo com som, de propósito (patch — revertendo uma decisão
anterior).** A V1.6 original tinha deixado o vídeo mudo, por uma leitura
de que autoplay com som não seria permitido sem gesto do usuário. Pedido
explícito corrigiu isso: "quando entramos na página e o vídeo dá
autoplay ele VEM COM SOM ATIVADO". `js/projeto.js` não acrescenta mais
`&mute=1`/`&muted=1`/`muted` — o autoplay é pedido com som desde o
início. Isso não garante 100% dos casos (a política de autoplay de cada
navegador ainda decide se aceita ou recusa autoplay com som, geralmente
com base no "engajamento de mídia" que aquele domínio já tem pro
visitante), mas a intenção do código agora é sempre pedir com som — não
mais mudar isso preventivamente.

**`urlDeEmbed()` promovida pra `js/helpers.js` (V1.6)** — antes vivia
só dentro de `js/video-modal.js`; agora `js/projeto.js` também precisa
da mesma conversão de link (YouTube/Vimeo → URL de embed) pro vídeo
inline, então virou função compartilhada (`window.VulpesHelpers.
urlDeEmbed`) em vez de duas cópias da mesma regex arriscando desalinhar
uma da outra com o tempo.

**Histórico: "voltar" foi sticky-até-o-rodapé de V1.2 a V1.10, aposentado
na V1.11.** V1.2: link em fluxo normal no fim da página, canto direito.
V1.3: virou um botão flutuante fixo acompanhando a rolagem (canto
inferior esquerdo, depois **direito** na V1.3.2), sem nunca sobrepor o
rodapé — `position: sticky` limitado pela caixa de `.projeto-corpo`
(mesmo princípio ainda em uso pela barra no rodapé mobile, item 1 mais
acima). V1.10 removeu o `<footer>` desta página, e o motivo original
("nunca sobrepor o rodapé") deixou de existir; V1.11 foi além e
aposentou o próprio elemento — "voltar" virou um único link fixo no
topo, o mesmo em qualquer estado da página, ver item 2 mais acima
("`.projeto-voltar`, um link só"). `<p class="projeto-voltar">` (o
wrapper de bloco com `pointer-events: none` + `auto` só no `<a>`, uma
armadilha de CSS documentada aqui antes) não existe mais — o link novo
é uma `<a class="projeto-voltar">` direto, sem wrapper, então essa
armadilha específica não se aplica mais a este componente.

**Modal de vídeo** (`js/video-modal.js`, `.video-modal` no HTML das
páginas que ainda o incluem) é **deliberadamente separado** do sistema
de painel de `js/panel.js` (que nem carrega mais em `projeto.html`
desde a V1.11 — ver "LOGO — [Diretor]: [Título] — VOLTAR" mais acima),
pelo mesmo motivo do modal de fotos. Diferenças de propósito, não só de
código:

- Fundo fixo próprio, não a cor sorteada da sessão — assistir vídeo não
  deve competir com o efeito de cor do site. **Branco (`var(--paper)`),
  não mais preto de cinema (patch)** — pedido explícito: "o lightbox
  dos vídeos na página de portfólio também devem ser brancos", pra
  ficar consistente com o lightbox de fotos, que já tinha ganhado fundo
  branco antes.
- Conteúdo dinâmico por clique (URL do vídeo muda a cada abertura),
  enquanto os painéis têm HTML fixo.
- Qualquer elemento com `[data-video="<url>"]` abre o modal.

**Desde a V1.6, `projeto.html` não carrega mais `js/video-modal.js`
nem tem `#video-modal` no HTML** — a própria página do projeto não abre
o modal de vídeo (o vídeo já toca direto, ver acima). Esse modal
continua vivo e em uso na home e na galeria de diretor
(`index.html`, `ricardo-rapozo.html`, `daniela-luquini.html`,
`time.html`), onde a mídia ainda é o loop ambiente clicável.
`js/photo-modal.js` e `#photo-modal`, por outro lado, **voltaram pra
`projeto.html`** num patch logo depois da reformulação (ver "A grade de
fotos voltou..." acima) — a própria página do projeto é, de novo, a
única que os usa (a galeria de fotos nunca existiu na home/galeria de
diretor).

O campo `video` no projeto aceita link do YouTube (`youtu.be/...` ou
`youtube.com/watch?v=...`), **do Vimeo (`vimeo.com/<id>`, V10)** ou
caminho de mp4 local. `urlDeEmbed()` (renomeada de `idDoYoutube()` na
V10, quando ganhou o Vimeo; movida de `js/video-modal.js` pra
`js/helpers.js` na V1.6, ver acima) reconhece a plataforma por regex e
retorna a URL de embed correta (`youtube.com/embed/<id>` ou
`player.vimeo.com/video/<id>`) com autoplay; qualquer outra URL faz
quem chama montar um `<video controls autoplay>`. No modal, fechar
esvazia `.video-modal__frame` — é isso que para o áudio/vídeo, não só
escondê-lo.

**Só o hambúrguer some durante qualquer um dos dois modais (V11,
revisado no patch do fundo branco).** Os dois têm seu botão "fechar"
fixo em `top: 18px; right: var(--gutter)` — exatamente onde o
`.burger` também fica; sem escondê-lo, os dois ficariam sobrepostos,
competindo por clique e por foco de teclado. O logo (canto oposto, sem
conflito de posição nenhum) fica sempre visível nos dois — antes,
`js/video-modal.js` escondia logo E hambúrguer (`is-lightbox-open`,
estética do modo cinema, fundo preto); quando o modal de vídeo também
ganhou fundo branco, não sobrou motivo pra continuar escondendo o
logo, e `js/video-modal.js` passou a usar a mesma classe que
`js/photo-modal.js` já usava, `is-photo-open` (esconde só o
hambúrguer). Hoje os dois modais usam exatamente a mesma classe e o
mesmo comportamento de chrome — `is-lightbox-open` ficou sem nenhum
uso no site. Ver `css/base.css`.

`js/helpers.js` existe porque `feed.js` (home + galeria de diretor) e
`projeto.js` (página de projeto) precisam das mesmas funções —
`escapar`, `midiaHTML` e, desde a V1.6, `urlDeEmbed`.

### Nosso time

`time.html` continua existindo como página consolidada dos diretores (bloco
de pessoa para cada um, sem galeria). Seu propósito é quadro executivo, não
portfólio individual. As páginas de diretor (`ricardo-rapozo.html` etc.) são
as que têm seus trabalhos.

### Quem somos

**V1.7: virou card centralizado**, mesmo princípio do card de contato
(mesmo `top:50%; left:50%; transform:translate(-50%,-50%)`, só que bem
maior) — não sobe mais do rodapé cobrindo 2/3 da tela, era assim desde
sempre até aqui. Abre `.is-overlay-open` igual aos outros dois painéis,
então o fundo (e tudo que participa do duotone, seção 2) inunda de cor
por baixo/ao redor do card — o card em si é branco (`var(--panel-bg)`),
por cima da cor, não afetado por ela.

Mesma cor da sessão que o menu. Abrir o menu, fechar, abrir o quem somos —
a cor é a mesma. Ela pertence à visita, não ao painel.

**Painel é um componente com três variantes** (V5 acrescentou o card de
contato), não componentes separados:

| | menu | quem somos | contato |
|---|---|---|---|
| origem | topo | centro (card, V1.7) | centro (card) |
| altura | natural | natural, `max-height:85vh` | natural |
| conteúdo | navegação + redes | texto + logo | local, e-mail |
| entrada/saída | `transform` deslizando | `opacity` (fade puro, V1.7.8) | `transform` + `opacity` |

Altura de "quem somos" era fixa (`66vh` no desktop, `100vh` no mobile) até
a V9 — virou `height: auto`, pra barra crescer só o necessário pro
conteúdo. Com o card centralizado da V1.7, ganhou também `max-height:
85vh` + `overflow-y: auto` — texto grande poderia, em telas baixas,
ultrapassar a altura da viewport; sem isso o conteúdo vazaria pra fora
do card.

Comportamento idêntico nos três: fecha com Esc e com clique fora, prende o foco
enquanto aberto, devolve o foco ao gatilho ao fechar, `aria-expanded`, `inert`
no conteúdo atrás, e todos disparam `.is-overlay-open` (cor de fundo sorteada
da sessão + duotone nas mídias visíveis).

**Entrada/saída: fade simples de `opacity`, não mais dip to white
(V1.7.8, revertendo a V1.7).** A V1.7 tinha trocado a entrada/saída do
"quem somos" pra reaproveitar o dip-to-white das transições de página
(seção 5) via `document.startViewTransition()` (versão "same-document"
da API, mesmo truque de `js/diretor-tabs.js` pra troca de aba). Pedido
explícito reverteu isso: "retire animação DIP TO WHITE do QUEM SOMOS...
entra o card QUEM SOMOS. FADE IN FADE OUT NORMAL." `js/panel.js` voltou
a chamar `aplicar()` direto, sem `startViewTransition()` nenhum — a
função `usaDip()` que decidia qual painel usava qual caminho foi
removida (não sobrou nenhum painel que precise dela). `.panel--about`
(`css/base.css`) ganhou de volta uma `transition: opacity var(--t-panel)
var(--ease-out)` própria — sem `scale` nem `transform` na lista de
propriedades animadas, só opacidade, mais simples que
`.panel--contact` (que anima `transform: scale()` junto). O efeito de
cor (`is-overlay-open`, fundo + duotone) nunca dependeu da animação de
entrada/saída de painel nenhuma — continua idêntico nas três variantes,
como sempre foi.

**Abrir "quem somos" espera o painel anterior recolher de verdade antes
de começar o fade, 480ms em vez dos 120ms padrão (V1.7.9).** Menu e
contato trocam entre si com uma sobreposição fixa de 120ms
(`js/panel.js`, função `abrir()`) — o painel que sai começa a sumir,
120ms depois o que entra começa a aparecer, os dois se cruzando no
meio; existe assim de propósito, senão a tela fica vazia por um
instante e o corte parece erro de carregamento. Pro card de "quem
somos" isso ficava ruim: como ele é enorme (90vw), enquanto ainda
semitransparente (opacity baixo, em pleno fade) dava pra ver o
CONTEÚDO da página por trás — fotos, títulos — através dele, ao mesmo
tempo em que o menu ainda estava visivelmente deslizando pra fora. Os
dois movimentos se misturavam num "fantasma" que lia como se o fundo
também estivesse animando, quando na verdade era só o card
semitransparente revelando a página atrás dele. Pedido explícito: "a
barra do menu se recolhe E o card aparece com fade in" — sequência
limpa, um depois do outro, não sobreposto. `abrir()` agora usa
`var espera = painel === about ? 480 : 120` — 480ms é a mesma duração
de `--t-panel` (tokens.css), ou seja, espera o menu terminar de
deslizar pra fora ANTES de adicionar `is-open` no card. Só pra abrir
`about`; menu↔contato (e fechar, em qualquer painel) continuam com o
comportamento de sempre.

**Armadilha encontrada e corrigida no processo: `.panel.is-open {
transform: translateY(0) }` (regra genérica, duas classes,
especificidade 0-2-0) vence `.panel--about` sozinho (uma classe,
0-1-0).** A primeira versão do card centralizado só declarava
`transform: translate(-50%,-50%)` em `.panel--about` (fechado); assim
que `.is-open` entrava, a regra genérica tomava a frente e resetava
pra `translateY(0)`, cancelando a centralização — o card ia parar com
a borda esquerda grudada no centro horizontal da tela, esticando pra
fora da viewport pela direita. Sintoma indireto: o botão "fechar"
ficava fora da área clicável/visível, porque ele é `position:absolute`
ancorado no próprio card. Corrigido do mesmo jeito que
`.panel--contact.is-open` já fazia (e que a V1.7 quase repetiu o
descuido de não copiar): redeclarar `transform: translate(-50%,-50%)`
também em `.panel--about.is-open`, com especificidade igual à regra
genérica (0-2-0) e depois dela no arquivo — desempate por ordem de
declaração a favor do mais específico ao componente.

### Card de contato

Item "Contato" do menu não é mais um `mailto:` direto — abre um card
centralizado (`.panel--contact`), a terceira variante do painel. Ao invés de
descer do topo ou subir do rodapé, ele nasce do centro com `scale` + `opacity`
em vez de `translateY`. Conteúdo: cidade/país e e-mail (`mailto:`) — telefone
removido na V1.7.11 (pedido explícito, "retire o telefone do card de
CONTATO"; o `<p class="contact-card__item">` com `tel:+5511994780379`
saiu do HTML das 5 páginas, nada mudou em CSS/JS, já que `.contact-
card__item` estiliza qualquer quantidade de itens igual). **`São
Paulo/SP, Brasil`, com o `/SP` (V1.7.12)** — era só `São Paulo,
Brasil`; pedido explícito pra desambiguar a cidade (São Paulo capital)
do estado (SP), mesmo formato que o rodapé já usa ("São Paulo/SP -
Brasil", ver seção 8), só que com vírgula em vez de traço, pontuação
que o card já tinha antes do patch. Mesmo efeito de cor de fundo dos
outros painéis, porque participa do mesmo array `paineis` em
`js/panel.js` — nenhum código novo de foco/Esc/clique-fora
foi necessário.

A abertura de painéis por `data-abre` é genérica: o valor do atributo é o `id`
do painel-alvo (`data-abre="quem-somos"` → `#quem-somos`, `data-abre="contato"`
→ `#contato`). Um item de menu novo que abre painel não pede alteração em
`panel.js`, só a marcação `data-abre="<id>"` no HTML.

**Logo e "fechar": histórico até V0.13.1, layout novo na V1.7.** V7 pôs
o logo quadrado (`vulpesFilmes-LOGO-1x1.png`) ao lado do texto, num flex
row. V12 trocou pelo logo horizontal (`vulpesFilmes-LOGO-HORIZONTAL.png`,
1791×772) e empilhou numa coluna (logo no topo, texto abaixo). V13
voltou lado a lado, errando a proporção (logo pequeno, ~53% da largura
do texto, tudo flush no gutter); **V0.13.1 corrigiu**, comparando pixel
a pixel com a referência da época: logo maior (~85% do texto) e o
conjunto centralizado no painel, não no gutter. Essa disposição "lado a
lado" durou de V0.13.1 até a V1.6.x.

**V1.7 muda de novo, a partir de nova referência visual**: texto em
cima, logo embaixo — os dois centralizados, numa coluna
(`.about-content { display:flex; flex-direction:column; align-items:
center; text-align:center; }`), não mais lado a lado. Ordem invertida
direto no HTML (parágrafos antes da `<img>` do logo), não via CSS
`order` — assim a ordem de leitura por teclado/leitor de tela já bate
com a ordem visual, sem precisar de nenhum ajuste de tabindex. Logo
menor que antes do layout em coluna, mas não pequeno: **`clamp(220px,
22vw, 400px)`** — cerca de 31% da largura do card, a mesma proporção
medida na referência (a primeira versão da V1.7 tinha errado essa
medida por baixo, `clamp(160px, 14vw, 220px)`, ~17% do card; corrigido
num patch logo depois, comparando a proporção com a referência,
o mesmo tipo de erro e correção que a V0.13.1 já tinha passado antes,
só que agora com o logo pequeno demais em vez de desproporcional ao
texto).

**Logo vira link pro feed do portfólio (V1.7.12).** Pedido explícito:
"ao clicar no logo do card QUEM SOMOS, voltamos para o FEED do
portfolio." A `<img class="about-content__logo">` agora vive dentro de
`<a class="about-content__logo-link" href="./" aria-label="Voltar para
o portfólio">` — mesmo destino (`./`) do `.logo` fixo do cabeçalho, em
todas as 5 páginas. `.about-content__logo-link { display: block; }` só
deixa explícito o comportamento que o link já teria por ser filho
direto de um flex container (blockificado automaticamente); nenhuma
outra regra precisou mudar, o `width`/`aspect-ratio` do logo continuam
na própria `<img>`. Como é uma navegação de verdade (`href`, não
`data-abre`), funciona igual em qualquer página — inclusive de volta
pra ela mesma, se já estiver no feed (`index.html`), recarregando a
página como qualquer link normal.

O botão "fechar" continua `position: absolute; top: 18px; right:
var(--gutter)` **dentro do painel** (V12) — com o painel virando card
centralizado na V1.7 em vez de faixa no rodapé, esse posicionamento
relativo ao próprio painel (não ao viewport) passou a ancorar no canto
superior direito do CARD, não mais da faixa inferior da tela; a regra
em si não precisou mudar, só o contexto ao redor dela.

**Botão vira "×" (patch V1.7.3) — deixou de ser o único painel com texto
"fechar".** Pedido explícito: "substitua o FECHAR por um X". Marcação
trocou de `<button class="close" data-fecha>fechar</button>` (ou `<a
class="close" data-fecha>fechar</a>` em `time.html`, inconsistência de
tag pré-existente, mantida) para `<button type="button" class="close
close--x" data-fecha aria-label="Fechar">&times;</button>` nas 5
páginas — o texto visível vira o glifo `×`, mas `aria-label="Fechar"`
preserva o rótulo por extenso pra leitor de tela, já que `&times;`
sozinho não é um texto acessível confiável. `.close--x` reseta o
sublinhado (herdado de `.panel--about .close, .panel--contact .close`)
e aumenta a fonte pra `32px`, peso/largura de volta ao padrão do body
(`'wdth' 100, 'wght' 400`) — um símbolo não pede o mesmo tratamento
tipográfico de um link de texto.

**Mesma armadilha de especificidade da V1.7, terceira vez que aparece
no projeto.** Primeira tentativa declarou `.close--x { text-decoration:
none; font-size: 32px; ... }` sozinha (uma classe, 0-1-0) — perdia pra
`.panel--about .close, .panel--contact .close { text-decoration:
underline; font-size: 19px; }` (duas classes, 0-2-0), que aparece depois
no arquivo. Resultado: o "×" saía sublinhado e do tamanho do texto
"fechar" antigo, apesar da regra nova existir. Corrigido reescopando
pra `.panel--about .close--x` (duas classes, mesma especificidade da
regra genérica, e depois dela no arquivo) — o mesmo padrão de bug (e
o mesmo tipo de correção) da armadilha `.panel.is-open`/`.panel--about`
descrita acima. Vale registrar como alerta permanente: qualquer override
de `.close` dentro de um painel específico precisa nascer com
especificidade igual ou maior que `.panel--about .close, .panel--contact
.close`, nunca como classe solta.

**Texto — real desde V11** (era lorem ipsum provisório antes disso):

> A Vulpes é um pequeno bureau de soluções audiovisuais. Um lugar para
> pensar, criar e dar forma a ideias.

> Trabalhamos onde estratégia encontra imagem: na direção, no roteiro, na
> edição, no motion e na pós-produção. Entramos no projeto conforme o que
> ele pede, juntando olhar criativo, repertório e precisão técnica para
> transformar uma boa ideia em algo que realmente mereça ser visto.

**Corpo do texto: Advent Pro desde a V1.7**, não mais Newsreader — outra
mudança da mesma referência visual ("CRAVE A REFERÊNCIA"): esse painel
virou destaque tipográfico grande e centralizado, não mais leitura
corrida discreta em serif (`clamp(16px, 1.5vw, 20px)`, entrelinha 1.5,
à esquerda, 52ch) — o tratamento que tinha desde a V11 (serif Newsreader
até a V1.9; ver "Sans-serif no lugar de Newsreader" na seção 3, a fonte
trocou de vez, não só aqui). O corpo de texto corrido continua fora do
"quem somos" mesmo — `.bio` e o cartão de contato
(`.contact-card__item`) — só deixou de ser a fonte do "quem somos".

**`'wdth' 200, 'wght' 900` (patch — era `175`/`700` na primeira versão
da V1.7).** Os dois no teto do eixo variável da Advent Pro — mesmo
tratamento das manchetes mais pesadas do site (`.title`,
`.diretor-nome`). A primeira versão tinha ficado aquém do pedido
original ("faça o texto ter largura 200 e peso 900"): nem a largura
nem o peso estavam no máximo do eixo, o que deixava o texto visualmente
mais estreito e mais fino do que a referência mostrava.

**`line-height: .9` (patch — era `1.25`).** "Observe o espaçamento
entre as linhas. Diminua, eles devem praticamente se tocar. Eu quero
um BOLO DE TEXTO." `1.25` era o resquício do tratamento de leitura
corrida de antes (serif, corpo pequeno) — grande demais pra um bloco
de texto grande e peso 900 querendo ler como massa compacta, não como
parágrafo espaçado. `.9` é mais apertado até que `.diretor-nome`/
`.title` (`.94`/`.98`), que já são as entrelinhas mais justas do resto
do site — esse painel pede um aperto ainda maior, de propósito.
`margin-top` entre parágrafos também desceu, de `1em` pra `.5em`: com
a entrelinha tão mais justa, a folga antiga entre um parágrafo e outro
ficaria desproporcionalmente grande perto do espaço quase nulo dentro
de cada parágrafo. `font-size: clamp(22px, 2.6vw, 38px)`,
`text-align:center`, `max-width: min(900px, 80%)` — esses não mudaram
nos dois patches.

**Card testado menor na V1.7.3, revertido na V1.7.4.** V1.7.3 encolheu
pra `width: min(900px, 85vw)` ("DIMINUA O box branco"), mas o resultado
não agradou visualmente ("a diminuição do box não ficou boa") — V1.7.4
devolveu ao tamanho de sempre, `width: min(1300px, 90vw)`, com o padding
também de volta a `calc(var(--gutter) * 1.6) var(--gutter)
calc(var(--gutter) * 1.4)`. Fica registrado que o tamanho menor já foi
tentado e rejeitado, pra não repetir a mesma tentativa sem necessidade
num patch futuro.

---

## 7. Vídeo

Loops curtos, 5s, mudos.

```html
<video src="..." autoplay muted loop playsinline preload="none"></video>
```

`playsinline` é obrigatório ou o iOS abre em tela cheia.
`muted` é obrigatório ou o autoplay é bloqueado.

### Performance

Este é o maior risco técnico do site. Dez loops autoplay numa única página
travam celular e queimam banda.

- `IntersectionObserver`: dá `play()` ao entrar na viewport. Fora do
  carrossel, dá `pause()` ao sair; dentro do carrossel não pausa mais
  desde V13 (ver seção 4).
- `preload="none"` — primeiro paint não depende de vídeo carregar. Sem
  `poster`: desde V13, vídeo em loop tem prioridade sobre imagem
  estática (ver seção 4, "Vídeo tem prioridade sobre poster") — quem
  preenche o espaço até carregar é a cor de `--placeholder`.
- Alvo por arquivo: 5s, H.264 mp4 + WebM, largura máxima 1600px, abaixo de 1.5 MB.
  (Os arquivos reais adicionados a partir de V10 são bem mais pesados que
  isso — a meta original nunca chegou a ser seguida na prática.)
- Sem faixa de áudio no arquivo — não basta o atributo `muted`, o áudio pesa.
- **`.play()` pode rejeitar mesmo com `muted` (V14)** — mais comum logo
  depois de setar `.src`, se o navegador ainda não processou a troca de
  fonte; o risco cresce com arquivos maiores (o loop do Dossiê Anônimo,
  ~18MB, expôs isso: carregava certinho, `readyState` 4, mas nunca saía
  do `currentTime: 0`). Sem tratamento, o `.catch(function(){})` engolia
  o erro e nada tentava de novo. `js/media.js` agora tem uma função
  `tocar(v)` compartilhada pelos dois observers (página e carrossel): se
  o primeiro `.play()` rejeitar, escuta `canplay` uma vez e tenta de
  novo.

### Folga de resolução

Removida. Existia apenas para suportar o zoom de hover da mídia. Sem o zoom,
não há necessidade de folga — o arquivo pode ser exportado na largura exata
de exibição. Isso libera orçamento de peso para loops maiores ou vídeos mais nítidos.

### Movimento reduzido

```css
@media (prefers-reduced-motion: reduce) { ... }
```

Com a preferência ativa: não dar autoplay, mostrar o `poster`, e desligar as
transições de cor e duotone. O menu ainda funciona, só troca de estado sem animar.

---

## 8. Rodapé

**Removido de `projeto.html` na V1.10 — continua em todas as outras
páginas.** Pedido dentro da reformulação da página de projeto (ver
seção 6, "Página de projeto"): "não temos rodapé" (variante sem
galeria) + "retire o rodapé" (variante com galeria) + "ATENÇÃO: O
RODAPÉ SÓ APARECE NA PAGINA PRINCIPAL (que agora se chama PROJETOS)" —
lido como reforço desses dois pedidos anteriores (a lista inteira era
sobre "a página PROJETO", não um pedido sitewide), confirmado
explicitamente: escopo é só `projeto.html`. `index.html`,
`ricardo-rapozo.html`, `daniela-luquini.html` e `time.html` mantêm o
rodapé de sempre, sem nenhuma mudança. Motivo prático em
`projeto.html`: a variante "sem galeria" trava a rolagem e faz o vídeo
ocupar a viewport inteira — não sobraria espaço pro rodapé mesmo se
ele continuasse no HTML; a variante "com galeria" só perdeu o rodapé
mesmo, sem nenhuma outra mudança de layout.

**Conteúdo, em duas linhas (V1.3.3 — antes eram três, um `<p>` por
frase):**

- `contato@vulpesfilmes.com` (link `mailto:`) ` © 2026`
- `São Paulo/SP - Brasil. Atendendo o mundo todo.`

O copyright voltou a usar a entidade `&copy;` (`©`) — a V1.3.3 tinha
trocado por `(C)` como texto, revertido na V1.3.4 — e perdeu o nome
"vulpesfilmes" depois do ano (o logo já está fixo no canto da página o
tempo todo; repetir o nome no rodapé virou redundante). E-mail e
copyright dividem a primeira linha porque o link `mailto:` só envolve
o e-mail — o resto da linha (` © 2026`) fica fora da tag `<a>`, em
texto solto no mesmo `<p>`.

Redes sociais (`vimeo / instagram / youtube`) **removidas do rodapé em
V8** — continuam só no menu (`.panel--menu .social`), não duplicadas aqui.

**Tipografia e cores:**

- `wdth` 100, peso 700 (V1.3; era 600 desde a V6, e por uma leva breve
  — V1.2 — o copyright era a única linha nesse peso, com e-mail e
  endereço em Newsreader). 14px. Nada de `wdth` 200.
- **Rodapé inteiro em Advent Pro, em negrito (V1.3).** A V1.2 tinha
  posto e-mail e endereço em Newsreader (mesmo serif do resto do texto
  corrido do site, `.bio`/`.panel--about .prose`), com só o copyright
  na Advent Pro; revertido a pedido — as três linhas voltam a usar a
  mesma fonte e o mesmo peso, sem seletor específico por linha
  (`footer p:not(:first-child)` foi removido; a regra `footer` sozinha
  já cobre as três).
- **Fundo invertido — preto, texto claro (V1.6)**: `footer.footer-
  invertido { background: var(--ink); color: var(--paper); border-top-
  color: var(--paper); }`, marcado direto no HTML (`<footer class=
  "footer-invertido">`) das 5 páginas do site. Nasceu escopado só à
  página de projeto (item da reformulação da V1.6), um patch na mesma
  leva estendeu pra sitewide. `a { color: inherit }` (`base.css`) já
  resolve o link do e-mail sozinho, sem seletor próprio — e como o
  rodapé não fica mais sujeito à cor sorteada da sessão (`--hue`)
  quando um painel abre (a regra de fundo/cor do painel mira `body`,
  não `footer`), ele mantém preto/claro o tempo todo, painel aberto ou
  não.

**Layout e espaçamento:**

- Fluxo normal, não fixo. Fica no fim de `<main>`, no lugar que lhe pertence.
- Regra hairline `1px solid --ink` separando do último bloco.
- Padding: 24px `--gutter` (horizontal e vertical).

**Interação:**

- Links herdam o vocabulário do site: `:hover` e `:focus-visible` com sublinhado
  (3px, thickness de offset 0.14em, `skip-ink: none`).
- Sem hover de cor, sem escala, sem fade — coerente com o menu.

---

## 9. Responsivo

Ponto de quebra: 820px.

Abaixo dele:

- Coluna única central, largura ~90vw.
- Alternância morre. Todo texto alinhado à esquerda.
- Título cai para `clamp(26px, 8vw, 38px)`.
- Menu ocupa a altura inteira, não metade.
- Considerar `wdth 175` nos títulos no celular. Em 200 as palavras quebram
  cedo demais numa tela de 380px e o título vira quatro linhas.

---

## 10. Estrutura de arquivos

```
/
├── index.html                  home
├── projeto.html                template único de projeto (?slug=)
├── ricardo-rapozo.html, daniela-luquini.html   páginas de diretor
├── time.html                   quadro executivo (sem galeria)
├── css/
│   ├── tokens.css      cores, tipografia, espaçamento
│   ├── base.css        reset, fonte, painéis, modais, rodapé
│   └── layout.css      blocos, alternância, carrossel, galeria de fotos
├── js/
│   ├── hue.js            sorteio da cor + sessionStorage
│   ├── helpers.js        escapar()/midiaHTML(), compartilhado
│   ├── no-download.js    bloqueia menu de contexto em img/video (V17)
│   ├── projetos.js       carrega projetos.json em window.PROJETOS
│   ├── diretores.js      dados dos diretores (window.DIRETORES)
│   ├── diretor-tabs.js   abas trabalhos/bio da página de diretor
│   ├── feed.js           monta a home e a galeria de diretor
│   ├── projeto.js        monta a página individual de projeto
│   ├── panel.js          menu/quem-somos/contato: abrir, foco, inert
│   │                       (não carregado em projeto.html desde V1.11)
│   ├── idle-color.js     efeito de cor após 30s parado (V1.8)
│   ├── video-modal.js    modal de vídeo (YouTube/Vimeo/mp4)
│   ├── photo-modal.js    lightbox de fotos da galeria
│   ├── media.js          IntersectionObserver, fallback de mídia quebrada
│   ├── carousel-infinite.js   carrossel infinito + arrasto com mouse
│   └── chrome.js         injeção de menu/rodapé — não usado por nenhum
│                          HTML hoje, mantido em sincronia por precaução
├── media/
│   ├── posters/
│   ├── loops/
│   ├── galeria/<slug>/   fotos da página de cada projeto
│   └── time/             retratos dos diretores
└── projetos.json       fonte única do conteúdo
```

`projetos.json` existe para que a home seja gerada por loop, não escrita à mão.
Adicionar projeto = adicionar objeto no array.

```json
{
  "slug": "conferencia-carbono-2026",
  "titulo": "Cobertura Conferência Brasileira de Carbono 2026",
  "cliente": "",
  "ano": 2026,
  "data": "2026-09-01",
  "registro": "documental",
  "tipo": "single",
  "diretor": ["ricardo-rapozo"],
  "video": "https://youtu.be/vB-p7HZ4F18",
  "placeholder": "#b9ad9a",
  "midia": [
    { "loop": "media/loops/carbono.mp4", "poster": "media/posters/carbono.jpg", "alt": "..." }
  ],
  "galeria": [
    { "src": "media/galeria/conferencia-carbono-2026/foto-01.jpg", "alt": "..." }
  ]
}
```

**`data` (`"AAAA-MM-DD"`, V1.3.1) é obrigatório e define a ordem do
feed** — home e galeria de diretor, sempre mais recente primeiro. Regra
explícita do pedido: "um novo projeto adicionado deve SEMPRE ser o
primeiro do feed, a não ser que seja especificado uma data" — na
prática, isso significa que todo projeto novo precisa vir com `data`
já preenchida (a de hoje, se ninguém especificar outra) pra realmente
entrar como o mais recente; sem `data`, `js/projetos.js` trata como
string vazia no sort, o que empurra o projeto pro **fim** da lista, não
pro início (`undefined`/`""` perde de qualquer data real numa
comparação de string). O sort roda uma vez, em `js/projetos.js`, assim
que `projetos.json` termina de carregar — `window.PROJETOS` já chega
ordenado em todo lugar que o consome (`js/feed.js`, tanto a home quanto
a galeria filtrada por diretor). Comparação direta de string funciona
porque o formato ISO (`AAAA-MM-DD`) já ordena igual à ordem
cronológica, sem precisar converter pra `Date`.

`tipo` é `"single"` ou `"carousel"` (ver seção 4). `midia` é sempre array —
um item em `single`, vários em `carousel`. Entre V1.3 e V1.5, ter mais
de um item em `midia` também virava carrossel na própria página do
projeto, não só no feed; a reformulação da V1.6 (ver seção 6, "Página
de projeto") removeu esse carrossel de lá — a página do projeto mostra
só o vídeo de verdade agora, `midia` continua servindo unicamente pro
loop ambiente do feed/galeria de diretor. `placeholder` é a cor de fundo do
bloco enquanto a mídia carrega ou falha; se `poster` apontar para um arquivo
inexistente, `js/media.js` detecta o erro de carga e troca a mídia por um
aviso "mídia em produção" sobre essa cor — é o jeito padrão de entrar com um
projeto cujo material ainda não chegou (a mídia de `midia[]` — o loop
ambiente — não precisa existir pra o projeto ter uma página com vídeo real).

**`diretor` é array de slugs, não string única (V1.8.1) — suporte a
co-direção.** Era `"diretor": "ricardo-rapozo"`; migrado pra
`"diretor": ["ricardo-rapozo"]` nos 7 projetos existentes quando o
primeiro projeto com dois diretores apareceu (`minidoc-cop30-embrapa`,
`["ricardo-rapozo", "daniela-luquini"]` — "esse job 'EMBRAPA' é
co-dirigido pela Daniela Luquini"). Os dois consumidores mudaram junto:
`js/feed.js` (filtro da galeria de diretor) trocou `p.diretor === slug`
por `p.diretor.indexOf(slug) !== -1` — com array, o projeto aparece na
galeria de TODOS os diretores listados, não só um; `js/projeto.js`
(barra do topo da página do projeto) resolve cada slug do array pro
objeto em `window.DIRETORES`, monta um link por diretor e junta os
nomes (`"X, Y e Z"` — vírgula entre os do meio, " e " antes do
último; com um só, mostra só o nome, sem juntador nenhum). Manter como
array mesmo em projetos de diretor único evita checagem de tipo
(`Array.isArray`) espalhada pelo código só pra suportar os dois
formatos — todo consumidor pode assumir array sempre.

`video` (V7, ganhou suporte a Vimeo em V10) é o link do vídeo de
verdade — YouTube, Vimeo ou mp4 local — que toca no modal ao clicar na
mídia (sem ícone desde V8), tanto na home/galeria de diretor quanto na
página do projeto. Vazio (`""`) quando o projeto ainda não tem vídeo pra
mostrar; a mídia simplesmente não fica clicável nesse caso.

`galeria` é um array de `{ src, alt }` — desde V7, as fotos da página
individual do projeto (`projeto.html?slug=<slug>`); desde V11, **a mesma
fonte alimenta o carrossel do feed** quando não está vazia (ver seção 4,
"Tipos de mídia"). Convenção, não regra, quanto à pasta: fotos novas de
registro vão em `media/galeria/<slug>/` (caso do `cbcc-2026`); quando a
galeria reaproveita imagens que já existiam em `media/posters/` (caso do
`dancebook-brasil`, cujas 3 fotos de poster são ao mesmo tempo os slides
do carrossel do feed e a galeria da página do projeto), não há
necessidade de duplicar o arquivo só por causa da pasta. Vazio até o
projeto ter fotos de registro.

**Histórico: a armadilha do poster duplicado (V12), resolvida de vez em
V13.** `slidesDoCarrossel()` põe `midia[0]` (o slide de vídeo) na frente
das fotos de `galeria` — em V12, o `poster` desse vídeo (`dancebook-01.jpg`)
era o mesmo arquivo de uma das fotos da galeria, e o carrossel mostrava a
mesma imagem duas vezes (uma "atrás" do vídeo, outra como foto solta). O
conserto de V12 foi pontual (zerar só o poster do Dancebook); V13
generalizou: **vídeo em loop nunca tem poster**, ver "Vídeo tem
prioridade sobre poster" na seção 4 — o campo `poster` de um item com
`loop` simplesmente não é mais usado pra nada.

### Compartilhamento (Open Graph / Twitter Card, V1.8.4)

Até a V1.8.3 nenhuma página tinha `og:*`/`twitter:*` — colar o link do
site num chat/rede social gerava um card genérico, sem imagem. Pedido:
"precisamos melhorar o card do site vulpes... existe um arquivo
previewVulpes.jpg. Trabalhe isso." `media/previewVulpes.jpg` (1200×630,
fundo amarelo da marca + wordmark "vulpesfilmes" em preto) já veio
pronto no tamanho recomendado pelas plataformas — não precisou de
nenhum tratamento de imagem, só entrar nas tags.

Cada uma das 5 páginas ganhou o mesmo bloco no `<head>`, logo depois do
`<meta name="description">` que já existia:

```html
<meta property="og:type" content="website">
<meta property="og:site_name" content="vulpesfilmes">
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:url" content="https://vulpesfilmes.com/...">
<meta property="og:image" content="https://vulpesfilmes.com/media/previewVulpes.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="...">
<meta name="twitter:description" content="...">
<meta name="twitter:image" content="https://vulpesfilmes.com/media/previewVulpes.jpg">
```

`og:title`/`og:description` reaproveitam o `<title>`/`<meta
description>` que cada página já tinha — nenhum texto novo inventado.
`ricardo-rapozo.html`/`daniela-luquini.html` usam `og:type="profile"`
(páginas de pessoa); as outras três, `"website"`.

**`og:image`/`og:url` em URL absoluta (`https://vulpesfilmes.com/...`),
não relativa** — ao contrário de link/script/img normais do site
(sempre relativos, pra funcionar em qualquer domínio/porta local), os
crawlers de preview (WhatsApp, Twitter/X, Facebook, Slack) buscam a
imagem direto do servidor deles, sem contexto de página — uma URL
relativa não resolveria pra nada.

**Limite conhecido: `projeto.html` é um template único (seção 6) — o
card de um link `projeto.html?slug=X` específico não reflete aquele
projeto.** `og:title`/`og:description`/`og:url` de `projeto.html` são
genéricos ("Projeto — vulpesfilmes"), porque essas tags são estáticas
no HTML e os crawlers de preview não executam o JavaScript que troca
`document.title`/monta a página a partir de `projetos.json` (mesma
limitação que já existia pro `<title>` da aba do navegador antes desse
JS rodar — não é uma limitação nova introduzida aqui, só mais visível
agora que existe card pra reparar nisso). Resolver de verdade pediria
gerar HTML por projeto em build ou renderizar no servidor — fora do
escopo de um site 100% estático sem build.

---

## 11. Pendências

Bloqueiam a implementação:

- [ ] **Vídeos do YouTube de `cbcc-2026` e `historias-do-brasil-redes`
  mostraram "Vídeo indisponível... a conta do YouTube associada a ele
  foi encerrada" (achado na V1.11) — mas intermitente, não é bug de
  código.** Visto tanto no screenshot enviado (`cbcc-2026`) quanto numa
  verificação direta via Playwright, nos dois projetos — mas ao
  reconferir os dois logo em seguida (mais duas vezes cada), os
  embeds carregaram normalmente. Não corrigido nem descartado: pode
  ter sido uma instabilidade passageira do lado do YouTube (ou algum
  rate-limit disparado pelos vários carregamentos em sequência durante
  os testes desta versão), não necessariamente a conta de fato
  encerrada — mas o erro específico ("conta encerrada") normalmente
  não é o tipo de coisa que aparece à toa. Vale o usuário confirmar
  esses dois vídeos direto no YouTube (login na conta, ver se algum
  aviso apareceu) antes de assumir que está tudo bem; se acontecer de
  novo, aí sim provavelmente precisa de link novo — não é algo que o
  código do site (`urlDeEmbed()`) possa corrigir sozinho.
- [ ] Lista de projetos: título, cliente, ano, registro, tipo de mídia, arquivos
- [x] O carrossel quebra a alternância? — **Mantém o lado** (V6). O bug real
  era outro: `.block--right .block__main { grid-column: 2 }` sobrevivia à
  redução da grid pra 1 coluna do `:has(.media--carousel)`, criando uma
  coluna implícita extra e prendendo o carrossel a uma largura menor, com
  vão vazio à esquerda em vez de ocupar a janela. Corrigido forçando
  `.block:has(.media--carousel) .block__main { grid-column: 1 }`.
- [ ] Retratos ou reels de Ricardo Rapozo e Daniela Luquini
- [x] E-mail e telefone de contato — `contato@vulpesfilmes.com.br` / `+55 11 994780379`,
  card acessível pelo item "Contato" do menu (V5; telefone corrigido em V9)
- [ ] URLs de vimeo, instagram, youtube (menu ainda aponta para `#`; V8
  tirou a lista duplicada do rodapé)
- [x] Mídia real do projeto "Histórias do Brasil / Projeto ReDes" (Instituto
  Votorantim) — **Completo em V14**: poster (`posterReDes.jpg`), vídeo do
  Vimeo (V10) e loop ambiente (`loopReDes.mp4`, V14).
- [x] Mídia real do projeto "Gree Smartwind Brasil" (Publicidade) —
  **Loop e vídeo resolvidos em V10** (mp4 local + YouTube). O poster
  estático (`gree-smartwind-brasil.jpg`) ainda não existe — sem problema
  prático, porque o loop já cobre o quadro inicial; ano (2025) e cliente
  seguem não confirmados.
- [x] Loop ambiente do "Dossiê Anônimo" — **Resolvido em V14**
  (`loopDossieCaranguejo.mp4`). Vídeo real (YouTube) já tinha sido
  adicionado em V10.
- [ ] Poster do projeto "Global Renewable Alliance - COP 30" (adicionado em
  V10) — hoje sem arquivo em `media/posters/gra-cop30.jpg`; o loop ambiente
  (`loopGRA-COP30.mp4`) cobre a ausência

Em aberto, não bloqueiam:

- [x] Texto real de "Quem somos" — **Resolvido em V11** (era lorem ipsum)
- [ ] Confirmar a paleta de 6 cores (as do documento são propostas)
- [ ] Card de compartilhamento de `projeto.html?slug=X` mostra sempre o
  mesmo título/imagem genéricos do template, não o projeto específico
  (ver seção 10, "Compartilhamento") — só resolveria com build por
  página ou render no servidor; fora do escopo atual (site estático)
- [x] Comportamento da galeria e página de projeto individual — **Resolvido
  em V7**, refinado em V9 (título de volta ao topo, sticky como na home) e
  V10 (Vimeo além de YouTube/mp4): `projeto.html?slug=<slug>` (template
  único, dado vem de `projetos.json`) com vídeo real (campo `video`)
  tocando num modal, e galeria de fotos em grade abaixo. Ver seção 6,
  "Página de projeto e modal de vídeo".
- [ ] Fotos de `media/galeria/cbcc-2026/` estão pesadas (8-9MB cada, direto
  da câmera) — valeria comprimir/redimensionar antes de publicar
- [ ] **Religar "Spaten Fight Night" em `projetos.json` depois do
  lançamento oficial da campanha (sexta-feira).** Removido de propósito
  na V1.8.3 — "o lançamento dessa campanha é na sexta-feira. Vamos
  esperar o lançamento oficial" — não é um bug nem mídia faltando, é
  retenção editorial deliberada. O objeto completo (slug
  `spaten-fight-night`, 3 loops + 5 fotos de galeria + vídeo do
  YouTube) está preservado no histórico do git (commit anterior a esta
  versão) — basta recuperar o bloco de lá e reinserir no array na
  posição de sempre (era o mais recente, `data: "2026-09-08"`, topo do
  feed); os arquivos de mídia (`media/loops/260907-SPATEN-CUT-0{1,2,3}
  .mp4`, `media/galeria/spaten-fight-night/`) não foram apagados,
  continuam no repo esperando a data certa.

---

## 12. Changelog

Formato: mudanças pedidas numa mesma leva = uma versão.

**Até `0.17.1`, o site estava em beta** (nunca tinha ido ao ar) —
patches ficavam `0.XX.1`, `0.XX.2` etc., nunca `XX.1` sozinho (isso já
causou confusão uma vez: uma correção virou "13.1" em vez de "0.13.1",
parecendo versão 13). No corpo do texto, `V8`, `V9`, `V13` etc. são
abreviação de `0.08`, `0.09`, `0.13` — patches daquela fase sempre levam
o `0.` por extenso (`V0.13.1`, não `V13.1`).

**A partir da `1.0`** (primeiro deploy em produção, `vulpesfilmes.com`
no ar), o prefixo `0.` não existe mais — ele só marcava a fase de beta.
Versões novas são `1.1`, `1.2`, etc., e patches seguem o padrão comum
(`1.1.1`). Ver nota de versão no topo do documento.

### 0.08

- Removido o ícone de galeria ao lado do título — o título é o único
  acesso à página do projeto agora.
- Removido o ícone de play sobre a mídia em toda a home, galeria de
  diretor e página de projeto — a mídia com vídeo continua clicável, sem
  indicação visual.
- Página de projeto: título movido pro fim (era o primeiro elemento, com
  `position: sticky`, e ficava sobre as imagens da galeria).
- Novo carrossel de fotos (`js/photo-modal.js`): clicar numa foto da
  galeria do projeto abre um lightbox navegável.
- Removidas as redes sociais do rodapé (continuam no menu).
- Início da numeração formal de versão do projeto.

### 0.09

- Título da página de projeto de volta ao topo, dentro de `.block__main`
  junto com a mídia — revertendo o efeito colateral da V8 (título no fim
  resolvia a sobreposição, mas perdia o efeito de sticky "atrás da mídia"
  que a home tem). O agrupamento em `.block__main`, não uma regra CSS
  isolada, é o que resolve as duas coisas ao mesmo tempo: ver seção 6.
- Barra "quem somos" com `height: auto` no lugar do `66vh`/`100vh` fixo —
  cresce só o necessário pro logo + texto.
- Telefone de contato corrigido para `+55 11 994780379` (dígito a mais
  no número anterior).

### 0.10

- Vídeo e/ou loop ambiente reais em 4 projetos: "Global Renewable
  Alliance - COP 30" (novo, entre "Gree Smartwind Brasil" e "Dossiê
  Anônimo"), "Gree Smartwind Brasil", "Dancebook Brasil" e "Dossiê
  Anônimo" — arquivos de loop em `media/loops/`, links de vídeo do
  YouTube ou Vimeo no campo `video`.
- Suporte a Vimeo no modal de vídeo (`js/video-modal.js`) — antes só
  reconhecia YouTube ou mp4 local. `idDoYoutube()` virou `urlDeEmbed()`.
- "Dancebook Brasil" deixou de ser `tipo: "carousel"` (3 fotos) e virou
  `tipo: "single"` com o novo loop de vídeo — as duas fotos que sobraram
  do carrossel viraram a `galeria` da página do projeto, em vez de
  descartadas. **Interpretação da IA, revertida em V11** — a intenção era
  mesmo manter o carrossel de fotos e somar o vídeo a ele, não substituir
  um pelo outro.
- Poster real do projeto "Histórias do Brasil / Projeto ReDes"
  (`posterReDes.jpg`).
- Revisão geral deste documento: seções que citavam o ícone de galeria
  (removido em V8) ou descreviam o título da página de projeto no fim
  (revertido em V9) foram corrigidas para não conflitar com o restante
  do texto; árvore de arquivos da seção 10 atualizada pra refletir os
  arquivos reais do projeto.

### 0.11

- Texto real de "Quem somos" (substituiu o lorem ipsum) em todas as
  páginas e em `js/chrome.js`.
- Logo e hambúrguer somem enquanto o modal de vídeo ou o lightbox de
  fotos estão abertos — antes ficavam sobrepostos ao botão "fechar" dos
  dois (mesma posição fixa no canto superior), competindo por clique e
  foco de teclado. Classe `is-lightbox-open` no `<html>`, compartilhada
  pelos dois modais.
- Revertida a conversão de "Dancebook Brasil" pra `tipo: "single"` feita
  em V10: voltou a ser `carousel`, agora com o vídeo em loop como
  primeiro slide e as 3 fotos originais em seguida — carrossel de vídeo
  e fotos juntos, não um no lugar do outro.
- **Nova regra geral**: todo projeto com `galeria` não vazia alimenta o
  carrossel do feed automaticamente (`js/feed.js`, `slidesDoCarrossel()`),
  não importa o `tipo` salvo. Além do Dancebook, isso também vale pra
  `cbcc-2026` — que já tinha `galeria` com 4 fotos desde V7 e agora
  também aparece como carrossel no feed (loop + 4 fotos), mantendo a
  galeria de fotos na página do projeto vindo do mesmo array. Ver seção
  4, "Tipos de mídia".

### 0.12

- Bio de Ricardo Rapozo atualizada (texto novo, em terceira pessoa) em
  `ricardo-rapozo.html` e `time.html`.
- Corrigida a duplicação de foto no carrossel do Dancebook: o slide de
  vídeo usava a mesma imagem (`dancebook-01.jpg`) que também aparecia
  como foto separada logo depois — o vídeo parecia ter tomado o lugar de
  uma foto em vez de somar a ela. `midia[0].poster` do projeto virou
  `""` (sem `ffmpeg` disponível pra extrair um frame próprio do vídeo).
  Ver seção 4, "Tipos de mídia" → armadilha do poster duplicado.
- **Clique por tipo de slide dentro do carrossel**: antes nenhum slide de
  carrossel era clicável (só o título abria a página do projeto). Agora
  o slide de vídeo abre o modal de vídeo (`.media__play`, igual ao
  `single`) e cada slide de foto é um link pra página do projeto
  (`.slide__link`, novo). O arrastar/rolar do carrossel não conflita —
  o navegador só dispara `click` quando não houve movimento/scroll.
  Corrigido de brinde: `.slide` não tinha `position: relative`, então os
  overlays de clique (`position: absolute; inset: 0`) se posicionariam
  contra o carrossel inteiro, não contra o slide — um bug que não dava
  pra notar antes de existir algo clicável dentro do slide.
- Painel "quem somos" redesenhado: logo trocado do ícone quadrado
  (`vulpesFilmes-LOGO-1x1.png`) pro wordmark horizontal
  (`vulpesFilmes-LOGO-HORIZONTAL.png`), `.about-content` virou coluna
  única em vez de flex row (o wordmark largo não cabia bem ao lado do
  texto), e o botão "fechar" saiu do fluxo normal (sozinho, acima do
  logo) para `position: absolute` no canto superior direito do próprio
  painel. Ver seção 6, "Logo e 'fechar'".

### 0.13

- Bio de Daniela Luquini traduzida pro português, em terceira pessoa
  (estava só em inglês, primeira pessoa) em `daniela-luquini.html` e
  `time.html` — removido também o comentário de pendência que marcava
  isso no HTML.
- **Bug real corrigido: o vídeo em loop do primeiro slide de um carrossel
  não aparecia no carregamento da página** (mostrava o poster/uma foto
  no lugar). Duas causas, as duas em `js/carousel-infinite.js` /
  `css/layout.css`:
  1. `.slide` não tinha altura própria — sem `width`/`height` no HTML de
     `<video>`/`<img>`, o slide (e o `.track` inteiro) podia colapsar pra
     `0px` de altura até a mídia carregar, deixando qualquer leitura de
     geometria logo no `feed:pronto` instável. `.slide` ganhou
     `min-height: clamp(220px, 42vw, 620px)`, o mesmo valor do
     placeholder de "mídia em produção".
  2. O posicionamento inicial do carrossel (pular `scrollLeft` pro
     início do conjunto real) calculava a posição na mão
     (`slideSize × quantidade`), que quase nunca batia com o ponto de
     snap real de `scroll-snap-align: center` — o navegador "corrigia"
     pra outro slide qualquer assim que o snap voltava a ficar ativo.
     Trocado por `slides[0].scrollIntoView({ inline: 'center', block:
     'nearest' })`, que deixa o próprio navegador calcular a posição.
  Ver seção 4, "Tipos de mídia" → as duas armadilhas documentadas lá.
- **Vídeo em loop tem prioridade sobre poster, sempre** — não só no
  Dancebook (correção pontual da V12). `midiaHTML()` não coloca mais
  `poster` em nenhum `<video>`; até carregar, a cor de `--placeholder`
  preenche o espaço, nunca uma foto estática. Generaliza e substitui o
  conserto específico da V12.
- **Vídeo do carrossel não pausa mais ao rolar pra outro slide** — antes
  só o slide "ativo" tocava; agora o loop continua rodando mesmo fora de
  destaque (`js/media.js`).
- Painel "quem somos": voltou pro layout lado a lado (logo + texto),
  revertendo a coluna única da V12, a partir de uma referência visual
  do pedido — logo em tamanho contido (`clamp(220px, 20vw, 320px)`),
  centralizado com o texto, com `flex-wrap` cuidando do encaixe em telas
  estreitas. "Fechar" no canto superior direito do painel continua
  como na V12.

### 0.13.1

- **Painel "quem somos": corrigida a proporção logo/texto e a posição do
  conjunto**, que em V13 não bateram com a referência visual do pedido.
  Medindo a referência pixel a pixel: o logo devia ter quase a mesma
  largura do bloco de texto (~85%), não ~53% como estava, e o conjunto
  logo+texto devia ficar centralizado no painel, não alinhado ao gutter
  do resto do site. `.about-content__logo` passou de `clamp(220px, 20vw,
  320px)` pra `clamp(260px, 30vw, 460px)`; `.about-content` ganhou
  `max-width: 1180px` + `margin-inline: auto`. Ver seção 6, "Logo e
  'fechar'".

### 0.14

- **Bug real corrigido: abrir a home (ou a página de um diretor com
  Dancebook na galeria) pulava direto pro Dancebook**, sem o usuário
  rolar nada. Causa: o `slides[0].scrollIntoView({ inline: 'center',
  block: 'nearest' })` que o V13 usou pra corrigir o posicionamento
  inicial do carrossel rola **qualquer ancestral rolável**, não só o
  `.track` — se o carrossel começa fora da tela (caso do Dancebook, o
  segundo da home), a chamada rolava a página inteira até ele aparecer.
  Trocado por um cálculo manual com `getBoundingClientRect()` que só
  escreve em `track.scrollLeft`, sem chance de vazar pra um ancestral.
  Ver seção 4, "Tipos de mídia" → armadilha do posicionamento do
  carrossel.
- **Bug real corrigido: redimensionar a janela podia revelar um clone de
  vídeo (sem imagem, só a cor de placeholder) no lugar de uma foto.**
  `carousel-infinite.js` agora escuta `resize` (debounced) e recentraliza
  o slide mais próximo do centro do `.track`, usando a mesma função do
  posicionamento inicial.
- Loop ambiente do "Dossiê Anônimo" (`loopDossieCaranguejo.mp4`) e da
  "Histórias do Brasil / Projeto ReDes" (`loopReDes.mp4`).
- **Bug real corrigido: o loop do Dossiê Anônimo carregava mas nunca
  tocava** (`readyState` 4, `currentTime` preso em 0). `.play()` pode
  rejeitar mesmo com `muted`, sobretudo logo depois de setar `.src` em
  arquivos maiores — o `.catch(function(){})` de antes engolia o erro
  sem tentar de novo. `js/media.js` ganhou uma função `tocar(v)`
  compartilhada: se o primeiro `.play()` falhar, tenta de novo assim que
  o vídeo dispara `canplay`. Ver seção 7, "Performance".

### 0.14.1

- **Bug real corrigido: a "moldura" colorida ao redor das fotos do
  carrossel não tinha sumido na V14** — continuava uma faixa bege no
  CBCC e vermelha no Dancebook em volta das imagens. Causa: o
  `min-height` que a V13 deu a `.slide` (pra resolver o timing do
  carregamento do vídeo) é uma restrição permanente, não uma rede de
  segurança que se desliga sozinha — uma foto que só precisa de 400px de
  altura continuava obrigada a ocupar até 620px, sobrando a cor de
  `--placeholder` ao redor. Piorava porque `.track` não tinha
  `align-items` definido (`stretch` por padrão), esticando todo slide
  pra igualar o mais alto da fileira. Duas mudanças: `.track` ganhou
  `align-items: center` (cada slide com sua própria altura, não mais
  esticado), e `carousel-infinite.js` agora zera o `min-height` de cada
  slide assim que a mídia dele carrega (`load` pra foto,
  `loadedmetadata` pra vídeo) — o floor de `min-height` só existe entre
  a inserção do slide no DOM e o carregamento da mídia real. Ver seção
  4, "Tipos de mídia" → armadilha do `min-height` sem desligar.

### 0.15

- Peso do título de projeto (`.title`) aumentado de `wght` 800 pro teto
  do eixo, 900 — desktop e mobile. `wdth` continua em 200 no desktop
  (já era o teto do eixo variável da Advent Pro, `100..200` — não dá pra
  ir além sem trocar de fonte) e em 175 no mobile (deliberado desde a
  V1: em 200 as palavras quebram cedo demais numa tela estreita e o
  título vira 4 linhas). Ver seção 3, tabela de tipografia.

### 0.16

- **Página de diretor dividida em duas abas, "trabalhos" e "bio"**, a
  partir de referência visual do pedido. Antes era uma página só: bloco
  de pessoa (retrato + bio, com o nome do diretor como título dentro do
  bloco) seguido direto da galeria de trabalhos. Agora o nome vira um
  cabeçalho de página centralizado, comum às duas abas, com "trabalhos"
  e "bio" logo abaixo; clicar no diretor pelo submenu abre a aba
  trabalhos (padrão, sem hash na URL); `js/diretor-tabs.js` troca de aba
  via hash (`#bio`) sem recarregar a página. O nome fica grande na aba
  bio (é o conteúdo principal ali) e modesto na aba trabalhos (o feed
  abaixo já tem títulos grandes). Sem o título dentro do bloco de bio,
  a subgrid que alinhava a bio ao retrato deixou de ser necessária pras
  páginas de diretor — virou uma grade de duas colunas simples
  (`.diretor-bio`). Essa subgrid continua existindo só pro `time.html`,
  que não ganhou abas e mantém o nome dentro do bloco. Ver seção 6,
  "Diretores".

### 0.16.1

Patch: correção de duas leituras erradas da referência visual da V16,
apontadas diretamente pelo pedido ("você não seguiu as minhas
referências visuais").

- **Nome do diretor volta a ser do mesmo tamanho grande e centralizado
  nas duas abas.** A V16 tinha lido a referência como "nome grande só na
  bio, modesto em trabalhos" e diferenciado o `font-size` de
  `.diretor-nome` por aba (`clamp(28px,4vw,44px)` em trabalhos vs.
  `clamp(48px,8vw,108px)` em bio, via classes `is-tab-trabalhos` /
  `is-tab-bio` no `<html>`). As duas referências enviadas mostravam o
  nome no mesmo tamanho nas duas telas — o nome é o título da página,
  não um elemento que se adapta ao conteúdo da aba. Corrigido para um
  único `font-size` incondicional (`clamp(48px, 8vw, 108px)` desktop,
  `clamp(32px, 10vw, 48px)` mobile). As classes `is-tab-trabalhos` /
  `is-tab-bio` continuam sendo aplicadas por `js/diretor-tabs.js`, só
  não têm mais efeito em CSS.
- **Sublinhado sob a aba ativa (`trabalhos`/`bio`) removido — era leitura
  errada de um estado de hover no print, não um indicador persistente.**
  A V16 tinha implementado um `text-decoration: underline` estático preso
  a `.diretor-tabs a[aria-current='page']`. Como no resto do site,
  `aria-current="page"` não carrega estilo visual próprio (ver seção 5,
  convenção já documentada pro menu principal) — ele existe só pra
  acessibilidade. No lugar do sublinhado estático, `.diretor-tabs a`
  ganhou a mesma animação de sublinhado do menu principal: um `::after`
  com `transform: scaleX(0)→scaleX(1)` e troca de `transform-origin` no
  hover, igual a `.panel--menu a::after` (ver seção 5, "Hover — menu").
  `.diretor-tabs a:focus-visible` entrou no mesmo grupo de seletores que
  já dá sublinhado estático instantâneo no foco por teclado (`base.css`).
- Verificado via Playwright: `font-size` computado de `.diretor-nome` é
  `108px` tanto em `#trabalhos` quanto em `#bio`; nenhuma aba tem
  `transform` de sublinhado por padrão; hover produz o `scaleX(1)`
  esperado. Smoke test completo (todas as páginas + todos os
  `projeto.html?slug=...`) sem erros de console ou rede.

### 0.16.2

Patch: a aba bio das páginas de diretor ainda não batia com a
referência enviada — texto em tamanho e formatação erradas, foto sem
tratamento nenhum de enquadramento, e os dois blocos desalinhados entre
si. Pedido explícito: "o texto está com outro tamanho, outra área, tem
formatação de texto (tirar aspas) e colocar negrito. E fazer uma máscara
e alinhar a foto ao texto."

- **Frase de abertura sem aspas e em negrito, bem maior que o resto do
  texto** — `.diretor-bio .bio p:first-child` ganhou `font-weight: 700`
  e `font-size: clamp(24px, 2.3vw, 32px)` (o resto do texto de bio fica
  em `clamp(17px, 1.35vw, 20px)`, também maior que antes). As aspas
  literais (`“...”`) foram removidas do HTML de Ricardo — a referência
  tratava a frase como epígrafe tipográfica (tamanho e peso fazem o
  trabalho de destaque), não como citação entre aspas. Escopado a
  `.diretor-bio .bio`, não ao `.bio` genérico, pra não alterar o
  `time.html` (que reaproveita a mesma classe, mas noutro contexto).
- **Foto com recorte fixo 3:4 via `object-fit: cover` +
  `aspect-ratio: 3 / 4`**, no lugar de `object-fit: contain` com só um
  `max-height`. Sem isso, uma foto cuja proporção não batesse exatamente
  com a da coluna sobrava com espaço vazio ao redor; agora a imagem
  sempre preenche a coluna inteira num recorte consistente. Armadilha
  encontrada e corrigida no processo: `aspect-ratio` sozinho não bastou
  — os atributos `width="960" height="1280"` do `<img>` (deixados no
  HTML de propósito, pra evitar layout shift) contam como uma altura de
  baixíssima prioridade no user-agent; sem `height: auto` explícito no
  autor pra vencer isso, o navegador usava a altura do atributo ao pé da
  letra (1280px reais) e ignorava o `aspect-ratio` da regra. Ver seção
  6, "Diretores", parágrafo sobre `.diretor-bio__foto img`.
- **Foto e texto alinhados ao centro vertical**, não mais grudados no
  topo — `.diretor-bio` trocou `align-items: start` por `center`. Com
  bios de tamanhos bem diferentes (a de Ricardo é bem mais curta que a
  de Daniela), alinhar pelo topo deixava os dois blocos claramente
  desencontrados; centralizado, a dupla lê como um conjunto único
  independente do tamanho do texto.
- Verificado via Playwright em desktop (1456px) e mobile (700px), nas
  duas páginas de diretor — screenshots conferidos visualmente contra a
  referência enviada — e smoke test completo (todas as páginas + todos
  os `projeto.html?slug=...`) sem erros de console ou rede. `time.html`
  conferido à parte pra garantir que a aba bio dos diretores não vazou
  nenhum efeito colateral pra ele.

### 0.17

- **Download de mídia desabilitado no site inteiro** (mudança
  estrutural). Três atalhos casuais de "salvar" bloqueados: menu de
  contexto do botão direito em cima de `img`/`video` (`js/no-download.js`,
  novo arquivo, carregado em toda página com mídia), arrastar a imagem
  pra fora da janela (`-webkit-user-drag: none`) e o toque longo no
  celular (`-webkit-touch-callout: none`), esses dois em `base.css`. Não
  é proteção real contra cópia — isso não existe pra conteúdo que roda
  no navegador —, só tira o caminho mais óbvio. Ver seção 5, "Proteção
  contra download de mídia".
- **Aba ativa da página de diretor (trabalhos/bio) marcada pelo peso da
  fonte**, não mais só implícita: `.diretor-tabs a[aria-current="page"]`
  sobe de `'wght' 700` pro teto do eixo, `900`. O hover (linha animada,
  de V0.16.1) continua exatamente igual nas duas abas — só o peso muda.
  Pedido explícito pra esse componente; a convenção do menu principal
  (aria-current sem estilo próprio) não mudou, é uma exceção pontual
  aqui.
- **Link "voltar" (pra home) no fim da página de diretor**, canto
  direito, acima do rodapé — aparece igual nas duas abas porque vive
  fora dos dois `<section>`, direto em `.feed`. Mesma animação de
  sublinhado no hover dos outros links do site.
- Verificado via Playwright: `contextmenu` disparado manualmente em cima
  da foto da bio confirmado como bloqueado (`preventDefault` chamado);
  `font-variation-settings` da aba ativa em `900` e da inativa em `700`
  nas duas páginas de diretor; link "voltar" presente e alinhado à
  direita no fim de trabalhos e de bio, nas duas páginas, desktop e
  mobile. Smoke test completo (todas as páginas + todos os
  `projeto.html?slug=...`) sem erros de console ou rede.

### 0.17.1

Patch: primeiro deploy do site (repositório GitHub em
`ricardorapozo/vulpesfilmes`, publicado via Cloudflare Pages) e decisão
do domínio principal: **`vulpesfilmes.com`**, não `.com.br` — o site já
se posiciona como "Atendendo o mundo todo" no rodapé, o que pesa mais
pro `.com` do que pro registro local.

- **E-mail de contato unificado pro domínio `.com` em todas as
  páginas.** Antes da decisão, o rodapé (`contato@vulpesfilmes.com`) e o
  card de "Contato" (`contato@vulpesfilmes.com.br`) usavam domínios
  diferentes — inconsistência que já existia no site antes do deploy,
  só ficou visível ao revisar o conteúdo pra decidir o domínio
  principal. Agora os dois lugares, nas 5 páginas (`index.html`,
  `projeto.html`, `time.html`, `ricardo-rapozo.html`,
  `daniela-luquini.html`), usam `contato@vulpesfilmes.com`.
- Verificado: `grep` confirmando zero ocorrência de `.com.br` restante
  no HTML; smoke test completo (todas as páginas + todos os
  `projeto.html?slug=...`) sem erros de console ou rede.

### 1.0

**Site no ar.** Sai do beta — primeira versão em produção. Não muda
código nenhum (o conteúdo é o mesmo da `0.17.1`); marca o momento em que
o site passou a existir publicamente, fora do ambiente local.

- **Deploy**: Cloudflare Pages, conectado ao repositório GitHub
  `ricardorapozo/vulpesfilmes` (branch `main`) — todo push pra `main`
  vira deploy automático. Sem build (`Framework preset: None`, build
  command vazio, output directory `/`), porque o site é HTML/CSS/JS
  puro, sem etapa de compilação.
- **Domínio principal**: `vulpesfilmes.com`. `vulpesfilmes.com.br`
  redireciona pra ele via Redirect Rule do Cloudflare (301 permanente,
  `https://vulpesfilmes.com.br/*` → `https://vulpesfilmes.com/${1}`,
  preservando path e query string). A regra só funciona porque
  `vulpesfilmes.com.br` tem um registro DNS tipo A proxied (nuvem
  laranja) apontando pro IP reservado `192.0.2.1` — esse IP nunca
  recebe a requisição de verdade, o redirect acontece antes, na borda
  do Cloudflare; sem o registro proxied, a regra existe mas nunca é
  acionada (é um aviso que o próprio Cloudflare dá ao tentar publicar a
  regra sem DNS proxied já configurado).
- Verificado: `curl` confirmando `https://vulpesfilmes.com/` retornando
  `200` e `https://vulpesfilmes.com.br/` retornando `301` pro `.com`.

### 1.1

Primeira leva de ajustes com o site já em produção: as páginas
estavam "duras" (navegação em corte seco) e a galeria de fotos das
páginas de projeto usava uma grade uniforme de 3 colunas quadradas em
vez do photo grid de referência (imagens verticais e horizontais
misturadas).

- **Fade entre páginas**, em qualquer navegação interna — View
  Transitions API "cross-document" (`@view-transition { navigation:
  auto; }` em `base.css`), sem JS nenhum. Cross-fade padrão do
  navegador, só ajustando duração/curva pra bater com o resto do site
  (`--t-panel`/`--ease-out`). Degrada bem: navegador sem suporte
  (Safari/Firefox no momento) simplesmente não anima, sem erro. Ver
  seção 5, "Transição entre páginas".
- **Galeria de fotos (`.galeria-fotos`) virou uma grade editorial em
  pares** — uma foto horizontal (coluna larga) ao lado de uma vertical
  (coluna estreita) por linha, imagens recortadas via `object-fit:
  cover` pro formato da célula ("máscara" pedida), no lugar da grade
  3 colunas quadradas anterior. Só a coluna estreita tem
  `aspect-ratio` fixo; a larga estica pra acompanhar a altura da linha
  e sai em formato paisagem por consequência da largura, não de uma
  proporção própria. Mobile vira coluna única, mantendo a alternância
  de proporção. Ver seção 6, "Página de projeto e modal de vídeo".
- Verificado via Playwright: dimensões reais dos itens da grade
  conferem com o par largura 2:1 e a mesma altura de linha nas duas
  colunas (`cbcc-2026`, 4 fotos); o caso de total ímpar de fotos
  (`dancebook-brasil`, 3 fotos) cai certinho na proporção de fallback
  em vez de ficar sem altura. `@view-transition` confirmado presente e
  parseado no stylesheet computado. Smoke test completo (todas as
  páginas + todos os `projeto.html?slug=...`) sem erros de console ou
  rede.

### 1.1.1

Duas observações sobre a transição de página da 1.1: o efeito pedido
era um "dip to white" (dissolve pro branco, do branco dissolve pra
próxima), não um crossfade direto; e a troca de aba trabalhos/bio das
páginas de diretor tinha ficado de fora, sem efeito nenhum.

- **Crossfade trocado por "dip to white".** Duas animações em
  sequência (`::view-transition-old(root)` só perde opacidade,
  `::view-transition-new(root)` só ganha, uma depois da outra via
  `animation-delay`) em vez do crossfade simultâneo padrão do
  navegador — no meio das duas, com as duas transparentes, aparece o
  branco (`background-color: #fff` em
  `::view-transition-image-pair(root)`). Novo token `--t-page: .6s`
  (`tokens.css`) pro tempo total do dip, cada metade correndo em
  `calc(var(--t-page) / 2)`. Ver seção 5, "Transição entre páginas".
- **Troca de aba trabalhos/bio ganhou o mesmo efeito.** Raiz do
  problema: aquilo não é uma navegação de verdade (é hash mudando
  dentro do mesmo documento, em `js/diretor-tabs.js`), e a View
  Transitions API "cross-document" da V1.1 só cobre navegação real
  entre páginas — por isso a troca de aba nunca teve fade nenhum desde
  que o recurso existe. Corrigido com a segunda forma da mesma API,
  `document.startViewTransition()` ("same-document"): mesmos pseudo-
  elementos, mesmo CSS do dip-to-white, sem regra nova nenhuma — só
  precisou envolver a troca de aba nessa chamada, mantendo o primeiro
  `mostrar()` do carregamento da página de fora (não precisa de
  transição pra um estado que acabou de chegar).
- Verificado via Playwright: `document.startViewTransition` confirmado
  suportado no Chromium do ambiente de teste e confirmado que é
  chamado no evento `hashchange`; as duas `@keyframes` (`dip-to-
  white-out`/`dip-to-white-in`) confirmadas presentes no stylesheet.
  Sequência de screenshots capturada durante uma navegação real
  (index → página de diretor) mostra visualmente as três fases: página
  antiga dissolvendo, tela branca, página nova aparecendo. Smoke test
  completo (todas as páginas + todos os `projeto.html?slug=...`) sem
  erros de console ou rede.

### 1.2

- **Logo fica de fora do dip-to-white.** `view-transition-name: logo`
  em `.logo` (`base.css`) tira ele do grupo `root` (quem sofre o dip) e
  o trata como elemento persistente entre as duas páginas —
  `animation: none !important` nos pseudo-elementos correspondentes
  garante que ele não anima de jeito nenhum. Vale tanto pra navegação
  entre páginas quanto pra troca de aba trabalhos/bio. Ver seção 5,
  "Transição entre páginas".
- **Link "voltar" no fim das páginas de projeto**, canto direito, acima
  do rodapé — mesmo padrão visual do `.diretor-voltar`, mas como
  `.projeto-voltar`, HTML estático fora de `<main>` (que em
  `projeto.html` é 100% gerado por JS). Ver seção 6, "Página de
  projeto e modal de vídeo".
- **Rodapé com duas fontes**: copyright continua na Advent Pro; e-mail
  e endereço passam pra Newsreader, igual ao resto do texto corrido do
  site. `footer p:not(:first-child)`, com `font-variation-settings:
  normal` pra não herdar o peso da Advent Pro. Ver seção 8, "Rodapé".
- **Menu com só o link do Instagram** — Vimeo e YouTube removidos de
  `.social` nas 5 páginas (o separador `/` saiu junto, não fazia mais
  sentido com um link só). `href="#"` continua placeholder; o handle
  real ainda não foi definido.
- Verificado via Playwright: `view-transition-name` computado do logo
  confirmado como `"logo"`; sequência de screenshots durante uma
  navegação real mostra o logo nítido e parado enquanto o conteúdo
  abaixo ainda está no meio do dip; fonte computada das três linhas do
  rodapé confirmada (Advent Pro na primeira, Newsreader nas outras
  duas); `.social` confirmado com um link só em todas as páginas;
  `.projeto-voltar` confirmado presente, alinhado à direita, `href="./"`.
  Smoke test completo (todas as páginas + todos os
  `projeto.html?slug=...`) sem erros de console ou rede.

### 1.3

- **Novo projeto: `spaten-fight-night`** — "Spaten Fight Night - Video
  case pitch - Gut São Paulo", cliente Gut São Paulo, 2026, vídeo
  principal em `https://youtu.be/_E8HEDlR8UA`. Mídia (3 cortes de loop,
  `media/loops/260907-SPATEN-CUT-01/02/03.mp4`) e galeria (5 fotos,
  `media/galeria/spaten-fight-night/`) localizadas na pasta `media/` já
  existente no repositório. Primeiro projeto com mais de um item em
  `midia` — ver o item seguinte.
- **Mídia principal da página de projeto vira carrossel quando há mais
  de um `midia`** (`js/projeto.js`). Antes, a página de projeto sempre
  mostrava só `midia[0]`, mesmo quando o projeto tinha mais de um vídeo
  ambiente — não existia um jeito de ver os outros ali. Agora, com
  `midia.length > 1`, a mídia principal usa a mesma marcação de
  carrossel do feed (`.media--carousel`/`.track`/`.slide`) e funciona
  de graça com `js/carousel-infinite.js`/`js/media.js`, que já
  procuram esses seletores no documento inteiro. Ver seção 6, "Página
  de projeto e modal de vídeo".
- **Botão "voltar" das páginas de projeto virou um botão flutuante,
  fixo até o rodapé** — canto inferior esquerdo em vez de um link no
  fim do fluxo normal (era assim desde a V1.2). `position: sticky`
  dentro de um novo wrapper (`<div class="projeto-corpo">`, em
  `projeto.html`) que envolve `<main>` e o link, terminando exatamente
  onde o `<footer>` começa — o "alcance" de um elemento sticky é
  limitado pela caixa do pai dele, então o link flutua enquanto o
  conteúdo do projeto ainda está passando pela tela e para de
  acompanhar assim que a rolagem chega no rodapé, sem nunca sobrepor
  ele. Sem JS nenhum. Ver seção 6, "Link 'voltar', fixo até o rodapé".
- **Seis títulos de projeto atualizados**: `cbcc-2026`,
  `dancebook-brasil`, `gree-smartwind-brasil`,
  `global-renewable-alliance-cop30`, `dossie-anonimo` e
  `historias-do-brasil-redes` — todos os projetos existentes até então.
  Dois deles (`dancebook-brasil`, `historias-do-brasil-redes`) tinham
  título em duas linhas (`\n` no JSON); os novos títulos vieram como
  frase única, então o `\n` saiu — o texto quebra por conta própria via
  CSS, como qualquer título mais longo. No título de `dossie-anonimo`,
  fechei um parêntese que tinha ficado aberto no pedido ("...EP ZERO)"
  — leitura direta de que era typo, não intenção.
- **Rodapé de volta pra Advent Pro em negrito** nas três linhas —
  reverte a V1.2 (que tinha posto e-mail/endereço em Newsreader). `wght`
  da regra `footer` sobe de 600 pra 700; a regra `footer p:not(:first-
  child)` que existia só pra isso foi removida. Ver seção 8, "Rodapé".
- Verificado via Playwright: página do Spaten confirmada com 3 slides
  e 3 `<video>` no carrossel principal; posição do botão "voltar"
  conferida em dois momentos — no fim da página (`voltarBottom ===
  footerTop`, sem sobreposição) e no meio da rolagem (`bottom: 24px`
  do viewport, flutuando sobre o conteúdo) —, com screenshot de cada
  um; `projetos.json` validado como JSON bem-formado após as seis
  edições de título e a inserção do novo projeto. Smoke test completo
  (todas as páginas + todos os `projeto.html?slug=...`, incluindo o
  novo `spaten-fight-night`) sem erros de console ou rede.

### 1.3.1

**Nova regra estrutural**: a ordem do feed (home e galeria de diretor)
passa a ser sempre pela data de postagem, mais recente primeiro — nunca
mais a ordem em que os projetos aparecem no JSON. Todo projeto passa a
ter um campo `data` (`"AAAA-MM-DD"`) obrigatório; um projeto novo sem
`data` especificada entra como o mais recente (a de hoje).

- **Campo `data` adicionado a todos os 7 projetos** em `projetos.json`.
  `spaten-fight-night` recebeu a data pedida (`2026-09-08`). Os outros
  6 (já existentes antes desse patch) não tinham uma data de postagem
  registrada em lugar nenhum — **as datas deles são inferidas**, só pra
  preservar a ordem que o feed já tinha antes desse patch (a mesma
  ordem em que estavam no array), espaçadas por uma semana entre si,
  todas antes da data do Spaten. Não são datas reais de publicação;
  quem tiver a data verdadeira de cada uma pode me passar que eu
  corrijo.
- **Ordenação em `js/projetos.js`**, uma vez, logo que `projetos.json`
  termina de carregar — `.sort()` comparando `data` como string (o
  formato ISO já ordena igual à ordem cronológica, sem precisar
  converter pra `Date`). `window.PROJETOS` já chega ordenado em todo
  lugar que o consome, sem precisar mudar `js/feed.js`. Ver seção 10,
  nota sobre o campo `data` no schema de `projetos.json`.
- Verificado via Playwright: ordem dos títulos no feed da home
  conferida via DOM (`Spaten` primeiro, seguido pelos outros 6 na
  mesma ordem de antes). Smoke test completo sem erros de console ou
  rede.

### 1.3.2

Patch de ajuste: o botão flutuante "voltar" da página de projeto
(V1.3) tinha ido pro canto inferior esquerdo; o pedido era o direito.

- **`.projeto-voltar` trocou `text-align: left` por `right`** —
  único ajuste necessário; o mecanismo de `position: sticky` (limitado
  pelo wrapper `.projeto-corpo`, parando exatamente no rodapé) continua
  idêntico, só o lado do texto/link dentro da faixa muda.
- Verificado via Playwright: `getBoundingClientRect()` do link
  confirmando 0px de distância da borda direita do viewport durante a
  rolagem; screenshot conferido visualmente. Smoke test completo sem
  erros de console ou rede.

### 1.3.3

Patch: rodapé de três `<p>` (um por frase) pra dois, com o conteúdo
reagrupado — e-mail e copyright na mesma linha, separados por ` - `.

- **Rodapé em duas linhas** nas 5 páginas: `contato@vulpesfilmes.com -
  (C) 2026 vulpesfilmes` e `São Paulo/SP - Brasil. Atendendo o mundo
  todo.` O link `mailto:` continua só em volta do e-mail; o resto de
  cada linha é texto solto no mesmo `<p>`.
- **Copyright virou texto `(C)` literal**, no lugar da entidade
  `&copy;` (`©`) usada até aqui — pedido explícito.
- **Endereço mudou de "São Paulo / Brasil" pra "São Paulo/SP - Brasil"**
  — acrescenta a sigla do estado.
- Nenhuma mudança de CSS necessária: a regra `footer p:not(:first-
  child)` que diferenciava a primeira linha das outras já tinha sido
  removida na V1.3 (quando o rodapé inteiro voltou a usar a mesma
  fonte) — com duas linhas usando a mesma regra `footer p`, o resultado
  já sai visualmente consistente sem seletor nenhum extra.
- Verificado via Playwright: `textContent` das duas linhas conferido
  contra o texto exato pedido, e o `href="mailto:contato@vulpes
  filmes.com"` confirmado ainda presente e isolado no primeiro `<p>`.
  Smoke test completo (todas as páginas + todos os
  `projeto.html?slug=...`) sem erros de console ou rede.

### 1.3.4

Patch: ajuste fino na primeira linha do rodapé, um passo depois da
V1.3.3 — `(C) 2026 vulpesfilmes` virou `© 2026`.

- **Copyright de volta pro símbolo `©`** (entidade `&copy;`), no lugar
  do texto `(C)` que a V1.3.3 tinha acabado de introduzir.
- **Nome "vulpesfilmes" removido de depois do ano** — a linha termina
  em `© 2026`, sem repetir o nome (já visível no logo fixo do canto da
  página).
- Segunda linha (`São Paulo/SP - Brasil...`) sem mudança nenhuma.
- Verificado via Playwright: `textContent` da primeira linha conferido
  como `"contato@vulpesfilmes.com © 2026"` exato, `mailto:` ainda
  isolado só no e-mail. Smoke test completo (todas as páginas + todos
  os `projeto.html?slug=...`) sem erros de console ou rede.

### 1.4

Pedido: arrastar com o mouse pra passar de slide num carrossel, e
garantir que todo carrossel do site é infinito "como o do Spaten".

- **Arrastar com o mouse rola o carrossel** (`js/carousel-infinite.js`,
  Pointer Events filtrando por `pointerType === 'mouse'` — toque
  continua no scroll nativo, intocado). Cursor `grab`/`grabbing` de
  affordance. Ver seção 4, "Arrastar com o mouse rola o carrossel".
- **Bug real encontrado no processo, não só o esperado:**
  `track.setPointerCapture()` (a implementação óbvia/comum pra esse
  tipo de interação) reencaminha o `click` resultante pro elemento que
  capturou, quebrando `e.target.closest('[data-video]')` em
  `js/video-modal.js` — **qualquer clique no carrossel, mesmo sem
  arrastar nada, parou de abrir o vídeo** na primeira versão. Corrigido
  sem usar captura: `pointermove`/`pointerup` direto no `window`.
- **Segundo bug real, esse sim exatamente o que o pedido apontava:**
  `projeto.html` nunca carregava `js/carousel-infinite.js` — passou
  despercebido desde a V1.3 porque `js/media.js` (que está incluído)
  já cuidava de setas e autoplay, disfarçando a ausência do loop
  infinito. O carrossel do Spaten, citado como referência do que
  "infinito" deveria parecer, não estava de fato infinito até esse
  ajuste. Corrigido com uma linha (`<script
  src="js/carousel-infinite.js">`) em `projeto.html`.
- Verificado via Playwright: `scrollLeft` muda ao simular
  `mousedown`→`mousemove`→`mouseup`; um clique de verdade (sem
  arrastar) continua abrindo o vídeo, um arrasto de verdade não abre;
  contagem de clones (`aria-hidden="true"`) conferida em todos os
  carrosséis do site — home (3), galeria de diretor (3), página do
  Spaten (1) — todos com `clones === slidesReais × 2`. Smoke test
  completo (todas as páginas + todos os `projeto.html?slug=...`) sem
  erros de console ou rede.

### 1.5

Dois pedidos sobre as setas do carrossel: a esquerda não funcionava, e
as duas deveriam só aparecer com o mouse por perto.

- **Bug real por trás da seta esquerda não funcionar**: `.arrow` e
  `.slide__link`/`.media__play` empatavam em `z-index: 3` (um via
  token `--z-arrow`, o outro hardcoded); como as setas vêm antes do
  `.track` no HTML, o link/botão invisível do slide ganhava o empate
  de empilhamento e interceptava o clique — não um bug exclusivo da
  esquerda, só mais fácil de notar lá. `--z-arrow` sobe pra `5` em
  `tokens.css`, acima dos dois.
- **Setas escondidas por padrão, aparecem no hover do carrossel**
  (`.media--carousel .arrow { opacity: 0 }`, revela no `:hover` e no
  `:focus-within` pra quem navega por teclado). Escopado só aos
  carrosséis — as setas do lightbox de fotos continuam sempre
  visíveis, contexto diferente.
- Verificado via Playwright: `elementFromPoint()` na posição da seta
  esquerda confirmando que ela mesma (não mais o `slide__link`) recebe
  o clique; clique de verdade nas duas setas (home e página do Spaten)
  movendo `scrollLeft` sem navegar; opacidade computada da seta
  confirmada em `0` antes do hover e `1` com o mouse sobre o
  carrossel; screenshot dos dois estados. Smoke test completo (todas
  as páginas + todos os `projeto.html?slug=...`) sem erros de console
  ou rede.

### 1.6

Reformulação completa da página de projeto, a partir de referência
visual ("FAÇA EXATAMENTE COMO A REF"), mais um patch estendendo o novo
rodapé pro site inteiro.

- **Barra fixa no topo**, centralizada, `[Diretor]: [Título]` inteiro
  em Newsreader — substitui o `<h1 class="title">` grande de antes.
  Nome do diretor é link sublinhado pra página dele.
- **Vídeo de verdade tocando direto, sem clique nenhum antes** —
  substitui a mídia ambiente (loop mudo) que precisava ser clicada
  pra abrir um modal. Mudo por necessidade técnica: autoplay com som
  só é permitido pelo navegador depois de um gesto do usuário, e aqui
  não há gesto nenhum antes do vídeo precisar tocar.
- **Removido da página de projeto** (mas ainda em uso na home/galeria
  de diretor, dados intactos em `projetos.json`): título grande, mídia
  ambiente clicável + modal, carrossel de `midia` no topo (V1.3), grade
  de fotos (`.galeria-fotos`, V1.1) e seu lightbox. `projeto.html`
  parou de carregar `js/media.js`, `js/carousel-infinite.js`,
  `js/video-modal.js` e `js/photo-modal.js`; ganhou `js/diretores.js`
  (novo, pra resolver o nome/link do diretor na barra).
- **`urlDeEmbed()` promovida de `js/video-modal.js` pra
  `js/helpers.js`** — agora compartilhada entre o modal (home/galeria
  de diretor) e o player inline (página de projeto), em vez de duas
  cópias da mesma regex.
- **Patch na mesma leva: rodapé invertido (preto, texto claro)
  estendido pro site inteiro** — nasceu escopado só à página de
  projeto (item da reformulação), depois pedido explícito pra virar
  `<footer class="footer-invertido">` nas 5 páginas.
- Verificado via Playwright: barra confirmada com texto e `href`
  corretos, fonte Newsreader computada; `<iframe>` do vídeo confirmado
  com `autoplay=1&mute=1` na URL e efetivamente tocando (progresso
  avançando entre duas capturas); rodapé confirmado com
  `background-color: rgb(0,0,0)` e `color` claro em todas as páginas;
  `.projeto-voltar` continua funcionando sem mudança de mecanismo.
  Smoke test ajustado pra ignorar ruído esperado de terceiros
  (telemetria interna do YouTube bloqueada em ambiente headless, e o
  Vimeo disparando um desafio anti-bot do Cloudflare que nunca
  resolve `networkidle` — trocado por `waitUntil:'load'` só pra esse
  caso) — sem esse ajuste, o teste reportava falha em request que não
  tem relação nenhuma com o código do site. Todas as páginas +
  `projeto.html?slug=...` sem erro de console ou de rede genuíno.

### 1.6.1

Patch logo depois da reformulação da V1.6: a grade de fotos não devia
ter saído da página de projeto, só ganhar um tratamento diferente no
lightbox — fundo branco, e o logo continuando visível (diferente do
modal de vídeo, que segue escondendo os dois).

- **`.galeria-fotos` volta**, abaixo do vídeo, quando `p.galeria` não
  está vazio — o trecho que a V1.6 tinha removido de `js/projeto.js`
  voltou; o dado nunca saiu de `projetos.json`.
- **`js/photo-modal.js` e `#photo-modal` voltam a `projeto.html`** —
  clicar numa foto abre o mesmo lightbox-carrossel de antes (setas,
  Esc, ←/→, clique fora fecham).
- **Fundo do lightbox trocado de preto de cinema pra branco**
  (`.photo-modal { background: var(--paper) }`, era `rgba(0,0,0,.92)`)
  — só nesse componente; o modal de vídeo continua preto. Botão
  "fechar" também trocou de branco pra `var(--ink)` (texto claro num
  fundo branco seria invisível).
- **Logo continua visível durante o lightbox de fotos** — antes, a
  mesma classe (`is-lightbox-open`) escondia logo e hambúrguer nos dois
  modais (vídeo e fotos). `js/photo-modal.js` passou a usar uma classe
  própria, `is-photo-open`, que esconde só o hambúrguer (conflito real
  de posição com o botão "fechar", mesmo canto); o logo (canto oposto,
  sem conflito nenhum) só saía por estética do modo cinema, que deixou
  de fazer sentido com fundo branco. `js/video-modal.js` não mudou —
  continua em `is-lightbox-open`, escondendo os dois.
- Verificado via Playwright: `cbcc-2026` com 4 fotos na grade;
  lightbox abrindo com `background-color: rgb(247,246,244)`
  (`--paper`), `.logo` com `display` diferente de `none`, `.burger`
  escondido, texto do "fechar" em preto; setas trocando de foto
  (`src` diferente entre cliques); fechar devolvendo o modal a
  `is-open: false`. Modal de vídeo testado à parte na home pra
  confirmar que continua sem nenhuma mudança (fundo preto, logo e
  hambúrguer escondidos, classe `is-lightbox-open`). Smoke test
  completo (todas as páginas + todos os `projeto.html?slug=...`) sem
  erro de console ou de rede genuíno.

### 1.6.2

Patch: pedido pra garantir que a barra superior da página de projeto é
fixa, com referência mostrando ela legível por cima da galeria de
fotos rolada.

- **Verificado primeiro, não presumido**: `.projeto-barra` já era
  `position: fixed` desde a V1.6 — testado via Playwright
  (`getBoundingClientRect`) confirmando `top` idêntico antes e depois
  de rolar 900px, e nenhum ancestral com `transform`/`filter`/
  `perspective`/`will-change` (o tipo de regra que quebra `position:
  fixed` sem aviso nenhum). Não era regressão de fixação.
- **O problema real: contraste.** A barra é `position: fixed` mas
  sempre foi transparente — enquanto o `.projeto-video` (fundo escuro)
  ainda não tinha passado da rolagem, o texto da barra ficava por cima
  dele, quase ilegível. Na referência, a barra só aparece legível
  porque a foto/rolagem capturada já tinha passado do vídeo. Corrigido
  dando fundo próprio: `background: var(--paper)`, `border-radius:
  999px` (pílula), `padding: 6px 16px` — agora ela lê igual em
  qualquer ponto da rolagem, em cima de vídeo escuro ou não.
- Verificado via Playwright: screenshot da mesma posição de rolagem do
  print de referência, comparando visualmente — barra legível por
  cima do vídeo agora; mobile (420px) conferido também, sem colisão
  com logo/hambúrguer. Smoke test completo (todas as páginas + todos
  os `projeto.html?slug=...`) sem erro de console ou de rede genuíno.

### 1.6.3

Patch: "erro meu" no 1.6.2, segundo o próprio pedido — a pílula com
fundo na barra superior devia ser revertida (texto de volta a
transparente), e o pedido de verdade era outro: no mobile, o
`[Diretor]: [Título]` desce pro rodapé, numa faixa branca fixa até o
`<footer>` padrão.

- **`.projeto-barra` volta a ser texto transparente no desktop** — sem
  fundo, sem `border-radius`, sem `padding` extra; `top` de volta a
  `18px` (era `14px` no patch revertido).
- **No mobile (≤820px), `.projeto-barra` vira uma faixa branca fixa no
  rodapé**, com o mesmo limite de `.projeto-voltar` — nunca invade o
  `<footer>`. Precisou de uma reestruturação: `.projeto-barra` deixou
  de nascer dentro do `html` que `js/projeto.js` escreve em
  `main.innerHTML` e virou HTML estático em `projeto.html`
  (`#projeto-barra`), filha direta de `.projeto-corpo` — irmã de
  `<main>` e de `.projeto-voltar`, não mais neta dentro de `<main>` —
  porque o truque de `position: sticky` limitado pelo pai (o mesmo que
  `.projeto-voltar` já usa) exige isso.
- **`.projeto-voltar` sobe no mobile** (`bottom: 70px`) pra não ficar
  embaixo da faixa nova — as duas são `position: sticky`
  independentes, cada uma limitada por `.projeto-corpo`.
- Verificado via Playwright: desktop com `background-color:
  rgba(0,0,0,0)` (transparente) confirmado; mobile com a barra
  `position: sticky`, fundo `var(--paper)`, permanecendo visível
  durante a rolagem pelas fotos (screenshot no meio da rolagem);
  posição final conferida — `.projeto-voltar` encostando exatamente no
  `<footer>` (`voltarBottom === footerTop`), `.projeto-barra` nunca
  sobrepondo nem o rodapé nem `.projeto-voltar`. Smoke test completo
  sem erro de console ou de rede genuíno.

### 1.6.4

Patch: confirmado que o autoplay do vídeo da página de projeto deve
vir **com som**, não mudo — "quando entramos na página e o vídeo dá
autoplay ele VEM COM SOM ATIVADO".

- **`js/projeto.js` não força mais `&mute=1`/`&muted=1`/`muted`** no
  embed — a V1.6 original tinha adicionado isso por avaliar (errado)
  que seria a única forma garantida de autoplay funcionar. Removido; o
  autoplay agora sempre pede com som. Ressalva técnica que continua
  valendo, documentada no código: a política de autoplay de cada
  navegador ainda decide se aceita ou recusa som sem gesto prévio do
  usuário — o código pede com som, o navegador que decide se aceita.
- Verificado via Playwright: `src` do `<iframe>` confirmado sem
  `mute`/`muted` na URL. Smoke test completo sem erro de console ou de
  rede genuíno.

### 1.6.5

Patch: "o lightbox dos vídeos na página de portfólio também devem ser
brancos" — o modal de vídeo (home/galeria de diretor) ganha o mesmo
tratamento branco que o lightbox de fotos já tinha.

- **`.video-modal` com fundo `var(--paper)`**, não mais
  `rgba(0,0,0,.92)` de cinema; `.video-modal__close` de `#fff` pra
  `var(--ink)` (texto claro num fundo branco ficaria invisível).
- **`js/video-modal.js` passou a usar `is-photo-open`**, a mesma
  classe do lightbox de fotos, no lugar de `is-lightbox-open` — os dois
  modais agora têm o mesmo tratamento de chrome (só o hambúrguer some,
  o logo continua visível: sem fundo escuro em nenhum dos dois, não
  sobrou motivo pra esconder o logo). `is-lightbox-open` ficou sem
  nenhum uso no site; a regra em `css/base.css` foi simplificada pra
  uma linha só, escopada em `is-photo-open`.
- Verificado via Playwright: modal de vídeo aberto a partir da home
  confirmado com `background-color: rgb(247,246,244)`, logo visível,
  hambúrguer escondido, classe `is-photo-open` no `<html>`. Smoke test
  completo (todas as páginas + todos os `projeto.html?slug=...`) sem
  erro de console ou de rede genuíno.

### 1.6.6

Patch: sete títulos reescritos (todos os projetos existentes até
então).

- `cbcc-2026`: "Conferência Brasileira de Carbono 2026 para Aliança
  Brasil NBS"
- `dancebook-brasil`: "Dancebook Brasil, Gold Lion Design 2026 para
  Lovely."
- `gree-smartwind-brasil`: "Smartwind para Gree"
- `global-renewable-alliance-cop30`: "COP30 / UN Conference for Global
  Renewable Alliance"
- `dossie-anonimo`: "O Mistério da Ilha dos Caranguejos para Dossiê
  Anônimo"
- `historias-do-brasil-redes`: "Histórias do Brasil para Projeto ReDes
  do Instituto Votorantim" — corrigido "Votorantin" pra "Votorantim" no
  pedido, pra bater com a grafia já usada no campo `cliente` desse
  mesmo projeto.
- `spaten-fight-night`: "Spaten Fight Night, case pitch para Gut São
  Paulo"
- Verificado: `projetos.json` validado como JSON bem-formado depois
  das sete edições; smoke test completo (todas as páginas + todos os
  `projeto.html?slug=...`) sem erro de console ou de rede genuíno.

### 1.6.7

Bug real reportado: "o efeito de cor deve cobrir TODOS os elementos da
página, inclusive as fotos e vídeos. A única coisa que fica por cima é
o menu, submenu, quem somos e contato."

- **Causa raiz: o duotone (filtro + tingimento com a cor da sessão) só
  cobria `.media`**, a classe original do feed/carrossel — três
  containers de mídia adicionados em versões mais recentes nunca foram
  incluídos: `.diretor-bio__foto` (bio do diretor, V16), `.projeto-
  video` (vídeo de verdade da página de projeto, V1.6),
  `.galeria-fotos__item` (grade de fotos, V1.1). Cada vez que a mídia
  entrou por um container novo, ela silenciosamente ficou de fora do
  efeito de cor.
- **Corrigido repetindo o mesmo par de regras do `.media`** (posição
  relativa + pseudo-elemento `::after` com `mix-blend-mode: darken` +
  filtro `grayscale/contrast/brightness`) pros três containers que
  faltavam, em `css/layout.css`.
- **Ficam de fora, de propósito**: menu, "quem somos", "contato" (só
  texto/logo próprio, sem mídia pra cobrir de qualquer forma, exceto o
  logo do "quem somos" — esse continua sem filtro) e os dois
  lightboxes (modal de vídeo e de fotos), que já são sistemas com
  fundo próprio desde que existem, fora da cor da sessão por princípio,
  não por esquecimento.
- Verificado via Playwright: com um painel aberto (`is-overlay-open`),
  filtro e opacidade do tingimento conferidos como ativos em
  `.diretor-bio__foto img` (bio do diretor), `.projeto-video iframe`
  (vídeo da página de projeto) e `.galeria-fotos__item img` (grade de
  fotos); `.media` da home conferida sem regressão; logo do "quem
  somos" confirmado SEM filtro mesmo com o painel aberto. Screenshots
  da bio e do vídeo de projeto com o painel aberto, confirmando o
  tingimento visualmente. Smoke test completo (todas as páginas +
  todos os `projeto.html?slug=...`) sem erro de console ou de rede
  genuíno.

### 1.7

Reformulação do painel "quem somos", a partir de referência visual
("CRAVE A REFERÊNCIA"): de faixa subindo do rodapé pra card
centralizado, com um novo layout de conteúdo e uma transição diferente.

- **Card centralizado**, não mais faixa cobrindo 2/3 da tela a partir
  do rodapé — mesmo princípio do card de contato (`top:50%; left:50%;
  transform:translate(-50%,-50%)`), só que maior (`width: min(1300px,
  90vw)`, `max-height: 85vh` com scroll interno se precisar).
- **Conteúdo em coluna, centralizado**: texto em cima, logo (ícone +
  wordmark) embaixo — era lado a lado desde a V0.13.1. Ordem invertida
  direto no HTML, não via CSS `order`, pra ordem de leitura bater com a
  ordem visual.
- **Texto muda de Newsreader pra Advent Pro**, bem maior
  (`clamp(22px, 2.6vw, 38px)`, era `clamp(16px, 1.5vw, 20px)`) e
  centralizado (era alinhado à esquerda) — o painel virou destaque
  tipográfico, não leitura corrida discreta.
- **Logo bem menor** (`clamp(160px, 14vw, 220px)`, era `clamp(260px,
  30vw, 460px)`) — faz sentido menor: agora é só a assinatura abaixo
  do texto, não briga mais por protagonismo num layout lado a lado.
- **Entrada/saída vira "dip to white"**, não mais `transform`
  deslizando de baixo pra cima: "antes o box entrava de baixo para
  cima, agora faça entrando com o efeito dip to white padrão."
  Reaproveita o mesmo mecanismo das transições de página (`@view-
  transition` + pseudo-elementos `root`), só que pela via
  "same-document" da API (`document.startViewTransition()`) — mesmo
  truque que `js/diretor-tabs.js` já usa pra troca de aba, agora um
  terceiro uso no site. Escopado só ao painel "quem somos" — menu e
  contato continuam com a transição de `transform`/`opacity` de
  sempre.
- **Bug real encontrado e corrigido no processo**: a primeira versão
  do card centralizado só declarava o `transform` de centralização em
  `.panel--about` (fechado); a regra genérica `.panel.is-open {
  transform: translateY(0) }` (duas classes, mais específica) vencia
  assim que o painel abria, jogando o card pra fora da viewport pela
  direita e tornando o botão "fechar" inclicável. Corrigido redeclarando
  o `transform` em `.panel--about.is-open` também — mesma solução que
  `.panel--contact.is-open` já usava, só que a V1.7 esqueceu de copiar
  de primeira.
- Verificado via Playwright: card confirmado centralizado
  (`(1920-1300)/2 = 310px` de cada lado, medido); ordem dos filhos de
  `.about-content` confirmada (`prose`, depois `about-content__logo`);
  fonte computada do texto confirmada como Advent Pro; fechamento
  confirmado funcionando sem timeout depois da correção do bug de
  centralização; sequência de screenshots durante a abertura
  confirmando visualmente as três fases do dip (conteúdo antigo
  dissolvendo, branco, card novo aparecendo); menu conferido à parte
  sem nenhuma mudança (transição de `transform` de sempre, sem dip).
  Smoke test completo (todas as páginas + todos os
  `projeto.html?slug=...`) sem erro de console ou de rede genuíno —
  os dois avisos que apareceram numa rodada (política de permissão
  `compute-pressure` do player do YouTube, erro 401 de telemetria do
  Vimeo) se mostraram intermitentes e específicos dos players de
  terceiros ao reexecutar, não regressão do código do site.

### 1.7.1

Patch: a V1.7 não cravou a referência de verdade — texto com largura e
peso aquém do pedido, logo pequeno demais.

- **Texto**: `font-variation-settings` de `'wdth' 175, 'wght' 700` pra
  `'wdth' 200, 'wght' 900` — os dois no teto do eixo variável da Advent
  Pro, pedido explícito ("faça o texto ter largura 200 e peso 900").
- **Logo**: `clamp(160px, 14vw, 220px)` pra `clamp(220px, 22vw, 400px)`
  — a primeira medida (~17% da largura do card) tinha ficado bem abaixo
  da proporção da referência (~31%); a nova bate.
- Verificado via Playwright: `font-variation-settings` computado
  confirmado como `"wdth" 200, "wght" 900`; proporção logo/card medida
  em 0.31 (`400px` de logo num card de `1300px`), batendo com a medição
  da referência; screenshot comparado visualmente lado a lado com a
  referência enviada. Smoke test completo (todas as páginas + todos os
  `projeto.html?slug=...`) sem erro de console ou de rede genuíno.

### 1.7.2

Patch: ainda não tinha cravado a referência — faltava apertar a
entrelinha. "Observe o espaçamento entre as linhas. Diminua, eles devem
praticamente se tocar. Eu quero um BOLO DE TEXTO."

- **`.panel--about .prose`: `line-height` de `1.25` pra `.9`** — mais
  apertado que qualquer outra entrelinha do site (`.diretor-nome`/
  `.title` usam `.94`/`.98`, já os mais justos até então), de
  propósito: o pedido era um bloco de texto denso, não uma leitura
  espaçada.
- **`margin-top` entre parágrafos, de `1em` pra `.5em`** — sem
  reduzir junto, a folga entre parágrafos ficaria desproporcional
  perto do espaço quase nulo dentro de cada um.
- Verificado via Playwright: screenshot comparado visualmente com a
  referência — linhas praticamente se tocando, como pedido. Smoke test
  completo (todas as páginas + todos os `projeto.html?slug=...`) sem
  erro de console ou de rede genuíno.

### 1.7.3

Patch: "DIMINUA O box branco e substitua o FECHAR por um X".

- **`.panel--about`: `width` de `min(1300px, 90vw)` pra `min(900px,
  85vw)`**, padding reduzido proporcionalmente (`calc(var(--gutter) *
  1.6) ... calc(var(--gutter) * 1.4)` pra `calc(var(--gutter) * 1.3) ...
  calc(var(--gutter) * 1.1)`). `.prose` (`max-width: min(900px, 80%)`)
  não precisou de ajuste — com o card menor, o texto passou a ocupar
  naturalmente quase toda a largura útil dele.
- **Botão "fechar" (texto) vira "×" (símbolo)** nas 5 páginas com o
  painel: marcação trocou pra `class="close close--x"` +
  `aria-label="Fechar"` (o rótulo por extenso migrou do texto visível
  pro atributo de acessibilidade, já que `&times;` sozinho não é um
  nome acessível confiável). `.close--x` reseta o sublinhado e sobe a
  fonte pra `32px`.
- **Mesma armadilha de especificidade da V1.7 (terceira vez no
  projeto).** Primeira versão de `.close--x` era uma classe solta
  (0-1-0) e perdia pra `.panel--about .close, .panel--contact .close`
  (0-2-0, mais adiante no arquivo) — o "×" saía sublinhado e a 19px,
  como se a regra nova não existisse. Corrigido reescopando pra
  `.panel--about .close--x` (mesma especificidade, depois no arquivo).
- Verificado via Playwright: `getComputedStyle` confirmando
  `cardWidth: 900`, `closeText: "×"`, `closeAriaLabel: "Fechar"`,
  `closeTextDecoration: "none"`, `closeFontSize: "32px"`; clique no "×"
  ainda fecha o painel corretamente; screenshot revisado visualmente.
  Smoke test completo (todas as páginas + todos os
  `projeto.html?slug=...`) sem erro de console ou de rede genuíno além
  do ruído de terceiro já catalogado (analytics interno do Vimeo, `401`
  + logs `%c%d`, só nos dois projetos com embed do Vimeo).

### 1.7.4

Patch: "a diminuição do box não ficou boa. Volte para o tamanho
anterior. Mantenha o 'X'." — o encolhimento do card na V1.7.3 não
agradou visualmente; o "×" no lugar de "fechar", sim, e ficou.

- **`.panel--about`: `width` de volta a `min(1300px, 90vw)`**, padding
  de volta a `calc(var(--gutter) * 1.6) var(--gutter) calc(var(--gutter)
  * 1.4)` — exatamente os valores de antes da V1.7.3. Comentário do
  patch anterior (`/* PATCH: box menor... */`) removido do CSS junto
  com a reversão, já que descrevia uma mudança que deixou de existir.
- **Botão "×" (`.close--x`, `aria-label="Fechar"`) mantido como
  estava** — nada mexido aqui, só o tamanho do card voltou atrás.
- Verificado via Playwright: `getComputedStyle` confirmando
  `cardWidth: 1300` (de volta ao valor pré-V1.7.3), `closeText: "×"`,
  `closeTextDecoration: "none"`, `closeFontSize: "32px"` (inalterados);
  clique no "×" ainda fecha o painel; screenshot revisado visualmente
  contra o card grande de antes. Smoke test completo sem erro de
  console ou de rede genuíno além do mesmo ruído de terceiro do Vimeo
  já catalogado.

### 1.7.5

Patch: novo texto pra bio de Ricardo Rapozo, com a instrução "use a
mesma fonte (peso, largura e entrelinha) do QUEM SOMOS. Faça o box do
texto do tamanho da foto e da largura da página. Ajuste a fonte para
caber."

- **Texto novo** (`ricardo-rapozo.html` e `time.html`): removido o
  parágrafo-epígrafe de abertura ("A memória é um espaço em disputa.")
  e a última frase do parágrafo final ("Imagens são os moldes de
  nossas lembranças.") — sobram 2 parágrafos, os do meio, sem
  alteração no conteúdo deles.
- **Novo modificador `.diretor-bio--destaque`, só em
  `ricardo-rapozo.html`** (`css/layout.css`): foto e texto empilham
  (`grid-template-columns: 1fr`) em vez de dividir a linha; a caixa do
  texto ganha a largura cheia do grid ("largura da página") e uma
  altura calculada algebricamente a partir da largura/proporção da
  foto (`height: calc(38vw * 4/3)`, "tamanho da foto"), sem JS medindo
  elemento nenhum. Fonte igual ao "quem somos" (`'wdth' 200, 'wght'
  900`, `line-height: .9`, Advent Pro em vez do Newsreader que `.bio`
  usa por padrão); regra de epígrafe do primeiro parágrafo
  (`.diretor-bio .bio p:first-child`) resetada dentro do modificador,
  já que os dois parágrafos agora usam o mesmo tratamento.
- **`font-size: 3.3vw`, não `clamp()`** — "ajuste a fonte para caber"
  virou uma busca binária via Playwright (maior tamanho que ainda cabe
  na altura da caixa, sem estourar) em seis larguras de tela
  (1024–2560px); o valor que cabe ficou estável entre 3.34vw e 3.36vw
  em toda a faixa, porque caixa e texto escalam por `vw` na mesma
  proporção — um valor fixo em `vw` (com pequena margem de segurança)
  mantém o texto colado nas bordas da caixa em qualquer largura de
  desktop.
- **Mobile**: a conta de altura fixa fica pequena demais numa tela
  estreita — a caixa solta `height:auto`/`overflow-y:visible` e a
  fonte cai pra `clamp(22px, 6vw, 30px)`; a foto ganha `width:100%`.
- **`daniela-luquini.html` e o `.diretor-bio` genérico não mudam** — o
  modificador é exclusivo do HTML de Ricardo; `time.html` mantém o
  layout Newsreader de sempre, só com o texto atualizado (evita bio
  divergente entre as duas páginas que reproduzem o mesmo conteúdo).
- Verificado via Playwright: `getBoundingClientRect` confirmando
  `bioH === fotoH` (972.8px em 1920px de viewport) e `scrollHeight <=
  clientHeight` (sem overflow) em 1024/1280/1440/1680/1920/2560px;
  screenshots revisados visualmente em desktop (1920px) e mobile
  (390px); `daniela-luquini.html` e `time.html` conferidos sem
  regressão visual. Smoke test completo sem erro de console ou de rede
  genuíno além do ruído de terceiro já catalogado (Vimeo, YouTube
  `compute-pressure`).

### 1.7.6

Patch: "o texto da bio tem que estar ao lado da foto. CRAVE NA REF" —
com screenshot do estado da V1.7.5 (empilhado) marcado à mão mostrando
o texto ao lado da foto, não embaixo. "Largura da página" da instrução
original não queria dizer "abandone o layout lado a lado" — só que a
caixa de texto (agora ao lado da foto, como sempre foi) devia ocupar
toda a largura disponível daquela coluna, esticada até a altura da
foto.

- **`.diretor-bio--destaque` volta a usar o grid de duas colunas
  herdado de `.diretor-bio` (`38vw 1fr`)** — a V1.7.5 tinha trocado pra
  `grid-template-columns: 1fr` (empilhado); essa sobrescrita foi
  removida.
- **`align-items: stretch`** substitui o `center` herdado — no lugar do
  `height: calc(38vw * 4/3)` calculado manualmente da V1.7.5 (que só
  fazia sentido pra uma caixa de largura total da página), o próprio
  grid agora estica `.bio` até a altura da linha, que a foto (bem mais
  alta que duas linhas de texto) já define sozinha. Resultado idêntico
  na prática ("caixa do tamanho da foto"), mas resolvido pelo mecanismo
  nativo do grid em vez de uma fórmula.
- **`font-size` remedido: `2.45vw`, era `3.3vw`.** A coluna lado a lado
  (`1fr`) é mais estreita que "largura da página inteira" da versão
  empilhada — cabe menos caracteres por linha, então o mesmo texto
  precisa de uma fonte menor pra não estourar a altura da caixa. Nova
  busca binária via Playwright em seis larguras de tela: o tamanho que
  cabe ficou entre 2.47vw e 2.58vw (só a 1024px caiu a 2.47vw); `2.45vw`
  fica com margem de segurança abaixo do mínimo medido.
- Verificado via Playwright: `sideBySide` (topo de `.bio` e de
  `.diretor-bio__foto` no mesmo Y) `true`, `bioH === fotoH` e
  `scrollHeight <= clientHeight` (sem overflow) em
  1024/1280/1440/1680/1920/2560px; screenshot comparado lado a lado com
  a referência enviada — foto à esquerda, texto à direita, mesma
  altura, preenchendo a caixa. Mobile revisado visualmente (permanece
  empilhado, como sempre foi nesse breakpoint). Smoke test completo sem
  erro de console ou de rede genuíno além do ruído de terceiro já
  catalogado (Vimeo).

### 1.7.7

Patch: "os textos do menu (sumenu DIRETORES também) devem ter largura
200 e peso 900 (rede social deixa como está)".

- **`.panel--menu ul a`, `.menu-toggle`, `.submenu a`: `'wght'` de `800`
  pra `900`** (`'wdth'` já estava em `200`, o teto do eixo). Cobre os
  4 itens do menu principal (Portfólio, Diretores, Quem somos, Contato)
  e os 2 nomes do submenu (Ricardo Rapozo, Daniela Luquini) — os três
  seletores usavam a mesma regra duplicada, então o pedido "submenu
  também" já caía dentro do escopo, só precisava não esquecer o
  terceiro seletor.
- **`.social` (Instagram) e `.submenu-back` ("voltar") não mudam** —
  pedido explícito de deixar a rede social como está; o botão de voltar
  do submenu nunca fez parte da pergunta e já segue um tratamento
  tipográfico diferente (tamanho fixo, sublinhado, mesmo padrão do
  "fechar" dos painéis), não o dos itens de navegação.
- Verificado via Playwright: `fontVariationSettings` de todos os 6
  links do menu (incluindo os dois do submenu, com o submenu aberto)
  confirmado `"wdth" 200, "wght" 900`; `.social a` confirmado inalterado
  (`"wdth" 175, "wght" 600`); screenshot do submenu "Diretores" aberto
  revisado visualmente. Smoke test completo sem erro de console ou de
  rede genuíno além do ruído de terceiro já catalogado (Vimeo).

### 1.7.8

Patch: "retire animação DIP TO WHITE do QUEM SOMOS. de um fade nos
elementos (mantém o efeito de cor) e entra o card QUEM SOMOS. FADE IN
FADE OUT NORMAL."

- **`js/panel.js`: removida a função `usaDip()` e as duas chamadas
  condicionais a `document.startViewTransition()`** em `abrir()`/
  `fechar()` — as duas funções voltaram a aplicar a troca de classe
  direto, sem passar pela View Transitions API. Como nenhum painel
  restante precisava do caminho alternativo, as duas funções também
  perderam a estrutura de closure `aplicar()` que só existia pra ser
  chamada de dois jeitos diferentes — código morto a menos, não só
  comportamento revertido.
- **`.panel--about` (`css/base.css`) ganhou de volta `transition:
  opacity var(--t-panel) var(--ease-out)`**, era `transition: none`
  (a V1.7 tinha zerado porque toda a animação vinha do dip). Sem
  `scale` na lista — só opacidade, mais simples que `.panel--contact`
  (que anima `transform: scale()` junto), como pedido ("FADE IN FADE
  OUT NORMAL"). A redeclaração de `transform` em `.panel--about.is-open`
  continua necessária (mesma armadilha de especificidade de sempre,
  ver acima) — isso não mudou, só a `transition` em volta dela.
- **`@media (prefers-reduced-motion: reduce)`: `.panel--about` entra na
  mesma exceção que `.panel--contact` já tinha** (restaura a duração da
  transição de `opacity`, que o reset genérico `* { transition-duration:
  .01ms }` zeraria) — mesmo raciocínio, agora as duas regras precisam
  dela pelo mesmo motivo.
- **Efeito de cor (`is-overlay-open`) não muda em nada** — nunca esteve
  acoplado à animação de entrada/saída de painel nenhum, só ao
  `classList.toggle` que já roda em `sincronizar()`.
- Verificado via Playwright: `getComputedStyle` durante a transição
  (80ms depois do clique) mostrando `opacity` fracionário (ex.:
  `0.633` ao fechar) em vez de saltar direto entre `0` e `1` — confirma
  fade real, não a troca instantânea que existia antes por trás do
  dip; `transitionProperty: "opacity"`; `is-overlay-open` e a cor de
  fundo do `body` confirmados presentes durante a animação. Zero erros
  de console. Screenshot revisado visualmente. Smoke test completo sem
  erro de console ou de rede genuíno além do ruído de terceiro já
  catalogado (Vimeo).

### 1.7.9

Patch: "não está funcionando como eu pedi" — com a descrição de novo,
mais detalhada: "quando clicamos em QUEM SOMOS, a barra do menu se
recolhe e o card aparece com fade in no centro do quadro. Permanece o
efeito de cor no fundo. Sem fade no fundo. APENAS O CARD FAZ FADE IN.
Ao clicar no X, o card faz FADE OUT."

- **Causa raiz, achada gravando o estado computado quadro a quadro via
  Playwright**: a V1.7.8 corrigiu o TIPO de animação (fade em vez de
  dip), mas manteve a sobreposição de 120ms que `abrir()` sempre usou
  pra trocar de painel sem a tela ficar vazia no meio. Com o card de
  "quem somos" do tamanho que é (90vw), esses 120ms deixavam o card já
  começando a aparecer (semitransparente) enquanto o menu AINDA estava
  visivelmente deslizando pra fora — dois movimentos sobrepostos, o
  conteúdo da página (fotos, títulos) visível através do card
  semitransparente ao mesmo tempo, lendo como se o fundo também
  estivesse animando. Screenshot em `t=150ms` (durante a sobreposição)
  mostrou exatamente isso: título e foto do projeto por trás,
  visíveis através do card ainda translúcido, com o menu ainda a meio
  caminho de sumir.
- **`js/panel.js`, `abrir()`: espera 480ms antes de abrir "quem somos"
  vindo de outro painel, em vez dos 120ms padrão** — `var espera =
  painel === about ? 480 : 120`. 480ms é a mesma duração de
  `--t-panel` (tokens.css): o suficiente pro menu terminar de
  deslizar pra fora de verdade antes do card começar a aparecer.
  Sequência limpa, como pedido: menu recolhe → SÓ DEPOIS o card fade
  in. Escopado só à abertura de `about`; menu↔contato e o fechamento
  de qualquer painel continuam com os 120ms de sempre (não foram o que
  o pedido reclamava).
- **Nada mudou no "fundo"** — nem o efeito de cor (`is-overlay-open`,
  sempre foi independente da animação de painel) nem o `body`
  background (já ficava constante, confirmado por trace anterior) — o
  que estava "fazendo fade" era o card revelando a página por trás
  dele enquanto o menu ainda se movia, não o fundo em si.
- Verificado via Playwright: trace de `opacity`/`transform` quadro a
  quadro confirmando o menu terminar de sumir (`transform` estável) por
  volta de 400–480ms, ANTES do card começar a subir de opacidade;
  `overlay`/cor de fundo constantes do início ao fim. Screenshots em
  400/550/700ms mostrando o card materializando sobre a página já
  parada (sem o menu se movendo simultaneamente). Fechar pelo "×"
  confirmado com fade out (`opacity` fracionário em pleno fechamento,
  `0` no final, `is-overlay-open` caindo junto). Menu↔contato conferido
  sem mudança (ainda sobrepõe em 120ms). Zero erros de console. Smoke
  test completo sem erro de console ou de rede genuíno além do ruído
  de terceiro já catalogado (Vimeo).

### 1.7.10

Patch: "1. Não deixe barra de rolagem nos textos da bio 2. novo texto
da bio de daniela [...] APLIQUE A MESMA FORMATACAO DE RICARDO RAPOZO."

- **`overflow-y: hidden`, era `auto`, em `.diretor-bio--destaque
  .bio`** — o `font-size` calibrado já tinha margem de segurança, mas
  `auto` ainda podia abrir uma barra de rolagem em condições de borda
  (hinting de fonte diferente, zoom). `hidden` garante nunca aparecer.
- **Texto novo da bio de Daniela** (`daniela-luquini.html` e
  `time.html`): removido o parágrafo de abertura ("Baseada no Reino
  Unido, Daniela é fotógrafa..."); sobram os 3 parágrafos seguintes,
  sem alteração no conteúdo deles.
- **`.diretor-bio--destaque` estendido pra Daniela**
  (`daniela-luquini.html`: `class="diretor-bio diretor-bio--right
  diretor-bio--destaque"`) — mesmo modificador de Ricardo, já
  compatível com `--right` (foto na coluna 2) sem precisar de nenhuma
  regra nova: `align-items: stretch` e a fonte do "quem somos" não
  dependem de qual lado a foto fica.
- **`font-size` do modificador remedido: `2.4vw`, era `2.45vw`** — o
  valor antigo foi calibrado só pro texto de Ricardo; o de Daniela (3
  parágrafos, mais uma quebra de parágrafo que Ricardo) precisa de uma
  fonte um pouco menor pra caber na mesma altura de coluna. Nova busca
  binária via Playwright rodada pros DOIS textos, seis larguras de tela
  cada: `2.4vw` fica com margem de segurança abaixo do mais apertado
  dos dois (o de Daniela, ~2.44vw de teto).
- **Bug achado e corrigido no processo: `grid-row` não resetado no
  mobile pra `.diretor-bio--right`.** Só apareceu ao testar Daniela no
  celular (Ricardo nunca teve esse `grid-row` fixo, então nunca expôs
  o problema) — screenshot mobile mostrou só o ÚLTIMO parágrafo visível,
  os outros dois "sumidos". Causa: o breakpoint mobile resetava
  `grid-column` mas não `grid-row`; o desktop de `--right` fixa os dois
  itens em `grid-row: 1` (pra ficarem lado a lado), e sem resetar isso
  no mobile (grid de uma coluna só) os dois continuavam disputando a
  MESMA célula do grid, esticados um pelo outro via `align-items:
  stretch` pra uma altura sem sentido que escondia a maior parte do
  texto atrás da foto opaca. Corrigido com `grid-row: auto` no mesmo
  lugar onde `grid-column` já era resetado.
- Verificado via Playwright: `scrollHeight <= clientHeight` (sem
  overflow, `overflow-y: hidden` confirmado no computed style) pras
  DUAS bios, seis larguras de tela cada, desktop; mobile (390px)
  confirmado com as 3 tags `<p>` de Daniela todas presentes E visíveis
  (`bioTop`/`fotoBottom` batendo, sem sobreposição de célula de grid);
  screenshots revisados visualmente em desktop e mobile pras duas
  páginas. Smoke test completo sem erro de console ou de rede genuíno
  além do ruído de terceiro já catalogado (Vimeo).

### 1.7.11

Patch: "retire o telefone do card de CONTATO".

- **`<p class="contact-card__item"><a href="tel:+5511994780379">...`
  removido das 5 páginas** (`index.html`, `ricardo-rapozo.html`,
  `daniela-luquini.html`, `projeto.html`, `time.html`) — o card de
  contato passa a mostrar só cidade/país e e-mail. Nenhuma mudança de
  CSS ou JS: `.contact-card__item` já estilizava genericamente
  "qualquer parágrafo desse tipo dentro do card", sem depender de
  quantos existem.
- Verificado via Playwright: `contact-card__item` confirmado com 1 item
  só (e-mail), `card.querySelector('a[href^="tel:"]')` confirmado
  `null`. Screenshot revisado visualmente. Smoke test completo sem erro
  de console ou de rede genuíno além do ruído de terceiro já catalogado
  (Vimeo).

### 1.7.12

Patch: "1. Card de contato 'São Paulo/SP, Brasil' Adicionar o /SP...
2. Ao clicar no logo do card QUEM SOMOS, voltamos para o FEED do
portfolio."

- **`.contact-card__local`: `São Paulo/SP, Brasil`, era `São Paulo,
  Brasil`** nas 5 páginas — desambigua cidade (São Paulo capital) de
  estado (SP), mesmo formato do rodapé.
- **Logo do "quem somos" vira link pro feed (`href="./"`)** — a `<img
  class="about-content__logo">` passou a viver dentro de `<a
  class="about-content__logo-link" href="./" aria-label="Voltar para o
  portfólio">`, nas 5 páginas. Mesmo destino do `.logo` fixo do
  cabeçalho. `display: block` acrescentado só pra deixar explícito o
  comportamento que o link já teria como filho direto do flex
  container; nada mais mudou no CSS do logo em si.
- Verificado via Playwright: `contact-card__local` confirmado com o
  texto novo nas 5 páginas; clique em `.about-content__logo-link`
  confirmado navegando pra `/` a partir de `ricardo-rapozo.html` E de
  `projeto.html?slug=...` (path relativo `./` funcionando das duas
  profundidades de URL). Screenshot revisado visualmente. Smoke test
  completo sem erro de console ou de rede genuíno além do ruído de
  terceiro já catalogado (Vimeo).

### 1.8

"Quando a página ficar parada por 30 segundos o efeito de cor toma toda a
página. Ele sai assim que o mouse se mover novamente." Primeiro pedido
enviado como versão nova (não "PATCH:"), então o número sobe pro próximo
minor em vez de mais um patch.

- **`js/idle-color.js` (arquivo novo)**, carregado nas 5 páginas junto
  com `js/panel.js`: `setTimeout(ativar, 30000)`, reiniciado a cada
  `mousemove`. `ativar()` reaproveita a MESMA classe `is-overlay-open`
  que os painéis já usam — o efeito de inatividade não é um sistema
  visual novo, é o efeito de painel existente (fundo sorteado + duotone
  nas mídias) disparado por um motivo diferente (tempo parado, não um
  painel aberto).
- **Duas guardas pra não brigar com `js/panel.js`**, que já controla a
  mesma classe (recalculando do zero a cada abrir/fechar de painel):
  `ativar()` não faz nada se algum painel já estiver aberto
  (`.panel.is-open`); `desativar()` só remove a classe se foi o próprio
  idle que ligou (flag interna `ativo`) — se um painel ligou a classe,
  o idle nunca marcou `ativo`, então mover o mouse com um painel aberto
  não desliga o efeito do painel por engano. `panel.js` não precisou de
  nenhuma alteração.
- Verificado via Playwright: teste em tempo real (`waitForTimeout`)
  confirmando `is-overlay-open` falso até 15s, verdadeiro aos 31s, e
  falso de novo logo após mover o mouse — com screenshot do efeito
  ativo. Testes adicionais com `page.clock` (fast-forward sem esperar
  de verdade) cobrindo a coordenação com painéis: painel aberto + 31s
  parado + mouse se movendo mantém o efeito do painel intacto do
  início ao fim (a guarda funcionando); fechar o painel derruba a
  classe normalmente; os 31s seguintes parado ativam o idle sozinho.
  Smoke test completo sem erro de console ou de rede genuíno além do
  ruído de terceiro já catalogado (Vimeo, YouTube `compute-pressure`).

### 1.8.1

Patch: novo projeto — "vamos adicionar um projeto. Chama-se 'Mini-doc
COP 30 para EMBRAPA' é de FEV/2026 (entre Global Reneable e GREE).
Busque o Loop em /media. O link do vídeo é ->
https://youtu.be/5M2Jj39qivc".

- **`minidoc-cop30-embrapa` adicionado a `projetos.json`**: `cliente:
  "EMBRAPA"`, `ano: 2026`, `registro: "documental"`, `tipo: "single"`,
  `video` o link do YouTube dado. `data: "2026-08-15"` — não é a data
  real (fev/2026), é a posição pedida no feed ("entre Global Reneable
  e GREE"): entre `gree-smartwind-brasil` (`2026-08-18`) e
  `global-renewable-alliance-cop30` (`2026-08-11`), já que `data` no
  site é uma ordem de exibição curada, não necessariamente a data real
  de produção (mesmo padrão que já vinha sendo usado nos outros 7
  projetos, todos com datas artificiais em sequência semanal).
- **Loop encontrado em `media/loops/loopEMBRAPA.mp4`** — "busque o
  loop em /media" foi literal: o arquivo já estava na pasta, só
  faltava entrar no JSON. Sem poster próprio ainda (`poster: ""`,
  mesmo padrão do Dancebook/Spaten).
- **`placeholder: "#616d40"` calculado a partir do próprio vídeo**, não
  chutado: sem `ffmpeg` disponível no ambiente, gerado um thumbnail via
  `qlmanage -t` (Quick Look, macOS) e calculada a cor média dos pixels
  com Python/PIL — tom verde-oliva de floresta, batendo com a cena
  (registro em mata, tema ambiental/agro coerente com EMBRAPA e COP30).
- Verificado via Playwright: projeto aparece na 5ª posição do feed da
  home (entre "Smartwind para Gree" e "COP30 / UN Conference..."),
  como pedido; `<video>` do loop tocando (`paused:false, readyState:4`)
  no bloco da home; embed do YouTube carregando na página do projeto
  (título "MINIDOC EMBRAPA - COP 30" confirmado vindo do player).
  Smoke test completo (incluindo a nova página
  `projeto.html?slug=minidoc-cop30-embrapa`) sem erro de console ou de
  rede genuíno além do ruído de terceiro já catalogado.

### 1.8.2

Patch, mensagem seguinte, mesma sessão: "esse jop 'EMBRAPA' é
co-diriigido pela Daniela Luquini."

- **`diretor` deixa de ser string única e vira array — mudança de
  schema, não só do projeto novo.** Os 7 projetos existentes (todos só
  com Ricardo) migraram de `"diretor": "ricardo-rapozo"` pra
  `"diretor": ["ricardo-rapozo"]`; o EMBRAPA ficou com
  `["ricardo-rapozo", "daniela-luquini"]`. Ver detalhes técnicos e o
  porquê de migrar TODOS em vez de só suportar os dois formatos em
  paralelo na seção 10 ("Estrutura de arquivos" → `diretor`).
- **`js/feed.js`**: filtro da galeria de diretor trocou `p.diretor ===
  slug` por `p.diretor.indexOf(slug) !== -1` — com isso, o projeto
  passou a aparecer na galeria "trabalhos" TANTO de Ricardo quanto de
  Daniela, não só de um.
- **`js/projeto.js`**: a barra do topo da página do projeto resolve
  cada slug de `p.diretor` pro objeto correspondente em
  `window.DIRETORES`, monta um `<a>` por diretor, e junta os nomes
  (vírgula entre os do meio, " e " antes do último) — "Ricardo Rapozo e
  Daniela Luquini: Mini-doc COP 30 para EMBRAPA" na página do EMBRAPA;
  nos outros 7 projetos (um só diretor), o resultado é idêntico a
  antes, sem juntador nenhum.
- Verificado via Playwright: `projetos.json` validado como JSON válido
  (`python3 -m json` roundtrip) com os 8 `diretor` já em array;
  EMBRAPA confirmado presente na galeria de `ricardo-rapozo.html` E de
  `daniela-luquini.html`; barra da página do projeto confirmada com os
  dois nomes linkados corretamente pros respectivos HTMLs. Smoke test
  completo sem erro de console ou de rede genuíno além do ruído de
  terceiro já catalogado.

### 1.8.3

Patch: "Retire da lista, por ora, o projeto SPATEN. O lançamento dessa
campanha é na sexta-feira. Vamos esperar o lançamento oficial. O
resto, mantenha como está."

- **`spaten-fight-night` removido de `projetos.json`** — retenção
  editorial deliberada, não bug nem mídia faltando (ver seção 11,
  "Pendências", pro lembrete de religar depois do lançamento). Os
  arquivos de mídia (3 loops + 5 fotos) NÃO foram apagados do repo, só
  o objeto no JSON — basta reinserir quando a campanha for ao ar.
- **Sem nenhuma outra mudança** — pedido explícito de manter o resto
  como estava.
- Verificado via Playwright: feed da home confirmado sem "Spaten"
  (7 projetos, era 8); galeria "trabalhos" de Ricardo Rapozo confirmada
  sem o projeto; acesso direto a
  `projeto.html?slug=spaten-fight-night` cai no fallback já existente
  ("Projeto não encontrado."), sem erro de console. Smoke test completo
  (a lista de slugs é lida direto de `projetos.json`, então já não
  testa mais o slug removido) sem erro de console ou de rede genuíno
  além do ruído de terceiro já catalogado (Vimeo).

### 1.8.4

Patch: "precisamos melhorar o card do site vulpes. Na pasta media
existe um arquivo previewVulpes.jpg. Trabalhe isso."

- **Meta tags Open Graph + Twitter Card adicionadas nas 5 páginas** —
  não existia nenhuma até aqui. `og:image`/`twitter:image` apontam pra
  `media/previewVulpes.jpg` (1200×630, já no tamanho recomendado, sem
  precisar de tratamento); `og:title`/`og:description` reaproveitam o
  `<title>`/`<meta description>` que cada página já tinha.
  `ricardo-rapozo.html`/`daniela-luquini.html` usam `og:type="profile"`;
  o resto, `"website"`. Detalhes e o limite conhecido de
  `projeto.html` (card genérico, não por projeto — página é um
  template só, sem build/SSR) documentados na seção 10.
- Verificado via Playwright: `og:title`/`og:image`/`og:url`/
  `twitter:card`/`twitter:image` confirmados presentes e corretos nas
  5 páginas; `media/previewVulpes.jpg` confirmada respondendo `200` com
  `content-type: image/jpeg`. Smoke test completo sem erro de console
  ou de rede genuíno além do ruído de terceiro já catalogado (Vimeo).

### 1.8.5

Patch: "mude o título para 'COP30/UN Conference for Global Renewable
Alliance'".

- **`global-renewable-alliance-cop30`: título de "COP30 / UN Conference
  for Global Renewable Alliance" pra "COP30/UN Conference for Global
  Renewable Alliance"** — só o espaçamento ao redor da barra, resto do
  texto igual.
- Verificado via Playwright: título confirmado no feed da home e na
  barra do topo da página do projeto. Smoke test completo sem erro de
  console ou de rede genuíno além do ruído de terceiro já catalogado
  (Vimeo).

### 1.8.6

Patch: "troque o título 'Dancebook Brasil, Gold Lion Design 2026, para
Lovely'".

- **`dancebook-brasil`: título de "Dancebook Brasil, Gold Lion Design
  2026 para Lovely." pra "Dancebook Brasil, Gold Lion Design 2026,
  para Lovely"** — vírgula antes de "para", ponto final removido.
- Verificado via Playwright: título confirmado no feed da home e na
  barra do topo da página do projeto. Smoke test completo sem erro de
  console ou de rede genuíno além do ruído de terceiro já catalogado
  (Vimeo).

### 1.8.7

Patch: "altere o link do vídeo do projeto redes -> https://youtu.be/
DXdqCU5ujmM e suba de novo o loop da pasta media 'loopReDes.mp4'".

- **`historias-do-brasil-redes`: `video` trocado do Vimeo
  (`vimeo.com/1123794473...`) pro YouTube
  (`https://youtu.be/DXdqCU5ujmM`)** — projeto passa a usar o mesmo
  provedor da maioria dos outros; deixa de ser um dos dois únicos
  projetos em Vimeo (o outro é "COP30/UN Conference...", que continua).
  Como consequência boa, o ruído de terceiro do Vimeo (401 de analytics
  interno + logs `%c%d`) que aparecia nesse projeto no smoke test some
  — só o outro projeto em Vimeo ainda mostra esse ruído catalogado.
- **`media/loops/loopReDes.mp4` substituído** — arquivo novo já estava
  no lugar no disco (era ~5MB, o novo é ~2.9MB) quando o pedido chegou;
  só precisou ser incluído no commit.
- Verificado via Playwright: embed do vídeo na página do projeto
  confirmado apontando pro novo ID do YouTube
  (`youtube.com/embed/DXdqCU5ujmM`); loop novo confirmado carregando e
  tocando no bloco da home (`paused:false, readyState:4`) depois de
  entrar na viewport. Smoke test completo sem erro de console ou de
  rede genuíno além do ruído de terceiro já catalogado (Vimeo, agora só
  no projeto COP30/UN Conference).

### 1.9

Patch: "Vamos mudar a fonte 'News reader' precisamos de uma fonte sem
serifa. Limpa e leve. 1. Mudar para fonte Sans Serif 2. diminua um
ponto a fonte título ([diretor][titulo]) da pagina de projetos."

- **Newsreader (serif) substituída por Inter (sans-serif) em todo
  lugar que a usava** — `@import` trocado em `css/base.css`
  (`family=Inter:wght@300..700`, no lugar de
  `family=Newsreader:opsz,wght@6..72,300..700`); `.bio`,
  `.contact-card__item` e `.projeto-barra` (as três regras que
  declaravam `font-family: 'Newsreader', Georgia, serif`) trocaram pra
  `'Inter', sans-serif`, com `font-weight: 300` explícito (o peso mais
  leve do range importado — "leve" era parte explícita do pedido). Ver
  seção 3, "Sans-serif no lugar de Newsreader", pro porquê da escolha
  e o que NÃO foi afetado (`.diretor-bio--destaque .bio`, que já
  sobrescrevia pra Advent Pro por cima da regra genérica).
- **`.projeto-barra`: `font-size` de `clamp(13px, 1.3vw, 17px)` pra
  `clamp(12px, 1.3vw, 16px)`** — "diminua um ponto a fonte título
  ([diretor][titulo]) da pagina de projetos", 1px a menos nos dois
  limites do `clamp` (o meio, `1.3vw`, não mudou).
- Verificado via Playwright: `font-family` computado confirmado
  `Inter, sans-serif` em `.bio` (`time.html`), `.contact-card__item`
  e `.projeto-barra`; `.diretor-bio--destaque .bio` (páginas de
  diretor) confirmado continuando `"Advent Pro", sans-serif`, sem
  regressão; `font-size` de `.projeto-barra` confirmado `16px` no
  viewport testado. Screenshots revisados visualmente (bio do
  `time.html`, card de contato, barra do topo de projeto). Smoke test
  completo sem erro de console ou de rede genuíno além do ruído de
  terceiro já catalogado (Vimeo).

### 1.9.1

Patch: "reduza mais um ponto" — pergunta anterior confirmou o tamanho
então em uso (`clamp(12px, 1.3vw, 16px)`), pedido seguinte reduziu mais
1px nos dois limites.

- **`.projeto-barra`: `font-size` de `clamp(12px, 1.3vw, 16px)` pra
  `clamp(11px, 1.3vw, 15px)`** — mesmo `1.3vw` no meio, só os limites
  min/max desceram 1px de novo.
- Verificado via Playwright: `font-size` computado confirmado `15px`
  no viewport testado. Smoke test completo sem erro de console ou de
  rede genuíno além do ruído de terceiro já catalogado (Vimeo).

### 1.10

Patch, com referência visual (screenshot marcado à mão): "1. ESTRUTRAL
- vamos mudar a nomenclatura da página PORTFOLIO, agora vai se chamar
PROJETOS. 2. vamos mudar o layout da página PROJETO. Quando ela NÃO
TIVER GALERIA veremos apenas o player do vídeo, sem rolagem da página.
3. temos o botão 'fechar' no canto superior direito ao invés do menu
burguer. 4. não temos rodapé. 5. Quando a página tiver galeria, mantenha
o mesmo esquema de antes, mas retire o rodapé. 6. ATENÇÃO: O RODAPÉ SÓ
APARECE NA PAGINA PRINCIPAL (que agora se chama PROJETOS)."

- **"Portfólio" → "Projetos"** no primeiro item do menu, nas 5 páginas
  (mais `js/chrome.js`, órfão mas mantido em sincronia). Só o texto do
  link — `index.html` continua sendo o destino, nenhuma URL mudou.
- **`projeto.html` sem galeria: "só o player".** Nova classe
  `html.is-projeto-sem-galeria`, decidida por `js/projeto.js` em
  `render()` a partir de `p.galeria` vazio/ausente — todo o resto é CSS
  reagindo a ela: página trava a rolagem (`overflow:hidden` em
  `html`/`body`, mesmo princípio de `is-overlay-open`); `.projeto-corpo`
  vira coluna flex de `100vh`; `#conteudo-projeto` e `.projeto-video`
  viram `flex:1; min-height:0` pra ocupar o espaço que sobra; o
  `<iframe>`/`<video>` ganha `height:100%` e perde o `aspect-ratio:16/9`
  fixo, se ajustando à viewport em vez do contrário. `.burger` some,
  substituído por `.projeto-fechar` (link novo, `<a href="./">fechar
  </a>`, mesmo canto fixo que o burger ocupava) — sem burger, o menu
  (quem somos/contato) fica inacessível nessa variante, de propósito.
  `.projeto-voltar` também some (sem rolagem, nunca seria alcançável).
- **`projeto.html` com galeria: mesmo esquema de sempre**, sem nenhuma
  mudança de comportamento — só perde o rodapé, igual à variante sem
  galeria.
- **`<footer>` removido de `projeto.html`, nas duas variantes.** Escopo
  confirmado com o usuário (a redação do item 6, isolada, seria lida
  como sitewide; o pedido inteiro sendo sobre "a página PROJETO"
  sugeria escopo mais estreito — perguntado, confirmado: só
  `projeto.html`). `index.html`, `ricardo-rapozo.html`,
  `daniela-luquini.html` e `time.html` mantêm o rodapé de sempre, sem
  nenhuma mudança.
- **Mobile: colisão nova entre logo/barra/fechar, achada e corrigida no
  processo.** Reaproveitar a centralização `left:50%` do desktop pra
  `.projeto-barra` no modo sem galeria colocava a caixa da barra por
  baixo do logo em telas estreitas (`.logo` e `.projeto-fechar` têm
  largura fixa — "vulpesfilmes"/"fechar" não mudam — mas a barra
  centralizada na viewport inteira não sabia disso). Corrigido
  ancorando a barra pelas duas bordas (`left`/`right` calculados a
  partir da largura de cada vizinho + folga) em vez de centralizar
  cegamente.
- Verificado via Playwright: sem galeria — `scrollHeight === innerHeight`
  (zero rolagem) confirmado em desktop E mobile, `.burger` `display:
  none`, `.projeto-fechar` visível e navegando pra `/` ao clicar,
  `<footer>` ausente, testado com YouTube E Vimeo (os dois provedores
  de vídeo em uso no site); com galeria — burger visível, fechar
  oculto, `<footer>` ausente mesmo rolando até o fim, `scrollHeight >
  innerHeight` (rolagem normal preservada). Menu confirmado com label
  "Projetos" nas 5 páginas; `index.html` confirmado com rodapé intacto.
  Screenshots revisados visualmente (desktop e mobile, com e sem
  galeria) — resultado comparado contra a referência visual enviada.
  Smoke test completo sem erro de console ou de rede genuíno além do
  ruído de terceiro já catalogado (Vimeo).

### 1.11

Patch, com dois screenshots de referência (um marcado à mão mostrando o
desalinhamento): "TODAS as paginas do PROJETO devem obedecer o
seguinte padrão: LOGO [DIRETOR] - [TITULO] VOLTAR (Menu Hamburger
SOME]... Na versão mobile da página o título vai para o rodapé.
ATENÇÃO: com a retirada do rodapé da pagina PROJETO, deixou um espaço
estranho entre as imagens e a barra título. Corrija isso."

- **As duas variantes de `projeto.html` (com e sem galeria) passam a
  usar o MESMO chrome fixo** — até aqui só a variante sem galeria
  (V1.10) tinha perdido o burger; a com-galeria mantinha burger +
  `.projeto-voltar` sticky-até-o-fim-da-rolagem. Unificado: `.burger`,
  `<nav id="menu">`, "quem somos" e "contato" saíram do HTML de
  `projeto.html` de vez (sem burger, esses painéis não tinham mais
  gatilho — removidos em vez de deixados como código morto).
  `js/panel.js` parou de ser carregado nessa página pelo mesmo motivo
  (continuaria assumindo elementos que não existem mais, gerando erro
  de JS — `burger.addEventListener` sem guarda de `if`).
- **`.projeto-voltar`, link único "voltar", fixo no canto superior
  direito, nas duas variantes** — substitui três mecanismos antigos
  por um: o `.projeto-voltar` sticky-até-o-fim-da-rolagem (V1.3, só
  com galeria), o `.projeto-fechar` (V1.10, só sem galeria) e o
  `.burger` (as duas). Mesmo destino de sempre (`href="./"`).
- **Alinhamento vertical entre logo/barra/voltar corrigido a partir da
  referência marcada à mão.** Causa raiz: os três `position:fixed` com
  o mesmo `top` fixo, mas fontes de tamanhos DIFERENTES — alinhava o
  TOPO da caixa de cada um, não o centro do texto, e caixas de altura
  diferente com o mesmo topo ficam com centros diferentes. Corrigido
  calculando o `top` de cada elemento a partir da MESMA linha média (a
  do `.logo`, `18px + 21px/2 = 28.5px`), subtraindo metade da própria
  altura de caixa — `.projeto-barra` guarda o `font-size` numa custom
  property (`--fs`) pra poder reusar no `calc()` do `top`. Verificado
  via Playwright: os três centros de texto em `28.5px` exatos, nas
  duas variantes.
- **Mobile: barra sempre vai pro rodapé, nas duas variantes** — antes,
  a variante sem galeria tinha um desvio próprio (barra fixa no topo,
  ancorada entre logo e "fechar", V1.10) porque não tinha rodapé nem
  rolagem pra sustentar o truque do sticky-bottom. Unificado: a barra
  sempre desce pro rodapé mobile (`position:sticky;bottom:0`); sem
  galeria, como `.projeto-corpo` é uma coluna flex de `100vh` sem
  nada rolando, o `sticky` vira `relative` na prática — fica parada
  na própria posição de flex-item, que já é o rodapé da coluna.
- **Espaço vazio entre a galeria e a barra, eliminado.** Causa: `#conteudo-
  projeto` (`.feed`) reservava `padding-bottom: var(--block-gap)`
  (72–160px) pra separar o conteúdo do `<footer>` que vinha em
  seguida — órfão desde que o rodapé saiu de `projeto.html` (V1.10).
  Zerado (`#conteudo-projeto { padding-bottom: 0 }`), incondicional
  pras duas variantes. Verificado via Playwright: gap entre a última
  foto da galeria e a barra, rolando até o fim no mobile, `0px` exatos
  (era um vão de ~72-160px antes).
- Verificado via Playwright: sem burger em `projeto.html` (as duas
  variantes); `.projeto-voltar` navegando pra `/` ao clicar de
  verdade; alinhamento de 28.5px confirmado; sem galeria continua sem
  rolagem (`scrollHeight === innerHeight`); mobile sem colisão entre
  logo/barra/voltar (testado com os textos reais "vulpesfilmes" e
  "voltar"); zero erros de console/JS (confirma que a remoção de
  `panel.js` não quebrou nada). Screenshots revisados visualmente
  (desktop e mobile, com e sem galeria) contra a referência enviada.
  **Achado à parte, não corrigido pelo código**: os vídeos do YouTube
  de `cbcc-2026` e `historias-do-brasil-redes` mostraram "vídeo
  indisponível, conta encerrada" — visto no screenshot enviado e
  reproduzido uma vez via Playwright, mas não reproduzido em
  verificações seguintes (provável instabilidade passageira, não bug
  de código) — registrado na seção 11, Pendências, pro usuário
  confirmar direto no YouTube. Smoke test completo sem erro de console
  ou de rede genuíno além do ruído de terceiro já catalogado (Vimeo,
  YouTube `compute-pressure`).
