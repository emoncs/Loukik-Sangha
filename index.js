import { initNavbarAuthUI } from "./shared-ui.js";
import { db } from "./firebase.js";
import {
  doc,
  onSnapshot,
  collection
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

initNavbarAuthUI();

const $ = (s, p = document) => p.querySelector(s);

(() => {
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
})();

const prefersReducedMotion = (() => {
  try {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
})();

const animState = new WeakMap();

function toNumber(v) {
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(String(v).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function animateTextNumber(el, target, opts = {}) {
  if (!el) return;

  const duration = Math.max(250, opts.duration ?? 800);
  const startVal = toNumber(el.textContent);
  const endVal = toNumber(target);

  if (prefersReducedMotion || startVal === endVal) {
    el.textContent = String(endVal);
    return;
  }

  const prev = animState.get(el);
  if (prev && prev.raf) cancelAnimationFrame(prev.raf);

  const startTime = performance.now();
  const state = { raf: null };
  animState.set(el, state);

  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const tick = (now) => {
    const t = Math.min(1, (now - startTime) / duration);
    const eased = easeOutCubic(t);
    const current = Math.round(startVal + (endVal - startVal) * eased);
    el.textContent = String(current);

    if (t < 1) state.raf = requestAnimationFrame(tick);
    else state.raf = null;
  };

  state.raf = requestAnimationFrame(tick);
}

function bdNow() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
}

function ymBD() {
  const d = bdNow();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function pad2(n) {
  return String(Number(n)).padStart(2, "0");
}

const MONTHS = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12
};

function parseFlexibleAnyMonth(raw) {
  const r = String(raw || "").trim();
  if (!r) return "";

  const s = r.toLowerCase().replace(/\s+/g, " ").trim();

  let m = s.match(/^(\d{4})[-\/.](\d{1,2})$/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    if (y && mo >= 1 && mo <= 12) return `${y}-${pad2(mo)}`;
  }

  m = s.match(/^(\d{4})[-\/.\s]([a-z]{3,9})$/);
  if (m) {
    const y = Number(m[1]);
    const key = m[2];
    const mo = MONTHS[key] ?? MONTHS[key.slice(0, 3)];
    if (y && mo) return `${y}-${pad2(mo)}`;
  }

  m = s.match(/^([a-z]{3,9})[-\/.\s](\d{4})$/);
  if (m) {
    const key = m[1];
    const y = Number(m[2]);
    const mo = MONTHS[key] ?? MONTHS[key.slice(0, 3)];
    if (y && mo) return `${y}-${pad2(mo)}`;
  }

  m = s.match(/^(\d{1,2})[-\/.](\d{4})$/);
  if (m) {
    const mo = Number(m[1]);
    const y = Number(m[2]);
    if (y && mo >= 1 && mo <= 12) return `${y}-${pad2(mo)}`;
  }

  const d = new Date(r);
  if (!Number.isNaN(d.getTime())) {
    const bd = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
    return `${bd.getFullYear()}-${pad2(bd.getMonth() + 1)}`;
  }

  return "";
}

function ymFromCreatedAt(createdAt) {
  if (!createdAt) return "";
  let d = null;

  if (typeof createdAt?.toDate === "function") d = createdAt.toDate();
  else if (createdAt instanceof Date) d = createdAt;
  else if (typeof createdAt === "number") d = new Date(createdAt);
  else if (typeof createdAt === "string") {
    const dd = new Date(createdAt);
    if (!Number.isNaN(dd.getTime())) d = dd;
  }

  if (!d) return "";
  const bd = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
  return `${bd.getFullYear()}-${pad2(bd.getMonth() + 1)}`;
}

function normalizeCode(code) {
  return String(code || "").trim().toUpperCase();
}

function isActiveMember(m) {
  const x = m || {};
  if (x.isDeleted === true) return false;
  if (x.deleted === true) return false;
  if (x.deletedAt) return false;
  if (x.status && String(x.status).toLowerCase() === "deleted") return false;
  if (x.active === false) return false;
  if (x.isActive === false) return false;
  if (x.disabled === true) return false;
  return true;
}

function isActivePayment(p) {
  const x = p || {};
  if (x.isDeleted === true) return false;
  if (x.deleted === true) return false;
  if (x.deletedAt) return false;
  if (x.status && String(x.status).toLowerCase() === "deleted") return false;
  if (x.active === false) return false;
  if (x.isActive === false) return false;
  if (x.void === true) return false;
  if (x.isVoid === true) return false;
  return true;
}

function digitsOnly(s) {
  return String(s || "").replace(/\D/g, "");
}

function normalizeBDPhone(raw) {
  const d = digitsOnly(raw);
  if (!d) return "";

  if (d.startsWith("880") && d.length >= 13) {
    const rest = d.slice(3);
    if (rest.length >= 10) return "0" + rest.slice(-10);
  }

  if (d.length === 11 && d.startsWith("0")) return d;
  if (d.length === 10 && d.startsWith("1")) return "0" + d;
  if (d.length > 11) return d.slice(-11);
  return d;
}

/* =========================
   Fund Modal + Stats (robust)
========================= */
(() => {
  const statMembers     = $("#statMembers");
  const statCollected   = $("#statCollected");
  const statDues        = $("#statDues");
  const statFund        = $("#statFund");
  const statOtherIncome = $("#statOtherIncome");
  const statExpense     = $("#statExpense");

  const FUND_KEY = "ls_fund_verified_phone";
  let ACTIVE_MEMBER_CODES = new Set();
  let PAYMENTS_CACHE = [];

  let ACTIVE_PHONES = new Set();
  let fundVerified = false;
  let fundValueCache = 0;

  function setFundMasked() {
    if (!statFund) return;
    statFund.textContent = "••••";
  }

  function openFundModal() {
    const fundModal = $("#fundModal");
    const fundPhone = $("#fundPhone");
    const fundMsg = $("#fundMsg");
    if (!fundModal) return;
    if (fundMsg) {
      fundMsg.textContent = "";
      fundMsg.classList.remove("ok", "bad");
    }
    fundModal.classList.add("show");
    fundModal.setAttribute("aria-hidden", "false");
    setTimeout(() => fundPhone?.focus(), 50);
  }

  function closeFundModal() {
    const fundModal = $("#fundModal");
    if (!fundModal) return;
    fundModal.classList.remove("show");
    fundModal.setAttribute("aria-hidden", "true");
  }

  function unlockFund(phoneNorm) {
    fundVerified = true;
    try { localStorage.setItem(FUND_KEY, phoneNorm); } catch {}
    if (statFund) animateTextNumber(statFund, fundValueCache ?? 0, { duration: 900 });
    closeFundModal();
  }

  function tryVerifyFromStored() {
    let saved = "";
    try { saved = localStorage.getItem(FUND_KEY) || ""; } catch {}
    const s = normalizeBDPhone(saved);
    if (s && ACTIVE_PHONES.has(s)) {
      fundVerified = true;
      if (statFund) animateTextNumber(statFund, fundValueCache ?? 0, { duration: 700 });
      return true;
    }
    return false;
  }

  function doVerifyInput() {
    const fundPhone = $("#fundPhone");
    const fundMsg = $("#fundMsg");

    const input = normalizeBDPhone(fundPhone?.value || "");
    if (!input) {
      if (fundMsg) {
        fundMsg.textContent = "ফোন নম্বর দিন";
        fundMsg.classList.remove("ok");
        fundMsg.classList.add("bad");
      }
      return;
    }

    if (ACTIVE_PHONES.has(input)) {
      if (fundMsg) {
        fundMsg.textContent = "Verified ✅ এখন Available Fund দেখা যাবে";
        fundMsg.classList.remove("bad");
        fundMsg.classList.add("ok");
      }
      unlockFund(input);
      return;
    }

    if (fundMsg) {
      fundMsg.textContent = "Match হয়নি ❌ (Active member phone দরকার)";
      fundMsg.classList.remove("ok");
      fundMsg.classList.add("bad");
    }
  }

  function recomputeRunningMonth() {
    const curYM = ymBD();
    let sum = 0;

    for (const p of PAYMENTS_CACHE) {
      if (!isActivePayment(p)) continue;

      const code = normalizeCode(p.memberCode);
      if (!code || !ACTIVE_MEMBER_CODES.has(code)) continue;

      const ym = parseFlexibleAnyMonth(p.month) || ymFromCreatedAt(p.createdAt);
      if (ym !== curYM) continue;

      const amt = toNumber(p.amount);
      if (amt > 0) sum += amt;
    }

    if (statCollected) animateTextNumber(statCollected, sum, { duration: 900 });
  }

  function collectPhonesFromMember(m, set) {
    const candidates = [
      m.phone, m.phoneNumber, m.mobile, m.mobileNumber,
      m.contact, m.contactNumber, m.whatsapp, m.whatsApp
    ];
    for (const c of candidates) {
      const n = normalizeBDPhone(c);
      if (n) set.add(n);
    }
  }

  window.addEventListener("DOMContentLoaded", () => {
    setFundMasked();

    document.addEventListener("click", (e) => {
      if (e.target.closest("#fundUnlockBtn")) openFundModal();
      if (e.target.closest("#fundBackdrop")) closeFundModal();
      if (e.target.closest("#fundClose")) closeFundModal();
      if (e.target.closest("#fundVerifyBtn")) doVerifyInput();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeFundModal();
      if (e.key === "Enter" && document.activeElement?.id === "fundPhone") doVerifyInput();
    });
  });

  try {
    onSnapshot(doc(db, "stats", "global"), (snap) => {
      const s = snap.data() || {};
      if (statMembers)     animateTextNumber(statMembers, s.totalMembers ?? 0, { duration: 700 });
      if (statDues)        animateTextNumber(statDues, s.totalDues ?? 0, { duration: 900 });

      fundValueCache = toNumber(s.availableFund ?? 0);

      if (statOtherIncome) animateTextNumber(statOtherIncome, s.totalOtherIncome ?? 0, { duration: 900 });
      if (statExpense)     animateTextNumber(statExpense, s.totalExpense ?? 0, { duration: 900 });

      if (fundVerified) {
        if (statFund) animateTextNumber(statFund, fundValueCache ?? 0, { duration: 900 });
      } else {
        setFundMasked();
      }
    });
  } catch (err) {
    console.error("❌ Stats onSnapshot failed:", err);
  }

  try {
    onSnapshot(collection(db, "members"), (snap) => {
      const codeSet = new Set();
      const phoneSet = new Set();

      snap.forEach((d) => {
        const m = d.data() || {};
        if (!isActiveMember(m)) return;

        const code = normalizeCode(m.memberCode);
        if (code) codeSet.add(code);

        collectPhonesFromMember(m, phoneSet);
      });

      ACTIVE_MEMBER_CODES = codeSet;
      ACTIVE_PHONES = phoneSet;

      recomputeRunningMonth();

      if (!fundVerified) {
        if (!tryVerifyFromStored()) setFundMasked();
      }
    });
  } catch (err) {
    console.error("❌ Members onSnapshot failed:", err);
  }

  try {
    onSnapshot(collection(db, "payments"), (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push(d.data() || {}));
      PAYMENTS_CACHE = arr;
      recomputeRunningMonth();
    });
  } catch (err) {
    console.error("❌ Payments onSnapshot failed:", err);
  }
})();

/* =========================
   Hero Search
========================= */
(() => {
  const heroSearch = $("#heroSearch");
  const heroSearchBtn = $("#heroSearchBtn");

  const goSearch = () => {
    const q = (heroSearch?.value || "").trim();
    location.href = q ? `member-search.html?q=${encodeURIComponent(q)}` : "member-search.html";
  };

  heroSearchBtn?.addEventListener("click", goSearch);
  heroSearch?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") goSearch();
  });
})();

