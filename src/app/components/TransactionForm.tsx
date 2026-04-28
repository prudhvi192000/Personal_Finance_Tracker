import { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { format } from 'date-fns';
import { X, Clock } from 'lucide-react';
import { TimeCardCalculator } from './TimeCardCalculator';

interface TransactionFormProps {
  onSubmit: (transaction: Omit<Transaction, 'id'>) => void;
  editingTransaction: Transaction | null;
  onCancelEdit: () => void;
  onAddIncome?: (transaction: Omit<Transaction, 'id'>) => void;
}

export function TransactionForm({ onSubmit, editingTransaction, onCancelEdit, onAddIncome }: TransactionFormProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [showTimeCard, setShowTimeCard] = useState(false);

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      setDescription(editingTransaction.description);
      setDate(editingTransaction.date);
    }
  }, [editingTransaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !category || !description) return;

    onSubmit({
      type,
      amount: parseFloat(amount),
      category,
      description,
      date,
    });

    if (!editingTransaction) {
      setAmount('');
      setCategory('');
      setDescription('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
    }
  };

  const handleCancel = () => {
    onCancelEdit();
    setType('expense');
    setAmount('');
    setCategory('');
    setDescription('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const commonCategories = {
    income: ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'],
    expense: ['Rent', 'Groceries', 'Transportation', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Other']
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl">{editingTransaction ? 'Edit' : 'Add'} Transaction</h2>
        {editingTransaction && (
          <button
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-2 text-gray-700">Type</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2 px-4 rounded-lg transition ${
                type === 'expense'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2 px-4 rounded-lg transition ${
                type === 'income'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Income
            </button>
          </div>
        </div>

        {type === 'income' && !editingTransaction && (
          <button
            type="button"
            onClick={() => setShowTimeCard(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border-2 border-dashed border-emerald-400 text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100 transition"
            data-testid="open-timecard-btn"
          >
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              Time Card Pay Calculator
            </span>
          </button>
        )}

        <div>
          <label className="block text-sm mb-2 text-gray-700">Amount ($)</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-2 text-gray-700">Category</label>
          <input
            type="text"
            list="categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Select or type category"
            required
          />
          <datalist id="categories">
            {commonCategories[type].map(cat => (
              <option key={cat} value={cat} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm mb-2 text-gray-700">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brief description"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-2 text-gray-700">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className={`flex-1 py-2 px-4 rounded-lg text-white transition ${
              type === 'income'
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {editingTransaction ? 'Update' : 'Add'} {type === 'income' ? 'Income' : 'Expense'}
          </button>
          {editingTransaction && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <TimeCardCalculator
        isOpen={showTimeCard}
        onClose={() => setShowTimeCard(false)}
        onAddIncome={(tx) => {
          if (onAddIncome) {
            onAddIncome(tx);
          } else {
            onSubmit(tx);
          }
        }}
      />
    </div>
  );
}
