/**
 * URA Text Parser
 * Extracts lead data from raw URA callback text.
 * Designed to be replaced/augmented by AI (Gemini) in the future.
 */

export interface UraParseResult {
  nome: string;
  cpf: string;
  telefone: string;
  campanha: string;
  statusUra: string;
  teclaDigitada: string;
  empregador: string;
  mailing: string;
  // Derived fields for CRM
  banco: string;
  origem: string;
  statusLead: string;
  observations: string;
}

const BANK_KEYWORDS: Record<string, string> = {
  'daycoval': 'Daycoval',
  'bmg': 'BMG',
  'pan': 'Pan',
  'c6': 'C6',
  'olé': 'Olé',
  'ole': 'Olé',
  'master': 'Master',
  'safra': 'Safra',
  'itaú': 'Itaú',
  'itau': 'Itaú',
  'bradesco': 'Bradesco',
  'santander': 'Santander',
  'caixa': 'Caixa',
};

function detectBank(campanha: string, text: string): string {
  const search = (campanha + ' ' + text).toLowerCase();
  for (const [keyword, bankName] of Object.entries(BANK_KEYWORDS)) {
    if (search.includes(keyword)) {
      return bankName;
    }
  }
  return '';
}

function buildObservations(result: Partial<UraParseResult>): string {
  const lines: string[] = [];
  if (result.teclaDigitada) lines.push(`Tecla Digitada: ${result.teclaDigitada}`);
  if (result.campanha) lines.push(`Campanha: ${result.campanha}`);
  if (result.statusUra) lines.push(`Status: ${result.statusUra}`);
  if (result.empregador) lines.push(`Empregador: ${result.empregador}`);
  if (result.mailing) lines.push(`Mailing: ${result.mailing}`);
  return lines.join('\n');
}

export function parseUraText(text: string): UraParseResult {
  console.log("Texto URA recebido:", text);

  // Normalize text: replace multiple spaces with single space
  const normalizedText = text.replace(/[ \t]+/g, ' ').trim();

  function extractLineRegex(labels: string[]): string {
    for (const label of labels) {
      const regex = new RegExp(`\\b${label}\\b\\s*[:=]?\\s*([^\\n]+)`, 'im');
      const match = normalizedText.match(regex);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return '';
  }

  const nome = extractLineRegex(['Nome', 'NOME', 'Cliente']);

  let cpf = '';
  const cpfRegex = /(?:CPF|Cpf)\s*[:=]?\s*([0-9\.\-\s]+)/i;
  const cpfMatch = normalizedText.match(cpfRegex);
  if (cpfMatch) {
    cpf = cpfMatch[1].replace(/\D/g, '');
  }
  if (cpf.length < 11) {
    const fallbackCpfMatch = normalizedText.match(/\b([0-9]{3}\.[0-9]{3}\.[0-9]{3}\-[0-9]{2}|[0-9]{11})\b/);
    if (fallbackCpfMatch) {
       cpf = fallbackCpfMatch[1].replace(/\D/g, '');
    }
  }
  cpf = cpf.substring(0, 11);

  let telefone = '';
  const phoneRegex = /(?:Contato|Telefone|Tel|Celular|WhatsApp|Phone)\s*[:=]?\s*([0-9\s\-\(\)]{10,15})/i;
  let phoneMatch = null;
  
  // Custom matcher for Contact
  const contactLines = normalizedText.match(/(?:Contato|Telefone|Tel|Celular|WhatsApp|Phone)\s*[:=]?\s*([^\n]+)/ig);
  if (contactLines) {
    for (const line of contactLines) {
      const nums = line.replace(/\D/g, '');
      if (nums.length >= 10 && nums.length <= 13) {
        telefone = nums;
        break;
      }
    }
  }

  if (telefone.length < 10) {
    const fallbackPhoneMatch = normalizedText.match(/\b([1-9]{2}\s*9?\s*[0-9]{4}\s*\-?\s*[0-9]{4})\b/);
    if (fallbackPhoneMatch) {
      telefone = fallbackPhoneMatch[1].replace(/\D/g, '');
    }
  }

  // Strip country code 55 if it was captured
  if ((telefone.length === 13 || telefone.length === 12) && telefone.startsWith('55')) {
    telefone = telefone.slice(2);
  }

  // If 10 digits (DDD + 8 digits), insert the 9 after the DDD
  if (telefone.length === 10) {
    telefone = telefone.slice(0, 2) + '9' + telefone.slice(2);
  }

  const campanha = extractLineRegex(['Campanha', 'CAMPANHA', 'Campaign']);
  
  // Custom extract for tempo/status since they can be tricky
  const tempoMatch = normalizedText.match(/\bTempo\b\s*[:=]?\s*([^\n]+)/i);
  const statusUra = extractLineRegex(['Status', 'STATUS']);
  const teclaDigitada = extractLineRegex(['Tecla Digitada', 'Tecla', 'DTMF', 'Opção']);
  const empregador = extractLineRegex(['Empregador', 'EMPREGADOR', 'Employer']);
  const mailing = extractLineRegex(['MAILING', 'Mailing', 'Lista']);

  const banco = detectBank(campanha, normalizedText);
  const origem = mailing ? mailing : 'URA Reversa';
  const statusLead = 'Novo da URA';

  const partial = { campanha, statusUra, empregador, mailing, teclaDigitada };
  let observations = buildObservations(partial);
  if (tempoMatch && tempoMatch[1]) {
    observations += `\nTempo: ${tempoMatch[1].trim()}`;
  }

  const result = {
    nome,
    cpf,
    telefone,
    campanha,
    statusUra,
    teclaDigitada,
    empregador,
    mailing,
    banco,
    origem,
    statusLead,
    observations,
  };

  console.log("Dados extraídos da URA:", result);
  return result;
}
