"use client";

import React, { useState, useEffect } from 'react';
import { useLeadStore } from '../store/useLeadStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { X } from 'lucide-react';
import { normalizeCPF, normalizePhone, validateCPF, formatCPF, formatCurrencyBRL, parseCurrencyBRL, formatDisplayPhone } from '../lib/utils';
import { Lead, LeadStatus, LeadQueue } from '../types';

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

  useEffect(() => {
    if (lead) {
      setName(lead.name);
      setCpf(formatCPF(lead.cpf));
      setPhone(formatDisplayPhone(lead.phone));
      setBank(lead.bank);
      setOrigin(lead.origin || '');
      setValue(formatCurrencyBRL(lead.availableValue));
      setStatus(lead.status);
      setQueue(lead.queue);
      setTemplateId(lead.selectedTemplateId || '');
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  const isCPFValid = cpf.replace(/\D/g, '').length === 11 ? validateCPF(cpf) : true;
  const canSubmit = name.length > 2 && cpf.replace(/\D/g, '').length === 11 && validateCPF(cpf) && phone.replace(/\D/g, "").length >= 10 && parseCurrencyBRL(value) > 0 && bank && origin && status;

  function formatPhoneInput(val: string) {
    const digits = val.replace(/\D/g, "");
    if (!digits) return "";
    let formatted = "(" + digits.slice(0, 2);
    if (digits.length > 2) formatted += ") " + digits.slice(2, 7);
    if (digits.length > 7) formatted += "-" + digits.slice(7, 11);
    return formatted;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    updateLead(lead.id, {
      name,
      cpf: normalizeCPF(cpf),
      phone: normalizePhone(phone),
      bank,
      origin,
      availableValue: parseCurrencyBRL(value),
      status,
      queue,
      selectedTemplateId: templateId || undefined
    });

    onClose();
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
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">Nome Completo</label>
              <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded[...]" />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">CPF</label>
              <input required type="text" value={cpf} onChange={e => setCpf(formatCPF(e.target.value))} className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-lg px-4 py-2.5 outline-none [...]`} />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">WhatsApp</label>
              <input required type="text" value={phone} onChange={e => setPhone(formatPhoneInput(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:b[...]" />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">Banco</label>
              <select required value={bank} onChange={e => setBank(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 p[...]">
                {banks.map(b => (
                  <option key={typeof b === 'string' ? b : b.id} value={typeof b === 'string' ? b : b.name}>
                    {typeof b === 'string' ? b : b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">Valor Disponível</label>
              <input required type="text" value={value} onChange={e => setValue(formatCurrencyBRL(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:bo[...]" />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">Origem</label>
              <select required value={origin} onChange={e => setOrigin(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px[...]">
                {origins.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">Status</label>
              <select required value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px[...]">
                {leadStatuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">Fila</label>
              <select required value={queue} onChange={e => setQueue(e.target.value as LeadQueue)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 ro[...]">
                <option value="Pronto para enviar">Pronto para enviar</option>
                <option value="Aguardando">Aguardando</option>
                <option value="Frio">Frio</option>
                <option value="Reabordar">Reabordar</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">Mensagem/Tabulação</label>
              <select value={templateId} onChange={e => setTemplateId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-[...]">
                <option value="">Padrão do Sistema</option>
                {messageTemplates.map(tmpl => (
                  <option key={tmpl.id} value={tmpl.id}>{tmpl.name} ({tabulations.find(t=>t.id===tmpl.tabId)?.name})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-6 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-sl[...]" />
            <button type="submit" disabled={!canSubmit} className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-black transition-all sha[...]" />
          </div>
        </form>
      </div>
    </div>
  );
};
