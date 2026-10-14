import React, { useState } from 'react';
import { localDB } from '../../lib/offlineDB';
import { Member, Role, Vote, Election } from '../../types';
import { Sparkles, Users, UserCheck, Play, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { formatMemberNameWithTitle } from '../../lib/memberUtils';

interface VotingSimulatorProps {
  activeElection: Election;
  members: Member[];
  presentMembers: Member[];
  pendingMembers: Member[];
  electedMemberIds: string[];
  onVoteCast?: () => void;
}

export const VotingSimulator: React.FC<VotingSimulatorProps> = ({
  activeElection,
  members,
  presentMembers,
  pendingMembers,
  electedMemberIds,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVoterId, setSelectedVoterId] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationPreset, setSimulationPreset] = useState<'random' | 'majority'>('random');
  const [targetWinnerId, setTargetWinnerId] = useState('');

  const currentRole = activeElection.currentRole;
  const currentBallot = activeElection.currentBallot;

  // Determine the eligible candidates list based on active ballot rules
  const declinedMembers = activeElection.declinedMembers || [];
  const registeredCandidates = activeElection.registeredCandidates || [];

  let candidatesList = presentMembers.filter(
    m => !declinedMembers.includes(m.id) && !electedMemberIds.includes(m.id)
  );

  // Apply ballot 3 runoff limits (top 2 only)
  if (currentBallot === 3 && activeElection.candidatesIds && activeElection.candidatesIds.length > 0) {
    candidatesList = candidatesList.filter(m => activeElection.candidatesIds!.includes(m.id));
  } else if (registeredCandidates.length > 0) {
    // Apply registered candidates limit
    candidatesList = candidatesList.filter(m => registeredCandidates.includes(m.id));
  }

  // Cast a single manual vote on behalf of a member
  const handleSingleSimulatedVote = async () => {
    if (!selectedVoterId || !selectedCandidateId) return;
    setIsSimulating(true);

    try {
      const newVote: Vote = {
        voterId: selectedVoterId,
        candidateId: selectedCandidateId,
        role: currentRole,
        ballotNumber: currentBallot,
        timestamp: Date.now()
      };

      const currentElection = localDB.getElections().find(e => e.id === activeElection.id) || activeElection;
      localDB.saveElection({
        ...currentElection,
        votes: [...(currentElection.votes || []), newVote]
      });

      setSelectedVoterId('');
      setSelectedCandidateId('');
    } catch (err) {
      console.error('Error simulating voting:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  // Run the batch simulation for all remaining pending members
  const handleBatchSimulation = async () => {
    if (pendingMembers.length === 0) {
      alert('Não há mais votantes pendentes nesta rodada!');
      return;
    }
    if (candidatesList.length === 0) {
      alert('Não há candidatos elegíveis disponíveis para receber os votos!');
      return;
    }

    if (simulationPreset === 'majority' && !targetWinnerId) {
      alert('Selecione quem será o vencedor da maioria!');
      return;
    }

    setIsSimulating(true);
    try {
      const simulatedVotes: Vote[] = [];

      pendingMembers.forEach((voter) => {
        let chosenCandidateId = '';

        if (simulationPreset === 'majority' && targetWinnerId) {
          // 70% probability for the chosen candidate to win absolute majority, 
          // 30% split across others to simulate realistic split voting
          if (Math.random() < 0.70) {
            chosenCandidateId = targetWinnerId;
          } else {
            const alternativeCandidates = candidatesList.filter(c => c.id !== targetWinnerId);
            if (alternativeCandidates.length > 0) {
              const randomIdx = Math.floor(Math.random() * alternativeCandidates.length);
              chosenCandidateId = alternativeCandidates[randomIdx].id;
            } else {
              chosenCandidateId = targetWinnerId;
            }
          }
        } else {
          // Fully random vote distribution among all available candidates
          const randomIdx = Math.floor(Math.random() * candidatesList.length);
          chosenCandidateId = candidatesList[randomIdx].id;
        }

        simulatedVotes.push({
          voterId: voter.id,
          candidateId: chosenCandidateId,
          role: currentRole,
          ballotNumber: currentBallot,
          timestamp: Date.now() + Math.floor(Math.random() * 1000) // spread millisecond offsets
        });
      });

      // Atomically update election with all votes
      const currentElection = localDB.getElections().find(e => e.id === activeElection.id) || activeElection;
      localDB.saveElection({
        ...currentElection,
        votes: [...(currentElection.votes || []), ...simulatedVotes]
      });

    } catch (err) {
      console.error('Error executing batch simulation:', err);
      alert('Erro ao realizar a simulação automática. Verifique os logs.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="bg-amber-50/50 border border-amber-200 rounded-3xl p-5 shadow-sm space-y-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <div>
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-amber-800">
              Simulador de Votos (Modo Teste)
            </h4>
            <p className="text-[10px] text-amber-600 font-medium">Escreva votos fictícios para testes rápidos</p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-amber-700" />
        ) : (
          <ChevronDown className="w-5 h-5 text-amber-700" />
        )}
      </button>

      {isOpen && (
        <div className="space-y-4 pt-2 border-t border-amber-200/60 text-sm animate-in fade-in duration-300">
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2 bg-white/70 p-3 rounded-2xl border border-amber-100/50">
            <div className="text-center">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Total Presentes</span>
              <span className="font-mono text-base font-black text-slate-700">{presentMembers.length}</span>
            </div>
            <div className="text-center border-x border-amber-100/70">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Votos Confirmados</span>
              <span className="font-mono text-base font-black text-emerald-600">
                {activeElection.votes.filter(v => v.role === currentRole && v.ballotNumber === currentBallot).length}
              </span>
            </div>
            <div className="text-center">
              <span className="block text-[10px] uppercase font-bold text-slate-400">Pendente Votar</span>
              <span className="font-mono text-base font-black text-amber-600">{pendingMembers.length}</span>
            </div>
          </div>

          {/* Dev Notice */}
          <div className="bg-amber-100/40 text-amber-900 leading-relaxed text-[10px] p-3 rounded-2xl border border-amber-100">
            <span className="font-bold flex items-center gap-1.5 text-[11px] mb-1">
              <HelpCircle className="w-3.5 h-3.5 shrink-0" /> Como deletar esse componente?
            </span>
            Este simulador é 100% autossuficiente e está implementado apenas no arquivo 
            <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[9px] mx-1">VotingSimulator.tsx</code>. 
            Para retirá-lo de vez antes de lançar em produção, basta deletá-lo do projeto e remover sua tag no painel do administrador.
          </div>

          {pendingMembers.length === 0 ? (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-center">
              <UserCheck className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
              <p className="text-xs font-bold text-emerald-800">Todos os sócios votaram!</p>
              <p className="text-[10px] text-emerald-600 mt-0.5">Avance o escrutínio ou conclua o cargo no painel acima.</p>
            </div>
          ) : (
            <>
              {/* Option 1: Complete remaining votes in batch */}
              <div className="p-4 bg-white rounded-2xl border border-amber-100 space-y-3.5 shadow-sm">
                <span className="font-black text-[10px] uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Votação Rápida em Lote
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSimulationPreset('random')}
                    className={`px-3 py-2 text-[11px] font-bold rounded-xl border transition-all ${
                      simulationPreset === 'random'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Votos Aleatórios
                  </button>
                  <button
                    onClick={() => setSimulationPreset('majority')}
                    className={`px-3 py-2 text-[11px] font-bold rounded-xl border transition-all ${
                      simulationPreset === 'majority'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Votos com Vencedor
                  </button>
                </div>

                {simulationPreset === 'majority' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-slate-500">Escolher Favorito (votos direcionados)</label>
                    <select
                      value={targetWinnerId}
                      onChange={(e) => setTargetWinnerId(e.target.value)}
                      className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="">Selecione o candidato favorito...</option>
                      {candidatesList.map(c => (
                        <option key={c.id} value={c.id}>{formatMemberNameWithTitle(c)}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  onClick={handleBatchSimulation}
                  disabled={isSimulating}
                  className="w-full h-11 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-sm disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 animate-pulse" />
                  Simular Restantes ({pendingMembers.length} Votos)
                </button>
              </div>

              {/* Option 2: Cast step-by-step manual votes representing other members */}
              <div className="p-4 bg-white rounded-2xl border border-amber-100 space-y-3 shadow-sm">
                <span className="font-black text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Voto Manual Simulado
                </span>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Votar como:</label>
                    <select
                      value={selectedVoterId}
                      onChange={(e) => setSelectedVoterId(e.target.value)}
                      className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="">Selecione o sócio ausente/pendente...</option>
                      {pendingMembers.map(m => (
                        <option key={m.id} value={m.id}>{formatMemberNameWithTitle(m)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Candidato Escolhido:</label>
                    <select
                      value={selectedCandidateId}
                      onChange={(e) => setSelectedCandidateId(e.target.value)}
                      className="w-full h-9 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="">Selecione o candidato...</option>
                      {candidatesList.map(c => (
                        <option key={c.id} value={c.id}>{formatMemberNameWithTitle(c)}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleSingleSimulatedVote}
                    disabled={isSimulating || !selectedVoterId || !selectedCandidateId}
                    className="w-full h-10 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    Confirmar Voto Simulado
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      )}
    </div>
  );
};
