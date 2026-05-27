import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ClipboardCheck, 
  FileText, 
  LayoutDashboard,
  BarChart3,
  Gavel,
} from 'lucide-react';
import { useMembers, useSessions } from './hooks/useData';
import { AttendanceStatus, AttendanceRecord, Member, SessionType } from './types';
import { auth, db } from './firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User, 
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Components
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { MembersView } from './components/MembersView';
import { AttendanceView } from './components/AttendanceView';
import { ReportsView } from './components/ReportsView';
import { MemberHistoryModal } from './components/MemberHistoryModal';
import { StatisticsView } from './components/StatisticsView';
import { VotingStation } from './components/voting/VotingStation';
import { LoginScreen } from './components/LoginScreen';

type View = 'dashboard' | 'members' | 'attendance' | 'reports' | 'statistics' | 'voting';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<View>('dashboard');
  
  // App Roles
  const [appRole, setAppRole] = useState<'admin' | 'voter' | null>(() => {
    return localStorage.getItem('uph_app_role') as 'admin' | 'voter' | null;
  });
  const [voterMemberId, setVoterMemberId] = useState<string | null>(() => {
    return localStorage.getItem('uph_voter_member_id');
  });

  const { members, addMember, removeMember, updateMember } = useMembers();
  const { sessions, addSession, removeSession } = useSessions();

  // Selection states
  const [selectedMemberForHistory, setSelectedMemberForHistory] = useState<Member | null>(null);

  // Attendance logic states
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceStatus>>(() => {
    const saved = localStorage.getItem('uph_attendanceRecords');
    return saved ? JSON.parse(saved) : {};
  });
  const [justifications, setJustifications] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('uph_justifications');
    return saved ? JSON.parse(saved) : {};
  });
  const [sessionType, setSessionType] = useState<SessionType>(() => {
    return (localStorage.getItem('uph_sessionType') as SessionType) || 'programacao';
  });
  const [plenaryCall, setPlenaryCall] = useState<1 | 2>(() => {
    return (Number(localStorage.getItem('uph_plenaryCall')) as 1 | 2) || 1;
  });
  const [isAttendanceStarted, setIsAttendanceStarted] = useState(() => {
    return localStorage.getItem('uph_isAttendanceStarted') === 'true';
  });

  // Persist state changes
  useEffect(() => {
    localStorage.setItem('uph_attendanceRecords', JSON.stringify(attendanceRecords));
    localStorage.setItem('uph_justifications', JSON.stringify(justifications));
    localStorage.setItem('uph_sessionType', sessionType);
    localStorage.setItem('uph_plenaryCall', String(plenaryCall));
    localStorage.setItem('uph_isAttendanceStarted', String(isAttendanceStarted));
    if (appRole) localStorage.setItem('uph_app_role', appRole);
    else localStorage.removeItem('uph_app_role');
    
    if (voterMemberId) localStorage.setItem('uph_voter_member_id', voterMemberId);
    else localStorage.removeItem('uph_voter_member_id');
  }, [attendanceRecords, justifications, sessionType, plenaryCall, isAttendanceStarted, appRole, voterMemberId]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAdminLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setAppRole('admin');
    } catch (error) {
      console.error("Erro ao fazer login admin:", error);
    }
  };

  const handleEmailLogin = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      setAppRole('admin');
    } catch (error: any) {
      console.error("Erro ao fazer login admin com email:", error);
      if (error?.code === 'auth/operation-not-allowed') {
         alert('O provedor de login "E-mail e Senha" precisa ser ativado no console do seu Firebase! Vá em Authentication > Sign-in method > Adicionar Provedor > E-mail/Senha e ative-o.');
      } else if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/user-not-found' || error?.code === 'auth/wrong-password') {
         alert('E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.');
      } else {
         alert('Erro ao entrar: ' + error.message);
      }
    }
  };

  const handleEmailRegister = async (email: string, pass: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      setAppRole('admin');
    } catch (error: any) {
      console.error("Erro ao registrar admin por email:", error);
      if (error?.code === 'auth/operation-not-allowed') {
         alert('O provedor de login "E-mail e Senha" precisa ser ativado no console do seu Firebase! Vá em Authentication > Sign-in method > Adicionar Provedor > E-mail/Senha e ative-o.');
      } else if (error?.code === 'auth/email-already-in-use') {
         alert('Este e-mail de administrador já está cadastrado. Tente entrar usando a opção correspondente.');
      } else if (error?.code === 'auth/weak-password') {
         alert('A senha informada é muito fraca. Ela deve conter pelo menos 6 caracteres.');
      } else {
         alert('Erro ao registrar administrador: ' + error.message);
      }
    }
  };

  const handleVoterLogin = async (pin: string) => {
    try {
      const cleanPin = pin.trim();
      await signInAnonymously(auth);
      
      const q = query(collection(db, 'members'), where('pinCode', '==', cleanPin));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        await signOut(auth);
        alert('PIN inválido ou membro não encontrado. Verifique o código e tente novamente.');
        return;
      }
      
      const matchedMember = querySnapshot.docs[0];
      setVoterMemberId(matchedMember.id);
      setAppRole('voter');
    } catch (error: any) {
      console.error("Erro ao fazer login anonimo:", error);
      if (error?.code === 'auth/admin-restricted-operation') {
         alert('Para usar o login de eleitor simulado, é necessário ativar o provedor "Anônimo" (Anonymous) no Firebase Console em Authentication > Sign-in method.');
      } else {
         alert('Erro ao autenticar eleitor: ' + error.message);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAppRole(null);
      setVoterMemberId(null);
      localStorage.removeItem('uph_app_role');
      localStorage.removeItem('uph_voter_member_id');
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  const stats = useMemo(() => {
    const totalMembros = members.length;
    const totalSessions = sessions.length;
    let totalPresences = 0;
    let lastAbsentCount = 0;
    
    if (totalSessions > 0) {
      totalPresences = sessions.reduce((acc, s) => acc + s.records.filter(r => r.status === 'presente').length, 0);
      lastAbsentCount = sessions[0].records.filter(r => r.status === 'ausente').length;
    }

    return {
      totalMembros,
      mediaPresenca: totalSessions > 0 && totalMembros > 0 ? Math.round((totalPresences / (totalSessions * totalMembros)) * 100) : 0,
      lastAbsentCount,
      totalSessions
    };
  }, [members, sessions]);

  const attendanceTotals = useMemo(() => {
    const presentCount = Object.values(attendanceRecords).filter(s => s === 'presente').length;
    const presencePercentage = members.length > 0 ? (presentCount / members.length) * 100 : 0;
    
    return {
      presentCount,
      presencePercentage,
      metQuorum1st: presencePercentage >= 51,
      metQuorum2nd: presencePercentage >= 33.33
    };
  }, [attendanceRecords, members.length]);

  const handleSaveAttendance = useCallback(async () => {
    if (members.length === 0) return;

    const records: AttendanceRecord[] = members.map(m => ({
      memberId: m.id,
      memberName: m.name,
      status: attendanceRecords[m.id] || 'ausente',
      justification: justifications[m.id] || ''
    }));

    await addSession({
      date: Date.now(),
      type: sessionType,
      records,
      ...(sessionType === 'plenaria' ? { callNumber: plenaryCall } : {})
    });

    setAttendanceRecords({});
    setJustifications({});
    setIsAttendanceStarted(false);
    setActiveView('reports');
  }, [members, attendanceRecords, justifications, sessionType, plenaryCall, addSession]);

  const navItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'attendance', label: 'Chamada Ativa', icon: ClipboardCheck },
    { id: 'members', label: 'Rol de Membros', icon: Users },
    { id: 'reports', label: 'Relatórios Históricos', icon: FileText },
    { id: 'statistics', label: 'Estatísticas', icon: BarChart3 },
    { id: 'voting', label: 'Sistema de Votação', icon: Gavel },
  ];

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 border-indigo-500 border-t-4">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-[2rem] flex items-center justify-center border-2 border-indigo-500/30">
              <ClipboardCheck className="w-8 h-8 text-indigo-500" />
            </div>
            <div className="absolute inset-0 border-2 border-indigo-500 rounded-[2rem] border-t-transparent animate-spin" />
          </div>
          <div className="text-center">
            <h2 className="text-white font-display text-xl font-bold tracking-tight mb-2">Inicializando</h2>
            <p className="text-indigo-400 font-mono text-[10px] uppercase tracking-widest animate-pulse">Estabelecendo Conexão Secura</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !appRole) {
    return (
      <LoginScreen 
        onGoogleLogin={handleAdminLogin}
        onVoterLogin={handleVoterLogin}
        onEmailLogin={handleEmailLogin}
        onEmailRegister={handleEmailRegister}
      />
    );
  }

  // Voter view selection
  if (appRole === 'voter') {
    if (!voterMemberId) {
      setTimeout(handleLogout, 0);
      return null;
    }

    return (
      <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden">
        <div className="flex-1 flex flex-col items-center max-w-lg mx-auto bg-white shadow-xl shadow-slate-200/50">
          <header className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Gavel className="w-4 h-4 text-indigo-600" />
              </div>
              <h1 className="font-bold text-slate-800">Painel do Eleitor</h1>
            </div>
            <button 
              onClick={handleLogout}
              className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
            >
              Sair
            </button>
          </header>
          <main className="flex-1 w-full overflow-y-auto bg-slate-50">
            <VotingStation societyId="uph-society-id" voterMemberId={voterMemberId} />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        navItems={navItems} 
        user={user} 
        onLogout={handleLogout} 
      />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <Header 
          activeView={activeView} 
          onNavigate={setActiveView} 
          navItems={navItems} 
          onSaveAttendance={handleSaveAttendance}
          canSaveAttendance={members.length > 0}
          isAttendanceStarted={isAttendanceStarted}
          onLogout={handleLogout}
        />

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="p-4 md:p-10"
            >
              {activeView === 'dashboard' && (
                <Dashboard 
                  members={members} 
                  sessions={sessions} 
                  stats={stats} 
                  onNavigate={setActiveView} 
                />
              )}

              {activeView === 'members' && (
                <MembersView 
                  members={members} 
                  addMember={addMember} 
                  removeMember={removeMember} 
                  updateMember={updateMember}
                  onSelectMember={setSelectedMemberForHistory}
                />
              )}

              {activeView === 'attendance' && (
                <AttendanceView 
                  members={members}
                  sessionType={sessionType}
                  setSessionType={setSessionType}
                  plenaryCall={plenaryCall}
                  setPlenaryCall={setPlenaryCall}
                  attendanceRecords={attendanceRecords}
                  setAttendanceRecords={setAttendanceRecords}
                  justifications={justifications}
                  setJustifications={setJustifications}
                  totals={attendanceTotals}
                  isStarted={isAttendanceStarted}
                  setIsStarted={setIsAttendanceStarted}
                />
              )}

              {activeView === 'reports' && (
                <ReportsView 
                  sessions={sessions} 
                  removeSession={removeSession} 
                />
              )}

              {activeView === 'statistics' && (
                <StatisticsView 
                  members={members} 
                  sessions={sessions} 
                />
              )}

              {activeView === 'voting' && (
                <VotingStation societyId="uph-society-id" />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <MemberHistoryModal 
        member={selectedMemberForHistory} 
        onClose={() => setSelectedMemberForHistory(null)} 
        sessions={sessions} 
      />
    </div>
  );
}
