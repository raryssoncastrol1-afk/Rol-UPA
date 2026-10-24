/**
 * Local Storage Offline-First Database Service
 * Gerencia persistência local transparente com suporte a migração e broadcast entre abas.
 */
import { Member, AttendanceSession, Election, TreasuryTransaction, AppUser } from '../types';

const STORAGE_KEYS = {
  MEMBERS: 'upa_db_members',
  SESSIONS: 'upa_db_sessions',
  ELECTIONS: 'upa_db_elections',
  TREASURY: 'upa_db_treasury',
  AUTH_USER: 'upa_auth_user',
  SEEDED: 'upa_db_seeded_v1'
} as const;

// Event target to notify React hooks across components without re-renders
class DBEventHub extends EventTarget {
  emit(event: string) {
    this.dispatchEvent(new Event(event));
  }
}

export const dbEvents = new DBEventHub();

// Escuta alterações em outras abas para sincronizar em tempo real
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key?.startsWith('upa_db_') || e.key === STORAGE_KEYS.AUTH_USER) {
      dbEvents.emit(e.key);
    }
  });
}

/**
 * Inicializa a base de dados da UPA. Começa vazia aguardando cadastro dos adolescentes.
 */
export function seedDefaultMembersIfNeeded(): Member[] {
  if (typeof window === 'undefined') return [];
  const existing = localStorage.getItem(STORAGE_KEYS.MEMBERS);
  if (existing) {
    try {
      const parsed = JSON.parse(existing);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.warn('Erro ao ler membros existentes do storage:', e);
    }
  }

  // Base UPA começa limpa/zerada
  localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.SEEDED, 'true');
  return [];
}

// Helpers genéricos de leitura e escrita
function getItems<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (err) {
    console.error(`Erro ao ler ${key}:`, err);
    return defaultValue;
  }
}

function setItems<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    dbEvents.emit(key);
  } catch (err) {
    console.error(`Erro ao salvar ${key}:`, err);
  }
}

// -------------------------------------------------------------
// OPERAÇÕES DE MEMBROS
// -------------------------------------------------------------
export const localDB = {
  // --- Membros ---
  getMembers(): Member[] {
    const current = getItems<Member[]>(STORAGE_KEYS.MEMBERS, []);
    if (current.length === 0) {
      return seedDefaultMembersIfNeeded();
    }
    return current;
  },

  saveMember(member: Member): void {
    const members = this.getMembers();
    const idx = members.findIndex(m => m.id === member.id);
    if (idx >= 0) {
      members[idx] = member;
    } else {
      members.push(member);
    }
    setItems(STORAGE_KEYS.MEMBERS, members);
  },

  deleteMember(id: string): void {
    const members = this.getMembers().filter(m => m.id !== id);
    setItems(STORAGE_KEYS.MEMBERS, members);
  },

  saveMembersBatch(batch: Member[]): void {
    const members = this.getMembers();
    const map = new Map<string, Member>(members.map(m => [m.id, m]));
    batch.forEach(b => map.set(b.id, b));
    setItems(STORAGE_KEYS.MEMBERS, Array.from(map.values()));
  },

  replaceAllMembers(allMembers: Member[]): void {
    setItems(STORAGE_KEYS.MEMBERS, allMembers);
  },

  // --- Sessões de Presença ---
  getSessions(): AttendanceSession[] {
    return getItems<AttendanceSession[]>(STORAGE_KEYS.SESSIONS, []);
  },

  saveSession(session: AttendanceSession): void {
    const sessions = this.getSessions();
    const idx = sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) {
      sessions[idx] = session;
    } else {
      sessions.unshift(session);
    }
    setItems(STORAGE_KEYS.SESSIONS, sessions);
  },

  deleteSession(id: string): void {
    const sessions = this.getSessions().filter(s => s.id !== id);
    setItems(STORAGE_KEYS.SESSIONS, sessions);
  },

  replaceAllSessions(allSessions: AttendanceSession[]): void {
    setItems(STORAGE_KEYS.SESSIONS, allSessions);
  },

  // --- Eleições ---
  getElections(): Election[] {
    return getItems<Election[]>(STORAGE_KEYS.ELECTIONS, []);
  },

  saveElection(election: Election): void {
    const elections = this.getElections();
    const idx = elections.findIndex(e => e.id === election.id);
    if (idx >= 0) {
      elections[idx] = election;
    } else {
      elections.push(election);
    }
    setItems(STORAGE_KEYS.ELECTIONS, elections);
  },

  deleteElection(id: string): void {
    const elections = this.getElections().filter(e => e.id !== id);
    setItems(STORAGE_KEYS.ELECTIONS, elections);
  },

  replaceAllElections(allElections: Election[]): void {
    setItems(STORAGE_KEYS.ELECTIONS, allElections);
  },

  // --- Tesouraria ---
  getTransactions(): TreasuryTransaction[] {
    return getItems<TreasuryTransaction[]>(STORAGE_KEYS.TREASURY, []);
  },

  saveTransaction(tx: TreasuryTransaction): void {
    const list = this.getTransactions();
    const idx = list.findIndex(t => t.id === tx.id);
    if (idx >= 0) {
      list[idx] = tx;
    } else {
      list.unshift(tx);
    }
    setItems(STORAGE_KEYS.TREASURY, list);
  },

  saveTransactionsBatch(batch: TreasuryTransaction[]): void {
    const list = this.getTransactions();
    setItems(STORAGE_KEYS.TREASURY, [...batch, ...list]);
  },

  deleteTransaction(id: string): void {
    const list = this.getTransactions().filter(t => t.id !== id);
    setItems(STORAGE_KEYS.TREASURY, list);
  },

  replaceAllTransactions(allTransactions: TreasuryTransaction[]): void {
    setItems(STORAGE_KEYS.TREASURY, allTransactions);
  },

  // --- Autenticação Local Offline ---
  getCurrentUser(): AppUser | null {
    return getItems<AppUser | null>(STORAGE_KEYS.AUTH_USER, null);
  },

  setCurrentUser(user: AppUser | null): void {
    setItems(STORAGE_KEYS.AUTH_USER, user);
  }
};
