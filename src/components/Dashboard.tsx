"use client";

import React, { useEffect } from 'react';
import { useLeadStore } from '../store/useLeadStore';
import { Users, Send, MessageCircleReply, CheckCircle } from 'lucide-react';

export const Dashboard = () => {
  const { leads, sendsTodayCount, resetSendsIfNewDay, runAutoRules } = useLeadStore();

  useEffect(() => {
    resetSendsIfNewDay();
    runAutoRules();
    
    // Check auto rules periodically in case tab is left open
    const interval = setInterval(() => {
      resetSendsIfNewDay();
      runAutoRules();
    }, 60000 * 5); // every 5 mins
    
    return () => clearInterval(interval);
  }, [resetSendsIfNewDay, runAutoRules]);

  const readyLeads = leads.filter(l => l.status === 'Com limite' && l.queue === 'Pronto para enviar').length;
  const respondedLeads = leads.filter(l => l.lastAction === 'Respondeu' || l.lastAction === 'Interessado').length;
  const closedLeads = leads.filter(l => l.status === 'Fechado').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="glass-panel p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
        <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 mb-1">
          <Users size={18} />
          <span className="text-sm font-medium uppercase tracking-wider">Prontos</span>
        </div>
        <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{readyLeads}</span>
      </div>

      <div className="glass-panel p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
        <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-1">
          <Send size={18} />
          <span className="text-sm font-medium uppercase tracking-wider">Enviados</span>
        </div>
        <div className="flex items-end space-x-1">
          <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{sendsTodayCount}</span>
          <span className="text-sm text-slate-500 mb-1 font-medium">/ 20</span>
        </div>
      </div>

      <div className="glass-panel p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
        <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 mb-1">
          <MessageCircleReply size={18} />
          <span className="text-sm font-medium uppercase tracking-wider">Respostas</span>
        </div>
        <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{respondedLeads}</span>
      </div>

      <div className="glass-panel p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
        <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 mb-1">
          <CheckCircle size={18} />
          <span className="text-sm font-medium uppercase tracking-wider">Fechados</span>
        </div>
        <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{closedLeads}</span>
      </div>
    </div>
  );
};
