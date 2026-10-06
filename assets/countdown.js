// Contagem regressiva até a data real de fim da oferta (data-deadline no <body>, ISO 8601).
// Quando a data passa, os cronômetros param em zero e a página ganha a classe "offer-ended".
(function () {
  var end = Date.parse(document.body.dataset.deadline || "");
  if (isNaN(end)) return;
  var timers = Array.prototype.slice.call(document.querySelectorAll("[data-timer]"));
  var pad = function (n) { return (n < 10 ? "0" : "") + n; };
  function tick() {
    var left = Math.max(0, end - Date.now());
    var s = Math.floor(left / 1000), d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60;
    timers.forEach(function (t) {
      var hasDays = t.querySelector("[data-d]");
      if (hasDays) hasDays.textContent = pad(d);
      t.querySelector("[data-h]").textContent = pad(hasDays ? h : h + d * 24);
      t.querySelector("[data-m]").textContent = pad(m);
      t.querySelector("[data-s]").textContent = pad(s % 60);
    });
    if (!left) { document.body.classList.add("offer-ended"); return; }
    setTimeout(tick, 1000 - (Date.now() % 1000));
  }
  tick();
})();
