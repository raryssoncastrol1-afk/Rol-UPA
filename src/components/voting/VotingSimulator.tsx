import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle, 
  Trophy, 
  Users, 
  CheckCircle2, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { Election, Member, Role } from '../../types';
import { ROLE_NAMES } from '../../lib/electionUtils';
import { formatMemberNameWithTitle } from '../../lib/memberUtils';

interface VotingSimulatorProps {
  activeElection: Election;
  members: Member[];
  presentMembers: Member[];
  pendingMembers: Member[];
  electedMemberIds: string[];
}

export const VotingSimulator: React.FC<VotingSimulatorProps> = ({
  activeElection,
  members,
  presentMembers,
  pendingMembers,
  electedMemberIds,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Computa votos do escrutínio atual para o cargo em disputa
  const currentVotes = useMemo(() => {
    return (activeElection.votes || []).filter(
      v => v.role === activeElection.currentRole && v.ballotNumber === activeElection.currentBallot
    );
  }, [activeElection]);

  const presentCount = activeElection.presentCount || presentMembers.length || 0;
  const majorityRequired = Math.floor(presentCount / 2) + 1;
  const remainingVotes = Math.max(0, presentCount - currentVotes.length);

  // Contagem de votos por candidato
  const voteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    currentVotes.forEach(v => {
      counts[v.candidateId] = (counts[v.candidateId] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([candidateId, votes]) => {
        const member = members.find(m => m.id === candidateId);
        return {
          candidateId,
          name: member ? formatMemberNameWithTitle(member) : candidateId,
          votes,
          percentage: currentVotes.length > 0 ? (votes / currentVotes.length) * 100 : 0,
        };
      })
      .sort((a, b) => b.votes - a.votes);
  }, [currentVotes, members]);

  const leader = voteCounts[0] || null;
  const second = voteCounts[1] || null;

  // Análise da situação atual
  const leaderHasMajority = leader && leader.votes >= majorityRequired;
  const leaderCanWinNow = leader && (leader.votes + remainingVotes >= majorityRequired);

  return (
    <div className="bg-white dark:bg-[#0b1220] p-5 rounded-2xl border border-slate-200 dark:border-[#1e293b] shadow-xs space-y-3">
      <div 
        onClick={() => setIsExpanded(prev => !prev)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs text-slate-800 dark:text-[#EDEDE8] flex items-center gap-1.5">
              Simulador de Escrutínio
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-mono">
                {activeElection.currentBallot}º Turno
              </span>
            </h4>
            <p className="text-[10px] text-slate-500 dark:text-[#8A968F]">
              Projeção matemática para maioria absoluta
            </p>
          </div>
        </div>

        <button 
          type="button" 
          aria-label={isExpanded ? "Recolher simulador" : "Expandir simulador"}
          className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Visão Rápida (sempre visível) */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-[#1e293b] text-center">
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#030712] border border-slate-100 dark:border-[#1e293b]">
          <span className="text-[10px] text-slate-400 block font-semibold">Exigido</span>
          <span className="text-sm font-mono font-bold text-slate-700 dark:text-[#EDEDE8]">{majorityRequired}</span>
          <span className="text-[9px] text-slate-400 block">votos (50%+1)</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#030712] border border-slate-100 dark:border-[#1e293b]">
          <span className="text-[10px] text-slate-400 block font-semibold">Urna</span>
          <span className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">{currentVotes.length}</span>
          <span className="text-[9px] text-slate-400 block">computados</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#030712] border border-slate-100 dark:border-[#1e293b]">
          <span className="text-[10px] text-slate-400 block font-semibold">Pendentes</span>
          <span className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400">{pendingMembers.length}</span>
          <span className="text-[9px] text-slate-400 block">a votar</span>
        </div>
      </div>

      {/* Projeção Atual */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#030712] border border-slate-200/60 dark:border-[#1e293b] text-xs">
        {leaderHasMajority ? (
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              <strong>{leader.name}</strong> já alcançou a maioria absoluta ({leader.votes}/{majorityRequired}) e está eleito.
            </span>
          </div>
        ) : leaderCanWinNow ? (
          <div className="flex items-start gap-2 text-slate-600 dark:text-[#8A968F]">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              Líder: <strong>{leader?.name}</strong> com {leader?.votes} votos. Necessita de mais{' '}
              <strong>{majorityRequired - (leader?.votes || 0)}</strong> voto(s) dos {remainingVotes} pendentes.
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-2 text-slate-600 dark:text-[#8A968F]">
            <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              Nenhum candidato atingiu {majorityRequired} votos ainda.{' '}
              {activeElection.currentBallot < 3 ? 'Poderá haver novo escrutínio.' : 'Vencedor decidido por maioria simples ou critérios estatutários.'}
            </span>
          </div>
        )}
      </div>

      {/* Detalhes Expandidos */}
      {isExpanded && (
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-[#1e293b]">
          <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Parcial do Escrutínio
          </h5>

          {voteCounts.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Nenhum voto depositado ainda neste escrutínio.</p>
          ) : (
            <div className="space-y-2">
              {voteCounts.map((cand, idx) => (
                <div key={cand.candidateId} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 overflow-hidden mr-2">
                    <span className="font-mono text-[10px] text-slate-400 w-4">{idx + 1}º</span>
                    <span className="font-semibold text-slate-700 dark:text-[#EDEDE8] truncate">{cand.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono font-bold text-slate-800 dark:text-[#EDEDE8]">{cand.votes} votos</span>
                    <span className="text-[10px] text-slate-400 font-mono">({cand.percentage.toFixed(0)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
