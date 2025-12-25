
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

export async function signInWithEmail(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signUpWithEmail(email: string, password: string) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signInWithGoogle() {
  // Use redirect instead of popup to avoid COOP issues
  await signInWithRedirect(auth, googleProvider);
}

export async function handleGoogleRedirect() {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      return result.user;
    }
    return null;
  } catch (error) {
    console.error('Google redirect error:', error);
    throw error;
  }
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
