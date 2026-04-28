import { useState, useMemo, useEffect } from 'react';
import { TransactionList } from './components/TransactionList';
import { TransactionForm } from './components/TransactionForm';
import { Summary } from './components/Summary';
import { CategoryChart } from './components/CategoryChart';
import { Transaction } from './types';
import {
  fetchTransactions,
  seedTransactions,
  createTransaction,
  updateTransactionApi,
  deleteTransactionApi,
} from './api';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let list = await fetchTransactions();
        if (list.length === 0) {
          // First-time bootstrap with sample data
          list = await seedTransactions();
        }
        if (!cancelled) setTransactions(list);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : 'Failed to load transactions'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const created = await createTransaction(transaction);
      setTransactions((prev) => [created, ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add transaction');
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      const patch: Partial<Omit<Transaction, 'id'>> = { ...updates };
      delete (patch as Partial<Transaction>).id;
      const updated = await updateTransactionApi(id, patch);
      setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));
      setEditingTransaction(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update transaction');
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await deleteTransactionApi(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete transaction');
    }
  };

  const categories = useMemo(() => {
    const cats = new Set(transactions.map((t) => t.category));
    return Array.from(cats).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (filterCategory === 'all') return transactions;
    return transactions.filter((t) => t.category === filterCategory);
  }, [transactions, filterCategory]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="text-center">
          <h1 className="text-4xl mb-2">Personal Finance Tracker</h1>
          <p className="text-gray-600">Track your income and expenses</p>
        </header>

        {error && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3"
            data-testid="global-error-banner"
          >
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Something went wrong</p>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-700 hover:text-red-900 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div
            className="flex items-center justify-center py-24 text-gray-500"
            data-testid="loading-indicator"
          >
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading your transactions…
          </div>
        ) : (
          <>
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
                      data-testid="filter-category-select"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
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
                  onSubmit={
                    editingTransaction
                      ? (data) => updateTransaction(editingTransaction.id, data)
                      : addTransaction
                  }
                  editingTransaction={editingTransaction}
                  onCancelEdit={() => setEditingTransaction(null)}
                  onAddIncome={addTransaction}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
