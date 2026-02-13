import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { auth, ADMIN_EMAIL } from "./firebase.js";

export function isAdminUser(user) {
  return !!user && (user.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/* =========================================================
   ✅ Auth UI ONLY
   - No nav binding
   - No theme
   - No year
   - No active-page highlight
========================================================= */
export function initNavbarAuthUI() {
  const loginLink = document.querySelector("#adminLoginLink");
  const logoutBtn = document.querySelector("#logoutBtn");
  const roleBadge = document.querySelector("#roleBadge");

  // prevent double-binding on logout button
  if (logoutBtn && logoutBtn.dataset.bound === "1") {
    // already bound
  } else if (logoutBtn) {
    logoutBtn.dataset.bound = "1";
    logoutBtn.addEventListener("click", async () => {
      try {
        await signOut(auth);
        location.replace("index.html");
      } catch (e) {
        alert("Logout failed: " + (e?.message || e));
      }
    });
  }

  // auth state UI
  onAuthStateChanged(auth, (user) => {
    const admin = isAdminUser(user);

    if (roleBadge) {
      roleBadge.textContent = user ? (admin ? "Admin" : "User") : "";
      roleBadge.style.display = user ? "inline-flex" : "none";
    }

    if (loginLink) loginLink.style.display = user ? "none" : "inline-flex";
    if (logoutBtn) logoutBtn.style.display = user ? "inline-flex" : "none";
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
