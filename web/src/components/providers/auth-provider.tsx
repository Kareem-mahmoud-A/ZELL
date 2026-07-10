"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User as FirebaseUser,
  UserCredential,
  onIdTokenChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Role } from "@zell/shared";

interface AuthContextType {
  user: FirebaseUser | null;
  role: Role | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<UserCredential>;
  register: (email: string, pass: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerification: (u: FirebaseUser) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          const tokenResult = await firebaseUser.getIdTokenResult();
          const userRole = (tokenResult.claims.role as Role) || Role.CUSTOMER;
          setRole(userRole);

          await fetch("/api/auth/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken: tokenResult.token }),
          });
        } else {
          setUser(null);
          setRole(null);
          await fetch("/api/auth/session", { method: "DELETE" });
        }
      } catch (error) {
        console.error("Auth state synchronization error:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass);
  const register = (email: string, pass: string) =>
    createUserWithEmailAndPassword(auth, email, pass);
  const logout = () => signOut(auth);
  const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);
  const sendVerification = (u: FirebaseUser) => sendEmailVerification(u);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        login,
        register,
        logout,
        resetPassword,
        sendVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
