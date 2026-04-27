"use client";

import React, { useState } from 'react';
import { useLeadStore } from '../store/useLeadStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { X } from 'lucide-react';
import { normalizeCPF, normalizePhone, isDuplicateLead, validateCPF, formatCPF, formatCurrencyBRL, parseCurrencyBRL } from '../lib/utils';
import { Lead } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AddLeadModal = ({ isOpen, onClose }: Props) => {
  const { leads, addLead } = useLeadStore();
  const { banks, origins, leadStatuses } = useSettingsStore();

  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [bank, setBank] = useState<string>(banks.length > 0 ? (typeof banks[0] === 'string' ? banks[0] : banks[0].name) : '');
  const [origin, setOrigin] = useState<string>(origins.length > 0 ? origins[0] : '');
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<string>(leadStatuses.find(s => s.name === 'Com limite')?.name || leadStatuses[0]?.name || '');

  const isCPFValid = cpf.replace(/\D/g, '').length === 11 ? validateCPF(cpf) : true;
  const canSubmit = name.length > 2 && cpf.replace(/\D/g, '').length === 11 && validateCPF(cpf) && phone.replace(/\D/g, "").length >= 10 && parseCurrencyBRL(value) > 0 && bank && origin && status;

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const phoneDigits = phone.replace(/\D/g, "");
    if (!name || !cpf || phoneDigits.length < 10 || !bank || !value || !origin || !status) return;

    if (isDuplicateLead(leads, cpf, phone)) {
      alert("Este cliente (CPF ou Telefone) já está cadastrado.");
      return;
    }

    addLead({
      name,
      cpf: normalizeCPF(cpf),
      phone: normalizePhone(phone),
      bank,
      origin,
      availableValue: parseCurrencyBRL(value),
      consultDate: new Date().toISOString(),
      status,
      queue: 'Pronto para enviar',
      lastAction: 'Nunca chamado',
    });

    // reset and close
    setName('');
    setCpf('');
    setPhone('');
    setBank(banks.length > 0 ? (typeof banks[0] === 'string' ? banks[0] : banks[0].name) : '');
    setOrigin(origins.length > 0 ? origins[0] : '');
    setValue('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-md rounded-2xl shadow-xl overflow-hidden mt-[env(safe-area-inset-top)] mb-[env(safe-area-inset-bottom)] border border-emerald-500/10">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold font-outfit text-slate-800 dark:text-slate-100 italic">Novo Cliente</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 cursor-pointer">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest px-1">Nome Completo</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-slate-100 font-bold" placeholder="Digite o nome..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest px-1">CPF</label>
              <input required type="text" value={cpf} onChange={e => setCpf(formatCPF(e.target.value))} className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-lg px-4 py-2.5 outline-none focus:ring-2 font-mono ${!isCPFValid ? "border-red-500 focus:ring-red-500" : "border-slate-300 dark:border-slate-700 focus:ring-emerald-500"}`} placeholder="000.000.000-00" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest px-1">WhatsApp</label>
              <input required type="text" value={phone} onChange={e => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 11) {
                    let f = "";
                    if (val.length > 0) {
                      f = "(" + val.slice(0, 2);
                      if (val.length > 2) f += ") " + val.slice(2, 7);
                      if (val.length > 7) f += "-" + val.slice(7, 11);
                    }
                    setPhone(f);
                  }
                }} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-bold" placeholder="(00) 00000-0000" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest px-1">Origem</label>
              <select required value={origin} onChange={e => setOrigin(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-bold">
                {origins.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
               <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest px-1">Status Inicial</label>
               <select required value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-black">
                 {leadStatuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
               </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest px-1">Banco</label>
              <select required value={bank} onChange={e => setBank(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-bold">
                {banks.map(b => (
                  <option key={typeof b === 'string' ? b : b.id} value={typeof b === 'string' ? b : b.name}>
                    {typeof b === 'string' ? b : b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest px-1">Valor (R$)</label>
              <input required type="text" value={value} onChange={e => setValue(formatCurrencyBRL(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-black text-emerald-600" placeholder="R$ 0,00" />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
            <button type="submit" disabled={!canSubmit} className="flex-1 px-4 py-2.5 rounded-lg font-black transition-all shadow-md bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-slate-300 disabled:text-slate-500">Cadastrar Lead</button>
          </div>
        </form>
      </div>
    </div>
  );
};
