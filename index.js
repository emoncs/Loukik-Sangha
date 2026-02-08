import { initNavbarAuthUI } from "./shared-ui.js";
import { db } from "./firebase.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

initNavbarAuthUI();

const $ = (s, p = document) => p.querySelector(s);

/* =========================
   Year
========================= */
(() => {
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
})();

/* =========================
   Mobile Nav
========================= */
(() => {
  const navToggle = $("#navToggle");
  const navMenu = $("#navMenu");
  if (!navToggle || !navMenu) return;

  const setExpanded = (v) => navToggle.setAttribute("aria-expanded", v ? "true" : "false");
  const closeMenu = () => { navMenu.classList.remove("open"); setExpanded(false); };

  navToggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const open = !navMenu.classList.contains("open");
    navMenu.classList.toggle("open", open);
    setExpanded(open);
  }, { passive: false });

  document.addEventListener("click", (e) => {
    if (!navMenu.classList.contains("open")) return;
    if (navMenu.contains(e.target) || navToggle.contains(e.target)) return;
    closeMenu();
  });

  navMenu.addEventListener("click", (e) => {
    const a = e.target.closest?.("a");
    if (a) closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) closeMenu();
  });
})();

/* =========================
   Firestore Stats
========================= */
(() => {
  const statMembers     = $("#statMembers");
  const statCollected   = $("#statCollected");
  const statDues        = $("#statDues");
  const statFund        = $("#statFund");
  const statOtherIncome = $("#statOtherIncome");
  const statExpense     = $("#statExpense");

  try {
    onSnapshot(doc(db, "stats", "global"), (snap) => {
      const s = snap.data() || {};
      if (statMembers)     statMembers.textContent = s.totalMembers ?? 0;
      if (statCollected)   statCollected.textContent = s.totalCollectedYTD ?? 0;
      if (statDues)        statDues.textContent = s.totalDues ?? 0;
      if (statFund)        statFund.textContent = s.availableFund ?? 0;
      if (statOtherIncome) statOtherIncome.textContent = s.totalOtherIncome ?? 0;
      if (statExpense)     statExpense.textContent = s.totalExpense ?? 0;
    });
  } catch (err) {
    console.error("❌ Stats onSnapshot failed:", err);
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
    { text: "জরুরি সাহায্য ফান্ড চালু", icon: "fa-hand-holding-heart", linkText: "Donate", link: "donate.html" }
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

  track.innerHTML = html + html; // duplicate for smooth infinite scroll
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
function todayBD() {
  const now = new Date();
  const bd = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
  const y = bd.getFullYear();
  const m = String(bd.getMonth() + 1).padStart(2, "0");
  const d = String(bd.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function showRitualPopup(dateStr, items){
  const modal = document.getElementById("ritualModal");
  const list  = document.getElementById("ritualList");
  const title = document.getElementById("ritualTitle");
  const close = document.getElementById("ritualClose");
  const ok    = document.getElementById("ritualOk");
  const back  = document.getElementById("ritualBackdrop");
  const link  = document.getElementById("ritualLink");

  if (!modal || !list || !title) return;

  // show once per day
  const seenKey = `ls_ritual_seen_${dateStr}`;
  try { if (localStorage.getItem(seenKey) === "1") return; } catch {}

  title.textContent = `আজকের ধর্মীয় অনুষ্ঠান (${dateStr})`;

  list.innerHTML = items.map(e => `
    <div class="ritual-item">
      <h4>${e.title || "আজকের তথ্য"}</h4>
      <p>${e.details || ""}</p>
    </div>
  `).join("");

  const firstLink = items.find(x => x.link)?.link;
  if (firstLink && link) { link.href = firstLink; link.style.display = "inline-flex"; }
  else if (link) { link.style.display = "none"; }

  const doClose = () => {
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden","true");
  };

  modal.classList.add("show");
  modal.setAttribute("aria-hidden","false");

  close?.addEventListener("click", doClose, { once:true });
  ok?.addEventListener("click", doClose, { once:true });
  back?.addEventListener("click", doClose, { once:true });
  document.addEventListener("keydown", (ev)=>{ if(ev.key==="Escape") doClose(); }, { once:true });

  try { localStorage.setItem(seenKey, "1"); } catch {}
}

async function initRitualPopupFromJSON(){
  const dateStr = todayBD();

  try{
    const res = await fetch(`rituals.json?v=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) throw new Error("rituals.json not found");
    const data = await res.json();
    const events = Array.isArray(data.events) ? data.events : [];

    const todays = events
      .filter(e => e?.date === dateStr)
      .sort((a,b)=> (a.priority ?? 9) - (b.priority ?? 9));

    if (todays.length) showRitualPopup(dateStr, todays);
  } catch(err){
    console.error("Ritual JSON load failed:", err);
  }
}

// আপনার existing DOMContentLoaded-এ এটা call করুন:
window.addEventListener("DOMContentLoaded", () => {
  initRitualPopupFromJSON();
});


