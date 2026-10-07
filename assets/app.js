(function () {
  var INITIAL = 12;
  var grid = document.getElementById("recipe-grid");
  var cards = grid ? Array.prototype.slice.call(grid.querySelectorAll(".recipe")) : [];
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));
  var more = document.getElementById("rx-more");
  var expanded = false;
  var current = "all";

  function render() {
    var shown = 0;
    cards.forEach(function (c) {
      var match = current === "all" || c.dataset.ch === current;
      var visible = match && (current !== "all" || expanded || shown < INITIAL);
      if (visible) shown++;
      c.hidden = !visible;
    });
    if (more) more.parentNode.hidden = current !== "all" || expanded;
    tabs.forEach(function (t) { t.setAttribute("aria-selected", String(t.dataset.ch === current)); });
  }

  function select(ch) { current = ch; render(); }

  tabs.forEach(function (t) {
    t.addEventListener("click", function () { select(t.dataset.ch); });
  });
  if (more) more.addEventListener("click", function () { expanded = true; render(); });

  // Cards de capítulo levam ao explorador já filtrado
  document.querySelectorAll(".chapter").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      select(a.dataset.ch);
      var tab = document.querySelector('.tab[data-ch="' + a.dataset.ch + '"]');
      if (tab) tab.scrollIntoView({ block: "nearest", inline: "center" });
      document.getElementById("receitas").scrollIntoView({ behavior: "smooth" });
    });
  });
  render();

  // Lightbox das páginas
  var lb = document.getElementById("lightbox");
  if (lb && typeof lb.showModal === "function") {
    var lbImg = lb.querySelector("img");
    document.querySelectorAll(".page").forEach(function (f) {
      f.addEventListener("click", function () {
        var img = f.querySelector("img");
        lbImg.src = img.src; lbImg.alt = img.alt;
        lb.showModal();
      });
    });
    lb.addEventListener("click", function () { lb.close(); });
  }

  // CTA fixo no celular: aparece depois do hero, some na oferta
  var sticky = document.getElementById("sticky-cta");
  var hero = document.querySelector(".hero");
  var offer = document.getElementById("oferta");
  if (sticky && "IntersectionObserver" in window) {
    var heroVisible = true, offerVisible = false;
    var update = function () { sticky.classList.toggle("show", !heroVisible && !offerVisible); };
    new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; update(); }).observe(hero);
    new IntersectionObserver(function (e) { offerVisible = e[0].isIntersecting; update(); }).observe(offer);
  }

  // Animação suave de entrada
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".sec-head, .feature, .chapter, .seal-card, .step, .extra, .ba-col, .offer, .guarantee").forEach(function (el) {
      el.classList.add("reveal"); io.observe(el);
    });
  }

  // Pixel / analytics: dispara InitiateCheckout se houver pixel instalado
  document.querySelectorAll("[data-cta]").forEach(function (a) {
    a.addEventListener("click", function () {
      if (a.getAttribute("href").charAt(0) === "#") return;
      if (window.fbq) window.fbq("track", "InitiateCheckout");
      if (window.clarity) window.clarity("event", "clique_comprar");
      if (window.dataLayer) window.dataLayer.push({ event: "begin_checkout", cta: a.dataset.cta });
    });
  });
})();
