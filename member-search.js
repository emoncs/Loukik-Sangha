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

  const input = $("#q");
  const btn = $("#searchBtn");

  const countEl = $("#count");
  const emptyState = $("#emptyState");
  const cardsEl = $("#cards");

  const tableWrap = $("#tableWrap");
  const tbody = $("#resultsTbody");

  const allCountEl = $("#allCount");
  const allTableWrap = $("#allTableWrap");
  const allTbody = $("#allTbody");

  const msg = $("#searchMsg");

  const joinForm = $("#joinForm");
  const joinMsg = $("#joinMsg");
  const joinReset = $("#joinReset");
  const joinSubmit = $("#joinSubmit");

  // NEW: pagination controls
  const pageSizeEl = $("#pageSize");
  const prevPageBtn = $("#prevPage");
  const nextPageBtn = $("#nextPage");
  const pageInfoEl = $("#pageInfo");

  if (!allTbody || !allTableWrap || !cardsEl) {
    console.error("Missing DOM ids");
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

  // WhatsApp click-to-send helper
  function waLink(phone, msgText) {
    const digits = String(phone || "").replace(/\D/g, "");
    if (!digits) return "#";
    const bd = digits.startsWith("0") ? "88" + digits : digits; // 017.. => 88017..
    return `https://wa.me/${bd}?text=${encodeURIComponent(msgText || "")}`;
  }

  // ===================== Join Month Normalizer =====================
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

  // ===== Pagination state for All Members table =====
  let ALL_MEMBERS = [];
  let LOADED = false;
  let allPage = 1;
  let pageSize = Number(pageSizeEl?.value || 20);

  function totalPages(total, size) {
    const s = Math.max(1, Number(size || 20));
    return Math.max(1, Math.ceil(total / s));
  }

  function updatePagerUI() {
    if (!pageInfoEl) return;
    const tp = totalPages(ALL_MEMBERS.length, pageSize);
    if (allPage > tp) allPage = tp;
    pageInfoEl.textContent = `Page ${allPage} / ${tp}`;
    if (prevPageBtn) prevPageBtn.disabled = allPage <= 1;
    if (nextPageBtn) nextPageBtn.disabled = allPage >= tp;
  }

  function renderAll(rows) {
    ALL_MEMBERS = Array.isArray(rows) ? rows : [];
    if (allCountEl) allCountEl.textContent = String(ALL_MEMBERS.length);

    allTableWrap.style.display = ALL_MEMBERS.length ? "block" : "none";

    const start = (allPage - 1) * pageSize;
    const end = start + pageSize;
    const slice = ALL_MEMBERS.slice(start, end);

    allTbody.innerHTML = slice.map((m, i) => rowHTML(m, start + i)).join("");
    updatePagerUI();
  }

  // ===== Cards rendering (Results) + WhatsApp =====
  const defaultAvatar = (gender) => {
    const g = String(gender || "").toLowerCase();
    return (g === "female") ? "Images/female.png" : "Images/male.png";
  };

  function cardHTML(m) {
    const name = esc(m.name || "Unknown");
    const phoneRaw = (m.phone || "");
    const phone = esc(phoneRaw || "-");
    const join = esc(m.joinMonthLabel || m.joinMonth || "-");
    const code = esc(m.memberCode || "-");
    const gender = String(m.gender || "male").toLowerCase();

    const monthly = Number(m.monthlyDue || 0);
    const paid = Number(m.totalPaid || 0);
    const due = Number(m.due || 0);
    const adv = Number(m.advance || 0);

    const img = esc(m.photoDataUrl || defaultAvatar(gender));
    const remarks = esc(m.remarks || "");

    const hasPhone = String(phoneRaw || "").trim().length > 0;
    const waMsg = due > 0
      ? `Hi ${m.name || "Member"}, আপনার Loukik Sangha এ ৳${due} dues আছে। অনুগ্রহ করে এই মাসের payment complete করুন। ধন্যবাদ।`
      : `Hi ${m.name || "Member"}, Loukik Sangha এর সাথে থাকার জন্য ধন্যবাদ।`;

    const waHref = hasPhone ? waLink(phoneRaw, waMsg) : "#";
    const waDisabled = hasPhone ? "" : "is-disabled";

    return `
      <article class="mcard">
        <div class="mcard-top">
          <img class="mimg" src="${img}" alt="Member photo" loading="lazy" />
          <div class="mmeta">
            <h3 class="mname">${name}</h3>

            <div class="msub">
              <span class="mtag"><i class="fa-solid fa-phone"></i> ${phone}</span>
              <span class="mtag"><i class="fa-solid fa-id-badge"></i> ${code}</span>
              <span class="mtag"><i class="fa-solid fa-calendar-check"></i> ${join}</span>
            </div>

            <div class="mcta">
              <a class="iconbtn wa ${waDisabled}" href="${waHref}" target="_blank" rel="noopener" aria-label="WhatsApp reminder">
                <i class="fa-brands fa-whatsapp"></i>
              </a>
              <span class="ctatxt">${due > 0 ? "Send due reminder" : "Send message"}</span>
            </div>
          </div>
        </div>

        <div class="mgrid">
          <div class="mstat"><small>Monthly</small><b>৳${fmtMoney(monthly)}</b></div>
          <div class="mstat"><small>Paid</small><b>৳${fmtMoney(paid)}</b></div>
          <div class="mstat"><small>Due</small><b>৳${fmtMoney(due)}</b></div>
          <div class="mstat"><small>Advanced</small><b>৳${fmtMoney(adv)}</b></div>
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

  // ===== Firestore load/search =====
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

  function filterMembers(all, qLower) {
    return all.filter(m => {
      const name = String(m.name || "").toLowerCase();
      const code = String(m.memberCode || "").toLowerCase();
      const join = String(m.joinMonth || "").toLowerCase();
      const joinLabel = String(m.joinMonthLabel || "").toLowerCase();
      const phone = String(m.phone || "").toLowerCase();
      return (
        name.includes(qLower) ||
        code.includes(qLower) ||
        join.includes(qLower) ||
        joinLabel.includes(qLower) ||
        phone.includes(qLower)
      );
    });
  }

  async function doSearch() {
    const q = (input?.value || "").trim().toLowerCase();

    if (!q) {
      setMsg("");
      showEmpty("Type member name / phone / code and press Search.");
      return;
    }

    setMsg("Searching...", true);

    try {
      const all = await loadMembersOnce();
      const filtered = filterMembers(all, q);

      setMsg(filtered.length ? `Found ${filtered.length} member(s).` : "No matches found.", !!filtered.length);
      renderResults(filtered);
    } catch (e) {
      console.error("Firestore read failed:", e);
      setMsg("Cannot load members. Check Firestore connection or console error.", false);
      showEmpty("Search unavailable right now.");
    }
  }

  btn?.addEventListener("click", doSearch);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doSearch();
  });

  // ===== Optional photo: compress to dataURL (no storage needed) =====
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

  // ===== Join form submit =====
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
      allPage = 1;
      renderAll(all);

      setJoinMsg("Submitted! Your membership request has been added.", true);
      joinForm.reset();

      if (input) input.value = name;
      doSearch();

    } catch (err) {
      console.error(err);
      setJoinMsg(err?.message || "Submit failed. Try again.", false);
    } finally {
      joinSubmit && (joinSubmit.disabled = false);
    }
  });

  // ===== Pagination events =====
  pageSizeEl?.addEventListener("change", async () => {
    pageSize = Number(pageSizeEl.value || 20);
    allPage = 1;
    renderAll(ALL_MEMBERS);
  });

  prevPageBtn?.addEventListener("click", () => {
    allPage = Math.max(1, allPage - 1);
    renderAll(ALL_MEMBERS);
  });

  nextPageBtn?.addEventListener("click", () => {
    const tp = totalPages(ALL_MEMBERS.length, pageSize);
    allPage = Math.min(tp, allPage + 1);
    renderAll(ALL_MEMBERS);
  });

  // initial load
  (async () => {
    setMsg("Loading members...", true);
    showEmpty();

    try {
      const all = await loadMembersOnce();
      allPage = 1;
      renderAll(all);
      setMsg("Members loaded. Now search to filter results.", true);
    } catch (e) {
      console.error(e);
      setMsg("Cannot load members list. Check Firestore rules/connection.", false);
      renderAll([]);
    }

    const params = new URLSearchParams(location.search);
    const initialQ = (params.get("q") || "").trim();
    if (input && initialQ) {
      input.value = initialQ;
      doSearch();
    }
  })();
})();
