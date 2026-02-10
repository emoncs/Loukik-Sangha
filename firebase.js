import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
import {
  initializeAuth,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAmJYe6zJ_yDS9kvKKBHyLIZdAJogl-ER0",
  authDomain: "loukik-sangha-7df0c.firebaseapp.com",
  projectId: "loukik-sangha-7df0c",
  storageBucket: "loukik-sangha-7df0c.firebasestorage.app",
  messagingSenderId: "913283407503",
  appId: "1:913283407503:web:1a2d75baf3024af9e81afa",

  // ✅ add for Realtime Database (Presence / Live Visitors)
  databaseURL: "https://loukik-sangha-7df0c-default-rtdb.firebaseio.com"
};

export const ADMIN_EMAIL = "emonshil2@gmail.com";

// ✅ changed: export app so other modules (live-visitors.js) can import it
export const app = initializeApp(firebaseConfig);

/**
 * ✅ Key fix:
 * initializeAuth with browserLocalPersistence
 * -> page change / refresh হলেও logout হবে না
 */
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence
});

export const db = getFirestore(app);
