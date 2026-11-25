/* ==========================================================================
   Conexão Smart — demonstração não oficial
   Interações: menu, scroll, reveal, parallax, carrossel, formulário → WhatsApp
   ========================================================================== */
(function () {
  "use strict";

  var WA_NUMBER = "5511947325167";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function waLink(message) {
    return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(message);
  }

  function $(selector, scope) { return (scope || document).querySelector(selector); }
  function $$(selector, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(selector)); }

  /* ---------- Ano no rodapé ---------- */
  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Header, progresso de rolagem e botão flutuante ---------- */
  var header = $("#header");
  var progress = $(".scroll-progress");
  var waFloat = $(".wa-float");
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;

    header.classList.toggle("scrolled", y > 12);
    if (progress) progress.style.setProperty("--p", max > 0 ? Math.min(y / max, 1).toFixed(4) : 0);
    if (waFloat) waFloat.classList.toggle("visible", y > 420);
    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  var toggle = $(".menu-toggle");
  var nav = $("#menu");

  function setMenu(open) {
    nav.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  }

  toggle.addEventListener("click", function () {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });
  $$("a", nav).forEach(function (link) {
    link.addEventListener("click", function () { setMenu(false); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setMenu(false);
  });
  window.matchMedia("(min-width: 901px)").addEventListener("change", function (e) {
    if (e.matches) setMenu(false);
  });

  /* ---------- Link ativo conforme a seção ---------- */
  var sectionToLink = {
    inicio: "inicio",
    servicos: "servicos",
    diferenciais: "servicos",
    sobre: "sobre",
    localizacao: "contato",
    contato: "contato"
  };
  var navLinks = $$(".nav-link");

  function setActive(id) {
    navLinks.forEach(function (link) {
      link.classList.toggle("active", link.getAttribute("href") === "#" + id);
    });
  }

  if ("IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && sectionToLink[entry.target.id]) {
          setActive(sectionToLink[entry.target.id]);
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });

    Object.keys(sectionToLink).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) sectionObserver.observe(el);
    });
  }

  /* ---------- Revelar ao entrar na viewport ---------- */
  var revealEls = $$(".reveal");

  function finishReveal(el) {
    // depois da animação, devolve o controle de transição ao próprio elemento (hover etc.)
    var delay = parseInt(el.style.getPropertyValue("--d"), 10) || 0;
    window.setTimeout(function () { el.classList.remove("reveal", "in"); }, 1100 + delay);
  }

  if ("IntersectionObserver" in window && !reduceMotion) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        finishReveal(entry.target);
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Parallax suave no hero (apenas mouse) ---------- */
  var hero = $(".hero");
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (hero && finePointer && !reduceMotion) {
    var parallaxEls = $$("[data-depth]", hero);
    var heroRaf = 0;

    hero.addEventListener("pointermove", function (e) {
      var rect = hero.getBoundingClientRect();
      var nx = (e.clientX - rect.left) / rect.width - 0.5;
      var ny = (e.clientY - rect.top) / rect.height - 0.5;
      if (heroRaf) return;
      heroRaf = window.requestAnimationFrame(function () {
        parallaxEls.forEach(function (el) {
          var d = parseFloat(el.getAttribute("data-depth")) || 1;
          el.style.transform = "translate3d(" + (nx * d * -16).toFixed(1) + "px," + (ny * d * -12).toFixed(1) + "px,0)";
        });
        heroRaf = 0;
      });
    });

    hero.addEventListener("pointerleave", function () {
      parallaxEls.forEach(function (el) { el.style.transform = ""; });
    });
  }

  /* ---------- Holofote nos cards ---------- */
  document.addEventListener("pointermove", function (e) {
    var target = e.target.closest ? e.target.closest(".spot") : null;
    if (!target) return;
    var rect = target.getBoundingClientRect();
    target.style.setProperty("--mx", (e.clientX - rect.left) + "px");
    target.style.setProperty("--my", (e.clientY - rect.top) + "px");
  }, { passive: true });

  /* ---------- Carrossel de serviços ---------- */
  var track = $("#services-track");
  var prevBtn = $('[data-carousel="prev"]');
  var nextBtn = $('[data-carousel="next"]');
  var bar = $(".carousel-progress span");

  function updateCarousel() {
    var max = track.scrollWidth - track.clientWidth;
    var ratio = track.scrollWidth ? track.clientWidth / track.scrollWidth : 1;
    var pos = max > 0 ? track.scrollLeft / max : 0;
    var barWidth = Math.max(ratio, 0.12);

    if (prevBtn) prevBtn.disabled = track.scrollLeft <= 4;
    if (nextBtn) nextBtn.disabled = track.scrollLeft >= max - 4;
    if (bar) {
      var parent = bar.parentElement.clientWidth;
      bar.style.setProperty("--w", (barWidth * 100).toFixed(1) + "%");
      bar.style.setProperty("--x", (pos * (1 - barWidth) * parent).toFixed(1) + "px");
    }
  }

  function scrollCarousel(dir) {
    var card = $(".card", track);
    var step = card ? card.getBoundingClientRect().width + 20 : 360;
    track.scrollBy({ left: dir * step, behavior: reduceMotion ? "auto" : "smooth" });
  }

  if (track) {
    track.addEventListener("scroll", function () { window.requestAnimationFrame(updateCarousel); }, { passive: true });
    window.addEventListener("resize", updateCarousel);
    if (prevBtn) prevBtn.addEventListener("click", function () { scrollCarousel(-1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { scrollCarousel(1); });

    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); scrollCarousel(1); }
      if (e.key === "ArrowLeft") { e.preventDefault(); scrollCarousel(-1); }
    });

    // arrastar com o mouse (toque já rola nativamente)
    var drag = { active: false, moved: false, startX: 0, startLeft: 0 };

    track.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      drag.active = true;
      drag.moved = false;
      drag.startX = e.clientX;
      drag.startLeft = track.scrollLeft;
    });
    window.addEventListener("pointermove", function (e) {
      if (!drag.active) return;
      var dx = e.clientX - drag.startX;
      if (!drag.moved && Math.abs(dx) > 5) {
        drag.moved = true;
        track.classList.add("dragging");
      }
      if (drag.moved) track.scrollLeft = drag.startLeft - dx;
    });
    function endDrag() {
      if (!drag.active) return;
      drag.active = false;
      track.classList.remove("dragging");
    }
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    track.addEventListener("click", function (e) {
      if (drag.moved) {
        e.preventDefault();
        e.stopPropagation();
        drag.moved = false;
      }
    }, true);

    updateCarousel();
    window.addEventListener("load", updateCarousel);
  }

  /* ---------- Links de WhatsApp por serviço ---------- */
  $$("[data-wa-service]").forEach(function (link) {
    var service = link.getAttribute("data-wa-service");
    link.setAttribute("href", waLink("Olá! Gostaria de consultar sobre " + service + " para o meu aparelho. Pode me ajudar?"));
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  });

  /* ---------- Toast ---------- */
  var toast = $("#toast");
  var toastTimer = 0;

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove("show"); }, 2600);
  }

  /* ---------- Copiar endereço ---------- */
  var copyBtn = $("#copy-address");
  if (copyBtn) {
    copyBtn.addEventListener("click", function () {
      var text = "Rua Olímpia, 448, Vila Camilópolis, Santo André - SP, 09230-500";
      var done = function () {
        var label = $("span", copyBtn);
        var original = label.textContent;
        label.textContent = "Copiado!";
        showToast("Endereço copiado");
        window.setTimeout(function () { label.textContent = original; }, 2000);
      };

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, function () { showToast("Não foi possível copiar"); });
      } else {
        var area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.cssText = "position:fixed;opacity:0;pointer-events:none";
        document.body.appendChild(area);
        area.select();
        var ok = false;
        try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
        document.body.removeChild(area);
        if (ok) done(); else showToast("Não foi possível copiar");
      }
    });
  }

  /* ---------- Formulário → WhatsApp ---------- */
  var form = $("#wa-form");
  if (form) {
    var errorBox = $("#form-error");

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var nome = form.elements.nome.value.trim();
      var tipo = form.elements.tipo.value;
      var modelo = form.elements.modelo.value.trim();
      var problema = form.elements.problema.value.trim();

      var nomeField = form.elements.nome.closest(".field");
      var problemaField = form.elements.problema.closest(".field");
      nomeField.classList.toggle("invalid", !nome);
      problemaField.classList.toggle("invalid", !problema);

      if (!nome || !problema) {
        errorBox.hidden = false;
        (!nome ? form.elements.nome : form.elements.problema).focus();
        return;
      }
      errorBox.hidden = true;

      var lines = [
        "Olá! Meu nome é " + nome + ".",
        "Gostaria de solicitar atendimento para o meu " + tipo + (modelo ? " (" + modelo + ")" : "") + ".",
        "",
        "O que está acontecendo: " + problema,
        "",
        "Pode me ajudar?"
      ];

      window.open(waLink(lines.join("\n")), "_blank", "noopener");
    });

    ["nome", "problema"].forEach(function (name) {
      form.elements[name].addEventListener("input", function () {
        this.closest(".field").classList.remove("invalid");
      });
    });
  }
})();
