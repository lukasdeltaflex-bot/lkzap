"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLeadStore } from '../store/useLeadStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { generateWhatsAppLink, generateReabordagemLink } from '../lib/whatsapp';
import { exportToExcel, exportToPDF } from '../lib/export';
import { Lead } from '../types';
import { formatDisplayPhone, formatCPF, parseCurrencyBRL, normalizePhone } from '../lib/utils';
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
  Check,
  Zap,
  Clock
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ImportModal } from './ImportModal';
import { EditLeadModal } from './EditLeadModal';
import { UraImportModal } from './UraImportModal';

const LOCALSTORAGE_KEY = 'lkzap_table_column_widths_v1';
const DEFAULT_WIDTHS = [320, 170, 120, 120, 200, 160];

export const LeadTable = () => {
  const { leads, updateLead, deleteLead, cooldownUntil, setCooldown, incrementSendsToday, dashboardFilter, setDashboardFilter } = useLeadStore();
  const { banks, origins, messageTemplates, leadStatuses, dashboardCards } = useSettingsStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterBank, setFilterBank] = useState('');
  const [filterOrigin, setFilterOrigin] = useState('');
  const [filterStatus, setFilterStatus] = useState('Com limite');
  const [filterQueue, setFilterQueue] = useState('Pronto para enviar');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [filterDateType, setFilterDateType] = useState('cadastro'); // 'cadastro' ou 'atualizacao'
  const [appliedFilters, setAppliedFilters] = useState({
    bank: '',
    origin: '',
    status: 'Com limite',
    queue: 'Pronto para enviar',
    dateStart: '',
    dateEnd: '',
    dateType: 'cadastro'
  });
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isUraModalOpen, setIsUraModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [now, setNow] = useState(Date.now());
  const [copiedCpf, setCopiedCpf] = useState<string | null>(null);

  // Column resizing state
  const [columnWidths, setColumnWidths] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem(LOCALSTORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_WIDTHS.length) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_WIDTHS;
  });
  const resizingRef = useRef<{ index: number; startX: number; startWidth: number } | null>(null);

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

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const delta = e.clientX - resizingRef.current.startX;
      const newWidth = Math.max(80, resizingRef.current.startWidth + delta);
      setColumnWidths(prev => {
        const copy = [...prev];
        copy[resizingRef.current!.index] = newWidth;
        return copy;
      });
    };
    const onMouseUp = () => {
      if (resizingRef.current) {
        try { localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(columnWidths)); } catch (e) {}
      }
      resizingRef.current = null;
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [columnWidths]);

  const startResize = (e: React.MouseEvent, index: number) => {
    resizingRef.current = { index, startX: e.clientX, startWidth: columnWidths[index] };
    e.preventDefault();
  };

  const isCooldownActive = !!(cooldownUntil && now < cooldownUntil);
  const cooldownSeconds = isCooldownActive ? Math.ceil((cooldownUntil - now) / 1000) : 0;

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = 
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.cpf.includes(searchTerm) ||
        lead.phone.includes(searchTerm);
      
      const matchesBank = appliedFilters.bank === '' || lead.bank === appliedFilters.bank;
      const matchesOrigin = appliedFilters.origin === '' || lead.origin === appliedFilters.origin;
      
      let matchesDate = true;
      if (appliedFilters.dateStart || appliedFilters.dateEnd) {
        const dateToCheck = appliedFilters.dateType === 'cadastro' 
          ? lead.consultDate 
          : (lead.availableValueUpdatedAt || lead.consultDate);
        const checkDate = dateToCheck ? parseISO(dateToCheck).getTime() : 0;
        
        if (appliedFilters.dateStart) {
          const startDate = new Date(appliedFilters.dateStart).setHours(0,0,0,0);
          if (checkDate < startDate) matchesDate = false;
        }
        if (appliedFilters.dateEnd) {
          const endDate = new Date(appliedFilters.dateEnd).setHours(23,59,59,999);
          if (checkDate > endDate) matchesDate = false;
        }
      }

      if (dashboardFilter) {
        const activeCard = dashboardCards.find(c => c.id === dashboardFilter);
        if (activeCard) {
          if (!activeCard.statuses.includes(lead.status)) return false;
        }
      } else {
        const matchesStatus = appliedFilters.status === '' || lead.status === appliedFilters.status;
        const matchesQueue = appliedFilters.queue === '' || lead.queue === appliedFilters.queue;
        if (!matchesStatus || !matchesQueue || !matchesDate) return false;
      }

      return matchesSearch && matchesBank && matchesOrigin && matchesDate;
    });
  }, [leads, searchTerm, appliedFilters, dashboardFilter]);

  const applyFilters = () => {
    setDashboardFilter(null);
    setAppliedFilters({
      bank: filterBank,
      origin: filterOrigin,
      status: filterStatus,
      queue: filterQueue,
      dateStart: filterDateStart,
      dateEnd: filterDateEnd,
      dateType: filterDateType
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterBank('');
    setFilterOrigin('');
    setFilterStatus('');
    setFilterQueue('');
    setFilterDateStart('');
    setFilterDateEnd('');
    setDashboardFilter(null);
    setAppliedFilters({
      bank: '',
      origin: '',
      status: '',
      queue: '',
      dateStart: '',
      dateEnd: '',
      dateType: 'cadastro'
    });
  };
  
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
  };
  
  const handleQuickEditValue = (lead: Lead, valStr: string) => {
     const newVal = parseCurrencyBRL(valStr);
     if (newVal !== lead.availableValue) {
       updateLead(lead.id, { 
         availableValue: newVal,
         availableValueUpdatedAt: new Date().toISOString()
       });
     }
  };


  const handleSendWhatsApp = (lead: Lead) => {
    if (isCooldownActive) return;

    const cleanPhone = normalizePhone(lead.phone);
    if (!cleanPhone || cleanPhone.length < 11) {
      alert('Telefone inválido para envio de WhatsApp.');
      return;
    }

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
    try {
      navigator.clipboard.writeText(formatCPF(cpf));
      setCopiedCpf(cpf);
      setTimeout(() => setCopiedCpf(null), 2000);
    } catch (e) {
      console.error('Erro ao copiar CPF', e);
    }
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

    // Find first valid candidate considering phone and template requirements
    let candidate: Lead | undefined;
    for (const l of targetLeads) {
      const cleanPhone = normalizePhone(l.phone);
      if (!cleanPhone || cleanPhone.length < 11) continue;

      const selectedTmplId = l.selectedTemplateId;
      const template = messageTemplates.find(t => t.id === selectedTmplId) || 
                       messageTemplates.find(t => t.isDefault) || 
                       messageTemplates[0];
      // If template requires {valor} ensure lead has availableValue
      if (template && template.content && template.content.includes('{valor}') && (!l.availableValue || l.availableValue <= 0)) continue;

      candidate = l;
      break;
    }

    if (candidate) {
      handleSendWhatsApp(candidate);
    } else {
      alert("Nenhum cliente disponível nos filtros atuais para disparo automático.");
    }
  };

  const columns = ['Nome / Origem','WhatsApp','Banco','Valor','Status / Fila','Ações'];

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
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-10 pr-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsUraModalOpen(true)}
              className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-4 py-2 rounded-lg font-semibold border border-amber-100 dark:border-amber-800 hover:bg-amber-100 transition-colors whitespace-nowrap"
            >
              <Zap size={18} />
              <span className="hidden sm:inline">URA</span>
            </button>
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-lg font-semibold border border-emerald-100 dark:border-emerald-700/30"
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

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 items-end">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100">
              <option value="">(Todos)</option>
              {leadStatuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Fila</label>
            <select value={filterQueue} onChange={(e) => setFilterQueue(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100">
              <option value="">(Todas)</option>
              <option value="Pronto para enviar">Pronto para enviar</option>
              <option value="Aguardando">Aguardando</option>
              <option value="Frio">Frio</option>
              <option value="Reabordar">Reabordar</option>
            </select>
          </div>
          
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Banco</label>
            <select value={filterBank} onChange={(e) => setFilterBank(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100">
              <option value="">(Todos)</option>
              {banks.map(bank => (
                <option key={typeof bank === 'string' ? bank : bank.id} value={typeof bank === 'string' ? bank : bank.name}>{typeof bank === 'string' ? bank : bank.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Origem</label>
            <select value={filterOrigin} onChange={(e) => setFilterOrigin(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100">
              <option value="">(Todas)</option>
              {origins.map(origin => <option key={origin} value={origin}>{origin}</option>)}
            </select>
          </div>
          
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Data ({filterDateType})</label>
            <div className="flex gap-1">
               <input type="date" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} className="w-1/2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100" />
               <input type="date" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} className="w-1/2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100" />
            </div>
          </div>
          
          <div className="flex flex-col">
             <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Data</label>
             <select value={filterDateType} onChange={e => setFilterDateType(e.target.value)} className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100">
               <option value="cadastro">Data de cadastro</option>
               <option value="atualizacao">Data de atualização</option>
             </select>
          </div>
          
          <div className="flex gap-2 h-full items-end pb-0.5">
            <button onClick={applyFilters} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg p-2 font-bold text-xs transition-colors">Aplicar</button>
            <button onClick={clearFilters} className="flex-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg p-2 font-bold text-xs transition-colors">Limpar</button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="text-sm text-slate-500 font-medium italic">
          Exibindo <span className="text-emerald-600 dark:text-emerald-400 font-bold not-italic">{filteredLeads.length}</span> de <span className="font-bold not-italic">{leads.length}</span> leads
        </div>
        <button 
          onClick={handleNextClient}
          disabled={isCooldownActive}
          className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold"
        >
          {isCooldownActive ? `Dispensa: ${cooldownSeconds}s` : 'Chamar Próximo'}
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left table-fixed">
            <colgroup>
              {columnWidths.map((w, idx) => (
                <col key={idx} style={{ width: `${w}px`, minWidth: '80px' }} />
              ))}
            </colgroup>
            <thead className="text-xs text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-800/50 font-bold border-b border-slate-100 dark:border-slate-800">
              <tr>
                {columns.map((col, idx) => (
                  <th key={col} className={`px-6 py-4 relative border-r border-slate-200/30 dark:border-slate-700/40 ${idx === 3 ? 'text-right' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span>{col}</span>
                      {idx < columns.length - 1 && (
                        <div onMouseDown={(e) => startResize(e, idx)} className="w-2 h-6 cursor-col-resize" title="Arrastar para redimensionar" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500 border-r border-slate-200/30 dark:border-slate-700/40">
                    <div className="flex flex-col items-center gap-2">
                       <Filter size={40} className="text-slate-200 dark:text-slate-800" />
                       <p className="font-bold text-lg">Nenhum lead encontrado</p>
                       <button onClick={clearFilters} className="mt-2 text-emerald-500 font-bold text-xs hover:underline">Limpar tudo</button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-900/30 transition-all">
                    <td className="px-6 py-5 border-r border-slate-200/30 dark:border-slate-700/40">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                          {lead.name}
                          <button onClick={() => { handleCopy(lead.name, "Nome"); alert("Nome copiado!"); }} className="ml-1 text-slate-400 hover:text-emerald-500" title="Copiar Nome"><Copy size={12}/></button>
                          {lead.outdated && <span title="Dados desatualizados"><AlertCircle size={14} className="text-red-500" /></span>}
                        </span>
                        <select 
                          value={lead.origin || ''}
                          onChange={(e) => updateLead(lead.id, { origin: e.target.value })}
                          className="text-[10px] text-slate-500 bg-transparent uppercase tracking-wider font-bold outline-none border-none mt-1 w-24 p-0 cursor-pointer"
                        >
                          <option value="">N/A</option>
                          {origins.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-5 border-l border-slate-100 dark:border-slate-800/10 border-r border-slate-200/30 dark:border-slate-700/40">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-slate-400">{formatCPF(lead.cpf)}</span>
                          <button onClick={() => handleCopyCPF(lead.cpf)} className="p-1 rounded text-slate-400 hover:text-emerald-600" title="Copiar CPF">
                            {copiedCpf === lead.cpf ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          </button>
                        </div>
                        {copiedCpf === lead.cpf && <span className="text-[11px] text-emerald-600 mt-1">CPF copiado</span>}
                        <span className="font-bold text-slate-700 dark:text-slate-200 text-xs mt-1">{formatDisplayPhone(lead.phone)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 border-l border-slate-100 dark:border-slate-800/10 border-r border-slate-200/30 dark:border-slate-700/40">
                      <div className="flex items-center gap-2.5">
                        {getBankInfo(lead.bank)?.logo ? (
                          <div className="w-9 h-9 min-w-[36px] rounded-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/50 flex items-center justify-center overflow-hidden">
                            <img src={getBankInfo(lead.bank)?.logo} alt={lead.bank} className="w-full h-full object-contain p-1" />
                          </div>
                        ) : (
                          <div className="w-9 h-9 min-w-[36px] rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-200/60">
                          </div>
                        )}
                        <select 
                          value={lead.bank}
                          onChange={(e) => updateLead(lead.id, { bank: e.target.value })}
                          className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-transparent border-none outline-none p-0 cursor-pointer w-24"
                        >
                           {banks.map(b => (
                             <option key={typeof b === 'string' ? b : b.id} value={typeof b === 'string' ? b : b.name}>
                               {typeof b === 'string' ? b : b.name}
                             </option>
                           ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right font-black text-emerald-600 dark:text-emerald-400 text-base border-l border-slate-100 dark:border-slate-800/10 border-r border-slate-200/30 dark:border-slate-700/40">
                      <div className="flex flex-col items-end">
                        <input 
                          type="text"
                          defaultValue={formatCurrency(lead.availableValue)}
                          onBlur={(e) => handleQuickEditValue(lead, e.target.value)}
                          className="bg-transparent border-none outline-none text-right font-black text-emerald-600 dark:text-emerald-400 text-base w-28 focus:ring-1 focus:ring-emerald-500 rounded px-1"
                        />
                        {lead.availableValueUpdatedAt && (
                          <span className="text-[9px] text-slate-400 flex items-center gap-1 font-medium mt-1">
                            <Clock size={10} /> Atualizado em {format(parseISO(lead.availableValueUpdatedAt), 'dd/MM/yyyy')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 border-l border-slate-100 dark:border-slate-800/10 border-r border-slate-200/30 dark:border-slate-700/40">
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
                        <select 
                          value={lead.queue}
                          onChange={(e) => updateLead(lead.id, { queue: e.target.value as any })}
                          className="text-[10px] font-bold text-slate-500 bg-transparent border-none outline-none p-0 ml-1 cursor-pointer w-28"
                        >
                          <option value="Pronto para enviar">Pronto para enviar</option>
                          <option value="Aguardando">Aguardando</option>
                          <option value="Frio">Frio</option>
                          <option value="Reabordar">Reabordar</option>
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right whitespace-nowrap border-l border-slate-100 dark:border-slate-800/10 border-r border-slate-200/30 dark:border-slate-700/40">
                      <div className="inline-flex flex-col items-start mr-3 align-middle">
                        <div className="mb-2">
                          <select 
                            value={lead.selectedTemplateId || (messageTemplates.find(t => t.isDefault)?.id || '')}
                            onChange={(e) => updateLead(lead.id, { selectedTemplateId: e.target.value })}
                            className="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 border-none rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer min-w-[120px]"
                          >
                            <option value="">Padrão</option>
                            {messageTemplates.map(tmpl => (
                              <option key={tmpl.id} value={tmpl.id}>{tmpl.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="inline-flex gap-1">
                          <button onClick={() => handleSendWhatsApp(lead)} disabled={isCooldownActive} className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm active:scale-95">Enviar</button>
                          <button onClick={() => handleEdit(lead)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 transition-all">Editar</button>
                          <button onClick={() => handleDelete(lead)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 transition-all">Excluir</button>
                        </div>
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
      <UraImportModal isOpen={isUraModalOpen} onClose={() => setIsUraModalOpen(false)} />
    </div>
  );
};
