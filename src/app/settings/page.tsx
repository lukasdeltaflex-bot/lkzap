"use client";

import { useState, useRef } from "react";
import { useSettingsStore } from "../../store/useSettingsStore";
import { Trash2, Plus, Image as ImageIcon, Upload } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  const { banks, origins, logoBase64, addBank, removeBank, addOrigin, removeOrigin, setLogo } = useSettingsStore();

  const [newBank, setNewBank] = useState("");
  const [newOrigin, setNewOrigin] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBankAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBank.trim()) {
      addBank(newBank.trim());
      setNewBank("");
    }
  };

  const handleOriginAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newOrigin.trim()) {
      addOrigin(newOrigin.trim());
      setNewOrigin("");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link href="/" className="p-2 glass-panel rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
          <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300" />
        </Link>
        <h2 className="text-2xl font-bold font-outfit text-slate-800 dark:text-white">
          Configurações do Sistema
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LOGO */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-bold font-outfit mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
            <ImageIcon size={20} className="text-emerald-500" /> Logo customizada
          </h3>
          <div className="flex flex-col gap-4">
            <div className="w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-900/50">
              {logoBase64 ? (
                <img src={logoBase64} alt="Company Logo" className="max-h-full max-w-full object-contain p-2" />
              ) : (
                <div className="text-slate-400 text-sm flex flex-col items-center gap-2">
                  <ImageIcon size={32} />
                  <span>Nenhuma logo definida</span>
                </div>
              )}
            </div>
            
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageUpload}
            />
            
            <div className="flex gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Upload size={16} /> Fazer Upload
              </button>
              {logoBase64 && (
                <button 
                  onClick={() => setLogo(null)}
                  className="px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 font-semibold rounded-lg text-sm transition-colors"
                >
                  Remover
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 text-center">Formatos suportados: PNG, JPG, WEBP (Max 2MB)</p>
          </div>
        </div>

        {/* INFORMACOES */}
        <div className="bg-slate-100 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
          <h3 className="font-bold text-slate-800 dark:text-white mb-2">Armazenamento Local</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            Todas as configurações estão sendo salvas localmente no seu navegador para máxima performance. 
            No futuro, a vinculação em nuvem importará automaticamente estes registros.
          </p>
        </div>

        {/* BANCOS */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-bold font-outfit mb-4 text-slate-800 dark:text-white">Bancos Aceitos</h3>
          
          <form onSubmit={handleBankAdd} className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={newBank}
              onChange={e => setNewBank(e.target.value)}
              placeholder="Nome do banco..."
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 outline-none dark:text-white"
            />
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition-all" disabled={!newBank.trim()}>
              <Plus size={20} />
            </button>
          </form>

          <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
            {banks.map(bank => (
              <div key={bank} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 p-2.5 rounded-lg group">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{bank}</span>
                <button 
                  onClick={() => removeBank(bank)}
                  className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {banks.length === 0 && <p className="text-sm text-slate-500">Nenhum banco cadastrado.</p>}
          </div>
        </div>

        {/* ORIGENS */}
        <div className="glass-panel p-6 rounded-2xl">
          <h3 className="text-lg font-bold font-outfit mb-4 text-slate-800 dark:text-white">Origens de Lead</h3>
          
          <form onSubmit={handleOriginAdd} className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={newOrigin}
              onChange={e => setNewOrigin(e.target.value)}
              placeholder="Tag de origem..."
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 outline-none dark:text-white"
            />
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition-all" disabled={!newOrigin.trim()}>
              <Plus size={20} />
            </button>
          </form>

          <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
            {origins.map(origin => (
              <div key={origin} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/50 p-2.5 rounded-lg group">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{origin}</span>
                <button 
                  onClick={() => removeOrigin(origin)}
                  className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {origins.length === 0 && <p className="text-sm text-slate-500">Nenhuma origem cadastrada.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}
