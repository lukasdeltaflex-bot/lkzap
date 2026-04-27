import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { differenceInDays, isSameDay, parseISO } from 'date-fns';
import { Lead } from '../types';

interface LeadStore {
  leads: Lead[];
  sendsTodayCount: number;
  lastSendDate: string | null;
  messageIndex: number;
  dashboardFilter: string | null;
  cooldownUntil: number | null;
  
  // Actions
  setDashboardFilter: (filter: string | null) => void;
  addLead: (lead: Omit<Lead, 'id'>) => void;
  updateLead: (id: string, data: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  incrementSendsToday: () => void;
  setCooldown: () => void;
  getNextMessageAndRotate: () => number;
  runAutoRules: () => void;
  resetSendsIfNewDay: () => void;
}

export const useLeadStore = create<LeadStore>()(
  persist(
    (set, get) => ({
      leads: [],
      sendsTodayCount: 0,
      lastSendDate: null,
      messageIndex: 0,
      dashboardFilter: null,
      cooldownUntil: null,

      setDashboardFilter: (filter) => set({ dashboardFilter: filter }),

      addLead: (leadData) => set((state) => ({
        leads: [{ ...leadData, id: crypto.randomUUID() }, ...state.leads]
      })),

      updateLead: (id, data) => set((state) => ({
        leads: state.leads.map(lead => lead.id === id ? { ...lead, ...data } : lead)
      })),

      deleteLead: (id) => set((state) => ({
        leads: state.leads.filter(lead => lead.id !== id)
      })),

      incrementSendsToday: () => set((state) => {
        const today = new Date().toISOString();
        return {
          sendsTodayCount: state.sendsTodayCount + 1,
          lastSendDate: today
        };
      }),

      setCooldown: () => set(() => ({
        cooldownUntil: Date.now() + 45000 // 45 seconds from now
      })),

      getNextMessageAndRotate: () => {
        const { messageIndex } = get();
        set({ messageIndex: (messageIndex + 1) % 3 });
        return messageIndex;
      },

      runAutoRules: () => set((state) => {
        const today = new Date();
        const updatedLeads = state.leads.map(lead => {
          let updatedLead = { ...lead };
          const consultDate = parseISO(lead.consultDate);
          
          // Rule 1: 3 days past consult -> outdated visual flag
          if (differenceInDays(today, consultDate) >= 3) {
            updatedLead.outdated = true;
          } else {
            updatedLead.outdated = false; // remove flag if valid
          }
          
          // Rule 2: "Não respondeu" after 2 days -> move to "Reabordar"
          if (lead.lastAction === 'Não respondeu' && lead.lastSendDate) {
            const sendDate = parseISO(lead.lastSendDate);
            if (differenceInDays(today, sendDate) >= 2) {
              updatedLead.queue = 'Reabordar';
            }
          }

          return updatedLead;
        });

        return { leads: updatedLeads };
      }),

      resetSendsIfNewDay: () => set((state) => {
        if (!state.lastSendDate) return state;
        const lastSend = parseISO(state.lastSendDate);
        if (!isSameDay(lastSend, new Date())) {
          return { sendsTodayCount: 0, lastSendDate: new Date().toISOString() };
        }
        return state;
      })
    }),
    {
      name: 'lkzap-leads-storage',
    }
  )
);
