import React, { useState, useMemo, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Download, 
  Users, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { Member } from '../types';
import { 
  parseMarkdownMembers, 
  ParsedMemberData, 
  OFFICIAL_TEMPLATE_MARKDOWN,
  normalizeNameKey,
  cleanDigits
} from '../lib/markdownMemberParser';
import { ROL_MEMBROS_UPH_2026_RAW } from '../data/uph2026Raw';
import { formatDateBR, stripEcclesiasticalTitle } from '../lib/memberUtils';

interface ImportMarkdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingMembers: Member[];
  onImportBatch: (
    members: Partial<Member>[], 
    options?: { updateExisting?: boolean }
  ) => Promise<{ added: number; updated: number; skipped: number }>;
}

export const ImportMarkdownModal: React.FC<ImportMarkdownModalProps> = ({
  isOpen,
  onClose,
  existingMembers,
  onImportBatch
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [markdownText, setMarkdownText] = useState('');
  const [updateExisting, setUpdateExisting] = useState(true);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{
    added: number;
    updated: number;
    skipped: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse do markdown atual
  const parsedList = useMemo(() => {
    if (!markdownText.trim()) return [];
    return parseMarkdownMembers(markdownText);
  }, [markdownText]);

  // Atualiza seleção ao mudar lista parseada
  React.useEffect(() => {
    if (parsedList.length > 0) {
      setSelectedIndices(new Set(parsedList.map((_, i) => i)));
    } else {
      setSelectedIndices(new Set());
    }
    setImportResult(null);
  }, [parsedList]);

  // Comparação com membros já existentes no banco
  const comparisonList = useMemo(() => {
    return parsedList.map((pm, idx) => {
      const normKey = normalizeNameKey(pm.name);
      const cpfDigits = pm.cpf ? cleanDigits(pm.cpf) : '';

      const matched = existingMembers.find(em => {
        if (cpfDigits && em.cpf && cleanDigits(em.cpf) === cpfDigits) return true;
        return normalizeNameKey(em.name) === normKey;
      });

      return {
        member: pm,
        index: idx,
        isExisting: !!matched,
        existingRecord: matched
      };
    });
  }, [parsedList, existingMembers]);

  const newCount = comparisonList.filter(c => !c.isExisting).length;
  const existingCount = comparisonList.filter(c => c.isExisting).length;

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setMarkdownText(content || '');
    };
    reader.readAsText(file);
  };

  const handleLoadOfficialUPH = () => {
    setMarkdownText(ROL_MEMBROS_UPH_2026_RAW);
    setActiveTab('paste');
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([OFFICIAL_TEMPLATE_MARKDOWN], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modelo_rol_membros_uph.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === parsedList.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(parsedList.map((_, i) => i)));
    }
  };

  const toggleSelectIndex = (idx: number) => {
    const next = new Set(selectedIndices);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setSelectedIndices(next);
  };

  const handleExecuteImport = async () => {
    if (selectedIndices.size === 0) return;

    setIsProcessing(true);
    setImportResult(null);

    try {
      const selectedMembers = parsedList
        .filter((_, idx) => selectedIndices.has(idx))
        .map(pm => ({
          name: pm.name,
          cargo: pm.cargo,
          funcaoEclesiastica: pm.funcaoEclesiastica,
          situacao: pm.situacao,
          contato: pm.contato,
          email: pm.email,
          endereco: pm.endereco,
          cpf: pm.cpf,
          rg: pm.rg,
          nascimento: pm.nascimento,
          estadoCivil: pm.estadoCivil,
          naturalidade: pm.naturalidade,
          tipoSanguineo: pm.tipoSanguineo,
          filiacaoMae: pm.filiacaoMae,
          filiacaoPai: pm.filiacaoPai,
          dataBatismo: pm.dataBatismo,
          dataProfissaoFe: pm.dataProfissaoFe,
          uphEntryDate: pm.uphEntryDate,
          dizimista: pm.dizimista,
        }));

      const res = await onImportBatch(selectedMembers, { updateExisting });
      setImportResult(res);
    } catch (err) {
      console.error('Erro na importação em lote:', err);
      alert('Falha ao gravar os membros no banco de dados.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header do Modal */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Alimentar Rol de Membros via Markdown (.md)
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                Importação rápida com suporte à Tabela Resumo e Fichas Cadastrais
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Ações Rápidas de Modelo */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50/60 border border-indigo-100 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <p className="text-xs font-bold text-indigo-950">
                Possui o arquivo oficial da UPH 2026 ou deseja carregar o modelo pronto?
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadOfficialUPH}
                className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                Carregar Rol UPH 2026 (26 membros)
              </button>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3.5 py-2 bg-white text-indigo-700 border border-indigo-200 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-indigo-50 transition-all flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar Modelo .md
              </button>
            </div>
          </div>

          {/* Abas: Arquivo vs Colar */}
          <div className="space-y-4">
            <div className="flex border-b border-slate-200 gap-6">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
                  activeTab === 'upload'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                1. Selecionar Arquivo .md
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
                  activeTab === 'paste'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                2. Colar Texto Markdown
              </button>
            </div>

            {activeTab === 'upload' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/20 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".md,.markdown,.txt"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-200 text-indigo-600 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Clique aqui ou arraste o arquivo <code className="text-indigo-600 font-mono">.md</code>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Formatos suportados: .md, .markdown, .txt (com a tabela ou fichas UPH)
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  value={markdownText}
                  onChange={(e) => setMarkdownText(e.target.value)}
                  placeholder="Cole aqui o conteúdo do arquivo Markdown..."
                  rows={8}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-y"
                />
              </div>
            )}
          </div>

          {/* Feedback de Importação Executada */}
          {importResult && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-black text-emerald-900 uppercase">
                    Alimentação Concluída com Sucesso!
                  </p>
                  <p className="text-xs text-emerald-700 mt-0.5 font-medium">
                    {importResult.added} novos membros adicionados • {importResult.updated} cadastros atualizados • {importResult.skipped} inalterados.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-emerald-600 text-white text-xs font-black uppercase rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
              >
                Fechar
              </button>
            </div>
          )}

          {/* Preview dos Membros Detectados */}
          {parsedList.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="text-xs font-black text-slate-800 uppercase tracking-tight">
                    Membros Identificados: <span className="text-indigo-600 font-bold">{parsedList.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                      {newCount} Novos
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-black uppercase">
                      {existingCount} Já Cadastrados
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={updateExisting}
                      onChange={(e) => setUpdateExisting(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                    />
                    Atualizar cadastros já existentes
                  </label>
                  
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    {selectedIndices.size === parsedList.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                  </button>
                </div>
              </div>

              {/* Tabela de Pré-conferência */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-500 font-black uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIndices.size === parsedList.length && parsedList.length > 0}
                          onChange={toggleSelectAll}
                          className="w-3.5 h-3.5 text-indigo-600 rounded"
                        />
                      </th>
                      <th className="py-2.5 px-3">Nº</th>
                      <th className="py-2.5 px-4">Nome Completo</th>
                      <th className="py-2.5 px-3">Ofício / Função</th>
                      <th className="py-2.5 px-3">Nascimento</th>
                      <th className="py-2.5 px-3">Contato</th>
                      <th className="py-2.5 px-3">E-mail</th>
                      <th className="py-2.5 px-3">Tipo Sang.</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {comparisonList.map(({ member, index, isExisting }) => {
                      const isChecked = selectedIndices.has(index);
                      return (
                        <tr 
                          key={index}
                          className={`hover:bg-indigo-50/30 transition-colors ${
                            !isChecked ? 'opacity-50' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectIndex(index)}
                              className="w-3.5 h-3.5 text-indigo-600 rounded"
                            />
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-500 text-[11px]">
                            {member.orderNumber ? String(member.orderNumber).padStart(2, '0') : index + 1}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-900">
                            {stripEcclesiasticalTitle(member.name)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {member.funcaoEclesiastica || member.cargo || 'Irmão'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {formatDateBR(member.nascimento)}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {member.contato || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                            {member.email || '—'}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-700">
                            {member.tipoSanguineo || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isExisting ? (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-100 text-amber-800">
                                Já Cadastrado
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-100 text-emerald-800">
                                Novo
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer do Modal */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            {parsedList.length > 0 ? (
              <span>
                <strong className="text-slate-800">{selectedIndices.size}</strong> de {parsedList.length} membros selecionados para alimentação.
              </span>
            ) : (
              <span>Nenhum membro carregado ainda.</span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isProcessing || selectedIndices.size === 0}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Gravando no Rol...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirmar e Alimentar ({selectedIndices.size})
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
