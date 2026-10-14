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
    <header className="h-20 bg-white border-b border-slate-200/90 px-6 md:px-10 flex items-center justify-between shrink-0 z-10 sticky top-0 shadow-xs">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
          {titles[activeView]}
        </h2>
        <div className="hidden md:flex items-center gap-2 mt-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#0a3d1c]" />
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
            className="px-4 md:px-5 py-2.5 bg-[#0a3d1c] hover:bg-[#072b14] text-white font-bold rounded-xl shadow-sm active:scale-95 transition-all text-xs md:text-sm disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-[#c59b27]" /> 
            <span className="hidden sm:inline">Finalizar Chamada</span>
            <span className="sm:hidden">Salvar</span>
          </button>
        )}
        <div className="md:hidden flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
           {navItems.filter(item => item.id !== 'statistics').map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-label={`Navegar para ${item.label}`}
              className={`min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl transition-all ${
                activeView === item.id 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
            </button>
          ))}
          <button
            onClick={onLogout}
            aria-label="Sair do sistema"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-all"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
