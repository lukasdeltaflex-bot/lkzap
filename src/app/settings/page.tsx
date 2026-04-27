"use client";

import { useState, useRef } from "react";
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
  Star
} from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { 
    banks, updateBank, removeBank, addBank,
    origins, addOrigin, removeOrigin,
    tabulations, addTabulation, updateTabulation, removeTabulation,
    messageTemplates, addTemplate, updateTemplate, removeTemplate, setDefaultTemplate,
    logoBase64, setLogo 
  } = useSettingsStore();

  // Local states for forms
  const [newBank, setNewBank] = useState("");
  const [newOrigin, setNewOrigin] = useState("");
  const [newTab, setNewTab] = useState("");
  
  const [activeTab, setActiveTab] = useState<'geral' | 'bancos' | 'mensagens'>('geral');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bankLogoInputRef = useRef<HTMLInputElement>(null);
  const [currentBankId, setCurrentBankId] = useState<string | null>(null);

  // Template Form State
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [tmplForm, setTmplForm] = useState({
    name: '',
    content: '',
    tabId: tabulations[0]?.id || '',
    isDefault: false
  });

  const handleBankAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBank.trim()) {
      addBank(newBank.trim());
      setNewBank("");
    }
  };

  const handleBankLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentBankId) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      updateBank(currentBankId, { logo: reader.result as string });
      setCurrentBankId(null);
    };
    reader.readAsDataURL(file);
  };

  const handleTemplateSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (tmplForm.name && tmplForm.content) {
      addTemplate({
        ...tmplForm,
        isActive: true
      });
      setIsAddingTemplate(false);
      setTmplForm({ name: '', content: '', tabId: tabulations[0]?.id || '', isDefault: false });
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 glass-panel rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
          </Link>
          <h2 className="text-2xl font-bold font-outfit text-slate-800 dark:text-white">
            Configurações
          </h2>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Navigation */}
        <div className="w-full md:w-64 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('geral')}
            className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
              activeTab === 'geral' ? 'bg-emerald-600 text-white shadow-lg' : 'glass-panel hover:bg-slate-50 dark:hover:bg-slate-800/30'
            }`}
          >
            <div className="flex items-center gap-3 font-medium">
              <ImageIcon size={18} /> Gerais
            </div>
            <ChevronRight size={16} className={activeTab === 'geral' ? 'opacity-100' : 'opacity-0'} />
          </button>
          <button 
            onClick={() => setActiveTab('bancos')}
            className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
              activeTab === 'bancos' ? 'bg-emerald-600 text-white shadow-lg' : 'glass-panel hover:bg-slate-50 dark:hover:bg-slate-800/30'
            }`}
          >
            <div className="flex items-center gap-3 font-medium">
              <Building2 size={18} /> Bancos
            </div>
            <ChevronRight size={16} className={activeTab === 'bancos' ? 'opacity-100' : 'opacity-0'} />
          </button>
          <button 
            onClick={() => setActiveTab('mensagens')}
            className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
              activeTab === 'mensagens' ? 'bg-emerald-600 text-white shadow-lg' : 'glass-panel hover:bg-slate-50 dark:hover:bg-slate-800/30'
            }`}
          >
            <div className="flex items-center gap-3 font-medium">
              <MessageSquare size={18} /> Mensagens
            </div>
            <ChevronRight size={16} className={activeTab === 'mensagens' ? 'opacity-100' : 'opacity-0'} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'geral' && (
            <div className="flex flex-col gap-6">
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-lg font-bold font-outfit mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
                   Logo do CRM
                </h3>
                <div className="flex items-center gap-6">
                  <div className="w-32 h-32 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950/50">
                    {logoBase64 ? (
                      <img src={logoBase64} alt="Logo" className="max-h-full max-w-full object-contain p-2" />
                    ) : (
                      <div className="text-slate-400 dark:text-slate-500 text-sm flex flex-col items-center gap-2">
                        <ImageIcon size={32} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-3">
                    <p className="text-sm text-slate-500 max-w-xs">Faça upload da logo da sua assessoria para personalizar o CRM e o PWA.</p>
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const r = new FileReader();
                        r.onload = () => setLogo(r.result as string);
                        r.readAsDataURL(file);
                      }
                    }} />
                    <div className="flex gap-2">
                      <button onClick={() => fileInputRef.current?.click()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                        <Upload size={16} /> Mudar Logo
                      </button>
                      {logoBase64 && <button onClick={() => setLogo(null)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 px-3 py-2 rounded-lg text-sm font-medium">Remover</button>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-lg font-bold font-outfit mb-4 text-slate-800 dark:text-white">Origens de Lead</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (newOrigin.trim()) { addOrigin(newOrigin.trim()); setNewOrigin(""); }
                }} className="flex gap-2 mb-4">
                  <input type="text" value={newOrigin} onChange={e => setNewOrigin(e.target.value)} placeholder="Nova origem (ex: Facebook, TV...)" className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm" />
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
            <div className="flex flex-col gap-6">
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-lg font-bold font-outfit mb-4 text-slate-800 dark:text-white">Gerenciar Bancos</h3>
                <form onSubmit={handleBankAdd} className="flex gap-3 mb-6">
                  <input type="text" value={newBank} onChange={e => setNewBank(e.target.value)} placeholder="Novo banco..." className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-6 rounded-lg font-bold transition-all shadow-md active:scale-95">Adicionar</button>
                </form>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {banks.map(bank => (
                    <div key={bank.id} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl group transition-all hover:bg-white dark:hover:bg-slate-900 shadow-sm relative">
                      <div 
                        onClick={() => {
                          setCurrentBankId(bank.id);
                          bankLogoInputRef.current?.click();
                        }}
                        className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-emerald-500 transition-colors bg-white dark:bg-slate-800"
                        title="Upload Logo"
                      >
                        {bank.logo ? (
                          <img src={bank.logo} alt={bank.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <Building2 size={20} className="text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="font-bold text-slate-800 dark:text-slate-100">{bank.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                           <button 
                             onClick={() => updateBank(bank.id, { active: !bank.active })}
                             className={`text-[10px] font-bold px-1.5 py-0.5 rounded leading-none ${bank.active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'}`}
                           >
                              {bank.active ? 'ATIVO' : 'INATIVO'}
                           </button>
                        </div>
                      </div>
                      <button onClick={() => removeBank(bank.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-slate-400 hover:text-red-500">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                  <input type="file" ref={bankLogoInputRef} accept="image/*" className="hidden" onChange={handleBankLogoUpload} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mensagens' && (
            <div className="flex flex-col gap-8">
              {/* Tabulações */}
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-lg font-bold font-outfit mb-4 text-slate-800 dark:text-white flex items-center gap-2">
                  <Tags size={20} className="text-emerald-500" /> Tabulações / Abordagens
                </h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (newTab.trim()) { addTabulation(newTab.trim()); setNewTab(""); }
                }} className="flex gap-2 mb-6">
                  <input type="text" value={newTab} onChange={e => setNewTab(e.target.value)} placeholder="Ex: Proposta Aceita, Replay..." className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm" />
                  <button type="submit" className="bg-emerald-600 text-white font-bold px-4 rounded-lg">Criar</button>
                </form>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tabulations.map(tab => (
                    <div key={tab.id} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-xl group">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{tab.name}</span>
                      <button onClick={() => removeTabulation(tab.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modelos de Mensagem */}
              <div className="glass-panel p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold font-outfit text-slate-800 dark:text-white flex items-center gap-2">
                    <MessageSquare size={20} className="text-emerald-500" /> Modelos de Mensagem
                  </h3>
                  <button 
                    onClick={() => setIsAddingTemplate(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                  >
                    <Plus size={18} /> Novo Modelo
                  </button>
                </div>

                {isAddingTemplate && (
                  <form onSubmit={handleTemplateSave} className="mb-8 p-6 bg-slate-50 dark:bg-slate-950 border-2 border-emerald-500/30 rounded-2xl animate-in zoom-in-95 duration-200">
                    <div className="flex flex-col gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-slate-500 uppercase px-1">Nome do Modelo</label>
                          <input required type="text" value={tmplForm.name} onChange={e => setTmplForm({...tmplForm, name: e.target.value})} placeholder="Ex: Abordagem Urgente" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-slate-500 uppercase px-1">Tabulação</label>
                          <select required value={tmplForm.tabId} onChange={e => setTmplForm({...tmplForm, tabId: e.target.value})} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm outline-none">
                            {tabulations.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-slate-500 uppercase px-1 flex justify-between">
                          <span>Conteúdo da Mensagem</span>
                          <span className="text-[10px] text-emerald-500">Variáveis: {'{nome}, {valor}, {banco}, {origem}, {telefone}, {cpf}'}</span>
                        </label>
                        <textarea 
                          required 
                          rows={6}
                          value={tmplForm.content} 
                          onChange={e => setTmplForm({...tmplForm, content: e.target.value})} 
                          placeholder="Olá, {nome}... Suas parcelas estão em {valor}..."
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
                        />
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={tmplForm.isDefault} onChange={e => setTmplForm({...tmplForm, isDefault: e.target.checked})} className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300" />
                          <span className="text-sm font-bold text-slate-600 dark:text-slate-300">Definir como Padrão</span>
                        </label>
                      </div>

                      <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={() => setIsAddingTemplate(false)} className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold transition-colors">Cancelar</button>
                        <button type="submit" className="bg-emerald-600 text-white px-8 py-2 rounded-lg font-bold shadow-md hover:bg-emerald-700 transition-all active:scale-95">Salvar Modelo</button>
                      </div>
                    </div>
                  </form>
                )}

                <div className="space-y-4">
                  {messageTemplates.map(tmpl => (
                    <div key={tmpl.id} className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl hover:border-emerald-500/30 transition-all group shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-800 dark:text-slate-100">{tmpl.name}</span>
                          {tmpl.isDefault && <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><Star size={10} fill="currentColor" /> PADRÃO</span>}
                          <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                            {tabulations.find(t => t.id === tmpl.tabId)?.name || 'Sem Tabulação'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!tmpl.isDefault && (
                            <button onClick={() => setDefaultTemplate(tmpl.id)} className="p-2 text-slate-400 hover:text-emerald-500" title="Definir como padrão">
                               <Check size={18} />
                            </button>
                          )}
                          <button onClick={() => removeTemplate(tmpl.id)} className="p-2 text-slate-400 hover:text-red-500">
                             <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 whitespace-pre-wrap font-sans leading-relaxed italic">
                        "{tmpl.content}"
                      </p>
                    </div>
                  ))}
                  {messageTemplates.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                       Nenhum modelo de mensagem cadastrado.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
