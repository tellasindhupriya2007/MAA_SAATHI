import React, { createContext, useState, useEffect } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS, validateFirestoreDocument } from '../config/firebaseSchema';

export const AuthContext = createContext();

const AUTH_ERROR_MESSAGES = {
  'auth/configuration-not-found':
    'Firebase Google Sign-In is not configured for this project. Update your .env Firebase keys and enable Google sign-in in Firebase Console.',
  'auth/invalid-api-key':
    'Firebase API key is invalid. Update VITE_FIREBASE_API_KEY in your .env file.',
  'auth/unauthorized-domain':
    'This domain is not authorized for Firebase Auth. Add localhost in Firebase Authentication authorized domains.'
};

const isFirestoreAccessError = (error) => {
  const code = String(error?.code || '');
  const message = String(error?.message || '');

  return (
    code === 'permission-denied' ||
    code === 'unavailable' ||
    message.includes('Cloud Firestore API has not been used') ||
    message.includes('client is offline')
  );
};

const normalizeAuthError = (error) => {
  const code = error?.code || '';
  const fallbackMessage = error?.message || 'Google sign-in failed.';
  const message = AUTH_ERROR_MESSAGES[code] || fallbackMessage;

  const normalized = new Error(message);
  normalized.code = code;
  normalized.cause = error;
  return normalized;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      console.log("[AUTH] State Changed:", authUser?.email);
      if (authUser) {
        setUser(authUser);
        try {
          const profileRef = doc(db, COLLECTIONS.users, authUser.uid);
          const profileSnap = await getDoc(profileRef);

          if (profileSnap.exists()) {
            console.log("[AUTH] Profile Loaded:", profileSnap.data().role);
            setProfile(profileSnap.data());
          } else {
            // New User: Don't create dummy if we are expecting setup flow
            console.log("[AUTH] No existing profile. Waiting for role orientation.");
            setProfile(null);
          }
        } catch (error) {
          console.error("[AUTH] Firestore Access Error:", error);
          // If Firestore API is truly disabled/missing, then use mock for Dev speed
          if (isFirestoreAccessError(error)) {
             const mock = { uid: authUser.uid, name: authUser.displayName || 'Dev User', role: 'mother', isSurveyCompleted: true };
             setProfile(mock);
          }
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Safety loading timeout to prevent permanent blank screen on Firebase connection issues
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.warn('Firebase connection taking too long. Forcing app initialization.');
        setLoading(false);
      }
    }, 3000); // 3 second grace period
    return () => clearTimeout(timer);
  }, [loading]);

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const loggedInUser = result.user;
      const profileRef = doc(db, COLLECTIONS.users, loggedInUser.uid);

      try {
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setProfile(data);
          setUser(loggedInUser);
          return { isNewUser: false, profile: data };
        }
      } catch (error) {
        if (isFirestoreAccessError(error)) {
          setUser(loggedInUser);
          setProfile(null);
          return {
            isNewUser: true,
            user: loggedInUser,
            firestoreUnavailable: true,
            firestoreMessage:
              'Google sign-in succeeded, but Cloud Firestore is unavailable. Enable Firestore API / fix permissions and retry.'
          };
        }
        throw error;
      }

      setUser(loggedInUser);
      setProfile(null);
      return { isNewUser: true, user: loggedInUser };
    } catch (error) {
      throw normalizeAuthError(error);
    }
  };

  const setupRole = async (role, patientType = '', isSurveyCompleted = false) => {
    if (!user) throw new Error('No user authenticated');

    const profileData = {
      uid: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'Unknown User',
      email: user.email || '',
      photoURL: user.photoURL || '',
      role,
      patientType,
      isSurveyCompleted,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const profileRef = doc(db, COLLECTIONS.users, user.uid);
    validateFirestoreDocument('users', profileData);
    await setDoc(profileRef, profileData);

    setProfile(profileData);
    return profileData;
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (data) => {
    if (!user) return;
    const profileRef = doc(db, COLLECTIONS.users, user.uid);
    const profilePatch = {
      ...data,
      updatedAt: serverTimestamp()
    };
    validateFirestoreDocument('users', profilePatch, { partial: true });
    await setDoc(
      profileRef,
      profilePatch,
      { merge: true }
    );

    const profileSnap = await getDoc(profileRef);
    setProfile(profileSnap.data());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        loginWithGoogle,
        setupRole,
        logout,
        updateProfile
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
