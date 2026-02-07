// vision.js
(() => {
  const $ = (s, p = document) => p.querySelector(s);

  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".nav-link, .menu .btn").forEach(a => {
    const page = (a.getAttribute("data-page") || "").toLowerCase();
    if (page && page === current) a.classList.add("active");
  });

  const navToggle = $("#navToggle");
  const navMenu = $("#navMenu");

  if (navToggle && navMenu) {
    const setExpanded = (v) => navToggle.setAttribute("aria-expanded", v ? "true" : "false");

    const open = () => {
      navMenu.classList.add("open");
      setExpanded(true);
    };

    const close = () => {
      navMenu.classList.remove("open");
      setExpanded(false);
    };

    navToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      navMenu.classList.contains("open") ? close() : open();
    });

    document.addEventListener("click", (e) => {
      if (!navMenu.classList.contains("open")) return;
      if (navMenu.contains(e.target) || navToggle.contains(e.target)) return;
      close();
    });

    navMenu.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (a) close();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) close();
    });
  }
})();
