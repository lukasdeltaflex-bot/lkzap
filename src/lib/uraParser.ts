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

function extractField(text: string, ...labels: string[]): string {
  for (const label of labels) {
    // Try "Label: value" pattern (case insensitive)
    const regex = new RegExp(`${label}\\s*[:=]\\s*(.+)`, 'im');
    const match = text.match(regex);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return '';
}

function detectBank(campanha: string, text: string): string {
  const search = (campanha + ' ' + text).toLowerCase();
  for (const [keyword, bankName] of Object.entries(BANK_KEYWORDS)) {
    if (search.includes(keyword)) {
      return bankName;
    }
  }
  return '';
}

function deriveStatus(tecla: string): string {
  switch (tecla.trim()) {
    case '1':
    case '2':
      return 'Com limite';
    case '3':
      return 'Sem limite';
    default:
      return 'Novo';
  }
}

function buildObservations(result: Partial<UraParseResult>): string {
  const lines: string[] = [];
  if (result.campanha) lines.push(`Campanha: ${result.campanha}`);
  if (result.statusUra) lines.push(`Status URA: ${result.statusUra}`);
  if (result.empregador) lines.push(`Empregador: ${result.empregador}`);
  if (result.mailing) lines.push(`Mailing: ${result.mailing}`);
  if (result.teclaDigitada) lines.push(`Tecla: ${result.teclaDigitada}`);
  return lines.join('\n');
}

export function parseUraText(text: string): UraParseResult {
  const nome = extractField(text, 'Nome', 'NOME', 'Cliente');
  const cpf = extractField(text, 'CPF', 'Cpf').replace(/\D/g, '');
  const telefone = extractField(text, 'Contato', 'Telefone', 'Tel', 'Celular', 'WhatsApp', 'Phone').replace(/\D/g, '');
  const campanha = extractField(text, 'Campanha', 'CAMPANHA', 'Campaign');
  const statusUra = extractField(text, 'Status', 'STATUS');
  const teclaDigitada = extractField(text, 'Tecla Digitada', 'Tecla', 'DTMF', 'Opção');
  const empregador = extractField(text, 'Empregador', 'EMPREGADOR', 'Employer');
  const mailing = extractField(text, 'MAILING', 'Mailing', 'Lista');

  const banco = detectBank(campanha, text);
  const origem = mailing ? 'URA Reversa' : 'Outro';
  const statusLead = deriveStatus(teclaDigitada);

  const partial = { campanha, statusUra, empregador, mailing, teclaDigitada };
  const observations = buildObservations(partial);

  return {
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
}
