/* nav.js — Universal Navbar Controller (All Pages)
   ✅ Mobile + Desktop
   ✅ No blur/backdrop
   ✅ Theme toggle + icon sync (localStorage)
   ✅ Active nav highlight
   ✅ Idempotent (no double-binding)
*/

(() => {
  const $ = (s, p = document) => p.querySelector(s);

  const isMobile = () => window.matchMedia("(max-width: 860px)").matches;

  /* =========================
     Theme
  ========================= */
  function initTheme() {
    const root = document.documentElement;
    const btn = $("#themeToggle");
    const icon = $("#themeIcon");

    if (!btn) return;

    if (btn.dataset.boundTheme === "1") return;
    btn.dataset.boundTheme = "1";

    const KEY = "ls_theme"; // "dark" | "light"

    const apply = (mode) => {
      const m = mode === "dark" ? "dark" : "light";
      root.setAttribute("data-theme", m);

      try { localStorage.setItem(KEY, m); } catch {}

      if (icon) {
        // ✅ dark হলে sun দেখাবে, light হলে moon
        icon.className = m === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
      }
      btn.setAttribute("aria-pressed", m === "dark" ? "true" : "false");
    };

    const getInitial = () => {
      try {
        const saved = localStorage.getItem(KEY);
        if (saved === "dark" || saved === "light") return saved;
      } catch {}

      try {
        const prefersDark =
          window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        return prefersDark ? "dark" : "light";
      } catch {
        return "light";
      }
    };

    apply(getInitial());

    btn.addEventListener("click", () => {
      const cur = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
      apply(cur === "dark" ? "light" : "dark");
    });
  }

  /* =========================
     Active Nav Highlight
  ========================= */
  function initActiveNav() {
    const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    document.querySelectorAll("[data-page]").forEach((a) => {
      const page = (a.getAttribute("data-page") || "").toLowerCase();
      if (page === current) a.classList.add("active");
      else a.classList.remove("active");
    });
  }

  /* =========================
     Mobile Nav + Dropdown
  ========================= */
  function initNav() {
    const navToggle = $("#navToggle");
    const navMenu = $("#navMenu");

    const dd = $("#moreDD") || $(".nav-dd");
    const ddBtn = $("#moreBtn") || dd?.querySelector(".nav-dd-btn");

    if (!navToggle || !navMenu) return;

    // prevent double-binding
    if (navToggle.dataset.boundNav === "1") return;
    navToggle.dataset.boundNav = "1";

    const setExpanded = (open) => navToggle.setAttribute("aria-expanded", open ? "true" : "false");

    const closeDropdown = () => {
      dd?.classList.remove("is-open");
      ddBtn?.setAttribute("aria-expanded", "false");
    };

    const openMenu = () => {
      navMenu.classList.add("open");
      setExpanded(true);
      // ✅ only scroll lock on mobile
      if (isMobile()) document.body.style.overflow = "hidden";
    };

    const closeMenu = () => {
      navMenu.classList.remove("open");
      setExpanded(false);
      closeDropdown();
      document.body.style.overflow = "";
    };

    const toggleMenu = () => {
      const open = navMenu.classList.contains("open");
      if (open) closeMenu();
      else openMenu();
    };

    // Hamburger click
    navToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleMenu();
    });

    // Dropdown click toggle (mobile only)
    ddBtn?.addEventListener("click", (e) => {
      if (!isMobile()) return; // desktop: hover/focus handles
      e.preventDefault();
      e.stopPropagation();
      const open = dd.classList.toggle("is-open");
      ddBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });

    // Click outside closes (only if menu open)
    document.addEventListener("click", (e) => {
      if (!navMenu.classList.contains("open")) return;

      const insideMenu = e.target.closest("#navMenu");
      const insideToggle = e.target.closest("#navToggle");

      if (!insideMenu && !insideToggle) closeMenu();
    });

    // Click link closes (mobile)
    navMenu.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      if (isMobile()) closeMenu();
    });

    // ESC closes
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });

    // Resize: close when switching to desktop
    window.addEventListener("resize", () => {
      if (!isMobile()) {
        // reset
        document.body.style.overflow = "";
        navMenu.classList.remove("open");
        setExpanded(false);
        closeDropdown();
      }
    });
  }

  /* =========================
     Footer Year
  ========================= */
  function initYear() {
    const y = document.getElementById("year");
    if (y) y.textContent = new Date().getFullYear();
  }

  function boot() {
    initTheme();
    initActiveNav();
    initNav();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
