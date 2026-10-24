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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-[#0b1220] rounded-2xl shadow-2xl border border-[#E4DFD5] dark:border-[#1e293b] w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header do Modal */}
        <div className="px-6 py-5 border-b border-[#E4DFD5] dark:border-[#1e293b] flex items-center justify-between bg-[#FAF8F5] dark:bg-[#080e1a] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1B2E24]/10 dark:bg-[#030712] text-[#1B2E24] dark:text-[#38bdf8] border border-[#1B2E24]/20 dark:border-[#1e293b] flex items-center justify-center shrink-0">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif font-bold text-[#1B2E24] dark:text-[#EDEDE8] tracking-tight">
                Alimentar Rol de Membros via Markdown (.md)
              </h2>
              <p className="text-xs text-[#5C665F] dark:text-[#8A968F]">
                Importação rápida com suporte à Tabela Resumo e Fichas Cadastrais
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#5C665F] hover:text-[#1B2E24] dark:text-[#8A968F] dark:hover:text-[#EDEDE8] hover:bg-[#E4DFD5]/50 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white dark:bg-[#0b1220]">
          
          {/* Ações Rápidas de Modelo */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#FAF8F5] dark:bg-[#080e1a] border border-[#E4DFD5] dark:border-[#1e293b] p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#1B2E24]/10 dark:bg-[#030712] text-[#1B2E24] dark:text-[#38bdf8] flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-[#C2A267]" />
              </div>
              <p className="text-xs font-bold text-[#1B2E24] dark:text-[#EDEDE8]">
                Possui o arquivo oficial da UPH 2026 ou deseja carregar o modelo pronto?
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadOfficialUPH}
                className="px-3.5 py-2 bg-[#1B2E24] dark:bg-[#38bdf8] text-white dark:text-[#030712] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#080e1a] shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                Carregar Rol UPH 2026 (26 membros)
              </button>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3.5 py-2 bg-white dark:bg-[#030712] text-[#1B2E24] dark:text-[#EDEDE8] border border-[#E4DFD5] dark:border-[#1e293b] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#F6F4EF] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#C2A267]" />
                Baixar Modelo .md
              </button>
            </div>
          </div>

          {/* Abas: Arquivo vs Colar */}
          <div className="space-y-4">
            <div className="flex border-b border-[#E4DFD5] dark:border-[#1e293b] gap-6">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                  activeTab === 'upload'
                    ? 'border-[#1B2E24] text-[#1B2E24] dark:border-[#38bdf8] dark:text-[#38bdf8]'
                    : 'border-transparent text-[#5C665F] dark:text-[#8A968F] hover:text-[#1B2E24]'
                }`}
              >
                1. Selecionar Arquivo .md
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                  activeTab === 'paste'
                    ? 'border-[#1B2E24] text-[#1B2E24] dark:border-[#38bdf8] dark:text-[#38bdf8]'
                    : 'border-transparent text-[#5C665F] dark:text-[#8A968F] hover:text-[#1B2E24]'
                }`}
              >
                2. Colar Texto Markdown
              </button>
            </div>

            {activeTab === 'upload' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#E4DFD5] dark:border-[#1e293b] hover:border-[#1B2E24] dark:hover:border-[#38bdf8] bg-[#FAF8F5]/60 dark:bg-[#080e1a]/40 rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".md,.markdown,.txt"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#030712] shadow-2xs border border-[#E4DFD5] dark:border-[#1e293b] text-[#1B2E24] dark:text-[#38bdf8] flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1B2E24] dark:text-[#EDEDE8]">
                    Clique aqui ou arraste o arquivo <code className="text-[#C2A267] dark:text-[#38bdf8] font-mono">.md</code>
                  </p>
                  <p className="text-xs text-[#5C665F] dark:text-[#8A968F] mt-1">
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
                  className="w-full p-4 bg-[#F6F4EF] dark:bg-[#030712] border border-[#E4DFD5] dark:border-[#1e293b] rounded-2xl text-xs font-mono text-[#1B2E24] dark:text-[#EDEDE8] focus:outline-hidden focus:border-[#1B2E24] dark:focus:border-[#38bdf8] transition-all resize-y"
                />
              </div>
            )}
          </div>

          {/* Feedback de Importação Executada */}
          {importResult && (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wide">
                    Alimentação Concluída com Sucesso!
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5 font-medium">
                    {importResult.added} novos membros adicionados • {importResult.updated} cadastros atualizados • {importResult.skipped} inalterados.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          )}

          {/* Preview dos Membros Detectados */}
          {parsedList.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FAF8F5] dark:bg-[#080e1a] p-4 rounded-2xl border border-[#E4DFD5] dark:border-[#1e293b]">
                <div className="flex items-center gap-3">
                  <div className="text-xs font-bold text-[#1B2E24] dark:text-[#EDEDE8] tracking-tight">
                    Membros Identificados: <span className="font-mono font-bold text-[#C2A267] dark:text-[#38bdf8]">{parsedList.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      {newCount} Novos
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#C2A267]/15 text-[#8c6f33] dark:text-[#38bdf8] border border-[#C2A267]/30 text-[10px] font-bold">
                      {existingCount} Já Cadastrados
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#5C665F] dark:text-[#8A968F] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={updateExisting}
                      onChange={(e) => setUpdateExisting(e.target.checked)}
                      className="w-4 h-4 rounded text-[#1B2E24] dark:text-[#38bdf8] focus:ring-[#1B2E24]"
                    />
                    Atualizar cadastros já existentes
                  </label>
                  
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    className="text-xs font-bold text-[#1B2E24] dark:text-[#38bdf8] hover:underline cursor-pointer"
                  >
                    {selectedIndices.size === parsedList.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                  </button>
                </div>
              </div>

              {/* Tabela de Pré-conferência */}
              <div className="border border-[#E4DFD5] dark:border-[#1e293b] rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#FAF8F5] dark:bg-[#080e1a] text-[#5C665F] dark:text-[#8A968F] font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-[#E4DFD5] dark:border-[#1e293b]">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIndices.size === parsedList.length && parsedList.length > 0}
                          onChange={toggleSelectAll}
                          className="w-3.5 h-3.5 rounded text-[#1B2E24] dark:text-[#38bdf8]"
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
                  <tbody className="divide-y divide-[#E4DFD5] dark:divide-[#1e293b]">
                    {comparisonList.map(({ member, index, isExisting }) => {
                      const isChecked = selectedIndices.has(index);
                      return (
                        <tr 
                          key={index}
                          className={`hover:bg-[#FAF8F5] dark:hover:bg-[#080e1a]/40 transition-colors ${
                            !isChecked ? 'opacity-50' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectIndex(index)}
                              className="w-3.5 h-3.5 rounded text-[#1B2E24] dark:text-[#38bdf8]"
                            />
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#5C665F] dark:text-[#8A968F] text-[11px]">
                            {member.orderNumber ? String(member.orderNumber).padStart(2, '0') : index + 1}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-[#1B2E24] dark:text-[#EDEDE8]">
                            {stripEcclesiasticalTitle(member.name)}
                          </td>
                          <td className="py-2.5 px-3 text-[#5C665F] dark:text-[#8A968F]">
                            {member.funcaoEclesiastica || member.cargo || 'Irmão'}
                          </td>
                          <td className="py-2.5 px-3 text-[#5C665F] dark:text-[#8A968F]">
                            {formatDateBR(member.nascimento)}
                          </td>
                          <td className="py-2.5 px-3 text-[#5C665F] dark:text-[#8A968F]">
                            {member.contato || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-[#5C665F] dark:text-[#8A968F] font-mono text-[11px]">
                            {member.email || '—'}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-[#1B2E24] dark:text-[#EDEDE8]">
                            {member.tipoSanguineo || '—'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isExisting ? (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-[#C2A267]/15 text-[#8c6f33] dark:text-[#38bdf8] border border-[#C2A267]/30">
                                Já Cadastrado
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
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
        <div className="px-6 py-4 border-t border-[#E4DFD5] dark:border-[#1e293b] bg-[#FAF8F5] dark:bg-[#080e1a] flex items-center justify-between shrink-0">
          <div className="text-xs text-[#5C665F] dark:text-[#8A968F] font-medium">
            {parsedList.length > 0 ? (
              <span>
                <strong className="text-[#1B2E24] dark:text-[#EDEDE8]">{selectedIndices.size}</strong> de {parsedList.length} membros selecionados.
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
              className="px-4 py-2.5 text-xs font-bold text-[#5C665F] hover:text-[#1B2E24] dark:text-[#8A968F] dark:hover:text-[#EDEDE8] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isProcessing || selectedIndices.size === 0}
              className="px-5 py-2.5 bg-[#1B2E24] dark:bg-[#38bdf8] hover:bg-[#080e1a] dark:hover:bg-[#0284c7] disabled:opacity-40 text-white dark:text-[#030712] rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
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
