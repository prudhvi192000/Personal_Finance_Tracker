import { useEffect, useMemo, useRef, useState } from 'react';
import { Transaction } from '../types';
import { Calculator, X, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';

interface TimeCardCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  onAddIncome: (transaction: Omit<Transaction, 'id'>) => void;
}

interface DayEntry {
  label: string;
  shortLabel: string;
  start: string;
  end: string;
}

const DAY_LABELS: { label: string; shortLabel: string }[] = [
  { label: 'Monday', shortLabel: 'Mon' },
  { label: 'Tuesday', shortLabel: 'Tue' },
  { label: 'Wednesday', shortLabel: 'Wed' },
  { label: 'Thursday', shortLabel: 'Thu' },
  { label: 'Friday', shortLabel: 'Fri' },
  { label: 'Saturday', shortLabel: 'Sat' },
  { label: 'Sunday', shortLabel: 'Sun' },
];

const initialDays = (): DayEntry[] =>
  DAY_LABELS.map((d) => ({ ...d, start: '', end: '' }));

/**
 * Computes daily hours in decimal form.
 * - Returns { hours, error } where error is non-null if invalid.
 * - Overnight shifts auto-handled: if end < start, treat as next-day end.
 * - If only one of start/end provided, treat as 0 hours (no error).
 */
function computeDailyHours(
  start: string,
  end: string,
  maxShift: number
): { hours: number; error: string | null } {
  if (!start || !end) return { hours: 0, error: null };
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if (
    Number.isNaN(sh) || Number.isNaN(sm) ||
    Number.isNaN(eh) || Number.isNaN(em)
  ) {
    return { hours: 0, error: 'Invalid time format' };
  }
  const startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin <= startMin) endMin += 24 * 60; // overnight shift
  const diffHours = (endMin - startMin) / 60;
  if (diffHours > maxShift) {
    return {
      hours: 0,
      error: `Shift exceeds max of ${maxShift}h`,
    };
  }
  return { hours: Math.round(diffHours * 100) / 100, error: null };
}

