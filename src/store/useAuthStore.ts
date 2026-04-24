import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthStore {
  isAuthenticated: boolean;
  user: { login: string } | null;
  
  // Actions
  login: (login: string, pass: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,

      login: (login: string, pass: string) => {
        if (login === 'admin' && pass === '123456') {
          set({ isAuthenticated: true, user: { login } });
          return true;
        }
        return false;
      },

      logout: () => set({ isAuthenticated: false, user: null })
    }),
    {
      name: 'lkzap-auth-storage',
    }
  )
);
