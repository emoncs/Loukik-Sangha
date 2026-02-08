// dashboard.js
import {
  doc, setDoc, getDocs, getDoc, serverTimestamp,
  collection, writeBatch, addDoc, deleteDoc,
  query, where
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

import { db } from "./firebase.js";
import { initNavbarAuthUI, requireAdminGuard } from "./shared-ui.js";
import { recalcMember, updateGlobalStats, monthStartTimestampFromYYYYMM } from "./calc.js";

initNavbarAuthUI();
await requireAdminGuard();

const $ = (s, p=document) => p.querySelector(s);

const yearEl = $("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* =========================
   Nav
========================= */
const navToggle = $("#navToggle");
const navMenu = $("#navMenu");
navToggle?.addEventListener("click", () => {
  const isOpen = navMenu?.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
});
document.addEventListener("click", (e) => {
  if (!navMenu || !navToggle) return;
  const inside = navMenu.contains(e.target) || navToggle.contains(e.target);
  if (!inside) {
    navMenu.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  }
});
(() => {
  const p = (location.pathname.split("/").pop() || "dashboard.html").toLowerCase();
  document.querySelectorAll(".nav-link[data-page]").forEach(a => {
    const page = (a.getAttribute("data-page") || "").toLowerCase();
    if (page === p) a.classList.add("active");
  });
})();

/* =========================
   Reload helper
========================= */
let __reloadT = null;
function scheduleReloadAll() {
  clearTimeout(__reloadT);
  __reloadT = setTimeout(async () => {
    await Promise.allSettled([
      loadMembersTable(),
      loadPaymentsTable(),
      recalcFund(),
      loadTxTable()
    ]);
  }, 50);
}

/* =========================
   Helpers
========================= */
function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;");
}

function encId(id){ return encodeURIComponent(String(id ?? "")); }
function decId(id){ return decodeURIComponent(String(id ?? "")); }

function makeMemberCodeFromName(fullName){
  const raw = String(fullName || "").trim();
  if (!raw) return "";

  const parts = raw.split(/\s+/).filter(Boolean);
  const first = parts[0] || "";
  const last  = parts.length > 1 ? parts[parts.length - 1] : "";

  const codeRaw = (last ? `${first}-${last}` : first);

  return codeRaw
    .replaceAll("/", "-")
    .replace(/[^\p{L}\p{N}\-_.]/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function genderSelectHTML(value){
  const v = (value || "").trim();
  return `
    <select class="in" data-k="gender">
      <option value="" ${v==="" ? "selected":""}>-</option>
      <option value="Male" ${v==="Male" ? "selected":""}>Male</option>
      <option value="Female" ${v==="Female" ? "selected":""}>Female</option>
      <option value="Other" ${v==="Other" ? "selected":""}>Other</option>
    </select>
  `;
}

/* =========================
   Excel Import
========================= */
const excelFile = $("#excelFile");
const parseBtn = $("#parseBtn");
const importBtn = $("#importBtn");
const membersPreview = $("#membersPreview");
const paymentsPreview = $("#paymentsPreview");

let parsedMembers = [];
let parsedPayments = [];

function previewJson(el, arr) {
  if (!el) return;
  el.textContent =
    JSON.stringify(arr.slice(0, 8), null, 2) +
    (arr.length > 8 ? `\n... (+${arr.length - 8} more)` : "");
}

parseBtn?.addEventListener("click", async () => {
  const file = excelFile?.files?.[0];
  if (!file) return alert("Select an Excel file first.");

  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: "array" });

  const memSheet = wb.Sheets["Members"];
  const paySheet = wb.Sheets["Payments"];

  if (!memSheet || !paySheet) {
    alert("Excel must contain sheets named: Members and Payments");
    return;
  }

  parsedMembers = XLSX.utils.sheet_to_json(memSheet, { defval: "" });
  parsedPayments = XLSX.utils.sheet_to_json(paySheet, { defval: "" });

  previewJson(membersPreview, parsedMembers);
  previewJson(paymentsPreview, parsedPayments);

  importBtn.disabled = false;
});

importBtn?.addEventListener("click", async () => {
  if (!parsedMembers.length && !parsedPayments.length) return;

  importBtn.disabled = true;
  importBtn.textContent = "Importing...";

  try {
    const chunkSize = 400;
    const memberCodesToRecalc = new Set();

    for (let i = 0; i < parsedMembers.length; i += chunkSize) {
      const chunk = parsedMembers.slice(i, i + chunkSize);
      const batch = writeBatch(db);

      chunk.forEach((r) => {
        const name = String(r.name || "").trim();
        let memberCode = String(r.memberCode || "").trim();
        if (!memberCode) memberCode = makeMemberCodeFromName(name);
        if (!memberCode) return;

        const phone = String(r.phone || "").trim();
        const joinMonth = String(r.joinMonth || "").trim();
        const monthlyDue = Number(r.monthlyDue || 0);
        const gender = String(r.gender || "").trim();

        batch.set(doc(db, "members", memberCode), {
          memberCode,
          name,
          nameLower: name.toLowerCase(),
          gender,
          genderLower: gender.toLowerCase(),
          joinMonth,
          monthlyDue,
          updatedAt: serverTimestamp()
        }, { merge: true });

        if (phone) {
          batch.set(doc(db, "members_private", memberCode), {
            phone,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }

        memberCodesToRecalc.add(memberCode);
      });

      await batch.commit();
    }

    for (let i = 0; i < parsedPayments.length; i += chunkSize) {
      const chunk = parsedPayments.slice(i, i + chunkSize);
      const batch = writeBatch(db);

      chunk.forEach((r, idx) => {
        const memberCode = String(r.memberCode || "").trim();
        const amount = Number(r.amount || 0);
        const method = String(r.method || "").trim() || "Unknown";
        const paidAtMonth = String(r.paidAtMonth || "").trim();
        if (!memberCode || !amount || !paidAtMonth) return;

        const paidAtDate = monthStartTimestampFromYYYYMM(paidAtMonth);
        const id = `${memberCode}_${paidAtMonth}_${amount}_${method}_${i+idx}`.replace(/\s+/g, "_");

        batch.set(doc(db, "payments", id), {
          memberCode,
          amount,
          method,
          paidAt: paidAtDate,
          paidAtMonth,
          note: "Imported from Excel",
          createdAt: serverTimestamp(),
          archived: false
        }, { merge: true });

        memberCodesToRecalc.add(memberCode);
      });

      await batch.commit();
    }

    for (const code of memberCodesToRecalc) await recalcMember(code);
    await updateGlobalStats();
    await recalcFund();

    alert("Import complete + totals updated!");
    scheduleReloadAll();
  } catch (e) {
    alert("Import failed: " + (e?.message || e));
  } finally {
    importBtn.textContent = "Import";
    importBtn.disabled = false;
  }
});

/* =========================
   Member add/update
========================= */
const memberMsg = $("#memberMsg");
const setMemberMsg = (t, ok=false) => {
  if (!memberMsg) return;
  memberMsg.textContent = t;
  memberMsg.style.color = ok ? "#16a34a" : "#ef4444";
};

$("#saveMemberBtn")?.addEventListener("click", async () => {
  const mCode = $("#mCode"),
        mName = $("#mName"),
        mPhone = $("#mPhone"),
        mGender = $("#mGender"),
        mJoin = $("#mJoin"),
        mMonthly = $("#mMonthly");

  const name = (mName?.value || "").trim();
  let memberCode = (mCode?.value || "").trim();

  if (!memberCode) {
    memberCode = makeMemberCodeFromName(name);
    if (mCode) mCode.value = memberCode;
  }

  const phone = (mPhone?.value || "").trim();
  const gender = (mGender?.value || "").trim();
  const joinMonth = (mJoin?.value || "").trim();
  const monthlyDue = Number((mMonthly?.value || "0").trim());

  if (!memberCode || !name || !joinMonth) return setMemberMsg("memberCode, name, joinMonth required");

  try {
    await setDoc(doc(db, "members", memberCode), {
      memberCode,
      name,
      nameLower: name.toLowerCase(),
      gender,
      genderLower: gender.toLowerCase(),
      joinMonth,
      monthlyDue,
      updatedAt: serverTimestamp()
    }, { merge: true });

    if (phone) {
      await setDoc(doc(db, "members_private", memberCode), {
        phone,
        updatedAt: serverTimestamp()
      }, { merge: true });
    }

    if (mCode) mCode.value = "";
    if (mName) mName.value = "";
    if (mPhone) mPhone.value = "";
    if (mGender) mGender.value = "";
    if (mJoin) mJoin.value = "";
    if (mMonthly) mMonthly.value = "";

    await recalcMember(memberCode);
    await updateGlobalStats();
    await recalcFund();

    setMemberMsg("Saved + recalculated ✅", true);
    scheduleReloadAll();
  } catch (e) {
    setMemberMsg(e?.message || String(e));
  }
});

/* =========================
   Payment add
========================= */
const payMsg = $("#payMsg");
const setPayMsg = (t, ok=false) => {
  if (!payMsg) return;
  payMsg.textContent = t;
  payMsg.style.color = ok ? "#16a34a" : "#ef4444";
};

$("#addPayBtn")?.addEventListener("click", async () => {
  const pCode = $("#pCode"), pAmt = $("#pAmt"), pMethod = $("#pMethod"), pMonth = $("#pMonth");

  const memberCode = (pCode?.value || "").trim();
  const amount = Number((pAmt?.value || "0").trim());
  const method = (pMethod?.value || "").trim() || "Unknown";
  const paidAtMonth = (pMonth?.value || "").trim();

  if (!memberCode || !amount || !paidAtMonth) return setPayMsg("memberCode, amount, paidAtMonth required");

  try {
    const paidAtDate = monthStartTimestampFromYYYYMM(paidAtMonth);
    const id = `${memberCode}_${paidAtMonth}_${amount}_${method}_${Date.now()}`.replace(/\s+/g,"_");

    await setDoc(doc(db, "payments", id), {
      memberCode,
      amount,
      method,
      paidAt: paidAtDate,
      paidAtMonth,
      note: "Manual add",
      createdAt: serverTimestamp(),
      archived: false
    }, { merge: true });

    if (pAmt) pAmt.value = "";
    if (pMethod) pMethod.value = "";
    if (pMonth) pMonth.value = "";

    await recalcMember(memberCode);
    await updateGlobalStats();
    await recalcFund();

    setPayMsg("Payment added ✅", true);
    scheduleReloadAll();
  } catch (e) {
    setPayMsg(e?.message || String(e));
  }
});

/* =========================
   Members table (FIXED DELETE)
========================= */
const tbody = $("#membersTbody");

/**
 * ✅ FIX:
 * docId দিয়ে members doc পড়বো + delete করবো
 * payments archive হবে memberCode field দিয়ে
 */
async function deleteMemberTransferToIncome(docId, memberCodeLabel){
  const ok = confirm(
    `Delete member ${memberCodeLabel}?\n\n✅ Payments delete হবে না\n✅ Payments archive হয়ে Income এ transfer হবে`
  );
  if (!ok) return;

  try {
    const memRef = doc(db, "members", docId);
    const memSnap = await getDoc(memRef);

    if (!memSnap.exists()) {
      alert("Member not found (docId mismatch).");
      return;
    }

    const mem = memSnap.data() || {};
    const name = mem.name || "Unknown";

    // ✅ payments query uses real stored memberCode field
    const realMemberCode = String(mem.memberCode || memberCodeLabel || docId).trim();

    const qPay = query(collection(db, "payments"), where("memberCode", "==", realMemberCode));
    const paySnap = await getDocs(qPay);

    let total = 0;
    const payDocs = [];
    paySnap.forEach(d => {
      const p = d.data() || {};
      if (p.archived) return;
      total += Number(p.amount || 0);
      payDocs.push(d.id);
    });

    const chunkSize = 400;
    for (let i = 0; i < payDocs.length; i += chunkSize) {
      const batch = writeBatch(db);
      payDocs.slice(i, i + chunkSize).forEach((id) => {
        batch.set(doc(db, "payments", id), {
          archived: true,
          archivedAt: serverTimestamp(),
          archivedReason: "member_deleted",
          archivedByMemberDelete: realMemberCode
        }, { merge: true });
      });
      await batch.commit();
    }

    if (total > 0) {
      await addDoc(collection(db, "transactions"), {
        type: "income",
        title: `Member deleted: ${name} (${realMemberCode})`,
        amount: total,
        note: "Auto: member payments transferred to income on delete (payments archived)",
        createdAt: serverTimestamp()
      });
    }

    // ✅ delete actual member doc
    await deleteDoc(doc(db, "members", docId));

    // ✅ delete private doc:
    // - যদি private collection এ docId == memberCode হয় -> realMemberCode use
    // - আর যদি private এ random id হয়, delete না হলেও issue না (harmless)
    await Promise.allSettled([
      deleteDoc(doc(db, "members_private", realMemberCode)),
      deleteDoc(doc(db, "members_private", docId))
    ]);

    await updateGlobalStats();
    await recalcFund();
    await loadTxTable();
    await loadPaymentsTable();
    await loadMembersTable();

    alert(`Deleted ✅\nTransferred to Income: ${total}`);
  } catch (err) {
    console.error("❌ Delete member failed:", err);
    alert("Delete failed: " + (err?.message || String(err)));
  }
}

async function loadMembersTable() {
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="10">Loading...</td></tr>`;
  const snap = await getDocs(collection(db, "members"));

  // ✅ IMPORTANT: store docId too
  const rows = [];
  snap.forEach(d => rows.push({ __id: d.id, ...d.data() }));

  rows.sort((a,b)=> (String(a.memberCode||a.__id||"")).localeCompare(String(b.memberCode||b.__id||"")));

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="10">No members</td></tr>`;
    return;
  }

  tbody.innerHTML = rows.map(m => {
    const due = Number(m.due || 0);
    const adv = Number(m.advance || 0);
    const docId = String(m.__id || "");
    const mcode = String(m.memberCode || docId);

    return `
      <tr data-id-enc="${escapeHtml(encId(docId))}" data-code-enc="${escapeHtml(encId(mcode))}">
        <td>${escapeHtml(mcode)}</td>
        <td><input class="in" data-k="name" value="${escapeHtml(m.name||"")}" /></td>
        <td>${genderSelectHTML(m.gender || "")}</td>
        <td><input class="in" data-k="joinMonth" value="${escapeHtml(m.joinMonth||"")}" /></td>
        <td><input class="in" data-k="monthlyDue" value="${Number(m.monthlyDue||0)}" /></td>
        <td><span class="num">${Number(m.totalPaid||0)}</span></td>
        <td><span class="num">${due}</span></td>
        <td><span class="num">${adv}</span></td>
        <td><button class="btn btn-primary btn-sm" data-act="saveRow" type="button">Save</button></td>
        <td><button class="btn btn-danger btn-sm" data-act="delMember" type="button">Delete</button></td>
      </tr>
    `;
  }).join("");
}

tbody?.addEventListener("click", async (e) => {
  const saveBtn = e.target.closest("[data-act='saveRow']");
  const delBtn  = e.target.closest("[data-act='delMember']");
  const tr = e.target.closest("tr");

  const idEnc = tr?.getAttribute("data-id-enc");
  const codeEnc = tr?.getAttribute("data-code-enc");
  if (!idEnc) return;

  const docId = decId(idEnc);
  const memberCodeLabel = codeEnc ? decId(codeEnc) : docId;

  if (delBtn) {
    delBtn.disabled = true;
    delBtn.textContent = "Deleting...";
    try {
      await deleteMemberTransferToIncome(docId, memberCodeLabel);
    } finally {
      delBtn.disabled = false;
      delBtn.textContent = "Delete";
    }
    return;
  }

  if (!saveBtn) return;

  const inputs = [...tr.querySelectorAll(".in")];
  const data = {};
  inputs.forEach(i => data[i.getAttribute("data-k")] = (i.value || "").trim());

  try {
    // ✅ update doc by docId
    await setDoc(doc(db, "members", docId), {
      name: data.name,
      nameLower: (data.name || "").toLowerCase(),
      gender: data.gender || "",
      genderLower: (data.gender || "").toLowerCase(),
      joinMonth: data.joinMonth,
      monthlyDue: Number(data.monthlyDue || 0),
      updatedAt: serverTimestamp()
    }, { merge: true });

    // ✅ recalc by memberCode (field), fallback docId
    const recalcKey = memberCodeLabel || docId;

    await recalcMember(recalcKey);
    await updateGlobalStats();
    await recalcFund();

    scheduleReloadAll();
    alert(`Saved ${memberCodeLabel} ✅`);
  } catch (err) {
    alert(err?.message || String(err));
  }
});

$("#refreshBtn")?.addEventListener("click", scheduleReloadAll);

/* =========================
   Transactions + Fund
========================= */
const txType   = $("#txType");
const txTitle  = $("#txTitle");
const txAmount = $("#txAmount");
const txNote   = $("#txNote");
const txMsg    = $("#txMsg");

const sumIncome  = $("#sumIncome");
const sumExpense = $("#sumExpense");
const sumFund    = $("#sumFund");

$("#addTxBtn")?.addEventListener("click", async () => {
  const type = (txType?.value || "income").trim();
  const title = (txTitle?.value || "").trim();
  const amount = Number((txAmount?.value || "0").trim());
  const note = (txNote?.value || "").trim();

  if (!title || !amount) {
    if (txMsg) {
      txMsg.textContent = "Title and amount required";
      txMsg.style.color = "#ef4444";
    }
    return;
  }

  try {
    await addDoc(collection(db, "transactions"), {
      type, title, amount, note,
      createdAt: serverTimestamp()
    });

    if (txTitle) txTitle.value = "";
    if (txAmount) txAmount.value = "";
    if (txNote) txNote.value = "";

    if (txMsg) {
      txMsg.textContent = "Transaction added ✔";
      txMsg.style.color = "#16a34a";
    }

    await recalcFund();
    await loadTxTable();
  } catch (e) {
    if (txMsg) {
      txMsg.textContent = e?.message || String(e);
      txMsg.style.color = "#ef4444";
    }
  }
});

async function recalcFund() {
  const paySnap = await getDocs(collection(db, "payments"));
  let memberCollection = 0;
  paySnap.forEach(d => {
    const p = d.data() || {};
    if (p.archived) return;
    memberCollection += Number(p.amount || 0);
  });

  const txSnap = await getDocs(collection(db, "transactions"));
  let otherIncome = 0;
  let expense = 0;
  txSnap.forEach(d => {
    const t = d.data() || {};
    if (t.type === "income") otherIncome += Number(t.amount || 0);
    if (t.type === "expense") expense += Number(t.amount || 0);
  });

  const fund = (memberCollection + otherIncome) - expense;

  if (sumIncome) sumIncome.textContent = String(otherIncome);
  if (sumExpense) sumExpense.textContent = String(expense);
  if (sumFund) sumFund.textContent = String(fund);

  await setDoc(doc(db, "stats", "global"), {
    totalCollectedYTD: memberCollection,
    totalOtherIncome: otherIncome,
    totalExpense: expense,
    availableFund: fund,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

/* =========================
   Payments Manager (UNCHANGED)
========================= */
const paymentsTbody = $("#paymentsTbody");
const reloadPaymentsBtn = $("#reloadPaymentsBtn");
const paySearch = $("#paySearch");
const payLimit = $("#payLimit");

function fmtMonthFromPaidAt(p) {
  if (typeof p.paidAtMonth === "string" && p.paidAtMonth) return p.paidAtMonth;
  if (p.paidAt?.toDate) {
    const d = p.paidAt.toDate();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  }
  return "-";
}

async function deletePayment(payId, memberCode) {
  const ok = confirm(`Delete this payment?\n\nPayment ID:\n${payId}`);
  if (!ok) return;

  await deleteDoc(doc(db, "payments", payId));

  if (memberCode) await recalcMember(memberCode);
  await updateGlobalStats();
  await recalcFund();

  await loadPaymentsTable();
  await loadMembersTable();
}

async function loadPaymentsTable() {
  if (!paymentsTbody) return;

  paymentsTbody.innerHTML = `<tr><td colspan="7">Loading...</td></tr>`;

  const limit = Number(payLimit?.value || 50);
  const search = (paySearch?.value || "").trim().toLowerCase();

  const snap = await getDocs(collection(db, "payments"));
  const rows = [];
  snap.forEach(d => rows.push({ id: d.id, ...d.data() }));

  let visible = rows.filter(p => !p.archived);

  visible.sort((a, b) => {
    const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return tb - ta;
  });

  let filtered = visible;
  if (search) {
    filtered = visible.filter(p => {
      const m = (p.memberCode || "").toLowerCase();
      const method = (p.method || "").toLowerCase();
      const month = fmtMonthFromPaidAt(p).toLowerCase();
      const pid = (p.id || "").toLowerCase();
      return m.includes(search) || method.includes(search) || month.includes(search) || pid.includes(search);
    });
  }

  filtered = filtered.slice(0, limit);

  if (!filtered.length) {
    paymentsTbody.innerHTML = `<tr><td colspan="7">No payments found</td></tr>`;
    return;
  }

  paymentsTbody.innerHTML = filtered.map(p => `
    <tr data-id="${escapeHtml(p.id)}" data-oldcode="${escapeHtml(p.memberCode || "")}">
      <td style="max-width:220px; word-break:break-all;">${escapeHtml(p.id)}</td>
      <td><input class="in" data-k="memberCode" value="${escapeHtml(p.memberCode || "")}" /></td>
      <td><input class="in" data-k="paidAtMonth" value="${escapeHtml(fmtMonthFromPaidAt(p))}" /></td>
      <td><input class="in" data-k="amount" value="${Number(p.amount || 0)}" /></td>
      <td><input class="in" data-k="method" value="${escapeHtml(p.method || "")}" /></td>
      <td><button class="btn btn-primary btn-sm" data-act="savePay" type="button">Save</button></td>
      <td><button class="btn btn-danger btn-sm" data-act="delPay" type="button">Delete</button></td>
    </tr>
  `).join("");
}

paymentsTbody?.addEventListener("click", async (e) => {
  const saveBtn = e.target.closest("[data-act='savePay']");
  const delBtn  = e.target.closest("[data-act='delPay']");
  const tr = e.target.closest("tr");
  const payId = tr?.getAttribute("data-id");
  const oldCode = tr?.getAttribute("data-oldcode") || "";
  if (!payId) return;

  if (delBtn) {
    try {
      delBtn.disabled = true;
      delBtn.textContent = "Deleting...";
      await deletePayment(payId, oldCode);
      alert("Payment deleted ✅");
      scheduleReloadAll();
    } catch (err) {
      alert("Delete failed: " + (err?.message || err));
    } finally {
      delBtn.disabled = false;
      delBtn.textContent = "Delete";
    }
    return;
  }

  if (!saveBtn) return;

  const inputs = [...tr.querySelectorAll("input.in")];
  const data = {};
  inputs.forEach(i => data[i.getAttribute("data-k")] = (i.value || "").trim());

  const newCode = data.memberCode;
  const newMonth = data.paidAtMonth;
  const newAmt = Number(data.amount || 0);
  const newMethod = data.method || "Unknown";

  if (!newCode || !newMonth || !newAmt) {
    alert("memberCode, paidAtMonth, amount required");
    return;
  }

  try {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    const paidAtDate = monthStartTimestampFromYYYYMM(newMonth);

    await setDoc(doc(db, "payments", payId), {
      memberCode: newCode,
      amount: newAmt,
      method: newMethod,
      paidAtMonth: newMonth,
      paidAt: paidAtDate,
      updatedAt: serverTimestamp(),
      archived: false
    }, { merge: true });

    tr.setAttribute("data-oldcode", newCode);

    if (oldCode) await recalcMember(oldCode);
    if (newCode && newCode !== oldCode) await recalcMember(newCode);

    await updateGlobalStats();
    await recalcFund();

    alert("Payment updated ✅");
    scheduleReloadAll();
  } catch (err) {
    alert("Update failed: " + (err?.message || err));
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save";
  }
});

reloadPaymentsBtn?.addEventListener("click", scheduleReloadAll);
paySearch?.addEventListener("input", () => {
  clearTimeout(window.__paySearchT);
  window.__paySearchT = setTimeout(loadPaymentsTable, 250);
});
payLimit?.addEventListener("change", loadPaymentsTable);

/* =========================
   Transactions table (same as your code)
========================= */
const txTbody = $("#txTbody");
const reloadTxBtn = $("#reloadTxBtn");
const txSearch = $("#txSearch");
const txLimit = $("#txLimit");

function fmtDate(ts){
  if (!ts) return "-";
  if (ts.toDate) {
    const d = ts.toDate();
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,"0");
    const day = String(d.getDate()).padStart(2,"0");
    return `${y}-${m}-${day}`;
  }
  return "-";
}

async function loadTxTable() {
  if (!txTbody) return;

  txTbody.innerHTML = `<tr><td colspan="6">Loading...</td></tr>`;

  const limit = Number(txLimit?.value || 50);
  const search = (txSearch?.value || "").trim().toLowerCase();

  const snap = await getDocs(collection(db, "transactions"));
  const rows = [];
  snap.forEach(d => rows.push({ id: d.id, ...d.data() }));

  rows.sort((a,b) => {
    const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return tb - ta;
  });

  let filtered = rows;
  if (search) {
    filtered = rows.filter(t => {
      const type = (t.type || "").toLowerCase();
      const title = (t.title || "").toLowerCase();
      const note = (t.note || "").toLowerCase();
      return type.includes(search) || title.includes(search) || note.includes(search);
    });
  }

  filtered = filtered.slice(0, limit);

  if (!filtered.length) {
    txTbody.innerHTML = `<tr><td colspan="6">No transactions</td></tr>`;
    return;
  }

  txTbody.innerHTML = filtered.map(t => `
    <tr data-id="${escapeHtml(t.id)}">
      <td>
        <select class="in" data-k="type">
          <option value="income" ${t.type === "income" ? "selected" : ""}>income</option>
          <option value="expense" ${t.type === "expense" ? "selected" : ""}>expense</option>
        </select>
      </td>
      <td><input class="in" data-k="title" value="${escapeHtml(t.title || "")}" /></td>
      <td><input class="in" data-k="amount" value="${Number(t.amount || 0)}" /></td>
      <td><input class="in" data-k="note" value="${escapeHtml(t.note || "")}" /></td>
      <td>${escapeHtml(fmtDate(t.createdAt))}</td>
      <td style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn btn-primary btn-sm" data-act="saveTx" type="button">Save</button>
        <button class="btn btn-soft btn-sm" data-act="delTx" type="button">Delete</button>
      </td>
    </tr>
  `).join("");
}

txTbody?.addEventListener("click", async (e) => {
  const saveBtn = e.target.closest("[data-act='saveTx']");
  const delBtn = e.target.closest("[data-act='delTx']");
  const tr = e.target.closest("tr");
  const id = tr?.getAttribute("data-id");
  if (!id) return;

  if (delBtn) {
    const ok = confirm("Delete this transaction?");
    if (!ok) return;
    try {
      delBtn.disabled = true;
      delBtn.textContent = "Deleting...";
      await deleteDoc(doc(db, "transactions", id));
      await recalcFund();
      await loadTxTable();
    } catch (err) {
      alert(err?.message || String(err));
    } finally {
      delBtn.disabled = false;
      delBtn.textContent = "Delete";
    }
    return;
  }

  if (!saveBtn) return;

  const inputs = [...tr.querySelectorAll(".in")];
  const data = {};
  inputs.forEach(i => data[i.getAttribute("data-k")] = (i.value || "").trim());

  const type = data.type || "income";
  const title = data.title || "";
  const amount = Number(data.amount || 0);
  const note = data.note || "";

  if (!title || !amount) {
    alert("title and amount required");
    return;
  }

  try {
    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";
    await setDoc(doc(db, "transactions", id), {
      type, title, amount, note,
      updatedAt: serverTimestamp()
    }, { merge: true });
    await recalcFund();
    await loadTxTable();
  } catch (err) {
    alert(err?.message || String(err));
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save";
  }
});

reloadTxBtn?.addEventListener("click", loadTxTable);
txSearch?.addEventListener("input", () => {
  clearTimeout(window.__txSearchT);
  window.__txSearchT = setTimeout(loadTxTable, 250);
});
txLimit?.addEventListener("change", loadTxTable);

/* =========================
   Init loads
========================= */
await Promise.allSettled([
  loadMembersTable(),
  loadPaymentsTable(),
  recalcFund(),
  loadTxTable()
]);
