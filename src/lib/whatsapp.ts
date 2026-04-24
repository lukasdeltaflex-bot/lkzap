import { Lead } from '../types';
import { normalizePhone } from './utils';

const formatMoney = (value: number) => {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const generateWhatsAppLink = (lead: Lead, messageIndex: number): string => {
  const valueFormatted = formatMoney(lead.availableValue);
  let text = '';

  if (messageIndex === 0) {
    text = `💳 Olá, ${lead.name}! Você tem R$${valueFormatted} disponíveis para saque complementar do seu cartão ${lead.bank}.\nLiberação rápida em até 48h ✅\nSem aumento de desconto no INSS ❌📉\nDigite 1 para receber o link.`;
  } else if (messageIndex === 1) {
    text = `${lead.name}, identifiquei um valor de R$${valueFormatted} disponível no seu benefício hoje.\nPosso te explicar como sacar sem aumentar seu desconto.\nQuer receber o link?`;
  } else {
    text = `${lead.name}, esse valor de R$${valueFormatted} disponível no seu cartão ${lead.bank} pode não ficar liberado por muito tempo.\nSe quiser, te envio o link para saque agora.`;
  }

  const encodedText = encodeURIComponent(text);
  const cleanPhone = normalizePhone(lead.phone);
  
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
};

export const generateReabordagemLink = (lead: Lead): string => {
  const text = `${lead.name}, vi que você ainda tem valor disponível para saque complementar.\nQuer que eu libere pra você hoje?`;
  const encodedText = encodeURIComponent(text);
  const cleanPhone = normalizePhone(lead.phone);
  
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
};

