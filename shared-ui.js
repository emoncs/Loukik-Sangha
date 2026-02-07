import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { auth, ADMIN_EMAIL } from "./firebase.js";

export function isAdminUser(user) {
  return !!user && (user.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export function initNavbarAuthUI() {
  const yearEl = document.querySelector("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // active nav highlight
  const current = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll("[data-page]").forEach(a => {
    const page = (a.getAttribute("data-page") || "").toLowerCase();
    if (page === current) a.classList.add("active");
  });

  // mobile nav
  const navToggle = document.querySelector("#navToggle");
  const navMenu = document.querySelector("#navMenu");
  if (navToggle && navMenu) {
    const close = () => {
      navMenu.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    };
    navToggle.addEventListener("click", () => {
      const open = !navMenu.classList.contains("open");
      navMenu.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("click", (e) => {
      if (!navMenu.classList.contains("open")) return;
      if (navMenu.contains(e.target) || navToggle.contains(e.target)) return;
      close();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) close();
    });
  }

  // auth buttons
  const loginLink = document.querySelector("#adminLoginLink");
  const logoutBtn = document.querySelector("#logoutBtn");
  const roleBadge = document.querySelector("#roleBadge");

  // ✅ Make sure UI updates are stable across page navigation
  onAuthStateChanged(auth, (user) => {
    const admin = isAdminUser(user);
window.__authUser = user;
console.log("AUTH STATE:", user?.email || null);

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

    // ✅ If already available, don't wait (prevents flicker/false redirect)
    const u0 = auth.currentUser;
    if (u0 && isAdminUser(u0)) {
      resolve(u0);
      return;
    }

    const unsub = onAuthStateChanged(auth, (user) => {
      // ✅ run once then stop listening to avoid duplicate triggers
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
// shared-ui.js
export function initMobileNav() {
  const navToggle = document.querySelector("#navToggle");
  const navMenu = document.querySelector("#navMenu");
  if (!navToggle || !navMenu) return;

  const setExpanded = (v) => navToggle.setAttribute("aria-expanded", v ? "true" : "false");

  const open = () => {
    navMenu.classList.add("open");
    setExpanded(true);
  };

  const close = () => {
    navMenu.classList.remove("open");
    setExpanded(false);
  };

  const toggle = () => {
    navMenu.classList.contains("open") ? close() : open();
  };

  // IMPORTANT: click handler
  navToggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  });

  // close on outside click
  document.addEventListener("click", (e) => {
    if (!navMenu.classList.contains("open")) return;
    if (navMenu.contains(e.target) || navToggle.contains(e.target)) return;
    close();
  });

  // close on link click (mobile UX)
  navMenu.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a) close();
  });

  // close on resize to desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) close();
  });
}
