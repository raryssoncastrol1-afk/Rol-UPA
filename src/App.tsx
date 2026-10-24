import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ClipboardCheck, 
  FileText, 
  LayoutDashboard,
  BarChart3,
  Gavel,
  DollarSign,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useMembers, useSessions, useTreasury } from './hooks/useData';
import { AttendanceStatus, AttendanceRecord, Member, SessionType, AppUser } from './types';
import { localDB } from './lib/offlineDB';
import { syncClient } from './lib/syncClient';

// Components
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { MembersView } from './components/MembersView';
import { AttendanceView } from './components/AttendanceView';
import { MemberHistoryModal } from './components/MemberHistoryModal';
import { LoginScreen } from './components/LoginScreen';
import { SettingsView } from './components/SettingsView';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy-loaded heavy components (bundle splitting)
const ReportsView = lazy(() => import('./components/ReportsView').then(m => ({ default: m.ReportsView })));
const StatisticsView = lazy(() => import('./components/StatisticsView').then(m => ({ default: m.StatisticsView })));
const VotingStation = lazy(() => import('./components/voting/VotingStation').then(m => ({ default: m.VotingStation })));
const TreasuryView = lazy(() => import('./components/TreasuryView').then(m => ({ default: m.TreasuryView })));

type View = 'dashboard' | 'members' | 'attendance' | 'reports' | 'statistics' | 'voting' | 'treasury' | 'settings';

