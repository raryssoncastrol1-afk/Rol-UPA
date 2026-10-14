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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0d1f14] p-6 relative">
      {/* Padrão Geométrico Sutil Eclesiástico */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
      
      <div className="max-w-md w-full bg-[#132b1c] rounded-2xl border border-[#1f452d] shadow-xl p-8 sm:p-10 text-center relative z-10">
        <div className="w-14 h-14 bg-[#0a3d1c] border border-[#235334] rounded-xl flex items-center justify-center mx-auto mb-5 text-[#c59b27] shadow-sm">
          <ClipboardCheck className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1.5 tracking-tight">UPH 3ª IPBV</h1>
        <p className="text-[#86a892] text-xs font-medium mb-8">União Presbiteriana de Homens • Sistema Eleitoral</p>
        
        {mode === 'select' && (
          <div className="space-y-3">
            <button 
              onClick={() => {
                setErrorMsg('');
                setMode('voter_pin');
              }}
              className="w-full flex items-center justify-center gap-3 bg-[#c59b27] hover:bg-[#b0881e] py-3.5 px-6 rounded-xl font-bold text-[#0d1f14] transition-all cursor-pointer shadow-md"
            >
              <KeyRound className="w-4 h-4" />
              <span className="text-sm">Acesso do Eleitor (PIN)</span>
            </button>

            <button 
              onClick={() => {
                setErrorMsg('');
                setMode('admin_login');
              }}
              className="w-full flex items-center justify-center gap-3 bg-[#183623] hover:bg-[#20472e] border border-[#2d5c3c] py-3.5 px-6 rounded-xl font-medium text-slate-200 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#86a892]" />
              <span className="text-sm">Mesa Eleitoral / Administração</span>
            </button>
          </div>
        )}

        {mode === 'admin_login' && (
          <div className="space-y-4 text-left">
            <h3 className="text-lg font-bold text-white text-center mb-1">
              Acesso Administrativo
            </h3>
            <p className="text-xs text-[#86a892] text-center mb-4">
              Acesso restrito à Mesa Diretora e escrutinadores
            </p>

            {errorMsg && (
              <div className="bg-rose-950/60 border border-rose-800 text-rose-200 text-xs px-3 py-2.5 rounded-lg text-center font-medium">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-[#86a892] mb-1.5">Senha de Acesso</label>
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
                className="w-full bg-[#0d1f14] border border-[#2d5c3c] text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#c59b27] font-sans text-sm"
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button 
                onClick={handleAdminSubmit}
                className="w-full py-3 bg-[#c59b27] text-[#0d1f14] rounded-xl hover:bg-[#b0881e] transition-colors font-bold text-center cursor-pointer shadow-sm text-sm"
              >
                Entrar na Mesa Eleitoral
              </button>

              <div className="flex justify-center items-center text-xs mt-3 pt-2 border-t border-[#1f452d]">
                <button 
                  onClick={() => setMode('select')}
                  className="text-[#86a892] hover:text-white transition cursor-pointer"
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
            className="space-y-4 text-left"
          >
            <h3 className="text-lg font-bold text-white text-center mb-1">
              Identificação do Eleitor
            </h3>
            <p className="text-xs text-[#86a892] text-center mb-4">
              Informe seu PIN pessoal de 4 dígitos para receber sua cédula
            </p>

            {errorMsg && (
              <div className="bg-rose-950/60 border border-rose-800 text-rose-200 text-xs px-3 py-2.5 rounded-lg text-center font-medium">
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
              className="w-full bg-[#0d1f14] border border-[#2d5c3c] text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#c59b27] text-center tracking-[0.8em] text-2xl font-mono"
            />
            <div className="flex gap-3 pt-1">
              <button 
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setMode('select');
                }}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 bg-[#183623] text-slate-200 border border-[#2d5c3c] rounded-xl hover:bg-[#20472e] transition-colors font-medium text-sm cursor-pointer disabled:opacity-50"
              >
                Voltar
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 bg-[#c59b27] text-[#0d1f14] rounded-xl hover:bg-[#b0881e] transition-colors font-bold text-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Verificando...</span>
                ) : (
                  <span>Acessar Urna</span>
                )}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-[#1f452d]">
          <p className="text-[#648770] text-[11px] font-medium">Sessão Presidida • 3ª IPBV</p>
        </div>
      </div>
    </div>
  );
};
