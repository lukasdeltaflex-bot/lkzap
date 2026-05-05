"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../lib/firebase";
import { useAuthStore } from "../store/useAuthStore";
import { useLeadStore } from "../store/useLeadStore";
import { useSettingsStore } from "../store/useSettingsStore";

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { setAuthState } = useAuthStore() as any;
  const { syncLeads } = useLeadStore();
  const { syncSettings } = useSettingsStore();

  useEffect(() => {
    // If Firebase failed to initialize (missing keys during build), stop here
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      
      if (setAuthState) {
        setAuthState(firebaseUser);
      }

      if (firebaseUser) {
        // Start sync when user is authenticated
        syncLeads().catch(console.error);
        syncSettings().catch(console.error);
      }
    });

    return () => unsubscribe();
  }, [setAuthState, syncLeads, syncSettings]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
