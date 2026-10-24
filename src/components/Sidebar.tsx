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
    <aside className="w-72 bg-[#0B192C] flex flex-col shadow-xl z-20 hidden md:flex border-r border-[#1E3A5F] relative overflow-hidden">
      <div className="p-8 relative z-10">
        <div className="flex items-center gap-3.5 mb-10">
          <div className="w-12 h-12 bg-white border border-[#1E3A5F] rounded-2xl flex items-center justify-center p-1 shadow-xs shrink-0 overflow-hidden">
            <img src="/upa-logo-oficial.png" alt="UPA Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 
              className="text-[#EDEDE8] text-xl tracking-[0.04em] leading-tight"
              style={{ fontFamily: "'Jersey M54', sans-serif" }}
            >
              UPA 3ª IPBV
            </h1>
            <p className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-semibold">Gestão & Eleições</p>
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
                  ? 'text-[#FAF8F5] font-semibold bg-[#162A45] border border-[#2563EB]/40 shadow-2xs' 
                  : 'text-[#94A3B8] hover:text-[#EDEDE8] hover:bg-[#162A45]/50'
                }`}
              >
                <item.icon className={`w-4 h-4 relative z-10 transition-transform duration-200 ${isActive ? 'text-[#38BDF8] scale-105' : 'text-[#94A3B8] group-hover:scale-105'}`} />
                <span className="text-xs relative z-10 font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
      
      <div className="mt-auto p-8 relative z-10">
        <div 
          onClick={() => setActiveView('settings')}
          className="bg-[#162A45] p-3.5 rounded-xl border border-[#1E3A5F] mb-3 hover:border-[#38BDF8]/50 hover:bg-[#1C3558] transition-all cursor-pointer group"
          title="Abrir Configurações do Sistema"
        >
          <div className="flex items-center justify-between">
            <p className="text-[9px] text-[#94A3B8] uppercase font-semibold tracking-wider mb-0.5">Operador Atual</p>
            <span className="text-[10px] text-[#38BDF8] opacity-0 group-hover:opacity-100 transition-opacity font-medium">Ajustes →</span>
          </div>
          <p className="text-sm text-[#EDEDE8] font-medium truncate group-hover:text-[#FAF8F5]">{user?.name || 'Administrador'}</p>
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
