"use client";

import React, { useEffect } from 'react';
import { useLeadStore } from '../store/useLeadStore';
import { Users, Send, MessageCircleReply, CheckCircle } from 'lucide-react';

// Configuração central dos cards. Edite o "label" para mudar o nome do card.
// Adicione ou remova status no array "statuses" para alterar quais leads entram na contagem.
export const DASHBOARD_CARDS = {
  ready: {
    label: "Prontos",
    statuses: ["Pronto para envio", "Pronto para enviar"]
  },
  sent: {
    label: "Enviados",
    statuses: ["Mensagem enviada"]
  },
  responded: {
    label: "Respostas",
    statuses: ["Não respondeu", "Não quer", "Reabordar depois", "Interessado", "Respondeu"]
  },
  closed: {
    label: "Fechados",
    statuses: ["Venda realizada", "Fechado"]
  }
};

export const Dashboard = () => {
  const { leads, sendsTodayCount, resetSendsIfNewDay, runAutoRules, dashboardFilter, setDashboardFilter } = useLeadStore();

  useEffect(() => {
    console.log("Dashboard Version: 2026-05-04 15:40 (Real Status Fix)");
    resetSendsIfNewDay();
    runAutoRules();
    
    // Check auto rules periodically in case tab is left open
    const interval = setInterval(() => {
      resetSendsIfNewDay();
      runAutoRules();
    }, 60000 * 5); // every 5 mins
    
    return () => clearInterval(interval);
  }, [resetSendsIfNewDay, runAutoRules]);

  // Counts derived from actual lead statuses
  const readyLeadsCount = leads.filter(l => DASHBOARD_CARDS.ready.statuses.includes(l.status)).length;
  const sentLeadsCount = leads.filter(l => DASHBOARD_CARDS.sent.statuses.includes(l.status)).length;
  const respondedLeadsCount = leads.filter(l => DASHBOARD_CARDS.responded.statuses.includes(l.status)).length;
  const closedLeadsCount = leads.filter(l => DASHBOARD_CARDS.closed.statuses.includes(l.status)).length;

  const toggleFilter = (filter: string) => {
    if (dashboardFilter === filter) {
      setDashboardFilter(null);
    } else {
      setDashboardFilter(filter);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div 
        onClick={() => toggleFilter('ready')}
        className={`glass-panel p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center cursor-pointer transition-all border-2 ${
          dashboardFilter === 'ready' ? 'border-blue-500 scale-[1.02] shadow-md' : 'border-transparent hover:border-blue-300'
        }`}
      >
        <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 mb-1">
          <Users size={18} />
          <span className="text-sm font-medium uppercase tracking-wider">{DASHBOARD_CARDS.ready.label}</span>
        </div>
        <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{readyLeadsCount}</span>
        <span className="absolute bottom-1 right-2 text-[8px] opacity-20 pointer-events-none">v1.1</span>
      </div>

      <div 
        onClick={() => toggleFilter('sent')}
        className={`glass-panel p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center cursor-pointer transition-all border-2 ${
          dashboardFilter === 'sent' ? 'border-emerald-500 scale-[1.02] shadow-md' : 'border-transparent hover:border-emerald-300'
        }`}
      >
        <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-1">
          <Send size={18} />
          <span className="text-sm font-medium uppercase tracking-wider">{DASHBOARD_CARDS.sent.label}</span>
        </div>
        <div className="flex items-end space-x-1">
          <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{sentLeadsCount}</span>
        </div>
      </div>

      <div 
        onClick={() => toggleFilter('responded')}
        className={`glass-panel p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center cursor-pointer transition-all border-2 ${
          dashboardFilter === 'responded' ? 'border-amber-500 scale-[1.02] shadow-md' : 'border-transparent hover:border-amber-300'
        }`}
      >
        <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 mb-1">
          <MessageCircleReply size={18} />
          <span className="text-sm font-medium uppercase tracking-wider">{DASHBOARD_CARDS.responded.label}</span>
        </div>
        <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{respondedLeadsCount}</span>
      </div>

      <div 
        onClick={() => toggleFilter('closed')}
        className={`glass-panel p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center cursor-pointer transition-all border-2 ${
          dashboardFilter === 'closed' ? 'border-purple-500 scale-[1.02] shadow-md' : 'border-transparent hover:border-purple-300'
        }`}
      >
        <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 mb-1">
          <CheckCircle size={18} />
          <span className="text-sm font-medium uppercase tracking-wider">{DASHBOARD_CARDS.closed.label}</span>
        </div>
        <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{closedLeadsCount}</span>
      </div>
    </div>
  );
};
