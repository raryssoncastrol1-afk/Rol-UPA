import React from 'react';
import { ClipboardCheck, LogOut, LucideIcon } from 'lucide-react';
import { User } from 'firebase/auth';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: any) => void;
  navItems: { id: string; label: string; icon: LucideIcon }[];
  user: User | null;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, navItems, user, onLogout }) => {
  return (
    <aside className="w-72 bg-[#050505] flex flex-col shadow-2xl z-20 hidden md:flex border-r border-slate-800/60 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 left-0 w-full h-64 bg-indigo-500/10 blur-[80px]" />
      
      <div className="p-8 relative z-10">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center shadow-lg shadow-indigo-600/20 relative">
            <div className="absolute inset-0 bg-indigo-400 blur-md opacity-30 rounded-[1.25rem]" />
            <ClipboardCheck className="w-6 h-6 text-white relative z-10" />
          </div>
          <h1 className="text-white font-display font-bold text-2xl tracking-tight">UPH Rol</h1>
        </div>
        
        <nav className="space-y-3">
          {navItems.map(item => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer overflow-hidden relative group ${
                  isActive
                  ? 'text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                {isActive && <div className="absolute inset-0 bg-indigo-600 rounded-xl" />}
                {isActive && <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl" />}
                <item.icon className={`w-5 h-5 relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                <span className={`text-sm font-medium relative z-10 ${isActive ? 'font-semibold' : ''}`}>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
      
      <div className="mt-auto p-8 relative z-10">
        <div className="bg-slate-800/40 backdrop-blur-md p-5 rounded-2xl border border-slate-700/50 mb-4 transition-colors group/operador hover:bg-slate-800/60 flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[10px] text-slate-500 uppercase font-mono tracking-widest mb-1.5">Operador Atual</p>
            <p className="text-sm text-slate-200 font-medium truncate">{user?.displayName || 'Usuário'}</p>
          </div>
          <button 
            onClick={onLogout}
            className="p-2 text-slate-500 hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-700/50"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 text-rose-400 hover:text-white hover:bg-rose-500 rounded-xl transition-all cursor-pointer text-sm font-bold border border-transparent hover:border-rose-400/50 shadow-sm"
        >
          <LogOut className="w-4 h-4" /> Finalizar Sessão
        </button>
      </div>
    </aside>
  );
};
