import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsStore {
  banks: string[];
  origins: string[];
  logoBase64: string | null;
  
  // Actions
  addBank: (bank: string) => void;
  removeBank: (bank: string) => void;
  addOrigin: (origin: string) => void;
  removeOrigin: (origin: string) => void;
  setLogo: (base64: string | null) => void;
}

const DEFAULT_BANKS = ['Daycoval', 'BMG', 'Pan', 'C6', 'Olé', 'Master', 'Outros'];
const DEFAULT_ORIGINS = ['URA Reversa', 'Lista própria', 'Arquivo TXT', 'Excel', 'Indicação', 'Outro'];

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      banks: DEFAULT_BANKS,
      origins: DEFAULT_ORIGINS,
      logoBase64: null,

      addBank: (bank) => set((state) => ({
        banks: state.banks.includes(bank) ? state.banks : [...state.banks, bank]
      })),
      
      removeBank: (bank) => set((state) => ({
        banks: state.banks.filter(b => b !== bank)
      })),

      addOrigin: (origin) => set((state) => ({
        origins: state.origins.includes(origin) ? state.origins : [...state.origins, origin]
      })),
      
      removeOrigin: (origin) => set((state) => ({
        origins: state.origins.filter(o => o !== origin)
      })),

      setLogo: (base64) => set({ logoBase64: base64 })
    }),
    {
      name: 'lkzap-settings-storage',
    }
  )
);
