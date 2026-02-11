import { app } from "./firebase.js";
import {
  getDatabase,
  ref,
  set,
  onDisconnect,
  onValue,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";

const rtdb = getDatabase(app);

function getOrCreateVisitorId() {
  const k = "ls_vid";
  let id = localStorage.getItem(k);
  if (!id) {
    id = (crypto.randomUUID
      ? crypto.randomUUID()
      : ("v_" + Date.now() + "_" + Math.random().toString(16).slice(2)));
    localStorage.setItem(k, id);
  }
  return id;
}

const vid = getOrCreateVisitorId();
const myRef = ref(rtdb, `presence/${vid}`);
const connectedRef = ref(rtdb, ".info/connected");

onValue(connectedRef, async (snap) => {
  if (snap.val() === true) {
    await onDisconnect(myRef).set(null);
    await set(myRef, { online: true, lastSeen: serverTimestamp() });
  }
});

setInterval(() => {
  set(myRef, { online: true, lastSeen: serverTimestamp() }).catch(console.error);
}, 25000);

const liveEl = document.querySelector("#liveCount");
if (liveEl) {
  const presenceRef = ref(rtdb, "presence");
  onValue(presenceRef, (snap) => {
    const now = Date.now();
    const data = snap.val() || {};
    const STALE_MS = 90000;

    let count = 0;
    for (const k in data) {
      const row = data[k];
      if (!row || row.online !== true) continue;

      const lastSeen = typeof row.lastSeen === "number" ? row.lastSeen : 0;
      if (lastSeen && (now - lastSeen) > STALE_MS) continue;

      count++;
    }
    liveEl.textContent = String(count);
  });
}
