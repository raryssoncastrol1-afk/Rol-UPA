import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  XCircle, 
  AlertCircle, 
  TrendingUp, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Edit3, 
  Copy, 
  MessageCircle, 
  Check, 
  HeartHandshake, 
  Droplet, 
  Landmark,
  User,
  Send
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Member, AttendanceSession } from '../types';
import { 
  getInitials, 
  calcularIdade, 
  maskCpf, 
  formatPhone, 
  gerarWhatsAppUrl, 
  formatDateBR,
  stripEcclesiasticalTitle 
} from '../lib/memberUtils';
import { activePinDispatcher } from '../lib/pinDispatcher';
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
  onEditMember?: (member: Member) => void;
}

export const MemberHistoryModal: React.FC<MemberHistoryModalProps> = ({ 
  member, 
  onClose, 
  sessions,
  onEditMember 
}) => {
  const [activeTab, setActiveTab] = useState<'ficha' | 'frequencia'>('ficha');
  const [showFullCpf, setShowFullCpf] = useState(false);
  const [copiedPin, setCopiedPin] = useState(false);
  const [mode, setMode] = useState<'cumulative' | 'direct'>('cumulative');
  const [includeJustified, setIncludeJustified] = useState(false);

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

  const idade = calcularIdade(member.nascimento);
  const waUrl = gerarWhatsAppUrl(member.contato, `Olá meu irmão ${member.name}, a paz do Senhor!`);

  const handleCopyPin = () => {
    if (!member.pinCode) return;
    navigator.clipboard.writeText(member.pinCode);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#18221D] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-6 sm:p-7 border-b border-[#E4DFD5] dark:border-[#2A3A31] flex items-center justify-between bg-[#FAF8F5] dark:bg-[#14231B]">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#1B2E24]/10 dark:bg-[#111614] text-[#1B2E24] dark:text-[#C8A96E] border border-[#1B2E24]/20 dark:border-[#2A3A31] rounded-xl flex items-center justify-center font-bold text-base shadow-2xs tracking-wider shrink-0">
                {getInitials(member.name)}
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-[#1B2E24] dark:text-[#EDEDE8] leading-tight">
                  {stripEcclesiasticalTitle(member.name)}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="px-2.5 py-0.5 bg-[#1B2E24]/10 dark:bg-[#111614] text-[#1B2E24] dark:text-[#C8A96E] border border-[#1B2E24]/20 dark:border-[#2A3A31] rounded-lg text-[10px] font-bold uppercase tracking-wider">
                    {member.cargo || 'Membro UPH'}
                  </span>
                  {member.funcaoEclesiastica && member.funcaoEclesiastica !== 'Não se aplica' && (
                    <span className="px-2.5 py-0.5 bg-[#F6F4EF] dark:bg-[#111614] text-[#5C665F] dark:text-[#8A968F] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-lg text-[10px] font-bold">
                      {member.funcaoEclesiastica}
                    </span>
                  )}
                  <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                    member.situacao === 'Sob Disciplina' 
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400' 
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                  }`}>
                    {member.situacao || 'Em Plena Comunhão'}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-[#E4DFD5]/50 dark:hover:bg-[#2A3A31] rounded-xl transition-colors text-[#5C665F] dark:text-[#8A968F] cursor-pointer"
              title="Fechar"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-[#E4DFD5] dark:border-[#2A3A31] bg-white dark:bg-[#18221D] px-6 sm:px-8">
            <button
              onClick={() => setActiveTab('ficha')}
              className={`py-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'ficha'
                  ? 'border-[#1B2E24] text-[#1B2E24] dark:border-[#C8A96E] dark:text-[#C8A96E]'
                  : 'border-transparent text-[#5C665F] dark:text-[#8A968F] hover:text-[#1B2E24] dark:hover:text-[#EDEDE8]'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Ficha Cadastral
            </button>
            <button
              onClick={() => setActiveTab('frequencia')}
              className={`py-3.5 px-4 font-bold text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'frequencia'
                  ? 'border-[#1B2E24] text-[#1B2E24] dark:border-[#C8A96E] dark:text-[#C8A96E]'
                  : 'border-transparent text-[#5C665F] dark:text-[#8A968F] hover:text-[#1B2E24] dark:hover:text-[#EDEDE8]'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Frequência & Plenárias
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#F6F4EF] dark:bg-[#111614] text-[#1B2E24] dark:text-[#C8A96E] border border-[#E4DFD5] dark:border-[#2A3A31] font-mono">
                {presenceCount}
              </span>
            </button>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto flex-1 p-6 sm:p-8">
            {activeTab === 'ficha' ? (
              <div className="space-y-6">
                {/* Quick Actions Bar */}
                <div className="flex flex-wrap items-center gap-2.5 p-3 bg-[#FAF8F5] dark:bg-[#14231B] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-2xl">
                  {waUrl ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  ) : null}

                  {member.contato ? (
                    <a
                      href={`tel:${member.contato.replace(/\D/g, '')}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#111614] hover:bg-[#F6F4EF] text-[#1B2E24] dark:text-[#EDEDE8] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs font-bold transition-all shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#5C665F] dark:text-[#8A968F]" />
                      Ligar
                    </a>
                  ) : null}

                  {member.email ? (
                    <a
                      href={`mailto:${member.email}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#111614] hover:bg-[#F6F4EF] text-[#1B2E24] dark:text-[#EDEDE8] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs font-bold transition-all shadow-2xs"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#5C665F] dark:text-[#8A968F]" />
                      E-mail
                    </a>
                  ) : null}

                  {onEditMember && (
                    <button
                      onClick={() => onEditMember(member)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#1B2E24] dark:bg-[#C8A96E] hover:bg-[#14231B] text-white dark:text-[#111614] rounded-xl text-xs font-bold transition-all ml-auto shadow-2xs cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Editar Ficha
                    </button>
                  )}
                </div>

                {/* Grid of details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bloco 1: Contato & Localização */}
                  <div className="bg-[#FAF8F5] dark:bg-[#14231B] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-[#1B2E24] dark:text-[#C8A96E] font-bold text-xs uppercase tracking-wider border-b border-[#E4DFD5] dark:border-[#2A3A31] pb-2">
                      <Phone className="w-3.5 h-3.5 text-[#C2A267]" />
                      Contato & Endereço
                    </div>
                    
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Telefone / WhatsApp</span>
                        <span className="font-semibold text-slate-800">
                          {member.contato ? formatPhone(member.contato) : <span className="text-slate-400 italic">Não informado</span>}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">E-mail</span>
                        <span className="font-semibold text-slate-800 break-all">
                          {member.email || <span className="text-slate-400 italic">Não informado</span>}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Endereço Residencial</span>
                        <span className="font-semibold text-slate-800">
                          {member.endereco || <span className="text-slate-400 italic">Não informado</span>}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 2: Documentos & Pessoal */}
                  <div className="bg-[#FAF8F5] dark:bg-[#14231B] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-[#1B2E24] dark:text-[#C8A96E] font-bold text-xs uppercase tracking-wider border-b border-[#E4DFD5] dark:border-[#2A3A31] pb-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#C2A267]" />
                      Dados Pessoais & Documentos
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-widest block">CPF (Protegido por LGPD)</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#1B2E24] dark:text-[#EDEDE8] font-mono">
                            {member.cpf ? (showFullCpf ? member.cpf : maskCpf(member.cpf)) : <span className="text-[#5C665F]/60 italic">Não informado</span>}
                          </span>
                          {member.cpf && (
                            <button
                              type="button"
                              onClick={() => setShowFullCpf(!showFullCpf)}
                              className="text-[#5C665F] hover:text-[#1B2E24] dark:text-[#8A968F] dark:hover:text-[#EDEDE8] transition-colors p-1"
                              title={showFullCpf ? "Ocultar CPF" : "Revelar CPF completo"}
                            >
                              {showFullCpf ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-widest block">RG</span>
                          <span className="font-semibold text-[#1B2E24] dark:text-[#EDEDE8]">{member.rg || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-widest block">Tipo Sanguíneo</span>
                          <span className="font-semibold text-[#1B2E24] dark:text-[#EDEDE8]">{member.tipoSanguineo || '-'}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-widest block">Data de Nascimento</span>
                          <span className="font-semibold text-[#1B2E24] dark:text-[#EDEDE8]">
                            {member.nascimento ? `${formatDateBR(member.nascimento)}${idade !== null ? ` (${idade} anos)` : ''}` : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-widest block">Estado Civil</span>
                          <span className="font-semibold text-[#1B2E24] dark:text-[#EDEDE8]">{member.estadoCivil || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 3: Vida Eclesiástica */}
                  <div className="bg-[#FAF8F5] dark:bg-[#14231B] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-[#1B2E24] dark:text-[#C8A96E] font-bold text-xs uppercase tracking-wider border-b border-[#E4DFD5] dark:border-[#2A3A31] pb-2">
                      <Landmark className="w-3.5 h-3.5 text-[#C2A267]" />
                      Vida Eclesiástica & UPH
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-widest block">Função / Ofício</span>
                          <span className="font-semibold text-[#1B2E24] dark:text-[#EDEDE8]">{member.funcaoEclesiastica || 'Não se aplica'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-widest block">Situação</span>
                          <span className="font-semibold text-[#1B2E24] dark:text-[#EDEDE8]">{member.situacao || 'Em Plena Comunhão'}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-widest block">Batismo</span>
                          <span className="font-semibold text-[#1B2E24] dark:text-[#EDEDE8]">{formatDateBR(member.dataBatismo)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-widest block">Profissão de Fé</span>
                          <span className="font-semibold text-[#1B2E24] dark:text-[#EDEDE8]">{formatDateBR(member.dataProfissaoFe)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-widest block">Ingresso na UPH</span>
                          <span className="font-semibold text-[#1B2E24] dark:text-[#EDEDE8]">{formatDateBR(member.uphEntryDate)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-widest block">Contribuinte / Dizimista</span>
                          <span className="font-semibold text-[#1B2E24] dark:text-[#EDEDE8]">
                            {member.dizimista ? (
                              <span className="inline-flex items-center gap-1 text-[#C2A267] dark:text-[#C8A96E] font-bold">
                                <HeartHandshake className="w-3.5 h-3.5" /> Ativo
                              </span>
                            ) : 'Geral'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 4: Filiação & Credenciais */}
                  <div className="bg-[#FAF8F5] dark:bg-[#14231B] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-[#1B2E24] dark:text-[#C8A96E] font-bold text-xs uppercase tracking-wider border-b border-[#E4DFD5] dark:border-[#2A3A31] pb-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#C2A267]" />
                      Filiação & PIN de Votação
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-widest block">Nome da Mãe</span>
                        <span className="font-semibold text-[#1B2E24] dark:text-[#EDEDE8]">{member.filiacaoMae || '-'}</span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-widest block">Nome do Pai</span>
                        <span className="font-semibold text-[#1B2E24] dark:text-[#EDEDE8]">{member.filiacaoPai || '-'}</span>
                      </div>

                      <div className="pt-1 border-t border-[#E4DFD5] dark:border-[#2A3A31]">
                        <span className="text-[10px] font-bold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-widest block">PIN de Acesso / Votação</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-3 py-1 bg-[#1B2E24]/10 dark:bg-[#111614] border border-[#1B2E24]/20 dark:border-[#2A3A31] text-[#1B2E24] dark:text-[#C8A96E] font-mono font-bold rounded-lg tracking-widest text-sm">
                            {member.pinCode || 'Não gerado'}
                          </span>
                          {member.pinCode && (
                            <>
                              <button
                                type="button"
                                onClick={handleCopyPin}
                                className="px-2.5 py-1 bg-white dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-lg text-[#5C665F] dark:text-[#8A968F] hover:text-[#1B2E24] dark:hover:text-[#EDEDE8] text-xs font-semibold flex items-center gap-1 transition-all"
                                title="Copiar PIN"
                              >
                                {copiedPin ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedPin ? 'Copiado' : 'Copiar'}
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!member.pinCode) return;
                                  const res = await activePinDispatcher.sendPin(member, member.pinCode);
                                  if (!res.success && res.error) {
                                    alert(res.error);
                                  }
                                }}
                                className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1 transition-all"
                                title={member.contato ? `Enviar PIN para WhatsApp (${member.contato})` : "Membro sem telefone cadastrado"}
                              >
                                <Send className="w-3.5 h-3.5" />
                                Enviar PIN
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Aba de Frequência & Histórico */
              <div>
                {/* Statistics Overview */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <div className="text-center p-3 sm:p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                    <p className="text-2xl font-black text-emerald-600 leading-none">{presenceCount}</p>
                    <p className="text-[9px] text-emerald-600 font-black uppercase mt-1.5 tracking-widest">Presenças</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-2xl bg-amber-50 border border-amber-100">
                    <p className="text-2xl font-black text-amber-600 leading-none">{justifiedCount}</p>
                    <p className="text-[9px] text-amber-600 font-black uppercase mt-1.5 tracking-widest">Justificadas</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-2xl bg-rose-50 border border-rose-100">
                    <p className="text-2xl font-black text-rose-600 leading-none">{absenceCount}</p>
                    <p className="text-[9px] text-rose-600 font-black uppercase mt-1.5 tracking-widest">Faltas</p>
                  </div>
                </div>

                {/* Performance Chart */}
                {sessions.length > 0 && (
                  <div className="mb-6 p-4 rounded-2xl border border-[#E4DFD5] dark:border-[#2A3A31] bg-[#FAF8F5] dark:bg-[#14231B]">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#C2A267] dark:text-[#C8A96E]" />
                        <h4 className="text-xs font-bold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider">Evolução de Presença</h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 self-start">
                        <button 
                          onClick={() => setIncludeJustified(!includeJustified)}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                            includeJustified ? 'bg-emerald-700 text-white border-transparent' : 'bg-white dark:bg-[#111614] text-[#5C665F] dark:text-[#8A968F] border-[#E4DFD5] dark:border-[#2A3A31]'
                          }`}
                        >
                          Abonar Justif.
                        </button>
                        <div className="flex gap-1 bg-[#F6F4EF] dark:bg-[#111614] p-1 rounded-xl border border-[#E4DFD5] dark:border-[#2A3A31]">
                          <button 
                            onClick={() => setMode('cumulative')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              mode === 'cumulative' ? 'bg-[#1B2E24] text-white dark:bg-[#C8A96E] dark:text-[#111614]' : 'text-[#5C665F] dark:text-[#8A968F]'
                            }`}
                          >
                            Acumulado
                          </button>
                          <button 
                            onClick={() => setMode('direct')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              mode === 'direct' ? 'bg-[#1B2E24] text-white dark:bg-[#C8A96E] dark:text-[#111614]' : 'text-[#5C665F] dark:text-[#8A968F]'
                            }`}
                          >
                            Ponto a Ponto
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="h-[160px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E4DFD5" opacity={0.5} />
                          <XAxis hide dataKey="name" />
                          <YAxis hide domain={[0, 100]} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '11px', background: '#1B2E24', color: '#FAF8F5' }}
                            formatter={(value: any) => [
                              Number(value) === 100 ? 'Presente' : (Number(value) === 50 ? 'Justificada' : 'Ausente'),
                              'Status'
                            ]}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="valor" 
                            stroke="#C2A267" 
                            strokeWidth={3} 
                            fill="#C2A267" 
                            fillOpacity={0.15} 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* History List */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider">Histórico de Sessões</p>
                  {sessions.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-8 h-8 text-[#5C665F]/40 mx-auto mb-2" />
                      <p className="text-[#5C665F] dark:text-[#8A968F] text-xs italic">Nenhum registro de reunião disponível.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {[...sessions].reverse().map(session => {
                        const record = session.records.find(r => r.memberId === member.id);
                        if (!record) return null;

                        return (
                          <div key={session.id} className="flex items-center justify-between p-3.5 rounded-xl border border-[#E4DFD5] dark:border-[#2A3A31] bg-[#FAF8F5] dark:bg-[#14231B] hover:bg-white dark:hover:bg-[#18221D] transition-all">
                            <div className="flex flex-col">
                              <span className="font-bold text-[#1B2E24] dark:text-[#EDEDE8] text-xs sm:text-sm">
                                {format(session.date, "dd 'de' MMMM", { locale: ptBR })}
                              </span>
                              <span className="text-[10px] text-[#5C665F] dark:text-[#8A968F] font-bold uppercase tracking-wider">
                                {session.type === 'plenaria' ? `Plenária (${session.callNumber || 1}ª Chamada)` : 'Programação'} • {format(session.date, "yyyy")}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {record.justification && (
                                <div className="hidden sm:block text-right max-w-[140px]">
                                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium italic truncate">"{record.justification}"</p>
                                </div>
                              )}
                              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                record.status === 'presente' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                                record.status === 'ausente' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400' :
                                'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
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
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 bg-[#14231B] border-t border-[#2A3A31] flex items-center justify-between text-[#FAF8F5]">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[10px] text-[#8A968F] font-bold uppercase tracking-wider leading-none mb-1">Presença Real</p>
                <p className="text-lg font-mono font-bold text-white leading-none">
                  {frequencyReal}%
                </p>
              </div>
              <div className="w-px h-6 bg-[#2A3A31]" />
              <div>
                <p className="text-[10px] text-[#8A968F] font-bold uppercase tracking-wider leading-none mb-1">Frequência (c/ Justif.)</p>
                <p className="text-lg font-mono font-bold text-[#C8A96E] leading-none">
                  {frequencyJustified}%
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-[10px] text-[#8A968F] font-bold uppercase tracking-wider block">Cadastrado em</span>
              <span className="text-[#FAF8F5] text-xs font-semibold">{format(member.createdAt, 'dd/MM/yyyy')}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
