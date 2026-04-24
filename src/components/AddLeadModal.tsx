"use client";

import React, { useState } from 'react';
import { useLeadStore } from '../store/useLeadStore';
import { Bank } from '../types';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AddLeadModal = ({ isOpen, onClose }: Props) => {
  const { addLead } = useLeadStore();

  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [bank, setBank] = useState<Bank | ''>('');
  const [value, setValue] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cpf || !phone || !bank || !value) return;

    addLead({
      name,
      cpf,
      phone,
      bank: bank as Bank,
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
    setBank('');
    setValue('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold font-outfit text-slate-800 dark:text-white">Novo Cliente</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
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
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Banco</label>
              <select 
                required
                value={bank} 
                onChange={e => setBank(e.target.value as Bank)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 dark:text-white"
              >
                <option value="" disabled>Selecione</option>
                <option value="Daycoval">Daycoval</option>
                <option value="BMG">BMG</option>
                <option value="Pan">Pan</option>
                <option value="C6">C6</option>
                <option value="Olé">Olé</option>
                <option value="Master">Master</option>
                <option value="Outros">Outros</option>
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
