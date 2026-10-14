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
  HeartHandshake,
  ShieldCheck,
  Phone,
  Mail,
  Calendar,
  Landmark,
  Upload,
  Download,
  FileText,
  Send
} from 'lucide-react';
import { format } from 'date-fns';
import { Member, FuncaoEclesiastica, SituacaoMembro, EstadoCivil } from '../types';
import { 
  getInitials, 
  calcularIdade, 
  formatPhone, 
  gerarWhatsAppUrl, 
  formatDateBR,
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
    members: Partial<Member>[], 
    options?: { updateExisting?: boolean }
  ) => Promise<{ added: number; updated: number; skipped: number }>;
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
  onOpenEditMember,
  initialEditingMember,
  onClearEditingMember
}) => {
  // Quick Add State
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

  // Add Member
  const handleAdd = async () => {
    const trimmedName = newMemberName.trim();
    if (!trimmedName) return;

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
    } catch (err) {
      console.error('Erro ao adicionar membro:', err);
      const msg = err instanceof Error ? err.message : 'Verifique a conexão com o servidor.';
      alert(`Falha ao adicionar membro: ${msg}`);
    }
  };

  // Filtered members list
  const filteredMembers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const queryDigits = q.replace(/\D/g, '');

    return members.filter(m => {
      // 1. Situation filter
      if (filterSituacao === 'comungantes') {
        if (m.situacao && m.situacao !== 'Em Plena Comunhão') return false;
      } else if (filterSituacao === 'oficiais') {
        const isOficial = (m.name.includes('Presb.') || m.name.includes('Diác.') || m.name.includes('Rev.') ||
          m.cargo?.includes('Presbítero') || m.cargo?.includes('Diácono') || m.cargo?.includes('Pastor') ||
          m.funcaoEclesiastica === 'Presbítero' || m.funcaoEclesiastica === 'Diácono' || m.funcaoEclesiastica === 'Pastor');
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
    <div className="space-y-8">
      {/* Box Adicionar Novo Integrante */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Adicionar Integrante na UPH</h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {importMembersBatch && (
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-1.5"
                title="Alimentar rol de membros a partir de arquivo Markdown (.md)"
              >
                <Upload className="w-3.5 h-3.5" />
                Alimentar Rol (.md)
              </button>
            )}
            
            <button
              type="button"
              onClick={handleExportMarkdown}
              disabled={members.length === 0}
              className="px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition-all flex items-center gap-1.5 disabled:opacity-40"
              title="Exportar rol cadastrado em formato Markdown oficial"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar (.md)
            </button>

            <button
              type="button"
              onClick={() => setShowExtendedAdd(!showExtendedAdd)}
              className="px-3 py-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
            >
              {showExtendedAdd ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showExtendedAdd ? 'Menos campos' : '+ Ficha Completa'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-4">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Nome Completo</label>
            <input 
              type="text" 
              placeholder="Ex: João da Silva Santos"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Ofício / Título</label>
            <select
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
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
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Cargo na UPH</label>
            <input 
              type="text" 
              placeholder="Ex: Sócio, Tesoureiro"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
              value={newMemberCargo}
              onChange={(e) => setNewMemberCargo(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Entrada na UPH</label>
            <input 
              type="date" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
              value={newMemberEntryDate}
              onChange={(e) => setNewMemberEntryDate(e.target.value)}
            />
          </div>
          <div className="md:col-span-2 flex items-end">
            <button 
              onClick={handleAdd}
              className="w-full bg-indigo-600 text-white h-[48px] rounded-2xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Cadastrar
            </button>
          </div>
        </div>

        {/* Campos extras opcionais inspirados no Caixa */}
        {showExtendedAdd && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="md:col-span-3">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">WhatsApp / Celular</label>
              <input 
                type="text" 
                placeholder="(95) 99123-4567"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                value={newContato}
                onChange={(e) => setNewContato(e.target.value)}
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">E-mail</label>
              <input 
                type="email" 
                placeholder="membro@email.com"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Nascimento</label>
              <input 
                type="date" 
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                value={newNascimento}
                onChange={(e) => setNewNascimento(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">CPF</label>
              <input 
                type="text" 
                placeholder="000.000.000-00"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
                value={newCpf}
                onChange={(e) => setNewCpf(e.target.value)}
              />
            </div>
            <div className="md:col-span-2 flex items-center pt-5 pl-2">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input 
                  type="checkbox"
                  checked={newDizimista}
                  onChange={(e) => setNewDizimista(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Dizimista Ativo
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Caixa de Pesquisa, Filtros e Lista */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Barra Superior com Busca e Filtros Rápidos */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/40">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, cargo, celular, CPF..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
            <button
              onClick={() => setFilterSituacao('todos')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                filterSituacao === 'todos' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Todos ({members.length})
            </button>
            <button
              onClick={() => setFilterSituacao('comungantes')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                filterSituacao === 'comungantes' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Comungantes
            </button>
            <button
              onClick={() => setFilterSituacao('oficiais')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                filterSituacao === 'oficiais' 
                  ? 'bg-amber-600 text-white shadow-sm' 
                  : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Oficiais
            </button>
            <button
              onClick={() => setFilterSituacao('dizimistas')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                filterSituacao === 'dizimistas' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Dizimistas
            </button>
          </div>
        </div>

        {/* Cabeçalho da Tabela (Visível apenas em Desktop) */}
        <div className="hidden md:grid bg-slate-50/50 border-b border-slate-100 grid-cols-12 px-6 md:px-8 py-3.5 text-[10px] font-black uppercase text-slate-400 tracking-wider">
          <div className="col-span-4">Membro</div>
          <div className="col-span-2">Cargo UPH</div>
          <div className="col-span-2">Contato / WhatsApp</div>
          <div className="col-span-2">PIN de Votação</div>
          <div className="col-span-2 text-right">Ações</div>
        </div>
        
        {/* Linhas da Tabela */}
        <div className="divide-y divide-slate-100">
          {filteredMembers.length === 0 ? (
            <div className="p-16 text-center text-slate-400 font-medium italic text-xs">
              {searchQuery || filterSituacao !== 'todos'
                ? 'Nenhum membro encontrado com os filtros selecionados.'
                : 'Nenhum membro cadastrado até o momento.'}
            </div>
          ) : (
            filteredMembers.map((member, idx) => {
              const wa = gerarWhatsAppUrl(member.contato, `Olá ${member.name}, paz do Senhor!`);
              const idade = calcularIdade(member.nascimento);

              return (
                <div 
                  key={member.id} 
                  onClick={() => onSelectMember(member)}
                  className={`flex flex-col md:grid md:grid-cols-12 px-4 sm:px-6 md:px-8 py-3.5 gap-2.5 md:gap-0 md:items-center transition-colors hover:bg-indigo-50/40 cursor-pointer group/row ${idx % 2 === 1 ? 'bg-slate-50/30' : ''}`}
                >
                  {/* Topo do Card Mobile / Coluna 1 Desktop: Nome, Avatar e Informações Básicas */}
                  <div className="md:col-span-4 flex items-center justify-between md:justify-start gap-3">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 md:w-9 md:h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm bg-slate-900 text-white group-hover/row:bg-indigo-700 group-hover/row:scale-105 transition-all shrink-0">
                        {getInitials(member.name)}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="font-bold text-slate-800 text-sm leading-tight group-hover/row:text-indigo-600 transition-colors truncate">
                          {stripEcclesiasticalTitle(member.name)}
                        </span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {member.situacao === 'Sob Disciplina' ? (
                            <span className="text-[10px] font-bold text-rose-600">Sob Disciplina</span>
                          ) : (
                            <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 truncate">
                              {member.funcaoEclesiastica && member.funcaoEclesiastica !== 'Não se aplica' 
                                ? member.funcaoEclesiastica 
                                : (member.cargo || 'Membro')}
                              {idade !== null ? ` • ${idade} anos` : ''}
                            </span>
                          )}
                          {member.dizimista && (
                            <span className="text-[10px] text-emerald-600 font-bold" title="Dizimista Ativo">★</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cargo UPH visível em mobile como tag discreta */}
                    {member.cargo && (
                      <span className="md:hidden text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md shrink-0">
                        {member.cargo}
                      </span>
                    )}
                  </div>

                  {/* Cargo UPH (Desktop) */}
                  <div className="hidden md:block col-span-2 text-xs text-slate-600 font-medium truncate pr-2">
                    <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[11px] font-semibold text-slate-700">
                      {member.cargo || 'Membro UPH'}
                    </span>
                  </div>

                  {/* Contato & WhatsApp (Desktop) */}
                  <div className="hidden md:flex col-span-2 items-center gap-2">
                    {member.contato ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-600 font-mono">{formatPhone(member.contato)}</span>
                        {wa && (
                          <a
                            href={wa}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                            title="Conversar no WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300 text-xs">-</span>
                    )}
                  </div>

                  {/* Linha Inferior no Celular / Colunas Finais no Desktop: PIN e Ações */}
                  <div className="flex items-center justify-between md:contents pt-1.5 md:pt-0 border-t border-slate-100 md:border-t-0">
                    {/* PIN de Votação */}
                    <div className="md:col-span-2 flex items-center gap-1.5">
                      {member.pinCode ? (
                        <div className="flex items-center gap-1 bg-slate-50 md:bg-transparent px-2 py-1 md:p-0 rounded-lg border border-slate-100 md:border-0">
                          <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100 font-bold tracking-wider select-all">
                            {revealedPins[member.id] ? member.pinCode : '••••'}
                          </span>
                          <button
                            onClick={(e) => togglePinVisibility(e, member.id)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                            title={revealedPins[member.id] ? "Ocultar PIN" : "Revelar PIN"}
                            aria-label={revealedPins[member.id] ? `Ocultar PIN de ${member.name}` : `Revelar PIN de ${member.name}`}
                          >
                            {revealedPins[member.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={(e) => handleCopyPin(e, member.id, member.pinCode!)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
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
                              className="md:hidden p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={(e) => handleSendPin(e, member)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                            title={member.contato ? `Enviar PIN para ${member.contato}` : "Membro sem telefone cadastrado"}
                            aria-label={`Enviar PIN para ${member.name}`}
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPinConfirmModal({
                                show: true,
                                member,
                                isRegenerate: true
                              });
                            }}
                            className="hidden md:block p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition-colors opacity-0 group-hover/pin:opacity-100 focus:opacity-100 cursor-pointer"
                            title="Regenerar PIN Único"
                            aria-label={`Regenerar PIN para ${member.name}`}
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPinConfirmModal({
                              show: true,
                              member,
                              isRegenerate: false
                            });
                          }}
                          className="text-[11px] bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1 cursor-pointer"
                          aria-label={`Gerar PIN único para ${member.name}`}
                        >
                          <RefreshCw className="w-3 h-3" /> Gerar PIN
                        </button>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="md:col-span-2 flex items-center justify-end gap-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMember(member);
                        }}
                        className="p-2 md:p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-slate-100 rounded-lg transition-all"
                        title="Ver Ficha Cadastral e Frequência"
                        aria-label={`Ver Ficha de ${member.name}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(member);
                        }}
                        className="p-2 md:p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-slate-100 rounded-lg transition-all"
                        title="Editar Ficha Completa"
                        aria-label={`Editar Ficha de ${member.name}`}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setMemberToDelete(member.id);
                        }}
                        className="p-2 md:p-1.5 text-slate-500 hover:text-rose-700 hover:bg-slate-100 rounded-lg transition-all"
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
        
        {/* Rodapé da Tabela */}
        <div className="p-4 px-6 md:p-5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 bg-slate-50/40 uppercase tracking-wider">
          <span>Exibindo {filteredMembers.length} de {members.length} membros</span>
          <Users className="w-4 h-4 opacity-40" />
        </div>
      </div>

      {/* Modal de Exclusão */}
      {memberToDelete && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Remover Membro</h3>
            <p className="text-slate-600 mb-6 text-sm">
              ATENÇÃO: Este membro será excluído do sistema. Tem certeza que deseja continuar?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setMemberToDelete(null)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm"
              >
                Voltar
              </button>
              <button
                onClick={async () => {
                  try {
                    await removeMember(memberToDelete);
                    setMemberToDelete(null);
                  } catch (error) {
                    console.error(error);
                    alert('Erro ao excluir membro.');
                  }
                }}
                className="flex-1 px-4 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition-colors text-sm"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de PIN */}
      {pinConfirmModal.show && pinConfirmModal.member && (
        <div className="fixed inset-0 z-[65] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {pinConfirmModal.isRegenerate ? 'Regenerar PIN Único' : 'Gerar PIN Único'}
            </h3>
            <p className="text-slate-600 mb-6 text-sm leading-relaxed">
              Deseja {pinConfirmModal.isRegenerate ? 'substituir o PIN atual por um novo' : 'gerar um novo PIN único de 4 dígitos'} para <span className="font-bold text-slate-800">{pinConfirmModal.member.name}</span>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPinConfirmModal({ show: false, member: null, isRegenerate: false })}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors text-sm cursor-pointer"
              >
                Cancelar
              </button>
              <button
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
                className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-sm shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição Completa da Ficha */}
      {editingMember && (
        <div className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-[2rem] max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">Editar Ficha do Membro</h3>
                  <p className="text-xs text-slate-500 font-medium">{editingMember.name}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveEdit} className="overflow-y-auto flex-1 p-6 space-y-6">
              {/* Seção 1: Identificação & UPH */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <ShieldCheck className="w-4 h-4" /> 1. Identificação Geral & UPH
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-6">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.name || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Cargo na UPH</label>
                    <input
                      type="text"
                      placeholder="Ex: Presidente, Sócio"
                      value={editFormData.cargo || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, cargo: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Entrada na UPH</label>
                    <input
                      type="date"
                      value={editFormData.uphEntryDate || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, uphEntryDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 2: Contato & Endereço */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <Phone className="w-4 h-4" /> 2. Contato & Residência
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Celular / WhatsApp</label>
                    <input
                      type="text"
                      placeholder="(95) 99123-4567"
                      value={editFormData.contato || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, contato: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">E-mail</label>
                    <input
                      type="email"
                      placeholder="membro@email.com"
                      value={editFormData.email || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Endereço Completo</label>
                    <input
                      type="text"
                      placeholder="Rua, Bairro, Nº"
                      value={editFormData.endereco || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, endereco: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 3: Documentação & Pessoal */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <Calendar className="w-4 h-4" /> 3. Dados Pessoais & Documentos
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">CPF</label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={editFormData.cpf || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, cpf: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">RG</label>
                    <input
                      type="text"
                      placeholder="Nº do RG"
                      value={editFormData.rg || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, rg: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Data de Nascimento</label>
                    <input
                      type="date"
                      value={editFormData.nascimento || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, nascimento: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Estado Civil</label>
                    <select
                      value={editFormData.estadoCivil || 'Casado'}
                      onChange={(e) => setEditFormData({ ...editFormData, estadoCivil: e.target.value as EstadoCivil })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
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
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Tipo Sanguíneo</label>
                    <input
                      type="text"
                      placeholder="Ex: O+, A+"
                      value={editFormData.tipoSanguineo || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, tipoSanguineo: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Nome da Mãe</label>
                    <input
                      type="text"
                      value={editFormData.filiacaoMae || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, filiacaoMae: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Nome do Pai</label>
                    <input
                      type="text"
                      value={editFormData.filiacaoPai || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, filiacaoPai: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 4: Vida Eclesiástica */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <Landmark className="w-4 h-4" /> 4. Vida Eclesiástica & Igreja
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                  <div className="md:col-span-4">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Função / Ofício</label>
                    <select
                      value={editFormData.funcaoEclesiastica || 'Não se aplica'}
                      onChange={(e) => setEditFormData({ ...editFormData, funcaoEclesiastica: e.target.value as FuncaoEclesiastica })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
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
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Situação Canônica</label>
                    <select
                      value={editFormData.situacao || 'Em Plena Comunhão'}
                      onChange={(e) => setEditFormData({ ...editFormData, situacao: e.target.value as SituacaoMembro })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="Em Plena Comunhão">Em Plena Comunhão</option>
                      <option value="Sob Disciplina">Sob Disciplina</option>
                      <option value="Não Comungante">Não Comungante</option>
                      <option value="Transferido">Transferido</option>
                    </select>
                  </div>
                  <div className="md:col-span-4 flex items-center pt-5 pl-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                      <input 
                        type="checkbox"
                        checked={!!editFormData.dizimista}
                        onChange={(e) => setEditFormData({ ...editFormData, dizimista: e.target.checked })}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      Dizimista / Contribuinte Ativo
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
                  <div className="md:col-span-6">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Data de Batismo</label>
                    <input
                      type="date"
                      value={editFormData.dataBatismo || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, dataBatismo: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="md:col-span-6">
                    <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Data da Profissão de Fé</label>
                    <input
                      type="date"
                      value={editFormData.dataProfissaoFe || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, dataProfissaoFe: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors text-xs uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Alimentação via Markdown */}
      {importMembersBatch && (
        <ImportMarkdownModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          existingMembers={members}
          onImportBatch={importMembersBatch}
        />
      )}
    </div>
  );
};
