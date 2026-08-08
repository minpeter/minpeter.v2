(function () {
  var el = document.getElementById("deferred-fonts");
  if (!el) {
    return;
  }
  var promote = function () {
    el.rel = "stylesheet";
  };
  // afterInteractive may run after preload already finished
  if (el.sheet) {
    promote();
    return;
  }
  el.addEventListener("load", promote);
})();
