export type LeadStatus =
  | 'Novo'
  | 'Consultado'
  | 'Com limite'
  | 'Sem limite'
  | 'Mensagem enviada'
  | 'Fechado'
  | 'Descartado';

export type LeadQueue =
  | 'Pronto para enviar'
  | 'Aguardando'
  | 'Frio'
  | 'Reabordar';

export type LeadAction =
  | 'Nunca chamado'
  | 'Chamado hoje'
  | 'Não respondeu'
  | 'Respondeu'
  | 'Interessado';

export interface Bank {
  id: string;
  name: string;
  logo?: string;
  active: boolean;
}

export interface Tabulation {
  id: string;
  name: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  tabId: string;
  isActive: boolean;
  isDefault: boolean;
}

export interface Lead {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  bank: string; // Keep as string for now to match current store, but will map items
  origin?: string;
  availableValue: number;
  consultDate: string; // ISO String
  status: LeadStatus;
  queue: LeadQueue;
  lastAction: LeadAction;
  lastSendDate?: string | null; // ISO String
  outdated?: boolean;
}
