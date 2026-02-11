import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  onDisconnect,
  onValue,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAmJYe6zJ_yDS9kvKKBHyLIZdAJogl-ER0",
  authDomain: "loukik-sangha-7df0c.firebaseapp.com",
  projectId: "loukik-sangha-7df0c",
  storageBucket: "loukik-sangha-7df0c.firebasestorage.app",
  messagingSenderId: "913283407503",
  appId: "1:913283407503:web:1a2d75baf3024af9e81afa",
  databaseURL: "https://loukik-sangha-7df0c-default-rtdb.asia-southeast1.firebasedatabase.app"
};


const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

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
const myRef = ref(db, `presence/${vid}`);
const connectedRef = ref(db, ".info/connected");

onValue(connectedRef, async (snap) => {
  if (snap.val() === true) {
    try {
      await onDisconnect(myRef).set(null);
      await set(myRef, { online: true, lastSeen: serverTimestamp() });
    } catch (e) {
      console.error("presence setup error:", e);
    }
  }
});

setInterval(() => {
  set(myRef, { online: true, lastSeen: serverTimestamp() })
    .catch((e) => console.error("heartbeat error:", e));
}, 25000);

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

      // lastSeen should be number in snapshot; if not, ignore stale filter
      const lastSeen = typeof row.lastSeen === "number" ? row.lastSeen : 0;
      if (lastSeen && (now - lastSeen) > STALE_MS) continue;

      count++;
    }
    liveEl.textContent = String(count);
  });
}
