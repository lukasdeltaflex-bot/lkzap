export const normalizeCPF = (cpf: string): string => {
  return cpf.replace(/\D/g, '');
};

export const validateCPF = (cpf: string): boolean => {
  const cleanCPF = normalizeCPF(cpf);
  
  if (cleanCPF.length !== 11) return false;
  
  // Bloquear CPFs simplórios (000.000.000-00, etc)
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) sum = sum + parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
  
  return true;
};

export const formatCPF = (cpf: string): string => {
  const digits = normalizeCPF(cpf).slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

export const normalizePhone = (phone: string): string => {
  let digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  
  // Remove leading zeros if any (common mistake in Brazil)
  while (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // Se já começar com 55 e tiver tamanho de celular internacional (13 dígitos) ou fixo (12)
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }
  
  // Se tiver 10 ou 11 dígitos, adiciona 55 (Brasil)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  
  return digits;
};

export const formatPhone = (val: string): string => {
  const digits = val.replace(/\D/g, "");
  if (digits.length === 0) return "";
  let formatted = "(" + digits.slice(0, 2);
  if (digits.length > 2) {
    formatted += ") " + digits.slice(2, 7);
  }
  if (digits.length > 7) {
    formatted += "-" + digits.slice(7, 11);
  }
  return formatted;
};

export const formatDisplayPhone = (phone: string): string => {
  // Recebe 5511970786054 ou similar
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) {
    const core = digits.slice(2); // remove 55
    if (core.length === 11) {
      return `(${core.slice(0, 2)}) ${core.slice(2, 7)}-${core.slice(7)}`;
    }
    if (core.length === 10) {
      return `(${core.slice(0, 2)}) ${core.slice(2, 6)}-${core.slice(6)}`;
    }
    return core;
  }
  return phone;
};

// Also export a helper for checking duplicates
import { Lead } from '../types';

export const isDuplicateLead = (existingLeads: Lead[], newCpf: string, newPhone: string): boolean => {
  const normalizedNewCpf = normalizeCPF(newCpf);
  const normalizedNewPhone = normalizePhone(newPhone);
  
  return existingLeads.some(lead => {
    const leadCpf = normalizeCPF(lead.cpf);
    const leadPhone = normalizePhone(lead.phone);
    if (leadCpf && leadCpf === normalizedNewCpf) return true;
    if (leadPhone && leadPhone === normalizedNewPhone) return true;
    return false;
  });
};
export const formatCurrencyBRL = (value: number | string): string => {
  if (typeof value === 'string') {
    value = parseFloat(value.replace(/[^\d]/g, '')) / 100;
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(isNaN(value as number) ? 0 : (value as number));
};

export const parseCurrencyBRL = (val: string): number => {
  const digits = val.replace(/\D/g, '');
  return parseFloat(digits) / 100;
};
