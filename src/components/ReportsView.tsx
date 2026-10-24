import React, { useState } from 'react';
import { FileText, Trash2, Download, Edit3, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AttendanceSession, AttendanceRecord, AttendanceStatus } from '../types';
import { generateReport } from '../lib/report';

interface ReportsViewProps {
  sessions: AttendanceSession[];
  updateSession?: (id: string, updates: Partial<AttendanceSession>) => Promise<void>;
  removeSession: (id: string) => Promise<void>;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ sessions, updateSession, removeSession }) => {
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<AttendanceSession | null>(null);
  const [editedRecords, setEditedRecords] = useState<AttendanceRecord[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startEditing = (session: AttendanceSession) => {
    setEditingSession(session);
    setEditedRecords(JSON.parse(JSON.stringify(session.records)));
  };

  const handleStatusChange = (memberId: string, newStatus: AttendanceStatus) => {
    setEditedRecords(prev => prev.map(rec => {
      if (rec.memberId === memberId) {
        return { ...rec, status: newStatus };
      }
      return rec;
    }));
  };

  const handleSaveEdit = async () => {
    if (!editingSession || !updateSession) return;
    setIsSavingEdit(true);
    try {
      await updateSession(editingSession.id, {
        records: editedRecords
      });
      setEditingSession(null);
    } catch (err: any) {
      console.error('Erro ao atualizar presença:', err);
      alert('Erro ao retificar lista de presença: ' + (err?.message || 'Verifique suas permissões'));
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest leading-none">Últimos Lançamentos</h3>
        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{sessions.length} Históricos</div>
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 border-dashed p-20 rounded-3xl text-center">
          <FileText className="w-12 h-12 text-slate-100 mx-auto mb-4" />
          <p className="text-slate-400 font-medium italic">Nenhum histórico registrado no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map(session => {
            const records = session.records || [];
            const safeDate = session.date ? new Date(session.date) : new Date();
            const isValidDate = !isNaN(safeDate.getTime());
            return (
              <div key={session.id} className="bg-white dark:bg-[#0b1220] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group relative">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-2xl font-black text-slate-900 leading-none">
                      {isValidDate ? format(safeDate, "dd/MM", { locale: ptBR }) : '--/--'}
                    </p>
                    <p className="text-[10px] text-slate-400 font-black uppercase mt-1 tracking-widest">
                      {session.type === 'plenaria' ? `🏛️ Plenária (${session.callNumber || 1}ª Chamada)` : '📅 Programação'} • {isValidDate ? format(safeDate, "yyyy • HH:mm", { locale: ptBR }) : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {updateSession && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          startEditing(session);
                        }}
                        className="text-slate-600 hover:text-indigo-700 hover:bg-slate-100 p-1.5 rounded-lg transition-all border border-slate-200 bg-white shadow-sm shrink-0 cursor-pointer"
                        title="Retificar Presenças (Editar)"
                        aria-label="Retificar Presenças"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        setSessionToDelete(session.id);
                      }}
                      className="text-slate-600 hover:text-rose-700 hover:bg-slate-100 p-1.5 rounded-lg transition-all border border-slate-200 bg-white shadow-sm shrink-0 cursor-pointer"
                      title="Excluir Sessão"
                      aria-label="Excluir Sessão"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-3 mb-8 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                  <div className="text-center">
                    <p className="text-xl font-black text-emerald-600 leading-none">
                      {records.filter(r => r.status === 'presente').length}
                    </p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-wider">Pres</p>
                  </div>
                  <div className="text-center border-x border-slate-200/60">
                    <p className="text-xl font-black text-rose-600 leading-none">
                      {records.filter(r => r.status === 'ausente').length}
                    </p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-wider">Aus</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-amber-600 leading-none">
                      {records.filter(r => r.status === 'falta_justificada').length}
                    </p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 tracking-wider">Just</p>
                  </div>
                </div>

                <button 
                  onClick={() => generateReport(session)}
                  className="w-full bg-slate-900 text-white hover:bg-slate-800 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar PDF
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Retificação de Presença (RF05) */}
      {editingSession && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0b1220] rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Retificar Chamada de Presença</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {format(editingSession.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })} • {editingSession.type === 'plenaria' ? 'Sessão Plenária' : 'Programação Regular'}
                </p>
              </div>
              <button 
                onClick={() => setEditingSession(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-2 pr-1 custom-scrollbar">
              {editedRecords.map(rec => (
                <div key={rec.memberId} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 gap-3">
                  <span className="font-medium text-slate-800 text-sm truncate">{rec.memberName}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(rec.memberId, 'presente')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        rec.status === 'presente' 
                          ? 'bg-emerald-600 text-white shadow-sm' 
                          : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Presente
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(rec.memberId, 'falta_justificada')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        rec.status === 'falta_justificada' 
                          ? 'bg-amber-500 text-white shadow-sm' 
                          : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Justificada
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(rec.memberId, 'ausente')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        rec.status === 'ausente' 
                          ? 'bg-rose-600 text-white shadow-sm' 
                          : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Ausente
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingSession(null)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSavingEdit}
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-indigo-200 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {isSavingEdit ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {sessionToDelete && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0b1220] rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Remover Sessão</h3>
            <p className="text-slate-600 mb-6 font-normal">
              ATENÇÃO: A sessão será excluída do sistema e seus registros de presença irão sumir. Tem certeza que deseja continuar?
            </p>
            {errorMsg && (
              <div className="mb-4 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs font-medium border border-rose-100">
                {errorMsg}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSessionToDelete(null);
                  setErrorMsg(null);
                }}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={async () => {
                  try {
                    setErrorMsg(null);
                    await removeSession(sessionToDelete);
                    setSessionToDelete(null);
                  } catch (error) {
                    console.error("Erro ao excluir sessão:", error);
                    setErrorMsg('Erro ao excluir sessão. Verifique suas permissões.');
                  }
                }}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
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

export default ReportsView;
