import React, { useState } from 'react';
import { ClipboardCheck, KeyRound } from 'lucide-react';

interface LoginScreenProps {
  onGoogleLogin: () => void;
  onVoterLogin: (pin: string) => void;
  onEmailLogin: (email: string, pass: string) => Promise<void>;
  onEmailRegister: (email: string, pass: string) => Promise<void>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onGoogleLogin, 
  onVoterLogin,
  onEmailLogin,
  onEmailRegister
}) => {
  const [mode, setMode] = useState<'select' | 'voter_pin' | 'admin_login'>('select');
  const [pin, setPin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdminRegister, setIsAdminRegister] = useState(false);

  const handleVoterSubmitPIN = async () => {
    if (pin.length < 4) {
      alert('Sua senha deve ter pelo menos 4 dígitos.');
      return;
    }
    onVoterLogin(pin);
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-900 p-6 relative overflow-hidden">
      {/* Atmospheric Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-900" />
      
      <div className="max-w-md w-full bg-slate-800/40 backdrop-blur-3xl rounded-[2.5rem] border border-slate-700/50 shadow-2xl p-10 md:p-14 text-center relative z-10 animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-indigo-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-500/40 mx-auto mb-8 relative">
          <div className="absolute inset-0 bg-indigo-400 rounded-[2rem] blur-xl opacity-50" />
          <ClipboardCheck className="w-10 h-10 text-white relative z-10" />
        </div>
        <h1 className="text-4xl font-display font-bold text-white mb-3 tracking-tight">UPH Rol</h1>
        <p className="text-slate-400 font-mono text-[11px] uppercase tracking-[0.2em] mb-10">Gestão de Operações</p>
        
        {mode === 'select' && (
          <div className="space-y-4">
            <button 
              onClick={() => setMode('admin_login')}
              className="group w-full flex items-center justify-center gap-3 bg-white py-4 px-8 rounded-2xl font-bold font-sans text-slate-800 hover:bg-indigo-50 transition-all duration-300 cursor-pointer overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-indigo-100 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Acesso Administrativo</span>
            </button>

            <button 
              onClick={() => setMode('voter_pin')}
              className="group w-full flex items-center justify-center gap-3 bg-indigo-600 py-4 px-8 rounded-2xl font-bold font-sans text-white hover:bg-indigo-500 transition-all duration-300 cursor-pointer overflow-hidden relative"
            >
              <KeyRound className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Acesso do Eleitor</span>
            </button>
          </div>
        )}

        {mode === 'admin_login' && (
          <div className="space-y-4 text-left animate-in fade-in slide-in-from-right-4">
            <h3 className="text-xl font-bold text-white text-center mb-1">
              {isAdminRegister ? 'Registrar Administrador' : 'Painel Administrativo'}
            </h3>
            <p className="text-xs text-slate-400 text-center mb-4 leading-relaxed">
              {isAdminRegister 
                ? 'Defina um e-mail e senha para acesso administrativo direto' 
                : 'Acesse de forma nativa por e-mail/senha ou use login Google'}
            </p>

            {!isAdminRegister && (
              <button 
                onClick={onGoogleLogin}
                className="group w-full flex items-center justify-center gap-3 bg-white/10 text-white border border-slate-700/80 py-3 px-6 rounded-xl font-bold font-sans hover:bg-white/20 transition-all cursor-pointer mb-2"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                <span>Entrar com Conta Google</span>
              </button>
            )}

            {!isAdminRegister && (
              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-slate-700/60"></div>
                <span className="px-3 text-[10px] text-slate-500 font-mono tracking-widest">OU E-MAIL E SENHA</span>
                <div className="flex-1 border-t border-slate-700/60"></div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">E-mail</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu-admin@email.com"
                  className="w-full bg-slate-900/50 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 font-sans text-sm focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Senha</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/50 border border-slate-700 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-indigo-500 font-sans text-sm focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-3">
              <button 
                onClick={async () => {
                  if (!email.trim() || !password.trim()) {
                    alert('Por favor, preencha o e-mail e a senha.');
                    return;
                  }
                  if (isAdminRegister) {
                    await onEmailRegister(email, password);
                  } else {
                    await onEmailLogin(email, password);
                  }
                }}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors font-bold text-center cursor-pointer shadow-lg shadow-indigo-600/10"
              >
                {isAdminRegister ? 'Registrar Novo Admin' : 'Acesse o Painel por E-mail'}
              </button>

              <div className="flex justify-between items-center text-xs mt-3 pt-1 border-t border-slate-800">
                <button 
                  onClick={() => setIsAdminRegister(!isAdminRegister)}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold transition"
                >
                  {isAdminRegister ? 'Já possui conta? Acessar' : 'Primeiro acesso? Registrar'}
                </button>
                <button 
                  onClick={() => {
                    setMode('select');
                    setIsAdminRegister(false);
                  }}
                  className="text-slate-400 hover:text-slate-300 transition"
                >
                  Voltar ao início
                </button>
              </div>
            </div>
          </div>
        )}

        {mode === 'voter_pin' && (
          <div className="space-y-4 text-left animate-in fade-in slide-in-from-right-4">
            <p className="text-sm text-slate-300 mb-2">Digite o código PIN (senha) fornecido pelo administrador:</p>
            <input 
              type="text" 
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="0000"
              maxLength={10}
              className="w-full bg-slate-900/50 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 text-center tracking-[1em] text-2xl"
            />
            <div className="flex gap-3">
              <button 
                onClick={() => setMode('select')}
                className="flex-1 py-3 px-4 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors font-bold"
              >
                Voltar
              </button>
              <button 
                onClick={handleVoterSubmitPIN}
                className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors font-bold"
              >
                Entrar
              </button>
            </div>
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-slate-700/50">
          <p className="text-slate-500 text-[10px] font-mono tracking-widest uppercase">Sistema de Acesso Restrito</p>
        </div>
      </div>
    </div>
  );
};
