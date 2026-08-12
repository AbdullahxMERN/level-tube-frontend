import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";

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

// Set persistence to LOCAL so Google users stay logged in across browser restarts.
// This is the Firebase default, but we set it explicitly to be safe.
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
}

/**
 * A promise that resolves once Firebase has finished restoring the auth session.
 * Firebase Auth is async on init — auth.currentUser is null until onAuthStateChanged fires.
 * Without this, getFirebaseToken() called on page load returns null (even if user is logged in),
 * causing a 401 → logout for Google users returning after a browser restart.
 */
const authReadyPromise =
  typeof window !== "undefined"
    ? new Promise((resolve) => {
        const unsub = onAuthStateChanged(auth, (user) => {
          unsub(); // unsubscribe after first event
          resolve(user);
        });
      })
    : Promise.resolve(null);

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  return idToken;
}

/**
 * Returns a fresh Firebase ID token for the current Google user.
 * Waits for Firebase to finish its async session restore before checking currentUser,
 * so this works correctly even on the very first call after a page reload / browser restart.
 */
export async function getFirebaseToken() {
  // Wait for Firebase to finish restoring the session (no-op if already done)
  await authReadyPromise;

  if (auth.currentUser) {
    try {
      // forceRefresh=false: Firebase SDK will auto-refresh if the token is near expiry
      return await auth.currentUser.getIdToken(false);
    } catch (e) {
      console.warn("Error getting Firebase ID token:", e);
      return null;
    }
  }
  return null;
}

export { auth };
