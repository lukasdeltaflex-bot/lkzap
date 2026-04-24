export const normalizeCPF = (cpf: string): string => {
  return cpf.replace(/\D/g, '');
};

export const normalizePhone = (phone: string): string => {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  // Se já tiver 55 no começo, mantém. Se não tiver, adiciona.
  // Assumindo que o usuário digita DDD + Numero (ex: 11999999999 com 11 digitos)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  // Se for maior que 11 e começar com 55, é possível que já esteja com o DDI
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }
  // Fallback
  return `55${digits}`;
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
