(function () {
  function setup(root) {
    var track = root.querySelector(".carousel-track");
    var slides = Array.prototype.slice.call(root.querySelectorAll(".carousel-slide"));
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    var dots = Array.prototype.slice.call(root.querySelectorAll(".carousel-dots button"));
    var prev = root.querySelector(".carousel-prev");
    var next = root.querySelector(".carousel-next");
    if (!track || !slides.length) return;
    var i = 0;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var scrolling = false;

    function sync() {
      tabs.forEach(function (t, k) {
        t.setAttribute("aria-selected", k === i ? "true" : "false");
        t.tabIndex = k === i ? 0 : -1;
      });
      dots.forEach(function (d, k) {
        if (k === i) d.setAttribute("aria-current", "true");
        else d.removeAttribute("aria-current");
      });
      slides.forEach(function (s, k) {
        s.setAttribute("aria-hidden", k === i ? "false" : "true");
      });
    }

    function go(n, opts) {
      opts = opts || {};
      i = ((n % slides.length) + slides.length) % slides.length;
      var left = slides[i].offsetLeft;
      var instant = reduce || opts.instant;
      scrolling = true;
      track.style.scrollSnapType = "none";
      if (instant || typeof track.scrollTo !== "function") {
        track.scrollLeft = left;
        track.style.scrollSnapType = "";
        scrolling = false;
      } else {
        track.scrollTo({ left: left, behavior: "smooth" });
        var done = function () {
          track.removeEventListener("scrollend", done);
          track.style.scrollSnapType = "";
          scrolling = false;
        };
        track.addEventListener("scrollend", done);
        setTimeout(done, 500);
      }
      sync();
      if (opts.focus && tabs[i]) tabs[i].focus();
    }

    var ready = false;
    var io = new IntersectionObserver(function (ents) {
      if (scrolling || !ready) return;
      var best = -1, bestR = 0.6;
      ents.forEach(function (e) {
        if (!e.isIntersecting) return;
        var n = slides.indexOf(e.target);
        if (n < 0) return;
        // Only trust a slide that's actually under the current scroll position
        if (Math.abs(track.scrollLeft - slides[n].offsetLeft) > track.clientWidth * 0.35) return;
        if (e.intersectionRatio > bestR) { bestR = e.intersectionRatio; best = n; }
      });
      if (best >= 0 && best !== i) { i = best; sync(); }
    }, { root: track, threshold: [0.6, 0.75, 1] });
    slides.forEach(function (s) { io.observe(s); });

    tabs.forEach(function (t, k) { t.addEventListener("click", function () { go(k); }); });
    dots.forEach(function (d, k) { d.addEventListener("click", function () { go(k); }); });
    if (prev) prev.addEventListener("click", function () { go(i - 1); });
    if (next) next.addEventListener("click", function () { go(i + 1); });

    root.addEventListener("keydown", function (e) {
      var keys = { ArrowLeft: -1, ArrowRight: 1, Home: "home", End: "end" };
      if (!(e.key in keys)) return;
      if (!root.contains(document.activeElement)) return;
      e.preventDefault();
      if (e.key === "Home") go(0, { focus: true });
      else if (e.key === "End") go(slides.length - 1, { focus: true });
      else go(i + keys[e.key], { focus: true });
    });

    sync();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        go(0, { instant: true });
        ready = true;
      });
    });
    return { go: go, get index() { return i; } };
  }

  document.querySelectorAll("[data-carousel]").forEach(setup);
})();
