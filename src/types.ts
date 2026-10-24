export type FuncaoEclesiastica = 'Membro Comungante' | 'Membro Não Comungante' | 'Conselheiro' | 'Pastor' | 'Presbítero' | 'Diácono' | 'Cooperador' | 'Não se aplica';
export type SituacaoMembro = 'Em Plena Comunhão' | 'Não Comungante' | 'Sob Disciplina' | 'Transferido';
export type EstadoCivil = 'Solteiro' | 'Casado' | 'Outro';
export type CategoriaSocioUPA = 'Ativo' | 'Cooperador' | 'Conselheiro' | 'Honorário';

export interface AppUser {
  id: string;
  name: string;
  email?: string;
  role: 'admin' | 'voter';
}

export interface Member {
  id: string;
  name: string;
  cargo?: string; // Cargo na UPA (Presidente, Vice-Presidente, Secretário, Tesoureiro, Conselheiro, etc.)
  categoriaSocio?: CategoriaSocioUPA | string; // Ativo (12-17 anos), Cooperador, Conselheiro
  funcaoEclesiastica?: FuncaoEclesiastica | string;
  situacao?: SituacaoMembro | string;
  
  // Contato do Adolescente & Endereço
  contato?: string; // Celular / WhatsApp do adolescente
  email?: string;
  endereco?: string;

  // Responsável Legal / Pais (Fundamental para adolescentes)
  nomeResponsavel?: string; // Nome da Mãe, Pai ou Responsável Legal
  contatoResponsavel?: string; // Telefone / WhatsApp do Responsável para avisos e emergências
  parentescoResponsavel?: 'Mãe' | 'Pai' | 'Responsável Legal' | 'Outro' | string;

  // Pessoal & Documentos
  cpf?: string;
  rg?: string;
  nascimento?: string; // AAAA-MM-DD (para cálculo automático de idade e transição UMP)
  estadoCivil?: EstadoCivil | string;
  naturalidade?: string;
  tipoSanguineo?: string;
  filiacaoMae?: string;
  filiacaoPai?: string;

  // Vida Eclesiástica & UPA
  dataBatismo?: string;
  dataProfissaoFe?: string;
  upaEntryDate?: string;
  uphEntryDate?: string; // Mantido para compatibilidade retroativa
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
  isBallotOpen?: boolean; // Se false, a mesa está na tela intermediária ajustando aptos
  isBallotClosedByMesa?: boolean; // Flag persistida no banco: só revela os votos/resultado aos eleitores quando a mesa clica em Encerrar o Escrutínio
  isBallotFinalizedByMesa?: boolean; // Só revela o vencedor para os eleitores quando a mesa oficializa/finaliza o escrutínio
  officialWinners?: Partial<Record<Role, { memberId: string; ballotNumber?: number; detail?: string }>>; // Registra os vencedores OFICIALMENTE proclamados pela mesa
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

