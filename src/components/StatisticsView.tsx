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
import { TrendingUp, Users, Calendar, Filter, CheckCircle2, Landmark } from 'lucide-react';

interface StatisticsViewProps {
  members: Member[];
  sessions: AttendanceSession[];
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({ members, sessions }) => {
  const sortedSessions = useMemo(() => 
    [...sessions]
      .filter(s => s && s.date)
      .sort((a, b) => Number(a.date) - Number(b.date)), 
  [sessions]);

  // Initial dates
  const initialStartDate = useMemo(() => {
    try {
      return sortedSessions.length > 0 && !isNaN(new Date(sortedSessions[0].date).getTime())
        ? format(new Date(sortedSessions[0].date), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd');
    } catch {
      return format(new Date(), 'yyyy-MM-dd');
    }
  }, [sortedSessions]);

  const initialEndDate = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [includeJustified, setIncludeJustified] = useState(false);

  const filteredSessions = useMemo(() => {
    try {
      const start = startOfDay(parseISO(startDate)).getTime();
      const end = startOfDay(parseISO(endDate)).getTime();
      
      return sortedSessions.filter(s => {
        const sDate = new Date(s.date);
        if (isNaN(sDate.getTime())) return false;
        const sessionDate = startOfDay(sDate).getTime();
        return sessionDate >= start && sessionDate <= end;
      });
    } catch {
      return sortedSessions;
    }
  }, [sortedSessions, startDate, endDate]);

  const chartData = useMemo(() => {
    let cumulativePresent = 0;
    let cumulativeTotal = 0;

    return filteredSessions.map((session) => {
      const records = session.records || [];
      const totalMembros = records.length || 1;
      const presentCount = records.filter(r => 
        r.status === 'presente' || (includeJustified && r.status === 'falta_justificada')
      ).length;
      
      cumulativePresent += presentCount;
      cumulativeTotal += totalMembros;

      const displayPercentage = Math.round((cumulativePresent / cumulativeTotal) * 100);
      const rawPercentage = Math.round((presentCount / totalMembros) * 100);
      
      const sDate = new Date(session.date);
      const isValidDate = !isNaN(sDate.getTime());
      
      return {
        name: isValidDate ? format(sDate, 'dd/MM') : '--/--',
        fullDate: isValidDate ? format(sDate, "dd 'de' MMMM", { locale: ptBR }) : '--/--',
        porcentagem: displayPercentage,
        rawPercentage: rawPercentage,
        presentes: presentCount,
        total: totalMembros,
        sessionType: session.type || 'programacao'
      };
    });
  }, [filteredSessions, includeJustified]);

  if (sessions.length === 0) {
    return (
      <div className="bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 border-dashed p-20 rounded-2xl text-center">
        <TrendingUp className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
        <p className="text-slate-400 dark:text-slate-500 font-medium italic">Dados insuficientes para gerar estatísticas. Comece a registrar chamadas!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#0b1220] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-xl flex items-center justify-center border border-sky-100 dark:border-sky-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Metodologia</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">Média Acumulada</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#0b1220] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Amostra</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{members.length} Sócios</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#0b1220] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center border border-amber-100 dark:border-amber-500/20">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Período Selecionado</p>
            <p className="text-xl font-black text-slate-900 dark:text-white">{filteredSessions.length} Reuniões</p>
          </div>
        </div>
      </div>

      {/* Filters Control Panel */}
      <div className="bg-slate-900 dark:bg-[#0b1220] p-6 md:p-8 rounded-2xl shadow-xl border border-slate-800 transition-colors">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-sky-500/10 text-sky-400 rounded-xl flex items-center justify-center border border-sky-500/20">
              <Filter className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-black text-base uppercase tracking-tight">Filtros de Análise</h4>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-medium">Refine o intervalo e critérios da assiduidade</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Date Range Inputs */}
             <div className="flex items-center gap-3 bg-slate-800/50 dark:bg-[#030712] p-2 rounded-xl border border-slate-700 dark:border-slate-800">
               <div className="flex flex-col px-3">
                 <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Início</span>
                 <input 
                   type="date" 
                   value={startDate}
                   onChange={(e) => setStartDate(e.target.value)}
                   className="bg-transparent text-white font-bold text-sm focus:outline-none [color-scheme:dark]"
                 />
               </div>
               <div className="w-px h-8 bg-slate-700 dark:bg-slate-800" />
               <div className="flex flex-col px-3">
                 <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Fim</span>
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
              className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all border cursor-pointer ${
                includeJustified 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-slate-800 dark:bg-[#030712] border-slate-700 dark:border-slate-800 text-slate-400 opacity-60 hover:opacity-100'
              }`}
             >
               <CheckCircle2 className={`w-5 h-5 ${includeJustified ? 'text-emerald-400' : 'text-slate-500'}`} />
               <span className="text-xs font-bold uppercase tracking-wider">Abonar Justificadas</span>
               <div className={`w-8 h-4 rounded-full relative transition-all ${includeJustified ? 'bg-emerald-500' : 'bg-slate-700 dark:bg-slate-800'}`}>
                  <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${includeJustified ? 'right-1' : 'left-1'}`} />
               </div>
             </button>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="bg-white dark:bg-[#0b1220] p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Evolução da Assiduidade</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Média ponderada do percentual de presença no tempo</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-sky-50 dark:bg-sky-500/10 rounded-2xl border border-sky-100 dark:border-sky-500/20">
              <div className="w-3 h-3 bg-sky-500 rounded-full" />
              <span className="text-xs font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider">% Frequência Geral</span>
           </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" opacity={0.3} />
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
                  backgroundColor: '#0b1220', 
                  borderRadius: '16px', 
                  border: '1px solid #1e293b', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
                  padding: '15px'
                }}
                itemStyle={{ color: '#38bdf8', fontWeight: 900, fontSize: '12px' }}
                labelStyle={{ fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '5px' }}
                formatter={(value: any) => [`${value}% de Assiduidade`, 'Status']}
                labelFormatter={(label, items) => items[0]?.payload?.fullDate || label}
              />
              <Area 
                type="monotone" 
                dataKey="porcentagem" 
                stroke="#38bdf8" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorPercentage)" 
                animationDuration={300}
                isAnimationActive={true}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Detailed Table */}
      <div className="bg-white dark:bg-[#0b1220] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-10 transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#0b1220] relative z-10">
          <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">Registro de Lançamentos</h4>
          <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 px-3 py-1 rounded-full uppercase tracking-wider">{chartData.length} Reuniões Exibidas</span>
        </div>
        
        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          <div className="hidden md:grid md:grid-cols-4 bg-slate-50 dark:bg-[#030712] text-xs font-bold text-slate-400 uppercase tracking-wider px-8 py-4">
            <div>Data do Evento</div>
            <div className="text-center">Taxa Bruta (Evento)</div>
            <div className="text-center">Presenças / Rol</div>
            <div className="text-right">Média Acumulada</div>
          </div>

          {[...chartData].reverse().map((data, idx) => (
            <div key={idx} className="hover:bg-slate-50/50 dark:hover:bg-[#0f172a]/40 transition-colors p-6 md:px-8 md:py-6 flex flex-col md:grid md:grid-cols-4 gap-4 md:gap-0 items-start md:items-center">
              <div className="w-full md:w-auto">
                <p className="text-sm font-black text-slate-800 dark:text-white">{data.fullDate}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    {data.sessionType === 'plenaria' ? (
                      <>
                        <Landmark className="w-3.5 h-3.5 text-sky-500" />
                        <span>Plenária</span>
                      </>
                    ) : (
                      <>
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Programação</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div className="flex md:justify-center items-center justify-between w-full md:w-auto">
                <span className="md:hidden text-xs font-bold text-slate-400 uppercase tracking-wider">Nesta Reunião</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${data.rawPercentage >= 50 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className={`text-sm font-black ${data.rawPercentage >= 50 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {data.rawPercentage}%
                  </span>
                </div>
              </div>

              <div className="flex md:justify-center items-center justify-between w-full md:w-auto">
                <span className="md:hidden text-xs font-bold text-slate-400 uppercase tracking-wider">Contagem</span>
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 md:bg-transparent px-3 py-1 md:p-0 rounded-lg">
                  {data.presentes} de {data.total}
                </p>
              </div>

              <div className="flex md:justify-end items-center justify-between w-full md:w-auto border-t border-slate-100 dark:border-slate-800 md:border-none pt-4 md:pt-0">
                <div className="md:hidden">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Média Histórica</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={`text-xl md:text-base font-black ${
                    data.porcentagem >= 50 ? 'text-sky-500 dark:text-sky-400' : 'text-amber-500'
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

export default StatisticsView;
