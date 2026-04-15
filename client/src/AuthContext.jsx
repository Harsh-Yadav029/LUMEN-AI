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

function friendlyError(code) {
  const map = {
    'auth/email-already-in-use':   'This email is already registered. Try signing in.',
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/weak-password':          'Password must be at least 6 characters.',
    'auth/user-not-found':         'No account found with this email.',
    'auth/wrong-password':         'Incorrect password. Try again.',
    'auth/too-many-requests':      'Too many attempts. Please wait a moment.',
    'auth/popup-closed-by-user':   'Sign-in popup was closed. Please try again.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/requires-recent-login':  'Please sign out and sign back in before making this change.',
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

  const signIn = async () => {
    setError('');
    try { await signInWithPopup(auth, provider); }
    catch (err) { setError(friendlyError(err.code)); }
  };

  const signUpWithEmail = async (name, email, password) => {
    setError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      return { success: true };
    } catch (err) {
      const msg = friendlyError(err.code);
      setError(msg);
      return { success: false, error: msg };
    }
  };

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

  // Accepts object { displayName, username, photoURL }
  // Stores as "DisplayName | @username" in Firebase displayName field
  const updateUserProfile = async ({ displayName, username, photoURL }) => {
    try {
      const combined = username
        ? `${displayName} | @${username}`
        : displayName;

      await updateProfile(auth.currentUser, {
        displayName: combined,
        photoURL:    photoURL ?? auth.currentUser.photoURL,
      });

      // Force React to re-render with updated user object
      setUser(Object.assign(Object.create(Object.getPrototypeOf(auth.currentUser)), auth.currentUser));
      return { success: true };
    } catch (err) {
      return { success: false, error: friendlyError(err.code) };
    }
  };

  // Parse "DisplayName | @username" back into parts
  const getDisplayName = () => {
    const raw = user?.displayName || '';
    return raw.includes(' | @') ? raw.split(' | @')[0] : raw;
  };

  const getUsername = () => {
    const raw = user?.displayName || '';
    return raw.includes(' | @') ? raw.split(' | @')[1] : '';
  };

  const logOut   = () => signOut(auth);
  const getToken = async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  return (
    <AuthContext.Provider value={{
      user,
      currentUser: user,   // alias — ProfileModal uses currentUser
      error,
      setError,
      signIn,
      signUpWithEmail,
      signInWithEmail,
      resetPassword,
      updateUserProfile,
      getDisplayName,
      getUsername,
      logOut,
      getToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);