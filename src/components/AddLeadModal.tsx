"use client";

import React, { useState } from 'react';
import { useLeadStore } from '../store/useLeadStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { X } from 'lucide-react';
import { normalizeCPF, normalizePhone } from '../lib/utils';
import { Lead } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AddLeadModal = ({ isOpen, onClose }: Props) => {
  const { addLead } = useLeadStore();
  const { banks, origins } = useSettingsStore();

  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [bank, setBank] = useState<string>(banks.length > 0 ? banks[0] : '');
  const [origin, setOrigin] = useState<string>(origins.length > 0 ? origins[0] : '');
  const [value, setValue] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const phoneDigits = phone.replace(/\D/g, "");
    if (!name || !cpf || phoneDigits.length < 10 || !bank || !value || !origin) return;

    addLead({
      name,
      cpf: normalizeCPF(cpf),
      phone: normalizePhone(phone),
      bank,
      origin,
      availableValue: Number(value),
      consultDate: new Date().toISOString(),
      status: 'Com limite',
      queue: 'Pronto para enviar',
      lastAction: 'Nunca chamado',
    });

    // reset and close
    setName('');
    setCpf('');
    setPhone('');
    setBank(banks.length > 0 ? banks[0] : '');
    setOrigin(origins.length > 0 ? origins[0] : '');
    setValue('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden mt-[env(safe-area-inset-top)] mb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold font-outfit text-slate-800 dark:text-white">Novo Cliente</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 cursor-pointer">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Completo</label>
            <input 
              required
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
              placeholder="Ex: Maria da Silva"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CPF</label>
              <input 
                required
                type="text" 
                value={cpf} 
                onChange={e => setCpf(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">WhatsApp</label>
              <input 
                required
                type="text" 
                value={phone} 
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 11) {
                    let formatted = "";
                    if (val.length > 0) {
                      formatted = "(" + val.slice(0, 2);
                      if (val.length > 2) formatted += ") " + val.slice(2, 7);
                      if (val.length > 7) formatted += "-" + val.slice(7, 11);
                    }
                    setPhone(formatted);
                  }
                }}
                className={`w-full bg-slate-50 dark:bg-slate-800 border rounded-lg px-4 py-2.5 outline-none focus:ring-2 transition-all text-slate-800 dark:text-white ${
                  phone && phone.replace(/\D/g, "").length < 10 
                    ? "border-red-500 focus:ring-red-500 shadow-sm shadow-red-100" 
                    : "border-slate-300 dark:border-slate-700 focus:ring-emerald-500"
                }`}
                placeholder="(11) 99999-9999"
              />
              {phone && phone.replace(/\D/g, "").length < 10 && (
                <p className="text-red-500 text-[10px] mt-1 font-medium">Digite um WhatsApp válido</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Origem do Lead</label>
              <select 
                required
                value={origin} 
                onChange={e => setOrigin(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
              >
                <option value="" disabled>Selecione a origem</option>
                {origins.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Banco</label>
              <select 
                required
                value={bank} 
                onChange={e => setBank(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
              >
                <option value="" disabled>Selecione</option>
                {banks.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor Disp. (R$)</label>
              <input 
                required
                type="number" 
                step="0.01"
                min="0"
                value={value} 
                onChange={e => setValue(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors shadow-md"
            >
              Cadastrar Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
