import { app } from "./firebase.js";
import {
  getDatabase,
  ref,
  set,
  onDisconnect,
  onValue,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";

const db = getDatabase(app);

function getOrCreateVisitorId() {
  const k = "ls_vid";
  let id = localStorage.getItem(k);
  if (!id) {
    id = (crypto.randomUUID ? crypto.randomUUID() : ("v_" + Date.now() + "_" + Math.random().toString(16).slice(2)));
    localStorage.setItem(k, id);
  }
  return id;
}

const vid = getOrCreateVisitorId();
const myRef = ref(db, `presence/${vid}`);

async function goOnline() {
  await set(myRef, { online: true, lastSeen: serverTimestamp() });
  onDisconnect(myRef).set(null);
}

goOnline().catch(() => {});

setInterval(() => {
  set(myRef, { online: true, lastSeen: serverTimestamp() }).catch(() => {});
}, 25000);

window.addEventListener("beforeunload", () => {
  set(myRef, null).catch(() => {});
});

const liveEl = document.querySelector("#liveCount");
if (liveEl) {
  const presenceRef = ref(db, "presence");
  onValue(presenceRef, (snap) => {
    const now = Date.now();
    const data = snap.val() || {};
    const STALE_MS = 90000;

    let count = 0;
    for (const k in data) {
      const row = data[k];
      if (!row || row.online !== true) continue;

      const lastSeen = Number(row.lastSeen || 0);
      if (lastSeen && (now - lastSeen) > STALE_MS) continue;

      count++;
    }
    liveEl.textContent = String(count);
  });
}
