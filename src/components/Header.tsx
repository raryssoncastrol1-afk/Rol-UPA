import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, LucideIcon, LogOut } from 'lucide-react';

interface HeaderProps {
  activeView: string;
  onNavigate: (view: any) => void;
  navItems: { id: string; label: string; icon: LucideIcon }[];
  onSaveAttendance: () => void;
  canSaveAttendance: boolean;
  isAttendanceStarted: boolean;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeView, 
  onNavigate, 
  navItems, 
  onSaveAttendance, 
  canSaveAttendance,
  isAttendanceStarted,
  onLogout
}) => {
  const titles: Record<string, string> = {
    dashboard: 'Painel de Controle',
    attendance: 'Controle de Presença',
    members: 'Rol de Membros',
    reports: 'Relatórios e Histórico',
    statistics: 'Estatísticas de Frequência',
    voting: 'Sistema de Votação',
    treasury: 'Tesouraria e Finanças'
  };

  return (
    <header className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 md:px-10 flex items-center justify-between shadow-[0_4px_30px_rgba(0,0,0,0.02)] shrink-0 z-10 sticky top-0">
      <div>
        <h2 className="text-xl md:text-3xl font-display font-bold text-slate-800 tracking-tight">
          {titles[activeView]}
        </h2>
        <div className="hidden md:flex items-center gap-2 mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-xs text-slate-500 font-medium capitalize">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {activeView === 'attendance' && isAttendanceStarted && (
          <button 
            onClick={onSaveAttendance}
            disabled={!canSaveAttendance}
            className="px-4 md:px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-indigo-600/30 active:scale-95 transition-all duration-300 text-xs md:text-sm disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" /> 
            <span className="hidden sm:inline">Finalizar Chamada</span>
            <span className="sm:hidden">Salvar</span>
          </button>
        )}
        <div className="md:hidden flex bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
           {navItems.filter(item => item.id !== 'statistics').map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`p-2.5 rounded-xl transition-all ${activeView === item.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <item.icon className="w-5 h-5" />
            </button>
          ))}
          <button
            onClick={onLogout}
            className="p-2.5 rounded-xl text-rose-400 hover:bg-rose-50 transition-all"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
