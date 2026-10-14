import React, { useState, useRef } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Upload, 
  Plus, 
  Trash2, 
  FileSpreadsheet, 
  Filter, 
  AlertCircle,
  X,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { TreasuryTransaction } from '../types';

interface TreasuryViewProps {
  transactions: TreasuryTransaction[];
  addTransaction: (tx: Omit<TreasuryTransaction, 'id' | 'createdAt'>) => Promise<string | undefined>;
  addTransactionsBatch: (txList: Omit<TreasuryTransaction, 'id' | 'createdAt'>[]) => Promise<void>;
  removeTransaction: (id: string) => Promise<void>;
}

export const TreasuryView: React.FC<TreasuryViewProps> = ({
  transactions,
  addTransaction,
  addTransactionsBatch,
  removeTransaction,
}) => {
  // Filters
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // New Manual Transaction Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newType, setNewType] = useState<'income' | 'expense'>('income');
  const [newCategory, setNewCategory] = useState('Dízimo / Oferta');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculations
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const balance = totalIncome - totalExpense;

  const categories = Array.from(new Set(transactions.map(t => t.category).filter(Boolean)));

  const filteredTransactions = transactions.filter(t => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    return true;
  });

  // Handle Manual Transaction Create
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(newAmount.replace(',', '.'));
    if (!newDesc.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Preencha a descrição e um valor válido.');
      return;
    }

    try {
      await addTransaction({
        description: newDesc.trim(),
        amount: parsedAmount,
        type: newType,
        category: newCategory.trim() || 'Geral',
        date: new Date(newDate).getTime(),
      });
      setShowAddModal(false);
      setNewDesc('');
      setNewAmount('');
    } catch (err) {
      console.error(err);
      alert('Erro ao cadastrar transação.');
    }
  };

  // Handle Excel Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json<any>(ws);

        if (!rawData || rawData.length === 0) {
          alert('A planilha importada está vazia.');
          return;
        }

        const newItems: Omit<TreasuryTransaction, 'id' | 'createdAt'>[] = [];

        for (const row of rawData) {
          // Normalize column headers
          const desc = row['Descrição'] || row['Descricao'] || row['Historico'] || row['Histórico'] || row['Description'] || '';
          let val = row['Valor'] || row['Valor (R$)'] || row['Amount'] || row['Quantia'] || 0;
          let cat = row['Categoria'] || row['Category'] || row['Tipo'] || 'Planilha Importada';
          let tipo: 'income' | 'expense' = 'income';

          if (typeof val === 'string') {
            val = parseFloat(val.replace('R$', '').replace(/\./g, '').replace(',', '.').trim());
          }

          if (isNaN(val) || val === 0) continue;

          // Check if value is negative (represents expense)
          if (val < 0) {
            tipo = 'expense';
            val = Math.abs(val);
          } else if (
            String(row['Tipo'] || '').toLowerCase().includes('desp') || 
            String(row['Tipo'] || '').toLowerCase().includes('saída') ||
            String(row['Tipo'] || '').toLowerCase().includes('saida')
          ) {
            tipo = 'expense';
          }

          let dateVal = Date.now();
          if (row['Data'] || row['Date']) {
            const rawD = new Date(row['Data'] || row['Date']);
            if (!isNaN(rawD.getTime())) {
              dateVal = rawD.getTime();
            }
          }

          newItems.push({
            description: String(desc || 'Lançamento sem descrição').slice(0, 200),
            amount: Number(val),
            type: tipo,
            category: String(cat).slice(0, 100),
            date: dateVal,
            sheetName: file.name.slice(0, 100),
          });
        }

        if (newItems.length > 0) {
          await addTransactionsBatch(newItems);
          alert(`${newItems.length} transações importadas da planilha "${file.name}" com sucesso!`);
        } else {
          alert('Não foram encontradas linhas válidas de transação na planilha.');
        }
      } catch (err) {
        console.error('Erro ao ler arquivo Excel:', err);
        alert('Falha ao processar arquivo .xlsx. Verifique as colunas (Data, Descrição, Valor).');
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-8 relative">
      {/* Header & Main Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-900 tracking-tight">Tesouraria & Finanças UPH</h2>
          <p className="text-slate-500 text-sm">Controle e lançamento de receitas e despesas.</p>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer border border-slate-200"
            title="Importar planilha de finanças (.xlsx)"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Importar Planilha</span>
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-uph-green hover:bg-uph-green-hover text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Total Receitas</span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">
            R$ {totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-1">Dízimos, ofertas e doações</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Total Despesas</span>
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">
            R$ {totalExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-1">Custos, eventos e investimentos</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Saldo em Caixa</span>
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-3xl font-black tracking-tight ${balance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-400 mt-1">Patrimônio financeiro disponível</p>
        </div>
      </div>

      {/* Tabela de Lançamentos */}
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-slate-400" />
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Histórico de Lançamentos</h3>
                <span className="text-xs font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {filteredTransactions.length}
                </span>
              </div>

              {/* Filtros */}
              <div className="flex items-center gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                >
                  <option value="all">Todos os Tipos</option>
                  <option value="income">Apenas Receitas</option>
                  <option value="expense">Apenas Despesas</option>
                </select>

                {categories.length > 0 && (
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 max-w-[150px]"
                  >
                    <option value="all">Todas Categorias</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                <FileSpreadsheet className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-400">Nenhum lançamento encontrado no filtro selecionado.</p>
                <p className="text-xs text-slate-400 mt-1">Clique em "Novo Lançamento" ou importe uma planilha .xlsx</p>
              </div>
            ) : (
              <div className="max-h-[550px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredTransactions.map(tx => (
                  <div 
                    key={tx.id} 
                    className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 overflow-hidden mr-2">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        tx.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {tx.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-slate-800 text-sm truncate">{tx.description}</p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {new Date(tx.date).toLocaleDateString('pt-BR')} • {tx.category} {tx.sheetName ? `• ${tx.sheetName}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`font-black text-sm ${
                        tx.type === 'income' ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'} R$ {Number(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <button
                        onClick={() => removeTransaction(tx.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Remover Lançamento"
                        aria-label="Remover Lançamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      {/* Modal de Criação Manual de Lançamento */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Novo Lançamento Financeiro</h3>
            <form onSubmit={handleSaveTransaction} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tipo</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('income')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      newType === 'income' 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Receita (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('expense')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      newType === 'expense' 
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm' 
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Despesa (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Ex: Oferta de Missões, Café com Homens..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Valor (R$)</label>
                  <input
                    type="text"
                    required
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Categoria</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Ex: Dízimo / Oferta, Alimentação, Material..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-uph-green hover:bg-uph-green-hover text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-emerald-950/20 cursor-pointer"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreasuryView;
