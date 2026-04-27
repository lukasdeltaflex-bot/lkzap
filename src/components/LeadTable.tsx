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
  ChevronRight, 
  AlertCircle, 
  Search, 
  Filter, 
  Upload as UploadIcon, 
  XCircle,
  FileSpreadsheet,
  FileText,
  Edit2,
  Trash2,
  Copy,
  Check
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ImportModal } from './ImportModal';
import { EditLeadModal } from './EditLeadModal';

export const LeadTable = () => {
  const { leads, updateLead, deleteLead, cooldownUntil, setCooldown, incrementSendsToday, dashboardFilter, setDashboardFilter } = useLeadStore();
  const { banks, origins, messageTemplates, leadStatuses } = useSettingsStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterBank, setFilterBank] = useState('');
  const [filterOrigin, setFilterOrigin] = useState('');
  const [filterStatus, setFilterStatus] = useState('Com limite');
  const [filterQueue, setFilterQueue] = useState('Pronto para enviar');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [now, setNow] = useState(Date.now());
  const [copiedCpf, setCopiedCpf] = useState<string | null>(null);

  const getBankInfo = (bankName: string) => {
    return banks.find(b => (typeof b === 'string' ? b : b.name) === bankName);
  };

  const getStatusColor = (statusName: string) => {
    const status = leadStatuses.find(s => s.name === statusName);
    return status?.color || '#94a3b8';
  };

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isCooldownActive = !!(cooldownUntil && now < cooldownUntil);
  const cooldownSeconds = isCooldownActive ? Math.ceil((cooldownUntil - now) / 1000) : 0;

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.cpf.includes(searchTerm) ||
        lead.phone.includes(searchTerm);
      
      const matchesBank = filterBank === '' || lead.bank === filterBank;
      const matchesOrigin = filterOrigin === '' || lead.origin === filterOrigin;
      
      if (dashboardFilter === 'ready') {
        if (lead.status !== 'Com limite' || lead.queue !== 'Pronto para enviar') return false;
      } else if (dashboardFilter === 'sent') {
        if (lead.status !== 'Mensagem enviada') return false;
      } else if (dashboardFilter === 'responded') {
        if (lead.lastAction !== 'Respondeu' && lead.lastAction !== 'Interessado') return false;
      } else if (dashboardFilter === 'closed') {
        if (lead.status !== 'Fechado') return false;
      } else {
        const matchesStatus = filterStatus === '' || lead.status === filterStatus;
        const matchesQueue = filterQueue === '' || lead.queue === filterQueue;
        if (!matchesStatus || !matchesQueue) return false;
      }

      return matchesSearch && matchesBank && matchesOrigin;
    });
  }, [leads, searchTerm, filterBank, filterOrigin, filterStatus, filterQueue, dashboardFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterBank('');
    setFilterOrigin('');
    setFilterStatus('');
    setFilterQueue('');
    setDashboardFilter(null);
  };

  const handleSendWhatsApp = (lead: Lead) => {
    if (isCooldownActive) return;

    const selectedTmplId = lead.selectedTemplateId;
    const template = messageTemplates.find(t => t.id === selectedTmplId) || 
                     messageTemplates.find(t => t.isDefault) || 
                     messageTemplates[0];

    const link = generateWhatsAppLink(lead, template.content);
    
    updateLead(lead.id, {
      status: 'Mensagem enviada',
      lastAction: 'Chamado hoje',
      lastSendDate: new Date().toISOString()
    });

    incrementSendsToday();
    setCooldown();

    window.open(link, '_blank');
  };

  const handleEdit = (lead: Lead) => {
    setCurrentLead(lead);
    setIsEditModalOpen(true);
  };

  const handleDelete = (lead: Lead) => {
    if (window.confirm(`Tem certeza que deseja excluir o lead "${lead.name}"? Esta ação não pode ser desfeita.`)) {
      deleteLead(lead.id);
    }
  };

  const handleCopyCPF = (cpf: string) => {
    navigator.clipboard.writeText(formatCPF(cpf));
    setCopiedCpf(cpf);
    setTimeout(() => setCopiedCpf(null), 2000);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
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
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 dark:text[...]"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-lg font-semibold border border-emerald-100 dark:bord[...]"
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
            <option value="">Status (Todos)</option>
            {leadStatuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>

          <select 
            value={filterQueue} 
            onChange={(e) => setFilterQueue(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100"
          >
            <option value="">Fila (Todas)</option>
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
            {banks.map(bank => (
              <option key={typeof bank === 'string' ? bank : bank.id} value={typeof bank === 'string' ? bank : bank.name}>
                {typeof bank === 'string' ? bank : bank.name}
              </option>
            ))}
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
        <div className="text-sm text-slate-500 font-medium italic">
          Exibindo <span className="text-emerald-600 dark:text-emerald-400 font-bold not-italic">{filteredLeads.length}</span> de <span className="font-bold not-italic">{leads.length}</span> lead[...]
        </div>
        <button 
          onClick={handleNextClient}
          disabled={isCooldownActive}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cu[...]"
        >
          {isCooldownActive ? `Dispensa: ${cooldownSeconds}s` : 'Chamar Próximo'}
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-800/50 font-bold border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Nome / Origem</th>
                <th className="px-6 py-4 border-l border-slate-100 dark:border-slate-800/50">WhatsApp</th>
                <th className="px-6 py-4 border-l border-slate-100 dark:border-slate-800/50">Banco</th>
                <th className="px-6 py-4 text-right border-l border-slate-100 dark:border-slate-800/50">Valor</th>
                <th className="px-6 py-4 border-l border-slate-100 dark:border-slate-800/50">Status / Fila</th>
                <th className="px-6 py-4 text-right border-l border-slate-100 dark:border-slate-800/50">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                       <Filter size={40} className="text-slate-200 dark:text-slate-800" />
                       <p className="font-bold text-lg">Nenhum lead encontrado</p>
                       <button onClick={clearFilters} className="mt-2 text-emerald-500 font-bold text-xs hover:underline">Limpar tudo</button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/30 transition-all group">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {lead.name}
                          {lead.outdated && <span title="Dados desatualizados"><AlertCircle size={14} className="text-red-500" /></span>}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{lead.origin || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 border-l border-slate-100 dark:border-slate-800/10">
                      <div className="flex flex-col">
                        <button 
                          onClick={() => handleCopyCPF(lead.cpf)}
                          className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors mb-0.5 w-fit"
                          title="Copiar CPF"
                        >
                          {formatCPF(lead.cpf)}
                          {copiedCpf === lead.cpf ? (
                            <Check size={12} className="text-emerald-500" />
                          ) : (
                            <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                        <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">{formatDisplayPhone(lead.phone)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 border-l border-slate-100 dark:border-slate-800/10">
                      <div className="flex items-center gap-2.5">
                        {getBankInfo(lead.bank)?.logo ? (
                          <div className="w-9 h-9 min-w-[36px] rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/50 flex items-center justify-center overflo[...]">
                            <img src={getBankInfo(lead.bank)?.logo} alt={lead.bank} className="w-full h-full object-contain p-1" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 min-w-[36px] rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 border border-sla[...]">
                          </div>
                        )}
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{lead.bank}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-emerald-600 dark:text-emerald-400 text-base border-l border-slate-100 dark:border-slate-800/10">
                      {formatCurrency(lead.availableValue)}
                    </td>
                    <td className="px-6 py-5 border-l border-slate-100 dark:border-slate-800/10">
                      <div className="flex flex-col gap-1.5 min-w-[140px]">
                        <select 
                          value={lead.status}
                          onChange={(e) => updateLead(lead.id, { status: e.target.value })}
                          className="text-[10px] font-black px-2 py-1 rounded outline-none border-none cursor-pointer transition-colors shadow-sm"
                          style={{ 
                            backgroundColor: getStatusColor(lead.status) + '20', 
                            color: getStatusColor(lead.status),
                            borderLeft: `3px solid ${getStatusColor(lead.status)}`
                          }}
                        >
                          {leadStatuses.map(s => (
                            <option key={s.id} value={s.name} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">{s.name}</option>
                          ))}
                        </select>
                        <span className="text-[10px] font-bold text-slate-400 pl-1">{lead.queue}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap border-l border-slate-100 dark:border-slate-800/10">
                      <div className="inline-flex flex-col items-start mr-3 align-middle group/sel">
                        <span className="text-[9px] font-bold text-slate-400 uppercase mb-1 ml-1 group-hover/sel:text-emerald-500 transition-colors">Mensagem</span>
                        <select 
                          value={lead.selectedTemplateId || (messageTemplates.find(t => t.isDefault)?.id || '')}
                          onChange={(e) => updateLead(lead.id, { selectedTemplateId: e.target.value })}
                          className="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 border-none rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer min-w[...]"
                        >
                          <option value="">Padrão</option>
                          {messageTemplates.map(tmpl => (
                            <option key={tmpl.id} value={tmpl.id}>{tmpl.name}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="inline-flex gap-1">
                        <button onClick={() => handleSendWhatsApp(lead)} disabled={isCooldownActive} className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm active:scal[...]" />
                        <button onClick={() => handleEdit(lead)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 transition-all active:[...]" />
                        <button onClick={() => handleDelete(lead)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 transition-all active:sca[...]" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
      <EditLeadModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} lead={currentLead} />
    </div>
  );
};
