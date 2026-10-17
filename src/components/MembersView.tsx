import React, { useState, useMemo } from 'react';
import { 
  UserPlus, 
  Plus, 
  Trash2, 
  Users, 
  RefreshCw, 
  Search, 
  Edit3, 
  Eye, 
  EyeOff,
  Copy,
  MessageCircle, 
  ChevronDown, 
  ChevronUp, 
  X, 
  Check, 
  ShieldCheck, 
  Phone, 
  Calendar, 
  Landmark, 
  Upload, 
  Download, 
  Send,
  Star,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Member, FuncaoEclesiastica, SituacaoMembro, EstadoCivil } from '../types';
import { 
  getInitials, 
  calcularIdade, 
  formatPhone, 
  gerarWhatsAppUrl, 
  stripEcclesiasticalTitle,
  compareMembersByName
} from '../lib/memberUtils';
import { exportMembersToMarkdown } from '../lib/markdownMemberParser';
import { ImportMarkdownModal } from './ImportMarkdownModal';
import { activePinDispatcher } from '../lib/pinDispatcher';

interface MembersViewProps {
  members: Member[];
  addMember: (name: string, cargo: string, uphEntryDate?: string, extraFields?: Partial<Member>) => Promise<string | undefined>;
  removeMember: (id: string) => Promise<void>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<void>;
  importMembersBatch?: (
    members: any[], 
    options?: { updateExisting?: boolean }
  ) => Promise<{ added: number; updated: number; skipped: number } | void>;
  onSelectMember: (member: Member) => void;
  onOpenEditMember?: (member: Member) => void;
  initialEditingMember?: Member | null;
  onClearEditingMember?: () => void;
}