export default function App() {
  const [user, setUser] = useState<AppUser | null>(() => localDB.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<View>('dashboard');
  
  // App Roles
  const [appRole, setAppRole] = useState<'admin' | 'voter' | null>(() => {
    return (localStorage.getItem('upa_app_role') as 'admin' | 'voter' | null) || (localDB.getCurrentUser()?.role ?? null);
  });
  const [voterMemberId, setVoterMemberId] = useState<string | null>(() => {
    return localStorage.getItem('upa_voter_member_id');
  });

  // Global Theme
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('upa_theme_mode');
    if (saved === 'dark' || saved === 'light') return saved;
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('upa_theme_mode', theme);
    const root = document.documentElement;
    root.classList.remove('neobrutalism');
    try { localStorage.removeItem('upa_ui_style'); } catch {}
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0B192C' : '#F6F4EF');
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Erro ao alternar modo tela cheia:', err);
    }
  }, []);

  const { members, addMember, removeMember, updateMember, importMembersBatch } = useMembers();
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
    const saved = localStorage.getItem('upa_attendanceRecords');
    return saved ? JSON.parse(saved) : {};
  });
  const [justifications, setJustifications] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('upa_justifications');
    return saved ? JSON.parse(saved) : {};
  });
  const [sessionType, setSessionType] = useState<SessionType>(() => {
    return (localStorage.getItem('upa_sessionType') as SessionType) || 'programacao';
  });
  const [plenaryCall, setPlenaryCall] = useState<1 | 2>(() => {
    return (Number(localStorage.getItem('upa_plenaryCall')) as 1 | 2) || 1;
  });
  const [isAttendanceStarted, setIsAttendanceStarted] = useState(() => {
    return localStorage.getItem('upa_isAttendanceStarted') === 'true';
  });

  // Persist state changes
  useEffect(() => {
    localStorage.setItem('upa_attendanceRecords', JSON.stringify(attendanceRecords));
    localStorage.setItem('upa_justifications', JSON.stringify(justifications));
    localStorage.setItem('upa_sessionType', sessionType);
    localStorage.setItem('upa_plenaryCall', String(plenaryCall));
    localStorage.setItem('upa_isAttendanceStarted', String(isAttendanceStarted));
    if (appRole) localStorage.setItem('upa_app_role', appRole);
    else localStorage.removeItem('upa_app_role');
    
    if (voterMemberId) localStorage.setItem('upa_voter_member_id', voterMemberId);
    else localStorage.removeItem('upa_voter_member_id');
  }, [attendanceRecords, justifications, sessionType, plenaryCall, isAttendanceStarted, appRole, voterMemberId]);

  const handleAdminLogin = (password: string): boolean => {
    const savedPassword = localStorage.getItem('upa_admin_password') || 'admin';
    if (password === savedPassword) {
      const adminUser: AppUser = {
        id: 'admin-local',
        name: 'Administrador Local',
        role: 'admin'
      };
      localDB.setCurrentUser(adminUser);
      setUser(adminUser);
      setAppRole('admin');
      localStorage.setItem('upa_app_role', 'admin');
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
      localStorage.setItem('upa_voter_member_id', result.voter.id);
      localStorage.setItem('upa_app_role', 'voter');
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
    localStorage.removeItem('upa_auth_user');
    localStorage.removeItem('upa_app_role');
    localStorage.removeItem('upa_voter_member_id');
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
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0B192C] border-t-4 border-[#2563EB]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-[#1E3A5F] bg-[#0F2A4A]">
              <ClipboardCheck className="w-8 h-8 text-[#38BDF8]" />
            </div>
            <div className="absolute inset-0 border-2 border-[#38BDF8] rounded-2xl border-t-transparent animate-spin" />
          </div>
          <div className="text-center">
            <h2 className="text-white font-display text-lg font-bold tracking-tight mb-1">UPA - Rol de Membros</h2>
            <p className="text-[#93C5FD] font-mono text-[10px] uppercase tracking-widest animate-pulse">Conectando ao sistema...</p>
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
        <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white space-y-4">
           <div className="w-10 h-10 border-3 border-sky-400 border-t-transparent rounded-full animate-spin" />
           <p className="text-sky-300 font-semibold text-sm">Validando credenciais do eleitor...</p>
           <button onClick={handleLogout} className="text-xs font-medium text-neutral-400 hover:text-white">Cancelar</button>
        </div>
      );
    }

    return (
      <div className="relative min-h-[100dvh] w-full flex flex-col bg-black text-white font-sans overflow-x-hidden selection:bg-white/20">
        {/* Ambient Fluid Glows (UPA Theme - mesmo da tela de login) */}
        <div className="fixed w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] -top-16 -left-16 bg-[radial-gradient(circle,rgba(29,66,104,0.3)_0%,rgba(22,50,79,0.15)_50%,transparent_75%)] rounded-full blur-[90px] pointer-events-none" />
        <div className="fixed w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] -bottom-16 -right-16 bg-[radial-gradient(circle,rgba(184,74,20,0.2)_0%,rgba(166,64,19,0.1)_50%,transparent_75%)] rounded-full blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex-1 flex flex-col w-full max-w-xl mx-auto min-h-[100dvh]">
          {/* Header Compacto Glassmorphism */}
          <header className="w-full px-4 py-3 flex items-center justify-between border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/20 flex items-center justify-center p-1 backdrop-blur-sm">
                <img 
                  src="/upa-logo.png" 
                  alt="UPA Logo" 
                  className="w-full h-full object-contain filter drop-shadow-sm"
                />
              </div>
              <div>
                <h1 
                  className="font-bold text-sm tracking-wide text-white leading-tight"
                  style={{ fontFamily: "'Jersey M54', sans-serif" }}
                >
                  UPA 3ª IPBV
                </h1>
                <p className="text-[10px] text-sky-400 uppercase tracking-wider font-semibold">
                  Cabine de Votação
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleFullscreen}
                title={isFullscreen ? "Sair da Tela Cheia" : "Ficar em Tela Cheia"}
                className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-xl bg-white/10 text-neutral-300 hover:text-white hover:bg-white/20 border border-white/15 transition-all cursor-pointer backdrop-blur-sm"
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="w-3.5 h-3.5 text-sky-400" />
                    <span className="hidden sm:inline">Restaurar</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
                    <span className="hidden sm:inline">Tela Cheia</span>
                  </>
                )}
              </button>
              <button 
                onClick={handleLogout}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 transition-all cursor-pointer backdrop-blur-sm"
              >
                Sair
              </button>
            </div>
          </header>

          <main className="flex-1 w-full overflow-y-auto">
            <Suspense fallback={
              <div className="p-8 text-center text-neutral-400 text-sm">Carregando urna de votação...</div>
            }>
              <VotingStation societyId="upa-society-id" voterMemberId={voterMemberId} />
            </Suspense>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#F6F4EF] dark:bg-[#030712] font-sans text-[#1B2E24] dark:text-[#EDEDE8] overflow-hidden transition-colors duration-200">
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
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="p-3 sm:p-5 md:p-10 w-full max-w-7xl mx-auto"
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
                  importMembersBatch={importMembersBatch}
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

              <ErrorBoundary fallbackTitle="Erro ao carregar módulo">
                {activeView === 'settings' && (
                  <SettingsView
                    members={members}
                    sessions={sessions}
                    transactions={transactions}
                    onRefreshAll={() => {
                      window.location.reload();
                    }}
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
              </ErrorBoundary>


            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden flex items-center justify-around bg-white dark:bg-[#0b1220] border-t border-[#E4DFD5] dark:border-[#1e293b] px-1 py-1.5 shrink-0 z-20 shadow-lg">
          {navItems.filter(item => item.id !== 'statistics').map(item => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as View)}
                aria-label={item.label}
                className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer ${
                  isActive 
                    ? 'text-[#1B2E24] dark:text-[#38bdf8] font-bold' 
                    : 'text-[#5C665F] dark:text-[#8A968F]'
                }`}
              >
                <item.icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-[#1B2E24] dark:text-[#38bdf8]' : ''}`} />
                <span className="text-[10px] tracking-tight truncate max-w-[54px]">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </nav>
      </main>

      <MemberHistoryModal 
        member={selectedMemberForHistory} 
        onClose={() => setSelectedMemberForHistory(null)} 
        sessions={sessions} 
      />
    </div>
  );
}
