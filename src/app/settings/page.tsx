"use client";

import { useState, useRef, useMemo } from "react";
import { useSettingsStore } from "../../store/useSettingsStore";
import { 
  Trash2, 
  Plus, 
  Image as ImageIcon, 
  Upload, 
  MessageSquare, 
  Tags, 
  Building2, 
  Check, 
  X,
  Edit2,
  ArrowLeft,
  ChevronRight,
  Star,
  GripVertical,
  Activity,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sortable Item Wrapper ---
function SortableItem({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={className}>
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 transition-colors">
        <GripVertical size={18} />
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { 
    banks, updateBank, removeBank, addBank, reorderBanks,
    origins, addOrigin, removeOrigin, reorderOrigins,
    tabulations, addTabulation, updateTabulation, removeTabulation, reorderTabulations,
    messageTemplates, addTemplate, updateTemplate, removeTemplate, setDefaultTemplate, reorderTemplates,
    leadStatuses, addLeadStatus, updateLeadStatus, removeLeadStatus, reorderLeadStatuses,
    dashboardCards, updateDashboardCard,
    logoBase64, setLogo 
  } = useSettingsStore();

  // Navigation state
  const [activeTab, setActiveTab] = useState<'geral' | 'bancos' | 'mensagens' | 'status' | 'dashboard'>('geral');
  
  // Local form states
  const [newBank, setNewBank] = useState("");
  const [newOrigin, setNewOrigin] = useState("");
  const [newTab, setNewTab] = useState("");
  const [newStatus, setNewStatus] = useState({ name: "", color: "#10b981" });
  
  // Edit states
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabText, setEditingTabText] = useState("");
  
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [editingStatusData, setEditingStatusData] = useState({ name: "", color: "" });

  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  
  const [tmplForm, setTmplForm] = useState({
    name: '',
    content: '',
    tabId: tabulations[0]?.id || '',
    isDefault: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bankLogoInputRef = useRef<HTMLInputElement>(null);
  const [currentBankId, setCurrentBankId] = useState<string | null>(null);

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // --- Handlers ---
  const handleBankAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBank.trim()) { addBank(newBank.trim()); setNewBank(""); }
  };

  const handleTemplateSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tmplForm.name || !tmplForm.content) return;

    if (editingTemplateId) {
      updateTemplate(editingTemplateId, tmplForm);
      setEditingTemplateId(null);
    } else {
      addTemplate({ ...tmplForm, isActive: true });
    }
    
    setIsAddingTemplate(false);
    setTmplForm({ name: '', content: '', tabId: tabulations[0]?.id || '', isDefault: false });
  };

  const handleEditTemplate = (tmpl: any) => {
    setTmplForm({
      name: tmpl.name,
      content: tmpl.content,
      tabId: tmpl.tabId,
      isDefault: tmpl.isDefault
    });
    setEditingTemplateId(tmpl.id);
    setIsAddingTemplate(true);
  };

  const handleStatusAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStatus.name.trim()) {
      addLeadStatus(newStatus.name.trim(), newStatus.color);
      setNewStatus({ name: "", color: "#10b981" });
    }
  };

  const handleDragEnd = (event: DragEndEvent, type: 'banks' | 'origins' | 'tabulations' | 'templates' | 'status') => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (type === 'tabulations') {
      const oldIndex = tabulations.findIndex(t => t.id === active.id);
      const newIndex = tabulations.findIndex(t => t.id === over.id);
      reorderTabulations(arrayMove(tabulations, oldIndex, newIndex));
    } else if (type === 'templates') {
      const oldIndex = messageTemplates.findIndex(t => t.id === active.id);
      const newIndex = messageTemplates.findIndex(t => t.id === over.id);
      reorderTemplates(arrayMove(messageTemplates, oldIndex, newIndex));
    } else if (type === 'banks') {
      const oldIndex = banks.findIndex(b => b.id === active.id);
      const newIndex = banks.findIndex(b => b.id === over.id);
      reorderBanks(arrayMove(banks, oldIndex, newIndex));
    } else if (type === 'status') {
      const oldIndex = leadStatuses.findIndex(s => s.id === active.id);
      const newIndex = leadStatuses.findIndex(s => s.id === over.id);
      reorderLeadStatuses(arrayMove(leadStatuses, oldIndex, newIndex));
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 glass-panel rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
          </Link>
          <h2 className="text-2xl font-bold font-outfit text-slate-800 dark:text-white">Configurações</h2>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex flex-col gap-2">
          {[
            { id: 'geral', label: 'Gerais', icon: ImageIcon },
            { id: 'bancos', label: 'Bancos', icon: Building2 },
            { id: 'mensagens', label: 'Mensagens', icon: MessageSquare },
            { id: 'status', label: 'Status Leads', icon: Activity },
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                activeTab === tab.id ? 'bg-emerald-600 text-white shadow-lg' : 'glass-panel hover:bg-slate-50 dark:hover:bg-slate-800/30'
              }`}
            >
              <div className="flex items-center gap-3 font-medium">
                <tab.icon size={18} /> {tab.label}
              </div>
              <ChevronRight size={16} className={activeTab === tab.id ? 'opacity-100' : 'opacity-0'} />
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'geral' && (
             <div className="flex flex-col gap-6">
                <div className="glass-panel p-6 rounded-2xl">
                  <h3 className="text-lg font-bold font-outfit mb-4 text-slate-800 dark:text-white">Logo do CRM</h3>
                  <div className="flex items-center gap-6">
                    <div className="w-32 h-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950/50">
                      {logoBase64 ? <img src={logoBase64} alt="Logo" className="max-h-full max-w-full object-contain p-2" /> : <ImageIcon size={32} className="text-slate-400" />}
                    </div>
                    <div className="flex-1 flex flex-col gap-3">
                      <p className="text-sm text-slate-500 max-w-xs">Upload da logo da sua assessoria para personalizar o CRM.</p>
                      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const r = new FileReader();
                          r.onload = () => setLogo(r.result as string);
                          r.readAsDataURL(file);
                        }
                      }} />
                      <div className="flex gap-2">
                        <button onClick={() => fileInputRef.current?.click()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"><Upload size={16} /> Mudar Logo</button>
                        {logoBase64 && <button onClick={() => setLogo(null)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-2 rounded-lg text-sm font-medium">Remover</button>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-2xl">
                  <h3 className="text-lg font-bold font-outfit mb-4 text-slate-800 dark:text-white">Origens de Lead</h3>
                  <form onSubmit={(e) => { e.preventDefault(); if (newOrigin.trim()) { addOrigin(newOrigin.trim()); setNewOrigin(""); } }} className="flex gap-2 mb-4">
                    <input type="text" value={newOrigin} onChange={e => setNewOrigin(e.target.value)} placeholder="Nova origem..." className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm" />
                    <button type="submit" className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700"><Plus size={20} /></button>
                  </form>
                  <div className="flex flex-wrap gap-2">
                    {origins.map(origin => (
                      <div key={origin} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{origin}</span>
                        <button onClick={() => removeOrigin(origin)} className="text-slate-400 hover:text-red-500"><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                </div>
             </div>
          )}

          {activeTab === 'bancos' && (
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-lg font-bold font-outfit mb-4 text-slate-800 dark:text-white">Gerenciar Bancos</h3>
              <form onSubmit={handleBankAdd} className="flex gap-3 mb-6">
                <input type="text" value={newBank} onChange={e => setNewBank(e.target.value)} placeholder="Novo banco..." className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-6 rounded-lg font-bold">Adicionar</button>
              </form>
              
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'banks')}>
                <SortableContext items={banks} strategy={verticalListSortingStrategy}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {banks.map(bank => (
                      <SortableItem key={bank.id} id={bank.id} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl group transition-all hover:bg-white dark:hover:bg-slate-900 shadow-sm relative">
                        <div 
                          onClick={() => { setCurrentBankId(bank.id); bankLogoInputRef.current?.click(); }}
                          className="w-12 h-12 min-w-[48px] rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-emerald-500 transition-colors bg-white dark:bg-slate-800 shadow-[0_0_4px_rgba(0,0,0,0.1)]"
                          title="Upload Logo"
                        >
                          {bank.logo ? <img src={bank.logo} alt={bank.name} className="w-full h-full object-contain p-1.5" /> : <Building2 size={20} className="text-slate-400" />}
                        </div>
                        <div className="flex-1">
                          <span className="font-bold text-slate-800 dark:text-slate-100">{bank.name}</span>
                          <button onClick={() => updateBank(bank.id, { active: !bank.active })} className={`block text-[10px] font-bold px-1.5 py-0.5 rounded mt-1 ${bank.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'}`}>
                            {bank.active ? 'ATIVO' : 'INATIVO'}
                          </button>
                        </div>
                        <button onClick={() => { if(confirm("Remover banco?")) removeBank(bank.id) }} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                      </SortableItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <input type="file" ref={bankLogoInputRef} accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f && currentBankId) {
                  const r = new FileReader();
                  r.onload = () => { updateBank(currentBankId, { logo: r.result as string }); setCurrentBankId(null); };
                  r.readAsDataURL(f);
                }
              }} />
            </div>
          )}

          {activeTab === 'mensagens' && (
            <div className="flex flex-col gap-8">
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-lg font-bold font-outfit mb-4 text-slate-800 dark:text-white flex items-center gap-2"><Tags size={20} className="text-emerald-500" /> Tabulações</h3>
                <form onSubmit={(e) => { e.preventDefault(); if (newTab.trim()) { addTabulation(newTab.trim()); setNewTab(""); } }} className="flex gap-2 mb-6">
                  <input type="text" value={newTab} onChange={e => setNewTab(e.target.value)} placeholder="Ex: Proposta Aceita..." className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm" />
                  <button type="submit" className="bg-emerald-600 text-white font-bold px-4 rounded-lg">Criar</button>
                </form>
                
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'tabulations')}>
                  <SortableContext items={tabulations} strategy={verticalListSortingStrategy}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {tabulations.map(tab => (
                        <SortableItem key={tab.id} id={tab.id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl group hover:border-emerald-500/30 transition-all">
                          {editingTabId === tab.id ? (
                            <div className="flex-1 flex gap-2">
                              <input autoFocus value={editingTabText} onChange={e => setEditingTabText(e.target.value)} className="flex-1 bg-white dark:bg-slate-800 border-none px-2 py-1 text-sm font-bold rounded" onKeyDown={e => { if(e.key==='Enter') { updateTabulation(tab.id, editingTabText); setEditingTabId(null); } }} />
                              <button onClick={() => { updateTabulation(tab.id, editingTabText); setEditingTabId(null); }} className="text-emerald-500"><Check size={16}/></button>
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center justify-between">
                              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{tab.name}</span>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingTabId(tab.id); setEditingTabText(tab.name); }} className="p-1 text-slate-400 hover:text-blue-500"><Edit2 size={14}/></button>
                                <button onClick={() => { if(confirm("Excluir tabulação?")) removeTabulation(tab.id) }} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                              </div>
                            </div>
                          )}
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>

              <div className="glass-panel p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-white flex items-center gap-2"><MessageSquare size={20} className="text-emerald-500" /> Modelos</h3>
                  {!isAddingTemplate && (
                    <button onClick={() => { setEditingTemplateId(null); setIsAddingTemplate(true); setTmplForm({name:'',content:'',tabId:tabulations[0]?.id||'',isDefault:false}); }} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"><Plus size={18} /> Novo Modelo</button>
                  )}
                </div>

                {isAddingTemplate && (
                  <form onSubmit={handleTemplateSave} className="mb-8 p-6 bg-slate-50 dark:bg-slate-950 border-2 border-emerald-500/30 rounded-2xl animate-in slide-in-from-top-4 duration-300">
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase px-1">Nome do Modelo</label>
                          <input required type="text" value={tmplForm.name} onChange={e => setTmplForm({...tmplForm, name: e.target.value})} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase px-1">Tabulação</label>
                          <select required value={tmplForm.tabId} onChange={e => setTmplForm({...tmplForm, tabId: e.target.value})} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm">
                            {tabulations.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase px-1 flex justify-between">
                          <span>Conteúdo</span>
                          <span className="text-emerald-500 lowercase">Variáveis: {'{nome}, {valor}, {banco}'}</span>
                        </label>
                        <textarea required rows={5} value={tmplForm.content} onChange={e => setTmplForm({...tmplForm, content: e.target.value})} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm font-sans" />
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                         <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={tmplForm.isDefault} onChange={e => setTmplForm({...tmplForm, isDefault: e.target.checked})} className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500" />
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Padrão</span>
                         </label>
                         <div className="flex-1 flex justify-end gap-3">
                           <button type="button" onClick={() => setIsAddingTemplate(false)} className="text-slate-400 font-bold px-4">Cancelar</button>
                           <button type="submit" className="bg-emerald-600 text-white px-8 py-2.5 rounded-lg font-black shadow-md">{editingTemplateId ? 'Salvar Alterações' : 'Criar Modelo'}</button>
                         </div>
                      </div>
                    </div>
                  </form>
                )}

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'templates')}>
                  <SortableContext items={messageTemplates} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                      {messageTemplates.map(tmpl => (
                        <SortableItem key={tmpl.id} id={tmpl.id} className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-emerald-500/30 transition-all group flex gap-2">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-3 px-1">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-slate-800 dark:text-slate-100">{tmpl.name}</span>
                                {tmpl.isDefault && <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded">PADRÃO</span>}
                                <span className="bg-slate-200 dark:bg-slate-800 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded italic">
                                  {tabulations.find(t => t.id === tmpl.tabId)?.name || 'Sem Tabulação'}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!tmpl.isDefault && (
                                  <button onClick={() => setDefaultTemplate(tmpl.id)} className="p-2 text-slate-400 hover:text-emerald-500" title="Marcar como padrão"><Star size={18}/></button>
                                )}
                                <button onClick={() => handleEditTemplate(tmpl)} className="p-2 text-slate-400 hover:text-blue-500" title="Editar"><Edit2 size={18}/></button>
                                <button onClick={() => { if(confirm("Excluir modelo?")) removeTemplate(tmpl.id) }} className="p-2 text-slate-400 hover:text-red-500" title="Excluir"><Trash2 size={18}/></button>
                              </div>
                            </div>
                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 p-4 rounded-xl text-sm text-slate-600 dark:text-slate-400 italic font-sans whitespace-pre-wrap">
                              "{tmpl.content}"
                            </div>
                          </div>
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          )}

          {activeTab === 'status' && (
            <div className="glass-panel p-6 rounded-2xl animate-in fade-in duration-300">
               <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-white flex items-center gap-2"><Activity size={20} className="text-emerald-500" /> Status dos Leads</h3>
              </div>

              <form onSubmit={handleStatusAdd} className="flex gap-3 mb-8 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase px-1">Nome do Status</label>
                  <input required type="text" value={newStatus.name} onChange={e => setNewStatus({...newStatus, name: e.target.value})} placeholder="Ex: Lead Quente" className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm" />
                </div>
                <div className="flex flex-col gap-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase px-1">Cor</label>
                   <input type="color" value={newStatus.color} onChange={e => setNewStatus({...newStatus, color: e.target.value})} className="h-9 w-16 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg p-1 cursor-pointer" />
                </div>
                <div className="flex items-end">
                   <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-6 rounded-lg transition-all active:scale-95 shadow-md">Criar</button>
                </div>
              </form>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'status')}>
                <SortableContext items={leadStatuses} strategy={verticalListSortingStrategy}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {leadStatuses.map(status => (
                      <SortableItem key={status.id} id={status.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl group hover:shadow-md transition-all">
                        {editingStatusId === status.id ? (
                          <div className="flex-1 flex items-center gap-2">
                             <input autoFocus value={editingStatusData.name} onChange={e => setEditingStatusData({...editingStatusData, name: e.target.value})} className="flex-1 bg-white dark:bg-slate-800 border-none px-2 py-1 text-sm font-bold rounded" onKeyDown={e => { if(e.key==='Enter') { updateLeadStatus(status.id, editingStatusData); setEditingStatusId(null); } }} />
                             <input type="color" value={editingStatusData.color} onChange={e => setEditingStatusData({...editingStatusData, color: e.target.value})} className="w-8 h-8 rounded border-none cursor-pointer" />
                             <button onClick={() => { updateLeadStatus(status.id, editingStatusData); setEditingStatusId(null); }} className="text-emerald-500"><Check size={18}/></button>
                             <button onClick={() => setEditingStatusId(null)} className="text-slate-400"><X size={18}/></button>
                          </div>
                        ) : (
                          <>
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }}></div>
                            <div className="flex-1">
                              <span className={`text-sm font-bold ${status.active ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 line-through'}`}>{status.name}</span>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => updateLeadStatus(status.id, { active: !status.active })} className={`p-1 ${status.active ? 'text-emerald-500' : 'text-slate-400'} hover:scale-110 transition-transform`}>
                                  <Check size={16} />
                               </button>
                               <button onClick={() => { setEditingStatusId(status.id); setEditingStatusData({name: status.name, color: status.color}); }} className="p-1 text-slate-400 hover:text-blue-500"><Edit2 size={16}/></button>
                               <button onClick={() => { if(confirm(`Excluir status "${status.name}"?`)) removeLeadStatus(status.id) }} className="p-1 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                          </>
                        )}
                      </SortableItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="glass-panel p-6 rounded-2xl animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-white flex items-center gap-2">
                  <LayoutDashboard size={20} className="text-emerald-500" /> Configuração dos Cards do Dashboard
                </h3>
              </div>
              <p className="text-sm text-slate-500 mb-8">Personalize os nomes exibidos nos cards do topo do CRM.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(Object.keys(dashboardCards) as Array<keyof typeof dashboardCards>).map((key) => (
                  <div key={key} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black text-slate-400 uppercase px-1 block mb-2">
                      Card: {key.charAt(0).toUpperCase() + key.slice(1)}
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={dashboardCards[key].label} 
                        onChange={(e) => updateDashboardCard(key, e.target.value)}
                        placeholder="Nome do card..." 
                        className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm font-bold shadow-sm" 
                      />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase w-full mb-1">Status Vinculados:</span>
                      {dashboardCards[key].statuses.map(st => (
                        <span key={st} className="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded font-bold">{st}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
