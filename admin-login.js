import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

import { auth } from "./firebase.js";
import { initNavbarAuthUI, isAdminUser, initMobileNav } from "./shared-ui.js";

initNavbarAuthUI();
initMobileNav();

const form = document.getElementById("loginForm");
const emailEl = document.getElementById("loginEmail");
const passEl  = document.getElementById("loginPass");
const msgEl   = document.getElementById("loginMsg");

function setMsg(text, ok = false) {
  if (!msgEl) return;
  msgEl.textContent = text || "";
  msgEl.style.color = ok ? "#16a34a" : "#ef4444";
}

function goDashboard() {
  window.location.replace("dashboard.html");
}

if (!form || !emailEl || !passEl) {
  console.error("Missing form/input IDs:", { form, emailEl, passEl });
  setMsg("HTML form IDs missing. Check admin-login.html");
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = (emailEl.value || "").trim();
  const pass  = passEl.value || "";

  if (!email || !pass) {
    setMsg("Email and password required");
    return;
  }

  setMsg("Logging in...");

  const btn = form.querySelector("button[type='submit'], #loginBtn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Logging in...";
  }

  try {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const user = cred.user;

    if (!isAdminUser(user)) {
      setMsg("This account is not admin.");
      try { await auth.signOut?.(); } catch {}
      return;
    }

    setMsg("Admin login success!", true);
    goDashboard();
  } catch (err) {
    console.error("Login error:", err);
    const code = err?.code || "";
    if (code.includes("auth/invalid-credential") || code.includes("auth/wrong-password")) {
      setMsg("Wrong email or password");
    } else if (code.includes("auth/user-not-found")) {
      setMsg("User not found");
    } else {
      setMsg(code || err?.message || String(err));
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Login";
    }
  }
});
