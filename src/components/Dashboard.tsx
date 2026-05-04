"use client";

import React, { useEffect, useState } from 'react';
import { useLeadStore } from '../store/useLeadStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { Users, Send, MessageCircleReply, CheckCircle, LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  blue: Users,
  emerald: Send,
  amber: MessageCircleReply,
  purple: CheckCircle
};

const COLOR_MAP: Record<string, string> = {
  blue: 'text-blue-600 dark:text-blue-400 border-blue-500 hover:border-blue-300',
  emerald: 'text-emerald-600 dark:text-emerald-400 border-emerald-500 hover:border-emerald-300',
  amber: 'text-amber-600 dark:text-amber-400 border-amber-500 hover:border-amber-300',
  purple: 'text-purple-600 dark:text-purple-400 border-purple-500 hover:border-purple-300'
};

export const Dashboard = () => {
  const { leads, resetSendsIfNewDay, runAutoRules, dashboardFilter, setDashboardFilter } = useLeadStore();
  const { dashboardCards } = useSettingsStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    
    // Diagnostic: Count leads by status
    const statusCounts = (leads || []).reduce((acc: Record<string, number>, lead) => {
      if (lead && lead.status) {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
      }
      return acc;
    }, {});
    console.log("Diagnóstico de Status dos Leads:");
    console.table(statusCounts);

    resetSendsIfNewDay();
    runAutoRules();
    
    const interval = setInterval(() => {
      resetSendsIfNewDay();
      runAutoRules();
    }, 60000 * 5);
    
    return () => clearInterval(interval);
  }, [leads, resetSendsIfNewDay, runAutoRules]);

  if (!hydrated) return null;

  const toggleFilter = (cardId: string) => {
    if (dashboardFilter === cardId) {
      setDashboardFilter(null);
    } else {
      setDashboardFilter(cardId);
    }
  };

  const visibleCards = (dashboardCards || [])
    .filter(c => c.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {visibleCards.map((card) => {
        const Icon = ICON_MAP[card.color || 'blue'] || Users;
        const colorClasses = COLOR_MAP[card.color || 'blue'] || COLOR_MAP.blue;
        const cardStatuses = card.statuses || [];
        const count = (leads || []).filter(l => cardStatuses.includes(l.status)).length;
        const isActive = dashboardFilter === card.id;

        return (
          <div 
            key={card.id}
            onClick={() => toggleFilter(card.id)}
            className={`glass-panel p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center cursor-pointer transition-all border-2 relative overflow-hidden ${
              isActive ? colorClasses.split(' ')[2] + ' scale-[1.02] shadow-md' : 'border-transparent ' + colorClasses.split(' ').slice(3).join(' ')
            }`}
          >
            <div className={`flex items-center space-x-2 mb-1 ${colorClasses.split(' ')[0]} ${colorClasses.split(' ')[1]}`}>
              <Icon size={18} />
              <span className="text-sm font-medium uppercase tracking-wider">{card.label}</span>
            </div>
            <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{count}</span>
          </div>
        );
      })}
    </div>
  );
};
