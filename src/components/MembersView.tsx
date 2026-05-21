import React, { useState } from 'react';
import { UserPlus, Plus, Trash2, Users, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { Member } from '../types';

interface MembersViewProps {
  members: Member[];
  addMember: (name: string, cargo: string, uphEntryDate?: string) => Promise<string | undefined>;
  removeMember: (id: string) => Promise<void>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<void>;
  onSelectMember: (member: Member) => void;
}

export const MembersView: React.FC<MembersViewProps> = ({ 
  members, 
  addMember, 
  removeMember, 
  updateMember,
  onSelectMember 
}) => {
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberCargo, setNewMemberCargo] = useState('');
  const [newMemberEntryDate, setNewMemberEntryDate] = useState('');
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  const handleAdd = () => {
    const trimmedName = newMemberName.trim();
    const trimmedCargo = newMemberCargo.trim();
    if (trimmedName) {
      addMember(trimmedName, trimmedCargo, newMemberEntryDate);
      setNewMemberName('');
      setNewMemberCargo('');
      setNewMemberEntryDate('');
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xl p-6 md:p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
            <UserPlus className="w-4 h-4" />
          </div>
          <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">Adicionar Novo Integrante</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Nome Completo</label>
            <input 
              type="text" 
              placeholder="Ex: Adriana Santos Silva"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Cargo / Função</label>
            <input 
              type="text" 
              placeholder="Ex: Professor"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
              value={newMemberCargo}
              onChange={(e) => setNewMemberCargo(e.target.value)}
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1.5 ml-1">Entrada na UPH</label>
            <input 
              type="date" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium"
              value={newMemberEntryDate}
              onChange={(e) => setNewMemberEntryDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <button 
              onClick={handleAdd}
              className="w-full bg-indigo-600 text-white h-[48px] rounded-2xl font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Cadastrar
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col">
        <div className="bg-slate-50/50 border-b border-slate-100 grid grid-cols-12 px-6 md:px-8 py-4 text-[11px] font-black uppercase text-slate-400 tracking-tighter">
          <div className="col-span-6 md:col-span-5">Nome do Membro</div>
          <div className="hidden md:block col-span-3">Cargo</div>
          <div className="col-span-3 md:col-span-2">PIN / Senha</div>
          <div className="col-span-3 md:col-span-2 text-right">Ação</div>
        </div>
        
        <div className="divide-y divide-slate-50">
          {members.length === 0 ? (
            <div className="p-16 text-center text-slate-400 font-medium italic">
              Nenhum membro cadastrado até o momento.
            </div>
          ) : (
            members.map((member, idx) => (
              <div 
                key={member.id} 
                onClick={() => onSelectMember(member)}
                className={`grid grid-cols-12 px-6 md:px-8 py-4 items-center transition-colors hover:bg-slate-100 cursor-pointer group/row ${idx % 2 === 1 ? 'bg-slate-50/20' : ''}`}
              >
                <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-[10px] shadow-sm group-hover/row:scale-110 transition-transform ${
                    idx % 4 === 0 ? 'bg-indigo-100 text-indigo-700' :
                    idx % 4 === 1 ? 'bg-orange-100 text-orange-700' :
                    idx % 4 === 2 ? 'bg-emerald-100 text-emerald-700' :
                    'bg-sky-100 text-sky-700'
                  }`}>
                    {member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-bold text-slate-700 text-sm md:text-base leading-tight group-hover/row:text-indigo-600 transition-colors truncate">{member.name}</span>
                    <span className="md:hidden text-[10px] text-slate-400 font-medium">{member.cargo || 'Membro'}</span>
                  </div>
                </div>
                <div className="hidden md:block col-span-3 text-sm text-slate-500 font-medium truncate pr-2">{member.cargo || 'Membro'}</div>
                <div className="col-span-3 md:col-span-2 flex items-center gap-2">
                  {member.pinCode ? (
                    <div className="flex items-center gap-1.5 group/pin">
                      <span className="font-mono text-sm bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md border border-indigo-100 font-bold tracking-widest">{member.pinCode}</span>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm(`Gerar um novo PIN único para ${member.name}?`)) {
                            const existingPins = new Set(members.map(m => m.pinCode).filter(Boolean));
                            let newPin = '';
                            let isUnique = false;
                            let attempts = 0;
                            while (!isUnique && attempts < 1000) {
                              newPin = Math.floor(1000 + Math.random() * 9000).toString();
                              if (!existingPins.has(newPin)) {
                                isUnique = true;
                              }
                              attempts++;
                            }
                            await updateMember(member.id, { pinCode: newPin });
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition-colors cursor-pointer opacity-0 group-hover/pin:opacity-100 focus:opacity-100"
                        title="Regenerar PIN Único"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm(`Gerar um novo PIN único para ${member.name}?`)) {
                          const existingPins = new Set(members.map(m => m.pinCode).filter(Boolean));
                          let newPin = '';
                          let isUnique = false;
                          let attempts = 0;
                          while (!isUnique && attempts < 1000) {
                            newPin = Math.floor(1000 + Math.random() * 9000).toString();
                            if (!existingPins.has(newPin)) {
                              isUnique = true;
                            }
                            attempts++;
                          }
                          await updateMember(member.id, { pinCode: newPin });
                        }
                      }}
                      className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Gerar PIN
                    </button>
                  )}
                </div>
                <div className="col-span-3 md:col-span-2 flex justify-end">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMemberToDelete(member.id);
                    }}
                    className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer active:scale-95 relative z-10"
                  >
                    <Trash2 className="w-5 h-5 shrink-0 pointer-events-none" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 px-6 md:p-6 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-400 bg-slate-50/30 uppercase tracking-[0.1em]">
          <span>Exibindo {members.length} membros registrados</span>
          <Users className="w-4 h-4 opacity-30" />
        </div>
      </div>

      {memberToDelete && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Remover Membro</h3>
            <p className="text-slate-600 mb-6">
              ATENÇÃO: Este membro será excluído do sistema. Tem certeza que deseja continuar?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setMemberToDelete(null)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={async () => {
                  try {
                    await removeMember(memberToDelete);
                    setMemberToDelete(null);
                  } catch (error) {
                    console.error(error);
                    alert('Erro ao excluir membro.');
                  }
                }}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
