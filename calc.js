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

function normalizeYYYYMM(v) {
  // Accept: "2025-8", "2025-08", "2025/8", "2025-8-01"
  const s = String(v || "").trim().replaceAll("/", "-");
  const m = s.match(/^(\d{4})-(\d{1,2})/);
  if (!m) return "";
  const y = Number(m[1]);
  const mm = String(Number(m[2])).padStart(2, "0");
  return `${y}-${mm}`;
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
   Recalc one member
   expected = months(join->current) * monthlyDue
   due = max(expected - paid, 0)
   advance = max(paid - expected, 0)
========================= */
export async function recalcMember(memberCode) {
  const code = String(memberCode || "").trim();
  if (!code) return;

  const memRef = doc(db, "members", code);
  const memSnap = await getDoc(memRef);
  if (!memSnap.exists()) return;

  const m = memSnap.data() || {};

  const joinMonth = normalizeYYYYMM(m.joinMonth);
  const currentMonth = currentYYYYMM();

  const monthlyDue = Number(m.monthlyDue || 0);

  // If joinMonth invalid, don't break dashboard
  const months = joinMonth ? monthsInclusive(joinMonth, currentMonth) : 0;
  const expected = months * monthlyDue;

  const payQ = query(collection(db, "payments"), where("memberCode", "==", code));
  const paySnap = await getDocs(payQ);

  let totalPaid = 0;
  paySnap.forEach(d => totalPaid += Number(d.data().amount || 0));

  const due = Math.max(expected - totalPaid, 0);
  const advance = Math.max(totalPaid - expected, 0);

  await setDoc(memRef, {
    totalPaid,
    expectedTillNow: expected,
    due,
    advance,
    lastRecalcAt: serverTimestamp()
  }, { merge: true });
}

/* =========================
   Update global stats (members sum)
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
