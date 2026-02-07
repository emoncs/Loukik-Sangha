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

  // keep (not used for search results now)
  const tableWrap = $("#tableWrap");
  const tbody = $("#resultsTbody");

  const allCountEl = $("#allCount");
  const allTableWrap = $("#allTableWrap");
  const allTbody = $("#allTbody");

  const msg = $("#searchMsg");

  // Join form
  const joinForm = $("#joinForm");
  const joinMsg = $("#joinMsg");
  const joinReset = $("#joinReset");
  const joinSubmit = $("#joinSubmit");

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

    // keep table hidden
    if (tableWrap) tableWrap.style.display = "none";
    if (tbody) tbody.innerHTML = "";
  }

  // For All Members table (unchanged)
  function rowHTML(m, idx) {
    const join = esc(m.joinMonth || "-");
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

  function renderAll(rows) {
    if (allCountEl) allCountEl.textContent = String(rows.length);
    allTableWrap.style.display = rows.length ? "block" : "none";
    allTbody.innerHTML = rows.map((m, idx) => rowHTML(m, idx)).join("");
  }

  // ===== Cards rendering (NEW) =====
  const defaultAvatar = (gender) => {
    const g = String(gender || "").toLowerCase();
    return (g === "female") ? "Images/female.png" : "Images/male.png";
  };

  function cardHTML(m) {
    const name = esc(m.name || "Unknown");
    const phone = esc(m.phone || "-");
    const join = esc(m.joinMonth || "-");
    const code = esc(m.memberCode || "-");
    const gender = String(m.gender || "male").toLowerCase();

    const monthly = Number(m.monthlyDue || 0);
    const paid = Number(m.totalPaid || 0);
    const due = Number(m.due || 0);
    const adv = Number(m.advance || 0);

    const img = esc(m.photoDataUrl || defaultAvatar(gender));
    const remarks = esc(m.remarks || "");

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

    // keep table hidden (no change)
    if (tableWrap) tableWrap.style.display = "none";
  }

  // ===== Firestore load/search =====
  let ALL_MEMBERS = [];
  let LOADED = false;

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
      const phone = String(m.phone || "").toLowerCase();
      return name.includes(qLower) || code.includes(qLower) || join.includes(qLower) || phone.includes(qLower);
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
      const joinMonth = $("#jJoinMonth")?.value?.trim(); // YYYY-MM
      const monthlyDue = Number($("#jMonthly")?.value || 0);
      const address = $("#jAddress")?.value?.trim();
      const remarks = $("#jRemarks")?.value?.trim();

      if (!name || !phone || !gender || !joinMonth || !address) {
        throw new Error("Please fill all required fields.");
      }

      const file = $("#jPhoto")?.files?.[0];
      let photoDataUrl = "";
      if (file) {
        photoDataUrl = await fileToDataUrlCompressed(file, 480, 0.82);
      }

      // Generate a simple memberCode (client-side)
      const code = "LS-" + Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + Date.now().toString().slice(-5);

      const docData = {
        memberCode: code,
        name,
        phone,
        gender,
        joinMonth,
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

      // update local cache
      LOADED = false;
      ALL_MEMBERS = [];
      const all = await loadMembersOnce();
      renderAll(all);

      setJoinMsg("Submitted! Your membership request has been added.", true);
      joinForm.reset();

      // show in results cards quickly (optional)
      if (input) input.value = name;
      doSearch();

    } catch (err) {
      console.error(err);
      setJoinMsg(err?.message || "Submit failed. Try again.", false);
    } finally {
      joinSubmit && (joinSubmit.disabled = false);
    }
  });

  // initial load
  (async () => {
    setMsg("Loading members...", true);
    showEmpty();

    try {
      const all = await loadMembersOnce();
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
