"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useLeadStore } from '../store/useLeadStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { generateWhatsAppLink, generateReabordagemLink } from '../lib/whatsapp';
import { exportToExcel, exportToPDF } from '../lib/export';
import { Lead } from '../types';
import { formatDisplayPhone, formatCPF } from '../lib/utils';
import { 
  MessageCircle, 
  RefreshCw, 
  ChevronRight, 
  AlertCircle, 
  Search, 
  Filter, 
  Download, 
  Upload as UploadIcon, 
  XCircle,
  FileSpreadsheet,
  FileText
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ImportModal } from './ImportModal';

export const LeadTable = () => {
  const { leads, updateLead, cooldownUntil, setCooldown, incrementSendsToday, getNextMessageAndRotate } = useLeadStore();
  const { banks, origins } = useSettingsStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterBank, setFilterBank] = useState('');
  const [filterOrigin, setFilterOrigin] = useState('');
  const [filterStatus, setFilterStatus] = useState('Com limite');
  const [filterQueue, setFilterQueue] = useState('Pronto para enviar');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isCooldownActive = !!(cooldownUntil && now < cooldownUntil);
  const cooldownSeconds = isCooldownActive ? Math.ceil((cooldownUntil - now) / 1000) : 0;

  // Search logic with Debounce-like behavior (handled by stable state)
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.cpf.includes(searchTerm) ||
        lead.phone.includes(searchTerm);
      
      const matchesBank = filterBank === '' || lead.bank === filterBank;
      const matchesOrigin = filterOrigin === '' || lead.origin === filterOrigin;
      const matchesStatus = filterStatus === '' || lead.status === filterStatus;
      const matchesQueue = filterQueue === '' || lead.queue === filterQueue;

      return matchesSearch && matchesBank && matchesOrigin && matchesStatus && matchesQueue;
    });
  }, [leads, searchTerm, filterBank, filterOrigin, filterStatus, filterQueue]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterBank('');
    setFilterOrigin('');
    setFilterStatus('');
    setFilterQueue('');
  };

  const handleSendWhatsApp = (lead: Lead) => {
    if (isCooldownActive) return;

    const msgIndex = getNextMessageAndRotate();
    const link = generateWhatsAppLink(lead, msgIndex);
    
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
    try {
      return format(parseISO(isoStr), 'dd/MM/yyyy');
    } catch {
      return 'N/A';
    }
  };

  const handleNextClient = () => {
    const targetLeads = [...filteredLeads].filter(l => l.status === 'Com limite' && l.queue === 'Pronto para enviar');
    
    targetLeads.sort((a, b) => {
      if (b.availableValue !== a.availableValue) {
        return b.availableValue - a.availableValue;
      }
      return parseISO(b.consultDate).getTime() - parseISO(a.consultDate).getTime();
    });

    if (targetLeads.length > 0) {
      handleSendWhatsApp(targetLeads[0]);
    } else {
      alert("Nenhum cliente disponível nos filtros atuais para disparo automático.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Advanced Filters */}
      <div className="glass-panel p-4 rounded-xl flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Buscar por nome, CPF ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100 dark:placeholder-slate-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-lg font-semibold border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100 transition-colors whitespace-nowrap"
            >
              <UploadIcon size={18} />
              <span className="hidden sm:inline">Importar</span>
            </button>
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button 
                onClick={() => exportToExcel(filteredLeads)}
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                title="Exportar Excel"
              >
                <FileSpreadsheet size={20} />
              </button>
              <button 
                onClick={() => exportToPDF(filteredLeads)}
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                title="Exportar PDF"
              >
                <FileText size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100"
          >
            <option value="">Filtro Status</option>
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
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100"
          >
            <option value="">Filtro Fila</option>
            <option value="Pronto para enviar">Pronto para enviar</option>
            <option value="Aguardando">Aguardando</option>
            <option value="Frio">Frio</option>
            <option value="Reabordar">Reabordar</option>
          </select>

          <select 
            value={filterBank} 
            onChange={(e) => setFilterBank(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100"
          >
            <option value="">Todos Bancos</option>
            {banks.map(bank => <option key={bank} value={bank}>{bank}</option>)}
          </select>

          <select 
            value={filterOrigin} 
            onChange={(e) => setFilterOrigin(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100"
          >
            <option value="">Todas Origens</option>
            {origins.map(origin => <option key={origin} value={origin}>{origin}</option>)}
          </select>

          <button 
            onClick={clearFilters}
            className="flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-red-500 transition-colors font-medium"
          >
            <XCircle size={16} /> Limpar Filtros
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="text-sm text-slate-500 font-medium">
          Exibindo <span className="text-emerald-600 dark:text-emerald-400 font-bold">{filteredLeads.length}</span> de <span className="font-bold">{leads.length}</span> leads
        </div>
        <button 
          onClick={handleNextClient}
          disabled={isCooldownActive}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-md active:scale-95 text-sm"
        >
          {isCooldownActive ? `Cooldown: ${cooldownSeconds}s` : 'Chamar Próximo'}
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4">Nome / Origin</th>
                <th className="px-6 py-4">CPF / Tel</th>
                <th className="px-6 py-4">Banco</th>
                <th className="px-6 py-4 text-right">Valor</th>
                <th className="px-6 py-4">Status / Fila</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <p className="font-medium text-lg mb-1">Nenhum resultado encontrado</p>
                    <p className="text-sm">Tente ajustar seus filtros ou termos de pesquisa.</p>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                          {lead.name}
                          {lead.outdated && (
                            <span title="Dados desatualizados">
                              <AlertCircle size={14} className="text-red-500" />
                            </span>
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-tighter">{lead.origin || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      <div className="flex flex-col text-slate-500 dark:text-slate-400">
                        <span className="text-xs opacity-70">{formatCPF(lead.cpf)}</span>
                        <span className="font-bold text-slate-700 dark:text-slate-100">
                          {formatDisplayPhone(lead.phone)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-1 rounded text-[10px] font-bold">
                        {lead.bank}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(lead.availableValue)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{lead.status}</span>
                        <span className="text-[10px] text-slate-400">{lead.queue}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => handleSendWhatsApp(lead)}
                        disabled={isCooldownActive}
                        className="p-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30 disabled:opacity-50 transition-colors"
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle size={18} />
                      </button>
                      <button
                        onClick={() => handleReabordar(lead)}
                        className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
                        title="Reabordagem Rápida"
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

      <ImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
      />
    </div>
  );
};
