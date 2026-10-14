import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, LucideIcon, LogOut, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  activeView: string;
  onNavigate: (view: any) => void;
  navItems: { id: string; label: string; icon: LucideIcon }[];
  onSaveAttendance: () => void;
  canSaveAttendance: boolean;
  isAttendanceStarted: boolean;
  onLogout: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  activeView, 
  onNavigate, 
  navItems, 
  onSaveAttendance, 
  canSaveAttendance,
  isAttendanceStarted,
  onLogout,
  theme,
  onToggleTheme
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
    <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-6 md:px-10 flex items-center justify-between shrink-0 z-10 sticky top-0 transition-colors duration-200">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {titles[activeView]}
        </h2>
        <div className="hidden md:flex items-center gap-2 mt-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#0a3d1c] dark:bg-[#22c55e]" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium capitalize">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {/* Toggle Claro/Escuro */}
        <button
          onClick={onToggleTheme}
          type="button"
          aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-750 transition-all cursor-pointer flex items-center justify-center shadow-xs"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#c59b27]" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {activeView === 'attendance' && isAttendanceStarted && (
          <button 
            onClick={onSaveAttendance}
            disabled={!canSaveAttendance}
            className="px-4 md:px-5 py-2.5 bg-[#0a3d1c] hover:bg-[#072b14] text-white font-bold rounded-xl shadow-xs active:scale-95 transition-all text-xs md:text-sm disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-[#c59b27]" /> 
            <span className="hidden sm:inline">Finalizar Chamada</span>
            <span className="sm:hidden">Salvar</span>
          </button>
        )}
        <div className="md:hidden flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
           {navItems.filter(item => item.id !== 'statistics').map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-label={`Navegar para ${item.label}`}
              className={`min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl transition-all ${
                activeView === item.id 
                ? 'bg-white dark:bg-slate-700 text-[#0a3d1c] dark:text-[#86a892] shadow-xs' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <item.icon className="w-5 h-5" />
            </button>
          ))}
          <button
            onClick={onLogout}
            aria-label="Sair do sistema"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

