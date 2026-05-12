import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ClipboardCheck, 
  FileText, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Download,
  Gavel,
  LayoutDashboard,
  UserPlus,
  Settings,
  ChevronRight,
  LogIn,
  LogOut
} from 'lucide-react';
import { useMembers, useSessions } from './hooks/useData';
import { AttendanceStatus, AttendanceRecord, Member, SessionType } from './types';
import { generateReport } from './lib/report';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';

type View = 'dashboard' | 'members' | 'attendance' | 'reports';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<View>('dashboard');
  const { members, addMember, removeMember } = useMembers();
  const { sessions, addSession, removeSession } = useSessions();

  // State for member history modal
  const [selectedMemberForHistory, setSelectedMemberForHistory] = useState<Member | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Erro ao fazer login:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  // State for new member form
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberCargo, setNewMemberCargo] = useState('');

  // State for current attendance
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, AttendanceStatus>>({});
  const [justifications, setJustifications] = useState<Record<string, string>>({});
  const [sessionType, setSessionType] = useState<SessionType>('programacao');
  const [plenaryCall, setPlenaryCall] = useState<1 | 2>(1);

  const presentCount = Object.values(attendanceRecords).filter(s => s === 'presente').length;
  const presencePercentage = members.length > 0 ? (presentCount / members.length) * 100 : 0;
  
  const metQuorum1st = presencePercentage >= 51;
  const metQuorum2nd = presencePercentage >= 33.33;

  const handleSaveAttendance = async () => {
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

    // Reset current attendance and move to reports
    setAttendanceRecords({});
    setJustifications({});
    setActiveView('reports');
  };

  const navItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'attendance', label: 'Chamada Ativa', icon: ClipboardCheck },
    { id: 'members', label: 'Rol de Membros', icon: Users },
    { id: 'reports', label: 'Relatórios Históricos', icon: FileText },
  ];

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 border-indigo-500 border-t-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-indigo-300 font-black text-xs uppercase tracking-widest animate-pulse">Carregando Sistema...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900 p-6">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 md:p-14 text-center">
          <div className="w-20 h-20 bg-indigo-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/40 mx-auto mb-8">
            <ClipboardCheck className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">UPH Rol</h1>
          <p className="text-slate-500 mb-10 font-medium text-sm leading-relaxed px-4">
            Gestão inteligente de membros e frequência para igrejas e grupos.
          </p>
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-slate-100 py-4 px-8 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Entrar com Google
          </button>
          <div className="mt-12 flex items-center justify-center gap-4">
             <div className="h-px bg-slate-100 flex-1" />
             <span className="text-[10px] font-black uppercase text-slate-300 tracking-[0.2em] whitespace-nowrap">Acesso Restrito</span>
             <div className="h-px bg-slate-100 flex-1" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 flex flex-col shadow-2xl z-20 hidden md:flex">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <ClipboardCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-white font-bold text-xl tracking-tight italic">UPH Rol</h1>
          </div>
          
          <nav className="space-y-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as View)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all cursor-pointer ${
                  activeView === item.id 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto p-8 border-t border-slate-800">
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 mb-4">
            <p className="text-[10px] text-slate-500 uppercase font-black mb-1 tracking-widest">Operador</p>
            <p className="text-sm text-slate-300 font-medium truncate">{user?.displayName || 'Usuário'}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer text-sm font-bold"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-6 md:px-10 flex items-center justify-between shadow-sm shrink-0 z-10">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              {activeView === 'dashboard' && 'Painel de Controle'}
              {activeView === 'attendance' && 'Controle de Presença'}
              {activeView === 'members' && 'Rol de Membros'}
              {activeView === 'reports' && 'Relatórios e Histórico'}
            </h2>
            <p className="hidden md:block text-xs md:text-sm text-slate-500 font-medium capitalize">
              {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <div className="flex gap-4">
            {activeView === 'attendance' && (
              <button 
                onClick={handleSaveAttendance}
                disabled={members.length === 0}
                className="px-4 md:px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all text-xs md:text-sm disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> 
                <span className="hidden sm:inline">Finalizar Chamada</span>
                <span className="sm:hidden">Salvar</span>
              </button>
            )}
            <div className="md:hidden flex gap-2">
               {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id as View)}
                  className={`p-2 rounded-lg transition-all ${activeView === item.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400'}`}
                >
                  <item.icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Content Section */}
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
              {/* Dashboard */}
              {activeView === 'dashboard' && (
                <div className="space-y-8">
                  {/* Statistics */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 text-center md:text-left">
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm transition-transform hover:-translate-y-1">
                      <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest leading-none">Total de Membros</p>
                      <p className="text-2xl md:text-3xl font-black text-slate-900 mt-2">{members.length}</p>
                    </div>
                    <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 shadow-sm transition-transform hover:-translate-y-1">
                      <p className="text-[10px] md:text-xs font-bold text-emerald-600 uppercase tracking-widest leading-none">Média Presença</p>
                      <p className="text-2xl md:text-3xl font-black text-emerald-700 mt-2">
                        {sessions.length > 0 
                          ? Math.round((sessions.reduce((acc, s) => acc + s.records.filter(r => r.status === 'presente').length, 0) / (sessions.length * members.length || 1)) * 100)
                          : 0}%
                      </p>
                    </div>
                    <div className="bg-rose-50 p-5 rounded-3xl border border-rose-100 shadow-sm transition-transform hover:-translate-y-1">
                      <p className="text-[10px] md:text-xs font-bold text-rose-600 uppercase tracking-widest leading-none">Ult. Ausentes</p>
                      <p className="text-2xl md:text-3xl font-black text-rose-700 mt-2">
                        {sessions.length > 0 ? sessions[sessions.length-1].records.filter(r => r.status === 'ausente').length : 0}
                      </p>
                    </div>
                    <div className="bg-amber-50 p-5 rounded-3xl border border-amber-100 shadow-sm transition-transform hover:-translate-y-1">
                      <p className="text-[10px] md:text-xs font-bold text-amber-600 uppercase tracking-widest leading-none">Chamadas Feitas</p>
                      <p className="text-2xl md:text-3xl font-black text-amber-700 mt-2">{sessions.length}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2 px-1">
                        <Plus className="w-4 h-4 text-indigo-500" /> Ações Rápidas
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button 
                          onClick={() => setActiveView('attendance')}
                          className="flex flex-col p-6 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md hover:border-indigo-100 group transition-all text-left cursor-pointer"
                        >
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <ClipboardCheck className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-slate-800">Nova Chamada</span>
                          <span className="text-xs text-slate-500 mt-1">Iniciar registro de frequência hoje</span>
                        </button>
                        <button 
                          onClick={() => setActiveView('members')}
                          className="flex flex-col p-6 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md hover:border-emerald-100 group transition-all text-left cursor-pointer"
                        >
                          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            <UserPlus className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-slate-800">Cadastrar Membro</span>
                          <span className="text-xs text-slate-500 mt-1">Adicionar novos participantes ao rol</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-bold text-slate-900 flex items-center gap-2 px-1">
                        <FileText className="w-4 h-4 text-indigo-500" /> Última Chamada
                      </h3>
                      {sessions.length > 0 ? (
                        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                             <ClipboardCheck className="w-12 h-12 text-indigo-600" />
                           </div>
                          <p className="text-sm font-bold text-slate-800">
                            {format(sessions[sessions.length-1].date, "dd/MM/yyyy")}
                          </p>
                          <p className="text-xs text-slate-400 mt-1 italic">
                            {sessions[sessions.length-1].records.length} membros participaram
                          </p>
                          <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                              {sessions[sessions.length-1].records.filter(r => r.status === 'presente').length} presentes
                            </span>
                            <button 
                              onClick={() => generateReport(sessions[sessions.length-1])}
                              className="text-indigo-600 hover:text-indigo-800 text-xs font-black uppercase flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              Relatório <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-slate-50 p-8 rounded-3xl border border-dashed border-slate-200 text-center text-slate-400 text-sm italic">
                          Nenhuma chamada realizada ainda.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Members View */}
              {activeView === 'members' && (
                <div className="space-y-8">
                  <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                        <UserPlus className="w-4 h-4" />
                      </div>
                      <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Adicionar Novo Integrante</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Nome Completo</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Adriana Santos Silva"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
                          value={newMemberName}
                          onChange={(e) => setNewMemberName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Cargo / Função</label>
                        <input 
                          type="text" 
                          placeholder="Ex: Professor"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
                          value={newMemberCargo}
                          onChange={(e) => setNewMemberCargo(e.target.value)}
                        />
                      </div>
                      <div className="flex items-end">
                        <button 
                          onClick={() => {
                            if (newMemberName.trim()) {
                              addMember(newMemberName, newMemberCargo);
                              setNewMemberName('');
                              setNewMemberCargo('');
                            }
                          }}
                          className="w-full bg-indigo-600 text-white h-[48px] rounded-2xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> Cadastrar
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col">
                    <div className="bg-slate-50/50 border-b border-slate-100 grid grid-cols-12 px-6 md:px-8 py-4 text-[11px] font-black uppercase text-slate-400 tracking-tighter">
                      <div className="col-span-8 md:col-span-5">Nome do Membro</div>
                      <div className="hidden md:block col-span-3">Cargo</div>
                      <div className="hidden md:block col-span-2">Data Cadastro</div>
                      <div className="col-span-4 md:col-span-2 text-right">Ação</div>
                    </div>
                    
                    <div className="divide-y divide-slate-50">
                      {members.length === 0 ? (
                        <div className="p-16 text-center text-slate-400 font-medium italic">
                          Nenhum membro cadastrado até o momento.
                        </div>
                      ) : (
                        members.map((member, idx) => (
                          <div 
                            key={member.id} 
                            onClick={() => setSelectedMemberForHistory(member)}
                            className={`grid grid-cols-12 px-6 md:px-8 py-4 items-center transition-colors hover:bg-slate-100 cursor-pointer group/row ${idx % 2 === 1 ? 'bg-slate-50/20' : ''}`}
                          >
                            <div className="col-span-8 md:col-span-5 flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-[10px] shadow-sm group-hover/row:scale-110 transition-transform ${
                                idx % 4 === 0 ? 'bg-indigo-100 text-indigo-700' :
                                idx % 4 === 1 ? 'bg-orange-100 text-orange-700' :
                                idx % 4 === 2 ? 'bg-emerald-100 text-emerald-700' :
                                'bg-sky-100 text-sky-700'
                              }`}>
                                {member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-700 text-sm md:text-base leading-tight group-hover/row:text-indigo-600 transition-colors">{member.name}</span>
                                <span className="md:hidden text-[10px] text-slate-400 font-medium">{member.cargo || 'Membro'}</span>
                              </div>
                            </div>
                            <div className="hidden md:block col-span-3 text-sm text-slate-500 font-medium">{member.cargo || 'Membro'}</div>
                            <div className="hidden md:block col-span-2 text-xs text-slate-400">{format(member.createdAt, 'dd/MM/yyyy')}</div>
                            <div className="col-span-4 md:col-span-2 flex justify-end">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeMember(member.id);
                                }}
                                className="p-2 text-slate-200 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                              >
                                <Trash2 className="w-5 h-5 shrink-0" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="p-4 px-6 md:p-6 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 bg-slate-50/30 uppercase tracking-[0.1em]">
                      <span>Exibindo {members.length} membros registrados</span>
                      <Users className="w-4 h-4 opacity-30" />
                    </div>
                  </div>
                </div>
              )}

              {/* Attendance View */}
              {activeView === 'attendance' && (
                <div className="space-y-8">
                  {/* Status Bar */}
                  <div className="flex flex-col md:flex-row gap-6 mb-8">
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-white p-4 rounded-3xl border border-slate-200 text-center md:text-left">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Quórum Atual</p>
                        <p className="text-xl font-black text-slate-900 leading-none">{Math.round(presencePercentage)}%</p>
                      </div>
                      <div className="bg-white p-4 rounded-3xl border border-slate-200 text-center md:text-left">
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Presentes</p>
                        <p className="text-xl font-black text-emerald-600 leading-none">
                          {presentCount}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-3xl border border-slate-200 text-center md:text-left">
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Total Sócios</p>
                        <p className="text-xl font-black text-rose-600 leading-none">
                          {members.length}
                        </p>
                      </div>
                      <div className="bg-white p-4 rounded-3xl border border-slate-200 text-center md:text-left">
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Status Quórum</p>
                        <p className={`text-[10px] font-black uppercase mt-1 ${sessionType === 'plenaria' ? (metQuorum1st ? 'text-emerald-500' : metQuorum2nd ? 'text-amber-500' : 'text-rose-500') : 'text-slate-400'}`}>
                          {sessionType === 'plenaria' 
                            ? (metQuorum1st ? '1ª Chamada OK' : metQuorum2nd ? '2ª Chamada OK' : 'Sem Quórum')
                            : 'Livre'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-900 p-2 rounded-[2rem] flex gap-2 self-center shadow-xl">
                      <button 
                        onClick={() => setSessionType('programacao')}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                          sessionType === 'programacao' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Programação
                      </button>
                      <button 
                        onClick={() => setSessionType('plenaria')}
                        className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                          sessionType === 'plenaria' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Plenária
                      </button>
                    </div>
                  </div>

                  {sessionType === 'plenaria' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-indigo-50 border-2 border-indigo-100 p-6 rounded-[2.5rem] mb-8 flex flex-col md:flex-row items-center justify-between gap-6"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                          <Gavel className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">Regra de Quórum UPH</h4>
                          <p className="text-xs text-indigo-500 font-medium">1ª Chamada: 51% • 2ª Chamada: 1/3 (33.3%)</p>
                        </div>
                      </div>

                      <div className="flex gap-2 bg-white/50 p-1.5 rounded-2xl border border-indigo-100">
                        <button 
                          onClick={() => setPlenaryCall(1)}
                          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex flex-col items-center ${
                            plenaryCall === 1 ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-400 hover:bg-white'
                          }`}
                        >
                          1ª Chamada
                          <span className={`text-[8px] opacity-70 ${metQuorum1st ? '' : 'text-rose-200 font-bold'}`}>
                            {metQuorum1st ? 'Liberada' : 'Abaixo 51%'}
                          </span>
                        </button>
                        <button 
                          onClick={() => setPlenaryCall(2)}
                          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex flex-col items-center ${
                            plenaryCall === 2 ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-400 hover:bg-white'
                          }`}
                        >
                          2ª Chamada
                          <span className={`text-[8px] opacity-70 ${metQuorum2nd ? '' : 'text-rose-200 font-bold'}`}>
                            {metQuorum2nd ? 'Liberada' : 'Abaixo 33%'}
                          </span>
                        </button>
                      </div>

                      <div className="hidden lg:block text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resultado</p>
                        <p className={`text-sm font-black ${
                          plenaryCall === 1 
                            ? (metQuorum1st ? 'text-emerald-500' : 'text-rose-500')
                            : (metQuorum2nd ? 'text-emerald-500' : 'text-rose-500')
                        }`}>
                          {plenaryCall === 1 
                            ? (metQuorum1st ? 'QUÓRUM ATINGIDO' : 'AGUARDAR QUÓRUM')
                            : (metQuorum2nd ? 'QUÓRUM ATINGIDO' : 'AGUARDAR QUÓRUM')}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col">
                    <div className="bg-slate-50/50 border-b border-slate-100 grid grid-cols-12 px-6 md:px-8 py-4 text-[11px] font-black uppercase text-slate-400 tracking-tighter">
                      <div className="col-span-5 md:col-span-5">Membro</div>
                      <div className="col-span-2 hidden md:block">Status Atual</div>
                      <div className="col-span-7 md:col-span-5 text-right">Registrar</div>
                    </div>
                    
                    <div className="divide-y divide-slate-50">
                      {members.length === 0 ? (
                        <div className="p-16 text-center text-slate-400 italic">
                          Nenhum membro para realizar a chamada.
                        </div>
                      ) : (
                        members.map((member, idx) => (
                          <div key={member.id} className={`grid grid-cols-12 px-6 md:px-8 py-4 items-center ${idx % 2 === 1 ? 'bg-slate-50/10' : ''}`}>
                            <div className="col-span-5 md:col-span-5 flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px] shrink-0">
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex flex-col overflow-hidden">
                                <span className="font-bold text-slate-700 text-sm leading-tight truncate">{member.name}</span>
                                {justifications[member.id] && (
                                  <span className="text-[9px] text-indigo-500 font-bold mt-0.5 truncate">Obs: {justifications[member.id]}</span>
                                )}
                              </div>
                            </div>
                            <div className="col-span-2 hidden md:block">
                              {!attendanceRecords[member.id] ? (
                                <span className="text-[10px] text-slate-300 italic font-medium">Pendente</span>
                              ) : (
                                <span className={`text-[9px] font-black uppercase tracking-widest ${
                                  attendanceRecords[member.id] === 'presente' ? 'text-emerald-500' :
                                  attendanceRecords[member.id] === 'ausente' ? 'text-rose-500' : 'text-amber-500'
                                }`}>
                                  {attendanceRecords[member.id].replace('_', ' ')}
                                </span>
                              )}
                            </div>
                            <div className="col-span-7 md:col-span-5 flex justify-end gap-1 md:gap-2">
                              <button 
                                onClick={() => setAttendanceRecords(prev => ({ ...prev, [member.id]: 'presente' }))}
                                className={`px-2 md:px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap cursor-pointer ${
                                  attendanceRecords[member.id] === 'presente' 
                                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 scale-105' 
                                  : 'bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                                }`}
                              >
                                <span className="hidden sm:inline">Presente</span>
                                <span className="sm:hidden">P</span>
                              </button>
                              <button 
                                onClick={() => setAttendanceRecords(prev => ({ ...prev, [member.id]: 'ausente' }))}
                                className={`px-2 md:px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap cursor-pointer ${
                                  attendanceRecords[member.id] === 'ausente' 
                                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-600/20 scale-105' 
                                  : 'bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600'
                                }`}
                              >
                                <span className="hidden sm:inline">Ausente</span>
                                <span className="sm:hidden">A</span>
                              </button>
                              <button 
                                onClick={() => {
                                  setAttendanceRecords(prev => ({ ...prev, [member.id]: 'falta_justificada' }));
                                  const text = prompt('Justificativa para ' + member.name);
                                  if (text) setJustifications(prev => ({ ...prev, [member.id]: text }));
                                }}
                                className={`px-2 md:px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap cursor-pointer ${
                                  attendanceRecords[member.id] === 'falta_justificada' 
                                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-600/20 scale-105' 
                                  : 'bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-600'
                                }`}
                              >
                                <span className="hidden sm:inline">Justificar</span>
                                <span className="sm:hidden">J</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Reports View */}
              {activeView === 'reports' && (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest leading-none">Últimos Lançamentos</h3>
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{sessions.length} Históricos</div>
                  </div>

                  {sessions.length === 0 ? (
                    <div className="bg-white border border-slate-200 border-dashed p-20 rounded-3xl text-center">
                      <FileText className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                      <p className="text-slate-400 font-medium italic">Nenhum histórico registrado no momento.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...sessions].reverse().map(session => (
                        <div key={session.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group relative">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <p className="text-2xl font-black text-slate-900 leading-none">
                                {format(session.date, "dd/MM", { locale: ptBR })}
                              </p>
                              <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">
                                {session.type === 'plenaria' ? `🏛️ Plenária (${session.callNumber || 1}ª Chamada)` : '📅 Programação'} • {format(session.date, "yyyy • HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                            <button 
                              onClick={() => removeSession(session.id)}
                              className="text-slate-200 hover:text-rose-500 p-1.5 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3 mb-8 bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                            <div className="text-center">
                              <p className="text-xl font-black text-emerald-500 leading-none">
                                {session.records.filter(r => r.status === 'presente').length}
                              </p>
                              <p className="text-[9px] text-slate-400 font-black uppercase mt-1 tracking-tighter">Pres</p>
                            </div>
                            <div className="text-center border-x border-slate-100">
                              <p className="text-xl font-black text-rose-500 leading-none">
                                {session.records.filter(r => r.status === 'ausente').length}
                              </p>
                              <p className="text-[9px] text-slate-400 font-black uppercase mt-1 tracking-tighter">Aus</p>
                            </div>
                            <div className="text-center">
                              <p className="text-xl font-black text-amber-500 leading-none">
                                {session.records.filter(r => r.status === 'falta_justificada').length}
                              </p>
                              <p className="text-[9px] text-slate-400 font-black uppercase mt-1 tracking-tighter">Just</p>
                            </div>
                          </div>

                          <button 
                            onClick={() => generateReport(session)}
                            className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all group-hover:shadow-lg group-hover:shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Download className="w-3 h-3" /> Baixar PDF
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Member Dashboard Modal */}
      <AnimatePresence>
        {selectedMemberForHistory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMemberForHistory(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Dashboard Header */}
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xl shadow-indigo-200">
                    {selectedMemberForHistory.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 leading-tight">{selectedMemberForHistory.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 bg-slate-200 rounded text-[9px] font-black uppercase text-slate-500 tracking-widest">{selectedMemberForHistory.cargo || 'Membro'}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Desde {format(selectedMemberForHistory.createdAt, 'MM/yyyy')}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedMemberForHistory(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                >
                  <XCircle className="w-6 h-6 border-slate-400" />
                </button>
              </div>

              {/* Statistics Overview */}
              <div className="grid grid-cols-3 gap-1 p-8 bg-white border-b border-slate-50">
                <div className="text-center p-4 rounded-3xl bg-emerald-50 border border-emerald-100">
                  <p className="text-2xl font-black text-emerald-600 leading-none">
                    {sessions.filter(s => s.records.find(r => r.memberId === selectedMemberForHistory.id)?.status === 'presente').length}
                  </p>
                  <p className="text-[9px] text-emerald-500 font-black uppercase mt-1.5 tracking-widest">Presenças</p>
                </div>
                <div className="text-center p-4 rounded-3xl bg-amber-50 border border-amber-100">
                  <p className="text-2xl font-black text-amber-600 leading-none">
                    {sessions.filter(s => s.records.find(r => r.memberId === selectedMemberForHistory.id)?.status === 'falta_justificada').length}
                  </p>
                  <p className="text-[9px] text-amber-500 font-black uppercase mt-1.5 tracking-widest">Justificadas</p>
                </div>
                <div className="text-center p-4 rounded-3xl bg-rose-50 border border-rose-100">
                  <p className="text-2xl font-black text-rose-600 leading-none">
                    {sessions.filter(s => s.records.find(r => r.memberId === selectedMemberForHistory.id)?.status === 'ausente').length}
                  </p>
                  <p className="text-[9px] text-rose-500 font-black uppercase mt-1.5 tracking-widest">Faltas</p>
                </div>
              </div>

              {/* History List */}
              <div className="flex-1 overflow-y-auto p-8 pt-4 space-y-4">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Linha do Tempo</p>
                {sessions.length === 0 ? (
                  <div className="text-center py-10">
                    <AlertCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 italic">Nenhum registro de reunião disponível.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[...sessions].reverse().map(session => {
                      const record = session.records.find(r => r.memberId === selectedMemberForHistory.id);
                      if (!record) return null;

                      return (
                        <div key={session.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-md transition-all group">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 text-sm">
                              {format(session.date, "dd 'de' MMMM", { locale: ptBR })}
                            </span>
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                              {session.type === 'plenaria' ? `🏛️ Plenária (${session.callNumber || 1}ª Chamada)` : '📅 Programação'} • {format(session.date, "yyyy")}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {record.justification && (
                              <div className="hidden sm:block text-right max-w-[150px]">
                                <p className="text-[10px] text-indigo-500 font-medium italic truncate">"{record.justification}"</p>
                              </div>
                            )}
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              record.status === 'presente' ? 'bg-emerald-100 text-emerald-700' :
                              record.status === 'ausente' ? 'bg-rose-100 text-rose-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {record.status === 'falta_justificada' ? 'Justificada' : record.status}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dashboard Footer Stats */}
              <div className="p-8 py-6 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Presença Real</p>
                    <p className="text-xl font-black text-white leading-none">
                      {sessions.length > 0 ? Math.round((sessions.filter(s => s.records.find(r => r.memberId === selectedMemberForHistory.id)?.status === 'presente').length / sessions.length) * 100) : 0}%
                    </p>
                  </div>
                  <div className="w-px h-8 bg-slate-800" />
                  <div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Frequência (Inc. Justif.)</p>
                    <p className="text-xl font-black text-indigo-400 leading-none">
                      {sessions.length > 0 ? Math.round((sessions.filter(s => {
                        const r = s.records.find(rec => rec.memberId === selectedMemberForHistory.id);
                        return r?.status === 'presente' || r?.status === 'falta_justificada';
                      }).length / sessions.length) * 100) : 0}%
                    </p>
                  </div>
                </div>
                
                <div className="hidden sm:block text-right">
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total de Chamadas</p>
                  <p className="text-white font-bold">{sessions.length}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
