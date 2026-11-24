/* ==========================================================================
   Sapion Holding — comportamento compartilhado
   - sombra do cabeçalho ao rolar
   - menu hambúrguer (celular/tablet)
   - destaque do item do menu da seção visível (só na home)
   - ano atual no rodapé
   ========================================================================== */
(function () {
  "use strict";

  var cabecalho = document.querySelector(".cabecalho");
  var botao = document.querySelector(".menu-botao");
  var menu = document.getElementById("menu-principal");
  var desktop = window.matchMedia("(min-width: 1200px)");

  /* ---------- Sombra do cabeçalho ---------- */
  function atualizarCabecalho() {
    if (!cabecalho) return;
    cabecalho.classList.toggle("is-rolado", window.scrollY > 8);
  }
  window.addEventListener("scroll", atualizarCabecalho, { passive: true });
  atualizarCabecalho();

  /* ---------- Menu hambúrguer ---------- */
  function abrirMenu(abrir) {
    if (!botao || !menu) return;
    botao.setAttribute("aria-expanded", String(abrir));
    botao.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
    menu.classList.toggle("is-aberto", abrir);
    document.body.classList.toggle("menu-aberto", abrir);
  }

  if (botao && menu) {
    botao.addEventListener("click", function () {
      abrirMenu(botao.getAttribute("aria-expanded") !== "true");
    });

    // Fecha ao escolher um destino
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) abrirMenu(false);
    });

    // Fecha com Esc e devolve o foco ao botão
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-aberto")) {
        abrirMenu(false);
        botao.focus();
      }
    });

    // Se a tela crescer para desktop com o menu aberto, fecha
    desktop.addEventListener("change", function (e) {
      if (e.matches) abrirMenu(false);
    });
  }

  /* ---------- Botão fixo "Agendar apresentação" (celular/tablet, só na home) ----------
     Some enquanto outro "Agendar apresentação" está na tela (hero, fim da Prova
     social, faixas "Parte da plataforma Sapion", Contato e rodapé), para nunca
     aparecerem dois botões iguais. */
  var ctaFixo = document.querySelector("[data-cta-fixo]");
  if (ctaFixo && "IntersectionObserver" in window) {
    var visiveis = [];
    var obsCta = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        var i = visiveis.indexOf(entrada.target);
        if (entrada.isIntersecting && i === -1) visiveis.push(entrada.target);
        if (!entrada.isIntersecting && i !== -1) visiveis.splice(i, 1);
      });
      ctaFixo.classList.toggle("is-oculto", visiveis.length > 0);
    });
    document.querySelectorAll(".hero__acoes, .prova__cta, .plataforma-faixa, #contato, .rodape").forEach(function (alvo) {
      obsCta.observe(alvo);
    });
  } else if (ctaFixo) {
    ctaFixo.classList.remove("is-oculto");
  }

  /* ---------- Faixa de brasões: botão de pausa (também pausa com hover e foco) ---------- */
  var botaoPausa = document.querySelector("[data-faixa-pausa]");
  var faixaLogos = document.querySelector(".faixa-logos");
  if (botaoPausa && faixaLogos) {
    botaoPausa.addEventListener("click", function () {
      var pausada = faixaLogos.classList.toggle("is-pausada");
      botaoPausa.textContent = pausada ? "Retomar rolagem" : "Pausar rolagem";
      botaoPausa.setAttribute("aria-label", pausada ? "Retomar a rolagem dos brasões" : "Pausar a rolagem dos brasões");
    });
  }

  /* ---------- Links que abrem em nova aba avisam quem usa leitor de tela ---------- */
  document.querySelectorAll('a[target="_blank"]').forEach(function (link) {
    var rotulo = link.getAttribute("aria-label");
    if (rotulo) {
      if (rotulo.indexOf("nova aba") === -1) link.setAttribute("aria-label", rotulo + " (abre em nova aba)");
      return;
    }
    if (link.querySelector(".aviso-nova-aba")) return;
    var aviso = document.createElement("span");
    aviso.className = "sr-only aviso-nova-aba";
    aviso.textContent = " (abre em nova aba)";
    link.appendChild(aviso);
  });

  /* ---------- Item ativo do menu (home) ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll('.menu__link[href^="#"]'));
  var alvos = links
    .map(function (link) { return document.getElementById(link.getAttribute("href").slice(1)); })
    .filter(Boolean);

  if ("IntersectionObserver" in window && alvos.length) {
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        var id = entrada.target.id;
        links.forEach(function (link) {
          var ativo = link.getAttribute("href") === "#" + id;
          link.classList.toggle("is-ativo", ativo);
          if (ativo) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    alvos.forEach(function (alvo) { observador.observe(alvo); });

    // Seções sem item no menu (hero, problema, prova social, contato) limpam o destaque
    document.querySelectorAll("main > section[id]").forEach(function (secao) {
      if (alvos.indexOf(secao) === -1) {
        new IntersectionObserver(function (entradas) {
          if (entradas[0].isIntersecting) {
            links.forEach(function (link) {
              link.classList.remove("is-ativo");
              link.removeAttribute("aria-current");
            });
          }
        }, { rootMargin: "-45% 0px -50% 0px" }).observe(secao);
      }
    });
  }

  /* ---------- Abas acessíveis ([data-abas]) ---------- */
  document.querySelectorAll("[data-abas]").forEach(function (grupo) {
    var abas = Array.prototype.slice.call(grupo.querySelectorAll('[role="tab"]'));
    var paineis = abas.map(function (aba) { return document.getElementById(aba.getAttribute("aria-controls")); });
    grupo.classList.add("abas--ativas");

    function selecionar(indice, focar) {
      abas.forEach(function (aba, i) {
        var ativa = i === indice;
        aba.setAttribute("aria-selected", String(ativa));
        aba.tabIndex = ativa ? 0 : -1;
        paineis[i].hidden = !ativa;
      });
      if (focar) abas[indice].focus();
    }

    abas.forEach(function (aba, i) {
      aba.addEventListener("click", function () { selecionar(i, false); });
      aba.addEventListener("keydown", function (e) {
        var alvo = null;
        if (e.key === "ArrowRight") alvo = (i + 1) % abas.length;
        if (e.key === "ArrowLeft") alvo = (i - 1 + abas.length) % abas.length;
        if (e.key === "Home") alvo = 0;
        if (e.key === "End") alvo = abas.length - 1;
        if (alvo !== null) { e.preventDefault(); selecionar(alvo, true); }
      });
    });

    selecionar(0, false);
  });

  /* ---------- Configuração (assets/js/config.js) ---------- */
  var CONFIG = window.SAPION_CONFIG || {};
  var CHAVE_CONSENTIMENTO = "sapion-consentimento-cookies";

  function lerConsentimento() {
    try { return localStorage.getItem(CHAVE_CONSENTIMENTO); } catch (e) { return null; }
  }
  function gravarConsentimento(valor) {
    try { localStorage.setItem(CHAVE_CONSENTIMENTO, valor); } catch (e) { /* navegação privada */ }
  }

  /* ---------- Medição (GA4 e Meta Pixel): só depois do consentimento ---------- */
  var medicaoCarregada = false;
  function carregarMedicao() {
    if (medicaoCarregada) return;
    medicaoCarregada = true;
    if (CONFIG.ga4) {
      var tag = document.createElement("script");
      tag.async = true;
      tag.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(CONFIG.ga4);
      document.head.appendChild(tag);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", CONFIG.ga4);
    }
    if (CONFIG.metaPixel) {
      // Código padrão do Meta Pixel
      (function (f, b, e, v) {
        if (f.fbq) return;
        var n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
        if (!f._fbq) f._fbq = n;
        n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
        var t = b.createElement(e); t.async = true; t.src = v;
        var s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
      })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
      window.fbq("init", CONFIG.metaPixel);
      window.fbq("track", "PageView");
    }
  }

  // Registra um evento de conversão nas ferramentas ativas (nada acontece sem consentimento)
  function registrarEvento(nomeGa, nomeMeta, params) {
    if (window.gtag) window.gtag("event", nomeGa, params || {});
    if (window.fbq && nomeMeta) window.fbq("track", nomeMeta);
  }

  /* ---------- Aviso de cookies (LGPD): só existe quando há medição configurada ---------- */
  var temMedicao = Boolean(CONFIG.ga4 || CONFIG.metaPixel);
  var cssTokens = document.querySelector('link[href$="assets/css/tokens.css"]');
  var prefixo = cssTokens ? cssTokens.getAttribute("href").replace("assets/css/tokens.css", "") : "";

  function mostrarAvisoCookies() {
    if (document.querySelector(".cookies")) return;
    var aviso = document.createElement("div");
    aviso.className = "cookies";
    aviso.setAttribute("role", "dialog");
    aviso.setAttribute("aria-label", "Aviso de cookies");
    aviso.innerHTML =
      "<p>Usamos cookies para medir o uso do site e melhorar sua experiência. Você escolhe se aceita. Saiba mais na <a href=\"" + prefixo + "politica-de-privacidade/\">Política de Privacidade</a>.</p>" +
      "<div class=\"cookies__acoes\"><button type=\"button\" class=\"btn btn--contorno btn--pequeno\" data-cookies=\"recusado\">Recusar</button>" +
      "<button type=\"button\" class=\"btn btn--pequeno\" data-cookies=\"aceito\">Aceitar</button></div>";
    document.body.appendChild(aviso);
    aviso.addEventListener("click", function (e) {
      var botao = e.target.closest("[data-cookies]");
      if (!botao) return;
      var escolha = botao.getAttribute("data-cookies");
      gravarConsentimento(escolha);
      aviso.remove();
      if (escolha === "aceito") carregarMedicao();
    });
  }

  if (temMedicao) {
    var consentimento = lerConsentimento();
    if (consentimento === "aceito") carregarMedicao();
    else if (consentimento !== "recusado") mostrarAvisoCookies();
  }
  document.querySelectorAll("[data-preferencias-cookies]").forEach(function (botao) {
    if (!temMedicao) {
      // Sem medição, não há o que escolher: some o botão e o separador
      var sep = botao.previousSibling;
      if (sep && sep.nodeType === 3) sep.textContent = "";
      botao.hidden = true;
      return;
    }
    botao.addEventListener("click", mostrarAvisoCookies);
  });
  window.SapionCookies = { mostrar: mostrarAvisoCookies }; // útil para testes

  /* ---------- Cliques no WhatsApp contam como conversão ---------- */
  document.addEventListener("click", function (e) {
    var link = e.target.closest('a[href*="wa.me/"]');
    if (link) registrarEvento("contato_whatsapp", "Contact", { link_url: link.href });
  });

  /* ---------- Formulário de contato ([data-form-contato]) ----------
     Valida os campos e envia para CONFIG.formEndpoint (POST em JSON).
     Sem endereço configurado, só valida e mostra a confirmação. */
  var form = document.querySelector("[data-form-contato]");
  if (form) {
    var telefone = form.querySelector('[name="telefone"]');
    var falha = form.querySelector(".formulario__falha");
    var mensagens = {
      nome: "Informe seu nome.",
      cargo: "Selecione seu cargo.",
      rede: "Informe o município ou a rede.",
      email: "Informe um e-mail válido.",
      telefone: "Informe um telefone com DDD.",
      uf: "Selecione a UF.",
      contato: "Informe um e-mail ou um telefone.",
      lgpd: "É preciso autorizar o contato para continuar."
    };
    var email = form.querySelector('[name="email"]');
    var meiosContato = [email, telefone]; // basta um dos dois

    // Máscara simples: (27) 99999-9999
    telefone.addEventListener("input", function () {
      var d = telefone.value.replace(/\D/g, "").slice(0, 11);
      var f = d;
      if (d.length > 2) f = "(" + d.slice(0, 2) + ") " + d.slice(2);
      if (d.length > 7) f = "(" + d.slice(0, 2) + ") " + d.slice(2, d.length - 4) + "-" + d.slice(-4);
      telefone.value = f;
    });

    function marcar(campo, ok, mensagem) {
      var caixa = campo.closest(".campo");
      var erro = caixa && caixa.querySelector(".campo__erro");
      if (caixa) caixa.classList.toggle("is-invalido", !ok);
      campo.setAttribute("aria-invalid", String(!ok));
      if (erro) erro.textContent = ok ? "" : mensagem;
      return ok;
    }

    function validarCampo(campo) {
      var ok = campo.checkValidity();
      if (ok && campo.name === "telefone" && campo.value) ok = campo.value.replace(/\D/g, "").length >= 10;
      return marcar(campo, ok, mensagens[campo.name] || "Verifique este campo.");
    }

    // E-mail e telefone: pelo menos um preenchido; o que estiver preenchido precisa ser válido
    function validarContato() {
      var preenchidos = meiosContato.filter(function (c) { return c.value.trim() !== ""; });
      if (!preenchidos.length) {
        meiosContato.forEach(function (c) { marcar(c, false, mensagens.contato); });
        return false;
      }
      var ok = true;
      meiosContato.forEach(function (c) {
        if (c.value.trim()) { if (!validarCampo(c)) ok = false; }
        else marcar(c, true, "");
      });
      return ok;
    }

    form.querySelectorAll("input, select").forEach(function (campo) {
      campo.addEventListener("blur", function () { if (campo.value || campo.type === "checkbox") validarCampo(campo); });
      campo.addEventListener("change", function () { if (campo.closest(".is-invalido")) validarCampo(campo); });
    });

    // Ao preencher um dos dois, some o aviso "informe um e-mail ou um telefone" do outro
    meiosContato.forEach(function (campo) {
      campo.addEventListener("input", function () {
        if (!campo.value.trim()) return;
        meiosContato.forEach(function (c) {
          var erro = c.closest(".campo").querySelector(".campo__erro");
          if (!c.value.trim() || erro.textContent === mensagens.contato) marcar(c, true, "");
        });
      });
    });

    function enviarContato(dados) {
      if (!CONFIG.formEndpoint) return Promise.resolve(dados);
      return fetch(CONFIG.formEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(dados)
      }).then(function (resposta) {
        if (!resposta.ok) throw new Error("Falha no envio: " + resposta.status);
        return dados;
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (falha) falha.hidden = true;
      var campos = Array.prototype.slice.call(form.querySelectorAll("input[required], select[required]"));
      campos.forEach(validarCampo);
      validarContato();
      var primeiroInvalido = form.querySelector(".is-invalido input, .is-invalido select");
      if (primeiroInvalido) { primeiroInvalido.focus(); return; }

      var botao = form.querySelector('[type="submit"]');
      var textoBotao = botao.textContent;
      botao.disabled = true;
      botao.textContent = "Enviando…";

      var dados = Object.fromEntries(new FormData(form));
      dados.lgpd = form.lgpd.checked ? "sim" : "não";
      dados.origem = location.href;
      dados.enviado_em = new Date().toISOString();

      enviarContato(dados).then(function () {
        registrarEvento("generate_lead", "Lead", { cargo: dados.cargo, uf: dados.uf });
        form.hidden = true;
        var sucesso = form.parentElement.querySelector(".formulario__sucesso");
        sucesso.hidden = false;
        sucesso.setAttribute("tabindex", "-1");
        sucesso.focus();
      }).catch(function () {
        botao.disabled = false;
        botao.textContent = textoBotao;
        if (falha) falha.hidden = false;
      });
    });
  }

  /* ---------- Ano no rodapé ---------- */
  document.querySelectorAll("[data-ano]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
