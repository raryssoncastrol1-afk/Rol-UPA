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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 text-center md:text-left">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-1 group">
          <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-3">Rol Ativo</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl md:text-5xl font-mono font-bold text-slate-800 tracking-tighter">{stats.totalMembros}</p>
            <span className="text-xs font-semibold text-slate-400">membros</span>
          </div>
        </div>
        <div className="bg-emerald-500 p-6 rounded-3xl shadow-[0_8px_30px_rgba(16,185,129,0.2)] transition-transform hover:-translate-y-1 group text-white">
          <p className="text-[10px] md:text-xs font-bold text-emerald-100 uppercase tracking-widest leading-none mb-3">Média Presença</p>
          <div className="flex items-baseline gap-1">
            <p className="text-4xl md:text-5xl font-mono font-bold text-white tracking-tighter">{stats.mediaPresenca}</p>
            <span className="text-2xl font-bold text-emerald-200">%</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-1 group">
          <p className="text-[10px] md:text-xs font-bold text-rose-500 uppercase tracking-widest leading-none mb-3">Ult. Ausentes</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl md:text-5xl font-mono font-bold text-rose-600 tracking-tighter">{stats.lastAbsentCount}</p>
            <span className="text-xs font-semibold text-rose-400">faltas</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-transform hover:-translate-y-1 group">
          <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-3">Chamadas Feitas</p>
          <div className="flex items-baseline gap-2">
            <p className="text-4xl md:text-5xl font-mono font-bold text-slate-800 tracking-tighter">{stats.totalSessions}</p>
            <span className="text-xs font-semibold text-slate-400">registros</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 px-1">
            <Plus className="w-4 h-4 text-indigo-500" /> Ações Rápidas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button 
              onClick={() => onNavigate('attendance')}
              className="flex flex-col p-6 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md hover:border-indigo-100 group transition-all text-left cursor-pointer"
            >
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-800">Nova Chamada</span>
              <span className="text-xs text-slate-500 mt-1">Iniciar registro</span>
            </button>
            <button 
              onClick={() => onNavigate('members')}
              className="flex flex-col p-6 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md hover:border-emerald-100 group transition-all text-left cursor-pointer"
            >
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <UserPlus className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-800">Cadastrar Membro</span>
              <span className="text-xs text-slate-500 mt-1">Adicionar novos</span>
            </button>
            <button 
              onClick={() => onNavigate('statistics')}
              className="flex flex-col p-6 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md hover:border-amber-100 group transition-all text-left cursor-pointer"
            >
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:text-white transition-all">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-800">Estatísticas</span>
              <span className="text-xs text-slate-500 mt-1">Ver gráficos</span>
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
                {format(sessions[0].date, "dd/MM/yyyy")}
              </p>
              <p className="text-xs text-slate-400 mt-1 italic">
                {sessions[0].records.length} membros participaram
              </p>
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  {sessions[0].records.filter(r => r.status === 'presente').length} presentes
                </span>
                <button 
                  onClick={() => generateReport(sessions[0])}
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
  );
};
