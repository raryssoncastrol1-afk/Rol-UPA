import React from 'react';
import { ClipboardCheck, LogOut, LucideIcon } from 'lucide-react';
import { AppUser } from '../types';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: any) => void;
  navItems: { id: string; label: string; icon: LucideIcon }[];
  user: AppUser | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, navItems, user, onLogout }) => {
  return (
    <aside className="w-72 bg-[#111614] flex flex-col shadow-xl z-20 hidden md:flex border-r border-[#2A3A31] relative overflow-hidden">
      <div className="p-8 relative z-10">
        <div className="flex items-center gap-3.5 mb-10">
          <div className="w-11 h-11 bg-white border border-[#2A3A31] rounded-2xl flex items-center justify-center p-1.5 shadow-xs shrink-0 overflow-hidden">
            <img 
              src="/uph-logo-oficial.jpg" 
              alt="Logo UPH" 
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback caso a imagem não carregue
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <h1 className="text-[#EDEDE8] font-serif font-bold text-lg tracking-wide leading-tight">UPH 3ª IPBV</h1>
            <p className="text-[10px] uppercase tracking-wider text-[#8A968F] font-semibold">Gestão & Eleições</p>
          </div>
        </div>
        
        <nav className="space-y-1.5">
          {navItems.map(item => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer overflow-hidden relative group ${
                  isActive
                  ? 'text-[#FAF8F5] font-semibold bg-[#18221D] border border-[#2A3A31] shadow-2xs' 
                  : 'text-[#8A968F] hover:text-[#EDEDE8] hover:bg-[#18221D]/50'
                }`}
              >
                <item.icon className={`w-4 h-4 relative z-10 transition-transform duration-200 ${isActive ? 'text-[#C8A96E] scale-105' : 'text-[#8A968F] group-hover:scale-105'}`} />
                <span className="text-xs relative z-10 font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
      
      <div className="mt-auto p-8 relative z-10">
        <div className="bg-[#18221D] p-3.5 rounded-xl border border-[#2A3A31] mb-3">
          <p className="text-[9px] text-[#8A968F] uppercase font-semibold tracking-wider mb-0.5">Operador Atual</p>
          <p className="text-sm text-[#EDEDE8] font-medium truncate">{user?.name || 'Administrador'}</p>
        </div>
        <button 
          onClick={onLogout}
          aria-label="Finalizar Sessão"
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-rose-300 hover:text-white hover:bg-rose-950/60 rounded-xl transition-all cursor-pointer text-xs font-semibold border border-rose-900/40"
        >
          <LogOut className="w-4 h-4" /> Finalizar Sessão
        </button>
      </div>
    </aside>
  );
};