/* =========================
   Notice Ticker
========================= */
function initNoticeTicker() {
  const track = document.getElementById("noticeTrack");
  const bar = document.getElementById("noticeBar");
  if (!track || !bar) return;

  const notices = [
    { text: "আগামী শুক্রবার সেবা কার্যক্রম", icon: "fa-hands-praying", linkText: "Details", link: "vision.html" },
    { text: "সদস্য সংগ্রহ শুরু — রেজিস্ট্রেশন চলছে", icon: "fa-user-plus", linkText: "Register", link: "member-search.html" },
    { text: "জরুরি সাহায্য ফান্ড চালু", icon: "fa-hand-holding-heart", linkText: "Donate", link: "donate.html" },
    { text: "যেকোনো প্রয়োজনে কল করুন +8801713086375", icon: "fa-phone", linkText: "Call", link: "tel:+8801713086375" }
  ];

  const html = notices.map((n) => {
    const a = n.link ? `<a class="notice-link" href="${n.link}">${n.linkText || "View"}</a>` : "";
    return `
      <span class="notice-item">
        <span class="notice-dot"></span>
        <i class="fa-solid ${n.icon}"></i>
        <b>${n.text}</b>
        ${a}
      </span>
    `;
  }).join("");

  track.innerHTML = html + html;
}

