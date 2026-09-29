export interface Member {
  id: string;
  name: string;
  cargo?: string;
  createdAt: number;
  pinCode?: string;
  uphEntryDate?: string;
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

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'model';
  content: string;
}

