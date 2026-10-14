export type FuncaoEclesiastica = 'Pastor' | 'Presbítero' | 'Diácono' | 'Membro Comungante' | 'Cooperador' | 'Não se aplica';
export type SituacaoMembro = 'Em Plena Comunhão' | 'Sob Disciplina' | 'Não Comungante' | 'Transferido';
export type EstadoCivil = 'Casado' | 'Solteiro' | 'Viúvo' | 'Divorciado';

export interface AppUser {
  id: string;
  name: string;
  email?: string;
  role: 'admin' | 'voter';
}

export interface Member {
  id: string;
  name: string;
  cargo?: string; // Cargo na UPH (Presidente, Secretário, Sócio, etc.)
  funcaoEclesiastica?: FuncaoEclesiastica | string;
  situacao?: SituacaoMembro | string;
  
  // Contato & Endereço
  contato?: string; // Celular / WhatsApp
  email?: string;
  endereco?: string;

  // Pessoal & Documentos
  cpf?: string;
  rg?: string;
  nascimento?: string; // AAAA-MM-DD
  estadoCivil?: EstadoCivil | string;
  naturalidade?: string;
  tipoSanguineo?: string;
  filiacaoMae?: string;
  filiacaoPai?: string;

  // Vida Eclesiástica
  dataBatismo?: string;
  dataProfissaoFe?: string;
  uphEntryDate?: string;
  dizimista?: boolean;

  // Sistema & Segurança
  pinCode?: string;
  createdAt: number;
}

export type AttendanceStatus = 'presente' | 'ausente' | 'falta_justificada';
export type SessionType = 'programacao' | 'plenaria';

export interface AttendanceRecord {
  memberId: string;
  memberName: string;
  status: AttendanceStatus;
  justification?: string;
}

export interface AttendanceSession {
  id: string;
  date: number;
  type: SessionType;
  callNumber?: 1 | 2;
  records: AttendanceRecord[];
  createdAt?: number | { seconds: number; nanoseconds: number } | null;
}

export enum Role {
  PRESIDENT = 'PRESIDENT',
  VICE = 'VICE',
  SECRETARY_1 = 'SECRETARY_1',
  SECRETARY_2 = 'SECRETARY_2',
  TREASURER = 'TREASURER',
}

export interface Vote {
  voterId: string;
  candidateId: string;
  role: Role;
  ballotNumber: number;
  timestamp: number;
}

export interface ManualWinner {
  memberId: string;
  reason: 'aclamacao' | 'desempate_idade' | 'desempate_antiguidade' | 'deliberacao_plenario';
  detail?: string;
  timestamp: number;
}

export interface OverrideNote {
  id: string;
  timestamp: number;
  role: Role;
  ballot?: number;
  action: 'anulacao_escrutinio' | 'ajuste_quorum' | 'candidato_ausente_adicionado' | 'aclamacao' | 'desempate_manual';
  description: string;
}

export interface Election {
  id: string;
  name: string;
  currentRole: Role;
  currentBallot: 1 | 2 | 3;
  quorumRequired: number;
  presentCount: number;
  votes: Vote[];
  archived?: boolean;
  candidatesIds?: string[]; // Used specifically for the 3rd ballot runoff
  registeredCandidates?: string[]; // Registered candidates for the election/role
  sessionId?: string;
  declinedMembers?: string[]; // Members who declined candidacy
  manualWinners?: Partial<Record<Role, ManualWinner>>;
  overrideNotes?: OverrideNote[];
  allowNonPresentCandidates?: boolean;
}

export interface TreasuryTransaction {
  id: string;
  date: number;
  description: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  sheetName?: string | null;
  createdAt?: number | { seconds: number; nanoseconds: number } | null;
}

