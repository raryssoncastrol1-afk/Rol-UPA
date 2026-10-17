import React, { useState, useRef, useMemo } from 'react';
import { 
  KeyRound, 
  Download, 
  Upload, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  FileJson, 
  Users, 
  ClipboardCheck, 
  DollarSign, 
  Gavel, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  Database, 
  Lock, 
  Check, 
  X,
  HardDrive,
  Info
} from 'lucide-react';
import { Member, AttendanceSession, Election, TreasuryTransaction } from '../types';
import { localDB } from '../lib/offlineDB';
import { syncClient } from '../lib/syncClient';
import { 
  exportMembersBackup, 
  exportSessionsBackup, 
  exportTreasuryBackup, 
  exportElectionsBackup, 
  exportFullBackup,
  getLastBackupTimestamp,
  validateAndParseBackup,
  ParseResult
} from '../lib/backupUtils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SettingsViewProps {
  members: Member[];
  sessions: AttendanceSession[];
  transactions: TreasuryTransaction[];
  onRefreshAll?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  members,
  sessions,
  transactions,
  onRefreshAll
}) => {
  // --- ESTADO: TROCA DE SENHA ---
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Senha salva atual
  const savedPassword = localStorage.getItem('uph_admin_password') || 'admin';
  const isDefaultPassword = savedPassword === 'admin';

  // Força da senha
  const passwordStrength = useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 6) score += 1;
    if (newPassword.length >= 8) score += 1;
    if (/[A-Z]/.test(newPassword)) score += 1;
    if (/[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;
    return score; // 0 a 5
  }, [newPassword]);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (currentPasswordInput !== savedPassword) {
      setPasswordFeedback({
        type: 'error',
        message: 'A senha atual informada está incorreta.'
      });
      return;
    }

    if (newPassword.length < 4) {
      setPasswordFeedback({
        type: 'error',
        message: 'A nova senha deve ter no mínimo 4 caracteres.'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: 'error',
        message: 'A confirmação de senha não confere com a nova senha digitada.'
      });
      return;
    }

    localStorage.setItem('uph_admin_password', newPassword);
    setCurrentPasswordInput('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordFeedback({
      type: 'success',
      message: 'Senha administrativa atualizada com sucesso!'
    });
  };

  // --- ESTADO: RESTAURAÇÃO DE BACKUP ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedBackup, setParsedBackup] = useState<ParseResult | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreFeedback, setRestoreFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Carrega eleições locais para backups
  const elections: Election[] = useMemo(() => {
    return localDB.getElections();
  }, []);

  const totalRecords = members.length + sessions.length + transactions.length + elections.length;
  const lastBackupTime = getLastBackupTimestamp();

  // Leitura do arquivo de backup
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFeedback(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = validateAndParseBackup(content);
      setParsedBackup(res);
      if (!res.success && res.error) {
        setRestoreFeedback({ type: 'error', message: res.error });
      }
    };
    reader.readAsText(file);
    // Limpa valor para permitir selecionar o mesmo arquivo se quiser
    e.target.value = '';
  };

  // Execução da Restauração
  const handleExecuteRestore = async () => {
    if (!parsedBackup || !parsedBackup.data) return;

    setIsRestoring(true);
    setRestoreFeedback(null);

    try {
      const { data } = parsedBackup;

      if (data.members && data.members.length > 0) {
        await syncClient.pushMembersBatch(data.members);
      }

      if (data.sessions && data.sessions.length > 0) {
        await syncClient.pushSessionsBatch(data.sessions);
      }

      if (data.treasury && data.treasury.length > 0) {
        await syncClient.pushTreasuryBatch(data.treasury);
      }

      if (data.elections && data.elections.length > 0) {
        await syncClient.pushElectionsBatch(data.elections);
      }

      setRestoreFeedback({
        type: 'success',
        message: `Restauração concluída com sucesso! ${parsedBackup.summary}`
      });
      setParsedBackup(null);

      // Dispara atualização geral
      onRefreshAll?.();
    } catch (err: any) {
      console.error('Falha na restauração:', err);
      setRestoreFeedback({
        type: 'error',
        message: `Falha ao restaurar dados: ${err?.message || 'Verifique sua conexão.'}`
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Indicadores de Estado do Sistema */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 text-left">
        <div className="bg-[#1B2E24] dark:bg-[#14231B] p-5 rounded-2xl shadow-2xs text-[#FAF8F5] border border-[#2A3A31] transition-all">
          <p className="text-xs font-semibold text-[#8A968F] mb-2">Segurança de Acesso</p>
          <div className="flex items-center gap-2">
            {isDefaultPassword ? (
              <span className="text-amber-400 font-bold text-base md:text-lg flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Senha Padrão
              </span>
            ) : (
              <span className="text-emerald-400 font-bold text-base md:text-lg flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Protegido
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#8A968F] mt-1">
            {isDefaultPassword ? 'Recomenda-se trocar a senha "admin"' : 'Senha personalizada ativa'}
          </p>
        </div>

        <div className="bg-white dark:bg-[#18221D] p-5 rounded-2xl border border-[#E4DFD5] dark:border-[#2A3A31] shadow-2xs transition-colors">
          <p className="text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] mb-2">Último Backup Gerado</p>
          <div className="flex items-baseline gap-1.5">
            <p className="text-base md:text-lg font-mono font-bold text-[#1B2E24] dark:text-[#EDEDE8] tracking-tight">
              {lastBackupTime ? format(lastBackupTime, "dd/MM 'às' HH:mm", { locale: ptBR }) : 'Pendente'}
            </p>
          </div>
          <p className="text-[11px] text-[#5C665F] dark:text-[#8A968F] mt-1">
            {lastBackupTime ? 'Arquivos JSON baixados' : 'Nenhum backup baixado ainda'}
          </p>
        </div>

        <div className="bg-white dark:bg-[#18221D] p-5 rounded-2xl border border-[#E4DFD5] dark:border-[#2A3A31] shadow-2xs transition-colors">
          <p className="text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] mb-2">Volume de Registros</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl md:text-4xl font-mono font-bold text-[#1B2E24] dark:text-[#EDEDE8] tracking-tight">
              {totalRecords}
            </p>
            <span className="text-xs font-medium text-[#5C665F] dark:text-[#8A968F]">registros</span>
          </div>
          <p className="text-[11px] text-[#5C665F] dark:text-[#8A968F] mt-1">
            Membros, atas, finanças e urnas
          </p>
        </div>

        <div className="bg-white dark:bg-[#18221D] p-5 rounded-2xl border border-[#E4DFD5] dark:border-[#2A3A31] shadow-2xs transition-colors">
          <p className="text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] mb-2">Armazenamento Ativo</p>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-[#C2A267] dark:text-[#C8A96E]" />
            <p className="text-base md:text-lg font-bold text-[#1B2E24] dark:text-[#EDEDE8]">
              SQLite + PWA
            </p>
          </div>
          <p className="text-[11px] text-[#5C665F] dark:text-[#8A968F] mt-1">
            Persistência local autônoma
          </p>
        </div>
      </div>

      {/* Grid Principal de Configurações */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Coluna Esquerda: Segurança & Troca de Senha */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-[#18221D] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-2xl p-6 md:p-7 shadow-2xs">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#E4DFD5] dark:border-[#2A3A31]">
              <div className="w-10 h-10 rounded-xl bg-[#1B2E24]/10 dark:bg-[#111614] border border-[#1B2E24]/20 dark:border-[#2A3A31] text-[#1B2E24] dark:text-[#C8A96E] flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base md:text-lg text-[#1B2E24] dark:text-[#EDEDE8]">
                  Senha do Administrador
                </h3>
                <p className="text-xs text-[#5C665F] dark:text-[#8A968F]">
                  Credencial de acesso ao painel da diretoria
                </p>
              </div>
            </div>

            {isDefaultPassword && (
              <div className="mb-5 p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  Você está utilizando a senha padrão <code className="font-mono font-bold bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">admin</code>. Recomendamos definir uma senha exclusiva para a gestão da UPH.
                </p>
              </div>
            )}

            {passwordFeedback && (
              <div className={`mb-5 p-3.5 rounded-xl border flex items-start gap-2.5 ${
                passwordFeedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
              }`}>
                {passwordFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                )}
                <p className="text-xs font-medium">{passwordFeedback.message}</p>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1.5 ml-1">
                  Senha Atual
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPasswordInput}
                    onChange={(e) => setCurrentPasswordInput(e.target.value)}
                    placeholder="Digite a senha atual"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs md:text-sm font-medium text-[#1B2E24] dark:text-[#EDEDE8] focus:border-[#1B2E24] dark:focus:border-[#C8A96E] focus:outline-hidden pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C665F] hover:text-[#1B2E24] dark:text-[#8A968F] dark:hover:text-[#EDEDE8] cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1.5 ml-1">
                  Nova Senha
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs md:text-sm font-medium text-[#1B2E24] dark:text-[#EDEDE8] focus:border-[#1B2E24] dark:focus:border-[#C8A96E] focus:outline-hidden pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C665F] hover:text-[#1B2E24] dark:text-[#8A968F] dark:hover:text-[#EDEDE8] cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1 h-1.5 w-full">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className={`flex-1 rounded-full transition-all ${
                            passwordStrength >= lvl
                              ? lvl <= 2
                                ? 'bg-amber-500'
                                : lvl <= 3
                                ? 'bg-blue-500'
                                : 'bg-emerald-500'
                              : 'bg-slate-200 dark:bg-[#2A3A31]'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-[#5C665F] dark:text-[#8A968F]">
                      Força:{' '}
                      <span className="font-semibold text-[#1B2E24] dark:text-[#EDEDE8]">
                        {passwordStrength <= 2 ? 'Básica' : passwordStrength <= 3 ? 'Média' : 'Forte'}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C665F] dark:text-[#8A968F] uppercase tracking-wider mb-1.5 ml-1">
                  Confirmar Nova Senha
                </label>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full px-3.5 py-2.5 bg-[#FAF8F5] dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs md:text-sm font-medium text-[#1B2E24] dark:text-[#EDEDE8] focus:border-[#1B2E24] dark:focus:border-[#C8A96E] focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#1B2E24] dark:bg-[#C8A96E] hover:bg-[#14231B] dark:hover:bg-[#b99859] text-white dark:text-[#111614] font-bold rounded-xl transition-all shadow-2xs text-xs md:text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 mt-2"
              >
                <Lock className="w-4 h-4" />
                <span>Atualizar Senha</span>
              </button>
            </form>
          </div>

          {/* Card de Identificação Institucional */}
          <div className="bg-[#FAF8F5] dark:bg-[#14231B] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-2xl p-5 text-xs text-[#5C665F] dark:text-[#8A968F] space-y-2">
            <div className="flex items-center gap-2 text-[#1B2E24] dark:text-[#EDEDE8] font-bold">
              <Info className="w-4 h-4 text-[#C2A267] dark:text-[#C8A96E]" />
              <span>Instância Operacional UPH</span>
            </div>
            <p>
              Sistema de Rol, Frequência, Eleições e Tesouraria configurado para a <strong>União Presbiteriana de Homens (UPH) da 3ª Igreja Presbiteriana de Boa Vista (IPBV)</strong>.
            </p>
            <div className="pt-2 border-t border-[#E4DFD5] dark:border-[#2A3A31] flex justify-between font-mono text-[11px]">
              <span>Versão 2026.1 (Full-Stack)</span>
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">● Operando Localmente</span>
            </div>
          </div>
        </div>

        {/* Coluna Direita: Backups Modulares & Restauração */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Backups Modulares em JSON */}
          <div className="bg-white dark:bg-[#18221D] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-2xl p-6 md:p-7 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#E4DFD5] dark:border-[#2A3A31]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1B2E24]/10 dark:bg-[#111614] border border-[#1B2E24]/20 dark:border-[#2A3A31] text-[#1B2E24] dark:text-[#C8A96E] flex items-center justify-center shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base md:text-lg text-[#1B2E24] dark:text-[#EDEDE8]">
                    Backups Modulares em JSON
                  </h3>
                  <p className="text-xs text-[#5C665F] dark:text-[#8A968F]">
                    Arquivos separados para análise, arquivamento e restauração fiel
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => exportFullBackup({ members, sessions, treasury: transactions, elections })}
                className="px-4 py-2 bg-[#1B2E24] dark:bg-[#C8A96E] hover:bg-[#14231B] dark:hover:bg-[#b99859] text-white dark:text-[#111614] rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
                title="Gera um único arquivo com todas as tabelas e dados do sistema"
              >
                <HardDrive className="w-4 h-4" />
                <span>Backup Completo (.json)</span>
              </button>
            </div>

            {/* Grid dos 4 Módulos Separados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* 1. Membros */}
              <div className="p-4 rounded-xl border border-[#E4DFD5] dark:border-[#2A3A31] bg-[#FAF8F5]/60 dark:bg-[#14231B]/40 flex flex-col justify-between transition-colors hover:border-[#1B2E24] dark:hover:border-[#C8A96E]/50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#1B2E24]/10 dark:bg-[#111614] text-[#1B2E24] dark:text-[#C8A96E] flex items-center justify-center font-bold">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#1B2E24] dark:text-[#EDEDE8]">Rol de Membros</h4>
                      <p className="text-[11px] text-[#5C665F] dark:text-[#8A968F]">Fichas, cargos e PINs</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#1B2E24] dark:text-[#C8A96E] bg-white dark:bg-[#111614] px-2 py-0.5 rounded-md border border-[#E4DFD5] dark:border-[#2A3A31]">
                    {members.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => exportMembersBackup(members)}
                  className="w-full py-2 px-3 bg-white dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] text-[#1B2E24] dark:text-[#EDEDE8] hover:bg-[#FAF8F5] dark:hover:bg-[#18221D] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <FileJson className="w-3.5 h-3.5 text-[#C2A267] dark:text-[#C8A96E]" />
                  <span>Baixar membros.json</span>
                </button>
              </div>

              {/* 2. Frequência */}
              <div className="p-4 rounded-xl border border-[#E4DFD5] dark:border-[#2A3A31] bg-[#FAF8F5]/60 dark:bg-[#14231B]/40 flex flex-col justify-between transition-colors hover:border-[#1B2E24] dark:hover:border-[#C8A96E]/50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#1B2E24]/10 dark:bg-[#111614] text-[#1B2E24] dark:text-[#C8A96E] flex items-center justify-center font-bold">
                      <ClipboardCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#1B2E24] dark:text-[#EDEDE8]">Frequência & Atas</h4>
                      <p className="text-[11px] text-[#5C665F] dark:text-[#8A968F]">Presenças e justificativas</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#1B2E24] dark:text-[#C8A96E] bg-white dark:bg-[#111614] px-2 py-0.5 rounded-md border border-[#E4DFD5] dark:border-[#2A3A31]">
                    {sessions.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => exportSessionsBackup(sessions)}
                  className="w-full py-2 px-3 bg-white dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] text-[#1B2E24] dark:text-[#EDEDE8] hover:bg-[#FAF8F5] dark:hover:bg-[#18221D] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <FileJson className="w-3.5 h-3.5 text-[#C2A267] dark:text-[#C8A96E]" />
                  <span>Baixar frequencia.json</span>
                </button>
              </div>

              {/* 3. Tesouraria */}
              <div className="p-4 rounded-xl border border-[#E4DFD5] dark:border-[#2A3A31] bg-[#FAF8F5]/60 dark:bg-[#14231B]/40 flex flex-col justify-between transition-colors hover:border-[#1B2E24] dark:hover:border-[#C8A96E]/50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#1B2E24]/10 dark:bg-[#111614] text-[#1B2E24] dark:text-[#C8A96E] flex items-center justify-center font-bold">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#1B2E24] dark:text-[#EDEDE8]">Tesouraria</h4>
                      <p className="text-[11px] text-[#5C665F] dark:text-[#8A968F]">Receitas e despesas</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#1B2E24] dark:text-[#C8A96E] bg-white dark:bg-[#111614] px-2 py-0.5 rounded-md border border-[#E4DFD5] dark:border-[#2A3A31]">
                    {transactions.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => exportTreasuryBackup(transactions)}
                  className="w-full py-2 px-3 bg-white dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] text-[#1B2E24] dark:text-[#EDEDE8] hover:bg-[#FAF8F5] dark:hover:bg-[#18221D] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <FileJson className="w-3.5 h-3.5 text-[#C2A267] dark:text-[#C8A96E]" />
                  <span>Baixar tesouraria.json</span>
                </button>
              </div>

              {/* 4. Eleições */}
              <div className="p-4 rounded-xl border border-[#E4DFD5] dark:border-[#2A3A31] bg-[#FAF8F5]/60 dark:bg-[#14231B]/40 flex flex-col justify-between transition-colors hover:border-[#1B2E24] dark:hover:border-[#C8A96E]/50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#1B2E24]/10 dark:bg-[#111614] text-[#1B2E24] dark:text-[#C8A96E] flex items-center justify-center font-bold">
                      <Gavel className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-[#1B2E24] dark:text-[#EDEDE8]">Urna Eleitoral</h4>
                      <p className="text-[11px] text-[#5C665F] dark:text-[#8A968F]">Escrutínios e votos</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#1B2E24] dark:text-[#C8A96E] bg-white dark:bg-[#111614] px-2 py-0.5 rounded-md border border-[#E4DFD5] dark:border-[#2A3A31]">
                    {elections.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => exportElectionsBackup(elections)}
                  className="w-full py-2 px-3 bg-white dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] text-[#1B2E24] dark:text-[#EDEDE8] hover:bg-[#FAF8F5] dark:hover:bg-[#18221D] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <FileJson className="w-3.5 h-3.5 text-[#C2A267] dark:text-[#C8A96E]" />
                  <span>Baixar eleicoes.json</span>
                </button>
              </div>

            </div>
          </div>

          {/* Central de Restauração de Dados */}
          <div className="bg-white dark:bg-[#18221D] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-2xl p-6 md:p-7 shadow-2xs">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#E4DFD5] dark:border-[#2A3A31]">
              <div className="w-10 h-10 rounded-xl bg-[#1B2E24]/10 dark:bg-[#111614] border border-[#1B2E24]/20 dark:border-[#2A3A31] text-[#1B2E24] dark:text-[#C8A96E] flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base md:text-lg text-[#1B2E24] dark:text-[#EDEDE8]">
                  Restaurar Backup do Sistema
                </h3>
                <p className="text-xs text-[#5C665F] dark:text-[#8A968F]">
                  Importe qualquer arquivo JSON modular ou completo para restabelecer os dados
                </p>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileSelected}
              className="hidden"
            />

            {restoreFeedback && (
              <div className={`mb-5 p-3.5 rounded-xl border flex items-start gap-2.5 ${
                restoreFeedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
              }`}>
                {restoreFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                )}
                <p className="text-xs font-medium">{restoreFeedback.message}</p>
              </div>
            )}

            {!parsedBackup ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#E4DFD5] dark:border-[#2A3A31] hover:border-[#1B2E24] dark:hover:border-[#C8A96E] bg-[#FAF8F5]/60 dark:bg-[#14231B]/40 rounded-2xl p-7 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5"
              >
                <div className="w-11 h-11 rounded-xl bg-white dark:bg-[#111614] shadow-2xs border border-[#E4DFD5] dark:border-[#2A3A31] text-[#1B2E24] dark:text-[#C8A96E] flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[#1B2E24] dark:text-[#EDEDE8]">
                    Clique para selecionar um arquivo de backup <code className="text-[#C2A267] dark:text-[#C8A96E] font-mono">.json</code>
                  </p>
                  <p className="text-xs text-[#5C665F] dark:text-[#8A968F] mt-1">
                    Suporta membros, chamadas, tesouraria, eleições ou backup completo unificado
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-5 rounded-2xl border border-[#C2A267]/40 bg-[#FAF8F5] dark:bg-[#14231B] space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#1B2E24] text-white dark:bg-[#C8A96E] dark:text-[#111614] flex items-center justify-center font-bold">
                      <FileJson className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-serif font-bold text-sm md:text-base text-[#1B2E24] dark:text-[#EDEDE8]">
                        Arquivo Validado com Sucesso
                      </h4>
                      <p className="text-xs text-[#5C665F] dark:text-[#8A968F]">
                        {parsedBackup.summary}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setParsedBackup(null)}
                    className="p-1.5 rounded-lg text-[#5C665F] hover:text-[#1B2E24] dark:text-[#8A968F] dark:hover:text-[#EDEDE8] hover:bg-[#E4DFD5]/50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 bg-white dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] rounded-xl text-xs text-[#5C665F] dark:text-[#8A968F] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Atenção: A restauração substituirá ou mesclará os registros do módulo selecionado no banco local.
                  </span>
                </div>

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setParsedBackup(null)}
                    disabled={isRestoring}
                    className="flex-1 py-2.5 px-4 bg-white dark:bg-[#111614] border border-[#E4DFD5] dark:border-[#2A3A31] text-[#1B2E24] dark:text-[#EDEDE8] font-bold rounded-xl text-xs hover:bg-[#FAF8F5] transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteRestore}
                    disabled={isRestoring}
                    className="flex-1 py-2.5 px-4 bg-[#1B2E24] dark:bg-[#C8A96E] hover:bg-[#14231B] dark:hover:bg-[#b99859] disabled:opacity-40 text-white dark:text-[#111614] font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer"
                  >
                    {isRestoring ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Restaurando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Confirmar e Restaurar Dados</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default SettingsView;
