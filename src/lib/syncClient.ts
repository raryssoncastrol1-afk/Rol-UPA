import { Member, AttendanceSession, Election, TreasuryTransaction, Vote } from '../types';
import { localDB } from './offlineDB';

/**
 * Cliente de Sincronização entre LocalStorage (Offline-First) e SQLite/Server
 */
export const syncClient = {
  // --- AUTENTICAÇÃO DO ELEITOR ---
  async authenticateVoter(pin: string): Promise<{ success: boolean; voter?: { id: string; name: string; cargo: string; funcaoEclesiastica: string }; error?: string }> {
    try {
      const res = await fetch('/api/auth/voter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'PIN não encontrado ou inválido.' };
      }
      return { success: true, voter: data.voter };
    } catch {
      // Fallback offline se servidor indisponível
      const local = localDB.getMembers().find(m => m.pinCode && m.pinCode.trim() === pin.trim());
      if (local) {
        return {
          success: true,
          voter: {
            id: local.id,
            name: local.name,
            cargo: local.cargo || 'Membro',
            funcaoEclesiastica: local.funcaoEclesiastica || 'Membro Comungante'
          }
        };
      }
      return { success: false, error: 'Não foi possível validar o PIN. Verifique a conexão com o servidor.' };
    }
  },

  // --- ELEIÇÕES ---
  async fetchElections(): Promise<Election[]> {
    try {
      const res = await fetch('/api/elections');
      if (res.ok) {
        const remote: Election[] = await res.json();
        if (Array.isArray(remote)) {
          // O servidor é a autoridade máxima: substitui completamente o localDB
          localDB.replaceAllElections(remote);
          return remote;
        }
      }
    } catch {
      // Offline fallback: usa localDB
    }
    return localDB.getElections();
  },

  async pushElection(election: Election): Promise<void> {
    const res = await fetch('/api/elections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(election)
    });
    if (!res.ok) throw new Error('Falha ao salvar eleição no servidor.');
    localDB.saveElection(election);
  },

  async castVote(electionId: string, vote: Vote): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/elections/${electionId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vote)
      });

      if (!res.ok) {
        let errDetail = 'Não foi possível registrar o voto.';
        try {
          const data = await res.json();
          if (data?.error) errDetail = data.error;
        } catch {}
        return { success: false, error: errDetail };
      }

      // Voto aceito com sucesso pelo servidor: atualiza cópia local
      const current = localDB.getElections().find(e => e.id === electionId);
      if (current) {
        const updatedVotes = [...(current.votes || []), vote];
        localDB.saveElection({ ...current, votes: updatedVotes });
      }

      return { success: true };
    } catch {
      return { 
        success: false, 
        error: 'Sem conexão com a mesa eleitoral. Aproxime-se do Wi-Fi e tente novamente.' 
      };
    }
  },

  async deleteElection(id: string): Promise<void> {
    const res = await fetch(`/api/elections/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Falha ao excluir eleição no servidor.');
    localDB.deleteElection(id);
  },

  // --- MEMBROS ---
  async fetchMembers(): Promise<Member[]> {
    try {
      const res = await fetch('/api/members');
      if (res.ok) {
        const remote: Member[] = await res.json();
        if (Array.isArray(remote) && remote.length > 0) {
          // O servidor é a autoridade máxima: substitui o cache local e elimina duplicatas antigas
          localDB.replaceAllMembers(remote);
          return remote;
        }
      }
    } catch {}
    return localDB.getMembers();
  },

  async pushMember(member: Member): Promise<void> {
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member)
    });
    if (!res.ok) throw new Error('Falha ao salvar membro no servidor.');
    localDB.saveMember(member);
  },

  async pushMembersBatch(members: Member[]): Promise<void> {
    const res = await fetch('/api/members/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(members)
    });
    if (!res.ok) throw new Error('Falha ao salvar lote de membros no servidor.');
    localDB.saveMembersBatch(members);
  },

  async deleteMember(id: string): Promise<void> {
    const res = await fetch(`/api/members/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Falha ao excluir membro no servidor.');
    localDB.deleteMember(id);
  },

  // --- SESSÕES ---
  async fetchSessions(): Promise<AttendanceSession[]> {
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const remote: AttendanceSession[] = await res.json();
        if (Array.isArray(remote) && remote.length > 0) {
          remote.forEach(s => localDB.saveSession(s));
          return remote;
        }
      }
    } catch {}
    return localDB.getSessions();
  },

  async pushSession(session: AttendanceSession): Promise<void> {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session)
    });
    if (!res.ok) throw new Error('Falha ao salvar sessão no servidor.');
    localDB.saveSession(session);
  },

  async pushSessionsBatch(sessions: AttendanceSession[]): Promise<void> {
    try {
      await fetch('/api/sessions/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessions)
      });
    } catch {}
    localDB.replaceAllSessions(sessions);
  },

  async deleteSession(id: string): Promise<void> {
    const res = await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Falha ao excluir sessão no servidor.');
    localDB.deleteSession(id);
  },

  // --- TESOURARIA ---
  async fetchTreasury(): Promise<TreasuryTransaction[]> {
    try {
      const res = await fetch('/api/treasury');
      if (res.ok) {
        const remote: TreasuryTransaction[] = await res.json();
        if (Array.isArray(remote) && remote.length > 0) {
          remote.forEach(t => localDB.saveTransaction(t));
          return remote;
        }
      }
    } catch {}
    return localDB.getTransactions();
  },

  async pushTransaction(tx: TreasuryTransaction): Promise<void> {
    const res = await fetch('/api/treasury', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx)
    });
    if (!res.ok) throw new Error('Falha ao salvar transação no servidor.');
    localDB.saveTransaction(tx);
  },

  async pushTreasuryBatch(transactions: TreasuryTransaction[]): Promise<void> {
    try {
      await fetch('/api/treasury/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactions)
      });
    } catch {}
    localDB.replaceAllTransactions(transactions);
  },

  async deleteTransaction(id: string): Promise<void> {
    const res = await fetch(`/api/treasury/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Falha ao excluir transação no servidor.');
    localDB.deleteTransaction(id);
  },

  async pushElectionsBatch(elections: Election[]): Promise<void> {
    try {
      await fetch('/api/elections/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(elections)
      });
    } catch {}
    localDB.replaceAllElections(elections);
  }
};
