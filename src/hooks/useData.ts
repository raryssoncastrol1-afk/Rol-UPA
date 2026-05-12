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
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Member, AttendanceSession } from '../types';

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
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
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
      const q = query(collection(db, 'members'), orderBy('createdAt', 'desc'));
      
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

  const addMember = async (name: string, cargo: string) => {
    try {
      const docRef = await addDoc(collection(db, 'members'), {
        name,
        cargo,
        createdAt: Date.now() // Using Date.now() for direct mapping to existing types, but serverside validation uses it too
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

  return { members, addMember, removeMember };
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
