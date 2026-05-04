"use client";

import React, { useEffect, useState } from 'react';
import { useLeadStore } from '../store/useLeadStore';
import { Users, Send, MessageCircleReply, CheckCircle } from 'lucide-react';

export const Dashboard = () => {
  const { leads, resetSendsIfNewDay, runAutoRules, dashboardFilter, setDashboardFilter } = useLeadStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    resetSendsIfNewDay();
    runAutoRules();
    
    const interval = setInterval(() => {
      resetSendsIfNewDay();
      runAutoRules();
    }, 60000 * 5);
    
    return () => clearInterval(interval);
  }, [leads, resetSendsIfNewDay, runAutoRules]);

  if (!hydrated) return null;

  // Fixed counts based on requirements
  const readyCount = (leads || []).filter(l => 
    ['Com limite', 'Pronto para envio', 'Pronto para enviar'].includes(l.status)
  ).length;

  const sentCount = (leads || []).filter(l => 
    l.status === 'Mensagem enviada'
  ).length;

  const respondedCount = (leads || []).filter(l => 
    ['Não respondeu', 'Não quer', 'Reabordar depois', 'Interessado', 'Respondeu'].includes(l.status)
  ).length;

  const closedCount = (leads || []).filter(l => 
    ['Venda realizada', 'Fechado'].includes(l.status)
  ).length;

  const toggleFilter = (cardId: string) => {
    if (dashboardFilter === cardId) {
      setDashboardFilter(null);
    } else {
      setDashboardFilter(cardId);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div 
        onClick={() => toggleFilter('ready')}
        className={`glass-panel p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center cursor-pointer transition-all border-2 relative overflow-hidden ${
          dashboardFilter === 'ready' ? 'border-blue-500 scale-[1.02] shadow-md' : 'border-transparent hover:border-blue-300'
        }`}
      >
        <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 mb-1">
          <Users size={18} />
          <span className="text-sm font-medium uppercase tracking-wider">Prontos</span>
        </div>
        <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{readyCount}</span>
      </div>

      <div 
        onClick={() => toggleFilter('sent')}
        className={`glass-panel p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center cursor-pointer transition-all border-2 relative overflow-hidden ${
          dashboardFilter === 'sent' ? 'border-emerald-500 scale-[1.02] shadow-md' : 'border-transparent hover:border-emerald-300'
        }`}
      >
        <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-1">
          <Send size={18} />
          <span className="text-sm font-medium uppercase tracking-wider">Enviados</span>
        </div>
        <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{sentCount}</span>
      </div>

      <div 
        onClick={() => toggleFilter('responded')}
        className={`glass-panel p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center cursor-pointer transition-all border-2 relative overflow-hidden ${
          dashboardFilter === 'responded' ? 'border-amber-500 scale-[1.02] shadow-md' : 'border-transparent hover:border-amber-300'
        }`}
      >
        <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400 mb-1">
          <MessageCircleReply size={18} />
          <span className="text-sm font-medium uppercase tracking-wider">Respostas</span>
        </div>
        <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{respondedCount}</span>
      </div>

      <div 
        onClick={() => toggleFilter('closed')}
        className={`glass-panel p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center cursor-pointer transition-all border-2 relative overflow-hidden ${
          dashboardFilter === 'closed' ? 'border-purple-500 scale-[1.02] shadow-md' : 'border-transparent hover:border-purple-300'
        }`}
      >
        <div className="flex items-center space-x-2 text-purple-600 dark:text-purple-400 mb-1">
          <CheckCircle size={18} />
          <span className="text-sm font-medium uppercase tracking-wider">Fechados</span>
        </div>
        <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{closedCount}</span>
      </div>
    </div>
  );
};
