export const normalizeCPF = (cpf: string): string => {
  return cpf.replace(/\D/g, '');
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
