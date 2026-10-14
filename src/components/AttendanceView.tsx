import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Gavel, Plus, Sparkles, ClipboardCheck, TimerReset, Timer } from 'lucide-react';
import { Member, AttendanceStatus, SessionType } from '../types';

interface AttendanceViewProps {
  members: Member[];
  sessionType: SessionType;
  setSessionType: (type: SessionType) => void;
  plenaryCall: 1 | 2;
  setPlenaryCall: (call: 1 | 2) => void;
  attendanceRecords: Record<string, AttendanceStatus>;
  setAttendanceRecords: React.Dispatch<React.SetStateAction<Record<string, AttendanceStatus>>>;
  justifications: Record<string, string>;
  setJustifications: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  totals: {
    presencePercentage: number;
    presentCount: number;
    metQuorum1st: boolean;
    metQuorum2nd: boolean;
  };
  isStarted: boolean;
  setIsStarted: (started: boolean) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  members,
  sessionType,
  setSessionType,
  plenaryCall,
  setPlenaryCall,
  attendanceRecords,
  setAttendanceRecords,
  justifications,
  setJustifications,
  totals,
  isStarted,
  setIsStarted
}) => {
  const [timerOverride, setTimerOverride] = useState(() => {
    return localStorage.getItem('uph_timerOverride') === 'true';
  });
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const saved = localStorage.getItem('uph_timeLeft');
    return saved ? Number(saved) : 30 * 60;
  });
  const [isRunning, setIsRunning] = useState(() => {
    return localStorage.getItem('uph_timerIsRunning') === 'true';
  });

  // Track the timestamp when it was running so we can adjust it if the user closed the window and came back
  const [lastTick, setLastTick] = useState<number>(() => {
    const saved = localStorage.getItem('uph_lastTick');
    return saved ? Number(saved) : Date.now();
  });

  useEffect(() => {
    localStorage.setItem('uph_timerOverride', String(timerOverride));
    localStorage.setItem('uph_timeLeft', String(timeLeft));
    localStorage.setItem('uph_timerIsRunning', String(isRunning));
    localStorage.setItem('uph_lastTick', String(lastTick));
  }, [timerOverride, timeLeft, isRunning, lastTick]);

  useEffect(() => {
    if (isStarted && !localStorage.getItem('uph_timerInitForSession')) {
       setTimeLeft(30 * 60);
       setIsRunning(false);
       setTimerOverride(false);
       localStorage.setItem('uph_timerInitForSession', 'true');
    } else if (!isStarted) {
       localStorage.removeItem('uph_timerInitForSession');
    }
  }, [isStarted]);

  useEffect(() => {
    // If we mount and it is running, let's fast forward the time based on how much time passed since last tick
    if (isRunning) {
      const now = Date.now();
      const diffSeconds = Math.floor((now - lastTick) / 1000);
      if (diffSeconds > 0) {
        setTimeLeft((prev) => Math.max(0, prev - diffSeconds));
        setLastTick(now);
      }
    }
  }, []);

  useEffect(() => {
    if (!isRunning || timerOverride || plenaryCall === 2 || totals.metQuorum1st || !isStarted) {
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
      setLastTick(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timerOverride, plenaryCall, totals.metQuorum1st, isStarted]);

  const canStartSecondCall = totals.metQuorum1st || plenaryCall === 2 || timeLeft === 0 || timerOverride;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!isStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-xl w-full bg-white rounded-2xl p-8 md:p-12 border border-slate-200 shadow-sm text-center relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-md shadow-indigo-100 mx-auto mb-6 transition-transform hover:scale-105">
              <ClipboardCheck className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 tracking-tight">Iniciar Chamada Ativa</h2>
            <p className="text-slate-500 font-medium mb-8 text-sm leading-relaxed px-4">
              Prepare-se para registrar a frequência dos membros. Escolha o tipo de evento e visualize o quórum em tempo real.
            </p>
            
            <button 
              onClick={() => setIsStarted(true)}
              className="group w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white py-4 px-6 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 shadow-md shadow-indigo-200 cursor-pointer"
            >
              <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
              Nova Chamada do Dia
              <Sparkles className="w-4 h-4 text-indigo-200" />
            </button>
            
            <div className="mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Sistema Online • {members.length} membros aptos</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header with back option */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setIsStarted(false)}
          className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors cursor-pointer"
        >
          ← Cancelar Chamada
        </button>
      </div>
      {/* Status Bar */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center md:text-left">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Quórum Atual</p>
            <p className="text-xl font-black text-slate-900 leading-none">{Math.round(totals.presencePercentage)}%</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center md:text-left">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Presentes</p>
            <p className="text-xl font-black text-emerald-600 leading-none">{totals.presentCount}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center md:text-left">
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Total Sócios</p>
            <p className="text-xl font-black text-rose-600 leading-none">{members.length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center md:text-left">
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Status Quórum</p>
            <p className={`text-[10px] font-black uppercase mt-1 ${sessionType === 'plenaria' ? (totals.metQuorum1st ? 'text-emerald-600' : totals.metQuorum2nd ? 'text-amber-600' : 'text-rose-600') : 'text-slate-400'}`}>
              {sessionType === 'plenaria' 
                ? (totals.metQuorum1st ? '1ª Chamada OK' : totals.metQuorum2nd ? '2ª Chamada OK' : 'Sem Quórum')
                : 'Livre'}
            </p>
          </div>
        </div>

        <div className="bg-slate-900 p-2 rounded-[2rem] flex gap-2 self-center shadow-xl">
          <button 
            onClick={() => setSessionType('programacao')}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
              sessionType === 'programacao' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Programação
          </button>
          <button 
            onClick={() => setSessionType('plenaria')}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
              sessionType === 'plenaria' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Plenária
          </button>
        </div>
      </div>

      {sessionType === 'plenaria' && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-50 border-2 border-indigo-100 p-6 rounded-[2.5rem] mb-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Gavel className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="font-black text-slate-900 text-sm uppercase tracking-tight">Regra de Quórum UPH</h4>
              <p className="text-xs text-indigo-500 font-medium">1ª Chamada: 51% • 2ª Chamada: 1/3 (33.3%)</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2 bg-white/50 p-1.5 rounded-2xl border border-indigo-100">
              <button 
                onClick={() => setPlenaryCall(1)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex flex-col items-center cursor-pointer ${
                  plenaryCall === 1 ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-500 hover:bg-white'
                }`}
              >
                1ª Chamada
                <span className={`text-[8px] opacity-70 ${totals.metQuorum1st ? '' : (plenaryCall === 1 ? 'text-rose-200' : 'text-rose-400')}`}>
                  {totals.metQuorum1st ? 'Suficiente' : 'Abaixo 51%'}
                </span>
              </button>
              <button 
                onClick={() => {
                  if (canStartSecondCall) setPlenaryCall(2);
                }}
                disabled={!canStartSecondCall && plenaryCall === 1}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex flex-col items-center ${
                  plenaryCall === 2 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : canStartSecondCall
                      ? 'text-indigo-500 hover:bg-white cursor-pointer'
                      : 'text-slate-400 cursor-not-allowed opacity-60'
                }`}
              >
                2ª Chamada
                <span className={`text-[8px] opacity-70 ${totals.metQuorum2nd ? '' : (plenaryCall === 2 ? 'text-rose-200' : 'text-rose-400')}`}>
                  {totals.metQuorum2nd ? 'Suficiente' : 'Abaixo 33%'}
                </span>
              </button>
            </div>
            
            {plenaryCall === 1 && !totals.metQuorum1st && !timerOverride && timeLeft > 0 && (
              <div className="flex items-center gap-2 mr-2">
                <button 
                  onClick={() => setIsRunning(!isRunning)}
                  className="flex items-center gap-1 px-2 py-1 bg-indigo-100 rounded-lg text-[9px] font-black uppercase text-indigo-700 hover:bg-indigo-200 transition-colors cursor-pointer"
                >
                  {isRunning ? 'Pausar' : 'Iniciar'}
                </button>
                <Timer className={`w-3.5 h-3.5 text-amber-500 ${isRunning ? 'animate-pulse' : ''}`} />
                <span className="text-[10px] font-black text-amber-600 tracking-widest">{formatTime(timeLeft)} min</span>
                <div className="w-px h-3 bg-indigo-200 mx-1" />
                <button
                  onClick={() => { setTimerOverride(true); setIsRunning(false); }}
                  className="flex items-center gap-1 text-[9px] font-black uppercase text-indigo-500 hover:text-indigo-700 transition-colors cursor-pointer"
                >
                  <TimerReset className="w-3 h-3" /> Pular
                </button>
              </div>
            )}
          </div>

          <div className="hidden lg:block text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resultado</p>
            <p className={`text-sm font-black ${
              plenaryCall === 1 
                ? (totals.metQuorum1st ? 'text-emerald-500' : 'text-rose-500')
                : (totals.metQuorum2nd ? 'text-emerald-500' : 'text-rose-500')
            }`}>
              {plenaryCall === 1 
                ? (totals.metQuorum1st ? 'QUÓRUM ATINGIDO' : 'AGUARDAR QUÓRUM')
                : (totals.metQuorum2nd ? 'QUÓRUM ATINGIDO' : 'AGUARDAR QUÓRUM')}
            </p>
          </div>
        </motion.div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="bg-slate-50/70 border-b border-slate-100 grid grid-cols-12 px-6 md:px-8 py-3.5 text-[11px] font-black uppercase text-slate-500 tracking-wider">
          <div className="col-span-5 md:col-span-5">Membro</div>
          <div className="col-span-2 hidden md:block">Status Atual</div>
          <div className="col-span-7 md:col-span-5 text-right">Registrar</div>
        </div>
        
        <div className="divide-y divide-slate-100">
          {members.length === 0 ? (
            <div className="p-16 text-center text-slate-400 italic">
              Nenhum membro para realizar a chamada.
            </div>
          ) : (
            members.map((member, idx) => (
              <div key={member.id} className={`grid grid-cols-12 px-6 md:px-8 py-3.5 items-center ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                <div className="col-span-5 md:col-span-5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-[10px] shrink-0">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-bold text-slate-800 text-sm leading-tight truncate">{member.name}</span>
                    {justifications[member.id] && (
                      <span className="text-[9px] text-indigo-600 font-bold mt-0.5 truncate">Obs: {justifications[member.id]}</span>
                    )}
                  </div>
                </div>
                <div className="col-span-2 hidden md:block">
                  {!attendanceRecords[member.id] ? (
                    <span className="text-[10px] text-slate-400 italic font-medium">Pendente</span>
                  ) : (
                    <span className={`text-[10px] font-black uppercase tracking-wider ${
                      attendanceRecords[member.id] === 'presente' ? 'text-emerald-700' :
                      attendanceRecords[member.id] === 'ausente' ? 'text-rose-700' : 'text-amber-700'
                    }`}>
                      {attendanceRecords[member.id].replace('_', ' ')}
                    </span>
                  )}
                </div>
                <div className="col-span-7 md:col-span-5 flex justify-end gap-1.5 md:gap-2">
                  <button 
                    onClick={() => setAttendanceRecords(prev => ({ ...prev, [member.id]: 'presente' }))}
                    aria-label={`Marcar ${member.name} como presente`}
                    className={`w-11 h-11 md:w-auto md:h-auto md:px-3.5 md:py-2 rounded-xl text-xs md:text-[10px] font-black uppercase transition-all whitespace-nowrap cursor-pointer flex items-center justify-center ${
                      attendanceRecords[member.id] === 'presente' 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <span className="hidden sm:inline">Presente</span>
                    <span className="sm:hidden">P</span>
                  </button>
                  <button 
                    onClick={() => setAttendanceRecords(prev => ({ ...prev, [member.id]: 'ausente' }))}
                    aria-label={`Marcar ${member.name} como ausente`}
                    className={`w-11 h-11 md:w-auto md:h-auto md:px-3.5 md:py-2 rounded-xl text-xs md:text-[10px] font-black uppercase transition-all whitespace-nowrap cursor-pointer flex items-center justify-center ${
                      attendanceRecords[member.id] === 'ausente' 
                      ? 'bg-rose-600 text-white shadow-sm' 
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <span className="hidden sm:inline">Ausente</span>
                    <span className="sm:hidden">A</span>
                  </button>
                  <button 
                    onClick={() => {
                      setAttendanceRecords(prev => ({ ...prev, [member.id]: 'falta_justificada' }));
                      const text = prompt('Justificativa para ' + member.name);
                      if (text) setJustifications(prev => ({ ...prev, [member.id]: text }));
                    }}
                    aria-label={`Justificar falta de ${member.name}`}
                    className={`w-11 h-11 md:w-auto md:h-auto md:px-3.5 md:py-2 rounded-xl text-xs md:text-[10px] font-black uppercase transition-all whitespace-nowrap cursor-pointer flex items-center justify-center ${
                      attendanceRecords[member.id] === 'falta_justificada' 
                      ? 'bg-amber-600 text-white shadow-sm' 
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <span className="hidden sm:inline">Justificar</span>
                    <span className="sm:hidden">J</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};
