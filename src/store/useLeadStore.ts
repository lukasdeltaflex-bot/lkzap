import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { differenceInDays, isSameDay, parseISO } from 'date-fns';
import { Lead, HistoryEntry } from '../types';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc,
  query,
  orderBy,
  onSnapshot
} from 'firebase/firestore';

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
  updateLead: (id: string, data: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => void;
  incrementSendsToday: () => void;
  setCooldown: () => void;
  getNextMessageAndRotate: () => number;
  runAutoRules: () => void;
  resetSendsIfNewDay: () => void;
  syncLeads: () => Promise<void>;
  setLeads: (leads: Lead[]) => void;
  bulkUpdateLeads: (ids: string[], data: Partial<Lead>) => void;
  bulkDeleteLeads: (ids: string[]) => void;
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

      addLead: (leadData) => set((state) => {
        const newLead: Lead = { 
          ...leadData, 
          id: crypto.randomUUID(),
          history: [{ action: 'Lead criado', createdAt: new Date().toISOString() }]
        };
        
        // Async push to firestore if logged in
        if (auth?.currentUser && db) {
          const leadRef = doc(db, `users/${auth.currentUser.uid}/leads`, newLead.id);
          setDoc(leadRef, newLead).catch(console.error);
        }

        return {
          leads: [newLead, ...state.leads]
        };
      }),

      updateLead: async (id, data) => {
        let updatedLeadRef: Lead | null = null;
        
        set((state) => {
          const updatedLeads = state.leads.map(lead => {
            if (lead.id === id) {
              const updatedData = { ...data };
              const history: HistoryEntry[] = [...(lead.history || [])];
              
              // Record significant changes in history
              if (data.availableValue !== undefined && data.availableValue !== lead.availableValue) {
                updatedData.availableValueUpdatedAt = new Date().toISOString();
                history.push({ 
                  action: `Valor alterado: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.availableValue)} -> ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.availableValue)}`, 
                  createdAt: new Date().toISOString() 
                });
              }
              if (data.status && data.status !== lead.status) {
                history.push({ action: `Status alterado: ${lead.status} -> ${data.status}`, createdAt: new Date().toISOString() });
              }
              if (data.bank && data.bank !== lead.bank) {
                history.push({ action: `Banco alterado: ${lead.bank} -> ${data.bank}`, createdAt: new Date().toISOString() });
              }
              if (data.queue && data.queue !== lead.queue) {
                history.push({ action: `Fila alterada: ${lead.queue} -> ${data.queue}`, createdAt: new Date().toISOString() });
              }
              if (data.lastSendDate && data.lastSendDate !== lead.lastSendDate) {
                history.push({ action: 'Mensagem enviada', createdAt: new Date().toISOString() });
              }

              const finalLead = { ...lead, ...updatedData, history };
              updatedLeadRef = finalLead;
              return finalLead;
            }
            return lead;
          });
          return { leads: updatedLeads };
        });

        // Sync to firestore with await as requested
        if (updatedLeadRef && auth?.currentUser && db) {
          try {
            const leadRef = doc(db, `users/${auth.currentUser.uid}/leads`, id);
            await setDoc(leadRef, updatedLeadRef);
          } catch (error) {
            console.error("Erro ao salvar edição do lead:", error);
            throw error; // Re-throw to be handled by the UI
          }
        }
      },

      deleteLead: (id) => set((state) => {
        if (auth?.currentUser && db) {
          const leadRef = doc(db, `users/${auth.currentUser.uid}/leads`, id);
          deleteDoc(leadRef).catch(console.error);
        }
        return {
          leads: state.leads.filter(lead => lead.id !== id)
        };
      }),

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
      }),

      setLeads: (leads) => set({ leads }),

      syncLeads: async () => {
        if (!auth?.currentUser || !db) return;
        const leadsRef = collection(db, `users/${auth.currentUser.uid}/leads`);
        try {
          const snapshot = await getDocs(leadsRef);
          const firestoreLeads = snapshot.docs.map(doc => doc.data() as Lead);
          
          if (firestoreLeads.length > 0) {
            set({ leads: firestoreLeads });
          } else {
            // If firestore is empty but local has leads, push local to firestore
            const localLeads = get().leads;
            if (localLeads.length > 0) {
              for (const lead of localLeads) {
                const leadRef = doc(db, `users/${auth.currentUser.uid}/leads`, lead.id);
                await setDoc(leadRef, lead);
              }
            }
          }
        } catch (error) {
          console.error("Erro ao sincronizar leads:", error);
        }
      },

      bulkUpdateLeads: (ids, data) => set((state) => {
        const now = new Date().toISOString();
        const updatedLeads = state.leads.map(lead => {
          if (ids.includes(lead.id)) {
            const updatedData = { ...data };
            const history: HistoryEntry[] = [...(lead.history || [])];

            if (data.status && data.status !== lead.status) {
              history.push({ action: `[Massa] Status: ${lead.status} -> ${data.status}`, createdAt: now });
            }
            if (data.bank && data.bank !== lead.bank) {
              history.push({ action: `[Massa] Banco: ${lead.bank} -> ${data.bank}`, createdAt: now });
            }
            if (data.queue && data.queue !== lead.queue) {
              history.push({ action: `[Massa] Fila: ${lead.queue} -> ${data.queue}`, createdAt: now });
            }
            if (data.origin && data.origin !== lead.origin) {
              history.push({ action: `[Massa] Origem: ${lead.origin} -> ${data.origin}`, createdAt: now });
            }
            if (data.selectedTemplateId && data.selectedTemplateId !== lead.selectedTemplateId) {
              history.push({ action: `[Massa] Modelo alterado`, createdAt: now });
            }

            const finalLead = { ...lead, ...updatedData, history };
            
            if (auth?.currentUser && db) {
              const leadRef = doc(db!, `users/${auth!.currentUser!.uid}/leads`, lead.id);
              setDoc(leadRef, finalLead).catch(console.error);
            }
            return finalLead;
          }
          return lead;
        });
        return { leads: updatedLeads };
      }),

      bulkDeleteLeads: (ids) => set((state) => {
        if (auth?.currentUser && db) {
          ids.forEach(id => {
            const leadRef = doc(db!, `users/${auth!.currentUser!.uid}/leads`, id);
            deleteDoc(leadRef).catch(console.error);
          });
        }
        return {
          leads: state.leads.filter(lead => !ids.includes(lead.id))
        };
      })
    }),
    {
      name: 'lkzap-leads-storage',
    }
  )
);
