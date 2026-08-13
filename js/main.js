(function () {
  var EASE = [0.25, 0.46, 0.45, 0.94];
  var HEADER_OFFSET = 84;
  var SCROLL_MS = 800;

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function easeOutQuad(t) {
    return t * (2 - t);
  }

  function cubicBezierAt(t, p) {
    // Approximate the Xela ease for custom scroll
    return easeOutQuad(t);
  }

  function smoothScrollTo(targetY) {
    if (prefersReducedMotion()) {
      window.scrollTo(0, targetY);
      return;
    }

    var startY = window.pageYOffset;
    var distance = targetY - startY;
    var start = performance.now();

    function step(now) {
      var t = Math.min(1, (now - start) / SCROLL_MS);
      window.scrollTo(0, startY + distance * cubicBezierAt(t, EASE));
      if (t < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function headerHeight() {
    var header = document.querySelector(".header");
    return header ? header.getBoundingClientRect().height : HEADER_OFFSET;
  }

  document.addEventListener("click", function (event) {
    var link = event.target.closest('a[href^="#"]');
    if (!link) return;

    var id = link.getAttribute("href");
    if (!id || id === "#") return;

    var target = document.querySelector(id);
    if (!target) return;

    event.preventDefault();
    var top = target.getBoundingClientRect().top + window.pageYOffset - headerHeight() - 8;
    smoothScrollTo(Math.max(0, top));
    document.body.classList.remove("nav-open");
  });

  var header = document.querySelector(".header");
  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var toggle = document.querySelector(".menu-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  document.querySelectorAll(".nav a").forEach(function (link) {
    link.addEventListener("click", function () {
      document.body.classList.remove("nav-open");
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    });
  });

  if (!prefersReducedMotion() && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.35, rootMargin: "0px 0px -8% 0px" }
    );

    document.querySelectorAll("[data-anim]").forEach(function (el) {
      observer.observe(el);
    });
  } else {
    document.querySelectorAll("[data-anim]").forEach(function (el) {
      el.classList.add("is-in");
    });
  }

  var form = document.querySelector("#contact-form");
  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var data = new FormData(form);
      var name = (data.get("nom") || "").toString().trim();
      var company = (data.get("entreprise") || "").toString().trim();
      var phone = (data.get("telephone") || "").toString().trim();
      var email = (data.get("courriel") || "").toString().trim();
      var service = (data.get("service") || "").toString().trim();
      var message = (data.get("message") || "").toString().trim();

      if (!name || !phone || !email) {
        var status = form.querySelector(".form__status");
        if (status) {
          status.textContent = "Veuillez remplir le nom, le téléphone et le courriel.";
          status.classList.add("is-visible");
        }
        return;
      }

      var body = [
        "Nom : " + name,
        "Entreprise : " + company,
        "Téléphone : " + phone,
        "Courriel : " + email,
        "Service : " + service,
        "",
        message
      ].join("\n");

      var mailto =
        "mailto:jpsa.jpsa@outlook.com" +
        "?subject=" +
        encodeURIComponent("Demande JPSA — " + (service || "site web")) +
        "&body=" +
        encodeURIComponent(body);

      window.location.href = mailto;
      window.setTimeout(function () {
        window.location.href = "merci.html";
      }, 500);
    });
  }
})();
