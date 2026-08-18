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
      var isEn = (document.documentElement.lang || "").toLowerCase().indexOf("en") === 0;
      var name = (data.get("nom") || data.get("name") || "").toString().trim();
      var company = (data.get("entreprise") || data.get("company") || "").toString().trim();
      var phone = (data.get("telephone") || data.get("phone") || "").toString().trim();
      var email = (data.get("courriel") || data.get("email") || "").toString().trim();
      var service = (data.get("service") || "").toString().trim();
      var message = (data.get("message") || "").toString().trim();

      if (!name || !phone || !email) {
        var status = form.querySelector(".form__status");
        if (status) {
          status.textContent = isEn
            ? "Please fill in your name, phone number and email."
            : "Veuillez remplir le nom, le téléphone et le courriel.";
          status.classList.add("is-visible");
        }
        return;
      }

      var body = isEn
        ? [
            "Name: " + name,
            "Company: " + company,
            "Phone: " + phone,
            "Email: " + email,
            "Service: " + service,
            "",
            message
          ].join("\n")
        : [
            "Nom : " + name,
            "Entreprise : " + company,
            "Téléphone : " + phone,
            "Courriel : " + email,
            "Service : " + service,
            "",
            message
          ].join("\n");

      var mailto =
        "mailto:jean-pascal@jpsa.ca" +
        "?subject=" +
        encodeURIComponent((isEn ? "JPSA request: " : "Demande JPSA : ") + (service || (isEn ? "website" : "site web"))) +
        "&body=" +
        encodeURIComponent(body);

      window.location.href = mailto;
      window.setTimeout(function () {
        window.location.href = form.getAttribute("data-thanks") || (isEn ? "thank-you.html" : "merci.html");
      }, 500);
    });
  }

  var CONSENT_KEY = "jpsa-consent-v1";

  function isEnglish() {
    return (document.documentElement.lang || "").toLowerCase().indexOf("en") === 0;
  }

  function privacyHref() {
    var path = (location.pathname || "").replace(/\\/g, "/");
    var inEn = path.indexOf("/en/") !== -1 || /\/en\/?$/.test(path);
    return inEn ? "privacy.html#cookies" : "confidentialite.html#temoins";
  }

  function readConsent() {
    try {
      var raw = window.localStorage.getItem(CONSENT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function writeConsent(optional) {
    var payload = { optional: !!optional, ts: Date.now() };
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify(payload));
    } catch (err) {
      /* private mode */
    }
    document.dispatchEvent(new CustomEvent("jpsa:consent", { detail: payload }));
  }

  function hideConsent(banner) {
    if (!banner) return;
    banner.setAttribute("hidden", "");
  }

  function showConsent(banner) {
    if (!banner) return;
    banner.removeAttribute("hidden");
  }

  function buildConsent() {
    var en = isEnglish();
    var banner = document.createElement("div");
    banner.className = "consent";
    banner.setAttribute("hidden", "");
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-modal", "false");
    banner.setAttribute("aria-labelledby", "consent-title");
    banner.setAttribute("aria-describedby", "consent-text");
    banner.innerHTML =
      '<p class="consent__kicker" id="consent-title">' +
      (en ? "Cookies" : "Témoins") +
      "</p>" +
      '<p class="consent__text" id="consent-text">' +
      (en
        ? "This site stores your cookie choice. No advertising, no profiling. See the privacy policy for details."
        : "Ce site mémorise votre choix de témoins. Aucune publicité, aucun profilage. Détails dans la politique de confidentialité.") +
      "</p>" +
      '<div class="consent__actions">' +
      '<a class="consent__policy" href="' +
      privacyHref() +
      '">' +
      (en ? "Privacy policy" : "Politique de confidentialité") +
      "</a>" +
      '<button class="btn btn--ghost" type="button" data-consent="refuse">' +
      (en ? "Refuse" : "Refuser") +
      "</button>" +
      '<button class="btn btn--solid" type="button" data-consent="accept">' +
      (en ? "Accept" : "Accepter") +
      "</button>" +
      "</div>";

    banner.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-consent]");
      if (!btn) return;
      writeConsent(btn.getAttribute("data-consent") === "accept");
      hideConsent(banner);
    });

    document.body.appendChild(banner);

    var footerBottom = document.querySelector(".footer__bottom");
    if (footerBottom) {
      var manage = document.createElement("button");
      manage.type = "button";
      manage.className = "consent__manage";
      manage.textContent = en ? "Manage cookies" : "Gérer les témoins";
      manage.addEventListener("click", function () {
        showConsent(banner);
        banner.querySelector("[data-consent='accept']").focus();
      });
      footerBottom.appendChild(manage);
    }

    if (!readConsent()) {
      showConsent(banner);
    } else {
      hideConsent(banner);
    }
  }

  buildConsent();
})();
