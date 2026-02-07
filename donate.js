// donate.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

(() => {
  /* =========================
     FIREBASE CONFIG
  ========================= */
  const firebaseConfig = {
    apiKey: "AIzaSyAmJYe6zJ_yDS9kvKKBHyLIZdAJogl-ER0",
    authDomain: "loukik-sangha-7df0c.firebaseapp.com",
    projectId: "loukik-sangha-7df0c",
    storageBucket: "loukik-sangha-7df0c.appspot.com",
    messagingSenderId: "XXXX",
    appId: "XXXX"
  };

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  const $ = (s, p = document) => p.querySelector(s);

  /* =========================
     Year
  ========================= */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* =========================
     Active Nav (Donate highlight)
     - Works for donate.html and /donate routes
  ========================= */
  const normalize = (v) => (v || "").toLowerCase().split("?")[0].split("#")[0].trim();

  const raw = (location.pathname.split("/").pop() || "index.html");
  const current = normalize(raw === "" ? "index.html" : raw);

  const isDonatePage =
    current === "donate.html" || current === "donate" || current.startsWith("donate");

  document.querySelectorAll("#navMenu a, .menu a, a.nav-link").forEach(a => {
    const dp = normalize(a.getAttribute("data-page") || "");
    const href = normalize((a.getAttribute("href") || "").split("/").pop());

    const isDonateLink =
      dp === "donate.html" || dp === "donate" || href === "donate.html" || href === "donate";

    const match =
      (dp && dp === current) ||
      (href && href === current) ||
      (isDonatePage && isDonateLink);

    a.classList.toggle("active", match);
  });

  /* =========================
     Mobile Nav Toggle
  ========================= */
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
      if (e.target.closest("a")) close();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) close();
    });
  }

  /* =========================
     Toast
  ========================= */
  const toast = (text, ok = true) => {
    const el = document.createElement("div");
    el.textContent = text;
    el.style.position = "fixed";
    el.style.left = "50%";
    el.style.bottom = "22px";
    el.style.transform = "translateX(-50%)";
    el.style.padding = "10px 14px";
    el.style.borderRadius = "12px";
    el.style.background = ok ? "rgba(22,163,74,.95)" : "rgba(239,68,68,.95)";
    el.style.color = "#fff";
    el.style.fontWeight = "800";
    el.style.fontSize = "13px";
    el.style.boxShadow = "0 18px 28px rgba(15,23,42,.22)";
    el.style.zIndex = "99999";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1900);
  };

  /* =========================
     Copy buttons
  ========================= */
  document.querySelectorAll("[data-copy]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const target = document.querySelector(btn.dataset.copy);
      if (!target) return;
      await navigator.clipboard.writeText(target.textContent.trim());
      toast("Copied");
    });
  });

  /* =========================
     Form submit → Firestore
  ========================= */
  const form = $("#donateForm");
  const formMsg = $("#formMsg");
  const clearBtn = $("#clearBtn");

  const setMsg = (t = "", ok = true) => {
    if (!formMsg) return;
    formMsg.textContent = t;
    formMsg.style.color = ok ? "#16a34a" : "#ef4444";
  };

  clearBtn?.addEventListener("click", () => {
    form.reset();
    setMsg("");
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      name: $("#dName")?.value?.trim() || "",
      phone: $("#dPhone")?.value?.trim() || "",
      method: $("#dMethod")?.value || "",
      amount: Number($("#dAmount")?.value || 0),
      trx: $("#dTrx")?.value?.trim() || "",
      note: $("#dMsg")?.value?.trim() || "",
      status: "pending",
      createdAt: serverTimestamp()
    };

    if (!data.name || !data.phone || !data.method || !data.amount || !data.trx) {
      setMsg("Please fill all required fields.", false);
      return;
    }

    try {
      await addDoc(collection(db, "donation_confirmations"), data);
      setMsg("Submitted successfully. Admin will verify.", true);
      toast("Confirmation sent");
      form.reset();
    } catch (err) {
      console.error(err);
      setMsg("Submission failed. Try again.", false);
      toast("Error submitting", false);
    }
  });
})();
