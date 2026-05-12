import { Lead } from '../types';
import { normalizePhone, formatCPF, formatDisplayPhone } from './utils';

const formatMoney = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const replaceVariables = (content: string, lead: Lead) => {
  // Substitute placeholders without encoding here. Emojis should be present literally in templates.
  return content
    .replace(/{nome}/g, lead.name)
    .replace(/{valor}/g, formatMoney(lead.availableValue))
    .replace(/{banco}/g, lead.bank)
    .replace(/{origem}/g, lead.origin || '')
    .replace(/{telefone}/g, formatDisplayPhone(lead.phone))
    .replace(/{cpf}/g, formatCPF(lead.cpf));
};

export const generateWhatsAppLink = (lead: Lead, templateContent: string): string => {
  const text = replaceVariables(templateContent, lead);
  
  // Implementation of permanent emoji fix
  const cleanMessage = text
    .normalize("NFC")
    .replace(/\uFFFD/g, "")
    .trim();

  const encodedText = encodeURIComponent(cleanMessage);
  const cleanPhone = normalizePhone(lead.phone);
  
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
};

export const generateReabordagemLink = (lead: Lead, templateContent?: string): string => {
  const defaultText = `${lead.name}, vi que você ainda tem valor disponível para saque complementar.\nQuer que eu libere pra você hoje?`;
  const text = templateContent ? replaceVariables(templateContent, lead) : defaultText;
  
  const cleanMessage = text
    .normalize("NFC")
    .replace(/\uFFFD/g, "")
    .trim();

  const encodedText = encodeURIComponent(cleanMessage);
  const cleanPhone = normalizePhone(lead.phone);

  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
};
