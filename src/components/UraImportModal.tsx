"use client";

import React, { useState } from 'react';
import { useLeadStore } from '../store/useLeadStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { X, Zap, AlertTriangle, CheckCircle2, ClipboardPaste } from 'lucide-react';
import { parseUraText, UraParseResult } from '../lib/uraParser';
import { normalizeCPF, normalizePhone, isDuplicateLead, validateCPF, formatCPF, formatCurrencyBRL, parseCurrencyBRL } from '../lib/utils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const UraImportModal = ({ isOpen, onClose }: Props) => {
  const { leads, addLead } = useLeadStore();
  const { banks, origins, leadStatuses } = useSettingsStore();

  // Step 1: paste text
  const [rawText, setRawText] = useState('');
  // Step 2: review extracted data
  const [parsed, setParsed] = useState<UraParseResult | null>(null);
  const [step, setStep] = useState<'paste' | 'review'>('paste');

  // Editable fields for review
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [bank, setBank] = useState('');
  const [origin, setOrigin] = useState('');
  const [value, setValue] = useState('');
  const [status, setStatus] = useState('');
  const [observations, setObservations] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState('');

  if (!isOpen) return null;

  const handleExtract = () => {
    if (!rawText.trim()) return;

    const result = parseUraText(rawText);
    setParsed(result);

    // Populate editable fields
    setName(result.nome);
    setCpf(result.cpf ? formatCPF(result.cpf) : '');
    setPhone(formatDisplayPhone(result.telefone));
    setBank(result.banco || (banks.length > 0 ? (typeof banks[0] === 'string' ? banks[0] : banks[0].name) : ''));
    setOrigin(result.origem || (origins.length > 0 ? origins[0] : ''));
    setValue('');
    setStatus(result.statusLead || leadStatuses[0]?.name || 'Novo');
    setObservations(result.observations);

    // Check duplicates
    if (result.cpf || result.telefone) {
      const isDup = isDuplicateLead(leads, result.cpf, result.telefone);
      setDuplicateWarning(isDup ? 'Lead já cadastrado com este CPF ou telefone!' : '');
    } else {
      setDuplicateWarning('');
    }

    setStep('review');
  };

  const handleSave = () => {
    const cleanCpf = normalizeCPF(cpf);
    const cleanPhone = normalizePhone(phone);

    if (!name || cleanCpf.length < 11 || cleanPhone.length < 10) {
      alert('Preencha ao menos Nome, CPF e Telefone válidos.');
      return;
    }

    if (isDuplicateLead(leads, cpf, phone)) {
      if (!confirm('Lead já cadastrado. Deseja salvar mesmo assim?')) return;
    }

    addLead({
      name,
      cpf: cleanCpf,
      phone: cleanPhone,
      bank,
      origin,
      availableValue: parseCurrencyBRL(value) || 0,
      consultDate: new Date().toISOString(),
      status,
      queue: 'Pronto para enviar',
      lastAction: 'Nunca chamado',
      observations,
    });

    // Reset and close
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setRawText('');
    setParsed(null);
    setStep('paste');
    setName('');
    setCpf('');
    setPhone('');
    setBank('');
    setOrigin('');
    setValue('');
    setStatus('');
    setObservations('');
    setDuplicateWarning('');
  };

  function formatDisplayPhone(val: string) {
    const digits = val.replace(/\D/g, "");
    if (!digits) return "";
    let f = "(" + digits.slice(0, 2);
    if (digits.length > 2) f += ") " + digits.slice(2, 7);
    if (digits.length > 7) f += "-" + digits.slice(7, 11);
    return f;
  }

  const isCPFValid = cpf.replace(/\D/g, '').length === 11 ? validateCPF(cpf) : true;
  const canSave = name.length > 2 && cpf.replace(/\D/g, '').length === 11 && validateCPF(cpf) && phone.replace(/\D/g, '').length >= 10 && bank;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-xl rounded-2xl shadow-xl overflow-hidden border border-emerald-500/10">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Zap size={20} className="text-emerald-500" />
            </div>
            <div>
              <h2 className="text-lg font-black font-outfit text-slate-800 dark:text-slate-100">Importar da URA</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {step === 'paste' ? 'Cole o texto' : 'Confira os dados'}
              </p>
            </div>
          </div>
          <button onClick={() => { handleReset(); onClose(); }} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Step 1: Paste */}
        {step === 'paste' && (
          <div className="p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 flex items-center gap-1">
                <ClipboardPaste size={12} /> Texto da URA
              </label>
              <textarea
                autoFocus
                rows={12}
                value={rawText}
                onChange={e => setRawText(e.target.value)}
                placeholder={`Cole o texto aqui. Exemplo:\n\nContato: 15997700138\nTecla Digitada: 2\nCampanha: SAQUE COMPLEMENTAR DAYCOVAL\nNome: DALVIM PEDRO GARCIA\nCPF: 73931079849\nEmpregador: INSS CARTAO BENEFICIO\nMAILING: SAQUECOMPLEMENTAR-USP-INSS`}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-emerald-500 resize-none dark:text-slate-100 placeholder-slate-400"
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => { handleReset(); onClose(); }} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 transition-colors">Cancelar</button>
              <button
                onClick={handleExtract}
                disabled={!rawText.trim()}
                className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <Zap size={16} /> Extrair Dados
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Review */}
        {step === 'review' && (
          <div className="p-6 flex flex-col gap-4 max-h-[80vh] overflow-y-auto">
            {duplicateWarning && (
              <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 px-4 py-3 rounded-xl text-sm font-bold">
                <AlertTriangle size={18} /> {duplicateWarning}
              </div>
            )}

            {parsed && !parsed.nome && !parsed.cpf && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 px-4 py-3 rounded-xl text-sm font-bold">
                <AlertTriangle size={18} /> Não foi possível extrair dados. Verifique o formato do texto.
              </div>
            )}

            <p className="text-xs text-slate-500 font-bold italic px-1">Confira e ajuste os dados antes de salvar.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">Nome Completo</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-bold" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">CPF</label>
                <input type="text" value={cpf} onChange={e => setCpf(formatCPF(e.target.value))} className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-lg px-4 py-2.5 outline-none focus:ring-2 font-mono ${!isCPFValid ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}`} />
                {!isCPFValid && <p className="text-red-500 text-[10px] mt-1 font-bold">CPF inválido</p>}
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">WhatsApp</label>
                <input type="text" value={phone} onChange={e => setPhone(formatDisplayPhone(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-bold" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">Banco</label>
                <select value={bank} onChange={e => setBank(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none font-bold">
                  <option value="">Selecione</option>
                  {banks.map(b => (
                    <option key={typeof b === 'string' ? b : b.id} value={typeof b === 'string' ? b : b.name}>
                      {typeof b === 'string' ? b : b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">Valor Disponível</label>
                <input type="text" value={value} onChange={e => setValue(formatCurrencyBRL(e.target.value))} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 font-black text-emerald-600" placeholder="R$ 0,00" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">Origem</label>
                <select value={origin} onChange={e => setOrigin(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none font-bold">
                  {origins.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none font-black">
                  {leadStatuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 px-1 tracking-widest">Observações (URA)</label>
                <textarea rows={3} value={observations} onChange={e => setObservations(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono resize-none" />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setStep('paste')} className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 transition-colors">Voltar</button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className="flex-1 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={16} /> Cadastrar Lead
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
