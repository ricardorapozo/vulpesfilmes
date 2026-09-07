# vulpesfilmes — documento do projeto

**Versão 0.17** (beta). A partir de agora o projeto é numerado por versão:
enquanto estivermos no beta, cada leva de alterações pedida vira uma
versão (0.01, 0.02, ...). As levas anteriores a esta não foram numeradas
retroativamente — o histórico formal começa aqui. Ver Changelog, seção 12.

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

Vale para os dois painéis do site — menu e quem somos. Não é um efeito do menu,
é o efeito de qualquer painel aberto. Classe no `<html>`: `.is-overlay-open`.

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

No estado base o `filter` fica desligado (`filter: none`), então as mídias
aparecem em cor cheia.

---

## 3. Tipografia

Família única: **Advent Pro** (Google Fonts, variável, eixos `wdth` 100–200 e `wght` 100–900).

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

- Painel desce do topo com altura natural do conteúdo, sem espaço negativo e sem scroll (overflow hidden).
- Ao abrir: `--paper` do `body` vira `--hue`, hambúrguer vira X, mídias entram em duotone.
- Fundo do painel: branco puro (`--panel-bg: #FFFFFF`), não sorteado.
- Item da página atual não tem sublinhado visual (atributo `aria-current="page"` permanece para acessibilidade).
- Redes sociais em linha, separadas por `/`, corpo pequeno.
- **"Diretores" é um botão que revela submenu com nomes.** Clicar em nome navega para página do diretor.
  O botão recebe o mesmo tratamento de hover/foco dos links do menu (linha animada) — não é
  exclusivo de `<a>`, vale para `.menu-toggle` também.
- Submenu abre no mesmo painel, com a mesma altura do menu principal, e oferece botão `voltar`.
  **Armadilha de CSS:** como o botão `voltar` fica entre o toggle e o `<ul class="submenu">` no HTML,
  a regra que revela o submenu não pode usar `+` (irmão imediato) — tem que ser `~` (irmão geral),
  senão o submenu nunca aparece mesmo com `aria-expanded="true"`.
- **"Contato" abre um card**, não um `mailto:` direto (ver "Card de contato" abaixo).
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

### Página de projeto e modal de vídeo (V7, revisado em V9/V10)

Resolve duas pendências que ficaram em aberto por várias versões: cada
projeto agora tem página própria (`projeto.html?slug=<slug>`), e o vídeo
"de verdade" (não o loop mudo ambiente) tem um destino claro pra tocar.

**`projeto.html` é um template só**, não uma página por projeto — segue o
mesmo princípio de tudo aqui: nada escrito à mão. `js/projeto.js` lê
`?slug=` da URL, busca o projeto em `window.PROJETOS` e monta, **nesta
ordem** (V9):

1. Título + mídia ambiente juntos dentro de `.block__main` — mesmo
   agrupamento da home (ver "Título preso no scroll" acima). É esse
   agrupamento, não uma regra CSS isolada, que faz o título ficar "atrás"
   da mídia ao rolar e parar de grudar assim que `.block__main` termina.
   A mídia é clicável, sem ícone, se o projeto tiver campo `video` (ver
   "Vídeo sem ícone" abaixo).
2. Galeria de fotos em grade 3 colunas (`.galeria-fotos`, 2 no mobile),
   **fora** de `.block__main`, como item irmão — a partir do array
   `galeria` do projeto, `object-fit: cover` (exceção deliberada à regra
   de nunca recortar a peça do cliente: aqui são fotos de registro numa
   grade uniforme, não a peça principal).

**V8 tinha colocado o título por último**, com `position: static`, porque
sem o agrupamento em `.block__main` o sticky do título ficava com alcance
igual ao `<article>` inteiro — cobrindo a galeria de fotos embaixo dele o
tempo todo em que ela estivesse na tela. **V9 corrigiu isso na raiz**: o
título voltou pro topo, e o agrupamento em `.block__main` (igual à home)
restringe o sticky à altura do próprio par título+mídia, sem precisar
desligar o efeito.

