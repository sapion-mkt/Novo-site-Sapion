/* ==========================================================================
   Acervo técnico — filtro por tipo e busca por município/documento.
   Os cards estão no HTML (funcionam sem JavaScript); aqui só filtramos.
   ========================================================================== */
(function () {
  "use strict";

  var lista = document.querySelector("[data-acervo]");
  if (!lista) return;

  var itens = Array.prototype.slice.call(lista.querySelectorAll(".documento"));
  var botoes = Array.prototype.slice.call(document.querySelectorAll(".filtro"));
  var busca = document.getElementById("acervo-busca");
  var contagem = document.querySelector("[data-contagem]");
  var vazio = document.querySelector(".acervo__vazio");
  var tipoAtivo = "todos";

  /* Palavras que a pessoa pode usar para cada tipo, além das que já estão no card. */
  var SINONIMOS = {
    diretrizes: "diretriz diretrizes curriculo curriculos curricular curriculares",
    pme: "pme plano planos municipal municipais educacao",
    proposta: "proposta propostas pedagogica pedagogicas",
    boletim: "boletim boletins educacional educacionais",
    guia: "guia guias intervencao pedagogica pedagogicas",
    publicacao: "publicacao publicacoes livro livros",
    institucional: "institucional portfolio sapion"
  };
  var UFS = { es: "espirito santo", ce: "ceara" };
  /* Palavras que não ajudam a achar nada ("plano de educação de Pancas"). */
  var VAZIAS = ["a", "o", "as", "os", "e", "de", "da", "do", "das", "dos", "em", "na", "no", "para"];

  function normalizar(texto) {
    return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }

  function palavras(texto) {
    return normalizar(texto).split(/[^a-z0-9]+/).filter(Boolean);
  }

  function textoDe(item, seletor) {
    var el = item.querySelector(seletor);
    return el ? el.textContent : "";
  }

  /* O índice de cada card sai do próprio texto dele: tipo, município, título e "UF · ano".
     Assim, um documento novo já entra na busca sem precisar de mais nada. */
  itens.forEach(function (item) {
    var meta = textoDe(item, ".documento__meta");
    var texto = [
      textoDe(item, ".documento__tipo"),
      textoDe(item, ".documento__municipio"),
      textoDe(item, ".documento__titulo"),
      meta,
      SINONIMOS[item.dataset.tipo] || "",
      item.dataset.busca || ""
    ].join(" ");
    var uf = /\/([A-Z]{2})\b/.exec(meta);
    if (uf && UFS[uf[1].toLowerCase()]) texto += " " + UFS[uf[1].toLowerCase()];
    item._palavras = palavras(texto);
  });

  /* Cada palavra buscada precisa ser o começo de alguma palavra do card, em qualquer ordem:
     "baixo guandu diretrizes", "pme pancas", "2016", "espírito santo" e "matem" funcionam. */
  function combina(item, termos) {
    return termos.every(function (termo) {
      return item._palavras.some(function (p) { return p.indexOf(termo) === 0; });
    });
  }

  var rotulo = document.querySelector("[data-contagem-rotulo]");
  var vazioTitulo = vazio.querySelector("[data-vazio-titulo]");
  var vazioTexto = vazio.querySelector("[data-vazio-texto]");
  var vazioOutros = vazio.querySelector("[data-vazio-outros]");
  var vazioAgendar = vazio.querySelector("[data-vazio-agendar]");
  var vazioLimpar = vazio.querySelector("[data-vazio-limpar]");

  /* No celular, os filtros viram uma lista de seleção (os botões continuam no HTML). */
  var grupoFiltros = document.querySelector(".acervo__filtros");
  var caixaTipo = document.createElement("div");
  caixaTipo.className = "acervo__tipo";
  caixaTipo.innerHTML = '<label for="acervo-tipo" class="sr-only">Tipo de documento</label><select id="acervo-tipo"></select>';
  grupoFiltros.parentNode.insertBefore(caixaTipo, grupoFiltros.nextSibling);
  var seletor = caixaTipo.querySelector("select");
  botoes.forEach(function (b) {
    var opcao = document.createElement("option");
    opcao.value = b.dataset.filtro;
    opcao.dataset.nome = b.dataset.filtro === "todos" ? "Todos os tipos" : b.firstChild.textContent.trim();
    seletor.appendChild(opcao);
  });
  seletor.addEventListener("change", function () { escolherTipo(seletor.value); });

  /* O filtro que está na tela: botões no desktop, lista de seleção no celular. */
  function filtroVisivel() { return caixaTipo.offsetParent ? seletor : botoes[0]; }

  function escolherTipo(tipo) {
    tipoAtivo = tipo;
    botoes.forEach(function (b) {
      var ativo = b.dataset.filtro === tipo;
      b.classList.toggle("is-ativo", ativo);
      b.setAttribute("aria-pressed", String(ativo));
    });
    aplicar();
  }

  function documentos(n) { return n === 1 ? "1 documento" : n + " documentos"; }

  /* Leitor de tela: anuncia o resultado quando a pessoa para de digitar, não a cada tecla. */
  var anuncio = document.querySelector("[data-anuncio]");
  var esperaAnuncio;
  function anunciar(texto) {
    clearTimeout(esperaAnuncio);
    esperaAnuncio = setTimeout(function () { anuncio.textContent = texto; }, 600);
  }

  function aplicar() {
    var termos = palavras(busca.value).filter(function (t) { return VAZIAS.indexOf(t) === -1; });
    var porTipo = { todos: 0 };
    var visiveis = 0;

    itens.forEach(function (item) {
      var okBusca = !termos.length || combina(item, termos);
      var okTipo = tipoAtivo === "todos" || item.dataset.tipo === tipoAtivo;
      if (okBusca) {
        porTipo.todos++;
        porTipo[item.dataset.tipo] = (porTipo[item.dataset.tipo] || 0) + 1;
      }
      item.hidden = !(okBusca && okTipo);
      if (!item.hidden) visiveis++;
    });

    /* A contagem de cada filtro acompanha a busca; filtro sem documento fica apagado
       (o que está ativo continua clicável, para a pessoa poder sair dele). */
    botoes.forEach(function (b) {
      var n = porTipo[b.dataset.filtro] || 0;
      b.querySelector("span").textContent = n;
      b.disabled = n === 0 && !b.classList.contains("is-ativo");
    });
    Array.prototype.forEach.call(seletor.options, function (o) {
      var n = porTipo[o.value] || 0;
      o.textContent = o.dataset.nome + " (" + n + ")";
      o.disabled = n === 0 && o.value !== tipoAtivo;
    });
    seletor.value = tipoAtivo;

    contagem.textContent = visiveis;
    rotulo.textContent = visiveis === 1 ? "documento" : "documentos";

    vazio.hidden = visiveis !== 0;
    if (visiveis === 0) mostrarVazio(busca.value.trim(), porTipo.todos);
    if (iniciado) anunciar(visiveis === 0 ? vazioTitulo.textContent : documentos(visiveis) + (visiveis === 1 ? " encontrado" : " encontrados"));
  }

  function mostrarVazio(termo, emOutrosTipos) {
    var citado = "“" + termo + "”";
    if (emOutrosTipos > 0) {
      /* A busca acha documentos, mas não no tipo escolhido. */
      var ativo = botoes.filter(function (b) { return b.classList.contains("is-ativo"); })[0];
      vazioTitulo.textContent = "Nenhum resultado em " + ativo.firstChild.textContent.trim();
      vazioTexto.textContent = "Há " + documentos(emOutrosTipos) + " com " + citado + " em outros tipos.";
      vazioOutros.textContent = "Ver " + (emOutrosTipos === 1 ? "o documento" : "os " + emOutrosTipos + " documentos");
      vazioOutros.hidden = false;
      vazioAgendar.hidden = true;
    } else {
      /* Provavelmente o município de quem está buscando: vira convite, não beco sem saída. */
      vazioTitulo.textContent = "Ainda não há documentos com " + citado + " no acervo";
      vazioTexto.textContent = "Se a sua rede ainda não está aqui, a Sapion pode apoiá-la também. Agende uma apresentação, on-line ou presencial.";
      vazioOutros.hidden = true;
      vazioAgendar.hidden = false;
    }
  }

  botoes.forEach(function (botao) {
    botao.addEventListener("click", function () { escolherTipo(botao.dataset.filtro); });
  });

  vazioOutros.addEventListener("click", function () {
    escolherTipo("todos");
    filtroVisivel().focus();   /* o botão some com o aviso; o foco vai para o filtro */
  });

  vazioLimpar.addEventListener("click", function () {
    busca.value = "";
    escolherTipo("todos");
    busca.focus();
  });

  /* Busca fixa no celular. Um marcador vazio logo antes das ferramentas guarda o lugar
     original da busca: se ele já passou para baixo do menu, a busca está grudada. */
  var caixaBusca = busca.parentNode;
  var ferramentas = document.querySelector(".acervo__ferramentas");
  var marcador = document.createElement("div");
  marcador.setAttribute("aria-hidden", "true");
  ferramentas.parentNode.insertBefore(marcador, ferramentas);

  function topoFixo() { return parseFloat(getComputedStyle(caixaBusca).top) || 0; }
  function buscaGrudada() {
    return getComputedStyle(caixaBusca).position === "sticky" &&
      marcador.getBoundingClientRect().top < topoFixo() - 1;
  }
  function marcarBuscaFixa() { caixaBusca.classList.toggle("is-fixa", buscaGrudada()); }
  window.addEventListener("scroll", marcarBuscaFixa, { passive: true });
  window.addEventListener("resize", marcarBuscaFixa);

  /* Buscando no meio da lista, a página volta para o início das ferramentas:
     o tipo, a contagem e os primeiros resultados aparecem logo abaixo da busca. */
  busca.addEventListener("input", function () {
    aplicar();
    if (buscaGrudada()) {
      var alvo = marcador.getBoundingClientRect().top + window.scrollY - topoFixo();
      window.scrollTo({ top: alvo, behavior: "instant" });
    }
  });

  var iniciado = false;
  aplicar();
  iniciado = true;
})();
