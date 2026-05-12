import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Bank, MessageTemplate, Tabulation, LeadStatusConfig, Tag } from '../types';
import { db, auth } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export interface DashboardCardConfig {
  id: string;
  statusName: string;
  label: string;
  visible: boolean;
  order: number;
  color?: string;
}

interface SettingsStore {
  banks: Bank[];
  origins: string[];
  tabulations: Tabulation[];
  messageTemplates: MessageTemplate[];
  leadStatuses: LeadStatusConfig[];
  tags: Tag[];
  logoBase64: string | null;
  dashboardCards: DashboardCardConfig[];
  
  // Actions
  updateDashboardCard: (id: string, data: Partial<DashboardCardConfig>) => void;
  addDashboardCard: () => void;
  removeDashboardCard: (id: string) => void;
  reorderDashboardCards: (cards: DashboardCardConfig[]) => void;
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
  
  addTag: (label: string, color: string) => void;
  updateTag: (id: string, data: Partial<Tag>) => void;
  removeTag: (id: string) => void;
  
  reorderBanks: (banks: Bank[]) => void;
  reorderOrigins: (origins: string[]) => void;
  reorderTabulations: (tabulations: Tabulation[]) => void;
  reorderTemplates: (templates: MessageTemplate[]) => void;
  
  setLogo: (base64: string | null) => void;
  syncSettings: () => Promise<void>;
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
    content: '💳 {nome}, você tem *{valor} DISPONÍVEIS* para saque complementar do seu cartão {banco}!\n\nLiberação rápida em até *48h* ✅\n*SEM* aumento de desconto! ❌📉\n*Valor será depositado na sua conta.* 💰🏦\n\n👉 Digite *1* para *Receber o link* de confirmação e liberação.',
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
  { id: 'st-13', name: 'Novo da URA', color: '#f59e0b', active: true },
  { id: 'st-14', name: 'Aguardando consulta', color: '#6366f1', active: true },
];

const DEFAULT_TAGS: Tag[] = [
  { id: 'tag-1', label: '🔥 Quente', color: '#ef4444' },
  { id: 'tag-2', label: '❄️ Frio', color: '#3b82f6' },
  { id: 'tag-3', label: '⚠️ Conferir CPF', color: '#f59e0b' },
  { id: 'tag-4', label: '⏰ Retornar', color: '#8b5cf6' },
  { id: 'tag-5', label: '💰 Possui saque', color: '#10b981' },
  { id: 'tag-6', label: '🚫 Não quer', color: '#dc2626' },
];

const DEFAULT_ORIGINS = ['URA Reversa', 'Lista própria', 'Arquivo TXT', 'Excel', 'Indicação', 'Outro'];

