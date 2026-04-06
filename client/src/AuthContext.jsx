import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth, provider } from './firebase.js';

const AuthContext = createContext(null);

// BUG 4 FIX: Human-readable Firebase error messages
function friendlyError(code) {
  const map = {
    'auth/email-already-in-use':    'This email is already registered. Try signing in.',
    'auth/invalid-email':           'Please enter a valid email address.',
    'auth/weak-password':           'Password must be at least 6 characters.',
    'auth/user-not-found':          'No account found with this email.',
    'auth/wrong-password':          'Incorrect password. Try again.',
    'auth/too-many-requests':       'Too many attempts. Please wait a moment.',
    'auth/popup-closed-by-user':    'Sign-in popup was closed. Please try again.',
    'auth/network-request-failed':  'Network error. Check your connection.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(undefined);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u ?? null));
    return unsub;
  }, []);

  // Google sign-in
  const signIn = async () => {
    setError('');
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(friendlyError(err.code));
    }
  };

  // BUG 4 FIX: Email/password registration
  const signUpWithEmail = async (name, email, password) => {
    setError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      // Set display name immediately after creation
      await updateProfile(cred.user, { displayName: name });
      return { success: true };
    } catch (err) {
      const msg = friendlyError(err.code);
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // BUG 4 FIX: Email/password sign-in
  const signInWithEmail = async (email, password) => {
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (err) {
      const msg = friendlyError(err.code);
      setError(msg);
      return { success: false, error: msg };
    }
  };

  // Password reset email
  const resetPassword = async (email) => {
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err) {
      const msg = friendlyError(err.code);
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const logOut = () => signOut(auth);

  const getToken = async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  return (
    <AuthContext.Provider value={{
      user,
      error,
      setError,
      signIn,
      signUpWithEmail,
      signInWithEmail,
      resetPassword,
      logOut,
      getToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
