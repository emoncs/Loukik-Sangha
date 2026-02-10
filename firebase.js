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
  appId: "1:913283407503:web:1a2d75baf3024af9e81afa"
};
const firebaseConfig = {
  apiKey: "AIzaSyAmJYe6zJ_yDS9kvKKBHyLIZdAJogl-ER0",
  authDomain: "loukik-sangha-7df0c.firebaseapp.com",
  projectId: "loukik-sangha-7df0c",
  storageBucket: "loukik-sangha-7df0c.firebasestorage.app",
  messagingSenderId: "913283407503",
  appId: "1:913283407503:web:1a2d75baf3024af9e81afa",

  // ✅ ADD THIS (Realtime DB URL)
  databaseURL: "https://loukik-sangha-7df0c-default-rtdb.firebaseio.com"
};

export const ADMIN_EMAIL = "emonshil2@gmail.com";

export const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence
});

export const db = getFirestore(app);