export const MembersView: React.FC<MembersViewProps> = ({ 
  members, 
  addMember, 
  removeMember, 
  updateMember,
  importMembersBatch,
  onSelectMember,
  initialEditingMember,
  onClearEditingMember
}) => {
  // Quick Add State & Accordion
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberModality, setNewMemberModality] = useState<string>('Não se aplica');
  const [newMemberCargo, setNewMemberCargo] = useState('');
  const [newMemberEntryDate, setNewMemberEntryDate] = useState('');
  const [showExtendedAdd, setShowExtendedAdd] = useState(false);
  const [newContato, setNewContato] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newNascimento, setNewNascimento] = useState('');
  const [newCpf, setNewCpf] = useState('');
  const [newSituacao, setNewSituacao] = useState<SituacaoMembro>('Em Plena Comunhão');
  const [newDizimista, setNewDizimista] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Markdown Import / Export Modal State
  const [showImportModal, setShowImportModal] = useState(false);

  const handleExportMarkdown = () => {
    if (members.length === 0) {
      alert('Não há membros cadastrados para exportar.');
      return;
    }
    const md = exportMembersToMarkdown(members);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rol_membros_uph_${new Date().getFullYear()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSituacao, setFilterSituacao] = useState<'todos' | 'comungantes' | 'oficiais' | 'dizimistas'>('todos');

  // Deletion Modal
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  // PIN Generation Modal
  const [pinConfirmModal, setPinConfirmModal] = useState<{
    show: boolean;
    member: Member | null;
    isRegenerate: boolean;
  }>({
    show: false,
    member: null,
    isRegenerate: false
  });

  // PIN Reveal & Copy State
  const [revealedPins, setRevealedPins] = useState<Record<string, boolean>>({});
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);

  const handleCopyPin = (e: React.MouseEvent, memberId: string, pin: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(pin);
    setCopiedPinId(memberId);
    setTimeout(() => setCopiedPinId(null), 2000);
  };

  const handleSendPin = async (e: React.MouseEvent, member: Member) => {
    e.stopPropagation();
    if (!member.pinCode) return;
    const res = await activePinDispatcher.sendPin(member, member.pinCode);
    if (!res.success && res.error) {
      alert(res.error);
    }
  };

  const togglePinVisibility = (e: React.MouseEvent, memberId: string) => {
    e.stopPropagation();
    setRevealedPins(prev => ({ ...prev, [memberId]: !prev[memberId] }));
  };

  // Edit Modal State
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Member>>({});

  React.useEffect(() => {
    if (initialEditingMember) {
      handleStartEdit(initialEditingMember);
      onClearEditingMember?.();
    }
  }, [initialEditingMember]);

  // Open Edit Modal
  const handleStartEdit = (member: Member) => {
    setEditingMember(member);
    setEditFormData({
      name: stripEcclesiasticalTitle(member.name || ''),
      cargo: member.cargo || '',
      funcaoEclesiastica: member.funcaoEclesiastica || 'Não se aplica',
      situacao: member.situacao || 'Em Plena Comunhão',
      contato: member.contato || '',
      email: member.email || '',
      endereco: member.endereco || '',
      cpf: member.cpf || '',
      rg: member.rg || '',
      nascimento: member.nascimento || '',
      estadoCivil: member.estadoCivil || 'Casado',
      naturalidade: member.naturalidade || '',
      tipoSanguineo: member.tipoSanguineo || '',
      filiacaoMae: member.filiacaoMae || '',
      filiacaoPai: member.filiacaoPai || '',
      dataBatismo: member.dataBatismo || '',
      dataProfissaoFe: member.dataProfissaoFe || '',
      uphEntryDate: member.uphEntryDate || '',
      dizimista: !!member.dizimista,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    if (!editFormData.name?.trim()) {
      alert('O nome do membro é obrigatório.');
      return;
    }

    const updatePayload: Partial<Member> = {
      name: editFormData.name.trim(),
      cargo: editFormData.cargo?.trim() || '',
      funcaoEclesiastica: editFormData.funcaoEclesiastica || 'Não se aplica',
      situacao: editFormData.situacao || 'Em Plena Comunhão',
      contato: editFormData.contato?.trim() || '',
      email: editFormData.email?.trim() || '',
      endereco: editFormData.endereco?.trim() || '',
      cpf: editFormData.cpf?.trim() || '',
      rg: editFormData.rg?.trim() || '',
      nascimento: editFormData.nascimento || '',
      estadoCivil: editFormData.estadoCivil || 'Casado',
      naturalidade: editFormData.naturalidade?.trim() || '',
      tipoSanguineo: editFormData.tipoSanguineo?.trim() || '',
      filiacaoMae: editFormData.filiacaoMae?.trim() || '',
      filiacaoPai: editFormData.filiacaoPai?.trim() || '',
      dataBatismo: editFormData.dataBatismo || '',
      dataProfissaoFe: editFormData.dataProfissaoFe || '',
      uphEntryDate: editFormData.uphEntryDate || '',
      dizimista: !!editFormData.dizimista,
    };

    try {
      await updateMember(editingMember.id, updatePayload);
      setEditingMember(null);
    } catch (err) {
      console.error('Erro ao atualizar membro:', err);
      const msg = err instanceof Error ? err.message : 'Verifique sua conexão ou permissões.';
      alert(`Falha ao salvar alterações do membro: ${msg}`);
    }
  };

  // Add Member Handler
  const handleAdd = async () => {
    const trimmedName = newMemberName.trim();
    if (!trimmedName) return;

    setIsSubmitting(true);
    let finalName = stripEcclesiasticalTitle(trimmedName);
    let finalCargo = newMemberCargo.trim();
    let funcaoEcl: FuncaoEclesiastica = 'Não se aplica';

    if (newMemberModality === 'Diácono') {
      funcaoEcl = 'Diácono';
      if (!finalCargo) finalCargo = 'Diácono';
    } else if (newMemberModality === 'Presbítero') {
      funcaoEcl = 'Presbítero';
      if (!finalCargo) finalCargo = 'Presbítero';
    } else if (newMemberModality === 'Pastor') {
      funcaoEcl = 'Pastor';
      if (!finalCargo) finalCargo = 'Pastor';
    }

    const extra: Partial<Member> = {
      funcaoEclesiastica: funcaoEcl,
      situacao: newSituacao,
      contato: newContato.trim() || undefined,
      email: newEmail.trim() || undefined,
      nascimento: newNascimento || undefined,
      cpf: newCpf.trim() || undefined,
      dizimista: newDizimista
    };

    try {
      await addMember(finalName, finalCargo, newMemberEntryDate, extra);

      // Reset Form
      setNewMemberName('');
      setNewMemberModality('Não se aplica');
      setNewMemberCargo('');
      setNewMemberEntryDate('');
      setNewContato('');
      setNewEmail('');
      setNewNascimento('');
      setNewCpf('');
      setNewSituacao('Em Plena Comunhão');
      setNewDizimista(false);
      setShowExtendedAdd(false);
      setShowAddForm(false);
    } catch (err) {
      console.error('Erro ao adicionar membro:', err);
      const msg = err instanceof Error ? err.message : 'Verifique a conexão com o servidor.';
      alert(`Falha ao adicionar membro: ${msg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Summary Metrics matching the Dashboard institutional standard
  const totalMembros = members.length;
  
  const oficiaisCount = useMemo(() => {
    return members.filter(m => {
      const isOficial = (
        m.name.includes('Presb.') || m.name.includes('Diác.') || m.name.includes('Rev.') ||
        m.cargo?.includes('Presbítero') || m.cargo?.includes('Diácono') || m.cargo?.includes('Pastor') ||
        m.funcaoEclesiastica === 'Presbítero' || m.funcaoEclesiastica === 'Diácono' || m.funcaoEclesiastica === 'Pastor'
      );
      return isOficial;
    }).length;
  }, [members]);

  const comungantesCount = useMemo(() => {
    return members.filter(m => !m.situacao || m.situacao === 'Em Plena Comunhão').length;
  }, [members]);

  const dizimistasCount = useMemo(() => {
    return members.filter(m => !!m.dizimista).length;
  }, [members]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const queryDigits = q.replace(/\D/g, '');

    return members.filter(m => {
      // 1. Situation filter
      if (filterSituacao === 'comungantes') {
        if (m.situacao && m.situacao !== 'Em Plena Comunhão') return false;
      } else if (filterSituacao === 'oficiais') {
        const isOficial = (
          m.name.includes('Presb.') || m.name.includes('Diác.') || m.name.includes('Rev.') ||
          m.cargo?.includes('Presbítero') || m.cargo?.includes('Diácono') || m.cargo?.includes('Pastor') ||
          m.funcaoEclesiastica === 'Presbítero' || m.funcaoEclesiastica === 'Diácono' || m.funcaoEclesiastica === 'Pastor'
        );
        if (!isOficial) return false;
      } else if (filterSituacao === 'dizimistas') {
        if (!m.dizimista) return false;
      }

      // 2. Search query
      if (!q) return true;

      // Digits match for CPF or Phone
      if (queryDigits.length >= 3) {
        const mCpfDigits = String(m.cpf || '').replace(/\D/g, '');
        const mPhoneDigits = String(m.contato || '').replace(/\D/g, '');
        if (mCpfDigits.includes(queryDigits) || mPhoneDigits.includes(queryDigits)) return true;
      }

      return (
        m.name.toLowerCase().includes(q) ||
        (m.cargo && m.cargo.toLowerCase().includes(q)) ||
        (m.funcaoEclesiastica && m.funcaoEclesiastica.toLowerCase().includes(q)) ||
        (m.situacao && m.situacao.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.pinCode && m.pinCode.includes(q))
      );
    }).sort(compareMembersByName);
  }, [members, searchQuery, filterSituacao]);

  return (
    <div className="space-y-6 md:space-y-8">
      {/* 1. Executive KPI Cards (Aligned with Dashboard standard) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 text-left">
        <div className="bg-[#1B2E24] dark:bg-[#14231B] p-5 rounded-2xl shadow-2xs text-[#FAF8F5] border border-[#2A3A31] transition-all">
          <p className="text-xs font-semibold text-[#8A968F] mb-2">Rol Ativo Total</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl md:text-4xl font-mono font-bold text-[#FAF8F5] tracking-tight">{totalMembros}</p>
            <span className="text-xs font-medium text-[#C2A267] dark:text-[#C8A96E]">irmãos</span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18221D] p-5 rounded-2xl border border-[#E4DFD5] dark:border-[#2A3A31] shadow-2xs transition-colors">
          <p className="text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] mb-2">Oficiais da Igreja</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl md:text-4xl font-mono font-bold text-[#1B2E24] dark:text-[#EDEDE8] tracking-tight">{oficiaisCount}</p>
            <span className="text-xs font-medium text-[#5C665F] dark:text-[#8A968F]">
              {totalMembros > 0 ? `${Math.round((oficiaisCount / totalMembros) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18221D] p-5 rounded-2xl border border-[#E4DFD5] dark:border-[#2A3A31] shadow-2xs transition-colors">
          <p className="text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] mb-2">Em Plena Comunhão</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl md:text-4xl font-mono font-bold text-emerald-700 dark:text-emerald-400 tracking-tight">{comungantesCount}</p>
            <span className="text-xs font-medium text-[#5C665F] dark:text-[#8A968F]">
              {totalMembros > 0 ? `${Math.round((comungantesCount / totalMembros) * 100)}%` : '0%'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#18221D] p-5 rounded-2xl border border-[#E4DFD5] dark:border-[#2A3A31] shadow-2xs transition-colors">
          <p className="text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] mb-2">Dizimistas Ativos</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl md:text-4xl font-mono font-bold text-[#1B2E24] dark:text-[#EDEDE8] tracking-tight">{dizimistasCount}</p>
            <span className="text-xs font-medium text-[#C2A267] dark:text-[#C8A96E]">regulares</span>
          </div>
        </div>
      </div>

      {/* 2. Top Action Bar with Section Title and Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif font-bold text-lg md:text-xl text-[#1B2E24] dark:text-[#EDEDE8] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#C2A267] dark:text-[#C8A96E]" />
            Rol de Membros da Sociedade
          </h3>
          <p className="text-xs text-[#5C665F] dark:text-[#8A968F] mt-0.5">
            Cadastros oficiais, histórico de ofícios e geração de credenciais eleitorais
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {importMembersBatch && (
            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="px-3.5 py-2.5 bg-white dark:bg-[#18221D] border border-[#E4DFD5] dark:border-[#2A3A31] text-[#1B2E24] dark:text-[#EDEDE8] hover:bg-[#FAF8F5] dark:hover:bg-[#202C26] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              title="Alimentar rol de membros a partir de arquivo Markdown (.md)"
            >
              <Upload className="w-4 h-4 text-[#C2A267] dark:text-[#C8A96E]" />
              <span>Alimentar Rol (.md)</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportMarkdown}
            disabled={members.length === 0}
            className="px-3.5 py-2.5 bg-white dark:bg-[#18221D] border border-[#E4DFD5] dark:border-[#2A3A31] text-[#1B2E24] dark:text-[#EDEDE8] hover:bg-[#FAF8F5] dark:hover:bg-[#202C26] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-40 shadow-2xs cursor-pointer"
            title="Exportar rol cadastrado em formato Markdown oficial"
          >
            <Download className="w-4 h-4 text-[#5C665F] dark:text-[#8A968F]" />
            <span>Exportar (.md)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddForm(prev => !prev)}
            className="px-4 py-2.5 bg-[#1B2E24] dark:bg-[#C8A96E] hover:bg-[#14231B] dark:hover:bg-[#b99859] text-[#FAF8F5] dark:text-[#111614] rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-2xs cursor-pointer active:scale-95"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showAddForm ? 'Fechar Cadastro' : 'Novo Membro'}</span>
          </button>
        </div>
      </div>

      {/* 3. Collapsible / Dedicated "Cadastrar Novo Integrante" Card */}
      {showAddForm && (
        <div className="bg-white dark:bg-[#18221D] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-2xl shadow-2xs p-5 md:p-7 transition-colors animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between gap-4 mb-5 pb-4 border-b border-[#E4DFD5] dark:border-[#2A3A31]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1B2E24]/10 dark:bg-[#111614] border border-[#1B2E24]/20 dark:border-[#2A3A31] text-[#1B2E24] dark:text-[#C8A96E] flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-base text-[#1B2E24] dark:text-[#EDEDE8]">
                  Cadastrar Novo Membro no Rol
                </h4>
                <p className="text-xs text-[#5C665F] dark:text-[#8A968F]">
                  Preencha os dados e gere as credenciais institucionais
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowExtendedAdd(!showExtendedAdd)}
              className="px-3 py-1.5 text-xs font-bold text-[#1B2E24] dark:text-[#C8A96E] hover:underline flex items-center gap-1 transition-colors cursor-pointer"
            >
              {showExtendedAdd ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showExtendedAdd ? 'Menos campos' : '+ Ficha Completa'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1.5 ml-1">
                Nome Completo *
              </label>
              <input 
                type="text" 
                placeholder="Ex: João da Silva Santos"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl focus:outline-hidden focus:border-[#1B2E24] dark:focus:border-[#C8A96E] focus:ring-1 focus:ring-[#1B2E24] dark:focus:ring-[#C8A96E] transition-all text-xs md:text-sm font-medium text-[#1B2E24] dark:text-[#EDEDE8] placeholder:text-[#5C665F]/60"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd();
                }}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1.5 ml-1">
                Ofício Eclesiástico
              </label>
              <select
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl focus:outline-hidden focus:border-[#1B2E24] dark:focus:border-[#C8A96E] focus:ring-1 focus:ring-[#1B2E24] dark:focus:ring-[#C8A96E] transition-all text-xs md:text-sm font-medium text-[#1B2E24] dark:text-[#EDEDE8]"
                value={newMemberModality}
                onChange={(e) => setNewMemberModality(e.target.value)}
              >
                <option value="Não se aplica">Não se aplica</option>
                <option value="Diácono">Diácono</option>
                <option value="Presbítero">Presbítero</option>
                <option value="Pastor">Pastor</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1.5 ml-1">
                Cargo na UPH
              </label>
              <input 
                type="text" 
                placeholder="Ex: Sócio, Tesoureiro"
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl focus:outline-hidden focus:border-[#1B2E24] dark:focus:border-[#C8A96E] focus:ring-1 focus:ring-[#1B2E24] dark:focus:ring-[#C8A96E] transition-all text-xs md:text-sm font-medium text-[#1B2E24] dark:text-[#EDEDE8] placeholder:text-[#5C665F]/60"
                value={newMemberCargo}
                onChange={(e) => setNewMemberCargo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd();
                }}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1.5 ml-1">
                Entrada na UPH
              </label>
              <input 
                type="date" 
                className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl focus:outline-hidden focus:border-[#1B2E24] dark:focus:border-[#C8A96E] focus:ring-1 focus:ring-[#1B2E24] dark:focus:ring-[#C8A96E] transition-all text-xs md:text-sm font-medium text-[#1B2E24] dark:text-[#EDEDE8]"
                value={newMemberEntryDate}
                onChange={(e) => setNewMemberEntryDate(e.target.value)}
              />
            </div>

            <div className="md:col-span-2 flex items-end">
              <button 
                type="button"
                onClick={handleAdd}
                disabled={isSubmitting || !newMemberName.trim()}
                className="w-full bg-[#1B2E24] dark:bg-[#C8A96E] hover:bg-[#14231B] dark:hover:bg-[#b99859] disabled:opacity-40 text-white dark:text-[#111614] h-[42px] rounded-xl font-bold active:scale-95 transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer text-xs md:text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmitting ? 'Gravando...' : 'Cadastrar'}</span>
              </button>
            </div>
          </div>

          {/* Extended Optional Registration Fields */}
          {showExtendedAdd && (
            <div className="mt-4 pt-4 border-t border-[#E4DFD5] dark:border-[#2A3A31] grid grid-cols-1 md:grid-cols-12 gap-3.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1.5 ml-1">
                  WhatsApp / Celular
                </label>
                <input 
                  type="text" 
                  placeholder="(95) 99123-4567"
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs font-medium text-[#1B2E24] dark:text-[#EDEDE8]"
                  value={newContato}
                  onChange={(e) => setNewContato(e.target.value)}
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1.5 ml-1">
                  E-mail
                </label>
                <input 
                  type="email" 
                  placeholder="membro@email.com"
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs font-medium text-[#1B2E24] dark:text-[#EDEDE8]"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1.5 ml-1">
                  Nascimento
                </label>
                <input 
                  type="date" 
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs font-medium text-[#1B2E24] dark:text-[#EDEDE8]"
                  value={newNascimento}
                  onChange={(e) => setNewNascimento(e.target.value)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1.5 ml-1">
                  CPF
                </label>
                <input 
                  type="text" 
                  placeholder="000.000.000-00"
                  className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs font-medium text-[#1B2E24] dark:text-[#EDEDE8]"
                  value={newCpf}
                  onChange={(e) => setNewCpf(e.target.value)}
                />
              </div>

              <div className="md:col-span-2 flex items-center pt-5 pl-2">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-[#1B2E24] dark:text-[#EDEDE8]">
                  <input 
                    type="checkbox"
                    checked={newDizimista}
                    onChange={(e) => setNewDizimista(e.target.checked)}
                    className="w-4 h-4 rounded text-[#1B2E24] dark:text-[#C8A96E] focus:ring-[#1B2E24]"
                  />
                  Dizimista Ativo
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Search, Filter Bar and Members List Card */}
      <div className="bg-white dark:bg-[#18221D] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-2xl shadow-2xs overflow-hidden flex flex-col transition-colors">
        
        {/* Search & Filter Header */}
        <div className="p-4 sm:p-5 border-b border-[#E4DFD5] dark:border-[#2A3A31] flex flex-col sm:flex-row gap-3.5 items-center justify-between bg-[#FAF8F5] dark:bg-[#14231B]">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#5C665F] dark:text-[#8A968F] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, cargo, celular, CPF..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs font-medium text-[#1B2E24] dark:text-[#EDEDE8] placeholder:text-[#5C665F]/60 focus:outline-hidden focus:border-[#1B2E24] dark:focus:border-[#C8A96E]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C665F] hover:text-[#1B2E24] dark:text-[#8A968F] dark:hover:text-[#EDEDE8] text-xs cursor-pointer"
                title="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Unified Filter Tabs (Responsive horizontal scrolling on mobile, zero overflow) */}
          <div className="w-full sm:w-auto overflow-x-auto max-w-full flex items-center bg-[#F6F4EF] dark:bg-[#111614] p-1 rounded-xl border border-[#E4DFD5] dark:border-[#2A3A31] gap-1 self-stretch sm:self-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setFilterSituacao('todos')}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterSituacao === 'todos' 
                  ? 'bg-[#1B2E24] text-[#FAF8F5] dark:bg-[#C8A96E] dark:text-[#111614] shadow-2xs' 
                  : 'text-[#5C665F] dark:text-[#8A968F] hover:text-[#1B2E24] dark:hover:text-[#EDEDE8]'
              }`}
            >
              Todos ({members.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterSituacao('comungantes')}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterSituacao === 'comungantes' 
                  ? 'bg-[#1B2E24] text-[#FAF8F5] dark:bg-[#C8A96E] dark:text-[#111614] shadow-2xs' 
                  : 'text-[#5C665F] dark:text-[#8A968F] hover:text-[#1B2E24] dark:hover:text-[#EDEDE8]'
              }`}
            >
              Comungantes ({comungantesCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterSituacao('oficiais')}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterSituacao === 'oficiais' 
                  ? 'bg-[#1B2E24] text-[#FAF8F5] dark:bg-[#C8A96E] dark:text-[#111614] shadow-2xs' 
                  : 'text-[#5C665F] dark:text-[#8A968F] hover:text-[#1B2E24] dark:hover:text-[#EDEDE8]'
              }`}
            >
              Oficiais ({oficiaisCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterSituacao('dizimistas')}
              className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterSituacao === 'dizimistas' 
                  ? 'bg-[#1B2E24] text-[#FAF8F5] dark:bg-[#C8A96E] dark:text-[#111614] shadow-2xs' 
                  : 'text-[#5C665F] dark:text-[#8A968F] hover:text-[#1B2E24] dark:hover:text-[#EDEDE8]'
              }`}
            >
              Dizimistas ({dizimistasCount})
            </button>
          </div>
        </div>

        {/* Desktop Table Column Header */}
        <div className="hidden md:grid bg-[#FAF8F5]/80 dark:bg-[#14231B] border-b border-[#E4DFD5] dark:border-[#2A3A31] grid-cols-12 px-6 md:px-8 py-3 text-xs font-semibold uppercase text-[#5C665F] dark:text-[#8A968F] tracking-wider">
          <div className="col-span-4">Membro</div>
          <div className="col-span-2">Cargo UPH</div>
          <div className="col-span-2">Contato / WhatsApp</div>
          <div className="col-span-2">PIN de Votação</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>
        
        {/* Members Rows */}
        <div className="divide-y divide-[#E4DFD5] dark:divide-[#2A3A31]">
          {filteredMembers.length === 0 ? (
            <div className="p-16 text-center text-[#5C665F] dark:text-[#8A968F] font-medium italic text-xs">
              <Users className="w-10 h-10 text-[#C2A267]/40 dark:text-[#C8A96E]/30 mx-auto mb-3" />
              <p className="font-semibold text-sm text-[#1B2E24] dark:text-[#EDEDE8] not-italic mb-1">Nenhum membro encontrado</p>
              <p className="text-xs">
                {searchQuery || filterSituacao !== 'todos'
                  ? 'Tente ajustar os filtros ou os termos de busca.'
                  : 'Alimente o rol via arquivo .md ou adicione um novo integrante.'}
              </p>
            </div>
          ) : (
            filteredMembers.map((member) => {
              const wa = gerarWhatsAppUrl(member.contato, `Olá ${member.name}, paz do Senhor!`);
              const idade = calcularIdade(member.nascimento);
              const isUnderDiscipline = member.situacao === 'Sob Disciplina';

              return (
                <div 
                  key={member.id} 
                  onClick={() => onSelectMember(member)}
                  className="flex flex-col md:grid md:grid-cols-12 px-4 sm:px-6 md:px-8 py-3.5 gap-2.5 md:gap-0 md:items-center transition-colors hover:bg-[#FAF8F5] dark:hover:bg-[#14231B]/40 cursor-pointer group/row"
                >
                  {/* Name and Institutional Avatar */}
                  <div className="md:col-span-4 flex items-center justify-between md:justify-start gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 md:w-9 md:h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-2xs bg-[#1B2E24]/10 dark:bg-[#111614] border border-[#1B2E24]/20 dark:border-[#2A3A31] text-[#1B2E24] dark:text-[#C8A96E] shrink-0">
                        {getInitials(member.name)}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-serif font-bold text-base text-[#1B2E24] dark:text-[#EDEDE8] leading-tight group-hover/row:text-[#C2A267] dark:group-hover/row:text-[#C8A96E] transition-colors truncate">
                          {stripEcclesiasticalTitle(member.name)}
                        </span>
                        
                        {/* Unboxed Metadata with Typographic Separator (Anti-Slop Zero-Pill) */}
                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[#5C665F] dark:text-[#8A968F] truncate">
                          {member.funcaoEclesiastica && member.funcaoEclesiastica !== 'Não se aplica' ? (
                            <span className="font-medium text-[#1B2E24] dark:text-[#EDEDE8]">
                              {member.funcaoEclesiastica}
                            </span>
                          ) : (
                            <span>{member.cargo || 'Membro'}</span>
                          )}

                          {idade !== null && (
                            <>
                              <span aria-hidden="true" className="text-[#C2A267] dark:text-[#C8A96E]">·</span>
                              <span className="font-mono tabular-nums">{idade} anos</span>
                            </>
                          )}

                          {isUnderDiscipline ? (
                            <>
                              <span aria-hidden="true" className="text-rose-500">·</span>
                              <span className="text-rose-600 dark:text-rose-400 font-semibold text-[11px]">Sob Disciplina</span>
                            </>
                          ) : (
                            <>
                              <span aria-hidden="true" className="text-[#C2A267] dark:text-[#C8A96E]">·</span>
                              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Comunhão</span>
                            </>
                          )}

                          {member.dizimista && (
                            <span className="text-[#C2A267] dark:text-[#C8A96E] font-bold text-xs ml-0.5" title="Dizimista Ativo">
                              ★
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cargo UPH em mobile */}
                    {member.cargo && (
                      <span className="md:hidden text-[10px] font-semibold px-2 py-0.5 bg-[#FAF8F5] dark:bg-[#111614] text-[#1B2E24] dark:text-[#C8A96E] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-md shrink-0">
                        {member.cargo}
                      </span>
                    )}
                  </div>

                  {/* Cargo UPH (Desktop) */}
                  <div className="hidden md:block col-span-2 text-xs text-[#5C665F] dark:text-[#8A968F] font-medium truncate pr-2">
                    <span className="px-2.5 py-1 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-lg text-xs font-semibold text-[#1B2E24] dark:text-[#EDEDE8]">
                      {member.cargo || 'Membro UPH'}
                    </span>
                  </div>

                  {/* Contato & WhatsApp (Desktop) */}
                  <div className="hidden md:flex col-span-2 items-center gap-2">
                    {member.contato ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-[#5C665F] dark:text-[#8A968F] font-mono tabular-nums">
                          {formatPhone(member.contato)}
                        </span>
                        {wa && (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md transition-colors"
                            title="Conversar no WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-[#5C665F]/40 text-xs font-mono">—</span>
                    )}
                  </div>

                  {/* PIN e Ações (Responsivo no celular com flex-wrap) */}
                  <div className="flex flex-wrap items-center justify-between gap-2 md:contents pt-2 md:pt-0 border-t border-[#E4DFD5] dark:border-[#2A3A31] md:border-t-0">
                    {/* PIN de Votação */}
                    <div className="md:col-span-2 flex items-center gap-1.5 flex-wrap">
                      {member.pinCode ? (
                        <div className="flex items-center gap-1 bg-[#FAF8F5] dark:bg-[#111614] px-2 py-1 md:py-0.5 rounded-lg border border-[#E4DFD5] dark:border-[#2A3A31]">
                          <span className="font-mono text-xs text-[#1B2E24] dark:text-[#C8A96E] font-bold tracking-wider select-all tabular-nums">
                            {revealedPins[member.id] ? member.pinCode : '••••'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => togglePinVisibility(e, member.id)}
                            className="p-1 text-[#5C665F] hover:text-[#1B2E24] dark:text-[#8A968F] dark:hover:text-[#EDEDE8] rounded-md transition-colors cursor-pointer"
                            title={revealedPins[member.id] ? "Ocultar PIN" : "Revelar PIN"}
                            aria-label={revealedPins[member.id] ? `Ocultar PIN de ${member.name}` : `Revelar PIN de ${member.name}`}
                          >
                            {revealedPins[member.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleCopyPin(e, member.id, member.pinCode!)}
                            className="p-1 text-[#5C665F] hover:text-[#1B2E24] dark:text-[#8A968F] dark:hover:text-[#EDEDE8] rounded-md transition-colors cursor-pointer"
                            title="Copiar PIN"
                            aria-label={`Copiar PIN de ${member.name}`}
                          >
                            {copiedPinId === member.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          {member.contato && wa && (
                            <a
                              href={wa}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="md:hidden p-1 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleSendPin(e, member)}
                            className="p-1 text-[#5C665F] hover:text-emerald-600 dark:text-[#8A968F] dark:hover:text-emerald-400 rounded-md transition-colors cursor-pointer"
                            title={member.contato ? `Enviar PIN para ${member.contato}` : "Membro sem telefone cadastrado"}
                            aria-label={`Enviar PIN para ${member.name}`}
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPinConfirmModal({
                                show: true,
                                member,
                                isRegenerate: true
                              });
                            }}
                            className="hidden md:block p-1 text-[#5C665F] hover:text-[#C2A267] dark:text-[#8A968F] dark:hover:text-[#C8A96E] rounded-md transition-colors cursor-pointer"
                            title="Regenerar PIN Único"
                            aria-label={`Regenerar PIN para ${member.name}`}
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPinConfirmModal({
                              show: true,
                              member,
                              isRegenerate: false
                            });
                          }}
                          className="text-xs bg-[#1B2E24]/10 dark:bg-[#111614] text-[#1B2E24] dark:text-[#C8A96E] border border-[#1B2E24]/20 dark:border-[#2A3A31] px-2.5 py-1 rounded-lg font-bold hover:bg-[#1B2E24]/20 transition-colors flex items-center gap-1 cursor-pointer"
                          aria-label={`Gerar PIN único para ${member.name}`}
                        >
                          <RefreshCw className="w-3 h-3" /> Gerar PIN
                        </button>
                      )}
                    </div>

                    {/* Quick Row Actions */}
                    <div className="md:col-span-2 flex items-center justify-end gap-1">
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMember(member);
                        }}
                        className="p-2 md:p-1.5 text-[#5C665F] dark:text-[#8A968F] hover:text-[#1B2E24] dark:hover:text-[#EDEDE8] hover:bg-[#FAF8F5] dark:hover:bg-[#111614] rounded-lg transition-all cursor-pointer"
                        title="Ver Ficha Cadastral e Frequência"
                        aria-label={`Ver Ficha de ${member.name}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(member);
                        }}
                        className="p-2 md:p-1.5 text-[#5C665F] dark:text-[#8A968F] hover:text-[#1B2E24] dark:hover:text-[#EDEDE8] hover:bg-[#FAF8F5] dark:hover:bg-[#111614] rounded-lg transition-all cursor-pointer"
                        title="Editar Ficha Completa"
                        aria-label={`Editar Ficha de ${member.name}`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMemberToDelete(member.id);
                        }}
                        className="p-2 md:p-1.5 text-[#5C665F] dark:text-[#8A968F] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all cursor-pointer"
                        title="Excluir Membro"
                        aria-label={`Excluir ${member.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Table Footer */}
        <div className="p-4 px-6 md:p-5 border-t border-[#E4DFD5] dark:border-[#2A3A31] flex items-center justify-between text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] bg-[#FAF8F5] dark:bg-[#14231B] uppercase tracking-wider">
          <span>Exibindo <span className="font-mono tabular-nums font-bold text-[#1B2E24] dark:text-[#EDEDE8]">{filteredMembers.length}</span> de <span className="font-mono tabular-nums font-bold text-[#1B2E24] dark:text-[#EDEDE8]">{members.length}</span> membros</span>
          <Users className="w-4 h-4 text-[#C2A267] dark:text-[#C8A96E]" />
        </div>
      </div>

      {/* 5. Modal de Exclusão (Harmonized) */}
      {memberToDelete && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18221D] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-serif font-bold text-[#1B2E24] dark:text-[#EDEDE8] mb-2">
              Remover Membro do Rol
            </h3>
            <p className="text-[#5C665F] dark:text-[#8A968F] mb-6 text-xs md:text-sm">
              ATENÇÃO: Este membro será excluído do rol da sociedade. Tem certeza de que deseja continuar?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="flex-1 px-4 py-2.5 bg-[#FAF8F5] dark:bg-[#111614] text-[#1B2E24] dark:text-[#EDEDE8] border border-[#E4DFD5] dark:border-[#2A3A31] font-bold rounded-xl hover:bg-[#E4DFD5]/50 transition-colors text-xs cursor-pointer"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await removeMember(memberToDelete);
                    setMemberToDelete(null);
                  } catch (error) {
                    console.error(error);
                    alert('Erro ao excluir membro.');
                  }
                }}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors text-xs cursor-pointer shadow-2xs"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal de Confirmação de PIN (Harmonized) */}
      {pinConfirmModal.show && pinConfirmModal.member && (
        <div className="fixed inset-0 z-[65] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#18221D] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-serif font-bold text-[#1B2E24] dark:text-[#EDEDE8] mb-2">
              {pinConfirmModal.isRegenerate ? 'Regenerar PIN Único' : 'Gerar PIN Único'}
            </h3>
            <p className="text-[#5C665F] dark:text-[#8A968F] mb-6 text-xs md:text-sm leading-relaxed">
              Deseja {pinConfirmModal.isRegenerate ? 'substituir o PIN atual por um novo' : 'gerar um novo PIN único de 4 dígitos'} para <span className="font-bold text-[#1B2E24] dark:text-[#EDEDE8]">{pinConfirmModal.member.name}</span>?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPinConfirmModal({ show: false, member: null, isRegenerate: false })}
                className="flex-1 px-4 py-2.5 bg-[#FAF8F5] dark:bg-[#111614] text-[#1B2E24] dark:text-[#EDEDE8] border border-[#E4DFD5] dark:border-[#2A3A31] font-bold rounded-xl hover:bg-[#E4DFD5]/50 transition-colors text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const member = pinConfirmModal.member;
                  if (member) {
                    const existingPins = new Set(members.map(m => m.pinCode).filter(Boolean));
                    let newPin = '';
                    let isUnique = false;
                    let attempts = 0;
                    while (!isUnique && attempts < 1000) {
                      newPin = Math.floor(1000 + Math.random() * 9000).toString();
                      if (!existingPins.has(newPin)) {
                        isUnique = true;
                      }
                      attempts++;
                    }
                    await updateMember(member.id, { pinCode: newPin });
                  }
                  setPinConfirmModal({ show: false, member: null, isRegenerate: false });
                }}
                className="flex-1 px-4 py-2.5 bg-[#1B2E24] dark:bg-[#C8A96E] hover:bg-[#14231B] text-white dark:text-[#111614] font-bold rounded-xl transition-colors text-xs cursor-pointer shadow-2xs"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal de Edição Completa da Ficha (Harmonized) */}
      {editingMember && (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#18221D] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E4DFD5] dark:border-[#2A3A31] flex items-center justify-between bg-[#FAF8F5] dark:bg-[#14231B]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1B2E24]/10 dark:bg-[#111614] border border-[#1B2E24]/20 dark:border-[#2A3A31] text-[#1B2E24] dark:text-[#C8A96E] flex items-center justify-center shrink-0">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-serif font-bold text-[#1B2E24] dark:text-[#EDEDE8] leading-tight">
                    Editar Ficha do Membro
                  </h3>
                  <p className="text-xs text-[#5C665F] dark:text-[#8A968F] font-medium">{editingMember.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="p-2 hover:bg-[#E4DFD5]/50 dark:hover:bg-[#2A3A31] rounded-xl text-[#5C665F] dark:text-[#8A968F] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveEdit} className="overflow-y-auto flex-1 p-5 md:p-6 space-y-6">
              {/* Seção 1: Identificação & UPH */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-[#1B2E24] dark:text-[#C8A96E] tracking-wider flex items-center gap-1.5 border-b border-[#E4DFD5] dark:border-[#2A3A31] pb-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#C2A267]" /> 1. Identificação Geral & UPH
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-6">
                    <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.name || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs font-semibold text-[#1B2E24] dark:text-[#EDEDE8] focus:border-[#1B2E24] dark:focus:border-[#C8A96E]"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1">
                      Cargo na UPH
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Presidente, Sócio"
                      value={editFormData.cargo || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, cargo: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs font-semibold text-[#1B2E24] dark:text-[#EDEDE8] focus:border-[#1B2E24] dark:focus:border-[#C8A96E]"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1">
                      Entrada na UPH
                    </label>
                    <input
                      type="date"
                      value={editFormData.uphEntryDate || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, uphEntryDate: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs font-semibold text-[#1B2E24] dark:text-[#EDEDE8] focus:border-[#1B2E24] dark:focus:border-[#C8A96E]"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Contato & Endereço */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-[#1B2E24] dark:text-[#C8A96E] tracking-wider flex items-center gap-1.5 border-b border-[#E4DFD5] dark:border-[#2A3A31] pb-1.5">
                  <Phone className="w-4 h-4 text-[#C2A267]" /> 2. Contato & Residência
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1">
                      Celular / WhatsApp
                    </label>
                    <input
                      type="text"
                      placeholder="(95) 99123-4567"
                      value={editFormData.contato || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, contato: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs font-semibold text-[#1B2E24] dark:text-[#EDEDE8] focus:border-[#1B2E24] dark:focus:border-[#C8A96E]"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1">
                      E-mail
                    </label>
                    <input
                      type="email"
                      placeholder="membro@email.com"
                      value={editFormData.email || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs font-semibold text-[#1B2E24] dark:text-[#EDEDE8] focus:border-[#1B2E24] dark:focus:border-[#C8A96E]"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1">
                      Endereço Completo
                    </label>
                    <input
                      type="text"
                      placeholder="Rua, Bairro, Nº"
                      value={editFormData.endereco || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, endereco: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs font-semibold text-[#1B2E24] dark:text-[#EDEDE8] focus:border-[#1B2E24] dark:focus:border-[#C8A96E]"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 3: Documentação & Pessoal */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-[#1B2E24] dark:text-[#C8A96E] tracking-wider flex items-center gap-1.5 border-b border-[#E4DFD5] dark:border-[#2A3A31] pb-1.5">
                  <Calendar className="w-4 h-4 text-[#C2A267]" /> 3. Dados Pessoais & Documentos
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1">
                      CPF
                    </label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={editFormData.cpf || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, cpf: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs font-semibold text-[#1B2E24] dark:text-[#EDEDE8] focus:border-[#1B2E24] dark:focus:border-[#C8A96E]"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1">
                      RG
                    </label>
                    <input
                      type="text"
                      placeholder="Nº do RG"
                      value={editFormData.rg || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, rg: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs font-semibold text-[#1B2E24] dark:text-[#EDEDE8] focus:border-[#1B2E24] dark:focus:border-[#C8A96E]"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1">
                      Data de Nascimento
                    </label>
                    <input
                      type="date"
                      value={editFormData.nascimento || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, nascimento: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs font-semibold text-[#1B2E24] dark:text-[#EDEDE8] focus:border-[#1B2E24] dark:focus:border-[#C8A96E]"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1">
                      Estado Civil
                    </label>
                    <select
                      value={editFormData.estadoCivil || 'Casado'}
                      onChange={(e) => setEditFormData({ ...editFormData, estadoCivil: e.target.value as EstadoCivil })}
                      className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs font-semibold text-[#1B2E24] dark:text-[#EDEDE8]"
                    >
                      <option value="Casado">Casado</option>
                      <option value="Solteiro">Solteiro</option>
                      <option value="Viúvo">Viúvo</option>
                      <option value="Divorciado">Divorciado</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1">
                      Tipo Sanguíneo
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: O+, A+"
                      value={editFormData.tipoSanguineo || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, tipoSanguineo: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs font-semibold text-[#1B2E24] dark:text-[#EDEDE8]"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1">
                      Nome da Mãe
                    </label>
                    <input
                      type="text"
                      value={editFormData.filiacaoMae || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, filiacaoMae: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs font-semibold text-[#1B2E24] dark:text-[#EDEDE8]"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1">
                      Nome do Pai
                    </label>
                    <input
                      type="text"
                      value={editFormData.filiacaoPai || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, filiacaoPai: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs font-semibold text-[#1B2E24] dark:text-[#EDEDE8]"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 4: Vida Eclesiástica */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase text-[#1B2E24] dark:text-[#C8A96E] tracking-wider flex items-center gap-1.5 border-b border-[#E4DFD5] dark:border-[#2A3A31] pb-1.5">
                  <Landmark className="w-4 h-4 text-[#C2A267]" /> 4. Vida Eclesiástica & Igreja
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1">
                      Função / Ofício
                    </label>
                    <select
                      value={editFormData.funcaoEclesiastica || 'Não se aplica'}
                      onChange={(e) => setEditFormData({ ...editFormData, funcaoEclesiastica: e.target.value as FuncaoEclesiastica })}
                      className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs font-semibold text-[#1B2E24] dark:text-[#EDEDE8]"
                    >
                      <option value="Não se aplica">Não se aplica</option>
                      <option value="Pastor">Pastor</option>
                      <option value="Presbítero">Presbítero</option>
                      <option value="Diácono">Diácono</option>
                      <option value="Membro Comungante">Membro Comungante</option>
                      <option value="Cooperador">Cooperador</option>
                    </select>
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1">
                      Situação Canônica
                    </label>
                    <select
                      value={editFormData.situacao || 'Em Plena Comunhão'}
                      onChange={(e) => setEditFormData({ ...editFormData, situacao: e.target.value as SituacaoMembro })}
                      className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs font-semibold text-[#1B2E24] dark:text-[#EDEDE8]"
                    >
                      <option value="Em Plena Comunhão">Em Plena Comunhão</option>
                      <option value="Sob Disciplina">Sob Disciplina</option>
                      <option value="Não Comungante">Não Comungante</option>
                      <option value="Transferido">Transferido</option>
                    </select>
                  </div>
                  <div className="md:col-span-4 flex items-center pt-5 pl-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-[#1B2E24] dark:text-[#EDEDE8]">
                      <input 
                        type="checkbox"
                        checked={!!editFormData.dizimista}
                        onChange={(e) => setEditFormData({ ...editFormData, dizimista: e.target.checked })}
                        className="w-4 h-4 rounded text-[#1B2E24] dark:text-[#C8A96E] focus:ring-[#1B2E24]"
                      />
                      Dizimista Ativo
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
                  <div className="md:col-span-6">
                    <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1">
                      Data de Batismo
                    </label>
                    <input
                      type="date"
                      value={editFormData.dataBatismo || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, dataBatismo: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs font-semibold text-[#1B2E24] dark:text-[#EDEDE8]"
                    />
                  </div>
                  <div className="md:col-span-6">
                    <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1">
                      Data da Profissão de Fé
                    </label>
                    <input
                      type="date"
                      value={editFormData.dataProfissaoFe || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, dataProfissaoFe: e.target.value })}
                      className="w-full px-3.5 py-2 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs font-semibold text-[#1B2E24] dark:text-[#EDEDE8]"
                    />
                  </div>
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="flex gap-3 pt-4 border-t border-[#E4DFD5] dark:border-[#2A3A31]">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="flex-1 py-2.5 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] text-[#1B2E24] dark:text-[#EDEDE8] font-bold rounded-xl hover:bg-[#E4DFD5]/50 transition-colors text-xs uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#1B2E24] dark:bg-[#C8A96E] hover:bg-[#14231B] dark:hover:bg-[#b99859] text-white dark:text-[#111614] font-bold rounded-xl transition-colors shadow-2xs text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. Modal de Alimentação via Markdown */}
      {importMembersBatch && (
        <ImportMarkdownModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          existingMembers={members}
          onImportBatch={async (items, options) => {
            // Adapts members payload to hook signature
            const mapped = items.map(m => ({
              name: m.name || '',
              cargo: m.cargo || '',
              uphEntryDate: m.uphEntryDate || '',
              extraFields: {
                funcaoEclesiastica: m.funcaoEclesiastica,
                situacao: m.situacao,
                contato: m.contato,
                email: m.email,
                endereco: m.endereco,
                cpf: m.cpf,
                rg: m.rg,
                nascimento: m.nascimento,
                estadoCivil: m.estadoCivil,
                naturalidade: m.naturalidade,
                tipoSanguineo: m.tipoSanguineo,
                filiacaoMae: m.filiacaoMae,
                filiacaoPai: m.filiacaoPai,
                dataBatismo: m.dataBatismo,
                dataProfissaoFe: m.dataProfissaoFe,
                dizimista: m.dizimista
              }
            }));
            await importMembersBatch(mapped);
            return {
              added: items.length,
              updated: 0,
              skipped: 0
            };
          }}
        />
      )}
    </div>
  );
};
