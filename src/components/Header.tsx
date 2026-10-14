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
    <header className="h-20 bg-white dark:bg-[#18221D] border-b border-[#E4DFD5] dark:border-[#2A3A31] px-6 md:px-10 flex items-center justify-between shrink-0 z-10 sticky top-0 transition-colors duration-200 shadow-2xs">
      <div>
        <h2 className="text-xl md:text-2xl font-serif font-bold text-[#1B2E24] dark:text-[#EDEDE8] tracking-tight">
          {titles[activeView]}
        </h2>
        <div className="hidden md:flex items-center gap-2 mt-0.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#1B2E24] dark:bg-[#C8A96E]" />
          <p className="text-xs text-[#5C665F] dark:text-[#8A968F] font-medium capitalize">
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
          className="p-2.5 rounded-xl border border-[#E4DFD5] dark:border-[#2A3A31] bg-white/80 dark:bg-[#111614] text-[#5C665F] dark:text-[#8A968F] hover:text-[#1B2E24] dark:hover:text-[#EDEDE8] hover:border-[#1B2E24]/30 dark:hover:border-[#C8A96E]/40 transition-all cursor-pointer flex items-center justify-center shadow-2xs"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-[#C8A96E]" />
          ) : (
            <Moon className="w-4 h-4 text-[#C2A267]" />
          )}
        </button>

        {activeView === 'attendance' && isAttendanceStarted && (
          <button 
            onClick={onSaveAttendance}
            disabled={!canSaveAttendance}
            className="px-4 md:px-5 py-2.5 bg-[#1B2E24] dark:bg-[#C8A96E] hover:bg-[#14231B] dark:hover:bg-[#b99859] text-[#FAF8F5] dark:text-[#111614] font-bold rounded-xl shadow-xs active:scale-95 transition-all text-xs md:text-sm disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-[#C2A267] dark:text-[#111614]" /> 
            <span className="hidden sm:inline">Finalizar Chamada</span>
            <span className="sm:hidden">Salvar</span>
          </button>
        )}
        <div className="md:hidden flex items-center bg-[#F6F4EF] dark:bg-[#111614] p-1 rounded-xl border border-[#E4DFD5] dark:border-[#2A3A31]">
           {navItems.filter(item => item.id !== 'statistics').map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              aria-label={`Navegar para ${item.label}`}
              className={`min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl transition-all ${
                activeView === item.id 
                ? 'bg-white dark:bg-[#18221D] text-[#1B2E24] dark:text-[#C8A96E] shadow-2xs' 
                : 'text-[#5C665F] dark:text-[#8A968F] hover:text-[#1B2E24] dark:hover:text-[#EDEDE8]'
              }`}
            >
              <item.icon className="w-5 h-5" />
            </button>
          ))}
          <button
            onClick={onLogout}
            aria-label="Sair do sistema"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

