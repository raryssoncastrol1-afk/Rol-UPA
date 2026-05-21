import React, { useMemo, useState } from 'react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format, isAfter, isBefore, startOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Member, AttendanceSession } from '../types';
import { TrendingUp, Users, Calendar, Filter, CheckCircle2 } from 'lucide-react';

interface StatisticsViewProps {
  members: Member[];
  sessions: AttendanceSession[];
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({ members, sessions }) => {
  const sortedSessions = useMemo(() => 
    [...sessions].sort((a, b) => a.date - b.date), 
  [sessions]);

  // Initial dates
  const initialStartDate = sortedSessions.length > 0 
    ? format(sortedSessions[0].date, 'yyyy-MM-dd') 
    : format(new Date(), 'yyyy-MM-dd');
  const initialEndDate = format(new Date(), 'yyyy-MM-dd');

  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [includeJustified, setIncludeJustified] = useState(false);

  const filteredSessions = useMemo(() => {
    const start = startOfDay(parseISO(startDate)).getTime();
    const end = startOfDay(parseISO(endDate)).getTime();
    
    return sortedSessions.filter(s => {
      const sessionDate = startOfDay(s.date).getTime();
      return sessionDate >= start && sessionDate <= end;
    });
  }, [sortedSessions, startDate, endDate]);

  const chartData = useMemo(() => {
    let cumulativePresent = 0;
    let cumulativeTotal = 0;

    return filteredSessions.map((session) => {
      const totalMembros = session.records.length || 1;
      const presentCount = session.records.filter(r => 
        r.status === 'presente' || (includeJustified && r.status === 'falta_justificada')
      ).length;
      
      cumulativePresent += presentCount;
      cumulativeTotal += totalMembros;

      const displayPercentage = Math.round((cumulativePresent / cumulativeTotal) * 100);
      const rawPercentage = Math.round((presentCount / totalMembros) * 100);
      
      return {
        name: format(session.date, 'dd/MM'),
        fullDate: format(session.date, "dd 'de' MMMM", { locale: ptBR }),
        porcentagem: displayPercentage,
        rawPercentage,
        presentes: presentCount,
        total: totalMembros,
        sessionType: session.type
      };
    });
  }, [filteredSessions, includeJustified]);

  if (sessions.length === 0) {
    return (
      <div className="bg-white border border-slate-200 border-dashed p-20 rounded-3xl text-center">
        <TrendingUp className="w-12 h-12 text-slate-100 mx-auto mb-4" />
        <p className="text-slate-400 font-medium italic">Dados insuficientes para gerar estatísticas. Comece a registrar chamadas!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metodologia</p>
            <p className="text-xl font-black text-slate-900">Média Acumulada</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amostra</p>
            <p className="text-xl font-black text-slate-900">{members.length} Sócios</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Período Selecionado</p>
            <p className="text-xl font-black text-slate-900">{filteredSessions.length} Reuniões</p>
          </div>
        </div>
      </div>

      {/* Filters Control Panel */}
      <div className="bg-slate-900 p-8 rounded-[3rem] shadow-2xl border border-slate-800">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center border border-indigo-500/20">
              <Filter className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-black text-base uppercase tracking-tight">Filtros de Análise</h4>
              <p className="text-slate-500 text-xs font-medium">Refine o intervalo e critérios da assiduidade</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Date Range Inputs */}
             <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-2xl border border-slate-700">
               <div className="flex flex-col px-3">
                 <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Início</span>
                 <input 
                   type="date" 
                   value={startDate}
                   onChange={(e) => setStartDate(e.target.value)}
                   className="bg-transparent text-white font-bold text-sm focus:outline-none [color-scheme:dark]"
                 />
               </div>
               <div className="w-px h-8 bg-slate-700" />
               <div className="flex flex-col px-3">
                 <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Fim</span>
                 <input 
                   type="date" 
                   value={endDate}
                   onChange={(e) => setEndDate(e.target.value)}
                   className="bg-transparent text-white font-bold text-sm focus:outline-none [color-scheme:dark]"
                 />
               </div>
             </div>

             {/* Justification Toggle */}
             <button 
              onClick={() => setIncludeJustified(!includeJustified)}
              className={`flex items-center gap-3 px-6 py-4 rounded-[1.5rem] transition-all border cursor-pointer ${
                includeJustified 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-slate-800 border-slate-700 text-slate-400 opacity-60 hover:opacity-100'
              }`}
             >
               <CheckCircle2 className={`w-5 h-5 ${includeJustified ? 'text-emerald-400' : 'text-slate-600'}`} />
               <span className="text-[10px] font-black uppercase tracking-[0.1em]">Abonar Justificadas</span>
               <div className={`w-8 h-4 rounded-full relative transition-all ${includeJustified ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${includeJustified ? 'right-1' : 'left-1'}`} />
               </div>
             </button>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h3 className="text-2xl font-black text-slate-900 leading-tight">Evolução da Assiduidade</h3>
            <p className="text-sm text-slate-500 font-medium">Média ponderada do percentual de presença no tempo</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-2xl border border-indigo-100">
             <div className="w-3 h-3 bg-indigo-600 rounded-full" />
             <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">% Frequência Geral</span>
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
                domain={[0, 100]}
                tickCount={6}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '20px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '15px'
                }}
                itemStyle={{ color: '#4f46e5', fontWeight: 900, fontSize: '12px' }}
                labelStyle={{ fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '5px' }}
                formatter={(value: number) => [`${value}% de Assiduidade`, 'Status']}
                labelFormatter={(label, items) => items[0]?.payload?.fullDate || label}
              />
              <Area 
                type="monotone" 
                dataKey="porcentagem" 
                stroke="#4f46e5" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorPercentage)" 
                animationDuration={1500}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Detailed Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden mb-10">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white relative z-10">
          <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">Registro de Lançamentos</h4>
          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-widest">{chartData.length} Reuniões Exibidas</span>
        </div>
        
        <div className="divide-y divide-slate-50">
          <div className="hidden md:grid md:grid-cols-4 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-8 py-4">
            <div>Data do Evento</div>
            <div className="text-center">Taxa Bruta (Evento)</div>
            <div className="text-center">Presenças / Rol</div>
            <div className="text-right">Média Acumulada</div>
          </div>

          {[...chartData].reverse().map((data, idx) => (
            <div key={idx} className="hover:bg-slate-50/50 transition-colors p-6 md:px-8 md:py-6 flex flex-col md:grid md:grid-cols-4 gap-4 md:gap-0 items-start md:items-center">
              <div className="w-full md:w-auto">
                <p className="text-sm font-black text-slate-800">{data.fullDate}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {data.sessionType === 'plenaria' ? '🏛️ Plenária' : '📅 Programação'}
                  </span>
                </div>
              </div>

              <div className="flex md:justify-center items-center justify-between w-full md:w-auto">
                <span className="md:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest">Nesta Reunião</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${data.rawPercentage >= 50 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className={`text-sm font-black ${data.rawPercentage >= 50 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {data.rawPercentage}%
                  </span>
                </div>
              </div>

              <div className="flex md:justify-center items-center justify-between w-full md:w-auto">
                <span className="md:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest">Contagem</span>
                <p className="text-sm font-bold text-slate-600 bg-slate-100 md:bg-transparent px-3 py-1 md:p-0 rounded-lg">
                  {data.presentes} de {data.total}
                </p>
              </div>

              <div className="flex md:justify-end items-center justify-between w-full md:w-auto border-t border-slate-100 md:border-none pt-4 md:pt-0">
                <div className="md:hidden">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Média Histórica</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-xl md:text-base font-black ${
                    data.porcentagem >= 50 ? 'text-indigo-600' : 'text-amber-600'
                  }`}>
                    {data.porcentagem}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
