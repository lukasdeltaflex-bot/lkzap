"use client";

import React, { useEffect } from 'react';
import { useLeadStore } from '../store/useLeadStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Users, Send, MessageCircleReply, CheckCircle } from 'lucide-react';

export const Dashboard = () => {
  const { leads, sendsTodayCount, resetSendsIfNewDay, runAutoRules, dashboardFilter, setDashboardFilter } = useLeadStore();
  const { dashboardCards } = useSettingsStore();

  useEffect(() => {
    // Diagnostic: Count leads by status
    const statusCounts = leads.reduce((acc: Record<string, number>, lead) => {
      acc[lead.status] = (acc[lead.status] || 0) + 1;
      return acc;
    }, {});
    console.log("Diagnóstico de Status dos Leads:");
    console.table(statusCounts);

    resetSendsIfNewDay();
    runAutoRules();
    
    // Check auto rules periodically in case tab is left open
    const interval = setInterval(() => {
      resetSendsIfNewDay();
      runAutoRules();
    }, 60000 * 5); // every 5 mins
    
    return () => clearInterval(interval);
  }, [leads, resetSendsIfNewDay, runAutoRules]);

  if (!dashboardCards || !dashboardCards.ready) {
    return <div className="h-32 flex items-center justify-center">Carregando...</div>;
  }

  // Counts derived from actual lead statuses using central config from settings store
  const readyLeadsCount = leads.filter(l => dashboardCards.ready.statuses.includes(l.status)).length;
  const sentLeadsCount = leads.filter(l => dashboardCards.sent.statuses.includes(l.status)).length;
  const respondedLeadsCount = leads.filter(l => dashboardCards.responded.statuses.includes(l.status)).length;
  const closedLeadsCount = leads.filter(l => dashboardCards.closed.statuses.includes(l.status)).length;

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
          <span className="text-sm font-medium uppercase tracking-wider">{dashboardCards.ready.label}</span>
        </div>
        <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{readyLeadsCount}</span>
      </div>

      <div 
        onClick={() => toggleFilter('sent')}
        className={`glass-panel p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center cursor-pointer transition-all border-2 ${
          dashboardFilter === 'sent' ? 'border-emerald-500 scale-[1.02] shadow-md' : 'border-transparent hover:border-emerald-300'
        }`}
      >
        <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mb-1">
          <Send size={18} />
          <span className="text-sm font-medium uppercase tracking-wider">{dashboardCards.sent.label}</span>
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
          <span className="text-sm font-medium uppercase tracking-wider">{dashboardCards.responded.label}</span>
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
          <span className="text-sm font-medium uppercase tracking-wider">{dashboardCards.closed.label}</span>
        </div>
        <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{closedLeadsCount}</span>
      </div>
    </div>
  );
};