export function TimeCardCalculator({
  isOpen,
  onClose,
  onAddIncome,
}: TimeCardCalculatorProps) {
  const [days, setDays] = useState<DayEntry[]>(initialDays());
  const [hourlyRate, setHourlyRate] = useState<string>('');
  const [maxShift, setMaxShift] = useState<string>('24');
  const [category, setCategory] = useState<string>('Salary');
  const [weekStart, setWeekStart] = useState<string>(
    format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  );
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const submitTimer = useRef<number | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setDays(initialDays());
      setHourlyRate('');
      setMaxShift('24');
      setCategory('Salary');
      setWeekStart(
        format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
      );
      setSubmitting(false);
      setSuccess(false);
    }
    return () => {
      if (submitTimer.current) {
        window.clearTimeout(submitTimer.current);
        submitTimer.current = null;
      }
    };
  }, [isOpen]);

  const maxShiftNum = useMemo(() => {
    const n = parseFloat(maxShift);
    return Number.isFinite(n) && n > 0 ? n : 24;
  }, [maxShift]);

  const dailyResults = useMemo(
    () => days.map((d) => computeDailyHours(d.start, d.end, maxShiftNum)),
    [days, maxShiftNum]
  );

  const totalHours = useMemo(
    () =>
      Math.round(
        dailyResults.reduce((sum, r) => sum + (r.error ? 0 : r.hours), 0) * 100
      ) / 100,
    [dailyResults]
  );

  const rate = useMemo(() => {
    const n = parseFloat(hourlyRate);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }, [hourlyRate]);

  const totalPay = useMemo(
    () => Math.round(totalHours * rate * 100) / 100,
    [totalHours, rate]
  );

  const hasErrors = dailyResults.some((r) => r.error);
  const canSubmit =
    !hasErrors && totalHours > 0 && rate > 0 && !submitting && category.trim();

  const dateRange = useMemo(() => {
    try {
      const start = new Date(weekStart + 'T00:00:00');
      const end = addDays(start, 6);
      return {
        startLabel: format(start, 'MMM d'),
        endLabel: format(end, 'MMM d, yyyy'),
        endIso: format(end, 'yyyy-MM-dd'),
      };
    } catch {
      return { startLabel: '', endLabel: '', endIso: weekStart };
    }
  }, [weekStart]);

  const updateDay = (idx: number, field: 'start' | 'end', value: string) => {
    setDays((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d))
    );
  };

  const handleAddAsIncome = () => {
    if (!canSubmit) return;
    setSubmitting(true);

    // Debounce / prevent duplicate submission
    submitTimer.current = window.setTimeout(() => {
      submitTimer.current = null;
    }, 1500);

    const description = `Weekly Pay (${dateRange.startLabel}–${dateRange.endLabel}) • ${totalHours}h @ $${rate.toFixed(2)}/h`;

    onAddIncome({
      type: 'income',
      amount: totalPay,
      category: category.trim(),
      description,
      date: dateRange.endIso,
    });

    setSuccess(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
      data-testid="timecard-modal-overlay"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        data-testid="timecard-modal"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Time Card Pay Calculator</h2>
              <p className="text-xs text-emerald-50">
                Log weekly hours and convert to income
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
            data-testid="timecard-close-btn"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Settings row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
                Week starting (Mon)
              </label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                data-testid="timecard-week-start"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
                Hourly Pay ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="15.50"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                data-testid="timecard-hourly-rate"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
                Max Shift (hrs)
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="24"
                value={maxShift}
                onChange={(e) => setMaxShift(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                data-testid="timecard-max-shift"
              />
            </div>
          </div>

          {/* Day rows */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 bg-gray-50 px-4 py-2 text-xs uppercase tracking-wide text-gray-500 font-medium">
              <div className="col-span-3">Day</div>
              <div className="col-span-3">Start</div>
              <div className="col-span-3">End</div>
              <div className="col-span-3 text-right">Hours</div>
            </div>
            {days.map((d, idx) => {
              const result = dailyResults[idx];
              return (
                <div
                  key={d.label}
                  className={`grid grid-cols-12 items-center px-4 py-3 border-t border-gray-100 ${
                    result.error ? 'bg-red-50' : 'hover:bg-gray-50'
                  }`}
                  data-testid={`timecard-day-row-${d.shortLabel.toLowerCase()}`}
                >
                  <div className="col-span-3">
                    <div className="font-medium text-gray-800">
                      {d.shortLabel}
                    </div>
                    <div className="text-xs text-gray-400 hidden sm:block">
                      {d.label}
                    </div>
                  </div>
                  <div className="col-span-3">
                    <input
                      type="time"
                      value={d.start}
                      onChange={(e) => updateDay(idx, 'start', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      data-testid={`timecard-start-${d.shortLabel.toLowerCase()}`}
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="time"
                      value={d.end}
                      onChange={(e) => updateDay(idx, 'end', e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      data-testid={`timecard-end-${d.shortLabel.toLowerCase()}`}
                    />
                  </div>
                  <div className="col-span-3 text-right">
                    {result.error ? (
                      <span
                        className="inline-flex items-center gap-1 text-red-600 text-xs"
                        data-testid={`timecard-error-${d.shortLabel.toLowerCase()}`}
                      >
                        <AlertCircle className="w-3 h-3" />
                        {result.error}
                      </span>
                    ) : (
                      <span
                        className="font-mono text-gray-800"
                        data-testid={`timecard-hours-${d.shortLabel.toLowerCase()}`}
                      >
                        {result.hours.toFixed(2)}h
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                Total Hours
              </p>
              <p
                className="text-3xl font-mono text-gray-800"
                data-testid="timecard-total-hours"
              >
                {totalHours.toFixed(2)}
              </p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
              <p className="text-xs uppercase tracking-wide text-emerald-700 mb-1">
                Total Pay
              </p>
              <p
                className="text-3xl font-mono text-emerald-700"
                data-testid="timecard-total-pay"
              >
                ${totalPay.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs uppercase tracking-wide text-gray-500 mb-1">
              Income Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Salary, Freelance, Gig Work"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              data-testid="timecard-category"
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {hasErrors
                ? 'Fix the errors above before submitting.'
                : totalHours === 0
                ? 'Enter at least one day with start and end times.'
                : rate <= 0
                ? 'Enter a valid hourly rate.'
                : `Will add $${totalPay.toFixed(2)} as income on ${dateRange.endLabel}.`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                data-testid="timecard-cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAsIncome}
                disabled={!canSubmit}
                className={`px-5 py-2 rounded-lg text-white font-medium transition flex items-center gap-2 ${
                  canSubmit
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
                data-testid="timecard-add-income-btn"
              >
                {success ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Added!
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4" />
                    Add as Income
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
