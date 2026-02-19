(function () {
  "use strict";

  var MAX_PETALS = 10;
  var SPAWN_MS_MIN = 900;
  var SPAWN_MS_MAX = 1400;
  var OPACITY_MIN = 0.12;
  var OPACITY_MAX = 0.28;
  var SIZE_MIN = 6;
  var SIZE_MAX = 14;
  var SPEED_Y_MIN = 10;
  var SPEED_Y_MAX = 30;
  var DRIFT_X_MIN = -8;
  var DRIFT_X_MAX = 8;

  var canvas, ctx, petals = [], nextSpawn = 0, rafId, running = false;

  function reduceMotion() {
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) { return false; }
  }

  function spawnOne() {
    if (petals.length >= MAX_PETALS) return;
    var w = canvas.width;
    petals.push({
      x: Math.random() * w,
      y: -SIZE_MAX - 5,
      size: SIZE_MIN + Math.random() * (SIZE_MAX - SIZE_MIN),
      opacity: OPACITY_MIN + Math.random() * (OPACITY_MAX - OPACITY_MIN),
      speedY: SPEED_Y_MIN + Math.random() * (SPEED_Y_MAX - SPEED_Y_MIN),
      driftX: DRIFT_X_MIN + Math.random() * (DRIFT_X_MAX - DRIFT_X_MIN)
    });
  }

  function tick(t) {
    if (!running || !ctx || !canvas) return;
    var dt = 0.016;
    if (t && typeof t === "number" && lastT) dt = Math.min(0.1, (t - lastT) / 1000);
    lastT = t;

    if (t >= nextSpawn) {
      spawnOne();
      nextSpawn = t + (SPAWN_MS_MIN + Math.random() * (SPAWN_MS_MAX - SPAWN_MS_MIN)) / 1000;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var i = petals.length;
    while (i--) {
      var p = petals[i];
      p.y += p.speedY * dt;
      p.x += p.driftX * dt;
      if (p.y > canvas.height + p.size) {
        petals.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = "#ffb7c5";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size * 0.6, p.size, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    rafId = requestAnimationFrame(tick);
  }
  var lastT = 0;

  function start() {
    if (reduceMotion() || !canvas || !ctx) return;
    running = true;
    nextSpawn = 0;
    lastT = performance.now();
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function resize() {
    if (!canvas) return;
    var dpr = window.devicePixelRatio || 1;
    var w = window.innerWidth;
    var h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function init() {
    if (document.getElementById("sakura-canvas")) return;
    canvas = document.createElement("canvas");
    canvas.id = "sakura-canvas";
    canvas.setAttribute("aria-hidden", "true");
    document.body.insertBefore(canvas, document.body.firstChild);
    ctx = canvas.getContext("2d");
    resize();
    if (!reduceMotion()) start();

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else if (!reduceMotion()) start();
    });

    if (window.innerWidth >= 1024) {
      var lineUis = document.querySelectorAll("#headerLineLink, a[href*=\"line.me\"], a[href^=\"line:\"], [data-line-ui=\"1\"]");
      for (var i = 0; i < lineUis.length; i++) {
        var el = lineUis[i];
        if (el.getAttribute && el.getAttribute("data-qr") === "line") continue;
        if (el.querySelector && el.querySelector("img[data-qr=\"line\"]")) continue;
        try { el.remove(); } catch (e) {}
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
