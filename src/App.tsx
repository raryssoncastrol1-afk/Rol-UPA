import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ClipboardCheck, 
  FileText, 
  LayoutDashboard,
  BarChart3,
  Gavel,
  DollarSign
} from 'lucide-react';
import { useMembers, useSessions, useTreasury } from './hooks/useData';
import { AttendanceStatus, AttendanceRecord, Member, SessionType, AppUser } from './types';
import { localDB } from './lib/offlineDB';

// Components
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { MembersView } from './components/MembersView';
import { AttendanceView } from './components/AttendanceView';
import { MemberHistoryModal } from './components/MemberHistoryModal';
import { LoginScreen } from './components/LoginScreen';

// Lazy-loaded heavy components (bundle splitting)
const ReportsView = lazy(() => import('./components/ReportsView').then(m => ({ default: m.ReportsView })));
const StatisticsView = lazy(() => import('./components/StatisticsView').then(m => ({ default: m.StatisticsView })));
const VotingStation = lazy(() => import('./components/voting/VotingStation').then(m => ({ default: m.VotingStation })));
const TreasuryView = lazy(() => import('./components/TreasuryView').then(m => ({ default: m.TreasuryView })));

type View = 'dashboard' | 'members' | 'attendance' | 'reports' | 'statistics' | 'voting' | 'treasury';

export default function App() {
  const [user, setUser] = useState<AppUser | null>(() => localDB.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<View>('dashboard');
  
  // App Roles
  const [appRole, setAppRole] = useState<'admin' | 'voter' | null>(() => {
    return (localStorage.getItem('uph_app_role') as 'admin' | 'voter' | null) || (localDB.getCurrentUser()?.role ?? null);
  });
  const [voterMemberId, setVoterMemberId] = useState<string | null>(() => {
    return localStorage.getItem('uph_voter_member_id');
  });

  const { members, addMember, removeMember, updateMember } = useMembers();
  const { sessions, addSession, updateSession, removeSession } = useSessions();
  const { 
    transactions, 
    addTransaction, 
    addTransactionsBatch, 
    removeTransaction 
  } = useTreasury();

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

  const handleAdminLogin = (password: string): boolean => {
    const savedPassword = localStorage.getItem('uph_admin_password') || 'admin';
    if (password === savedPassword) {
      const adminUser: AppUser = {
        id: 'admin-local',
        name: 'Administrador Local',
        role: 'admin'
      };
      localDB.setCurrentUser(adminUser);
      setUser(adminUser);
      setAppRole('admin');
      localStorage.setItem('uph_app_role', 'admin');
      return true;
    }
    return false;
  };

  const handleVoterLogin = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    const cleanPin = pin.trim();
    const result = await syncClient.authenticateVoter(cleanPin);

    if (result.success && result.voter) {
      const voterUser: AppUser = {
        id: result.voter.id,
        name: result.voter.name,
        role: 'voter'
      };
      localDB.setCurrentUser(voterUser);
      setUser(voterUser);
      setVoterMemberId(result.voter.id);
      setAppRole('voter');
      localStorage.setItem('uph_voter_member_id', result.voter.id);
      localStorage.setItem('uph_app_role', 'voter');
      return { success: true };
    }

    return { 
      success: false, 
      error: result.error || 'PIN inválido ou membro não encontrado.' 
    };
  };

  const handleLogout = () => {
    // Sanitização e purga 100% dos dados da sessão do eleitor
    localDB.setCurrentUser(null);
    setUser(null);
    setAppRole(null);
    setVoterMemberId(null);
    localStorage.removeItem('uph_auth_user');
    localStorage.removeItem('uph_app_role');
    localStorage.removeItem('uph_voter_member_id');
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

    try {
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
    } catch (err) {
      console.error('Erro ao salvar chamada:', err);
      const msg = err instanceof Error ? err.message : 'Verifique a conexão com o servidor.';
      alert(`Falha ao registrar chamada: ${msg}`);
    }
  }, [members, attendanceRecords, justifications, sessionType, plenaryCall, addSession]);

  const navItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'attendance', label: 'Chamada Ativa', icon: ClipboardCheck },
    { id: 'members', label: 'Rol de Membros', icon: Users },
    { id: 'reports', label: 'Relatórios Históricos', icon: FileText },
    { id: 'statistics', label: 'Estatísticas', icon: BarChart3 },
    { id: 'voting', label: 'Sistema de Votação', icon: Gavel },
    { id: 'treasury', label: 'Tesouraria', icon: DollarSign },
  ];

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0d1f14] border-t-4 border-[#c59b27]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-[#174627] bg-[#102919]">
              <ClipboardCheck className="w-8 h-8 text-[#c59b27]" />
            </div>
            <div className="absolute inset-0 border-2 border-[#c59b27] rounded-2xl border-t-transparent animate-spin" />
          </div>
          <div className="text-center">
            <h2 className="text-white font-display text-lg font-bold tracking-tight mb-1">UPH - Rol de Membros</h2>
            <p className="text-[#a4c9ad] font-mono text-[10px] uppercase tracking-widest animate-pulse">Conectando ao sistema...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !appRole) {
    return (
      <LoginScreen 
        onAdminLogin={handleAdminLogin}
        onVoterLogin={handleVoterLogin}
      />
    );
  }

  // Voter view selection
  if (appRole === 'voter') {
    if (!voterMemberId) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-[#f8faf9] space-y-4">
           <div className="w-10 h-10 border-3 border-[#0a3d1c] border-t-transparent rounded-full animate-spin" />
           <p className="text-[#0a3d1c] font-semibold text-sm">Validando credenciais do eleitor...</p>
           <button onClick={handleLogout} className="text-xs font-medium text-slate-500 hover:text-slate-800">Cancelar</button>
        </div>
      );
    }

    return (
      <div className="flex h-screen w-full bg-[#f1f5f3] font-sans text-slate-800 overflow-hidden">
        <div className="flex-1 flex flex-col items-center max-w-lg mx-auto bg-white shadow-lg border-x border-slate-200/80">
          <header className="w-full px-5 py-3.5 flex items-center justify-between border-b border-slate-200/80 bg-[#0a3d1c] text-white sticky top-0 z-10">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#134e27] border border-[#236b39] rounded-lg flex items-center justify-center text-[#c59b27]">
                <Gavel className="w-3.5 h-3.5" />
              </div>
              <h1 className="font-bold text-sm tracking-tight text-white">UPH • Cabine de Votação</h1>
            </div>
            <button 
              onClick={handleLogout}
              className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#134e27] text-slate-200 hover:text-white hover:bg-[#1a5f31] border border-[#236b39] transition-colors cursor-pointer"
            >
              Sair
            </button>
          </header>
          <main className="flex-1 w-full overflow-y-auto bg-[#f8faf9]">
            <Suspense fallback={
              <div className="p-8 text-center text-slate-400 text-sm">Carregando painel de votação...</div>
            }>
              <VotingStation societyId="uph-society-id" voterMemberId={voterMemberId} />
            </Suspense>
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

              <Suspense fallback={
                <div className="h-64 flex items-center justify-center text-slate-400">Carregando módulo...</div>
              }>
                {activeView === 'reports' && (
                  <ReportsView 
                    sessions={sessions} 
                    updateSession={updateSession}
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

                {activeView === 'treasury' && (
                  <TreasuryView 
                    transactions={transactions}
                    addTransaction={addTransaction}
                    addTransactionsBatch={addTransactionsBatch}
                    removeTransaction={removeTransaction}
                  />
                )}
              </Suspense>


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
