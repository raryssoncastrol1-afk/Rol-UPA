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
import { Election, Role, Vote, Member } from '../../types';
import { VotingSimulator } from './VotingSimulator';
import { ElectionReportModal } from './ElectionReportModal';
import { ROLE_NAMES, ROLES_LIST, getElectedMemberIds, getAllElectedResults } from '../../lib/electionUtils';
import { formatMemberNameWithTitle, compareMembersByName } from '../../lib/memberUtils';

const getMemberInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

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
  // Garante a eleição ativa mais recente (caso haja resquício de outra no array)
  const activeVoterElection = elections.filter(e => !e.archived)[0];

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
      isBallotOpen: false, // Inicia na tela intermediária de aptos
      isBallotFinalizedByMesa: false,
      registeredCandidates: [],
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
          <h2 className="text-2xl font-display font-bold text-sky-500 dark:text-sky-400">Eleições UPA</h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm">Controle rigoroso de escrutínios e maioria absoluta.</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="bg-sky-500 dark:bg-sky-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-sky-600 dark:bg-sky-500 transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Configurar Eleição
        </button>
      </div>

      {showCreate && (
        <div className="bg-white dark:bg-[#0b1220] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-slate-100">Nova Junta de Eleição</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Título</label>
              <input 
                type="text" 
                value={newElectionName}
                onChange={e => setNewElectionName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-[#030712] border border-slate-200 rounded-xl text-slate-800 dark:text-slate-100"
                placeholder="Ex: Eleições Diretoria 2024"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Sessão Plenária de Base (Chamada)</label>
              <select 
                value={selectedSessionId}
                onChange={e => setSelectedSessionId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 dark:bg-[#030712] border border-slate-200 rounded-xl text-slate-800 dark:text-slate-100"
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
            <button onClick={() => setShowCreate(false)} className="px-6 py-2 text-slate-500 dark:text-slate-400 font-bold">Cancelar</button>
            <button onClick={handleCreateElection} className="bg-sky-500 dark:bg-sky-500 hover:bg-sky-600 dark:bg-sky-500 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-emerald-950/20 cursor-pointer">Iniciar Processo</button>
          </div>
        </div>
      )}

      {showQuorumWarning.show && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0b1220] rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Atenção ao Quórum</h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6 flex flex-col gap-2">
              <span>O quórum exigido é de <strong>{showQuorumWarning.quorumRequired}</strong> sócios.</span>
              <span>No momento temos apenas <strong>{showQuorumWarning.presentCount}</strong> presentes.</span>
              <span className="mt-2 text-rose-600 font-medium">Deseja prosseguir mesmo assim?</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowQuorumWarning({show: false, presentCount: 0, quorumRequired: 0})}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 transition-colors"
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
          <div key={election.id} className="bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm hover:shadow-md transition-shadow gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-2xl shrink-0 ${election.archived ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : 'bg-emerald-100 text-emerald-600'}`}>
                <VoteIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  {election.name}
                  {election.archived && <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase tracking-widest text-slate-500 dark:text-slate-400">Arquivado</span>}
                </h3>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1 text-sm text-slate-500 dark:text-slate-400">
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
                className="p-2.5 bg-slate-50 dark:bg-[#030712] text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:bg-slate-800 flex-1 sm:flex-none justify-center flex items-center gap-1.5 border border-slate-200"
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
    const isBallotClosed = activeElection.isBallotClosedByMesa === true || (forceClosedBallot === activeElection.currentBallot);

    const electedMemberIds = getElectedMemberIds(
      activeElection.votes,
      activeElection.presentCount,
      activeElection.currentRole,
      activeElection.manualWinners,
      activeElection.officialWinners
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
        title: 'Encerrar o Escrutínio Oficialmente',
        message: pendingMembers.length > 0 
          ? `Ainda constam ${pendingMembers.length} membro(s) que não votaram. Deseja encerrar a votação e divulgar a apuração com os ${currentVotes.length} voto(s) recebidos?`
          : `Todos os presentes já votaram. Deseja encerrar o escrutínio e divulgar a apuração para todos?`,
        confirmText: 'Encerrar Escrutínio e Divulgar',
        onConfirm: () => {
          updateElection(activeElection.id, {
            isBallotClosedByMesa: true
          });
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
        updateElection(activeElection.id, { 
          currentBallot: 2, 
          isBallotClosedByMesa: false, 
          isBallotFinalizedByMesa: false 
        });
      } else if (activeElection.currentBallot === 2) {
        // Runoff logic: Get top 2, or include ties for 2nd
        if (sortedCandidates.length <= 2) {
          const top = sortedCandidates.map(([id]) => id);
          updateElection(activeElection.id, { 
            currentBallot: 3, 
            candidatesIds: top, 
            isBallotClosedByMesa: false, 
            isBallotFinalizedByMesa: false 
          });
        } else {
          const secondVotes = Number(sortedCandidates[1]?.[1] || 0);
          const topCandidates = sortedCandidates
            .filter(([, count]) => Number(count) >= secondVotes && Number(count) > 0)
            .map(([id]) => id);
          updateElection(activeElection.id, { 
            currentBallot: 3, 
            candidatesIds: topCandidates.length > 0 ? topCandidates : sortedCandidates.slice(0, 2).map(([id]) => id),
            isBallotClosedByMesa: false, 
            isBallotFinalizedByMesa: false 
          });
        }
      }
    };

    const handleNextRole = () => {
      setForceClosedBallot(null);
      setTieWinnerId(null);
      const roles = ROLES_LIST;
      const currentIndex = roles.indexOf(activeElection.currentRole);
      const winnerCandId = winner?.id;
      const updatedOfficialWinners = {
        ...(activeElection.officialWinners || {}),
        ...(winnerCandId ? {
          [activeElection.currentRole]: {
            memberId: winnerCandId,
            ballotNumber: activeElection.currentBallot,
            detail: `Eleito(a) no ${activeElection.currentBallot}º Escrutínio`
          }
        } : {})
      };

      if (currentIndex < roles.length - 1) {
        updateElection(activeElection.id, { 
          currentRole: roles[currentIndex + 1], 
          currentBallot: 1, 
          candidatesIds: [], // reset runoff
          registeredCandidates: [], // reset aptos para novo cargo
          isBallotOpen: false, // Abre na tela intermediária de aptos
          isBallotClosedByMesa: false, // Nova rodada sem apuração revelada antecipadamente
          isBallotFinalizedByMesa: false, // Bloqueia resultado para os eleitores até oficializar
          officialWinners: updatedOfficialWinners,
          votes: activeElection.votes // preserve history
        });
      } else {
        updateElection(activeElection.id, { 
          archived: true, 
          isBallotFinalizedByMesa: true,
          officialWinners: updatedOfficialWinners
        });
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
      const updatedOfficialWinners = {
        ...(activeElection.officialWinners || {}),
        [activeElection.currentRole]: {
          memberId: memberId,
          detail: reasonText || 'Aclamação'
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
        officialWinners: updatedOfficialWinners,
        overrideNotes: newNotes,
        isBallotFinalizedByMesa: true
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

    const handleFinalizeBallotByMesa = () => {
      const winnerCandId = winner?.id;
      const updatedOfficialWinners = {
        ...(activeElection.officialWinners || {}),
        ...(winnerCandId ? {
          [activeElection.currentRole]: {
            memberId: winnerCandId,
            ballotNumber: activeElection.currentBallot,
            detail: `Eleito(a) no ${activeElection.currentBallot}º Escrutínio`
          }
        } : {})
      };

      updateElection(activeElection.id, {
        isBallotFinalizedByMesa: true,
        officialWinners: updatedOfficialWinners
      });
    };

    const isCurrentRoleFinalized = activeElection.isBallotFinalizedByMesa === true;

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

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            <button onClick={() => setMode('list')} className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold hover:text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
              <ArrowLeft className="w-4 h-4" /> Sair
            </button>
            {!activeElection.archived && (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  setShowCancelConfirm(true);
                }}
                className="flex items-center gap-2 text-rose-600 font-bold hover:text-rose-800 text-xs sm:text-sm"
              >
                <X className="w-4 h-4" /> Cancelar Eleição
              </button>
            )}
            <button 
              onClick={(e) => {
                e.preventDefault();
                setShowDeleteConfirm(true);
              }}
              className="flex items-center gap-2 text-red-600 font-bold hover:text-red-800 text-xs sm:text-sm"
            >
              <Trash2 className="w-4 h-4" /> Excluir
            </button>
            {activeElection.votes && activeElection.votes.length > 0 && (
              <button 
                onClick={() => setShowReportElectionId(activeElection.id)} 
                className="flex items-center gap-1.5 text-emerald-700 font-sans font-bold hover:text-emerald-900 border-l border-slate-200 pl-3 text-xs sm:text-sm"
                title="Visualizar Relatório de Eleição"
              >
                <FileText className="w-4 h-4 text-emerald-600" /> Relatório
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
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
            <div className="bg-white dark:bg-[#0b1220] rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Membros Pendentes</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Atualização em tempo real</p>
                </div>
                <button onClick={() => setShowPendingVoters(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 transition-colors">
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
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
                    <div key={m.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-[#030712] rounded-xl border border-slate-100">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 text-xs shrink-0">
                        {m.name.charAt(0)}
                      </div>
                      <span className="font-medium text-slate-700 dark:text-slate-200 truncate">{m.name}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                <button onClick={() => setShowPendingVoters(false)} className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 transition-colors">
                  Fechar
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#0b1220] rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Excluir Eleição</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                ATENÇÃO: A eleição será excluída do sistema. Não é possível desfazer. Deseja continuar?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 transition-colors"
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
            <div className="bg-white dark:bg-[#0b1220] rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Cancelar Eleição</h3>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
                ATENÇÃO: Esta ação cancelará a eleição permanentemente. Deseja continuar?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 transition-colors"
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
            <div className="bg-white dark:bg-[#0b1220] rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Gavel className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Ações da Mesa Presidencial</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Deliberações soberanas e ajustes regimentais</p>
                  </div>
                </div>
                <button onClick={() => setShowMesaMenu(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 transition-colors">
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowMesaMenu(false);
                    setShowAclamacaoModal(true);
                  }}
                  className="w-full text-left p-4 bg-slate-50 dark:bg-[#030712] hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-2xl transition-all group flex items-start gap-4 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-indigo-950">Homologar Eleição por Aclamação</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Para quando o plenário propõe chapa/indicação única aprovada com palmas e sem votos digitais.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowMesaMenu(false);
                    handleAnularBallot();
                  }}
                  className="w-full text-left p-4 bg-slate-50 dark:bg-[#030712] hover:bg-rose-50/50 border border-slate-200 hover:border-rose-300 rounded-2xl transition-all group flex items-start gap-4 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-rose-950">Anular Escrutínio Atual e Reabrir Urna</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
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
                  className="w-full text-left p-4 bg-slate-50 dark:bg-[#030712] hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-2xl transition-all group flex items-start gap-4 cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-emerald-950">Ajustar Contagem de Presentes / Quórum</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      Altera a base de membros presentes caso irmãos tenham chegado ou precisado sair da assembleia.
                    </p>
                  </div>
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowMesaMenu(false)}
                  className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors"
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
            <div className="bg-white dark:bg-[#0b1220] rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Eleição por Aclamação</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Cargo: {ROLE_NAMES[activeElection.currentRole]}</p>
                </div>
                <button onClick={() => setShowAclamacaoModal(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 transition-colors">
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Membro Escolhido
                  </label>
                  <select
                    value={aclamacaoCandidateId}
                    onChange={(e) => setAclamacaoCandidateId(e.target.value)}
                    className="w-full h-11 px-3 text-sm bg-slate-50 dark:bg-[#030712] border border-slate-200 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Justificativa / Deliberação do Plenário
                  </label>
                  <input
                    type="text"
                    value={aclamacaoReason}
                    onChange={(e) => setAclamacaoReason(e.target.value)}
                    className="w-full h-11 px-3 text-sm bg-slate-50 dark:bg-[#030712] border border-slate-200 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ex: Aclamação unânime por proposta da mesa"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAclamacaoModal(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors"
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
            <div className="bg-white dark:bg-[#0b1220] rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Ajustar Presentes / Quórum</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Recalcula a maioria absoluta do escrutínio</p>
                </div>
                <button onClick={() => setShowEditQuorumModal(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 transition-colors">
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Número de Membros Presentes Votantes
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newQuorumInput}
                    onChange={(e) => setNewQuorumInput(parseInt(e.target.value, 10) || 0)}
                    className="w-full h-11 px-3 text-lg font-bold bg-slate-50 dark:bg-[#030712] border border-slate-200 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    Nova Maioria Absoluta requerida: <strong className="text-emerald-700">{Math.floor(newQuorumInput / 2) + 1} votos</strong>
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowEditQuorumModal(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-colors"
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
            <div className="bg-white dark:bg-[#0b1220] p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <Shield className="w-32 h-32" />
              </div>
              
              <div className="relative">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-sky-500 dark:bg-sky-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                      {activeElection.currentBallot}º Escrutínio
                    </span>
                    <span className="text-slate-400 text-sm font-medium">{activeElection.name}</span>
                  </div>
                  {activeElection.isBallotOpen !== false ? (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      URNA ABERTA • VOTANDO
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      DEFININDO CANDIDATOS APTOS
                    </span>
                  )}
                </div>
                <h2 className="text-4xl font-display font-black text-sky-500 dark:text-sky-400">
                  {ROLE_NAMES[activeElection.currentRole]}
                </h2>
              </div>

              {/* TELA INTERMEDIÁRIA: Seleção de quem está apto a concorrer antes de abrir a urna */}
              {activeElection.isBallotOpen === false ? (
                <div className="mt-8 p-6 bg-slate-50 dark:bg-[#030712] border border-slate-200 rounded-3xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">Candidatos Aptos ao Cargo</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Marque quem pode receber votos para <strong>{ROLE_NAMES[activeElection.currentRole]}</strong> neste escrutínio.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const allEligibleIds = (activeElection.allowNonPresentCandidates ? members : presentMembers)
                            .filter(m => !declinedMembers.includes(m.id) && !electedMemberIds.includes(m.id))
                            .map(m => m.id);
                          updateElection(activeElection.id, { registeredCandidates: allEligibleIds });
                        }}
                        className="px-3 py-1.5 bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Marcar Todos
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateElection(activeElection.id, { registeredCandidates: [] });
                        }}
                        className="px-3 py-1.5 bg-white dark:bg-[#0b1220] border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>

                  {/* Grid de seleção dos membros */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                    {(activeElection.allowNonPresentCandidates ? members : presentMembers)
                      .filter(m => !declinedMembers.includes(m.id) && !electedMemberIds.includes(m.id))
                      .sort(compareMembersByName)
                      .map((member) => {
                        const isSelected = (registeredCandidates.length === 0 && (!activeElection.registeredCandidates || activeElection.registeredCandidates.length === 0))
                          ? true
                          : registeredCandidates.includes(member.id);

                        return (
                          <div
                            key={member.id}
                            onClick={() => {
                              const base = (registeredCandidates.length === 0 && (!activeElection.registeredCandidates || activeElection.registeredCandidates.length === 0))
                                ? (activeElection.allowNonPresentCandidates ? members : presentMembers)
                                    .filter(m => !declinedMembers.includes(m.id) && !electedMemberIds.includes(m.id))
                                    .map(m => m.id)
                                : [...registeredCandidates];

                              const next = isSelected 
                                ? base.filter(id => id !== member.id)
                                : [...base, member.id];
                              updateElection(activeElection.id, { registeredCandidates: next });
                            }}
                            className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer select-none ${
                              isSelected
                                ? 'bg-emerald-50 border-emerald-300 shadow-2xs'
                                : 'bg-white border-slate-200 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate mr-2">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600 dark:text-slate-300'
                              }`}>
                                {getMemberInitials(member.name)}
                              </div>
                              <div className="truncate">
                                <p className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">{formatMemberNameWithTitle(member)}</p>
                                {member.cargo && <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{member.cargo}</p>}
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                              isSelected ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                            }`}>
                              {isSelected ? '✓ Apto' : 'Inapto'}
                            </span>
                          </div>
                        );
                      })}
                  </div>

                  {/* Botão de Liberação da Urna */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Eleitores verão: <em>“Aguarde, a Mesa Diretora está fazendo os últimos ajustes 😊”</em>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const effective = (registeredCandidates.length === 0 && (!activeElection.registeredCandidates || activeElection.registeredCandidates.length === 0))
                          ? (activeElection.allowNonPresentCandidates ? members : presentMembers)
                              .filter(m => !declinedMembers.includes(m.id) && !electedMemberIds.includes(m.id))
                              .map(m => m.id)
                          : registeredCandidates;

                        if (effective.length === 0) {
                          alert('Selecione pelo menos 1 candidato apto para iniciar a votação.');
                          return;
                        }

                        updateElection(activeElection.id, {
                          isBallotOpen: true,
                          registeredCandidates: effective
                        });
                      }}
                      className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Iniciar Votação do Escrutínio
                    </button>
                  </div>
                </div>
              ) : winner ? (
                <div className="mt-12 p-8 bg-emerald-50 rounded-3xl border-2 border-emerald-200 text-center animate-in fade-in zoom-in duration-500">
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <Trophy className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-black text-emerald-900 mb-1">ELEITO(A)!</h3>
                  <p className="text-emerald-700 font-bold text-lg mb-2">{formatMemberNameWithTitle(winner)}</p>
                  {activeElection.manualWinners?.[activeElection.currentRole] && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold mb-4">
                      <Award className="w-3.5 h-3.5" />
                      {activeElection.manualWinners[activeElection.currentRole]?.detail || 'Homologado por deliberação da mesa'}
                    </div>
                  )}

                  {/* Status de Liberação do Resultado para os Eleitores */}
                  <div className="mb-6">
                    {isCurrentRoleFinalized ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Resultado proclamado e visível para os eleitores
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold border border-amber-300">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Aguardando a Mesa Oficializar o Resultado
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 max-w-sm mx-auto">
                    {!isCurrentRoleFinalized && (
                      <button 
                        onClick={handleFinalizeBallotByMesa}
                        className="w-full bg-emerald-600 text-white py-3.5 rounded-2xl font-bold text-base hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Award className="w-5 h-5" />
                        Oficializar Escrutínio e Revelar Eleito
                      </button>
                    )}
                    <button 
                      onClick={handleNextRole}
                      className="w-full bg-slate-900 text-white py-3.5 rounded-2xl font-bold text-base hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      Avançar para Próximo Cargo →
                    </button>
                    <button 
                      onClick={() => handleDecline(winner.id, winner.name)}
                      className="w-full py-2.5 text-red-500 hover:bg-red-50 font-medium rounded-xl transition-all cursor-pointer text-xs"
                    >
                      Candidato Declinou (Retirar da Disputa)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-12 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest text-xs">Apuração em Tempo Real</h3>
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
                            <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
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
                              <span className="font-black text-sky-500 dark:text-sky-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-sm">{count}</span>
                            </div>
                          </div>
                          <div className="h-10 bg-slate-50 dark:bg-[#030712] rounded-xl overflow-hidden border border-slate-100 relative">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              className="absolute h-full bg-sky-500 dark:bg-sky-500/10 border-r-2 border-uph-green"
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
                    {/* Botão Oficial da Mesa: Encerrar o Escrutínio e Divulgar Resultados */}
                    {!isBallotClosed && currentVotes.length > 0 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl shadow-sm">
                        <div>
                          <p className="text-xs font-bold text-emerald-950">Escrutínio em Votação</p>
                          <p className="text-[11px] text-emerald-800">
                            {currentVotes.length} voto(s) recebidos. {pendingMembers.length === 0 ? 'Todos os membros presentes já votaram!' : `${pendingMembers.length} membro(s) pendente(s).`}
                          </p>
                        </div>
                        <button
                          onClick={handleForceCloseBallot}
                          className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Encerrar o Escrutínio e Revelar Resultados
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
                                className="p-3 bg-white hover:bg-amber-100 border border-amber-200 rounded-2xl text-xs font-bold text-slate-800 dark:text-slate-100 transition-all text-left flex items-center justify-between shadow-sm cursor-pointer"
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
            <div className="bg-white dark:bg-[#0b1220] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
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
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Buscar Membro</label>
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
                    className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-[#030712] border border-slate-200 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
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
                      <div key={candId} className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-[#030712] rounded-xl border border-slate-100">
                        <div className="overflow-hidden mr-2">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{formatMemberNameWithTitle(cand)}</p>
                          {cand?.cargo && <p className="text-[10px] text-slate-400 truncate">{cand.cargo}</p>}
                        </div>
                        <button
                          onClick={() => handleRemoveCandidate(candId)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-slate-100 dark:bg-slate-800 shrink-0"
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
              <div className="bg-white dark:bg-[#0b1220] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
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
                          className="px-2 py-1 text-[10px] text-indigo-600 hover:text-indigo-800 font-bold uppercase tracking-wider bg-white rounded-lg border border-indigo-100 hover:bg-slate-50 dark:bg-[#030712] transition-colors shrink-0"
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

            <div className="bg-white dark:bg-[#0b1220] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h4 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-4 flex items-center gap-2">
                <AlertCircle className="w-3 h-3" /> Regras Ativas
              </h4>
              <ul className="space-y-4">
                <li className="flex gap-3 text-xs">
                  <div className="w-5 h-5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 font-bold">1</div>
                  <p className="text-slate-600 dark:text-slate-300">Votos válidos apenas de quem respondeu à chamada.</p>
                </li>
                <li className="flex gap-3 text-xs">
                  <div className="w-5 h-5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 font-bold">2</div>
                  <p className="text-slate-600 dark:text-slate-300">Vencedor precisa de <strong>{majorityRequired}</strong> votos (Maioria Absoluta).</p>
                </li>
                <li className="flex gap-3 text-xs">
                  <div className="w-5 h-5 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 font-bold">3</div>
                  <p className="text-slate-600 dark:text-slate-300">3º Escrutínio somente entre os dois mais votados.</p>
                </li>
              </ul>
            </div>

            <div className="bg-sky-500 dark:bg-sky-500 p-6 rounded-2xl text-white shadow-lg overflow-hidden relative">
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
        <div className="flex flex-col h-full min-h-[75vh] items-center justify-center p-6 text-center">
          <div className="w-full max-w-md p-8 rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] space-y-4">
            <div className="w-16 h-16 bg-white/[0.05] border border-white/10 rounded-2xl flex items-center justify-center mx-auto text-sky-400">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs text-sky-400 font-semibold uppercase tracking-wider">{greeting}, {voter?.name}</p>
              <h3 className="text-xl font-bold text-white mt-1">Aguardando Eleição</h3>
            </div>
            <p className="text-xs text-neutral-400 max-w-xs mx-auto leading-relaxed">
              Nenhum processo de votação está ativo neste momento. A Mesa Diretora abrirá a eleição em instantes.
            </p>
          </div>
        </div>
      );
    }

    const { currentRole, currentBallot, votes, name } = activeVoterElection;

    // Se a votação do escrutínio ainda não foi aberta pela mesa diretora
    if (activeVoterElection.isBallotOpen === false) {
      return (
        <div className="flex flex-col h-full min-h-[75vh] items-center justify-center p-4 sm:p-6 text-center">
          <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] space-y-5">
            <div className="relative mx-auto w-16 h-16">
              <div className="w-16 h-16 bg-sky-500/10 border border-sky-400/20 text-sky-400 rounded-2xl flex items-center justify-center text-2xl">
                ⏳
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-sky-400 rounded-full border-2 border-black flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 bg-white/10 text-sky-300 border border-white/15 text-xs font-bold rounded-full">
                {ROLE_NAMES[currentRole]} • {currentBallot}º Escrutínio
              </span>
              <h3 className="text-lg font-bold text-white">
                Mesa Diretora preparando o escrutínio
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">
                Olá, <span className="text-white font-medium">{voter?.name}</span>. A lista de candidatos aptos está sendo liberada. A cédula surgirá na sua tela automaticamente.
              </p>
            </div>

            {/* Painel com cargos já eleitos até o momento, se houver */}
            {(() => {
              const officialMap = activeVoterElection.officialWinners || {};
              const officialRoles = Object.keys(officialMap) as Role[];
              if (officialRoles.length === 0) return null;

              return (
                <div className="w-full p-4 bg-black/40 rounded-2xl border border-white/10 text-left space-y-2">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Diretoria Já Eleita:</p>
                  <div className="space-y-1.5">
                    {officialRoles.map(r => {
                      const rec = officialMap[r];
                      const c = rec ? members.find(m => m.id === rec.memberId) : undefined;
                      return (
                        <div key={r} className="flex justify-between items-center text-xs">
                          <span className="text-neutral-400">{ROLE_NAMES[r]}:</span>
                          <span className="font-bold text-white truncate ml-2">{c ? formatMemberNameWithTitle(c) : 'Membro'}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      );
    }

    const hasVoted = votes.some(v => v.voterId === voterMemberId && v.role === currentRole && v.ballotNumber === currentBallot);

    if (hasVoted) {
      // Cálculo do vencedor do cargo atual
      const currentBallotVotes = votes.filter(v => v.role === currentRole && v.ballotNumber === currentBallot);
      const electionSession = sessions.find(s => s.id === activeVoterElection.sessionId);
      const presentCount = Number(activeVoterElection.presentCount) || (electionSession 
        ? electionSession.records.filter(r => r.status === 'presente').length 
        : members.length);
      const majorityRequired = Math.floor(presentCount / 2) + 1;

      const counts: Record<string, number> = {};
      currentBallotVotes.forEach(v => {
        counts[v.candidateId] = (counts[v.candidateId] || 0) + 1;
      });
      const sortedTally = Object.entries(counts).sort(([, a], [, b]) => Number(b) - Number(a));

      const manualWinnerObj = activeVoterElection.manualWinners?.[currentRole];
      let electedWinnerMember: Member | undefined = manualWinnerObj ? members.find(m => m.id === manualWinnerObj.memberId) : undefined;
      let winningSubtitle = manualWinnerObj?.detail || 'Homologado por aclamação / deliberação da mesa';

      if (!electedWinnerMember && sortedTally.length > 0) {
        if (currentBallot < 3) {
          if (sortedTally[0] && Number(sortedTally[0][1]) >= majorityRequired) {
            electedWinnerMember = members.find(m => m.id === sortedTally[0][0]);
            winningSubtitle = `Eleito(a) no ${currentBallot}º Escrutínio com ${sortedTally[0][1]} votos (Maioria Absoluta)`;
          }
        } else {
          if (sortedTally[0] && Number(sortedTally[0][1]) > 0 && (!sortedTally[1] || Number(sortedTally[0][1]) > Number(sortedTally[1][1]))) {
            electedWinnerMember = members.find(m => m.id === sortedTally[0][0]);
            winningSubtitle = `Eleito(a) no 3º Escrutínio com ${sortedTally[0][1]} votos (Maioria Relativa)`;
          }
        }
      }

      // Regra estrita: O eleitor SÓ VÊ O RESULTADO/ELEITO se a mesa tiver encerrado o escrutínio
      const isBallotClosedByMesa = activeVoterElection.isBallotClosedByMesa === true;
      const isRoleOfficiallyRevealed = Boolean(electedWinnerMember && activeVoterElection.isBallotFinalizedByMesa === true);

      return (
        <div className="flex flex-col h-full p-4 sm:p-6 space-y-4 max-w-md mx-auto w-full pb-20">
          {/* Card Oficial do Eleito só aparece QUANDO A MESA FINALIZAR O ESCRUTÍNIO */}
          {isRoleOfficiallyRevealed && electedWinnerMember && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className="p-6 sm:p-8 rounded-3xl bg-emerald-500/10 border border-emerald-400/30 text-center shadow-lg backdrop-blur-md"
            >
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-400/30">
                <Trophy className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-emerald-300 mb-1 tracking-tight">ELEITO(A)!</h3>
              <p className="text-white font-extrabold text-lg sm:text-xl mb-2">
                {formatMemberNameWithTitle(electedWinnerMember)}
              </p>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-bold mb-2">
                <Award className="w-3.5 h-3.5" />
                <span>{ROLE_NAMES[currentRole]}</span>
              </div>
              <p className="text-xs text-emerald-200/80 font-medium max-w-xs mx-auto">
                {winningSubtitle}
              </p>
            </motion.div>
          )}

          {/* Confirmação do Voto */}
          <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/15 backdrop-blur-md flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-400/30 rounded-xl flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="overflow-hidden">
              <span className="inline-block px-2 py-0.5 bg-emerald-500/15 text-emerald-300 text-[10px] font-bold rounded-md border border-emerald-400/30 mb-1">
                VOTO COMPUTADO
              </span>
              <h3 className="text-sm font-bold text-white leading-snug">
                {ROLE_NAMES[currentRole]} • {currentBallot}º Escrutínio
              </h3>
              <p className="text-xs text-neutral-400">Seu voto foi registrado com sucesso.</p>
            </div>
          </div>

          {/* MENSAGEM ENQUANTO A MESA NÃO APERTA O BOTÃO ENCERRAR */}
          {!isBallotClosedByMesa ? (
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md text-center space-y-3">
              <div className="w-12 h-12 bg-sky-500/10 text-sky-400 rounded-2xl flex items-center justify-center mx-auto border border-sky-400/20">
                <div className="w-6 h-6 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold tracking-wider uppercase text-neutral-300">
                  Aguarde a Proclamação da Mesa
                </h4>
                <p className="text-xs text-neutral-400 leading-relaxed max-w-xs mx-auto">
                  A votação da rodada ainda está em andamento. O resultado aparecerá assim que a presidência encerrar este escrutínio.
                </p>
              </div>
            </div>
          ) : (
            /* Resultado do Escrutínio Atual */
            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/15 backdrop-blur-md space-y-3.5">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-sky-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                    Resultado: {currentBallot}º Escrutínio
                  </h4>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-neutral-300 border border-white/15">
                  {currentBallotVotes.length} votos
                </span>
              </div>

              {sortedTally.length === 0 ? (
                <div className="py-4 text-center text-xs text-neutral-400">
                  Nenhum voto computado neste escrutínio.
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedTally.map(([candId, count], idx) => {
                    const cand = members.find(m => m.id === candId);
                    const pct = currentBallotVotes.length > 0 
                      ? Math.round((Number(count) / currentBallotVotes.length) * 100) 
                      : 0;

                    return (
                      <div key={candId} className="p-2.5 rounded-xl bg-black/30 border border-white/10 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 truncate mr-2">
                            <span className="text-[10px] font-black text-neutral-500 min-w-[14px]">{idx + 1}º</span>
                            <span className="font-bold text-white truncate">
                              {cand ? formatMemberNameWithTitle(cand) : 'Candidato'}
                            </span>
                          </div>
                          <span className="font-bold text-neutral-200 text-xs shrink-0">
                            {count} {count === 1 ? 'voto' : 'votos'} <span className="text-neutral-400 font-normal">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-sky-400 rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Diretoria já oficializada */}
          {(() => {
            const officialMap = activeVoterElection.officialWinners || {};
            const officialRoles = Object.keys(officialMap) as Role[];
            if (officialRoles.length === 0) return null;

            return (
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md space-y-2.5">
                <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
                    Diretoria Oficializada
                  </h4>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {officialRoles.map((r) => {
                    const rec = officialMap[r];
                    const electedCand = rec ? members.find(m => m.id === rec.memberId) : undefined;
                    return (
                      <div key={r} className="flex items-center justify-between p-2 rounded-xl bg-black/30 border border-white/10">
                        <div className="truncate mr-2">
                          <p className="text-xs font-bold text-white truncate">
                            {electedCand ? formatMemberNameWithTitle(electedCand) : 'Membro Eleito'}
                          </p>
                          <p className="text-[10px] text-sky-400 font-semibold">
                            {ROLE_NAMES[r]} {rec?.ballotNumber ? `• ${rec.ballotNumber}º Escrutínio` : `• ${rec?.detail || 'Oficializado'}`}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-white shrink-0">
                          ⭐ Eleito
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      );
    }

    const declinedMembers = activeVoterElection.declinedMembers || [];
    const registeredCandidates = activeVoterElection.registeredCandidates || [];

    const electedMemberIds = getElectedMemberIds(
      activeVoterElection.votes,
      activeVoterElection.presentCount,
      activeVoterElection.currentRole,
      activeVoterElection.manualWinners,
      activeVoterElection.officialWinners
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
      <div className="flex flex-col h-full min-h-[calc(100vh-60px)]">
        {/* Banner do Cargo / Escrutínio */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-white/[0.02] backdrop-blur-md">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-sky-400 font-bold tracking-wider uppercase">{name}</span>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-bold text-neutral-300">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
              {currentBallot}º Escrutínio
            </span>
          </div>
          <h2 
            className="text-2xl sm:text-3xl text-white tracking-wide"
            style={{ fontFamily: "'Jersey M54', sans-serif" }}
          >
            {ROLE_NAMES[currentRole]}
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Eleitor: <span className="text-neutral-200 font-medium">{voter?.name}</span>
          </p>
        </div>

        {/* Lista simplificada e elegante de candidatos */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 pb-24">
          <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider px-1">
            Selecione seu candidato:
          </p>
          
          <div className="grid grid-cols-1 gap-2.5">
            {candidatesList.sort(compareMembersByName).map(candidate => (
              <button
                key={candidate.id}
                onClick={() => {
                  setCandidateToConfirm(candidate);
                }}
                className="w-full text-left p-3.5 sm:p-4 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/25 backdrop-blur-md transition-all flex items-center justify-between group cursor-pointer shadow-sm active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 truncate mr-2">
                  <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center font-bold text-sm text-sky-300 shrink-0">
                    {getMemberInitials(candidate.name)}
                  </div>
                  <div className="truncate">
                    <div className="font-bold text-white text-sm sm:text-base group-hover:text-sky-300 transition-colors truncate">
                      {formatMemberNameWithTitle(candidate)}
                    </div>
                    {candidate.cargo && (
                      <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                        {candidate.cargo}
                      </div>
                    )}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 group-hover:text-white group-hover:bg-white/15 shrink-0 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Modal Simplificado com Liquid Glass para Confirmar Voto */}
        <AnimatePresence>
          {candidateToConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={() => setCandidateToConfirm(null)}
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                className="relative z-10 w-full max-w-sm rounded-3xl p-6 bg-black/85 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)] backdrop-blur-xl text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-white/[0.06] border border-white/20 flex items-center justify-center mx-auto text-sky-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                  <Shield className="w-8 h-8" />
                </div>
                
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-white tracking-tight">Confirmar Escolha</h3>
                  <p className="text-xs text-neutral-400">
                    Você confirma o depósito deste voto para:
                  </p>
                  
                  <div className="p-4 rounded-2xl bg-white/[0.05] border border-white/15 text-left mt-2">
                    <p className="font-bold text-white text-base leading-snug">
                      {formatMemberNameWithTitle(candidateToConfirm)}
                    </p>
                    <p className="text-xs text-sky-400 font-semibold mt-1">
                      Cargo: {ROLE_NAMES[currentRole]}
                    </p>
                  </div>
                </div>

                {voteError && (
                  <div className="p-3 bg-rose-500/15 border border-rose-400/30 rounded-xl text-xs text-rose-200 font-medium text-center">
                    {voteError}
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button
                    disabled={isSubmittingVote}
                    onClick={() => {
                      setCandidateToConfirm(null);
                      setVoteError(null);
                    }}
                    className="flex-1 py-3 px-4 bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white font-semibold rounded-xl text-sm border border-white/15 transition-all cursor-pointer disabled:opacity-50"
                  >
                    Voltar
                  </button>
                  <button
                    disabled={isSubmittingVote}
                    className="flex-1 py-3 px-4 bg-white hover:bg-neutral-100 text-black font-bold rounded-xl text-sm transition-all cursor-pointer shadow-[0_4px_20px_rgba(255,255,255,0.3)] hover:shadow-[0_4px_24px_rgba(255,255,255,0.4)] disabled:opacity-50"
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
                    {isSubmittingVote ? 'Gravando...' : 'Confirmar'}
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
          <div className="bg-white dark:bg-[#0b1220] rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{confirmDialog.title}</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog(prev => ({ ...prev, show: false }))}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
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
