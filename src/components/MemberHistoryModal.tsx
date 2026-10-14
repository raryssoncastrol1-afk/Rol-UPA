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
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-base shadow-sm tracking-wider shrink-0">
                {getInitials(member.name)}
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                  {stripEcclesiasticalTitle(member.name)}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100/60 rounded-full text-[10px] font-black uppercase tracking-wider">
                    {member.cargo || 'Membro UPH'}
                  </span>
                  {member.funcaoEclesiastica && member.funcaoEclesiastica !== 'Não se aplica' && (
                    <span className="px-2.5 py-0.5 bg-slate-200/80 text-slate-700 rounded-full text-[10px] font-bold">
                      {member.funcaoEclesiastica}
                    </span>
                  )}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    member.situacao === 'Sob Disciplina' 
                      ? 'bg-rose-100 text-rose-700' 
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {member.situacao || 'Em Plena Comunhão'}
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200/70 rounded-full transition-colors text-slate-400 hover:text-slate-700"
              title="Fechar"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-slate-100 bg-white px-6 sm:px-8">
            <button
              onClick={() => setActiveTab('ficha')}
              className={`py-3.5 px-4 font-black text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'ficha'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Ficha Cadastral
            </button>
            <button
              onClick={() => setActiveTab('frequencia')}
              className={`py-3.5 px-4 font-black text-xs uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'frequencia'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Frequência & Plenárias
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                {presenceCount}
              </span>
            </button>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto flex-1 p-6 sm:p-8">
            {activeTab === 'ficha' ? (
              <div className="space-y-6">
                {/* Quick Actions Bar */}
                <div className="flex flex-wrap items-center gap-2.5 p-3 bg-indigo-50/50 border border-indigo-100/70 rounded-2xl">
                  {waUrl ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-200"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  ) : null}

                  {member.contato ? (
                    <a
                      href={`tel:${member.contato.replace(/\D/g, '')}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all"
                    >
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      Ligar
                    </a>
                  ) : null}

                  {member.email ? (
                    <a
                      href={`mailto:${member.email}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all"
                    >
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      E-mail
                    </a>
                  ) : null}

                  {onEditMember && (
                    <button
                      onClick={() => onEditMember(member)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all ml-auto shadow-sm shadow-indigo-200"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Editar Ficha
                    </button>
                  )}
                </div>

                {/* Grid of details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bloco 1: Contato & Localização */}
                  <div className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-700 font-black text-xs uppercase tracking-wider border-b border-slate-200/60 pb-2">
                      <Phone className="w-3.5 h-3.5" />
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
                  <div className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-700 font-black text-xs uppercase tracking-wider border-b border-slate-200/60 pb-2">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Dados Pessoais & Documentos
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">CPF (Protegido por LGPD)</span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 font-mono">
                            {member.cpf ? (showFullCpf ? member.cpf : maskCpf(member.cpf)) : <span className="text-slate-400 italic">Não informado</span>}
                          </span>
                          {member.cpf && (
                            <button
                              type="button"
                              onClick={() => setShowFullCpf(!showFullCpf)}
                              className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                              title={showFullCpf ? "Ocultar CPF" : "Revelar CPF completo"}
                            >
                              {showFullCpf ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">RG</span>
                          <span className="font-semibold text-slate-800">{member.rg || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Tipo Sanguíneo</span>
                          <span className="font-semibold text-slate-800">{member.tipoSanguineo || '-'}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Data de Nascimento</span>
                          <span className="font-semibold text-slate-800">
                            {member.nascimento ? `${formatDateBR(member.nascimento)}${idade !== null ? ` (${idade} anos)` : ''}` : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Estado Civil</span>
                          <span className="font-semibold text-slate-800">{member.estadoCivil || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 3: Vida Eclesiástica */}
                  <div className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-700 font-black text-xs uppercase tracking-wider border-b border-slate-200/60 pb-2">
                      <Landmark className="w-3.5 h-3.5" />
                      Vida Eclesiástica & UPH
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Função / Ofício</span>
                          <span className="font-semibold text-slate-800">{member.funcaoEclesiastica || 'Não se aplica'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Situação</span>
                          <span className="font-semibold text-slate-800">{member.situacao || 'Em Plena Comunhão'}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Batismo</span>
                          <span className="font-semibold text-slate-800">{formatDateBR(member.dataBatismo)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Profissão de Fé</span>
                          <span className="font-semibold text-slate-800">{formatDateBR(member.dataProfissaoFe)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Ingresso na UPH</span>
                          <span className="font-semibold text-slate-800">{formatDateBR(member.uphEntryDate)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Contribuinte / Dizimista</span>
                          <span className="font-semibold text-slate-800">
                            {member.dizimista ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                <HeartHandshake className="w-3.5 h-3.5" /> Ativo
                              </span>
                            ) : 'Geral'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 4: Filiação & Credenciais */}
                  <div className="bg-slate-50/60 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2 text-indigo-700 font-black text-xs uppercase tracking-wider border-b border-slate-200/60 pb-2">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Filiação & PIN de Votação
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Nome da Mãe</span>
                        <span className="font-semibold text-slate-800">{member.filiacaoMae || '-'}</span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Nome do Pai</span>
                        <span className="font-semibold text-slate-800">{member.filiacaoPai || '-'}</span>
                      </div>

                      <div className="pt-1 border-t border-slate-200/50">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">PIN de Acesso / Votação</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 font-mono font-bold rounded-lg tracking-widest text-sm">
                            {member.pinCode || 'Não gerado'}
                          </span>
                          {member.pinCode && (
                            <>
                              <button
                                type="button"
                                onClick={handleCopyPin}
                                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 text-xs font-semibold flex items-center gap-1 transition-all"
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
                  <div className="mb-6 p-4 rounded-2xl border border-slate-100 bg-slate-50/40">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-500" />
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evolução de Presença</h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 self-start">
                        <button 
                          onClick={() => setIncludeJustified(!includeJustified)}
                          className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                            includeJustified ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'
                          }`}
                        >
                          Abonar Justif.
                        </button>
                        <div className="flex gap-1 bg-white p-0.5 rounded-xl border border-slate-200">
                          <button 
                            onClick={() => setMode('cumulative')}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                              mode === 'cumulative' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                            }`}
                          >
                            Acumulado
                          </button>
                          <button 
                            onClick={() => setMode('direct')}
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                              mode === 'direct' ? 'bg-indigo-600 text-white' : 'text-slate-400'
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
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Histórico de Sessões</p>
                  {sessions.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-400 text-xs italic">Nenhum registro de reunião disponível.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {[...sessions].reverse().map(session => {
                        const record = session.records.find(r => r.memberId === member.id);
                        if (!record) return null;

                        return (
                          <div key={session.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/40 hover:bg-white hover:shadow-sm transition-all">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 text-xs sm:text-sm">
                                {format(session.date, "dd 'de' MMMM", { locale: ptBR })}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                {session.type === 'plenaria' ? `Plenária (${session.callNumber || 1}ª Chamada)` : 'Programação'} • {format(session.date, "yyyy")}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {record.justification && (
                                <div className="hidden sm:block text-right max-w-[140px]">
                                  <p className="text-[10px] text-indigo-500 font-medium italic truncate">"{record.justification}"</p>
                                </div>
                              )}
                              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">Presença Real</p>
                <p className="text-lg font-black text-white leading-none">
                  {frequencyReal}%
                </p>
              </div>
              <div className="w-px h-6 bg-slate-800" />
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider leading-none mb-1">Frequência (c/ Justif.)</p>
                <p className="text-lg font-black text-indigo-400 leading-none">
                  {frequencyJustified}%
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cadastrado em</span>
              <span className="text-white text-xs font-semibold">{format(member.createdAt, 'dd/MM/yyyy')}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
