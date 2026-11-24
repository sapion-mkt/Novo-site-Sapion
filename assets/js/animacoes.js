/* ==========================================================================
   Animações (Etapa 6) — revelar ao rolar, números contando, barra de
   progresso, luz que segue o cursor e leve 3D no print do hero.
   Não roda nada se o sistema pede "reduzir movimento".
   ========================================================================== */
(function () {
  "use strict";

  var reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ponteiroFino = window.matchMedia("(pointer: fine)").matches;

  /* ---------- Barra de progresso de leitura ---------- */
  if (!reduzir) {
    var barra = document.createElement("div");
    barra.className = "progresso-leitura";
    barra.setAttribute("aria-hidden", "true");
    document.body.appendChild(barra);
    var agendado = false;
    var atualizarProgresso = function () {
      agendado = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      barra.style.setProperty("--progresso", max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : 0);
    };
    window.addEventListener("scroll", function () {
      if (!agendado) { agendado = true; requestAnimationFrame(atualizarProgresso); }
    }, { passive: true });
    atualizarProgresso();
  }

  /* ---------- Revelar ao rolar (em cascata dentro do mesmo grupo) ---------- */
  var grupos = [
    [".secao-cabeca, .sapion__definicao, .especialistas__cabeca, .professores__cabeca", ""],
    [".reconhecimento, .causas__lista > li, .obrigacao__lista > li, .magister__numeros > li, .trilha, .especialista", ""],
    [".composicao, .ingresso, .fundador, .magister__magis", "zoom"],
    [".problema__topo > div, .magister__topo > div:first-child, .resultados__destaque, .auxia__texto, .contato__intro, .contato__mais", "esquerda"],
    [".dado-destaque, .comparativo, .auxia__mockup, .formulario", "direita"],
    [".domino__peca, .contexto__titulo, .ponte, .abas, .caso, .depoimentos > li, .comentario", ""],
    [".summit__abertura > *, .bento-foto, .numero-summit, .galeria-card", ""],
    [".auxia__numeros > li, .pessoa, .trajetoria > *, .equipe__rotulo", ""],
    /* Acervo: os cards não têm entrada própria. Com a cascata, um card encontrado pela
       busca ficava invisível por ~0,5 s e o hover não levantava o card (revisão de 23/11/2026). */
    [".acervo__ferramentas, .rodape__grade > *", ""]
  ];

  var observador = null;
  if (!reduzir && "IntersectionObserver" in window) {
    observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add("is-visivel");
        observador.unobserve(entrada.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    grupos.forEach(function (grupo) {
      document.querySelectorAll(grupo[0]).forEach(function (el) {
        if (el.closest(".hero")) return;           // o hero tem entrada própria
        if (el.classList.contains("revelar")) return;
        el.classList.add("revelar");
        if (grupo[1]) el.classList.add("revelar--" + grupo[1]);
      });
    });

    // Atraso em cascata entre irmãos (máx. 7 passos)
    document.querySelectorAll(".revelar").forEach(function (el) {
      var irmaos = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains("revelar"); });
      var i = irmaos.indexOf(el);
      el.style.setProperty("--atraso", Math.min(i, 7) * 90 + "ms");
      observador.observe(el);
    });
  }

  /* ---------- Números contando (o valor final já está no HTML) ----------
     Revisão de 23/11/2026: só contam os números de volume (a partir de 1.000), e a
     contagem parte de 70% do valor, nunca do zero. Percentuais, notas do Ideb e
     números pequenos ficam parados: são prova, e quem chega rápido não pode ver
     "+0%" ou uma nota errada no meio da contagem. */
  var seletoresNumeros = [
    ".hero__indicadores .indicador__numero", ".magister__numeros strong",
    ".numero-summit strong", ".auxia__numeros strong"
  ].join(", ");
  var padrao = /^(\D*?)(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d+))?([\s\S]*)$/;
  var INICIO = 0.7;

  function contar(el) {
    var original = el.textContent;
    var m = original.trim().match(padrao);
    if (!m) return;
    var prefixo = m[1], inteiro = m[2], decimais = m[3] || "", sufixo = m[4];
    var agrupar = inteiro.indexOf(".") !== -1;
    var alvo = parseFloat(inteiro.replace(/\./g, "") + "." + (decimais || "0"));
    if (alvo < 1000 || sufixo.indexOf("%") !== -1) return;
    var casas = decimais.length;
    var duracao = 1200;
    var inicio = null;
    function quadro(t) {
      if (inicio === null) inicio = t;
      var p = Math.min(1, (t - inicio) / duracao);
      var suave = 1 - Math.pow(1 - p, 4);
      var valor = alvo * (INICIO + (1 - INICIO) * suave);
      el.textContent = prefixo + valor.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas, useGrouping: agrupar }) + sufixo;
      if (p < 1) requestAnimationFrame(quadro);
      else el.textContent = original;           // garante o texto exato do HTML
    }
    requestAnimationFrame(quadro);
  }

  if (!reduzir && "IntersectionObserver" in window) {
    var obsNumeros = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        obsNumeros.unobserve(entrada.target);
        contar(entrada.target);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll(seletoresNumeros).forEach(function (el) {
      if (/\d/.test(el.textContent)) obsNumeros.observe(el);
    });
  }

  if (reduzir || !ponteiroFino) return;

  /* ---------- Luz que segue o cursor nos painéis escuros ---------- */
  document.querySelectorAll(".hero__painel, .secao--escura.painel, .fundador, .especialistas, .composicao").forEach(function (painel) {
    painel.classList.add("holofote");
    painel.addEventListener("pointermove", function (e) {
      var r = painel.getBoundingClientRect();
      painel.style.setProperty("--mx", (e.clientX - r.left) + "px");
      painel.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* ---------- Leve 3D no print do hero acompanhando o mouse ---------- */
  var painelHero = document.querySelector(".hero__painel");
  var mockup = document.querySelector(".hero__visual .mockup");
  if (painelHero && mockup) {
    painelHero.addEventListener("pointermove", function (e) {
      var r = painelHero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      mockup.style.setProperty("--ry", (x * -8).toFixed(2) + "deg");
      mockup.style.setProperty("--rx", (y * 6).toFixed(2) + "deg");
    });
    painelHero.addEventListener("pointerleave", function () {
      mockup.style.setProperty("--ry", "0deg");
      mockup.style.setProperty("--rx", "0deg");
    });
  }
})();
