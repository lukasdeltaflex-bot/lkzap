"use client";

import React, { useState, useEffect } from "react";
import { useSettingsStore, DashboardCardConfig } from "../../store/useSettingsStore";
import { 
  Building2, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Activity, 
  GripVertical, 
  Save, 
  LayoutDashboard,
  ImageIcon,
  Search
} from "lucide-react";
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

interface SortableItemProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

const SortableItem = ({ id, children, className }: SortableItemProps) => {
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
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={className}>
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
        <GripVertical size={20} />
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};

export default function SettingsPage() {
  const { 
    banks, 
    origins, 
    tabulations, 
    messageTemplates, 
    leadStatuses,
    logoBase64,
    dashboardCards,
    addBank, 
    updateBank, 
    removeBank, 
    addOrigin, 
    removeOrigin,
    addTabulation,
    updateTabulation,
    removeTabulation,
    addTemplate,
    updateTemplate,
    removeTemplate,
    setDefaultTemplate,
    addLeadStatus,
    updateLeadStatus,
    removeLeadStatus,
    reorderLeadStatuses,
    reorderBanks,
    reorderOrigins,
    reorderTabulations,
    reorderTemplates,
    setLogo,
    updateDashboardCard,
    reorderDashboardCards
  } = useSettingsStore();

  // Navigation state
  const [activeTab, setActiveTab] = useState<'geral' | 'bancos' | 'mensagens' | 'status' | 'dashboard'>('geral');
  
  // Local form states
  const [newBank, setNewBank] = useState("");
  const [newOrigin, setNewOrigin] = useState("");
  const [newTabulation, setNewTabulation] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newStatusColor, setNewStatusColor] = useState("#94a3b8");

  // DND setup
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent, type: 'banks' | 'origins' | 'tabulations' | 'templates' | 'status' | 'dashboard') => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      if (type === 'banks') {
        const oldIndex = banks.findIndex(b => b.id === active.id);
        const newIndex = banks.findIndex(b => b.id === over.id);
        reorderBanks(arrayMove(banks, oldIndex, newIndex));
      } else if (type === 'origins') {
        const oldIndex = origins.indexOf(active.id as string);
        const newIndex = origins.indexOf(over.id as string);
        reorderOrigins(arrayMove(origins, oldIndex, newIndex));
      } else if (type === 'tabulations') {
        const oldIndex = tabulations.findIndex(t => t.id === active.id);
        const newIndex = tabulations.findIndex(t => t.id === over.id);
        reorderTabulations(arrayMove(tabulations, oldIndex, newIndex));
      } else if (type === 'templates') {
        const oldIndex = messageTemplates.findIndex(t => t.id === active.id);
        const newIndex = messageTemplates.findIndex(t => t.id === over.id);
        reorderTemplates(arrayMove(messageTemplates, oldIndex, newIndex));
      } else if (type === 'status') {
        const oldIndex = leadStatuses.findIndex(s => s.id === active.id);
        const newIndex = leadStatuses.findIndex(s => s.id === over.id);
        reorderLeadStatuses(arrayMove(leadStatuses, oldIndex, newIndex));
      } else if (type === 'dashboard') {
        const oldIndex = dashboardCards.findIndex(c => c.id === active.id);
        const newIndex = dashboardCards.findIndex(c => c.id === over.id);
        const newCards = arrayMove(dashboardCards, oldIndex, newIndex).map((card, idx) => ({
          ...card,
          order: idx + 1
        }));
        reorderDashboardCards(newCards);
      }
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex flex-col gap-2">
          <h2 className="text-xl font-bold font-outfit text-slate-800 dark:text-white mb-4 px-2">Configurações</h2>
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
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 scale-[1.02]' 
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'geral' && (
            <div className="glass-panel p-6 rounded-2xl animate-in fade-in duration-300">
              <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <ImageIcon size={20} className="text-emerald-500" /> Identidade Visual
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Logo do App (PWA / Header)</label>
                  <div className="flex items-center gap-6 p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-900/50">
                    <div className="w-24 h-24 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-inner overflow-hidden border border-slate-100 dark:border-slate-700">
                      {logoBase64 ? (
                        <img src={logoBase64} alt="Logo" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <ImageIcon className="text-slate-300" size={32} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-500 mb-3">Recomendado: Imagem quadrada (PNG ou SVG) com fundo transparente.</p>
                      <label className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold cursor-pointer transition-colors shadow-sm inline-block">
                        Escolher Arquivo
                        <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                      </label>
                      {logoBase64 && (
                        <button onClick={() => setLogo(null)} className="ml-3 text-xs text-red-500 font-bold hover:underline">Remover</button>
                      )}
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800" />

                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">Origens dos Leads</label>
                  <div className="flex gap-2 mb-4">
                    <input 
                      type="text" 
                      value={newOrigin}
                      onChange={(e) => setNewOrigin(e.target.value)}
                      placeholder="Ex: URA Reversa"
                      className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                    <button 
                      onClick={() => { if(newOrigin){ addOrigin(newOrigin); setNewOrigin(""); } }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl shadow-md transition-transform active:scale-95"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'origins')}>
                    <SortableContext items={origins} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {origins.map(origin => (
                          <SortableItem key={origin} id={origin} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl group hover:border-emerald-500/30 transition-all">
                            <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">{origin}</span>
                            <button onClick={() => removeOrigin(origin)} className="text-slate-300 hover:text-red-500 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </SortableItem>
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bancos' && (
            <div className="glass-panel p-6 rounded-2xl animate-in fade-in duration-300">
              <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <Building2 size={20} className="text-emerald-500" /> Bancos e Instituições
              </h3>
              
              <div className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  value={newBank}
                  onChange={(e) => setNewBank(e.target.value)}
                  placeholder="Nome do Banco"
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
                <button 
                  onClick={() => { if(newBank){ addBank(newBank); setNewBank(""); } }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl shadow-md transition-transform active:scale-95"
                >
                  <Plus size={20} />
                </button>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'banks')}>
                <SortableContext items={banks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {banks.map(bank => (
                      <SortableItem key={bank.id} id={bank.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl group hover:border-emerald-500/30 transition-all">
                        <div className="flex-1 flex items-center gap-4">
                          <span className={`text-sm font-medium ${bank.active ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 line-through'}`}>
                            {bank.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateBank(bank.id, { active: !bank.active })}
                            className={`text-[10px] font-black px-2 py-1 rounded transition-colors ${bank.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}
                          >
                            {bank.active ? 'ATIVO' : 'INATIVO'}
                          </button>
                          <button onClick={() => removeBank(bank.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </SortableItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {activeTab === 'mensagens' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Tabulations Config */}
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <Activity size={20} className="text-emerald-500" /> Tabulações Disponíveis
                </h3>
                <div className="flex gap-2 mb-6">
                  <input 
                    type="text" 
                    value={newTabulation}
                    onChange={(e) => setNewTabulation(e.target.value)}
                    placeholder="Nova tabulação..."
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                  <button 
                    onClick={() => { if(newTabulation){ addTabulation(newTabulation); setNewTabulation(""); } }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl shadow-md transition-transform active:scale-95"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'tabulations')}>
                  <SortableContext items={tabulations.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {tabulations.map(tab => (
                        <SortableItem key={tab.id} id={tab.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl group hover:border-emerald-500/30 transition-all">
                          <input 
                            type="text" 
                            value={tab.name}
                            onChange={(e) => updateTabulation(tab.id, e.target.value)}
                            className="flex-1 bg-transparent border-none text-sm font-medium text-slate-700 dark:text-slate-300 focus:ring-0 outline-none"
                          />
                          <button onClick={() => removeTabulation(tab.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </SortableItem>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>

              {/* Templates Config */}
              <div className="glass-panel p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-white flex items-center gap-2">
                    <MessageSquare size={20} className="text-emerald-500" /> Templates de Mensagem
                  </h3>
                  <button 
                    onClick={() => addTemplate({ 
                      name: 'Novo Template', 
                      content: '', 
                      tabId: tabulations[0]?.id || '', 
                      isActive: true, 
                      isDefault: false 
                    })}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md transition-transform active:scale-95"
                  >
                    Novo Template
                  </button>
                </div>

                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'templates')}>
                  <SortableContext items={messageTemplates.map(t => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                      {messageTemplates.map(template => (
                        <SortableItem key={template.id} id={template.id} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl block transition-all group hover:border-emerald-500/30">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <input 
                                type="text" 
                                value={template.name}
                                onChange={(e) => updateTemplate(template.id, { name: e.target.value })}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1 text-sm font-bold shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                              />
                              <select 
                                value={template.tabId}
                                onChange={(e) => updateTemplate(template.id, { tabId: e.target.value })}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                              >
                                {tabulations.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => setDefaultTemplate(template.id)}
                                className={`text-[10px] font-black px-2 py-1 rounded transition-colors ${template.isDefault ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500 dark:bg-slate-800'}`}
                              >
                                {template.isDefault ? 'PADRÃO' : 'MARCAR PADRÃO'}
                              </button>
                              <button onClick={() => removeTemplate(template.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <textarea 
                            value={template.content}
                            onChange={(e) => updateTemplate(template.id, { content: e.target.value })}
                            rows={4}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
                            placeholder="Sua mensagem aqui..."
                          />
                          <p className="mt-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            Tags: <span className="text-emerald-500">{"{nome}"}</span>, <span className="text-emerald-500">{"{valor}"}</span>, <span className="text-emerald-500">{"{banco}"}</span>
                          </p>
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
              <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <Activity size={20} className="text-emerald-500" /> Fluxo de Status
              </h3>
              
              <div className="flex flex-col md:flex-row gap-2 mb-6">
                <input 
                  type="text" 
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  placeholder="Nome do Status"
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={newStatusColor}
                    onChange={(e) => setNewStatusColor(e.target.value)}
                    className="w-12 h-[46px] rounded-xl border border-slate-200 dark:border-slate-800 p-1 bg-white dark:bg-slate-900 cursor-pointer"
                  />
                  <button 
                    onClick={() => { if(newStatus){ addLeadStatus(newStatus, newStatusColor); setNewStatus(""); } }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-xl shadow-md transition-transform active:scale-95"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'status')}>
                <SortableContext items={leadStatuses.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {leadStatuses.map(status => (
                      <SortableItem key={status.id} id={status.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl group hover:border-emerald-500/30 transition-all">
                        <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: status.color }} />
                        <div className="flex-1">
                          <input 
                            type="text" 
                            value={status.name}
                            onChange={(e) => updateLeadStatus(status.id, { name: e.target.value })}
                            className={`text-sm font-medium bg-transparent border-none focus:ring-0 outline-none ${status.active ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 line-through'}`}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={status.color}
                            onChange={(e) => updateLeadStatus(status.id, { color: e.target.value })}
                            className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-white dark:bg-slate-900 cursor-pointer overflow-hidden"
                          />
                          <button 
                            onClick={() => updateLeadStatus(status.id, { active: !status.active })}
                            className={`text-[10px] font-black px-2 py-1 rounded transition-colors ${status.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}
                          >
                            {status.active ? 'ATIVO' : 'INATIVO'}
                          </button>
                          <button onClick={() => removeLeadStatus(status.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
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
              <p className="text-sm text-slate-500 mb-8">Personalize os nomes, a ordem e qual status cada card deve contabilizar.</p>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, 'dashboard')}>
                <SortableContext items={(dashboardCards || []).map(c => c.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {(dashboardCards || []).map((card) => (
                      <SortableItem key={card.id} id={card.id} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex gap-4 group transition-all hover:border-emerald-500/30 shadow-sm">
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-3">
                              <input 
                                type="text" 
                                value={card.label} 
                                onChange={(e) => updateDashboardCard(card.id, { label: e.target.value })}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-black shadow-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                              />
                              <button 
                                onClick={() => updateDashboardCard(card.id, { visible: !card.visible })}
                                className={`text-[10px] font-black px-2 py-1 rounded transition-colors ${card.visible ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-slate-200 text-slate-500 dark:bg-slate-800'}`}
                              >
                                {card.visible ? 'VISÍVEL' : 'OCULTO'}
                              </button>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
                              <select 
                                value={card.statusName}
                                onChange={(e) => updateDashboardCard(card.id, { statusName: e.target.value })}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
                              >
                                {leadStatuses.map(s => (
                                  <option key={s.id} value={s.name}>{s.name}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </SortableItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              
              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 rounded-xl">
                 <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                   💡 <b>Dica:</b> Arraste os cards usando o ícone lateral para mudar a ordem de exibição no Dashboard. Cada card contabiliza apenas leads com o status exato selecionado.
                 </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
