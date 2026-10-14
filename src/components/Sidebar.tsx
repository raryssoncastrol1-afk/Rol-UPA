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
    <aside className="w-72 bg-[#050505] flex flex-col shadow-2xl z-20 hidden md:flex border-r border-slate-800/60 relative overflow-hidden">
      <div className="p-8 relative z-10">
        <div className="flex items-center gap-3.5 mb-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-600/20 shrink-0">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-white font-bold text-xl tracking-tight">UPH Rol</h1>
        </div>
        
        <nav className="space-y-2">
          {navItems.map(item => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 cursor-pointer overflow-hidden relative group ${
                  isActive
                  ? 'text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {isActive && <div className="absolute inset-0 bg-indigo-600 rounded-xl" />}
                <item.icon className={`w-4 h-4 relative z-10 transition-transform duration-200 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`} />
                <span className={`text-xs font-semibold relative z-10`}>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
      
      <div className="mt-auto p-8 relative z-10">
        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 mb-3">
          <p className="text-[10px] text-slate-500 uppercase font-mono tracking-widest mb-1">Operador Atual</p>
          <p className="text-sm text-slate-200 font-medium truncate">{user?.name || 'Administrador'}</p>
        </div>
        <button 
          onClick={onLogout}
          aria-label="Finalizar Sessão"
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 text-rose-400 hover:text-white hover:bg-rose-600 rounded-xl transition-all cursor-pointer text-xs font-bold border border-rose-500/20 hover:border-transparent shadow-sm"
        >
          <LogOut className="w-4 h-4" /> Finalizar Sessão
        </button>
      </div>
    </aside>
  );
};
