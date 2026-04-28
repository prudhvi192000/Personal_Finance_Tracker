import { Transaction } from './types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;
const API = `${BACKEND_URL}/api`;

async function handle<T>(resp: Response): Promise<T> {
  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`API error ${resp.status}: ${text}`);
  }
  if (resp.status === 204) return undefined as T;
  return (await resp.json()) as T;
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const r = await fetch(`${API}/transactions`);
  return handle<Transaction[]>(r);
}

export async function seedTransactions(): Promise<Transaction[]> {
  const r = await fetch(`${API}/transactions/seed`, { method: 'POST' });
  return handle<Transaction[]>(r);
}

export async function createTransaction(
  tx: Omit<Transaction, 'id'>
): Promise<Transaction> {
  const r = await fetch(`${API}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tx),
  });
  return handle<Transaction>(r);
}

export async function updateTransactionApi(
  id: string,
  updates: Partial<Omit<Transaction, 'id'>>
): Promise<Transaction> {
  const r = await fetch(`${API}/transactions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return handle<Transaction>(r);
}

export async function deleteTransactionApi(id: string): Promise<void> {
  const r = await fetch(`${API}/transactions/${id}`, { method: 'DELETE' });
  await handle<void>(r);
}
