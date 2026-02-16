/**
 * 桜花びら風の軽量アニメーション（画像不要）
 * prefers-reduced-motion: reduce の場合は完全停止
 * 同時表示 12〜20 枚、transform/opacity のみ使用、pointer-events: none
 */
(function () {
  "use strict";
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var MAX_PETALS = 18;
  var container = null;
  var petals = [];
  var rafId = null;

  function createPetal() {
    var el = document.createElement("div");
    el.setAttribute("aria-hidden", "true");
    el.style.cssText =
      "position:fixed;top:0;left:0;width:10px;height:10px;border-radius:50%;" +
      "background:radial-gradient(circle, rgba(255,182,193,.85) 0%, rgba(255,200,210,.5) 50%, transparent 70%);" +
      "pointer-events:none;z-index:0;will-change:transform,opacity;";
    return el;
  }

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function reset(p) {
    p.x = random(0, typeof document.documentElement !== "undefined" ? document.documentElement.clientWidth : 320);
    p.y = -20;
    p.vy = random(0.15, 0.45);
    p.vx = random(-0.08, 0.08);
    p.angle = random(0, 360);
    p.va = random(-0.3, 0.3);
    p.size = random(8, 14);
    p.opacity = random(0.4, 0.85);
    p.el.style.width = p.size + "px";
    p.el.style.height = p.size + "px";
    p.el.style.transform = "translate(" + p.x + "px," + p.y + "px) rotate(" + p.angle + "deg)";
    p.el.style.opacity = p.opacity;
  }

  function animate() {
    var w = document.documentElement ? document.documentElement.clientWidth : 320;
    var h = document.documentElement ? document.documentElement.clientHeight : 480;
    petals.forEach(function (p) {
      p.y += p.vy;
      p.x += p.vx;
      p.angle += p.va;
      p.el.style.transform = "translate(" + p.x + "px," + p.y + "px) rotate(" + p.angle + "deg)";
      if (p.y > h + 30 || p.x < -50 || p.x > w + 50) reset(p);
    });
    rafId = requestAnimationFrame(animate);
  }

  function start() {
    if (container) return;
    container = document.createElement("div");
    container.setAttribute("aria-hidden", "true");
    container.id = "sakura-container";
    container.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;";
    document.body.appendChild(container);

    for (var i = 0; i < MAX_PETALS; i++) {
      var el = createPetal();
      container.appendChild(el);
      var p = { el: el, x: 0, y: 0, vx: 0, vy: 0.3, angle: 0, va: 0, size: 10, opacity: 0.6 };
      reset(p);
      petals.push(p);
    }
    rafId = requestAnimationFrame(animate);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
