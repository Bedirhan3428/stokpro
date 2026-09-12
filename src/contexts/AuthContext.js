"use client";

// src/contexts/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { ARTIFACT_DOC_ID } from "../config";
import { recordUserLogin, logUserActivity } from "../utils/telemetryLogger";

const AuthContext = createContext();
export function useAuth() { return useContext(AuthContext); }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // create profile under artifacts/{ARTIFACT_DOC_ID}/users/{uid}
  async function createProfileIfMissing(uid, userInfo = {}) {
    try {
      const userRef = doc(db, "artifacts", ARTIFACT_DOC_ID, "users", uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, {
          email: userInfo.email || null,
          displayName: userInfo.displayName || null,
          createdAt: serverTimestamp()
        });
      } else if (userInfo.displayName && (!snap.data().displayName || snap.data().displayName !== userInfo.displayName)) {
        // keep profile displayName in sync if missing
        await updateDoc(userRef, { displayName: userInfo.displayName });
      }
    } catch (err) {
      console.warn("createProfileIfMissing failed:", err);
    }
  }

  // signup now accepts displayName
  async function signup(email, password, displayName = "") {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    try {
      if (displayName) {
        await updateProfile(cred.user, { displayName });
      }
    } catch (e) {}
    await createProfileIfMissing(cred.user.uid, { email: cred.user.email, displayName: displayName || cred.user.displayName });
    recordUserLogin(cred.user, "email_signup").catch(() => {});
    logUserActivity("AUTH_SIGNUP", "Yeni Kullanıcı Kaydı", { email, displayName }, { uid: cred.user.uid, email: cred.user.email }).catch(() => {});
    return cred;
  }

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    recordUserLogin(cred.user, "email_password").catch(() => {});
    return cred;
  }

  async function logout() {
    const u = auth.currentUser;
    if (u) {
      logUserActivity("AUTH_LOGOUT", "Kullanıcı Çıkış Yaptı", {}, { uid: u.uid, email: u.email }).catch(() => {});
    }
    return signOut(auth);
  }

  async function signInWithGoogle() {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const uid = result.user.uid;
      await createProfileIfMissing(uid, { email: result.user.email, displayName: result.user.displayName });
      recordUserLogin(result.user, "google_sso").catch(() => {});
      return result;
    } catch (err) {
      throw err;
    }
  }

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    signInWithGoogle,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}