O `<article>` usa uma classe própria, `.bloco-projeto`: coluna única
(`grid-template-columns: 1fr`), sem a divisão bloco+coluna vazia da home —
não faz sentido alternar lado numa página sobre um projeto só.

**Vídeo sem ícone (V8).** O botão de play visível foi removido — nenhuma
"janela" (bloco da home, galeria de diretor, página de projeto) mostra
mais o ícone. Onde o projeto tem campo `video`, a mídia inteira continua
clicável e abre o mesmo modal — só não há indicação visual, apenas cursor
e foco de teclado (`.media__play:focus-visible`, com o mesmo truque de
`mix-blend-mode: difference` das setas, pra aparecer sobre qualquer
mídia). O ícone de galeria ao lado do título também foi removido nessa
mesma leva (ver "Ícone de galeria" acima) — o título é o único acesso à
página do projeto.

**Carrossel de fotos da galeria (V8).** Clicar numa foto de
`.galeria-fotos` abre `js/photo-modal.js`: um lightbox com as mesmas setas
do carrossel da home, navegando entre as fotos daquela galeria (Esc,
←/→, clique fora fecham). Ele lê a lista de fotos direto do DOM (todas as
`<img>` da `.galeria-fotos` clicada) em vez de `projetos.json` — não
precisa saber qual projeto está aberto, só qual grade foi clicada.

**Modal de vídeo** (`js/video-modal.js`, `.video-modal` no HTML de cada
página) é **deliberadamente separado** do sistema de painel de
`js/panel.js`, pelo mesmo motivo do modal de fotos. Diferenças de
propósito, não só de código:

- Fundo preto de cinema fixo, não a cor sorteada da sessão — assistir
  vídeo não deve competir com o efeito de cor do site.
- Conteúdo dinâmico por clique (URL do vídeo muda a cada abertura),
  enquanto os painéis têm HTML fixo.
- Qualquer elemento com `[data-video="<url>"]` abre o modal — usado tanto
  na home/galeria de diretor quanto na página de projeto.

O campo `video` no projeto aceita link do YouTube (`youtu.be/...` ou
`youtube.com/watch?v=...`), **do Vimeo (`vimeo.com/<id>`, V10)** ou
caminho de mp4 local. `urlDeEmbed()` (renomeada de `idDoYoutube()` na V10,
quando ganhou o Vimeo) reconhece a plataforma por regex e injeta um
`<iframe>` do embed correto (`youtube.com/embed/<id>` ou
`player.vimeo.com/video/<id>`) com autoplay; qualquer outra URL vira
`<video controls autoplay>`. Fechar o modal esvazia
`.video-modal__frame` — é isso que para o áudio/vídeo, não só escondê-lo.

**Logo e hambúrguer somem durante a visualização (V11).** Tanto o modal de
vídeo quanto o lightbox de fotos ficam com seu botão "fechar" fixo em
`top: 18px; right: var(--gutter)` — exatamente onde o `.burger` também
fica. Sem tratamento, os dois ficavam sobrepostos, competindo por clique e
por foco de teclado. `js/video-modal.js` e `js/photo-modal.js` agora
adicionam `is-lightbox-open` no `<html>` ao abrir (e removem ao fechar);
`html.is-lightbox-open .logo, html.is-lightbox-open .burger { display:
none; }` em `css/base.css` esconde os dois. Só "fechar" fica acessível
enquanto o vídeo ou a foto estão em tela — a mesma classe serve pros dois
modais porque o problema e a solução são idênticos nos dois.

`js/helpers.js` existe porque `feed.js` (home + galeria de diretor) e
`projeto.js` (página de projeto) precisam das mesmas funções `escapar` e
`midiaHTML` — extraídas pra não duplicar.

### Nosso time

`time.html` continua existindo como página consolidada dos diretores (bloco
de pessoa para cada um, sem galeria). Seu propósito é quadro executivo, não
portfólio individual. As páginas de diretor (`ricardo-rapozo.html` etc.) são
as que têm seus trabalhos.

### Quem somos

