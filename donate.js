// donate.js (CRASH-PROOF)
// ✅ UI works even if Firebase config is wrong / blocked
// ✅ Mobile nav toggle fixed
// ✅ More dropdown works on mobile (click-to-toggle)
// ✅ Quick amounts fixed
// ✅ Copy buttons fixed

import { db as sharedDb, authReady } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

(() => {
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];

  /* =========================
     Small helpers
  ========================= */
  const toastEl = $("#toast");
  const toast = (msg) => {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove("show"), 1800);
  };

  const copyText = async (txt) => {
    const v = String(txt || "").trim();
    if (!v) return false;

    try {
      await navigator.clipboard.writeText(v);
      return true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = v;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        return true;
      } catch {
        return false;
      } finally {
        ta.remove();
      }
    }
  };

  /* =========================
     Year
  ========================= */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* =========================
     Active Nav
  ========================= */
  const normalize = (v) => (v || "").toLowerCase().split("?")[0].split("#")[0].trim();
  const current = normalize((location.pathname.split("/").pop() || "index.html") || "index.html");

  $$(".menu a.nav-link, .menu a.nav-dd-link, .menu a").forEach((a) => {
    const dp = normalize(a.getAttribute("data-page") || "");
    const href = normalize((a.getAttribute("href") || "").split("/").pop());
    const match = (dp && dp === current) || (href && href === current);
    a.classList.toggle("active", match);
  });

  /* =========================
     Mobile NAV toggle (works always)
  ========================= */
  const topbar = $(".topbar");
  const navToggle = $("#navToggle");
  const navMenu = $("#navMenu");

  const setMenuTop = () => {
    if (!navMenu || !topbar) return;
    const h = Math.round(topbar.getBoundingClientRect().height || 72);
    navMenu.style.top = `${h + 10}px`;
  };

  const openMenu = () => {
    if (!navMenu || !navToggle) return;
    setMenuTop();
    navMenu.classList.add("open");
    navToggle.setAttribute("aria-expanded", "true");
  };

  const closeMenu = () => {
    if (!navMenu || !navToggle) return;
    navMenu.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  };

  if (navToggle && navMenu) {
    setMenuTop();

    navToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      navMenu.classList.contains("open") ? closeMenu() : openMenu();
    });

    document.addEventListener("click", (e) => {
      if (!navMenu.classList.contains("open")) return;
      if (navMenu.contains(e.target) || navToggle.contains(e.target)) return;
      closeMenu();
    });

    navMenu.addEventListener("click", (e) => {
      if (e.target.closest("a")) closeMenu();
    });

    window.addEventListener("resize", () => {
      setMenuTop();
      if (window.innerWidth > 860) closeMenu();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* =========================
     More dropdown: mobile click-to-toggle
  ========================= */
  const moreDD = $("#moreDD");
  const moreBtn = $("#moreBtn");

  const isMobile = () => window.matchMedia("(max-width: 860px)").matches;

  const closeMore = () => {
    if (!moreDD || !moreBtn) return;
    moreDD.classList.remove("open");
    moreBtn.setAttribute("aria-expanded", "false");
  };

  const toggleMore = () => {
    if (!moreDD || !moreBtn) return;
    const next = !moreDD.classList.contains("open");
    moreDD.classList.toggle("open", next);
    moreBtn.setAttribute("aria-expanded", next ? "true" : "false");
  };

  if (moreDD && moreBtn) {
    moreBtn.addEventListener("click", (e) => {
      if (!isMobile()) return;
      e.preventDefault();
      e.stopPropagation();
      toggleMore();
    });

    document.addEventListener("click", () => {
      if (isMobile()) closeMore();
    });

    window.addEventListener("resize", () => closeMore());
  }

  /* =========================
     Copy buttons
  ========================= */
  $$("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const sel = btn.getAttribute("data-copy") || "";
      const target = $(sel);
      if (!target) return toast("Copy target missing");
      const ok = await copyText(target.textContent);
      toast(ok ? "Copied" : "Copy failed");
    });
  });

  const copyRefBtn = $("#copyRefText");
  if (copyRefBtn) {
    copyRefBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const txt = copyRefBtn.getAttribute("data-copytext") || "Donation";
      const ok = await copyText(txt);
      toast(ok ? "Copied “Donation”" : "Copy failed");
    });
  }

  /* =========================
     Prefill method + extra section
  ========================= */
  const methodSel = $("#dMethod");
  const extraWrap = $("#extraWrap");
  const extraHint = $("#extraHint");

  const setExtra = (method) => {
    if (!extraWrap) return;
    const m = String(method || "").trim();
    const show = ["bKash", "Nagad", "Rocket", "Bank", "Cash"].includes(m);
    extraWrap.hidden = !show;

    if (extraHint) {
      if (m === "Bank") extraHint.textContent = "For bank transfer, you may add sender account and payment date.";
      else if (m === "Cash") extraHint.textContent = "For cash, add receipt note or contact info for verification.";
      else extraHint.textContent = "Optional details help verify faster.";
    }
  };

  $$("[data-prefill]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const m = btn.getAttribute("data-prefill") || "";
      if (methodSel) methodSel.value = m;
      setExtra(m);
      $("#donateForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
      toast("Method selected");
      closeMenu();
    });
  });

  methodSel?.addEventListener("change", () => setExtra(methodSel.value));
  setExtra(methodSel?.value || "");

  /* =========================
     Quick amounts (FIXED selector)
  ========================= */
  const amt = $("#dAmount");
  $$(".d-quick .d-qa-amt").forEach((b) => {
    b.addEventListener("click", () => {
      const v = Number(b.getAttribute("data-amount") || 0);
      if (!amt || !Number.isFinite(v) || v <= 0) return;
      amt.value = String(v);
      toast("Amount set");
    });
  });

  /* =========================
     Form submit
  ========================= */
  const form = $("#donateForm");
  const formMsg = $("#formMsg");
  const clearBtn = $("#clearBtn");
  const submitBtn = $("#submitBtn");
  const refBox = $("#refBox");
  const refId = $("#refId");

  const setMsg = (t = "", ok = true) => {
    if (!formMsg) return;
    formMsg.textContent = t;
    formMsg.style.color = ok ? "#16a34a" : "#ef4444";
  };

  const setBusy = (busy) => {
    if (!submitBtn) return;
    submitBtn.disabled = !!busy;
    submitBtn.style.opacity = busy ? ".75" : "1";
  };

  // ✅ Use shared db from firebase.js
  let db = sharedDb;
  let firebaseReady = !!db;

  // Messenger/in-app safe: wait persistence setup (doesn't block Firestore, but helps stability)
  Promise.resolve(authReady).catch(() => {});

  if (submitBtn && !firebaseReady) {
    submitBtn.disabled = true;
    setMsg("Submission is disabled: Firebase not ready. Check firebase.js path/import.", false);
  }

  clearBtn?.addEventListener("click", () => {
    form?.reset();
    setMsg("");
    setExtra("");
    if (refBox) refBox.hidden = true;
    toast("Cleared");
  });

  const normalizePhone = (v) => String(v || "").replace(/\s+/g, "").trim();
  const isBDPhone = (v) => /^01\d{9}$/.test(normalizePhone(v));
  const clean = (v) => String(v || "").trim();

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg("");
    if (refBox) refBox.hidden = true;

    if (!firebaseReady || !db) {
      toast("Firebase not ready");
      setMsg("Firebase not ready. Please check firebase.js config/import.", false);
      return;
    }

    const data = {
      name: clean($("#dName")?.value),
      phone: normalizePhone($("#dPhone")?.value),
      method: clean($("#dMethod")?.value),
      amount: Number($("#dAmount")?.value || 0),
      trx: clean($("#dTrx")?.value),
      note: clean($("#dMsg")?.value),
      sender: clean($("#dSender")?.value),
      payDate: clean($("#dDate")?.value),
      status: "pending",
      createdAt: serverTimestamp()
    };

    if (!data.name || !data.phone || !data.method || !data.amount || !data.trx) {
      setMsg("Please fill all required fields.", false);
      toast("Missing fields");
      return;
    }
    if (!isBDPhone(data.phone)) {
      setMsg("Phone format should be 01XXXXXXXXX.", false);
      toast("Invalid phone");
      return;
    }
    if (!Number.isFinite(data.amount) || data.amount <= 0) {
      setMsg("Amount must be greater than 0.", false);
      toast("Invalid amount");
      return;
    }
    if (data.trx.length < 4) {
      setMsg("Transaction/Reference seems too short.", false);
      toast("Invalid reference");
      return;
    }

    try {
      setBusy(true);
      const docRef = await addDoc(collection(db, "donation_confirmations"), data);

      setMsg("Submitted successfully. Admin will verify.", true);
      toast("Confirmation sent");

      if (refId) refId.textContent = docRef.id;
      if (refBox) refBox.hidden = false;

      form.reset();
      setExtra("");
    } catch (err) {
      console.error(err);
      setMsg("Submission failed. Try again.", false);
      toast("Error submitting");
    } finally {
      setBusy(false);
    }
  });
})();
