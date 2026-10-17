import React, { useState, useMemo } from 'react';
import { 
  ClipboardCheck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Search, 
  Users, 
  Play, 
  RotateCcw, 
  CheckCheck, 
  MessageSquare, 
  ShieldCheck, 
  Calendar,
  Sparkles
} from 'lucide-react';
import { Member, SessionType, AttendanceStatus } from '../types';
import { formatMemberNameWithTitle, getInitials, stripEcclesiasticalTitle } from '../lib/memberUtils';

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
    presentCount: number;
    presencePercentage: number;
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
  setIsStarted,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'presente' | 'ausente' | 'falta_justificada'>('all');
  const [activeJustifyingMemberId, setActiveJustifyingMemberId] = useState<string | null>(null);

  // Calcula contagens atuais
  const absentCount = members.filter(m => (attendanceRecords[m.id] || 'ausente') === 'ausente').length;
  const justifiedCount = members.filter(m => attendanceRecords[m.id] === 'falta_justificada').length;
  const quorumTarget = plenaryCall === 1 ? Math.floor(members.length / 2) + 1 : Math.ceil(members.length / 3);
  const isQuorumMet = plenaryCall === 1 ? totals.metQuorum1st : totals.metQuorum2nd;

  const handleStartAttendance = () => {
    // Inicializa todos como ausente caso ainda não existam registros
    setAttendanceRecords(prev => {
      const initialized = { ...prev };
      members.forEach(m => {
        if (!initialized[m.id]) {
          initialized[m.id] = 'ausente';
        }
      });
      return initialized;
    });
    setIsStarted(true);
  };

  const handleSetStatus = (memberId: string, status: AttendanceStatus) => {
    setAttendanceRecords(prev => ({ ...prev, [memberId]: status }));
    if (status === 'falta_justificada') {
      setActiveJustifyingMemberId(memberId);
    } else if (activeJustifyingMemberId === memberId) {
      setActiveJustifyingMemberId(null);
    }
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, AttendanceStatus> = {};
    members.forEach(m => {
      updated[m.id] = 'presente';
    });
    setAttendanceRecords(updated);
  };

  const handleResetAttendance = () => {
    const updated: Record<string, AttendanceStatus> = {};
    members.forEach(m => {
      updated[m.id] = 'ausente';
    });
    setAttendanceRecords(updated);
    setJustifications({});
  };

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const currentStatus = attendanceRecords[m.id] || 'ausente';
      if (filterStatus !== 'all' && currentStatus !== filterStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = m.name.toLowerCase().includes(query);
        const matchCargo = m.cargo?.toLowerCase().includes(query) ?? false;
        const matchFuncao = m.funcaoEclesiastica?.toLowerCase().includes(query) ?? false;
        return matchName || matchCargo || matchFuncao;
      }
      return true;
    });
  }, [members, attendanceRecords, filterStatus, searchQuery]);

  // Se a chamada ainda não foi iniciada, exibe tela de configuração
  if (!isStarted) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white dark:bg-[#18221D] p-6 md:p-8 rounded-2xl border border-[#E4DFD5] dark:border-[#2A3A31] shadow-2xs transition-colors">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#1B2E24]/10 dark:bg-[#111614] text-[#1B2E24] dark:text-[#C8A96E] rounded-xl flex items-center justify-center border border-[#1B2E24]/20 dark:border-[#2A3A31]">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-serif font-bold text-[#1B2E24] dark:text-[#EDEDE8]">
                Iniciar Lista de Presença
              </h3>
              <p className="text-xs md:text-sm text-[#5C665F] dark:text-[#8A968F]">
                Configure a natureza da reunião antes de iniciar o registro de chamada.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Seleção do Tipo de Reunião */}
            <div>
              <label className="block text-xs font-bold text-[#1B2E24] dark:text-[#EDEDE8] uppercase tracking-wider mb-2.5">
                Tipo de Reunião
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSessionType('programacao')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    sessionType === 'programacao'
                      ? 'bg-[#1B2E24]/5 dark:bg-[#14231B] border-[#1B2E24] dark:border-[#C8A96E] text-[#1B2E24] dark:text-[#EDEDE8] ring-1 ring-[#1B2E24] dark:ring-[#C8A96E]'
                      : 'bg-white dark:bg-[#111614] border-[#E4DFD5] dark:border-[#2A3A31] text-[#5C665F] dark:text-[#8A968F] hover:border-[#1B2E24]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm">Programação Regular</span>
                    <Calendar className="w-4 h-4 text-[#C2A267] dark:text-[#C8A96E]" />
                  </div>
                  <p className="text-xs text-[#5C665F] dark:text-[#8A968F]">
                    Devocionais, cultos, reuniões de trabalho, estudos ou eventos gerais.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSessionType('plenaria')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    sessionType === 'plenaria'
                      ? 'bg-[#1B2E24]/5 dark:bg-[#14231B] border-[#1B2E24] dark:border-[#C8A96E] text-[#1B2E24] dark:text-[#EDEDE8] ring-1 ring-[#1B2E24] dark:ring-[#C8A96E]'
                      : 'bg-white dark:bg-[#111614] border-[#E4DFD5] dark:border-[#2A3A31] text-[#5C665F] dark:text-[#8A968F] hover:border-[#1B2E24]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm">Assembleia Plenária</span>
                    <ShieldCheck className="w-4 h-4 text-[#C2A267] dark:text-[#C8A96E]" />
                  </div>
                  <p className="text-xs text-[#5C665F] dark:text-[#8A968F]">
                    Reunião oficial deliberativa da UPH com verificação regimental de quórum.
                  </p>
                </button>
              </div>
            </div>

            {/* Configuração de Plenária (Convocação) */}
            {sessionType === 'plenaria' && (
              <div className="p-4 rounded-xl bg-[#F6F4EF] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] space-y-3">
                <label className="block text-xs font-bold text-[#1B2E24] dark:text-[#EDEDE8] uppercase tracking-wider">
                  Número da Convocação
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPlenaryCall(1)}
                    className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      plenaryCall === 1
                        ? 'bg-[#1B2E24] text-white dark:bg-[#C8A96E] dark:text-[#111614] border-transparent shadow-xs'
                        : 'bg-white dark:bg-[#18221D] text-[#5C665F] dark:text-[#8A968F] border-[#E4DFD5] dark:border-[#2A3A31]'
                    }`}
                  >
                    1ª Convocação (50% + 1)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlenaryCall(2)}
                    className={`py-2.5 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      plenaryCall === 2
                        ? 'bg-[#1B2E24] text-white dark:bg-[#C8A96E] dark:text-[#111614] border-transparent shadow-xs'
                        : 'bg-white dark:bg-[#18221D] text-[#5C665F] dark:text-[#8A968F] border-[#E4DFD5] dark:border-[#2A3A31]'
                    }`}
                  >
                    2ª Convocação (1/3 dos membros)
                  </button>
                </div>
                <div className="text-xs text-[#5C665F] dark:text-[#8A968F] flex items-center gap-1.5 pt-1">
                  <AlertCircle className="w-3.5 h-3.5 text-[#C2A267] dark:text-[#C8A96E]" />
                  <span>
                    Exigência regimental: <strong>{quorumTarget}</strong> irmãos presentes (de {members.length} cadastrados).
                  </span>
                </div>
              </div>
            )}

            {/* Resumo do Rol */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31]">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#C2A267] dark:text-[#C8A96E]" />
                <div>
                  <p className="text-xs font-medium text-[#5C665F] dark:text-[#8A968F]">Membros no Rol Oficial</p>
                  <p className="text-sm font-bold text-[#1B2E24] dark:text-[#EDEDE8]">{members.length} irmãos cadastrados</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleStartAttendance}
                disabled={members.length === 0}
                className="px-5 py-2.5 bg-[#1B2E24] dark:bg-[#C8A96E] hover:bg-[#14231B] dark:hover:bg-[#b99859] text-white dark:text-[#111614] font-bold text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                Iniciar Chamada Agora
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Visualização com a chamada ativa
  return (
    <div className="space-y-6">
      {/* Placar de Quórum e Frequência */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#18221D] p-4.5 rounded-2xl border border-[#E4DFD5] dark:border-[#2A3A31] shadow-2xs">
          <p className="text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] mb-1">Presentes</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {totals.presentCount}
            </span>
            <span className="text-xs text-[#5C665F] dark:text-[#8A968F]">
              ({totals.presencePercentage.toFixed(0)}%)
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18221D] p-4.5 rounded-2xl border border-[#E4DFD5] dark:border-[#2A3A31] shadow-2xs">
          <p className="text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] mb-1">Ausentes</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-mono font-bold text-rose-600 dark:text-rose-400">
              {absentCount}
            </span>
            <span className="text-xs text-[#5C665F] dark:text-[#8A968F]">irmãos</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18221D] p-4.5 rounded-2xl border border-[#E4DFD5] dark:border-[#2A3A31] shadow-2xs">
          <p className="text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] mb-1">Faltas Justificadas</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-mono font-bold text-amber-600 dark:text-amber-400">
              {justifiedCount}
            </span>
            <span className="text-xs text-[#5C665F] dark:text-[#8A968F]">registradas</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18221D] p-4.5 rounded-2xl border border-[#E4DFD5] dark:border-[#2A3A31] shadow-2xs flex flex-col justify-between">
          <p className="text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] mb-1">
            {sessionType === 'plenaria' ? 'Quórum Deliberativo' : 'Status da Chamada'}
          </p>
          {sessionType === 'plenaria' ? (
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                  isQuorumMet
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60'
                    : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60'
                }`}
              >
                {isQuorumMet ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Quórum Atingido ({totals.presentCount}/{quorumTarget})
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" /> Falta(m) {Math.max(0, quorumTarget - totals.presentCount)} para Quórum
                  </>
                )}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold text-[#1B2E24] dark:text-[#C8A96E]">
              <Sparkles className="w-4 h-4 text-[#C2A267]" /> Programação Regular
            </div>
          )}
        </div>
      </div>

      {/* Controles de Busca e Filtros */}
      <div className="bg-white dark:bg-[#18221D] p-4 rounded-2xl border border-[#E4DFD5] dark:border-[#2A3A31] shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5C665F] dark:text-[#8A968F]" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome ou cargo do irmão..."
            className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-[#F6F4EF] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-[#1B2E24] dark:text-[#EDEDE8] placeholder:text-[#5C665F]/60 dark:placeholder:text-[#8A968F]/60 focus:outline-hidden focus:ring-1 focus:ring-[#1B2E24] dark:focus:ring-[#C8A96E]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Abas de filtro (Responsivo no celular com overflow-x-auto) */}
          <div className="flex items-center bg-[#F6F4EF] dark:bg-[#111614] p-1 rounded-xl border border-[#E4DFD5] dark:border-[#2A3A31] overflow-x-auto max-w-full scrollbar-none">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === 'all'
                  ? 'bg-white dark:bg-[#18221D] text-[#1B2E24] dark:text-[#EDEDE8] shadow-2xs'
                  : 'text-[#5C665F] dark:text-[#8A968F]'
              }`}
            >
              Todos ({members.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('presente')}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === 'presente'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-[#5C665F] dark:text-[#8A968F]'
              }`}
            >
              Presentes ({totals.presentCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('ausente')}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterStatus === 'ausente'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-[#5C665F] dark:text-[#8A968F]'
              }`}
            >
              Ausentes ({absentCount})
            </button>
          </div>

          {/* Ações em lote */}
          <button
            type="button"
            onClick={handleMarkAllPresent}
            title="Marcar todos como presentes"
            className="px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Marcar Todos</span>
          </button>
          <button
            type="button"
            onClick={handleResetAttendance}
            title="Limpar seleções"
            className="p-2 text-xs font-medium text-[#5C665F] dark:text-[#8A968F] hover:text-[#1B2E24] dark:hover:text-[#EDEDE8] hover:bg-[#F6F4EF] dark:hover:bg-[#111614] rounded-xl border border-[#E4DFD5] dark:border-[#2A3A31] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lista de Chamada dos Membros */}
      <div className="bg-white dark:bg-[#18221D] rounded-2xl border border-[#E4DFD5] dark:border-[#2A3A31] shadow-2xs overflow-hidden">
        {filteredMembers.length === 0 ? (
          <div className="p-12 text-center text-[#5C665F] dark:text-[#8A968F] text-xs">
            Nenhum membro encontrado com os filtros atuais.
          </div>
        ) : (
          <div className="divide-y divide-[#E4DFD5] dark:divide-[#2A3A31]">
            {filteredMembers.map((member, index) => {
              const currentStatus: AttendanceStatus = attendanceRecords[member.id] || 'ausente';
              const memberJustification = justifications[member.id] || '';
              const isJustifying = activeJustifyingMemberId === member.id || (currentStatus === 'falta_justificada' && memberJustification);

              return (
                <div 
                  key={member.id} 
                  className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    currentStatus === 'presente' 
                      ? 'bg-emerald-50/30 dark:bg-emerald-950/10' 
                      : currentStatus === 'falta_justificada'
                      ? 'bg-amber-50/30 dark:bg-amber-950/10'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs text-[#5C665F]/60 dark:text-[#8A968F]/60 w-6 text-right">
                      {(index + 1).toString().padStart(2, '0')}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-[#1B2E24]/10 dark:bg-[#111614] border border-[#1B2E24]/20 dark:border-[#2A3A31] text-[#1B2E24] dark:text-[#C8A96E] font-bold text-xs flex items-center justify-center shrink-0">
                      {getInitials(member.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#1B2E24] dark:text-[#EDEDE8] truncate">
                        {formatMemberNameWithTitle(member)}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {member.cargo && (
                          <span className="text-[11px] font-semibold text-[#5C665F] dark:text-[#8A968F]">
                            {member.cargo}
                          </span>
                        )}
                        {member.funcaoEclesiastica && (
                          <span className="text-[10px] text-[#5C665F]/80 dark:text-[#8A968F]/80 bg-[#F6F4EF] dark:bg-[#111614] px-1.5 py-0.5 rounded border border-[#E4DFD5] dark:border-[#2A3A31]">
                            {member.funcaoEclesiastica}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Botões de Ação por Membro */}
                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 bg-[#F6F4EF] dark:bg-[#111614] p-1 rounded-xl border border-[#E4DFD5] dark:border-[#2A3A31]">
                      {/* Botão Presente */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(member.id, 'presente')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          currentStatus === 'presente'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'text-[#5C665F] dark:text-[#8A968F] hover:text-emerald-700 hover:bg-white dark:hover:bg-[#18221D]'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Presente</span>
                      </button>

                      {/* Botão Ausente */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(member.id, 'ausente')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          currentStatus === 'ausente'
                            ? 'bg-rose-600 text-white shadow-2xs'
                            : 'text-[#5C665F] dark:text-[#8A968F] hover:text-rose-700 hover:bg-white dark:hover:bg-[#18221D]'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Ausente</span>
                      </button>

                      {/* Botão Falta Justificada */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(member.id, 'falta_justificada')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          currentStatus === 'falta_justificada'
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'text-[#5C665F] dark:text-[#8A968F] hover:text-amber-700 hover:bg-white dark:hover:bg-[#18221D]'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Justificada</span>
                      </button>
                    </div>

                    {/* Campo de Justificativa se o status for falta justificada */}
                    {currentStatus === 'falta_justificada' && (
                      <div className="w-full sm:w-64 mt-1">
                        <input
                          type="text"
                          value={justifications[member.id] || ''}
                          onChange={e => {
                            const val = e.target.value;
                            setJustifications(prev => ({ ...prev, [member.id]: val }));
                          }}
                          placeholder="Motivo da justificativa (ex: trabalho, viagem)..."
                          className="w-full px-2.5 py-1 text-xs bg-white dark:bg-[#18221D] border border-amber-300 dark:border-amber-700 rounded-lg text-[#1B2E24] dark:text-[#EDEDE8] placeholder:text-[#5C665F]/60 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
