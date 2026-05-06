"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLeadStore } from '../store/useLeadStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { generateWhatsAppLink, generateReabordagemLink } from '../lib/whatsapp';
import { exportToExcel, exportToPDF } from '../lib/export';
import { Lead, Bank, LeadStatusConfig, MessageTemplate, Tabulation } from '../types';
import { formatDisplayPhone, formatCPF, parseBRL, formatBRL, normalizePhone } from '../lib/utils';
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
  Clock,
  History,
  Tag as TagIcon,
  MessageSquare,
  Send
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ImportModal } from './ImportModal';
import { EditLeadModal } from './EditLeadModal';
import { UraImportModal } from './UraImportModal';

const LOCALSTORAGE_KEY = 'lkzap:table:columnWidths';
const DEFAULT_WIDTHS: Record<string, number> = {
  selection: 50,
  nome: 320,
  whatsapp: 170,
  banco: 140,
  valor: 120,
  status: 200,
  acoes: 160
};

const COLUMN_KEYS = ['selection', 'nome', 'whatsapp', 'banco', 'valor', 'status', 'acoes'];

export const LeadTable = () => {
  const { leads, updateLead, deleteLead, cooldownUntil, setCooldown, incrementSendsToday, dashboardFilter, setDashboardFilter, bulkUpdateLeads, bulkDeleteLeads } = useLeadStore();
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
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [previewLead, setPreviewLead] = useState<Lead | null>(null);
  const [now, setNow] = useState(Date.now());
  const [hydrated, setHydrated] = useState(false);
  const [copiedCpf, setCopiedCpf] = useState<string | null>(null);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkType, setBulkType] = useState<string>('');
  const [bulkValue, setBulkValue] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: 'asc' | 'desc' | null }>({ key: null, direction: null });
  const [columnSearch, setColumnSearch] = useState<Record<string, string>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Column resizing state
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(LOCALSTORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) {
          return { ...DEFAULT_WIDTHS, ...parsed };
        }
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_WIDTHS;
  });
  const resizingRef = useRef<{ key: string; startX: number; startWidth: number } | null>(null);
  const guideLineRef = useRef<HTMLDivElement>(null);

  const getBankInfo = (bankName: string) => {
    return banks.find((b: Bank) => (typeof b === 'string' ? b : b.name) === bankName);
  };

  const getStatusColor = (statusName: string) => {
    const status = leadStatuses.find((s: LeadStatusConfig) => s.name === statusName);
    return status?.color || '#94a3b8';
  };

  useEffect(() => {
    setHydrated(true);
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      
      const delta = e.clientX - resizingRef.current.startX;
      const newWidth = Math.min(500, Math.max(80, resizingRef.current.startWidth + delta));
      
      // Update guide line position
      if (guideLineRef.current) {
        guideLineRef.current.style.left = `${e.clientX}px`;
      }

      setColumnWidths(prev => {
        const next = { ...prev, [resizingRef.current!.key]: newWidth };
        // Save immediately as requested
        try { localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(next)); } catch (err) {}
        return next;
      });
    };

    const onMouseUp = () => {
      if (resizingRef.current) {
        document.body.style.cursor = "default";
        if (guideLineRef.current) {
          guideLineRef.current.classList.remove('visible');
        }
      }
      resizingRef.current = null;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const startResize = (e: React.MouseEvent, key: string) => {
    resizingRef.current = { key, startX: e.clientX, startWidth: columnWidths[key] || 100 };
    document.body.style.cursor = "col-resize";
    
    if (guideLineRef.current) {
      guideLineRef.current.style.left = `${e.clientX}px`;
      guideLineRef.current.classList.add('visible');
    }
    
    e.preventDefault();
  };

  const handleAutoFit = (key: string) => {
    const cells = document.querySelectorAll(`[data-col="${key}"]`);
    let maxWidth = 80;
    cells.forEach(cell => {
      maxWidth = Math.max(maxWidth, (cell as HTMLElement).scrollWidth);
    });
    
    const newWidth = Math.min(500, maxWidth + 32);
    setColumnWidths(prev => {
      const next = { ...prev, [key]: newWidth };
      try { localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(next)); } catch (err) {}
      return next;
    });
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key: null, direction: null };
      }
      return { key, direction: 'asc' };
    });
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map(l => l.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedLeadIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };



  const isCooldownActive = !!(cooldownUntil && now < cooldownUntil);
  const cooldownSeconds = isCooldownActive ? Math.ceil((cooldownUntil - now) / 1000) : 0;

  const filteredLeads = useMemo(() => {
    if (!hydrated) return [];
    
    // 1. Filter
    let result = leads.filter(lead => {
      // Global search
      const matchesSearch = 
        searchTerm === '' ||
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.cpf.includes(searchTerm) ||
        lead.phone.includes(searchTerm);
      
      if (!matchesSearch) return false;

      // Column specific search
      const matchesColName = !columnSearch.nome || lead.name.toLowerCase().includes(columnSearch.nome.toLowerCase());
      const matchesColWhatsapp = !columnSearch.whatsapp || lead.cpf.includes(columnSearch.whatsapp) || lead.phone.includes(columnSearch.whatsapp);
      const matchesColBank = !columnSearch.banco || lead.bank.toLowerCase().includes(columnSearch.banco.toLowerCase());
      
      if (!matchesColName) return false;
      if (!matchesColWhatsapp) return false;
      if (!matchesColBank) return false;

      // Applied filters
      const matchesBank = appliedFilters.bank === '' || lead.bank === appliedFilters.bank;
      const matchesOrigin = appliedFilters.origin === '' || lead.origin === appliedFilters.origin;
      
      if (!matchesBank || !matchesOrigin) return false;
      
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
        if (lead.status !== dashboardFilter) return false;
      } else {
        const matchesStatus = appliedFilters.status === '' || lead.status === appliedFilters.status;
        const matchesQueue = appliedFilters.queue === '' || lead.queue === appliedFilters.queue;
        if (!matchesStatus || !matchesQueue || !matchesDate) return false;
      }
      
      return matchesDate;
    });

    // 2. Sort
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        let valA: any = (a as any)[sortConfig.key!];
        let valB: any = (b as any)[sortConfig.key!];

        // Custom mappings
        if (sortConfig.key === 'nome') { valA = a.name; valB = b.name; }
        if (sortConfig.key === 'whatsapp') { valA = a.phone; valB = b.phone; }
        if (sortConfig.key === 'valor') { valA = a.availableValue; valB = b.availableValue; }
        if (sortConfig.key === 'status') { valA = a.status; valB = b.status; }
        if (sortConfig.key === 'banco') { valA = a.bank; valB = b.bank; }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [leads, searchTerm, appliedFilters, hydrated, columnSearch, sortConfig, dashboardFilter]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input/select/textarea
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
         if (e.key === 'Escape') {
           (e.target as HTMLElement).blur();
         }
         return;
      }

      // Ctrl + K -> Search
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // Ctrl + A -> Select All
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        setSelectedLeadIds(filteredLeads.map(l => l.id));
      }

      // Esc -> Clear selection
      if (e.key === 'Escape') {
        setSelectedLeadIds([]);
      }

      // Delete -> Delete selected
      if (e.key === 'Delete' && selectedLeadIds.length > 0) {
        if (confirm(`Excluir ${selectedLeadIds.length} leads selecionados?`)) {
          bulkDeleteLeads(selectedLeadIds);
          setSelectedLeadIds([]);
        }
      }

      // Enter -> Edit (if 1 selected)
      if (e.key === 'Enter' && selectedLeadIds.length === 1) {
        const lead = leads.find(l => l.id === selectedLeadIds[0]);
        if (lead) {
          setCurrentLead(lead);
          setIsEditModalOpen(true);
        }
      }

      // Ctrl + Shift + E -> Bulk Edit
      if (e.ctrlKey && e.shiftKey && e.key === 'E' && selectedLeadIds.length > 0) {
        e.preventDefault();
        setIsBulkModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredLeads, selectedLeadIds, leads, bulkDeleteLeads]);

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
     const newVal = parseBRL(valStr);
     if (newVal !== lead.availableValue) {
       updateLead(lead.id, { 
         availableValue: newVal
       });
     }
  };

  const handleShowHistory = (lead: Lead) => {
    setCurrentLead(lead);
    setIsHistoryModalOpen(true);
  };


  const handleSendWhatsApp = (lead: Lead) => {
    setPreviewLead(lead);
    setIsPreviewModalOpen(true);
  };

  const confirmSendWhatsApp = (lead: Lead) => {
    if (isCooldownActive) return;

    const cleanPhone = normalizePhone(lead.phone);
    if (!cleanPhone || cleanPhone.length < 11) {
      alert('Telefone inválido para envio de WhatsApp.');
      return;
    }

    const selectedTmplId = lead.selectedTemplateId;
    const template = messageTemplates.find((t: MessageTemplate) => t.id === selectedTmplId) || 
                     messageTemplates.find((t: MessageTemplate) => t.isDefault) || 
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
    setIsPreviewModalOpen(false);
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
    const { sendsTodayCount } = useLeadStore.getState();
    const DAILY_LIMIT = 100; // Suggested limit

    if (sendsTodayCount >= DAILY_LIMIT) {
      if (!confirm(`Você já enviou ${sendsTodayCount} mensagens hoje. O limite sugerido é ${DAILY_LIMIT}. Deseja continuar?`)) return;
    }

    // Filter potential candidates from ALL leads, not just filtered ones
    const allCandidates = leads.filter(l => {
      const cleanPhone = normalizePhone(l.phone);
      const hasPhone = cleanPhone && cleanPhone.length >= 11;
      const isNotClosed = l.status !== 'Fechado' && l.status !== 'Descartado';
      const isReady = l.queue === 'Pronto para enviar';
      return hasPhone && isNotClosed && isReady;
    });

    if (allCandidates.length === 0) {
      alert("Nenhum cliente disponível na fila 'Pronto para enviar' com telefone válido.");
      return;
    }

    // Smart Prioritization:
    // 1. With updated balance (differenceInDays < 3)
    // 2. With positive value
    // 3. By value desc
    // 4. By most recent consult date
    allCandidates.sort((a, b) => {
      const aVal = a.availableValue || 0;
      const bVal = b.availableValue || 0;
      
      const aUpdated = a.availableValueUpdatedAt ? differenceInDays(new Date(), parseISO(a.availableValueUpdatedAt)) < 3 : false;
      const bUpdated = b.availableValueUpdatedAt ? differenceInDays(new Date(), parseISO(b.availableValueUpdatedAt)) < 3 : false;

      // Priority 1: Updated balance
      if (aUpdated && !bUpdated) return -1;
      if (!aUpdated && bUpdated) return 1;

      // Priority 2: Has value
      if (aVal > 0 && bVal <= 0) return -1;
      if (aVal <= 0 && bVal > 0) return 1;

      // Priority 3: Value desc
      if (bVal !== aVal) return bVal - aVal;

      // Priority 4: Consult date desc
      return parseISO(b.consultDate).getTime() - parseISO(a.consultDate).getTime();
    });

    const candidate = allCandidates[0];

    // Final template check
    const selectedTmplId = candidate.selectedTemplateId;
    const template = messageTemplates.find((t: MessageTemplate) => t.id === selectedTmplId) || 
                     messageTemplates.find((t: MessageTemplate) => t.isDefault) || 
                     messageTemplates[0];

    if (template?.content?.includes('{valor}') && (!candidate.availableValue || candidate.availableValue <= 0)) {
      if (!confirm(`O cliente ${candidate.name} não possui valor informado, mas o template exige {valor}. Deseja continuar mesmo assim?`)) return;
    }

    handleSendWhatsApp(candidate);
  };

  const columns = ['', 'Nome / Origem','WhatsApp','Banco','Valor','Status / Fila','Ações'];



  const handleBulkAction = (type: string) => {
    setBulkType(type);
    setBulkValue('');
    setIsBulkModalOpen(true);
  };

  const confirmBulkAction = () => {
    if (!bulkType || !bulkValue) return;
    
    const labelMap: Record<string, string> = {
      status: 'Status',
      queue: 'Fila',
      bank: 'Banco',
      origin: 'Origem',
      template: 'Modelo de Mensagem'
    };

    if (window.confirm(`Deseja aplicar a alteração de ${labelMap[bulkType]} para ${selectedLeadIds.length} clientes?`)) {
      const updateData: Partial<Lead> = {};
      if (bulkType === 'status') updateData.status = bulkValue;
      if (bulkType === 'queue') updateData.queue = bulkValue as any;
      if (bulkType === 'bank') updateData.bank = bulkValue;
      if (bulkType === 'origin') updateData.origin = bulkValue;
      if (bulkType === 'template') updateData.selectedTemplateId = bulkValue;

      bulkUpdateLeads(selectedLeadIds, updateData);
      setSelectedLeadIds([]);
      setIsBulkModalOpen(false);
    }
  };

  const confirmBulkDelete = () => {
    if (window.confirm(`TEM CERTEZA que deseja EXCLUIR ${selectedLeadIds.length} clientes? Esta ação é irreversível.`)) {
      bulkDeleteLeads(selectedLeadIds);
      setSelectedLeadIds([]);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search and Advanced Filters */}
      {/* Bulk Action Bar */}
      {selectedLeadIds.length > 0 && (
        <div className="bg-emerald-600 text-white p-3 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-lg animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 px-3 py-1 rounded-full font-bold text-sm">
              {selectedLeadIds.length} selecionados
            </div>
            <button onClick={() => setSelectedLeadIds([])} className="text-emerald-100 hover:text-white text-sm font-medium">Limpar seleção</button>
          </div>
          
          <div className="flex flex-wrap gap-2">
             <button onClick={() => handleBulkAction('bank')} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-white/10">Trocar Banco</button>
             <button onClick={() => handleBulkAction('status')} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-white/10">Trocar Status</button>
             <button onClick={() => handleBulkAction('queue')} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-white/10">Trocar Fila</button>
             <button onClick={() => handleBulkAction('origin')} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-white/10">Trocar Origem</button>
             <button onClick={confirmBulkDelete} className="bg-red-500/20 hover:bg-red-500/40 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-red-500/30 text-red-100">Excluir</button>
          </div>
        </div>
      )}

      <div className="glass-panel p-4 rounded-xl flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              ref={searchInputRef}
              type="text"
              placeholder="Buscar por nome, CPF ou telefone... (Ctrl+K)"
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
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100 dark:bg-slate-800">
              <option value="">(Todos)</option>
              {leadStatuses.map((s: LeadStatusConfig) => <option key={s.id} value={s.name} className="bg-white dark:bg-slate-800">{s.name}</option>)}
            </select>
          </div>
          
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Fila</label>
            <select value={filterQueue} onChange={(e) => setFilterQueue(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100 dark:bg-slate-800">
              <option value="">(Todas)</option>
              <option value="Pronto para enviar">Pronto para enviar</option>
              <option value="Aguardando">Aguardando</option>
              <option value="Frio">Frio</option>
              <option value="Reabordar">Reabordar</option>
            </select>
          </div>
          
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Banco</label>
            <select value={filterBank} onChange={(e) => setFilterBank(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100 dark:bg-slate-800">
              <option value="">(Todos)</option>
              {banks.map((bank: Bank) => (
                <option key={typeof bank === 'string' ? bank : bank.id} value={typeof bank === 'string' ? bank : bank.name}>{typeof bank === 'string' ? bank : bank.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">Origem</label>
            <select value={filterOrigin} onChange={(e) => setFilterOrigin(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100 dark:bg-slate-800">
              <option value="">(Todas)</option>
              {origins.map((origin: string) => <option key={origin} value={origin}>{origin}</option>)}
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
             <select value={filterDateType} onChange={e => setFilterDateType(e.target.value)} className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100">
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
        <div className="flex gap-2">
          <button 
            onClick={() => { setFilterStatus('Novo da URA'); setFilterQueue('Higienização'); applyFilters(); }}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${filterQueue === 'Higienização' ? 'bg-amber-500 text-white border-amber-600' : 'bg-slate-100 text-slate-500 border-slate-200'}`}
          >
            Pendente Higienização
          </button>
          <button 
            onClick={() => { setFilterStatus('Com limite'); setFilterQueue('Pronto para enviar'); applyFilters(); }}
            className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${filterStatus === 'Com limite' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-slate-100 text-slate-500 border-slate-200'}`}
          >
            Com Saque
          </button>
        </div>
        <div className="text-sm text-slate-500 font-medium italic">
          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg mr-2 border border-slate-200 dark:border-slate-700 font-bold not-italic text-[10px] text-emerald-600">ENVIADOS HOJE: {useLeadStore.getState().sendsTodayCount}</span>
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

      {/* Bulk Actions Bar */}
      {selectedLeadIds.length > 0 && (
        <div className="bg-emerald-600 text-white p-3 rounded-xl flex items-center justify-between shadow-lg animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-4">
            <span className="font-black uppercase tracking-widest text-xs px-3 py-1 bg-white/20 rounded-full">
              {selectedLeadIds.length} Selecionados
            </span>
            <div className="flex gap-2">
              <button onClick={() => handleBulkAction('status')} className="text-[10px] font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors uppercase">Mudar Status</button>
              <button onClick={() => handleBulkAction('queue')} className="text-[10px] font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors uppercase">Mudar Fila</button>
              <button onClick={() => handleBulkAction('bank')} className="text-[10px] font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors uppercase">Mudar Banco</button>
              <button onClick={() => handleBulkAction('origin')} className="text-[10px] font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors uppercase">Mudar Origem</button>
              <button onClick={() => handleBulkAction('template')} className="text-[10px] font-bold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors uppercase">Mudar Modelo</button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={confirmBulkDelete} className="text-[10px] font-black bg-rose-500 hover:bg-rose-600 px-4 py-2 rounded-lg transition-colors uppercase flex items-center gap-2 shadow-sm">
              <Trash2 size={14} /> Excluir Selecionados
            </button>
            <button onClick={() => setSelectedLeadIds([])} className="text-white/70 hover:text-white"><XCircle size={20} /></button>
          </div>
        </div>
      )}

      <div className="glass-panel rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50 shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left table-fixed">
            <colgroup>
              {COLUMN_KEYS.map((key) => (
                <col 
                  key={key} 
                  style={{ 
                    width: `${columnWidths[key] || 100}px`, 
                    minWidth: '80px',
                    transition: resizingRef.current ? 'none' : 'width 0.1s ease'
                  }} 
                />
              ))}
            </colgroup>
            <thead className="text-xs text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-800/50 font-bold border-b border-slate-100 dark:border-slate-800">
              <tr>
                {COLUMN_KEYS.map((key, idx) => {
                  const isSticky = idx <= 2;
                  let stickyLeft = 0;
                  if (idx === 1) stickyLeft = columnWidths.selection || 50;
                  if (idx === 2) stickyLeft = (columnWidths.selection || 50) + (columnWidths.nome || 320);

                  return (
                    <th 
                      key={key} 
                      data-col={key}
                      style={isSticky ? { position: 'sticky', left: `${stickyLeft}px`, zIndex: 30 } : {}}
                      className={`px-4 py-3 relative border-r border-slate-200/30 dark:border-slate-700/40 ${key === 'banco' ? 'text-right' : ''} ${isSticky ? 'bg-slate-50 dark:bg-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]' : 'bg-slate-50/50 dark:bg-slate-800/50'}`}
                    >
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 cursor-pointer select-none group" onClick={() => key !== 'selection' && key !== 'acoes' && handleSort(key)}>
                            {key === 'selection' ? (
                              <input 
                                type="checkbox" 
                                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" 
                                checked={selectedLeadIds.length > 0 && selectedLeadIds.length === filteredLeads.length}
                                onChange={toggleSelectAll}
                              />
                            ) : (
                              <span className="group-hover:text-emerald-500 transition-colors">{columns[idx]}</span>
                            )}
                            {sortConfig.key === key && (
                              <span className="text-emerald-500">
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                          {idx < COLUMN_KEYS.length - 1 && (
                            <div 
                              onMouseDown={(e) => startResize(e, key)} 
                              onDoubleClick={() => handleAutoFit(key)}
                              className="resize-handle" 
                              title="Arraste para redimensionar / Duplo clique para auto-ajuste" 
                            />
                          )}
                        </div>
                        {['nome', 'whatsapp', 'banco'].includes(key) && (
                           <input 
                             type="text"
                             placeholder="Filtrar..."
                             value={columnSearch[key] || ''}
                             onChange={(e) => setColumnSearch(prev => ({ ...prev, [key]: e.target.value }))}
                             className="w-full text-[10px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-emerald-500 font-normal normal-case"
                             onClick={(e) => e.stopPropagation()}
                           />
                        )}
                      </div>
                    </th>
                  );
                })}
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
                  <tr key={lead.id} className={`hover:bg-slate-800/60 transition-all ${selectedLeadIds.includes(lead.id) ? 'bg-emerald-500/10 border-emerald-500/30' : ''}`}>
                    <td 
                      data-col="selection" 
                      style={{ position: 'sticky', left: '0', zIndex: 10 }}
                      className="px-6 py-5 border-r border-slate-200/30 dark:border-slate-700/40 text-center bg-inherit shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                    >
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" 
                        checked={selectedLeadIds.includes(lead.id)}
                        onChange={() => toggleSelectRow(lead.id)}
                      />
                    </td>
                    <td 
                      data-col="nome" 
                      style={{ position: 'sticky', left: `${columnWidths.selection || 50}px`, zIndex: 10 }}
                      className="px-6 py-5 border-r border-slate-200/30 dark:border-slate-700/40 bg-inherit shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                          {lead.name}
                          <button onClick={() => { handleCopy(lead.name, "Nome"); alert("Nome copiado!"); }} className="ml-1 text-slate-400 hover:text-emerald-500" title="Copiar Nome"><Copy size={12}/></button>
                          {lead.outdated && <span title="Dados desatualizados"><AlertCircle size={14} className="text-red-500" /></span>}
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <select 
                            value={lead.origin || ''}
                            onChange={(e) => updateLead(lead.id, { origin: e.target.value })}
                            className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 border-none rounded px-1 py-0.5 outline-none cursor-pointer uppercase dark:text-slate-100"
                          >
                            <option value="" className="dark:bg-slate-800">(Sem Origem)</option>
                            {origins.map((o: string) => <option key={o} value={o} className="dark:bg-slate-800">{o}</option>)}
                          </select>
                          {(lead.tags || []).map((tagId: string) => {
                            const tag = useSettingsStore.getState().tags.find((t: any) => t.id === tagId);
                            if (!tag) return null;
                            return (
                              <span key={tagId} style={{ backgroundColor: tag.color + '20', color: tag.color }} className="text-[8px] font-black px-1 rounded uppercase border" title={tag.label}>
                                {tag.label.split(' ')[1] || tag.label}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    </td>
                    <td 
                      data-col="whatsapp" 
                      style={{ position: 'sticky', left: `${(columnWidths.selection || 50) + (columnWidths.nome || 320)}px`, zIndex: 10 }}
                      className="px-6 py-5 border-l border-slate-100 dark:border-slate-800/10 border-r border-slate-200/30 dark:border-slate-700/40 bg-inherit shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]"
                    >
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
                    <td data-col="banco" className="px-6 py-5 border-l border-slate-100 dark:border-slate-800/10 border-r border-slate-200/30 dark:border-slate-700/40">
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
                          className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-transparent border-none outline-none p-0 cursor-pointer w-full dark:bg-slate-900"
                        >
                           {banks.map((b: Bank) => (
                             <option key={typeof b === 'string' ? b : b.id} value={typeof b === 'string' ? b : b.name} className="dark:bg-slate-800">
                               {typeof b === 'string' ? b : b.name}
                             </option>
                           ))}
                        </select>
                      </div>
                    </td>
                    <td data-col="valor" className="px-6 py-5 text-right font-black text-emerald-600 dark:text-emerald-400 text-base border-l border-slate-100 dark:border-slate-800/10 border-r border-slate-200/30 dark:border-slate-700/40">
                      <div className="flex flex-col items-end">
                        <input 
                          type="text"
                          defaultValue={formatBRL(lead.availableValue)}
                          onChange={(e) => {
                            e.target.value = formatBRL(e.target.value);
                          }}
                          onBlur={(e) => handleQuickEditValue(lead, e.target.value)}
                          className={`bg-transparent border-none outline-none text-right font-black text-base w-full focus:ring-1 focus:ring-emerald-500 rounded px-1 ${
                             lead.availableValue > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                          }`}
                        />
                        {lead.availableValueUpdatedAt && (
                          <div className="flex items-center gap-1 mt-1">
                            {(() => {
                              const diff = differenceInDays(new Date(), parseISO(lead.availableValueUpdatedAt));
                              if (diff >= 7) return <span className="text-[9px] font-black text-red-500 bg-red-50 px-1 rounded flex items-center gap-1 border border-red-100 animate-pulse"><AlertCircle size={10} /> SALDO VENCIDO</span>;
                              if (diff >= 3) return <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-1 rounded flex items-center gap-1 border border-amber-100"><AlertCircle size={10} /> SALDO DESATUALIZADO</span>;
                              return <span className="text-[9px] text-slate-400 font-medium flex items-center gap-1"><Clock size={10} /> Atualizado {format(parseISO(lead.availableValueUpdatedAt), 'dd/MM')}</span>;
                            })()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td data-col="status" className="px-6 py-5 border-l border-slate-100 dark:border-slate-800/10 border-r border-slate-200/30 dark:border-slate-700/40">
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
                          {leadStatuses.map((s: LeadStatusConfig) => (
                            <option key={s.id} value={s.name} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">{s.name}</option>
                          ))}
                        </select>
                        <select 
                          value={lead.queue}
                          onChange={(e) => updateLead(lead.id, { queue: e.target.value as any })}
                          className="text-[10px] font-bold text-slate-500 bg-transparent border-none outline-none p-0 ml-1 cursor-pointer w-full dark:bg-slate-900"
                        >
                          <option value="Pronto para enviar" className="dark:bg-slate-800">Pronto para enviar</option>
                          <option value="Aguardando" className="dark:bg-slate-800">Aguardando</option>
                          <option value="Frio" className="dark:bg-slate-800">Frio</option>
                          <option value="Reabordar" className="dark:bg-slate-800">Reabordar</option>
                        </select>
                      </div>
                    </td>
                    <td data-col="acoes" className="px-6 py-5 text-right whitespace-nowrap border-l border-slate-100 dark:border-slate-800/10 border-r border-slate-200/30 dark:border-slate-700/40">
                      <div className="inline-flex flex-col items-start mr-3 align-middle">
                        <div className="mb-2">
                          <select 
                            value={lead.selectedTemplateId || (messageTemplates.find((t: MessageTemplate) => t.isDefault)?.id || '')}
                            onChange={(e) => updateLead(lead.id, { selectedTemplateId: e.target.value })}
                            className="text-[11px] font-bold bg-slate-100 dark:bg-slate-800 border-none rounded-md px-2 py-1 outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer w-full dark:text-slate-100"
                          >
                            <option value="" className="dark:bg-slate-800">Padrão</option>
                            {messageTemplates.map((tmpl: MessageTemplate) => (
                              <option key={tmpl.id} value={tmpl.id} className="dark:bg-slate-800">{tmpl.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="inline-flex gap-1">
                          <button onClick={() => handleSendWhatsApp(lead)} disabled={isCooldownActive} className="p-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm active:scale-95" title="Enviar WhatsApp"><Send size={16} /></button>
                          <button onClick={() => handleShowHistory(lead)} className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 transition-all" title="Histórico"><History size={16} /></button>
                          <button onClick={() => handleEdit(lead)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 transition-all" title="Editar"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(lead)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 transition-all" title="Excluir"><Trash2 size={16} /></button>
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

      <div id="resize-line" ref={guideLineRef} />

      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} />
      <EditLeadModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} lead={currentLead} />
      <UraImportModal isOpen={isUraModalOpen} onClose={() => setIsUraModalOpen(false)} />

      {/* History Modal */}
      {isHistoryModalOpen && currentLead && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <History className="text-emerald-600" />
                <h3 className="text-lg font-bold">Histórico: {currentLead.name}</h3>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                <XCircle size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {!(currentLead.history && currentLead.history.length > 0) ? (
                <div className="text-center py-10 text-slate-400 italic">Nenhum histórico registrado.</div>
              ) : (
                [...currentLead.history].reverse().map((entry, idx) => (
                  <div key={idx} className="flex gap-3 relative">
                    {idx < currentLead.history!.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-slate-100 dark:bg-slate-800" />
                    )}
                    <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center z-10 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div className="flex flex-col flex-1 pb-4">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{entry.action}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-1">
                        {format(parseISO(entry.createdAt), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Message Preview Modal */}
      {isPreviewModalOpen && previewLead && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-emerald-500/10">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-500/5 to-transparent flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <MessageSquare className="text-emerald-500" />
                 <h3 className="text-xl font-black italic">Preview do WhatsApp</h3>
               </div>
               <button onClick={() => setIsPreviewModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle size={24} /></button>
            </div>
            <div className="p-6 space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Cliente</span>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{previewLead.name}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">WhatsApp</span>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{formatDisplayPhone(previewLead.phone)}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Banco</span>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{previewLead.bank}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                    <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Valor</span>
                    <p className="font-black text-emerald-600">{formatBRL(previewLead.availableValue)}</p>
                  </div>
               </div>

               <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-5">
                  <span className="text-[10px] font-black text-emerald-600 uppercase block mb-3 tracking-widest">Conteúdo da Mensagem</span>
                  <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-medium leading-relaxed">
                    {(() => {
                       const tmpl = messageTemplates.find((t: MessageTemplate) => t.id === (previewLead.selectedTemplateId || messageTemplates.find((t2: MessageTemplate)=>t2.isDefault)?.id || messageTemplates[0]?.id));
                       let content = tmpl?.content || "";
                       content = content.replace(/{nome}/g, previewLead.name.split(' ')[0]);
                       content = content.replace(/{valor}/g, formatBRL(previewLead.availableValue));
                       content = content.replace(/{banco}/g, previewLead.bank);
                       return content;
                    })()}
                  </div>
               </div>

               <div className="flex gap-3 pt-2">
                 <button onClick={() => setIsPreviewModalOpen(false)} className="flex-1 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">Cancelar</button>
                 <button onClick={() => confirmSendWhatsApp(previewLead)} className="flex-[2] py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                    <Send size={20} /> Confirmar Envio
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Config Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-black uppercase tracking-widest text-slate-500 text-sm">Aplicar em Massa</h3>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XCircle size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Selecione o novo valor para aplicar aos <span className="font-bold text-emerald-600">{selectedLeadIds.length}</span> clientes selecionados:
              </p>
              
              {bulkType === 'status' && (
                <select value={bulkValue} onChange={e => setBulkValue(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 font-bold">
                  <option value="">Selecione um status...</option>
                  {leadStatuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              )}

              {bulkType === 'queue' && (
                <select value={bulkValue} onChange={e => setBulkValue(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 font-bold">
                  <option value="">Selecione uma fila...</option>
                  <option value="Pronto para enviar">Pronto para enviar</option>
                  <option value="Aguardando">Aguardando</option>
                  <option value="Frio">Frio</option>
                  <option value="Reabordar">Reabordar</option>
                  <option value="Higienização">Higienização</option>
                </select>
              )}

              {bulkType === 'bank' && (
                <select value={bulkValue} onChange={e => setBulkValue(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 font-bold">
                  <option value="">Selecione um banco...</option>
                  {banks.map(b => (
                    <option key={typeof b === 'string' ? b : b.id} value={typeof b === 'string' ? b : b.name}>
                      {typeof b === 'string' ? b : b.name}
                    </option>
                  ))}
                </select>
              )}

              {bulkType === 'origin' && (
                <select value={bulkValue} onChange={e => setBulkValue(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 font-bold">
                  <option value="">Selecione uma origem...</option>
                  {origins.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              )}

              {bulkType === 'template' && (
                <select value={bulkValue} onChange={e => setBulkValue(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-emerald-500 font-bold">
                  <option value="">Selecione um modelo...</option>
                  {messageTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setIsBulkModalOpen(false)} className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-500 hover:bg-slate-50">Cancelar</button>
                <button 
                  onClick={confirmBulkAction} 
                  disabled={!bulkValue}
                  className="flex-[2] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest disabled:bg-slate-300"
                >
                  Aplicar Agora
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