Barra que sobe do rodapé cobrindo 2/3 da tela. Abre `.is-overlay-open`, então
o fundo inunda de cor e as mídias visíveis no terço superior entram em duotone.

Mesma cor da sessão que o menu. Abrir o menu, fechar, abrir o quem somos —
a cor é a mesma. Ela pertence à visita, não ao painel.

**Painel é um componente com três variantes** (V5 acrescentou o card de
contato), não componentes separados:

| | menu | quem somos | contato |
|---|---|---|---|
| origem | topo | rodapé | centro (card) |
| altura | natural | natural | natural |
| conteúdo | navegação + redes | logo + texto | local, e-mail, telefone |

Altura de "quem somos" era fixa (`66vh` no desktop, `100vh` no mobile) até
a V9 — virou `height: auto` nos dois casos, pra barra crescer só o
necessário pro logo + texto, sem vão vazio.

Comportamento idêntico nos três: fecha com Esc e com clique fora, prende o foco
enquanto aberto, devolve o foco ao gatilho ao fechar, `aria-expanded`, `inert`
no conteúdo atrás, e todos disparam `.is-overlay-open` (cor de fundo sorteada
da sessão + duotone nas mídias visíveis).

### Card de contato

Item "Contato" do menu não é mais um `mailto:` direto — abre um card
centralizado (`.panel--contact`), a terceira variante do painel. Ao invés de
descer do topo ou subir do rodapé, ele nasce do centro com `scale` + `opacity`
em vez de `translateY`. Conteúdo: cidade/país, e-mail (`mailto:`) e telefone
(`tel:`). Mesmo efeito de cor de fundo dos outros painéis, porque participa do
mesmo array `paineis` em `js/panel.js` — nenhum código novo de foco/Esc/clique-fora
foi necessário.

A abertura de painéis por `data-abre` é genérica: o valor do atributo é o `id`
do painel-alvo (`data-abre="quem-somos"` → `#quem-somos`, `data-abre="contato"`
→ `#contato`). Um item de menu novo que abre painel não pede alteração em
`panel.js`, só a marcação `data-abre="<id>"` no HTML.

**Logo e "fechar" (V7, redesenhado em V12, V13 e V0.13.1).** V7 pôs o logo
quadrado (`vulpesFilmes-LOGO-1x1.png`) ao lado do texto, num flex row —
um wordmark largo e baixo ao lado de um bloco de texto alto e estreito
não tinha equilíbrio nenhum. V12 trocou pelo logo horizontal
(`vulpesFilmes-LOGO-HORIZONTAL.png`, 1791×772) e empilhou tudo numa
coluna única (logo como banner no topo, texto abaixo). V13 voltou lado a
lado a partir de uma referência visual, mas errou a proporção: logo
pequeno (`clamp(220px, 20vw, 320px)`, uns 53% da largura do texto) e todo
o bloco flush no gutter — a referência mostrava um logo quase do mesmo
tamanho do texto (~85%) e o conjunto **centralizado no painel**, não
alinhado ao gutter como o resto do site. **V0.13.1 corrigiu as duas
medidas**, comparando pixel a pixel com a referência: logo maior
(`clamp(260px, 30vw, 460px)`) e `.about-content` com `max-width: 1180px`
+ `margin-inline: auto` pra centralizar o conjunto logo+texto no painel.
`align-items: center` (vertical) e `flex-wrap` (responsivo) continuam
como em V13.

O botão "fechar" mudou de lugar em V12 e continua assim: antes ficava em
fluxo normal, sozinho acima do logo à esquerda; agora é `position:
absolute; top: 18px; right: var(--gutter)` **dentro do painel** (que já é
`position: fixed`, então o absolute ancora nele, não no viewport) — canto
superior direito do painel, não da página, já que "quem somos" só cobre a
parte de baixo da tela.

**Transição a partir do menu.** "Quem somos" é item do menu. Ao clicar: o menu
recolhe para o topo e a barra sobe do rodapé. Os dois movimentos se sobrepõem
(o de saída começa e o de entrada entra em ~120ms), senão a tela fica vazia no
meio e o corte parece um erro de carregamento. `.is-overlay-open` permanece
ativo o tempo todo — a cor não pisca entre um painel e outro.

