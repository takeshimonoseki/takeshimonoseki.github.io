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

  var canvas, ctx, petals = [], nextSpawn = 0, animId, running = false;

  function prefersReducedMotion() {
    try {
      return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) { return false; }
  }

  function createCanvas() {
    var c = document.createElement("canvas");
    c.id = "sakura-canvas";
    document.body.appendChild(c);
    return c;
  }

  function resize() {
    if (!canvas) return;
    var dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    if (ctx) ctx.scale(dpr, dpr);
  }

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function spawnPetal() {
    petals.push({
      x: Math.random() * (window.innerWidth + 40) - 20,
      y: -20,
      size: random(SIZE_MIN, SIZE_MAX),
      opacity: random(OPACITY_MIN, OPACITY_MAX),
      speedY: random(SPEED_Y_MIN, SPEED_Y_MAX),
      driftX: random(DRIFT_X_MIN, DRIFT_X_MAX)
    });
  }

  function tick() {
    if (!canvas || !ctx) return;
    var w = window.innerWidth;
    var h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);

    var now = Date.now();
    if (running && now >= nextSpawn && petals.length < MAX_PETALS) {
      spawnPetal();
      nextSpawn = now + random(SPAWN_MS_MIN, SPAWN_MS_MAX);
    }

    for (var i = petals.length - 1; i >= 0; i--) {
      var p = petals[i];
      p.y += p.speedY * 0.016;
      p.x += p.driftX * 0.016;
      if (p.y > h + 30) {
        petals.splice(i, 1);
        continue;
      }
      ctx.fillStyle = "rgba(255, 182, 193, " + p.opacity + ")";
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size * 0.6, p.size, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    animId = requestAnimationFrame(tick);
  }

  function start() {
    if (prefersReducedMotion()) return;
    canvas = document.getElementById("sakura-canvas") || createCanvas();
    ctx = canvas.getContext("2d");
    resize();
    running = true;
    nextSpawn = Date.now();
    if (!animId) tick();
  }

  function stop() {
    running = false;
  }

  function removeLineUiOnPc() {
    if (window.innerWidth < 1024) return;
    var sel = '#headerLineLink, a[href*="line.me"], a[href^="line:"], [data-line-ui="1"]';
    document.querySelectorAll(sel).forEach(function (el) {
      if (el.tagName && el.tagName.toLowerCase() === "img" && el.getAttribute("data-qr") === "line") return;
      el.remove();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    start();
    removeLineUiOnPc();
    window.addEventListener("resize", function () {
      resize();
      if (window.innerWidth >= 1024) removeLineUiOnPc();
    });
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop();
    else if (!prefersReducedMotion()) start();
  });
})();
