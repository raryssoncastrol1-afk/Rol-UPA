import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy,
  serverTimestamp,
  getDocFromServer,
  updateDoc,
  arrayUnion
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Member, AttendanceSession, Election, Vote } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  // Silence expected unauthenticated Firestore list or get errors during signOut / session-race conditions
  if (!auth.currentUser && (operationType === OperationType.LIST || operationType === OperationType.GET)) {
    console.warn(`[Firestore Status] Silenced expected unauthenticated read/list event on path "${path || 'unknown'}".`);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  // Throwing inside onSnapshot error handlers (LIST) causes unhandled promise rejections that crash the app.
  // We only throw for mutations (CREATE, UPDATE, DELETE).
  if (operationType !== OperationType.LIST) {
    throw new Error(errInfo.error);
  }
}

// Test connection on boot
const testConnection = async () => {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
};
testConnection();

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      // Clear current data if user logs out
      if (!user) {
        setMembers([]);
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = undefined;
        }
        return;
      }

      // Start listener if user is logged in
      const q = query(collection(db, 'members'), orderBy('name', 'asc'));
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        const memberList: Member[] = [];
        snapshot.forEach((doc) => {
          memberList.push({ id: doc.id, ...doc.data() } as Member);
        });
        setMembers(memberList);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'members');
      });
    });

    return () => {
      authUnsubscribe();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const addMember = async (name: string, cargo: string, uphEntryDate?: string) => {
    try {
      // Check for PIN collision (unlikely but safe)
      const existingPins = new Set(members.map(m => m.pinCode).filter(Boolean));
      let pinCode = '';
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 1000) {
        pinCode = Math.floor(1000 + Math.random() * 9000).toString();
        if (!existingPins.has(pinCode)) {
          isUnique = true;
        }
        attempts++;
      }
      
      const docRef = await addDoc(collection(db, 'members'), {
        name,
        cargo,
        uphEntryDate: uphEntryDate || null,
        pinCode,
        createdAt: Date.now()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'members');
    }
  };

  const removeMember = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'members', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `members/${id}`);
    }
  };

  const updateMember = async (id: string, updates: Partial<Member>) => {
    try {
      await updateDoc(doc(db, 'members', id), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `members/${id}`);
    }
  };

  return { members, addMember, removeMember, updateMember };
}

export function useSessions() {
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      // Clear current data if user logs out
      if (!user) {
        setSessions([]);
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = undefined;
        }
        return;
      }

      // Start listener if user is logged in
      const q = query(collection(db, 'attendanceSessions'), orderBy('date', 'desc'));
      
      unsubscribe = onSnapshot(q, (snapshot) => {
        const sessionList: AttendanceSession[] = [];
        snapshot.forEach((doc) => {
          sessionList.push({ id: doc.id, ...doc.data() } as AttendanceSession);
        });
        setSessions(sessionList);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'attendanceSessions');
      });
    });

    return () => {
      authUnsubscribe();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const addSession = async (session: Omit<AttendanceSession, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'attendanceSessions'), {
        ...session,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'attendanceSessions');
    }
  };

  const removeSession = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'attendanceSessions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `attendanceSessions/${id}`);
    }
  };

  return { sessions, addSession, removeSession };
}

export function useElections() {
  const [elections, setElections] = useState<Election[]>([]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const authUnsubscribe = onAuthStateChanged(auth, (user) => {
      // Clear current data if user logs out
      if (!user) {
        setElections([]);
        if (unsubscribe) {
          unsubscribe();
          unsubscribe = undefined;
        }
        return;
      }

      // Start listener if user is logged in
      const q = query(collection(db, 'elections'));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const electionList: Election[] = [];
        snapshot.forEach((doc) => {
          electionList.push({ id: doc.id, ...doc.data() } as Election);
        });
        setElections(electionList);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'elections');
      });
    });

    return () => {
      authUnsubscribe();
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const addElection = async (election: Omit<Election, 'id'>) => {
    try {
      await addDoc(collection(db, 'elections'), election);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'elections');
    }
  };
  
  const updateElection = async (id: string, election: Partial<Election>) => {
    try {
      await updateDoc(doc(db, 'elections', id), election);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `elections/${id}`);
    }
  };

  const removeElection = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'elections', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `elections/${id}`);
    }
  };

  const castVote = async (electionId: string, vote: Vote) => {
    try {
      await updateDoc(doc(db, 'elections', electionId), {
        votes: arrayUnion(vote)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `elections/${electionId}`);
    }
  };

  return { elections, addElection, updateElection, castVote, removeElection };
}

