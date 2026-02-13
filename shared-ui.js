// shared-ui.js
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { auth, ADMIN_EMAIL } from "./firebase.js";

export function isAdminUser(user) {
  return !!user && (user.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/* ✅ Single source of truth for mobile nav (delegated + capture + idempotent) */
export function initMobileNav() {
  // prevent double-binding across pages/modules
  if (window.__ls_mobile_nav_bound) return;
  window.__ls_mobile_nav_bound = true;

  const isMobile = () => window.matchMedia("(max-width: 860px)").matches;

  const getBtn = () => document.getElementById("navToggle");
  const getMenu = () => document.getElementById("navMenu");

  const setExpanded = (v) => {
    const btn = getBtn();
    if (btn) btn.setAttribute("aria-expanded", v ? "true" : "false");
  };

  const setOpen = (open) => {
    const menu = getMenu();
    if (!menu) return;
    menu.classList.toggle("open", !!open);
    setExpanded(!!open);
  };

  const toggle = () => {
    const menu = getMenu();
    if (!menu) return;
    setOpen(!menu.classList.contains("open"));
  };

  const close = () => setOpen(false);

  // ✅ One capture listener to control everything (prevents open->instant close)
  document.addEventListener(
    "click",
    (e) => {
      const btnClick = e.target.closest("#navToggle");
      const menuClick = e.target.closest("#navMenu");

      // toggle button
      if (btnClick) {
        if (isMobile()) {
          e.preventDefault();
          e.stopPropagation();
          toggle();
        }
        return;
      }

      const menu = getMenu();
      if (!menu || !menu.classList.contains("open")) return;

      // inside menu: close only if a link clicked
      if (menuClick) {
        if (e.target.closest("#navMenu a")) close();
        return;
      }

      // outside click closes
      close();
    },
    true
  );

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  window.addEventListener("resize", () => {
    if (!isMobile()) close();
  });
}

/* ✅ Theme toggle (single source of truth) */
export function initThemeToggle() {
  // prevent double-binding across pages/modules
  if (window.__ls_theme_bound) return;
  window.__ls_theme_bound = true;

  const root = document.documentElement; // <html>
  const btn = document.getElementById("themeToggle");
  const STORAGE_KEY = "ls_theme"; // "light" | "dark" | "system"

  const systemTheme = () =>
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";

  const applyTheme = (mode) => {
    const m = mode === "system" || !mode ? systemTheme() : mode;

    // ✅ CSS reads this
    root.dataset.theme = m;      // html[data-theme="dark"]
    root.style.colorScheme = m;  // inputs/scrollbars consistent

    // optional icon state
    if (btn) {
      btn.setAttribute("aria-label", `Theme: ${m}`);
      btn.classList.toggle("is-dark", m === "dark");
    }
  };

  // initial apply
  const saved = localStorage.getItem(STORAGE_KEY) || "system";
  applyTheme(saved);

  // click toggle (dark <-> light)
  if (btn) {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const current = root.dataset.theme || systemTheme();
      const next = current === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
    });
  }

  // system change support (only if saved is system)
  if (window.matchMedia) {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener?.("change", () => {
      const now = localStorage.getItem(STORAGE_KEY) || "system";
      if (now === "system") applyTheme("system");
    });
  }
}

export function initNavbarAuthUI() {
  const yearEl = document.querySelector("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // active nav highlight
  const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll("[data-page]").forEach((a) => {
    const page = (a.getAttribute("data-page") || "").toLowerCase();
    if (page === current) a.classList.add("active");
  });

  // ✅ mobile nav init ONLY here (no duplicate listeners)
  initMobileNav();

  // ✅ theme init here (so every page gets it)
  initThemeToggle();

  // auth buttons
  const loginLink = document.querySelector("#adminLoginLink");
  const logoutBtn = document.querySelector("#logoutBtn");
  const roleBadge = document.querySelector("#roleBadge");

  onAuthStateChanged(auth, (user) => {
    const admin = isAdminUser(user);

    if (roleBadge) {
      roleBadge.textContent = user ? (admin ? "Admin" : "User") : "";
      roleBadge.style.display = user ? "inline-flex" : "none";
    }

    if (loginLink) loginLink.style.display = user ? "none" : "inline-flex";
    if (logoutBtn) logoutBtn.style.display = user ? "inline-flex" : "none";
  });

  logoutBtn?.addEventListener("click", async () => {
    try {
      await signOut(auth);
      location.replace("index.html");
    } catch (e) {
      alert("Logout failed: " + (e?.message || e));
    }
  });
}

/** ✅ Admin page guard: login+admin না হলে redirect (NO false redirect / NO loop) */
export function requireAdminGuard() {
  return new Promise((resolve) => {
    let redirected = false;

    const u0 = auth.currentUser;
    if (u0 && isAdminUser(u0)) {
      resolve(u0);
      return;
    }

    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();

      if (!user) {
        if (!redirected) {
          redirected = true;
          location.replace("admin-login.html");
        }
        return;
      }

      if (!isAdminUser(user)) {
        if (!redirected) {
          redirected = true;
          location.replace("index.html");
        }
        return;
      }

      resolve(user);
    });
  });
}
