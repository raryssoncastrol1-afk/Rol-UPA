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
        <div className="bg-white dark:bg-[#18221D] p-5 rounded-2xl border border-[#E4DFD5] dark:border-[#2A3A31] shadow-2xs transition-colors">
          <p className="text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] mb-2">Rol Ativo</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl md:text-4xl font-mono font-bold text-[#1B2E24] dark:text-[#EDEDE8] tracking-tight">{stats.totalMembros}</p>
            <span className="text-xs font-medium text-[#5C665F] dark:text-[#8A968F]">irmãos</span>
          </div>
        </div>
        <div className="bg-[#1B2E24] dark:bg-[#14231B] p-5 rounded-2xl shadow-2xs text-[#FAF8F5] border border-[#2A3A31]">
          <p className="text-xs font-semibold text-[#8A968F] mb-2">Média de Presença</p>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl md:text-4xl font-mono font-bold text-[#FAF8F5] tracking-tight">{stats.mediaPresenca}</p>
            <span className="text-xl font-bold text-[#C2A267] dark:text-[#C8A96E]">%</span>
          </div>
        </div>
        <div className="bg-white dark:bg-[#18221D] p-5 rounded-2xl border border-[#E4DFD5] dark:border-[#2A3A31] shadow-2xs transition-colors">
          <p className="text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] mb-2">Últimos Ausentes</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl md:text-4xl font-mono font-bold text-rose-600 dark:text-rose-400 tracking-tight">{stats.lastAbsentCount}</p>
            <span className="text-xs font-medium text-[#5C665F] dark:text-[#8A968F]">faltas</span>
          </div>
        </div>
        <div className="bg-white dark:bg-[#18221D] p-5 rounded-2xl border border-[#E4DFD5] dark:border-[#2A3A31] shadow-2xs transition-colors">
          <p className="text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] mb-2">Chamadas Plenárias</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl md:text-4xl font-mono font-bold text-[#1B2E24] dark:text-[#EDEDE8] tracking-tight">{stats.totalSessions}</p>
            <span className="text-xs font-medium text-[#5C665F] dark:text-[#8A968F]">atas</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3.5">
          <h3 className="font-serif font-bold text-[#1B2E24] dark:text-[#EDEDE8] flex items-center gap-2 text-base px-0.5">
            <Plus className="w-4 h-4 text-[#C2A267] dark:text-[#C8A96E]" /> Ações Rápidas da Diretoria
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <button 
              onClick={() => onNavigate('attendance')}
              className="flex flex-col p-5 bg-white dark:bg-[#18221D] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl hover:border-[#1B2E24] dark:hover:border-[#C8A96E]/50 hover:bg-[#FAF8F5] dark:hover:bg-[#202C26] transition-all text-left cursor-pointer shadow-2xs group"
            >
              <div className="w-9 h-9 bg-[#1B2E24]/10 dark:bg-[#111614] text-[#1B2E24] dark:text-[#C8A96E] border border-[#1B2E24]/20 dark:border-[#2A3A31] rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#1B2E24] group-hover:text-white dark:group-hover:bg-[#C8A96E] dark:group-hover:text-[#111614] transition-colors">
                <ClipboardCheck className="w-4 h-4" />
              </div>
              <span className="font-semibold text-[#1B2E24] dark:text-[#EDEDE8] text-sm">Realizar Chamada</span>
              <span className="text-xs text-[#5C665F] dark:text-[#8A968F] mt-0.5">Iniciar lista de presença</span>
            </button>
            <button 
              onClick={() => onNavigate('members')}
              className="flex flex-col p-5 bg-white dark:bg-[#18221D] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl hover:border-[#1B2E24] dark:hover:border-[#C8A96E]/50 hover:bg-[#FAF8F5] dark:hover:bg-[#202C26] transition-all text-left cursor-pointer shadow-2xs group"
            >
              <div className="w-9 h-9 bg-[#1B2E24]/10 dark:bg-[#111614] text-[#1B2E24] dark:text-[#C8A96E] border border-[#1B2E24]/20 dark:border-[#2A3A31] rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#1B2E24] group-hover:text-white dark:group-hover:bg-[#C8A96E] dark:group-hover:text-[#111614] transition-colors">
                <UserPlus className="w-4 h-4" />
              </div>
              <span className="font-semibold text-[#1B2E24] dark:text-[#EDEDE8] text-sm">Gerenciar Membros</span>
              <span className="text-xs text-[#5C665F] dark:text-[#8A968F] mt-0.5">Rol e fichas completas</span>
            </button>
            <button 
              onClick={() => onNavigate('voting')}
              className="flex flex-col p-5 bg-white dark:bg-[#18221D] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl hover:border-[#1B2E24] dark:hover:border-[#C8A96E]/50 hover:bg-[#FAF8F5] dark:hover:bg-[#202C26] transition-all text-left cursor-pointer shadow-2xs group"
            >
              <div className="w-9 h-9 bg-[#C2A267]/15 dark:bg-[#111614] text-[#C2A267] dark:text-[#C8A96E] border border-[#C2A267]/30 dark:border-[#2A3A31] rounded-lg flex items-center justify-center mb-3 group-hover:bg-[#C2A267] group-hover:text-white dark:group-hover:bg-[#C8A96E] dark:group-hover:text-[#111614] transition-colors">
                <BarChart3 className="w-4 h-4" />
              </div>
              <span className="font-semibold text-[#1B2E24] dark:text-[#EDEDE8] text-sm">Urna Eleitoral</span>
              <span className="text-xs text-[#5C665F] dark:text-[#8A968F] mt-0.5">Mesa e escrutínios</span>
            </button>
          </div>
        </div>

        <div className="space-y-3.5">
          <h3 className="font-serif font-bold text-[#1B2E24] dark:text-[#EDEDE8] flex items-center gap-2 text-base px-0.5">
            <FileText className="w-4 h-4 text-[#C2A267] dark:text-[#C8A96E]" /> Último Registro
          </h3>
          {sessions.length > 0 ? (
            <div className="bg-white dark:bg-[#18221D] p-5 rounded-xl border border-[#E4DFD5] dark:border-[#2A3A31] shadow-2xs relative overflow-hidden transition-colors">
              <p className="text-sm font-semibold text-[#1B2E24] dark:text-[#EDEDE8]">
                Sessão de {format(sessions[0].date, "dd/MM/yyyy")}
              </p>
              <p className="text-xs text-[#5C665F] dark:text-[#8A968F] mt-0.5">
                {sessions[0].records.length} membros convocados
              </p>
              <div className="mt-4 pt-4 border-t border-[#E4DFD5] dark:border-[#2A3A31] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1B2E24] dark:text-[#C8A96E] bg-[#1B2E24]/10 dark:bg-[#111614] px-2.5 py-0.5 rounded-md border border-[#1B2E24]/20 dark:border-[#2A3A31]">
                  {sessions[0].records.filter(r => r.status === 'presente').length} presentes
                </span>
                <button 
                  onClick={() => generateReport(sessions[0])}
                  className="text-[#1B2E24] dark:text-[#C8A96E] hover:text-[#14231B] dark:hover:text-[#b99859] text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  Ver Relatório <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white/60 dark:bg-[#18221D]/40 p-6 rounded-xl border border-dashed border-[#E4DFD5] dark:border-[#2A3A31] text-center text-[#5C665F] dark:text-[#8A968F] text-xs">
              Nenhuma chamada realizada ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
