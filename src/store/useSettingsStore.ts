import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Bank, MessageTemplate, Tabulation, LeadStatusConfig } from '../types';

interface SettingsStore {
  banks: Bank[];
  origins: string[];
  tabulations: Tabulation[];
  messageTemplates: MessageTemplate[];
  leadStatuses: LeadStatusConfig[];
  logoBase64: string | null;
  
  // Actions
  addBank: (name: string, logo?: string) => void;
  updateBank: (id: string, data: Partial<Bank>) => void;
  removeBank: (id: string) => void;
  
  addOrigin: (origin: string) => void;
  removeOrigin: (origin: string) => void;
  
  addTabulation: (name: string) => void;
  updateTabulation: (id: string, name: string) => void;
  removeTabulation: (id: string) => void;
  
  addTemplate: (template: Omit<MessageTemplate, 'id'>) => void;
  updateTemplate: (id: string, data: Partial<MessageTemplate>) => void;
  removeTemplate: (id: string) => void;
  setDefaultTemplate: (id: string) => void;
  
  addLeadStatus: (name: string, color: string) => void;
  updateLeadStatus: (id: string, data: Partial<LeadStatusConfig>) => void;
  removeLeadStatus: (id: string) => void;
  reorderLeadStatuses: (statuses: LeadStatusConfig[]) => void;
  
  reorderBanks: (banks: Bank[]) => void;
  reorderOrigins: (origins: string[]) => void;
  reorderTabulations: (tabulations: Tabulation[]) => void;
  reorderTemplates: (templates: MessageTemplate[]) => void;
  
  setLogo: (base64: string | null) => void;
}

const DEFAULT_BANKS: Bank[] = [
  { id: 'bank-1', name: 'Daycoval', active: true },
  { id: 'bank-2', name: 'BMG', active: true },
  { id: 'bank-3', name: 'Pan', active: true },
  { id: 'bank-4', name: 'C6', active: true },
  { id: 'bank-5', name: 'Olé', active: true },
  { id: 'bank-6', name: 'Master', active: true },
  { id: 'bank-7', name: 'Outros', active: true },
];

const DEFAULT_TABULATIONS: Tabulation[] = [
  { id: 'tab-1', name: 'Primeira abordagem' },
  { id: 'tab-2', name: 'Reabordagem' },
  { id: 'tab-3', name: 'Urgência leve' },
  { id: 'tab-4', name: 'Cliente respondeu' },
  { id: 'tab-5', name: 'Sem resposta' },
];

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'tmpl-1',
    name: 'Abordagem Padrão',
    tabId: 'tab-1',
    content: '💳 Olá, {nome}! Você tem {valor} disponíveis para saque complementar do seu cartão {banco}.\nLiberação rápida em até 48h ✅\nSem aumento de desconto no seu INSS ❌📉\nDigite 1 para receber o link.',
    isActive: true,
    isDefault: true
  }
];

const DEFAULT_STATUSES: LeadStatusConfig[] = [
  { id: 'st-1', name: 'Novo', color: '#94a3b8', active: true },
  { id: 'st-2', name: 'Consultado', color: '#64748b', active: true },
  { id: 'st-3', name: 'Com limite', color: '#10b981', active: true },
  { id: 'st-4', name: 'Sem limite', color: '#ef4444', active: true },
  { id: 'st-5', name: 'Mensagem enviada', color: '#0ea5e9', active: true },
  { id: 'st-6', name: 'Fechado', color: '#059669', active: true },
  { id: 'st-7', name: 'Descartado', color: '#7f1d1d', active: true },
  { id: 'st-8', name: 'Não respondeu', color: '#eab308', active: true },
  { id: 'st-9', name: 'Não quer', color: '#dc2626', active: true },
  { id: 'st-10', name: 'Falecido', color: '#4b5563', active: true },
  { id: 'st-11', name: 'Número inválido', color: '#f97316', active: true },
  { id: 'st-12', name: 'Reabordar depois', color: '#8b5cf6', active: true },
];