const DEFAULT_DASHBOARD_CARDS: DashboardCardConfig[] = [
  { id: "1", statusName: "Com limite", label: "Prontos", visible: true, order: 1, color: "blue" },
  { id: "2", statusName: "Mensagem enviada", label: "Enviados", visible: true, order: 2, color: "emerald" },
  { id: "3", statusName: "Não respondeu", label: "Respostas", visible: true, order: 3, color: "amber" },
  { id: "4", statusName: "Fechado", label: "Fechados", visible: true, order: 4, color: "purple" }
];

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => {
      const pushSettings = async (data: any) => {
        if (!auth?.currentUser || !db) return;
        const settingsRef = doc(db, `users/${auth.currentUser.uid}/settings`, 'config');
        try {
          await setDoc(settingsRef, data, { merge: true });
        } catch (e) {
          console.error("Error pushing settings:", e);
        }
      };

      return {
      banks: DEFAULT_BANKS,
      origins: DEFAULT_ORIGINS,
      tabulations: DEFAULT_TABULATIONS,
      messageTemplates: DEFAULT_TEMPLATES,
      leadStatuses: DEFAULT_STATUSES,
      tags: DEFAULT_TAGS,
      logoBase64: null,
      dashboardCards: DEFAULT_DASHBOARD_CARDS,

      updateDashboardCard: (id, data) => set((state) => ({
        dashboardCards: (state.dashboardCards || DEFAULT_DASHBOARD_CARDS).map(c => c.id === id ? { ...c, ...data } : c)
      })),

      addDashboardCard: () => set((state) => {
        const currentCards = state.dashboardCards || [];
        const nextOrder = currentCards.length > 0 
          ? Math.max(...currentCards.map(c => c.order)) + 1 
          : 1;
        const firstStatus = state.leadStatuses[0]?.name || "Novo";
        
        const newCard: DashboardCardConfig = {
          id: crypto.randomUUID(),
          label: "Novo card",
          statusName: firstStatus,
          visible: true,
          order: nextOrder,
          color: "blue"
        };
        
        return { dashboardCards: [...currentCards, newCard] };
      }),

      removeDashboardCard: (id) => set((state) => ({
        dashboardCards: (state.dashboardCards || []).filter(c => c.id !== id)
      })),

      reorderDashboardCards: (cards) => set({ dashboardCards: cards }),

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
      
      addTag: (label, color) => set((state) => ({
        tags: [...(state.tags || []), { id: crypto.randomUUID(), label, color }]
      })),
      updateTag: (id, data) => set((state) => ({
        tags: (state.tags || []).map(t => t.id === id ? { ...t, ...data } : t)
      })),
      removeTag: (id) => set((state) => ({
        tags: (state.tags || []).filter(t => t.id !== id)
      })),

      reorderBanks: (banks) => set({ banks }),
      reorderOrigins: (origins) => set({ origins }),
      reorderTabulations: (tabulations) => set({ tabulations }),
      reorderTemplates: (messageTemplates) => set({ messageTemplates }),

      setLogo: (base64) => {
        set({ logoBase64: base64 });
        pushSettings({ logoBase64: base64 });
      },

      syncSettings: async () => {
        if (!auth?.currentUser || !db) return;
        const settingsRef = doc(db, `users/${auth.currentUser.uid}/settings`, 'config');
        try {
          const snapshot = await getDoc(settingsRef);
          if (snapshot.exists()) {
            const data = snapshot.data();
            set({
              banks: data.banks || DEFAULT_BANKS,
              origins: data.origins || DEFAULT_ORIGINS,
              tabulations: data.tabulations || DEFAULT_TABULATIONS,
              messageTemplates: data.messageTemplates || DEFAULT_TEMPLATES,
              leadStatuses: data.leadStatuses || DEFAULT_STATUSES,
              tags: data.tags || DEFAULT_TAGS,
              logoBase64: data.logoBase64 || null,
              dashboardCards: data.dashboardCards || DEFAULT_DASHBOARD_CARDS
            });
          } else {
            // Push local settings to firestore if firestore is empty
            const state = get();
            pushSettings({
              banks: state.banks,
              origins: state.origins,
              tabulations: state.tabulations,
              messageTemplates: state.messageTemplates,
              leadStatuses: state.leadStatuses,
              tags: state.tags,
              logoBase64: state.logoBase64,
              dashboardCards: state.dashboardCards
            });
          }
        } catch (e) {
          console.error("Error syncing settings:", e);
        }
      }
    };
  },
    {
      name: 'lkzap-settings-storage',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
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
        if (!persistedState.dashboardCards) {
          persistedState.dashboardCards = DEFAULT_DASHBOARD_CARDS;
        }
        if (!persistedState.tags) {
          persistedState.tags = DEFAULT_TAGS;
        }
        
        // Migration to fix broken emojis/templates
        if (Array.isArray(persistedState.messageTemplates)) {
          persistedState.messageTemplates = persistedState.messageTemplates.map((t: MessageTemplate) => {
            if (t.content.includes('') || t.content.includes('\uFFFD')) {
              return { ...t, content: DEFAULT_TEMPLATES[0].content };
            }
            return t;
          });
        }

        return persistedState;
      }
    }
  )
);
