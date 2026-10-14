import React from 'react';
import { motion } from 'motion/react';
import { Plus, UserPlus, ClipboardCheck, FileText, ChevronRight, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { Member, AttendanceSession } from '../types';
import { generateReport } from '../lib/report';

interface DashboardProps {
  members: Member[];
  sessions: AttendanceSession[];
  stats: {
    totalMembros: number;
    mediaPresenca: number;
    lastAbsentCount: number;
    totalSessions: number;
  };
  onNavigate: (view: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ members, sessions, stats, onNavigate }) => {
  return (
    <div className="space-y-8">
      {/* Statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 text-left">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs transition-colors">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Rol Ativo</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl md:text-4xl font-mono font-bold text-slate-900 dark:text-slate-100 tracking-tight">{stats.totalMembros}</p>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">irmãos</span>
          </div>
        </div>
        <div className="bg-[#0a3d1c] p-5 rounded-2xl shadow-xs text-white border border-[#134e27]">
          <p className="text-xs font-semibold text-[#86a892] mb-2">Média de Presença</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl md:text-4xl font-mono font-bold text-white tracking-tight">{stats.mediaPresenca}</p>
            <span className="text-xl font-bold text-[#c59b27]">%</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs transition-colors">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Últimos Ausentes</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl md:text-4xl font-mono font-bold text-rose-650 dark:text-rose-400 tracking-tight">{stats.lastAbsentCount}</p>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">faltas</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs transition-colors">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Chamadas Plenárias</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl md:text-4xl font-mono font-bold text-slate-900 dark:text-slate-100 tracking-tight">{stats.totalSessions}</p>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">atas</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3.5">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm px-0.5">
            <Plus className="w-4 h-4 text-[#0a3d1c] dark:text-[#86a892]" /> Ações Rápidas da Diretoria
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <button 
              onClick={() => onNavigate('attendance')}
              className="flex flex-col p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl hover:border-[#0a3d1c] dark:hover:border-[#236b39] hover:bg-[#f6faf7] dark:hover:bg-slate-850 transition-all text-left cursor-pointer shadow-xs group"
            >
              <div className="w-9 h-9 bg-[#f0fdf4] dark:bg-[#072b14] text-[#0a3d1c] dark:text-[#86a892] border border-[#bbf7d0] dark:border-[#1e4e2e] rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#0a3d1c] group-hover:text-white transition-colors">
                <ClipboardCheck className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">Realizar Chamada</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Iniciar lista de presença</span>
            </button>
            <button 
              onClick={() => onNavigate('members')}
              className="flex flex-col p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl hover:border-[#0a3d1c] dark:hover:border-[#236b39] hover:bg-[#f6faf7] dark:hover:bg-slate-850 transition-all text-left cursor-pointer shadow-xs group"
            >
              <div className="w-9 h-9 bg-[#f0fdf4] dark:bg-[#072b14] text-[#0a3d1c] dark:text-[#86a892] border border-[#bbf7d0] dark:border-[#1e4e2e] rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#0a3d1c] group-hover:text-white transition-colors">
                <UserPlus className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">Gerenciar Membros</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Rol e fichas completas</span>
            </button>
            <button 
              onClick={() => onNavigate('voting')}
              className="flex flex-col p-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl hover:border-[#0a3d1c] dark:hover:border-[#236b39] hover:bg-[#f6faf7] dark:hover:bg-slate-850 transition-all text-left cursor-pointer shadow-xs group"
            >
              <div className="w-9 h-9 bg-[#fefce8] dark:bg-[#2a220b] text-[#854d0e] dark:text-[#c59b27] border border-[#fef08a] dark:border-[#4d3b14] rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#854d0e] group-hover:text-white transition-colors">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">Urna Eleitoral</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Mesa e escrutínios</span>
            </button>
          </div>
        </div>

        <div className="space-y-3.5">
          <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm px-0.5">
            <FileText className="w-4 h-4 text-[#0a3d1c] dark:text-[#86a892]" /> Último Registro
          </h3>
          {sessions.length > 0 ? (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs relative overflow-hidden transition-colors">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Sessão de {format(sessions[0].date, "dd/MM/yyyy")}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {sessions[0].records.length} membros convocados
              </p>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#0a3d1c] dark:text-[#86a892] bg-[#f0fdf4] dark:bg-[#072b14] px-2.5 py-0.5 rounded-md border border-[#bbf7d0] dark:border-[#1e4e2e]">
                  {sessions[0].records.filter(r => r.status === 'presente').length} presentes
                </span>
                <button 
                  onClick={() => generateReport(sessions[0])}
                  className="text-[#0a3d1c] dark:text-[#86a892] hover:text-[#072b14] dark:hover:text-emerald-400 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  Ver Relatório <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-xs">
              Nenhuma chamada realizada ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
