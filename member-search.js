import { initNavbarAuthUI } from "./shared-ui.js";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { db } from "./firebase.js";

initNavbarAuthUI();

(() => {
  const $ = (s, p = document) => p.querySelector(s);

  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const input = $("#q");
  const btn = $("#searchBtn");
  const countEl = $("#count");
  const emptyState = $("#emptyState");
  const cardsEl = $("#cards");
  const msg = $("#searchMsg");

  const tableWrap = $("#tableWrap");
  const tbody = $("#resultsTbody");

  const allCountEl = $("#allCount");
  const allTableWrap = $("#allTableWrap");
  const allTbody = $("#allTbody");

  const joinForm = $("#joinForm");
  const joinMsg = $("#joinMsg");
  const joinReset = $("#joinReset");
  const joinSubmit = $("#joinSubmit");

  const statTotal = $("#statTotal");
  const statDue = $("#statDue");
  const statAdv = $("#statAdv");
  const statPaid = $("#statPaid");

  const segAll = $("#segAll");
  const segDue = $("#segDue");
  const segPaid = $("#segPaid");
  const segAdv = $("#segAdv");
  const sortSel = $("#sortMembers");
  const segBtns = Array.from(document.querySelectorAll("[data-list-filter]"));

  const snapMonth = $("#snapMonth");
  const snapCollected = $("#snapCollected");
  const snapPayers = $("#snapPayers");
  const snapTarget = $("#snapTarget");
  const snapCoverage = $("#snapCoverage");
  const snapHint = $("#snapHint");
  const payerList = $("#payerList");

  if (!allTbody || !allTableWrap || !cardsEl) {
    if (msg) {
      msg.textContent = "UI error: elements not found. Check #cards #allTableWrap #allTbody";
      msg.style.color = "#ef4444";
    }
    return;
  }

  const esc = (s) => String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");

  const fmtMoney = (n) => Number(n || 0).toLocaleString("en-US");

  function setMsg(text = "", ok = true) {
    if (!msg) return;
    msg.textContent = text;
    msg.style.color = ok ? "#16a34a" : "#ef4444";
  }

  function setJoinMsg(text = "", ok = true) {
    if (!joinMsg) return;
    joinMsg.textContent = text;
    joinMsg.style.color = ok ? "#16a34a" : "#ef4444";
  }

  function showEmpty(text = "No results yet. Search to see member records.") {
    if (countEl) countEl.textContent = "0";
    if (emptyState) {
      emptyState.style.display = "block";
      const p = emptyState.querySelector("p");
      if (p) p.textContent = text;
    }
    cardsEl.style.display = "none";
    cardsEl.innerHTML = "";
    if (tableWrap) tableWrap.style.display = "none";
    if (tbody) tbody.innerHTML = "";
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

  function pad2(n) {
    const x = Number(n);
    if (!Number.isFinite(x)) return "";
    return String(x).padStart(2, "0");
  }

  function monthLabelFromYM(ym) {
    const [y, m] = String(ym || "").split("-");
    const mm = Number(m);
    const yy = Number(y);
    if (!yy || !mm) return ym || "-";
    const dt = new Date(Date.UTC(yy, mm - 1, 1));
    return dt.toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
  }

  function parseFlexibleJoinMonth(raw) {
    const s0 = String(raw || "").trim();
    if (!s0) return { ym: "", label: "" };

    const s = s0.toLowerCase().replace(/\s+/g, " ").trim();

    let m = s.match(/^(\d{4})[-\/.](\d{1,2})$/);
    if (m) {
      const year = Number(m[1]);
      const month = Number(m[2]);
      if (month >= 1 && month <= 12) {
        const ym = `${year}-${pad2(month)}`;
        return { ym, label: monthLabelFromYM(ym) };
      }
    }

    m = s.match(/^(\d{4})[-\/.\s]([a-z]{3,9})$/);
    if (m) {
      const year = Number(m[1]);
      const key = m[2];
      const month = MONTHS[key] ?? MONTHS[key.slice(0, 3)];
      if (month) {
        const ym = `${year}-${pad2(month)}`;
        return { ym, label: monthLabelFromYM(ym) };
      }
    }

    m = s.match(/^([a-z]{3,9})[-\/.\s](\d{4})$/);
    if (m) {
      const key = m[1];
      const year = Number(m[2]);
      const month = MONTHS[key] ?? MONTHS[key.slice(0, 3)];
      if (month) {
        const ym = `${year}-${pad2(month)}`;
        return { ym, label: monthLabelFromYM(ym) };
      }
    }

    m = s.match(/^(\d{1,2})[-\/.](\d{4})$/);
    if (m) {
      const month = Number(m[1]);
      const year = Number(m[2]);
      if (month >= 1 && month <= 12) {
        const ym = `${year}-${pad2(month)}`;
        return { ym, label: monthLabelFromYM(ym) };
      }
    }

    m = s.match(/^(\d{1,2})[-\/.\s]([a-z]{3,9}|\d{1,2})[-\/.\s](\d{4})$/);
    if (m) {
      const mid = m[2];
      const year = Number(m[3]);
      let month = 0;

      if (/^\d{1,2}$/.test(mid)) month = Number(mid);
      else month = MONTHS[mid] ?? MONTHS[mid.slice(0, 3)] ?? 0;

      if (month >= 1 && month <= 12 && year) {
        const ym = `${year}-${pad2(month)}`;
        return { ym, label: monthLabelFromYM(ym) };
      }
    }

    const d = new Date(s0);
    if (!Number.isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const ym = `${year}-${pad2(month)}`;
      return { ym, label: monthLabelFromYM(ym) };
    }

    return { ym: "", label: "" };
  }

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
      const y = d.getFullYear();
      const mo = d.getMonth() + 1;
      return `${y}-${pad2(mo)}`;
    }

    return "";
  }

  function getYMFromCreatedAt(createdAt) {
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
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  }

  function getCurrentYM() {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  }

  function getRecentMonthsFromNow(count) {
    const out = [];
    const d = new Date();
    d.setDate(1);
    for (let i = 0; i < count; i++) {
      out.push(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}`);
      d.setMonth(d.getMonth() - 1);
    }
    return out;
  }

  function normalizeCode(code) {
    return String(code || "").trim().toUpperCase();
  }

  const defaultAvatar = (gender) => {
    const g = String(gender || "").toLowerCase();
    return (g === "female") ? "Images/female.png" : "Images/male.png";
  };

  function cardHTML(m) {
    const name = esc(m.name || "Unknown");
    const phone = esc(m.phone || "-");
    const join = esc(m.joinMonthLabel || m.joinMonth || "-");
    const code = esc(m.memberCode || "-");
    const gender = String(m.gender || "male").toLowerCase();

    const monthly = Number(m.monthlyDue || 0);
    const paid = Number(m.totalPaid || 0);
    const due = Number(m.due || 0);
    const adv = Number(m.advance || 0);

    const img = esc(m.photoDataUrl || defaultAvatar(gender));
    const remarks = esc(m.remarks || "");

    let pill = `<span class="pill ok"><i class="fa-solid fa-circle-check"></i> OK</span>`;
    if (adv > 0) pill = `<span class="pill adv"><i class="fa-solid fa-forward"></i> Advance</span>`;
    else if (due > 0) pill = `<span class="pill due"><i class="fa-solid fa-triangle-exclamation"></i> Due</span>`;

    return `
      <article class="mcard">
        <div class="mcard-top">
          <img class="mimg" src="${img}" alt="Member photo" loading="lazy" />
          <div class="mmeta">
            <div class="mhead">
              <h3 class="mname">${name}</h3>
              ${pill}
            </div>
            <div class="msub">
              <span class="mtag"><i class="fa-solid fa-phone"></i> ${phone}</span>
              <span class="mtag"><i class="fa-solid fa-id-badge"></i> ${code}</span>
              <span class="mtag"><i class="fa-solid fa-calendar-check"></i> ${join}</span>
            </div>
          </div>
        </div>

        <div class="mgrid">
          <div class="mstat"><small>Monthly</small><b>৳${fmtMoney(monthly)}</b></div>
          <div class="mstat"><small>Paid</small><b>৳${fmtMoney(paid)}</b></div>
          <div class="mstat ${due > 0 ? "is-due" : ""}"><small>Due</small><b>৳${fmtMoney(due)}</b></div>
          <div class="mstat ${adv > 0 ? "is-adv" : ""}"><small>Advance</small><b>৳${fmtMoney(adv)}</b></div>
        </div>

        <div class="mremark">
          <b>Remark:</b> ${remarks ? remarks : "—"}
        </div>
      </article>
    `;
  }

  function renderResults(rows) {
    if (!rows.length) return showEmpty("No matching members found.");
    if (countEl) countEl.textContent = String(rows.length);
    if (emptyState) emptyState.style.display = "none";
    cardsEl.style.display = "grid";
    cardsEl.innerHTML = rows.map(cardHTML).join("");
    if (tableWrap) tableWrap.style.display = "none";
  }

  function rowHTML(m, idx) {
    const joinRaw = (m.joinMonthLabel || m.joinMonth || "-");
    const join = esc(joinRaw);
    const name = esc(m.name || "-");

    const monthly = Number(m.monthlyDue || 0);
    const paid = Number(m.totalPaid || 0);
    const due = Number(m.due || 0);
    const adv = Number(m.advance || 0);
    const total = paid + due;

    let remarkText = "OK";
    let remarkCls = "remark-ok";
    if (adv > 0) { remarkText = "Advanced"; remarkCls = "remark-adv"; }
    else if (due > 0) { remarkText = "Due"; remarkCls = "remark-due"; }

    return `
      <tr>
        <td class="num">${idx + 1}</td>
        <td class="num">${join}</td>
        <td>${name}</td>
        <td class="num">৳${fmtMoney(monthly)}</td>
        <td class="num">৳${fmtMoney(paid)}</td>
        <td class="num">৳${fmtMoney(due)}</td>
        <td class="num">৳${fmtMoney(adv)}</td>
        <td class="num">৳${fmtMoney(total)}</td>
        <td class="${remarkCls}">${remarkText}</td>
      </tr>
    `;
  }

  let LIST_FILTER = "all";
  let LIST_SORT = "code";
  let ALL_MEMBERS = [];
  let LOADED = false;

  function isDue(m){ return Number(m.due || 0) > 0; }
  function isAdv(m){ return Number(m.advance || 0) > 0; }
  function isPaidOK(m){ return !isDue(m) && !isAdv(m); }

  function updateCounts(base) {
    const all = base.length;
    const due = base.filter(isDue).length;
    const adv = base.filter(isAdv).length;
    const paid = base.filter(isPaidOK).length;

    if (allCountEl) allCountEl.textContent = String(all);

    if (segAll) segAll.textContent = String(all);
    if (segDue) segDue.textContent = String(due);
    if (segAdv) segAdv.textContent = String(adv);
    if (segPaid) segPaid.textContent = String(paid);

    if (statTotal) statTotal.textContent = String(all);
    if (statDue) statDue.textContent = String(due);
    if (statAdv) statAdv.textContent = String(adv);
    if (statPaid) statPaid.textContent = String(paid);
  }

  function applyListFilter(rows) {
    if (LIST_FILTER === "due") return rows.filter(isDue);
    if (LIST_FILTER === "advance") return rows.filter(isAdv);
    if (LIST_FILTER === "paid") return rows.filter(isPaidOK);
    return rows;
  }

  function ymToNum(ym) {
    const [y, m] = String(ym || "").split("-");
    const yy = Number(y || 0);
    const mm = Number(m || 0);
    if (!yy || !mm) return 0;
    return yy * 12 + mm;
  }

  function applyListSort(rows) {
    const r = [...rows];

    const byCode = (a, b) => String(a.memberCode || "").localeCompare(String(b.memberCode || ""));
    const byName = (a, b) => String(a.name || "").localeCompare(String(b.name || ""));
    const byDueDesc = (a, b) => Number(b.due || 0) - Number(a.due || 0);
    const byPaidDesc = (a, b) => Number(b.totalPaid || 0) - Number(a.totalPaid || 0);
    const byJoinAsc = (a, b) => ymToNum(a.joinMonth) - ymToNum(b.joinMonth);
    const byJoinDesc = (a, b) => ymToNum(b.joinMonth) - ymToNum(a.joinMonth);

    if (LIST_SORT === "name") r.sort(byName);
    else if (LIST_SORT === "dueDesc") r.sort(byDueDesc);
    else if (LIST_SORT === "paidDesc") r.sort(byPaidDesc);
    else if (LIST_SORT === "joinAsc") r.sort(byJoinAsc);
    else if (LIST_SORT === "joinDesc") r.sort(byJoinDesc);
    else r.sort(byCode);

    return r;
  }

  function renderAllList(baseRows) {
    updateCounts(baseRows);
    const filtered = applyListFilter(baseRows);
    const sorted = applyListSort(filtered);
    allTableWrap.style.display = sorted.length ? "block" : "none";
    allTbody.innerHTML = sorted.map((m, idx) => rowHTML(m, idx)).join("");
  }

  segBtns.forEach(b => {
    b.addEventListener("click", () => {
      segBtns.forEach(x => x.classList.remove("is-active"));
      b.classList.add("is-active");
      LIST_FILTER = b.getAttribute("data-list-filter") || "all";
      renderAllList(ALL_MEMBERS);
    });
  });

  sortSel?.addEventListener("change", () => {
    LIST_SORT = sortSel.value || "code";
    renderAllList(ALL_MEMBERS);
  });

  async function loadMembersOnce() {
    if (LOADED) return ALL_MEMBERS;
    const snap = await getDocs(collection(db, "members"));
    const rows = [];
    snap.forEach(d => rows.push(d.data()));
    rows.sort((a, b) => (a.memberCode || "").localeCompare(b.memberCode || ""));
    ALL_MEMBERS = rows;
    LOADED = true;
    return ALL_MEMBERS;
  }

  function normalizeForPrefix(s) {
    return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
  }

  function normalizeNoSpace(s) {
    return String(s || "").toLowerCase().replace(/\s+/g, "");
  }

  function filterMembersPrefix(all, qRaw) {
    const q = normalizeForPrefix(qRaw);
    const qNS = normalizeNoSpace(qRaw);
    const looksLikePhone = /^[+0-9]/.test(qRaw);
    const looksLikeCode = q.includes("ls") || qRaw.includes("-");

    return all.filter(m => {
      const name = normalizeForPrefix(m.name);
      const nameNS = normalizeNoSpace(m.name);
      const phone = normalizeForPrefix(m.phone);
      const code = normalizeForPrefix(m.memberCode);

      if (looksLikePhone) return phone.startsWith(q);
      if (looksLikeCode) return code.startsWith(q);

      return name.startsWith(q) || nameNS.startsWith(qNS);
    });
  }

  async function doSearch() {
    const q = (input?.value || "").trim();
    if (!q) {
      setMsg("");
      showEmpty("Type member name / phone / code and press Search.");
      return;
    }

    setMsg("Searching...", true);

    try {
      const all = await loadMembersOnce();
      const filtered = filterMembersPrefix(all, q);
      setMsg(filtered.length ? `Found ${filtered.length} member(s).` : "No matches found.", !!filtered.length);
      renderResults(filtered);
    } catch (e) {
      setMsg("Cannot load members. Check Firestore connection or console error.", false);
      showEmpty("Search unavailable right now.");
    }
  }

  btn?.addEventListener("click", doSearch);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doSearch();
  });

  function setSnapshotUI({ ymLabel, collected, payers, target, usedFallback }) {
    if (snapMonth) snapMonth.textContent = ymLabel || "—";
    if (snapCollected) snapCollected.textContent = `৳${fmtMoney(collected)}`;
    if (snapPayers) snapPayers.textContent = String(payers || 0);
    if (snapTarget) snapTarget.textContent = `৳${fmtMoney(target)}`;

    const cov = target > 0 ? Math.round((collected / target) * 100) : 0;
    if (snapCoverage) snapCoverage.textContent = `${cov}%`;

    if (snapHint) {
      snapHint.textContent = usedFallback
        ? "For payments where the month was not specified, the payment date was used instead."
        : "Snapshot is calculated from payments.month.";
    }
  }

  function renderPayersList(items) {
    if (!payerList) return;
    if (!items.length) {
      payerList.innerHTML = `<li class="payer-empty">No payer data yet.</li>`;
      return;
    }

    payerList.innerHTML = items.map(x => {
      const name = esc(x.name || "Unknown");
      const code = esc(x.memberCode || "-");
      return `
        <li class="payer-item">
          <div class="payer-left">
            <span class="payer-name">${name}</span>
            <span class="payer-code">${code}</span>
          </div>
          <div class="payer-right">৳${fmtMoney(x.total)}</div>
        </li>
      `;
    }).join("");
  }

  function paymentInstallmentYM(p) {
    const ymFromMonth = parseFlexibleAnyMonth(p?.month);
    if (ymFromMonth) return { ym: ymFromMonth, fallback: false };

    const ymFromCreated = getYMFromCreatedAt(p?.createdAt);
    if (ymFromCreated) return { ym: ymFromCreated, fallback: true };

    return { ym: "", fallback: false };
  }

  async function loadMonthlyInsights() {
    const months = getRecentMonthsFromNow(4);
    const ymNow = getCurrentYM();
    const ymLabelNow = monthLabelFromYM(ymNow);

    const memberCodeSet = new Set(ALL_MEMBERS.map(m => normalizeCode(m.memberCode)));
    const nameByCode = new Map(ALL_MEMBERS.map(m => [normalizeCode(m.memberCode), String(m.name || "")]));

    const target = ALL_MEMBERS.reduce((sum, m) => sum + Number(m.monthlyDue || 0), 0);

    setSnapshotUI({ ymLabel: ymLabelNow, collected: 0, payers: 0, target, usedFallback: false });
    renderPayersList([]);

    try {
      const ps = await getDocs(collection(db, "payments"));

      const byMonthTotal = new Map();
      const byMonthPayers = new Map();
      const byMonthByPayer = new Map();

      months.forEach(ym => {
        byMonthTotal.set(ym, 0);
        byMonthPayers.set(ym, new Set());
        byMonthByPayer.set(ym, new Map());
      });

      let usedFallback = false;

      ps.forEach(doc => {
        const p = doc.data() || {};
        const { ym, fallback } = paymentInstallmentYM(p);
        if (!ym || !byMonthTotal.has(ym)) return;

        if (fallback) usedFallback = true;

        const code = normalizeCode(p.memberCode);
        if (!code) return;
        if (!memberCodeSet.has(code)) return;

        const amt = Number(p.amount || 0);
        if (!Number.isFinite(amt) || amt <= 0) return;

        byMonthTotal.set(ym, (byMonthTotal.get(ym) || 0) + amt);

        const s = byMonthPayers.get(ym);
        s && s.add(code);

        const mm = byMonthByPayer.get(ym);
        if (mm) mm.set(code, (mm.get(code) || 0) + amt);
      });

      const collectedNow = byMonthTotal.get(ymNow) || 0;
      const payersNow = (byMonthPayers.get(ymNow) || new Set()).size;

      setSnapshotUI({ ymLabel: ymLabelNow, collected: collectedNow, payers: payersNow, target, usedFallback });

      const last3 = months.slice(0, 3);
      const sets = last3.map(ym => byMonthPayers.get(ym) || new Set());
      if (!sets[0].size) {
        renderPayersList([]);
        return;
      }

      const common = [...sets[0]].filter(code => sets[1].has(code) && sets[2].has(code));

      const totals = common.map(code => {
        let t = 0;
        last3.forEach(ym => {
          const mm = byMonthByPayer.get(ym);
          if (mm) t += Number(mm.get(code) || 0);
        });
        return { memberCode: code, name: nameByCode.get(code) || "Unknown", total: t };
      });

      totals.sort((a, b) => b.total - a.total);
      renderPayersList(totals.slice(0, 3));

    } catch (e) {
      if (snapHint) snapHint.textContent = "Payments data unavailable (check Firestore rules or payments collection).";
      renderPayersList([]);
    }
  }

  async function fileToDataUrlCompressed(file, maxSize = 480, quality = 0.8) {
    if (!file) return "";

    const allowed = ["image/jpeg","image/png","image/webp","image/jpg"];
    if (!allowed.includes(file.type)) {
      throw new Error("Unsupported image type. Use JPG/PNG/WebP.");
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = url;
    });

    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;

    const scale = Math.min(1, maxSize / Math.max(w, h));
    const nw = Math.max(1, Math.round(w * scale));
    const nh = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = nw;
    canvas.height = nh;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, nw, nh);

    URL.revokeObjectURL(url);

    return canvas.toDataURL("image/jpeg", quality);
  }

  joinReset?.addEventListener("click", () => {
    joinForm?.reset();
    setJoinMsg("Fill the form to request membership. Photo is optional.", true);
  });

  joinForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setJoinMsg("Submitting...", true);
    joinSubmit && (joinSubmit.disabled = true);

    try {
      const name = $("#jName")?.value?.trim();
      const phone = $("#jPhone")?.value?.trim();
      const gender = $("#jGender")?.value?.trim().toLowerCase();

      const joinMonthRaw = $("#jJoinMonth")?.value?.trim();
      const monthlyDue = Number($("#jMonthly")?.value || 0);
      const address = $("#jAddress")?.value?.trim();
      const remarks = $("#jRemarks")?.value?.trim();

      const parsed = parseFlexibleJoinMonth(joinMonthRaw);
      const joinMonth = parsed.ym;
      const joinMonthLabel = parsed.label;

      if (!name || !phone || !gender || !joinMonth || !address) {
        throw new Error(
          !joinMonth
            ? "Join Date বুঝতে পারিনি. উদাহরণ: 2025-10 / 2025-oct / Oct 2025 / 12-oct-2025"
            : "Please fill all required fields."
        );
      }

      const file = $("#jPhoto")?.files?.[0];
      let photoDataUrl = "";
      if (file) {
        photoDataUrl = await fileToDataUrlCompressed(file, 480, 0.82);
      }

      const code = "LS-" + Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Date.now().toString().slice(-5);

      const docData = {
        memberCode: code,
        name,
        phone,
        gender,
        joinMonth,
        joinMonthLabel,
        monthlyDue,
        address,
        remarks: remarks || "",
        photoDataUrl: photoDataUrl || "",
        totalPaid: 0,
        due: 0,
        advance: 0,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "members"), docData);

      LOADED = false;
      ALL_MEMBERS = [];
      const all = await loadMembersOnce();

      renderAllList(all);
      await loadMonthlyInsights();

      setJoinMsg("Submitted! Your membership request has been added.", true);
      joinForm.reset();

      if (input) input.value = name;
      doSearch();

    } catch (err) {
      setJoinMsg(err?.message || "Submit failed. Try again.", false);
    } finally {
      joinSubmit && (joinSubmit.disabled = false);
    }
  });

  (async () => {
    setMsg("Loading members...", true);
    showEmpty();

    try {
      const all = await loadMembersOnce();
      renderAllList(all);
      await loadMonthlyInsights();
      setMsg("Members loaded. Now search to filter results.", true);
    } catch (e) {
      setMsg("Cannot load members list. Check Firestore rules/connection.", false);
      renderAllList([]);
    }

    const params = new URLSearchParams(location.search);
    const initialQ = (params.get("q") || "").trim();
    if (input && initialQ) {
      input.value = initialQ;
      doSearch();
    }
  })();
})();

