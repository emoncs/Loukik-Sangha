import {
  doc, getDoc, setDoc, getDocs, collection, query, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";
import { db } from "./firebase.js";

/* =========================
   Date Helpers
========================= */
export function monthStartTimestampFromYYYYMM(yyyymm) {
  const s = String(yyyymm || "").trim().replaceAll("/", "-");
  const m = s.match(/^(\d{4})-(\d{1,2})/);
  if (!m) return new Date();
  const y = Number(m[1]);
  const mm = Number(m[2]);
  return new Date(y, mm - 1, 1);
}

// ✅ Month name support
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

function normalizeYYYYMM(v) {
  // Accepts:
  // "2025-8", "2025/08", "2025-8-01"
  // "2025-oct", "2025-october"
  // "oct-2025", "October 2025"
  // "12-oct-2025", "12/10/2025", "12 oct 2025" (month+year extract)
  const raw = String(v || "").trim();
  if (!raw) return "";

  const s = raw.toLowerCase().replace(/\s+/g, " ").replaceAll("/", "-").trim();

  // 1) YYYY-MM
  let m = s.match(/^(\d{4})-(\d{1,2})/);
  if (m) {
    const y = Number(m[1]);
    const mm = Number(m[2]);
    if (mm >= 1 && mm <= 12) return `${y}-${pad2(mm)}`;
    return "";
  }

  // 2) YYYY-MMM / YYYY-monthname
  m = s.match(/^(\d{4})-([a-z]{3,9})$/);
  if (m) {
    const y = Number(m[1]);
    const key = m[2];
    const mm = MONTHS[key] ?? MONTHS[key.slice(0, 3)];
    if (mm) return `${y}-${pad2(mm)}`;
  }

  // 3) MMM-YYYY or "month YYYY"
  m = s.match(/^([a-z]{3,9})[-\s](\d{4})$/);
  if (m) {
    const key = m[1];
    const y = Number(m[2]);
    const mm = MONTHS[key] ?? MONTHS[key.slice(0, 3)];
    if (mm) return `${y}-${pad2(mm)}`;
  }

  // 4) MM-YYYY
  m = s.match(/^(\d{1,2})-(\d{4})$/);
  if (m) {
    const mm = Number(m[1]);
    const y = Number(m[2]);
    if (mm >= 1 && mm <= 12) return `${y}-${pad2(mm)}`;
  }

  // 5) DD-MMM-YYYY or DD-MM-YYYY (extract month/year)
  m = s.match(/^(\d{1,2})-([a-z]{3,9}|\d{1,2})-(\d{4})$/);
  if (m) {
    const mid = m[2];
    const y = Number(m[3]);
    let mm = 0;
    if (/^\d{1,2}$/.test(mid)) mm = Number(mid);
    else mm = MONTHS[mid] ?? MONTHS[mid.slice(0, 3)] ?? 0;
    if (mm >= 1 && mm <= 12) return `${y}-${pad2(mm)}`;
  }

  // 6) last resort: native date parse
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const mm = d.getMonth() + 1;
    return `${y}-${pad2(mm)}`;
  }

  return "";
}

function currentYYYYMM() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function monthsInclusive(fromYYYYMM, toYYYYMMStr) {
  const f = normalizeYYYYMM(fromYYYYMM);
  const t = normalizeYYYYMM(toYYYYMMStr);
  if (!f || !t) return 0;

  const [fy, fm] = f.split("-").map(Number);
  const [ty, tm] = t.split("-").map(Number);

  const diff = (ty * 12 + tm) - (fy * 12 + fm);
  return diff >= 0 ? diff + 1 : 0; // inclusive
}

/* =========================
   Find member doc (supports addDoc + setDoc patterns)
========================= */
async function findMemberDocRefByCode(codeRaw) {
  const code = String(codeRaw || "").trim();
  if (!code) return null;

  // 1) docId == code
  const directRef = doc(db, "members", code);
  const directSnap = await getDoc(directRef);
  if (directSnap.exists()) return directRef;

  // 2) field match memberCode == code
  const q1 = query(collection(db, "members"), where("memberCode", "==", code));
  const s1 = await getDocs(q1);
  if (!s1.empty) return doc(db, "members", s1.docs[0].id);

  return null;
}

/* =========================
   Recalc one member
========================= */
export async function recalcMember(memberCode) {
  const code = String(memberCode || "").trim();
  if (!code) return;

  const memRef = await findMemberDocRefByCode(code);
  if (!memRef) return;

  const memSnap = await getDoc(memRef);
  if (!memSnap.exists()) return;

  const m = memSnap.data() || {};

  const joinMonth = normalizeYYYYMM(m.joinMonth);
  const currentMonth = currentYYYYMM();
  const monthlyDue = Number(m.monthlyDue || 0);

  const months = joinMonth ? monthsInclusive(joinMonth, currentMonth) : 0;
  const expected = months * monthlyDue;

  const payQ = query(collection(db, "payments"), where("memberCode", "==", code));
  const paySnap = await getDocs(payQ);

  let totalPaid = 0;
  paySnap.forEach(d => {
    const p = d.data() || {};
    if (p.archived) return;
    totalPaid += Number(p.amount || 0);
  });

  const due = Math.max(expected - totalPaid, 0);
  const advance = Math.max(totalPaid - expected, 0);

  await setDoc(memRef, {
    totalPaid,
    expectedTillNow: expected,
    due,
    advance,
    // optional: store normalized joinMonth so future calc never breaks
    ...(joinMonth ? { joinMonth } : {}),
    lastRecalcAt: serverTimestamp()
  }, { merge: true });
}

/* =========================
   Update global stats
========================= */
export async function updateGlobalStats() {
  const snap = await getDocs(collection(db, "members"));

  let totalMembers = 0;
  let totalCollectedYTD = 0;
  let totalDues = 0;
  let totalAdvance = 0;

  snap.forEach(d => {
    const m = d.data() || {};
    totalMembers += 1;
    totalCollectedYTD += Number(m.totalPaid || 0);
    totalDues += Number(m.due || 0);
    totalAdvance += Number(m.advance || 0);
  });

  await setDoc(doc(db, "stats", "global"), {
    totalMembers,
    totalCollectedYTD,
    totalDues,
    totalAdvance,
    updatedAt: serverTimestamp()
  }, { merge: true });
}
