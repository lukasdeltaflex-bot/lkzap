export type Bank = 'Daycoval' | 'BMG' | 'Pan' | 'C6' | 'Olé' | 'Master' | 'Outros';

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

export interface Lead {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  bank: Bank;
  availableValue: number;
  consultDate: string; // ISO String
  status: LeadStatus;
  queue: LeadQueue;
  lastAction: LeadAction;
  lastSendDate?: string | null; // ISO String
  outdated?: boolean;
}
