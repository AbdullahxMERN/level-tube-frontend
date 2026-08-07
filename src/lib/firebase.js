import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCN_PgW8w0Lq3LFZHeZuiBp0TE24rm0Bs8",
  authDomain: "level-tube.firebaseapp.com",
  projectId: "level-tube",
  storageBucket: "level-tube.firebasestorage.app",
  messagingSenderId: "757894268556",
  appId: "1:757894268556:web:32b0f6647c2bb9c9f99da9",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  return idToken;
}

export async function getFirebaseToken() {
  if (auth.currentUser) {
    try {
      return await auth.currentUser.getIdToken();
    } catch (e) {
      console.warn("Error getting Firebase ID token:", e);
      return null;
    }
  }
  return null;
}

export { auth };
