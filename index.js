// index.js  (home page)
import { initNavbarAuthUI } from "./shared-ui.js";
import { db } from "./firebase.js";
import {
  doc,
  onSnapshot,
  collection
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

initNavbarAuthUI();

const $ = (s, p = document) => p.querySelector(s);

/* =========================
   Footer Year
========================= */
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

/* =========================
   Stats (Fund verify removed)
========================= */
(() => {
  const statMembers     = $("#statMembers");
  const statCollected   = $("#statCollected");
  const statDues        = $("#statDues");
  const statFund        = $("#statFund");
  const statOtherIncome = $("#statOtherIncome");
  const statExpense     = $("#statExpense");

  let ACTIVE_MEMBER_CODES = new Set();
  let PAYMENTS_CACHE = [];

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

  try {
    onSnapshot(doc(db, "stats", "global"), (snap) => {
      const s = snap.data() || {};
      if (statMembers)     animateTextNumber(statMembers, s.totalMembers ?? 0, { duration: 700 });
      if (statDues)        animateTextNumber(statDues, s.totalDues ?? 0, { duration: 900 });
      if (statFund)        animateTextNumber(statFund, s.availableFund ?? 0, { duration: 900 });
      if (statOtherIncome) animateTextNumber(statOtherIncome, s.totalOtherIncome ?? 0, { duration: 900 });
      if (statExpense)     animateTextNumber(statExpense, s.totalExpense ?? 0, { duration: 900 });
    });
  } catch (err) {
    console.error("❌ Stats onSnapshot failed:", err);
  }

  try {
    onSnapshot(collection(db, "members"), (snap) => {
      const codeSet = new Set();

      snap.forEach((d) => {
        const m = d.data() || {};
        if (!isActiveMember(m)) return;

        const code = normalizeCode(m.memberCode);
        if (code) codeSet.add(code);
      });

      ACTIVE_MEMBER_CODES = codeSet;
      recomputeRunningMonth();
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

/* =========================
   (Your existing NAV handlers kept same)
========================= */
(() => {
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");
  const dd = document.querySelector(".nav-dd");
  const ddBtn = dd?.querySelector(".nav-dd-btn");

  // main hamburger
  navToggle?.addEventListener("click", () => {
    const open = navMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (!open) {
      dd?.classList.remove("is-open");
      ddBtn?.setAttribute("aria-expanded", "false");
    }
  });

  // mobile dropdown click toggle
  ddBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    const open = dd.classList.toggle("is-open");
    ddBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  // close when clicking outside
  document.addEventListener("click", (e) => {
    if (!navMenu?.classList.contains("open")) return;
    const inside = e.target.closest("#navMenu") || e.target.closest("#navToggle");
    if (!inside) {
      navMenu.classList.remove("open");
      navToggle?.setAttribute("aria-expanded", "false");
      dd?.classList.remove("is-open");
      ddBtn?.setAttribute("aria-expanded", "false");
    }
  });

  // close on nav link click (mobile)
  navMenu?.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    navMenu.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
    dd?.classList.remove("is-open");
    ddBtn?.setAttribute("aria-expanded", "false");
  });

  // close on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    navMenu?.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
    dd?.classList.remove("is-open");
    ddBtn?.setAttribute("aria-expanded", "false");
  });
})();
(() => {
  const imgs = [...document.querySelectorAll("img.ritual-rotator")];
  if (!imgs.length) return;

  const parseList = (el) => {
    const raw = (el.dataset.images || "").trim();
    const list = raw.split(",").map(s => s.trim()).filter(Boolean);
    // যদি data-images না দাও, fallback হিসেবে src একাই থাকবে
    return list.length ? list : [el.getAttribute("src")];
  };

  imgs.forEach((img, idx) => {
    const list = parseList(img);
    if (list.length < 2) return;

    let i = 0;
    const baseDelay = 5000;          // প্রতি ইমেজ 2.2s
    const stagger = (idx % 6) * 250; // সব কার্ড একসাথে না বদলানোর জন্য slight offset

    setTimeout(() => {
      setInterval(() => {
        i = (i + 1) % list.length;

        img.classList.add("is-fading");
        setTimeout(() => {
          img.src = list[i];
          img.classList.remove("is-fading");
        }, 900);

      }, baseDelay + 300);
    }, stagger);
  });
})();
(() => {
  const audio = document.getElementById("gitaAudio");
  const sourceEl = document.getElementById("gitaSource");
  const trackEl = document.getElementById("gitaTrack");

  const btnPlay = document.getElementById("btnPlay");
  const btnIcon = document.getElementById("btnIcon");
  const curTimeEl = document.getElementById("curTime");
  const durTimeEl = document.getElementById("durTime");

  const seekBar = document.getElementById("seekBar");
  const seekFill = document.getElementById("seekFill");
  const seekKnob = document.getElementById("seekKnob");

  const ccText = document.getElementById("ccText");
  const ccToggle = document.getElementById("ccToggle");
  const ccBox = document.querySelector(".gita-cc");

  const eqBars = [...document.querySelectorAll(".gita-eq span")];

  // Playlist UI
  const sel = document.getElementById("gitaSelect");
  const btnPrevTrack = document.getElementById("btnPrevTrack");
  const btnNextTrack = document.getElementById("btnNextTrack");

  if (!audio) return;

  /* =========================
     ✅ PLAYLIST CONFIG
     Upload your files like:
     audio/01.mp3, audio/02.mp3, ...
  ========================== */
  const AUDIO_BASE = "audio/";
  const TOTAL_PARTS = 18;     // <-- শুধু এটা change করো (তোমার ফাইল কয়টা)
  const EXT = ".mp3";

  // One CC file (same for all parts)
  const ONE_VTT = "captions/gita-bn.vtt";

  const pad2 = (n) => String(n).padStart(2, "0");

  const tracks = Array.from({ length: TOTAL_PARTS }, (_, i) => {
    const n = i + 1;
    return {
      n,
      title: `Part ${pad2(n)}`,
      src: AUDIO_BASE + pad2(n) + EXT,
      vtt: ONE_VTT
    };
  });

  let trackIndex = 0;
  const TRACK_KEY = "gitaTrackIndex";
  const savedIdx = Number(localStorage.getItem(TRACK_KEY));
  if (!Number.isNaN(savedIdx) && savedIdx >= 0 && savedIdx < tracks.length) {
    trackIndex = savedIdx;
  }

  // ---------- Helpers ----------
  const fmt = (sec) => {
    if (!isFinite(sec)) return "0:00";
    sec = Math.max(0, Math.floor(sec));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const setSeekUI = () => {
    const d = audio.duration || 0;
    const t = audio.currentTime || 0;
    const pct = d ? (t / d) * 100 : 0;
    seekFill.style.width = `${pct}%`;
    seekKnob.style.left = `${pct}%`;
    seekBar.setAttribute("aria-valuenow", String(Math.round(pct)));
    curTimeEl.textContent = fmt(t);
    durTimeEl.textContent = fmt(d);
  };

  function setBtn(isPlaying) {
    btnIcon.textContent = isPlaying ? "⏸" : "▶";
  }

  // ---------- CC (WebVTT cues) ----------
  let cuesBound = false;
  function bindCues() {
    try {
      const tt = audio.textTracks?.[0];
      if (!tt) return;
      tt.mode = "hidden";
      if (cuesBound) return;
      cuesBound = true;

      const renderCue = () => {
        const cue = tt.activeCues && tt.activeCues[0];
        ccText.innerHTML = cue
          ? cue.text.replace(/\n/g, "<br>")
          : `<span class="cc-muted">…</span>`;
      };

      tt.addEventListener("cuechange", renderCue);
      renderCue();
    } catch {
      ccText.innerHTML = `<span class="cc-muted">CC লোড হয়নি (VTT check করো)</span>`;
    }
  }

  // ---------- Playlist load/switch ----------
  function loadTrack(i, autoplay = false) {
    trackIndex = (i + tracks.length) % tracks.length; // ✅ loop
    localStorage.setItem(TRACK_KEY, String(trackIndex));

    const t = tracks[trackIndex];

    if (sel) sel.value = String(trackIndex);

    if (sourceEl) sourceEl.src = t.src;
    else audio.src = t.src;

    if (trackEl) {
      trackEl.src = t.vtt;
      trackEl.default = true;
    }

    cuesBound = false;
    ccText.innerHTML = `<span class="cc-muted">CC লোড হচ্ছে…</span>`;

    audio.load();
    setSeekUI();
    bindCues();

    if (autoplay) audio.play().catch(() => {});
  }

  function playNext() { loadTrack(trackIndex + 1, true); }
  function playPrev() { loadTrack(trackIndex - 1, true); }

  // Build dropdown
  if (sel) {
    sel.innerHTML = tracks.map((t, i) =>
      `<option value="${i}">${pad2(i + 1)} — ${t.title}</option>`
    ).join("");
    sel.addEventListener("change", () => loadTrack(Number(sel.value), true));
  }
  if (btnPrevTrack) btnPrevTrack.addEventListener("click", playPrev);
  if (btnNextTrack) btnNextTrack.addEventListener("click", playNext);

  // Load initial
  loadTrack(trackIndex, false);

  // ---------- Play/Pause + EQ ----------
  const ensureAudioContext = (() => {
    let ctx, analyser, src, data;
    return () => {
      if (ctx) return { ctx, analyser, data };

      ctx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      data = new Uint8Array(analyser.frequencyBinCount);

      src = ctx.createMediaElementSource(audio);
      src.connect(analyser);
      analyser.connect(ctx.destination);

      return { ctx, analyser, data };
    };
  })();

  // Ripple helper
  function addRipple(e) {
    const r = document.createElement("span");
    r.className = "ripple";
    const rect = btnPlay.getBoundingClientRect();

    const clientX =
      (e?.touches && e.touches[0]?.clientX) ??
      (e?.changedTouches && e.changedTouches[0]?.clientX) ??
      e?.clientX ??
      (rect.left + rect.width / 2);

    const clientY =
      (e?.touches && e.touches[0]?.clientY) ??
      (e?.changedTouches && e.changedTouches[0]?.clientY) ??
      e?.clientY ??
      (rect.top + rect.height / 2);

    r.style.left = `${clientX - rect.left}px`;
    r.style.top = `${clientY - rect.top}px`;

    btnPlay.appendChild(r);
    setTimeout(() => r.remove(), 650);
  }

  btnPlay.addEventListener("click", async (e) => {
    addRipple(e);

    if (audio.paused) {
      const { ctx } = ensureAudioContext();
      if (ctx.state === "suspended") await ctx.resume();
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  });

  audio.addEventListener("play", () => setBtn(true));
  audio.addEventListener("pause", () => setBtn(false));

  // ✅ Auto-next + loop to first
  audio.addEventListener("ended", () => {
    setBtn(false);
    playNext();
  });

  // ---------- Seek / Drag ----------
  let dragging = false;

  const seekToClientX = (clientX) => {
    const rect = seekBar.getBoundingClientRect();
    const x = Math.min(rect.right, Math.max(rect.left, clientX));
    const pct = (x - rect.left) / rect.width;
    if (audio.duration) audio.currentTime = pct * audio.duration;
    setSeekUI();
  };

  const onDown = (e) => {
    dragging = true;
    seekToClientX(e.touches ? e.touches[0].clientX : e.clientX);
  };
  const onMove = (e) => {
    if (!dragging) return;
    seekToClientX(e.touches ? e.touches[0].clientX : e.clientX);
  };
  const onUp = () => { dragging = false; };

  seekBar.addEventListener("mousedown", onDown);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);

  seekBar.addEventListener("touchstart", onDown, { passive: true });
  window.addEventListener("touchmove", onMove, { passive: true });
  window.addEventListener("touchend", onUp);

  seekBar.addEventListener("keydown", (e) => {
    if (!audio.duration) return;
    const step = 5;
    if (e.key === "ArrowRight") audio.currentTime = Math.min(audio.duration, audio.currentTime + step);
    if (e.key === "ArrowLeft") audio.currentTime = Math.max(0, audio.currentTime - step);
    setSeekUI();
  });

  audio.addEventListener("timeupdate", () => {
    if (!dragging) setSeekUI();
  });

  audio.addEventListener("loadedmetadata", () => {
    setSeekUI();
    bindCues();
  });

  // EQ animation
  function tickEQ() {
    const { analyser, data } = ensureAudioContext();
    analyser.getByteFrequencyData(data);

    const binsPerBar = Math.floor(data.length / eqBars.length) || 1;
    eqBars.forEach((bar, i) => {
      const start = i * binsPerBar;
      let sum = 0;
      for (let j = 0; j < binsPerBar; j++) sum += data[start + j] || 0;
      const avg = sum / binsPerBar;
      const scale = 0.5 + (avg / 255) * 1.6;
      bar.style.transform = `scaleY(${scale.toFixed(2)})`;
    });

    requestAnimationFrame(tickEQ);
  }
  requestAnimationFrame(tickEQ);

  // CC toggle
  ccToggle.addEventListener("click", () => {
    const hidden = ccBox.dataset.hidden === "1";
    ccBox.dataset.hidden = hidden ? "0" : "1";
    ccToggle.textContent = hidden ? "Hide" : "Show";
    ccBox.querySelector(".cc-body").style.display = hidden ? "block" : "none";
  });

  // Auto play only once per day (best-effort)
  const today = new Date().toDateString();
  const last = localStorage.getItem("gitaAutoPlayed");
  if (last !== today) {
    audio.play()
      .then(() => localStorage.setItem("gitaAutoPlayed", today))
      .catch(() => {});
  }
})();


