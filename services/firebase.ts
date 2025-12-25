import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCNynasG9b9_02n5lOPE4F1NFk30pP1zpo",
  authDomain: "dialysisconnect-9629c.firebaseapp.com",
  projectId: "dialysisconnect-9629c",
  storageBucket: "dialysisconnect-9629c.firebasestorage.app",
  messagingSenderId: "148357664507",
  appId: "1:148357664507:web:1cda91178bfce1599f6a5e",
  measurementId: "G-RC3805J2QH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

const GOOGLE_REDIRECT_KEY = 'google_auth_pending';

export async function signInWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signUpWithEmail(email: string, password: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signInWithGoogle() {
  // Set flag before redirect so we know to check for result on return
  sessionStorage.setItem(GOOGLE_REDIRECT_KEY, 'true');
  await signInWithRedirect(auth, googleProvider);
}

export async function handleGoogleRedirect() {
  // Only check for redirect result if we initiated a redirect
  const isPending = sessionStorage.getItem(GOOGLE_REDIRECT_KEY);
  if (!isPending) {
    return null;
  }

  try {
    const result = await getRedirectResult(auth);
    // Clear the flag regardless of result
    sessionStorage.removeItem(GOOGLE_REDIRECT_KEY);

    if (result) {
      return result.user;
    }
    return null;
  } catch (error) {
    sessionStorage.removeItem(GOOGLE_REDIRECT_KEY);
    console.error('Google redirect error:', error);
    throw error;
  }
}

export function isGoogleRedirectPending() {
  return sessionStorage.getItem(GOOGLE_REDIRECT_KEY) === 'true';
}

export async function getIdToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');
  return user.getIdToken();
}

export async function logOut() {
  await signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export type { User };
