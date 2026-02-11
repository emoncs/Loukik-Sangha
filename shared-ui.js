import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { auth, ADMIN_EMAIL } from "./firebase.js";

export function isAdminUser(user) {
  return !!user && (user.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export function initMobileNav() {
  if (window.__ls_mobile_nav_bound) return;
  window.__ls_mobile_nav_bound = true;

  const isMobile = () => {
    try { return window.matchMedia("(max-width: 860px)").matches; }
    catch { return window.innerWidth <= 860; }
  };

  const getBtn = () => document.getElementById("navToggle");
  const getMenu = () => document.getElementById("navMenu");

  const setExpanded = (v) => {
    const btn = getBtn();
    if (btn) btn.setAttribute("aria-expanded", v ? "true" : "false");
  };

  const open = () => {
    const menu = getMenu();
    if (!menu) return;
    menu.classList.add("open");
    setExpanded(true);
  };

  const close = () => {
    const menu = getMenu();
    if (!menu) return;
    menu.classList.remove("open");
    setExpanded(false);
  };

  const toggle = () => {
    const menu = getMenu();
    if (!menu) return;
    menu.classList.contains("open") ? close() : open();
  };

  // ✅ 1) Toggle button (capture) — reliable
  document.addEventListener("click", (e) => {
    const btnClick = e.target.closest("#navToggle");
    if (!btnClick) return;
    if (!isMobile()) return;

    e.preventDefault();
    e.stopPropagation();
    toggle();
  }, true);

  // ✅ 2) Close rules: link click, outside click (capture)
  document.addEventListener("click", (e) => {
    const menu = getMenu();
    if (!menu || !menu.classList.contains("open")) return;
    if (!isMobile()) return;

    const clickedToggle = e.target.closest("#navToggle");
    if (clickedToggle) return;

    const insideMenu = e.target.closest("#navMenu");
    if (insideMenu) {
      // close only when a link is clicked
      if (e.target.closest("#navMenu a")) close();
      return;
    }

    // outside click closes
    close();
  }, true);

  // ✅ ESC closes
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });

  // ✅ Resize to desktop closes
  window.addEventListener("resize", () => {
    if (!isMobile()) close();
  });
}

export function initNavbarAuthUI() {
  const yearEl = document.querySelector("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll("[data-page]").forEach((a) => {
    const page = (a.getAttribute("data-page") || "").toLowerCase();
    if (page === current) a.classList.add("active");
  });

  initMobileNav();

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
