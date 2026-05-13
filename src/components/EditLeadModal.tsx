"use client";

import React, { useState, useEffect } from 'react';
import { useLeadStore } from '../store/useLeadStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { X } from 'lucide-react';
import { normalizeCPF, normalizePhone, validateCPF, formatCPF, formatBRL, parseBRL, formatDisplayPhone } from '../lib/utils';
import { Lead, LeadStatus, LeadQueue, Bank, LeadStatusConfig, MessageTemplate, Tabulation, Tag } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

export const EditLeadModal = ({ isOpen, onClose, lead }: Props) => {
  const { updateLead } = useLeadStore();
  const { banks, origins, tabulations, messageTemplates, leadStatuses } = useSettingsStore();

  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [bank, setBank] = useState('');
  const [origin, setOrigin] = useState('');
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<LeadStatus>('');
  const [queue, setQueue] = useState<LeadQueue>('Pronto para enviar');
  const [templateId, setTemplateId] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (lead) {
      setName(lead.name);
      setCpf(formatCPF(lead.cpf));
      setPhone(formatDisplayPhone(lead.phone));
      setBank(lead.bank);
      setOrigin(lead.origin || '');
      setValue(formatBRL(lead.availableValue));
      setStatus(lead.status);
      setQueue(lead.queue);
      setTemplateId(lead.selectedTemplateId || '');
      setNotes(lead.notes || '');
      setSelectedTags(lead.tags || []);
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const isCPFValid = cpf.replace(/\D/g, '').length === 11 ? validateCPF(cpf) : true;
  const canSubmit = name.length > 2 && 
                    cpf.replace(/\D/g, '').length === 11 && 
                    validateCPF(cpf) && 
                    phone.replace(/\D/g, "").length >= 10 && 
                    parseBRL(value) >= 0 &&
                    bank && 
                    origin && 
                    status;

  function formatPhoneInput(val: string) {
    const digits = val.replace(/\D/g, "");
    if (!digits) return "";
    let formatted = "(" + digits.slice(0, 2);
    if (digits.length > 2) formatted += ") " + digits.slice(2, 7);
    if (digits.length > 7) formatted += "-" + digits.slice(7, 11);
    return formatted;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (!canSubmit) {
      setErrorMessage("Por favor, preencha todos os campos obrigatórios corretamente.");
      return;
    }

    const updatedData = {
      name,
      cpf: normalizeCPF(cpf),
      phone: normalizePhone(phone),
      bank,
      origin,
      availableValue: parseBRL(value),
      status,
      queue,
      selectedTemplateId: templateId || undefined,
      notes,
      tags: selectedTags
    };

    console.log("Salvando lead:", lead.id, updatedData);
    setIsSaving(true);

    try {
      await updateLead(lead.id, updatedData);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar edição do lead:", error);
      setErrorMessage("Erro ao salvar no servidor. Tente novamente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg rounded-2xl shadow-xl overflow-hidden shadow-emerald-500/10">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold font-outfit text-slate-800 dark:text-slate-100 italic">Editar Cliente</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 cursor-pointer">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[12px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">Nome Completo</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-[12px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">CPF</label>
              <input required type="text" value={cpf} onChange={e => setCpf(formatCPF(e.target.value))} className={`w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 ${!isCPFValid ? 'ring-rose-500' : ''}`} />
            </div>

            <div>
              <label className="block text-[12px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">WhatsApp</label>
              <input required type="text" value={phone} onChange={e => setPhone(formatPhoneInput(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-[12px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">Banco</label>
              <select required value={bank} onChange={e => setBank(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100">
                {banks.map((b: Bank) => (
                  <option key={typeof b === 'string' ? b : b.id} value={typeof b === 'string' ? b : b.name} className="dark:bg-slate-800">
                    {typeof b === 'string' ? b : b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">Valor Disponível</label>
              <input required type="text" value={value} onChange={e => setValue(formatBRL(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>

            <div>
              <label className="block text-[12px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">Origem</label>
              <select required value={origin} onChange={e => setOrigin(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100">
                {origins.map((o: string) => <option key={o} value={o} className="dark:bg-slate-800">{o}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">Status</label>
              <select required value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100">
                {leadStatuses.map((s: LeadStatusConfig) => <option key={s.id} value={s.name} className="dark:bg-slate-800">{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">Fila</label>
              <select required value={queue} onChange={e => setQueue(e.target.value as LeadQueue)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100">
                <option value="Pronto para enviar" className="dark:bg-slate-800">Pronto para enviar</option>
                <option value="Aguardando" className="dark:bg-slate-800">Aguardando</option>
                <option value="Higienização" className="dark:bg-slate-800">Higienização</option>
                <option value="Frio" className="dark:bg-slate-800">Frio</option>
                <option value="Reabordar" className="dark:bg-slate-800">Reabordar</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[12px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">Tags Rápidas</label>
              <div className="flex flex-wrap gap-2 p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
                {useSettingsStore.getState().tags.map((tag: Tag) => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        setSelectedTags(prev => 
                          prev.includes(tag.id) ? prev.filter(id => id !== tag.id) : [...prev, tag.id]
                        );
                      }}
                      style={{ 
                        backgroundColor: isSelected ? tag.color : 'transparent',
                        borderColor: isSelected ? tag.color : '#cbd5e1',
                        color: isSelected ? '#fff' : tag.color
                      }}
                      className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all"
                    >
                      {tag.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[12px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">Observações/Notas do Cliente</label>
              <textarea 
                rows={3} 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                placeholder="Ex: Cliente pediu retorno amanhã, não atende, falar com filho..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[12px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">Mensagem/Tabulação</label>
              <select value={templateId} onChange={e => setTemplateId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100">
                <option value="" className="dark:bg-slate-800">Padrão do Sistema</option>
                {messageTemplates.map((tmpl: MessageTemplate) => (
                  <option key={tmpl.id} value={tmpl.id} className="dark:bg-slate-800">{tmpl.name} ({tabulations.find((t: Tabulation)=>t.id===tmpl.tabId)?.name})</option>
                ))}
              </select>
            </div>
          </div>

          {errorMessage && (
            <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-3 rounded-lg text-xs font-bold border border-rose-100 dark:border-rose-800 animate-in shake duration-300">
              {errorMessage}
            </div>
          )}

          <div className="pt-6 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-100">Cancelar</button>
            <button 
              type="submit" 
              disabled={isSaving || !canSubmit} 
              className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-black transition-all flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
