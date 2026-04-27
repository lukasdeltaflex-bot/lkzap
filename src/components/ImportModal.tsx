"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { useLeadStore } from "../store/useLeadStore";
import { isDuplicateLead, normalizeCPF, normalizePhone } from "../lib/utils";
import { X, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import { Lead } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface ParsedRow {
  name: string;
  cpf: string;
  phone: string;
  bank: string;
  value: number;
  origin: string;
  consultDate: string;
  isValid: boolean;
  error?: string;
  originalIndex: number;
}

export const ImportModal = ({ isOpen, onClose }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { leads, addLead } = useLeadStore();
  
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPreview, setHasPreview] = useState(false);

  if (!isOpen) return null;

  const resetState = () => {
    setFile(null);
    setParsedRows([]);
    setHasPreview(false);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const processFile = (file: File) => {
    setIsProcessing(true);
    setFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Headers mapping attempt
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (json.length < 2) {
          alert("Arquivo vazio ou formato inválido.");
          resetState();
          return;
        }

        const headers = json[0] as string[];
        const rows = json.slice(1);

        if (rows.length > 500) {
          alert("O limite máximo por importação é de 500 registros para evitar travamentos.");
          resetState();
          return;
        }

        const findColumn = (possibleNames: string[]) => {
          return headers.findIndex(h => {
            if (typeof h !== 'string') return false;
            const normalizedH = h.toLowerCase().trim();
            return possibleNames.some(name => normalizedH.includes(name));
          });
        };

        const idxName = findColumn(['nome', 'name', 'cliente']);
        const idxCpf = findColumn(['cpf', 'documento']);
        const idxPhone = findColumn(['telefone', 'celular', 'whatsapp', 'phone']);
        const idxBank = findColumn(['banco', 'bank']);
        const idxValue = findColumn(['valor', 'limite', 'disponivel', 'value']);
        const idxOrigin = findColumn(['origem', 'origin', 'fonte']);
        const idxDate = findColumn(['data', 'consult', 'date']);

        const validatedRows: ParsedRow[] = [];
        let indexOffset = 0; // Simple unique inner-batch check
        const currentBatchCpfs = new Set<string>();
        const currentBatchPhones = new Set<string>();

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue; // skip empty

          const name = row[idxName] ? String(row[idxName]) : '';
          const cpf = row[idxCpf] ? String(row[idxCpf]) : '';
          const phone = row[idxPhone] ? String(row[idxPhone]) : '';
          const bank = row[idxBank] ? String(row[idxBank]) : 'Outros';
          const valueRaw = row[idxValue] ? String(row[idxValue]) : '0';
          const origin = row[idxOrigin] ? String(row[idxOrigin]) : 'Arquivo TXT/Excel';
          const consultDate = row[idxDate] ? String(row[idxDate]) : new Date().toISOString();

          const normalizedCpf = normalizeCPF(cpf);
          const normalizedPhone = normalizePhone(phone);
          const value = parseFloat(valueRaw.replace(',', '.').replace(/[^\d.-]/g, ''));

          let isValid = true;
          let error = '';

          if (!name || !normalizedCpf || !normalizedPhone) {
            isValid = false;
            error = 'Campos obrigatórios faltando';
          } else if (isDuplicateLead(leads, normalizedCpf, normalizedPhone)) {
            isValid = false;
            error = 'Duplicado na Base';
          } else if (currentBatchCpfs.has(normalizedCpf) || currentBatchPhones.has(normalizedPhone)) {
            isValid = false;
            error = 'Duplicado na mesma Planilha';
          }

          if (isValid) {
            currentBatchCpfs.add(normalizedCpf);
            currentBatchPhones.add(normalizedPhone);
          }

          validatedRows.push({
            name,
            cpf: normalizedCpf,
            phone: normalizedPhone,
            bank,
            value: isNaN(value) ? 0 : value,
            origin,
            consultDate,
            isValid,
            error,
            originalIndex: i + 2 // considering row 1 is header
          });
          indexOffset++;
        }

        setParsedRows(validatedRows);
        setHasPreview(true);
      } catch (err) {
        alert("Erro processando o arquivo. Verifique o formato.");
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const confirmImport = () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      alert("Nenhum registro válido para importar.");
      return;
    }

    validRows.forEach(row => {
      addLead({
        name: row.name,
        cpf: row.cpf,
        phone: row.phone,
        bank: row.bank,
        origin: row.origin,
        availableValue: row.value,
        consultDate: new Date().toISOString(),
        status: 'Com limite',
        queue: 'Pronto para enviar',
        lastAction: 'Nunca chamado',
      });
    });

    handleClose();
  };

  const validCount = parsedRows.filter(r => r.isValid).length;
  const errorCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden flex flex-col h-[85vh]">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-bold font-outfit text-slate-800 dark:text-white">Importar Lista de Leads</h2>
          <button onClick={handleClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-hidden flex flex-col">
          {!hasPreview ? (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <Upload size={48} className="text-emerald-500 mb-4" />
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                Envie sua planilha Excel ou CSV
              </h3>
              <p className="text-sm text-slate-500 mb-6 text-center max-w-md">
                O arquivo precisa conter colunas para Nome, CPF e Telefone (whatsapp). Limite de 500 registros.
              </p>
              <input
                type="file"
                accept=".xlsx, .xls, .csv, .txt"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors flex items-center gap-2"
              >
                {isProcessing ? "Processando..." : "Selecionar Arquivo"}
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex gap-4 mb-4">
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium border border-emerald-200 dark:border-emerald-800/50">
                  <CheckCircle2 size={16} />
                  <span>{validCount} Válidos</span>
                </div>
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg text-sm font-medium border border-red-200 dark:border-red-800/50">
                  <AlertCircle size={16} />
                  <span>{errorCount} Duplicados/Inválidos (Serão Ignorados)</span>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Linha</th>
                      <th className="px-4 py-3">Nome</th>
                      <th className="px-4 py-3">CPF</th>
                      <th className="px-4 py-3">WhatsApp</th>
                      <th className="px-4 py-3">Banco</th>
                      <th className="px-4 py-3">Valor</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row) => (
                      <tr key={row.originalIndex} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-4 py-2 text-slate-400">{row.originalIndex}</td>
                        <td className="px-4 py-2 font-medium">{row.name}</td>
                        <td className="px-4 py-2">{row.cpf}</td>
                        <td className="px-4 py-2">{row.phone}</td>
                        <td className="px-4 py-2">{row.bank}</td>
                        <td className="px-4 py-2">R$ {row.value.toFixed(2)}</td>
                        <td className="px-4 py-2 flex justify-center">
                          {row.isValid ? (
                            <span className="text-emerald-500 flex items-center justify-center" title="Valid"><CheckCircle2 size={18}/></span>
                          ) : (
                            <span className="text-red-500 text-xs font-semibold py-1 px-2 rounded-full bg-red-50 dark:bg-red-900/20">{row.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/10">
          <button 
            onClick={handleClose}
            className="px-5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={confirmImport}
            disabled={!hasPreview || validCount === 0}
            className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800/50 disabled:text-emerald-200/50 disabled:cursor-not-allowed text-white font-medium transition-colors shadow-md"
          >
            Confirmar Importação
          </button>
        </div>
      </div>
    </div>
  );
};
