import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

interface LoginScreenProps {
  onAdminLogin: (password: string) => Promise<boolean> | boolean;
  onVoterLogin: (pin: string) => Promise<{ success: boolean; error?: string }> | void;
}

// Símbolo do peixe da UPH em traço fino vetorial (Ichthys / UPH)
const UphFishLogo: React.FC<{ strokeColor: string; className?: string }> = ({ strokeColor, className = "w-20 h-10" }) => (
  <svg 
    viewBox="0 0 100 45" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    stroke={strokeColor}
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Arco superior contínuo que cruza a cauda */}
    <path d="M 88 10 C 65 34 25 38 6 22.5 C 25 7 65 11 88 35" />
    {/* Letras UPH integradas no centro com traço leve */}
    <text 
      x="45" 
      y="24" 
      fill={strokeColor} 
      stroke="none" 
      fontSize="7" 
      fontFamily="sans-serif" 
      fontWeight="700" 
      letterSpacing="1.2" 
      textAnchor="middle" 
      opacity="0.9"
    >
      UPH
    </text>
  </svg>
);

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onAdminLogin, 
  onVoterLogin,
}) => {
  // Preferência de tema armazenada ou padrão para modo claro (conforme mockup "Cédula Digital")
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('uph_theme_mode');
    return saved === 'dark' ? 'dark' : 'light';
  });

  const [mode, setMode] = useState<'select' | 'voter_pin' | 'admin_login'>('select');
  const [pin, setPin] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    localStorage.setItem('uph_theme_mode', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

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

  const isLight = theme === 'light';

  // Cores do mockup
  // Light: Fundo #F6F4EF, Card #FFFFFF borda #E4DFD5, Botão Primário #1B2E24 texto #FAF8F5, Botão Secundário contorno #D5CEBF texto #1B2E24, Ouro #C2A267
  // Dark:  Fundo #111614, Card #18221D borda #2A3A31, Botão Primário #C8A96E texto #111614, Botão Secundário contorno #2A3A31 texto #EDEDE8, Ouro #C8A96E
  const goldColor = isLight ? '#C2A267' : '#C8A96E';

  return (
    <div 
      className={`min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-300 font-sans relative ${
        isLight ? 'bg-[#F6F4EF]' : 'bg-[#111614]'
      }`}
    >
      {/* Botão de Alternância Claro/Escuro discreto no topo */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center gap-2">
        <button
          onClick={toggleTheme}
          title={isLight ? "Alternar para Modo Escuro (Jade & Latão)" : "Alternar para Modo Claro (Cédula Digital)"}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
            isLight 
              ? 'bg-white/80 border-[#E4DFD5] text-[#5C665F] hover:text-[#1B2E24] shadow-2xs' 
              : 'bg-[#18221D]/80 border-[#2A3A31] text-[#8A968F] hover:text-[#EDEDE8]'
          }`}
        >
          {isLight ? (
            <>
              <Moon className="w-3.5 h-3.5 text-[#C2A267]" />
              <span className="hidden sm:inline">Modo Escuro</span>
            </>
          ) : (
            <>
              <Sun className="w-3.5 h-3.5 text-[#C8A96E]" />
              <span className="hidden sm:inline">Modo Claro</span>
            </>
          )}
        </button>
      </div>

      {/* Cartão Central de Votação */}
      <div 
        className={`max-w-[420px] w-full rounded-2xl p-8 sm:p-10 text-center transition-all duration-300 relative z-10 ${
          isLight 
            ? 'bg-[#FFFFFF] border border-[#E4DFD5] shadow-[0_4px_24px_rgba(0,0,0,0.04)]' 
            : 'bg-[#18221D] border border-[#2A3A31] shadow-[0_4px_24px_rgba(0,0,0,0.3)]'
        }`}
      >
        {/* Símbolo do Peixe Tradicional UPH */}
        <div className="flex justify-center mb-5">
          <UphFishLogo strokeColor={goldColor} className="w-20 h-10" />
        </div>

        {/* Título Principal em Tipografia Serifada Solene */}
        <h1 
          className="text-3xl sm:text-4xl font-serif font-bold tracking-[0.03em] mb-2 leading-none"
          style={{ color: isLight ? '#1B2E24' : '#EDEDE8' }}
        >
          UPH 3ª IPBV
        </h1>

        {/* Subtítulo em Caixa Alta e Espaçado */}
        <p 
          className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] mb-8"
          style={{ color: isLight ? '#5C665F' : '#8A968F' }}
        >
          União Presbiteriana de Homens • Sistema Eleitoral
        </p>

        {/* MODO 1: Seleção Inicial (Acesso Eleitor PIN / Mesa Eleitoral) */}
        {mode === 'select' && (
          <div className="space-y-3">
            {/* Botão Principal de Destaque */}
            <button 
              onClick={() => {
                setErrorMsg('');
                setMode('voter_pin');
              }}
              className={`w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] ${
                isLight
                  ? 'bg-[#1B2E24] text-[#FAF8F5] hover:bg-[#14231B] shadow-sm'
                  : 'bg-[#C8A96E] text-[#111614] hover:bg-[#b99859] shadow-sm'
              }`}
            >
              <span>🔑 Acesso do Eleitor (PIN)</span>
            </button>

            {/* Botão Secundário Contornado */}
            <button 
              onClick={() => {
                setErrorMsg('');
                setMode('admin_login');
              }}
              className={`w-full py-3.5 px-6 rounded-xl font-medium text-sm border transition-all duration-150 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] ${
                isLight
                  ? 'border-[#D5CEBF] text-[#1B2E24] hover:bg-[#FAF8F5]'
                  : 'border-[#2A3A31] text-[#EDEDE8] hover:bg-[#202C26]'
              }`}
            >
              <span>🛡️ Mesa Eleitoral / Administração</span>
            </button>
          </div>
        )}

        {/* MODO 2: Login de Administração */}
        {mode === 'admin_login' && (
          <div className="space-y-4 text-left">
            <h3 
              className="text-base font-bold text-center mb-0.5"
              style={{ color: isLight ? '#1B2E24' : '#EDEDE8' }}
            >
              Acesso Administrativo
            </h3>
            <p 
              className="text-xs text-center mb-4"
              style={{ color: isLight ? '#5C665F' : '#8A968F' }}
            >
              Mesa Diretora e Escrutinadores
            </p>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-200 text-xs px-3 py-2 rounded-lg text-center font-medium">
                {errorMsg}
              </div>
            )}

            <div>
              <label 
                className="block text-xs font-semibold mb-1.5"
                style={{ color: isLight ? '#5C665F' : '#8A968F' }}
              >
                Senha de Acesso
              </label>
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
                className={`w-full px-4 py-2.5 rounded-xl text-sm font-sans focus:outline-none transition-colors border ${
                  isLight 
                    ? 'bg-[#FAF8F5] border-[#E4DFD5] text-[#1B2E24] focus:border-[#C2A267]' 
                    : 'bg-[#111614] border-[#2A3A31] text-[#EDEDE8] focus:border-[#C8A96E]'
                }`}
              />
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button 
                onClick={handleAdminSubmit}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                  isLight
                    ? 'bg-[#1B2E24] text-[#FAF8F5] hover:bg-[#14231B]'
                    : 'bg-[#C8A96E] text-[#111614] hover:bg-[#b99859]'
                }`}
              >
                Entrar na Mesa Eleitoral
              </button>

              <div className="flex justify-center items-center text-xs mt-3 pt-2">
                <button 
                  onClick={() => setMode('select')}
                  className={`hover:underline cursor-pointer transition-colors ${
                    isLight ? 'text-[#5C665F]' : 'text-[#8A968F]'
                  }`}
                >
                  Voltar ao início
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODO 3: Digitação do PIN de Eleitor */}
        {mode === 'voter_pin' && (
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleVoterSubmitPIN();
            }}
            className="space-y-4 text-left"
          >
            <h3 
              className="text-base font-bold text-center mb-0.5"
              style={{ color: isLight ? '#1B2E24' : '#EDEDE8' }}
            >
              Identificação do Eleitor
            </h3>
            <p 
              className="text-xs text-center mb-4"
              style={{ color: isLight ? '#5C665F' : '#8A968F' }}
            >
              Informe seu PIN de 4 dígitos para receber sua cédula
            </p>

            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-200 text-xs px-3 py-2 rounded-lg text-center font-medium">
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
              className={`w-full px-4 py-3 rounded-xl text-center tracking-[0.8em] text-2xl font-mono focus:outline-none transition-colors border ${
                isLight 
                  ? 'bg-[#FAF8F5] border-[#E4DFD5] text-[#1B2E24] focus:border-[#C2A267]' 
                  : 'bg-[#111614] border-[#2A3A31] text-[#EDEDE8] focus:border-[#C8A96E]'
              }`}
            />

            <div className="flex gap-3 pt-1">
              <button 
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setMode('select');
                }}
                disabled={isSubmitting}
                className={`flex-1 py-3 px-4 rounded-xl font-medium text-xs border transition-colors cursor-pointer disabled:opacity-50 ${
                  isLight
                    ? 'border-[#D5CEBF] text-[#1B2E24] hover:bg-[#FAF8F5]'
                    : 'border-[#2A3A31] text-[#EDEDE8] hover:bg-[#202C26]'
                }`}
              >
                Voltar
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 py-3 px-4 rounded-xl font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${
                  isLight
                    ? 'bg-[#1B2E24] text-[#FAF8F5] hover:bg-[#14231B]'
                    : 'bg-[#C8A96E] text-[#111614] hover:bg-[#b99859]'
                }`}
              >
                {isSubmitting ? 'Verificando...' : 'Acessar Urna'}
              </button>
            </div>
          </form>
        )}

        {/* Rodapé Institucional */}
        <div 
          className="mt-8 pt-5 border-t"
          style={{ borderColor: isLight ? '#E4DFD5' : '#2A3A31' }}
        >
          <p 
            className="text-[11px] font-medium tracking-wide"
            style={{ color: isLight ? '#5C665F' : '#8A968F' }}
          >
            Sessão Presidida • 3ª IPBV
          </p>
        </div>
      </div>
    </div>
  );
};
