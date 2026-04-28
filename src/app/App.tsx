import { useState, useMemo } from 'react';
import { TransactionList } from './components/TransactionList';
import { TransactionForm } from './components/TransactionForm';
import { Summary } from './components/Summary';
import { CategoryChart } from './components/CategoryChart';
import { Transaction } from './types';
import { format } from 'date-fns';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: '1', type: 'income', amount: 3500, category: 'Salary', description: 'Monthly salary', date: '2026-04-01' },
    { id: '2', type: 'expense', amount: 1200, category: 'Rent', description: 'April rent', date: '2026-04-01' },
    { id: '3', type: 'expense', amount: 85, category: 'Groceries', description: 'Weekly groceries', date: '2026-04-05' },
    { id: '4', type: 'expense', amount: 45, category: 'Transportation', description: 'Gas', date: '2026-04-07' },
    { id: '5', type: 'income', amount: 200, category: 'Freelance', description: 'Side project', date: '2026-04-10' },
  ]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    setTransactions([newTransaction, ...transactions]);
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions(transactions.map(t => t.id === id ? { ...t, ...updates } : t));
    setEditingTransaction(null);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const categories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category));
    return Array.from(cats).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (filterCategory === 'all') return transactions;
    return transactions.filter(t => t.category === filterCategory);
  }, [transactions, filterCategory]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="text-center">
          <h1 className="text-4xl mb-2">Personal Finance Tracker</h1>
          <p className="text-gray-600">Track your income and expenses</p>
        </header>

        <Summary transactions={transactions} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <CategoryChart transactions={transactions} />

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl">Transactions</h2>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <TransactionList
                transactions={filteredTransactions}
                onEdit={setEditingTransaction}
                onDelete={deleteTransaction}
              />
            </div>
          </div>

          <div className="lg:col-span-1">
            <TransactionForm
              onSubmit={editingTransaction
                ? (data) => updateTransaction(editingTransaction.id, data)
                : addTransaction
              }
              editingTransaction={editingTransaction}
              onCancelEdit={() => setEditingTransaction(null)}
              onAddIncome={addTransaction}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
