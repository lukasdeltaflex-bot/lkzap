import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthStore {
  isAuthenticated: boolean;
  user: { 
    uid: string;
    email: string | null;
    displayName: string | null;
  } | null;
  
  // Actions
  setAuthState: (firebaseUser: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,

      setAuthState: (firebaseUser) => {
        if (firebaseUser) {
          set({ 
            isAuthenticated: true, 
            user: { 
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName
            } 
          });
        } else {
          set({ isAuthenticated: false, user: null });
        }
      },

      logout: () => set({ isAuthenticated: false, user: null })
    }),
    {
      name: 'lkzap-auth-storage',
    }
  )
);