**Texto — real desde V11** (era lorem ipsum provisório antes disso):

> A Vulpes é um pequeno bureau de soluções audiovisuais. Um lugar para
> pensar, criar e dar forma a ideias.

> Trabalhamos onde estratégia encontra imagem: na direção, no roteiro, na
> edição, no motion e na pós-produção. Entramos no projeto conforme o que
> ele pede, juntando olhar criativo, repertório e precisão técnica para
> transformar uma boa ideia em algo que realmente mereça ser visto.

Corpo do texto: **Newsreader**, `wdth` não variável, peso 400, `clamp(16px, 1.5vw, 20px)`,
entrelinha 1.5, largura máxima 52ch. A Newsreader é exclusiva de parágrafos
(`.bio` e `.panel--about .prose`); títulos, menu, créditos, rodapé e botões
continuam em Advent Pro.

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

Componente presente em todas as páginas, ao fim de `<main>`.

**Conteúdo:**

- `© 2026 vulpesfilmes`
- `contato@vulpesfilmes.com` — link `mailto:`
- `São Paulo / Brasil. Atendendo o mundo todo.`

Redes sociais (`vimeo / instagram / youtube`) **removidas do rodapé em
V8** — continuam só no menu (`.panel--menu .social`), não duplicadas aqui.

**Tipografia e cores:**

- `wdth` 100, peso 600 (V6, era 400 — texto do rodapé ganhou mais peso pra
  legibilidade), 14px. Nada de `wdth` 200.
- Fundo transparente, herdando o `<body>`. Quando um painel abrir, o rodapé
  fica sobre `--hue` junto com o resto. Texto sempre `--ink`.

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
│   ├── video-modal.js    modal de vídeo (YouTube/Vimeo/mp4)
│   ├── photo-modal.js    lightbox de fotos da galeria
│   ├── media.js          IntersectionObserver, fallback de mídia quebrada
│   ├── carousel-infinite.js   carrossel infinito (tipo "carousel")
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
  "registro": "documental",
  "tipo": "single",
  "diretor": "",
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

`tipo` é `"single"` ou `"carousel"` (ver seção 4). `midia` é sempre array —
um item em `single`, vários em `carousel`. `placeholder` é a cor de fundo do
bloco enquanto a mídia carrega ou falha; se `poster` apontar para um arquivo
inexistente, `js/media.js` detecta o erro de carga e troca a mídia por um
aviso "mídia em produção" sobre essa cor — é o jeito padrão de entrar com um
projeto cujo material ainda não chegou (a mídia de `midia[]` — o loop
ambiente — não precisa existir pra o projeto ter uma página com vídeo real).

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

---

## 11. Pendências

Bloqueiam a implementação:

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
- [x] Comportamento da galeria e página de projeto individual — **Resolvido
  em V7**, refinado em V9 (título de volta ao topo, sticky como na home) e
  V10 (Vimeo além de YouTube/mp4): `projeto.html?slug=<slug>` (template
  único, dado vem de `projetos.json`) com vídeo real (campo `video`)
  tocando num modal, e galeria de fotos em grade abaixo. Ver seção 6,
  "Página de projeto e modal de vídeo".
- [ ] Fotos de `media/galeria/cbcc-2026/` estão pesadas (8-9MB cada, direto
  da câmera) — valeria comprimir/redimensionar antes de publicar

---

## 12. Changelog

Formato: mudanças pedidas numa mesma leva = uma versão. Ainda estamos na
versão `0.x` (beta) — patches ficam `0.XX.1`, `0.XX.2` etc., nunca `XX.1`
sozinho (isso já causou confusão uma vez: uma correção virou "13.1" em
vez de "0.13.1", parecendo versão 13). No corpo do texto, `V8`, `V9`,
`V13` etc. são abreviação de `0.08`, `0.09`, `0.13` — mas patches sempre
levam o `0.` por extenso (`V0.13.1`, não `V13.1`). Ver nota de versão no
topo do documento.

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
