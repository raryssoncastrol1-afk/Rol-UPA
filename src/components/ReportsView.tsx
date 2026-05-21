import React from 'react';
import { FileText, Trash2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AttendanceSession } from '../types';
import { generateReport } from '../lib/report';

interface ReportsViewProps {
  sessions: AttendanceSession[];
  removeSession: (id: string) => Promise<void>;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ sessions, removeSession }) => {
  const [sessionToDelete, setSessionToDelete] = React.useState<string | null>(null);

  return (
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
          {sessions.map(session => (
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
                  onClick={(e) => {
                    e.preventDefault();
                    setSessionToDelete(session.id);
                  }}
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

      {sessionToDelete && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Remover Sessão</h3>
            <p className="text-slate-600 mb-6">
              ATENÇÃO: A sessão será excluída do sistema e seus registros de presença irão sumir. Tem certeza que deseja continuar?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSessionToDelete(null)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={async () => {
                  try {
                    await removeSession(sessionToDelete);
                    setSessionToDelete(null);
                  } catch (error) {
                    console.error(error);
                    alert('Erro ao excluir sessão.');
                  }
                }}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
