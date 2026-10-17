/**
 * Utilitários de Backup e Restauração Modular em JSON
 * UPH 3ª IPBV - Sistema de Gestão e Eleições
 */
import { Member, AttendanceSession, Election, TreasuryTransaction } from '../types';

export type BackupType = 'members' | 'sessions' | 'treasury' | 'elections' | 'full';

export interface BackupMetadata {
  version: string;
  system: string;
  society: string;
  exportedAt: string;
  timestamp: number;
  type: BackupType;
  recordCount: number;
}

export interface ModularBackup<T> {
  metadata: BackupMetadata;
  data: T;
}

export interface FullBackupPayload {
  metadata: BackupMetadata;
  members: Member[];
  sessions: AttendanceSession[];
  treasury: TreasuryTransaction[];
  elections: Election[];
}

/**
 * Dispara o download de um arquivo JSON no navegador
 */
export function downloadJsonFile(filename: string, content: object): void {
  const jsonStr = JSON.stringify(content, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getTimestampSuffix(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}_${hh}h${min}`;
}

/**
 * 1. Exporta Rol de Membros em JSON
 */
export function exportMembersBackup(members: Member[]): void {
  const payload: ModularBackup<Member[]> = {
    metadata: {
      version: '1.0.0',
      system: 'Rol de Membros UPH',
      society: 'UPH 3ª IPBV',
      exportedAt: new Date().toISOString(),
      timestamp: Date.now(),
      type: 'members',
      recordCount: members.length
    },
    data: members
  };
  downloadJsonFile(`backup_membros_uph_${getTimestampSuffix()}.json`, payload);
  recordBackupTimestamp('membros');
}

/**
 * 2. Exporta Sessões de Presença / Chamadas em JSON
 */
export function exportSessionsBackup(sessions: AttendanceSession[]): void {
  const payload: ModularBackup<AttendanceSession[]> = {
    metadata: {
      version: '1.0.0',
      system: 'Rol de Membros UPH',
      society: 'UPH 3ª IPBV',
      exportedAt: new Date().toISOString(),
      timestamp: Date.now(),
      type: 'sessions',
      recordCount: sessions.length
    },
    data: sessions
  };
  downloadJsonFile(`backup_frequencia_uph_${getTimestampSuffix()}.json`, payload);
  recordBackupTimestamp('frequencia');
}

/**
 * 3. Exporta Transações da Tesouraria em JSON
 */
export function exportTreasuryBackup(transactions: TreasuryTransaction[]): void {
  const payload: ModularBackup<TreasuryTransaction[]> = {
    metadata: {
      version: '1.0.0',
      system: 'Rol de Membros UPH',
      society: 'UPH 3ª IPBV',
      exportedAt: new Date().toISOString(),
      timestamp: Date.now(),
      type: 'treasury',
      recordCount: transactions.length
    },
    data: transactions
  };
  downloadJsonFile(`backup_tesouraria_uph_${getTimestampSuffix()}.json`, payload);
  recordBackupTimestamp('tesouraria');
}

/**
 * 4. Exporta Eleições e Apurações em JSON
 */
export function exportElectionsBackup(elections: Election[]): void {
  const payload: ModularBackup<Election[]> = {
    metadata: {
      version: '1.0.0',
      system: 'Rol de Membros UPH',
      society: 'UPH 3ª IPBV',
      exportedAt: new Date().toISOString(),
      timestamp: Date.now(),
      type: 'elections',
      recordCount: elections.length
    },
    data: elections
  };
  downloadJsonFile(`backup_eleicoes_uph_${getTimestampSuffix()}.json`, payload);
  recordBackupTimestamp('eleicoes');
}

/**
 * 5. Exporta Backup Completo (Todas as tabelas em um único pacote)
 */
export function exportFullBackup(bundle: {
  members: Member[];
  sessions: AttendanceSession[];
  treasury: TreasuryTransaction[];
  elections: Election[];
}): void {
  const totalRecords = 
    bundle.members.length + 
    bundle.sessions.length + 
    bundle.treasury.length + 
    bundle.elections.length;

  const payload: FullBackupPayload = {
    metadata: {
      version: '1.0.0',
      system: 'Rol de Membros UPH',
      society: 'UPH 3ª IPBV',
      exportedAt: new Date().toISOString(),
      timestamp: Date.now(),
      type: 'full',
      recordCount: totalRecords
    },
    members: bundle.members,
    sessions: bundle.sessions,
    treasury: bundle.treasury,
    elections: bundle.elections
  };

  downloadJsonFile(`backup_completo_uph_${getTimestampSuffix()}.json`, payload);
  recordBackupTimestamp('completo');
}

/**
 * Registra o timestamp do último backup realizado no localStorage
 */
export function recordBackupTimestamp(moduleName: string): void {
  try {
    const history = JSON.parse(localStorage.getItem('uph_backup_history') || '{}');
    history[moduleName] = Date.now();
    history['last_any'] = Date.now();
    localStorage.setItem('uph_backup_history', JSON.stringify(history));
  } catch {}
}

export function getLastBackupTimestamp(): number | null {
  try {
    const history = JSON.parse(localStorage.getItem('uph_backup_history') || '{}');
    return history['last_any'] || null;
  } catch {
    return null;
  }
}

/**
 * Valida e analisa o conteúdo de um arquivo de backup JSON
 */
export interface ParseResult {
  success: boolean;
  type?: BackupType;
  recordCount: number;
  summary: string;
  data?: {
    members?: Member[];
    sessions?: AttendanceSession[];
    treasury?: TreasuryTransaction[];
    elections?: Election[];
  };
  error?: string;
}

export function validateAndParseBackup(rawText: string): ParseResult {
  try {
    const parsed = JSON.parse(rawText);
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, recordCount: 0, summary: '', error: 'Arquivo JSON inválido ou vazio.' };
    }

    // 1. Caso seja Backup Completo
    if (parsed.metadata?.type === 'full' || (parsed.members && parsed.sessions && parsed.treasury)) {
      const members = Array.isArray(parsed.members) ? parsed.members : (Array.isArray(parsed.data?.members) ? parsed.data.members : []);
      const sessions = Array.isArray(parsed.sessions) ? parsed.sessions : (Array.isArray(parsed.data?.sessions) ? parsed.data.sessions : []);
      const treasury = Array.isArray(parsed.treasury) ? parsed.treasury : (Array.isArray(parsed.data?.treasury) ? parsed.data.treasury : []);
      const elections = Array.isArray(parsed.elections) ? parsed.elections : (Array.isArray(parsed.data?.elections) ? parsed.data.elections : []);

      const count = members.length + sessions.length + treasury.length + elections.length;
      return {
        success: true,
        type: 'full',
        recordCount: count,
        summary: `Backup Completo: ${members.length} membros, ${sessions.length} atas, ${treasury.length} lançamentos, ${elections.length} eleições.`,
        data: { members, sessions, treasury, elections }
      };
    }

    // 2. Caso seja backup modular com envelope `metadata` + `data`
    const type = parsed.metadata?.type as BackupType | undefined;
    const items = Array.isArray(parsed.data) ? parsed.data : (Array.isArray(parsed) ? parsed : null);

    if (type === 'members' || (items && items.length > 0 && items[0].name && (items[0].cargo !== undefined || items[0].situacao !== undefined))) {
      const membersList = (items || []) as Member[];
      return {
        success: true,
        type: 'members',
        recordCount: membersList.length,
        summary: `Rol de Membros: ${membersList.length} cadastros identificados.`,
        data: { members: membersList }
      };
    }

    if (type === 'sessions' || (items && items.length > 0 && items[0].date && items[0].records !== undefined)) {
      const sessionsList = (items || []) as AttendanceSession[];
      return {
        success: true,
        type: 'sessions',
        recordCount: sessionsList.length,
        summary: `Frequência & Chamadas: ${sessionsList.length} atas de reunião identificadas.`,
        data: { sessions: sessionsList }
      };
    }

    if (type === 'treasury' || (items && items.length > 0 && items[0].amount !== undefined && items[0].type !== undefined)) {
      const treasuryList = (items || []) as TreasuryTransaction[];
      return {
        success: true,
        type: 'treasury',
        recordCount: treasuryList.length,
        summary: `Tesouraria: ${treasuryList.length} lançamentos financeiros identificados.`,
        data: { treasury: treasuryList }
      };
    }

    if (type === 'elections' || (items && items.length > 0 && items[0].role !== undefined && items[0].status !== undefined)) {
      const electionsList = (items || []) as Election[];
      return {
        success: true,
        type: 'elections',
        recordCount: electionsList.length,
        summary: `Eleições & Urna: ${electionsList.length} registros eleitorais identificados.`,
        data: { elections: electionsList }
      };
    }

    return {
      success: false,
      recordCount: 0,
      summary: '',
      error: 'O arquivo JSON não possui a estrutura reconhecida de nenhum módulo do Rol da UPH.'
    };
  } catch (err: any) {
    return {
      success: false,
      recordCount: 0,
      summary: '',
      error: `Falha ao interpretar o arquivo JSON: ${err.message || 'Sintaxe corrompida'}`
    };
  }
}
