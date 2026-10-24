import { useState, useEffect, useCallback } from 'react';
import { Member, AttendanceSession, Election, Vote, TreasuryTransaction } from '../types';
import { localDB, dbEvents } from '../lib/offlineDB';
import { syncClient } from '../lib/syncClient';
import { compareMembersByName } from '../lib/memberUtils';

export function useMembers() {
  const [members, setMembers] = useState<Member[]>(() => {
    return localDB.getMembers().sort(compareMembersByName);
  });

  const refresh = useCallback(() => {
    setMembers(localDB.getMembers().sort(compareMembersByName));
  }, []);

  useEffect(() => {
    const handleUpdate = () => refresh();
    dbEvents.addEventListener('upa_db_members', handleUpdate);

    // Sincroniza com a verdade do servidor na inicialização
    syncClient.fetchMembers().then(() => refresh());

    return () => dbEvents.removeEventListener('upa_db_members', handleUpdate);
  }, [refresh]);

  const addMember = async (name: string, cargo: string, entryDate?: string, extraFields?: Partial<Member>) => {
    const existingPins = new Set(members.map(m => m.pinCode).filter(Boolean));
    let pinCode = extraFields?.pinCode || '';
    if (!pinCode) {
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 1000) {
        pinCode = Math.floor(1000 + Math.random() * 9000).toString();
        if (!existingPins.has(pinCode)) {
          isUnique = true;
        }
        attempts++;
      }
    }

    const newMember: Member = {
      id: `mbr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name,
      cargo: cargo || 'Sócio Ativo',
      upaEntryDate: entryDate || undefined,
      uphEntryDate: entryDate || undefined,
      pinCode,
      createdAt: Date.now(),
      ...extraFields
    };

    await syncClient.pushMember(newMember);
    refresh();
    return newMember.id;
  };

  const removeMember = async (id: string) => {
    await syncClient.deleteMember(id);
    refresh();
  };

  const updateMember = async (id: string, updates: Partial<Member>) => {
    const current = localDB.getMembers().find(m => m.id === id);
    if (!current) return;
    const updated: Member = { ...current, ...updates };
    await syncClient.pushMember(updated);
    refresh();
  };

  const importMembersBatch = async (
    items: Array<{ name: string; cargo: string; uphEntryDate?: string; extraFields?: Partial<Member> }>
  ) => {
    const existingPins = new Set(members.map(m => m.pinCode).filter(Boolean));
    const newMembers: Member[] = items.map((item, idx) => {
      let pinCode = item.extraFields?.pinCode || '';
      if (!pinCode) {
        let attempts = 0;
        while ((!pinCode || existingPins.has(pinCode)) && attempts < 1000) {
          pinCode = Math.floor(1000 + Math.random() * 9000).toString();
          attempts++;
        }
      }
      existingPins.add(pinCode);

      return {
        id: `mbr-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
        name: item.name,
        cargo: item.cargo || 'Membro',
        uphEntryDate: item.uphEntryDate,
        pinCode,
        createdAt: Date.now(),
        ...item.extraFields
      };
    });

    await syncClient.pushMembersBatch(newMembers);
    refresh();
  };

  return { members, addMember, removeMember, updateMember, importMembersBatch };
}

export function useSessions() {
  const [sessions, setSessions] = useState<AttendanceSession[]>(() => {
    return localDB.getSessions();
  });

  const refresh = useCallback(() => {
    setSessions(localDB.getSessions());
  }, []);

  useEffect(() => {
    const handleUpdate = () => refresh();
    dbEvents.addEventListener('upa_db_sessions', handleUpdate);
    syncClient.fetchSessions().then(() => refresh());
    return () => dbEvents.removeEventListener('upa_db_sessions', handleUpdate);
  }, [refresh]);

  const addSession = async (session: Omit<AttendanceSession, 'id'>) => {
    const newSession: AttendanceSession = {
      ...session,
      id: `ses-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now()
    };
    await syncClient.pushSession(newSession);
    refresh();
    return newSession.id;
  };

  const updateSession = async (id: string, updates: Partial<AttendanceSession>) => {
    const current = localDB.getSessions().find(s => s.id === id);
    if (!current) return;
    const updated = { ...current, ...updates };
    await syncClient.pushSession(updated);
    refresh();
  };

  const removeSession = async (id: string) => {
    await syncClient.deleteSession(id);
    refresh();
  };

  return { sessions, addSession, updateSession, removeSession };
}

export function useElections() {
  const [elections, setElections] = useState<Election[]>(() => {
    return localDB.getElections();
  });

  const refresh = useCallback(() => {
    setElections(localDB.getElections());
  }, []);

  useEffect(() => {
    const handleUpdate = () => refresh();
    dbEvents.addEventListener('upa_db_elections', handleUpdate);

    // Polling em background a cada 2.5s para sincronizar votos ao vivo de outros aparelhos
    syncClient.fetchElections().then(data => setElections(data));
    const interval = setInterval(() => {
      syncClient.fetchElections().then(data => {
        setElections(data);
      });
    }, 2500);

    return () => {
      dbEvents.removeEventListener('upa_db_elections', handleUpdate);
      clearInterval(interval);
    };
  }, [refresh]);

  const addElection = async (election: Omit<Election, 'id'>) => {
    const newElection: Election = {
      ...election,
      id: `elc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };
    await syncClient.pushElection(newElection);
    refresh();
    return newElection.id;
  };

  const updateElection = async (id: string, updates: Partial<Election>) => {
    const current = localDB.getElections().find(e => e.id === id);
    if (!current) return;
    const updated = { ...current, ...updates };
    await syncClient.pushElection(updated);
    refresh();
  };

  const castVote = async (electionId: string, vote: Vote) => {
    const res = await syncClient.castVote(electionId, vote);
    refresh();
    return res;
  };

  const removeElection = async (id: string) => {
    await syncClient.deleteElection(id);
    refresh();
  };

  return { elections, addElection, updateElection, castVote, removeElection };
}

export function useTreasury() {
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>(() => {
    return localDB.getTransactions();
  });

  const refresh = useCallback(() => {
    setTransactions(localDB.getTransactions());
  }, []);

  useEffect(() => {
    const handleUpdate = () => refresh();
    dbEvents.addEventListener('upa_db_treasury', handleUpdate);
    syncClient.fetchTreasury().then(() => refresh());
    return () => dbEvents.removeEventListener('upa_db_treasury', handleUpdate);
  }, [refresh]);

  const addTransaction = async (tx: Omit<TreasuryTransaction, 'id' | 'createdAt'>) => {
    const newTx: TreasuryTransaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now()
    };
    await syncClient.pushTransaction(newTx);
    refresh();
    return newTx.id;
  };

  const addTransactionsBatch = async (txList: Omit<TreasuryTransaction, 'id' | 'createdAt'>[]) => {
    const newItems: TreasuryTransaction[] = txList.map((tx, idx) => ({
      ...tx,
      id: `tx-${Date.now()}-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now()
    }));
    for (const item of newItems) {
      await syncClient.pushTransaction(item);
    }
    refresh();
  };

  const updateTransaction = async (id: string, updates: Partial<TreasuryTransaction>) => {
    const current = localDB.getTransactions().find(t => t.id === id);
    if (!current) return;
    const updated = { ...current, ...updates };
    await syncClient.pushTransaction(updated);
    refresh();
  };

  const removeTransaction = async (id: string) => {
    await syncClient.deleteTransaction(id);
    refresh();
  };

  return { 
    transactions, 
    addTransaction, 
    addTransactionsBatch, 
    updateTransaction, 
    removeTransaction 
  };
}
