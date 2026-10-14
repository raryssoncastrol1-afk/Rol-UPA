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
    <aside className="w-72 bg-[#0c2415] flex flex-col shadow-xl z-20 hidden md:flex border-r border-[#194629] relative overflow-hidden">
      <div className="p-8 relative z-10">
        <div className="flex items-center gap-3.5 mb-10">
          <div className="w-10 h-10 bg-[#072b14] border border-[#235334] rounded-xl flex items-center justify-center text-[#c59b27] shadow-sm shrink-0">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight leading-tight">UPH 3ª IPBV</h1>
            <p className="text-[11px] text-[#86a892] font-medium">Gestão & Eleições</p>
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
                  ? 'text-white font-bold bg-[#174627] border border-[#2d7343] shadow-xs' 
                  : 'text-[#86a892] hover:text-white hover:bg-[#12361f]'
                }`}
              >
                <item.icon className={`w-4 h-4 relative z-10 transition-transform duration-200 ${isActive ? 'text-[#c59b27] scale-105' : 'text-[#86a892] group-hover:scale-105'}`} />
                <span className={`text-xs relative z-10`}>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
      
      <div className="mt-auto p-8 relative z-10">
        <div className="bg-[#072b14] p-3.5 rounded-xl border border-[#1e4e2e] mb-3">
          <p className="text-[10px] text-[#86a892] uppercase font-semibold tracking-wider mb-0.5">Operador Atual</p>
          <p className="text-sm text-white font-medium truncate">{user?.name || 'Administrador'}</p>
        </div>
        <button 
          onClick={onLogout}
          aria-label="Finalizar Sessão"
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-rose-300 hover:text-white hover:bg-rose-900/60 rounded-xl transition-all cursor-pointer text-xs font-semibold border border-rose-900/40"
        >
          <LogOut className="w-4 h-4" /> Finalizar Sessão
        </button>
      </div>
    </aside>
  );
};
