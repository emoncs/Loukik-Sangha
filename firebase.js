import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  getAuth,
  setPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAmJYe6zJ_yDS9kvKKBHyLIZdAJogl-ER0",
  authDomain: "loukik-sangha-7df0c.firebaseapp.com",
  projectId: "loukik-sangha-7df0c",
  storageBucket: "loukik-sangha-7df0c.firebasestorage.app",
  messagingSenderId: "913283407503",
  appId: "1:913283407503:web:1a2d75baf3024af9e81afa",
  databaseURL: "https://loukik-sangha-7df0c-default-rtdb.asia-southeast1.firebasedatabase.app"
};

export const ADMIN_EMAIL = "emonshil2@gmail.com";

// ✅ same: export app so other modules can import it
export const app = initializeApp(firebaseConfig);

// ✅ FIX: Messenger/In-app browser safe auth init
export const auth = getAuth(app);

/**
 * ✅ Key fix:
 * Messenger/Facebook in-app browser অনেক সময় localStorage/IndexedDB restrict করে।
 * তাই persistence একটার পর একটা fallback করে set করা হচ্ছে।
 */
async function setBestPersistence() {
  const tries = [
    indexedDBLocalPersistence,      // best (works in most browsers)
    browserLocalPersistence,        // your old one
    browserSessionPersistence,      // fallback
    inMemoryPersistence             // last fallback (still works per session)
  ];

  for (const p of tries) {
    try {
      await setPersistence(auth, p);
      return true;
    } catch (e) {
      // try next persistence silently
    }
  }
  return false;
}

// ✅ IMPORTANT export: data load করার আগে এটাকে await/then করলে Messenger issue যাবে
export const authReady = setBestPersistence();

export const db = getFirestore(app);