const DEFAULT_ORIGINS = ['URA Reversa', 'Lista própria', 'Arquivo TXT', 'Excel', 'Indicação', 'Outro'];

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      banks: DEFAULT_BANKS,
      origins: DEFAULT_ORIGINS,
      tabulations: DEFAULT_TABULATIONS,
      messageTemplates: DEFAULT_TEMPLATES,
      leadStatuses: DEFAULT_STATUSES,
      logoBase64: null,

      addBank: (name, logo) => set((state) => ({
        banks: [...state.banks, { id: crypto.randomUUID(), name, logo, active: true }]
      })),

      updateBank: (id, data) => set((state) => ({
        banks: state.banks.map(b => b.id === id ? { ...b, ...data } : b)
      })),
      
      removeBank: (id) => set((state) => ({
        banks: state.banks.filter(b => b.id !== id)
      })),

      addOrigin: (origin) => set((state) => ({
        origins: state.origins.includes(origin) ? state.origins : [...state.origins, origin]
      })),
      
      removeOrigin: (origin) => set((state) => ({
        origins: state.origins.filter(o => o !== origin)
      })),

      addTabulation: (name) => set((state) => ({
        tabulations: [...state.tabulations, { id: crypto.randomUUID(), name }]
      })),

      updateTabulation: (id, name) => set((state) => ({
        tabulations: state.tabulations.map(t => t.id === id ? { ...t, name } : t)
      })),

      removeTabulation: (id) => set((state) => ({
        tabulations: state.tabulations.filter(t => t.id !== id)
      })),

      addTemplate: (template) => set((state) => ({
        messageTemplates: [...state.messageTemplates, { ...template, id: crypto.randomUUID() }]
      })),

      updateTemplate: (id, data) => set((state) => ({
        messageTemplates: state.messageTemplates.map(t => t.id === id ? { ...t, ...data } : t)
      })),

      removeTemplate: (id) => set((state) => ({
        messageTemplates: state.messageTemplates.filter(t => t.id !== id)
      })),

      setDefaultTemplate: (id) => set((state) => ({
        messageTemplates: state.messageTemplates.map(t => ({
          ...t,
          isDefault: t.id === id
        }))
      })),

      addLeadStatus: (name, color) => set((state) => ({
        leadStatuses: [...state.leadStatuses, { id: crypto.randomUUID(), name, color, active: true }]
      })),
      updateLeadStatus: (id, data) => set((state) => ({
        leadStatuses: state.leadStatuses.map(s => s.id === id ? { ...s, ...data } : s)
      })),
      removeLeadStatus: (id) => set((state) => ({
        leadStatuses: state.leadStatuses.filter(s => s.id !== id)
      })),
      reorderLeadStatuses: (statuses) => set({ leadStatuses: statuses }),

      reorderBanks: (banks) => set({ banks }),
      reorderOrigins: (origins) => set({ origins }),
      reorderTabulations: (tabulations) => set({ tabulations }),
      reorderTemplates: (messageTemplates) => set({ messageTemplates }),

      setLogo: (base64) => set({ logoBase64: base64 })
    }),
    {
      name: 'lkzap-settings-storage',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Migration from string[] banks to Bank[]
          if (Array.isArray(persistedState.banks) && persistedState.banks.length > 0 && typeof persistedState.banks[0] === 'string') {
            persistedState.banks = persistedState.banks.map((name: string, index: number) => ({
              id: `old-${index}`,
              name,
              active: true
            }));
          }
          if (!persistedState.tabulations) persistedState.tabulations = DEFAULT_TABULATIONS;
          if (!persistedState.messageTemplates) persistedState.messageTemplates = DEFAULT_TEMPLATES;
        }
        if (!persistedState.leadStatuses) {
          persistedState.leadStatuses = DEFAULT_STATUSES;
        }
        return persistedState;
      }
    }
  )
);
