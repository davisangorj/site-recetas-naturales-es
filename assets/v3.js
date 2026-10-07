// v3: janela do bônus por visitante + pop-up de compra.
// A janela começa na primeira visita (guardada no navegador) e NÃO reinicia ao recarregar.
// Quando acaba, o bônus sai da página de verdade (body.bonus-expired esconde tudo que é .bonus-only).
(function () {
  var mode = document.body.dataset.mode || "main";
  document.body.classList.add("mode-" + mode);
  // main: janela de 45 min. ext (/livro/): extensão única de N horas; quando acaba, fica só o livro.
  var KEY = mode === "ext" ? "bonus_ext_v3" : "bonus_deadline_v3";
  var span = mode === "ext" ? Number(document.body.dataset.extHours || 24) * 3600000
                            : Number(document.body.dataset.bonusMinutes || 45) * 60000;
  var store = { get: function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
                set: function (v) { try { localStorage.setItem(KEY, v); } catch (e) {} } };
  var end = Number(store.get());
  if (!end) { end = Date.now() + span; store.set(String(end)); }

  var timers = Array.prototype.slice.call(document.querySelectorAll("[data-timer]"));
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  function tick() {
    var left = Math.max(0, end - Date.now()), s = Math.floor(left / 1000);
    timers.forEach(function (t) {
      var h = t.querySelector("[data-h]");
      if (h && mode === "ext") { h.textContent = pad(Math.floor(s / 3600)); t.querySelector("[data-m]").textContent = pad(Math.floor(s / 60) % 60); }
      else t.querySelector("[data-m]").textContent = pad(Math.floor(s / 60));
      t.querySelector("[data-s]").textContent = pad(s % 60);
    });
    if (!left) {
      document.body.classList.add("bonus-expired");
      // sem o bônus, a oferta muda: leva para a página só do livro (se configurada)
      var url = document.body.dataset.expiredUrl;
      if (url && mode === "main") location.replace(url);
      return;
    }
    setTimeout(tick, 1000 - (Date.now() % 1000));
  }
  tick();

  // Pop-up: aparece uma vez por visita — ao tentar sair (computador), depois de 35 s ou ao rolar 60% da página.
  var pop = document.getElementById("popup");
  if (!pop) return;
  var shown = false;
  try { shown = sessionStorage.getItem("popup_v3") === "1"; } catch (e) {}
  function open() {
    if (shown) return; shown = true;
    try { sessionStorage.setItem("popup_v3", "1"); } catch (e) {}
    pop.hidden = false; document.body.classList.add("popup-open");
    var b = pop.querySelector(".btn"); if (b) b.focus();
  }
  function close() { pop.hidden = true; document.body.classList.remove("popup-open"); }
  pop.querySelector(".popup-close").addEventListener("click", close);
  pop.querySelector(".pop-no").addEventListener("click", close);
  pop.addEventListener("click", function (e) { if (e.target === pop) close(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  document.addEventListener("mouseout", function (e) { if (!e.relatedTarget && e.clientY < 10) open(); });
  setTimeout(open, 35000);
  window.addEventListener("scroll", function () {
    var h = document.documentElement;
    if ((h.scrollTop + h.clientHeight) / h.scrollHeight > 0.6) open();
  }, { passive: true });
})();
