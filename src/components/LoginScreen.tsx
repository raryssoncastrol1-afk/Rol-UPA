import React, { useState } from 'react';
import { ClipboardCheck, KeyRound, ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
  onAdminLogin: (password: string) => Promise<boolean> | boolean;
  onVoterLogin: (pin: string) => Promise<{ success: boolean; error?: string }> | void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onAdminLogin, 
  onVoterLogin,
}) => {
  const [mode, setMode] = useState<'select' | 'voter_pin' | 'admin_login'>('select');
  const [pin, setPin] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVoterSubmitPIN = async () => {
    if (pin.trim().length < 4) {
      setErrorMsg('Seu PIN deve ter pelo menos 4 dígitos.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const res = await onVoterLogin(pin.trim());
      if (res && !res.success) {
        setErrorMsg(res.error || 'PIN não encontrado ou inválido.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminSubmit = async () => {
    if (!adminPassword.trim()) {
      setErrorMsg('Digite a senha de administrador.');
      return;
    }
    const success = await onAdminLogin(adminPassword);
    if (!success) {
      setErrorMsg('Senha incorreta. Verifique e tente novamente.');
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-900 p-6 relative overflow-hidden">
      {/* Fundo Atmosférico */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-900" />
      
      <div className="max-w-md w-full bg-slate-800/40 backdrop-blur-3xl rounded-[2.5rem] border border-slate-700/50 shadow-2xl p-10 md:p-14 text-center relative z-10 animate-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 mx-auto mb-6 relative">
          <ClipboardCheck className="w-8 h-8 text-white relative z-10" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">UPH Rol</h1>
        <p className="text-slate-400 font-mono text-[11px] uppercase tracking-[0.2em] mb-8">Gestão de Operações (Offline-First)</p>
        
        {mode === 'select' && (
          <div className="space-y-3">
            <button 
              onClick={() => {
                setErrorMsg('');
                setMode('admin_login');
              }}
              className="group w-full flex items-center justify-center gap-3 bg-white py-3.5 px-6 rounded-xl font-bold text-slate-900 hover:bg-slate-100 transition-all duration-200 cursor-pointer overflow-hidden relative shadow-sm"
            >
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span className="relative z-10 text-sm">Painel Administrativo</span>
            </button>

            <button 
              onClick={() => {
                setErrorMsg('');
                setMode('voter_pin');
              }}
              className="group w-full flex items-center justify-center gap-3 bg-indigo-600 py-3.5 px-6 rounded-xl font-bold text-white hover:bg-indigo-700 transition-all duration-200 cursor-pointer overflow-hidden relative shadow-md shadow-indigo-600/20"
            >
              <KeyRound className="w-4 h-4 relative z-10" />
              <span className="relative z-10 text-sm">Acesso do Eleitor (PIN)</span>
            </button>
          </div>
        )}

        {mode === 'admin_login' && (
          <div className="space-y-4 text-left animate-in fade-in slide-in-from-right-4">
            <h3 className="text-xl font-bold text-white text-center mb-1">
              Acesso Administrativo
            </h3>
            <p className="text-xs text-slate-400 text-center mb-4 leading-relaxed">
              Digite a senha de administrador local
            </p>

            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs px-3 py-2 rounded-xl text-center">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Senha de Acesso</label>
              <input 
                type="password" 
                value={adminPassword}
                onChange={(e) => {
                  setAdminPassword(e.target.value);
                  setErrorMsg('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdminSubmit();
                }}
                placeholder="••••••••"
                autoFocus
                className="w-full bg-slate-900/50 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 font-sans text-sm focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-2 pt-3">
              <button 
                onClick={handleAdminSubmit}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors font-bold text-center cursor-pointer shadow-lg shadow-indigo-600/10"
              >
                Entrar no Painel
              </button>

              <div className="flex justify-center items-center text-xs mt-3 pt-1 border-t border-slate-800">
                <button 
                  onClick={() => setMode('select')}
                  className="text-slate-400 hover:text-slate-300 transition cursor-pointer"
                >
                  Voltar ao início
                </button>
              </div>
            </div>
          </div>
        )}

        {mode === 'voter_pin' && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleVoterSubmitPIN();
            }}
            className="space-y-4 text-left animate-in fade-in slide-in-from-right-4"
          >
            <h3 className="text-xl font-bold text-white text-center mb-1">
              Acesso do Eleitor
            </h3>
            <p className="text-xs text-slate-400 text-center mb-4 leading-relaxed">
              Digite o seu PIN de 4 dígitos para acessar a urna
            </p>

            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs px-3 py-2 rounded-xl text-center">
                {errorMsg}
              </div>
            )}

            <input 
              type="text" 
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ''));
                setErrorMsg('');
              }}
              placeholder="0000"
              maxLength={6}
              autoFocus
              disabled={isSubmitting}
              className="w-full bg-slate-900/50 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 text-center tracking-[1em] text-2xl font-mono"
            />
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setMode('select');
                }}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors font-bold cursor-pointer disabled:opacity-50"
              >
                Voltar
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors font-bold cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Validando...</span>
                ) : (
                  <span>Entrar</span>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-8 border-t border-slate-700/50">
          <p className="text-slate-500 text-[10px] font-mono tracking-widest uppercase">Modo Local Offline Ativo</p>
        </div>
      </div>
    </div>
  );
};
