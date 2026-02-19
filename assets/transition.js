(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;

  function isStartupPage() {
    try {
      return body && body.getAttribute("data-page") === "startup";
    } catch (e) {
      return false;
    }
  }

  function prefersReducedMotion() {
    try {
      return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {
      return false;
    }
  }

  function markEnter() {
    root.classList.add("is-enter");
    root.classList.remove("is-leave");
  }

  function handleReady() {
    if (isStartupPage()) {
      root.classList.remove("is-leave");
      root.classList.add("is-enter");
      return;
    }
    if (prefersReducedMotion()) {
      root.classList.remove("is-leave");
      root.classList.add("is-enter");
      return;
    }
    requestAnimationFrame(function () {
      requestAnimationFrame(markEnter);
    });
  }

  document.addEventListener("DOMContentLoaded", handleReady, { once: true });

  window.addEventListener("pageshow", function (ev) {
    if (ev.persisted) handleReady();
    else root.classList.remove("is-leave");
  });

  function isModifiedClick(e) {
    return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
  }

  function isSamePageAnchorOnly(a) {
    try {
      var url = new URL(a.href, window.location.href);
      return (
        url.origin === location.origin &&
        url.pathname === location.pathname &&
        url.search === location.search &&
        !!url.hash
      );
    } catch (e) {
      return false;
    }
  }

  function isInternal(a) {
    try {
      var url = new URL(a.href, window.location.href);
      return url.origin === window.location.origin;
    } catch (e) {
      return false;
    }
  }

  function shouldHandleLink(a, e) {
    if (!a || !a.href) return false;
    if (a.target && a.target.toLowerCase() === "_blank") return false;
    if (a.hasAttribute("download")) return false;
    if (isModifiedClick(e)) return false;
    if (!isInternal(a)) return false;
    if (isSamePageAnchorOnly(a)) return false;
    return true;
  }

  document.addEventListener(
    "click",
    function (e) {
      var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!a) return;
      if (isStartupPage()) return;
      if (prefersReducedMotion()) return;
      if (!shouldHandleLink(a, e)) return;

      e.preventDefault();

      root.classList.remove("is-enter");
      root.classList.add("is-leave");

      var href = a.href;
      var leaveDur = 240;
      try {
        var cs = getComputedStyle(document.documentElement);
        var v = cs.getPropertyValue("--page-dur-leave");
        if (v) leaveDur = Math.max(220, Math.min(300, parseFloat(v) || 240));
      } catch (e) {}
      setTimeout(function () {
        window.location.href = href;
      }, leaveDur);
    },
    { capture: true }
  );
})();
