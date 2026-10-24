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
    treasury: 'Tesouraria e Finanças',
    settings: 'Configurações do Sistema'
  };

  return (
    <header className="h-20 bg-white dark:bg-[#0b1220] border-b border-[#E4DFD5] dark:border-[#1e293b] px-4 sm:px-6 md:px-10 flex items-center justify-between shrink-0 z-10 sticky top-0 transition-colors duration-200 shadow-2xs">
      <div className="min-w-0 pr-2">
        <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-[#1B2E24] dark:text-[#EDEDE8] tracking-tight truncate">
          {titles[activeView]}
        </h2>
        <div className="hidden md:flex items-center gap-2 mt-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#1B2E24] dark:bg-[#38bdf8]" />
          <p className="text-xs text-[#5C665F] dark:text-[#8A968F] font-medium capitalize">
            {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Toggle Claro/Escuro */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleTheme();
          }}
          type="button"
          aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
          title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
          className="min-w-[42px] min-h-[42px] p-2.5 rounded-xl border border-[#E4DFD5] dark:border-[#1e293b] bg-white dark:bg-[#030712] text-[#5C665F] dark:text-[#8A968F] hover:text-[#1B2E24] dark:hover:text-[#EDEDE8] hover:border-[#1B2E24]/30 dark:hover:border-[#38bdf8]/40 active:scale-95 transition-all cursor-pointer flex items-center justify-center shadow-2xs relative z-20"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#38bdf8]" />
          ) : (
            <Moon className="w-4 h-4 text-[#C2A267]" />
          )}
        </button>

        {activeView === 'attendance' && isAttendanceStarted && (
          <button 
            onClick={onSaveAttendance}
            disabled={!canSaveAttendance}
            className="px-4 md:px-5 py-2.5 bg-[#1B2E24] dark:bg-[#38bdf8] hover:bg-[#080e1a] dark:hover:bg-[#0284c7] text-[#FAF8F5] dark:text-[#030712] font-bold rounded-xl shadow-xs active:scale-95 transition-all text-xs md:text-sm disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-[#C2A267] dark:text-[#030712]" /> 
            <span className="hidden sm:inline">Finalizar Chamada</span>
            <span className="sm:hidden">Salvar</span>
          </button>
        )}
        {/* Botão Sair no Mobile */}
        <button
          onClick={onLogout}
          type="button"
          aria-label="Sair do sistema"
          title="Sair do sistema"
          className="md:hidden min-w-[42px] min-h-[42px] p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition-all cursor-pointer flex items-center justify-center shadow-2xs"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

