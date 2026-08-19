(() => {
  "use strict";

  // Menú mobile
  const toggle = document.querySelector(".nav-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    document.querySelectorAll(".nav-links a").forEach((a) => {
      a.addEventListener("click", () => document.body.classList.remove("nav-open"));
    });
  }

  // Año en footer
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  // Botón flotante de WhatsApp (mismo número real de AgriCheck, sin tracking:
  // este es un sandbox de diseño, no debe enviar eventos a Analytics/GTM de producción).
  const WHATSAPP_URL = "https://wa.me/5492984763055?text=Hola%20AgriCheck!%20Quiero%20hacer%20una%20consulta.";
  if (!document.querySelector(".wa-float")) {
    const link = document.createElement("a");
    link.className = "wa-float";
    link.href = WHATSAPP_URL;
    link.target = "_blank";
    link.rel = "noopener";
    link.setAttribute("aria-label", "Contactar por WhatsApp");
    link.innerHTML = '<svg viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M12 2a9.7 9.7 0 0 0-8.5 14.4L2 22l5.8-1.5A9.7 9.7 0 1 0 12 2zm0 2a7.7 7.7 0 0 1 0 15.4c-1.4 0-2.7-.4-3.9-1l-.3-.2-3.4.9.9-3.3-.2-.3A7.7 7.7 0 0 1 12 4zm4.2 9.6c-.2-.1-1.2-.6-1.4-.7-.2-.1-.4-.1-.6.1-.2.2-.7.7-.8.9-.1.1-.3.2-.5.1-.2-.1-.9-.3-1.7-1.1-.6-.5-1-1.2-1.1-1.4-.1-.2 0-.4.1-.5l.4-.4c.1-.1.2-.3.3-.4.1-.2 0-.3 0-.5 0-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.4-.2.3-1 1-1 2.4 0 1.4 1 2.7 1.2 2.9.1.2 2 3 4.9 4.2.7.3 1.2.4 1.6.5.7.2 1.4.2 1.9.1.6-.1 1.2-.5 1.4-.9.2-.4.2-.8.1-.9 0-.1-.2-.2-.4-.3z"/></svg>';
    document.body.appendChild(link);
  }

  // Hero: video de fondo progresivo. El póster (<img>) ya cubre el LCP; el
  // video no lleva atributo poster para no competir como candidato de LCP,
  // y se pide recién tras "load" para no restar ancho de banda a los
  // recursos críticos de arranque. Respeta prefers-reduced-motion.
  const heroVideo = document.getElementById("heroVideo");
  if (heroVideo) {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const src = heroVideo.getAttribute("data-src");
    if (!prefersReducedMotion && src) {
      const startHeroVideo = () => {
        const source = document.createElement("source");
        source.src = src;
        source.type = "video/mp4";
        heroVideo.appendChild(source);
        heroVideo.addEventListener("canplay", () => heroVideo.classList.add("is-playing"), { once: true });
        heroVideo.setAttribute("autoplay", "");
        heroVideo.load();
        const playPromise = heroVideo.play();
        if (playPromise && typeof playPromise.catch === "function") playPromise.catch(() => {});
      };
      if (document.readyState === "complete") {
        startHeroVideo();
      } else {
        window.addEventListener("load", startHeroVideo, { once: true });
      }
    }
  }

  // Hero: buscador de cultivo/problemática → catálogo (assets/js filtra por ?crop=/?issue=/?q=)
  const heroSearch = document.getElementById("heroSearch");
  if (heroSearch) {
    const stripAccents = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    heroSearch.addEventListener("submit", (e) => {
      e.preventDefault();
      const crop = stripAccents((document.getElementById("cropQuery").value || "").trim().toLowerCase());
      const issue = stripAccents((document.getElementById("issueQuery").value || "").trim().toLowerCase());
      const params = new URLSearchParams();
      const q = [crop, issue].filter(Boolean).join(" ");
      if (q) params.set("q", q);
      window.location.href = params.toString() ? `productos.html?${params.toString()}` : "productos.html";
    });
  }

  // Filtro de catálogo (solo corre si existen los nodos en productos.html)
  const grid = document.getElementById("productGrid");
  if (grid) {
    const search = document.getElementById("searchInput");
    const cropSelect = document.getElementById("cropSelect");
    const issueSelect = document.getElementById("issueSelect");
    const resetBtn = document.getElementById("resetFilters");
    const resultsCount = document.getElementById("resultsCount");
    const emptyState = document.getElementById("emptyState");
    const cards = Array.from(grid.querySelectorAll(".product-card"));

    function applyFilters() {
      const q = (search.value || "").trim().toLowerCase();
      const crop = cropSelect.value;
      const issue = issueSelect.value;
      let visible = 0;

      cards.forEach((card) => {
        const name = (card.dataset.name || "").toLowerCase();
        const crops = (card.dataset.crops || "").split(",");
        const issues = (card.dataset.issues || "").split(",");
        const matchesQuery = !q || name.includes(q) || crops.some((c) => c.includes(q)) || issues.some((i) => i.includes(q));
        const matchesCrop = !crop || crops.includes(crop);
        const matchesIssue = !issue || issues.includes(issue);
        const show = matchesQuery && matchesCrop && matchesIssue;
        card.style.display = show ? "" : "none";
        if (show) visible += 1;
      });

      resultsCount.textContent = `${visible} producto${visible === 1 ? "" : "s"} disponible${visible === 1 ? "" : "s"}`;
      emptyState.classList.toggle("visible", visible === 0);
    }

    [search, cropSelect, issueSelect].forEach((el) => {
      el.addEventListener("input", applyFilters);
      el.addEventListener("change", applyFilters);
    });
    resetBtn.addEventListener("click", () => {
      search.value = "";
      cropSelect.value = "";
      issueSelect.value = "";
      applyFilters();
    });

    // Prefill desde querystring (?crop= / ?issue=) al llegar desde la home
    const params = new URLSearchParams(window.location.search);
    if (params.get("crop")) cropSelect.value = params.get("crop");
    if (params.get("issue")) issueSelect.value = params.get("issue");
    if (params.get("q")) search.value = params.get("q");

    applyFilters();
  }
})();
