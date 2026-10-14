import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Vote as VoteIcon, 
  Plus, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  Search, 
  ArrowLeft, 
  BarChart3,
  Users,
  AlertCircle,
  Trophy,
  History,
  Trash2,
  FileText,
  Gavel,
  RotateCcw,
  Award,
  Sliders,
  UserPlus
} from 'lucide-react';
import { useMembers, useElections, useSessions } from '../../hooks/useData';
import { Election, Role, Vote } from '../../types';
import { VotingSimulator } from './VotingSimulator';
import { ElectionReportModal } from './ElectionReportModal';
import { ROLE_NAMES, ROLES_LIST, getElectedMemberIds } from '../../lib/electionUtils';
import { formatMemberNameWithTitle, compareMembersByName } from '../../lib/memberUtils';

export interface VotingStationProps {
  societyId?: string;
  voterMemberId?: string;
}

export const VotingStation: React.FC<VotingStationProps> = ({ voterMemberId }) => {
  const { members } = useMembers();
  const { elections, addElection, updateElection, removeElection, castVote } = useElections();
  const { sessions } = useSessions();

  const [mode, setMode] = useState<'list' | 'admin'>('list');
  const [selectedElectionId, setSelectedElectionId] = useState<string | null>(null);

  // Admin Create state
  const [showCreate, setShowCreate] = useState(false);
  const [newElectionName, setNewElectionName] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showQuorumWarning, setShowQuorumWarning] = useState<{show: boolean, presentCount: number, quorumRequired: number}>({show: false, presentCount: 0, quorumRequired: 0});
  const [showPendingVoters, setShowPendingVoters] = useState(false);
  const [selectedCandidateToAdd, setSelectedCandidateToAdd] = useState('');
  const [candidateToConfirm, setCandidateToConfirm] = useState<any | null>(null);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);
  const [showReportElectionId, setShowReportElectionId] = useState<string | null>(null);
  const [forceClosedBallot, setForceClosedBallot] = useState<number | null>(null);
  const [tieWinnerId, setTieWinnerId] = useState<string | null>(null);
  const [showMesaMenu, setShowMesaMenu] = useState(false);
  const [showAclamacaoModal, setShowAclamacaoModal] = useState(false);
  const [showEditQuorumModal, setShowEditQuorumModal] = useState(false);
  const [newQuorumInput, setNewQuorumInput] = useState<number>(0);
  const [aclamacaoCandidateId, setAclamacaoCandidateId] = useState<string>('');
  const [aclamacaoReason, setAclamacaoReason] = useState<string>('Aclamação unânime por deliberação do plenário');
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void | Promise<void>;
  }>({
    show: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    onConfirm: () => {}
  });

  const activeElection = elections.find(e => e.id === selectedElectionId);
  const activeVoterElection = elections.find(e => !e.archived);

  const confirmCreateElection = async (quorumRequired: number, presentCount: number) => {
    // 1. Arquiva automaticamente qualquer eleição anterior aberta para evitar colisão com os eleitores
    const unarchived = elections.filter(e => !e.archived);
    for (const old of unarchived) {
      await updateElection(old.id, { archived: true });
    }

    // 2. Cria a nova eleição como a única ativa do sistema
    const newId = await addElection({
      name: newElectionName.trim(),
      currentRole: Role.PRESIDENT,
      currentBallot: 1,
      quorumRequired: quorumRequired,
      presentCount: presentCount,
      votes: [],
      archived: false,
      ...(selectedSessionId ? { sessionId: selectedSessionId } : {}),
    });

    setNewElectionName('');
    setShowCreate(false);
    setShowQuorumWarning({show: false, presentCount: 0, quorumRequired: 0});
    if (newId) {
      setSelectedElectionId(newId);
      setMode('admin');
    }
  };

  const handleCreateElection = async () => {
    if (!newElectionName.trim() || !selectedSessionId) {
      alert('Selecione uma sessão e dê um nome à eleição.');
      return;
    }
    
    const session = sessions.find(s => s.id === selectedSessionId);
    const presentCount = session?.records.filter(r => r.status === 'presente').length || 0;
    const totalMembers = members.length;
    const quorumRequired = Math.floor(totalMembers / 2) + 1;

    if (presentCount < quorumRequired) {
      setShowQuorumWarning({show: true, presentCount, quorumRequired});
      return;
    }

    await confirmCreateElection(quorumRequired, presentCount);
  };

  const renderElectionList = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-display font-bold text-uph-green">Eleições UPH</h2>
          <p className="text-slate-600 text-sm">Controle rigoroso de escrutínios e maioria absoluta.</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="bg-uph-green text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-uph-green-hover transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Configurar Eleição
        </button>
      </div>

      {showCreate && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4">
          <h3 className="font-bold text-slate-800">Nova Junta de Eleição</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Título</label>
              <input 
                type="text" 
                value={newElectionName}
                onChange={e => setNewElectionName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                placeholder="Ex: Eleições Diretoria 2024"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sessão Plenária de Base (Chamada)</label>
              <select 
                value={selectedSessionId}
                onChange={e => setSelectedSessionId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
              >
                <option value="">Selecione a sessão...</option>
                {sessions.filter(s => s.type === 'plenaria').map(s => (
                  <option key={s.id} value={s.id}>
                    {new Date(s.date).toLocaleDateString()} - {s.callNumber}ª Chamada
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowCreate(false)} className="px-6 py-2 text-slate-500 font-bold">Cancelar</button>
            <button onClick={handleCreateElection} className="bg-uph-green hover:bg-uph-green-hover text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-emerald-950/20 cursor-pointer">Iniciar Processo</button>
          </div>
        </div>
      )}

      {showQuorumWarning.show && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Atenção ao Quórum</h3>
            <p className="text-slate-600 mb-6 flex flex-col gap-2">
              <span>O quórum exigido é de <strong>{showQuorumWarning.quorumRequired}</strong> sócios.</span>
              <span>No momento temos apenas <strong>{showQuorumWarning.presentCount}</strong> presentes.</span>
              <span className="mt-2 text-rose-600 font-medium">Deseja prosseguir mesmo assim?</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowQuorumWarning({show: false, presentCount: 0, quorumRequired: 0})}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmCreateElection(showQuorumWarning.quorumRequired, showQuorumWarning.presentCount)}
                className="flex-1 px-4 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors"
              >
                Prosseguir
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {elections.map((election) => (
          <div key={election.id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm hover:shadow-md transition-shadow gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl shrink-0 ${election.archived ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-600'}`}>
                <VoteIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                  {election.name}
                  {election.archived && <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded uppercase tracking-widest text-slate-500">Arquivado</span>}
                </h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" /> Presentes: {Number(election.presentCount) || 0}</span>
                  <span className="flex items-center gap-1 font-medium text-emerald-700"><CheckCircle2 className="w-4 h-4" /> Maioria: {Number(election.quorumRequired) || 0}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {election.votes && election.votes.length > 0 && (
                <button
                  onClick={() => setShowReportElectionId(election.id)}
                  className="px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-sans font-bold text-xs flex items-center gap-1.5 border border-emerald-100 shadow-sm"
                  title="Gerar Relatório da Eleição"
                >
                  <FileText className="w-4 h-4 text-emerald-600 font-bold" />
                  Relatório
                </button>
              )}
              <button 
                onClick={() => { setSelectedElectionId(election.id); setMode('admin'); }}
                className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 flex-1 sm:flex-none justify-center flex items-center gap-1.5 border border-slate-200"
                title="Administrar"
              >
                <Shield className="w-5 h-5" />
                <span className="sm:hidden font-bold text-xs font-sans">Administrar</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAdmin = () => {
    if (!activeElection) return null;

    const currentVotes = activeElection.votes.filter(
      v => v.role === activeElection.currentRole && v.ballotNumber === activeElection.currentBallot
    );

    const declinedMembers = activeElection.declinedMembers || [];
    const registeredCandidates = activeElection.registeredCandidates || [];

    const electionSession = sessions.find(s => s.id === activeElection.sessionId);
    const presentMembers = electionSession 
      ? members.filter(m => electionSession.records.find(r => r.memberId === m.id && r.status === 'presente'))
      : members;

    const votedMemberIds = currentVotes.map(v => v.voterId);
    const pendingMembers = presentMembers.filter(m => !votedMemberIds.includes(m.id));
    const isAllVoted = presentMembers.length > 0 && pendingMembers.length === 0;
    const isBallotClosed = isAllVoted || (forceClosedBallot === activeElection.currentBallot);

    const electedMemberIds = getElectedMemberIds(
      activeElection.votes,
      activeElection.presentCount,
      activeElection.currentRole,
      activeElection.manualWinners
    );
    
    const voteCounts = currentVotes.reduce((acc, vote) => {
      acc[vote.candidateId] = (acc[vote.candidateId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Ensure all registered candidates are represented
    registeredCandidates.forEach((candId) => {
      if (voteCounts[candId] === undefined) {
        voteCounts[candId] = 0;
      }
    });

    const sortedCandidates = Object.entries(voteCounts)
      .filter(([id]) => !declinedMembers.includes(id) && !electedMemberIds.includes(id))
      .sort(([, a], [, b]) => Number(b) - Number(a));
      
    const presentCount = Number(activeElection.presentCount) || 0;
    const majorityRequired = Math.floor(presentCount / 2) + 1;

    let computedWinnerId: string | undefined = undefined;
    let isTieInBallot3 = false;
    let tiedCandidatesInBallot3: string[] = [];

    // Prioridade 1: Vencedor declarado manualmente / por aclamação pela mesa
    const manualWinnerObj = activeElection.manualWinners?.[activeElection.currentRole];
    if (manualWinnerObj) {
      computedWinnerId = manualWinnerObj.memberId;
    } else if (isBallotClosed && sortedCandidates.length > 0) {
      if (activeElection.currentBallot === 3) {
        // 3º escrutínio: Maioria Relativa entre os mais votados
        const first = sortedCandidates[0];
        const second = sortedCandidates[1];
        if (first && Number(first[1]) > 0) {
          if (!second || Number(first[1]) > Number(second[1])) {
            computedWinnerId = first[0];
          } else if (Number(first[1]) === Number(second[1])) {
            isTieInBallot3 = true;
            tiedCandidatesInBallot3 = [first[0], second[0]];
          }
        }
      } else {
        // 1º e 2º escrutínio: Maioria Absoluta dos presentes/votantes
        computedWinnerId = sortedCandidates.find(([, count]) => Number(count) >= majorityRequired)?.[0];
      }
    }

    const winnerId = tieWinnerId || computedWinnerId;
    const winner = winnerId ? members.find(m => m.id === winnerId) : undefined;

    const handleForceCloseBallot = () => {
      setConfirmDialog({
        show: true,
        title: 'Encerrar Votação da Rodada',
        message: `Ainda constam ${pendingMembers.length} membro(s) que não votaram. Deseja encerrar a votação e apurar com os ${currentVotes.length} voto(s) já recebidos?`,
        confirmText: 'Encerrar e Apurar',
        onConfirm: () => {
          setForceClosedBallot(activeElection.currentBallot);
          setConfirmDialog(prev => ({ ...prev, show: false }));
        }
      });
    };

    const handleResetBallot3Tie = () => {
      setConfirmDialog({
        show: true,
        title: 'Novo Escrutínio de Desempate',
        message: `Deseja descartar os votos do 3º escrutínio e abrir uma nova votação de desempate para o cargo de ${ROLE_NAMES[activeElection.currentRole]}?`,
        confirmText: 'Iniciar Nova Votação',
        onConfirm: () => {
          const votesWithoutBallot3 = activeElection.votes.filter(
            v => !(v.role === activeElection.currentRole && v.ballotNumber === 3)
          );
          updateElection(activeElection.id, { votes: votesWithoutBallot3 });
          setForceClosedBallot(null);
          setTieWinnerId(null);
          setConfirmDialog(prev => ({ ...prev, show: false }));
        }
      });
    };

    const handleAddCandidate = (memberId: string) => {
      if (!memberId) return;
      const currentReg = activeElection.registeredCandidates || [];
      if (!currentReg.includes(memberId)) {
        updateElection(activeElection.id, {
          registeredCandidates: [...currentReg, memberId]
        });
      }
      setSelectedCandidateToAdd('');
    };

    const handleRemoveCandidate = (memberId: string) => {
      const currentReg = activeElection.registeredCandidates || [];
      updateElection(activeElection.id, {
        registeredCandidates: currentReg.filter(id => id !== memberId)
      });
    };

    const handleDecline = (memberId: string, memberName: string) => {
      setConfirmDialog({
        show: true,
        title: 'Registrar Declínio de Candidatura',
        message: `O candidato ${memberName} declinou do cargo. A eleição para este cargo (${ROLE_NAMES[activeElection.currentRole]}) será reiniciada a partir do 1º escrutínio, excluindo o candidato declinante. Deseja confirmar?`,
        confirmText: 'Confirmar e Reiniciar',
        onConfirm: () => {
          const otherRolesVotes = activeElection.votes.filter(v => v.role !== activeElection.currentRole);
          updateElection(activeElection.id, { 
            declinedMembers: [...declinedMembers, memberId],
            currentBallot: 1,
            candidatesIds: [],
            votes: otherRolesVotes
          });
          setForceClosedBallot(null);
          setTieWinnerId(null);
          setConfirmDialog(prev => ({ ...prev, show: false }));
        }
      });
    };

    const handleNextBallot = () => {
      setForceClosedBallot(null);
      setTieWinnerId(null);
      if (activeElection.currentBallot === 1) {
        updateElection(activeElection.id, { currentBallot: 2 });
      } else if (activeElection.currentBallot === 2) {
        // Runoff logic: Get top 2, or include ties for 2nd
        if (sortedCandidates.length <= 2) {
          const top = sortedCandidates.map(([id]) => id);
          updateElection(activeElection.id, { currentBallot: 3, candidatesIds: top });
        } else {
          const secondVotes = Number(sortedCandidates[1]?.[1] || 0);
          const topCandidates = sortedCandidates
            .filter(([, count]) => Number(count) >= secondVotes && Number(count) > 0)
            .map(([id]) => id);
          updateElection(activeElection.id, { 
            currentBallot: 3, 
            candidatesIds: topCandidates.length > 0 ? topCandidates : sortedCandidates.slice(0, 2).map(([id]) => id) 
          });
        }
      }
    };

    const handleNextRole = () => {
      setForceClosedBallot(null);
      setTieWinnerId(null);
      const roles = ROLES_LIST;
      const currentIndex = roles.indexOf(activeElection.currentRole);
      if (currentIndex < roles.length - 1) {
        updateElection(activeElection.id, { 
          currentRole: roles[currentIndex + 1], 
          currentBallot: 1, 
          candidatesIds: [], // reset runoff
          votes: activeElection.votes // preserve history
        });
      } else {
        updateElection(activeElection.id, { archived: true });
        setMode('list');
      }
    };

    // --- AÇÕES DA MESA (OVERRIDE / BYPASS) ---
    const handleAnularBallot = () => {
      setConfirmDialog({
        show: true,
        title: 'Anular Escrutínio Atual',
        message: `Tem certeza que deseja anular os votos do ${activeElection.currentBallot}º escrutínio para ${ROLE_NAMES[activeElection.currentRole]}? A urna será limpa e reaberta para todos votarem novamente.`,
        confirmText: 'Confirmar Anulação',
        onConfirm: () => {
          const filteredVotes = activeElection.votes.filter(
            v => !(v.role === activeElection.currentRole && v.ballotNumber === activeElection.currentBallot)
          );
          const newNotes = [
            ...(activeElection.overrideNotes || []),
            {
              id: `ovr-${Date.now()}`,
              timestamp: Date.now(),
              role: activeElection.currentRole,
              ballot: activeElection.currentBallot,
              action: 'anulacao_escrutinio' as const,
              description: `O ${activeElection.currentBallot}º escrutínio para ${ROLE_NAMES[activeElection.currentRole]} foi anulado por deliberação da mesa.`
            }
          ];
          updateElection(activeElection.id, { 
            votes: filteredVotes,
            overrideNotes: newNotes
          });
          setForceClosedBallot(null);
          setTieWinnerId(null);
          setConfirmDialog(prev => ({ ...prev, show: false }));
        }
      });
    };

    const handleHomologarAclamacao = (memberId: string, reasonText: string) => {
      const cand = members.find(m => m.id === memberId);
      if (!cand) return;
      const newManualWinners = {
        ...(activeElection.manualWinners || {}),
        [activeElection.currentRole]: {
          memberId: memberId,
          reason: 'aclamacao' as const,
          detail: reasonText,
          timestamp: Date.now()
        }
      };
      const newNotes = [
        ...(activeElection.overrideNotes || []),
        {
          id: `ovr-${Date.now()}`,
          timestamp: Date.now(),
          role: activeElection.currentRole,
          action: 'aclamacao' as const,
          description: `${cand.name} foi eleito(a) para ${ROLE_NAMES[activeElection.currentRole]} por aclamação/consenso (${reasonText}).`
        }
      ];
      updateElection(activeElection.id, {
        manualWinners: newManualWinners,
        overrideNotes: newNotes
      });
      setShowAclamacaoModal(false);
      setAclamacaoCandidateId('');
    };

    const handleAjustarQuorum = (novoNumeroPresentes: number) => {
      if (novoNumeroPresentes <= 0) return;
      const novoQuorumRequired = Math.floor(novoNumeroPresentes / 2) + 1;
      const newNotes = [
        ...(activeElection.overrideNotes || []),
        {
          id: `ovr-${Date.now()}`,
          timestamp: Date.now(),
          role: activeElection.currentRole,
          action: 'ajuste_quorum' as const,
          description: `Quórum de presentes ajustado de ${activeElection.presentCount} para ${novoNumeroPresentes} (Nova maioria: ${novoQuorumRequired}).`
        }
      ];
      updateElection(activeElection.id, {
        presentCount: novoNumeroPresentes,
        quorumRequired: novoQuorumRequired,
        overrideNotes: newNotes
      });
      setShowEditQuorumModal(false);
    };

    // Reactively close modal when everyone has voted
    if (isAllVoted && showPendingVoters) {
      setShowPendingVoters(false);
    }

    return (
      <div className="space-y-6">
        {isAllVoted && presentMembers.length > 0 && !winner && currentVotes.length > 0 && (
          <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <p className="font-bold">Todos os membros presentes já votaram!</p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={() => setMode('list')} className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800">
              <ArrowLeft className="w-4 h-4" /> Sair
            </button>
            {!activeElection.archived && (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  setShowCancelConfirm(true);
                }}
                className="flex items-center gap-2 text-rose-600 font-bold hover:text-rose-800"
              >
                <X className="w-4 h-4" /> Cancelar Eleição
              </button>
            )}
            <button 
              onClick={(e) => {
                e.preventDefault();
                setShowDeleteConfirm(true);
              }}
              className="flex items-center gap-2 text-red-600 font-bold hover:text-red-800 ml-4 font-sans"
            >
              <Trash2 className="w-4 h-4" /> Excluir
            </button>
            {activeElection.votes && activeElection.votes.length > 0 && (
              <button 
                onClick={() => setShowReportElectionId(activeElection.id)} 
                className="flex items-center gap-1.5 text-emerald-700 font-sans font-bold hover:text-emerald-900 ml-4 border-l border-slate-200 pl-4 text-sm"
                title="Visualizar Relatório de Eleição"
              >
                <FileText className="w-4 h-4 text-emerald-600" /> Relatório
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {!activeElection.archived && (
              <button
                onClick={() => setShowMesaMenu(!showMesaMenu)}
                className="flex items-center gap-2 px-3.5 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                title="Ações Extraordinárias da Mesa Presidencial"
              >
                <Gavel className="w-4 h-4 text-indigo-600" />
                Ações da Mesa
              </button>
            )}
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
              <span className="text-xs sm:text-sm font-bold truncate">
                Presentes: {Number(activeElection.presentCount) || 0} | Maioria: {majorityRequired}
              </span>
              {!activeElection.archived && (
                <button
                  onClick={() => {
                    setNewQuorumInput(Number(activeElection.presentCount) || 0);
                    setShowEditQuorumModal(true);
                  }}
                  className="p-1 hover:bg-emerald-200/60 rounded-md text-emerald-800 transition-colors cursor-pointer"
                  title="Ajustar Quórum de Presentes"
                >
                  <Sliders className="w-3.5 h-3.5" />
                </button>
              )}
              <button 
                onClick={() => setShowPendingVoters(true)}
                className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors pointer shadow-sm shadow-emerald-900/5 text-sm ml-2"
              >
                <Users className="w-4 h-4" /> Faltam Votar <span className="bg-emerald-200 text-emerald-800 font-black px-1.5 rounded-md min-w-[20px] text-center">{pendingMembers.length}</span>
              </button>
            </div>
          </div>
        </div>

        {showPendingVoters && (
          <div className="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Membros Pendentes</h3>
                  <p className="text-slate-500 text-sm">Atualização em tempo real</p>
                </div>
                <button onClick={() => setShowPendingVoters(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>
              
              <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {pendingMembers.length === 0 ? (
                  <div className="text-center py-10 flex flex-col items-center justify-center border-2 border-dashed border-emerald-100 rounded-2xl">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2" />
                    <p className="text-emerald-600 font-bold">Todos votaram!</p>
                  </div>
                ) : (
                  pendingMembers.map(m => (
                    <div key={m.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs shrink-0">
                        {m.name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-700 truncate">{m.name}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <button onClick={() => setShowPendingVoters(false)} className="px-6 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Excluir Eleição</h3>
              <p className="text-slate-600 mb-6">
                ATENÇÃO: A eleição será excluída do sistema. Não é possível desfazer. Deseja continuar?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={async () => {
                    try {
                      await removeElection(activeElection.id);
                      setShowDeleteConfirm(false);
                      setMode('list');
                    } catch (error) {
                      console.error(error);
                      alert('Erro ao excluir eleição.');
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

        {showCancelConfirm && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Cancelar Eleição</h3>
              <p className="text-slate-600 mb-6">
                ATENÇÃO: Esta ação cancelará a eleição permanentemente. Deseja continuar?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Voltar
                </button>
                <button
                  onClick={async () => {
                    try {
                      await updateElection(activeElection.id, { archived: true });
                      setShowCancelConfirm(false);
                      setMode('list');
                    } catch (error) {
                      console.error(error);
                      alert('Erro ao cancelar eleição.');
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
                >
                  Confirmar Cancelamento
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Menu de Ações da Mesa (Overrides) */}
        {showMesaMenu && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Gavel className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800">Ações da Mesa Presidencial</h3>
                    <p className="text-xs text-slate-500">Deliberações soberanas e ajustes regimentais</p>
                  </div>
                </div>
                <button onClick={() => setShowMesaMenu(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowMesaMenu(false);
                    setShowAclamacaoModal(true);
                  }}
                  className="w-full text-left p-4 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-2xl transition-all group flex items-start gap-4 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 group-hover:text-indigo-950">Homologar Eleição por Aclamação</h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Para quando o plenário propõe chapa/indicação única aprovada com palmas e sem votos digitais.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowMesaMenu(false);
                    handleAnularBallot();
                  }}
                  className="w-full text-left p-4 bg-slate-50 hover:bg-rose-50/50 border border-slate-200 hover:border-rose-300 rounded-2xl transition-all group flex items-start gap-4 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 group-hover:text-rose-950">Anular Escrutínio Atual e Reabrir Urna</h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Zera apenas os votos deste {activeElection.currentBallot}º escrutínio para {ROLE_NAMES[activeElection.currentRole]} e reabre para votação imediata.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowMesaMenu(false);
                    setNewQuorumInput(Number(activeElection.presentCount) || 0);
                    setShowEditQuorumModal(true);
                  }}
                  className="w-full text-left p-4 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-2xl transition-all group flex items-start gap-4 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 group-hover:text-emerald-950">Ajustar Contagem de Presentes / Quórum</h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Altera a base de membros presentes caso irmãos tenham chegado ou precisado sair da assembleia.
                    </p>
                  </div>
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowMesaMenu(false)}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Homologar por Aclamação */}
        {showAclamacaoModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Eleição por Aclamação</h3>
                  <p className="text-xs text-slate-500">Cargo: {ROLE_NAMES[activeElection.currentRole]}</p>
                </div>
                <button onClick={() => setShowAclamacaoModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Membro Escolhido
                  </label>
                  <select
                    value={aclamacaoCandidateId}
                    onChange={(e) => setAclamacaoCandidateId(e.target.value)}
                    className="w-full h-11 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Selecione o membro eleito...</option>
                    {members
                      .filter(m => !electedMemberIds.includes(m.id))
                      .sort(compareMembersByName)
                      .map(m => (
                        <option key={m.id} value={m.id}>
                          {formatMemberNameWithTitle(m)} {m.cargo ? `(${m.cargo})` : ''}
                        </option>
                      ))
                    }
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Justificativa / Deliberação do Plenário
                  </label>
                  <input
                    type="text"
                    value={aclamacaoReason}
                    onChange={(e) => setAclamacaoReason(e.target.value)}
                    className="w-full h-11 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ex: Aclamação unânime por proposta da mesa"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAclamacaoModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={!aclamacaoCandidateId}
                  onClick={() => handleHomologarAclamacao(aclamacaoCandidateId, aclamacaoReason)}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50 shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  Homologar Eleito
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Ajustar Quórum de Presentes */}
        {showEditQuorumModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Ajustar Presentes / Quórum</h3>
                  <p className="text-xs text-slate-500">Recalcula a maioria absoluta do escrutínio</p>
                </div>
                <button onClick={() => setShowEditQuorumModal(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Número de Membros Presentes Votantes
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newQuorumInput}
                    onChange={(e) => setNewQuorumInput(parseInt(e.target.value, 10) || 0)}
                    className="w-full h-11 px-3 text-lg font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-slate-500 mt-2 font-medium">
                    Nova Maioria Absoluta requerida: <strong className="text-emerald-700">{Math.floor(newQuorumInput / 2) + 1} votos</strong>
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowEditQuorumModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancelar
                </button>
                <button
                  disabled={newQuorumInput <= 0}
                  onClick={() => handleAjustarQuorum(newQuorumInput)}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors disabled:opacity-50 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  Salvar Ajuste
                </button>
              </div>
            </div>
          </div>
        )}

        {activeElection.archived && (
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 text-white p-6 md:p-8 rounded-3xl shadow-lg relative overflow-hidden animate-in fade-in slide-in-from-top-6 duration-500">
            <div className="absolute right-0 top-0 p-6 opacity-10 pointer-events-none">
              <Trophy className="w-40 h-40" />
            </div>
            <div className="max-w-xl relative">
              <span className="bg-emerald-900/40 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full inline-block mb-3 border border-emerald-400/30 font-sans">
                Processo Concluído
              </span>
              <h3 className="text-2xl font-black mb-2">Eleição Finalizada com Sucesso!</h3>
              <p className="text-emerald-100/95 text-sm leading-relaxed mb-6 font-medium">
                Todos os cargos oficiais foram devidamente decididos e o escrutínio foi encerrado. O relatório consolidado de votos está pronto para ser emitido, revisado ou impresso da mesa.
              </p>
              <button
                onClick={() => setShowReportElectionId(activeElection.id)}
                className="px-6 py-3.5 bg-white text-emerald-950 hover:bg-emerald-50 text-xs font-black rounded-2xl flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer font-sans"
              >
                <FileText className="w-4 h-4 text-emerald-700" />
                Visualizar Relatório Oficial de Resultados
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <Shield className="w-32 h-32" />
              </div>
              
              <div className="relative">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-uph-green text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                      {activeElection.currentBallot}º Escrutínio
                    </span>
                    <span className="text-slate-400 text-sm font-medium">{activeElection.name}</span>
                  </div>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    URNA TRANSMITINDO AO VIVO
                  </span>
                </div>
                <h2 className="text-4xl font-display font-black text-uph-green">
                  {ROLE_NAMES[activeElection.currentRole]}
                </h2>
              </div>

              {winner ? (
                <div className="mt-12 p-8 bg-emerald-50 rounded-3xl border-2 border-emerald-200 text-center animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <Trophy className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-emerald-900 mb-1">ELEITO(A)!</h3>
                  <p className="text-emerald-700 font-bold text-lg mb-2">{formatMemberNameWithTitle(winner)}</p>
                  {activeElection.manualWinners?.[activeElection.currentRole] && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold mb-6">
                      <Award className="w-3.5 h-3.5" />
                      {activeElection.manualWinners[activeElection.currentRole]?.detail || 'Homologado por deliberação da mesa'}
                    </div>
                  )}
                  {!activeElection.manualWinners?.[activeElection.currentRole] && <div className="mb-6"></div>}
                  <div className="flex flex-col gap-3 max-w-sm mx-auto">
                    <button 
                      onClick={handleNextRole}
                      className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all"
                    >
                      Próximo Cargo
                    </button>
                    <button 
                      onClick={() => handleDecline(winner.id, winner.name)}
                      className="w-full py-3 text-red-500 hover:bg-red-50 font-medium rounded-xl transition-all"
                    >
                      Candidato Declinou (Retirar da Disputa)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-12 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">Apuração em Tempo Real</h3>
                    <div className="flex items-center gap-2 text-indigo-600">
                      <BarChart3 className="w-4 h-4 animate-pulse" />
                      <span className="text-xs font-bold uppercase">{currentVotes.length} Votos Recebidos</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {sortedCandidates.map(([candId, count], index) => {
                      const cand = members.find(m => m.id === candId);
                      const percentage = activeElection.presentCount > 0 ? (Number(count) / activeElection.presentCount) * 100 : 0;
                      return (
                        <div key={candId} className="relative group">
                          <div className="flex items-center justify-between mb-1 relative z-10 px-3">
                            <span className="font-bold text-slate-700 flex items-center gap-2">
                              <span className="w-5 text-slate-300 text-[10px] font-black">{index + 1}º</span>
                              {formatMemberNameWithTitle(cand)}
                            </span>
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => cand && handleDecline(cand.id, cand.name)}
                                className="px-2.5 py-1 text-[10px] uppercase font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all border border-rose-100 cursor-pointer flex items-center justify-center shrink-0"
                                title="Declinar Candidatura"
                              >
                                Declinar
                              </button>
                              <span className="font-black text-uph-green bg-slate-100 px-2.5 py-1 rounded-lg text-sm">{count}</span>
                            </div>
                          </div>
                          <div className="h-10 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 relative">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              className="absolute h-full bg-uph-green/10 border-r-2 border-uph-green"
                            />
                          </div>
                        </div>
                      );
                    })}
                    {sortedCandidates.length === 0 && (
                      <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-400">
                        <VoteIcon className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-sm font-medium">Aguardando início da votação...</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 space-y-3">
                    {/* Botão de Encerrar Votação se houver membros pendentes */}
                    {!isBallotClosed && pendingMembers.length > 0 && currentVotes.length > 0 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                        <div>
                          <p className="text-xs font-bold text-amber-900">Votação em Andamento</p>
                          <p className="text-[11px] text-amber-700">
                            {currentVotes.length} voto(s) recebido(s), {pendingMembers.length} membro(s) pendente(s).
                          </p>
                        </div>
                        <button
                          onClick={handleForceCloseBallot}
                          className="w-full sm:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap"
                        >
                          Encerrar e Apurar com os Presentes
                        </button>
                      </div>
                    )}

                    {/* Bloco de Empate no 3º Escrutínio */}
                    {isTieInBallot3 && isBallotClosed && (
                      <div className="p-6 bg-amber-50 border-2 border-amber-300 rounded-3xl space-y-4 animate-in fade-in">
                        <div className="flex items-center gap-2 text-amber-900 font-black text-sm uppercase tracking-wider">
                          <AlertCircle className="w-5 h-5 text-amber-600" />
                          <span>Empate no 3º Escrutínio!</span>
                        </div>
                        <p className="text-xs text-amber-800 leading-relaxed font-medium">
                          Os dois candidatos obtiveram a mesma quantidade de votos ({sortedCandidates[0]?.[1]} cada).
                          Conforme o regimento presbiteriano, a mesa pode declarar eleito o candidato com maior antiguidade de profissão de fé / idade, ou realizar um novo escrutínio de desempate:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                          {tiedCandidatesInBallot3.map(candId => {
                            const c = members.find(m => m.id === candId);
                            return (
                              <button
                                key={candId}
                                onClick={() => setTieWinnerId(candId)}
                                className="p-3 bg-white hover:bg-amber-100 border border-amber-200 rounded-2xl text-xs font-bold text-slate-800 transition-all text-left flex items-center justify-between shadow-sm cursor-pointer"
                              >
                                <span>Declarar {c?.name} Eleito (Idade/Antiguidade)</span>
                                <Trophy className="w-4 h-4 text-amber-600 shrink-0 ml-2" />
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={handleResetBallot3Tie}
                          className="w-full py-2.5 text-xs font-bold text-amber-800 hover:text-amber-900 hover:bg-amber-100/60 rounded-xl transition-colors text-center cursor-pointer"
                        >
                          Realizar Novo Escrutínio de Desempate
                        </button>
                      </div>
                    )}

                    {/* Botão de Avançar Escrutínio */}
                    {currentVotes.length > 0 && !winner && !isTieInBallot3 && activeElection.currentBallot < 3 && (
                      <button 
                        onClick={handleNextBallot}
                        disabled={!isBallotClosed}
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 transition-all font-sans cursor-pointer"
                      >
                        {isBallotClosed 
                          ? `Apurar e Ir para o ${activeElection.currentBallot + 1}º Escrutínio` 
                          : `Aguardando todos votarem (${currentVotes.length}/${presentMembers.length})`}
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Gerenciar Candidatos */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">
                  Candidatos Registrados
                </h4>
                {registeredCandidates.length > 0 && (
                  <button 
                    onClick={() => {
                      setConfirmDialog({
                        show: true,
                        title: 'Limpar Candidatos Registrados',
                        message: 'Deseja limpar todos os candidatos e permitir votos em qualquer membro presente?',
                        confirmText: 'Limpar Todos',
                        onConfirm: () => {
                          updateElection(activeElection.id, { registeredCandidates: [] });
                          setConfirmDialog(prev => ({ ...prev, show: false }));
                        }
                      });
                    }}
                    className="text-[10px] text-rose-500 hover:text-rose-700 font-bold uppercase tracking-wider transition-colors"
                  >
                    Limpar Filtro
                  </button>
                )}
              </div>

              {/* Add Candidate Form */}
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Buscar Membro</label>
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!activeElection.allowNonPresentCandidates}
                      onChange={(e) => updateElection(activeElection.id, { allowNonPresentCandidates: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3 h-3 cursor-pointer"
                    />
                    <span>Incluir ausentes (com carta)</span>
                  </label>
                </div>
                <div className="space-y-2">
                  <select
                    value={selectedCandidateToAdd}
                    onChange={(e) => setSelectedCandidateToAdd(e.target.value)}
                    className="w-full h-10 px-3 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                  >
                    <option value="">Selecione o membro...</option>
                    {(activeElection.allowNonPresentCandidates ? members : presentMembers)
                      .filter(m => !registeredCandidates.includes(m.id) && !declinedMembers.includes(m.id) && !electedMemberIds.includes(m.id))
                      .sort(compareMembersByName)
                      .map(m => (
                        <option key={m.id} value={m.id}>
                          {formatMemberNameWithTitle(m)} {m.cargo && m.cargo !== m.funcaoEclesiastica ? `(${m.cargo})` : ''}
                        </option>
                      ))
                    }
                  </select>
                  <button
                    onClick={() => handleAddCandidate(selectedCandidateToAdd)}
                    disabled={!selectedCandidateToAdd}
                    className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/20 cursor-pointer active:scale-[0.99]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Candidato</span>
                  </button>
                </div>
              </div>

              {/* Candidates List */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {registeredCandidates.length === 0 ? (
                  <div className="p-3 bg-indigo-50 border border-indigo-100/50 rounded-2xl text-xs text-indigo-700 font-medium">
                    Todos os membros presentes são candidatos. Adicione nomes acima para limitar a eleição apenas a específicos.
                  </div>
                ) : (
                  registeredCandidates
                    .filter(candId => !electedMemberIds.includes(candId))
                    .map(candId => {
                      const cand = members.find(m => m.id === candId);
                    return (
                      <div key={candId} className="flex justify-between items-center p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="overflow-hidden mr-2">
                          <p className="text-xs font-bold text-slate-700 truncate">{formatMemberNameWithTitle(cand)}</p>
                          {cand?.cargo && <p className="text-[10px] text-slate-400 truncate">{cand.cargo}</p>}
                        </div>
                        <button
                          onClick={() => handleRemoveCandidate(candId)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-slate-100 shrink-0"
                          title="Remover Candidato"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Candidatos que Declinaram */}
            {declinedMembers.length > 0 && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">
                    Declínios Registrados
                  </h4>
                  <button 
                    onClick={() => {
                      setConfirmDialog({
                        show: true,
                        title: 'Restaurar Candidatos',
                        message: 'Deseja restaurar todos os candidatos que declinaram?',
                        confirmText: 'Restaurar Todos',
                        onConfirm: () => {
                          updateElection(activeElection.id, { declinedMembers: [] });
                          setConfirmDialog(prev => ({ ...prev, show: false }));
                        }
                      });
                    }}
                    className="text-[10px] text-indigo-500 hover:text-indigo-700 font-bold uppercase tracking-wider transition-colors"
                  >
                    Restaurar Todos
                  </button>
                </div>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                  {declinedMembers.map(decId => {
                    const decCand = members.find(m => m.id === decId);
                    return (
                      <div key={decId} className="flex justify-between items-center p-2 bg-rose-50/50 rounded-xl border border-rose-100/50">
                        <div className="overflow-hidden mr-2">
                          <p className="text-xs font-bold text-rose-800 line-through truncate">{formatMemberNameWithTitle(decCand)}</p>
                          {decCand?.cargo && <p className="text-[10px] text-rose-400 truncate">{decCand.cargo}</p>}
                        </div>
                        <button
                          onClick={() => {
                            updateElection(activeElection.id, {
                              declinedMembers: declinedMembers.filter(id => id !== decId)
                            });
                          }}
                          className="px-2 py-1 text-[10px] text-indigo-600 hover:text-indigo-800 font-bold uppercase tracking-wider bg-white rounded-lg border border-indigo-100 hover:bg-slate-50 transition-colors shrink-0"
                          title="Restaurar de volta à disputa"
                        >
                          Restaurar
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <VotingSimulator
              activeElection={activeElection}
              members={members}
              presentMembers={presentMembers}
              pendingMembers={pendingMembers}
              electedMemberIds={electedMemberIds}
            />

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                <AlertCircle className="w-3 h-3" /> Regras Ativas
              </h4>
              <ul className="space-y-4">
                <li className="flex gap-3 text-xs">
                  <div className="w-5 h-5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 font-bold">1</div>
                  <p className="text-slate-600">Votos válidos apenas de quem respondeu à chamada.</p>
                </li>
                <li className="flex gap-3 text-xs">
                  <div className="w-5 h-5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 font-bold">2</div>
                  <p className="text-slate-600">Vencedor precisa de <strong>{majorityRequired}</strong> votos (Maioria Absoluta).</p>
                </li>
                <li className="flex gap-3 text-xs">
                  <div className="w-5 h-5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 font-bold">3</div>
                  <p className="text-slate-600">3º Escrutínio somente entre os dois mais votados.</p>
                </li>
              </ul>
            </div>

            <div className="bg-uph-green p-6 rounded-2xl text-white shadow-lg overflow-hidden relative">
              <History className="absolute -bottom-4 -right-4 w-24 h-24 opacity-10" />
              <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-emerald-300 mb-4">Histórico</h4>
              <div className="space-y-3">
                {activeElection.votes.length === 0 ? (
                  <p className="text-emerald-200/50 text-[10px] italic">Sem votos registrados.</p>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                    {activeElection.votes.slice().reverse().map((v, i) => (
                      <div key={i} className="text-[10px] flex justify-between border-b border-emerald-800/30 pb-1">
                        <span className="opacity-60">{ROLE_NAMES[v.role]} ({v.ballotNumber}º)</span>
                        <span className="font-bold">{members.find(m => m.id === v.candidateId)?.name.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const renderVoter = () => {
    const voter = members.find(m => m.id === voterMemberId);
    const greeting = getGreeting();

    if (!activeVoterElection) {
      return (
        <div className="flex flex-col h-full">
          <div className="px-6 py-8 bg-white border-b border-slate-100">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
              {greeting},<br />
              <span className="text-indigo-600">{voter?.name}</span>
            </h2>
            <p className="text-slate-500 mt-2 text-sm font-medium">Seja bem-vindo ao sistema de votação.</p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Aguardando Eleição</h3>
            <p className="text-slate-500 max-w-sm">
              Nenhum processo de votação está aberto no momento. O administrador abrirá a eleição em breve.
            </p>
          </div>
        </div>
      );
    }

    const { currentRole, currentBallot, votes, name } = activeVoterElection;
    const hasVoted = votes.some(v => v.voterId === voterMemberId && v.role === currentRole && v.ballotNumber === currentBallot);

    if (hasVoted) {
      return (
        <div className="flex flex-col h-full bg-white">
          <div className="px-6 py-8 bg-white border-b border-slate-100">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight leading-tight">
              {greeting},<br />
              <span className="text-indigo-600">{voter?.name}</span>
            </h2>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-5">
            <div className="w-20 h-20 bg-emerald-100 rounded-[2rem] flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <div className="space-y-2 max-w-sm">
              <h2 className="text-2xl font-bold text-slate-800">Voto Confirmado!</h2>
              <p className="text-sm text-slate-600">
                Seu voto para <strong>{ROLE_NAMES[currentRole]}</strong> ({currentBallot}º Escrutínio) já foi registrado na urna oficial.
              </p>
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Aguardando a Mesa Eleitoral</p>
                <p>Assim que a apuração for concluída e o próximo cargo for aberto, esta tela atualizará automaticamente.</p>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Se for emprestar este aparelho para outro irmão votar, clique em <strong>Sair</strong> no topo.
            </p>
          </div>
        </div>
      );
    }

    const declinedMembers = activeVoterElection.declinedMembers || [];
    const registeredCandidates = activeVoterElection.registeredCandidates || [];

    const electedMemberIds = getElectedMemberIds(
      activeVoterElection.votes,
      activeVoterElection.presentCount,
      activeVoterElection.currentRole
    );
    
    const electionSession = sessions.find(s => s.id === activeVoterElection.sessionId);
    const presentMembers = electionSession 
      ? members.filter(m => electionSession.records.find(r => r.memberId === m.id && r.status === 'presente'))
      : members;
    
    let candidatesList = presentMembers.filter(m => !declinedMembers.includes(m.id) && !electedMemberIds.includes(m.id));
    
    if (currentBallot === 3 && activeVoterElection.candidatesIds && activeVoterElection.candidatesIds.length > 0) {
      candidatesList = candidatesList.filter(m => activeVoterElection.candidatesIds!.includes(m.id));
    } else if (registeredCandidates.length > 0) {
      candidatesList = candidatesList.filter(m => registeredCandidates.includes(m.id));
    }

    return (
      <div className="flex flex-col h-full bg-[#f8faf9]">
        <div className="px-6 py-5 bg-white border-b border-slate-200/80">
          <p className="text-xs font-medium text-slate-500 mb-0.5">{greeting},</p>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {voter?.name}
          </h2>
        </div>

        <div className="p-5 bg-[#0a3d1c] text-white border-b border-[#134e27]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-[#86a892] font-semibold tracking-wider uppercase">{name}</span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#134e27] text-[#c59b27] border border-[#236b39] text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c59b27]"></span>
              URNA OFICIAL
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">{ROLE_NAMES[currentRole]}</h2>
          <p className="text-xs text-[#86a892] mt-0.5 font-medium">{currentBallot}º Escrutínio</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 pb-24">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 mb-2">Selecione seu voto:</p>
          {candidatesList.sort(compareMembersByName).map(candidate => (
            <button
              key={candidate.id}
              onClick={() => {
                setCandidateToConfirm(candidate);
              }}
              className="w-full text-left p-4 bg-white border border-slate-200/90 rounded-xl hover:border-[#0a3d1c] hover:bg-[#f2f7f4] transition-all flex items-center justify-between group cursor-pointer shadow-xs active:scale-[0.99]"
            >
              <div>
                <div className="font-bold text-slate-800 text-base group-hover:text-[#0a3d1c] transition-colors">{formatMemberNameWithTitle(candidate)}</div>
                {candidate.cargo && <div className="text-xs text-slate-500 mt-0.5">{candidate.cargo}</div>}
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-[#0a3d1c] transition-colors" />
            </button>
          ))}
        </div>

        {/* Modal Personaizável de Confirmação de Voto */}
        <AnimatePresence>
          {candidateToConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#0d1f14]/80 backdrop-blur-xs"
                onClick={() => setCandidateToConfirm(null)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-xl relative z-10 text-center space-y-4"
              >
                <div className="w-14 h-14 bg-[#f0fdf4] text-[#0a3d1c] border border-[#bbf7d0] rounded-xl flex items-center justify-center mx-auto">
                  <Shield className="w-7 h-7" />
                </div>
                
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-slate-900 tracking-tight">Confirmar Escolha</h3>
                  <p className="text-xs text-slate-500">
                    Você está depositando seu voto em:
                  </p>
                  <div className="bg-[#f8faf9] p-3.5 rounded-xl border border-slate-200 text-left mt-2">
                    <p className="font-bold text-slate-900 text-base">{formatMemberNameWithTitle(candidateToConfirm)}</p>
                    <p className="text-xs text-[#0a3d1c] font-bold mt-1">
                      Cargo: {ROLE_NAMES[currentRole]}
                    </p>
                  </div>
                </div>

                {voteError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium text-center">
                    {voteError}
                  </div>
                )}

                <div className="flex gap-2.5 pt-1">
                  <button
                    disabled={isSubmittingVote}
                    onClick={() => {
                      setCandidateToConfirm(null);
                      setVoteError(null);
                    }}
                    className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    Voltar
                  </button>
                  <button
                    disabled={isSubmittingVote}
                    className="flex-1 py-3 px-4 bg-[#0a3d1c] hover:bg-[#072b14] text-white font-bold rounded-xl text-sm transition-all cursor-pointer shadow-sm disabled:opacity-50"
                    onClick={async () => {
                      setIsSubmittingVote(true);
                      setVoteError(null);
                      try {
                        const res = await castVote(activeVoterElection.id, {
                          voterId: voterMemberId!,
                          candidateId: candidateToConfirm.id,
                          role: currentRole,
                          ballotNumber: currentBallot,
                          timestamp: Date.now()
                        });
                        if (res && !res.success) {
                          setVoteError(res.error || 'Erro ao registrar voto.');
                        } else {
                          setCandidateToConfirm(null);
                        }
                      } catch {
                        setVoteError('Erro ao comunicar com o servidor da mesa.');
                      } finally {
                        setIsSubmittingVote(false);
                      }
                    }}
                  >
                    {isSubmittingVote ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Gravando...
                      </>
                    ) : (
                      'Confirmar Voto'
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  if (voterMemberId) {
    return (
      <div className="w-full h-full">
        {renderVoter()}
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4 h-full">
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {mode === 'list' && renderElectionList()}
          {mode === 'admin' && renderAdmin()}
        </motion.div>
      </AnimatePresence>

      {showReportElectionId && (() => {
        const reportElection = elections.find(e => e.id === showReportElectionId);
        if (!reportElection) return null;
        return (
          <ElectionReportModal
            election={reportElection}
            members={members}
            onClose={() => setShowReportElectionId(null)}
          />
        );
      })()}

      {confirmDialog.show && (
        <div className="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">{confirmDialog.title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog(prev => ({ ...prev, show: false }))}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Voltar
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                {confirmDialog.confirmText || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VotingStation;
