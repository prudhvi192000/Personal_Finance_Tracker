import { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface CategoryChartProps {
  transactions: Transaction[];
}

const EXPENSE_COLORS = ['#ef4444', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316', '#64748b'];
const INCOME_COLORS = ['#10b981', '#3b82f6', '#14b8a6', '#22c55e', '#0ea5e9', '#a855f7', '#eab308', '#0d9488'];

type Mode = 'expense' | 'income';

export function CategoryChart({ transactions }: CategoryChartProps) {
  const [mode, setMode] = useState<Mode>('expense');

  const data = useMemo(() => {
    const filtered = transactions.filter((t) => t.type === mode);
    const grouped = filtered.reduce((acc, t) => {
      const existing = acc.find((item) => item.name === t.category);
      if (existing) existing.value += t.amount;
      else acc.push({ name: t.category, value: t.amount });
      return acc;
    }, [] as { name: string; value: number }[]);
    return grouped.sort((a, b) => b.value - a.value);
  }, [transactions, mode]);

  const total = useMemo(
    () => data.reduce((sum, d) => sum + d.value, 0),
    [data]
  );

  const colors = mode === 'expense' ? EXPENSE_COLORS : INCOME_COLORS;
  const titleVerb = mode === 'expense' ? 'Expenses' : 'Income';

  return (
    <div className="bg-white rounded-lg shadow-sm p-6" data-testid="category-chart">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="text-2xl">{titleVerb} by Category</h2>
        <div
          className="inline-flex bg-gray-100 rounded-lg p-1"
          role="tablist"
          data-testid="chart-mode-toggle"
        >
          <button
            onClick={() => setMode('expense')}
            role="tab"
            aria-selected={mode === 'expense'}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition ${
              mode === 'expense'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            data-testid="chart-mode-expense"
          >
            <TrendingDown className="w-4 h-4" />
            Expenses
          </button>
          <button
            onClick={() => setMode('income')}
            role="tab"
            aria-selected={mode === 'income'}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition ${
              mode === 'income'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
            data-testid="chart-mode-income"
          >
            <TrendingUp className="w-4 h-4" />
            Income
          </button>
        </div>
      </div>

      {data.length === 0 ? (
        <div
          className="text-center py-12 text-gray-500"
          data-testid="chart-empty-state"
        >
          No {mode} data available
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.name}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <p
            className="text-center text-sm text-gray-500 mt-2"
            data-testid="chart-total"
          >
            Total {mode === 'expense' ? 'expenses' : 'income'}: $
            {total.toFixed(2)} across {data.length}{' '}
            {data.length === 1 ? 'category' : 'categories'}
          </p>
        </>
      )}
    </div>
  );
}