/* =========================
   Slider (Impact)
========================= */
function initImpactSlider() {
  const slider = document.getElementById("impactSlider");
  const slidesWrap = document.getElementById("impactSlides");
  const dotsWrap = document.getElementById("impactDots");
  if (!slider || !slidesWrap || !dotsWrap) return;

  const slides = Array.from(slidesWrap.querySelectorAll(".slide"));
  const dots = Array.from(dotsWrap.querySelectorAll(".dot"));
  if (!slides.length || dots.length !== slides.length) return;

  let idx = 0;
  let timer = null;

  const setActive = (i) => {
    slides[idx].classList.remove("is-active");
    dots[idx].classList.remove("is-active");
    idx = i;
    slides[idx].classList.add("is-active");
    dots[idx].classList.add("is-active");
  };

  const next = () => setActive((idx + 1) % slides.length);

  const start = () => {
    stop();
    timer = setInterval(next, 4500);
  };

  const stop = () => {
    if (timer) clearInterval(timer);
    timer = null;
  };

  dots.forEach((btn, i) => {
    btn.addEventListener("click", () => {
      setActive(i);
      start();
    });
  });

  slider.addEventListener("mouseenter", stop);
  slider.addEventListener("mouseleave", start);

  start();
}

window.addEventListener("DOMContentLoaded", () => {
  initNoticeTicker();
  initImpactSlider();
});


