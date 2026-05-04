"use client";

import React, { useEffect, useState } from 'react';
import { useLeadStore } from '../store/useLeadStore';
import { useSettingsStore, DashboardCardConfig } from '../store/useSettingsStore';
import { Users, Send, MessageCircleReply, CheckCircle, LucideIcon } from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  blue: Users,
  emerald: Send,
  amber: MessageCircleReply,
  purple: CheckCircle
};

const DEFAULT_FALLBACK_CARDS: DashboardCardConfig[] = [
  { id: "1", statusName: "Com limite", label: "Prontos", visible: true, order: 1, color: "blue" },
  { id: "2", statusName: "Mensagem enviada", label: "Enviados", visible: true, order: 2, color: "emerald" },
  { id: "3", statusName: "Não respondeu", label: "Respostas", visible: true, order: 3, color: "amber" },
  { id: "4", statusName: "Fechado", label: "Fechados", visible: true, order: 4, color: "purple" }
];

export const Dashboard = () => {
  const { leads, resetSendsIfNewDay, runAutoRules, dashboardFilter, setDashboardFilter } = useLeadStore();
  const { dashboardCards, leadStatuses } = useSettingsStore();
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
  }, []); // Run only once on mount

  if (!hydrated) return null;

  const cardsToRender = (dashboardCards && dashboardCards.length > 0) 
    ? dashboardCards 
    : DEFAULT_FALLBACK_CARDS;

  const visibleCards = cardsToRender
    .filter(c => c.visible)
    .sort((a, b) => a.order - b.order);

  const toggleFilter = (cardStatusName: string) => {
    if (dashboardFilter === cardStatusName) {
      setDashboardFilter(null);
    } else {
      setDashboardFilter(cardStatusName);
    }
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {visibleCards.length === 0 ? (
        <div className="col-span-full py-12 glass-panel rounded-2xl text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
          <Users size={32} className="mx-auto text-slate-300 mb-2" />
          <p className="text-slate-500 font-medium">Nenhum card configurado para exibição.</p>
        </div>
      ) : (
        visibleCards.map((card) => {
          const statusConfig = (leadStatuses || []).find(s => s.name === card.statusName);
          const statusColor = statusConfig?.color || '#94a3b8';
          const Icon = ICON_MAP[card.color || 'blue'] || Users;
          const count = (leads || []).filter(l => l.status === card.statusName).length;
          const isActive = dashboardFilter === card.statusName;

          return (
            <div 
              key={card.id}
              onClick={() => toggleFilter(card.statusName)}
              className={`glass-panel p-4 rounded-xl shadow-sm flex flex-col items-center justify-center text-center cursor-pointer transition-all border-2 relative overflow-hidden ${
                isActive ? 'scale-[1.02] shadow-md' : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700'
              }`}
              style={{ 
                borderColor: isActive ? statusColor : 'transparent'
              }}
            >
              <div 
                className="flex items-center space-x-2 mb-1"
                style={{ color: statusColor }}
              >
                <Icon size={18} />
                <span className="text-sm font-medium uppercase tracking-wider">{card.label}</span>
              </div>
              <span className="text-3xl font-bold text-slate-800 dark:text-slate-100">{count}</span>
              
              {/* Active Indicator Bar */}
              {isActive && (
                <div 
                  className="absolute bottom-0 left-0 right-0 h-1"
                  style={{ backgroundColor: statusColor }}
                />
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
