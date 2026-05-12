export interface Member {
  id: string;
  name: string;
  cargo?: string;
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
}
