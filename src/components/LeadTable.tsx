"use client";

import React, { useState, useEffect } from 'react';
import { useLeadStore } from '../store/useLeadStore';
import { generateWhatsAppLink, generateReabordagemLink } from '../lib/whatsapp';
import { Lead } from '../types';
import { MessageCircle, RefreshCw, ChevronRight, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const LeadTable = () => {
  const { leads, updateLead, cooldownUntil, setCooldown, incrementSendsToday, getNextMessageAndRotate } = useLeadStore();
  
  const [filterStatus, setFilterStatus] = useState<string>('Com limite');
  const [filterQueue, setFilterQueue] = useState<string>('Pronto para enviar');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isCooldownActive = !!(cooldownUntil && now < cooldownUntil);
  const cooldownSeconds = isCooldownActive ? Math.ceil((cooldownUntil - now) / 1000) : 0;

  const filteredLeads = leads.filter(lead => {
    if (filterStatus && lead.status !== filterStatus) return false;
    if (filterQueue && lead.queue !== filterQueue) return false;
    return true;
  });

  const handleSendWhatsApp = (lead: Lead) => {
    if (isCooldownActive) return;

    const msgIndex = getNextMessageAndRotate();
    const link = generateWhatsAppLink(lead, msgIndex);
    
    // Update lead
    updateLead(lead.id, {
      status: 'Mensagem enviada',
      lastAction: 'Chamado hoje',
      lastSendDate: new Date().toISOString()
    });

    incrementSendsToday();
    setCooldown();

    window.open(link, '_blank');
  };

  const handleReabordar = (lead: Lead) => {
    const link = generateReabordagemLink(lead);
    
    updateLead(lead.id, {
      lastAction: 'Chamado hoje',
      lastSendDate: new Date().toISOString()
    });

    window.open(link, '_blank');
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const formatDate = (isoStr: string) => {
    return format(parseISO(isoStr), 'dd/MM/yyyy');
  };

  const handleNextClient = () => {
    const targetLeads = leads.filter(l => l.status === 'Com limite' && l.queue === 'Pronto para enviar');
    
    // Sort by largest value first, then most recent date
    targetLeads.sort((a, b) => {
      if (b.availableValue !== a.availableValue) {
        return b.availableValue - a.availableValue;
      }
      return parseISO(b.consultDate).getTime() - parseISO(a.consultDate).getTime();
    });

    if (targetLeads.length > 0) {
      handleSendWhatsApp(targetLeads[0]);
    } else {
      alert("Nenhum cliente 'Com limite' e 'Pronto para enviar' foi encontrado na fila!");
    }
  };

  return (
    <div className="glass-panel rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded-lg block p-2.5 outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Todos Status</option>
            <option value="Novo">Novo</option>
            <option value="Consultado">Consultado</option>
            <option value="Com limite">Com limite</option>
            <option value="Sem limite">Sem limite</option>
            <option value="Mensagem enviada">Mensagem enviada</option>
            <option value="Fechado">Fechado</option>
            <option value="Descartado">Descartado</option>
          </select>

          <select 
            value={filterQueue} 
            onChange={(e) => setFilterQueue(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm rounded-lg block p-2.5 outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Todas Filas</option>
            <option value="Pronto para enviar">Pronto para enviar</option>
            <option value="Aguardando">Aguardando</option>
            <option value="Frio">Frio</option>
            <option value="Reabordar">Reabordar</option>
          </select>
        </div>

        <button 
          onClick={handleNextClient}
          disabled={isCooldownActive}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-md active:scale-95"
        >
          {isCooldownActive ? `Aguarde ${cooldownSeconds}s` : 'Próximo Cliente'}
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th scope="col" className="px-6 py-4 rounded-tl-lg">Nome</th>
              <th scope="col" className="px-6 py-4">Banco</th>
              <th scope="col" className="px-6 py-4">Valor Disp.</th>
              <th scope="col" className="px-6 py-4">Status / Fila</th>
              <th scope="col" className="px-6 py-4">Data Consulta</th>
              <th scope="col" className="px-6 py-4 text-right rounded-tr-lg">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                  Nenhum lead encontrado para os filtros atuais.
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                       {lead.outdated && <span title="Desatualizado (Consulta antiga)"><AlertCircle size={16} className="text-red-500" /></span>}
                       {lead.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md text-xs font-semibold">
                      {lead.bank}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(lead.availableValue)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        {lead.status}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                        {lead.queue}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {formatDate(lead.consultDate)}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => handleSendWhatsApp(lead)}
                      disabled={isCooldownActive}
                      className="inline-flex items-center justify-center p-2 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Enviar WhatsApp"
                    >
                      <MessageCircle size={18} />
                    </button>
                    <button
                      onClick={() => handleReabordar(lead)}
                      className="inline-flex items-center justify-center p-2 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/30 transition-colors"
                      title="Reabordar"
                    >
                      <RefreshCw size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
