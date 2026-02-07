import { initNavbarAuthUI } from "./shared-ui.js";
import { db } from "./firebase.js";

import {
  doc,
  onSnapshot,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

initNavbarAuthUI();

let __fundChart = null;

async function loadMonthlyFundChart() {
  const msg = document.getElementById("chartYearText");
  const canvas = document.getElementById("monthlyFundChart");

  if (!canvas) {
    if (msg) msg.textContent = "Chart canvas not found (#monthlyFundChart).";
    return;
  }

  if (typeof window.Chart === "undefined") {
    if (msg) msg.textContent = "Chart.js not loaded. Check script tag in <head>.";
    return;
  }

  const year = new Date().getFullYear();
  if (msg) msg.textContent = `Showing paid vs due amount for each month (${year})`;

  try {
    const membersSnap = await getDocs(collection(db, "members"));
    const members = [];
    membersSnap.forEach(d => members.push(d.data()));

    const paySnap = await getDocs(collection(db, "payments"));
    const payments = [];
    paySnap.forEach(d => payments.push(d.data()));

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const paidArr = Array(12).fill(0);
    const dueArr  = Array(12).fill(0);

    for (let m = 0; m < 12; m++) {
      const monthStr = `${year}-${String(m + 1).padStart(2, "0")}`;

      let expected = 0;
      for (const mem of members) {
        if (mem.joinMonth && mem.joinMonth <= monthStr) {
          expected += Number(mem.monthlyDue || 0);
        }
      }

      let paid = 0;
      for (const p of payments) {
        if (!p.paidAt) continue;

        if (typeof p.paidAt?.toDate === "function") {
          const d = p.paidAt.toDate();
          if (d.getFullYear() === year && d.getMonth() === m) {
            paid += Number(p.amount || 0);
          }
        } else if (typeof p.paidAtMonth === "string") {
          if (p.paidAtMonth === monthStr) paid += Number(p.amount || 0);
        }
      }

      paidArr[m] = paid;
      dueArr[m] = Math.max(expected - paid, 0);
    }

    if (__fundChart) {
      __fundChart.destroy();
      __fundChart = null;
    }

    __fundChart = new window.Chart(canvas.getContext("2d"), {
      type: "bar",
      data: {
        labels: months,
        datasets: [
          { label: "Paid (৳)", data: paidArr, backgroundColor: "#2563eb" },
          { label: "Due (৳)",  data: dueArr,  backgroundColor: "#f97316" }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: "bottom" } },
        scales: {
          y: { beginAtZero: true, ticks: { callback: v => "৳" + v } }
        }
      }
    });

  } catch (err) {
    console.error(err);
    if (msg) msg.textContent = "Chart error: " + (err?.message || err);
  }
}

(() => {
  const $ = (s, p = document) => p.querySelector(s);

  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const navToggle = $("#navToggle");
  const navMenu = $("#navMenu");
  if (navToggle && navMenu) {
    const close = () => {
      navMenu.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    };
    navToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const open = !navMenu.classList.contains("open");
      navMenu.classList.toggle("open", open);
      navToggle.setAttribute("aria-expanded", String(open));
    }, { passive: false });

    document.addEventListener("click", (e) => {
      if (!navMenu.classList.contains("open")) return;
      if (navMenu.contains(e.target) || navToggle.contains(e.target)) return;
      close();
    });

    navMenu.addEventListener("click", (e) => {
      const a = e.target.closest && e.target.closest("a");
      if (a) close();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 860) close();
    });
  }

const statMembers = $("#statMembers");
const statCollected = $("#statCollected");
const statDues = $("#statDues");
const statFund = $("#statFund");
const statOtherIncome = $("#statOtherIncome");
const statExpense = $("#statExpense");

onSnapshot(doc(db, "stats", "global"), (snap) => {
  const s = snap.data() || {};
  if (statMembers) statMembers.textContent = s.totalMembers ?? 0;
  if (statCollected) statCollected.textContent = s.totalCollectedYTD ?? 0;
  if (statDues) statDues.textContent = s.totalDues ?? 0;
  if (statFund) statFund.textContent = s.availableFund ?? 0;

  if (statOtherIncome) statOtherIncome.textContent = s.totalOtherIncome ?? 0;
  if (statExpense) statExpense.textContent = s.totalExpense ?? 0;
});


  const heroSearch = $("#heroSearch");
  const heroSearchBtn = $("#heroSearchBtn");

  const goSearch = () => {
    const q = (heroSearch?.value || "").trim();
    location.href = q
      ? `member-search.html?q=${encodeURIComponent(q)}`
      : "member-search.html";
  };

  heroSearchBtn?.addEventListener("click", goSearch);
  heroSearch?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") goSearch();
  });
})();

window.addEventListener("DOMContentLoaded", loadMonthlyFundChart);
