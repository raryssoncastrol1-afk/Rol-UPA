import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Member, AttendanceSession } from '../types';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface MemberHistoryModalProps {
  member: Member | null;
  onClose: () => void;
  sessions: AttendanceSession[];
}

export const MemberHistoryModal: React.FC<MemberHistoryModalProps> = ({ member, onClose, sessions }) => {
  const [mode, setMode] = React.useState<'cumulative' | 'direct'>('cumulative');
  const [includeJustified, setIncludeJustified] = React.useState(false);

  const chartData = useMemo(() => {
    if (!member) return [];
    
    const sorted = [...sessions].sort((a, b) => a.date - b.date);
    let cumulativePresent = 0;
    let cumulativeTotal = 0;

    return sorted.map((s) => {
      const record = s.records.find(r => r.memberId === member.id);
      const isPresent = record?.status === 'presente';
      const isJustified = record?.status === 'falta_justificada';
      
      const countsAsPresence = isPresent || (includeJustified && isJustified);
      
      cumulativePresent += countsAsPresence ? 1 : 0;
      cumulativeTotal += 1;

      let displayValue = 0;

      if (mode === 'cumulative') {
        displayValue = Math.round((cumulativePresent / cumulativeTotal) * 100);
      } else {
        // 'direct' mode: point map
        displayValue = isPresent ? 100 : (isJustified ? (includeJustified ? 100 : 50) : 0);
      }

      return {
        name: format(s.date, 'dd/MM'),
        fullDate: format(s.date, "dd 'de' MMMM", { locale: ptBR }),
        status: record?.status || 'ausente',
        valor: displayValue
      };
    });
  }, [member, sessions, mode, includeJustified]);

  if (!member) return null;

  const memberSessions = sessions.filter(s => s.records.some(r => r.memberId === member.id));
  const presenceCount = memberSessions.filter(s => s.records.find(r => r.memberId === member.id)?.status === 'presente').length;
  const justifiedCount = memberSessions.filter(s => s.records.find(r => r.memberId === member.id)?.status === 'falta_justificada').length;
  const absenceCount = memberSessions.filter(s => s.records.find(r => r.memberId === member.id)?.status === 'ausente').length;

  const totalSessions = sessions.length;
  const frequencyReal = totalSessions > 0 ? Math.round((presenceCount / totalSessions) * 100) : 0;
  const frequencyJustified = totalSessions > 0 ? Math.round(((presenceCount + justifiedCount) / totalSessions) * 100) : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Dashboard Header */}
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xl shadow-indigo-200">
                {member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 leading-tight">{member.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 bg-slate-200 rounded text-[9px] font-black uppercase text-slate-500 tracking-widest">{member.cargo || 'Membro'}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Desde {format(member.createdAt, 'MM/yyyy')}</span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            {/* Statistics Overview */}
            <div className="grid grid-cols-3 gap-1 p-8 bg-white border-b border-slate-50">
              <div className="text-center p-4 rounded-3xl bg-emerald-50 border border-emerald-100">
                <p className="text-2xl font-black text-emerald-600 leading-none">{presenceCount}</p>
                <p className="text-[9px] text-emerald-500 font-black uppercase mt-1.5 tracking-widest">Presenças</p>
              </div>
              <div className="text-center p-4 rounded-3xl bg-amber-50 border border-amber-100">
                <p className="text-2xl font-black text-amber-600 leading-none">{justifiedCount}</p>
                <p className="text-[9px] text-amber-500 font-black uppercase mt-1.5 tracking-widest">Justificadas</p>
              </div>
              <div className="text-center p-4 rounded-3xl bg-rose-50 border border-rose-100">
                <p className="text-2xl font-black text-rose-600 leading-none">{absenceCount}</p>
                <p className="text-[9px] text-rose-500 font-black uppercase mt-1.5 tracking-widest">Faltas</p>
              </div>
            </div>

            {/* Performance Chart */}
            {sessions.length > 0 && (
              <div className="p-8 border-b border-slate-50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evolução Individual</h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 self-start">
                    <button 
                      onClick={() => setIncludeJustified(!includeJustified)}
                      className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${includeJustified ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-slate-600'}`}
                    >
                      Abonar Justif.
                    </button>
                    <div className="w-px h-6 bg-slate-100 mx-1" />
                    <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                      <button 
                        onClick={() => setMode('cumulative')}
                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'cumulative' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                      >
                        Média Acum.
                      </button>
                      <button 
                        onClick={() => setMode('direct')}
                        className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'direct' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                      >
                        Ponto a Ponto
                      </button>
                    </div>
                  </div>
                </div>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis hide dataKey="name" />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                        formatter={(value: any) => [
                          Number(value) === 100 ? 'Presente' : (Number(value) === 50 ? 'Justificada' : 'Ausente'),
                          'Status'
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="valor" 
                        stroke="#4f46e5" 
                        strokeWidth={3} 
                        fill="#4f46e5" 
                        fillOpacity={0.1} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* History List */}
            <div className="p-8 py-6 space-y-4">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Linha do Tempo</p>
              {sessions.length === 0 ? (
                <div className="text-center py-10">
                  <AlertCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-400 italic">Nenhum registro de reunião disponível.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...sessions].reverse().map(session => {
                    const record = session.records.find(r => r.memberId === member.id);
                    if (!record) return null;

                    return (
                      <div key={session.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:shadow-md transition-all group">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm">
                            {format(session.date, "dd 'de' MMMM", { locale: ptBR })}
                          </span>
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                            {session.type === 'plenaria' ? `🏛️ Plenária (${session.callNumber || 1}ª Chamada)` : '📅 Programação'} • {format(session.date, "yyyy")}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {record.justification && (
                            <div className="hidden sm:block text-right max-w-[150px]">
                              <p className="text-[10px] text-indigo-500 font-medium italic truncate">"{record.justification}"</p>
                            </div>
                          )}
                          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            record.status === 'presente' ? 'bg-emerald-100 text-emerald-700' :
                            record.status === 'ausente' ? 'bg-rose-100 text-rose-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {record.status === 'falta_justificada' ? 'Justificada' : record.status}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Dashboard Footer Stats */}
          <div className="p-8 py-6 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Presença Real</p>
                <p className="text-xl font-black text-white leading-none">
                  {frequencyReal}%
                </p>
              </div>
              <div className="w-px h-8 bg-slate-800" />
              <div>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Frequência (Inc. Justif.)</p>
                <p className="text-xl font-black text-indigo-400 leading-none">
                  {frequencyJustified}%
                </p>
              </div>
            </div>
            
            <div className="hidden sm:block text-right">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total de Chamadas</p>
              <p className="text-white font-bold">{totalSessions}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
