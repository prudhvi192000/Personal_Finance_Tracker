import { Transaction } from '../types';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';

interface SummaryProps {
  transactions: Transaction[];
}

export function Summary({ transactions }: SummaryProps) {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm mb-1">Total Income</p>
            <p className="text-3xl text-green-600">${totalIncome.toFixed(2)}</p>
          </div>
          <TrendingUp className="text-green-500 w-10 h-10" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm mb-1">Total Expenses</p>
            <p className="text-3xl text-red-600">${totalExpenses.toFixed(2)}</p>
          </div>
          <TrendingDown className="text-red-500 w-10 h-10" />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm mb-1">Balance</p>
            <p className={`text-3xl ${balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ${balance.toFixed(2)}
            </p>
          </div>
          <Wallet className="text-blue-500 w-10 h-10" />
        </div>
      </div>
    </div>
  );
}
